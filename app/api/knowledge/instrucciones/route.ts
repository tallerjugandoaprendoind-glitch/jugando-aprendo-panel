// app/api/knowledge/instrucciones/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('centro_instrucciones')
    .select('*')
    .eq('activo', true)
    .order('prioridad', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('centro_instrucciones')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await supabaseAdmin.from('centro_instrucciones').update({ activo: false }).eq('id', id)
  return NextResponse.json({ success: true })
}
