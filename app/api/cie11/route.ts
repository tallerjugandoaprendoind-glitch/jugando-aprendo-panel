// app/api/cie11/route.ts
// Proxy para la API oficial CIE-11 de la OMS
// Documentación: https://icd.who.int/icdapi
import { NextRequest, NextResponse } from 'next/server'

const WHO_CLIENT_ID     = process.env.WHO_ICD_CLIENT_ID     || ''
const WHO_CLIENT_SECRET = process.env.WHO_ICD_CLIENT_SECRET || ''
const TOKEN_URL         = 'https://icdaccessmanagement.who.int/connect/token'
const API_BASE          = 'https://id.who.int/icd/release/11/2024-01/mms'

// Cache del token en memoria (serverless — se pierde entre invocaciones frías)
let cachedToken: { value: string; expires: number } | null = null

async function getToken(): Promise<string | null> {
  // Devolver token cacheado si sigue vigente (con 60s de margen)
  if (cachedToken && Date.now() < cachedToken.expires - 60_000) {
    return cachedToken.value
  }

  if (!WHO_CLIENT_ID || !WHO_CLIENT_SECRET) {
    console.warn('[CIE-11] WHO_ICD_CLIENT_ID / WHO_ICD_CLIENT_SECRET no configurados')
    return null
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     WHO_CLIENT_ID,
        client_secret: WHO_CLIENT_SECRET,
        scope:         'icdapi_access',
        grant_type:    'client_credentials',
      }),
    })

    if (!res.ok) {
      console.error('[CIE-11] Token error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    cachedToken = {
      value:   data.access_token,
      expires: Date.now() + data.expires_in * 1000,
    }
    return cachedToken.value
  } catch (e) {
    console.error('[CIE-11] Token fetch exception:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const q      = searchParams.get('q')      || ''
  const code   = searchParams.get('code')   || ''

  // ── Búsqueda por texto ────────────────────────────────────────────────────
  if (action === 'search' && q.trim().length >= 2) {
    const token = await getToken()

    if (!token) {
      // Fallback: devuelve resultado vacío pero con un flag para que el frontend
      // muestre el buscador local en su lugar
      return NextResponse.json({ results: [], fallback: true })
    }

    try {
      const searchUrl = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
      searchUrl.searchParams.set('q', q)
      searchUrl.searchParams.set('subtreesFilter', 'http://id.who.int/icd/release/11/2024-01/mms') // toda la clasificación
      searchUrl.searchParams.set('includeKeywordResult', 'true')
      searchUrl.searchParams.set('useFlexisearch', 'true')
      searchUrl.searchParams.set('flatResults', 'false')
      searchUrl.searchParams.set('highlightingEnabled', 'false')
      searchUrl.searchParams.set('medicalCodingMode', 'true')

      const res = await fetch(searchUrl.toString(), {
        headers: {
          Authorization:           `Bearer ${token}`,
          'Accept':                'application/json',
          'Accept-Language':       'es',
          'API-Version':           'v2',
        },
      })

      if (!res.ok) {
        const txt = await res.text()
        console.error('[CIE-11] Search error:', res.status, txt)
        return NextResponse.json({ results: [], error: `WHO API ${res.status}`, fallback: true })
      }

      const data = await res.json()

      // Transformar los resultados al formato que usa el frontend
      const results = (data.destinationEntities || []).slice(0, 30).map((e: any) => ({
        id:        e.id,
        code:      e.theCode || '',
        title:     e.title   || '',
        definition: e.definition || '',
        chapter:   e.chapter || '',
        isLeaf:    e.isLeaf  ?? true,
        matchType: e.matchingPVs?.[0]?.label || 'title',
      }))

      return NextResponse.json({ results, total: data.resultChopped ? '30+' : results.length })
    } catch (e: any) {
      console.error('[CIE-11] Search exception:', e)
      return NextResponse.json({ results: [], error: e.message, fallback: true })
    }
  }

  // ── Detalle de un código específico ──────────────────────────────────────
  if (action === 'detail' && code) {
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'No token', fallback: true }, { status: 503 })

    try {
      // El id puede ser la URI completa o solo el código
      const entityUrl = code.startsWith('http')
        ? code
        : `${API_BASE}/${code}`

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
        code:        data.code,
        title:       data.title?.['@value'] || '',
        definition:  data.definition?.['@value'] || '',
        inclusions:  (data.inclusion || []).map((i: any) => i.label?.['@value'] || ''),
        exclusions:  (data.exclusion || []).map((e: any) => e.label?.['@value'] || ''),
        parent:      data.parent?.[0] || null,
        children:    data.child || [],
        browserUrl:  `https://icd.who.int/browse/2024-01/mms/es#${data.code}`,
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message, fallback: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action requerida: search | detail' }, { status: 400 })
}
