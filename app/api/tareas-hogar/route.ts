// app/api/tareas-hogar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId     = searchParams.get('child_id')
  const parentUserId = searchParams.get('parent_user_id')
  const soloActivas = searchParams.get('activas') !== 'false'

  try {
    let query = supabaseAdmin
      .from('tareas_hogar')
      .select('*, children(name), terapeuta:terapeuta_id(email, raw_user_meta_data)')
      .order('fecha_asignada', { ascending: false })

    if (childId)     query = query.eq('child_id', childId)
    if (soloActivas) query = query.eq('activa', true)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ── CREAR TAREA CON IA ────────────────────────────────────
    if (action === 'crear' || !action) {
      const { child_id, terapeuta_id, sesion_id, titulo, objetivo, fecha_limite } = body

      if (!child_id || !titulo) {
        return NextResponse.json({ error: 'child_id y titulo son requeridos' }, { status: 400 })
      }

      // Generar instrucciones con IA
      const instrucciones = await generarInstruccionesIA(child_id, titulo, objetivo)

      const { data, error } = await supabaseAdmin
        .from('tareas_hogar')
        .insert({
          child_id, terapeuta_id, sesion_id,
          titulo, objetivo,
          instrucciones,
          fecha_asignada: new Date().toISOString().split('T')[0],
          fecha_limite: fecha_limite || null,
          activa: true
        })
        .select('*, children(name)')
        .single()

      if (error) throw error

      // Notificar a los padres
      await notificarPadresTareaNueva(child_id, data)

      return NextResponse.json({ data })
    }

    // ── MARCAR COMO COMPLETADA (por padre) ───────────────────
    if (action === 'completar') {
      const { id, nota_padre, dificultad_reportada } = body

      const { data, error } = await supabaseAdmin
        .from('tareas_hogar')
        .update({
          completada: true,
          fecha_completada: new Date().toISOString(),
          nota_padre: nota_padre || null,
          dificultad_reportada: dificultad_reportada || null
        })
        .eq('id', id)
        .select('*, children(name, id)')
        .single()

      if (error) throw error

      // Notificar al terapeuta
      await notificarTerapeutaTareaCompletada(data)

      return NextResponse.json({ data })
    }

    // ── GENERAR INSTRUCCIONES IA para tarea existente ─────────
    if (action === 'regenerar_instrucciones') {
      const { id, child_id, titulo, objetivo } = body
      const instrucciones = await generarInstruccionesIA(child_id, titulo, objetivo)

      const { data, error } = await supabaseAdmin
        .from('tareas_hogar')
        .update({ instrucciones })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data })
    }

    // ── DESACTIVAR tarea ──────────────────────────────────────
    if (action === 'desactivar') {
      const { id } = body
      const { error } = await supabaseAdmin
        .from('tareas_hogar')
        .update({ activa: false })
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Accion no reconocida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── GENERAR INSTRUCCIONES CON GEMINI ────────────────────────
async function generarInstruccionesIA(childId: string, titulo: string, objetivo?: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return generarInstruccionesGenericas(titulo)

    const { data: child } = await supabaseAdmin
      .from('children')
      .select('name, age, diagnosis')
      .eq('id', childId)
      .single()

    const ai = new GoogleGenAI({ apiKey })
    const prompt = `Eres un terapeuta ABA especializado en neuropsicologia infantil.

Genera instrucciones CLARAS y PRACTICAS para que los padres realicen esta actividad terapeutica en casa:

PACIENTE: ${(child as any)?.name}, ${(child as any)?.age} años, diagnostico: ${(child as any)?.diagnosis}
ACTIVIDAD: ${titulo}
OBJETIVO TERAPEUTICO: ${objetivo || 'Reforzar habilidades trabajadas en sesion'}

Responde con instrucciones paso a paso en este formato exacto:
MATERIALES NECESARIOS: [lista de materiales, si aplica]
DURACION SUGERIDA: [X minutos]
COMO HACERLO:
1. [paso 1]
2. [paso 2]
3. [paso 3]
(maximo 5 pasos)
CONSEJO PARA PADRES: [1 consejo practico]
QUE OBSERVAR: [que registrar o notar]

Usa lenguaje simple, sin tecnicismos. Maximo 150 palabras total.`

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    })

    return response.text || generarInstruccionesGenericas(titulo)
  } catch {
    return generarInstruccionesGenericas(titulo)
  }
}

function generarInstruccionesGenericas(titulo: string): string {
  return `ACTIVIDAD: ${titulo}

COMO HACERLO:
1. Busca un momento tranquilo del dia, sin distracciones.
2. Realiza la actividad junto a tu hijo/a de forma positiva.
3. Celebra cada logro, por pequeno que sea.
4. Si hay dificultades, toma un descanso y reintentalo despues.

DURACION SUGERIDA: 10-15 minutos
CONSEJO PARA PADRES: La constancia es clave. Intenta hacerlo a la misma hora cada dia.
QUE OBSERVAR: Nivel de participacion y cualquier dificultad que notes.`
}

// ─── NOTIFICACIONES ───────────────────────────────────────────
async function notificarPadresTareaNueva(childId: string, tarea: any) {
  try {
    const { data: padres } = await supabaseAdmin
      .from('parent_accounts')
      .select('user_id')
      .eq('child_id', childId)

    if (!padres || padres.length === 0) return

    const notifs = padres.map(p => ({
      user_id: p.user_id,
      child_id: childId,
      tipo: 'tarea_nueva',
      titulo: 'Nueva tarea terapeutica asignada',
      mensaje: `Tu terapeuta asigno una nueva actividad: "${tarea.titulo}". Ingresa a la app para ver las instrucciones.`,
      prioridad: 2,
      canal: 'in_app',
      metadata: { tarea_id: tarea.id }
    }))

    await supabaseAdmin.from('notificaciones').insert(notifs)
  } catch (err) {
    console.error('Error notificando tarea nueva:', err)
  }
}

async function notificarTerapeutaTareaCompletada(tarea: any) {
  try {
    if (!tarea.terapeuta_id) return
    await supabaseAdmin.from('notificaciones').insert({
      user_id: tarea.terapeuta_id,
      child_id: tarea.child_id,
      tipo: 'tarea_completada',
      titulo: 'Tarea completada por la familia',
      mensaje: `La familia completo la tarea "${tarea.titulo}"${tarea.nota_padre ? '. Nota: ' + tarea.nota_padre : ''}.`,
      prioridad: 3,
      canal: 'in_app',
      metadata: { tarea_id: tarea.id }
    })
  } catch (err) {
    console.error('Error notificando tarea completada:', err)
  }
}
