import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// ============================================================================
// INTERFACES (Tipado fuerte para seguridad)
// ============================================================================
interface HomeEnvironmentRequest {
  comportamiento_observado: string;
  barreras_identificadas: string;
  facilitadores: string;
  rutina_diaria: string;
  interaccion_padres: string;
}

interface AnalysisResponse {
  impresion_general: string;
  mensaje_padres_entorno: string;
  recomendaciones_espacio: string;
  recomendaciones_rutinas: string;
  actividades_sugeridas: string;
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    // 1. Configuración y Validación de API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ CRÍTICO: Falta GEMINI_API_KEY en variables de entorno");
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta (Falta API Key)' },
        { status: 500 }
      );
    }

    // 2. Parseo y Validación del Body
    const body: HomeEnvironmentRequest = await request.json();
    const {
      comportamiento_observado,
      barreras_identificadas,
      facilitadores,
      rutina_diaria,
      interaccion_padres
    } = body;

    // Validación mínima: necesitamos algo de input para trabajar
    if ((!comportamiento_observado || comportamiento_observado.length < 5) && 
        (!barreras_identificadas || barreras_identificadas.length < 5)) {
      return NextResponse.json(
        { error: 'Se requiere información detallada sobre comportamiento o barreras para realizar el análisis.' },
        { status: 400 }
      );
    }

    // 3. Construcción del Prompt (Ingeniería de Prompt Detallada - MANTENIDO COMPLETO)
    const prompt = `
      ACTÚA COMO: Terapeuta Senior especializado en Análisis Conductual Aplicado (ABA) y Desarrollo Infantil.
      TAREA: Evaluar el entorno del hogar de un niño en terapia y generar un reporte de intervención.

      --- INFORMACIÓN RECOPILADA (Visita Domiciliaria) ---
      
      [1] Comportamiento en casa:
      ${comportamiento_observado || 'No se registraron observaciones específicas.'}

      [2] Barreras (Físicas/Sensoriales):
      ${barreras_identificadas || 'No se identificaron barreras evidentes.'}

      [3] Facilitadores/Fortalezas:
      ${facilitadores || 'No se registraron facilitadores.'}

      [4] Rutina Actual:
      ${rutina_diaria || 'No se detalló la rutina.'}

      [5] Dinámica Familiar (Interacción):
      ${interaccion_padres || 'No se observó la interacción.'}

      --- INSTRUCCIONES DE GENERACIÓN ---
      
      Genera un análisis clínico estructurado en formato JSON con los siguientes campos:

      1. "impresion_general": (2-3 párrafos)
          Resumen clínico profesional. Evalúa cómo el entorno físico y la dinámica familiar están impactando (positiva o negativamente) el desarrollo del niño. Identifica patrones clave.

      2. "mensaje_padres_entorno": (1 párrafo)
          Redacta un mensaje directo para enviar por WhatsApp a la familia.
          TONO: Cálido, empático, motivador pero profesional.
          CONTENIDO: Agradece la visita, destaca UNA fortaleza observada y menciona suavemente que trabajarán juntos en mejoras.

      3. "recomendaciones_espacio": (Lista o Texto estructurado)
          Provee 4 a 5 cambios físicos concretos y económicos para el hogar.
          Ejemplo: "Reducir estímulos visuales en la zona de tareas", "Crear una caja de calma".

      4. "recomendaciones_rutinas": (Lista o Texto estructurado)
          Sugiere 4 a 5 ajustes a los horarios o hábitos diarios para mejorar la regulación del niño y la predictibilidad.

      5. "actividades_sugeridas": (Lista o Texto estructurado)
          Describe 3 a 5 actividades breves que los padres pueden realizar en la rutina diaria para reforzar objetivos terapéuticos.

      --- FORMATO DE RESPUESTA OBLIGATORIO ---
      Responde ÚNICAMENTE con un objeto JSON válido. No uses Markdown, ni bloques de código.
      {
        "impresion_general": "...",
        "mensaje_padres_entorno": "...",
        "recomendaciones_espacio": "...",
        "recomendaciones_rutinas": "...",
        "actividades_sugeridas": "..."
      }
    `;

    // 4. Inicialización de Gemini (Sintaxis corregida para @google/genai)
    const ai = new GoogleGenAI({ apiKey });

    // 5. Ejecución del Modelo
    // Usamos el parámetro 'config' para definir el tipo de respuesta y la temperatura
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json", // Fuerza respuesta JSON
        temperature: 0.7, // Creatividad controlada para el tono empático
      },
    });

    // 6. Procesamiento y Limpieza de Respuesta
    // En la nueva librería, response.text es una propiedad directa (string | null)
    const responseText = response.text || "{}"; 
    let analysisData: AnalysisResponse;

    try {
      // Intentamos parsear directo
      analysisData = JSON.parse(responseText);
    } catch (parseError) {
      console.warn("⚠️ Advertencia: JSON malformado, intentando limpieza manual...", parseError);
      
      // Limpieza de respaldo (Fallback) por si el modo JSON falla o incluye Markdown
      let cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Búsqueda del primer { y último } para asegurar validez
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        analysisData = JSON.parse(cleaned);
      } else {
         throw new Error("No se pudo extraer un JSON válido de la respuesta de la IA.");
      }
    }

    // 7. Validación de Estructura de Salida
    // Aseguramos que los campos críticos existan antes de responder al frontend
    if (!analysisData.impresion_general || !analysisData.mensaje_padres_entorno) {
      throw new Error("La IA generó una respuesta incompleta o con estructura incorrecta.");
    }

    // 8. Retorno Exitoso
    return NextResponse.json({
      impresion_general: analysisData.impresion_general,
      mensaje_padres_entorno: analysisData.mensaje_padres_entorno,
      recomendaciones_espacio: analysisData.recomendaciones_espacio,
      recomendaciones_rutinas: analysisData.recomendaciones_rutinas,
      actividades_sugeridas: analysisData.actividades_sugeridas
    });

  } catch (error: any) {
    console.error('❌ Error en generate-home-environment-report:', error);
    
    // Manejo diferenciado de errores
    if (error.message?.includes('429') || error.message?.includes('Quota')) {
        return NextResponse.json({ error: 'El servicio de IA está saturado. Intente en unos minutos.' }, { status: 429 });
    }
    
    return NextResponse.json(
      { error: 'Error interno procesando el análisis del hogar.', details: error.message },
      { status: 500 }
    );
  }
}