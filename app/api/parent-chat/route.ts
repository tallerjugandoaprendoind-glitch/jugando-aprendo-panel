import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// API CHAT PADRES - VERSIÓN GEMINI 2.5 FLASH (MEJORADO)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const { question, childId, childName } = await req.json()

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
      .select('*')
      .eq('id', childId)
      .single()

    // B. Historial (Leemos 20 para dar mejores estadísticas)
    const { data: sessions } = await supabase
      .from('registro_aba')
      .select('*')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(20)

    // C. Próximas citas
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('child_id', childId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })

    // 3. CONSTRUCCIÓN DEL PROMPT INTELIGENTE
    const contextParts = []

    // Contexto: Paciente
    if (child) {
      const age = calculateAge(child.birth_date)
      contextParts.push(`PACIENTE:
- Nombre: ${child.name}
- Edad: ${age} años
- Diagnóstico: ${child.diagnosis || 'En evaluación'}`)
    }

    // Contexto: Historial y Progreso
    if (sessions && sessions.length > 0) {
      const lastSession = sessions[0]
      const total = sessions.length
      // Calculamos éxito rápido para que la IA sepa si felicitar o animar
      const logrados = sessions.filter(s => 
        s.datos?.resultado_sesion?.toLowerCase().includes('logrado') || 
        s.datos?.resultado_sesion?.toLowerCase().includes('excelente')
      ).length

      contextParts.push(`HISTORIAL RECIENTE (Resumen):
- Sesiones analizadas: ${total}
- Objetivos logrados: ${logrados} de ${total}
- ÚLTIMA SESIÓN (${lastSession.fecha_sesion}):
  * Objetivo: ${lastSession.datos?.objetivo_sesion || 'General'}
  * Resultado: ${lastSession.datos?.resultado_sesion || 'No registrado'}
  * Conducta: ${lastSession.datos?.conducta || 'No registrada'}
  * Nota para casa: ${lastSession.datos?.legacy_home_task || 'Ninguna'}
      `)
    } else {
        contextParts.push("HISTORIAL: Aún no hay sesiones registradas.")
    }

    // Contexto: Citas
    if (appointments && appointments.length > 0) {
      const next = appointments[0]
      contextParts.push(`PRÓXIMA CITA AGENDADA: ${next.appointment_date} a las ${next.appointment_time}`)
    }

    const dataContext = contextParts.join('\n\n')

    // 4. INVOCAR GEMINI 2.5 FLASH
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Configuración específica para Gemini 2.0 Flash
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
    console.error('Error gemini-1.5-flash:', error)
    return NextResponse.json(
      { text: "Tuve un pequeño problema de conexión. Por favor, pregúntame de nuevo." },
      { status: 500 }
    )
  }
}

// Función auxiliar
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