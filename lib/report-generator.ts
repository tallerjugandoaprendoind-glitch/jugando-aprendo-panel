// ==============================================================================
// LIBRERÍA COMPARTIDA: GENERACIÓN DE REPORTES WORD
// Ruta: /lib/report-generator.ts
//
// ⚠️  IMPORTANTE: Esta librería reemplaza las llamadas HTTP internas entre
//     APIs de Next.js (que fallan en Vercel serverless porque localhost:3000
//     no existe en producción). Importar directamente desde aquí.
// ==============================================================================

import { GoogleGenAI } from "@google/genai";

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel, PageBreak
} = require('docx');

// ==============================================================================
// TIPOS
// ==============================================================================
export interface GenerateReportParams {
  reportType: string;
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  aiAnalysis?: string | null;
  formTitle?: string;
}

export interface GenerateReportResult {
  success: boolean;
  fileName: string;
  fileData: string;   // base64
  mimeType: string;
  error?: string;
}

// ==============================================================================
// FUNCIÓN PRINCIPAL EXPORTADA
// ==============================================================================
export async function generateReport(params: {
  reportType: string;
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  evaluationId?: string;
  formTitle?: string;
}): Promise<GenerateReportResult> {
  const { reportType, childName, childAge, evaluatorName, reportData, formTitle } = params;

  // Normalizar reportData: soporta tanto 'responses' como 'datos' (tablas clínicas)
  const normalizedReportData = {
    ...reportData,
    responses: reportData?.responses || reportData?.datos || reportData,
  };

  // Generar análisis con IA
  let aiAnalysis: string | null = null;
  try {
    aiAnalysis = await generateAIAnalysis(reportType, childName, childAge, normalizedReportData, formTitle);
  } catch (err) {
    console.error('⚠️ Error en análisis IA (continuando sin él):', err);
  }

  // Generar documento Word
  const docBuffer = await generateWordDocument({
    reportType,
    childName,
    childAge,
    evaluatorName,
    reportData: normalizedReportData,
    aiAnalysis,
    formTitle,
  });

  const base64Doc = docBuffer.toString('base64');
  const fileName = `Reporte_${reportType}_${childName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

  return {
    success: true,
    fileName,
    fileData: base64Doc,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

// ==============================================================================
// ANÁLISIS IA
// ==============================================================================
async function generateAIAnalysis(
  reportType: string,
  childName: string,
  childAge: number | undefined,
  reportData: any,
  formTitle?: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const existingAnalysis = reportData?.ai_analysis || reportData?.responses?.ai_analysis;
    const displayTitle = formTitle || reportType.replace(/_/g, ' ').toUpperCase();

    let prompt = '';

    switch (reportType) {
      case 'anamnesis':
        prompt = `Eres un psicólogo clínico especializado en desarrollo infantil. Analiza esta anamnesis y genera un informe profesional.

PACIENTE: ${childName}
EDAD: ${childAge || 'No especificada'} años

DATOS DE LA ANAMNESIS:
${JSON.stringify(reportData, null, 2)}

GENERA UN ANÁLISIS PROFESIONAL CON:
1. RESUMEN EJECUTIVO (3-4 líneas)
2. ÁREAS DE FORTALEZA (bullet points)
3. ÁREAS DE ATENCIÓN (bullet points)
4. INTERPRETACIÓN DEL DESARROLLO (prenatal, motor, lenguaje, socioemocional, autonomía)
5. RECOMENDACIONES PROFESIONALES (bullet points)

FORMATO: Texto profesional, claro, tono empático pero técnico.`;
        break;

      case 'aba':
        prompt = `Eres un terapeuta ABA experto. Analiza esta sesión.

PACIENTE: ${childName}
DATOS: ${JSON.stringify(reportData, null, 2)}

GENERA:
1. Resumen de la sesión
2. Análisis del comportamiento observado
3. Progreso hacia objetivos terapéuticos
4. Logros destacados
5. Recomendaciones para próximas sesiones
6. Estrategias para el hogar`;
        break;

      case 'entorno_hogar':
        prompt = `Eres un terapeuta especializado en visitas domiciliarias.

PACIENTE: ${childName}
DATOS: ${JSON.stringify(reportData, null, 2)}

GENERA:
1. Resumen de la visita
2. Análisis del entorno físico
3. Dinámica familiar observada
4. Barreras identificadas
5. Facilitadores y recursos
6. Recomendaciones de adaptaciones`;
        break;

      default:
        if (existingAnalysis && typeof existingAnalysis === 'object') {
          prompt = `Eres un neuropsicólogo clínico especializado en neurodiversidad infantil.

Se completó el formulario "${displayTitle}" para ${childName} (${childAge || 'edad no especificada'} años).

ANÁLISIS IA PREVIO:
${JSON.stringify(existingAnalysis, null, 2)}

RESPUESTAS:
${JSON.stringify(reportData?.responses || reportData, null, 2)}

Genera un INFORME CLÍNICO PROFESIONAL con:
## RESUMEN EJECUTIVO
## ANÁLISIS CLÍNICO DETALLADO
## ÁREAS DE FORTALEZA
## ÁREAS DE TRABAJO PRIORITARIAS
## RECOMENDACIONES TERAPÉUTICAS
## ESTRATEGIAS PARA EL HOGAR
## INDICADORES DE SEGUIMIENTO
## PRÓXIMOS PASOS SUGERIDOS

NIVEL DE ALERTA: ${existingAnalysis?.nivel_alerta || 'moderado'}
FORMATO: Profesional, claro, empático.`;
        } else {
          prompt = `Eres un neuropsicólogo clínico especializado en neurodiversidad infantil.

Formulario "${displayTitle}" completado para ${childName} (${childAge || 'edad no especificada'} años).

RESPUESTAS:
${JSON.stringify(reportData?.responses || reportData, null, 2)}

Genera un INFORME CLÍNICO PROFESIONAL con:
## RESUMEN EJECUTIVO
## ANÁLISIS CLÍNICO DETALLADO
## ÁREAS DE FORTALEZA
## ÁREAS DE TRABAJO PRIORITARIAS
## RECOMENDACIONES TERAPÉUTICAS
## ESTRATEGIAS PARA EL HOGAR
## INDICADORES DE SEGUIMIENTO
## PRÓXIMOS PASOS

FORMATO: Profesional, empático, claro.`;
        }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || null;
  } catch (error) {
    console.error('Error en análisis IA:', error);
    return null;
  }
}

// ==============================================================================
// DOCUMENTO WORD
// ==============================================================================
async function generateWordDocument(params: GenerateReportParams): Promise<Buffer> {
  const { reportType, childName, childAge, reportData, aiAnalysis, formTitle } = params;

  const portada = createCoverPage(reportType, childName, childAge, formTitle);

  let contenido: any[] = [];
  switch (reportType) {
    case 'anamnesis':
      contenido = createAnamnesisReport(reportData, childName, childAge, aiAnalysis);
      break;
    case 'aba':
      contenido = createABAReport(reportData, childName, aiAnalysis);
      break;
    case 'entorno_hogar':
      contenido = createEntornoHogarReport(reportData, childName, aiAnalysis);
      break;
    default:
      contenido = createNeuroFormReport(reportData, childName, reportType, aiAnalysis, formTitle);
  }

  const doc = new Document({
    styles: getDocumentStyles(),
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [...portada, new PageBreak(), ...contenido]
    }]
  });

  return await Packer.toBuffer(doc);
}

// ==============================================================================
// ESTILOS
// ==============================================================================
function getDocumentStyles() {
  return {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: 276, after: 200 } } },
      { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, font: "Calibri", color: "2E75B5" }, paragraph: { spacing: { before: 480, after: 240 } } },
      { id: "Heading2", name: "Heading 2", run: { size: 28, bold: true, font: "Calibri", color: "2E75B5" }, paragraph: { spacing: { before: 360, after: 180 } } },
      { id: "Heading3", name: "Heading 3", run: { size: 24, bold: true, font: "Calibri", color: "1F4D78" }, paragraph: { spacing: { before: 280, after: 140 } } }
    ]
  };
}

// ==============================================================================
// PORTADA
// ==============================================================================
function createCoverPage(reportType: string, childName: string, childAge?: number, formTitle?: string): any[] {
  const titles: Record<string, { main: string; sub: string }> = {
    anamnesis: { main: "HISTORIA CLÍNICA", sub: "Evaluación Integral del Desarrollo" },
    aba: { main: "REPORTE DE SESIÓN ABA", sub: "Análisis Aplicado de la Conducta" },
    entorno_hogar: { main: "EVALUACIÓN DEL ENTORNO DEL HOGAR", sub: "Visita Domiciliaria y Análisis del Contexto Familiar" },
    brief2: { main: "EVALUACIÓN BRIEF-2", sub: "Funciones Ejecutivas" },
    ados2: { main: "EVALUACIÓN ADOS-2", sub: "Diagnóstico del Autismo" },
    vineland3: { main: "EVALUACIÓN VINELAND-3", sub: "Conducta Adaptativa" },
    wiscv: { main: "EVALUACIÓN WISC-V", sub: "Escala de Inteligencia" },
    basc3: { main: "EVALUACIÓN BASC-3", sub: "Sistema Conductual" },
  };

  const defaultTitle = formTitle
    ? { main: formTitle.toUpperCase(), sub: "Informe Clínico Especializado" }
    : { main: "REPORTE PROFESIONAL", sub: "Evaluación Clínica" };

  const title = titles[reportType] || defaultTitle;

  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2880, after: 720 }, children: [new TextRun({ text: "JUGANDO APRENDO", font: "Calibri", size: 32, bold: true, color: "2E75B5" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 }, children: [new TextRun({ text: "Taller de Desarrollo Infantil", font: "Calibri", size: 22, color: "595959" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 }, border: { bottom: { color: "2E75B5", space: 1, value: BorderStyle.SINGLE, size: 12 } }, children: [new TextRun({ text: "" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 720, after: 360 }, children: [new TextRun({ text: title.main, font: "Calibri", size: 40, bold: true, color: "1F4D78" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1440 }, children: [new TextRun({ text: title.sub, font: "Calibri", size: 24, color: "595959", italics: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 240 }, children: [new TextRun({ text: "PACIENTE", font: "Calibri", size: 20, bold: true, color: "404040", allCaps: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: childName, font: "Calibri", size: 32, bold: true, color: "2E75B5" })] }),
    ...(childAge ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 720 }, children: [new TextRun({ text: `Edad: ${childAge} años`, font: "Calibri", size: 22, color: "595959" })] })] : []),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440 }, children: [new TextRun({ text: `Fecha: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, font: "Calibri", size: 22, color: "737373" })] })
  ];
}

// ==============================================================================
// REPORTE ANAMNESIS
// ==============================================================================
function createAnamnesisReport(data: any, childName: string, childAge?: number, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];

  if (aiAnalysis) {
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Análisis Profesional")] }));
    aiAnalysis.split('\n\n').filter(p => p.trim()).forEach(para => {
      if (/^(\d+\.|[A-Z\sÁÉÍÓÚ]{10,}:)/.test(para.trim())) {
        elements.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 180 }, children: [new TextRun(para.replace(/^\d+\.\s*/, '').trim())] }));
      } else {
        elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: para.trim(), size: 22 })] }));
      }
    });
    elements.push(new Paragraph({ text: "" }), new PageBreak());
  }

  const sections = [
    { title: "Datos de Filiación", items: [{ label: "Informante", value: data.informante }, { label: "Parentesco", value: data.parentesco }, { label: "Vive con", value: data.vive_con }, { label: "Escolaridad actual", value: data.escolaridad }] },
    { title: "Motivo de Consulta", items: [{ label: "Motivo principal", value: data.motivo_principal }, { label: "Derivado por", value: data.derivado_por }, { label: "Expectativas", value: data.expectativas }] },
    { title: "Historia Prenatal y Parto", items: [{ label: "Embarazo planificado", value: data.tipo_embarazo }, { label: "Complicaciones", value: data.complicaciones_emb }, { label: "Tipo de parto", value: data.tipo_parto }, { label: "Lloró al nacer", value: data.llanto }, { label: "Incubadora", value: data.incubadora }] },
    { title: "Historia Médica", items: [{ label: "Enfermedades previas", value: data.enfermedades }, { label: "Exámenes realizados", value: data.examenes }, { label: "Medicación actual", value: data.medicacion }] },
    { title: "Desarrollo Psicomotor", items: [{ label: "Sostén cefálico", value: data.sosten_cefalico }, { label: "Gateo", value: data.gateo }, { label: "Marcha", value: data.marcha }, { label: "Caídas", value: data.caidas }, { label: "Motricidad fina", value: data.motricidad_fina }] },
    { title: "Desarrollo del Lenguaje", items: [{ label: "Primeras palabras", value: data.primeras_palabras }, { label: "Intención comunicativa", value: data.intencion_comunicativa }, { label: "Comprensión", value: data.comprension }, { label: "Frases", value: data.frases }] },
    { title: "Alimentación y Sueño", items: [{ label: "Apetito", value: data.apetito }, { label: "Masticación", value: data.masticacion }, { label: "Calidad del sueño", value: data.sueno_calidad }, { label: "Duerme con", value: data.duerme_con }] },
    { title: "Autonomía e Higiene", items: [{ label: "Control de esfínteres", value: data.control_esfinteres }, { label: "Vestimenta", value: data.vestido }, { label: "Aseo personal", value: data.aseo }] },
    { title: "Área Emocional y Social", items: [{ label: "Contacto visual", value: data.contacto_visual }, { label: "Tipo de juego", value: data.juego }, { label: "Rabietas", value: data.rabietas }, { label: "Relación con pares", value: data.pares }] },
    { title: "Observaciones del Terapeuta", items: [{ label: "Apariencia física", value: data.apariencia }, { label: "Actitud ante la evaluación", value: data.actitud_evaluacion }, { label: "Contacto visual observado", value: data.contacto_visual_obs }, { label: "Notas adicionales", value: data.notas_adicionales }] },
  ];

  for (const sec of sections) {
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(sec.title)] }));
    let hasContent = false;
    for (const item of sec.items) {
      if (item.value && item.value !== '') {
        hasContent = true;
        elements.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: `${item.label}: `, bold: true, size: 22 }), new TextRun({ text: String(item.value), size: 22 })] }));
      }
    }
    if (!hasContent) elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "No se proporcionó información en esta sección.", italics: true, color: "999999", size: 22 })] }));
    elements.push(new Paragraph({ text: "" }));
  }

  return elements;
}

// ==============================================================================
// REPORTE ABA
// ==============================================================================
function createABAReport(data: any, childName: string, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];
  if (aiAnalysis) {
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Análisis de la Sesión")] }));
    aiAnalysis.split('\n\n').filter(p => p.trim()).forEach(para => {
      elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: para.trim(), size: 22 })] }));
    });
    elements.push(new Paragraph({ text: "" }), new PageBreak());
  }
  elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Información de la Sesión")] }));
  [{ label: "Fecha de sesión", value: data.fecha_sesion }, { label: "Objetivo principal", value: data.datos?.objetivo_principal || data.objetivo_principal }, { label: "Conducta trabajada", value: data.datos?.conducta || data.conducta }].forEach(item => {
    if (item.value) elements.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: `${item.label}: `, bold: true, size: 22 }), new TextRun({ text: String(item.value), size: 22 })] }));
  });
  return elements;
}

// ==============================================================================
// REPORTE ENTORNO HOGAR
// ==============================================================================
function createEntornoHogarReport(data: any, childName: string, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];
  if (aiAnalysis) {
    elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Análisis del Entorno")] }));
    aiAnalysis.split('\n\n').filter(p => p.trim()).forEach(para => {
      elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: para.trim(), size: 22 })] }));
    });
    elements.push(new Paragraph({ text: "" }), new PageBreak());
  }
  elements.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Información de la Visita")] }));
  [{ label: "Fecha de visita", value: data.fecha_visita }, { label: "Comportamiento observado", value: data.datos?.comportamiento_observado || data.comportamiento_observado }, { label: "Barreras identificadas", value: data.datos?.barreras_identificadas || data.barreras_identificadas }].forEach(item => {
    if (item.value) elements.push(new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: `${item.label}: `, bold: true, size: 22 }), new TextRun({ text: String(item.value), size: 22 })] }));
  });
  return elements;
}

// ==============================================================================
// REPORTE UNIVERSAL NEUROFORMA / FORMULARIOS DE PADRES
// ==============================================================================
function createNeuroFormReport(data: any, childName: string, formType: string, aiAnalysis?: string | null, formTitle?: string): any[] {
  const elements: any[] = [];
  const displayTitle = formTitle || formType.replace(/_/g, ' ');
  const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  const separator = () => new Paragraph({ spacing: { after: 200 }, border: { bottom: { color: 'CCCCCC', space: 1, value: BorderStyle.SINGLE, size: 6 } }, children: [new TextRun({ text: '' })] });
  const sectionHead = (text: string, emoji: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 }, shading: { type: ShadingType.SOLID, color: 'EBF3FB' }, children: [new TextRun({ text: `${emoji}  ${text}`, size: 28, bold: true, color: '2E75B5', font: 'Calibri' })] });
  const subHead = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text, size: 24, bold: true, color: '1F4D78', font: 'Calibri' })] });
  const bodyText = (text: string, bold = false) => new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, size: 22, bold, font: 'Calibri', color: '333333' })] });
  const bulletItem = (text: string, color = '2E75B5') => new Paragraph({ spacing: { after: 120 }, indent: { left: 360 }, children: [new TextRun({ text: '▪  ', size: 22, bold: true, color, font: 'Calibri' }), new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })] });

  // Header
  elements.push(
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Paciente: ${childName}`, size: 22, bold: true, font: 'Calibri', color: '1F4D78' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Evaluación: ${displayTitle}`, size: 22, font: 'Calibri', color: '595959' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Fecha: ${today}`, size: 22, font: 'Calibri', color: '595959' })] }),
    separator()
  );

  // AI Analysis
  if (aiAnalysis) {
    elements.push(sectionHead('Análisis Clínico Profesional', '🧠'));
    for (const line of aiAnalysis.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith('## ')) elements.push(subHead(t.replace(/^##\s*/, '')));
      else if (t.startsWith('# ')) elements.push(sectionHead(t.replace(/^#\s*/, ''), '📋'));
      else if (t.match(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,}$/) && t.length < 60) elements.push(sectionHead(t, '📋'));
      else if (t.startsWith('- ') || t.startsWith('• ') || t.startsWith('* ')) elements.push(bulletItem(t.replace(/^[-•*]\s*/, '')));
      else if (t.match(/^\d+\.\s/)) elements.push(bulletItem(t.replace(/^\d+\.\s*/, ''), '1F4D78'));
      else if (t.startsWith('**') && t.endsWith('**')) elements.push(bodyText(t.replace(/\*\*/g, ''), true));
      else elements.push(bodyText(t));
    }
    elements.push(separator());
  }

  // Responses table
  const responses = data?.responses || data;
  if (responses && typeof responses === 'object' && !Array.isArray(responses)) {
    elements.push(sectionHead('Respuestas del Formulario', '📝'));
    const entries = Object.entries(responses).filter(([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'ai_analysis');
    if (entries.length > 0) {
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ shading: { type: ShadingType.SOLID, color: '2E75B5' }, children: [new Paragraph({ children: [new TextRun({ text: 'Campo', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
              new TableCell({ shading: { type: ShadingType.SOLID, color: '2E75B5' }, children: [new Paragraph({ children: [new TextRun({ text: 'Respuesta', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] })
            ]}),
            ...entries.map(([key, value]) => new TableRow({ children: [
              new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: 'F0F4F8' }, children: [new Paragraph({ children: [new TextRun({ text: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), size: 20, bold: true, font: 'Calibri', color: '2E75B5' })] })] }),
              new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: Array.isArray(value) ? (value as any[]).join(', ') : String(value), size: 20, font: 'Calibri', color: '333333' })] })] })
            ]}))
          ]
        }),
        new Paragraph({ text: '' })
      );
    }
  }

  // Embedded AI analysis from form
  const embedded = data?.ai_analysis;
  if (embedded && typeof embedded === 'object') {
    elements.push(separator(), sectionHead('Análisis IA del Formulario', '🤖'));
    if (embedded.nivel_alerta) {
      const colors: Record<string, string> = { bajo: '27AE60', moderado: 'F39C12', alto: 'E74C3C' };
      elements.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Nivel de Alerta: ', size: 22, bold: true, font: 'Calibri' }), new TextRun({ text: embedded.nivel_alerta.toUpperCase(), size: 22, bold: true, font: 'Calibri', color: colors[embedded.nivel_alerta] || '595959' })] }));
    }
    if (embedded.resumen_ejecutivo) { elements.push(subHead('Resumen Ejecutivo'), bodyText(embedded.resumen_ejecutivo)); }
    if (embedded.analisis_clinico) { elements.push(subHead('Análisis Clínico'), bodyText(embedded.analisis_clinico)); }
    if (embedded.areas_fortaleza?.length) { elements.push(subHead('Fortalezas')); (embedded.areas_fortaleza as string[]).forEach((f: string) => elements.push(bulletItem(f, '27AE60'))); }
    if (embedded.areas_trabajo?.length) { elements.push(subHead('Áreas de Trabajo')); (embedded.areas_trabajo as string[]).forEach((a: string) => elements.push(bulletItem(a, 'E67E22'))); }
    if (embedded.recomendaciones?.length) { elements.push(subHead('Recomendaciones')); (embedded.recomendaciones as string[]).forEach((r: string) => elements.push(bulletItem(r))); }
    if (embedded.actividades_en_casa?.length) { elements.push(subHead('Actividades en Casa')); (embedded.actividades_en_casa as string[]).forEach((a: string) => elements.push(bulletItem(a, '8E44AD'))); }
    if (embedded.proximo_paso) { elements.push(subHead('Próximo Paso'), bodyText(embedded.proximo_paso, true)); }
    if (embedded.mensaje_padres) { elements.push(subHead('Mensaje para los Padres'), bodyText(`"${embedded.mensaje_padres}"`)); }
  }

  // Footer
  elements.push(
    separator(),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Informe generado con asistencia de IA · ', size: 18, italics: true, color: '999999', font: 'Calibri' }),
      new TextRun({ text: 'Jugando Aprendo', size: 18, bold: true, italics: true, color: '2E75B5', font: 'Calibri' }),
      new TextRun({ text: ` · ${today}`, size: 18, italics: true, color: '999999', font: 'Calibri' })
    ]})
  );

  return elements;
}
