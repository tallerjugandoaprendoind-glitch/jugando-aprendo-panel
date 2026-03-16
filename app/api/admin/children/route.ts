import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/children — lista todos los pacientes usando service role (bypassa RLS)
export async function GET() {
  try {
    // Try full select first
    let { data, error } = await supabaseAdmin
      .from('children')
      .select('id, name, diagnosis, age, birth_date, parent_id, created_at')
      .order('name')

    // If error due to missing columns, fallback to minimal select
    if (error) {
      const fallback = await supabaseAdmin
        .from('children')
        .select('id, name, parent_id')
        .order('name')
      if (fallback.error) throw fallback.error
      data = fallback.data
    }

    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, data: [] }, { status: 200 })
  }
}

// PATCH /api/admin/children — actualiza parent_id de un niño (bypassa RLS)
export async function PATCH(req: NextRequest) {
  try {
    const { childId, parentId } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })
    const { error } = await supabaseAdmin
      .from('children')
      .update({ parent_id: parentId ?? null })
      .eq('id', childId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
