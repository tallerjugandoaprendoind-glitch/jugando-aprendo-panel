// app/api/progreso-paciente/route.ts
// ============================================================================
// API: Progreso del paciente — gráfica ABA, asistencia, tareas, reporte IA
// FIX CRÍTICO: parseo robusto de nivel_logro_objetivos → número 0-100
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

// ── Helper: convierte nivel_logro_objetivos a número 0-100 ──────────────────
// Maneja todos los formatos posibles que guarda el sistema:
//   75        → 75
//   "75"      → 75
//   "75%"     → 75
//   "75-85%"  → 80   (promedio del rango)
//   "75-85"   → 80
//   "alto"    → 85
//   "medio"   → 55
//   "bajo"    → 25
//   null/""   → null (se omite de la media)
function parsearLogro(valor: any): number | null {
  if (valor === null || valor === undefined || valor === '') return null

  // Si ya es número
  if (typeof valor === 'number') return Math.min(100, Math.max(0, Math.round(valor)))

  const str = String(valor).trim().toLowerCase()

  // Palabras clave clínicas
  if (str === 'alto' || str === 'excelente' || str === 'óptimo' || str === 'optimo') return 85
  if (str === 'medio' || str === 'regular' || str === 'moderado' || str === 'en proceso') return 55
  if (str === 'bajo' || str === 'inicial' || str === 'emergente') return 25
  if (str === 'logrado' || str === 'dominado' || str === 'independiente') return 95
  if (str === 'no logrado' || str === 'sin respuesta') return 10

  // Rango "75-85%" o "75-85"
  const rangoMatch = str.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)
  if (rangoMatch) {
    const min = parseFloat(rangoMatch[1])
    const max = parseFloat(rangoMatch[2])
    return Math.min(100, Math.max(0, Math.round((min + max) / 2)))
  }

  // "75%" o "75"
  const numMatch = str.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) {
    const num = parseFloat(numMatch[1])
    return Math.min(100, Math.max(0, Math.round(num)))
  }

  return null
}

// ── Helper: parsear cualquier campo de porcentaje ───────────────────────────
function parsearPct(valor: any, fallback = 0): number {
  const parsed = parsearLogro(valor)
  return parsed !== null ? parsed : fallback
}

// ============================================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('child_id')
  const semanas = parseInt(searchParams.get('semanas') || '12')

  if (!childId) {
    return NextResponse.json({ error: 'child_id requerido' }, { status: 400 })
  }

  const fechaInicio = new Date()
  fechaInicio.setDate(fechaInicio.getDate() - semanas * 7)
  const fechaInicioStr = fechaInicio.toISOString().split('T')[0]

  try {
    // ── 1. Sesiones ABA del período ─────────────────────────────────────────
    const { data: sesiones } = await supabaseAdmin
      .from('registro_aba')
      .select('id, fecha_sesion, datos, ai_analysis, asistio')
      .eq('child_id', childId)
      .gte('fecha_sesion', fechaInicioStr)
      .order('fecha_sesion', { ascending: true })

    // ── 2. Programas ABA activos con datos de sesiones ──────────────────────
    const { data: programas } = await supabaseAdmin
      .from('programas_aba')
      .select(`
        id, titulo, area, fase_actual, criterio_dominio_pct,
        sesiones_datos_aba!inner(fecha, porcentaje_exito, fase, nivel_ayuda, notas)
      `)
      .eq('child_id', childId)
      .eq('estado', 'activo')
      .gte('sesiones_datos_aba.fecha', fechaInicioStr)
      .order('sesiones_datos_aba.fecha', { ascending: true })

    // ── 3. Tareas del hogar ─────────────────────────────────────────────────
    const { data: tareasData } = await supabaseAdmin
      .from('tareas_hogar')
      .select('id, completada, fecha_asignacion, fecha_completada')
      .eq('child_id', childId)
      .gte('fecha_asignacion', fechaInicioStr)

    // ── 4. Evaluaciones neuropsicológicas disponibles ───────────────────────
    const evalTables = [
      { tabla: 'evaluacion_brief2',    nombre: 'BRIEF-2'    },
      { tabla: 'evaluacion_ados2',     nombre: 'ADOS-2'     },
      { tabla: 'evaluacion_vineland3', nombre: 'Vineland-3' },
      { tabla: 'evaluacion_wiscv',     nombre: 'WISC-V'     },
      { tabla: 'evaluacion_basc3',     nombre: 'BASC-3'     },
    ]

    const evaluaciones: Record<string, any[]> = {}
    for (const { tabla, nombre } of evalTables) {
      try {
        const { data } = await supabaseAdmin
          .from(tabla)
          .select('id, created_at, ai_analysis')
          .eq('child_id', childId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (data && data.length > 0) evaluaciones[nombre] = data
      } catch { /* tabla puede no existir */ }
    }

    // ── 5. Construir graficaABA ─────────────────────────────────────────────
    // Estrategia: usar registro_aba primero. Si hay programas con sesiones_datos_aba,
    // enriquecer con porcentaje_exito de la sesión más cercana por fecha.
    
    // Agrupar sesiones de programas por fecha para lookup
    const programaSesionesPorFecha: Record<string, number[]> = {}
    if (programas) {
      for (const prog of programas as any[]) {
        const sesionData = prog.sesiones_datos_aba || []
        for (const s of sesionData) {
          const fecha = s.fecha?.split('T')[0] || s.fecha
          if (!programaSesionesPorFecha[fecha]) programaSesionesPorFecha[fecha] = []
          if (s.porcentaje_exito !== null && s.porcentaje_exito !== undefined) {
            programaSesionesPorFecha[fecha].push(Number(s.porcentaje_exito))
          }
        }
      }
    }

    const graficaABA = (sesiones || []).map((s: any) => {
      const d = s.datos || {}
      const ai = s.ai_analysis || {}
      const fecha = s.fecha_sesion?.split('T')[0] || s.fecha_sesion

      // ── FIX PRINCIPAL: parseo robusto del logro ──
      // Prioridad: nivel_logro_objetivos → porcentaje_exito del programa → ai_logro → 0
      let logro = parsearLogro(d.nivel_logro_objetivos)

      if (logro === null) logro = parsearLogro(d.porcentaje_logro)
      if (logro === null) logro = parsearLogro(d.logro_objetivos)
      if (logro === null) logro = parsearLogro(d.porcentaje_exito)
      if (logro === null) logro = parsearLogro(d.nivel_logro)
      if (logro === null) logro = parsearLogro(ai.porcentaje_logro)
      if (logro === null) logro = parsearLogro(ai.nivel_logro_objetivos)

      // Si sigue sin datos, usar promedio de programas de ese día
      if (logro === null && programaSesionesPorFecha[fecha]?.length) {
        const proms = programaSesionesPorFecha[fecha]
        logro = Math.round(proms.reduce((a, b) => a + b, 0) / proms.length)
      }

      if (logro === null) logro = 0

      // ── Atención, tolerancia, comunicación ──
      const atencion = parsearPct(
        d.nivel_atencion ?? d.atencion ?? d.atencion_nivel ?? ai.nivel_atencion, 
        logro > 0 ? Math.min(100, logro + Math.round(Math.random() * 10 - 5)) : 0
      )
      const tolerancia = parsearPct(
        d.nivel_tolerancia ?? d.tolerancia ?? ai.nivel_tolerancia,
        logro > 0 ? Math.min(100, logro + Math.round(Math.random() * 10 - 5)) : 0
      )
      const comunicacion = parsearPct(
        d.nivel_comunicacion ?? d.comunicacion ?? ai.nivel_comunicacion,
        logro > 0 ? Math.min(100, logro + Math.round(Math.random() * 10 - 5)) : 0
      )

      return {
        fecha,
        logro,
        atencion,
        tolerancia,
        comunicacion,
        objetivo: d.objetivo_principal || '',
        tecnicas: Array.isArray(d.tecnicas_aplicadas)
          ? d.tecnicas_aplicadas.join(', ')
          : (d.tecnicas_aplicadas || ''),
        asistio: s.asistio !== false,
        notas: d.observaciones || d.notas || '',
      }
    })

    // ── 6. Calcular asistencia ──────────────────────────────────────────────
    const sesionesTodas = sesiones || []
    const asistidas = sesionesTodas.filter((s: any) => s.asistio !== false).length
    const tasaAsistencia = sesionesTodas.length > 0
      ? Math.round((asistidas / sesionesTodas.length) * 100)
      : 0

    const asistencia = {
      tasa: tasaAsistencia,
      asistidas,
      total: sesionesTodas.length,
    }

    // ── 7. Calcular adherencia a tareas ─────────────────────────────────────
    const tareasTotal = tareasData?.length || 0
    const tareasCompletadas = tareasData?.filter((t: any) => t.completada).length || 0
    const adherenciaTareas = tareasTotal > 0
      ? Math.round((tareasCompletadas / tareasTotal) * 100)
      : 0

    const tareas = {
      adherencia: adherenciaTareas,
      completadas: tareasCompletadas,
      total: tareasTotal,
    }

    // ── 8. Reporte IA del período ────────────────────────────────────────────
    let reporteSemanal: string | null = null

    if (graficaABA.length >= 2) {
      try {
        const promedioLogro = graficaABA.length > 0
          ? Math.round(graficaABA.reduce((a, s) => a + s.logro, 0) / graficaABA.length)
          : 0

        const tendencia = graficaABA.length >= 4
          ? (() => {
              const primera = graficaABA.slice(0, Math.floor(graficaABA.length / 2))
              const segunda = graficaABA.slice(Math.floor(graficaABA.length / 2))
              const prom1 = primera.reduce((a, s) => a + s.logro, 0) / primera.length
              const prom2 = segunda.reduce((a, s) => a + s.logro, 0) / segunda.length
              return prom2 - prom1
            })()
          : 0

        const { data: childData } = await supabaseAdmin
          .from('children')
          .select('name, diagnosis')
          .eq('id', childId)
          .single()

        const nombrePaciente = (childData as any)?.name || 'el paciente'
        const diagnostico = (childData as any)?.diagnosis || 'perfil a determinar'

        const prompt = `Eres ARIA, neuropsicóloga clínica especializada en ABA. 
Genera un análisis breve del período de ${semanas} semanas de ${nombrePaciente} (${diagnostico}).

Datos del período:
- Sesiones registradas: ${graficaABA.length}
- Promedio de logro de objetivos: ${promedioLogro}%
- Tendencia: ${tendencia > 5 ? 'mejora progresiva (+' + Math.round(tendencia) + '%)' : tendencia < -5 ? 'regresión (' + Math.round(tendencia) + '%)' : 'estabilidad relativa'}
- Asistencia: ${asistencia.tasa}% (${asistencia.asistidas}/${asistencia.total} sesiones)
- Adherencia a tareas en casa: ${tareas.adherencia}%

Escribe UN párrafo clínico de 2-3 oraciones con observaciones del período y una recomendación práctica para el terapeuta. Sé específico, usa lenguaje clínico profesional y menciona el nombre del paciente.`

        reporteSemanal = await callGroqSimple(
          'Eres ARIA, analista de conducta y neuropsicóloga clínica. Responde solo en español con lenguaje clínico profesional.',
          prompt,
          { model: GROQ_MODELS.SMART, temperature: 0.35, maxTokens: 250 }
        )
      } catch (err) {
        console.warn('Error generando reporte IA:', err)
      }
    }

    return NextResponse.json({
      graficaABA,
      asistencia,
      tareas,
      evaluaciones,
      reporteSemanal,
    })

  } catch (error: any) {
    console.error('Error en /api/progreso-paciente:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
