// lib/knowledge-base.ts
// Motor de base de conocimiento: embeddings + búsqueda semántica

import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'

const EMBEDDING_MODEL = 'text-embedding-004'
const CHUNK_SIZE = 600       // palabras por chunk
const CHUNK_OVERLAP = 80     // palabras de overlap entre chunks
const MAX_SEARCH_RESULTS = 6

// ── Generar embedding con Gemini ────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY!
  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text.slice(0, 8000), // límite seguro
  })
  return (response as any).embeddings?.[0]?.values || []
}

// ── Dividir texto en chunks con overlap ─────────────────────────────────────
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk.trim())
    i += chunkSize - overlap
  }
  return chunks
}

// ── Indexar un documento completo ───────────────────────────────────────────
export async function indexDocument(
  documentId: string,
  fullText: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; chunks: number; error?: string }> {
  try {
    const chunks = chunkText(fullText)
    let indexed = 0

    // Procesar en lotes de 5 para no saturar la API
    const batchSize = 5
    for (let b = 0; b < chunks.length; b += batchSize) {
      const batch = chunks.slice(b, b + batchSize)
      await Promise.all(
        batch.map(async (chunk, idx) => {
          try {
            const embedding = await generateEmbedding(chunk)
            if (embedding.length === 0) return

            await supabaseAdmin.from('knowledge_chunks').insert({
              document_id: documentId,
              chunk_index: b + idx,
              contenido: chunk,
              embedding: `[${embedding.join(',')}]`,
              metadata: { ...metadata, chunk_index: b + idx, total_chunks: chunks.length },
            })
            indexed++
          } catch (e) {
            console.warn(`Chunk ${b + idx} falló:`, e)
          }
        })
      )
      // Pequeña pausa entre lotes
      if (b + batchSize < chunks.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    // Actualizar documento como procesado
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ procesado: true, total_chunks: indexed })
      .eq('id', documentId)

    return { success: true, chunks: indexed }
  } catch (error: any) {
    return { success: false, chunks: 0, error: error.message }
  }
}

// ── Buscar conocimiento relevante ────────────────────────────────────────────
export async function searchKnowledge(
  query: string,
  options: {
    maxResults?: number
    threshold?: number
    tiposDocumento?: string[]
  } = {}
): Promise<KnowledgeResult[]> {
  const { maxResults = MAX_SEARCH_RESULTS, threshold = 0.65 } = options

  try {
    const queryEmbedding = await generateEmbedding(query)
    if (queryEmbedding.length === 0) return []

    const { data, error } = await supabaseAdmin.rpc('buscar_conocimiento', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: maxResults,
      similarity_threshold: threshold,
    })

    if (error) throw error
    return (data || []).map((r: any) => ({
      contenido: r.contenido,
      fuente: r.titulo_doc,
      similitud: Math.round(r.similarity * 100),
      metadata: r.metadata,
    }))
  } catch (error) {
    console.error('Error búsqueda conocimiento:', error)
    return []
  }
}

// ── Obtener instrucciones del centro ─────────────────────────────────────────
export async function getCentroInstrucciones(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('centro_instrucciones')
    .select('titulo, contenido, prioridad')
    .eq('activo', true)
    .order('prioridad', { ascending: false })
    .limit(10)

  if (!data || data.length === 0) return ''

  return `\n━━━ INSTRUCCIONES DEL CENTRO ━━━\n` +
    data.map((i: any) => `[${i.titulo}]: ${i.contenido}`).join('\n') +
    `\n━━━ FIN INSTRUCCIONES ━━━\n`
}

// ── Construir contexto completo para la IA ───────────────────────────────────
export async function buildKnowledgeContext(
  query: string,
  childContext?: string
): Promise<string> {
  const [resultados, instrucciones] = await Promise.all([
    searchKnowledge(query),
    getCentroInstrucciones(),
  ])

  let context = instrucciones

  if (resultados.length > 0) {
    context += `\n━━━ CONOCIMIENTO CLÍNICO RELEVANTE ━━━\n`
    resultados.forEach((r, i) => {
      context += `\n[Fuente ${i + 1}: ${r.fuente} | ${r.similitud}% relevancia]\n${r.contenido}\n`
    })
    context += `━━━ FIN CONOCIMIENTO ━━━\n`
  }

  if (childContext) {
    context += childContext
  }

  return context
}

export interface KnowledgeResult {
  contenido: string
  fuente: string
  similitud: number
  metadata: any
}
