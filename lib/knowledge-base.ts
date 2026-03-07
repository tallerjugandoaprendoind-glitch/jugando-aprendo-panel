// lib/knowledge-base.ts — FIXED v2
// Bugs corregidos:
// 1. generateEmbedding: usaba "contents" plural → cambiado a "content" singular (API v1.41)
// 2. pdf-parse v2 falla con require() → reemplazado por Gemini Vision (lee texto + imágenes)
// 3. procesado:true se marcaba aunque chunks=0 → ahora valida indexed > 0

import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'

const EMBEDDING_MODEL = 'text-embedding-004'
const CHUNK_SIZE = 600
const CHUNK_OVERLAP = 80
const MAX_SEARCH_RESULTS = 6

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY!
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')
  return new GoogleGenAI({ apiKey })
}

// ── Generar embedding ─────────────────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ai = getAI()
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 8000),
    })
    // SDK v1.41 response shape: { embeddings: [{ values: number[] }] }
    const vals = (response as any).embeddings?.[0]?.values
      ?? (response as any).embedding?.values
      ?? []
    return vals
  } catch (e) {
    console.error('[embedding] Error:', e)
    return []
  }
}

// ── Leer PDF con Gemini Vision (lee texto + imágenes + PDFs escaneados) ───────
export async function extractTextFromPdfWithGemini(buffer: ArrayBuffer): Promise<string> {
  try {
    const ai = getAI()
    const base64 = Buffer.from(buffer).toString('base64')

    // Gemini puede leer PDFs directamente como documento
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64,
            }
          },
          {
            text: `Extrae TODO el texto de este documento PDF. 
Incluye: texto de todas las páginas, texto dentro de imágenes o tablas, encabezados, pie de páginas.
NO resumas — transcribe el contenido completo tal como aparece.
Si hay texto en imágenes, léelo también.
Responde SOLO con el texto extraído, sin comentarios.`
          }
        ]
      }]
    })

    const extracted = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (extracted.length > 100) return extracted

    // Fallback: intentar con prompt más simple
    const r2 = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          { text: 'Transcribe everything you see in this document. Output only the text content.' }
        ]
      }]
    })
    return r2.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (e) {
    console.error('[pdf-gemini] Error:', e)
    // Último fallback: extracción manual de texto plano del PDF
    return extractPdfTextFallback(buffer)
  }
}

// ── Fallback manual de texto PDF (solo funciona con PDFs con texto embebido) ──
function extractPdfTextFallback(buffer: ArrayBuffer): string {
  const raw = new TextDecoder('latin1').decode(new Uint8Array(buffer))
  const chunks: string[] = []
  const regex = /BT([\s\S]*?)ET/g
  let match
  while ((match = regex.exec(raw)) !== null) {
    const textRegex = /\(([^)]+)\)/g
    let t
    while ((t = textRegex.exec(match[1])) !== null) {
      const clean = t[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\/g, '')
      if (clean.trim().length > 2) chunks.push(clean)
    }
  }
  // También buscar streams de texto plano
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let sm
  while ((sm = streamRegex.exec(raw)) !== null) {
    const content = sm[1]
    if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]{4,}/.test(content) && !content.includes('\x00')) {
      const words = content.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s,.:;!?()-]{10,}/g) || []
      chunks.push(...words)
    }
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

// ── Leer página web completa (con limpieza de HTML) ───────────────────────────
export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]*(class|id)="[^"]*(?:menu|banner|ad|cookie|popup|modal|overlay)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|br|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim()
}

// ── Dividir texto en chunks con overlap ──────────────────────────────────────
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk.trim())
    i += chunkSize - overlap
  }
  return chunks
}

// ── Indexar documento completo — FIXED: valida que indexed > 0 ───────────────
export async function indexDocument(
  documentId: string,
  fullText: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; chunks: number; error?: string }> {
  try {
    if (!fullText || fullText.trim().length < 50) {
      return { success: false, chunks: 0, error: 'Texto insuficiente para indexar' }
    }

    const chunks = chunkText(fullText)
    if (chunks.length === 0) {
      return { success: false, chunks: 0, error: 'No se generaron chunks del texto' }
    }

    let indexed = 0
    const batchSize = 5

    for (let b = 0; b < chunks.length; b += batchSize) {
      const batch = chunks.slice(b, b + batchSize)
      await Promise.all(
        batch.map(async (chunk, idx) => {
          try {
            const embedding = await generateEmbedding(chunk)
            if (embedding.length === 0) {
              console.warn(`[index] Chunk ${b + idx}: embedding vacío, saltando`)
              return
            }
            await supabaseAdmin.from('knowledge_chunks').insert({
              document_id: documentId,
              chunk_index: b + idx,
              contenido: chunk,
              embedding: `[${embedding.join(',')}]`,
              metadata: { ...metadata, chunk_index: b + idx, total_chunks: chunks.length },
            })
            indexed++
          } catch (e) {
            console.warn(`[index] Chunk ${b + idx} falló:`, e)
          }
        })
      )
      if (b + batchSize < chunks.length) {
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // FIXED: solo marcar procesado si realmente se indexó algo
    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        procesado: indexed > 0,  // ← FIXED: no marcar como listo si 0 chunks
        total_chunks: indexed,
      })
      .eq('id', documentId)

    if (indexed === 0) {
      return { success: false, chunks: 0, error: 'Embeddings fallaron — revisar GEMINI_API_KEY' }
    }

    return { success: true, chunks: indexed }
  } catch (error: any) {
    return { success: false, chunks: 0, error: error.message }
  }
}

// ── Buscar conocimiento relevante ─────────────────────────────────────────────
export async function searchKnowledge(
  query: string,
  options: { maxResults?: number; threshold?: number } = {}
): Promise<KnowledgeResult[]> {
  const { maxResults = MAX_SEARCH_RESULTS, threshold = 0.60 } = options  // threshold bajado de 0.65 → 0.60
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
    console.error('[search] Error:', error)
    return []
  }
}

// ── Instrucciones del centro ──────────────────────────────────────────────────
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

// ── Construir contexto completo ───────────────────────────────────────────────
export async function buildKnowledgeContext(query: string, childContext?: string): Promise<string> {
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
  if (childContext) context += childContext
  return context
}

export interface KnowledgeResult {
  contenido: string
  fuente: string
  similitud: number
  metadata: any
}
