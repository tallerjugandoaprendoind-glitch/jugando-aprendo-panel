// app/api/progreso-paciente/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  const semanas = parseInt(searchParams.get('semanas') || '12')

  if (!childId) return NextResponse.json({ error: 'child_id requerido' }, { status: 400 })

  try {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - (semanas * 7))
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]

    // ── SESIONES ABA ──────────────────────────────────────────
    const { data: sesionesABA } = await supabaseAdmin
      .from('registro_aba')
      .select('fecha_sesion, datos')
      .eq('child_id', childId)
      .gte('fecha_sesion', fechaInicioStr)
      .order('fecha_sesion', { ascending: true })

    // Transformar para gráficos
    const graficaABA = sesionesABA?.map(s => {
      const logro = s.datos?.nivel_logro_objetivos || ''
      const logroPct = logro.includes('76') || logro.includes('Completamente') ? 90
        : logro.includes('51') || logro.includes('Mayormente') ? 70
        : logro.includes('26') || logro.includes('Parcialmente') ? 45 : 20

      return {
        fecha: s.fecha_sesion,
        logro: logroPct,
        atencion: Number(s.datos?.nivel_atencion || 0) * 20,
        tolerancia: Number(s.datos?.tolerancia_frustracion || 0) * 20,
        comunicacion: Number(s.datos?.iniciativa_comunicativa || 0) * 20,
        objetivo: s.datos?.objetivo_principal || 'N/A'
      }
    }) || []

    // ── PROGRAMAS ABA ─────────────────────────────────────────
    const { data: programas } = await supabaseAdmin
      .from('programas_aba')
      .select('id, nombre, objetivo_lp, estado, created_at, objetivos_cp(id, nombre, estado, numero_set)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(5)

    // ── EVALUACIONES NEUROPSICOLÓGICAS ────────────────────────
    const evaluaciones: Record<string, any> = {}

    const tablas = [
      { nombre: 'brief2', tabla: 'evaluacion_brief2' },
      { nombre: 'ados2',  tabla: 'evaluacion_ados2' },
      { nombre: 'vineland3', tabla: 'evaluacion_vineland3' },
      { nombre: 'wiscv',  tabla: 'evaluacion_wiscv' },
      { nombre: 'basc3',  tabla: 'evaluacion_basc3' },
    ]

    for (const { nombre, tabla } of tablas) {
      try {
        const { data } = await supabaseAdmin
          .from(tabla)
          .select('created_at, metricas')
          .eq('child_id', childId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (data && data.length > 0) evaluaciones[nombre] = data
      } catch { /* tabla vacía */ }
    }

    // ── ASISTENCIA ────────────────────────────────────────────
    const { data: asistencia } = await supabaseAdmin
      .from('agenda_sesiones')
      .select('fecha, estado')
      .eq('child_id', childId)
      .gte('fecha', fechaInicioStr)
      .order('fecha', { ascending: true })

    const totalCitas = asistencia?.length || 0
    const asistidas  = asistencia?.filter(a => a.estado === 'realizada').length || 0
    const canceladas = asistencia?.filter(a => a.estado === 'cancelada').length || 0
    const noAsistio  = asistencia?.filter(a => a.estado === 'no_asistio').length || 0
    const tasaAsistencia = totalCitas > 0 ? Math.round((asistidas / totalCitas) * 100) : 0

    // ── TAREAS HOGAR ──────────────────────────────────────────
    const { data: tareas } = await supabaseAdmin
      .from('tareas_hogar')
      .select('fecha_asignada, completada, dificultad_reportada')
      .eq('child_id', childId)
      .gte('fecha_asignada', fechaInicioStr)
      .order('fecha_asignada', { ascending: true })

    const totalTareas      = tareas?.length || 0
    const tareasCompletadas = tareas?.filter(t => t.completada).length || 0
    const adherenciaFamilia = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0

    // ── REPORTE SEMANAL IA ────────────────────────────────────
    let reporteSemanal = null
    if (sesionesABA && sesionesABA.length >= 2) {
      reporteSemanal = await generarReporteSemanal(childId, sesionesABA.slice(-5))
    }

    return NextResponse.json({
      graficaABA,
      programas: programas || [],
      evaluaciones,
      asistencia: { total: totalCitas, asistidas, canceladas, noAsistio, tasa: tasaAsistencia },
      tareas: { total: totalTareas, completadas: tareasCompletadas, adherencia: adherenciaFamilia },
      reporteSemanal
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── REPORTE SEMANAL CON IA ───────────────────────────────────
async function generarReporteSemanal(childId: string, sesiones: any[]): Promise<string | null> {
  try {
    if (sesiones.length === 0) return null

    const { data: child } = await supabaseAdmin
      .from('children')
      .select('name, age, diagnosis')
      .eq('id', childId)
      .single()

    const prompt = `Genera un reporte semanal de progreso para compartir con la familia del paciente ${(child as any)?.name} (${(child as any)?.age} anos, ${(child as any)?.diagnosis}).

SESIONES RECIENTES:
${sesiones.map((s, i) => `Sesion ${i + 1} (${s.fecha_sesion}):
- Objetivo: ${s.datos?.objetivo_principal || 'N/A'}
- Atencion: ${s.datos?.nivel_atencion || 'N/A'}/5
- Tolerancia frustracion: ${s.datos?.tolerancia_frustracion || 'N/A'}/5
- Logro: ${s.datos?.nivel_logro_objetivos || 'N/A'}
- Avances: ${s.datos?.avances_observados || 'N/A'}`).join('\n\n')}

Escribe un parrafo corto (3-4 oraciones) en lenguaje simple para los padres:
- Lo que se trabajo esta semana
- Como estuvo el nino/a
- Un logro positivo concreto
- Un recordatorio de lo que pueden practicar en casa

Tono: Calido, positivo y alentador. Sin tecnicismos.`

    const response = await callGroqSimple(
        'Eres un asistente clínico especializado en ABA, TEA, TDAH y neurodesarrollo.',
        prompt,
        { model: GROQ_MODELS.SMART, temperature: 0.5, maxTokens: 2000 }
      )

    return response || null
  } catch {
    return null
  }
}
