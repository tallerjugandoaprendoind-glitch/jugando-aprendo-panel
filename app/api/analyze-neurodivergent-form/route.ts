import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from '@/lib/supabase-admin'


// Helper: reintentar con backoff exponencial ante rate limit
async function callGeminiWithRetry(ai: any, model: string, contents: string, config: any = {}, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({ model, contents, config })
      return response
    } catch (err: any) {
      const is429 = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.status === 429
      if (is429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 2000 // 2s, 4s, 8s
        console.warn(`⚠️ Rate limit Gemini (intento ${attempt + 1}/${maxRetries}). Reintentando en ${delay/1000}s...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      if (is429) throw new Error('CUOTA_AGOTADA')
      throw err
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formType, formData, childName, childAge, diagnosis, sessionContext } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Falta GEMINI_API_KEY en variables de entorno' }, { status: 500 })

    const systemPrompt = `Eres un neuropsicólogo clínico especializado en neurodiversidad infantil con experiencia en TEA, TDAH, Síndrome de Down, discapacidad intelectual y otros perfiles neurodivergentes.

Tu rol es analizar formularios clínicos y proporcionar:
1. Un análisis clínico profesional y detallado
2. Indicadores de riesgo o alerta si los hay
3. Recomendaciones terapéuticas específicas
4. Un mensaje cálido y comprensible para los padres (sin jerga técnica)
5. Próximos formularios o evaluaciones recomendados

Responde SIEMPRE en español y en formato JSON con esta estructura exacta:
{
  "analisis_clinico": "análisis detallado para el terapeuta",
  "indicadores_clave": ["indicador1", "indicador2"],
  "nivel_alerta": "bajo|moderado|alto",
  "recomendaciones": ["recomendación1", "recomendación2"],
  "mensaje_padres": "mensaje cálido y esperanzador para los padres",
  "formularios_recomendados": ["formulario1", "formulario2"],
  "areas_fortaleza": ["fortaleza1", "fortaleza2"],
  "areas_trabajo": ["área1", "área2"]
}`

    const formTypeLabels: Record<string, string> = {
      'screening_tdah': 'Screening TDAH (Conners)',
      'screening_tea': 'Screening TEA (M-CHAT / CAST)',
      'conducta_casa': 'Cuestionario de Conducta en Casa',
      'anamnesis': 'Historia Clínica (Anamnesis)',
      'objetivo_iep': 'Objetivo IEP',
      'nota_sesion': 'Nota de Sesión',
      'informe_mensual': 'Informe Mensual',
      'registro_abc': 'Registro Conductual ABC',
      'sensorial': 'Perfil Sensorial',
      'habilidades_sociales': 'Evaluación Habilidades Sociales',
      'conducta_padres': 'Informe de Conducta (Padres)',
    }

    const fullPrompt = `${systemPrompt}

Formulario Clínico: ${formTypeLabels[formType] || formType}
Paciente: ${childName}, ${childAge} años${diagnosis ? `, Diagnóstico/Perfil: ${diagnosis}` : ''}
${sessionContext ? `Contexto: ${sessionContext}` : ''}

DATOS DEL FORMULARIO:
${JSON.stringify(formData, null, 2)}

Analiza este formulario y proporciona el análisis clínico completo incluyendo indicadores específicos del perfil neurodivergente. Responde SOLO con el JSON, sin texto adicional.`

    const ai = new GoogleGenAI({ apiKey })
    const response = await callGeminiWithRetry(ai, "gemini-2.0-flash", fullPrompt)

    const rawText = response.text || '{}'

    let parsedResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { analisis_clinico: rawText }
    } catch {
      parsedResult = { analisis_clinico: rawText, mensaje_padres: 'El análisis está disponible.' }
    }

    // Guardar análisis en DB si se provee formId
    if (body.formId) {
      await supabaseAdmin.from('form_ai_analyses').insert([{
        form_id: body.formId,
        form_type: formType,
        child_name: childName,
        analysis: parsedResult,
        created_at: new Date().toISOString(),
      }])
    }

    return NextResponse.json({ success: true, analysis: parsedResult })
  } catch (error: any) {
    console.error('Error analyze-neurodivergent-form:', error)
    const isQuota = error.message === 'CUOTA_AGOTADA' || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')
    return NextResponse.json({ 
      error: isQuota 
        ? 'Cuota de IA agotada. Por favor espera unos minutos e intenta nuevamente.' 
        : error.message 
    }, { status: isQuota ? 429 : 500 })
  }
}
