// app/api/whatsapp/route.ts (ahora delega a lib/notifications.ts)
// Soporta Telegram, Meta WhatsApp Cloud API, CallMeBot
// Prioridad automática: Telegram > Meta > CallMeBot

import { NextRequest, NextResponse } from 'next/server'
import { notify, getNotifStatus, type NotifTipo, type NotifLocale } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tipo,
      vars,
      locale = 'es' as NotifLocale,
      guardar = true,
      userId,
      childId,
    } = body

    if (!tipo) return NextResponse.json({ error: 'tipo requerido' }, { status: 400 })

    const sent = await notify({ tipo: tipo as NotifTipo, vars: vars || {}, locale })

    if (guardar && userId) {
      const tipoLabels: Record<string, string> = {
        cita_confirmada:   'Nueva cita agendada',
        cita_cancelada:    'Cita cancelada',
        formulario_nuevo:  'Formulario subido',
        informe_nuevo:     'Informe disponible',
        alerta_clinica:    'Alerta clínica',
        mensaje_terapeuta: 'Mensaje del terapeuta',
        recurso_nuevo:     'Nuevo recurso',
      }
      await supabaseAdmin.from('notificaciones').insert({
        user_id:    userId,
        child_id:   childId || null,
        tipo,
        titulo:     tipoLabels[tipo] || tipo,
        leida:      false,
        created_at: new Date().toISOString(),
      }).maybeSingle()
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: estado del canal activo
export async function GET() {
  const status = getNotifStatus()
  return NextResponse.json({
    ...status,
    canales: {
      telegram:  { vars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'], gratis: true, limite: 'Sin límite práctico' },
      meta:      { vars: ['META_WA_PHONE_ID', 'META_WA_TOKEN'],     gratis: true, limite: '1.000 conv/mes' },
      callmebot: { vars: ['CALLMEBOT_PHONE', 'CALLMEBOT_APIKEY'],   gratis: true, limite: '~50 msg/día', nota: 'Servicio poco confiable' },
    },
  })
}
