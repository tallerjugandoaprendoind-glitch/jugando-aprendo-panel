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

    // ── Prompt neuropsicológico profesional ──────────────────────────────────
    const ai = new GoogleGenAI({ apiKey });

    const context = `
ACTÚA COMO: Neuropsicólogo clínico infantil supervisor con 15+ años de experiencia en centros especializados en neurodivergencia (TEA, TDAH, DI, TDL). Tu escritura es cálida, técnica y profundamente empática. Los padres confían en ti porque les explicas TODO con claridad, con actividades concretas y aplicables en casa.

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

TAREA PRINCIPAL: Genera el análisis clínico completo Y el reporte profesional neuropsicológico para los padres.

REGLAS ESTRICTAS:
- "patron_aprendizaje" DEBE ser EXACTAMENTE uno de: "Aprendizaje rápido y generalización", "Aprendizaje gradual", "Requiere repetición intensiva", "Dificultad para generalizar", "Aprendizaje inconsistente"
- "coordinacion_familia" DEBE ser EXACTAMENTE uno de: "Urgente", "Necesaria", "Rutinaria", "No necesaria"
- "efectividad_sesion" DEBE ser número entero 1-5
- "mensaje_padres": Este es el campo MÁS IMPORTANTE. Debe ser un REPORTE NEUROPSICOLÓGICO PROFESIONAL COMPLETO de 10-14 oraciones con la siguiente estructura obligatoria:
  1. Saludo cálido mencionando al niño/a por nombre
  2. Qué se trabajó en la sesión (en lenguaje accesible, no técnico)
  3. Descripción de 2-3 logros específicos y observables que tuvo el niño/a hoy
  4. Una fortaleza destacada observada durante la sesión
  5. Una área que seguimos trabajando y por qué es importante
  6. ACTIVIDADES PARA CASA (esta sección es OBLIGATORIA - mínimo 3 actividades):
     "ACTIVIDADES PARA PRACTICAR EN CASA ESTA SEMANA:
      Actividad 1 - [Nombre de la actividad]: [descripción clara]. Cómo hacerlo: [pasos numerados]. Frecuencia: [X veces por semana, X minutos]. Qué observar: [qué deben notar los padres].
      Actividad 2 - [Nombre]: [descripción]. Cómo hacerlo: [pasos]. Frecuencia: [...]. Qué observar: [...].
      Actividad 3 - [Nombre]: [descripción]. Cómo hacerlo: [pasos]. Frecuencia: [...]. Qué observar: [...]."
  7. Qué reportar en la próxima sesión
  8. Mensaje motivador para la familia
  9. Firma con nombre del centro

- "destacar_positivo": exactamente 3-5 logros separados por " | " (ej: "Mantuvo atención 8 min | Verbalizó 4 palabras nuevas | Toleró frustración sin berrinche")
- "instrucciones_padres": instrucciones paso a paso numeradas para la actividad terapéutica principal
- Para "producto_sugerido": ID exacto si aplica genuinamente, si no, null
- Sé ESPECÍFICO. Usa el nombre del niño. Menciona las habilidades trabajadas. NO generes texto genérico.

Responde SOLAMENTE con JSON válido (sin texto adicional, sin backticks, sin comentarios):
{
  "avances_observados": "descripción clínica detallada de avances observados en sesión",
  "areas_dificultad": "descripción clínica de áreas que requieren más intervención",
  "patron_aprendizaje": "Aprendizaje gradual",
  "observaciones_tecnicas": "notas técnicas relevantes para el equipo terapéutico",
  "alertas_clinicas": "alertas o banderas rojas identificadas, o Sin alertas clínicas significativas",
  "recomendaciones_equipo": "recomendaciones específicas para el equipo interdisciplinario",
  "coordinacion_familia": "Rutinaria",
  "actividad_casa": "descripción completa y detallada de la actividad terapéutica principal para el hogar",
  "instrucciones_padres": "1. Preparar el espacio de la siguiente manera...\n2. Presentar el material así...\n3. Cuando el niño/a haga X, responder con Y...\n4. Repetir X veces...\n5. Finalizar con refuerzo positivo diciendo...",
  "objetivo_tarea": "objetivo conductual y neuropsicológico de la actividad en casa",
  "mensaje_padres": "Estimados papás de [Nombre],\n\nHoy tuvimos una sesión muy enriquecedora...\n\n[reporte completo 10-14 oraciones con logros, fortalezas, área de trabajo, y ACTIVIDADES PARA CASA detalladas paso a paso]\n\nCon afecto y compromiso,\nEquipo Jugando Aprendo",
  "destacar_positivo": "Logro específico 1 | Logro específico 2 | Logro específico 3",
  "proximos_pasos": "En las próximas sesiones continuaremos... Los avances de hoy nos permiten planificar...",
  "efectividad_sesion": 4,
  "ajustes_proxima_sesion": "ajustes técnicos planificados para próxima sesión",
  "necesidades_materiales": "materiales y recursos necesarios para próximas sesiones",
  "observaciones_clinicas": "observaciones clínicas adicionales de interés terapéutico",
  "analisis_abc": "análisis funcional clínico de la conducta observada (modelo ABC)",
  "justificacion": "justificación clínica y teórica de las intervenciones seleccionadas",
  "mentoring_interno": "notas de supervisión interna para el desarrollo del terapeuta",
  "actividad_realizada": "descripción de la actividad principal realizada en sesión",
  "red_flags": "NO",
  "barreras": "barreras identificadas para el aprendizaje y generalización",
  "tarea_hogar": "resumen ejecutivo de la tarea terapéutica para el hogar",
  "producto_sugerido": null,
  "razon_sugerencia": null
}`;

    const response = await callGeminiWithRetry(ai, "gemini-2.0-flash", context, { responseMimeType: "application/json", temperature: 0.4 })

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
