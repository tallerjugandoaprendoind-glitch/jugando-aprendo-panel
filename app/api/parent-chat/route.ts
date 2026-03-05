// app/api/parent-chat/route.ts
// Chat IA exclusivo para padres - respuestas en lenguaje accesible
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const { mensaje, childId, parentUserId } = await req.json()

    if (!mensaje || !childId || !parentUserId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Servicio no disponible' }, { status: 500 })

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
// IMPORTANTE: No se revelan datos clínicos técnicos sensibles
async function cargarContextoPadre(childId: string) {
  const { data: child } = await supabaseAdmin
    .from('children')
    .select('name, age, diagnosis, birth_date')
    .eq('id', childId)
    .single()

  // Solo últimas 5 sesiones ABA con info resumida
  const { data: sesiones } = await supabaseAdmin
    .from('registro_aba')
    .select('fecha_sesion, datos')
    .eq('child_id', childId)
    .order('fecha_sesion', { ascending: false })
    .limit(5)

  const { data: tareasPendientes } = await supabaseAdmin
    .from('tareas_hogar')
    .select('titulo, completada, fecha_asignada, instrucciones')
    .eq('child_id', childId)
    .eq('activa', true)
    .order('fecha_asignada', { ascending: false })
    .limit(5)

  const { data: proximaCita } = await supabaseAdmin
    .from('agenda_sesiones')
    .select('fecha, hora_inicio, tipo')
    .eq('child_id', childId)
    .gte('fecha', new Date().toISOString().split('T')[0])
    .in('estado', ['programada', 'confirmada'])
    .order('fecha', { ascending: true })
    .limit(1)
    .single()

  // Construir resumen legible de sesiones (SIN jerga técnica)
  const resumenSesiones = sesiones?.map((s, i) => {
    const d = s.datos || {}
    const nivelLogro = d.nivel_logro_objetivos || ''
    const logro = nivelLogro.includes('76') || nivelLogro.includes('Completamente') ? 'excelente'
      : nivelLogro.includes('51') || nivelLogro.includes('Mayormente') ? 'muy bien'
      : nivelLogro.includes('26') || nivelLogro.includes('Parcialmente') ? 'en progreso'
      : 'necesita apoyo'

    return `Sesion ${i + 1} (${s.fecha_sesion}): Trabajo en "${d.objetivo_principal || 'objetivos del dia'}". Como estuvo: ${logro}. ${d.avances_observados ? 'Avances: ' + d.avances_observados : ''}`
  }).join('\n') || 'Sin sesiones recientes registradas'

  const proximaCitaTexto = proximaCita
    ? `Proxima cita: ${(proximaCita as any).fecha} a las ${(proximaCita as any).hora_inicio?.slice(0, 5)}`
    : 'Sin proxima cita programada'

  const tareasTexto = tareasPendientes?.map(t =>
    `- "${t.titulo}" (${t.completada ? 'COMPLETADA' : 'PENDIENTE'})`
  ).join('\n') || 'Sin tareas asignadas'

  return {
    nombre: (child as any)?.name || 'tu hijo/a',
    edad: (child as any)?.age,
    diagnostico: (child as any)?.diagnosis,
    resumenSesiones,
    proximaCita: proximaCitaTexto,
    tareas: tareasTexto
  }
}

// ─── GENERAR RESPUESTA PARA PADRE ────────────────────────────
async function generarRespuestaPadre(
  mensaje: string,
  contexto: any,
  historial: any[],
  nombrePadre: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const systemPrompt = `Eres el asistente virtual del Centro Jugando Aprendo, especializado en comunicacion con familias.

INFORMACION DEL PACIENTE (para tu referencia interna - no revelar datos tecnicos):
Nombre: ${contexto.nombre}
Edad: ${contexto.edad} anos
Diagnostico: ${contexto.diagnostico}
${contexto.proximaCita}

ULTIMAS SESIONES (resumen):
${contexto.resumenSesiones}

TAREAS PARA EL HOGAR:
${contexto.tareas}

REGLAS CRITICAS:
1. Usa lenguaje SIMPLE y CALIDO. Nada de terminos tecnicos como "análisis funcional", "prompt fading", "contingencia", etc.
2. Responde SIEMPRE en espanol.
3. Se POSITIVO y esperanzador, pero honesto.
4. Maximo 3-4 oraciones por respuesta.
5. NO reveles datos clinicos sensibles como puntuaciones de evaluaciones, diagnosticos detallados, ni comparaciones con otros pacientes.
6. Si el padre pregunta algo que necesita atencion medica o clinica especializada, recomienda hablar directamente con la terapeuta.
7. Puedes hablar del progreso, las tareas, proximas citas, y dar consejos generales de apoyo en casa.
8. Trata al padre por su nombre cuando sea natural: ${nombrePadre}.
9. Si hay tareas pendientes, recuerdalas amablemente.

TONO: Como una amiga profesional que conoce al nino y quiere ayudar a la familia.`

  // Construir mensajes con historial
  const mensajes = historial.map(h => ({
    role: h.rol as 'user' | 'model',
    parts: [{ text: h.mensaje }]
  }))
  mensajes.push({ role: 'user', parts: [{ text: mensaje }] })

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nAhora responde al mensaje del padre.' }] },
      { role: 'model', parts: [{ text: 'Entendido. Estoy aqui para ayudar a la familia de ' + contexto.nombre + '.' }] },
      ...mensajes
    ],
  })

  return response.text || 'Disculpa, no pude procesar tu mensaje. Por favor intenta nuevamente.'
}
