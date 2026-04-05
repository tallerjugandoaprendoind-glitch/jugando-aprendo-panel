// lib/groq-client.ts
// Cliente Groq — con fallback automático entre modelos cuando se agota el límite diario

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Cadena de fallback: si el modelo principal falla por rate limit,
// se prueba automáticamente el siguiente en la lista.
export const GROQ_MODELS = {
  SMART: 'llama-3.3-70b-versatile',   // reportes, análisis clínicos
  FAST:  'llama3-8b-8192',            // chats rápidos
  LONG:  'llama-3.3-70b-versatile',   // contexto largo
}

// Orden de fallback cuando se alcanza el límite de tokens/día
// Se prueban en orden hasta encontrar uno disponible
const FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',   // mejor calidad
  'llama3-70b-8192',           // alternativa 70b
  'llama3-8b-8192',            // rápido, menor límite
  'gemma2-9b-it',              // Google Gemma (disponible en Groq)
  'mixtral-8x7b-32768',        // Mixtral contexto largo
]

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Intentar un modelo específico — retorna null si hay rate limit (429)
async function tryModel(
  apiKey: string,
  model: string,
  messages: GroqMessage[],
  temperature: number,
  maxTokens: number,
): Promise<string | null> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: false }),
    })

    if (res.status === 429) {
      const err = await res.json().catch(() => ({}))
      console.warn(`[Groq] Límite alcanzado en ${model}: ${err?.error?.message || '429'}`)
      return null // señal para probar el siguiente modelo
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(`Groq error ${res.status} (${model}): ${err?.error?.message || res.statusText}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (err: any) {
    // Si el error es de red/timeout (no 429), lo propagamos
    if (!err.message?.includes('429') && !err.message?.includes('rate limit')) throw err
    return null
  }
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
  } = options

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada')

  // Construir cadena de fallback: modelo preferido primero, luego los alternativos
  const modelsToTry = [model, ...FALLBACK_CHAIN.filter(m => m !== model)]

  for (const currentModel of modelsToTry) {
    const result = await tryModel(apiKey, currentModel, messages, temperature, maxTokens)
    if (result !== null) {
      if (currentModel !== model) {
        console.info(`[Groq] Usando fallback: ${currentModel} (preferido: ${model})`)
      }
      return result
    }
    // null = rate limit, probar siguiente
  }

  throw new Error(
    'Groq: límite de tokens diario agotado en todos los modelos disponibles. ' +
    'Se restablece a medianoche (hora UTC). Puedes ampliar el límite en https://console.groq.com/settings/billing'
  )
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
