// app/api/cie11/route.ts
import { NextRequest, NextResponse } from 'next/server'

const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token'

let cachedToken: { value: string; expires: number } | null = null

async function getToken(): Promise<string | null> {
  // Leer variables en tiempo de ejecución (no en carga del módulo)
  const clientId     = process.env.WHO_ICD_CLIENT_ID     || ''
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    console.warn('[CIE-11] Variables WHO_ICD_CLIENT_ID / WHO_ICD_CLIENT_SECRET no encontradas')
    return null
  }

  if (cachedToken && Date.now() < cachedToken.expires - 60_000) {
    return cachedToken.value
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         'icdapi_access',
        grant_type:    'client_credentials',
      }),
    })

    if (!res.ok) {
      const txt = await res.text()
      console.error('[CIE-11] Token error:', res.status, txt)
      return null
    }

    const data = await res.json()
    cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
    console.log('[CIE-11] ✅ Token obtenido exitosamente')
    return cachedToken.value
  } catch (e) {
    console.error('[CIE-11] Token exception:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const q      = searchParams.get('q')    || ''
  const code   = searchParams.get('code') || ''

  // ── Debug endpoint ──────────────────────────────────────────────────────
  if (action === 'debug') {
    const clientId     = process.env.WHO_ICD_CLIENT_ID     || ''
    const clientSecret = process.env.WHO_ICD_CLIENT_SECRET || ''
    return NextResponse.json({
      hasClientId:     !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdPrefix:  clientId ? clientId.slice(0, 8) + '...' : 'NOT SET',
    })
  }

  // ── Búsqueda ────────────────────────────────────────────────────────────
  if (action === 'search' && q.trim().length >= 2) {
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ results: [], fallback: true })
    }

    try {
      const searchUrl = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
      searchUrl.searchParams.set('q', q)
      searchUrl.searchParams.set('useFlexisearch', 'true')
      searchUrl.searchParams.set('flatResults', 'false')
      searchUrl.searchParams.set('highlightingEnabled', 'false')
      searchUrl.searchParams.set('medicalCodingMode', 'true')

      const res = await fetch(searchUrl.toString(), {
        headers: {
          Authorization:     `Bearer ${token}`,
          'Accept':          'application/json',
          'Accept-Language': 'es',
          'API-Version':     'v2',
        },
      })

      if (!res.ok) {
        console.error('[CIE-11] Search error:', res.status, await res.text())
        return NextResponse.json({ results: [], error: `WHO API ${res.status}`, fallback: true })
      }

      const data = await res.json()
      const results = (data.destinationEntities || []).slice(0, 30).map((e: any) => ({
        id:         e.id,
        code:       e.theCode  || '',
        title:      e.title    || '',
        definition: e.definition || '',
        chapter:    e.chapter  || '',
        isLeaf:     e.isLeaf   ?? true,
      }))

      return NextResponse.json({ results, total: data.resultChopped ? '30+' : results.length })
    } catch (e: any) {
      console.error('[CIE-11] Search exception:', e)
      return NextResponse.json({ results: [], error: e.message, fallback: true })
    }
  }

  // ── Detalle ─────────────────────────────────────────────────────────────
  if (action === 'detail' && code) {
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'No token', fallback: true }, { status: 503 })

    try {
      const entityUrl = code.startsWith('http')
        ? code
        : `https://id.who.int/icd/release/11/2024-01/mms/${code}`

      const res = await fetch(entityUrl, {
        headers: {
          Authorization:     `Bearer ${token}`,
          'Accept':          'application/json',
          'Accept-Language': 'es',
          'API-Version':     'v2',
        },
      })

      if (!res.ok) return NextResponse.json({ error: `WHO API ${res.status}`, fallback: true }, { status: res.status })

      const data = await res.json()
      return NextResponse.json({
        code:       data.code,
        title:      data.title?.['@value']      || '',
        definition: data.definition?.['@value'] || '',
        inclusions: (data.inclusion || []).map((i: any) => i.label?.['@value'] || ''),
        exclusions: (data.exclusion || []).map((e: any) => e.label?.['@value'] || ''),
        browserUrl: `https://icd.who.int/browse/2024-01/mms/es#${data.code}`,
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message, fallback: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action requerida: search | detail | debug' }, { status: 400 })
}
