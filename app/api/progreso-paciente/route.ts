// app/api/progreso-paciente/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

// Crear cliente DENTRO del handler para evitar problemas de singleton
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function parsearLogro(valor: any): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return Math.min(100, Math.max(0, Math.round(valor)))
  const str = String(valor).trim().toLowerCase()
  if (str.includes('totalmente') || str.includes('completamente') || str.includes('100')) return 100
  if (str.includes('mayormente') || str.includes('51-75') || str.includes('51 - 75')) return 63
  if (str.includes('parcialmente') || str.includes('26-50') || str.includes('26 - 50')) return 38
  if (str.includes('emergente') || str.includes('inicial') || str.includes('0-25') || str.includes('0 - 25')) return 13
  if (str === 'alto' || str === 'excelente') return 85
  if (str === 'medio' || str === 'regular') return 55
  if (str === 'bajo') return 25
  if (str === 'logrado' || str === 'dominado') return 95
  if (str === 'no logrado') return 10
  const rangoMatch = str.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)
  if (rangoMatch) return Math.round((parseFloat(rangoMatch[1]) + parseFloat(rangoMatch[2])) / 2)
  const numMatch = str.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) return Math.min(100, Math.max(0, Math.round(parseFloat(numMatch[1]))))
  return null
}

function parsearPct(valor: any, fallback = 0): number {
  const p = parsearLogro(valor)
  return p !== null ? p : fallback
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('child_id')
  const semanas = parseInt(searchParams.get('semanas') || '12')

  if (!childId) return NextResponse.json({ error: 'child_id requerido' }, { status: 400 })

  const db = getAdmin()

  try {
    // ── 1. Sesiones de registro_aba ──────────────────────────────────────
    const { data: sesiones, error: err1 } = await db
      .from('registro_aba')
      .select('id, fecha_sesion, datos, ai_analysis, asistio')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: true })

    // ── 2. Programas ABA + sus sesiones ─────────────────────────────────
    const { data: programas, error: err2 } = await db
      .from('programas_aba')
      .select('id, titulo, sesiones_datos_aba(fecha, porcentaje_exito)')
      .eq('child_id', childId)

    // ── 3. Tareas del hogar ──────────────────────────────────────────────
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - semanas * 7)
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]

    const { data: tareasData } = await db
      .from('tareas_hogar')
      .select('id, completada, fecha_asignacion')
      .eq('child_id', childId)
      .gte('fecha_asignacion', fechaInicioStr)

    // ── 4. Evaluaciones ──────────────────────────────────────────────────
    const evalTables = [
      { tabla: 'evaluacion_brief2', nombre: 'BRIEF-2' },
      { tabla: 'evaluacion_ados2', nombre: 'ADOS-2' },
      { tabla: 'evaluacion_vineland3', nombre: 'Vineland-3' },
      { tabla: 'evaluacion_wiscv', nombre: 'WISC-V' },
      { tabla: 'evaluacion_basc3', nombre: 'BASC-3' },
    ]
    const evaluaciones: Record<string, any[]> = {}
    for (const { tabla, nombre } of evalTables) {
      try {
        const { data } = await db.from(tabla).select('id, created_at, ai_analysis')
          .eq('child_id', childId).order('created_at', { ascending: false }).limit(3)
        if (data?.length) evaluaciones[nombre] = data
      } catch {}
    }

    // ── 5. Construir graficaABA ──────────────────────────────────────────
    // FUENTE A: registro_aba (notas clínicas con nivel_logro_objetivos)
    const puntosRegistro = (sesiones || []).map((s: any) => {
      let d: any = s.datos || {}
      if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = {} } }

      let logro = parsearLogro(d.nivel_logro_objetivos)
      if (logro === null) logro = parsearLogro(d.porcentaje_logro)
      if (logro === null) logro = parsearLogro(d.porcentaje_exito)
      if (logro === null) logro = parsearLogro(d.nivel_logro)
      if (logro === null) logro = 50 // fallback: si hay sesión, mostrar 50%

      // nivel_atencion viene en escala 1-5 → convertir a %
      const escala = (v: any) => v ? Math.round(((Number(v) - 1) / 4) * 100) : logro

      return {
        fecha: (s.fecha_sesion || '').split('T')[0],
        logro,
        atencion:     escala(d.nivel_atencion),
        tolerancia:   escala(d.tolerancia_frustracion ?? d.nivel_tolerancia),
        comunicacion: escala(d.iniciativa_comunicativa ?? d.nivel_comunicacion),
        objetivo:     d.objetivo_principal || d.conducta || 'Sesión ABA',
        tecnicas:     Array.isArray(d.tecnicas_aplicadas) ? d.tecnicas_aplicadas.join(', ') : (d.tecnicas_aplicadas || ''),
        asistio:      s.asistio !== false,
        notas:        d.observaciones_tecnicas || d.observaciones_clinicas || d.notas || '',
      }
    }).filter((p: any) => p.fecha) // descartar puntos sin fecha

    // FUENTE B: sesiones_datos_aba de programas
    const sesionesDePrograma: Record<string, number[]> = {}
    for (const prog of (programas || []) as any[]) {
      for (const s of (prog.sesiones_datos_aba || [])) {
        const fecha = (s.fecha || '').split('T')[0]
        if (!fecha) continue
        if (!sesionesDePrograma[fecha]) sesionesDePrograma[fecha] = []
        if (s.porcentaje_exito != null) sesionesDePrograma[fecha].push(Number(s.porcentaje_exito))
      }
    }
    const puntosPrograma = Object.entries(sesionesDePrograma).map(([fecha, logros]) => ({
      fecha,
      logro: logros.length ? Math.round(logros.reduce((a,b)=>a+b,0)/logros.length) : 50,
      atencion: 50, tolerancia: 50, comunicacion: 50,
      objetivo: 'Programa ABA', tecnicas: '', asistio: true, notas: ''
    }))

    // Combinar: registro_aba tiene prioridad
    const fechasRegistro = new Set(puntosRegistro.map((p: any) => p.fecha))
    const graficaABA = [
      ...puntosRegistro,
      ...puntosPrograma.filter(p => !fechasRegistro.has(p.fecha))
    ].sort((a, b) => a.fecha.localeCompare(b.fecha))

    // ── 6. Asistencia ────────────────────────────────────────────────────
    const asistidas = graficaABA.filter((s: any) => s.asistio !== false).length
    const asistencia = {
      tasa: graficaABA.length > 0 ? Math.round((asistidas / graficaABA.length) * 100) : 0,
      asistidas,
      total: graficaABA.length,
    }

    // ── 7. Tareas ────────────────────────────────────────────────────────
    const tareasTotal = tareasData?.length || 0
    const tareasCompletadas = tareasData?.filter((t: any) => t.completada).length || 0
    const tareas = {
      adherencia: tareasTotal > 0 ? Math.round((tareasCompletadas / tareasTotal) * 100) : 0,
      completadas: tareasCompletadas,
      total: tareasTotal,
    }

    // ── 8. Reporte IA ────────────────────────────────────────────────────
    let reporteSemanal: string | null = null
    if (graficaABA.length >= 2) {
      try {
        const promedio = Math.round(graficaABA.reduce((a: number, s: any) => a + s.logro, 0) / graficaABA.length)
        const { data: childData } = await db.from('children').select('name, diagnosis').eq('id', childId).single()
        const nombre = (childData as any)?.name || 'el paciente'
        const dx = (childData as any)?.diagnosis || 'perfil a determinar'
        reporteSemanal = await callGroqSimple(
          'Eres ARIA, analista de conducta y neuropsicóloga clínica. Responde en español con lenguaje clínico.',
          `Genera UN párrafo clínico de 2-3 oraciones sobre ${nombre} (${dx}). Período: ${semanas} sem. Sesiones: ${graficaABA.length}. Promedio logro: ${promedio}%. Asistencia: ${asistencia.tasa}%.`,
          { model: GROQ_MODELS.SMART, temperature: 0.35, maxTokens: 200 }
        )
      } catch {}
    }

    return NextResponse.json({
      graficaABA,
      asistencia,
      tareas,
      evaluaciones,
      reporteSemanal,
      _debug: {
        registro_aba_count: sesiones?.length ?? `ERROR: ${err1?.message}`,
        programas_count: programas?.length ?? `ERROR: ${err2?.message}`,
        puntos_grafica: graficaABA.length,
      }
    })

  } catch (error: any) {
    console.error('Error progreso-paciente:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
