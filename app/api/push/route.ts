import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ── VAPID helpers (sin librería externa) ─────────────────────────────────────
const { webcrypto } = require('crypto')
const crypto = webcrypto

function b64uToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/').padEnd(b64u.length + (4 - b64u.length % 4) % 4, '=')
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

function bytesToB64u(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

async function signVapidJwt(audience: string): Promise<string> {
  const privateKeyBytes = b64uToBytes(process.env.VAPID_PRIVATE_KEY!)
  const privateKey = await crypto.subtle.importKey(
    'raw', privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const now = Math.floor(Date.now() / 1000)
  const header = bytesToB64u(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = bytesToB64u(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 43200,
    sub: 'mailto:hola@vanty.app',
  })))

  const sigInput = new TextEncoder().encode(`${header}.${payload}`)
  const sigRaw = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, sigInput)

  // Convert DER signature to raw R+S (64 bytes)
  const der = new Uint8Array(sigRaw)
  let offset = 2
  const rLen = der[offset + 1]; offset += 2
  const r = der.slice(offset + (rLen > 32 ? 1 : 0), offset + rLen); offset += rLen
  const sLen = der[offset + 1]; offset += 2
  const s = der.slice(offset + (sLen > 32 ? 1 : 0), offset + sLen)
  const sig = new Uint8Array(64)
  sig.set(r.slice(-32), 32 - Math.min(r.length, 32))
  sig.set(s.slice(-32), 64 - Math.min(s.length, 32))

  return `${header}.${payload}.${bytesToB64u(sig)}`
}

// ── Encrypt push payload with ECDH + AES-GCM ─────────────────────────────────
async function encryptPayload(payload: string, subscription: PushSubscription): Promise<{ ciphertext: Buffer; salt: Buffer; serverPublicKey: Buffer }> {
  const sub = subscription as any
  const clientPublicKey = b64uToBytes(sub.keys.p256dh)
  const clientAuthSecret = b64uToBytes(sub.keys.auth)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey))

  const clientKey = await crypto.subtle.importKey('raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeyPair.privateKey, 256)

  // HKDF for auth and content encryption keys (RFC 8188)
  const hkdf = async (ikm: ArrayBuffer, salt: Uint8Array, info: Uint8Array, len: number) => {
    const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, baseKey, len * 8))
  }

  const prk = await hkdf(sharedBits, clientAuthSecret,
    new TextEncoder().encode('Content-Encoding: auth\0'),
    32)

  const context = new Uint8Array([
    ...new TextEncoder().encode('P-256\0'),
    0, 65, ...clientPublicKey,
    0, 65, ...serverPublicKeyRaw,
  ])
  const cek = await hkdf(prk, salt, new Uint8Array([...new TextEncoder().encode('Content-Encoding: aesgcm\0'), ...context]), 16)
  const nonce = await hkdf(prk, salt, new Uint8Array([...new TextEncoder().encode('Content-Encoding: nonce\0'), ...context]), 12)

  const encKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const data = new TextEncoder().encode(payload)
  const padded = new Uint8Array([0, 0, ...data]) // 2 byte padding
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, encKey, padded)

  return { ciphertext: Buffer.from(encrypted), salt: Buffer.from(salt), serverPublicKey: Buffer.from(serverPublicKeyRaw) }
}

interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

// ── Send a push notification to one subscription ─────────────────────────────
async function sendPush(subscription: PushSubscription, title: string, body: string, url = '/padre') {
  const payload = JSON.stringify({ title, body, url, icon: '/icons/icon-192x192.png', badge: '/icons/icon-96x96.png' })
  const { ciphertext, salt, serverPublicKey } = await encryptPayload(payload, subscription)

  const endpoint = new URL(subscription.endpoint)
  const audience = `${endpoint.protocol}//${endpoint.host}`
  const jwt = await signVapidJwt(audience)

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  const authHeader = `vapid t=${jwt},k=${vapidPublicKey}`

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'Encryption': `salt=${bytesToB64u(salt)}`,
      'Crypto-Key': `dh=${bytesToB64u(serverPublicKey)};p256ecdsa=${vapidPublicKey}`,
      'TTL': '86400',
    },
    body: ciphertext,
  })

  return res
}

// ── API Route ─────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json()

    // Get all subscriptions for this user
    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions found' })
    }

    const results = await Promise.allSettled(
      subs.map(async (row: any) => {
        const sub = row.subscription as PushSubscription
        const res = await sendPush(sub, title, body, url)
        if (res.status === 410) {
          // Subscription expired — remove it
          await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId)
        }
        return res.status
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent, total: subs.length })

  } catch (error: any) {
    console.error('Push error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
