import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { childId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Obtener los últimos registros ABA
    const { data: sessions } = await supabase
      .from('registro_aba')
      .select('datos')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(10);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: "No hay sesiones suficientes para analizar." });
    }

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-001",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Eres un analista clínico ABA. Basado en estos reportes de sesión:
      ${JSON.stringify(sessions)}

      Calcula el porcentaje de progreso (0 a 100) del niño en estas 3 áreas:
      1. Comunicacion Verbal
      2. Regulacion Emocional
      3. Habilidades Sociales

      Responde SOLAMENTE este JSON:
      {
        "verbal": 85,
        "emocional": 40,
        "social": 60
      }
    `;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());

    // 2. GUARDAR automáticamente en la tabla children
    await supabase.from('children').update({
        progress_verbal: data.verbal,
        progress_emotional: data.emocional,
        progress_social: data.social
    }).eq('id', childId);

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}