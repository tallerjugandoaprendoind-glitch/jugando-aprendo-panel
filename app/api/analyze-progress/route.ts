import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    // 1. Validación de entrada
    const body = await req.json();
    const { childId } = body;

    if (!childId) {
      return NextResponse.json({ error: "Falta el ID del paciente (childId)" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Error de servidor: Falta API Key" }, { status: 500 });
    }

    // 2. Obtener sesiones con FECHA (Vital para medir progreso)
    const { data: sessions, error: dbError } = await supabase
      .from('registro_aba')
      .select('fecha_sesion, datos') 
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false }) // Traemos las más recientes primero
      .limit(10); // Analizamos las últimas 10 sesiones

    if (dbError) throw new Error(dbError.message);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "No hay sesiones suficientes para analizar." });
    }

    // 3. Configurar Gemini (Modelo 1.5 Flash para evitar errores de cuota)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    // 4. Prompt Estructurado
    const prompt = `
      Eres un analista clínico experto en terapia ABA.
      
      CONTEXTO:
      Aquí tienes los reportes de las últimas sesiones del paciente (ordenadas de la más reciente a la más antigua):
      ${JSON.stringify(sessions)}

      TAREA:
      Analiza la tendencia de los datos. Calcula un porcentaje de dominio/progreso actual (0 a 100) para estas 3 áreas.
      - Si el niño cumple objetivos consistentemente en las últimas sesiones, el puntaje debe ser alto.
      - Si hay muchas conductas disruptivas recientes, el puntaje debe bajar.

      Responde SOLAMENTE este JSON exacto:
      {
        "verbal": number,    // Progreso en Comunicación Verbal
        "emocional": number, // Progreso en Regulación Emocional
        "social": number     // Progreso en Habilidades Sociales
      }
    `;

    // 5. Generar Análisis
    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    // 6. Guardar resultados en Supabase
    const { error: updateError } = await supabase.from('children').update({
        progress_verbal: data.verbal,
        progress_emotional: data.emocional,
        progress_social: data.social
    }).eq('id', childId);

    if (updateError) {
      console.error("Error actualizando DB:", updateError);
      // No detenemos la respuesta, pero lo logueamos
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error en API Progress:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}