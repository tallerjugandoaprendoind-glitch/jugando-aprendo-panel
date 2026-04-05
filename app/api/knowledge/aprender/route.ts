// app/api/knowledge/aprender/route.ts
// 🧠 CEREBRO IA — Aprendizaje automático desde internet
//
// El usuario da palabras clave → el sistema:
// 1. Busca fuentes especializadas (PubMed, Wikipedia, libros ABA, artículos)
// 2. Descarga y extrae el contenido de cada fuente
// 3. Genera embeddings y lo indexa en la base de conocimiento
// 4. ARIA y todos los agentes ya pueden usar ese conocimiento

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument } from '@/lib/knowledge-base'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { getLangInstruction } from '@/lib/lang'

// ─── Fuentes de conocimiento ──────────────────────────────────────────────────
// Clínicas: PubMed, ERIC, Semantic Scholar, OpenAlex, CrossRef
// Generales: Groq Compound (búsqueda web IA), Wikipedia ES/EN (sin key)
const FUENTES_BASE = [
  {
    nombre: 'PubMed',
    tipo: 'pubmed',
    buildUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
    buildFullUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
  },
  {
    nombre: 'ERIC (Educación Especial)',
    tipo: 'eric',
    buildUrl: (q: string) => `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(q)}&format=json&rows=5`,
    buildFullUrl: (q: string) => `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(q)}&format=json&rows=5`,
  },
  {
    nombre: 'Semantic Scholar (ABA)',
    tipo: 'semantic_scholar',
    buildUrl: (q: string) => `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q + ' applied behavior analysis')}&limit=5&fields=title,abstract,year,authors`,
    buildFullUrl: (q: string) => `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q + ' applied behavior analysis')}&limit=5&fields=title,abstract,year,authors`,
  },
]

// ─── Expandir palabras clave con IA ──────────────────────────────────────────
async function expandirConceptos(keywords: string): Promise<string[]> {
  const prompt = `Eres un BCBA experto en ABA, TEA, TDAH y terapia conductual infantil.

El usuario quiere que la IA aprenda sobre: "${keywords}"

Genera 8-12 términos de búsqueda en INGLÉS para PubMed y bases de datos ABA que cubran:
- El concepto en terminología ABA clínica precisa
- Subconceptos técnicos (ej: reinforcement schedules, discrete trial training, verbal behavior)
- Términos del Journal of Applied Behavior Analysis (JABA)
- Variantes del término en inglés clínico

RESPONDE SOLO JSON: {"terminos": ["término1", "término2", ...]}
Sin texto adicional, sin markdown.`

  try {
    const raw = await callGroqSimple(
      'BCBA expert in ABA. Always respond with valid JSON. Use precise clinical terminology.',
      prompt,
      { model: GROQ_MODELS.FAST, temperature: 0.3, maxTokens: 400 }
    )
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return parsed.terminos || [keywords]
  } catch {
    return [keywords, ...keywords.split(',').map((k: string) => k.trim()).filter(Boolean)]
  }
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────
async function extraerSemanticScholar(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const query = `${termino} applied behavior analysis autism`
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,abstract,year,authors,venue`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json()
    const papers = data?.data || []
    return papers
      .filter((p: any) => p.abstract && p.abstract.length > 100)
      .slice(0, 4)
      .map((p: any) => ({
        titulo: `[JABA/ABA] ${p.title} (${p.year || 'n/d'}) — ${p.venue || 'Journal ABA'}`,
        texto: `TÍTULO: ${p.title}\nAÑO: ${p.year || 'N/D'}\nREVISTA: ${p.venue || 'N/D'}\nAUTORES: ${(p.authors || []).map((a: any) => a.name).join(', ')}\n\nRESUMEN:\n${p.abstract}`,
        url: `https://www.semanticscholar.org/paper/${p.paperId}`,
      }))
  } catch {
    return []
  }
}

// ─── ERIC ─────────────────────────────────────────────────────────────────────
async function extraerERIC(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const url = `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(termino + ' behavior intervention')}&format=json&rows=3`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const docs = data?.response?.docs || []
    return docs
      .filter((d: any) => d.description && d.description.length > 80)
      .slice(0, 3)
      .map((d: any) => ({
        titulo: `[ERIC] ${d.title}`,
        texto: `TÍTULO: ${d.title}\nAÑO: ${d.publicationdateyear || 'N/D'}\nAUTOR: ${(d.author || []).join(', ')}\n\nRESUMEN:\n${d.description}`,
        url: `https://eric.ed.gov/?id=${d.id}`,
      }))
  } catch {
    return []
  }
}

// ─── PubMed ───────────────────────────────────────────────────────────────────
async function extraerPubMed(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(termino + '[Title/Abstract]')}&retmax=4&retmode=json&sort=relevance`
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) })
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const ids: string[] = searchData?.esearchresult?.idlist || []
    if (ids.length === 0) return []
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=text`
    const fetchRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) })
    if (!fetchRes.ok) return []
    const texto = await fetchRes.text()
    if (texto.length < 100) return []
    const articulos = texto.split(/\n\n\d+\.\s/).filter(a => a.trim().length > 100)
    return articulos.slice(0, 4).map((a, i) => ({
      titulo: `PubMed: ${termino} (artículo ${i + 1})`,
      texto: a.slice(0, 3000),
      url: `https://pubmed.ncbi.nlm.nih.gov/${ids[i] || ''}`,
    }))
  } catch {
    return []
  }
}

// ─── 🆕 Groq Web Search Tool — búsqueda web con tool_use (usa GROQ_API_KEY) ──────
// Usa llama-3.3-70b-versatile + web_search_preview tool de Groq.
// Funciona con tu GROQ_API_KEY existente, sin API keys adicionales.
async function extraerGroqCompound(temaEs: string, temaEn: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return []

  // Intentar con compound-beta primero, luego compound-beta-mini como fallback
  const modelos = ['compound-beta-mini', 'compound-beta']

  for (const modelo of modelos) {
    try {
      const prompt = `Busca en internet información clínica actualizada sobre: "${temaEs}" (en inglés: "${temaEn}").

Resume lo que encuentres:
1. Definición clínica ABA
2. Intervenciones con evidencia reciente
3. Estrategias para terapeutas y padres

Responde en español, estructurado y detallado.`

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(45000),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            {
              role: 'system',
              content: 'Eres un BCBA experto. Busca en internet y responde SIEMPRE en español con información clínica estructurada.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.warn(`[Groq ${modelo}] Error ${res.status}: ${errBody?.error?.message || res.statusText}`)
        continue // probar siguiente modelo
      }

      const data = await res.json()
      const texto = data?.choices?.[0]?.message?.content || ''
      console.log(`[Groq ${modelo}] Texto length: ${texto.length}`)

      if (texto.length < 100) continue

      // Extraer URLs de executed_tools si las hay
      const tools = data?.executed_tools || []
      const urlsEncontradas = tools
        .filter((t: any) => t.type === 'web_search')
        .flatMap((t: any) => t.results || [])
        .map((r: any) => r.url)
        .filter(Boolean)
        .slice(0, 3)

      return [{
        titulo: `[Groq Web IA] ${temaEs}`,
        texto: `BÚSQUEDA WEB IA (${modelo}) SOBRE: ${temaEs}\n\n${texto}${urlsEncontradas.length ? '\n\nFuentes: ' + urlsEncontradas.join(', ') : ''}`,
        url: urlsEncontradas[0] || 'https://groq.com',
      }]

    } catch (e: any) {
      console.warn(`[Groq ${modelo}] Exception: ${e?.message}`)
      continue
    }
  }

  console.warn('[Groq Compound] Todos los modelos fallaron')
  return []
}
// ─── 🆕 Europe PMC (sin API key, 40M+ artículos biomédicos) ──────────────────
async function extraerEuropePMC(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(termino + ' autism behavior')}&format=json&pageSize=4&sort=CITED&resultType=core`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const data = await res.json()
    const results = data?.resultList?.result || []
    return results
      .filter((r: any) => r.abstractText && r.abstractText.length > 80)
      .slice(0, 4)
      .map((r: any) => ({
        titulo: `[EuropePMC] ${r.title} (${r.pubYear || 'N/D'})`,
        texto: `TÍTULO: ${r.title}\nAÑO: ${r.pubYear || 'N/D'}\nREVISTA: ${r.journalTitle || 'N/D'}\nAUTORES: ${r.authorString || 'N/D'}\n\nRESUMEN:\n${r.abstractText.slice(0, 2500)}`,
        url: `https://europepmc.org/article/${r.source || 'MED'}/${r.id}`,
      }))
  } catch { return [] }
}

// ─── 🆕 CORE (sin API key, 200M+ artículos open access) ──────────────────────
async function extraerCORE(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const url = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(termino + ' autism ABA')}&limit=4&sort=citationCount:desc`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'CerebroIA/1.0' },
    })
    if (!res.ok) return []
    const data = await res.json()
    const results = data?.results || []
    return results
      .filter((r: any) => r.abstract && r.abstract.length > 80)
      .slice(0, 4)
      .map((r: any) => ({
        titulo: `[CORE] ${r.title} (${r.yearPublished || 'N/D'})`,
        texto: `TÍTULO: ${r.title}\nAÑO: ${r.yearPublished || 'N/D'}\nREVISTA: ${r.publisher || 'Open Access'}\nAUTORES: ${(r.authors || []).slice(0, 3).map((a: any) => a.name || a).join(', ') || 'N/D'}\n\nRESUMEN:\n${r.abstract.slice(0, 2500)}`,
        url: r.downloadUrl || r.sourceFulltextUrls?.[0] || `https://core.ac.uk/works/${r.id}`,
      }))
  } catch { return [] }
}

// ─── 🆕 BASE Bielefeld Academic Search Engine (sin API key) ──────────────────
async function extraerBASE(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    const url = `https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi?func=PerformSearch&query=${encodeURIComponent(termino + ' autism behavior analysis')}&hits=4&format=json`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const docs = data?.response?.docs || []
    return docs
      .filter((d: any) => d.dcdescription && d.dcdescription.length > 80)
      .slice(0, 3)
      .map((d: any) => {
        const desc = Array.isArray(d.dcdescription) ? d.dcdescription[0] : d.dcdescription
        const title = Array.isArray(d.dctitle) ? d.dctitle[0] : d.dctitle || 'Sin título'
        const author = Array.isArray(d.dccreator) ? d.dccreator.slice(0, 3).join(', ') : d.dccreator || 'N/D'
        return {
          titulo: `[BASE] ${title} (${d.dcdateyear || 'N/D'})`,
          texto: `TÍTULO: ${title}\nAÑO: ${d.dcdateyear || 'N/D'}\nAUTORES: ${author}\n\nRESUMEN:\n${String(desc).slice(0, 2000)}`,
          url: d.dcidentifier?.[0] || '',
        }
      })
  } catch { return [] }
}

// ─── Extraer tema limpio de frases conversacionales ───────────────────────────
async function extraerTemaLimpio(keywords: string): Promise<{ es: string; en: string; terminos: string[] }> {
  const prompt = `Eres un BCBA experto. El usuario escribió: "${keywords}"

Tu tarea:
1. Extraer el tema clínico real (ignorar frases como "quiero que aprendas", "conviértete en experto", "busca sobre", etc.)
2. Traducir al inglés técnico ABA
3. Generar 6-8 términos de búsqueda en inglés para PubMed

RESPONDE SOLO JSON (sin markdown):
{
  "tema_es": "funciones ejecutivas",
  "tema_en": "executive functions",
  "terminos": ["executive function autism", "self-regulation children ABA", "cognitive flexibility ASD", "inhibitory control autism", "working memory ADHD ABA", "executive dysfunction behavior intervention"]
}`

  try {
    const raw = await callGroqSimple(
      'BCBA expert. Respond ONLY with valid JSON. No preamble, no markdown.',
      prompt,
      { model: GROQ_MODELS.FAST, temperature: 0.2, maxTokens: 400 }
    )
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      es: parsed.tema_es?.trim() || keywords,
      en: parsed.tema_en?.trim() || keywords,
      terminos: Array.isArray(parsed.terminos) && parsed.terminos.length > 0 ? parsed.terminos : [parsed.tema_en || keywords],
    }
  } catch {
    return { es: keywords, en: keywords, terminos: [keywords] }
  }
}

// ─── Generar resumen estructurado con IA ──────────────────────────────────────
async function generarResumenEstructurado(tema: string, textos: string[], locale = 'es'): Promise<string> {
  if (textos.length === 0) return ''
  const contexto = textos.join('\n\n---\n\n').slice(0, 12000)
  const prompt = `Eres un BCBA especializado en ABA, TEA y TDAH. Tu conocimiento se basa en el Journal of Applied Behavior Analysis (JABA), Cooper et al. (2020), Malott, y guías IBAO/BACB.

Basándote en el siguiente material científico y web sobre "${tema}", genera un RESUMEN CLÍNICO ESTRUCTURADO para la base de conocimiento de ARIA:

MATERIAL:
${contexto}

GENERA un resumen de 800-1200 palabras con estas secciones:
1. DEFINICIÓN CLÍNICA ABA: qué es exactamente según literatura ABA
2. MANIFESTACIONES EN TEA/TDAH: cómo se presenta en niños neurodivergentes
3. ABORDAJE ABA CON EVIDENCIA: intervenciones y estrategias respaldadas en JABA/PubMed
4. INDICADORES DE PROGRESO: cómo medir avance (porcentajes, criterio de logro, sets)
5. ESTRATEGIAS PARA TERAPEUTAS: procedimientos clínicos específicos
6. ESTRATEGIAS PARA PADRES: qué pueden hacer en casa
7. ERRORES COMUNES: qué evitar en la intervención
8. REFERENCIAS CLAVE: autores y journals principales sobre este tema

Escribe en español técnico-clínico. Integra información de todas las fuentes disponibles.`

  try {
    return await callGroqSimple(
      'BCBA experto en síntesis de conocimiento clínico basado en evidencia ABA.' + getLangInstruction(locale),
      prompt,
      { model: GROQ_MODELS.SMART, temperature: 0.3, maxTokens: 1500 }
    )
  } catch {
    return textos[0]?.slice(0, 3000) || ''
  }
}

// ─── Handler POST principal ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keywords, modo = 'completo', incluirWeb = true } = body
    const locale = body.locale || req.headers.get('x-locale') || 'es'
    if (!keywords?.trim()) {
      return NextResponse.json({ error: 'keywords requerido' }, { status: 400 })
    }

    const log: string[] = []
    const resultados: { fuente: string; titulo: string; chunks: number }[] = []
    let totalChunks = 0

    // ── PASO 1: Extraer tema limpio + términos EN ─────────────────────────────
    log.push(`🔍 Analizando: "${keywords}"...`)
    const { es: temaEs, en: temaEn, terminos } = await extraerTemaLimpio(keywords)
    log.push(`🎯 Tema: "${temaEs}" → "${temaEn}"`)
    log.push(`📋 Términos EN: ${terminos.join(', ')}`)

    const textosRecopilados: { titulo: string; texto: string; url: string; fuente: string }[] = []

    // ── PASO 2: Fuentes académicas especializadas (usar términos EN) ──────────
    log.push(`🔬 Buscando en fuentes académicas especializadas...`)
    for (const termino of terminos.slice(0, 5)) {
      // PubMed — siempre en inglés, sin regex check que lo bloquee
      const pubmedArticles = await extraerPubMed(termino)
      for (const art of pubmedArticles) {
        textosRecopilados.push({ ...art, fuente: 'PubMed' })
        log.push(`✅ PubMed: ${art.titulo}`)
      }

      // Semantic Scholar — primeros 2 términos
      if (terminos.indexOf(termino) < 2) {
        const ssArticles = await extraerSemanticScholar(termino)
        for (const art of ssArticles) {
          textosRecopilados.push({ ...art, fuente: 'Semantic Scholar / JABA' })
          log.push(`✅ Semantic Scholar: ${art.titulo}`)
        }
      }

      // ERIC — primeros 2 términos
      if (terminos.indexOf(termino) < 2) {
        const ericArticles = await extraerERIC(termino)
        for (const art of ericArticles) {
          textosRecopilados.push({ ...art, fuente: 'ERIC' })
          log.push(`✅ ERIC: ${art.titulo}`)
        }
      }
    }

    // ── PASO 3: Fuentes web generales (sin API key) ───────────────────────────
    if (incluirWeb !== false) {
      log.push(`🌐 Buscando en fuentes web generales + agente IA Groq Compound...`)

      // OpenAlex con término EN principal
      try {
        const openAlexArticles = await extraerOpenAlex(temaEn)
        for (const art of openAlexArticles) {
          textosRecopilados.push({ ...art, fuente: 'OpenAlex' })
          log.push(`✅ OpenAlex: ${art.titulo}`)
        }
      } catch { log.push('⚠️ OpenAlex no disponible') }

      // CrossRef con término EN principal
      try {
        const crossRefArticles = await extraerCrossRef(temaEn)
        for (const art of crossRefArticles) {
          textosRecopilados.push({ ...art, fuente: 'CrossRef' })
          log.push(`✅ CrossRef: ${art.titulo}`)
        }
      } catch { log.push('⚠️ CrossRef no disponible') }

      // Groq Compound — agente IA que busca en internet automáticamente
      try {
        log.push(`🤖 Groq Compound buscando en internet...`)
        const compoundResults = await extraerGroqCompound(temaEs, temaEn)
        for (const art of compoundResults) {
          textosRecopilados.push({ ...art, fuente: 'Groq Compound Web' })
          log.push(`✅ Groq Compound Web: ${art.titulo}`)
        }
        if (compoundResults.length === 0) log.push('⚠️ Groq Compound: sin resultados')
      } catch { log.push('⚠️ Groq Compound no disponible') }

      // Wikipedia con tema ES
      try {
        const wikiEs = await extraerWikipedia(temaEs)
        for (const art of wikiEs) {
          textosRecopilados.push({ ...art, fuente: 'Wikipedia' })
          log.push(`✅ Wikipedia (ES): ${art.titulo}`)
        }
      } catch { log.push('⚠️ Wikipedia (ES) no disponible') }

      // Wikipedia con tema EN
      try {
        const wikiEn = await extraerWikipedia(temaEn)
        for (const art of wikiEn) {
          textosRecopilados.push({ ...art, fuente: 'Wikipedia' })
          log.push(`✅ Wikipedia (EN): ${art.titulo}`)
        }
      } catch { log.push('⚠️ Wikipedia (EN) no disponible') }

      // Europe PMC — 40M+ artículos biomédicos open access
      try {
        const europePMC = await extraerEuropePMC(temaEn)
        for (const art of europePMC) {
          textosRecopilados.push({ ...art, fuente: 'EuropePMC' })
          log.push(`✅ EuropePMC: ${art.titulo}`)
        }
      } catch { log.push('⚠️ EuropePMC no disponible') }

      // CORE — 200M+ artículos open access
      try {
        const coreArticles = await extraerCORE(temaEn)
        for (const art of coreArticles) {
          textosRecopilados.push({ ...art, fuente: 'CORE' })
          log.push(`✅ CORE: ${art.titulo}`)
        }
      } catch { log.push('⚠️ CORE no disponible') }

      // BASE — Bielefeld Academic Search Engine
      try {
        const baseArticles = await extraerBASE(temaEn)
        for (const art of baseArticles) {
          textosRecopilados.push({ ...art, fuente: 'BASE' })
          log.push(`✅ BASE: ${art.titulo}`)
        }
      } catch { log.push('⚠️ BASE no disponible') }
    }

    if (textosRecopilados.length === 0) {
      return NextResponse.json({
        error: 'No se encontró contenido. Intenta con términos más específicos como "reforzamiento positivo" o "análisis funcional".',
        log,
      }, { status: 404 })
    }

    const fuentesUsadas = [...new Set(textosRecopilados.map(t => t.fuente))]
    log.push(`📚 ${textosRecopilados.length} fuentes encontradas (${fuentesUsadas.join(', ')}). Generando síntesis IA...`)

    // ── PASO 4: Generar síntesis con IA ──────────────────────────────────────
    const todosLosTextos = textosRecopilados.map(t => `=== ${t.titulo} ===\n${t.texto}`)
    const resumenIA = await generarResumenEstructurado(temaEs, todosLosTextos, locale)
    log.push(`🤖 Síntesis IA generada (${resumenIA.length} chars)`)

    // ── PASO 5: Indexar síntesis principal ────────────────────────────────────
    const { data: docPrincipal } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        titulo: `[IA] ${temaEs} — Síntesis completa`,
        tipo: 'articulo',
        descripcion: `Aprendizaje automático. Fuentes: ${fuentesUsadas.join(', ')}. Términos: ${terminos.join(', ')}`,
        procesado: false,
        source_url: `auto:${temaEs}`,
        texto_extraido: resumenIA,
      })
      .select().single()

    if (docPrincipal) {
      const idx = await indexDocument(docPrincipal.id, resumenIA, { keywords: temaEs, tipo: 'síntesis_ia', terminos })
      if (idx.success) {
        totalChunks += idx.chunks
        resultados.push({ fuente: 'Síntesis IA', titulo: docPrincipal.titulo, chunks: idx.chunks })
        log.push(`✅ Síntesis indexada: ${idx.chunks} fragmentos`)
      }
    }

    // ── PASO 6: Indexar fuentes individuales (modo completo) ──────────────────
    if (modo === 'completo') {
      for (const fuente of textosRecopilados.slice(0, 8)) {
        try {
          const { data: doc } = await supabaseAdmin
            .from('knowledge_documents')
            .insert({
              titulo: fuente.titulo,
              tipo: 'articulo',
              descripcion: `Auto-aprendido desde ${fuente.fuente}. Keywords: ${temaEs}`,
              procesado: false,
              source_url: fuente.url,
              texto_extraido: fuente.texto,
            })
            .select().single()

          if (doc) {
            const idx = await indexDocument(doc.id, fuente.texto, { keywords: temaEs, fuente: fuente.fuente })
            if (idx.success) {
              totalChunks += idx.chunks
              resultados.push({ fuente: fuente.fuente, titulo: fuente.titulo, chunks: idx.chunks })
              log.push(`✅ ${fuente.fuente}: ${idx.chunks} fragmentos`)
            }
          }
        } catch (e) {
          log.push(`⚠️ Error indexando ${fuente.fuente}: ${(e as any).message}`)
        }
      }
    }

    log.push(`🎉 Listo. Total: ${totalChunks} fragmentos indexados`)

    return NextResponse.json({
      ok: true,
      keywords: temaEs,
      terminos,
      fuentes: textosRecopilados.length,
      fuentesUsadas,
      documentos: resultados.length,
      totalChunks,
      resultados,
      log,
    })

  } catch (e: any) {
    console.error('Error aprender:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── GET: ver temas aprendidos ────────────────────────────────────────────────
export async function GET() {
  const { data } = await supabaseAdmin
    .from('knowledge_documents')
    .select('id, titulo, tipo, descripcion, procesado, total_chunks, created_at')
    .ilike('source_url', 'auto:%')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ data: data || [] })
}
