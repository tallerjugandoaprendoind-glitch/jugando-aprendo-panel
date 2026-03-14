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

// ─── Fuentes de conocimiento ABA especializadas ───────────────────────────────
// Wikipedia fue removida por no ser fuente clínica confiable.
// Se prioriza: JABA, PubMed (ABA/TEA), Eric (educación especial), SemanticScholar
const FUENTES_BASE = [
  // PubMed — artículos científicos ABA, TEA, TDAH (principal fuente médica)
  {
    nombre: 'PubMed',
    tipo: 'pubmed',
    buildUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
    buildFullUrl: (q: string) => `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=5&retmode=json&sort=relevance`,
  },
  // ERIC — base de datos de educación especial e intervención conductual
  {
    nombre: 'ERIC (Educación Especial)',
    tipo: 'eric',
    buildUrl: (q: string) => `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(q)}&format=json&rows=5`,
    buildFullUrl: (q: string) => `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(q)}&format=json&rows=5`,
  },
  // Semantic Scholar — papers ABA/conducta con acceso abierto
  {
    nombre: 'Semantic Scholar (ABA)',
    tipo: 'semantic_scholar',
    buildUrl: (q: string) => `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q + ' applied behavior analysis')}&limit=5&fields=title,abstract,year,authors`,
    buildFullUrl: (q: string) => `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q + ' applied behavior analysis')}&limit=5&fields=title,abstract,year,authors`,
  },
]

// ─── Expandir palabras clave con IA (enfoque ABA clínico) ────────────────────
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

// ─── Extraer papers de Semantic Scholar (ABA especializado) ─────────────────
async function extraerSemanticScholar(termino: string): Promise<{ titulo: string; texto: string; url: string }[]> {
  try {
    // Añadir "applied behavior analysis" para forzar contexto ABA
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

// ─── Extraer recursos ERIC (educación especial y conducta) ──────────────────
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
async function generarResumenEstructurado(tema: string, textos: string[], locale = 'es'): Promise<string> {
  if (textos.length === 0) return ''
  
  const contexto = textos.join('\n\n---\n\n').slice(0, 12000)
  
  // Fuentes ABA especializadas: JABA, PubMed, Semantic Scholar, ERIC
  // Wikipedia NO se usa como fuente clínica
  const prompt = `Eres un BCBA especializado en ABA, TEA y TDAH. Tu conocimiento se basa en el Journal of Applied Behavior Analysis (JABA), Cooper et al. (2020), Malott, y guías IBAO/BACB.

Basándote en el siguiente material científico sobre "${tema}", genera un RESUMEN CLÍNICO ESTRUCTURADO para la base de conocimiento de ARIA:

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

Escribe en español técnico-clínico. NO cites Wikipedia.`

  try {
    return await callGroqSimple(
      'BCBA experto en síntesis de conocimiento clínico basado en evidencia ABA. NO usas Wikipedia.' + getLangInstruction(locale),
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
    const { keywords, modo = 'completo' } = body
    const locale = body.locale || req.headers.get('x-locale') || 'es'
    if (!keywords?.trim()) {
      return NextResponse.json({ error: 'keywords requerido' }, { status: 400 })
    }

    const log: string[] = []
    const resultados: { fuente: string; titulo: string; chunks: number }[] = []
    let totalChunks = 0

    log.push(`🔍 Expandiendo: "${keywords}"...`)
    const terminos = await expandirConceptos(keywords)
    log.push(`📋 Términos: ${terminos.join(', ')}`)

    // ── 1. Recopilar textos de fuentes ABA especializadas ────────────────────
    // Fuentes: PubMed (artículos ABA/TEA), Semantic Scholar (papers JABA), ERIC (educación especial)
    // Wikipedia fue removida — no es fuente clínica confiable para ABA
    const textosRecopilados: { titulo: string; texto: string; url: string; fuente: string }[] = []

    for (const termino of terminos.slice(0, 6)) { // máx 6 términos
      // PubMed — artículos ABA/TEA con filtro aplicado behavior analysis
      if (/^[a-zA-Z\s]+$/.test(termino)) {
        const pubmedArticles = await extraerPubMed(termino)
        for (const art of pubmedArticles) {
          textosRecopilados.push({ ...art, fuente: 'PubMed' })
          log.push(`✅ PubMed: ${art.titulo}`)
        }
      }

      // Semantic Scholar — papers JABA y ABA con acceso abierto
      if (terminos.indexOf(termino) < 3) {
        const ssArticles = await extraerSemanticScholar(termino)
        for (const art of ssArticles) {
          textosRecopilados.push({ ...art, fuente: 'Semantic Scholar / JABA' })
          log.push(`✅ Semantic Scholar: ${art.titulo}`)
        }
      }

      // ERIC — recursos de educación especial e intervención conductual
      if (terminos.indexOf(termino) < 3) {
        const ericArticles = await extraerERIC(termino)
        for (const art of ericArticles) {
          textosRecopilados.push({ ...art, fuente: 'ERIC' })
          log.push(`✅ ERIC: ${art.titulo}`)
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
    const resumenIA = await generarResumenEstructurado(keywords, todosLosTextos, locale)
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
