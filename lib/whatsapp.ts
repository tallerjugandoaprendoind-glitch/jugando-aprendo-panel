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

  const T: Record<WspTipo, Record<WspLocale, string>> = {
    cita_confirmada: {
      es: `✅ *Cita confirmada — ${centro}*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n📍 ${v.tipo || 'Presencial'}\n\n_Vanty · ${centro}_ 💜`,
      en: `✅ *Appointment confirmed — ${centro}*\n📅 ${v.fecha} at ${v.hora}\n👤 Patient: ${v.paciente}\n📍 ${v.tipo || 'In-person'}\n\n_Vanty · ${centro}_ 💜`,
      pt: `✅ *Consulta confirmada — ${centro}*\n📅 ${v.fecha} às ${v.hora}\n👤 Paciente: ${v.paciente}\n📍 ${v.tipo || 'Presencial'}\n\n_Vanty · ${centro}_ 💜`,
      fr: `✅ *Rendez-vous confirmé — ${centro}*\n📅 ${v.fecha} à ${v.hora}\n👤 Patient : ${v.paciente}\n📍 ${v.tipo || 'En personne'}\n\n_Vanty · ${centro}_ 💜`,
      de: `✅ *Termin bestätigt — ${centro}*\n📅 ${v.fecha} um ${v.hora}\n👤 Patient: ${v.paciente}\n📍 ${v.tipo || 'Vor Ort'}\n\n_Vanty · ${centro}_ 💜`,
      it: `✅ *Appuntamento confermato — ${centro}*\n📅 ${v.fecha} alle ${v.hora}\n👤 Paziente: ${v.paciente}\n📍 ${v.tipo || 'In presenza'}\n\n_Vanty · ${centro}_ 💜`,
    },
    cita_cancelada: {
      es: `❌ *Cita cancelada — ${centro}*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n\nContactá a recepción para reagendar.\n_Vanty · ${centro}_ 💜`,
      en: `❌ *Appointment cancelled — ${centro}*\n📅 ${v.fecha} at ${v.hora}\n👤 Patient: ${v.paciente}\n\nContact reception to reschedule.\n_Vanty · ${centro}_ 💜`,
      pt: `❌ *Consulta cancelada — ${centro}*\n📅 ${v.fecha} às ${v.hora}\n👤 Paciente: ${v.paciente}\n\nContate a recepção para reagendar.\n_Vanty · ${centro}_ 💜`,
      fr: `❌ *Rendez-vous annulé — ${centro}*\n📅 ${v.fecha} à ${v.hora}\n👤 Patient : ${v.paciente}\n\nContactez l'accueil pour reprogrammer.\n_Vanty · ${centro}_ 💜`,
      de: `❌ *Termin abgesagt — ${centro}*\n📅 ${v.fecha} um ${v.hora}\n👤 Patient: ${v.paciente}\n\nBitte Rezeption kontaktieren.\n_Vanty · ${centro}_ 💜`,
      it: `❌ *Appuntamento annullato — ${centro}*\n📅 ${v.fecha} alle ${v.hora}\n👤 Paziente: ${v.paciente}\n\nContatta la reception per riprogrammare.\n_Vanty · ${centro}_ 💜`,
    },
    formulario_nuevo: {
      es: `📋 *Formulario subido — ${centro}*\nTipo: ${v.tipo}\nPaciente: ${v.paciente}${v.especialista ? `\nEspecialista: ${v.especialista}` : ''}\n\nRevisalo en tu portal 👆\n_Vanty_ 💜`,
      en: `📋 *Form submitted — ${centro}*\nType: ${v.tipo}\nPatient: ${v.paciente}${v.especialista ? `\nSpecialist: ${v.especialista}` : ''}\n\nReview it in your portal 👆\n_Vanty_ 💜`,
      pt: `📋 *Formulário enviado — ${centro}*\nTipo: ${v.tipo}\nPaciente: ${v.paciente}${v.especialista ? `\nEspecialista: ${v.especialista}` : ''}\n\nRevise no seu portal 👆\n_Vanty_ 💜`,
      fr: `📋 *Formulaire soumis — ${centro}*\nType : ${v.tipo}\nPatient : ${v.paciente}${v.especialista ? `\nSpécialiste : ${v.especialista}` : ''}\n\nConsultez votre portail 👆\n_Vanty_ 💜`,
      de: `📋 *Formular eingereicht — ${centro}*\nTyp: ${v.tipo}\nPatient: ${v.paciente}${v.especialista ? `\nTherapeut: ${v.especialista}` : ''}\n\nPortal aufrufen 👆\n_Vanty_ 💜`,
      it: `📋 *Modulo inviato — ${centro}*\nTipo: ${v.tipo}\nPaziente: ${v.paciente}${v.especialista ? `\nSpecialista: ${v.especialista}` : ''}\n\nConsulta il portale 👆\n_Vanty_ 💜`,
    },
    informe_nuevo: {
      es: `📊 *Nuevo informe disponible — ${centro}*\nPaciente: ${v.paciente}${v.periodo ? `\nPeríodo: ${v.periodo}` : ''}\n\nYa podés verlo en Vanty 👆\n_${centro}_ 💜`,
      en: `📊 *New report available — ${centro}*\nPatient: ${v.paciente}${v.periodo ? `\nPeriod: ${v.periodo}` : ''}\n\nView it on Vanty 👆\n_${centro}_ 💜`,
      pt: `📊 *Novo relatório disponível — ${centro}*\nPaciente: ${v.paciente}${v.periodo ? `\nPeríodo: ${v.periodo}` : ''}\n\nVisualize no Vanty 👆\n_${centro}_ 💜`,
      fr: `📊 *Nouveau rapport disponible — ${centro}*\nPatient : ${v.paciente}${v.periodo ? `\nPériode : ${v.periodo}` : ''}\n\nConsultez-le sur Vanty 👆\n_${centro}_ 💜`,
      de: `📊 *Neuer Bericht verfügbar — ${centro}*\nPatient: ${v.paciente}${v.periodo ? `\nZeitraum: ${v.periodo}` : ''}\n\nJetzt auf Vanty abrufen 👆\n_${centro}_ 💜`,
      it: `📊 *Nuovo rapporto disponibile — ${centro}*\nPaziente: ${v.paciente}${v.periodo ? `\nPeriodo: ${v.periodo}` : ''}\n\nConsulta Vanty 👆\n_${centro}_ 💜`,
    },
    alerta_clinica: {
      es: `⚠️ *Alerta clínica — ${centro}*\nPaciente: ${v.paciente}\n${v.descripcion}\n\nRevisá el Hub IA 🤖\n_Vanty_ 💜`,
      en: `⚠️ *Clinical alert — ${centro}*\nPatient: ${v.paciente}\n${v.descripcion}\n\nCheck the AI Hub 🤖\n_Vanty_ 💜`,
      pt: `⚠️ *Alerta clínico — ${centro}*\nPaciente: ${v.paciente}\n${v.descripcion}\n\nVerifique o Hub IA 🤖\n_Vanty_ 💜`,
      fr: `⚠️ *Alerte clinique — ${centro}*\nPatient : ${v.paciente}\n${v.descripcion}\n\nVérifiez le Hub IA 🤖\n_Vanty_ 💜`,
      de: `⚠️ *Klinischer Alarm — ${centro}*\nPatient: ${v.paciente}\n${v.descripcion}\n\nKI-Hub prüfen 🤖\n_Vanty_ 💜`,
      it: `⚠️ *Allerta clinica — ${centro}*\nPaziente: ${v.paciente}\n${v.descripcion}\n\nControlla l'Hub IA 🤖\n_Vanty_ 💜`,
    },
    mensaje_terapeuta: {
      es: `💬 *Mensaje de tu terapeuta — ${centro}*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nRespondé en Vanty 👆\n_${centro}_ 💜`,
      en: `💬 *Message from your therapist — ${centro}*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nReply on Vanty 👆\n_${centro}_ 💜`,
      pt: `💬 *Mensagem do seu terapeuta — ${centro}*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nResponda no Vanty 👆\n_${centro}_ 💜`,
      fr: `💬 *Message de votre thérapeute — ${centro}*\n👤 ${v.terapeuta}\n\n« ${v.preview} »\n\nRépondez sur Vanty 👆\n_${centro}_ 💜`,
      de: `💬 *Nachricht Ihres Therapeuten — ${centro}*\n👤 ${v.terapeuta}\n\n„${v.preview}"\n\nAntworten auf Vanty 👆\n_${centro}_ 💜`,
      it: `💬 *Messaggio dal tuo terapeuta — ${centro}*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nRispondi su Vanty 👆\n_${centro}_ 💜`,
    },
    recurso_nuevo: {
      es: `📚 *Nuevo recurso — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nEncontralo en la Biblioteca 📖\n_Vanty_ 💜`,
      en: `📚 *New resource — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nFind it in the Library 📖\n_Vanty_ 💜`,
      pt: `📚 *Novo recurso — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nEncontre na Biblioteca 📖\n_Vanty_ 💜`,
      fr: `📚 *Nouvelle ressource — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nTrouvez-la dans la Bibliothèque 📖\n_Vanty_ 💜`,
      de: `📚 *Neue Ressource — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nIn der Bibliothek verfügbar 📖\n_Vanty_ 💜`,
      it: `📚 *Nuova risorsa — ${centro}*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nTrovala nella Biblioteca 📖\n_Vanty_ 💜`,
    },
    custom: {
      es: v.mensaje || '', en: v.mensaje || '', pt: v.mensaje || '',
      fr: v.mensaje || '', de: v.mensaje || '', it: v.mensaje || '',
    },
  }

  return T[tipo]?.[locale] ?? T[tipo]?.['es'] ?? v.mensaje ?? ''
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
