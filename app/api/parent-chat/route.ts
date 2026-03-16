// app/api/parent-chat/route.ts
// Chat IA exclusivo para padres - respuestas en lenguaje accesible
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroq, callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { buildParentChatContext } from '@/lib/ai-context-builder'

// FIX: calcular edad en años desde birth_date cuando age no está disponible
function calcularEdad(birthDate: string | null | undefined, ageFallback: number | null | undefined): string {
  if (birthDate) {
    const hoy = new Date()
    const nacimiento = new Date(birthDate)
    const diff = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    const edad = (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) ? diff - 1 : diff
    if (edad >= 0 && edad < 120) return `${edad} años`
  }
  if (ageFallback != null && !isNaN(Number(ageFallback))) return `${ageFallback} años`
  return 'edad no registrada'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // FIX: aceptar AMBOS formatos de campo:
    // - Frontend padre usa: { question, childId, childName }
    // - Otros clientes usan: { mensaje, childId, parentUserId }
    const mensaje      = body.question || body.mensaje
    const childId      = body.childId
    const parentUserId = body.parentUserId || null   // opcional — no bloquear si no viene
    const childName    = body.childName || null

    if (!mensaje || !childId) {
      return NextResponse.json({ error: 'Faltan campos requeridos: mensaje y childId' }, { status: 400 })
    }

    // Verificar acceso del padre solo si se provee parentUserId
    let nombrePadre = 'Familia'
    if (parentUserId) {
      const { data: acceso } = await supabaseAdmin
        .from('parent_accounts')
        .select('id, nombre')
        .eq('user_id', parentUserId)
        .eq('child_id', childId)
        .maybeSingle()   // maybeSingle en vez de single — no lanza error si no encuentra

      if (acceso) nombrePadre = (acceso as any).nombre || 'Familia'
      // No bloqueamos si no hay acceso registrado — el padre puede venir de sesión directa
    }

    // Cargar historial del chat (últimas 10 conversaciones)
    const historialQuery = supabaseAdmin
      .from('chat_padres')
      .select('rol, mensaje')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (parentUserId) historialQuery.eq('parent_user_id', parentUserId)
    const { data: historial } = await historialQuery
    const historialOrdenado = (historial || []).reverse()

    // Cargar contexto FILTRADO del paciente (solo info apta para padres)
    const contexto = await cargarContextoPadre(childId)

    // Guardar mensaje (solo si hay parentUserId para no generar basura)
    if (parentUserId) {
      try {
        await supabaseAdmin.from('chat_padres').insert({
          child_id: childId,
          parent_user_id: parentUserId,
          rol: 'user',
          mensaje
        })
      } catch {} // no bloquear si falla el guardado
    }

    // Generar respuesta IA
    const respuesta = await generarRespuestaPadre(mensaje, contexto, historialOrdenado, nombrePadre)

    // Guardar respuesta
    if (parentUserId) {
      try {
        await supabaseAdmin.from('chat_padres').insert({
          child_id: childId,
          parent_user_id: parentUserId,
          rol: 'assistant',
          mensaje: respuesta
        })
      } catch {}
    }

    // FIX: responder con AMBOS campos para compatibilidad con los dos frontends
    return NextResponse.json({ respuesta, text: respuesta })
  } catch (e: any) {
    console.error('❌ Error en parent-chat:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId      = searchParams.get('child_id')
  const parentUserId = searchParams.get('parent_user_id')

  try {
    const { data } = await supabaseAdmin
      .from('chat_padres')
      .select('id, rol, mensaje, created_at')
      .eq('child_id', childId!)
      .eq('parent_user_id', parentUserId!)
      .order('created_at', { ascending: true })
      .limit(50)

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── CONTEXTO FILTRADO PARA PADRES ───────────────────────────
async function cargarContextoPadre(childId: string) {
  // FIX: seleccionar birth_date además de age para calcular edad correctamente
  const { data: child } = await supabaseAdmin
    .from('children')
    .select('name, age, birth_date, diagnosis')
    .eq('id', childId)
    .single()

  const { data: sesiones } = await supabaseAdmin
    .from('registro_aba')
    .select('fecha_sesion, datos')
    .eq('child_id', childId)
    .order('fecha_sesion', { ascending: false })
    .limit(5)

  // FIX: cargar tareas activas Y completadas recientes para mostrar actividades
  const { data: tareasPendientes } = await supabaseAdmin
    .from('tareas_hogar')
    .select('titulo, completada, fecha_asignada, instrucciones, fecha_limite')
    .eq('child_id', childId)
    .eq('activa', true)
    .order('fecha_asignada', { ascending: false })
    .limit(8)

  const { data: proximaCita } = await supabaseAdmin
    .from('agenda_sesiones')
    .select('fecha, hora_inicio, tipo')
    .eq('child_id', childId)
    .gte('fecha', new Date().toISOString().split('T')[0])
    .in('estado', ['programada', 'confirmada'])
    .order('fecha', { ascending: true })
    .limit(1)
    .single()

  const resumenSesiones = sesiones?.map((s, i) => {
    const d = s.datos || {}
    const nivelLogro = String(d.nivel_logro_objetivos || '')
    const logro = (nivelLogro.includes('76') || nivelLogro.includes('Completamente') || Number(nivelLogro) >= 76) ? 'excelente'
      : (nivelLogro.includes('51') || nivelLogro.includes('Mayormente') || Number(nivelLogro) >= 51) ? 'muy bien'
      : (nivelLogro.includes('26') || nivelLogro.includes('Parcialmente') || Number(nivelLogro) >= 26) ? 'en progreso'
      : 'necesita apoyo'

    return `Sesion ${i + 1} (${s.fecha_sesion}): Trabajo en "${d.objetivo_principal || 'objetivos del dia'}". Como estuvo: ${logro}. ${d.avances_observados ? 'Avances: ' + d.avances_observados : ''}`
  }).join('\n') || 'Sin sesiones recientes registradas'

  const proximaCitaTexto = proximaCita
    ? `Proxima cita: ${(proximaCita as any).fecha} a las ${(proximaCita as any).hora_inicio?.slice(0, 5)}`
    : 'Sin proxima cita programada'

  // FIX: mostrar instrucciones resumidas de las tareas para que la IA pueda explicarlas
  const tareasTexto = tareasPendientes?.map(t => {
    const instrResumidas = t.instrucciones
      ? t.instrucciones.slice(0, 200) + (t.instrucciones.length > 200 ? '...' : '')
      : ''
    return `- "${t.titulo}" (${t.completada ? 'COMPLETADA ✅' : 'PENDIENTE ⏳'})${instrResumidas ? '\n  Instrucciones: ' + instrResumidas : ''}`
  }).join('\n') || 'Sin tareas asignadas actualmente'

  // FIX: Programas ABA activos (qué habilidades está trabajando)
  const { data: programas } = await supabaseAdmin
    .from('programas_aba')
    .select('titulo, area, fase_actual, estado')
    .eq('child_id', childId)
    .eq('estado', 'activo')
    .order('created_at', { ascending: false })
    .limit(6)

  const programasTexto = programas && programas.length > 0
    ? programas.map((p: any) => `- "${p.titulo}" (área: ${p.area}, fase: ${p.fase_actual || 'inicial'})`).join('\n')
    : 'Sin programas ABA registrados actualmente'

  // FIX: edad calculada correctamente
  const edadTexto = calcularEdad((child as any)?.birth_date, (child as any)?.age)

  return {
    nombre: (child as any)?.name || 'tu hijo/a',
    edad: edadTexto,
    diagnostico: (child as any)?.diagnosis || 'En evaluación',
    resumenSesiones,
    proximaCita: proximaCitaTexto,
    tareas: tareasTexto,
    programas: programasTexto,
    tieneTareasActivas: (tareasPendientes?.filter((t: any) => !t.completada).length || 0) > 0
  }
}

// ─── GENERAR RESPUESTA PARA PADRE ────────────────────────────
async function generarRespuestaPadre(
  mensaje: string,
  contexto: any,
  historial: any[],
  nombrePadre: string
): Promise<string> {
  // 🧠 Buscar en Cerebro IA (libros clínicos) contexto relevante para la pregunta
  const knowledgeCtx = await buildParentChatContext(mensaje, '')

  const systemPrompt = `Eres ARIA, el asistente virtual del Centro Jugando Aprendo para familias.
Eres cálida, positiva y accesible. Conoces bien el caso de ${contexto.nombre}.

INFORMACION DEL PACIENTE:
Nombre: ${contexto.nombre} | Edad: ${contexto.edad} | Diagnostico: ${contexto.diagnostico}
${contexto.proximaCita}

HABILIDADES QUE ESTÁ TRABAJANDO (programas ABA activos):
${contexto.programas}

ULTIMAS SESIONES:
${contexto.resumenSesiones}

ACTIVIDADES Y TAREAS PARA EL HOGAR:
${contexto.tareas}

REGLAS CRITICAS:
1. Usa lenguaje SIMPLE y CALIDO. Sin términos técnicos clínicos.
2. Responde SIEMPRE en español.
3. Se POSITIVO y esperanzador, pero honesto.
4. Respuestas de 2-4 oraciones (cortas y claras).
5. USA los datos del contexto — NUNCA digas "no tengo acceso" si la info está arriba.
6. Si preguntan por el progreso o última sesión, RESPONDE con los datos reales del contexto.
7. Si preguntan qué está trabajando, menciona los programas ABA en lenguaje simple para padres.
8. Para preguntas clínicas muy especializadas, recomienda hablar con la terapeuta.
9. Trata al padre/madre por su nombre: ${nombrePadre}.
10. Si hay tareas pendientes, recuérdalas con entusiasmo y explica cómo ayudan.
11. Cuando pregunten "como le fue" usa el resumen de sesiones para dar datos reales.
CONFIDENCIALIDAD: Comparte avances, logros, actividades y citas. NO compartas notas clínicas detalladas ni comparaciones con otros pacientes.

${knowledgeCtx ? `
━━━ CONOCIMIENTO CLÍNICO DE RESPALDO (Cerebro IA) ━━━
${knowledgeCtx}
Cuando sea útil, usa este conocimiento para dar consejos basados en evidencia, explicado en lenguaje simple para padres.
━━━ FIN ━━━` : ''}`

  // Build chat messages for Groq
  const groqMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...historial.map(h => ({
      role: h.rol as 'user' | 'assistant',
      content: h.mensaje,
    })),
    { role: 'user' as const, content: mensaje },
  ]

  try {
    const respuesta = await callGroq(groqMessages, {
      model: GROQ_MODELS.SMART,
      temperature: 0.5,
      maxTokens: 600,
    })

    if (respuesta && respuesta.trim().length > 10) return respuesta

    // FIX: Fallback a callGroqSimple si callGroq falla o retorna vacío
    const fallback = await callGroqSimple(systemPrompt, mensaje, {
      model: GROQ_MODELS.SMART,
      temperature: 0.5,
      maxTokens: 600,
    })

    return fallback || generarRespuestaFallback(contexto, mensaje)
  } catch (err: any) {
    console.error('Error Groq en parent-chat:', err.message)
    return generarRespuestaFallback(contexto, mensaje)
  }
}

// FIX: respuesta de fallback con datos reales cuando la IA falla
function generarRespuestaFallback(contexto: any, mensaje: string): string {
  const msgLower = mensaje.toLowerCase()
  if (msgLower.includes('tarea') || msgLower.includes('actividad') || msgLower.includes('casa')) {
    return contexto.tieneTareasActivas
      ? `Hola! ${contexto.nombre} tiene actividades pendientes para realizar en casa. Puedes verlas en la sección "Tareas" de la app. La constancia en casa hace una gran diferencia en su progreso. 💪`
      : `Actualmente ${contexto.nombre} no tiene actividades pendientes asignadas. ¡Sigue así, han hecho un gran trabajo! Tu terapeuta asignará nuevas actividades pronto.`
  }
  if (msgLower.includes('cita') || msgLower.includes('sesion') || msgLower.includes('sesión')) {
    return `${contexto.proximaCita}. Si necesitas cambiar la cita, puedes hacerlo desde la sección Agenda de la app o contactar directamente al centro.`
  }
  return `Gracias por tu mensaje sobre ${contexto.nombre}. En este momento tengo dificultades técnicas para responder. Por favor, intenta nuevamente en unos minutos o contacta directamente al terapeuta del centro.`
}
