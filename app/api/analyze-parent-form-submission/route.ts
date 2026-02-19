// ==============================================================================
// API: ANALIZAR FORMULARIO DE PADRES + GENERAR REPORTE WORD
// Ruta: /app/api/analyze-parent-form-submission/route.ts
//
// FIX: Ya no llama a /api/generate-report por HTTP (falla en Vercel porque
//      localhost:3000 no existe en producción serverless). En su lugar importa
//      la función directamente desde la librería compartida.
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateReport } from '@/lib/report-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, formType, formTitle, responses, childId, parentId } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Falta API Key' }, { status: 500 })

    // ── 1. Obtener datos del niño ──────────────────────────────────────────
    const { data: child } = await supabaseAdmin
      .from('children')
      .select('name, birth_date, diagnosis, age')
      .eq('id', childId)
      .single()

    const childName = child?.name || 'Paciente'
    const childAge  = typeof child?.age === 'number' ? child.age : undefined
    const diagnosis = child?.diagnosis || 'No especificado'

    // ── 2. Análisis IA del formulario ──────────────────────────────────────
    const responsesText = Object.entries(responses)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : String(v)}`)
      .join('\n')

    const ai = new GoogleGenAI({ apiKey })

    const prompt = `
Eres un supervisor clínico especialista en neurodiversidad (TDAH, TEA, trastornos del desarrollo).

DATOS DEL FORMULARIO COMPLETADO POR LOS PADRES:
- Paciente: ${childName}${childAge ? ` (${childAge} años)` : ''}
- Diagnóstico: ${diagnosis}
- Formulario: ${formTitle}
- Tipo: ${formType}

RESPUESTAS DE LOS PADRES:
${responsesText}

Responde SOLO con este JSON exacto (sin markdown, sin backticks):
{
  "resumen_ejecutivo": "Párrafo de 3-4 oraciones resumiendo el estado actual del paciente",
  "analisis_clinico": "Análisis clínico detallado de 4-5 oraciones con terminología profesional",
  "areas_fortaleza": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "areas_trabajo": ["Área de trabajo 1", "Área de trabajo 2", "Área de trabajo 3"],
  "recomendaciones": ["Recomendación 1", "Recomendación 2", "Recomendación 3", "Recomendación 4"],
  "actividades_en_casa": ["Actividad 1", "Actividad 2", "Actividad 3"],
  "indicadores_clave": ["Indicador 1", "Indicador 2", "Indicador 3"],
  "nivel_alerta": "bajo|moderado|alto",
  "mensaje_padres": "Mensaje empático de 2-3 oraciones para los padres.",
  "proximo_paso": "Una acción concreta para la próxima sesión"
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.3 }
    })

    const text = response.text || '{}'
    let analysis: any = {}
    try {
      analysis = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch {
      analysis = { resumen_ejecutivo: text }
    }

    // ── 3. Guardar en cola de aprobación para el admin ─────────────────────
    await supabaseAdmin.from('parent_message_approvals').insert([{
      child_id:       childId,
      parent_id:      parentId,
      source:         'parent_form',
      source_title:   formTitle,
      ai_message:     analysis.mensaje_padres || 'Gracias por completar el formulario.',
      edited_message: analysis.mensaje_padres || 'Gracias por completar el formulario.',
      ai_analysis:    analysis,
      session_data:   { form_type: formType, form_id: formId, responses },
      status:         'pending_approval',
      created_at:     new Date().toISOString(),
    }])

    // ── 4. Generar reporte Word directamente (sin HTTP self-call) ──────────
    try {
      const reportResult = await generateReport({
        reportType:  formType,
        childName,
        childAge,
        reportData:  { responses, ai_analysis: analysis },
        evaluationId: formId,
        formTitle,
      })

      if (reportResult.success && reportResult.fileData) {
        await supabaseAdmin.from('reportes_generados').insert([{
          child_id:        childId,
          tipo_reporte:    formType,
          titulo:          `${formTitle} - ${childName}`,
          nombre_archivo:  reportResult.fileName,
          file_data:       reportResult.fileData,
          mime_type:       reportResult.mimeType,
          tamano_bytes:    Math.round((reportResult.fileData.length * 3) / 4),
          fecha_generacion: new Date().toISOString(),
          generado_por:    'Padres + IA',
          source_id:       formId,
        }])
        console.log('✅ Reporte Word generado y guardado para formulario de padres:', formTitle)
      }
    } catch (reportErr) {
      // El reporte falla en silencio — el análisis igual se guarda
      console.error('⚠️ Error generando reporte Word (el análisis se guardó):', reportErr)
    }

    return NextResponse.json({ success: true, analysis })

  } catch (error: any) {
    console.error('Error analyzing parent form:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
