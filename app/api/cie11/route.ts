// app/api/cie11/route.ts
import { NextRequest, NextResponse } from 'next/server'

const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token'

// En Vercel serverless el módulo se recarga frecuentemente — no usar caché de módulo
// Guardar en globalThis para sobrevivir warm invocations
declare global { var __cie11Token: { value: string; expires: number } | undefined }

async function getToken(): Promise<string | null> {
  const clientId     = process.env.WHO_ICD_CLIENT_ID     || ''
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) return null

  // Usar token cacheado en globalThis si sigue vigente (con 5 min de margen)
  if (globalThis.__cie11Token && Date.now() < globalThis.__cie11Token.expires - 300_000) {
    return globalThis.__cie11Token.value
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        scope: 'icdapi_access', grant_type: 'client_credentials',
      }),
    })
    if (!res.ok) { console.error('[CIE-11] Token error:', res.status); return null }
    const data = await res.json()
    globalThis.__cie11Token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
    console.log('[CIE-11] ✅ Token renovado, expira en:', Math.round(data.expires_in / 60), 'min')
    return globalThis.__cie11Token.value
  } catch (e) { console.error('[CIE-11] Token exception:', e); return null }
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

async function fetchWithFreshToken(url: string): Promise<any> {
  // Intentar con token existente
  let token = await getToken()
  if (!token) throw new Error('No token available')

  let res = await fetch(url, { headers: WHO_HEADERS(token) })

  // Si 401, forzar renovación del token y reintentar UNA vez
  if (res.status === 401) {
    console.log('[CIE-11] 401 recibido, renovando token...')
    globalThis.__cie11Token = undefined
    token = await getToken()
    if (!token) throw new Error('Token renewal failed')
    res = await fetch(url, { headers: WHO_HEADERS(token) })
  }

  if (!res.ok) throw new Error(`WHO API ${res.status}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const q      = searchParams.get('q')      || ''
  const code   = searchParams.get('code')   || ''

  // ── Debug ──────────────────────────────────────────────────────────────────
  if (action === 'debug') {
    const ok = !!(process.env.WHO_ICD_CLIENT_ID && process.env.WHO_ICD_CLIENT_SECRET)
    const tokenOk = !!globalThis.__cie11Token
    return NextResponse.json({ configured: ok, hasToken: tokenOk, clientIdPrefix: (process.env.WHO_ICD_CLIENT_ID||'').slice(0,8) })
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  if (action === 'search') {
    if (q.trim().length < 2) return NextResponse.json({ results: [], fallback: false })
    let token: string | null
    try { token = await getToken() } catch { token = null }
    if (!token) return NextResponse.json({ results: [], fallback: true })

    const SIGLAS: Record<string, string> = {
      'tea':'trastorno espectro autista', 'tdah':'déficit atención hiperactividad',
      'toc':'trastorno obsesivo compulsivo', 'tept':'estrés postraumático',
      'tnd':'negativista desafiante', 'tlp':'trastorno límite personalidad',
      'di':'discapacidad intelectual', 'dislexia':'dislexia lectura',
      'dispraxia':'coordinación desarrollo motor', 'discalculia':'discalculia matemáticas',
      'disgrafia':'disgrafia escritura', 'arfid':'evitación restricción ingesta alimentaria',
      'bipolar':'trastorno bipolar', 'esquizofrenia':'esquizofrenia psicosis',
      'ansiedad':'ansiedad generalizada', 'depresion':'depresivo mayor',
      'tdl':'desarrollo lenguaje', 'tourette':'síndrome tourette tics',
      'mutismo':'mutismo selectivo', 'enuresis':'enuresis', 'encopresis':'encopresis',
    }
    const qLow = q.toLowerCase().trim()
    const resolved = SIGLAS[qLow] || q

    try {
      const url = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
      url.searchParams.set('q', resolved)
      url.searchParams.set('useFlexisearch', 'true')
      url.searchParams.set('flatResults', 'true')
      url.searchParams.set('highlightingEnabled', 'false')
      url.searchParams.set('medicalCodingMode', 'false')
      url.searchParams.set('includeKeywordResult', 'true')

      const data = await fetchWithFreshToken(url.toString())
      const results = (data.destinationEntities || []).slice(0, 30).map((e: any) => ({
        id: e.id, code: e.theCode || '', title: e.title || '', chapter: e.chapter || '', isLeaf: e.isLeaf ?? true,
      }))
      return NextResponse.json({ results, fallback: false })
    } catch (e: any) {
      console.error('[CIE-11] Search error:', e.message)
      return NextResponse.json({ results: [], fallback: true, error: e.message })
    }
  }

  // ── Detalle completo ───────────────────────────────────────────────────────
  if (action === 'detail') {
    if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })

    try {
      let entityUrl = code

      // Si no es URL completa, buscar el ID numérico por código alfanumérico
      if (!code.startsWith('http')) {
        const searchUrl = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
        searchUrl.searchParams.set('q', code)
        searchUrl.searchParams.set('useFlexisearch', 'false')
        searchUrl.searchParams.set('flatResults', 'true')
        searchUrl.searchParams.set('highlightingEnabled', 'false')

        try {
          const sd = await fetchWithFreshToken(searchUrl.toString())
          const match = (sd.destinationEntities || []).find((e: any) => e.theCode === code)
          entityUrl = match?.id || `https://id.who.int/icd/release/11/2024-01/mms/${code}`
          console.log('[CIE-11] Resolved', code, '→', entityUrl)
        } catch {
          entityUrl = `https://id.who.int/icd/release/11/2024-01/mms/${code}`
        }
      }

      const d = await fetchWithFreshToken(entityUrl)
      console.log('[CIE-11] Detail keys:', Object.keys(d))

      // Parsear hijos sin hacer fetch adicional
      const children = (d.child || []).slice(0, 20).map((url: string) => {
        const parts = url.split('/')
        const raw = parts[parts.length - 1]
        return { id: url, code: raw === 'other' ? 'Otros' : raw === 'unspecified' ? 'Sin especificar' : raw, title: '' }
      })

      // Parsear padre sin fetch adicional
      let parent: { id: string; code: string; title: string } | null = null
      if (d.parent?.[0]) {
        const parts = (d.parent[0] as string).split('/')
        parent = { id: d.parent[0], code: parts[parts.length - 1] || '', title: '' }
      }

      const result = {
        code:        d.code || code,
        title:       extractText(d.title),
        definition:  extractText(d.definition) || extractText(d.longDefinition) || '',
        inclusions:  (d.inclusion  || []).map((i: any) => extractText(i.label)).filter(Boolean),
        exclusions:  (d.exclusion  || []).map((e: any) => extractText(e.label)).filter(Boolean),
        indexTerms:  (d.indexTerm  || []).map((t: any) => extractText(t.label)).filter(Boolean),
        codingNote:  extractText(d.codingNote),
        children,
        parent,
        browserUrl:  `https://icd.who.int/browse/2024-01/mms/es#${d.code || code}`,
      }

      console.log('[CIE-11] ✅ Returning:', result.code, '| def length:', result.definition.length, '| inclusions:', result.inclusions.length)
      return NextResponse.json(result)
    } catch (e: any) {
      console.error('[CIE-11] Detail error:', e.message)
      return NextResponse.json({ error: e.message, fallback: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action: search | detail | debug' }, { status: 400 })
}
