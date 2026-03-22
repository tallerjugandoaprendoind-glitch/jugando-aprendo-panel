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
      kv('Edad', `${edad} ${'años'}`),
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


// ── Gráfico de barras tipo Word (tabla con celdas coloreadas) ─────────────────
function graficoBarras(titulo: string, datos: { label: string; valor: number }[]): DocChild[] {
  const COLS = 28

  const headerRow = new TableRow({ children: [
    new TableCell({ borders: NBDR, width: { size: 3600, type: WidthType.DXA }, shading: { fill: '1E293B', type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 140, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: titulo, bold: true, size: 17, font: 'Arial', color: 'FFFFFF' })] })] }),
    new TableCell({ borders: NBDR, width: { size: 900, type: WidthType.DXA }, shading: { fill: '1E293B', type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 60, right: 60 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Valor', bold: true, size: 17, font: 'Arial', color: 'FFFFFF' })] })] }),
    ...Array.from({ length: COLS }, () => new TableCell({ borders: NBDR, width: { size: 175, type: WidthType.DXA }, shading: { fill: '1E293B', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [] })] })),
  ]})

  const dataRows = datos.map((d, i) => {
    const pct = Math.min(100, Math.max(0, d.valor))
    const filled = Math.round((pct / 100) * COLS)
    const barColor = pct >= 75 ? '16A34A' : pct >= 50 ? 'D97706' : 'DC2626'
    const bgRow = i % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
    const valBg = pct >= 75 ? 'DCFCE7' : pct >= 50 ? 'FEF3C7' : 'FEE2E2'

    return new TableRow({ children: [
      new TableCell({ borders: NBDR, shading: { fill: bgRow, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 140, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: d.label, size: 17, font: 'Arial', color: '334155' })] })] }),
      new TableCell({ borders: NBDR, shading: { fill: valBg, type: ShadingType.CLEAR }, margins: { top: 70, bottom: 70, left: 60, right: 60 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, bold: true, size: 19, font: 'Arial', color: barColor })] })] }),
      ...Array.from({ length: COLS }, (_, ci) => new TableCell({
        borders: NBDR,
        shading: { fill: ci < filled ? barColor : bgRow, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [] })],
      })),
    ]})
  })

  return [new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3600, 900, ...Array(COLS).fill(175)],
    rows: [headerRow, ...dataRows],
  })]
}

// ── Reporte Para Seguros ──────────────────────────────────────────────────────
async function generarReporteSeguro(childId: string, userLocale = 'es'): Promise<{ doc: Document; fileName: string }> {
  const { data: child } = await supabaseAdmin.from('children').select('name, age, diagnosis, birth_date').eq('id', childId).single()
  const nombre = (child as any)?.name || 'Paciente'
  const nombreCap = nombre.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const edad = (child as any)?.age || 'N/A'
  const diagnostico = (child as any)?.diagnosis || 'TEA'

  const CIE10: Record<string, string> = { 'TEA': 'F84.0', 'Autismo': 'F84.0', 'TDAH': 'F90.0', 'Síndrome de Down': 'Q90', 'Discapacidad intelectual': 'F79', 'Retraso': 'F79' }
  const cie = Object.entries(CIE10).find(([k]) => diagnostico?.includes(k))?.[1] || 'F84.0'

  const [{ data: sesiones }, { data: programas }, { data: sesionesProg }] = await Promise.all([
    supabaseAdmin.from('registro_aba').select('datos, fecha_sesion').eq('child_id', childId).order('fecha_sesion', { ascending: true }).limit(60),
    supabaseAdmin.from('programas_aba').select('titulo, area, fase_actual, criterio_dominio_pct, estado, nombre').eq('child_id', childId).limit(15),
    supabaseAdmin.from('sesiones_datos_aba').select('fecha, porcentaje_exito, programa_id, fase, notas').eq('child_id', childId).order('fecha', { ascending: true }).limit(100),
  ])

  const sesionesArr = sesiones || []
  const programasArr = programas || []
  const sesionesPArr = sesionesProg || []
  const totalSesiones = sesionesArr.length

  const extraerLogro = (s: any) =>
    parseNivelLogro(s.datos?.nivel_logro_objetivos) ?? parseNivelLogro(s.datos?.porcentaje_logro) ??
    parseNivelLogro(s.datos?.porcentaje_exito) ?? parseNivelLogro(s.datos?.logro_objetivos) ?? parseNivelLogro(s.datos?.logro)

  const logros = sesionesArr.map(extraerLogro).filter((v: number | null): v is number => v !== null)
  const atenciones = sesionesArr.map((s: any) => s.datos?.nivel_atencion ? Math.round((s.datos.nivel_atencion/5)*100) : null).filter((v: number | null): v is number => v !== null)
  const tolerancias = sesionesArr.map((s: any) => s.datos?.tolerancia_frustracion ? Math.round((s.datos.tolerancia_frustracion/5)*100) : null).filter((v: number | null): v is number => v !== null)
  const comunicaciones = sesionesArr.map((s: any) => s.datos?.iniciativa_comunicativa ? Math.round((s.datos.iniciativa_comunicativa/5)*100) : null).filter((v: number | null): v is number => v !== null)

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0
  const promedioLogro = avg(logros)
  const promedioAtencion = avg(atenciones)
  const promedioTolerancia = avg(tolerancias)
  const promedioComunicacion = avg(comunicaciones)

  const q = (arr: number[], from: number, to: number) => avg(arr.slice(Math.floor(arr.length*from), Math.floor(arr.length*to)))
  const logro_q1 = q(logros,0,0.25), logro_q2 = q(logros,0.25,0.5), logro_q3 = q(logros,0.5,0.75), logro_q4 = q(logros,0.75,1)
  const avgInicial = q(logros,0,0.33), avgFinal = q(logros,0.67,1)
  const delta = avgFinal - avgInicial
  const tendenciaVerbal = delta>10?'progreso significativo':delta>3?'progreso moderado':delta<-5?'regresión clínica':'estabilidad terapéutica'

  const diasUnicos = new Set(sesionesArr.map((s:any)=>s.fecha_sesion?.slice(0,10))).size
  const fmt = (d:string) => new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})
  const fechaInicio = sesionesArr.length>0?fmt(sesionesArr[0].fecha_sesion):'N/A'
  const fechaFin = sesionesArr.length>0?fmt(sesionesArr[sesionesArr.length-1].fecha_sesion):fmt(new Date().toISOString())
  const semanasTratamiento = sesionesArr.length>1 ? Math.round((new Date(sesionesArr[sesionesArr.length-1].fecha_sesion).getTime()-new Date(sesionesArr[0].fecha_sesion).getTime())/(7*24*60*60*1000)):0

  const areaMap: Record<string,number[]> = {}
  for (const p of programasArr) {
    const area = (p as any).area||'General'
    const vals = sesionesPArr.filter((s:any)=>s.programa_id===(p as any).id).map((s:any)=>s.porcentaje_exito||0).filter((v:number)=>v>0)
    if(vals.length>0){if(!areaMap[area])areaMap[area]=[];areaMap[area].push(...vals)}
  }
  const areasData = Object.entries(areaMap).map(([label,vals])=>({label,valor:avg(vals)}))
  const historial = sesionesArr.slice(-12).reverse()
  const progActivos = programasArr.filter((p:any)=>p.estado==='activo'||p.estado==='intervencion')
  const progDominados = programasArr.filter((p:any)=>p.estado==='dominado')

  const hoy = new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})
  const hoyISO = new Date().toISOString().slice(0,10)
  const docNum = `${hoyISO.replace(/-/g,'')}-${childId.slice(0,6).toUpperCase()}`
  const fileName = `Reporte_Clinico_${nombreCap.replace(/\s+/g,'_')}_${hoyISO}.docx`

  const [textoAnamnesis, textoProceso, textoPronostico, textoConclusiones] = await Promise.all([
    callGroqSimple('Eres neuropsicóloga clínica ABA. Lenguaje técnico formal, párrafos fluidos, sin bullets.',
      `ANTECEDENTES Y MOTIVO DE CONSULTA para ${nombreCap} (${edad} años, ${diagnostico}, CIE-10: ${cie}). Justifica la necesidad clínica del tratamiento ABA. 2 párrafos, máximo 100 palabras.`+getLangInstruction(userLocale),
      {model:GROQ_MODELS.SMART,temperature:0.3,maxTokens:250}),
    callGroqSimple('Eres neuropsicóloga clínica ABA. Lenguaje técnico formal, párrafos fluidos, sin bullets.',
      `EVOLUCIÓN TERAPÉUTICA de ${nombreCap}: ${totalSesiones} sesiones (${fechaInicio} al ${fechaFin}, ${semanasTratamiento} semanas). Logro: ${avgInicial}% inicial → ${avgFinal}% actual (${tendenciaVerbal}, delta ${delta>0?'+':''}${delta}%). Atención: ${promedioAtencion}%, Tolerancia: ${promedioTolerancia}%, Comunicación: ${promedioComunicacion}%. Programas activos: ${progActivos.map((p:any)=>p.titulo||p.nombre||p.area).join(', ')||'en evaluación'}. Dominados: ${progDominados.length>0?progDominados.map((p:any)=>p.titulo||p.nombre).join(', '):'ninguno aún'}. 3 párrafos, máximo 160 palabras.`+getLangInstruction(userLocale),
      {model:GROQ_MODELS.SMART,temperature:0.2,maxTokens:350}),
    callGroqSimple('Eres neuropsicóloga clínica ABA. Lenguaje técnico formal, párrafos fluidos, sin bullets.',
      `PRONÓSTICO Y PLAN para ${nombreCap} (${diagnostico}). ${totalSesiones} sesiones, ${promedioLogro}% promedio, tendencia ${tendenciaVerbal}. Incluye objetivos a 3-6 meses, frecuencia recomendada, áreas prioritarias. 2 párrafos, máximo 100 palabras.`+getLangInstruction(userLocale),
      {model:GROQ_MODELS.SMART,temperature:0.2,maxTokens:250}),
    callGroqSimple('Eres neuropsicóloga clínica ABA. Lenguaje técnico-legal formal.',
      `CONCLUSIONES para aseguradora sobre ${nombreCap}: necesidad médica del tratamiento, eficacia demostrada, recomendación de continuidad. 1 párrafo contundente, máximo 70 palabras.`+getLangInstruction(userLocale),
      {model:GROQ_MODELS.SMART,temperature:0.2,maxTokens:180}),
  ])

  const sections: DocChild[] = [
    // PORTADA
    new Paragraph({ spacing:{before:0,after:20}, border:{bottom:{style:BorderStyle.SINGLE,size:8,color:'1E40AF',space:8}},
      children:[new TextRun({text:'JUGANDO APRENDO',bold:true,size:38,font:'Arial',color:'1E293B'}),
                new TextRun({text:'  ·  Centro Especializado de Terapia ABA',size:22,font:'Arial',color:'64748B'})] }),
    new Paragraph({ spacing:{before:180,after:60},
      children:[new TextRun({text:'REPORTE NEUROPSICOLÓGICO Y CLÍNICO',bold:true,size:46,font:'Arial',color:'1E40AF'})] }),
    new Paragraph({ spacing:{before:0,after:20},
      children:[new TextRun({text:'Para presentación ante Aseguradoras, IMSS e ISSSTE',bold:true,size:24,font:'Arial',color:'475569'})] }),
    new Paragraph({ spacing:{before:80,after:360}, shading:{fill:'EFF6FF',type:ShadingType.CLEAR},
      children:[new TextRun({text:`Nº ${docNum}   ·   Emitido: ${hoy}   ·   Vigencia: 6 meses   ·   CONFIDENCIAL`,size:18,font:'Arial',color:'64748B'})] }),

    // I. DATOS
    h2('I.  DATOS DE IDENTIFICACIÓN DEL PACIENTE'),
    new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[3200,6160], rows:[
      kv('Nombre completo', nombreCap),
      kv('Edad cronológica', `${edad} años`),
      kv('Diagnóstico principal', diagnostico),
      kv('Clasificación CIE-10', cie),
      kv('Modalidad de intervención', 'Análisis Aplicado de la Conducta (ABA) — Terapia Individual'),
      kv('Centro terapéutico', 'Jugando Aprendo — Centro Especializado en Neurodesarrollo'),
      kv('Inicio del tratamiento', fechaInicio),
      kv('Última sesión registrada', fechaFin),
      kv('Duración total del proceso', `${semanasTratamiento} semanas (${totalSesiones} sesiones)`),
      kv('Fecha del presente reporte', hoy),
    ]}),

    // II. ANTECEDENTES
    h2('II.  ANTECEDENTES CLÍNICOS Y MOTIVO DE CONSULTA'),
    ...textoAnamnesis.split('\n').filter((l:string)=>l.trim()).map((l:string)=>pp(l)),

    // III. INDICADORES
    h2('III.  INDICADORES CUANTITATIVOS DE PROGRESO TERAPÉUTICO'),
    pp('Los siguientes indicadores resultan del análisis sistemático de las hojas de datos ABA registradas durante el período de tratamiento. Cada valor representa el promedio ponderado de todas las sesiones evaluadas en el período indicado.'),
    new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[3800,1960,3600], rows:[
      new TableRow({ children:[
        new TableCell({borders:BDR,shading:{fill:'0F172A',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:'Indicador clínico',bold:true,size:18,font:'Arial',color:'FFFFFF'})]})]}),
        new TableCell({borders:BDR,shading:{fill:'0F172A',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Valor',bold:true,size:18,font:'Arial',color:'FFFFFF'})]})]}),
        new TableCell({borders:BDR,shading:{fill:'0F172A',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:'Interpretación clínica',bold:true,size:18,font:'Arial',color:'FFFFFF'})]})]})
      ]}),
      ...([
        ['Total de sesiones realizadas', `${totalSesiones}`, totalSesiones>=20?'Proceso terapéutico consolidado':totalSesiones>=10?'Proceso en desarrollo activo':'Fase inicial de intervención'],
        ['Promedio global de logro de objetivos', `${promedioLogro}%`, promedioLogro>=75?'Nivel óptimo de respuesta terapéutica':promedioLogro>=55?'Nivel funcional adecuado':promedioLogro>=35?'En desarrollo, requiere continuidad':'Fase inicial de adquisición'],
        ['Nivel de logro — inicio del tratamiento', `${avgInicial}%`, 'Línea base del paciente al inicio'],
        ['Nivel de logro — etapa actual', `${avgFinal}%`, delta>5?`Mejora de +${delta}% respecto al inicio`:delta<-3?`Variación de ${delta}% respecto al inicio`:'Estabilización del proceso de aprendizaje'],
        ['Atención sostenida durante sesiones', promedioAtencion>0?`${promedioAtencion}%`:'No registrado', promedioAtencion>=70?'Atención funcional adecuada para el aprendizaje':promedioAtencion>0?'En desarrollo activo':'—'],
        ['Tolerancia a la frustración', promedioTolerancia>0?`${promedioTolerancia}%`:'No registrado', promedioTolerancia>=60?'Regulación emocional adecuada':promedioTolerancia>0?'Área de trabajo prioritaria':'—'],
        ['Iniciativa comunicativa', promedioComunicacion>0?`${promedioComunicacion}%`:'No registrado', promedioComunicacion>=60?'Comunicación funcional presente':promedioComunicacion>0?'En proceso de adquisición':'—'],
        ['Programas activos actualmente', `${progActivos.length}`, progActivos.length>0?progActivos.map((p:any)=>p.titulo||p.nombre||p.area).slice(0,3).join(' · '):'En evaluación inicial'],
        ['Programas con criterio de dominio alcanzado', `${progDominados.length}`, progDominados.length>0?progDominados.map((p:any)=>p.titulo||p.nombre).join(' · '):'En proceso de dominio'],
        ['Tendencia clínica general del período', tendenciaVerbal.charAt(0).toUpperCase()+tendenciaVerbal.slice(1), delta>=0?`Incremento de ${Math.abs(delta)} puntos porcentuales`:`Variación de ${Math.abs(delta)} puntos porcentuales`],
      ] as [string,string,string][]).map(([ind,val,interp],i)=>{
        const isKey = i===1
        const vColor = isKey?(promedioLogro>=75?'15803D':promedioLogro>=45?'92400E':'991B1B'):'1E293B'
        const vBg = isKey?(promedioLogro>=75?'DCFCE7':promedioLogro>=45?'FEF3C7':'FEE2E2'):i%2===0?'F8FAFC':'FFFFFF'
        return new TableRow({children:[
          new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:ind,size:17,font:'Arial',bold:isKey})]})]  }),
          new TableCell({borders:BDR,shading:{fill:vBg,type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:val,bold:true,size:isKey?22:17,font:'Arial',color:vColor})]})]}),
          new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:interp,size:16,font:'Arial',color:'64748B',italics:true})]})]}),
        ]})
      }),
    ]}),

    // IV. GRÁFICOS
    h2('IV.  REPRESENTACIÓN GRÁFICA DEL PROGRESO TERAPÉUTICO'),
    pp('Los gráficos siguientes ilustran la evolución del nivel de logro de objetivos ABA a lo largo de cuatro fases temporales equitativas del período de tratamiento:'),
    ...(logros.length>=4?graficoBarras('Evolución por Fase Terapéutica',[
      {label:`Fase 1 — Línea Base  (S1–S${Math.ceil(totalSesiones*0.25)})`,valor:logro_q1},
      {label:`Fase 2 — Adquisición  (S${Math.ceil(totalSesiones*0.25)+1}–S${Math.ceil(totalSesiones*0.5)})`,valor:logro_q2},
      {label:`Fase 3 — Consolidación  (S${Math.ceil(totalSesiones*0.5)+1}–S${Math.ceil(totalSesiones*0.75)})`,valor:logro_q3},
      {label:`Fase 4 — Estado Actual  (S${Math.ceil(totalSesiones*0.75)+1}–S${totalSesiones})`,valor:logro_q4},
    ]):[pp('Datos insuficientes para representación gráfica por fases (mínimo 4 sesiones).')]),
    new Paragraph({spacing:{before:200,after:0},children:[]}),

    ...(areasData.length>0?[
      pp('Nivel de desempeño promedio por área de intervención terapéutica:'),
      ...graficoBarras('Avance por Área de Intervención',areasData),
      new Paragraph({spacing:{before:200,after:0},children:[]}),
    ]:[]),

    ...(promedioAtencion>0||promedioTolerancia>0||promedioComunicacion>0?[
      pp('Perfil de indicadores conductuales y habilidades adaptativas del paciente:'),
      ...graficoBarras('Perfil Conductual Integral',[
        {label:'Logro de objetivos ABA',valor:promedioLogro},
        ...(promedioAtencion>0?[{label:'Atención sostenida en sesión',valor:promedioAtencion}]:[]),
        ...(promedioTolerancia>0?[{label:'Tolerancia a la frustración',valor:promedioTolerancia}]:[]),
        ...(promedioComunicacion>0?[{label:'Iniciativa comunicativa',valor:promedioComunicacion}]:[]),
      ]),
      new Paragraph({spacing:{before:200,after:0},children:[]}),
    ]:[]),

    // V. PROGRAMAS
    h2('V.  PROGRAMAS DE INTERVENCIÓN ABA — ESTADO DETALLADO'),
    pp('Se detallan los programas terapéuticos implementados, su área de intervención, fase de aplicación y estado de dominio según el criterio establecido (≥90% de respuestas correctas en dos sesiones consecutivas):'),
    new Table({ width:{size:9360,type:WidthType.DXA}, columnWidths:[3000,1600,1760,1400,1600],
      rows:[
        new TableRow({children:[
          new TableCell({borders:BDR,shading:{fill:'1E3A5F',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:'Programa / Objetivo terapéutico',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
          new TableCell({borders:BDR,shading:{fill:'1E3A5F',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:'Área',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
          new TableCell({borders:BDR,shading:{fill:'1E3A5F',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:'Fase actual',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
          new TableCell({borders:BDR,shading:{fill:'1E3A5F',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Criterio',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
          new TableCell({borders:BDR,shading:{fill:'1E3A5F',type:ShadingType.CLEAR},margins:{top:90,bottom:90,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Estado',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
        ]}),
        ...programasArr.map((p:any,i:number)=>{
          const isDom=p.estado==='dominado', isAct=p.estado==='activo'||p.estado==='intervencion'
          return new TableRow({children:[
            new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:p.titulo||p.nombre||'Sin título',size:17,font:'Arial',bold:true})]})]  }),
            new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:p.area||'General',size:16,font:'Arial'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:p.fase_actual?.replace(/_/g,' ')||'N/A',size:16,font:'Arial'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:i%2===0?'F8FAFC':'FFFFFF',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`≥${p.criterio_dominio_pct||90}%`,bold:true,size:17,font:'Arial',color:'1E40AF'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:isDom?'DCFCE7':isAct?'DBEAFE':'F1F5F9',type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:isDom?'✓ DOMINADO':isAct?'EN CURSO':p.estado?.toUpperCase()||'N/A',bold:true,size:16,font:'Arial',color:isDom?'15803D':isAct?'1D4ED8':'475569'})]})]  }),
          ]})
        }),
        ...(!programasArr.length?[new TableRow({children:[new TableCell({borders:BDR,columnSpan:5,margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Sin programas registrados en el período actual',size:17,font:'Arial',color:'94A3B8',italics:true})]})]})]})]:  []),
      ]
    }),

    // VI. HISTORIAL
    ...(historial.length>0?[
      h2('VI.  REGISTRO CRONOLÓGICO DE SESIONES TERAPÉUTICAS'),
      pp(`Registro de las últimas ${Math.min(historial.length,12)} sesiones con indicadores conductuales medidos por el terapeuta durante cada intervención:`),
      new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[1800,1500,1500,1500,3060],
        rows:[
          new TableRow({children:[
            new TableCell({borders:BDR,shading:{fill:'334155',type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:'Fecha',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:'334155',type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Logro obj.',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:'334155',type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Atención',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:'334155',type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Tolerancia',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
            new TableCell({borders:BDR,shading:{fill:'334155',type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:'Observación clínica',bold:true,size:17,font:'Arial',color:'FFFFFF'})]})]  }),
          ]}),
          ...historial.map((s:any,i:number)=>{
            const logro=extraerLogro(s)??0
            const aten=s.datos?.nivel_atencion?`${Math.round((s.datos.nivel_atencion/5)*100)}%`:'—'
            const tol=s.datos?.tolerancia_frustracion?`${Math.round((s.datos.tolerancia_frustracion/5)*100)}%`:'—'
            const obs=s.datos?.observaciones_generales||s.datos?.notas||'Sin observación registrada'
            const fc=logro>=75?'15803D':logro>=50?'92400E':'991B1B'
            const fg=logro>=75?'DCFCE7':logro>=50?'FEF3C7':'FEE2E2'
            const rb=i%2===0?'F8FAFC':'FFFFFF'
            return new TableRow({children:[
              new TableCell({borders:BDR,shading:{fill:rb,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:120,right:80},children:[new Paragraph({children:[new TextRun({text:new Date(s.fecha_sesion).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'2-digit'}),size:16,font:'Arial'})]})]  }),
              new TableCell({borders:BDR,shading:{fill:fg,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${logro}%`,bold:true,size:20,font:'Arial',color:fc})]})]  }),
              new TableCell({borders:BDR,shading:{fill:rb,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:aten,size:16,font:'Arial',color:'475569'})]})]  }),
              new TableCell({borders:BDR,shading:{fill:rb,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:tol,size:16,font:'Arial',color:'475569'})]})]  }),
              new TableCell({borders:BDR,shading:{fill:rb,type:ShadingType.CLEAR},margins:{top:60,bottom:60,left:80,right:80},children:[new Paragraph({children:[new TextRun({text:obs.length>75?obs.slice(0,75)+'…':obs,size:15,font:'Arial',color:'64748B',italics:true})]})]}),
            ]})
          }),
        ]
      }),
    ]:[]),

    // VII. EVOLUCIÓN
    h2('VII.  EVOLUCIÓN DEL PROCESO TERAPÉUTICO'),
    ...textoProceso.split('\n').filter((l:string)=>l.trim()).map((l:string)=>pp(l)),

    // VIII. PRONÓSTICO
    h2('VIII.  PRONÓSTICO Y PLAN DE TRATAMIENTO PROPUESTO'),
    ...textoPronostico.split('\n').filter((l:string)=>l.trim()).map((l:string)=>pp(l)),

    // IX. CONCLUSIONES
    h2('IX.  CONCLUSIONES CLÍNICAS PARA ASEGURADORA'),
    new Paragraph({ spacing:{before:80,after:160}, shading:{fill:'EFF6FF',type:ShadingType.CLEAR},
      border:{left:{style:BorderStyle.SINGLE,size:14,color:'1E40AF',space:10}},
      children:textoConclusiones.split('\n').filter((l:string)=>l.trim()).flatMap((line:string,i:number,arr:string[])=>[
        new TextRun({text:line,size:20,font:'Arial',color:'1E3A5F'}),
        ...(i<arr.length-1?[new TextRun({text:'\n',break:1})]:[])
      ]),
    }),

    // X. FIRMA
    h2('X.  ACREDITACIÓN PROFESIONAL Y FIRMA'),
    new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[3200,6160],rows:[
      kv('Centro terapéutico','Jugando Aprendo — Centro Especializado en Neurodesarrollo'),
      kv('Especialidad','Análisis Aplicado de la Conducta (ABA)'),
      kv('Tipo de intervención','Terapia individual — intervención temprana y desarrollo'),
      kv('Fecha de emisión',hoy),
      kv('Número de documento',docNum),
      kv('Documento válido para','Aseguradoras privadas, IMSS, ISSSTE, Seguro Popular'),
      kv('Vigencia','6 meses a partir de la fecha de emisión'),
    ]}),
    new Paragraph({spacing:{before:600,after:80},children:[new TextRun({text:'_'.repeat(50),size:20,font:'Arial',color:'1E293B'})]}),
    new Paragraph({spacing:{before:0,after:20},children:[new TextRun({text:'Responsable del Tratamiento — Jugando Aprendo',bold:true,size:18,font:'Arial',color:'1E293B'})]}),
    new Paragraph({spacing:{before:0,after:40},children:[new TextRun({text:'Terapeuta ABA Certificado / Neuropsicólogo Clínico',size:17,font:'Arial',color:'64748B',italics:true})]}),

    new Paragraph({spacing:{before:320},border:{top:{style:BorderStyle.SINGLE,size:2,color:'E2E8F0',space:8}},
      shading:{fill:'FFF7ED',type:ShadingType.CLEAR},
      children:[new TextRun({text:'⚠  DOCUMENTO CONFIDENCIAL — Uso exclusivo para trámites médico-legales con aseguradoras autorizadas. Prohibida su reproducción parcial o total sin autorización del centro emisor.',size:17,font:'Arial',color:'B45309',bold:true})]}),
    new Paragraph({spacing:{before:40,after:0},children:[new TextRun({text:`Jugando Aprendo  ·  ${hoy}  ·  Documento Nº ${docNum}`,size:16,font:'Arial',color:'94A3B8'})]}),
  ]

  return { doc: makeDoc(sections, fileName), fileName }
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