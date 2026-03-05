// lib/ai-context-builder.ts
// Construye el contexto completo para cualquier análisis clínico de la IA:
// RAG (base de conocimiento) + historial del niño + instrucciones del centro

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getChildHistory } from '@/lib/child-history'

// ── Búsqueda semántica sin embeddings (fallback hasta que pgvector esté activo)
// Busca por similitud de texto simple en los chunks indexados
async function searchKnowledgeFallback(query: string, maxResults = 5): Promise<string> {
  try {
    // Palabras clave de la query para búsqueda parcial
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5)

    if (keywords.length === 0) return ''

    // Búsqueda por keywords en contenido de chunks
    const { data } = await supabaseAdmin
      .from('knowledge_chunks')
      .select('contenido, metadata, knowledge_documents(titulo)')
      .or(keywords.map(k => `contenido.ilike.%${k}%`).join(','))
      .limit(maxResults)

    if (!data || data.length === 0) return ''

    return `\n━━━ CONOCIMIENTO CLÍNICO RELEVANTE (${data.length} fuentes) ━━━\n` +
      data.map((c: any, i: number) =>
        `[Fuente ${i + 1}: ${c.knowledge_documents?.titulo || 'Base de conocimiento'}]\n${c.contenido.slice(0, 400)}...`
      ).join('\n\n') +
      `\n━━━ FIN CONOCIMIENTO ━━━\n`
  } catch {
    return ''
  }
}

// ── Obtener instrucciones del centro (siempre incluidas)
async function getCentroContext(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('centro_instrucciones')
      .select('titulo, contenido, prioridad')
      .eq('activo', true)
      .order('prioridad', { ascending: false })
      .limit(6)

    if (!data || data.length === 0) return ''

    return `\n━━━ INSTRUCCIONES DEL CENTRO ━━━\n` +
      data.map((i: any) => `[${i.titulo}]: ${i.contenido}`).join('\n') +
      `\n━━━ FIN INSTRUCCIONES ━━━\n`
  } catch {
    return ''
  }
}

// ── Builder principal ────────────────────────────────────────────────────────
export interface AIContextResult {
  childName: string
  childAge: string
  diagnosis: string
  historialTexto: string
  knowledgeContext: string
  centroContext: string
  fullContext: string // todo junto para el prompt
}

export async function buildAIContext(
  childId?: string,
  childNameFallback?: string,
  childAgeFallback?: string,
  searchQuery?: string
): Promise<AIContextResult> {
  // 1. Historial clínico del niño (paralelo con búsqueda de conocimiento)
  const [childHistory, knowledgeCtx, centroCtx] = await Promise.all([
    childId
      ? getChildHistory(childId, childNameFallback, childAgeFallback)
      : Promise.resolve({
          nombre: childNameFallback || 'Paciente',
          edad: childAgeFallback || 'N/E',
          diagnostico: 'No especificado',
          historialTexto: '',
        }),
    searchQuery ? searchKnowledgeFallback(searchQuery) : Promise.resolve(''),
    getCentroContext(),
  ])

  const fullContext = [
    centroCtx,
    knowledgeCtx,
    childHistory.historialTexto,
  ].filter(Boolean).join('\n')

  return {
    childName: childHistory.nombre,
    childAge: childHistory.edad,
    diagnosis: childHistory.diagnostico,
    historialTexto: childHistory.historialTexto,
    knowledgeContext: knowledgeCtx,
    centroContext: centroCtx,
    fullContext,
  }
}

// ── Retry helper Gemini (reutilizable) ──────────────────────────────────────
export async function callGeminiSafe(
  ai: any,
  model: string,
  prompt: string,
  config: any = {},
  maxRetries = 4
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { temperature: 0.5, maxOutputTokens: 2500, ...config },
      })
      return response.text || ''
    } catch (err: any) {
      const isRetryable =
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('503') ||
        err?.message?.includes('UNAVAILABLE')

      if (isRetryable && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 3000
        console.warn(`⚠️ Gemini retry ${attempt + 1}/${maxRetries} en ${delay / 1000}s`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('CUOTA_AGOTADA')
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

// ── Parser JSON seguro ───────────────────────────────────────────────────────
export function parseAIJson(rawText: string, fallback: any = {}): any {
  try {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return { ...fallback, raw_text: rawText }
}
