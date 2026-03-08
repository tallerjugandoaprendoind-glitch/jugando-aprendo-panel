// app/api/generate-report/route.ts
// ============================================================================
// API: Generador de Reportes Clínicos Profesionales
// Nivel neuropsicólogo especializado — formato DOCX estructurado
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'
import { buildAIContext } from '@/lib/ai-context-builder'

// ── Tipos de reporte y sus configuraciones ──────────────────────────────────
const REPORTE_CONFIG: Record<string, {
  titulo: string
  subtitulo: string
  secciones: string[]
  instrucciones: string
}> = {
  aba: {
    titulo: 'INFORME DE SESIÓN — INTERVENCIÓN ABA',
    subtitulo: 'Análisis de Conducta Aplicado',
    secciones: [
      'DATOS DE IDENTIFICACIÓN',
      'OBJETIVO(S) DE LA SESIÓN',
      'DESCRIPCIÓN DEL PROCEDIMIENTO',
      'REGISTRO DE CONDUCTAS OBSERVADAS',
      'ANÁLISIS CLÍNICO',
      'NIVEL DE LOGRO Y CRITERIO DE DOMINIO',
      'RECOMENDACIONES PARA LA PRÓXIMA SESIÓN',
      'RECOMENDACIONES PARA EL HOGAR',
    ],
    instrucciones: `Eres un analista de conducta certificado (BCBA) con especialidad en TEA y TDAH.
Genera el informe de sesión ABA con lenguaje técnico pero comprensible.
Incluye: descripción conductual precisa, análisis funcional breve, nivel de logro con porcentaje exacto, técnicas ABA utilizadas (reforzamiento, moldeamiento, encadenamiento, etc.), 
análisis de la curva de aprendizaje y recomendaciones basadas en evidencia.
Usa terminología del DSM-5-TR y principios de Malott/Cooper/Heron.`,
  },

  anamnesis: {
    titulo: 'HISTORIA CLÍNICA NEUROPSICOLÓGICA',
    subtitulo: 'Evaluación Inicial — Anamnesis Completa',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN Y REFERENCIA',
      'II. MOTIVO DE CONSULTA',
      'III. HISTORIA DEL DESARROLLO',
      'IV. ANTECEDENTES MÉDICOS Y FAMILIARES',
      'V. ÁREA COGNITIVA Y ACADÉMICA',
      'VI. ÁREA COMUNICATIVA Y LENGUAJE',
      'VII. ÁREA SOCIAL Y CONDUCTUAL',
      'VIII. ÁREA SENSORIOMOTORA',
      'IX. DINÁMICA FAMILIAR Y ENTORNO',
      'X. IMPRESIÓN DIAGNÓSTICA PRELIMINAR',
      'XI. PLAN DE INTERVENCIÓN PROPUESTO',
    ],
    instrucciones: `Eres una neuropsicóloga infantil con especialidad en TEA, TDAH y trastornos del neurodesarrollo.
Redacta una historia clínica completa con rigor científico. 
Usa los criterios del DSM-5-TR para la impresión diagnóstica.
El lenguaje debe ser clínico y profesional, adecuado para derivación médica o informe judicial.
Estructura clara con cada sección bien delimitada. Incluye fortalezas del paciente, no solo dificultades.`,
  },

  entorno_hogar: {
    titulo: 'INFORME DE EVALUACIÓN DEL ENTORNO FAMILIAR',
    subtitulo: 'Evaluación Funcional del Contexto Hogar',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. OBJETIVOS DE LA EVALUACIÓN',
      'III. ESTRUCTURA Y DINÁMICA FAMILIAR',
      'IV. ENTORNO FÍSICO Y ESTIMULACIÓN',
      'V. RUTINAS Y ORGANIZACIÓN DIARIA',
      'VI. MANEJO CONDUCTUAL EN CASA',
      'VII. PARTICIPACIÓN EN TAREAS TERAPÉUTICAS',
      'VIII. FORTALEZAS Y RECURSOS FAMILIARES',
      'IX. ÁREAS DE MEJORA',
      'X. RECOMENDACIONES PARA LA FAMILIA',
    ],
    instrucciones: `Eres una terapeuta familiar y neuropsicóloga especializada en neurodesarrollo.
Redacta un informe del entorno del hogar con enfoque sistémico y orientado a fortalezas.
Incluye análisis del entorno físico, rutinas, estrategias de manejo conductual y calidad del vínculo.
Las recomendaciones deben ser prácticas, específicas y basadas en evidencia ABA/EIBI.`,
  },

  brief2: {
    titulo: 'INFORME DE EVALUACIÓN — BRIEF-2',
    subtitulo: 'Behavior Rating Inventory of Executive Function, 2nd Edition',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. MOTIVO DE EVALUACIÓN',
      'III. INSTRUMENTOS UTILIZADOS',
      'IV. RESULTADOS POR ÍNDICE Y ESCALA',
      'V. PERFIL DE FUNCIONES EJECUTIVAS',
      'VI. ANÁLISIS CLÍNICO DE RESULTADOS',
      'VII. IMPLICANCIAS FUNCIONALES',
      'VIII. DIAGNÓSTICO DIFERENCIAL',
      'IX. RECOMENDACIONES',
    ],
    instrucciones: `Eres neuropsicóloga especializada en evaluación de funciones ejecutivas.
Genera un informe profesional del BRIEF-2. Explica cada índice (BRI, ERI, CRI, GEC) con puntajes T y percentiles.
Describe las implicancias en el funcionamiento cotidiano y académico.
Conecta los resultados con el diagnóstico de base (TEA, TDAH, etc.) según el DSM-5-TR.
Incluye recomendaciones diferenciadas para el hogar, el colegio y la terapia.`,
  },

  ados2: {
    titulo: 'INFORME DE EVALUACIÓN — ADOS-2',
    subtitulo: 'Autism Diagnostic Observation Schedule, 2nd Edition',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. MOTIVO DE EVALUACIÓN',
      'III. MÓDULO APLICADO Y JUSTIFICACIÓN',
      'IV. CONDUCTA DURANTE LA EVALUACIÓN',
      'V. RESULTADOS POR DOMINIO',
      'VI. PUNTUACIÓN TOTAL Y CLASIFICACIÓN',
      'VII. ANÁLISIS CLÍNICO',
      'VIII. CONSIDERACIONES DIAGNÓSTICAS (DSM-5-TR)',
      'IX. FORTALEZAS OBSERVADAS',
      'X. RECOMENDACIONES',
    ],
    instrucciones: `Eres neuropsicóloga certificada en la administración e interpretación del ADOS-2.
Redacta un informe diagnóstico completo. Detalla el módulo utilizado, los algoritmos aplicados,
los puntajes de comunicación social y conductas restringidas/repetitivas.
Incluye nivel de funcionamiento, fortalezas y perfiles clínicos.
Usa criterios A y B del TEA según DSM-5-TR. El lenguaje debe soportar derivación interdisciplinaria.`,
  },

  vineland3: {
    titulo: 'INFORME DE EVALUACIÓN — VINELAND-3',
    subtitulo: 'Vineland Adaptive Behavior Scales, Third Edition',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. MOTIVO DE EVALUACIÓN',
      'III. DESCRIPCIÓN DEL INSTRUMENTO',
      'IV. RESULTADOS POR DOMINIO',
      'V. COMPOSITE DE CONDUCTA ADAPTATIVA (ABC)',
      'VI. NIVEL DE FUNCIONAMIENTO ADAPTATIVO',
      'VII. ANÁLISIS CLÍNICO',
      'VIII. IMPLICANCIAS EN LA VIDA DIARIA',
      'IX. RECOMENDACIONES',
    ],
    instrucciones: `Eres neuropsicóloga especializada en evaluación de conducta adaptativa.
Redacta el informe Vineland-3 con puntajes estándar, percentiles y niveles adaptativos por dominio
(Comunicación, Vida Diaria, Socialización, Habilidades Motoras).
Conecta los resultados con el diagnóstico y el funcionamiento real del niño.
Incluye fortalezas adaptativas y áreas de desarrollo prioritario para la intervención.`,
  },

  wiscv: {
    titulo: 'INFORME DE EVALUACIÓN COGNITIVA — WISC-V',
    subtitulo: 'Wechsler Intelligence Scale for Children, Fifth Edition',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. MOTIVO DE EVALUACIÓN',
      'III. DESCRIPCIÓN DEL INSTRUMENTO',
      'IV. OBSERVACIONES CONDUCTUALES DURANTE LA EVALUACIÓN',
      'V. RESULTADOS: ÍNDICES PRIMARIOS',
      'VI. RESULTADOS: ÍNDICES COMPLEMENTARIOS',
      'VII. COEFICIENTE INTELECTUAL TOTAL (CIT)',
      'VIII. ANÁLISIS DEL PERFIL COGNITIVO',
      'IX. FORTALEZAS Y DEBILIDADES NEUROCOGNITIVAS',
      'X. DIAGNÓSTICO DIFERENCIAL',
      'XI. RECOMENDACIONES',
    ],
    instrucciones: `Eres neuropsicóloga especializada en evaluación cognitiva infantil.
Genera un informe WISC-V completo con todos los índices: ICV, IVP, IRT, IMT, IFE y CIT.
Incluye puntajes escalares, puntajes compuestos, percentiles y clasificaciones descriptivas.
Analiza el perfil de fortalezas y debilidades intraindividuales. 
Conecta el perfil cognitivo con las necesidades educativas y terapéuticas del niño.
Usa lenguaje accesible para padres en las conclusiones, pero técnico en el cuerpo del informe.`,
  },

  basc3: {
    titulo: 'INFORME DE EVALUACIÓN CONDUCTUAL Y EMOCIONAL — BASC-3',
    subtitulo: 'Behavior Assessment System for Children, Third Edition',
    secciones: [
      'I. DATOS DE IDENTIFICACIÓN',
      'II. MOTIVO DE EVALUACIÓN',
      'III. FUENTES DE INFORMACIÓN',
      'IV. ESCALAS DE EXTERNALIZACIÓN',
      'V. ESCALAS DE INTERNALIZACIÓN',
      'VI. ÍNDICE DE SÍNTOMAS COMPORTAMENTALES (BSI)',
      'VII. ESCALAS ADAPTATIVAS',
      'VIII. ÍNDICES DE VALIDEZ',
      'IX. ANÁLISIS CLÍNICO INTEGRADO',
      'X. IMPLICANCIAS DIAGNÓSTICAS',
      'XI. RECOMENDACIONES DIFERENCIADAS',
    ],
    instrucciones: `Eres neuropsicóloga especializada en evaluación conductual y emocional infantil.
Redacta el informe BASC-3 con puntajes T por escala, categorías clínicas y descripción funcional.
Analiza el perfil de escalas de externalización (hiperactividad, agresividad, conducta disruptiva),
internalización (ansiedad, depresión, somatización) y escalas adaptativas.
Conecta los resultados con el diagnóstico de base y las necesidades de intervención.
Diferencia recomendaciones para hogar, colegio y clínica.`,
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTituloArchivo(tipo: string, nombreNino: string): string {
  const fecha = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-')
  const nombre = nombreNino.replace(/\s+/g, '_').toUpperCase()
  const tipoUpper = tipo.toUpperCase()
  return `REPORTE_${tipoUpper}_${nombre}_${fecha}.docx`
}

function formatearFechaHoy(): string {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

// Construir datos del reporte en texto estructurado para la IA
function construirDatosTexto(reportData: any, tipo: string): string {
  if (!reportData) return 'Sin datos adicionales.'

  const lineas: string[] = []

  // Recorrer los datos de forma genérica
  function aplanarObjeto(obj: any, prefijo = '', nivel = 0): void {
    if (nivel > 3) return
    for (const [clave, valor] of Object.entries(obj || {})) {
      if (valor === null || valor === undefined || valor === '') continue
      const nombreClave = clave
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()

      if (typeof valor === 'object' && !Array.isArray(valor)) {
        lineas.push(`${prefijo}${nombreClave.toUpperCase()}:`)
        aplanarObjeto(valor, prefijo + '  ', nivel + 1)
      } else if (Array.isArray(valor)) {
        if (valor.length > 0) {
          lineas.push(`${prefijo}${nombreClave}: ${valor.join(', ')}`)
        }
      } else {
        lineas.push(`${prefijo}${nombreClave}: ${valor}`)
      }
    }
  }

  aplanarObjeto(reportData)
  return lineas.join('\n')
}

// ── Generar contenido del reporte con IA ─────────────────────────────────────
async function generarContenidoReporte(
  tipo: string,
  childName: string,
  childAge: number | undefined,
  reportData: any,
  contextoClinico: string
): Promise<string> {
  const config = REPORTE_CONFIG[tipo] || REPORTE_CONFIG.aba
  const datosTexto = construirDatosTexto(reportData, tipo)
  const edadTexto = childAge ? `${childAge} años` : 'edad no especificada'
  const fechaHoy = formatearFechaHoy()

  const systemPrompt = `${config.instrucciones}

REGLAS DE FORMATO DEL INFORME:
- Redacta el informe completo en español clínico peruano
- Cada sección debe estar claramente delimitada
- Usa párrafos completos, no bullets en el cuerpo (excepto en listas de recomendaciones)
- El tono es profesional, empático y orientado a fortalezas
- Incluye siempre el nombre del paciente en las secciones narrativas
- Las conclusiones deben ser accionables y específicas
- Extensión mínima: 600 palabras para mantener profundidad clínica
- Fecha del informe: ${fechaHoy}
- Formato de las secciones: usar el formato "SECCIÓN: [número]. [NOMBRE EN MAYÚSCULAS]"

SECCIONES A DESARROLLAR:
${config.secciones.map((s, i) => `${i + 1}. ${s}`).join('\n')}`

  const userPrompt = `Genera el informe completo para:

PACIENTE: ${childName}
EDAD: ${edadTexto}
TIPO DE EVALUACIÓN: ${config.titulo}
FECHA: ${fechaHoy}

DATOS DE LA EVALUACIÓN/SESIÓN:
${datosTexto}

HISTORIAL CLÍNICO PREVIO:
${contextoClinico || 'Sin historial previo disponible.'}

Redacta el informe completo con todas las secciones. Sé específico con los datos proporcionados.
Si algún dato no está disponible, indica "Pendiente de evaluación" o "A determinar en sesión".
El informe debe poder entregarse directamente a padres, médicos o colegios.`

  const contenido = await callGroqSimple(systemPrompt, userPrompt, {
    model: GROQ_MODELS.SMART,
    temperature: 0.25, // Baja temperatura para mayor precisión clínica
    maxTokens: 3000,
  })

  return contenido
}

// ── Generar DOCX en base64 ───────────────────────────────────────────────────
async function generarDocx(
  tipo: string,
  childName: string,
  childAge: number | undefined,
  contenidoReporte: string
): Promise<string> {
  const config = REPORTE_CONFIG[tipo] || REPORTE_CONFIG.aba
  const fechaHoy = formatearFechaHoy()

  // Importar docx dinámicamente
  const docx = await import('docx')
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    BorderStyle, TableRow, TableCell, Table, WidthType, ShadingType,
    PageBreak, Header, Footer, PageNumber, NumberFormat, ExternalHyperlink } = docx

  // ── Estilos de colores clínicos ──
  const COLOR_PRIMARIO   = '1B3A6B'  // Azul marino profesional
  const COLOR_SECUNDARIO = '2E86AB'  // Azul medio
  const COLOR_ACENTO     = '0D7377'  // Verde teal
  const COLOR_GRIS       = '6B7280'  // Gris texto
  const COLOR_FONDO      = 'EEF2FF'  // Fondo sección

  // ── Parsear el contenido generado por IA ──
  const lineas = contenidoReporte.split('\n').filter(l => l.trim())

  const children: any[] = []

  // ── PORTADA ──────────────────────────────────────────────────────────────
  // Logo/Cabecera institucional
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '▮ VANTY',
          bold: true,
          size: 28,
          color: COLOR_PRIMARIO,
          font: 'Calibri',
        }),
        new TextRun({
          text: '  |  Centro de Neuropsicología Infantil',
          size: 20,
          color: COLOR_GRIS,
          font: 'Calibri',
        }),
      ],
      spacing: { after: 200 },
    }),
    // Línea divisoria
    new Paragraph({
      border: { bottom: { style: BorderStyle.THICK, size: 6, color: COLOR_PRIMARIO } },
      spacing: { after: 400 },
    }),
    // Título principal
    new Paragraph({
      children: [
        new TextRun({
          text: config.titulo,
          bold: true,
          size: 40,
          color: COLOR_PRIMARIO,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: config.subtitulo,
          size: 24,
          color: COLOR_SECUNDARIO,
          italics: true,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    // Datos del paciente en tabla
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left:   { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right:  { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: COLOR_FONDO },
              children: [new Paragraph({
                children: [new TextRun({ text: 'PACIENTE', bold: true, size: 18, color: COLOR_PRIMARIO, font: 'Calibri' })],
              })],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: childName, bold: true, size: 20, font: 'Calibri' })],
              })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: COLOR_FONDO },
              children: [new Paragraph({
                children: [new TextRun({ text: 'EDAD', bold: true, size: 18, color: COLOR_PRIMARIO, font: 'Calibri' })],
              })],
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: childAge ? `${childAge} años` : 'No especificada', size: 18, font: 'Calibri' })],
              })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: COLOR_FONDO },
              children: [new Paragraph({
                children: [new TextRun({ text: 'FECHA DEL INFORME', bold: true, size: 18, color: COLOR_PRIMARIO, font: 'Calibri' })],
              })],
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: fechaHoy, size: 18, font: 'Calibri' })],
              })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.SOLID, color: COLOR_FONDO },
              children: [new Paragraph({
                children: [new TextRun({ text: 'TIPO DE EVALUACIÓN', bold: true, size: 18, color: COLOR_PRIMARIO, font: 'Calibri' })],
              })],
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: config.subtitulo, size: 18, font: 'Calibri' })],
              })],
            }),
          ],
        }),
      ],
    }),
    // Salto de página tras portada
    new Paragraph({ children: [new PageBreak()], spacing: { after: 0 } })
  )

  // ── CUERPO DEL REPORTE ───────────────────────────────────────────────────
  let enSeccion = false

  for (const linea of lineas) {
    const trimmed = linea.trim()
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 120 } }))
      continue
    }

    // Detectar encabezados de sección (patrones: "I. NOMBRE", "1. NOMBRE", "SECCIÓN:", etc.)
    const esSeccion =
      /^(I{1,3}V?|VI{0,3}|IX|X{1,3}|[0-9]+)\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmed) ||
      /^SECCIÓN\s*[:.]?\s*\d*\s*[-.]?\s*[A-ZÁÉÍÓÚÑ]/i.test(trimmed) ||
      /^[IVX]+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmed)

    if (esSeccion) {
      // Espaciado antes de sección
      if (enSeccion) {
        children.push(new Paragraph({ spacing: { before: 400 } }))
      }
      enSeccion = true

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.toUpperCase(),
              bold: true,
              size: 24,
              color: COLOR_PRIMARIO,
              font: 'Calibri',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_SECUNDARIO },
          },
          spacing: { before: 480, after: 200 },
        })
      )
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      // Elemento de lista
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^[•\-*]\s*/, ''),
              size: 20,
              font: 'Calibri',
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      )
    } else if (trimmed.match(/^\d+\.\s+/) && trimmed.length < 200) {
      // Lista numerada
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 20,
              font: 'Calibri',
            }),
          ],
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { after: 100 },
        })
      )
    } else if (trimmed.endsWith(':') && trimmed.length < 80) {
      // Sub-título dentro de sección
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 22,
              color: COLOR_ACENTO,
              font: 'Calibri',
            }),
          ],
          spacing: { before: 240, after: 120 },
        })
      )
    } else {
      // Párrafo de texto normal
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 20,
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
        })
      )
    }
  }

  // ── PIE DEL DOCUMENTO ────────────────────────────────────────────────────
  children.push(
    new Paragraph({ spacing: { before: 800 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_PRIMARIO } } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Este informe fue generado con el apoyo de inteligencia artificial clínica (ARIA - Vanty). ',
          size: 16,
          italics: true,
          color: COLOR_GRIS,
          font: 'Calibri',
        }),
        new TextRun({
          text: 'Debe ser revisado y firmado por el profesional responsable antes de su entrega.',
          size: 16,
          italics: true,
          bold: true,
          color: COLOR_GRIS,
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `_________________________________\n${childName} — ${fechaHoy}`,
          size: 18,
          font: 'Calibri',
          color: COLOR_PRIMARIO,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  )

  // ── Crear documento ──────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'Vanty — Plataforma de Neuropsicología Infantil',
    title: `${config.titulo} — ${childName}`,
    description: `Informe clínico generado por Vanty. Paciente: ${childName}. Fecha: ${fechaHoy}`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: NumberFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `VANTY — ${config.titulo.substring(0, 60)}`,
                  size: 16,
                  color: COLOR_GRIS,
                  font: 'Calibri',
                }),
                new TextRun({
                  text: `\t${childName}`,
                  size: 16,
                  bold: true,
                  color: COLOR_GRIS,
                  font: 'Calibri',
                }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  children: [
                    'Generado por Vanty — Sistema de Gestión Clínica Neuropsicológica  |  Página ',
                    PageNumber.CURRENT,
                    ' de ',
                    PageNumber.TOTAL_PAGES,
                  ],
                  size: 16,
                  color: COLOR_GRIS,
                  font: 'Calibri',
                }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
            }),
          ],
        }),
      },
      children,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer).toString('base64')
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      reportType,
      childName,
      childAge,
      reportData,
      evaluationId,
    } = body

    if (!reportType || !childName) {
      return NextResponse.json(
        { error: 'reportType y childName son requeridos' },
        { status: 400 }
      )
    }

    if (!REPORTE_CONFIG[reportType]) {
      return NextResponse.json(
        { error: `Tipo de reporte no reconocido: ${reportType}` },
        { status: 400 }
      )
    }

    // 1. Obtener contexto clínico del niño desde la BD
    let contextoClinico = ''
    try {
      // Buscar child_id en los datos si está disponible
      const childId = reportData?.child_id || reportData?.childId
      if (childId) {
        const ctx = await buildAIContext(childId, childName, childAge?.toString(), reportType)
        contextoClinico = ctx.historialTexto
      }
    } catch (err) {
      console.warn('No se pudo cargar contexto clínico:', err)
    }

    // 2. Generar contenido del reporte con IA
    const contenido = await generarContenidoReporte(
      reportType,
      childName,
      childAge,
      reportData,
      contextoClinico
    )

    if (!contenido || contenido.length < 100) {
      return NextResponse.json(
        { error: 'No se pudo generar el contenido del reporte. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // 3. Convertir a DOCX profesional
    const fileData = await generarDocx(reportType, childName, childAge, contenido)
    const fileName = getTituloArchivo(reportType, childName)

    return NextResponse.json({
      success: true,
      fileData,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      contenidoTexto: contenido, // Para debug o preview
    })

  } catch (error: any) {
    console.error('Error en /api/generate-report:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno al generar el reporte' },
      { status: 500 }
    )
  }
}
