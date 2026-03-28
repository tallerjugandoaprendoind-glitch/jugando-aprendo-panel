// wsp-service/index.js
// Microservicio WhatsApp Baileys — Jugando Aprendo
// Deploy en Railway/Render, escanea QR una vez y queda conectado.
// ──────────────────────────────────────────────────────────────────
// Variables de entorno:
//   PORT              Puerto HTTP (default: 3001)
//   SERVICE_SECRET    Clave secreta para autenticar requests desde Vanty
//   ADMIN_PHONE       Número del admin (ej: +51924807183) para alertas internas

require('dotenv').config()

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const express  = require('express')
const pino     = require('pino')
const QRCode   = require('qrcode')

const PORT   = process.env.PORT || 3001
const SECRET = process.env.SERVICE_SECRET || 'changeme'

const logger = pino({ level: 'warn' })
const app    = express()
app.use(express.json())

// ── Estado global ─────────────────────────────────────────────────
let sock        = null
let qrBase64    = null   // QR como imagen base64 para mostrar en el panel
let isConnected = false
let isWaiting   = true   // true mientras genera el QR

// ── Autenticación de requests ─────────────────────────────────────
function auth(req, res, next) {
  const secret = req.headers['x-service-secret']
  if (secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// ── Iniciar/reconectar Baileys ────────────────────────────────────
async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const { version }          = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,   // también imprime en logs de Railway
    auth: state,
    browser: ['Jugando Aprendo', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 2_000,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // Convertir QR a imagen base64 para el panel admin
      qrBase64    = await QRCode.toDataURL(qr)
      isWaiting   = false
      isConnected = false
      console.log('📱 QR generado — escaneá desde el panel admin')
    }

    if (connection === 'open') {
      isConnected = true
      isWaiting   = false
      qrBase64    = null
      console.log('✅ WhatsApp conectado')
    }

    if (connection === 'close') {
      isConnected = false
      const code = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(`⚠️ Desconectado (código ${code}) — reconectando: ${shouldReconnect}`)
      if (shouldReconnect) {
        isWaiting = true
        setTimeout(startWhatsApp, 3000)
      } else {
        // Sesión cerrada — borrar credenciales para que pida QR de nuevo
        const fs = require('fs')
        if (fs.existsSync('./auth_info')) {
          fs.rmSync('./auth_info', { recursive: true, force: true })
        }
        isWaiting = true
        setTimeout(startWhatsApp, 3000)
      }
    }
  })
}

// ── Formatear número de teléfono ──────────────────────────────────
// Acepta: +51924807183, 51924807183, 924807183
// Retorna: 51924807183@s.whatsapp.net
function formatPhone(phone) {
  // Quitar todo excepto dígitos
  let digits = phone.replace(/\D/g, '')
  // Si viene sin código de país peruano, agregarlo
  if (digits.length === 9 && !digits.startsWith('51')) {
    digits = '51' + digits
  }
  return `${digits}@s.whatsapp.net`
}

// ── ENDPOINTS ─────────────────────────────────────────────────────

// GET /status — estado de la conexión
app.get('/status', auth, (req, res) => {
  res.json({
    connected: isConnected,
    waiting:   isWaiting && !isConnected,
    hasQr:     !!qrBase64,
  })
})

// GET /qr — obtener QR como imagen base64
app.get('/qr', auth, (req, res) => {
  if (isConnected) return res.json({ connected: true })
  if (!qrBase64)   return res.json({ waiting: true })
  res.json({ qr: qrBase64 })
})

// POST /send — enviar mensaje
// Body: { to: "+51924807183", message: "Hola!" }
app.post('/send', auth, async (req, res) => {
  const { to, message } = req.body

  if (!to || !message) {
    return res.status(400).json({ error: 'to y message son requeridos' })
  }

  if (!isConnected || !sock) {
    return res.status(503).json({ error: 'WhatsApp no conectado', connected: false })
  }

  try {
    const jid = formatPhone(to)
    await sock.sendMessage(jid, { text: message })
    console.log(`✅ Mensaje enviado a ${to}`)
    res.json({ ok: true, to })
  } catch (e) {
    console.error(`❌ Error enviando a ${to}:`, e.message)
    res.status(500).json({ error: e.message })
  }
})

// POST /broadcast — enviar a múltiples números
// Body: { phones: ["+51xxx", "+51yyy"], message: "Hola!" }
app.post('/broadcast', auth, async (req, res) => {
  const { phones, message } = req.body

  if (!phones?.length || !message) {
    return res.status(400).json({ error: 'phones[] y message son requeridos' })
  }

  if (!isConnected || !sock) {
    return res.status(503).json({ error: 'WhatsApp no conectado' })
  }

  const results = await Promise.allSettled(
    phones.map(async (phone) => {
      const jid = formatPhone(phone)
      await sock.sendMessage(jid, { text: message })
      return phone
    })
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.length - sent
  res.json({ ok: true, sent, failed, total: phones.length })
})

// GET /health — health check para Railway
app.get('/health', (req, res) => res.json({ ok: true }))

// ── Arrancar ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 wsp-service corriendo en puerto ${PORT}`)
  startWhatsApp()
})
