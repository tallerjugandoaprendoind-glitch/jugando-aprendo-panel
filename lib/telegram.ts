// lib/telegram.ts
// Sistema de notificaciones Telegram para Vanty
// 100% GRATIS, sin límites prácticos, sin registro de empresa
//
// ══════════════════════════════════════════════════════════════
// SETUP (3 minutos):
//
//  1. Abrir Telegram → buscar @BotFather → /newbot
//     → Nombre del bot: "Vanty Jugando Aprendo"
//     → Username: vanty_jugandoaprendo_bot (o el que quieras)
//     → BotFather te da el TOKEN → guardarlo
//
//  2. Crear un grupo en Telegram "Vanty Alertas"
//     → Agregar el bot al grupo
//     → Enviar cualquier mensaje en el grupo
//     → Abrir en navegador:
//        https://api.telegram.org/bot<TOKEN>/getUpdates
//     → Copiar el "id" de "chat" (número negativo, ej: -1001234567890)
//
//  3. En Vercel → Settings → Environment Variables:
//     TELEGRAM_BOT_TOKEN = 7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//     TELEGRAM_CHAT_ID   = -1001234567890
//
// ══════════════════════════════════════════════════════════════

export type NotifTipo =
  | 'cita_confirmada' | 'cita_cancelada'
  | 'formulario_nuevo' | 'informe_nuevo'
  | 'alerta_clinica'  | 'mensaje_terapeuta'
  | 'recurso_nuevo'   | 'custom'

export type NotifLocale = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it'

export interface TelegramNotif {
  tipo: NotifTipo
  vars?: Record<string, string>
  locale?: NotifLocale
  chatId?: string   // override del chat destino (default: TELEGRAM_CHAT_ID)
}

// ── Templates multiidioma ─────────────────────────────────────────────────────
export function telegramTemplate(
  tipo: NotifTipo,
  vars: Record<string, string> = {},
  locale: NotifLocale = 'es'
): string {
  const v = vars
  const centro = process.env.CENTRO_NOMBRE || 'Jugando Aprendo'

  const T: Record<NotifTipo, Record<NotifLocale, string>> = {
    cita_confirmada: {
      es: `✅ *Cita confirmada*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n📍 ${v.tipo || 'Presencial'}\n\n_${centro} · Vanty_`,
      en: `✅ *Appointment confirmed*\n📅 ${v.fecha} at ${v.hora}\n👤 Patient: ${v.paciente}\n📍 ${v.tipo || 'In-person'}\n\n_${centro} · Vanty_`,
      pt: `✅ *Consulta confirmada*\n📅 ${v.fecha} às ${v.hora}\n👤 Paciente: ${v.paciente}\n📍 ${v.tipo || 'Presencial'}\n\n_${centro} · Vanty_`,
      fr: `✅ *Rendez-vous confirmé*\n📅 ${v.fecha} à ${v.hora}\n👤 Patient : ${v.paciente}\n📍 ${v.tipo || 'En personne'}\n\n_${centro} · Vanty_`,
      de: `✅ *Termin bestätigt*\n📅 ${v.fecha} um ${v.hora}\n👤 Patient: ${v.paciente}\n📍 ${v.tipo || 'Vor Ort'}\n\n_${centro} · Vanty_`,
      it: `✅ *Appuntamento confermato*\n📅 ${v.fecha} alle ${v.hora}\n👤 Paziente: ${v.paciente}\n📍 ${v.tipo || 'In presenza'}\n\n_${centro} · Vanty_`,
    },
    cita_cancelada: {
      es: `❌ *Cita cancelada*\n📅 ${v.fecha} a las ${v.hora}\n👤 Paciente: ${v.paciente}\n\nContactar recepción para reagendar.\n_${centro} · Vanty_`,
      en: `❌ *Appointment cancelled*\n📅 ${v.fecha} at ${v.hora}\n👤 Patient: ${v.paciente}\n\nContact reception to reschedule.\n_${centro} · Vanty_`,
      pt: `❌ *Consulta cancelada*\n📅 ${v.fecha} às ${v.hora}\n👤 Paciente: ${v.paciente}\n\nContacte a recepção para reagendar.\n_${centro} · Vanty_`,
      fr: `❌ *Rendez-vous annulé*\n📅 ${v.fecha} à ${v.hora}\n👤 Patient : ${v.paciente}\n\nContactez l'accueil.\n_${centro} · Vanty_`,
      de: `❌ *Termin abgesagt*\n📅 ${v.fecha} um ${v.hora}\n👤 Patient: ${v.paciente}\n\nBitte Rezeption kontaktieren.\n_${centro} · Vanty_`,
      it: `❌ *Appuntamento annullato*\n📅 ${v.fecha} alle ${v.hora}\n👤 Paziente: ${v.paciente}\n\nContatta la reception.\n_${centro} · Vanty_`,
    },
    formulario_nuevo: {
      es: `📋 *Formulario subido*\nTipo: ${v.tipo}\nPaciente: ${v.paciente}${v.especialista ? `\nEspecialista: ${v.especialista}` : ''}\n\nRevisar en portal 👆\n_${centro} · Vanty_`,
      en: `📋 *Form submitted*\nType: ${v.tipo}\nPatient: ${v.paciente}${v.especialista ? `\nSpecialist: ${v.especialista}` : ''}\n\nReview in portal 👆\n_${centro} · Vanty_`,
      pt: `📋 *Formulário enviado*\nTipo: ${v.tipo}\nPaciente: ${v.paciente}${v.especialista ? `\nEspecialista: ${v.especialista}` : ''}\n\nRevise no portal 👆\n_${centro} · Vanty_`,
      fr: `📋 *Formulaire soumis*\nType : ${v.tipo}\nPatient : ${v.paciente}${v.especialista ? `\nSpécialiste : ${v.especialista}` : ''}\n\nConsultez le portail 👆\n_${centro} · Vanty_`,
      de: `📋 *Formular eingereicht*\nTyp: ${v.tipo}\nPatient: ${v.paciente}${v.especialista ? `\nTherapeut: ${v.especialista}` : ''}\n\nPortal aufrufen 👆\n_${centro} · Vanty_`,
      it: `📋 *Modulo inviato*\nTipo: ${v.tipo}\nPaziente: ${v.paciente}${v.especialista ? `\nSpecialista: ${v.especialista}` : ''}\n\nConsulta il portale 👆\n_${centro} · Vanty_`,
    },
    informe_nuevo: {
      es: `📊 *Nuevo informe disponible*\nPaciente: ${v.paciente}${v.periodo ? `\nPeríodo: ${v.periodo}` : ''}\n\nVer en Vanty 👆\n_${centro}_`,
      en: `📊 *New report available*\nPatient: ${v.paciente}${v.periodo ? `\nPeriod: ${v.periodo}` : ''}\n\nView on Vanty 👆\n_${centro}_`,
      pt: `📊 *Novo relatório disponível*\nPaciente: ${v.paciente}${v.periodo ? `\nPeríodo: ${v.periodo}` : ''}\n\nVer no Vanty 👆\n_${centro}_`,
      fr: `📊 *Nouveau rapport disponible*\nPatient : ${v.paciente}${v.periodo ? `\nPériode : ${v.periodo}` : ''}\n\nConsultez Vanty 👆\n_${centro}_`,
      de: `📊 *Neuer Bericht verfügbar*\nPatient: ${v.paciente}${v.periodo ? `\nZeitraum: ${v.periodo}` : ''}\n\nVanty aufrufen 👆\n_${centro}_`,
      it: `📊 *Nuovo rapporto disponibile*\nPaziente: ${v.paciente}${v.periodo ? `\nPeriodo: ${v.periodo}` : ''}\n\nVedi su Vanty 👆\n_${centro}_`,
    },
    alerta_clinica: {
      es: `⚠️ *Alerta clínica*\nPaciente: ${v.paciente}\n${v.descripcion}\n\nRevisar Hub IA 🤖\n_${centro} · Vanty_`,
      en: `⚠️ *Clinical alert*\nPatient: ${v.paciente}\n${v.descripcion}\n\nCheck AI Hub 🤖\n_${centro} · Vanty_`,
      pt: `⚠️ *Alerta clínico*\nPaciente: ${v.paciente}\n${v.descripcion}\n\nVerificar Hub IA 🤖\n_${centro} · Vanty_`,
      fr: `⚠️ *Alerte clinique*\nPatient : ${v.paciente}\n${v.descripcion}\n\nVérifier Hub IA 🤖\n_${centro} · Vanty_`,
      de: `⚠️ *Klinischer Alarm*\nPatient: ${v.paciente}\n${v.descripcion}\n\nKI-Hub prüfen 🤖\n_${centro} · Vanty_`,
      it: `⚠️ *Allerta clinica*\nPaziente: ${v.paciente}\n${v.descripcion}\n\nControlla Hub IA 🤖\n_${centro} · Vanty_`,
    },
    mensaje_terapeuta: {
      es: `💬 *Mensaje del terapeuta*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nResponder en Vanty 👆\n_${centro}_`,
      en: `💬 *Message from therapist*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nReply on Vanty 👆\n_${centro}_`,
      pt: `💬 *Mensagem do terapeuta*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nResponder no Vanty 👆\n_${centro}_`,
      fr: `💬 *Message du thérapeute*\n👤 ${v.terapeuta}\n\n« ${v.preview} »\n\nRépondre sur Vanty 👆\n_${centro}_`,
      de: `💬 *Nachricht des Therapeuten*\n👤 ${v.terapeuta}\n\n„${v.preview}"\n\nAntworten auf Vanty 👆\n_${centro}_`,
      it: `💬 *Messaggio del terapeuta*\n👤 ${v.terapeuta}\n\n"${v.preview}"\n\nRispondi su Vanty 👆\n_${centro}_`,
    },
    recurso_nuevo: {
      es: `📚 *Nuevo recurso disponible*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nBiblioteca 📖\n_${centro} · Vanty_`,
      en: `📚 *New resource available*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nLibrary 📖\n_${centro} · Vanty_`,
      pt: `📚 *Novo recurso disponível*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nBiblioteca 📖\n_${centro} · Vanty_`,
      fr: `📚 *Nouvelle ressource*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nBibliothèque 📖\n_${centro} · Vanty_`,
      de: `📚 *Neue Ressource*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nBibliothek 📖\n_${centro} · Vanty_`,
      it: `📚 *Nuova risorsa*\n${v.titulo}${v.descripcion ? `\n${v.descripcion}` : ''}\n\nBiblioteca 📖\n_${centro} · Vanty_`,
    },
    custom: {
      es: v.mensaje || '', en: v.mensaje || '', pt: v.mensaje || '',
      fr: v.mensaje || '', de: v.mensaje || '', it: v.mensaje || '',
    },
  }

  return T[tipo]?.[locale] ?? T[tipo]?.['es'] ?? v.mensaje ?? ''
}

// ── Envío a Telegram ──────────────────────────────────────────────────────────
export async function sendTelegram(notif: TelegramNotif): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = notif.chatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[Telegram] No configurado — omitido:', notif.tipo)
    return false
  }

  const text = telegramTemplate(notif.tipo, notif.vars || {}, notif.locale || 'es')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_notification: false,
      }),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[Telegram] Error:', err)
      return false
    }

    console.log('[Telegram] ✅ Enviado:', notif.tipo)
    return true
  } catch (e) {
    console.error('[Telegram] Error (no crítico):', e)
    return false
  }
}

// ── Broadcast a múltiples chats ───────────────────────────────────────────────
export async function broadcastTelegram(
  chatIds: string[],
  tipo: NotifTipo,
  vars: Record<string, string>,
  locale: NotifLocale = 'es'
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    chatIds.map(chatId => sendTelegram({ chatId, tipo, vars, locale }))
  )
  const sent   = results.filter(r => r.status === 'fulfilled' && (r as any).value).length
  const failed = results.length - sent
  return { sent, failed }
}

// ── Helper rápido ─────────────────────────────────────────────────────────────
export async function notifyAdmin(
  tipo: NotifTipo,
  vars: Record<string, string>,
  locale: NotifLocale = 'es'
): Promise<void> {
  sendTelegram({ tipo, vars, locale }).catch(() => {})
}
