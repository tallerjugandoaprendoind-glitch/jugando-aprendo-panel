// app/api/agente-patrones/route.ts
// 🧠 CAPA 1 — Sub-agente: Detector de Patrones ABA por Niño
// Analiza el historial de sesiones y detecta patrones de aprendizaje,
// estancamientos, regresiones y consistencia de conductas

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PatronDetectado {
  tipo: 'regresion' | 'estancamiento' | 'aceleracion' | 'inconsistencia' | 'dominio'
  area: string
  descripcion: string
  confianza: number          // 0-100
  sesiones_involucradas: number
  valor_actual: number       // 0-100
  valor_anterior: number     // 0-100
  semanas_detectado: number
  accion_sugerida: string
}

function parseLogro(val: any): number | null {
  if (val == null || val === "") return null
  if (typeof val === "number") return Math.min(100, Math.max(0, Math.round(val)))
  const s = String(val).trim()
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2)
  const num = s.match(/(\d+)/)
  if (num) return Math.min(100, Math.max(0, parseInt(num[1])))
  const lower = s.toLowerCase()
  if (lower.includes("completamente") || lower.includes("dominado")) return 90
  if (lower.includes("mayormente") || lower.includes("alto")) return 75
  if (lower.includes("parcialmente") || lower.includes("medio") || lower.includes("proceso")) return 50
  if (lower.includes("mínimo") || lower.includes("bajo") || lower.includes("emergente")) return 20
  if (lower.includes("no logrado")) return 5
  return null
}

function detectarPatrones(sesiones: any[]): PatronDetectado[] {
  const patrones: PatronDetectado[] = []
  if (sesiones.length < 3) return patrones

  const logros = sesiones.map(s => parseLogro(s.datos?.nivel_logro_objetivos)).filter((v): v is number => v !== null)
  const atenciones = sesiones.map(s => Number(s.datos?.nivel_atencion || 0)).filter(v => v > 0).map(v => (v / 5) * 100)
  const tolerancias = sesiones.map(s => Number(s.datos?.tolerancia_frustracion || 0)).filter(v => v > 0).map(v => (v / 5) * 100)
  const comunicacion = sesiones.map(s => Number(s.datos?.iniciativa_comunicativa || 0)).filter(v => v > 0).map(v => (v / 5) * 100)

  const analizarSerie = (valores: number[], nombre: string) => {
    if (valores.length < 3) return

    const recientes = valores.slice(-3)
    const anteriores = valores.slice(-6, -3)
    const promReciente = recientes.reduce((a, b) => a + b, 0) / recientes.length
    const promAnterior = anteriores.length > 0 ? anteriores.reduce((a, b) => a + b, 0) / anteriores.length : promReciente
    const delta = promReciente - promAnterior
    const ultimo = valores[valores.length - 1]
    const semanas = Math.ceil(valores.length / 2)

    // REGRESIÓN: bajó más de 15 puntos en promedio reciente
    if (delta < -15 && anteriores.length > 0) {
      patrones.push({
        tipo: 'regresion',
        area: nombre,
        descripcion: `${nombre} mostró una regresión de ${Math.abs(Math.round(delta))} puntos en las últimas ${recientes.length} sesiones`,
        confianza: Math.min(95, 60 + Math.abs(delta)),
        sesiones_involucradas: recientes.length,
        valor_actual: Math.round(promReciente),
        valor_anterior: Math.round(promAnterior),
        semanas_detectado: semanas,
        accion_sugerida: `Revisar factores ambientales y ajustar estrategias de reforzamiento en ${nombre.toLowerCase()}`
      })
    }

    // ESTANCAMIENTO: variación < 5 puntos por 4+ sesiones
    if (valores.length >= 4) {
      const ultimas4 = valores.slice(-4)
      const maxVal = Math.max(...ultimas4)
      const minVal = Math.min(...ultimas4)
      if (maxVal - minVal < 8 && promReciente < 70) {
        patrones.push({
          tipo: 'estancamiento',
          area: nombre,
          descripcion: `${nombre} lleva ${ultimas4.length} sesiones sin avance significativo (rango: ${Math.round(minVal)}-${Math.round(maxVal)}%)`,
          confianza: 80,
          sesiones_involucradas: ultimas4.length,
          valor_actual: Math.round(promReciente),
          valor_anterior: Math.round(promAnterior),
          semanas_detectado: semanas,
          accion_sugerida: `Considerar cambio de estrategia o ajuste del objetivo. Consultar con equipo clínico sobre desencadenantes`
        })
      }
    }

    // ACELERACIÓN: subió más de 20 puntos
    if (delta > 20 && anteriores.length > 0) {
      patrones.push({
        tipo: 'aceleracion',
        area: nombre,
        descripcion: `${nombre} mostró aceleración notable: +${Math.round(delta)} puntos en las últimas sesiones`,
        confianza: Math.min(95, 55 + delta),
        sesiones_involucradas: recientes.length,
        valor_actual: Math.round(promReciente),
        valor_anterior: Math.round(promAnterior),
        semanas_detectado: semanas,
        accion_sugerida: `Identificar qué estrategia está funcionando y replicarla en otras áreas`
      })
    }

    // DOMINIO: 3+ sesiones consecutivas >= 80%
    if (valores.slice(-3).every(v => v >= 80)) {
      patrones.push({
        tipo: 'dominio',
        area: nombre,
        descripcion: `${nombre} ha alcanzado nivel de dominio (>80%) por ${recientes.length} sesiones consecutivas`,
        confianza: 90,
        sesiones_involucradas: recientes.length,
        valor_actual: Math.round(ultimo),
        valor_anterior: Math.round(promAnterior),
        semanas_detectado: semanas,
        accion_sugerida: `Considerar avanzar al siguiente objetivo o fase de generalización`
      })
    }

    // INCONSISTENCIA: alta varianza (std > 20)
    if (valores.length >= 4) {
      const mean = valores.reduce((a, b) => a + b, 0) / valores.length
      const std = Math.sqrt(valores.reduce((a, v) => a + (v - mean) ** 2, 0) / valores.length)
      if (std > 20) {
        patrones.push({
          tipo: 'inconsistencia',
          area: nombre,
          descripcion: `${nombre} muestra alta variabilidad entre sesiones (desv. estándar: ${Math.round(std)} pts)`,
          confianza: 75,
          sesiones_involucradas: valores.length,
          valor_actual: Math.round(ultimo),
          valor_anterior: Math.round(promAnterior),
          semanas_detectado: semanas,
          accion_sugerida: `Revisar consistencia en el ambiente terapéutico y factores contextuales (sueño, alimentación, rutinas)`
        })
      }
    }
  }

  analizarSerie(logros, 'Logro de Objetivos')
  analizarSerie(atenciones, 'Atención')
  analizarSerie(tolerancias, 'Tolerancia a la Frustración')
  analizarSerie(comunicacion, 'Comunicación')

  // Ordenar por confianza
  return patrones.sort((a, b) => b.confianza - a.confianza)
}

export async function POST(req: NextRequest) {
  try {
    const { childId, childName, semanas = 16 } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })

    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - semanas * 7)

    const { data: sesiones } = await supabaseAdmin
      .from('registro_aba')
      .select('fecha_sesion, datos')
      .eq('child_id', childId)
      .gte('fecha_sesion', fechaInicio.toISOString().split('T')[0])
      .order('fecha_sesion', { ascending: true })

    if (!sesiones || sesiones.length < 3) {
      return NextResponse.json({
        patrones: [],
        resumen: 'Insuficientes sesiones para detectar patrones (mínimo 3).',
        sesiones_analizadas: sesiones?.length || 0,
        analisis_ia: null
      })
    }

    const patrones = detectarPatrones(sesiones)

    // Análisis IA de los patrones detectados
    let analisis_ia: string | null = null
    if (patrones.length > 0) {
      try {
        analisis_ia = await callGroqSimple(
          'Eres un psicólogo clínico ABA especializado en análisis de patrones de aprendizaje en niños neurodivergentes.',
          `PACIENTE: ${childName || 'Paciente'}
SESIONES ANALIZADAS: ${sesiones.length} (últimas ${semanas} semanas)

PATRONES DETECTADOS AUTOMÁTICAMENTE:
${patrones.map(p => `- [${p.tipo.toUpperCase()}] ${p.area}: ${p.descripcion} (confianza: ${p.confianza}%)`).join('\n')}

Últimas 5 sesiones (datos raw):
${sesiones.slice(-5).map((s, i) => `Sesión ${i+1} (${s.fecha_sesion}): logro=${s.datos?.nivel_logro_objetivos}, atención=${s.datos?.nivel_atencion}/5, objetivo="${s.datos?.objetivo_principal || 'N/A'}"`).join('\n')}

Proporciona:
1. INTERPRETACIÓN CLÍNICA (2-3 oraciones): qué significan estos patrones juntos para el desarrollo del paciente
2. HIPÓTESIS PRINCIPAL: cuál es la causa más probable de los patrones problemáticos
3. INTERVENCIÓN PRIORITARIA: la acción más importante a tomar esta semana
4. SEÑAL POSITIVA: algo alentador en los datos (siempre hay algo)

Máximo 200 palabras. Directo y clínico.`,
          { model: GROQ_MODELS.SMART, temperature: 0.3, maxTokens: 500 }
        )
      } catch (err) {
        console.error('Error Groq patrones:', err)
      }
    }

    // Guardar en Supabase
    try {
      await supabaseAdmin.from('patrones_detectados').upsert({
        child_id: childId,
        fecha_analisis: new Date().toISOString().split('T')[0],
        patrones,
        sesiones_analizadas: sesiones.length,
        analisis_ia,
        updated_at: new Date().toISOString()
      }, { onConflict: 'child_id' })
    } catch { /* no bloquear */ }

    const tiposUrgentes = patrones.filter(p => p.tipo === 'regresion' || p.tipo === 'estancamiento')

    return NextResponse.json({
      patrones,
      sesiones_analizadas: sesiones.length,
      patrones_urgentes: tiposUrgentes.length,
      resumen: patrones.length === 0
        ? `Sin patrones problemáticos detectados en ${sesiones.length} sesiones. Progreso estable.`
        : `${patrones.length} patrón(es) detectado(s): ${tiposUrgentes.length} requieren atención inmediata.`,
      analisis_ia
    })

  } catch (e: any) {
    console.error('❌ Error agente-patrones:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')
  try {
    let q = supabaseAdmin
      .from('patrones_detectados')
      .select('*, children(name)')
      .order('updated_at', { ascending: false })
      .limit(100)
    if (childId) q = q.eq('child_id', childId)
    const { data } = await q
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
