// app/api/google-calendar/route.ts
// Handles Google Calendar OAuth and event sync
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CALENDAR_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || ''
const REDIRECT_URI         = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`
  : 'http://localhost:3000/api/google-calendar/callback'

// ─── GET: generate OAuth URL ─────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  // Return OAuth URL for client to redirect to
  if (action === 'auth-url') {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
    ].join(' ')

    const userId = searchParams.get('userId') || ''

    const params = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         scopes,
      access_type:   'offline',
      prompt:        'consent',
      state:         userId, // pass userId through OAuth flow
    })

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    return NextResponse.json({ url })
  }

  // Check if user has connected Google Calendar
  if (action === 'status') {
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ connected: false })

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('google_calendar_token, google_calendar_email')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      connected: !!data?.google_calendar_token,
      email: data?.google_calendar_email || null,
    })
  }

  // Disconnect Google Calendar
  if (action === 'disconnect') {
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    await supabaseAdmin
      .from('profiles')
      .update({ google_calendar_token: null, google_calendar_refresh_token: null, google_calendar_email: null })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// ─── POST: sync appointment to Google Calendar ───────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, appointmentId, appointment } = body

    if (action === 'sync-appointment') {
      // Get user's Google token
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('google_calendar_token, google_calendar_refresh_token, google_calendar_email')
        .eq('id', userId)
        .single()

      if (!profile?.google_calendar_token) {
        return NextResponse.json({ ok: false, error: 'Google Calendar not connected' })
      }

      // Try to refresh token if needed
      let accessToken = profile.google_calendar_token
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id:     GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: profile.google_calendar_refresh_token || '',
            grant_type:    'refresh_token',
          }),
        })
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          accessToken = refreshData.access_token
          await supabaseAdmin.from('profiles').update({ google_calendar_token: accessToken }).eq('id', userId)
        }
      } catch { /* use existing token */ }

      // Fetch parent email from the appointment's child record
      let parentEmail: string | null = appointment.parentEmail || null
      if (!parentEmail && appointmentId) {
        const { data: apt } = await supabaseAdmin
          .from('appointments')
          .select('child_id, children(profiles!children_parent_id_fkey(email))')
          .eq('id', appointmentId)
          .single()
        parentEmail = (apt?.children as any)?.profiles?.email || null
      }
      if (!parentEmail && appointment.childId) {
        const { data: child } = await supabaseAdmin
          .from('children')
          .select('profiles!children_parent_id_fkey(email)')
          .eq('id', appointment.childId)
          .single()
        parentEmail = (child?.profiles as any)?.email || null
      }

      // Build event
      const { date, time, patientName, serviceType, notes, modality } = appointment
      const startISO = `${date}T${time}`
      const endDate  = new Date(new Date(startISO).getTime() + 60 * 60000)
      const endISO   = `${endDate.toISOString().slice(0, 16)}`

      // Attendees: always include admin's Google email + parent email if available
      const attendees: { email: string; displayName?: string }[] = []
      if (profile.google_calendar_email) {
        attendees.push({ email: profile.google_calendar_email, displayName: 'Terapeuta' })
      }
      if (parentEmail) {
        attendees.push({ email: parentEmail, displayName: `Familia — ${patientName}` })
      }

      const event: any = {
        summary:     `🧩 ${patientName} — ${serviceType || 'Sesión ABA'}`,
        description: `${modality === 'virtual' ? '📹 Sesión Virtual' : '📍 Sesión Presencial'}\nCentro: Jugando Aprendo${notes ? `\n📝 ${notes}` : ''}`,
        start: { dateTime: startISO + ':00', timeZone: 'America/Lima' },
        end:   { dateTime: endISO   + ':00', timeZone: 'America/Lima' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 1440 },
          ],
        },
        colorId: '9', // blueberry
        ...(attendees.length > 0 ? { attendees, guestsCanSeeOtherGuests: false } : {}),
        sendUpdates: attendees.some(a => a.displayName?.startsWith('Familia')) ? 'all' : 'none',
      }

      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=${event.sendUpdates}`,
        {
          method: 'POST',
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...event, sendUpdates: undefined }),
        }
      )

      if (!gcalRes.ok) {
        const err = await gcalRes.json()
        return NextResponse.json({ ok: false, error: err.error?.message || 'Google Calendar error' })
      }

      const gcalData = await gcalRes.json()

      if (appointmentId) {
        await supabaseAdmin
          .from('appointments')
          .update({ google_calendar_event_id: gcalData.id })
          .eq('id', appointmentId)
      }

      return NextResponse.json({
        ok: true,
        eventId: gcalData.id,
        eventUrl: gcalData.htmlLink,
        parentNotified: !!parentEmail,
        parentEmail,
      })
    }

    // Sync ALL upcoming appointments at once
    if (action === 'sync-all') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('google_calendar_token, google_calendar_refresh_token')
        .eq('id', userId)
        .single()

      if (!profile?.google_calendar_token) {
        return NextResponse.json({ ok: false, error: 'Google Calendar not connected' })
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: apts } = await supabaseAdmin
        .from('appointments')
        .select('*, children(name)')
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .is('google_calendar_event_id', null)
        .limit(50)

      let synced = 0
      for (const apt of apts || []) {
        const syncRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync-appointment',
            userId,
            appointmentId: apt.id,
            appointment: {
              date:        apt.appointment_date,
              time:        apt.appointment_time?.slice(0, 5),
              patientName: apt.children?.name || 'Paciente',
              serviceType: apt.service_type,
              notes:       apt.notes,
              modality:    apt.modalidad,
            },
          }),
        })
        if ((await syncRes.json()).ok) synced++
      }

      return NextResponse.json({ ok: true, synced })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
