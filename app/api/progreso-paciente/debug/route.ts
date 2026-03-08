import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const childId = new URL(request.url).searchParams.get('child_id')
  if (!childId) return NextResponse.json({ error: 'child_id requerido' })

  const [programas, registroAba, entorno] = await Promise.all([
    supabaseAdmin.from('programas_aba').select('id, titulo, estado, created_at').eq('child_id', childId),
    supabaseAdmin.from('registro_aba').select('id, fecha_sesion, datos').eq('child_id', childId).limit(10),
    supabaseAdmin.from('registro_entorno_hogar').select('id, fecha_visita').eq('child_id', childId).limit(10),
  ])

  const programaIds = (programas.data || []).map((p: any) => p.id)
  let sesionesDelPaciente: any[] = []
  if (programaIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('sesiones_datos_aba')
      .select('id, fecha, porcentaje_exito, programa_id')
      .in('programa_id', programaIds)
      .order('fecha', { ascending: false })
      .limit(30)
    sesionesDelPaciente = data || []
  }

  return NextResponse.json({
    child_id: childId,
    programas: { count: programas.data?.length, estados: programas.data?.map((p:any)=>({id:p.id,titulo:p.titulo,estado:p.estado})) },
    sesiones_datos_aba: { count: sesionesDelPaciente.length, muestra: sesionesDelPaciente.slice(0,5) },
    registro_aba: { count: registroAba.data?.length, muestra: registroAba.data?.slice(0,3) },
    registro_entorno_hogar: { count: entorno.data?.length },
  })
}
