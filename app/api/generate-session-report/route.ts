import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { antecedente, conducta, consecuencia } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Error de servidor: Falta la variable GEMINI_API_KEY." }, { status: 500 });
    }

    if (!antecedente || !conducta || !consecuencia) {
      return NextResponse.json({ error: "Faltan datos del registro ABC." }, { status: 400 });
    }

    // ── Traer productos activos de la tienda ──────────────────────────────────
    const { data: productos } = await supabaseAdmin
      .from('store_products')
      .select('id, nombre, descripcion, precio_soles, tipo, categoria, imagen_url')
      .eq('activo', true)
      .gt('stock', 0)
      .order('destacado', { ascending: false })
      .limit(12);

    const productosTexto = productos && productos.length > 0
      ? `\nPRODUCTOS EN NUESTRA TIENDA (sugiere UNO solo si realmente ayuda a la tarea en casa):\n` +
        productos.map((p, i) =>
          `${i + 1}. ID:"${p.id}" | "${p.nombre}" | S/${p.precio_soles} | ${p.tipo} | ${p.descripcion || ''}`
        ).join('\n')
      : '';

    // ── Prompt ────────────────────────────────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey });

    const context = `
ACTÚA COMO: Supervisor Clínico experto en ABA (Análisis Conductual Aplicado).
TAREA: Analizar esta contingencia conductual ABC y generar reporte técnico.

DATOS DE LA SESIÓN:
- Antecedente (A): ${antecedente}
- Conducta (B): ${conducta}
- Consecuencia (C): ${consecuencia}
${productosTexto}

INSTRUCCIONES:
- Analiza el caso clínicamente.
- Para "producto_sugerido": si existe un producto de la tienda que genuinamente ayude a la familia a practicar la tarea_hogar, pon su ID exacto. Si ninguno aplica, pon null.
- "razon_sugerencia": frase natural de 1 línea explicando por qué ese producto ayuda (ej: "Este material te ayudará a practicar en casa la discriminación visual que trabajamos hoy"). Si no hay sugerencia, null.
- NO sugiereas un producto forzado. Solo cuando hay conexión real con la tarea.

Responde SOLAMENTE con este JSON:
{
  "mensaje_padres": "Mensaje empático, max 2 líneas, positivo y profesional.",
  "observaciones_clinicas": "Descripción técnica de la topografía y relación con el antecedente.",
  "analisis_abc": "Hipótesis de función (Atención, Escape, Tangible o Sensorial).",
  "justificacion": "Breve justificación técnica.",
  "mentoring_interno": "Consejo (1 frase) para el terapeuta junior.",
  "actividad_realizada": "Nombre técnico de la intervención.",
  "red_flags": "SI o NO sobre riesgo de autolesión.",
  "barreras": "Barrera del aprendizaje detectada.",
  "tarea_hogar": "Tarea simple (1 frase) para practicar en casa.",
  "producto_sugerido": null,
  "razon_sugerencia": null
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
      config: { responseMimeType: "application/json", temperature: 0.4 }
    });

    const responseData = JSON.parse(response.text || "{}");

    // Enriquecer con info completa del producto si la IA eligió uno
    if (responseData.producto_sugerido && productos) {
      const prod = productos.find((p: any) => p.id === responseData.producto_sugerido);
      if (prod) {
        responseData.producto_sugerido_info = {
          id: prod.id,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio_soles: prod.precio_soles,
          tipo: prod.tipo,
          imagen_url: prod.imagen_url,
          razon: responseData.razon_sugerencia,
        };
      } else {
        responseData.producto_sugerido = null;
        responseData.producto_sugerido_info = null;
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error Gemini session report:", error);
    return NextResponse.json({ error: "Error procesando el reporte: " + error.message }, { status: 500 });
  }
}
