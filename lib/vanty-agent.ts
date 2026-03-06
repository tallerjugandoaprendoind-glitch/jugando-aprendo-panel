// lib/vanty-agent.ts
// El Agente IA de Vanty — cerebro clínico con memoria, herramientas y análisis proactivo

import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildKnowledgeContext, searchKnowledge } from '@/lib/knowledge-base'
import { getChildHistory } from '@/lib/child-history'
import { callGroq, callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'



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

  // FIX: Resumen de TODOS los pacientes para preguntas generales
  async obtenerResumenTodosPacientes() {
    const { data: pacientes } = await supabaseAdmin
      .from('children')
      .select('id, name, age, birth_date, diagnosis, status')
      .order('name', { ascending: true })
      .limit(50)

    if (!pacientes || pacientes.length === 0) return 'No hay pacientes registrados en el sistema.'

    const resumenes: string[] = []

    for (const p of pacientes as any[]) {
      // Edad calculada
      let edadTexto = p.age ? `${p.age} años` : 'edad N/E'
      if (!p.age && p.birth_date) {
        const hoy = new Date()
        const nac = new Date(p.birth_date)
        const diff = hoy.getFullYear() - nac.getFullYear()
        const m = hoy.getMonth() - nac.getMonth()
        const edad = (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) ? diff - 1 : diff
        edadTexto = `${edad} años`
      }

      // Última sesión ABA
      const { data: ultimaSesion } = await supabaseAdmin
        .from('registro_aba')
        .select('fecha_sesion, datos')
        .eq('child_id', p.id)
        .order('fecha_sesion', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Programas activos
      const { data: programas } = await supabaseAdmin
        .from('programas_aba')
        .select('id, titulo, estado')
        .eq('child_id', p.id)
        .eq('estado', 'activo')
        .limit(3)

      // Alertas activas
      const { data: alertas } = await supabaseAdmin
        .from('agente_alertas')
        .select('tipo, prioridad')
        .eq('child_id', p.id)
        .eq('resuelta', false)
        .limit(5)

      const alertasAltas = (alertas || []).filter((a: any) => a.prioridad === 'alta').length
      const alertasMedia = (alertas || []).filter((a: any) => a.prioridad === 'media').length

      let nivelLogro = 'sin datos'
      if (ultimaSesion && (ultimaSesion as any).datos?.nivel_logro_objetivos) {
        const val = (ultimaSesion as any).datos.nivel_logro_objetivos
        nivelLogro = typeof val === 'string' && val.includes('-') ? val : `${val}%`
      }

      const diasSinSesion = ultimaSesion
        ? Math.floor((Date.now() - new Date((ultimaSesion as any).fecha_sesion).getTime()) / 86400000)
        : null

      resumenes.push(
        `PACIENTE: ${p.name} | ${edadTexto} | Dx: ${p.diagnosis || 'No especificado'}\n` +
        `  Última sesión: ${ultimaSesion ? (ultimaSesion as any).fecha_sesion + (diasSinSesion !== null ? ` (hace ${diasSinSesion} días)` : '') : 'ninguna registrada'}\n` +
        `  Último logro de objetivos: ${nivelLogro}\n` +
        `  Programas ABA activos: ${programas?.length || 0}${programas && programas.length > 0 ? ' (' + (programas as any[]).map(pr => pr.titulo).join(', ') + ')' : ''}\n` +
        `  Alertas activas: ${(alertas || []).length}${alertasAltas > 0 ? ` (${alertasAltas} ALTA prioridad)` : ''}${alertasMedia > 0 ? ` (${alertasMedia} media)` : ''}`
      )
    }

    return `RESUMEN DEL SISTEMA — ${pacientes.length} PACIENTES ACTIVOS:\n\n${resumenes.join('\n\n')}`
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
const SYSTEM_PROMPT = `Eres ARIA, el asistente clínico inteligente de Vanty — una plataforma de intervención infantil especializada en ABA, TEA, TDAH y neurodesarrollo.

IDENTIDAD:
- Eres un neuropsicólogo clínico y analista de conducta certificado (nivel IBA) con 15+ años de experiencia
- Conoces profundamente el DSM-5-TR, los principios de Malott, las guías éticas IBAO y programas ABA basados en evidencia
- Hablas español clínico, cálido y profesional
- SIEMPRE usas datos reales del sistema cuando están disponibles en el contexto

CAPACIDADES:
1. Analizar tendencias de progreso de programas ABA con interpretación clínica
2. Responder preguntas basándote en libros, protocolos y guías indexadas
3. Sugerir ajustes a programas basados en datos de sesiones
4. Alertar sobre regresiones, estancamientos o situaciones éticas
5. Generar sugerencias de nuevos programas según diagnóstico
6. Comparar pacientes y dar visión global del centro cuando se te pida
7. Apoyar al especialista durante y después de sesiones

ACCESO A DATOS:
- Cuando el contexto incluya "RESUMEN DEL SISTEMA" o "HISTORIAL CLÍNICO", ÚSALOS directamente para responder
- Nunca digas "no tengo acceso" si los datos están en el contexto
- Para preguntas sobre el estado de pacientes, usa los datos de alertas, última sesión y logro de objetivos del contexto
- Para comparar pacientes, analiza todos los pacientes del resumen y da una respuesta específica con nombres

REGLAS:
- Siempre cita la fuente cuando uses conocimiento de libros o guías (ej: "Según Malott Cap.12...")
- Si hay riesgo ético, aplica el modelo IBAO de resolución de problemas
- NUNCA respondas con evasivas genéricas si tienes datos en el contexto — úsalos
- Nunca inventes datos que no estén en el contexto
- Cuando analices tendencias, siempre considera el contexto clínico completo`

// ── Clase principal del Agente ────────────────────────────────────────────────
export class VantyAgent {
  private conversacionId: string | null = null

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
      // FIX: detectar preguntas sobre pacientes para cargar datos del sistema
      const preguntaSobrePacientes = /paciente|peor|mejor|progreso|todos|lista|quien|quién|comparar|estado|sesion|sesión|avance|regresion|regresión|alert/i.test(userMessage)

      const [knowledgeCtx, childCtx, globalCtx] = await Promise.all([
        buildKnowledgeContext(userMessage),
        options.childId ? AGENT_TOOLS.obtenerHistorialNino(options.childId) : Promise.resolve(''),
        // FIX: Si no hay paciente específico pero preguntan sobre pacientes, cargar todos
        (!options.childId && preguntaSobrePacientes)
          ? AGENT_TOOLS.obtenerResumenTodosPacientes()
          : Promise.resolve(''),
      ])

      // 3. Preparar mensajes con historial (formato Groq/OpenAI)
      const messages = conversacion.mensajes as any[]
      const historialReciente = messages.slice(-10)

      // Construir contexto completo
      let systemContext = SYSTEM_PROMPT + '\n\n' + knowledgeCtx
      if (childCtx) systemContext += '\nPACIENTE ACTIVO:\n' + childCtx
      if (globalCtx) systemContext += '\n\n' + globalCtx

      const groqMessages = [
        { role: 'system' as const, content: systemContext },
        ...historialReciente.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMessage },
      ]

      // 4. Llamar a Groq (gratis, rápido)
      const aiResponse = await callGroq(groqMessages, {
        model: GROQ_MODELS.SMART,
        temperature: 0.6,
        maxTokens: 2000,
      }) || 'No pude generar una respuesta.'

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
      const resumenPrompt = `Eres ARIA, analista de conducta. Resume el estado clínico actual de ${childHistory.nombre} en 2-3 oraciones basándote en estos datos:
      - ${programas.length} programas activos
      - Alertas detectadas: ${alertas.map(a => a.titulo).join(', ') || 'ninguna'}
      - Avances cercanos al criterio: ${sugerencias.join(', ') || 'ninguno'}
      Sé específico, clínico y menciona el nombre del paciente.`

      const resumenText = await callGroqSimple('Eres ARIA, analista de conducta clínica.', resumenPrompt, { model: GROQ_MODELS.SMART, temperature: 0.4, maxTokens: 300 })

      return {
        alertas,
        sugerencias,
        resumen: resumenText || 'Análisis completado.',
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

    // Con paciente específico: mostrar programas activos
    if ((msg.includes('tendencia') || msg.includes('progreso') || msg.includes('programa')) && childId) {
      const programas = await AGENT_TOOLS.obtenerProgramasNino(childId)
      if (programas !== 'No hay programas activos para este paciente.') {
        return `\n**Programas ABA activos:**\n${programas}`
      }
    }

    // FIX: Sin paciente, preguntas sobre quién está peor/mejor → ya se maneja en el contexto
    // Si la respuesta de la IA aún dice "no tengo acceso", forzar la carga
    if (!childId && (
      aiResponse.includes('no tengo acceso') ||
      aiResponse.includes('no puedo proporcionar') ||
      aiResponse.includes('sin acceso')
    ) && /paciente|peor|mejor|progreso|estado/i.test(msg)) {
      const resumen = await AGENT_TOOLS.obtenerResumenTodosPacientes()
      return `\n**Datos del sistema (respuesta directa):**\n${resumen}`
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
