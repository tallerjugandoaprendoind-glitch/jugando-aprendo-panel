import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function parsearLogro(valor: any): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return Math.min(100, Math.max(0, Math.round(valor)))
  const str = String(valor).trim().toLowerCase()
  if (str.includes('mayormente') || str.includes('logrado')) {
    const rangoMatch = str.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)
    if (rangoMatch) return Math.round((parseFloat(rangoMatch[1]) + parseFloat(rangoMatch[2])) / 2)
  }
  const rangoMatch = str.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/)
  if (rangoMatch) return Math.round((parseFloat(rangoMatch[1]) + parseFloat(rangoMatch[2])) / 2)
  const numMatch = str.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) return Math.round(parseFloat(numMatch[1]))
  return null
}

export async function GET(request: NextRequest) {
  const childId = new URL(request.url).searchParams.get('child_id')
  if (!childId) return NextResponse.json({ error: 'child_id requerido' })

  const { data: sesiones } = await supabaseAdmin
    .from('registro_aba')
    .select('id, fecha_sesion, datos, asistio')
    .eq('child_id', childId)
    .order('fecha_sesion', { ascending: true })

  const { data: programas } = await supabaseAdmin
    .from('programas_aba')
    .select('id, titulo, estado')
    .eq('child_id', childId)

  const puntosRegistro = (sesiones || []).map((s: any) => {
    const d = s.datos || {}
    const nivel_logro_raw = d.nivel_logro_objetivos
    const logro_parsed = parsearLogro(nivel_logro_raw)
    return {
      fecha: s.fecha_sesion,
      nivel_logro_raw,
      logro_parsed,
      nivel_atencion_raw: d.nivel_atencion,
      tiene_datos: Object.keys(d).length > 0,
    }
  })

  const { data: entorno } = await supabaseAdmin
    .from('registro_entorno_hogar')
    .select('id, fecha_visita')
    .eq('child_id', childId)

  return NextResponse.json({
    child_id: childId,
    programas_count: programas?.length || 0,
    registro_aba_count: sesiones?.length || 0,
    registro_entorno_count: entorno?.length || 0,
    parseo_sesiones: puntosRegistro,
    conclusion: puntosRegistro.length > 0 
      ? `✅ ${puntosRegistro.length} sesiones encontradas — deberían aparecer en la gráfica`
      : '❌ Sin sesiones — nada que graficar',
  })
}
