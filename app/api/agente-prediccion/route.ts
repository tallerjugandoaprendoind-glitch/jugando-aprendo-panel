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
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { childId, childName } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })

    // Cargar TODOS los programas del paciente sin filtrar por estado
    // (el filtro de estado varía por implementación — filtramos en código)
    // Usamos * para descubrir las columnas reales disponibles
    const { data: todosProgramas, error: errProg } = await supabaseAdmin
      .from('programas_aba')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true })

    // Log columnas disponibles para diagnóstico
    if (todosProgramas && todosProgramas.length > 0) {
      console.log('✅ programas_aba columnas disponibles:', Object.keys(todosProgramas[0]))
    }
    console.log('🔍 programas_aba query:', { childId, total: todosProgramas?.length, error: errProg?.message })

    // Filtrar en código: excluir solo los explícitamente archivados/dados de alta
    const ESTADOS_EXCLUIDOS = ['archivado', 'alta', 'dado_de_alta', 'inactivo', 'cancelado']
    const programas = (todosProgramas || []).filter((p: any) => {
      if (ESTADOS_EXCLUIDOS.includes(p.estado?.toLowerCase())) return false
      return true // incluir activo, intervencion, en_progreso, linea_base, dominado, null, etc.
    })

    if (programas.length === 0) {
      return NextResponse.json({
        programas_analizados: 0,
        analisis_por_programa: [],
        resumen_general: null,
        _debug_total_encontrados: todosProgramas?.length || 0,
        _debug_columnas: todosProgramas?.[0] ? Object.keys(todosProgramas[0]) : [],
        _debug_error_supabase: errProg?.message || null,
        mensaje: todosProgramas && todosProgramas.length > 0
          ? `Se encontraron ${todosProgramas.length} programa(s). Estados: ${todosProgramas.map((p: any) => p.estado).join(', ')}`
          : errProg
          ? `Error al consultar programas: ${errProg.message}`
          : 'No hay programas ABA registrados para este paciente.',
      })
    }

    const analisis_por_programa = []

    for (const prog of programas) {
      const progNombre = prog.titulo || (prog as any).nombre || 'Sin nombre'
      const progObjetivo = (prog as any).objetivo || (prog as any).descripcion || (prog as any).area || ''

      // Cargar sesiones — intentar sesiones_datos_aba, luego registro_aba filtrado por programa
      let sesiones: any[] | null = null
      const { data: s1 } = await supabaseAdmin
        .from('sesiones_datos_aba')
        .select('fecha, porcentaje_exito, fase, set_nombre, oportunidades_totales, respuestas_correctas, notas')
        .eq('programa_id', prog.id)
        .order('fecha', { ascending: true })
      if (s1 && s1.length > 0) {
        sesiones = s1
      } else {
        // Fallback: buscar en registro_aba por child_id y mapear datos
        const { data: s2 } = await supabaseAdmin
          .from('registro_aba')
          .select('fecha_sesion, datos')
          .eq('child_id', childId)
          .order('fecha_sesion', { ascending: true })
          .limit(30)
        if (s2 && s2.length > 0) {
          // Convertir formato registro_aba al formato esperado
          sesiones = s2.map((s: any) => ({
            fecha: s.fecha_sesion,
            porcentaje_exito:
              s.datos?.nivel_logro_objetivos != null ? Math.round(parseFloat(String(s.datos.nivel_logro_objetivos)) * (typeof s.datos.nivel_logro_objetivos === 'number' && s.datos.nivel_logro_objetivos <= 5 ? 20 : 1)) :
              s.datos?.porcentaje_exito ?? s.datos?.porcentaje_logro ?? null,
            fase: s.datos?.fase_actual || null,
            set_nombre: s.datos?.set_nombre || null,
            oportunidades_totales: s.datos?.oportunidades_totales || null,
            respuestas_correctas: s.datos?.respuestas_correctas || null,
            notas: s.datos?.observaciones_generales || s.datos?.notas || null,
          })).filter((s: any) => s.porcentaje_exito !== null)
        }
      }

      if (!sesiones || sesiones.length === 0) {
        analisis_por_programa.push({
          programa_id: prog.id,
          nombre: progNombre,
          objetivo: progObjetivo,
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
        nombre: progNombre,
        objetivo: progObjetivo,
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
      objetivo: p.objetivo || (p as any).objetivo_lp || '',
      sesiones: p.total_sesiones,
      ultimo_pct: p.ultimo_porcentaje,
      media: p.media,
      mediana: p.mediana,
      tendencia: p.tendencia_descripcion,
      criterio: p.criterio_dominio,
      logrado: p.criterio_logrado,
      sets: p.sets?.map(s => `${s.nombre}: ${s.ultimo_pct}% (media: ${s.media}%, ${s.criterio_logrado ? 'LOGRADO' : 'en progreso'})`).join(' | '),
    }))

    const totalSesionesAnalizadas = analisis_por_programa.reduce((a, p) => a + p.total_sesiones, 0)
    const progConSesiones = analisis_por_programa.filter(p => p.total_sesiones > 0)
    const progSinSesiones = analisis_por_programa.filter(p => p.total_sesiones === 0)

    const prompt = `Eres una neuropsicóloga clínica con especialización en Análisis Aplicado de la Conducta (ABA), certificada BCBA-D con 15 años de experiencia clínica. Redactas informes de supervisión clínica de alto nivel para terapeutas ABA y equipos multidisciplinarios. Tu lenguaje es técnico, preciso y fundamentado en evidencia (Cooper, Heron & Heward; JABA; Skinner).

PACIENTE: ${childName}
SESIONES TOTALES ANALIZADAS: ${totalSesionesAnalizadas}
PROGRAMAS CON DATOS: ${progConSesiones.length} | SIN DATOS AÚN: ${progSinSesiones.length}
CRITERIO DE DOMINIO: ≥${analisis_por_programa[0]?.criterio_dominio || 90}% en 2 sesiones consecutivas (criterio de transferencia de control de estímulos)

DATOS CLÍNICOS POR PROGRAMA:
${resumenParaIA.map(p => [
  `━━ ${p.programa.toUpperCase()} ━━`,
  `  Área: ${p.objetivo || 'no especificada'} | Sesiones: ${p.sesiones} | Fase: ${p.tendencia || '—'}`,
  `  Último registro: ${p.ultimo_pct != null ? p.ultimo_pct + '%' : 'sin datos'} | Media: ${p.media != null ? p.media + '%' : '—'} | Mediana: ${p.mediana != null ? p.mediana + '%' : '—'}`,
  `  Criterio de dominio: ${p.logrado ? '✓ ALCANZADO' : 'EN PROGRESO'}`,
  p.sets ? `  Sets/niveles: ${p.sets}` : '',
].filter(Boolean).join('\n')).join('\n\n')}

Genera un INFORME DE SUPERVISIÓN CLÍNICA ABA con exactamente este formato:

**EVALUACIÓN DEL ESTADO CLÍNICO ACTUAL**
[3-4 oraciones. Descripción objetiva del estado general del proceso terapéutico fundamentado en los datos. Menciona tendencias observables, nivel de adherencia al programa y calidad del registro de datos. Usa terminología como: tasa de respuesta, discriminación de estímulos, control instruccional, línea base, criterio de dominio.]

**ANÁLISIS POR PROGRAMA DE INTERVENCIÓN**
[Para cada programa con datos: analiza la curva de aprendizaje, variabilidad entre sesiones, si hay estancamiento o aceleración, e indica si el criterio de transferencia está próximo. Para programas sin sesiones: señala la necesidad crítica de iniciar el registro sistemático de datos.]

**HIPÓTESIS CLÍNICA Y VARIABLES EN JUEGO**
[2-3 oraciones. Plantea hipótesis sobre los factores que pueden estar afectando el progreso: variables motivacionales, calidad del antecedente, eficacia del consecuente, generalización, fatiga de reforzadores, etc.]

**INDICACIONES TERAPÉUTICAS PRIORITARIAS**
1. [Indicación clínica específica con fundamento en principios ABA — incluye qué, cómo y cuándo implementar]
2. [Indicación clínica específica con fundamento en principios ABA]
3. [Indicación clínica específica con fundamento en principios ABA]

**CRITERIOS DE AVANCE Y MONITOREO**
[Especifica qué indicadores deben observarse en las próximas 2-4 semanas para determinar si el plan es efectivo o requiere ajuste. Menciona umbrales de decisión clínica.]

Redacta en tercera persona institucional. Sin tuteos. Sin clichés motivacionales. Máximo 450 palabras.`

    let resumen_general: string | null = null
    try {
      resumen_general = await callGroqSimple(
        'Eres neuropsicóloga clínica BCBA-D con especialización en ABA. Redactas informes clínicos de supervisión de alto nivel. Lenguaje técnico, preciso, fundamentado en evidencia científica. Nunca usas frases motivacionales vagas. Siempre específico y accionable.',
        prompt + (cerebroCtx ? '\n\n━━━ CONTEXTO CLÍNICO ADICIONAL ━━━\n' + cerebroCtx : ''),
        { model: GROQ_MODELS.SMART, temperature: 0.25, maxTokens: 1000 }
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
