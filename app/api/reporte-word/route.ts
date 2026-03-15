// app/api/reporte-word/route.ts
// 📄 Genera documentos Word profesionales para cada tipo de reporte IA
// Devuelve el .docx como stream descargable — sin jsPDF, sin lab()

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { getLangInstruction, getDocLabels } from '@/lib/lang'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat,
  HeadingLevel, PageNumber, Footer, Header
} from 'docx'

// ── FIX: Helper universal para parsear nivel_logro_objetivos ─────────────────
// Maneja: número, "75", "75%", "51-75%", "mayormente logrado", "alto", etc.
function parseNivelLogro(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number' && !isNaN(val)) return Math.min(100, Math.max(0, Math.round(val)))
  const s = String(val).trim()
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (range) return Math.round((parseInt(range[1]) + parseInt(range[2])) / 2)
  const num = s.match(/(\d+)/)
  if (num) return Math.min(100, Math.max(0, parseInt(num[1])))
  const lower = s.toLowerCase()
  if (lower.includes('completamente') || lower.includes('independiente') || lower.includes('dominado')) return 90
  if (lower.includes('mayormente') || lower.includes('alto') || lower.includes('excelente')) return 75
  if (lower.includes('parcialmente') || lower.includes('medio') || lower.includes('proceso')) return 50
  if (lower.includes('mínimo') || lower.includes('bajo') || lower.includes('emergente') || lower.includes('inicial')) return 20
  if (lower.includes('no logrado') || lower.includes('sin respuesta')) return 5
  return null
}

const BD = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
const BDR = { top: BD, bottom: BD, left: BD, right: BD }
const NBD = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NBDR = { top: NBD, bottom: NBD, left: NBD, right: NBD }

// ── Helpers ──────────────────────────────────────────────────────────────────
function title(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, bold: true, size: 40, font: 'Arial', color: '5B21B6' })]
  })
}
function subtitle(text: string) {
  return new Paragraph({
    spacing: { before: 0, after: 360 },
    children: [new TextRun({ text, size: 22, font: 'Arial', color: '9CA3AF' })]
  })
}
function h2(text: string, color = '1E293B') {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0', space: 4 } },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color })]
  })
}
function pp(text: string, color = '374151') {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color })]
  })
}
function bullet(text: string) {
  return new Paragraph({
    numbering: { reference: 'bul', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: '374151' })]
  })
}
function kv(label: string, value: string) {
  return new TableRow({ children: [
    new TableCell({ borders: BDR, width: { size: 3000, type: WidthType.DXA },
      shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 19, font: 'Arial', color: '475569' })] })] }),
    new TableCell({ borders: BDR, width: { size: 6360, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: value, size: 19, font: 'Arial', color: '1E293B' })] })] }),
  ]})
}
function infoBox(text: string, fill = 'EDE9FE', color = '5B21B6') {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    shading: { fill, type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 19, font: 'Arial', color })]
  })
}

type DocChild = Paragraph | Table

function makeDoc(sections: DocChild[], fileName: string) {
  return new Document({
    numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] }] },
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: { default: new Footer({ children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: `Jugando Aprendo · ${fileName} · `, size: 16, font: 'Arial', color: '9CA3AF' }),
          // ✅ FIX: PageNumber.CURRENT es un valor, no una función — sin paréntesis
          new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial', color: '9CA3AF' })
        ]})
      ]})},
      children: sections,
    }]
  })
}

// ── Reporte Para Padres ───────────────────────────────────────────────────────
async function generarReportePadres(childId: string, userLocale = 'es'): Promise<{ doc: Document; fileName: string }> {
  const { data: child } = await supabaseAdmin.from('children').select('name, age, diagnosis').eq('id', childId).single()
  const nombre = (child as any)?.name || 'Paciente'
  const edad = (child as any)?.age || 'N/A'
  const diagnostico = (child as any)?.diagnosis || 'TEA'

  // Cargar sesiones
  const { data: sesiones } = await supabaseAdmin.from('registro_aba')
    .select('datos, fecha_sesion').eq('child_id', childId)
    .order('fecha_sesion', { ascending: false }).limit(12)

  // Cargar programas
  const { data: programas } = await supabaseAdmin.from('programas_aba')
    .select('titulo, area, fase_actual, criterio_dominio_pct').eq('child_id', childId)
    .in('estado', ['activo', 'intervencion']).limit(8)

  const promedioLogro = sesiones && sesiones.length > 0
    ? (() => {
        const vals = (sesiones as any[]).map(s =>
          parseNivelLogro(s.datos?.nivel_logro_objetivos) ??
          parseNivelLogro(s.datos?.porcentaje_logro) ??
          parseNivelLogro(s.datos?.porcentaje_exito) ??
          parseNivelLogro(s.datos?.logro_objetivos) ??
          parseNivelLogro(s.datos?.logro)
        ).filter((v): v is number => v !== null)
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      })()
    : 0

  const fechaInicio = sesiones && sesiones.length > 0
    ? new Date(sesiones[sesiones.length - 1].fecha_sesion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })
    : 'N/A'
  const fechaFin = sesiones && sesiones.length > 0
    ? new Date(sesiones[0].fecha_sesion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  // Generar texto IA
  const prompt = `Escribe un reporte mensual de progreso para los PADRES de ${nombre} (${edad} años, ${diagnostico}).
  
DATOS REALES:
- Sesiones realizadas: ${sesiones?.length || 0}
- Promedio de logro: ${promedioLogro}%
- Áreas en trabajo: ${programas?.map((p: any) => `${p.area} (${p.titulo})`).join(', ') || 'Sin programas activos'}
- Período: del ${fechaInicio} al ${fechaFin}

INSTRUCCIONES:
- Usa lenguaje EMOCIONAL, CÁLIDO y ACCESIBLE (no técnico)
- Celebra los avances con entusiasmo real
- Explica simplemente qué se está trabajando y por qué importa
- Incluye 3-4 sugerencias concretas de actividades en casa
- Cierra con mensaje motivacional para la familia
- Longitud: 4-6 párrafos fluidos
- NO uses términos ABA técnicos, NO uses bullets, escribe en párrafos naturales`
  const textoIA = await callGroqSimple('', prompt + getLangInstruction(userLocale), { model: GROQ_MODELS.SMART, temperature: 0.7, maxTokens: 1200 })

  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const fileName = `Reporte_${nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`

  const sections: DocChild[] = [
    new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: '🌟 Jugando Aprendo', bold: true, size: 28, font: 'Arial', color: '5B21B6' })] }),
    title(`Reporte de Progreso — ${nombre}`),
    subtitle(`Período: ${fechaInicio} al ${fechaFin}  ·  Generado el ${hoy}`),

    h2('Información del Paciente'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
      kv('Nombre', nombre),
      kv(userLocale === 'en' ? 'Age' : 'Edad', `${edad} ${userLocale === 'en' ? 'years old' : 'años'}`),
      kv('Diagnóstico', diagnostico),
      kv('Sesiones realizadas', String(sesiones?.length || 0)),
      kv('Promedio de logro', `${promedioLogro}%`),
      kv('Nivel general', promedioLogro >= 75 ? '⭐ Excelente' : promedioLogro >= 55 ? '✅ Muy bien' : promedioLogro >= 35 ? '📈 En progreso' : '💪 Necesita apoyo'),
    ]}),

    h2('Áreas que estamos trabajando'),
    ...(programas || []).map((p: any) => bullet(`${p.area}: ${p.titulo} (fase: ${p.fase_actual})`)),
    ...((!programas || programas.length === 0) ? [pp('Sin programas activos registrados actualmente.')] : []),

    h2('Carta a la Familia'),
    ...textoIA.split('\n').filter((l: string) => l.trim()).map((line: string) => pp(line)),

    h2('Próximos pasos sugeridos'),
    bullet('Continúa las actividades indicadas por el terapeuta en casa, aunque sean 15 minutos al día'),
    bullet('Anota cualquier avance o dificultad que observes para compartirla en la próxima sesión'),
    bullet('Celebra cada pequeño logro — los niños crecen con reconocimiento positivo'),
    bullet('Si tienes dudas, contáctanos — estamos aquí para acompañarte en este camino'),

    new Paragraph({ spacing: { before: 400, after: 0 }, children: [new TextRun({ text: '─'.repeat(60), size: 18, font: 'Arial', color: 'E2E8F0' })] }),
    pp(`Documento generado por Jugando Aprendo · ${hoy} · Confidencial`, '9CA3AF'),
  ]

  return { doc: makeDoc(sections, 'Reporte Padres'), fileName }
}

// ── Reporte Para Seguros ──────────────────────────────────────────────────────
async function generarReporteSeguro(childId: string, userLocale = 'es'): Promise<{ doc: Document; fileName: string }> {
  const { data: child } = await supabaseAdmin.from('children').select('name, age, diagnosis, birth_date').eq('id', childId).single()
  const nombre = (child as any)?.name || 'Paciente'
  const edad = (child as any)?.age || 'N/A'
  const diagnostico = (child as any)?.diagnosis || 'TEA'

  const CIE10: Record<string, string> = {
    'TEA': 'F84.0', 'Autismo': 'F84.0', 'TDAH': 'F90.0',
    'Síndrome de Down': 'Q90', 'Discapacidad intelectual': 'F79',
  }
  const cie = CIE10[diagnostico] || 'F84.0'

  const { data: sesiones } = await supabaseAdmin.from('registro_aba')
    .select('datos, fecha_sesion').eq('child_id', childId)
    .order('fecha_sesion', { ascending: true }).limit(50)

  const { data: programas } = await supabaseAdmin.from('programas_aba')
    .select('titulo, area, fase_actual, criterio_dominio_pct, estado').eq('child_id', childId).limit(10)

  const totalSesiones = sesiones?.length || 0
  const promedioLogro = totalSesiones > 0
    ? (() => {
        const vals = (sesiones || []).map((s: any) =>
          parseNivelLogro(s.datos?.nivel_logro_objetivos) ??
          parseNivelLogro(s.datos?.porcentaje_logro) ??
          parseNivelLogro(s.datos?.porcentaje_exito) ??
          parseNivelLogro(s.datos?.logro_objetivos)
        ).filter((v): v is number => v !== null)
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
      })()
    : 0

  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const hoyISO = new Date().toISOString().slice(0, 10)
  const fileName = `Reporte_Seguro_${nombre.replace(/\s+/g, '_')}_${hoyISO}.docx`

  const prompt = `Redacta la justificación médica y pronóstico para un reporte de seguro/IMSS para ${nombre} (${edad} años, ${diagnostico}, CIE-10: ${cie}).

Contexto: ${totalSesiones} sesiones realizadas, promedio de logro ${promedioLogro}%.
Áreas: ${programas?.map((p: any) => p.area).join(', ') || 'comunicación, conducta'}.

Redacta en lenguaje técnico-clínico formal:
1. Justificación de la necesidad del tratamiento (2-3 oraciones)
2. Descripción del progreso cuantificado (2-3 oraciones)
3. Pronóstico y plan de tratamiento continuo (2-3 oraciones)
Usa terminología clínica apropiada. Sin bullets.`

  const textoTecnico = await callGroqSimple('', prompt + getLangInstruction(userLocale), { model: GROQ_MODELS.SMART, temperature: 0.2, maxTokens: 600 })

  const sections: DocChild[] = [
    new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: 'JUGANDO APRENDO — Centro de Terapia ABA', bold: true, size: 28, font: 'Arial', color: '1E293B' })] }),
    new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: userLocale === 'en' ? 'CLINICAL REPORT FOR INSURANCE / IMSS' : 'REPORTE CLÍNICO PARA ASEGURADORAS / IMSS', bold: true, size: 32, font: 'Arial', color: '1E40AF' })] }),
    subtitle(userLocale === 'en' ? `Issue date: ${hoy}  ·  Confidential Document` : `Fecha de emisión: ${hoy}  ·  Documento Confidencial`),

    h2(userLocale === 'en' ? 'I. PATIENT DATA' : 'I. DATOS DEL PACIENTE'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
      kv(userLocale === 'en' ? 'Full name' : 'Nombre completo', nombre),
      kv(userLocale === 'en' ? 'Age' : 'Edad', `${edad} ${userLocale === 'en' ? 'years old' : 'años'}`),
      kv(userLocale === 'en' ? 'Primary diagnosis' : 'Diagnóstico principal', diagnostico),
      kv('ICD-10 Code', cie),
      kv(userLocale === 'en' ? 'Report date' : 'Fecha del reporte', hoy),
    ]}),

    h2(userLocale === 'en' ? 'II. TREATMENT DESCRIPTION' : 'II. DESCRIPCIÓN DEL TRATAMIENTO'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
      kv(userLocale === 'en' ? 'Modality' : 'Modalidad', 'Applied Behavior Analysis (ABA)'),
      kv(userLocale === 'en' ? 'Sessions completed' : 'Sesiones realizadas', String(totalSesiones)),
      kv(userLocale === 'en' ? 'Achievement average' : 'Promedio de logro', `${promedioLogro}%`),
      kv(userLocale === 'en' ? 'Intervention areas' : 'Áreas de intervención', programas?.map((p: any) => p.area).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ') || 'N/A'),
    ]}),

    h2(userLocale === 'en' ? 'III. INTERVENTION PROGRAMS' : 'III. PROGRAMAS DE INTERVENCIÓN'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3800, 2000, 1800, 1760],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: userLocale === 'en' ? 'Program' : 'Programa', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: userLocale === 'en' ? 'Area' : 'Área', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: userLocale === 'en' ? 'Phase' : 'Fase', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: userLocale === 'en' ? 'Status' : 'Estado', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
        ]}),
        ...(programas || []).map((p: any) => new TableRow({ children: [
          new TableCell({ borders: BDR, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: p.titulo, size: 18, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: p.area, size: 18, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: p.fase_actual || 'N/A', size: 18, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: p.estado, size: 18, font: 'Arial' })] })] }),
        ]})),
        ...(!programas || programas.length === 0 ? [new TableRow({ children: [
          new TableCell({ borders: BDR, columnSpan: 4, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: userLocale === 'en' ? 'No programs registered' : 'Sin programas registrados', size: 18, font: 'Arial', color: '9CA3AF' })] })] }),
        ]})] : []),
      ]
    }),

    h2(userLocale === 'en' ? 'IV. CLINICAL JUSTIFICATION AND PROGNOSIS' : 'IV. JUSTIFICACIÓN CLÍNICA Y PRONÓSTICO'),
    ...textoTecnico.split('\n').filter((l: string) => l.trim()).map((line: string) => pp(line)),

    h2(userLocale === 'en' ? 'V. SIGNATURE AND ACCREDITATION' : 'V. FIRMA Y ACREDITACIÓN'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
      kv(userLocale === 'en' ? 'Therapeutic center' : 'Centro terapéutico', 'Jugando Aprendo'),
      kv(userLocale === 'en' ? 'Specialty' : 'Especialidad', 'Applied Behavior Analysis (ABA)'),
      kv(userLocale === 'en' ? 'Issue date' : 'Fecha de emisión', hoy),
      kv(userLocale === 'en' ? 'Document valid for' : 'Documento válido para', userLocale === 'en' ? 'Insurance companies, private coverage' : 'Aseguradoras, IMSS, ISSSTE, Seguro privado'),
    ]}),

    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: '─'.repeat(60), size: 18, font: 'Arial', color: 'E2E8F0' })] }),
    pp(userLocale === 'en' ? 'CONFIDENTIAL DOCUMENT — For exclusive use with authorized insurers' : 'DOCUMENTO CONFIDENCIAL — Para uso exclusivo con aseguradoras autorizadas', 'DC2626'),
    pp(`Jugando Aprendo · ${hoy}`, '9CA3AF'),
  ]

  return { doc: makeDoc(sections, 'Reporte Seguro'), fileName }
}

// ── Reporte Comparativo + Predicción ─────────────────────────────────────────
async function generarReporteComparativo(childId: string, userLocale = 'es'): Promise<{ doc: Document; fileName: string }> {
  const { data: child } = await supabaseAdmin.from('children').select('name, age, diagnosis').eq('id', childId).single()
  const nombre = (child as any)?.name || 'Paciente'
  const edad = (child as any)?.age || 'N/A'
  const diagnostico = (child as any)?.diagnosis || 'TEA'

  const { data: sesiones } = await supabaseAdmin.from('registro_aba')
    .select('datos, fecha_sesion').eq('child_id', childId)
    .order('fecha_sesion', { ascending: true }).limit(30)

  const total = sesiones?.length || 0
  const mitad = Math.floor(total / 2)
  const periodo1 = sesiones?.slice(0, mitad) || []
  const periodo2 = sesiones?.slice(mitad) || []
  const avg = (arr: any[]) => {
    if (arr.length === 0) return 0
    const vals = arr.map((s: any) =>
      parseNivelLogro(s.datos?.nivel_logro_objetivos) ??
      parseNivelLogro(s.datos?.porcentaje_logro) ??
      parseNivelLogro(s.datos?.porcentaje_exito) ??
      parseNivelLogro(s.datos?.logro_objetivos)
    ).filter((v): v is number => v !== null)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }
  const avg1 = avg(periodo1), avg2 = avg(periodo2)
  const diferencia = avg2 - avg1
  const pendiente = total > 1
    ? (avg(sesiones?.slice(-3) || []) - avg(sesiones?.slice(0, 3) || [])) / Math.max(total - 3, 1)
    : 0
  const pred30 = Math.min(100, Math.max(0, Math.round(avg2 + pendiente * 4)))
  const pred90 = Math.min(100, Math.max(0, Math.round(avg2 + pendiente * 12)))

  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const fileName = `Reporte_Comparativo_${nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.docx`

  const prompt = `Genera análisis narrativo para reporte comparativo de ${nombre} (${diagnostico}).

DATOS:
- Período 1: ${avg1}% promedio (${periodo1.length} sesiones)
- Período 2: ${avg2}% promedio (${periodo2.length} sesiones)  
- Cambio: ${diferencia > 0 ? '+' : ''}${diferencia}%
- Predicción 30 días: ${pred30}%
- Predicción 90 días: ${pred90}%

Escribe EN PÁRRAFOS (sin bullets) interpretación clínica de:
1. Qué significa este cambio para el desarrollo del niño (2 párrafos)
2. Qué factores pueden estar contribuyendo (1 párrafo)
3. Recomendaciones concretas para el siguiente período (1 párrafo)
Lenguaje técnico pero comprensible.`

  const analisis = await callGroqSimple('', prompt + getLangInstruction(userLocale), { model: GROQ_MODELS.SMART, temperature: 0.4, maxTokens: 800 })

  const sections: DocChild[] = [
    new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: '📊 Jugando Aprendo', bold: true, size: 28, font: 'Arial', color: '5B21B6' })] }),
    title(`Reporte Comparativo — ${nombre}`),
    subtitle(`Análisis de progreso y predicción · ${hoy}`),

    h2('Datos del Paciente'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360], rows: [
      kv('Nombre', nombre),
      kv('Diagnóstico', diagnostico),
      kv('Total de sesiones analizadas', String(total)),
    ]}),

    h2('Comparación de Períodos'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 3180, 3180],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: BDR, shading: { fill: '5B21B6', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Métrica', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '5B21B6', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Período Anterior (${periodo1.length} sesiones)`, bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '5B21B6', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Período Actual (${periodo2.length} sesiones)`, bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Promedio de logro', bold: true, size: 19, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${avg1}%`, size: 22, font: 'Arial', bold: true, color: '475569' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: diferencia >= 0 ? 'D1FAE5' : 'FEE2E2', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${avg2}% (${diferencia > 0 ? '+' : ''}${diferencia}%)`, size: 22, font: 'Arial', bold: true, color: diferencia >= 0 ? '059669' : 'DC2626' })] })] }),
        ]}),
      ]
    }),

    h2('Predicción IA (basada en tendencia real)'),
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 3180, 3180],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Horizonte', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Logro proyectado', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
          new TableCell({ borders: BDR, shading: { fill: '1E40AF', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Interpretación', bold: true, size: 19, font: 'Arial', color: 'FFFFFF' })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'En 30 días', bold: true, size: 19, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pred30}%`, size: 24, font: 'Arial', bold: true, color: pred30 >= 70 ? '059669' : pred30 >= 50 ? 'D97706' : 'DC2626' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: pred30 >= 75 ? 'Excelente progreso' : pred30 >= 55 ? 'Progreso sostenido' : 'Requiere ajuste', size: 18, font: 'Arial' })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'En 90 días', bold: true, size: 19, font: 'Arial' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pred90}%`, size: 24, font: 'Arial', bold: true, color: pred90 >= 70 ? '059669' : pred90 >= 50 ? 'D97706' : 'DC2626' })] })] }),
          new TableCell({ borders: BDR, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: pred90 >= 75 ? 'Pronóstico favorable' : pred90 >= 55 ? 'Progreso continuo' : 'Intervención intensiva', size: 18, font: 'Arial' })] })] }),
        ]}),
      ]
    }),

    h2('Análisis Clínico'),
    ...analisis.split('\n').filter((l: string) => l.trim()).map((line: string) => pp(line)),

    new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: '─'.repeat(60), size: 18, font: 'Arial', color: 'E2E8F0' })] }),
    pp(`Reporte generado por IA clínica de Jugando Aprendo · ${hoy}`, '9CA3AF'),
  ]

  return { doc: makeDoc(sections, 'Reporte Comparativo'), fileName }
}

// ── Handler principal ──────────────────────────────────────────────────────────

// i18n: responder en el idioma del usuario
// getLangInstruction moved to lib/lang.ts

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { childId, tipo } = body
    const userLocale = body.locale || req.headers.get('x-locale') || 'es'
    if (!childId) return NextResponse.json({ error: 'childId requerido' }, { status: 400 })

    let result: { doc: Document; fileName: string }
    if (tipo === 'seguro') result = await generarReporteSeguro(childId, userLocale)
    else if (tipo === 'comparativo') result = await generarReporteComparativo(childId, userLocale)
    else result = await generarReportePadres(childId, userLocale)

    const buffer = await Packer.toBuffer(result.doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': String(uint8.byteLength),
      },
    })
  } catch (e: any) {
    console.error('Error reporte-word:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}