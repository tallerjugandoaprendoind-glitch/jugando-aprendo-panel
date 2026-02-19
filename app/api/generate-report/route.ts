// ==============================================================================
// API MEJORADA CON IA: REPORTES PROFESIONALES PERSONALIZADOS
// Ruta: /app/api/generate-report/route.ts
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
        PageBreak } = require('docx');

// ==============================================================================
// INTERFACES
// ==============================================================================
interface ReportRequest {
  reportType: string; // Accepts any form type
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  evaluationId: string;
  formTitle?: string; // Optional display title for NeuroForms
}

// ==============================================================================
// HANDLER PRINCIPAL
// ==============================================================================
export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const { reportType, childName, childAge, evaluatorName, reportData, evaluationId, formTitle } = body;

    // Validaciones
    if (!reportType || !childName || !reportData) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (reportType, childName, reportData)' },
        { status: 400 }
      );
    }

    // Normalizar reportData: algunos formularios clínicos usan 'datos' en vez de 'responses'
    // Unificar ambos para que el generador siempre tenga acceso a las respuestas
    const normalizedReportData = {
      ...reportData,
      responses: reportData?.responses || reportData?.datos || reportData,
    }

    console.log('📝 Generando reporte:', { reportType, childName, childAge });

    // Generar análisis con IA antes de crear el documento
    let aiAnalysis = null;
    try {
      aiAnalysis = await generateAIAnalysis(reportType, childName, childAge, normalizedReportData, formTitle);
      console.log('🤖 Análisis IA generado:', aiAnalysis ? 'Sí' : 'No');
    } catch (error) {
      console.error('⚠️ Error generando análisis IA (continuando sin él):', error);
    }

    // Generar el documento Word
    const docBuffer = await generateWordDocument({
      reportType,
      childName,
      childAge,
      evaluatorName,
      reportData: normalizedReportData,
      aiAnalysis,
      formTitle
    });

    // Convertir a Base64
    const base64Doc = docBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      fileName: `Reporte_${reportType}_${childName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`,
      fileData: base64Doc,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

  } catch (error: any) {
    console.error('❌ Error generando reporte:', error);
    return NextResponse.json(
      { error: 'Error interno al generar el reporte.', details: error.message },
      { status: 500 }
    );
  }
}

// ==============================================================================
// GENERAR ANÁLISIS CON IA
// ==============================================================================
async function generateAIAnalysis(
  reportType: string, 
  childName: string, 
  childAge: number | undefined, 
  reportData: any,
  formTitle?: string
): Promise<string | null> {
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ No hay API key de Gemini - reporte sin análisis IA');
    return null;
  }

  try {
    // ⚡ SKIP Gemini call if analysis already exists (avoids timeout on Vercel)
    const existingAnalysis = reportData?.ai_analysis || reportData?.responses?.ai_analysis;
    if (existingAnalysis && typeof existingAnalysis === 'object' && existingAnalysis.resumen_ejecutivo) {
      console.log('⚡ Usando análisis IA existente - saltando llamada a Gemini');
      return null; // createNeuroFormReport usa el análisis embebido directamente
    }

    const ai = new GoogleGenAI({ apiKey });

    let prompt = '';
    const displayTitle = formTitle || reportType.replace(/_/g, ' ').toUpperCase();

    switch (reportType) {
      case 'anamnesis':
        prompt = `
Eres un psicólogo clínico especializado en desarrollo infantil. Analiza esta anamnesis y genera un informe profesional.

PACIENTE: ${childName}
EDAD: ${childAge || 'No especificada'} años

DATOS DE LA ANAMNESIS:
${JSON.stringify(reportData, null, 2)}

GENERA UN ANÁLISIS PROFESIONAL CON:

1. RESUMEN EJECUTIVO (3-4 líneas)
Sintetiza los hallazgos más relevantes del desarrollo del niño.

2. ÁREAS DE FORTALEZA (bullet points)
Identifica al menos 3 aspectos positivos del desarrollo.

3. ÁREAS DE ATENCIÓN (bullet points)
Señala aspectos que requieren seguimiento o intervención.

4. INTERPRETACIÓN DEL DESARROLLO
- Desarrollo prenatal y perinatal
- Hitos motores
- Desarrollo del lenguaje
- Área socioemocional
- Autonomía

5. RECOMENDACIONES PROFESIONALES (bullet points)
Sugerencias concretas para la familia y el equipo terapéutico.

FORMATO: Texto profesional, claro, sin jerga excesiva. Tono empático pero técnico.
`;
        break;

      case 'aba':
        prompt = `
Eres un terapeuta ABA experto. Analiza esta sesión y genera un informe profesional.

PACIENTE: ${childName}
DATOS DE LA SESIÓN:
${JSON.stringify(reportData, null, 2)}

GENERA:
1. Resumen de la sesión (2-3 líneas)
2. Análisis del comportamiento observado
3. Progreso hacia objetivos terapéuticos
4. Logros destacados de la sesión
5. Recomendaciones para próximas sesiones
6. Estrategias sugeridas para el hogar
`;
        break;

      case 'entorno_hogar':
        prompt = `
Eres un terapeuta especializado en visitas domiciliarias. Analiza esta evaluación.

PACIENTE: ${childName}
DATOS DE LA VISITA:
${JSON.stringify(reportData, null, 2)}

GENERA:
1. Resumen de la visita domiciliaria
2. Análisis del entorno físico y su adecuación
3. Dinámica familiar observada
4. Barreras identificadas para el desarrollo
5. Facilitadores y recursos del entorno
6. Recomendaciones de adaptaciones del hogar
`;
        break;

      default:
        // Universal prompt for ALL NeuroForms and parent forms
        // If there's already AI analysis embedded, use it as context to generate a narrative
        if (existingAnalysis && typeof existingAnalysis === 'object') {
          prompt = `
Eres un neuropsicólogo clínico especializado en neurodiversidad infantil.

Se completó el formulario "${displayTitle}" para el paciente ${childName} (${childAge || 'edad no especificada'} años).

ANÁLISIS IA PREVIO DEL FORMULARIO:
${JSON.stringify(existingAnalysis, null, 2)}

RESPUESTAS DEL FORMULARIO:
${JSON.stringify(reportData?.responses || reportData, null, 2)}

Basándote en el análisis previo y las respuestas, genera un INFORME CLÍNICO PROFESIONAL COMPLETO con las siguientes secciones:

## RESUMEN EJECUTIVO
Párrafo de 3-4 oraciones resumiendo el estado actual del paciente según este formulario.

## ANÁLISIS CLÍNICO DETALLADO
Análisis clínico de 4-5 oraciones con terminología profesional apropiada.

## ÁREAS DE FORTALEZA
Lista de 3-4 fortalezas identificadas con explicación breve de cada una.

## ÁREAS DE TRABAJO PRIORITARIAS
Lista de 3-4 áreas que requieren intervención terapéutica, con justificación clínica.

## RECOMENDACIONES TERAPÉUTICAS
Lista de 4-5 recomendaciones concretas y aplicables para el equipo terapéutico.

## ESTRATEGIAS PARA EL HOGAR
Lista de 3-4 actividades o estrategias que los padres pueden implementar en casa.

## INDICADORES DE SEGUIMIENTO
Lista de 3 indicadores clave para monitorear el progreso en próximas evaluaciones.

## PRÓXIMOS PASOS SUGERIDOS
Una acción concreta y específica que el equipo debe tomar en la próxima sesión.

NIVEL DE ALERTA CLÍNICA: ${existingAnalysis?.nivel_alerta || 'moderado'} 

FORMATO: Texto profesional, claro, empático. Usa terminología clínica apropiada pero comprensible.
`;
        } else {
          prompt = `
Eres un neuropsicólogo clínico especializado en neurodiversidad infantil.

Se completó el formulario "${displayTitle}" para el paciente ${childName} (${childAge || 'edad no especificada'} años).

RESPUESTAS DEL FORMULARIO:
${JSON.stringify(reportData?.responses || reportData, null, 2)}

Genera un INFORME CLÍNICO PROFESIONAL COMPLETO con las siguientes secciones:

## RESUMEN EJECUTIVO
Párrafo de 3-4 oraciones resumiendo los hallazgos principales de este formulario.

## ANÁLISIS CLÍNICO DETALLADO
Análisis clínico de 4-5 oraciones con terminología profesional apropiada.

## ÁREAS DE FORTALEZA
Lista de 3-4 fortalezas identificadas con explicación breve.

## ÁREAS DE TRABAJO PRIORITARIAS
Lista de 3-4 áreas que requieren atención terapéutica con justificación.

## RECOMENDACIONES TERAPÉUTICAS
Lista de 4-5 recomendaciones concretas para el equipo terapéutico.

## ESTRATEGIAS PARA EL HOGAR
Lista de 3-4 estrategias prácticas para implementar en casa.

## INDICADORES DE SEGUIMIENTO
Lista de 3 indicadores para monitorear el progreso.

## PRÓXIMOS PASOS
Acción concreta para la próxima sesión terapéutica.

FORMATO: Texto profesional, empático, claro. Terminología clínica apropiada.
`;
        }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const analysis = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || null;
    console.log('✅ Análisis IA generado exitosamente');
    return analysis;

  } catch (error) {
    console.error('Error generando análisis IA:', error);
    return null;
  }
}

// ==============================================================================
// GENERAR DOCUMENTO WORD
// ==============================================================================
async function generateWordDocument(params: {
  reportType: string;
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  aiAnalysis?: string | null;
  formTitle?: string;
}) {
  const { reportType, childName, childAge, reportData, aiAnalysis, formTitle } = params;

  const sections: any[] = [];
  
  // PORTADA
  const portada = createCoverPage(reportType, childName, childAge, formTitle);
  
  // CONTENIDO
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
      // Universal professional report for ALL NeuroForms
      contenido = createNeuroFormReport(reportData, childName, reportType, aiAnalysis, formTitle);
  }

  sections.push({
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [...portada, new PageBreak(), ...contenido]
  });

  const doc = new Document({
    styles: getDocumentStyles(),
    sections
  });

  return await Packer.toBuffer(doc);
}

// ==============================================================================
// ESTILOS
// ==============================================================================
function getDocumentStyles() {
  return {
    default: {
      document: {
        run: { font: "Calibri", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Normal",
        name: "Normal",
        run: { font: "Calibri", size: 22 },
        paragraph: { spacing: { line: 276, after: 200 } }
      },
      {
        id: "Heading1",
        name: "Heading 1",
        run: { size: 32, bold: true, font: "Calibri", color: "2E75B5" },
        paragraph: { spacing: { before: 480, after: 240 } }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        run: { size: 28, bold: true, font: "Calibri", color: "2E75B5" },
        paragraph: { spacing: { before: 360, after: 180 } }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        run: { size: 24, bold: true, font: "Calibri", color: "1F4D78" },
        paragraph: { spacing: { before: 280, after: 140 } }
      }
    ]
  };
}

// ==============================================================================
// PORTADA
// ==============================================================================
function createCoverPage(reportType: string, childName: string, childAge?: number, formTitle?: string): any[] {
  const titles: Record<string, { main: string; sub: string }> = {
    anamnesis: {
      main: "HISTORIA CLÍNICA",
      sub: "Evaluación Integral del Desarrollo"
    },
    aba: {
      main: "REPORTE DE SESIÓN ABA",
      sub: "Análisis Aplicado de la Conducta"
    },
    entorno_hogar: {
      main: "EVALUACIÓN DEL ENTORNO DEL HOGAR",
      sub: "Visita Domiciliaria y Análisis del Contexto Familiar"
    },
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
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2880, after: 720 },
      children: [
        new TextRun({
          text: "JUGANDO APRENDO",
          font: "Calibri",
          size: 32,
          bold: true,
          color: "2E75B5"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
      children: [
        new TextRun({
          text: "Centro de Desarrollo Infantil",
          font: "Calibri",
          size: 22,
          color: "595959"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
      border: {
        bottom: { color: "2E75B5", space: 1, value: BorderStyle.SINGLE, size: 12 }
      },
      children: [new TextRun({ text: "" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 360 },
      children: [
        new TextRun({
          text: title.main,
          font: "Calibri",
          size: 40,
          bold: true,
          color: "1F4D78"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
      children: [
        new TextRun({
          text: title.sub,
          font: "Calibri",
          size: 24,
          color: "595959",
          italics: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 240 },
      children: [
        new TextRun({
          text: "PACIENTE",
          font: "Calibri",
          size: 20,
          bold: true,
          color: "404040",
          allCaps: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: childName,
          font: "Calibri",
          size: 32,
          bold: true,
          color: "2E75B5"
        })
      ]
    }),
    ...(childAge ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 720 },
        children: [
          new TextRun({
            text: `Edad: ${childAge} años`,
            font: "Calibri",
            size: 22,
            color: "595959"
          })
        ]
      })
    ] : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440 },
      children: [
        new TextRun({
          text: `Fecha: ${new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}`,
          font: "Calibri",
          size: 22,
          color: "737373"
        })
      ]
    })
  ];
}

// ==============================================================================
// REPORTE DE ANAMNESIS - VERSIÓN MEJORADA
// ==============================================================================
function createAnamnesisReport(data: any, childName: string, childAge?: number, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];

  // ══════════════════════════════════════════════════════════════════════════
  // ANÁLISIS PROFESIONAL CON IA (SI EXISTE)
  // ══════════════════════════════════════════════════════════════════════════
  if (aiAnalysis) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Análisis Profesional")]
      })
    );

    // Dividir el análisis en párrafos
    const analysisParagraphs = aiAnalysis.split('\n\n').filter(p => p.trim());
    analysisParagraphs.forEach(para => {
      if (para.trim()) {
        // Si es un título (empieza con número o mayúsculas)
        if (/^(\d+\.|[A-Z\sÁÉÍÓÚ]{10,}:)/.test(para.trim())) {
          elements.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 360, after: 180 },
              children: [new TextRun(para.replace(/^\d+\.\s*/, '').trim())]
            })
          );
        } else {
          elements.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [new TextRun({ text: para.trim(), size: 22 })]
            })
          );
        }
      }
    });

    elements.push(
      new Paragraph({ text: "" }),
      new PageBreak()
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. DATOS DE FILIACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Datos de Filiación")]
    })
  );

  const filiacionItems = [
    { label: "Informante", value: data.informante },
    { label: "Parentesco", value: data.parentesco },
    { label: "Vive con", value: data.vive_con },
    { label: "Escolaridad actual", value: data.escolaridad }
  ];

  let hasFiliacion = false;
  filiacionItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasFiliacion = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasFiliacion) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MOTIVO DE CONSULTA
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Motivo de Consulta")]
    })
  );

  const motivoItems = [
    { label: "Motivo principal", value: data.motivo_principal },
    { label: "Derivado por", value: data.derivado_por },
    { label: "Expectativas de la familia", value: data.expectativas }
  ];

  let hasMotivo = false;
  motivoItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasMotivo = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasMotivo) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 3. HISTORIA PRENATAL Y PARTO
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Historia Prenatal y Parto")]
    })
  );

  const prenatalItems = [
    { label: "Embarazo planificado", value: data.tipo_embarazo },
    { label: "Complicaciones durante el embarazo", value: data.complicaciones_emb },
    { label: "Tipo de parto", value: data.tipo_parto },
    { label: "Lloró al nacer", value: data.llanto },
    { label: "Requirió incubadora", value: data.incubadora }
  ];

  let hasPrenatal = false;
  prenatalItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasPrenatal = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasPrenatal) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 4. HISTORIA MÉDICA
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Historia Médica")]
    })
  );

  const medicaItems = [
    { label: "Enfermedades previas", value: data.enfermedades },
    { label: "Exámenes realizados", value: data.examenes },
    { label: "Medicación actual", value: data.medicacion }
  ];

  let hasMedica = false;
  medicaItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasMedica = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasMedica) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 5. DESARROLLO PSICOMOTOR
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Desarrollo Psicomotor")]
    })
  );

  const motorItems = [
    { label: "Sostén cefálico", value: data.sosten_cefalico },
    { label: "Gateo", value: data.gateo },
    { label: "Marcha (caminar)", value: data.marcha },
    { label: "Se cae frecuentemente", value: data.caidas },
    { label: "Motricidad fina", value: data.motricidad_fina }
  ];

  let hasMotor = false;
  motorItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasMotor = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasMotor) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 6. DESARROLLO DEL LENGUAJE
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Desarrollo del Lenguaje")]
    })
  );

  const lenguajeItems = [
    { label: "Primeras palabras", value: data.primeras_palabras },
    { label: "Intención comunicativa", value: data.intencion_comunicativa },
    { label: "Nivel de comprensión", value: data.comprension },
    { label: "Estructura frases", value: data.frases }
  ];

  let hasLenguaje = false;
  lenguajeItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasLenguaje = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasLenguaje) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 7. ALIMENTACIÓN Y SUEÑO
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Alimentación y Sueño")]
    })
  );

  const alimentacionItems = [
    { label: "Apetito", value: data.apetito },
    { label: "Masticación", value: data.masticacion },
    { label: "Calidad del sueño", value: data.sueno_calidad },
    { label: "Duerme con", value: data.duerme_con }
  ];

  let hasAlimentacion = false;
  alimentacionItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasAlimentacion = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasAlimentacion) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 8. AUTONOMÍA E HIGIENE
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Autonomía e Higiene")]
    })
  );

  const autonomiaItems = [
    { label: "Control de esfínteres", value: data.control_esfinteres },
    { label: "Vestimenta", value: data.vestido },
    { label: "Aseo personal", value: data.aseo }
  ];

  let hasAutonomia = false;
  autonomiaItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasAutonomia = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasAutonomia) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 9. ÁREA EMOCIONAL Y SOCIAL
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Área Emocional y Social")]
    })
  );

  const emocionalItems = [
    { label: "Contacto visual", value: data.contacto_visual },
    { label: "Tipo de juego", value: data.juego },
    { label: "Rabietas", value: data.rabietas },
    { label: "Relación con pares", value: data.pares }
  ];

  let hasEmocional = false;
  emocionalItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasEmocional = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasEmocional) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  elements.push(new Paragraph({ text: "" }));

  // ══════════════════════════════════════════════════════════════════════════
  // 10. OBSERVACIONES DEL TERAPEUTA
  // ══════════════════════════════════════════════════════════════════════════
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Observaciones del Terapeuta")]
    })
  );

  const observacionesItems = [
    { label: "Apariencia física", value: data.apariencia },
    { label: "Actitud ante la evaluación", value: data.actitud_evaluacion },
    { label: "Contacto visual observado", value: data.contacto_visual_obs },
    { label: "Notas adicionales", value: data.notas_adicionales }
  ];

  let hasObservaciones = false;
  observacionesItems.forEach(item => {
    if (item.value && item.value !== '') {
      hasObservaciones = true;
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  if (!hasObservaciones) {
    elements.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ 
          text: "No se proporcionó información en esta sección.", 
          italics: true, 
          color: "999999",
          size: 22 
        })]
      })
    );
  }

  return elements;
}

// ==============================================================================
// OTROS REPORTES (Stubs mejorados)
// ==============================================================================

function createABAReport(data: any, childName: string, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];
  
  // Análisis IA primero
  if (aiAnalysis) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Análisis de la Sesión")]
      })
    );
    
    const paragraphs = aiAnalysis.split('\n\n').filter(p => p.trim());
    paragraphs.forEach(para => {
      elements.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: para.trim(), size: 22 })]
        })
      );
    });
    
    elements.push(new Paragraph({ text: "" }), new PageBreak());
  }
  
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Información de la Sesión")]
    })
  );
  
  const sessionItems = [
    { label: "Fecha de sesión", value: data.fecha_sesion },
    { label: "Objetivo principal", value: data.datos?.objetivo_principal },
    { label: "Conducta trabajada", value: data.datos?.conducta }
  ];

  sessionItems.forEach(item => {
    if (item.value) {
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  return elements;
}

function createEntornoHogarReport(data: any, childName: string, aiAnalysis?: string | null): any[] {
  const elements: any[] = [];
  
  if (aiAnalysis) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Análisis del Entorno")]
      })
    );
    
    const paragraphs = aiAnalysis.split('\n\n').filter(p => p.trim());
    paragraphs.forEach(para => {
      elements.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: para.trim(), size: 22 })]
        })
      );
    });
    
    elements.push(new Paragraph({ text: "" }), new PageBreak());
  }
  
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Información de la Visita")]
    })
  );

  const items = [
    { label: "Fecha de visita", value: data.fecha_visita },
    { label: "Comportamiento observado", value: data.datos?.comportamiento_observado },
    { label: "Barreras identificadas", value: data.datos?.barreras_identificadas }
  ];

  items.forEach(item => {
    if (item.value) {
      elements.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: `${item.label}: `, bold: true, size: 22 }),
            new TextRun({ text: String(item.value), size: 22 })
          ]
        })
      );
    }
  });

  return elements;
}

function createGenericReport(data: any, childName: string, reportType: string): any[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`Reporte ${reportType.toUpperCase()}`)]
    }),
    new Paragraph({
      children: [new TextRun({ 
        text: "Este tipo de reporte está en desarrollo. Los datos se han registrado correctamente.", 
        italics: true,
        size: 22
      })]
    })
  ];
}

// ==============================================================================
// UNIVERSAL PROFESSIONAL NEUROFORM REPORT (for ALL form types)
// ==============================================================================
function createNeuroFormReport(data: any, childName: string, formType: string, aiAnalysis?: string | null, formTitle?: string): any[] {
  const elements: any[] = [];
  const displayTitle = formTitle || formType.replace(/_/g, ' ');
  const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  const separator = () => new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: 'CCCCCC', space: 1, value: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text: '' })]
  });

  const sectionHead = (text: string, emoji: string) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    shading: { type: ShadingType.SOLID, color: 'EBF3FB' },
    children: [new TextRun({ text: `${emoji}  ${text}`, size: 28, bold: true, color: '2E75B5', font: 'Calibri' })]
  });

  const subHead = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, size: 24, bold: true, color: '1F4D78', font: 'Calibri' })]
  });

  const bodyText = (text: string, bold = false) => new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22, bold, font: 'Calibri', color: '333333' })]
  });

  const bulletItem = (text: string, color = '2E75B5') => new Paragraph({
    spacing: { after: 120 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: '▪  ', size: 22, bold: true, color, font: 'Calibri' }),
      new TextRun({ text, size: 22, font: 'Calibri', color: '333333' })
    ]
  });

  // 1. HEADER
  elements.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: `Paciente: ${childName}`, size: 22, bold: true, font: 'Calibri', color: '1F4D78' })]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: `Evaluación: ${displayTitle}`, size: 22, font: 'Calibri', color: '595959' })]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: `Fecha: ${today}`, size: 22, font: 'Calibri', color: '595959' })]
    }),
    separator()
  );

  // 2. AI ANALYSIS
  if (aiAnalysis) {
    elements.push(sectionHead('Análisis Clínico Profesional', '🧠'));
    const lines = aiAnalysis.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('## ')) {
        elements.push(subHead(trimmed.replace(/^##\s*/, '')));
      } else if (trimmed.startsWith('# ')) {
        elements.push(sectionHead(trimmed.replace(/^#\s*/, ''), '📋'));
      } else if (trimmed.match(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,}$/) && trimmed.length < 60) {
        elements.push(sectionHead(trimmed, '📋'));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        elements.push(bulletItem(trimmed.replace(/^[-•*]\s*/, '')));
      } else if (trimmed.match(/^\d+\.\s/)) {
        elements.push(bulletItem(trimmed.replace(/^\d+\.\s*/, ''), '1F4D78'));
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(bodyText(trimmed.replace(/\*\*/g, ''), true));
      } else {
        elements.push(bodyText(trimmed));
      }
    }
    elements.push(separator());
  }

  // 3. RESPONSES TABLE
  const responses = data?.responses || data;
  if (responses && typeof responses === 'object' && !Array.isArray(responses)) {
    elements.push(sectionHead('Respuestas del Formulario', '📝'));
    const entries = Object.entries(responses).filter(([, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length > 0) {
      const tableRows = entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const displayValue = Array.isArray(value) ? (value as any[]).join(', ') : String(value);
        return new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'F0F4F8' },
              children: [new Paragraph({ children: [new TextRun({ text: displayKey, size: 20, bold: true, font: 'Calibri', color: '2E75B5' })] })]
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: displayValue, size: 20, font: 'Calibri', color: '333333' })] })]
            })
          ]
        });
      });
      elements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ shading: { type: ShadingType.SOLID, color: '2E75B5' }, children: [new Paragraph({ children: [new TextRun({ text: 'Campo', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: '2E75B5' }, children: [new Paragraph({ children: [new TextRun({ text: 'Respuesta', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] })
              ]
            }),
            ...tableRows
          ]
        }),
        new Paragraph({ text: '' })
      );
    }
  }

  // 4. EMBEDDED AI ANALYSIS FROM FORM
  const embedded = data?.ai_analysis;
  if (embedded && typeof embedded === 'object') {
    elements.push(separator(), sectionHead('Análisis IA del Formulario', '🤖'));
    if (embedded.nivel_alerta) {
      const colors: Record<string, string> = { bajo: '27AE60', moderado: 'F39C12', alto: 'E74C3C' };
      elements.push(new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'Nivel de Alerta: ', size: 22, bold: true, font: 'Calibri' }),
          new TextRun({ text: embedded.nivel_alerta.toUpperCase(), size: 22, bold: true, font: 'Calibri', color: colors[embedded.nivel_alerta] || '595959' })
        ]
      }));
    }
    if (embedded.analisis_clinico) { elements.push(subHead('Análisis Clínico'), bodyText(embedded.analisis_clinico)); }
    if (embedded.areas_fortaleza?.length) { elements.push(subHead('Fortalezas')); (embedded.areas_fortaleza as string[]).forEach((f: string) => elements.push(bulletItem(f, '27AE60'))); }
    if (embedded.areas_trabajo?.length) { elements.push(subHead('Áreas de Trabajo')); (embedded.areas_trabajo as string[]).forEach((a: string) => elements.push(bulletItem(a, 'E67E22'))); }
    if (embedded.recomendaciones?.length) { elements.push(subHead('Recomendaciones')); (embedded.recomendaciones as string[]).forEach((r: string) => elements.push(bulletItem(r))); }
    if (embedded.mensaje_padres) { elements.push(subHead('Mensaje para los Padres'), bodyText(`"${embedded.mensaje_padres}"`, false)); }
  }

  // 5. FOOTER
  elements.push(
    separator(),
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Informe generado con asistencia de IA · ', size: 18, italics: true, color: '999999', font: 'Calibri' }),
        new TextRun({ text: 'Jugando Aprendo', size: 18, bold: true, italics: true, color: '2E75B5', font: 'Calibri' }),
        new TextRun({ text: ` · ${today}`, size: 18, italics: true, color: '999999', font: 'Calibri' })
      ]
    })
  );

  return elements;
}
