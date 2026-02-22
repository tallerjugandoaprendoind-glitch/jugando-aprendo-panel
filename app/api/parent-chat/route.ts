import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { question, childId, childName } = await req.json()

    if (!question || !childId) {
      return NextResponse.json({ text: "Error: Faltan datos." }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ text: "Error de configuración: Falta la API Key de Gemini." }, { status: 500 })
    }

    const supabase = supabaseAdmin

    // ── Contexto clínico ──────────────────────────────────────────────────────
    const [
      { data: child },
      { data: sessions },
      { data: appointments },
    ] = await Promise.all([
      supabase.from('children').select('name, birth_date, diagnosis').eq('id', childId).single(),
      supabase.from('registro_aba').select('fecha_sesion, datos').eq('child_id', childId).order('fecha_sesion', { ascending: false }).limit(5),
      supabase.from('appointments').select('appointment_date, appointment_time').eq('child_id', childId).gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', { ascending: true }).limit(1),
    ])

    // ── Productos de la tienda ────────────────────────────────────────────────
    // Solo traer si la pregunta es sobre actividades, casa, materiales, ayuda
    const esConsultaActividades = /casa|actividad|ejercicio|material|juego|practicar|hacer|recurso|tip|consejo/i.test(question)

    let productosTexto = ''
    let productosData: any[] = []

    if (esConsultaActividades) {
      const { data: productos } = await supabase
        .from('store_products')
        .select('id, nombre, descripcion, precio_soles, tipo, categoria, imagen_url')
        .eq('activo', true)
        .gt('stock', 0)
        .order('destacado', { ascending: false })
        .limit(10)

      productosData = productos || []

      if (productosData.length > 0) {
        productosTexto = `\n\nPRODUCTOS DE NUESTRA TIENDA (puedes sugerir UNO si genuinamente ayuda):
${productosData.map((p, i) => `${i + 1}. ID:"${p.id}" | "${p.nombre}" | S/${p.precio_soles} | ${p.tipo}\n   ${p.descripcion || ''}`).join('\n')}

REGLA: Solo sugiere un producto si tiene conexión real con los consejos que das. Si no aplica ninguno, no menciones la tienda.`
      }
    }

    // ── Contexto del paciente ─────────────────────────────────────────────────
    let contextParts: string[] = []

    if (child) {
      const age = calculateAge(child.birth_date)
      contextParts.push(`PACIENTE: ${child.name}, ${age} años, ${child.diagnosis || 'En evaluación'}`)
    }

    if (sessions && sessions.length > 0) {
      const historyText = sessions.map((s: any) =>
        `  - ${s.fecha_sesion}: ${s.datos?.objetivo_sesion || 'N/A'} | ${s.datos?.resultado_sesion || 'N/A'}`
      ).join('\n')
      contextParts.push(`HISTORIAL RECIENTE:\n${historyText}`)
    } else {
      contextParts.push("HISTORIAL: Sin sesiones registradas aún.")
    }

    if (appointments && appointments.length > 0) {
      contextParts.push(`PRÓXIMA CITA: ${appointments[0].appointment_date} a las ${appointments[0].appointment_time}`)
    }

    contextParts.push(productosTexto)

    const dataContext = contextParts.join('\n\n')

    // ── Prompt ────────────────────────────────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey })

    const systemInstruction = `
ERES UN ASISTENTE CLÍNICO EXPERTO EN ABA del centro Jugando Aprendo (Pisco, Perú).

PERSONALIDAD: Empática, cálida y profesional. Como una terapeuta experta que apoya a los padres.
Usas emojis ocasionales (💙, ✨, 📋) para suavizar el tono.

REGLAS:
1. Responde basándote en el historial clínico proporcionado.
2. Si hay progreso, ¡celébralo!
3. Si hay dificultades, valida la emoción y ofrece perspectiva positiva.
4. Sé concisa. No escribas párrafos gigantes.
5. PRODUCTO: Si el contexto incluye productos de la tienda y la pregunta es sobre actividades/materiales:
   - Puedes sugerir UNO de forma natural al final de tu respuesta, en una línea separada.
   - Formato exacto si sugieres: [PRODUCTO_ID:el-id-exacto-aqui]
   - El mensaje al padre debe ser natural: "Por cierto, en nuestra tienda tenemos el Kit de fichas ABA que puede ayudarte..."
   - Si ningún producto aplica, NO menciones la tienda en absoluto.
`

    const prompt = `
CONTEXTO DEL PACIENTE:
${dataContext}

PREGUNTA DEL PADRE/MADRE:
"${question}"

Responde directamente. Si sugieres un producto, al FINAL pon [PRODUCTO_ID:el-id] en una línea aparte.
`

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { systemInstruction, temperature: 0.5 },
    })

    let fullText = response.text || "Lo siento, no pude generar una respuesta en este momento."

    // ── Extraer sugerencia de producto del texto ──────────────────────────────
    let producto_sugerido_info = null
    const productoMatch = fullText.match(/\[PRODUCTO_ID:([^\]]+)\]/)

    if (productoMatch && productosData.length > 0) {
      const productoId = productoMatch[1].trim()
      const prod = productosData.find((p: any) => p.id === productoId)
      if (prod) {
        producto_sugerido_info = {
          id: prod.id,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio_soles: prod.precio_soles,
          tipo: prod.tipo,
          imagen_url: prod.imagen_url,
        }
      }
      // Limpiar el marcador del texto visible
      fullText = fullText.replace(/\[PRODUCTO_ID:[^\]]+\]/g, '').trim()
    }

    return NextResponse.json({ text: fullText, producto_sugerido_info })

  } catch (error: any) {
    console.error('Error en Chat Padres:', error)
    return NextResponse.json(
      { text: "Tuve un pequeño problema de conexión. Por favor, pregúntame de nuevo." },
      { status: 500 }
    )
  }
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}
