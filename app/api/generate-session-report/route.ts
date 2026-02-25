import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from '@/lib/supabase-admin';


// Helper: reintentar con backoff exponencial ante rate limit
async function callGeminiWithRetry(ai: any, model: string, contents: string, config: any = {}, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({ model, contents, config })
      return response
    } catch (err: any) {
      const is429 = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.status === 429
      if (is429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 2000 // 2s, 4s, 8s
        console.warn(`⚠️ Rate limit Gemini (intento ${attempt + 1}/${maxRetries}). Reintentando en ${delay/1000}s...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      if (is429) throw new Error('CUOTA_AGOTADA')
      throw err
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Compatibilidad con llamadas antiguas (solo ABC) y nuevas (formulario completo)
    const {
      // Sección 1: Información de la sesión
      fecha_sesion, duracion_minutos, tipo_sesion, objetivo_principal,
      // Sección 2: Registro ABC
      antecedente, conducta, consecuencia, funcion_estimada,
      // Sección 3: Métricas
      nivel_atencion, respuesta_instrucciones, iniciativa_comunicativa,
      tolerancia_frustracion, interaccion_social,
      // Sección 4: Habilidades
      habilidades_objetivo, nivel_logro_objetivos, ayudas_utilizadas,
      // Sección 5: Intervenciones
      tecnicas_aplicadas, reforzadores_efectivos, conductas_desafiantes, estrategias_manejo,
      // Paciente
      childName, childAge,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Error de servidor: Falta la variable GEMINI_API_KEY." }, { status: 500 });
    }

    if (!conducta && !antecedente) {
      return NextResponse.json({ error: "Faltan datos del registro ABA." }, { status: 400 });
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

    // ── Prompt completo para páginas 6–10 ────────────────────────────────────
    const ai = new GoogleGenAI({ apiKey });

    const context = `
ACTÚA COMO: Supervisor Clínico experto en ABA (Análisis Conductual Aplicado) con 15+ años de experiencia.
PACIENTE: ${childName || 'Paciente'}, ${childAge || 'N/E'} años.

DATOS DE LA SESIÓN REGISTRADOS POR EL TERAPEUTA:
━━━ SECCIÓN 1: INFORMACIÓN ━━━
- Fecha: ${fecha_sesion || 'N/E'}
- Duración: ${duracion_minutos || 'N/E'} minutos
- Tipo: ${tipo_sesion || 'N/E'}
- Objetivo principal: ${objetivo_principal || 'N/E'}

━━━ SECCIÓN 2: REGISTRO ABC ━━━
- Antecedente (A): ${antecedente || 'N/E'}
- Conducta (B): ${conducta || 'N/E'}
- Consecuencia (C): ${consecuencia || 'N/E'}
- Función estimada: ${funcion_estimada || 'N/E'}

━━━ SECCIÓN 3: MÉTRICAS (escala 1-5) ━━━
- Atención sostenida: ${nivel_atencion || 'N/E'}/5
- Respuesta a instrucciones: ${respuesta_instrucciones || 'N/E'}/5
- Iniciativa comunicativa: ${iniciativa_comunicativa || 'N/E'}/5
- Tolerancia a frustración: ${tolerancia_frustracion || 'N/E'}/5
- Interacción social: ${interaccion_social || 'N/E'}/5

━━━ SECCIÓN 4: HABILIDADES ━━━
- Habilidades trabajadas: ${Array.isArray(habilidades_objetivo) ? habilidades_objetivo.join(', ') : (habilidades_objetivo || 'N/E')}
- Nivel de logro: ${nivel_logro_objetivos || 'N/E'}
- Nivel de ayudas: ${ayudas_utilizadas || 'N/E'}

━━━ SECCIÓN 5: INTERVENCIONES ━━━
- Técnicas aplicadas: ${Array.isArray(tecnicas_aplicadas) ? tecnicas_aplicadas.join(', ') : (tecnicas_aplicadas || 'N/E')}
- Reforzadores efectivos: ${reforzadores_efectivos || 'N/E'}
- Conductas desafiantes: ${conductas_desafiantes || 'N/E'}
- Estrategias de manejo: ${estrategias_manejo || 'N/E'}
${productosTexto}

TAREA: Con base en TODOS los datos anteriores, completa inteligentemente las secciones 6 al 10 del formulario ABA.

INSTRUCCIONES CLAVE:
- Sé clínico, preciso y útil. Evita respuestas genéricas.
- "patron_aprendizaje" DEBE ser EXACTAMENTE uno de: "Aprendizaje rápido y generalización", "Aprendizaje gradual", "Requiere repetición intensiva", "Dificultad para generalizar", "Aprendizaje inconsistente"
- "coordinacion_familia" DEBE ser EXACTAMENTE uno de: "Urgente", "Necesaria", "Rutinaria", "No necesaria"
- "efectividad_sesion" DEBE ser un número entero entre 1 y 5
- "mensaje_padres": empático, positivo, claro, máx 3 líneas, para WhatsApp
- "destacar_positivo": logros concretos y observables para compartir con los padres
- "proximos_pasos": qué viene en próximas sesiones, en lenguaje para padres
- Para "producto_sugerido": pon el ID exacto si hay un producto de la tienda que genuinamente ayude a practicar la tarea en casa. Si ninguno aplica, pon null.
- "razon_sugerencia": 1 línea explicando por qué ese producto ayuda. Si no hay sugerencia, null.

Responde SOLAMENTE con este JSON (sin texto adicional):
{
  "avances_observados": "...",
  "areas_dificultad": "...",
  "patron_aprendizaje": "...",
  "observaciones_tecnicas": "...",
  "alertas_clinicas": "...",
  "recomendaciones_equipo": "...",
  "coordinacion_familia": "...",
  "actividad_casa": "...",
  "instrucciones_padres": "...",
  "objetivo_tarea": "...",
  "mensaje_padres": "...",
  "destacar_positivo": "...",
  "proximos_pasos": "...",
  "efectividad_sesion": 4,
  "ajustes_proxima_sesion": "...",
  "necesidades_materiales": "...",
  "observaciones_clinicas": "...",
  "analisis_abc": "...",
  "justificacion": "...",
  "mentoring_interno": "...",
  "actividad_realizada": "...",
  "red_flags": "NO",
  "barreras": "...",
  "tarea_hogar": "...",
  "producto_sugerido": null,
  "razon_sugerencia": null
}`;

    const response = await callGeminiWithRetry(ai, "gemini-3-flash-preview", context, { responseMimeType: "application/json", temperature: 0.4 })

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

    // Asegurar que efectividad_sesion sea número entero válido (1-5)
    if (responseData.efectividad_sesion !== undefined) {
      const ef = parseInt(String(responseData.efectividad_sesion), 10);
      responseData.efectividad_sesion = isNaN(ef) ? 3 : Math.min(5, Math.max(1, ef));
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error Gemini session report:", error);
    return NextResponse.json({ error: "Error procesando el reporte: " + error.message }, { status: 500 });
  }
}

