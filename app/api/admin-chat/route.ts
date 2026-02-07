import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { question, childId } = await req.json();

    if (!childId) return NextResponse.json({ text: "Error: Selecciona un paciente primero." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ text: "Error: Falta API Key." });

    // 1. CARGAR DATOS
    const { data: anamnesis } = await supabase
      .from('anamnesis_completa')
      .select('datos')
      .eq('child_id', childId)
      .single();

    const { data: history } = await supabase
      .from('registro_aba')
      .select('fecha_sesion, datos')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(10);

    const { data: child } = await supabase
        .from('children')
        .select('name')
        .eq('id', childId)
        .single();

    // 2. CONTEXTO CON NUEVAS REGLAS DE "HUMANIDAD"
    const context = `
      Eres un Supervisor Clínico experto en ABA. Hablas con la Directora del centro.
      PACIENTE: ${child?.name || 'Paciente'}.

      DATOS CLÍNICOS:
      ${JSON.stringify(anamnesis?.datos || {}, null, 2)}

      HISTORIAL RECIENTE:
      ${JSON.stringify(history || [], null, 2)}

      PREGUNTA: "${question}"

      REGLAS DE RESPUESTA (OBLIGATORIAS):
      - NO escribas párrafos largos. Máximo 2 o 3 líneas por párrafo.
      - Usa LENGUAJE HUMANO y comprensible. Explica lo técnico de forma sencilla.
      - Usa viñetas o puntos (bullets) para separar ideas.
      - Usa **negritas** para resaltar lo más importante.
      - Si detectas un problema, menciónalo directamente, sin rodeos.
      - Responde de forma que la Directora pueda leerlo en menos de 20 segundos.
    `;

    // 3. INVOCAR IA
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(context);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("Error Admin Chat:", error);
    return NextResponse.json({ text: "Error analizando el historial clínico." });
  }
}