// ==============================================================================
// API MEJORADA CON IA: REPORTES PROFESIONALES PERSONALIZADOS
// Ruta: /app/api/generate-report/route.ts
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { callGroqSimple, GROQ_MODELS } from '@/lib/groq-client'

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
    const resolvedResponses = reportData?.responses || reportData?.datos || reportData || {}
    const normalizedReportData = {
      ...resolvedResponses,          // spread all form fields to top level
      ...reportData,                 // keep original top-level fields
      responses: resolvedResponses,  // also keep .responses accessor
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


  try {
    // Si ya existe análisis IA completo, no llamar Gemini (evita timeout)
    const existingAnalysis = reportData?.ai_analysis || reportData?.responses?.ai_analysis;
    if (existingAnalysis && typeof existingAnalysis === 'object' && existingAnalysis.resumen_ejecutivo) {
      return null;
    }


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
Eres un psicólogo conductual certificado en ABA (Análisis Aplicado de la Conducta) con más de 15 años de experiencia clínica en un centro neuropsicológico de alto nivel especializado en neurodivergencia infantil. Tu tarea es redactar un INFORME CLÍNICO DE SESIÓN ABA de nivel profesional especializado, al estándar de un centro neuropsicológico privado.

═══════════════════════════════════════════════════════════
DATOS DE LA SESIÓN - PACIENTE: ${childName}
═══════════════════════════════════════════════════════════
${JSON.stringify(reportData, null, 2)}

═══════════════════════════════════════════════════════════
INSTRUCCIONES DE REDACCIÓN (CRÍTICAS - SEGUIR AL PIE DE LA LETRA)
═══════════════════════════════════════════════════════════

Redacta el informe en español profesional clínico. Usa terminología ABA y neuropsicológica correcta (schedules of reinforcement, prompt fading, generalization, discriminative stimulus, baseline, etc.). El tono debe ser técnico pero comprensible. Evita el lenguaje coloquial. Cada sección debe ser sustancial y aportar valor clínico real, no frases genéricas.

ESTRUCTURA OBLIGATORIA DEL INFORME:

## RESUMEN EJECUTIVO DE SESIÓN
Párrafo de 4-5 oraciones que sintetice: modalidad de sesión, estado general del paciente al inicio, habilidades trabajadas, nivel de respuesta terapéutica y cierre de la sesión. Usa terminología clínica precisa.

## ANÁLISIS CONDUCTUAL (Modelo ABC)
Describe el análisis funcional de las conductas observadas durante la sesión. Incluye: antecedentes identificados, topografía de las conductas objetivo, consecuencias aplicadas y función estimada de la conducta. Si se presentaron conductas desafiantes, analiza su función desde el modelo de Iwata et al. Si no hay datos ABC explícitos, infiere desde los datos disponibles.

## PERFIL DE DESEMPEÑO EN SESIÓN
Analiza cuantitativamente y cualitativamente las métricas registradas:
- Nivel de atención sostenida (con interpretación clínica del puntaje)
- Respuesta a instrucciones y compliance (incluyendo latencia y calidad de respuesta)
- Iniciativa comunicativa (espontaneidad, modalidad, funciones comunicativas)
- Tolerancia a la frustración (análisis de regulación emocional)
- Calidad de interacción social (reciprocidad, contacto visual, interés social)
Relaciona cada métrica con el perfil neurológico típico de pacientes con necesidades similares.

## HABILIDADES TRABAJADAS Y NIVEL DE ADQUISICIÓN
Para cada habilidad trabajada:
- Describe el estado actual de adquisición
- Nivel de prompt utilizado y justificación clínica
- Porcentaje o nivel de logro con interpretación
- Hipótesis sobre factores que facilitaron o dificultaron el aprendizaje en esta sesión
Usa el concepto de Zona de Desarrollo Proximal donde sea relevante.

## ESTRATEGIAS E INTERVENCIONES APLICADAS
Describe técnicamente las intervenciones usadas:
- Justificación clínica de cada técnica seleccionada
- Evidencia de su efectividad en la sesión
- Reforzadores utilizados y análisis de su eficacia (valor motivacional observado)
- Análisis de la jerarquía de prompts empleada

## ANÁLISIS DE CONDUCTAS DESAFIANTES (si aplica)
Si se reportaron conductas desafiantes: topografía, frecuencia/intensidad estimada, función conductual hipotética, estrategias de manejo aplicadas y su efectividad. Si no hubo conductas desafiantes, mencionar este dato como indicador positivo.

## PROGRESO TERAPÉUTICO Y PATRÓN DE APRENDIZAJE
- Análisis del patrón de aprendizaje observado (consolidación, generalización, mantenimiento)
- Avances concretos en relación al objetivo de sesión
- Áreas de dificultad persistente con hipótesis clínica
- Tendencia de progreso estimada

## OBSERVACIONES CLÍNICAS PARA EL EQUIPO
Notas técnicas internas relevantes para el equipo terapéutico: hipótesis clínicas emergentes, ajustes al programa sugeridos, necesidad de coordinación interdisciplinaria, alertas o banderas rojas si las hay. Nivel de coordinación requerida con familia.

## PLAN DE INTERVENCIÓN PARA PRÓXIMA SESIÓN
- Objetivo principal ajustado para la siguiente sesión
- Materiales y recursos a preparar
- Ajustes en estrategias o nivel de ayudas
- Variables a monitorear

## TAREA TERAPÉUTICA PARA EL HOGAR
Descripción detallada de la actividad para casa:
- Instrucciones claras paso a paso para los padres/cuidadores
- Objetivo conductual de la actividad
- Frecuencia sugerida
- Indicadores que los padres deben observar y reportar

## COMUNICACIÓN FAMILIAR (Mensaje para compartir con la familia)
Redacta un párrafo en lenguaje accesible (sin jerga técnica excesiva) con los logros de la sesión, el avance del niño/a y un mensaje motivador. Este texto debe transmitir profesionalismo y calidez. Menciona algo específico positivo del paciente.

NIVEL DE EFECTIVIDAD DE SESIÓN: ${reportData?.efectividad_sesion ? `${reportData.efectividad_sesion}/5` : 'No registrado'}
ALERTAS CLÍNICAS: ${reportData?.alertas_clinicas || 'Ninguna reportada'}

IMPORTANTE: Si algún campo de datos está vacío o no fue registrado, infiere información clínicamente razonable basándote en los datos disponibles. Nunca dejes una sección vacía ni escribas "No hay datos". Sé siempre específico y aporta valor clínico en cada párrafo.
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

    const response = await callGroqSimple(
        'Eres un asistente clínico especializado en ABA, TEA, TDAH y neurodesarrollo.',
        prompt,
        { model: GROQ_MODELS.SMART, temperature: 0.5, maxTokens: 2000 }
      );

    const analysis = response.candidates?.[0]?.content?.parts?.[0]?.text || response || null;
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
    children: [...portada, new Paragraph({ children: [new PageBreak()] }), ...contenido]
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
  // Normalize: data may come as { responses: {...}, ai_analysis: {...} } or flat
  const d = data?.responses || data;
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
      new Paragraph({ children: [new PageBreak()] })
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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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

  elements.push(new Paragraph({ children: [new TextRun({ text: " " })] }));

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
  const d = data?.responses || data?.datos || data;
  const elements: any[] = [];
  const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  const separator = () => new Paragraph({
    spacing: { after: 200, before: 100 },
    border: { bottom: { color: 'C5D8F0', space: 1, value: BorderStyle.SINGLE, size: 8 } },
    children: [new TextRun({ text: ' ' })]
  });

  const sectionHead = (text: string, accent = '1B5EA1') => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 500, after: 220 },
    shading: { type: ShadingType.SOLID, color: 'EBF3FB' },
    border: { left: { color: accent, space: 10, value: BorderStyle.SINGLE, size: 28 } },
    indent: { left: 220 },
    children: [new TextRun({ text: text.toUpperCase(), size: 25, bold: true, color: accent, font: 'Calibri' })]
  });

  const subHead = (text: string) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, size: 23, bold: true, color: '1F4D78', font: 'Calibri' })]
  });

  const bodyPara = (text: string, italics = false) => new Paragraph({
    spacing: { after: 180, line: 300 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '2C2C2C', italics })]
  });

  const fieldRow = (label: string, value: string | undefined | null) => {
    if (!value || value === '') return [];
    return [new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({ text: `${label}:  `, bold: true, size: 21, font: 'Calibri', color: '1B5EA1' }),
        new TextRun({ text: String(value), size: 21, font: 'Calibri', color: '333333' })
      ]
    })];
  };

  const bulletItem = (text: string, color = '1B5EA1') => new Paragraph({
    spacing: { after: 130 },
    indent: { left: 480, hanging: 280 },
    children: [
      new TextRun({ text: '◆  ', size: 19, bold: true, color, font: 'Calibri' }),
      new TextRun({ text, size: 21, font: 'Calibri', color: '333333' })
    ]
  });

  const metricBadge = (label: string, value: number | undefined, max: number, labels: string[]) => {
    if (!value) return [];
    const label_text = labels[value - 1] || String(value);
    const pct = Math.round((value / max) * 100);
    const color = pct >= 70 ? '27AE60' : pct >= 40 ? 'E67E22' : 'E74C3C';
    return [new Paragraph({
      spacing: { after: 130 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 21, font: 'Calibri', color: '2C3E50' }),
        new TextRun({ text: `${value}/${max}`, bold: true, size: 21, font: 'Calibri', color }),
        new TextRun({ text: `  —  ${label_text}`, size: 20, font: 'Calibri', color: '595959', italics: true }),
      ]
    })];
  };

  // ─── ENCABEZADO INSTITUCIONAL ────────────────────────────────────────────
  elements.push(
    new Paragraph({
      spacing: { after: 80 },
      border: { bottom: { color: '1B5EA1', space: 6, value: BorderStyle.SINGLE, size: 16 } },
      children: [
        new TextRun({ text: 'INFORME CLÍNICO DE SESIÓN', size: 28, bold: true, font: 'Calibri', color: '1B5EA1', allCaps: true }),
        new TextRun({ text: '   |   Análisis Aplicado de la Conducta (ABA)', size: 22, font: 'Calibri', color: '5A7FA8' }),
      ]
    }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: ' ' })] })
  );

  // ─── TABLA IDENTIFICACIÓN ─────────────────────────────────────────────────
  const tipoSesionValor = d.tipo_sesion || 'Individual';
  const duracionValor = d.duracion_minutos ? `${d.duracion_minutos} minutos` : (d.duracion || 'No especificada');
  const fechaValor = d.fecha_sesion || today;
  const objetivoValor = d.objetivo_principal || d.objetivo || 'Ver análisis clínico';

  const idRows: any[] = [
    new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: '1B5EA1' }, width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'PACIENTE', size: 19, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
      new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: childName, size: 21, bold: true, font: 'Calibri', color: '1B5EA1' })] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: 'D6E8F7' }, children: [new Paragraph({ children: [new TextRun({ text: 'Fecha de Sesión', size: 19, bold: true, color: '1B5EA1', font: 'Calibri' })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fechaValor, size: 20, font: 'Calibri' })] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: 'EBF3FB' }, children: [new Paragraph({ children: [new TextRun({ text: 'Tipo de Sesión', size: 19, bold: true, color: '1B5EA1', font: 'Calibri' })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tipoSesionValor, size: 20, font: 'Calibri' })] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: 'D6E8F7' }, children: [new Paragraph({ children: [new TextRun({ text: 'Duración', size: 19, bold: true, color: '1B5EA1', font: 'Calibri' })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: duracionValor, size: 20, font: 'Calibri' })] })] }),
    ]}),
    new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: 'EBF3FB' }, children: [new Paragraph({ children: [new TextRun({ text: 'Objetivo de Sesión', size: 19, bold: true, color: '1B5EA1', font: 'Calibri' })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: objetivoValor, size: 20, font: 'Calibri' })] })] }),
    ]}),
  ];

  if (d.efectividad_sesion) {
    const efectividadLabels = ['Muy baja', 'Baja', 'Moderada', 'Alta', 'Muy alta'];
    const efLabel = efectividadLabels[Number(d.efectividad_sesion) - 1] || String(d.efectividad_sesion);
    idRows.push(new TableRow({ children: [
      new TableCell({ shading: { type: ShadingType.SOLID, color: 'D6E8F7' }, children: [new Paragraph({ children: [new TextRun({ text: 'Efectividad Global', size: 19, bold: true, color: '1B5EA1', font: 'Calibri' })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.efectividad_sesion}/5 — ${efLabel}`, size: 20, bold: true, font: 'Calibri', color: Number(d.efectividad_sesion) >= 4 ? '27AE60' : Number(d.efectividad_sesion) >= 3 ? 'E67E22' : 'E74C3C' })] })] }),
    ]}));
  }

  elements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: idRows }));
  elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));

  // ─── PERFIL DE MÉTRICAS DE DESEMPEÑO ─────────────────────────────────────
  const tieneMetricas = d.nivel_atencion || d.respuesta_instrucciones || d.iniciativa_comunicativa || d.tolerancia_frustracion || d.interaccion_social;
  if (tieneMetricas) {
    elements.push(separator(), sectionHead('Perfil de Desempeño en Sesión'));

    const metricasLabels: Record<string, { label: string; max: number; labels: string[] }> = {
      nivel_atencion: { label: 'Atención Sostenida', max: 5, labels: ['Muy disperso', 'Disperso', 'Moderado', 'Bueno', 'Excelente'] },
      respuesta_instrucciones: { label: 'Respuesta a Instrucciones', max: 5, labels: ['Nula', 'Mínima', 'Parcial', 'Buena', 'Inmediata'] },
      iniciativa_comunicativa: { label: 'Iniciativa Comunicativa', max: 5, labels: ['Nula', 'Muy baja', 'Baja', 'Moderada', 'Alta'] },
      tolerancia_frustracion: { label: 'Tolerancia a la Frustración', max: 5, labels: ['Muy baja', 'Baja', 'Moderada', 'Buena', 'Excelente'] },
      interaccion_social: { label: 'Calidad de Interacción Social', max: 5, labels: ['Evitativa', 'Mínima', 'Funcional', 'Buena', 'Espontánea'] },
    };

    const metricaRows: any[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { type: ShadingType.SOLID, color: '1B5EA1' }, width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ÁREA EVALUADA', size: 19, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
          new TableCell({ shading: { type: ShadingType.SOLID, color: '1B5EA1' }, width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PUNTAJE', size: 19, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
          new TableCell({ shading: { type: ShadingType.SOLID, color: '1B5EA1' }, width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NIVEL CUALITATIVO', size: 19, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
        ]
      })
    ];

    Object.entries(metricasLabels).forEach(([key, meta], idx) => {
      const val = Number(d[key]);
      if (!val) return;
      const qualLabel = meta.labels[val - 1] || String(val);
      const pct = (val / meta.max) * 100;
      const color = pct >= 70 ? '1E8449' : pct >= 40 ? 'CA6F1E' : 'CB4335';
      const bgColor = idx % 2 === 0 ? 'EBF3FB' : 'F8FBFF';
      metricaRows.push(new TableRow({ children: [
        new TableCell({ shading: { type: ShadingType.SOLID, color: bgColor }, children: [new Paragraph({ children: [new TextRun({ text: meta.label, size: 20, font: 'Calibri', bold: true, color: '2C3E50' })] })] }),
        new TableCell({ shading: { type: ShadingType.SOLID, color: bgColor }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${val}/${meta.max}`, size: 22, bold: true, font: 'Calibri', color })] })] }),
        new TableCell({ shading: { type: ShadingType.SOLID, color: bgColor }, children: [new Paragraph({ children: [new TextRun({ text: qualLabel, size: 20, font: 'Calibri', color, bold: true })] })] }),
      ]}));
    });

    if (metricaRows.length > 1) {
      elements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: metricaRows }));
      elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
    }
  }

  // ─── REGISTRO ABC ─────────────────────────────────────────────────────────
  if (d.antecedente || d.conducta || d.consecuencia || d.funcion_estimada) {
    elements.push(separator(), sectionHead('Registro de Análisis Conductual (A–B–C)'));

    const abcRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { type: ShadingType.SOLID, color: '154580' }, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'A — ANTECEDENTE', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
          new TableCell({ shading: { type: ShadingType.SOLID, color: '1B5EA1' }, width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'B — CONDUCTA', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
          new TableCell({ shading: { type: ShadingType.SOLID, color: '154580' }, width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'C — CONSECUENCIA', size: 20, bold: true, color: 'FFFFFF', font: 'Calibri' })] })] }),
        ]
      }),
      new TableRow({ children: [
        new TableCell({ shading: { type: ShadingType.SOLID, color: 'EBF3FB' }, children: [new Paragraph({ spacing: { after: 120, before: 120 }, children: [new TextRun({ text: d.antecedente || 'No especificado', size: 20, font: 'Calibri', color: '2C2C2C' })] })] }),
        new TableCell({ children: [new Paragraph({ spacing: { after: 120, before: 120 }, children: [new TextRun({ text: d.conducta || '—', size: 20, font: 'Calibri', bold: true, color: '2C2C2C' })] })] }),
        new TableCell({ shading: { type: ShadingType.SOLID, color: 'EBF3FB' }, children: [new Paragraph({ spacing: { after: 120, before: 120 }, children: [new TextRun({ text: d.consecuencia || 'No especificada', size: 20, font: 'Calibri', color: '2C2C2C' })] })] }),
      ]}),
    ];
    elements.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: abcRows }));

    if (d.funcion_estimada) {
      elements.push(new Paragraph({ spacing: { before: 160, after: 120 }, children: [
        new TextRun({ text: 'Función Conductual Estimada: ', bold: true, size: 21, font: 'Calibri', color: '1B5EA1' }),
        new TextRun({ text: d.funcion_estimada, size: 21, font: 'Calibri', color: '333333' }),
      ]}));
    }
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── HABILIDADES TRABAJADAS ───────────────────────────────────────────────
  const tieneHabilidades = d.habilidades_objetivo || d.nivel_logro_objetivos || d.ayudas_utilizadas;
  if (tieneHabilidades) {
    elements.push(separator(), sectionHead('Habilidades Trabajadas y Nivel de Adquisición'));

    if (d.habilidades_objetivo) {
      elements.push(subHead('Habilidades Específicas Trabajadas'));
      const habilidades = Array.isArray(d.habilidades_objetivo) ? d.habilidades_objetivo : [String(d.habilidades_objetivo)];
      habilidades.forEach((h: string) => elements.push(bulletItem(h, '1B5EA1')));
    }

    if (d.nivel_logro_objetivos) {
      const logro = String(d.nivel_logro_objetivos);
      const logroColor = logro.includes('76-100') || logro.includes('Completamente') ? '1E8449' :
                         logro.includes('51-75') || logro.includes('Mayormente') ? '1A8A1A' :
                         logro.includes('26-50') || logro.includes('Parcialmente') ? 'CA6F1E' : 'CB4335';
      elements.push(new Paragraph({ spacing: { before: 160, after: 140 }, children: [
        new TextRun({ text: 'Nivel de Logro de Objetivos: ', bold: true, size: 22, font: 'Calibri', color: '2C3E50' }),
        new TextRun({ text: logro, size: 22, bold: true, font: 'Calibri', color: logroColor }),
      ]}));
    }

    elements.push(...fieldRow('Nivel de Ayudas Proporcionadas', d.ayudas_utilizadas));
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── TÉCNICAS E INTERVENCIONES ────────────────────────────────────────────
  const tieneTecnicas = d.tecnicas_aplicadas || d.reforzadores_efectivos || d.conductas_desafiantes || d.estrategias_manejo;
  if (tieneTecnicas) {
    elements.push(separator(), sectionHead('Intervenciones y Estrategias ABA Aplicadas'));

    if (d.tecnicas_aplicadas) {
      elements.push(subHead('Técnicas ABA Utilizadas'));
      const tecnicas = Array.isArray(d.tecnicas_aplicadas) ? d.tecnicas_aplicadas : [String(d.tecnicas_aplicadas)];
      tecnicas.forEach((t: string) => elements.push(bulletItem(t, '154580')));
    }

    elements.push(...fieldRow('Reforzadores Más Efectivos', d.reforzadores_efectivos));

    if (d.conductas_desafiantes) {
      elements.push(subHead('Conductas Desafiantes Presentadas'));
      elements.push(new Paragraph({
        spacing: { after: 160 },
        shading: { type: ShadingType.SOLID, color: 'FEF5E7' },
        border: { left: { color: 'E67E22', space: 8, value: BorderStyle.SINGLE, size: 20 } },
        indent: { left: 260 },
        children: [new TextRun({ text: d.conductas_desafiantes, size: 21, font: 'Calibri', color: '7D3C00' })]
      }));
      elements.push(...fieldRow('Estrategias de Manejo Aplicadas', d.estrategias_manejo));
    }
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── PROGRESO Y EVOLUCIÓN ─────────────────────────────────────────────────
  const tieneProgreso = d.avances_observados || d.areas_dificultad || d.patron_aprendizaje;
  if (tieneProgreso) {
    elements.push(separator(), sectionHead('Progreso Terapéutico y Evolución'));
    elements.push(...fieldRow('Avances Observados en Sesión', d.avances_observados));
    elements.push(...fieldRow('Áreas de Dificultad Persistente', d.areas_dificultad));
    elements.push(...fieldRow('Patrón de Aprendizaje Observado', d.patron_aprendizaje));
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── OBSERVACIONES CLÍNICAS PARA EL EQUIPO ───────────────────────────────
  const tieneObs = d.observaciones_tecnicas || d.alertas_clinicas || d.recomendaciones_equipo || d.coordinacion_familia;
  if (tieneObs) {
    elements.push(separator(), sectionHead('Observaciones Clínicas para el Equipo', '8B0000'));

    elements.push(...fieldRow('Notas Técnicas para el Equipo', d.observaciones_tecnicas));

    if (d.alertas_clinicas) {
      elements.push(subHead('Alertas Clínicas / Banderas Rojas'));
      elements.push(new Paragraph({
        spacing: { after: 160 },
        shading: { type: ShadingType.SOLID, color: 'FDEDEC' },
        border: { left: { color: 'CB4335', space: 8, value: BorderStyle.SINGLE, size: 20 } },
        indent: { left: 260 },
        children: [new TextRun({ text: d.alertas_clinicas, size: 21, font: 'Calibri', color: '922B21', bold: true })]
      }));
    }

    elements.push(...fieldRow('Recomendaciones para el Equipo', d.recomendaciones_equipo));

    if (d.coordinacion_familia) {
      const coordColor = d.coordinacion_familia === 'Urgente' ? 'CB4335' : d.coordinacion_familia === 'Necesaria' ? 'CA6F1E' : '2E75B5';
      elements.push(new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: 'Coordinación con Familia Requerida: ', bold: true, size: 21, font: 'Calibri', color: '2C3E50' }),
        new TextRun({ text: d.coordinacion_familia, size: 21, bold: true, font: 'Calibri', color: coordColor }),
      ]}));
    }
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── PLAN DE INTERVENCIÓN PRÓXIMA SESIÓN ──────────────────────────────────
  if (d.ajustes_proxima_sesion || d.necesidades_materiales) {
    elements.push(separator(), sectionHead('Plan de Intervención — Próxima Sesión'));
    elements.push(...fieldRow('Ajustes Planificados para Próxima Sesión', d.ajustes_proxima_sesion));
    elements.push(...fieldRow('Materiales y Recursos Necesarios', d.necesidades_materiales));
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── TAREA TERAPÉUTICA PARA EL HOGAR ─────────────────────────────────────
  const tieneTarea = d.actividad_casa || d.instrucciones_padres || d.objetivo_tarea;
  if (tieneTarea) {
    elements.push(separator(), sectionHead('Tarea Terapéutica para el Hogar'));

    if (d.objetivo_tarea) {
      elements.push(new Paragraph({ spacing: { after: 140 }, children: [
        new TextRun({ text: 'Objetivo de la Actividad: ', bold: true, size: 21, font: 'Calibri', color: '1B5EA1' }),
        new TextRun({ text: d.objetivo_tarea, size: 21, font: 'Calibri', color: '333333' }),
      ]}));
    }
    elements.push(...fieldRow('Actividad Propuesta', d.actividad_casa));
    elements.push(...fieldRow('Instrucciones Específicas para Padres/Cuidadores', d.instrucciones_padres));
    elements.push(new Paragraph({ children: [new TextRun({ text: ' ' })] }));
  }

  // ─── COMUNICACIÓN FAMILIAR ────────────────────────────────────────────────
  const tieneComFamiliar = d.mensaje_padres || d.destacar_positivo || d.proximos_pasos;
  if (tieneComFamiliar) {
    elements.push(separator(), sectionHead('Comunicación con la Familia'));

    if (d.destacar_positivo) {
      elements.push(subHead('Logros para Comunicar a los Padres'));
      const logros = typeof d.destacar_positivo === 'string' ? d.destacar_positivo.split('\n').filter((l: string) => l.trim()) : [String(d.destacar_positivo)];
      logros.forEach((l: string) => elements.push(bulletItem(l.replace(/^[-•*]\s*/, ''), '1E8449')));
    }

    if (d.proximos_pasos) {
      elements.push(subHead('Próximos Pasos (para compartir con la familia)'));
      elements.push(bodyPara(d.proximos_pasos));
    }

    if (d.mensaje_padres) {
      elements.push(
        subHead('Mensaje para la Familia'),
        new Paragraph({
          spacing: { after: 180, before: 80, line: 300 },
          shading: { type: ShadingType.SOLID, color: 'EAF6FF' },
          border: {
            top: { color: '1B5EA1', space: 4, value: BorderStyle.SINGLE, size: 6 },
            bottom: { color: '1B5EA1', space: 4, value: BorderStyle.SINGLE, size: 6 },
            left: { color: '1B5EA1', space: 10, value: BorderStyle.SINGLE, size: 24 },
            right: { color: '1B5EA1', space: 4, value: BorderStyle.SINGLE, size: 6 },
          },
          indent: { left: 300, right: 300 },
          children: [new TextRun({ text: d.mensaje_padres, size: 22, italics: true, font: 'Calibri', color: '1B3A5C' })]
        })
      );
    }
  }

  // ─── ANÁLISIS CLÍNICO PROFESIONAL (IA) ───────────────────────────────────
  if (aiAnalysis) {
    elements.push(new Paragraph({ children: [new PageBreak()] }));
    elements.push(sectionHead('Análisis Clínico Profesional — Síntesis IA'));
    elements.push(new Paragraph({
      spacing: { after: 160 },
      shading: { type: ShadingType.SOLID, color: 'F0F4F8' },
      border: { left: { color: '2E75B5', space: 8, value: BorderStyle.SINGLE, size: 8 } },
      indent: { left: 200 },
      children: [new TextRun({ text: 'El siguiente análisis fue generado con asistencia de inteligencia artificial a partir de los datos de la sesión. Debe ser revisado y validado por el profesional tratante.', size: 19, italics: true, font: 'Calibri', color: '5A7FA8' })]
    }));

    const lines = aiAnalysis.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('## ')) {
        elements.push(subHead(trimmed.replace(/^##\s*/, '')));
      } else if (trimmed.startsWith('# ')) {
        elements.push(sectionHead(trimmed.replace(/^#\s*/, '')));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        elements.push(bulletItem(trimmed.replace(/^[-•*]\s*/, '')));
      } else if (trimmed.match(/^\d+\.\s/)) {
        elements.push(bulletItem(trimmed.replace(/^\d+\.\s*/, ''), '1F4D78'));
      } else if (trimmed.match(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{4,}:?$/) && trimmed.length < 70) {
        elements.push(subHead(trimmed.replace(/:$/, '')));
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        elements.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: trimmed.replace(/\*\*/g, ''), size: 22, bold: true, font: 'Calibri', color: '1B5EA1' })] }));
      } else {
        elements.push(new Paragraph({ spacing: { after: 160, line: 300 }, children: [new TextRun({ text: trimmed, size: 22, font: 'Calibri', color: '2C2C2C' })] }));
      }
    }
  }

  // ─── FIRMA Y PIE DE PÁGINA ────────────────────────────────────────────────
  elements.push(
    separator(),
    new Paragraph({ spacing: { before: 800, after: 60 }, children: [new TextRun({ text: ' ' })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { color: '595959', space: 1, value: BorderStyle.SINGLE, size: 10 }, bottom: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 }, left: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 }, right: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 } },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'Firma del Terapeuta ABA', size: 20, font: 'Calibri', bold: true, color: '595959' })] }),
            new Paragraph({ children: [new TextRun({ text: 'Jugando Aprendo — Centro de Desarrollo Infantil', size: 18, font: 'Calibri', italics: true, color: '737373' })] }),
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: { top: { color: 'FFFFFF', space: 0, value: BorderStyle.NONE, size: 0 }, bottom: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 }, left: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 }, right: { value: BorderStyle.NONE, size: 0, color: 'FFFFFF', space: 0 } },
          children: [
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Fecha de emisión: ${today}`, size: 18, font: 'Calibri', color: '737373' })] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [
              new TextRun({ text: 'Generado con asistencia de IA · ', size: 17, italics: true, color: '999999', font: 'Calibri' }),
              new TextRun({ text: 'Jugando Aprendo', size: 17, bold: true, color: '2E75B5', font: 'Calibri' }),
            ]}),
          ]
        }),
      ]})]
    })
  );

  return elements;
}

function createEntornoHogarReport(data: any, childName: string, aiAnalysis?: string | null): any[] {
  const d = data?.responses || data;
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
    
    elements.push(new Paragraph({ children: [new PageBreak()] }));
  }
  
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Información de la Visita")]
    })
  );

  const items = [
    { label: "Fecha de visita", value: d.fecha_visita },
    { label: "Duración", value: d.duracion_visita },
    { label: "Personas presentes", value: d.personas_presentes },
    { label: "Tipo de vivienda", value: d.tipo_vivienda },
    { label: "Espacio de juego", value: d.espacio_juego },
    { label: "Comportamiento observado", value: d.comportamiento_observado || d.datos?.comportamiento_observado },
    { label: "Barreras identificadas", value: d.barreras_identificadas || d.datos?.barreras_identificadas },
    { label: "Impresión general", value: d.impresion_general },
    { label: "Actividades sugeridas", value: d.actividades_casa || d.actividades_sugeridas },
    { label: "Mensaje para los padres", value: d.mensaje_padres_entorno },
    { label: "Recomendaciones espacio", value: d.recomendaciones_espacio },
    { label: "Recomendaciones rutinas", value: d.recomendaciones_rutinas },
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
    children: [new TextRun({ text: ' ' })]
  });

  const sectionHead = (text: string, _emoji?: string) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    shading: { type: ShadingType.SOLID, color: 'EBF3FB' },
    children: [new TextRun({ text: text, size: 28, bold: true, color: '2E75B5', font: 'Calibri' })]
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
    const entries = Object.entries(responses).filter(([k, v]) => {
      // Skip internal/system fields and empty values
      if (['responses', 'ai_analysis'].includes(k)) return false;
      return v !== null && v !== undefined && v !== '';
    });
    if (entries.length > 0) {
      const tableRows = entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        let displayValue: string;
        if (Array.isArray(value)) {
          displayValue = (value as any[]).map((v: any) => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value).slice(0, 500); // prevent runaway JSON
        } else {
          displayValue = String(value);
        }
        // Truncate very long values to prevent docx issues
        displayValue = displayValue.slice(0, 1000);
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
        new Paragraph({ children: [new TextRun({ text: ' ' })] })
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
