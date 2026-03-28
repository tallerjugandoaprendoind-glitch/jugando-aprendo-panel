// wsp-service/index.js — ESM version
// Microservicio WhatsApp Baileys — Jugando Aprendo

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync, rmSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import express from 'express'
import pino    from 'pino'
import QRCode  from 'qrcode'
import dotenv  from 'dotenv'

dotenv.config()

const PORT   = process.env.PORT || 3001
const SECRET = process.env.SERVICE_SECRET || 'changeme'

const logger = pino({ level: 'warn' })
const app    = express()
app.use(express.json())

// ── Estado global ─────────────────────────────────────────────────
let sock        = null
let qrBase64    = null
let isConnected = false
let isWaiting   = true

// ── Autenticación ─────────────────────────────────────────────────
function auth(req, res, next) {
  const secret = req.headers['x-service-secret']
  if (secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// ── WhatsApp ──────────────────────────────────────────────────────
async function startWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

    let version = [2, 3000, 1015901307]
    try {
      const result = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000))
      ])
      version = result.version
    } catch (e) {
      console.log('⚠️ Usando versión fallback de WA:', version)
    }

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
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
          if (existsSync('./auth_info')) {
            rmSync('./auth_info', { recursive: true, force: true })
          }
          isWaiting = true
          setTimeout(startWhatsApp, 3000)
        }
      }
    })
  } catch (err) {
    console.error('❌ Error en startWhatsApp:', err.message)
    isWaiting = true
    setTimeout(startWhatsApp, 5000)
  }
}

// ── Formatear teléfono ────────────────────────────────────────────
function formatPhone(phone) {
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 9 && !digits.startsWith('51')) {
    digits = '51' + digits
  }
  return `${digits}@s.whatsapp.net`
}

// ── ENDPOINTS ─────────────────────────────────────────────────────

app.get('/status', auth, (req, res) => {
  res.json({
    connected: isConnected,
    waiting:   isWaiting && !isConnected,
    hasQr:     !!qrBase64,
  })
})

app.get('/qr', auth, (req, res) => {
  if (isConnected) return res.json({ connected: true })
  if (!qrBase64)   return res.json({ waiting: true })
  res.json({ qr: qrBase64 })
})

app.post('/send', auth, async (req, res) => {
  const { to, message } = req.body
  if (!to || !message)
    return res.status(400).json({ error: 'to y message son requeridos' })
  if (!isConnected || !sock)
    return res.status(503).json({ error: 'WhatsApp no conectado', connected: false })
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

app.post('/broadcast', auth, async (req, res) => {
  const { phones, message } = req.body
  if (!phones?.length || !message)
    return res.status(400).json({ error: 'phones[] y message son requeridos' })
  if (!isConnected || !sock)
    return res.status(503).json({ error: 'WhatsApp no conectado' })

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

// Sin autenticación — Railway lo llama directamente
app.get('/health', (req, res) => res.json({ ok: true }))

// ── Arrancar ──────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ unhandledRejection:', reason?.message || reason)
})
process.on('uncaughtException', (err) => {
  console.error('⚠️ uncaughtException:', err.message)
})

app.listen(PORT, () => {
  console.log(`🚀 wsp-service corriendo en puerto ${PORT}`)
  startWhatsApp().catch(err => {
    console.error('❌ startWhatsApp falló al inicio:', err.message)
    setTimeout(startWhatsApp, 5000)
  })
})
