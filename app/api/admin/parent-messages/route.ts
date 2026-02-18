import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending_approval'

    const { data, error } = await supabaseAdmin
      .from('parent_message_approvals')
      .select(`
        *,
        children!parent_message_approvals_child_id_fkey(name, birth_date),
        profiles!parent_message_approvals_parent_id_fkey(full_name, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { child_id, parent_id, source, source_title, ai_message, ai_analysis, session_data } = body

    const { data, error } = await supabaseAdmin
      .from('parent_message_approvals')
      .insert([{
        child_id, parent_id, source, source_title,
        ai_message,
        edited_message: ai_message,
        ai_analysis, session_data,
        status: 'pending_approval',
        created_at: new Date().toISOString(),
      }])
      .select()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, edited_message, action } = body

    if (action === 'approve') {
      const { data: record, error: fetchError } = await supabaseAdmin
        .from('parent_message_approvals')
        .select('*, children(name), profiles(full_name)')
        .eq('id', id)
        .single()

      if (fetchError || !record) throw new Error('Mensaje no encontrado')

      const messageToSend = edited_message || record.edited_message || record.ai_message
      const childName = (record as any).children?.name || 'su hijo/a'

      // Notify parent
      await supabaseAdmin.from('notifications').insert([{
        user_id: record.parent_id,
        title: `📋 Mensaje sobre ${childName}`,
        message: messageToSend,
        type: 'parent_message',
        metadata: { source: record.source, source_title: record.source_title, child_id: record.child_id, ai_analysis: record.ai_analysis },
        is_read: false,
        created_at: new Date().toISOString(),
      }])

      const { data, error } = await supabaseAdmin
        .from('parent_message_approvals')
        .update({ edited_message: messageToSend, status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id).select()

      if (error) throw error
      return NextResponse.json({ data })

    } else if (action === 'reject') {
      const { data, error } = await supabaseAdmin
        .from('parent_message_approvals')
        .update({ status: 'rejected', approved_at: new Date().toISOString() })
        .eq('id', id).select()
      if (error) throw error
      return NextResponse.json({ data })

    } else {
      const { data, error } = await supabaseAdmin
        .from('parent_message_approvals')
        .update({ edited_message })
        .eq('id', id).select()
      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const { error } = await supabaseAdmin.from('parent_message_approvals').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
