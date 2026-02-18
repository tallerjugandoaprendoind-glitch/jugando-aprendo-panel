import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, formType, formTitle, responses, childId, parentId } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Falta API Key' }, { status: 500 })

    // Get child info
    const { data: child } = await supabaseAdmin
      .from('children')
      .select('name, birth_date, diagnosis, age')
      .eq('id', childId)
      .single()

    const childName = child?.name || 'Paciente'
    const childAge = child?.age || 'N/E'
    const diagnosis = child?.diagnosis || 'No especificado'

    // Format responses for AI
    const responsesText = Object.entries(responses)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : String(v)}`)
      .join('\n')

    const ai = new GoogleGenAI({ apiKey })

    const prompt = `
Eres un supervisor clínico especialista en neurodiversidad (TDAH, TEA, trastornos del desarrollo).

DATOS DEL FORMULARIO COMPLETADO POR LOS PADRES:
- Paciente: ${childName} (${childAge})
- Diagnóstico: ${diagnosis}
- Formulario: ${formTitle}
- Tipo: ${formType}

RESPUESTAS DE LOS PADRES:
${responsesText}

TAREA: Genera un análisis clínico profesional y completo de este formulario.

Responde SOLO con este JSON exacto:
{
  "resumen_ejecutivo": "Párrafo de 3-4 oraciones resumiendo el estado actual del paciente según este formulario",
  "analisis_clinico": "Análisis clínico detallado de 4-5 oraciones con terminología profesional",
  "areas_fortaleza": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "areas_trabajo": ["Área de trabajo 1", "Área de trabajo 2", "Área de trabajo 3"],
  "recomendaciones": ["Recomendación terapéutica 1", "Recomendación terapéutica 2", "Recomendación terapéutica 3", "Recomendación terapéutica 4"],
  "actividades_en_casa": ["Actividad práctica para hacer en casa 1", "Actividad práctica 2", "Actividad práctica 3"],
  "indicadores_clave": ["Indicador clave de progreso 1", "Indicador clave 2", "Indicador clave 3"],
  "nivel_alerta": "bajo|moderado|alto",
  "mensaje_padres": "Mensaje empático, cálido y alentador de 2-3 oraciones para los padres. En primera persona plural del equipo terapéutico. Destaca logros específicos y motiva la continuidad.",
  "proximo_paso": "Una acción concreta y específica que el equipo debe tomar en la próxima sesión"
}
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.3 }
    })

    const text = response.text || '{}'
    let analysis: any = {}
    try { analysis = JSON.parse(text) } catch { analysis = { resumen_ejecutivo: text } }

    // Save to parent_message_approvals queue (admin must approve before parent sees)
    await supabaseAdmin.from('parent_message_approvals').insert([{
      child_id: childId,
      parent_id: parentId,
      source: 'parent_form',
      source_title: formTitle,
      ai_message: analysis.mensaje_padres || 'Gracias por completar el formulario. Lo revisaremos pronto.',
      edited_message: analysis.mensaje_padres || 'Gracias por completar el formulario. Lo revisaremos pronto.',
      ai_analysis: analysis,
      session_data: { form_type: formType, form_id: formId, responses },
      status: 'pending_approval',
      created_at: new Date().toISOString(),
    }])

    // Save full report to reportes_generados (best-effort, won't fail the main response)
    try {
      await supabaseAdmin.from('reportes_generados').insert([{
        child_id: childId,
        tipo_reporte: 'formulario_padres',
        titulo: `Análisis: ${formTitle}`,
        nombre_archivo: `analisis_${formType}_${childId}.json`,
        file_data: JSON.stringify(analysis),
        tamano_bytes: JSON.stringify(analysis).length,
        fecha_generacion: new Date().toISOString(),
        generado_por: 'IA',
      }])
    } catch (_e) { /* best-effort */ }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Error analyzing parent form:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
