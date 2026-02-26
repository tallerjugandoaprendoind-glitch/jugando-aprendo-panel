import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DAILY_API = 'https://api.daily.co/v1'
const MONTHLY_LIMIT_MINUTES = 10000

// ── GET: obtener uso actual del mes ──────────────────────────────────────────
export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data, error } = await supabaseAdmin
      .from('video_sessions')
      .select('duration_minutes')
      .gte('started_at', monthStart)

    if (error) throw error

    const used = (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const remaining = Math.max(0, MONTHLY_LIMIT_MINUTES - used)
    const percentage = Math.round((used / MONTHLY_LIMIT_MINUTES) * 100)

    return NextResponse.json({ used, remaining, percentage, limit: MONTHLY_LIMIT_MINUTES })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── POST: crear sala de videollamada y enviar al padre ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const { appointment_id, child_id, initiated_by } = await req.json()

    const apiKey = process.env.DAILY_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'DAILY_API_KEY no configurada' }, { status: 500 })

    // 1. Verificar límite mensual
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: sessions } = await supabaseAdmin
      .from('video_sessions')
      .select('duration_minutes')
      .gte('started_at', monthStart)

    const used = (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    if (used >= MONTHLY_LIMIT_MINUTES) {
      return NextResponse.json({
        error: 'Límite mensual de videollamadas alcanzado (10,000 min). Se reinicia el próximo mes.',
        limitReached: true,
      }, { status: 429 })
    }

    // 2. Crear sala en Daily.co (expira en 2 horas)
    const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60
    const roomName = `jugando-aprendo-${appointment_id || Date.now()}`

    const dailyRes = await fetch(`${DAILY_API}/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: expiresAt,
          max_participants: 4,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: 'local',
          start_video_off: false,
          start_audio_off: false,
          lang: 'es',
        },
      }),
    })

    if (!dailyRes.ok) {
      const err = await dailyRes.text()
      throw new Error(`Daily.co error: ${err}`)
    }

    const room = await dailyRes.json()

    // 3. Guardar sesión en Supabase
    const { data: session, error: dbErr } = await supabaseAdmin
      .from('video_sessions')
      .insert({
        appointment_id,
        child_id,
        room_name: room.name,
        room_url: room.url,
        initiated_by,
        started_at: new Date().toISOString(),
        status: 'waiting',        // waiting → active → ended
        duration_minutes: 0,
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    // 4. Notificar al padre con la URL
    if (child_id) {
      const { data: child } = await supabaseAdmin
        .from('children')
        .select('parent_id')
        .eq('id', child_id)
        .single()

      if (child?.parent_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: child.parent_id,
          type: 'video_call',
          title: '📹 Videollamada lista',
          message: 'Tu terapeuta te está esperando en una videollamada. ¡Únete ahora!',
          metadata: {
            room_url: room.url,
            session_id: session.id,
            appointment_id,
          },
          is_read: false,
        })
      }
    }

    return NextResponse.json({
      room_url: room.url,
      room_name: room.name,
      session_id: session.id,
      expires_at: expiresAt,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── PATCH: finalizar sesión y registrar duración ─────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { session_id, duration_minutes } = await req.json()

    await supabaseAdmin
      .from('video_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_minutes: Math.ceil(duration_minutes || 0),
      })
      .eq('id', session_id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
