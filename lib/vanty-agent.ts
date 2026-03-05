// lib/vanty-agent.ts
// El Agente IA de Vanty — cerebro clínico con memoria, herramientas y análisis proactivo

import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildKnowledgeContext, searchKnowledge } from '@/lib/knowledge-base'
import { getChildHistory } from '@/lib/child-history'
import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.0-flash'

// ── Herramientas del agente ──────────────────────────────────────────────────

const AGENT_TOOLS = {
  // Buscar en base de conocimiento
  async buscarConocimiento(query: string) {
    const results = await searchKnowledge(query, { maxResults: 4, threshold: 0.6 })
    return results.length > 0
      ? results.map(r => `[${r.fuente}]: ${r.contenido}`).join('\n\n')
      : 'No se encontró información específica sobre este tema en la base de conocimiento.'
  },

  // Obtener datos de un programa ABA
  async obtenerDatosPrograma(programaId: string) {
    const { data: programa } = await supabaseAdmin
      .from('programas_aba')
      .select('*, sesiones_datos_aba(fecha, porcentaje_exito, frecuencia_valor, fase, notas, nivel_ayuda)')
      .eq('id', programaId)
      .order('sesiones_datos_aba.fecha', { ascending: true })
      .single()

    if (!programa) return 'Programa no encontrado.'

    const sesiones = (programa as any).sesiones_datos_aba || []
    const tendencia = await calcularTendenciaLocal(sesiones)

    return JSON.stringify({
      titulo: (programa as any).titulo,
      area: (programa as any).area,
      fase_actual: (programa as any).fase_actual,
      estado: (programa as any).estado,
      criterio_dominio: `${(programa as any).criterio_dominio_pct}% en ${(programa as any).criterio_sesiones_consecutivas} sesiones`,
      total_sesiones: sesiones.length,
      ultima_sesion: sesiones[sesiones.length - 1],
      tendencia,
      sesiones_recientes: sesiones.slice(-5),
    }, null, 2)
  },

  // Obtener todos los programas de un niño
  async obtenerProgramasNino(childId: string) {
    const { data } = await supabaseAdmin
      .from('programas_aba')
      .select(`
        id, titulo, area, estado, fase_actual,
        sesiones_datos_aba(porcentaje_exito, fecha)
      `)
      .eq('child_id', childId)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) return 'No hay programas activos para este paciente.'

    return (data as any[]).map(p => {
      const sesiones = p.sesiones_datos_aba || []
      const ultimoPct = sesiones.length > 0
        ? sesiones[sesiones.length - 1]?.porcentaje_exito
        : null
      return `- ${p.titulo} (${p.area}) | Fase: ${p.fase_actual} | Último %: ${ultimoPct ?? 'sin datos'}`
    }).join('\n')
  },

  // Historial clínico del niño
  async obtenerHistorialNino(childId: string) {
    const history = await getChildHistory(childId)
    return `Paciente: ${history.nombre}, ${history.edad}\nDiagnóstico: ${history.diagnostico}\n${history.historialTexto}`
  },

  // Analizar tendencia de un programa
  async analizarTendencia(programaId: string, ultimasN: number = 5) {
    const { data } = await supabaseAdmin
      .rpc('calcular_tendencia_programa', { prog_id: programaId, ultimas_n: ultimasN })
    return JSON.stringify(data)
  },
}

// ── Calcular tendencia localmente ────────────────────────────────────────────
function calcularTendenciaLocal(sesiones: any[]) {
  if (sesiones.length < 2) return { tendencia: 'insuficiente', mensaje: 'Pocas sesiones' }

  const recientes = sesiones.slice(-5).map(s => s.porcentaje_exito).filter(Boolean)
  const anteriores = sesiones.slice(-10, -5).map(s => s.porcentaje_exito).filter(Boolean)

  if (recientes.length === 0) return { tendencia: 'sin_datos', mensaje: 'Sin datos de %' }

  const promReciente = recientes.reduce((a, b) => a + b, 0) / recientes.length
  const promAnterior = anteriores.length > 0
    ? anteriores.reduce((a, b) => a + b, 0) / anteriores.length
    : promReciente

  const cambio = promReciente - promAnterior

  return {
    promedio_reciente: Math.round(promReciente),
    promedio_anterior: Math.round(promAnterior),
    cambio: Math.round(cambio),
    tendencia: cambio > 5 ? 'mejorando' : cambio < -5 ? 'regresion' : 'estable',
  }
}

// ── Sistema prompt del agente ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres VADI, el asistente clínico inteligente de Vanty — una plataforma de intervención infantil especializada en ABA, TEA, TDAH y neurodesarrollo.

IDENTIDAD:
- Eres un neuropsicólogo clínico y analista de conducta certificado (nivel IBA) con 15+ años de experiencia
- Conoces profundamente el DSM-5-TR, los principios de Malott, las guías éticas IBAO y programas ABA basados en evidencia
- Hablas español clínico, cálido y profesional
- Nunca eres genérico — siempre usas el nombre del niño y datos específicos de su expediente

CAPACIDADES:
1. Analizar tendencias de progreso de programas ABA con interpretación clínica
2. Responder preguntas basándote en libros, protocolos y guías indexadas
3. Sugerir ajustes a programas basados en datos de sesiones
4. Alertar sobre regresiones, estancamientos o situaciones éticas
5. Generar sugerencias de nuevos programas según diagnóstico
6. Apoyar al especialista durante y después de sesiones

REGLAS:
- Siempre cita la fuente cuando uses conocimiento de libros o guías (ej: "Según Malott Cap.12...")
- Si hay riesgo ético, aplica el modelo IBAO de resolución de problemas
- Si no tienes datos suficientes, dilo claramente y pide más información
- Nunca inventes datos de sesiones o porcentajes que no hayas recibido
- Cuando analices tendencias, siempre considera el contexto clínico completo`

// ── Clase principal del Agente ────────────────────────────────────────────────
export class VantyAgent {
  private ai: GoogleGenAI
  private conversacionId: string | null = null

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  }

  // Iniciar o continuar una conversación
  async chat(
    userMessage: string,
    options: {
      childId?: string
      userId: string
      conversacionId?: string
      contexto?: string
    }
  ): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      // 1. Cargar o crear conversación
      let conversacion = await this.loadOrCreateConversacion(
        options.conversacionId,
        options.userId,
        options.childId,
        options.contexto
      )

      // 2. Construir contexto dinámico
      const [knowledgeCtx, childCtx] = await Promise.all([
        buildKnowledgeContext(userMessage),
        options.childId ? AGENT_TOOLS.obtenerHistorialNino(options.childId) : Promise.resolve(''),
      ])

      // 3. Preparar mensajes con historial
      const messages = conversacion.mensajes as any[]
      const historialReciente = messages.slice(-10) // últimos 10 mensajes

      // 4. Construir prompt completo
      const fullPrompt = `${SYSTEM_PROMPT}

${knowledgeCtx}
${childCtx ? `\nPACIENTE ACTIVO:\n${childCtx}` : ''}

HISTORIAL DE CONVERSACIÓN:
${historialReciente.map((m: any) => `${m.role === 'user' ? 'Especialista' : 'VADI'}: ${m.content}`).join('\n')}

Especialista: ${userMessage}

VADI:`

      // 5. Llamar al modelo
      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents: fullPrompt,
        config: { temperature: 0.6, maxOutputTokens: 2000 },
      })

      const aiResponse = response.text || 'No pude generar una respuesta.'

      // 6. Detectar si necesita usar herramientas
      const toolResult = await this.detectAndUseTool(userMessage, aiResponse, options.childId)
      const finalResponse = toolResult ? `${aiResponse}\n\n${toolResult}` : aiResponse

      // 7. Guardar en historial
      const updatedMessages = [
        ...messages,
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: finalResponse, timestamp: new Date().toISOString() },
      ]

      await supabaseAdmin
        .from('agente_conversaciones')
        .update({
          mensajes: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversacion.id)

      // 8. Log de acción
      await supabaseAdmin.from('agente_acciones').insert({
        conversacion_id: conversacion.id,
        child_id: options.childId,
        tipo_accion: 'chat',
        input_data: { mensaje: userMessage },
        output_data: { respuesta: finalResponse, tiempo_ms: Date.now() - startTime },
      })

      return {
        respuesta: finalResponse,
        conversacionId: conversacion.id,
        fuentesUsadas: await this.extractSources(finalResponse),
        tiempoMs: Date.now() - startTime,
      }
    } catch (error: any) {
      console.error('Error agente:', error)
      return {
        respuesta: 'Hubo un error procesando tu consulta. Por favor intenta de nuevo.',
        conversacionId: options.conversacionId || null,
        fuentesUsadas: [],
        tiempoMs: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  // Análisis proactivo de un paciente (ejecutar al abrir ficha)
  async analizarPacienteProactivo(childId: string): Promise<ProactiveAnalysis> {
    try {
      // Obtener todos los programas activos
      const { data: programas } = await supabaseAdmin
        .from('programas_aba')
        .select(`
          id, titulo, area, fase_actual, criterio_dominio_pct,
          sesiones_datos_aba(fecha, porcentaje_exito, fase)
        `)
        .eq('child_id', childId)
        .eq('estado', 'activo')

      if (!programas || programas.length === 0) {
        return { alertas: [], sugerencias: [], resumen: 'No hay programas activos para analizar.' }
      }

      const alertas: Alerta[] = []
      const sugerencias: string[] = []

      for (const prog of programas as any[]) {
        const sesiones = prog.sesiones_datos_aba || []
        if (sesiones.length < 2) continue

        const tendencia = calcularTendenciaLocal(sesiones)

        // Detectar regresión
        if (tendencia.tendencia === 'regresion' && (tendencia.cambio || 0) < -10) {
          alertas.push({
            tipo: 'regresion',
            titulo: `Regresión en "${prog.titulo}"`,
            mensaje: `El % de éxito bajó ${Math.abs(tendencia.cambio || 0)}% en las últimas sesiones (${tendencia.promedio_anterior}% → ${tendencia.promedio_reciente}%). Revisar antecedentes y reforzadores.`,
            prioridad: 'alta',
            programa_id: prog.id,
          })
        }

        // Detectar estancamiento (>5 sesiones sin cambio)
        if (sesiones.length >= 5 && tendencia.tendencia === 'estable' && (tendencia.promedio_reciente || 0) < 70) {
          alertas.push({
            tipo: 'estancamiento',
            titulo: `Estancamiento en "${prog.titulo}"`,
            mensaje: `Lleva ${sesiones.length} sesiones con promedio estable de ${tendencia.promedio_reciente}%. Considera revisar el procedimiento o nivel de ayuda.`,
            prioridad: 'media',
            programa_id: prog.id,
          })
        }

        // Detectar criterio próximo a cumplirse
        if ((tendencia.promedio_reciente || 0) >= prog.criterio_dominio_pct - 5) {
          sugerencias.push(`"${prog.titulo}" está al ${tendencia.promedio_reciente}% — cerca del criterio de dominio (${prog.criterio_dominio_pct}%). ¡Excelente progreso!`)
        }

        // Sin sesiones en 7+ días
        const ultimaFecha = sesiones[sesiones.length - 1]?.fecha
        if (ultimaFecha) {
          const diasSinSesion = Math.floor((Date.now() - new Date(ultimaFecha).getTime()) / 86400000)
          if (diasSinSesion >= 7) {
            alertas.push({
              tipo: 'sin_sesion',
              titulo: `Sin sesión hace ${diasSinSesion} días — "${prog.titulo}"`,
              mensaje: `El programa no ha tenido sesiones en ${diasSinSesion} días. Verificar si hay ausencia del paciente o cambio de prioridades.`,
              prioridad: diasSinSesion >= 14 ? 'alta' : 'baja',
              programa_id: prog.id,
            })
          }
        }
      }

      // Guardar alertas nuevas en BD
      if (alertas.length > 0) {
        await supabaseAdmin.from('agente_alertas').upsert(
          alertas.map(a => ({
            child_id: childId,
            tipo: a.tipo,
            titulo: a.titulo,
            mensaje: a.mensaje,
            programa_id: a.programa_id,
            prioridad: a.prioridad,
            resuelta: false,
          }))
        )
      }

      // Resumen general con IA
      const childHistory = await getChildHistory(childId)
      const resumenPrompt = `Eres VADI, analista de conducta. Resume el estado clínico actual de ${childHistory.nombre} en 2-3 oraciones basándote en estos datos:
      - ${programas.length} programas activos
      - Alertas detectadas: ${alertas.map(a => a.titulo).join(', ') || 'ninguna'}
      - Avances cercanos al criterio: ${sugerencias.join(', ') || 'ninguno'}
      Sé específico, clínico y menciona el nombre del paciente.`

      const resumenResp = await this.ai.models.generateContent({
        model: MODEL,
        contents: resumenPrompt,
        config: { temperature: 0.4, maxOutputTokens: 300 },
      })

      return {
        alertas,
        sugerencias,
        resumen: resumenResp.text || 'Análisis completado.',
      }
    } catch (error: any) {
      console.error('Error análisis proactivo:', error)
      return { alertas: [], sugerencias: [], resumen: 'Error al analizar el paciente.' }
    }
  }

  // Detectar si la pregunta requiere usar una herramienta
  private async detectAndUseTool(
    userMessage: string,
    aiResponse: string,
    childId?: string
  ): Promise<string | null> {
    const msg = userMessage.toLowerCase()

    if ((msg.includes('tendencia') || msg.includes('progreso') || msg.includes('sesiones')) && childId) {
      const programas = await AGENT_TOOLS.obtenerProgramasNino(childId)
      if (programas !== 'No hay programas activos para este paciente.') {
        return `\n**Programas activos:**\n${programas}`
      }
    }

    return null
  }

  // Extraer fuentes mencionadas en la respuesta
  private async extractSources(response: string): Promise<string[]> {
    const sources: string[] = []
    const patterns = [/Malott/i, /DSM-5/i, /IBAO/i, /LuTr/i, /IBA/i]
    patterns.forEach(p => {
      if (p.test(response)) sources.push(p.source.replace(/[/i]/g, ''))
    })
    return sources
  }

  // Cargar o crear conversación
  private async loadOrCreateConversacion(
    conversacionId?: string,
    userId?: string,
    childId?: string,
    contexto?: string
  ) {
    if (conversacionId) {
      const { data } = await supabaseAdmin
        .from('agente_conversaciones')
        .select('*')
        .eq('id', conversacionId)
        .single()
      if (data) return data
    }

    const { data } = await supabaseAdmin
      .from('agente_conversaciones')
      .insert({
        user_id: userId,
        child_id: childId,
        contexto: contexto || 'general',
        mensajes: [],
        titulo: `Consulta ${new Date().toLocaleDateString('es-PE')}`,
      })
      .select()
      .single()

    return data!
  }
}

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface AgentResponse {
  respuesta: string
  conversacionId: string | null
  fuentesUsadas: string[]
  tiempoMs: number
  error?: string
}

export interface Alerta {
  tipo: string
  titulo: string
  mensaje: string
  prioridad: 'alta' | 'media' | 'baja'
  programa_id?: string
}

export interface ProactiveAnalysis {
  alertas: Alerta[]
  sugerencias: string[]
  resumen: string
}

// Instancia singleton
export const vantyAgent = new VantyAgent()
