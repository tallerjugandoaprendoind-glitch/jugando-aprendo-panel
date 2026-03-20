// app/api/microsoft-calendar/route.ts
// Handles Microsoft (Outlook) Calendar OAuth and event sync
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MS_CLIENT_ID     = process.env.MICROSOFT_CALENDAR_CLIENT_ID     || ''
const MS_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET || ''
const MS_TENANT        = process.env.MICROSOFT_TENANT_ID || '3e32a281-36d9-4099-8105-e9460f1ab7a7'
const REDIRECT_URI     = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/microsoft-calendar/callback`
  : 'http://localhost:3000/api/microsoft-calendar/callback'

// ─── GET ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'auth-url') {
    const userId = searchParams.get('userId') || ''
    const scopes = [
      'openid', 'profile', 'email', 'offline_access',
      'Calendars.ReadWrite',
    ].join(' ')

    const params = new URLSearchParams({
      client_id:     MS_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  REDIRECT_URI,
      scope:         scopes,
      response_mode: 'query',
      state:         userId,
    })

    const url = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${params}`
    return NextResponse.json({ url })
  }

  if (action === 'status') {
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ connected: false })

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('microsoft_calendar_token, microsoft_calendar_email')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      connected: !!data?.microsoft_calendar_token,
      email: data?.microsoft_calendar_email || null,
    })
  }

  if (action === 'disconnect') {
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    await supabaseAdmin
      .from('profiles')
      .update({
        microsoft_calendar_token: null,
        microsoft_calendar_refresh_token: null,
        microsoft_calendar_email: null,
      })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// ─── POST: sync appointment ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, appointmentId, appointment } = body

    if (action === 'sync-appointment') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('microsoft_calendar_token, microsoft_calendar_refresh_token, microsoft_calendar_email')
        .eq('id', userId)
        .single()

      if (!profile?.microsoft_calendar_token) {
        return NextResponse.json({ ok: false, error: 'Microsoft Calendar not connected' })
      }

      // Refresh token if needed
      let accessToken = profile.microsoft_calendar_token
      try {
        const refreshRes = await fetch(
          `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id:     MS_CLIENT_ID,
              client_secret: MS_CLIENT_SECRET,
              refresh_token: profile.microsoft_calendar_refresh_token || '',
              grant_type:    'refresh_token',
              scope:         'Calendars.ReadWrite offline_access',
            }),
          }
        )
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          accessToken = refreshData.access_token
          await supabaseAdmin
            .from('profiles')
            .update({ microsoft_calendar_token: accessToken })
            .eq('id', userId)
        }
      } catch { /* use existing token */ }

      // Fetch parent email if not provided
      let parentEmail: string | null = appointment.parentEmail || null
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
      
      // Construir hora como string local sin conversión UTC (evita desfase Vercel)
      const timeClean = (time || '00:00').slice(0, 5)
      const [hh, mm] = timeClean.split(':').map(Number)
      const endHH = String(Math.floor((hh * 60 + mm + 60) / 60) % 24).padStart(2, '0')
      const endMM = String((mm + 60) % 60).padStart(2, '0')
      const startISO = `${date}T${timeClean}:00`
      const endISO   = `${date}T${endHH}:${endMM}:00`
      
      const nombrePaciente = (patientName || '').trim() || 'Paciente'
      const tituloEvento   = `🧩 ${nombrePaciente} — ${serviceType || 'Sesión ABA'}`

      const attendees = []
      if (parentEmail) {
        attendees.push({
          emailAddress: { address: parentEmail, name: `Familia — ${patientName}` },
          type: 'required',
        })
      }

      const event: any = {
        subject: tituloEvento,
        body: {
          contentType: 'HTML',
          content: `
            <b>${modality === 'virtual' ? '📹 Sesión Virtual' : '📍 Sesión Presencial'}</b><br/>
            Centro: Jugando Aprendo<br/>
            Paciente: ${patientName}<br/>
            ${notes ? `📝 ${notes}` : ''}
          `,
        },
        start: { dateTime: startISO, timeZone: 'SA Pacific Standard Time' },
        end:   { dateTime: endISO,   timeZone: 'SA Pacific Standard Time' },
        isReminderOn: true,
        reminderMinutesBeforeStart: 60,
        ...(attendees.length > 0 ? { attendees } : {}),
      }

      const msRes = await fetch(
        'https://graph.microsoft.com/v1.0/me/events',
        {
          method: 'POST',
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!msRes.ok) {
        const err = await msRes.json()
        return NextResponse.json({ ok: false, error: err.error?.message || 'Microsoft Calendar error' })
      }

      const msData = await msRes.json()

      if (appointmentId) {
        await supabaseAdmin
          .from('appointments')
          .update({ microsoft_calendar_event_id: msData.id })
          .eq('id', appointmentId)
      }

      return NextResponse.json({
        ok: true,
        eventId: msData.id,
        eventUrl: msData.webLink,
        parentNotified: !!parentEmail,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
