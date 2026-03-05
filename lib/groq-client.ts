// lib/groq-client.ts
// Cliente Groq — reemplaza Gemini para texto/chat (gratis, más rápido)
// Gemini se mantiene SOLO para: PDFs, embeddings y knowledge-base

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Modelos disponibles en Groq (tier gratuito):
// - llama-3.3-70b-versatile   → mejor calidad, recomendado para reportes y análisis
// - llama3-8b-8192            → más rápido, bueno para chats simples
// - mixtral-8x7b-32768        → contexto largo (32k), bueno para historial largo
export const GROQ_MODELS = {
  SMART:   'llama-3.3-70b-versatile',   // reportes, análisis clínicos
  FAST:    'llama3-8b-8192',            // chats rápidos
  LONG:    'llama-3.3-70b-versatile',   // contexto largo (historial extenso)
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callGroq(
  messages: GroqMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    maxRetries?: number
  } = {}
): Promise<string> {
  const {
    model = GROQ_MODELS.SMART,
    temperature = 0.5,
    maxTokens = 2500,
    maxRetries = 3,
  } = options

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada')

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
        const msg = err?.error?.message || res.statusText

        // Rate limit → retry con backoff
        if (res.status === 429 && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 2000
          console.warn(`Groq rate limit, reintentando en ${delay / 1000}s...`)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        throw new Error(`Groq error ${res.status}: ${msg}`)
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (err: any) {
      if (attempt < maxRetries - 1 && err.message?.includes('429')) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000))
        continue
      }
      throw err
    }
  }
  throw new Error('Groq: máximo de reintentos alcanzado')
}

// Helper para prompt simple (sistema + usuario)
export async function callGroqSimple(
  systemPrompt: string,
  userPrompt: string,
  options: Parameters<typeof callGroq>[1] = {}
): Promise<string> {
  return callGroq(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options
  )
}
