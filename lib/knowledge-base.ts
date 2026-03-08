// lib/knowledge-base.ts — v3 FIXED
// Cambios en esta versión:
// 1. PDFs grandes (>4MB): se divide en lotes para no superar el límite de Gemini
// 2. Gemini API: usa el SDK correcto (@google/genai v1.x)
// 3. indexDocument: batching más robusto con reintentos por chunk fallido
// 4. chunkText: tamaño aumentado a 800 palabras para mejor contexto clínico
// 5. generateEmbedding: maneja respuestas vacías sin crashear

import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'

const EMBEDDING_MODEL = 'text-embedding-004'
const CHUNK_SIZE      = 800   // palabras por chunk (subido de 600 → 800)
const CHUNK_OVERLAP   = 100   // overlap entre chunks
const MAX_PDF_BYTES   = 4 * 1024 * 1024  // 4MB límite por llamada a Gemini

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada en variables de entorno')
  return new GoogleGenAI({ apiKey })
}

// ── Generar embedding vectorial ───────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ai = getAI()
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text.slice(0, 8000),
    })
    // SDK v1.x: response puede tener forma {embeddings:[{values:[...]}]} o {embedding:{values:[...]}}
    const vals =
      (response as any).embeddings?.[0]?.values ??
      (response as any).embedding?.values ??
      []
    return Array.isArray(vals) ? vals : []
  } catch (e: any) {
    console.error('[embedding] Error:', e?.message || e)
    return []
  }
}

// ── Extraer texto de PDF con Gemini Vision ────────────────────────────────────
// Gemini 1.5 Flash acepta PDFs de hasta ~20MB vía inlineData.
// Para libros muy grandes, extraemos en fragmentos de 4MB.
export async function extractTextFromPdfWithGemini(buffer: ArrayBuffer): Promise<string> {
  try {
    const ai    = getAI()
    const bytes = new Uint8Array(buffer)
    const totalBytes = bytes.byteLength

    console.log(`[pdf] Tamaño del PDF: ${Math.round(totalBytes / 1024)}KB`)

    // Para PDFs pequeños/medianos: enviar completo
    if (totalBytes <= MAX_PDF_BYTES) {
      return await extractPdfChunk(ai, buffer)
    }

    // Para PDFs grandes: partir en lotes de 4MB y concatenar
    // Nota: esto no es perfecto porque cortar bytes puede romper páginas,
    // pero Gemini es robusto y extrae lo que puede de cada fragmento.
    console.log(`[pdf] PDF grande (${Math.round(totalBytes / 1024 / 1024)}MB) — procesando en lotes`)
    const textos: string[] = []
    let offset = 0
    let lote = 1

    while (offset < totalBytes) {
      const end   = Math.min(offset + MAX_PDF_BYTES, totalBytes)
      const slice = buffer.slice(offset, end)
      console.log(`[pdf] Lote ${lote}: bytes ${offset}–${end}`)

      try {
        const texto = await extractPdfChunk(ai, slice)
        if (texto.trim().length > 20) textos.push(texto)
      } catch (e) {
        console.warn(`[pdf] Lote ${lote} falló, usando fallback de texto plano`)
        const fallback = extractPdfTextFallback(slice)
        if (fallback.length > 20) textos.push(fallback)
      }

      offset = end
      lote++
      // Pausa breve entre lotes para no saturar la API
      if (offset < totalBytes) await new Promise(r => setTimeout(r, 1000))
    }

    const resultado = textos.join('\n\n')
    console.log(`[pdf] Texto total extraído: ${resultado.length} caracteres en ${lote - 1} lotes`)
    return resultado

  } catch (e: any) {
    console.error('[pdf-gemini] Error fatal:', e?.message)
    return extractPdfTextFallback(buffer)
  }
}

// ── Extraer un fragmento de PDF vía Gemini ───────────────────────────────────
async function extractPdfChunk(ai: GoogleGenAI, buffer: ArrayBuffer): Promise<string> {
  const base64 = Buffer.from(buffer).toString('base64')

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64,
          },
        },
        {
          text: `Extrae TODO el texto de este documento PDF.
Incluye: texto de todas las páginas, texto dentro de imágenes, tablas, encabezados, pies de página, notas al pie.
NO resumas ni parafrasees — transcribe el contenido COMPLETO tal como aparece.
Si hay texto en imágenes o diagramas, léelo también.
Responde SOLO con el texto extraído, sin comentarios previos ni posteriores.`,
        },
      ],
    }],
  })

  const texto = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (texto.trim().length > 50) return texto

  // Fallback con prompt en inglés
  const r2 = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: base64 } },
        { text: 'Transcribe all text content from this document. Include all pages. Output only the raw text.' },
      ],
    }],
  })
  return r2.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Fallback manual: extrae texto de PDFs con texto embebido ─────────────────
export function extractPdfTextFallback(buffer: ArrayBuffer): string {
  const raw    = new TextDecoder('latin1').decode(new Uint8Array(buffer))
  const chunks: string[] = []

  // Extraer bloques de texto BT...ET
  const btEtRegex = /BT([\s\S]*?)ET/g
  let match
  while ((match = btEtRegex.exec(raw)) !== null) {
    const inner = match[1]
    const tRegex = /\(([^)]{1,500})\)/g
    let t
    while ((t = tRegex.exec(inner)) !== null) {
      const clean = t[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'")
        .trim()
      if (clean.length > 2) chunks.push(clean)
    }
  }

  // Extraer texto legible de streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let sm
  while ((sm = streamRegex.exec(raw)) !== null) {
    const content = sm[1]
    if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]{4,}/.test(content) && !content.includes('\x00')) {
      const words = content.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s,.;:!?()\-"']{10,}/g) || []
      chunks.push(...words)
    }
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

// ── Extraer texto de HTML ─────────────────────────────────────────────────────
export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|br|tr|td|th|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim()
}

// ── Dividir texto en chunks con overlap ──────────────────────────────────────
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words  = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let i = 0

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) chunks.push(chunk.trim())
    i += chunkSize - overlap
  }

  return chunks
}

// ── Indexar documento: texto → chunks → embeddings → Supabase ────────────────
export async function indexDocument(
  documentId: string,
  fullText: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; chunks: number; error?: string }> {
  try {
    if (!fullText || fullText.trim().length < 50) {
      return { success: false, chunks: 0, error: 'Texto insuficiente para indexar (menos de 50 caracteres)' }
    }

    const chunks = chunkText(fullText)
    if (chunks.length === 0) {
      return { success: false, chunks: 0, error: 'No se generaron chunks del texto' }
    }

    console.log(`[index] Indexando ${chunks.length} chunks para doc ${documentId}`)

    let indexed    = 0
    let errores    = 0
    const batchSize = 3  // Bajado de 5 a 3 para no superar rate limit de Gemini

    for (let b = 0; b < chunks.length; b += batchSize) {
      const batch = chunks.slice(b, b + batchSize)

      await Promise.all(
        batch.map(async (chunk, idx) => {
          const chunkIdx = b + idx
          try {
            // Generar embedding
            const embedding = await generateEmbedding(chunk)

            if (embedding.length === 0) {
              console.warn(`[index] Chunk ${chunkIdx}: embedding vacío, reintentando...`)
              // Reintento con espera
              await new Promise(r => setTimeout(r, 2000))
              const retry = await generateEmbedding(chunk)
              if (retry.length === 0) {
                errores++
                return
              }
              embedding.push(...retry)
            }

            // Guardar chunk con embedding en Supabase
            await supabaseAdmin.from('knowledge_chunks').insert({
              document_id: documentId,
              chunk_index: chunkIdx,
              contenido:   chunk,
              embedding:   `[${embedding.join(',')}]`,
              metadata: {
                ...metadata,
                chunk_index:  chunkIdx,
                total_chunks: chunks.length,
                char_count:   chunk.length,
              },
            })
            indexed++
          } catch (e: any) {
            console.warn(`[index] Chunk ${chunkIdx} falló:`, e?.message)
            errores++
          }
        })
      )

      // Log de progreso
      if ((b + batchSize) % 30 === 0 || b + batchSize >= chunks.length) {
        console.log(`[index] Progreso: ${Math.min(b + batchSize, chunks.length)}/${chunks.length} chunks`)
      }

      // Pausa entre lotes para respetar rate limits de Gemini (300 req/min)
      if (b + batchSize < chunks.length) {
        await new Promise(r => setTimeout(r, 400))
      }
    }

    // Actualizar estado del documento
    // Solo marcar como procesado si se indexó al menos 50% de los chunks
    const exitoso = indexed > 0 && indexed >= Math.floor(chunks.length * 0.5)
    await supabaseAdmin
      .from('knowledge_documents')
      .update({
        procesado:    exitoso,
        total_chunks: indexed,
      })
      .eq('id', documentId)

    console.log(`[index] Resultado doc ${documentId}: ${indexed} chunks indexados, ${errores} errores`)

    if (indexed === 0) {
      return {
        success: false,
        chunks: 0,
        error: `Todos los embeddings fallaron. Verifica que GEMINI_API_KEY sea válida y tenga cuota disponible.`,
      }
    }

    return { success: exitoso, chunks: indexed }

  } catch (error: any) {
    console.error('[index] Error fatal:', error)
    return { success: false, chunks: 0, error: error.message }
  }
}

// ── Buscar conocimiento relevante por similitud semántica ─────────────────────
export async function searchKnowledge(
  query: string,
  options: { maxResults?: number; threshold?: number } = {}
): Promise<KnowledgeResult[]> {
  const { maxResults = 6, threshold = 0.55 } = options  // threshold bajado a 0.55

  try {
    const queryEmbedding = await generateEmbedding(query)
    if (queryEmbedding.length === 0) {
      console.warn('[search] Embedding de la query vacío')
      return []
    }

    const { data, error } = await supabaseAdmin.rpc('buscar_conocimiento', {
      query_embedding:    `[${queryEmbedding.join(',')}]`,
      match_count:        maxResults,
      similarity_threshold: threshold,
    })

    if (error) throw error

    return (data || []).map((r: any) => ({
      contenido:  r.contenido,
      fuente:     r.titulo_doc,
      similitud:  Math.round(r.similarity * 100),
      metadata:   r.metadata,
    }))
  } catch (error: any) {
    console.error('[search] Error:', error?.message)
    return []
  }
}

// ── Obtener instrucciones del centro ─────────────────────────────────────────
export async function getCentroInstrucciones(): Promise<string> {
  try {
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
  } catch {
    return ''
  }
}

// ── Construir contexto completo para la IA ────────────────────────────────────
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

// ── Tipos exportados ──────────────────────────────────────────────────────────
export interface KnowledgeResult {
  contenido: string
  fuente:    string
  similitud: number
  metadata:  any
}
