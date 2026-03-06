// app/api/parent-chat/route.ts
// Chat IA exclusivo para padres - respuestas en lenguaje accesible
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroq, callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

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
    const { mensaje, childId, parentUserId } = await req.json()

    if (!mensaje || !childId || !parentUserId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que el padre tiene acceso a este paciente
    const { data: acceso } = await supabaseAdmin
      .from('parent_accounts')
      .select('id, nombre')
      .eq('user_id', parentUserId)
      .eq('child_id', childId)
      .single()

    if (!acceso) {
      return NextResponse.json({ error: 'No tienes acceso a este paciente' }, { status: 403 })
    }

    // Cargar historial del chat (últimas 10 conversaciones)
    const { data: historial } = await supabaseAdmin
      .from('chat_padres')
      .select('rol, mensaje')
      .eq('child_id', childId)
      .eq('parent_user_id', parentUserId)
      .order('created_at', { ascending: false })
      .limit(10)

    const historialOrdenado = (historial || []).reverse()

    // Cargar contexto LIMITADO del paciente (solo info apta para padres)
    const contexto = await cargarContextoPadre(childId)

    // Guardar mensaje del padre
    await supabaseAdmin.from('chat_padres').insert({
      child_id: childId,
      parent_user_id: parentUserId,
      rol: 'user',
      mensaje
    })

    // Generar respuesta IA
    const respuesta = await generarRespuestaPadre(mensaje, contexto, historialOrdenado, (acceso as any).nombre)

    // Guardar respuesta
    await supabaseAdmin.from('chat_padres').insert({
      child_id: childId,
      parent_user_id: parentUserId,
      rol: 'assistant',
      mensaje: respuesta
    })

    return NextResponse.json({ respuesta })
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

  // FIX: edad calculada correctamente
  const edadTexto = calcularEdad((child as any)?.birth_date, (child as any)?.age)

  return {
    nombre: (child as any)?.name || 'tu hijo/a',
    edad: edadTexto,
    diagnostico: (child as any)?.diagnosis || 'En evaluación',
    resumenSesiones,
    proximaCita: proximaCitaTexto,
    tareas: tareasTexto,
    tieneTareasActivas: (tareasPendientes?.filter(t => !t.completada).length || 0) > 0
  }
}

// ─── GENERAR RESPUESTA PARA PADRE ────────────────────────────
async function generarRespuestaPadre(
  mensaje: string,
  contexto: any,
  historial: any[],
  nombrePadre: string
): Promise<string> {
  const systemPrompt = `Eres el asistente virtual del Centro Jugando Aprendo, especializado en comunicacion con familias.

INFORMACION DEL PACIENTE:
Nombre: ${contexto.nombre}
Edad: ${contexto.edad}
Diagnostico: ${contexto.diagnostico}
${contexto.proximaCita}

ULTIMAS SESIONES (resumen):
${contexto.resumenSesiones}

ACTIVIDADES Y TAREAS PARA EL HOGAR:
${contexto.tareas}

REGLAS CRITICAS:
1. Usa lenguaje SIMPLE y CALIDO. Nada de terminos tecnicos.
2. Responde SIEMPRE en espanol.
3. Se POSITIVO y esperanzador, pero honesto.
4. Maximo 3-4 oraciones por respuesta.
5. NO reveles datos clinicos sensibles.
6. Si el padre pregunta algo clinico especializado, recomienda hablar con la terapeuta.
7. Puedes hablar del progreso, las tareas, proximas citas y dar consejos de apoyo en casa.
8. Trata al padre por su nombre cuando sea natural: ${nombrePadre}.
9. Si hay tareas pendientes o actividades para casa, recuerdalas y explicalas con entusiasmo.
10. Cuando pregunten "como va [nombre]" o "como le fue", resume el progreso reciente de forma positiva y menciona las actividades pendientes.

TONO: Como una amiga profesional que conoce al nino y quiere ayudar a la familia.`

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
