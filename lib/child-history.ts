// ============================================================================
// HELPER: Obtener historial completo del niño para contexto de IA
// Usado por todos los endpoints que generan análisis y mensajes a padres
// ============================================================================

import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ChildHistory {
  nombre: string
  edad: string
  diagnostico: string
  historialTexto: string
}

export async function getChildHistory(childId: string, fallbackName?: string, fallbackAge?: string): Promise<ChildHistory> {
  let nombre = fallbackName || 'Paciente'
  let edad = fallbackAge || 'N/E'
  let diagnostico = 'No especificado'
  let historialTexto = ''

  if (!childId) return { nombre, edad, diagnostico, historialTexto }

  try {
    // 1. Datos básicos del niño
    const { data: childData } = await supabaseAdmin
      .from('children')
      .select('name, age, birth_date, diagnosis')
      .eq('id', childId)
      .single()

    if (childData) {
      nombre = (childData as any).name || nombre
      diagnostico = (childData as any).diagnosis || diagnostico
      const rawAge = (childData as any).age
      const birthDate = (childData as any).birth_date
      // Prioridad: age del DB > birth_date calculado > fallback
      if (rawAge !== null && rawAge !== undefined && rawAge !== '') {
        edad = String(rawAge)  // Usar SIEMPRE el valor del DB (puede ser número o string)
      } else if (birthDate) {
        const birth = new Date(birthDate)
        const now = new Date()
        let years = now.getFullYear() - birth.getFullYear()
        const months = now.getMonth() - birth.getMonth()
        if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years--
        edad = `${years} años`
      }
      // Si nada funciona, mantener el fallback original
    }

    // 2. Últimas 5 sesiones ABA
    const { data: sesionesAba } = await supabaseAdmin
      .from('registro_aba')
      .select('fecha_sesion, datos, ai_analysis')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(5)

    // 3. Anamnesis más reciente
    const { data: anamnesis } = await supabaseAdmin
      .from('anamnesis_completa')
      .select('fecha_creacion, datos')
      .eq('child_id', childId)
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 4. Últimas evaluaciones clínicas (form_responses)
    const { data: formResponses } = await supabaseAdmin
      .from('form_responses')
      .select('form_type, form_title, created_at, ai_analysis')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(8)

    // 5. Evaluaciones profesionales (brief2, ados2, vineland3, wisc, basc3)
    const evalTables = [
      { table: 'evaluacion_brief2',   label: 'BRIEF-2 (Funciones Ejecutivas)' },
      { table: 'evaluacion_ados2',    label: 'ADOS-2 (TEA)' },
      { table: 'evaluacion_vineland3',label: 'Vineland-3 (Conducta Adaptativa)' },
      { table: 'evaluacion_wiscv',    label: 'WISC-V (Cognitivo)' },
      { table: 'evaluacion_basc3',    label: 'BASC-3 (Conducta)' },
    ]

    const evalResults: string[] = []
    for (const { table, label } of evalTables) {
      try {
        const { data } = await supabaseAdmin
          .from(table)
          .select('created_at, ai_analysis')
          .eq('child_id', childId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data && (data as any).ai_analysis) {
          const ai = (data as any).ai_analysis
          const resumen = ai.resumen_ejecutivo || ai.analisis_clinico || ai.perfil_cognitivo_ia || ''
          if (resumen) {
            evalResults.push(`${label} (${new Date((data as any).created_at).toLocaleDateString('es-PE')}):\n  ${resumen.slice(0, 300)}${resumen.length > 300 ? '...' : ''}`)
          }
        }
      } catch { /* tabla puede no existir */ }
    }

    // ── Construir texto de historial ────────────────────────────────────────
    const partes: string[] = []

    if (diagnostico && diagnostico !== 'No especificado') {
      partes.push(`Diagnóstico/Perfil: ${diagnostico}`)
    }

    if (anamnesis && (anamnesis as any).datos) {
      const d = (anamnesis as any).datos
      const motivo = d.motivo_consulta || d.motivo_derivacion || d.motivo || ''
      const antecedentes = d.antecedentes_relevantes || d.antecedentes || ''
      if (motivo || antecedentes) {
        partes.push(`Anamnesis (${new Date((anamnesis as any).fecha_creacion).toLocaleDateString('es-PE')}):\n  Motivo: ${motivo || 'N/E'}\n  Antecedentes: ${antecedentes || 'N/E'}`)
      }
    }

    if (sesionesAba && sesionesAba.length > 0) {
      const sesionesTexto = (sesionesAba as any[]).map((s, i) => {
        const d = s.datos || {}
        const ai = s.ai_analysis || {}
        return `  Sesión ${i + 1} (${s.fecha_sesion || 'sin fecha'}):
    - Objetivo: ${d.objetivo_principal || 'N/E'}
    - Conducta: ${d.conducta || 'N/E'}
    - Técnicas: ${Array.isArray(d.tecnicas_aplicadas) ? d.tecnicas_aplicadas.join(', ') : (d.tecnicas_aplicadas || 'N/E')}
    - Avances IA: ${ai.avances_observados || 'N/E'}
    - Patrón aprendizaje: ${ai.patron_aprendizaje || 'N/E'}`
      }).join('\n\n')
      partes.push(`Últimas ${sesionesAba.length} sesiones ABA:\n${sesionesTexto}`)
    }

    if (formResponses && formResponses.length > 0) {
      const formsTexto = (formResponses as any[])
        .filter(f => f.ai_analysis)
        .slice(0, 4)
        .map(f => {
          const ai = f.ai_analysis
          const resumen = ai.resumen_ejecutivo || ai.analisis_clinico || ai.analisis_ia || ''
          return `  ${f.form_title || f.form_type} (${new Date(f.created_at).toLocaleDateString('es-PE')}):\n    ${resumen.slice(0, 200)}${resumen.length > 200 ? '...' : ''}`
        })
        .filter(Boolean)
      if (formsTexto.length > 0) {
        partes.push(`Evaluaciones y formularios previos:\n${formsTexto.join('\n')}`)
      }
    }

    if (evalResults.length > 0) {
      partes.push(`Evaluaciones profesionales:\n${evalResults.map(e => `  ${e}`).join('\n\n')}`)
    }

    if (partes.length > 0) {
      historialTexto = `\n━━━ HISTORIAL CLÍNICO DE ${nombre.toUpperCase()} ━━━\n${partes.join('\n\n')}\n━━━ FIN HISTORIAL ━━━\n`
    }

  } catch (err) {
    console.warn('⚠️ No se pudo cargar historial del niño:', err)
  }

  return { nombre, edad, diagnostico, historialTexto }
}
