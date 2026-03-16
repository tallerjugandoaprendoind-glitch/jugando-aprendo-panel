import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/children — lista todos los pacientes usando service role (bypassa RLS)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('id, name, diagnosis, age, birth_date, is_active, parent_id, parent_id2, tutor_id, guardian_id, created_at')
      .order('name')
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
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
