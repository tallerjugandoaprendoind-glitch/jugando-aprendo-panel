// app/api/cie11/route.ts — Proxy API OMS CIE-11
import { NextRequest, NextResponse } from 'next/server'

const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token'
let cachedToken: { value: string; expires: number } | null = null

async function getToken(): Promise<string | null> {
  const clientId     = process.env.WHO_ICD_CLIENT_ID     || ''
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) return null
  if (cachedToken && Date.now() < cachedToken.expires - 60_000) return cachedToken.value
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        scope: 'icdapi_access', grant_type: 'client_credentials',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
    return cachedToken.value
  } catch { return null }
}

const WHO_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Accept-Language': 'es',
  'API-Version': 'v2',
})

function extractText(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val['@value']) return val['@value']
  if (Array.isArray(val)) return val.map(extractText).filter(Boolean).join(', ')
  return ''
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const q      = searchParams.get('q')      || ''
  const code   = searchParams.get('code')   || ''

  // ── Debug ─────────────────────────────────────────────────────────────────
  if (action === 'debug') {
    const ok = !!(process.env.WHO_ICD_CLIENT_ID && process.env.WHO_ICD_CLIENT_SECRET)
    return NextResponse.json({ configured: ok, clientIdPrefix: (process.env.WHO_ICD_CLIENT_ID || '').slice(0, 8) })
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  if (action === 'search') {
    if (q.trim().length < 2) return NextResponse.json({ results: [], fallback: false })
    const token = await getToken()
    if (!token) return NextResponse.json({ results: [], fallback: true })

    try {
      // Buscar en español Y en inglés para cubrir siglas como TEA, TDAH, etc.
      const queries = [q]
      const SIGLAS: Record<string, string> = {
        'tea':'autism spectrum disorder', 'tdah':'attention deficit hyperactivity', 'toc':'obsessive compulsive',
        'tept':'post traumatic stress', 'tnd':'oppositional defiant', 'tlp':'borderline personality',
        'di':'intellectual disability', 'dislexia':'dyslexia', 'dispraxia':'developmental coordination',
        'discalculia':'dyscalculia', 'disgrafia':'dysgraphia', 'arfid':'avoidant restrictive food',
        'bipolar':'bipolar', 'esquizofrenia':'schizophrenia', 'ansiedad':'anxiety', 'depresion':'depressive',
        'tdl':'developmental language', 'tme':'stereotyped movement',
      }
      const qLow = q.toLowerCase().trim()
      if (SIGLAS[qLow]) queries.push(SIGLAS[qLow])

      const allResults: any[] = []
      const seen = new Set<string>()

      for (const query of queries) {
        const url = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
        url.searchParams.set('q', query)
        url.searchParams.set('useFlexisearch', 'true')
        url.searchParams.set('flatResults', 'true')
        url.searchParams.set('highlightingEnabled', 'false')
        url.searchParams.set('medicalCodingMode', 'false')
        url.searchParams.set('includeKeywordResult', 'true')

        const res = await fetch(url.toString(), { headers: WHO_HEADERS(token) })
        if (!res.ok) continue
        const data = await res.json()

        for (const e of data.destinationEntities || []) {
          if (seen.has(e.id)) continue
          seen.add(e.id)
          allResults.push({
            id:      e.id,
            code:    e.theCode   || '',
            title:   e.title     || '',
            chapter: e.chapter   || '',
            isLeaf:  e.isLeaf    ?? true,
          })
        }
        if (allResults.length >= 30) break
      }

      return NextResponse.json({ results: allResults.slice(0, 30), fallback: false })
    } catch (e: any) {
      return NextResponse.json({ results: [], fallback: true, error: e.message })
    }
  }

  // ── Detalle completo de un código ────────────────────────────────────────
  if (action === 'detail') {
    if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })
    const token = await getToken()
    if (!token) return NextResponse.json({ fallback: true }, { status: 503 })

    try {
      let entityUrl = code
      if (!code.startsWith('http')) {
        // El código alfanumérico (ej: 6A02) necesita resolverse a ID numérico via search
        const searchUrl = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
        searchUrl.searchParams.set('q', code)
        searchUrl.searchParams.set('useFlexisearch', 'false')
        searchUrl.searchParams.set('flatResults', 'true')
        searchUrl.searchParams.set('highlightingEnabled', 'false')
        const sr = await fetch(searchUrl.toString(), { headers: WHO_HEADERS(token) })
        if (sr.ok) {
          const sd = await sr.json()
          const match = (sd.destinationEntities || []).find((e: any) => e.theCode === code)
          entityUrl = match?.id || `https://id.who.int/icd/release/11/2024-01/mms/search?q=${code}`
          if (match?.id) {
            entityUrl = match.id
          } else {
            // Intentar directamente con el código como path (algunos funcionan)
            entityUrl = `https://id.who.int/icd/release/11/2024-01/mms/${code}`
          }
        } else {
          entityUrl = `https://id.who.int/icd/release/11/2024-01/mms/${code}`
        }
      }

      const res = await fetch(entityUrl, { headers: WHO_HEADERS(token) })
      if (!res.ok) return NextResponse.json({ error: `WHO ${res.status}`, fallback: true }, { status: res.status })

      const d = await res.json()

      // NO hacer fetch de hijos/padre aquí — demasiadas peticiones causan 401
      // Devolver las URLs y dejar que el frontend las pida de a una si el usuario navega

      // Parsear hijos: la API devuelve URLs completas, extraer el código del path
      const children = (d.child || []).slice(0, 20).map((url: string) => {
        const parts = url.split('/')
        const rawCode = parts[parts.length - 1]
        const childCode = rawCode === 'other' ? 'Y' : rawCode === 'unspecified' ? 'Z' : rawCode
        return { id: url, code: childCode, title: '' }
      })

      // Parsear padre
      let parent: { id: string; code: string; title: string } | null = null
      if (d.parent?.[0]) {
        const parts = (d.parent[0] as string).split('/')
        parent = { id: d.parent[0], code: parts[parts.length - 1] || '', title: '' }
      }

      return NextResponse.json({
        code:        d.code || '',
        title:       extractText(d.title),
        definition:  extractText(d.definition) || extractText(d.longDefinition) || '',
        inclusions:  (d.inclusion  || []).map((i: any) => extractText(i.label)).filter(Boolean),
        exclusions:  (d.exclusion  || []).map((e: any) => extractText(e.label)).filter(Boolean),
        indexTerms:  (d.indexTerm  || []).map((t: any) => extractText(t.label)).filter(Boolean),
        codingNote:  extractText(d.codingNote),
        children,
        parent,
        browserUrl:  `https://icd.who.int/browse/2024-01/mms/es#${d.code}`,
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message, fallback: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action: search | detail | debug' }, { status: 400 })
}
