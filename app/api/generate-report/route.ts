// ==============================================================================
// API: GENERACIÓN DE REPORTES PROFESIONALES EN WORD (.DOCX)
// Ruta: /app/api/generate-report/route.ts
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
        PageBreak, LevelFormat } = require('docx');

// ==============================================================================
// INTERFACES
// ==============================================================================
interface ReportRequest {
  reportType: 'aba' | 'anamnesis' | 'entorno_hogar' | 'brief2' | 'ados2' | 'vineland3' | 'wiscv' | 'basc3';
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
  evaluationId: string;
}

// ✅ CORRECCIÓN: Interfaz explícita para la configuración de cada reporte.
// El campo `subtitle` es opcional (subtitle?: string), lo que permite que
// configs como `aba` y `anamnesis` no lo tengan sin errores de TypeScript.
interface SectionConfig {
  key: string;
  title: string;
  type: string;
}

interface ReportConfig {
  title: string;
  subtitle?: string; // ← Opcional para evitar el error "Property 'subtitle' does not exist"
  sections: SectionConfig[];
}

// ==============================================================================
// CONFIGURACIONES DE REPORTES
// ✅ CORRECCIÓN: Tipado explícito como Record<string, ReportConfig>
// ==============================================================================
const REPORT_CONFIGS: Record<string, ReportConfig> = {
  aba: {
    title: 'Reporte de Sesión ABA',
    // Sin subtitle — válido gracias a subtitle?: string
    sections: [
      { key: 'informacion_sesion', title: 'Información de la Sesión', type: 'info' },
      { key: 'analisis_abc', title: 'Análisis Conductual (ABC)', type: 'abc' },
      { key: 'metricas', title: 'Métricas de Desempeño', type: 'metrics' },
      { key: 'habilidades', title: 'Habilidades Trabajadas', type: 'list' },
      { key: 'mensaje_padres', title: 'Comunicación con la Familia', type: 'text' },
      { key: 'planificacion', title: 'Planificación y Seguimiento', type: 'text' }
    ]
  },
  brief2: {
    title: 'Reporte de Evaluación BRIEF-2',
    subtitle: 'Evaluación Conductual de la Función Ejecutiva',
    sections: [
      { key: 'informacion', title: 'Información de la Evaluación', type: 'info' },
      { key: 'resultados', title: 'Resultados Cuantitativos', type: 'table' },
      { key: 'analisis_ia', title: 'Análisis Clínico', type: 'text' },
      { key: 'recomendaciones_ia', title: 'Recomendaciones Terapéuticas', type: 'list' },
      { key: 'informe_padres', title: 'Informe para la Familia', type: 'text' }
    ]
  },
  ados2: {
    title: 'Reporte de Evaluación ADOS-2',
    subtitle: 'Escala de Observación para el Diagnóstico del Autismo',
    sections: [
      { key: 'informacion', title: 'Datos del Paciente', type: 'info' },
      { key: 'puntuaciones', title: 'Perfil de Puntuaciones', type: 'table' },
      { key: 'analisis_diagnostico_ia', title: 'Análisis Diagnóstico', type: 'text' },
      { key: 'recomendaciones_intervencion', title: 'Recomendaciones de Intervención', type: 'list' },
      { key: 'informe_familia_ados', title: 'Informe para la Familia', type: 'text' }
    ]
  },
  vineland3: {
    title: 'Reporte de Evaluación Vineland-3',
    subtitle: 'Escala de Comportamiento Adaptativo',
    sections: [
      { key: 'informacion', title: 'Información General', type: 'info' },
      { key: 'dominios', title: 'Puntuaciones por Dominio', type: 'table' },
      { key: 'analisis_vineland_ia', title: 'Análisis Integral', type: 'text' },
      { key: 'areas_fortaleza', title: 'Áreas de Fortaleza', type: 'list' },
      { key: 'areas_prioridad', title: 'Áreas Prioritarias', type: 'list' },
      { key: 'informe_padres_vineland', title: 'Informe para Padres', type: 'text' }
    ]
  },
  wiscv: {
    title: 'Reporte de Evaluación WISC-V',
    subtitle: 'Escala de Inteligencia de Wechsler para Niños',
    sections: [
      { key: 'informacion', title: 'Datos de la Evaluación', type: 'info' },
      { key: 'indices', title: 'Perfil de Índices Cognitivos', type: 'table' },
      { key: 'perfil_cognitivo_ia', title: 'Análisis del Perfil Cognitivo', type: 'text' },
      { key: 'fortalezas_debilidades', title: 'Fortalezas y Debilidades', type: 'text' },
      { key: 'implicaciones_educativas', title: 'Implicaciones Educativas', type: 'list' },
      { key: 'informe_padres_wisc', title: 'Informe para Padres', type: 'text' }
    ]
  },
  basc3: {
    title: 'Reporte de Evaluación BASC-3',
    subtitle: 'Sistema de Evaluación de la Conducta de Niños y Adolescentes',
    sections: [
      { key: 'informacion', title: 'Información General', type: 'info' },
      { key: 'dimensiones', title: 'Dimensiones Clínicas y Adaptativas', type: 'table' },
      { key: 'analisis_basc_ia', title: 'Análisis Conductual', type: 'text' },
      { key: 'areas_preocupacion', title: 'Áreas de Preocupación', type: 'list' },
      { key: 'fortalezas_conductuales', title: 'Fortalezas Conductuales', type: 'list' },
      { key: 'plan_intervencion_conductual', title: 'Plan de Intervención', type: 'text' }
    ]
  },
  entorno_hogar: {
    title: 'Reporte de Evaluación del Entorno del Hogar',
    subtitle: 'Visita Domiciliaria y Análisis del Contexto Familiar',
    sections: [
      { key: 'informacion_visita', title: 'Información de la Visita', type: 'info' },
      { key: 'estructura_hogar', title: 'Estructura y Condiciones del Hogar', type: 'text' },
      { key: 'dinamica_familiar', title: 'Dinámica Familiar', type: 'text' },
      { key: 'impresion_general', title: 'Impresión General del Entorno', type: 'text' },
      { key: 'recomendaciones_espacio', title: 'Recomendaciones sobre el Espacio', type: 'list' },
      { key: 'recomendaciones_rutinas', title: 'Ajustes en Rutinas', type: 'list' },
      { key: 'actividades_sugeridas', title: 'Actividades Terapéuticas para Casa', type: 'list' }
    ]
  },
  anamnesis: {
    title: 'Historia Clínica (Anamnesis)',
    subtitle: 'Evaluación Integral del Desarrollo',
    sections: [
      { key: 'filiacion', title: 'Datos de Filiación', type: 'info' },
      { key: 'motivo_consulta', title: 'Motivo de Consulta', type: 'text' },
      { key: 'historia_prenatal', title: 'Historia Prenatal y Parto', type: 'text' },
      { key: 'desarrollo_psicomotor', title: 'Desarrollo Psicomotor', type: 'text' },
      { key: 'desarrollo_lenguaje', title: 'Desarrollo del Lenguaje', type: 'text' },
      { key: 'area_emocional', title: 'Área Emocional y Social', type: 'text' },
      { key: 'observaciones_terapeuta', title: 'Observaciones del Terapeuta', type: 'text' }
    ]
  }
};

// ==============================================================================
// HANDLER PRINCIPAL
// ==============================================================================
export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const { reportType, childName, childAge, evaluatorName, reportData, evaluationId } = body;

    // Validaciones
    if (!reportType || !childName || !reportData) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (reportType, childName, reportData)' },
        { status: 400 }
      );
    }

    // Generar el documento Word
    const docBuffer = await generateWordDocument({
      reportType,
      childName,
      childAge,
      evaluatorName,
      reportData
    });

    // Convertir a Base64 para almacenar en Supabase
    const base64Doc = docBuffer.toString('base64');

    // Retornar el documento
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
// FUNCIÓN PARA GENERAR EL DOCUMENTO WORD
// ==============================================================================
async function generateWordDocument(params: {
  reportType: string;
  childName: string;
  childAge?: number;
  evaluatorName?: string;
  reportData: any;
}) {
  const { reportType, childName, childAge, evaluatorName, reportData } = params;

  // ✅ CORRECCIÓN: config es ahora de tipo ReportConfig, por lo que
  // config.subtitle es string | undefined y no genera error de TypeScript.
  const config: ReportConfig | undefined = REPORT_CONFIGS[reportType];

  if (!config) {
    throw new Error(`Tipo de reporte no soportado: ${reportType}`);
  }

  // Crear documento con estilos profesionales
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24 } // 12pt
        }
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "1F4E78" },
          paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
          paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 }
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "3D85C6" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } }
              }
            }
          ]
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: 12240,  // US Letter
            height: 15840
          },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        // PORTADA
        // ✅ CORRECCIÓN: config.subtitle es string | undefined — totalmente válido
        ...createCoverPage(config.title, config.subtitle, childName, childAge),

        new Paragraph({ children: [new PageBreak()] }),

        // CONTENIDO
        ...createReportContent(config, reportData, childName, evaluatorName)
      ]
    }]
  });

  // Generar el archivo
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// ==============================================================================
// CREAR PORTADA
// ==============================================================================
function createCoverPage(
  title: string,
  subtitle: string | undefined, // ✅ Tipado explícito para evitar ambigüedad
  childName: string,
  childAge?: number
) {
  const elements: any[] = [];

  // Espacios iniciales
  elements.push(
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" })
  );

  // Título principal
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 40,
          color: "1F4E78"
        })
      ]
    })
  );

  // Subtítulo — solo se renderiza si existe
  if (subtitle) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [
          new TextRun({
            text: subtitle,
            size: 28,
            color: "595959"
          })
        ]
      })
    );
  }

  // Línea divisoria
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      border: {
        bottom: {
          color: "1F4E78",
          space: 1,
          value: BorderStyle.SINGLE,
          size: 6
        }
      },
      children: [new TextRun({ text: "" })]
    })
  );

  // Información del paciente
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 120 },
      children: [
        new TextRun({
          text: "PACIENTE",
          bold: true,
          size: 24,
          color: "404040"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: childName,
          size: 28,
          bold: true
        })
      ]
    })
  );

  if (childAge) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: `Edad: ${childAge} años`,
            size: 24,
            color: "595959"
          })
        ]
      })
    );
  }

  // Fecha
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      children: [
        new TextRun({
          text: `Fecha: ${new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`,
          size: 22,
          color: "737373"
        })
      ]
    })
  );

  return elements;
}

// ==============================================================================
// CREAR CONTENIDO DEL REPORTE
// ==============================================================================
function createReportContent(
  config: ReportConfig,
  reportData: any,
  childName: string,
  evaluatorName?: string
) {
  const elements: any[] = [];

  for (const section of config.sections) {
    // Título de sección
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(section.title)]
      })
    );

    // Contenido según tipo
    switch (section.type) {
      case 'info':
        elements.push(...createInfoSection(reportData, section.key));
        break;
      case 'text':
        elements.push(...createTextSection(reportData, section.key));
        break;
      case 'list':
        elements.push(...createListSection(reportData, section.key));
        break;
      case 'table':
        elements.push(...createTableSection(reportData, section.key));
        break;
      case 'abc':
        elements.push(...createABCSection(reportData));
        break;
      case 'metrics':
        elements.push(...createMetricsSection(reportData));
        break;
    }

    // Espacio entre secciones
    elements.push(new Paragraph({ text: "" }));
  }

  return elements;
}

// ==============================================================================
// FUNCIONES AUXILIARES PARA SECCIONES
// ==============================================================================

function createInfoSection(data: any, key: string) {
  const elements: any[] = [];
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: JSON.stringify(data[key] || data, null, 2), size: 22 })]
    })
  );
  return elements;
}

function createTextSection(data: any, key: string) {
  const text = data[key] || "No se proporcionó información.";
  const paragraphs = text.split('\n\n');

  return paragraphs.map((para: string) =>
    new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: para, size: 24 })]
    })
  );
}

function createListSection(data: any, key: string) {
  const text = data[key] || "";
  const items = text.split('\n').filter((item: string) => item.trim());

  return items.map((item: string) =>
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: item.replace(/^[-•]\s*/, ''), size: 24 })]
    })
  );
}

function createTableSection(data: any, key: string) {
  return [
    new Paragraph({
      children: [new TextRun({ text: "[Tabla de datos]", size: 22, italics: true })]
    })
  ];
}

function createABCSection(data: any) {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Antecedente: ", bold: true, size: 24 }),
        new TextRun({ text: data.antecedente || "N/A", size: 24 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: "Conducta: ", bold: true, size: 24 }),
        new TextRun({ text: data.conducta || "N/A", size: 24 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: "Consecuencia: ", bold: true, size: 24 }),
        new TextRun({ text: data.consecuencia || "N/A", size: 24 })
      ]
    })
  ];
}

function createMetricsSection(data: any) {
  return [
    new Paragraph({
      children: [new TextRun({ text: "[Métricas visuales]", size: 22, italics: true })]
    })
  ];
}