// app/api/padre/stats/route.ts
// Endpoint que usa service_role para leer objetivos_cp y sesiones_datos_aba
// sin restricciones RLS — el cliente padre (anon key) no tiene acceso directo.

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')

  if (!childId) {
    return NextResponse.json({ error: 'child_id requerido' }, { status: 400 })
  }

  try {
    // 1. Programas ABA con objetivos_cp anidados (usando service_role)
    const { data: programas, error: errProg } = await supabaseAdmin
      .from('programas_aba')
      .select('id, titulo, nombre, area, estado, objetivos_cp(id, descripcion, estado, numero_set)')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })

    if (errProg) {
      console.error('[padre/stats] Error programas_aba:', errProg.message)
      return NextResponse.json({ error: errProg.message }, { status: 500 })
    }

    const progIds = (programas || []).map((p: any) => p.id)

    // 2. Sesiones por programa (sesiones_datos_aba — fuente del admin / Hub IA)
    const { data: sesionesPrograma } = progIds.length
      ? await supabaseAdmin
          .from('sesiones_datos_aba')
          .select('id, programa_id, fecha, porcentaje_exito')
          .in('programa_id', progIds)
          .order('fecha', { ascending: true })
      : { data: [] as any[] }

    // 3. Sesiones registro_aba (fuente legacy)
    const { data: registroAba } = await supabaseAdmin
      .from('registro_aba')
      .select('id, fecha_sesion')
      .eq('child_id', childId)

    // 4. Sesiones aba_sessions_v2
    const { data: sessionsV2 } = await supabaseAdmin
      .from('aba_sessions_v2')
      .select('id, duration_minutes')
      .eq('child_id', childId)

    // ── Calcular objetivos ─────────────────────────────────────
    const allObjetivos = (programas || []).flatMap((p: any) => p.objetivos_cp || [])
    const totalGoals = allObjetivos.length
    const goalsAchieved = allObjetivos.filter((o: any) => o.estado === 'dominado').length
    const masteryRate = totalGoals > 0 ? Math.round((goalsAchieved / totalGoals) * 100) : 0

    // ── Calcular sesiones unificadas ──────────────────────────
    const totalSesiones = Math.max(
      registroAba?.length || 0,
      sessionsV2?.length || 0,
      sesionesPrograma?.length || 0
    )

    // ── Horas totales ─────────────────────────────────────────
    const totalMinutes =
      (sessionsV2 || []).reduce((s: number, x: any) => s + (x.duration_minutes || 45), 0) ||
      totalSesiones * 45
    const hoursTotal = Math.round((totalMinutes / 60) * 10) / 10

    // ── Nivel basado en sesiones ──────────────────────────────
    let level = 'Inicial'
    if (totalSesiones >= 50) level = 'Avanzado'
    else if (totalSesiones >= 20) level = 'Intermedio'
    else if (totalSesiones >= 5) level = 'Básico'

    // ── Programas simplificados para UI ──────────────────────
    const programasUI = (programas || []).map((p: any) => ({
      id: p.id,
      nombre: p.titulo || p.nombre,
      area: p.area,
      estado: p.estado,
    }))

    return NextResponse.json({
      ok: true,
      totalSesiones,
      totalGoals,
      goalsAchieved,
      masteryRate,
      hoursTotal,
      level,
      programas: programasUI,
      _debug: {
        registro_aba: registroAba?.length ?? 0,
        aba_sessions_v2: sessionsV2?.length ?? 0,
        sesiones_datos_aba: sesionesPrograma?.length ?? 0,
        total_objetivos: totalGoals,
        dominados: goalsAchieved,
      },
    })
  } catch (e: any) {
    console.error('[padre/stats] Error inesperado:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
