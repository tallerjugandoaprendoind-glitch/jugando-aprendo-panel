import { NextRequest, NextResponse } from 'next/server'

const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token'

async function getToken(): Promise<string | null> {
  const clientId     = process.env.WHO_ICD_CLIENT_ID     || ''
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) return null
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
    const d = await res.json()
    return d.access_token
  } catch { return null }
}

const H = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Accept-Language': 'es',
  'API-Version': 'v2',
})

function txt(v: any): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  // API v2: { "@language": "es", "@value": "..." }
  if (v['@value']) return v['@value']
  // Array of language objects — buscar español primero, luego cualquiera
  if (Array.isArray(v)) {
    const es = v.find((x: any) => x['@language'] === 'es' || x['@language'] === 'es-ES')
    if (es) return es['@value'] || ''
    const any = v.find((x: any) => x['@value'])
    if (any) return any['@value'] || ''
    return v.map(txt).filter(Boolean).join(', ')
  }
  return ''
}

const SIGLAS: Record<string, string> = {
  'tea':'trastorno espectro autista', 'tdah':'déficit atención hiperactividad',
  'toc':'trastorno obsesivo compulsivo', 'tept':'estrés postraumático',
  'tnd':'negativista desafiante', 'tlp':'trastorno límite personalidad',
  'di':'discapacidad intelectual', 'dislexia':'dislexia lectura',
  'dispraxia':'coordinación desarrollo motor', 'discalculia':'discalculia matemáticas',
  'disgrafia':'disgrafia escritura', 'arfid':'evitación restricción ingesta',
  'bipolar':'trastorno bipolar', 'esquizofrenia':'esquizofrenia psicosis',
  'ansiedad':'ansiedad generalizada', 'depresion':'depresivo mayor',
  'tourette':'síndrome tourette tics', 'mutismo':'mutismo selectivo',
  'enuresis':'enuresis', 'encopresis':'encopresis',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const q      = searchParams.get('q')      || ''
  const code   = searchParams.get('code')   || ''

  if (action === 'debug') {
    return NextResponse.json({
      configured: !!(process.env.WHO_ICD_CLIENT_ID && process.env.WHO_ICD_CLIENT_SECRET),
      clientIdPrefix: (process.env.WHO_ICD_CLIENT_ID||'').slice(0,8),
    })
  }

  // ── BÚSQUEDA ──────────────────────────────────────────────────────────────
  if (action === 'search') {
    if (q.trim().length < 2) return NextResponse.json({ results: [], fallback: false })
    const token = await getToken()
    if (!token) return NextResponse.json({ results: [], fallback: true })
    const resolved = SIGLAS[q.toLowerCase().trim()] || q
    try {
      const url = new URL('https://id.who.int/icd/release/11/2024-01/mms/search')
      url.searchParams.set('q', resolved)
      url.searchParams.set('useFlexisearch', 'true')
      url.searchParams.set('flatResults', 'true')
      url.searchParams.set('highlightingEnabled', 'false')
      url.searchParams.set('includeKeywordResult', 'true')
      const res = await fetch(url.toString(), { headers: H(token) })
      if (!res.ok) return NextResponse.json({ results: [], fallback: true })
      const data = await res.json()
      const results = (data.destinationEntities || []).slice(0, 30).map((e: any) => ({
        id: e.id, code: e.theCode || '', title: e.title || '', chapter: e.chapter || '',
      }))
      return NextResponse.json({ results, fallback: false })
    } catch { return NextResponse.json({ results: [], fallback: true }) }
  }

  // ── DETALLE ────────────────────────────────────────────────────────────────
  if (action === 'detail') {
    if (!code) return NextResponse.json({ error: 'code requerido' }, { status: 400 })

    // Obtener token fresco siempre para el detalle
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'No token', fallback: true }, { status: 503 })

    try {
      // Usar la URL directamente si ya es una URL completa (viene del resultado de búsqueda)
      const baseUrl = code.startsWith('http')
        ? code
        : `https://id.who.int/icd/release/11/2024-01/mms/${code}`

      // Incluir criterios diagnósticos (disponible para trastornos mentales cap.06)
      const entityUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'include=diagnosticCriteria'

      console.log('[CIE-11] Fetching detail:', baseUrl.split('/').pop())

      const res = await fetch(entityUrl, { headers: H(token) })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[CIE-11] Detail HTTP error:', res.status, errText.slice(0, 200))
        return NextResponse.json({ error: `WHO ${res.status}`, fallback: true }, { status: res.status })
      }

      const d = await res.json()
      console.log('[CIE-11] Raw keys:', Object.keys(d).join(', '))
      console.log('[CIE-11] definition raw:', JSON.stringify(d.definition)?.slice(0, 200))
      console.log('[CIE-11] inclusion count:', (d.inclusion||[]).length)

      // Subcategorías: devolver IDs para que el frontend pueda navegar
      const children = (d.child || []).slice(0, 20).map((url: string) => {
        const seg = url.split('/').pop() || ''
        const label = seg === 'other' ? 'Otro especificado' : seg === 'unspecified' ? 'Sin especificación' : seg
        return { id: url, code: label, title: '' }
      })

      // Categoría padre
      let parent: { id: string; code: string; title: string } | null = null
      if (d.parent?.[0]) {
        const seg = (d.parent[0] as string).split('/').pop() || ''
        parent = { id: d.parent[0], code: seg, title: '' }
      }

      // Criterios diagnósticos (cap. 06 trastornos mentales)
      const diagnosticCriteria = txt(d.diagnosticCriteria) || ''

      return NextResponse.json({
        code:       d.code || '',
        title:      txt(d.title),
        definition: txt(d.definition) || txt(d.longDefinition) || '',
        inclusions: (d.inclusion  || []).map((i: any) => txt(i.label)).filter(Boolean),
        exclusions: (d.exclusion  || []).map((e: any) => txt(e.label)).filter(Boolean),
        indexTerms: (d.indexTerm  || []).map((t: any) => txt(t.label)).filter(Boolean),
        codingNote: txt(d.codingNote),
        diagnosticCriteria,
        children,
        parent,
        browserUrl: `https://icd.who.int/browse/2024-01/mms/es#${d.code || ''}`,
      })
    } catch (e: any) {
      console.error('[CIE-11] Detail exception:', e.message)
      return NextResponse.json({ error: e.message, fallback: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action: search|detail|debug' }, { status: 400 })
}
