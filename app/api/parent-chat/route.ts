import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// API CHAT PADRES - VERSIÓN GEMINI 1.5 FLASH (CORREGIDO)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const { question, childId } = await req.json()

    // 1. Validaciones
    if (!question || !childId) {
      return NextResponse.json(
        { text: "Error: No se identificó la pregunta o el paciente." },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { text: "Error de configuración: Falta la API Key de Gemini." },
        { status: 500 }
      )
    }

    // 2. CONTEXTO RICO (Supabase)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // A. Info del niño
    const { data: child } = await supabase
      .from('children')
      .select('name, birth_date, diagnosis')
      .eq('id', childId)
      .single()

    // B. Historial (Leemos 5 para dar contexto reciente sin saturar)
    const { data: sessions } = await supabase
      .from('registro_aba')
      .select('fecha_sesion, datos')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(5)

    // C. Próximas citas
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time')
      .eq('child_id', childId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .limit(1)

    // 3. CONSTRUCCIÓN DEL PROMPT INTELIGENTE
    let contextParts = []

    // Contexto: Paciente
    if (child) {
      const age = calculateAge(child.birth_date)
      contextParts.push(`PACIENTE:
- Nombre: ${child.name}
- Edad: ${age} años
- Diagnóstico: ${child.diagnosis || 'En evaluación'}`)
    }

    // Contexto: Historial Reciente
    if (sessions && sessions.length > 0) {
      const historyText = sessions.map((s: any) => `
      - Fecha: ${s.fecha_sesion}
        Objetivo: ${s.datos?.objetivo_sesion || 'N/A'}
        Resultado: ${s.datos?.resultado_sesion || 'N/A'}
        Conducta: ${s.datos?.conducta || 'N/A'}
      `).join('\n')
      
      contextParts.push(`HISTORIAL RECIENTE (Últimas 5 sesiones):\n${historyText}`)
    } else {
        contextParts.push("HISTORIAL: Aún no hay sesiones registradas.")
    }

    // Contexto: Próxima Cita
    if (appointments && appointments.length > 0) {
      const next = appointments[0]
      contextParts.push(`PRÓXIMA CITA: ${next.appointment_date} a las ${next.appointment_time}`)
    }

    const dataContext = contextParts.join('\n\n')

    // 4. INVOCAR GEMINI 1.5 FLASH
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Configuración del modelo
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        systemInstruction: `
        ERES UN ASISTENTE CLÍNICO EXPERTO EN ABA (Análisis Conductual Aplicado).
        
        TU PERSONALIDAD:
        - Empática, cálida y profesional.
        - Hablas como una terapeuta experta que apoya a los padres.
        - Usas emojis ocasionales (💙, ✨, 📋) para suavizar el tono.

        TUS REGLAS:
        1. Responde basándote EXCLUSIVAMENTE en los datos del historial proporcionado.
        2. Si hay progreso (objetivos logrados), ¡celébralo con entusiasmo!
        3. Si hay dificultades, valida la emoción del padre y ofrece perspectiva positiva.
        4. Si te piden consejos, da 1 o 2 tips prácticos y breves.
        5. Sé concisa. No escribas párrafos gigantes.
        `
    })

    const prompt = `
    CONTEXTO DEL PACIENTE:
    ${dataContext}

    PREGUNTA DEL PADRE/MADRE:
    "${question}"

    Responde directamente a la pregunta con el tono empático definido.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ text })

  } catch (error: any) {
    console.error('Error en Chat Padres:', error)
    return NextResponse.json(
      { text: "Tuve un pequeño problema de conexión. Por favor, pregúntame de nuevo." },
      { status: 500 }
    )
  }
}

// Función auxiliar para edad
function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}