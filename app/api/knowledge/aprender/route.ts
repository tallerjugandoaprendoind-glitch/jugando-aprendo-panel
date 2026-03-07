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

// ─── Fuentes de conocimiento por categoría ────────────────────────────────────
const FUENTES_BASE = [
  // Wikipedia en español — siempre disponible, contenido estructurado
  {
    nombre: 'Wikipedia ES',
    tipo: 'wikipedia',
    buildUrl: (q: string) => `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}`,
    buildFullUrl: (q: string) => `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=extracts&exintro=false&explaintext=true&format=json`,
  },
  // Wikipedia en inglés — más contenido clínico/científico
  {
    nombre: 'Wikipedia EN',
    tipo: 'wikipedia_en',
    buildUrl: (q: string) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}`,
    buildFullUrl: (q: string) => `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&prop=extracts&exintro=false&explaintext=true&format=json`,
  },
  // PubMed — artículos científicos de psicología y ABA
  {
    nombre: 'PubMed',
    tipo: 'pubmed',
    buildUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
    buildFullUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
  },
]

// ─── Expandir palabras clave con IA ──────────────────────────────────────────
async function expandirConceptos(keywords: string): Promise<string[]> {
  const prompt = `Eres un experto en ABA, TEA, TDAH y terapia infantil.

El usuario quiere que la IA aprenda sobre: "${keywords}"

Genera una lista de 8-12 términos de búsqueda específicos en ESPAÑOL e INGLÉS que cubran:
- El concepto principal
- Subconceptos clínicos importantes
- Términos técnicos usados en ABA
- Variaciones del término

RESPONDE SOLO JSON: {"terminos": ["término1", "término2", ...]}
Sin texto adicional, sin markdown.`

  try {
    const raw = await callGroqSimple(
      'Experto en ABA y psicología clínica. Siempre respondes con JSON válido.',
      prompt,
      { model: GROQ_MODELS.FAST, temperature: 0.3, maxTokens: 400 }
    )
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return parsed.terminos || [keywords]
  } catch {
    // Fallback: split por comas y añadir inglés básico
    return [keywords, ...keywords.split(',').map((k: string) => k.trim()).filter(Boolean)]
  }
}

// ─── Extraer contenido de Wikipedia ──────────────────────────────────────────
async function extraerWikipedia(termino: string, idioma: 'es' | 'en'): Promise<{ titulo: string; texto: string; url: string } | null> {
  try {
    const base = idioma === 'es' ? 'es.wikipedia.org' : 'en.wikipedia.org'
    const searchUrl = `https://${base}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termino)}&srlimit=1&format=json&origin=*`
    
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) })
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()
    const pageTitle = searchData?.query?.search?.[0]?.title
    if (!pageTitle) return null

    const contentUrl = `https://${base}/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=false&explaintext=true&format=json&origin=*`
    const contentRes = await fetch(contentUrl, { signal: AbortSignal.timeout(10000) })
    if (!contentRes.ok) return null
    const contentData = await contentRes.json()

    const pages = contentData?.query?.pages || {}
    const page = Object.values(pages)[0] as any
    if (!page || page.missing) return null

    const texto = page.extract || ''
    if (texto.length < 200) return null

    return {
      titulo: `${pageTitle} (Wikipedia ${idioma.toUpperCase()})`,
      texto: texto.slice(0, 15000), // máx 15K chars por artículo
      url: `https://${base}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
    }
  } catch {
    return null
  }
}

// ─── Extraer abstracts de PubMed ──────────────────────────────────────────────
async function extraerPubMed(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    // 1. Buscar IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(termino + '[Title/Abstract]')}&retmax=4&retmode=json&sort=relevance`
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) })
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    const ids: string[] = searchData?.esearchresult?.idlist || []
    if (ids.length === 0) return []

    // 2. Obtener abstracts
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=text`
    const fetchRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) })
    if (!fetchRes.ok) return []
    const texto = await fetchRes.text()
    if (texto.length < 100) return []

    // Dividir por artículo (cada uno empieza con número de pubmed)
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

// ─── Generar resumen estructurado con IA ──────────────────────────────────────
async function generarResumenEstructurado(tema: string, textos: string[]): Promise<string> {
  if (textos.length === 0) return ''
  
  const contexto = textos.join('\n\n---\n\n').slice(0, 12000)
  
  const prompt = `Eres un psicólogo conductual BCBA especializado en ABA, TEA y TDAH.

Basándote en el siguiente material sobre "${tema}", genera un RESUMEN CLÍNICO ESTRUCTURADO para una base de conocimiento de terapia:

MATERIAL:
${contexto}

GENERA un resumen de 800-1200 palabras con estas secciones:
1. DEFINICIÓN CLÍNICA: qué es exactamente
2. MANIFESTACIONES EN TEA/TDAH: cómo se presenta en niños neurodivergentes  
3. ABORDAJE ABA: intervenciones y estrategias específicas con evidencia
4. INDICADORES DE PROGRESO: cómo medir avance
5. ESTRATEGIAS PARA PADRES: qué pueden hacer en casa
6. ERRORES COMUNES: qué evitar en la intervención
7. REFERENCIAS: los términos clínicos clave relacionados

Escribe en español técnico-clínico, apropiado para terapeutas ABA.`

  try {
    return await callGroqSimple(
      'Psicólogo conductual BCBA experto en síntesis de conocimiento clínico.',
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
    const { keywords, modo = 'completo' } = await req.json()
    if (!keywords?.trim()) {
      return NextResponse.json({ error: 'keywords requerido' }, { status: 400 })
    }

    const log: string[] = []
    const resultados: { fuente: string; titulo: string; chunks: number }[] = []
    let totalChunks = 0

    log.push(`🔍 Expandiendo: "${keywords}"...`)
    const terminos = await expandirConceptos(keywords)
    log.push(`📋 Términos: ${terminos.join(', ')}`)

    // ── 1. Recopilar textos de todas las fuentes ──────────────────────────────
    const textosRecopilados: { titulo: string; texto: string; url: string; fuente: string }[] = []

    for (const termino of terminos.slice(0, 8)) { // máx 8 términos para no saturar
      // Wikipedia ES
      const wikiES = await extraerWikipedia(termino, 'es')
      if (wikiES) {
        textosRecopilados.push({ ...wikiES, fuente: 'Wikipedia ES' })
        log.push(`✅ Wikipedia ES: ${wikiES.titulo}`)
      }

      // Wikipedia EN para los primeros 4 términos
      if (terminos.indexOf(termino) < 4) {
        const wikiEN = await extraerWikipedia(termino, 'en')
        if (wikiEN) {
          textosRecopilados.push({ ...wikiEN, fuente: 'Wikipedia EN' })
          log.push(`✅ Wikipedia EN: ${wikiEN.titulo}`)
        }
      }

      // PubMed para términos en inglés (los últimos de la lista suelen ser en inglés)
      if (/^[a-zA-Z\s]+$/.test(termino)) {
        const pubmedArticles = await extraerPubMed(termino)
        for (const art of pubmedArticles) {
          textosRecopilados.push({ ...art, fuente: 'PubMed' })
          log.push(`✅ PubMed: ${art.titulo}`)
        }
      }
    }

    if (textosRecopilados.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontró contenido para esas palabras clave. Intenta con términos más específicos.',
        log 
      }, { status: 404 })
    }

    log.push(`📚 ${textosRecopilados.length} fuentes encontradas. Generando síntesis IA...`)

    // ── 2. Generar resumen estructurado con IA (el conocimiento real) ─────────
    const todosLosTextos = textosRecopilados.map(t => `=== ${t.titulo} ===\n${t.texto}`)
    const resumenIA = await generarResumenEstructurado(keywords, todosLosTextos)
    log.push(`🤖 Síntesis IA generada (${resumenIA.length} chars)`)

    // ── 3. Indexar el resumen IA como documento principal ─────────────────────
    const { data: docPrincipal } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        titulo: `[IA] ${keywords} — Síntesis completa`,
        tipo: 'articulo',
        descripcion: `Aprendizaje automático desde internet. Fuentes: ${[...new Set(textosRecopilados.map(t => t.fuente))].join(', ')}. Términos: ${terminos.join(', ')}`,
        procesado: false,
        source_url: `auto:${keywords}`,
        texto_extraido: resumenIA,
      })
      .select().single()

    if (docPrincipal) {
      const idx = await indexDocument(docPrincipal.id, resumenIA, { keywords, tipo: 'síntesis_ia', terminos })
      if (idx.success) {
        totalChunks += idx.chunks
        resultados.push({ fuente: 'Síntesis IA', titulo: docPrincipal.titulo, chunks: idx.chunks })
        log.push(`✅ Síntesis indexada: ${idx.chunks} fragmentos`)
      }
    }

    // ── 4. Indexar fuentes individuales en modo 'completo' ────────────────────
    if (modo === 'completo') {
      for (const fuente of textosRecopilados.slice(0, 6)) { // máx 6 fuentes individuales
        try {
          const { data: doc } = await supabaseAdmin
            .from('knowledge_documents')
            .insert({
              titulo: fuente.titulo,
              tipo: fuente.fuente.includes('PubMed') ? 'articulo' : 'libro',
              descripcion: `Auto-aprendido desde ${fuente.fuente}. Keywords: ${keywords}`,
              procesado: false,
              source_url: fuente.url,
              texto_extraido: fuente.texto,
            })
            .select().single()

          if (doc) {
            const idx = await indexDocument(doc.id, fuente.texto, { keywords, fuente: fuente.fuente })
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

    log.push(`🎉 Listo. Total: ${totalChunks} fragmentos de conocimiento indexados`)

    return NextResponse.json({
      ok: true,
      keywords,
      terminos,
      fuentes: textosRecopilados.length,
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

// ─── GET: ver temas aprendidos ──────────────────────────────────────────────
export async function GET() {
  const { data } = await supabaseAdmin
    .from('knowledge_documents')
    .select('id, titulo, tipo, descripcion, procesado, total_chunks, created_at')
    .ilike('source_url', 'auto:%')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return NextResponse.json({ data: data || [] })
}
