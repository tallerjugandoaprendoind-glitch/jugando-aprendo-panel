// app/api/agente-prediccion/route.ts
// 🧠 Agente Predicción IA — predice progreso futuro por paciente
// Analiza patrones de las últimas sesiones y genera predicciones con Groq

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { buildAIContext } from '@/lib/ai-context-builder'

function parseNivelLogro(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number' && !isNaN(val)) return Math.min(100, Math.max(0, val))
  const s = String(val).trim()
  const rangeMatch = s.match(/^(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2)
  const numMatch = s.match(/^(\d+)/)
  if (numMatch) return Math.min(100, parseInt(numMatch[1]))
  const lower = s.toLowerCase()
  if (lower.includes('completamente') || lower.includes('76')) return 88
  if (lower.includes('mayormente') || lower.includes('51')) return 63
  if (lower.includes('parcialmente') || lower.includes('26')) return 38
  if (lower.includes('mínimo') || lower.includes('0')) return 13
  return null
}

function calcularTendencia(valores: number[]): { slope: number; r2: number } {
  if (valores.length < 2) return { slope: 0, r2: 0 }
  const n = valores.length
  const x = valores.map((_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = valores.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, xi, i) => a + xi * valores[i], 0)
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const meanY = sumY / n
  const ssTot = valores.reduce((a, y) => a + (y - meanY) ** 2, 0)
  const ssRes = valores.reduce((a, y, i) => a + (y - (meanY + slope * (i - (n - 1) / 2))) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)
  return { slope, r2 }
}

export async function POST(req: NextRequest) {
  try {
    const { childId, childName, semanas = 12 } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })

    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - semanas * 7)

    // Cargar sesiones ABA recientes
    const { data: sesiones } = await supabaseAdmin
      .from('registro_aba')
      .select('fecha_sesion, datos')
      .eq('child_id', childId)
      .gte('fecha_sesion', fechaInicio.toISOString().split('T')[0])
      .order('fecha_sesion', { ascending: true })

    if (!sesiones || sesiones.length < 3) {
      return NextResponse.json({
        prediccion_30d: null,
        prediccion_90d: null,
        confianza: 0,
        mensaje: 'Se necesitan al menos 3 sesiones para generar predicciones.',
        areas_riesgo: [],
        areas_fortaleza: [],
        recomendaciones: [],
        analisis_ia: null
      })
    }

    // Extraer métricas
    const logroValues = sesiones.map(s => parseNivelLogro(s.datos?.nivel_logro_objetivos)).filter((v): v is number => v !== null)
    const atencionValues = sesiones.map(s => Number(s.datos?.nivel_atencion || 0)).filter(v => v > 0).map(v => (v / 5) * 100)
    const toleranciaValues = sesiones.map(s => Number(s.datos?.tolerancia_frustracion || 0)).filter(v => v > 0).map(v => (v / 5) * 100)
    const comunicacionValues = sesiones.map(s => Number(s.datos?.iniciativa_comunicativa || 0)).filter(v => v > 0).map(v => (v / 5) * 100)

    // Calcular tendencias
    const tendenciaLogro = calcularTendencia(logroValues)
    const tendenciaAtencion = calcularTendencia(atencionValues)

    // Predicción (regresión lineal proyectada)
    const ultimoLogro = logroValues[logroValues.length - 1] || 50
    const prediccion30 = Math.min(100, Math.max(0, Math.round(ultimoLogro + tendenciaLogro.slope * 4)))
    const prediccion90 = Math.min(100, Math.max(0, Math.round(ultimoLogro + tendenciaLogro.slope * 12)))

    // Confianza basada en R² y cantidad de sesiones
    const confianza = Math.round(Math.min(95, (tendenciaLogro.r2 * 60) + Math.min(35, sesiones.length * 3)))

    // Identificar áreas de riesgo y fortaleza
    const areas: { nombre: string; valor: number; tendencia: number }[] = []
    if (logroValues.length > 0) areas.push({ nombre: 'Logro de Objetivos', valor: ultimoLogro, tendencia: tendenciaLogro.slope })
    if (atencionValues.length > 0) areas.push({ nombre: 'Atención', valor: atencionValues[atencionValues.length - 1], tendencia: tendenciaAtencion.slope })
    if (toleranciaValues.length > 0) areas.push({ nombre: 'Tolerancia a la Frustración', valor: toleranciaValues[toleranciaValues.length - 1], tendencia: calcularTendencia(toleranciaValues).slope })
    if (comunicacionValues.length > 0) areas.push({ nombre: 'Comunicación', valor: comunicacionValues[comunicacionValues.length - 1], tendencia: calcularTendencia(comunicacionValues).slope })

    const areas_riesgo = areas.filter(a => a.valor < 50 || a.tendencia < -2).map(a => a.nombre)
    const areas_fortaleza = areas.filter(a => a.valor >= 70 && a.tendencia >= 0).map(a => a.nombre)

    // Datos para el análisis IA
    const contextoSesiones = sesiones.slice(-8).map((s, i) => ({
      sesion: i + 1,
      fecha: s.datos?.fecha_sesion || 'N/A',
      logro: parseNivelLogro(s.datos?.nivel_logro_objetivos),
      atencion: s.datos?.nivel_atencion,
      objetivo: s.datos?.objetivo_principal || 'N/A',
      avances: s.datos?.avances_observados || ''
    }))

    // Llamar a Groq para análisis predictivo
    const promptIA = `Eres un psicólogo clínico especializado en ABA con 15 años de experiencia analizando patrones de aprendizaje en niños neurodivergentes.

PACIENTE: ${childName}
SESIONES ANALIZADAS: ${sesiones.length} (últimas ${semanas} semanas)

MÉTRICAS ACTUALES:
- Logro promedio de objetivos: ${Math.round(logroValues.reduce((a, b) => a + b, 0) / Math.max(1, logroValues.length))}%
- Tendencia de logro: ${tendenciaLogro.slope > 0 ? '+' : ''}${tendenciaLogro.slope.toFixed(1)} puntos/sesión
- Predicción a 30 días: ${prediccion30}%
- Predicción a 90 días: ${prediccion90}%
- Confianza estadística: ${confianza}%

ÚLTIMAS SESIONES:
${JSON.stringify(contextoSesiones, null, 2)}

ÁREAS EN RIESGO: ${areas_riesgo.join(', ') || 'Ninguna identificada'}
ÁREAS DE FORTALEZA: ${areas_fortaleza.join(', ') || 'En desarrollo'}

Genera un análisis predictivo clínico con:
1. INTERPRETACIÓN DEL PATRÓN (2-3 oraciones): qué dice la tendencia sobre el desarrollo del paciente
2. FACTORES PREDICTIVOS CLAVE (3 puntos): qué variables están impulsando o frenando el progreso  
3. RIESGO DE ESTANCAMIENTO: bajo/moderado/alto + explicación breve
4. RECOMENDACIONES PARA ACELERAR PROGRESO (3-4 puntos concretos y técnicos)
5. HITO ESPERADO A 90 DÍAS: qué habilidad o nivel debería lograr si continúa la tendencia

Usa terminología ABA clínica. Sé específico, no genérico. Máximo 400 palabras.`

    
    // ━━━ CEREBRO IA ━━━
    let _cerebroCtx = ''
    try {
      const _kb = await buildAIContext(undefined, undefined, undefined, 'predicción pronóstico ABA TEA neurodesarrollo')
      _cerebroCtx = _kb.knowledgeContext
    } catch { /* fallback */ }
    // ━━━ FIN CEREBRO IA ━━━
    let analisis_ia: string | null = null
    try {
      analisis_ia = await callGroqSimple(
        'Eres un psicólogo clínico ABA especializado en predicción de progreso terapéutico. Fundamenta con libros clínicos del Cerebro IA.',
        promptIA + (_cerebroCtx ? '\n\n━━━ CEREBRO IA ━━━\n' + _cerebroCtx : ''),
        { model: GROQ_MODELS.SMART, temperature: 0.4, maxTokens: 800 }
      )
    } catch (err) {
      console.error('Error Groq predicción:', err)
    }

    // Guardar predicción en Supabase
    try {
      await supabaseAdmin.from('predicciones_ia').upsert({
        child_id: childId,
        fecha_prediccion: new Date().toISOString().split('T')[0],
        prediccion_30d: prediccion30,
        prediccion_90d: prediccion90,
        confianza,
        areas_riesgo,
        areas_fortaleza,
        analisis_ia,
        sesiones_analizadas: sesiones.length,
        tendencia_slope: tendenciaLogro.slope,
        updated_at: new Date().toISOString()
      }, { onConflict: 'child_id' })
    } catch { /* no bloquear si falla guardado */ }

    return NextResponse.json({
      prediccion_30d: prediccion30,
      prediccion_90d: prediccion90,
      confianza,
      tendencia: tendenciaLogro.slope > 1 ? 'positiva' : tendenciaLogro.slope < -1 ? 'negativa' : 'estable',
      areas_riesgo,
      areas_fortaleza,
      sesiones_analizadas: sesiones.length,
      ultimo_logro: ultimoLogro,
      analisis_ia,
      data_points: logroValues.map((v, i) => ({ sesion: i + 1, logro: v }))
    })

  } catch (e: any) {
    console.error('❌ Error agente predicción:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Retorna predicciones guardadas de todos los pacientes (para dashboard)
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('child_id')

  try {
    let query = supabaseAdmin
      .from('predicciones_ia')
      .select('*, children(name, diagnosis)')
      .order('updated_at', { ascending: false })

    if (childId) query = query.eq('child_id', childId)

    const { data } = await query.limit(50)
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
