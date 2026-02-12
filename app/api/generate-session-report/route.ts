import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { antecedente, conducta, consecuencia } = await req.json();

    // 1. VALIDACIÓN DE API KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Error de servidor: Falta la variable GEMINI_API_KEY." }, { status: 500 });
    }

    // 2. VALIDACIÓN DE ENTRADA (Para no enviar datos vacíos a la IA)
    if (!antecedente || !conducta || !consecuencia) {
      return NextResponse.json({ error: "Faltan datos del registro ABC (Antecedente, Conducta o Consecuencia)." }, { status: 400 });
    }

    // 3. CONFIGURACIÓN DE GEMINI (1.5 Flash + Modo JSON)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Modelo estable y gratuito
        generationConfig: { 
            responseMimeType: "application/json", // ESTO ES CLAVE: Fuerza respuesta JSON limpia
            temperature: 0.4 // Temperatura baja para análisis técnico preciso
        }
    });

    // 4. CONTEXTO PARA LA IA
    const context = `
      ACTÚA COMO: Supervisor Clínico experto en ABA (Análisis Conductual Aplicado).
      TAREA: Analizar esta contingencia conductual de tres términos (ABC) y generar un reporte técnico.
      
      DATOS DE LA SESIÓN:
      - Antecedente (A): ${antecedente}
      - Conducta (B): ${conducta}
      - Consecuencia (C): ${consecuencia}

      INSTRUCCIONES:
      Genera un análisis clínico estructurado.
      
      Responde SOLAMENTE con este objeto JSON exacto:
      {
        "mensaje_padres": "Mensaje para WhatsApp: empático, corto (max 2 lineas), positivo y profesional.",
        "observaciones_clinicas": "Descripción técnica de la topografía de la conducta y la relación con el antecedente.",
        "analisis_abc": "Hipótesis de la función (Atención, Escape, Tangible o Sensorial/Autoestimulatorio).",
        "justificacion": "Breve justificación técnica del por qué de esa función.",
        "mentoring_interno": "Consejo breve (1 frase) para el terapeuta junior sobre cómo manejar esto mejor la próxima vez.",
        "actividad_realizada": "Nombre técnico sugerido para la intervención (ej: RDI, FCT, Extinción).",
        "red_flags": "Indica 'SI' o 'NO' si hay riesgo de autolesión o agresividad severa.",
        "barreras": "Barrera del aprendizaje detectada (ej: Falta de control instruccional, Rigidez).",
        "tarea_hogar": "Una tarea muy simple (1 frase) para que los padres practiquen en casa."
      }
    `;

    // 5. INVOCAR A GEMINI
    const result = await model.generateContent(context);
    
    // Al usar responseMimeType: "application/json", no necesitamos limpiar strings manualmente.
    // La respuesta ya viene lista para parsear.
    const responseData = JSON.parse(result.response.text());

    // 6. DEVOLVER EL JSON
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error Gemini Admin:", error);
    return NextResponse.json({ error: "Hubo un error procesando el reporte: " + error.message }, { status: 500 });
  }
}