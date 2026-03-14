// lib/notifications.ts
// Capa unificada de notificaciones — Telegram (principal) + WhatsApp/Meta (fallback)
// Prioridad: Telegram > Meta WhatsApp Cloud API > CallMeBot
// Telegram es 100% gratis, sin límites, sin registro de empresa

import { sendTelegram, type NotifTipo, type NotifLocale } from './telegram'
import { sendWhatsApp, type WspTipo }                     from './whatsapp'

export type { NotifTipo, NotifLocale }

export interface Notif {
  tipo: NotifTipo
  vars?: Record<string, string>
  locale?: NotifLocale
}

// ── Detecta qué canal tiene credenciales configuradas ─────────────────────────
function getChannel(): 'telegram' | 'meta' | 'callmebot' | 'none' {
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) return 'telegram'
  if (process.env.META_WA_PHONE_ID   && process.env.META_WA_TOKEN)     return 'meta'
  if (process.env.CALLMEBOT_PHONE    && process.env.CALLMEBOT_APIKEY)  return 'callmebot'
  return 'none'
}

// ── Envío principal ───────────────────────────────────────────────────────────
export async function notify(notif: Notif): Promise<boolean> {
  const channel = getChannel()

  if (channel === 'telegram') {
    return sendTelegram(notif)
  }

  if (channel === 'meta' || channel === 'callmebot') {
    return sendWhatsApp({ tipo: notif.tipo as WspTipo, vars: notif.vars, locale: notif.locale })
  }

  console.log('[Notify] Sin canal configurado — omitido:', notif.tipo)
  return false
}

// ── Fire-and-forget (no bloquea la respuesta HTTP) ────────────────────────────
export function notifyAsync(notif: Notif): void {
  notify(notif).catch(() => {})
}

// ── Estado del canal activo ───────────────────────────────────────────────────
export function getNotifStatus() {
  const channel = getChannel()
  return {
    channel,
    configured: channel !== 'none',
    label: {
      telegram:  '✅ Telegram',
      meta:      '✅ WhatsApp Cloud API',
      callmebot: '⚠️ CallMeBot (limitado)',
      none:      '❌ Sin configurar',
    }[channel],
  }
}

// ── Enviar via microservicio WhatsApp Business (Baileys) ──────────────────────
// Usa WSP_SERVICE_URL + WSP_SERVICE_SECRET si están configurados
// Prioridad: Microservicio WSP > Telegram > Meta API > CallMeBot
export async function sendViaWspService(
  phone: string,
  message: string
): Promise<boolean> {
  const url    = process.env.WSP_SERVICE_URL
  const secret = process.env.WSP_SERVICE_SECRET
  if (!url || !secret) return false

  try {
    const res = await fetch(`${url}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-service-secret': secret },
      body: JSON.stringify({ to: phone, message }),
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Notificar a un padre directamente ────────────────────────────────────────
// Intenta WSP Service primero, luego fallback al canal admin
export async function notifyParentDirect(
  parentPhone: string | null | undefined,
  tipo: NotifTipo,
  vars: Record<string, string> = {},
  locale: NotifLocale = 'es'
): Promise<void> {
  if (!parentPhone) {
    // Sin número del padre → notificar solo al admin
    notifyAsync({ tipo, vars, locale })
    return
  }

  const wspUrl = process.env.WSP_SERVICE_URL
  if (wspUrl) {
    // Microservicio disponible → enviar directo al padre
    const { telegramTemplate } = await import('./telegram')
    // Reusar template de telegram (mismo formato) para el mensaje
    const message = telegramTemplate(tipo as any, vars, locale)
    const sent = await sendViaWspService(parentPhone, message)
    if (!sent) {
      // Fallback al canal admin
      notifyAsync({ tipo, vars, locale })
    }
  } else {
    // Sin microservicio → canal admin (CallMeBot/Telegram)
    notifyAsync({ tipo, vars, locale })
  }
}
