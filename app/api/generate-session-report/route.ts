import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// No necesitamos Supabase aquí porque los datos vienen del formulario que llenas en el momento
export async function POST(req: Request) {
  try {
    const { antecedente, conducta, consecuencia } = await req.json();

    // 1. VALIDACIÓN DE API KEY (Igual que en tu chat del padre)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Error de servidor: Falta la variable GEMINI_API_KEY." }, { status: 500 });
    }

    // 2. CONTEXTO PARA LA IA (Adaptado para generar el reporte técnico)
    // NOTA: He quitado símbolos raros para evitar el error de sintaxis que tuviste antes.
    const context = `
      ACTÚA COMO: Supervisor Clínico experto en ABA (Análisis Conductual Aplicado).
      TAREA: Analizar esta contingencia conductual (ABC) y generar reporte técnico.
      
      DATOS DE LA SESIÓN:
      - Antecedente: ${antecedente}
      - Conducta: ${conducta}
      - Consecuencia: ${consecuencia}

      INSTRUCCIONES OBLIGATORIAS:
      1. Responde ÚNICAMENTE con un objeto JSON válido.
      2. NO uses bloques de código markdown (no pongas tres comillas invertidas).
      3. NO incluyas texto introductorio, solo las llaves del JSON.

      ESTRUCTURA EXACTA DEL JSON A DEVOLVER:
      {
        "mensaje_padres": "Redacta un mensaje para WhatsApp: empático, corto, positivo y profesional.",
        "observaciones_clinicas": "Descripción técnica y objetiva de la topografía de la conducta.",
        "analisis_abc": "Hipótesis de la función de la conducta (Atención, Escape, Tangible o Sensorial).",
        "justificacion": "Breve justificación técnica de la intervención sugerida.",
        "mentoring_interno": "Consejo breve para el terapeuta junior sobre cómo manejar esto mejor.",
        "actividad_realizada": "Nombre técnico de la actividad (ej: Entrenamiento de Comunicación Funcional).",
        "red_flags": "Indica si hay riesgos de autolesión o agresividad. Si no, pon 'Ninguna'.",
        "barreras": "Barreras del aprendizaje detectadas (ej: Control instruccional bajo).",
        "tarea_hogar": "Una tarea muy simple para que los padres practiquen en casa."
      }
    `;

    // 3. INVOCAR A GEMINI 2.0 FLASH (Versión estable)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(context);
    const response = await result.response;
    let text = response.text();

    // 4. LIMPIEZA DE SEGURIDAD (CRUCIAL PARA EL ADMIN)
    // A veces la IA, aunque le digas que no, pone comillas ```json. Esto lo limpia.
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Buscamos solo el objeto JSON { ... }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    // 5. DEVOLVER EL JSON
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Error Gemini Admin:", error);
    return NextResponse.json({ error: "Hubo un error procesando el reporte." }, { status: 500 });
  }
}