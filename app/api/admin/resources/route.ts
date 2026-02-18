import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')
    const global = searchParams.get('global') // resources visible to all parents

    let query = supabaseAdmin
      .from('parent_resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (parentId) {
      query = query.or(`parent_id.eq.${parentId},is_global.eq.true`)
    } else if (global === 'true') {
      query = query.eq('is_global', true)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('parent_resources')
      .insert([{
        ...body,
        created_at: new Date().toISOString(),
      }])
      .select()

    if (error) throw error

    // Notify parent if it's targeted
    if (body.parent_id && !body.is_global) {
      await supabaseAdmin.from('notifications').insert([{
        user_id: body.parent_id,
        title: `📎 Nuevo material compartido`,
        message: `${body.title} - ${body.description || ''}`,
        type: 'resource',
        is_read: false,
        created_at: new Date().toISOString(),
      }]).then(() => {})
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const { error } = await supabaseAdmin.from('parent_resources').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
