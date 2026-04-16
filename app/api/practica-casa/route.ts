import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programaId = searchParams.get('programa_id')
    const dias = parseInt(searchParams.get('dias') || '56')

    if (!programaId) {
      return NextResponse.json({ error: 'programa_id requerido' }, { status: 400 })
    }

    const desde = new Date()
    desde.setDate(desde.getDate() - dias)

    const { data, error } = await supabaseAdmin
      .from('programa_practica_casa')
      .select('fecha, practicado, child_id')
      .eq('programa_id', programaId)
      .gte('fecha', desde.toISOString().split('T')[0])
      .order('fecha', { ascending: false })

    if (error) throw error

    // Si practicado es null (registros viejos), tratar como true
    const registros = (data || []).map(r => ({ ...r, practicado: r.practicado !== false }))

    return NextResponse.json({ data: registros })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
