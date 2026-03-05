// app/api/programas-aba/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  const programaId = searchParams.get('id')

  try {
    if (programaId) {
      // Obtener programa con sus sets y sesiones
      const { data, error } = await supabaseAdmin
        .from('programas_aba')
        .select(`
          *,
          objetivos_cp(*),
          sesiones_datos_aba(*, objetivo_cp_id),
          cambios_fase_aba(*)
        `)
        .eq('id', programaId)
        .order('objetivos_cp.numero_set', { ascending: true })
        .order('sesiones_datos_aba.fecha', { ascending: true })
        .single()
      if (error) throw error
      return NextResponse.json({ data })
    }

    if (childId) {
      const { data, error } = await supabaseAdmin
        .from('programas_aba')
        .select(`
          *,
          objetivos_cp(*),
          sesiones_datos_aba(fecha, porcentaje_exito, frecuencia_valor, duracion_segundos, fase)
        `)
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Se requiere child_id o id' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'crear_programa') {
      const { programa, objetivos } = body
      const { data: prog, error } = await supabaseAdmin
        .from('programas_aba')
        .insert(programa)
        .select()
        .single()
      if (error) throw error

      // Insertar objetivos CP si vienen
      if (objetivos && objetivos.length > 0) {
        const objConId = objetivos.map((o: any, i: number) => ({
          ...o, programa_id: (prog as any).id, numero_set: i + 1,
        }))
        await supabaseAdmin.from('objetivos_cp').insert(objConId)
      }
      return NextResponse.json({ data: prog })
    }

    if (action === 'registrar_sesion') {
      const { sesion } = body
      const { data, error } = await supabaseAdmin
        .from('sesiones_datos_aba')
        .insert(sesion)
        .select()
        .single()
      if (error) throw error

      // Verificar si se alcanzó el criterio de dominio
      await verificarCriterioDominio((sesion as any).programa_id)

      return NextResponse.json({ data })
    }

    if (action === 'cambiar_fase') {
      const { programa_id, child_id, fase_nueva, motivo, fase_anterior } = body
      const [cambio, _] = await Promise.all([
        supabaseAdmin.from('cambios_fase_aba').insert({
          programa_id, child_id, fase_nueva, fase_anterior, motivo,
        }).select().single(),
        supabaseAdmin.from('programas_aba').update({
          fase_actual: fase_nueva,
          ...(fase_nueva === 'dominado' ? { estado: 'dominado', fecha_dominio: new Date().toISOString().split('T')[0] } : {}),
        }).eq('id', programa_id),
      ])
      return NextResponse.json({ data: cambio.data })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    const { data, error } = await supabaseAdmin
      .from('programas_aba')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Verificar si se cumplió el criterio de dominio automáticamente
async function verificarCriterioDominio(programaId: string) {
  try {
    const { data: prog } = await supabaseAdmin
      .from('programas_aba')
      .select('criterio_dominio_pct, criterio_sesiones_consecutivas, fase_actual, titulo, child_id')
      .eq('id', programaId)
      .single()
    if (!prog || (prog as any).fase_actual !== 'intervencion') return

    const { data: sesiones } = await supabaseAdmin
      .from('sesiones_datos_aba')
      .select('porcentaje_exito')
      .eq('programa_id', programaId)
      .order('fecha', { ascending: false })
      .limit((prog as any).criterio_sesiones_consecutivas)

    if (!sesiones || sesiones.length < (prog as any).criterio_sesiones_consecutivas) return

    const cumpleCriterio = (sesiones as any[]).every(
      s => s.porcentaje_exito >= (prog as any).criterio_dominio_pct
    )

    if (cumpleCriterio) {
      // Crear alerta de dominio alcanzado
      await supabaseAdmin.from('agente_alertas').insert({
        child_id: (prog as any).child_id,
        programa_id: programaId,
        tipo: 'criterio_alcanzado',
        titulo: `✅ Criterio dominado: "${(prog as any).titulo}"`,
        mensaje: `Se alcanzó el criterio de ${(prog as any).criterio_dominio_pct}% en ${(prog as any).criterio_sesiones_consecutivas} sesiones consecutivas. Considera pasar a mantenimiento.`,
        prioridad: 'alta',
      })
    }
  } catch (e) { /* silencioso */ }
}
