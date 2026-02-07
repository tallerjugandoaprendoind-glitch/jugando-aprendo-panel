import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      comportamiento_observado,
      barreras_identificadas,
      facilitadores,
      rutina_diaria,
      interaccion_padres
    } = body;

    // Validación básica
    if (!comportamiento_observado && !barreras_identificadas) {
      return NextResponse.json(
        { error: 'Se requiere al menos información sobre comportamiento o barreras' },
        { status: 400 }
      );
    }

    // Construir prompt especializado para análisis de entorno del hogar
    const prompt = `
Eres un terapeuta especializado en Análisis Aplicado de la Conducta (ABA) realizando una evaluación del entorno del hogar de un niño en terapia.

**INFORMACIÓN RECOPILADA DURANTE LA VISITA DOMICILIARIA:**

**Comportamiento observado en casa:**
${comportamiento_observado || 'No registrado'}

**Barreras identificadas:**
${barreras_identificadas || 'No registradas'}

**Facilitadores y fortalezas del entorno:**
${facilitadores || 'No registrados'}

**Rutina diaria del niño:**
${rutina_diaria || 'No registrada'}

**Calidad de interacción padres-niño:**
${interaccion_padres || 'No registrada'}

---

**TU TAREA:**
Genera un análisis profesional completo del entorno del hogar con las siguientes secciones:

1. **impresion_general**: (2-3 párrafos) Resumen profesional de la visita. Incluye observaciones sobre las condiciones del hogar, dinámica familiar, y cómo el entorno impacta el desarrollo del niño. Usa lenguaje clínico pero comprensible.

2. **mensaje_padres**: (1 párrafo cálido y motivador) Mensaje en formato WhatsApp para los padres. Debe ser positivo, reconocer fortalezas observadas, y mencionar de forma constructiva áreas de mejora. Usa un tono cercano pero profesional. Ejemplo: "¡Hola familia! Fue un gusto visitarlos en casa. Observé que [nombre] se siente muy cómodo en su espacio y..."

3. **recomendaciones_espacio**: (4-5 recomendaciones específicas) Sugerencias concretas para adaptar el espacio físico del hogar (ej: crear rincón sensorial, reducir distractores visuales, organizar materiales de juego).

4. **recomendaciones_rutinas**: (4-5 recomendaciones específicas) Ajustes sugeridos en las rutinas diarias (horarios de sueño, estructura de comidas, transiciones entre actividades).

5. **actividades_sugeridas**: (5-6 actividades prácticas) Actividades terapéuticas que la familia puede realizar en casa. Incluye materiales necesarios y objetivo de cada actividad.

**IMPORTANTE:**
- Sé específico y práctico
- Las recomendaciones deben ser realizables por la familia
- Usa un tono profesional pero empático
- Reconoce siempre las fortalezas antes de mencionar áreas de mejora
- Si falta información, infiere de manera razonable basándote en casos típicos

**FORMATO DE RESPUESTA:**
Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin backticks):
{
  "impresion_general": "texto aquí",
  "mensaje_padres": "texto aquí",
  "recomendaciones_espacio": "texto aquí",
  "recomendaciones_rutinas": "texto aquí",
  "actividades_sugeridas": "texto aquí"
}
`;

    // Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpiar respuesta (eliminar markdown si existe)
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.trim();

    // Parsear JSON
    let analysisData;
    try {
      analysisData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', cleanedResponse);
      return NextResponse.json(
        { error: 'Error al procesar la respuesta de IA', details: cleanedResponse },
        { status: 500 }
      );
    }

    // Validar que tenga los campos necesarios
    if (!analysisData.impresion_general || !analysisData.mensaje_padres) {
      return NextResponse.json(
        { error: 'Respuesta de IA incompleta', data: analysisData },
        { status: 500 }
      );
    }

    // Retornar análisis generado
    return NextResponse.json({
      impresion_general: analysisData.impresion_general,
      mensaje_padres: analysisData.mensaje_padres,
      recomendaciones_espacio: analysisData.recomendaciones_espacio,
      recomendaciones_rutinas: analysisData.recomendaciones_rutinas,
      actividades_sugeridas: analysisData.actividades_sugeridas
    });

  } catch (error: any) {
    console.error('Error en generate-home-environment-report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}


