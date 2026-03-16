// app/api/agente-prediccion/route.ts
// 🧠 Agente Predicción IA — predice progreso por PROGRAMA y NIVEL DE OBJETIVO específico
// Criterio de logro: ≥90% en 2 sesiones consecutivas por nivel de objetivo = LOGRADO

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { buildAIContext } from '@/lib/ai-context-builder'

function calcularTendencia(valores: number[]): { slope: number; r2: number } {
  if (valores.length < 2) return { slope: 0, r2: 0 }
  const n = valores.length
  const x = valores.map((_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = valores.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, xi, i) => a + xi * valores[i], 0)
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0)
  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const meanY = sumY / n
  const ssTot = valores.reduce((a, y) => a + (y - meanY) ** 2, 0)
  const ssRes = valores.reduce((a, y, i) => a + (y - (meanY + slope * (i - (n - 1) / 2))) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)
  return { slope, r2 }
}

function calcularMediana(valores: number[]): number {
  if (valores.length === 0) return 0
  const sorted = [...valores].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function calcularMedia(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

// Verificar criterio de logro: 90% en 2 sesiones consecutivas
function verificarCriterioLogro(porcentajes: number[], criterio = 90): { logrado: boolean; sesionesConsecutivas: number } {
  let consecutivas = 0
  let maxConsecutivas = 0
  for (const p of porcentajes) {
    if (p >= criterio) {
      consecutivas++
      maxConsecutivas = Math.max(maxConsecutivas, consecutivas)
    } else {
      consecutivas = 0
    }
  }
  return { logrado: maxConsecutivas >= 2, sesionesConsecutivas: maxConsecutivas }
}


// i18n: responder en el idioma del usuario
function getLangInstruction(locale?: string | null): string {
  if (locale === 'en') return '\n\n[MANDATORY: Write the entire response in English. Professional clinical English only. No Spanish.]'
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { childId, childName } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })

    // Cargar programas ABA del paciente
    const { data: programas } = await supabaseAdmin
      .from('programas_aba')
      .select('id, nombre, objetivo, fase_actual, criterio_dominio_pct, tipo_medicion, created_at')
      .eq('child_id', childId)
      .eq('activo', true)
      .order('created_at', { ascending: true })

    if (!programas || programas.length === 0) {
      return NextResponse.json({
        programas_analizados: 0,
        analisis_por_programa: [],
        resumen_general: null,
        mensaje: 'No hay programas ABA activos para este paciente.',
      })
    }

    const analisis_por_programa = []

    for (const prog of programas) {
      // Cargar sesiones de este programa específico
      const { data: sesiones } = await supabaseAdmin
        .from('sesiones_programa')
        .select('fecha, porcentaje_exito, fase, set_nombre, oportunidades_totales, respuestas_correctas, notas')
        .eq('programa_id', prog.id)
        .order('fecha', { ascending: true })

      if (!sesiones || sesiones.length === 0) {
        analisis_por_programa.push({
          programa_id: prog.id,
          nombre: prog.nombre,
          objetivo: prog.objetivo,
          fase_actual: prog.fase_actual,
          criterio_dominio: prog.criterio_dominio_pct || 90,
          total_sesiones: 0,
          ultimo_porcentaje: null,
          media: null,
          mediana: null,
          tendencia: null,
          criterio_logrado: false,
          sets: [],
          mensaje: 'Sin sesiones registradas',
        })
        continue
      }

      const porcentajes = sesiones.map(s => s.porcentaje_exito || 0)
      const ultimoPct = porcentajes[porcentajes.length - 1]
      const media = calcularMedia(porcentajes)
      const mediana = calcularMediana(porcentajes)
      const tendencia = calcularTendencia(porcentajes)
      const criterio = prog.criterio_dominio_pct || 90
      const { logrado, sesionesConsecutivas } = verificarCriterioLogro(porcentajes, criterio)

      // Agrupar por SET
      const setsMap: Record<string, number[]> = {}
      for (const s of sesiones) {
        const setKey = s.set_nombre || s.fase || 'Set 1'
        if (!setsMap[setKey]) setsMap[setKey] = []
        setsMap[setKey].push(s.porcentaje_exito || 0)
      }

      const sets = Object.entries(setsMap).map(([nombre, pcts]) => {
        const { logrado: setLogrado, sesionesConsecutivas: cons } = verificarCriterioLogro(pcts, criterio)
        return {
          nombre,
          sesiones: pcts.length,
          ultimo_pct: pcts[pcts.length - 1],
          media: Math.round(calcularMedia(pcts)),
          mediana: Math.round(calcularMediana(pcts)),
          criterio_logrado: setLogrado,
          sesiones_consecutivas_sobre_criterio: cons,
          estado: setLogrado ? 'LOGRADO ✅' : pcts[pcts.length - 1] >= criterio ? 'En criterio (seguir monitoreando)' : 'En progreso',
        }
      })

      analisis_por_programa.push({
        programa_id: prog.id,
        nombre: prog.nombre,
        objetivo: prog.objetivo,
        fase_actual: prog.fase_actual,
        criterio_dominio: criterio,
        total_sesiones: sesiones.length,
        ultimo_porcentaje: Math.round(ultimoPct),
        media: Math.round(media),
        mediana: Math.round(mediana),
        tendencia_slope: Math.round(tendencia.slope * 10) / 10,
        tendencia_descripcion: tendencia.slope > 1 ? 'Progreso positivo' : tendencia.slope < -1 ? 'Tendencia negativa ⚠️' : 'Estable',
        criterio_logrado: logrado,
        sesiones_consecutivas_sobre_criterio: sesionesConsecutivas,
        estado_general: logrado ? 'LOGRADO ✅' : ultimoPct >= criterio ? 'En criterio — verificar 2 sesiones consecutivas' : ultimoPct >= criterio * 0.7 ? 'Cerca del criterio' : 'En progreso',
        sets,
      })
    }

    // Contexto para análisis IA
    let cerebroCtx = ''
    try {
      const kb = await buildAIContext(undefined, undefined, undefined, 'análisis ABA progreso criterio logro sets')
      cerebroCtx = kb.knowledgeContext
    } catch { /* fallback */ }

    const resumenParaIA = analisis_por_programa.map(p => ({
      programa: p.nombre,
      objetivo: p.objetivo,
      sesiones: p.total_sesiones,
      ultimo_pct: p.ultimo_porcentaje,
      media: p.media,
      mediana: p.mediana,
      tendencia: p.tendencia_descripcion,
      criterio: p.criterio_dominio,
      logrado: p.criterio_logrado,
      sets: p.sets?.map(s => `${s.nombre}: ${s.ultimo_pct}% (media: ${s.media}%, ${s.criterio_logrado ? 'LOGRADO' : 'en progreso'})`).join(' | '),
    }))

    const prompt = `Eres BCBA supervisora. Analiza el progreso de ${childName} por programa y nivel de objetivo. Tu audiencia son terapeutas y supervisoras clínicas.

CRITERIO DE LOGRO: ≥${analisis_por_programa[0]?.criterio_dominio || 90}% en 2 sesiones CONSECUTIVAS por nivel de objetivo.

DATOS POR PROGRAMA:
${JSON.stringify(resumenParaIA, null, 2)}

Genera un análisis clínico ABA con:
1. ESTADO GENERAL (2 oraciones): resumen del progreso del paciente
2. POR PROGRAMA (para cada uno): estado del nivel de objetivo actual, si está en criterio o no, qué ajuste recomendar al terapeuta
3. PRIORIDADES: qué programa necesita atención inmediata y por qué
4. PRÓXIMOS PASOS CLÍNICOS (3 puntos concretos): cambios de set, revisión de antecedentes, ajustes de consecuencias

Sé específico y técnico. Sin perogrulladas. Máximo 350 palabras.`

    let resumen_general: string | null = null
    try {
      resumen_general = await callGroqSimple(
        'Eres BCBA supervisora experta en análisis de datos ABA. Usa terminología técnica. Fundamenta en JABA y Cooper.',
        prompt + (cerebroCtx ? '\n\n━━━ CEREBRO IA ━━━\n' + cerebroCtx : ''),
        { model: GROQ_MODELS.SMART, temperature: 0.35, maxTokens: 700 }
      )
    } catch (err) {
      console.error('Error Groq predicción por SET:', err)
    }

    // Guardar en predicciones_ia (resumen general)
    try {
      const logrados = analisis_por_programa.filter(p => p.criterio_logrado).length
      const enProgreso = analisis_por_programa.filter(p => !p.criterio_logrado).length
      await supabaseAdmin.from('predicciones_ia').upsert({
        child_id: childId,
        fecha_prediccion: new Date().toISOString().split('T')[0],
        prediccion_30d: null,
        prediccion_90d: null,
        confianza: Math.min(95, analisis_por_programa.reduce((a, p) => a + p.total_sesiones, 0) * 2),
        areas_riesgo: analisis_por_programa.filter(p => (p.tendencia_slope ?? 0) < -1).map(p => p.nombre),
        areas_fortaleza: analisis_por_programa.filter(p => p.criterio_logrado).map(p => p.nombre),
        analisis_ia: resumen_general,
        sesiones_analizadas: analisis_por_programa.reduce((a, p) => a + p.total_sesiones, 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'child_id' })
    } catch { /* no bloquear */ }

    return NextResponse.json({
      programas_analizados: analisis_por_programa.length,
      analisis_por_programa,
      resumen_general,
      criterio_nota: '≥90% en 2 sesiones consecutivas por nivel de objetivo = LOGRADO',
    })

  } catch (e: any) {
    console.error('❌ Error agente predicción:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
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
