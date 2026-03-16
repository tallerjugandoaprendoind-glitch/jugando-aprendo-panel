import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/children — lista todos los pacientes usando service role (bypassa RLS)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('id, name, diagnosis, age')
      .order('name')
    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
