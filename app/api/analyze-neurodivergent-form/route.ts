import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formType, formData, childName, childAge, diagnosis, sessionContext } = body

    const systemPrompt = `Eres un neuropsicólogo clínico especializado en neurodiversidad infantil con experiencia en TEA (Trastorno del Espectro Autista), TDAH (Trastorno por Déficit de Atención e Hiperactividad), Síndrome de Down, discapacidad intelectual y otros perfiles neurodivergentes.

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

    const userMessage = `
Formulario Clínico: ${formTypeLabels[formType] || formType}
Paciente: ${childName}, ${childAge} años${diagnosis ? `, Diagnóstico/Perfil: ${diagnosis}` : ''}
${sessionContext ? `Contexto: ${sessionContext}` : ''}

DATOS DEL FORMULARIO:
${JSON.stringify(formData, null, 2)}

Analiza este formulario y proporciona el análisis clínico completo incluyendo indicadores específicos del perfil neurodivergente.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) throw new Error('Error en API de IA')

    const aiData = await response.json()
    const rawText = aiData.content?.[0]?.text || '{}'
    
    let parsedResult
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { analisis_clinico: rawText }
    } catch {
      parsedResult = { analisis_clinico: rawText, mensaje_padres: 'El análisis está disponible.' }
    }

    // Save analysis to DB if form_id provided
    if (body.formId) {
      await supabaseAdmin.from('form_ai_analyses').insert([{
        form_id: body.formId,
        form_type: formType,
        child_name: childName,
        analysis: parsedResult,
        created_at: new Date().toISOString(),
      }]).then(() => {})
    }

    return NextResponse.json({ success: true, analysis: parsedResult })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
