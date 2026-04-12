// app/api/chat-familias/route.ts
// Chat grupal privado por familia — padre + admin + especialistas
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET — cargar mensajes de un child_id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  const userId  = searchParams.get('user_id')  // para marcar como leídos
  const limit   = Number(searchParams.get('limit') || 60)

  if (!childId) return NextResponse.json({ error: 'child_id requerido' }, { status: 400 })

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_familias')
      .select('id, content, sender_id, sender_role, sender_name, read_by, message_type, file_url, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    // Marcar como leídos en background si viene userId
    if (userId && data?.length) {
      const toUpdate = data.filter(m => !m.read_by?.includes(userId))
      for (const m of toUpdate) {
        supabaseAdmin
          .from('chat_familias')
          .update({ read_by: [...(m.read_by || []), userId] })
          .eq('id', m.id)
          .then(() => {}).catch(() => {})
      }
    }

    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — enviar mensaje
export async function POST(req: NextRequest) {
  try {
    const { child_id, content, sender_id, sender_role, sender_name, message_type, file_url } = await req.json()

    if (!child_id || !content?.trim() || !sender_id || !sender_name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('chat_familias')
      .insert({
        child_id,
        content:      content.trim(),
        sender_id,
        sender_role:  sender_role || 'padre',
        sender_name,
        message_type: message_type || 'text',
        file_url:     file_url || null,
        read_by:      [sender_id],  // el remitente ya lo "leyó"
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — marcar mensajes como leídos
export async function PATCH(req: NextRequest) {
  try {
    const { child_id, user_id } = await req.json()
    if (!child_id || !user_id) return NextResponse.json({ ok: false })

    // Obtener mensajes no leídos por este usuario
    const { data: msgs } = await supabaseAdmin
      .from('chat_familias')
      .select('id, read_by')
      .eq('child_id', child_id)
      .not('sender_id', 'eq', user_id)

    const toUpdate = (msgs || []).filter(m => !m.read_by?.includes(user_id))

    for (const m of toUpdate) {
      await supabaseAdmin
        .from('chat_familias')
        .update({ read_by: [...(m.read_by || []), user_id] })
        .eq('id', m.id)
    }

    return NextResponse.json({ ok: true, marked: toUpdate.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
