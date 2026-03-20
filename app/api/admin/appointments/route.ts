import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*, children(name, parent_id)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appointments = Array.isArray(body) ? body : [body]

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointments)
      .select('*, children(name)')

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json()
    if (!id || !status) throw new Error('id y status son requeridos')
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const locale = request.headers.get('x-locale') || 'es'

    // 1. Leer la cita ANTES de borrarla — necesitamos los event IDs y el especialista
    const { data: apt } = await supabaseAdmin
      .from('appointments')
      .select('id, google_calendar_event_id, microsoft_calendar_event_id, parent_google_calendar_event_id, parent_microsoft_calendar_event_id, created_by, child_id')
      .eq('id', id)
      .single()

    // 2. Borrar en Google Calendar si hay event ID
    if (apt?.google_calendar_event_id && apt?.created_by) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:  'delete-event',
            userId:  apt.created_by,
            eventId: apt.google_calendar_event_id,
          }),
        })
      } catch { /* silent — no bloquear el borrado de DB */ }
    }

    // 3. Borrar en Microsoft Calendar si hay event ID
    if (apt?.microsoft_calendar_event_id && apt?.created_by) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/microsoft-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:  'delete-event',
            userId:  apt.created_by,
            eventId: apt.microsoft_calendar_event_id,
          }),
        })
      } catch { /* silent */ }
    }

    // 4. Borrar eventos del PADRE en Google Calendar
    if (apt?.parent_google_calendar_event_id && apt?.child_id) {
      try {
        // Buscar parent_id del niño
        const { data: child } = await supabaseAdmin
          .from('children').select('parent_id').eq('id', apt.child_id).single()
        if (child?.parent_id) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action:  'delete-event',
              userId:  child.parent_id,
              eventId: apt.parent_google_calendar_event_id,
            }),
          })
        }
      } catch { /* silent */ }
    }

    // 5. Borrar eventos del PADRE en Microsoft Calendar
    if (apt?.parent_microsoft_calendar_event_id && apt?.child_id) {
      try {
        const { data: child } = await supabaseAdmin
          .from('children').select('parent_id').eq('id', apt.child_id).single()
        if (child?.parent_id) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/microsoft-calendar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action:  'delete-event',
              userId:  child.parent_id,
              eventId: apt.parent_microsoft_calendar_event_id,
            }),
          })
        }
      } catch { /* silent */ }
    }

    // 6. Borrar la cita en DB
    const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
