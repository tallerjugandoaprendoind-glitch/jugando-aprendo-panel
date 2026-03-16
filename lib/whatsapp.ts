// lib/whatsapp.ts
// Sistema de notificaciones WhatsApp para Vanty
//
// ══════════════════════════════════════════════════════════════
// PROVEEDOR ACTIVO: CallMeBot (gratuito, ~50 mensajes/día)
//   ✅ Compatible con números peruanos (+51) — cualquier WhatsApp activo
//   Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
//   Env: CALLMEBOT_PHONE (ej: +51999888777), CALLMEBOT_APIKEY
//
// UPGRADE DISPONIBLE: Meta WhatsApp Cloud API
//   Gratis: 1.000 conversaciones de servicio/mes
//   Permite notificar a CUALQUIER número (padres, terapeutas, etc.)
//   Env: META_WA_PHONE_ID, META_WA_TOKEN, META_WA_TEMPLATE_*
//   Setup: https://developers.facebook.com/docs/whatsapp/cloud-api
// ══════════════════════════════════════════════════════════════

export type WspProvider = 'callmebot' | 'meta'
export type WspTipo =
  | 'cita_confirmada' | 'cita_cancelada'
  | 'formulario_nuevo' | 'informe_nuevo'
  | 'alerta_clinica'  | 'mensaje_terapeuta'
  | 'recurso_nuevo'   | 'custom'

export type WspLocale = 'es'

export interface WspNotification {
  to?: string
  tipo: WspTipo
  vars?: Record<string, string>
  locale?: WspLocale
  provider?: WspProvider
}

// ── Detectar qué proveedor usar ───────────────────────────────────────────────
function getProvider(): WspProvider {
  if (process.env.META_WA_PHONE_ID && process.env.META_WA_TOKEN) return 'meta'
  return 'callmebot'
}

// ── Templates multiidioma ─────────────────────────────────────────────────────
export function wspTemplate(tipo: WspTipo, vars: Record<string, string> = {}, locale: WspLocale = 'es'): string {
  const v = vars
  const centro = process.env.CENTRO_NOMBRE || 'Jugando Aprendo'

  const T: Record<WspTipo, string> = {
    cita_confirmada:   `✅ *Cita confirmada — ${centro}*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n📍 ${v.tipo || 'Presencial'}\n\n_Vanty · ${centro}_ 💜`,
    cita_cancelada:    `❌ *Cita cancelada — ${centro}*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n\nContactá a recepción para reagendar.\n_Vanty · ${centro}_ 💜`,
    formulario_nuevo:  `📋 *Formulario subido — ${centro}*\nTipo: ${v.tipo}\nPaciente: ${v.paciente}${v.especialista ? `\nEspecialista: ${v.especialista}` : ''}\n\nRevisalo en tu portal 👆\n_Vanty_ 💜`,
    informe_nuevo:     `📊 *Nuevo informe disponible — ${centro}*\nPaciente: ${v.paciente}${v.periodo ? `\nPeríodo: ${v.periodo}` : ''}\n\nYa podés verlo en Vanty 👆\n_${centro}_ 💜`,
    alerta_clinica:    `⚠️ *Alerta clínica — ${centro}*\nPaciente: ${v.paciente}\n${v.descripcion}\n\nRevisá el Hub IA 🤖\n_Vanty_ 💜`,
    mensaje_terapeuta: `💬 *Mensaje de tu terapeuta — ${centro}*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nRespondé en Vanty 👆\n_${centro}_ 💜`,
    recurso_nuevo:     `📚 *Nuevo recurso — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nEncontralo en la Biblioteca 📖\n_Vanty_ 💜`,
    custom:            v.mensaje || '',
  }

  return T[tipo] ?? v.mensaje ?? ''
}

// ── CallMeBot ─────────────────────────────────────────────────────────────────
async function sendCallMeBot(phone: string, apikey: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    return res.ok
  } catch {
    return false
  }
}

// ── Meta WhatsApp Cloud API ───────────────────────────────────────────────────
// Requiere: META_WA_PHONE_ID, META_WA_TOKEN
// Soporta mensajes de texto libre (dentro de ventana 24h) y templates pre-aprobados
async function sendMeta(to: string, message: string): Promise<boolean> {
  const phoneId = process.env.META_WA_PHONE_ID
  const token   = process.env.META_WA_TOKEN
  if (!phoneId || !token) return false

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''), // solo dígitos
          type: 'text',
          text: { body: message },
        }),
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('[WhatsApp/Meta] Error:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[WhatsApp/Meta] Error:', e)
    return false
  }
}

// ── Envío principal ───────────────────────────────────────────────────────────
export async function sendWhatsApp(notif: WspNotification): Promise<boolean> {
  const { to, tipo, vars = {}, locale = 'es', provider } = notif
  const activeProvider = provider ?? getProvider()
  const message = wspTemplate(tipo, vars, locale)

  // ── CallMeBot: siempre al número del admin del centro ─────────────────────
  if (activeProvider === 'callmebot') {
    const phone  = process.env.CALLMEBOT_PHONE
    const apikey = process.env.CALLMEBOT_APIKEY
    if (!phone || !apikey) {
      console.log('[WhatsApp/CallMeBot] No configurado — omitido:', tipo)
      return false
    }
    const ok = await sendCallMeBot(phone, apikey, message)
    console.log(`[WhatsApp/CallMeBot] ${ok ? '✅' : '❌'} ${tipo}`)
    return ok
  }

  // ── Meta Cloud API: puede notificar a cualquier número ────────────────────
  if (activeProvider === 'meta') {
    const dest = to ?? process.env.META_WA_DEFAULT_PHONE ?? process.env.CALLMEBOT_PHONE
    if (!dest) {
      console.log('[WhatsApp/Meta] Sin número destino — omitido:', tipo)
      return false
    }
    const ok = await sendMeta(dest, message)
    console.log(`[WhatsApp/Meta] ${ok ? '✅' : '❌'} ${tipo} → ${dest}`)
    return ok
  }

  return false
}

// ── Notificar a múltiples destinatarios (Meta) ────────────────────────────────
export async function broadcastWhatsApp(
  phones: string[],
  tipo: WspTipo,
  vars: Record<string, string>,
  locale: WspLocale = 'es'
): Promise<{ sent: number; failed: number }> {
  if (getProvider() !== 'meta') {
    // CallMeBot no soporta broadcast — enviar solo al admin
    const ok = await sendWhatsApp({ tipo, vars, locale })
    return { sent: ok ? 1 : 0, failed: ok ? 0 : 1 }
  }

  const results = await Promise.allSettled(
    phones.map(phone => sendWhatsApp({ to: phone, tipo, vars, locale, provider: 'meta' }))
  )

  const sent   = results.filter(r => r.status === 'fulfilled' && r.value).length
  const failed = results.length - sent
  return { sent, failed }
}

// ── Helper rápido para notificar al admin ─────────────────────────────────────
export async function notifyAdmin(tipo: WspTipo, vars: Record<string, string>, locale: WspLocale = 'es'): Promise<void> {
  sendWhatsApp({ tipo, vars, locale }).catch(() => {})
}

// ── Notificar a un padre específico (requiere Meta Cloud API para número externo) ──
// Con CallMeBot solo llega al admin. Con Meta API llega al padre directamente.
export async function notifyParent(
  parentPhone: string | null | undefined,
  tipo: WspTipo,
  vars: Record<string, string>,
  locale: WspLocale = 'es'
): Promise<void> {
  const provider = getProvider()

  if (provider === 'meta' && parentPhone) {
    // Meta API: notificar directo al padre Y al admin
    sendWhatsApp({ to: parentPhone, tipo, vars, locale, provider: 'meta' }).catch(() => {})
    sendWhatsApp({ tipo, vars, locale, provider: 'meta' }).catch(() => {})
  } else {
    // CallMeBot: solo al admin (incluir nombre del padre en el mensaje para contexto)
    sendWhatsApp({ tipo, vars, locale }).catch(() => {})
  }
}
