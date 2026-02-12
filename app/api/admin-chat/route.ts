import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { question, childId } = await req.json();

    if (!childId) return NextResponse.json({ text: "⚠️ Selecciona un paciente primero." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ text: "❌ Error: Falta API Key." });

    // ===========================================================================
    // 1. CARGAR DATOS DEL PACIENTE
    // ===========================================================================
    const { data: child } = await supabase
      .from('children')
      .select('name, birth_date, age, diagnosis')
      .eq('id', childId)
      .single();

    // ===========================================================================
    // 2. CARGAR ANAMNESIS
    // ===========================================================================
    const { data: anamnesis } = await supabase
      .from('anamnesis_completa')
      .select('datos, created_at')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // ===========================================================================
    // 3. CARGAR HISTORIAL ABA (últimas 15 sesiones)
    // ===========================================================================
    const { data: historyABA } = await supabase
      .from('registro_aba')
      .select('fecha_sesion, datos, created_at')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
      .limit(15);

    // ===========================================================================
    // 4. CARGAR VISITAS DOMICILIARIAS
    // ===========================================================================
    const { data: historyEntorno } = await supabase
      .from('registro_entorno_hogar')
      .select('fecha_visita, datos, created_at')
      .eq('child_id', childId)
      .order('fecha_visita', { ascending: false })
      .limit(5);

    // ===========================================================================
    // 5. 🆕 CARGAR EVALUACIONES PROFESIONALES
    // ===========================================================================
    
    // BRIEF-2 - Funciones Ejecutivas
    const { data: brief2 } = await supabase
      .from('evaluacion_brief2')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // ADOS-2 - Autismo
    const { data: ados2 } = await supabase
      .from('evaluacion_ados2')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Vineland-3 - Conducta Adaptativa
    const { data: vineland3 } = await supabase
      .from('evaluacion_vineland3')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // WISC-V - Coeficiente Intelectual
    const { data: wiscv } = await supabase
      .from('evaluacion_wiscv')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // BASC-3 - Conducta y Emociones
    const { data: basc3 } = await supabase
      .from('evaluacion_basc3')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // ===========================================================================
    // 6. CONSTRUIR CONTEXTO CLÍNICO COMPLETO
    // ===========================================================================
    const context = `
🎯 CONTEXTO CLÍNICO INTEGRAL - SISTEMA PROFESIONAL

PACIENTE: ${child?.name || 'Paciente'}
Edad: ${child?.age || 'No especificada'} años
Diagnóstico: ${child?.diagnosis || 'En evaluación'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 1. EVALUACIONES NEUROPSICOLÓGICAS ESTANDARIZADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${brief2 ? `
✅ BRIEF-2 (Funciones Ejecutivas)
Fecha: ${new Date(brief2.created_at).toLocaleDateString()}
📊 MÉTRICAS:
  • Inhibición: ${brief2.metricas?.inhibicion || 'N/A'}
  • Flexibilidad: ${brief2.metricas?.flexibilidad || 'N/A'}
  • Control Emocional: ${brief2.metricas?.emocional || 'N/A'}
  • Memoria Trabajo: ${brief2.metricas?.memoria || 'N/A'}
  • Planificación: ${brief2.metricas?.planificacion || 'N/A'}
  • TOTAL: ${brief2.metricas?.total || 'N/A'} (${brief2.metricas?.porcentaje?.toFixed(0) || 0}%)
  • NIVEL RIESGO: ${brief2.metricas?.nivel_riesgo || 'N/A'}

💡 ANÁLISIS IA: ${brief2.datos?.analisis_ia || 'No disponible'}
` : '❌ BRIEF-2: No evaluado'}

${ados2 ? `
✅ ADOS-2 (Diagnóstico Autismo)
Fecha: ${new Date(ados2.created_at).toLocaleDateString()}
📊 MÉTRICAS:
  • Comunicación Social: ${ados2.metricas?.comunicacion || 'N/A'}
  • Interacción Recíproca: ${ados2.metricas?.interaccion || 'N/A'}
  • Juego/Imaginación: ${ados2.metricas?.juego || 'N/A'}
  • Conductas Repetitivas: ${ados2.metricas?.conductas || 'N/A'}
  • PUNTUACIÓN TOTAL: ${ados2.metricas?.total || 'N/A'}
  • SEVERIDAD: ${ados2.metricas?.severidad || 'N/A'}

💡 ANÁLISIS IA: ${ados2.datos?.analisis_diagnostico_ia || 'No disponible'}
` : '❌ ADOS-2: No evaluado'}

${vineland3 ? `
✅ VINELAND-3 (Conducta Adaptativa)
Fecha: ${new Date(vineland3.created_at).toLocaleDateString()}
📊 MÉTRICAS:
  • Comunicación: ${vineland3.metricas?.comunicacion || 'N/A'}/14
  • Vida Diaria: ${vineland3.metricas?.vida_diaria || 'N/A'}/14
  • Socialización: ${vineland3.metricas?.socializacion || 'N/A'}/14
  • Motricidad: ${vineland3.metricas?.motor || 'N/A'}/12
  • ÍNDICE GLOBAL: ${vineland3.metricas?.indice_global || 'N/A'}/14

💡 ANÁLISIS IA: ${vineland3.datos?.analisis_vineland_ia || 'No disponible'}
🎯 ÁREAS PRIORITARIAS: ${vineland3.datos?.areas_prioridad || 'No especificadas'}
` : '❌ VINELAND-3: No evaluado'}

${wiscv ? `
✅ WISC-V (Coeficiente Intelectual)
Fecha: ${new Date(wiscv.created_at).toLocaleDateString()}
📊 MÉTRICAS:
  • Comprensión Verbal (ICV): ${wiscv.metricas?.icv || 'N/A'}
  • Visoespacial (IVE): ${wiscv.metricas?.ive || 'N/A'}
  • Razonamiento Fluido (IRF): ${wiscv.metricas?.irf || 'N/A'}
  • Memoria Trabajo (IMT): ${wiscv.metricas?.imt || 'N/A'}
  • Velocidad Procesamiento (IVP): ${wiscv.metricas?.ivp || 'N/A'}
  • CI TOTAL: ${wiscv.metricas?.ci_total || 'N/A'} (${wiscv.metricas?.clasificacion || 'N/A'})

💡 PERFIL COGNITIVO: ${wiscv.datos?.perfil_cognitivo_ia || 'No disponible'}
📚 IMPLICACIONES EDUCATIVAS: ${wiscv.datos?.implicaciones_educativas || 'No especificadas'}
` : '❌ WISC-V: No evaluado'}

${basc3 ? `
✅ BASC-3 (Conducta y Emociones)
Fecha: ${new Date(basc3.created_at).toLocaleDateString()}
📊 MÉTRICAS:
  • Externalizante: ${basc3.metricas?.externalizante || 'N/A'}
  • Internalizante: ${basc3.metricas?.internalizante || 'N/A'}
  • Adaptativo: ${basc3.metricas?.adaptativo || 'N/A'}
  • ÍNDICE SÍNTOMAS: ${basc3.metricas?.indice_sintomas || 'N/A'}
  • PERFIL RIESGO: ${basc3.metricas?.perfil_riesgo || 'N/A'}

💡 ANÁLISIS IA: ${basc3.datos?.analisis_basc_ia || 'No disponible'}
⚠️ ÁREAS PREOCUPACIÓN: ${basc3.datos?.areas_preocupacion || 'No especificadas'}
` : '❌ BASC-3: No evaluado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 2. ANAMNESIS INICIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${anamnesis ? `
Fecha: ${new Date(anamnesis.created_at).toLocaleDateString()}
Datos relevantes:
${JSON.stringify(anamnesis.datos, null, 2)}
` : 'Sin anamnesis registrada'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 3. HISTORIAL DE SESIONES ABA (Últimas 15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${historyABA && historyABA.length > 0 ? 
  historyABA.map((sesion, idx) => `
  Sesión #${idx + 1} - ${sesion.fecha_sesion}
  • Objetivo: ${sesion.datos?.objetivo_principal || 'N/A'}
  • Conducta: ${sesion.datos?.conducta || 'N/A'}
  • Nivel Atención: ${sesion.datos?.nivel_atencion || 'N/A'}/5
  • Tolerancia Frustración: ${sesion.datos?.tolerancia_frustracion || 'N/A'}/5
  • Logro Objetivos: ${sesion.datos?.nivel_logro_objetivos || 'N/A'}
  • Avances: ${sesion.datos?.avances_observados || 'N/A'}
  `).join('\n') 
  : 'Sin sesiones ABA registradas'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 4. VISITAS DOMICILIARIAS (Últimas 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${historyEntorno && historyEntorno.length > 0 ?
  historyEntorno.map((visita, idx) => `
  Visita #${idx + 1} - ${visita.fecha_visita}
  • Comportamiento: ${visita.datos?.comportamiento_observado || 'N/A'}
  • Barreras: ${visita.datos?.barreras_identificadas || 'N/A'}
  • Facilitadores: ${visita.datos?.facilitadores || 'N/A'}
  `).join('\n')
  : 'Sin visitas domiciliarias registradas'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ PREGUNTA DE LA DIRECTORA:
"${question}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INSTRUCCIONES PARA LA RESPUESTA:

1. **FORMATO DE RESPUESTA:**
   - Máximo 2-3 párrafos CORTOS (3-4 líneas cada uno)
   - Usa **negritas** para lo MÁS importante
   - Usa viñetas • para separar ideas
   - SIN tecnicismos innecesarios

2. **CONTENIDO:**
   - Responde DIRECTAMENTE la pregunta
   - Integra datos de TODAS las evaluaciones cuando sea relevante
   - Si hay evolución, menciona cambios específicos
   - Si hay banderas rojas, menciónalas claramente
   - Si hay discrepancias entre evaluaciones, explícalas

3. **TONO:**
   - Profesional pero comprensible
   - Directo y concreto
   - Sin rodeos ni frases de relleno
   - Si algo es preocupante, dilo claramente

4. **ESTRUCTURA SUGERIDA:**
   Párrafo 1: Respuesta directa con datos clave
   Párrafo 2: Contexto de evaluaciones profesionales
   Párrafo 3: Recomendación específica (si aplica)

5. **PRIORIDAD DE DATOS:**
   - Primero: Evaluaciones estandarizadas (BRIEF-2, ADOS-2, etc.)
   - Segundo: Evolución en sesiones ABA
   - Tercero: Contexto del hogar
   - Cuarto: Anamnesis inicial

RESPONDE AHORA:
`;

    // ===========================================================================
    // 7. INVOCAR IA CON CONTEXTO COMPLETO
    // ===========================================================================
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const result = await model.generateContent(context);
    const response = await result.response;
    
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("Error Admin Chat:", error);
    return NextResponse.json({ text: "❌ Error analizando el historial clínico: " + error.message });
  }
}