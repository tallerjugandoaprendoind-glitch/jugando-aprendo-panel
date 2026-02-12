// ==============================================================================
// API: ANÁLISIS IA PARA EVALUACIONES PROFESIONALES
// Ruta: /api/analyze-professional-evaluation/route.ts
// ==============================================================================

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { evaluationType, responses, childName, childAge } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key no configurada" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    let analysisResult: any = {};

    switch (evaluationType) {
      case 'brief2':
        analysisResult = await analyzeBRIEF2(model, responses, childName, childAge);
        break;
      case 'ados2':
        analysisResult = await analyzeADOS2(model, responses, childName, childAge);
        break;
      case 'vineland3':
        analysisResult = await analyzeVineland3(model, responses, childName, childAge);
        break;
      case 'wiscv':
        analysisResult = await analyzeWISCV(model, responses, childName, childAge);
        break;
      case 'basc3':
        analysisResult = await analyzeBASC3(model, responses, childName, childAge);
        break;
      default:
        return NextResponse.json({ error: "Tipo no reconocido" }, { status: 400 });
    }

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error("Error análisis:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// ANÁLISIS BRIEF-2
// ============================================================================
async function analyzeBRIEF2(model: any, responses: any, childName: string, childAge: number) {
  const inhibicionScore = sumItems(responses, 'inhibe_', 6);
  const flexibilidadScore = sumItems(responses, 'flex_', 6);
  const emocionalScore = sumItems(responses, 'emocional_', 5);
  const memoriaScore = sumItems(responses, 'memoria_', 5);
  const planificacionScore = sumItems(responses, 'plan_', 5);

  const totalScore = inhibicionScore + flexibilidadScore + emocionalScore + memoriaScore + planificacionScore;
  const maxScore = 81; // 27 items x 3 puntos max
  const percentScore = (totalScore / maxScore) * 100;

  let nivelRiesgo = '';
  if (percentScore < 40) nivelRiesgo = 'BAJO - Funciones ejecutivas adecuadas';
  else if (percentScore < 65) nivelRiesgo = 'MODERADO - Dificultades leves';
  else if (percentScore < 85) nivelRiesgo = 'ELEVADO - Requiere intervención';
  else nivelRiesgo = 'MUY ELEVADO - Requiere intervención inmediata';

  const prompt = `
Eres neuropsicólogo experto. Analiza esta evaluación BRIEF-2.

PACIENTE: ${childName}, ${childAge} años

PUNTUACIONES:
- Inhibición: ${inhibicionScore}/18 ${getDescriptor(inhibicionScore, 18)}
- Flexibilidad: ${flexibilidadScore}/18 ${getDescriptor(flexibilidadScore, 18)}
- Control Emocional: ${emocionalScore}/15 ${getDescriptor(emocionalScore, 15)}
- Memoria Trabajo: ${memoriaScore}/15 ${getDescriptor(memoriaScore, 15)}
- Planificación: ${planificacionScore}/15 ${getDescriptor(planificacionScore, 15)}

TOTAL: ${totalScore}/${maxScore} (${percentScore.toFixed(0)}%)
RIESGO: ${nivelRiesgo}

NOTAS CLÍNICAS:
${responses.inhibe_notas || 'Sin notas'}
${responses.flex_notas || ''}
${responses.emocional_notas || ''}

GENERA (formato JSON estricto):
{
  "analisis_ia": "2-3 párrafos explicando el perfil ejecutivo, áreas críticas e impacto funcional",
  "recomendaciones_ia": "• Estrategia 1\\n• Estrategia 2\\n• Estrategia 3\\n• Estrategia 4 (específicas, aplicables)",
  "informe_padres": "2 párrafos SIN tecnicismos explicando resultados y qué hacer en casa"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  
  const parsed = parseJSON(responseText, {
    analisis_ia: "Análisis generado",
    recomendaciones_ia: "• Recomendaciones generadas",
    informe_padres: "Informe generado"
  });

  return {
    ...parsed,
    metricas: {
      inhibicion: inhibicionScore,
      flexibilidad: flexibilidadScore,
      emocional: emocionalScore,
      memoria: memoriaScore,
      planificacion: planificacionScore,
      total: totalScore,
      porcentaje: percentScore,
      nivel_riesgo: nivelRiesgo
    }
  };
}

// ============================================================================
// ANÁLISIS ADOS-2
// ============================================================================
async function analyzeADOS2(model: any, responses: any, childName: string, childAge: number) {
  const comunicacionScore = sumItems(responses, '', ['contacto_visual', 'expresiones_faciales', 'integracion_mirada', 'sonrisa_social', 'comunicacion_afectiva', 'atencion_conjunta', 'inicio_atencion']);
  const interaccionScore = sumItems(responses, '', ['busqueda_compartir', 'ofrecimiento_consuelo', 'respuesta_nombre', 'reciprocidad_social', 'interes_otros']);
  const juegoScore = sumItems(responses, '', ['juego_funcional', 'juego_imaginativo', 'juego_imitativo']);
  const conductasScore = sumItems(responses, '', ['estereotipias_motoras', 'manipulacion_objetos', 'intereses_restringidos', 'rituales_compulsiones', 'sensibilidad_sensorial']);

  const totalScore = comunicacionScore + interaccionScore;
  
  let severidad = '';
  if (totalScore <= 7) severidad = 'MÍNIMO - No compatible con TEA';
  else if (totalScore <= 10) severidad = 'LEVE - TEA Nivel 1 (requiere apoyo)';
  else if (totalScore <= 15) severidad = 'MODERADO - TEA Nivel 2 (apoyo sustancial)';
  else severidad = 'SEVERO - TEA Nivel 3 (apoyo muy sustancial)';

  const prompt = `
Eres especialista en diagnóstico de autismo. Analiza ADOS-2.

PACIENTE: ${childName}, ${childAge} años

DOMINIOS:
- Comunicación Social: ${comunicacionScore}/21 puntos
- Interacción Recíproca: ${interaccionScore}/15 puntos
- Juego/Imaginación: ${juegoScore}/9 puntos
- Conductas Repetitivas: ${conductasScore}/10 puntos

TOTAL: ${totalScore} → ${severidad}

OBSERVACIONES:
${responses.notas_comunicacion || ''}
${responses.notas_interaccion || ''}

GENERA JSON:
{
  "analisis_diagnostico_ia": "Interpretación diagnóstica profesional (2-3 párrafos)",
  "recomendaciones_intervencion": "• ABA\n• ESDM\n• Logopedia\n• Terapia ocupacional (específico)",
  "informe_familia_ados": "Explicación sensible para familia (2 párrafos, esperanzador)"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  
  const parsed = parseJSON(responseText, {
    analisis_diagnostico_ia: "Análisis diagnóstico",
    recomendaciones_intervencion: "Recomendaciones",
    informe_familia_ados: "Informe familia"
  });

  return {
    ...parsed,
    puntuacion_total: totalScore,
    nivel_severidad: severidad,
    metricas: {
      comunicacion: comunicacionScore,
      interaccion: interaccionScore,
      juego: juegoScore,
      conductas: conductasScore,
      total: totalScore,
      severidad
    }
  };
}

// ============================================================================
// ANÁLISIS VINELAND-3
// ============================================================================
async function analyzeVineland3(model: any, responses: any, childName: string, childAge: number) {
  const comunicacionScore = calculateVinelandScore(responses, ['com_receptiva', 'com_sigue_instrucciones', 'com_entiende_2pasos', 'com_expresiva_palabras', 'com_frases_completas', 'com_cuenta_experiencias', 'com_escrita']);
  const vidaDiariaScore = calculateVinelandScore(responses, ['vida_come_solo', 'vida_bebe_vaso', 'vida_lava_manos', 'vida_viste_superior', 'vida_bano', 'vida_tareas_casa', 'vida_dinero']);
  const socializacionScore = calculateVinelandScore(responses, ['soc_sonrie_familiar', 'soc_muestra_afecto', 'soc_juega_otros', 'soc_comparte', 'soc_respeta_turnos', 'soc_empatia', 'soc_amistad']);
  const motorScore = calculateVinelandScore(responses, ['motor_camina', 'motor_corre', 'motor_salta', 'motor_pelota', 'motor_pinza', 'motor_dibuja']);

  const indiceGlobal = Math.round((comunicacionScore + vidaDiariaScore + socializacionScore) / 3);

  const prompt = `
Eres experto en conducta adaptativa. Analiza Vineland-3.

PACIENTE: ${childName}, ${childAge} años

DOMINIOS:
- Comunicación: ${comunicacionScore}/14 puntos
- Vida Diaria: ${vidaDiariaScore}/14 puntos
- Socialización: ${socializacionScore}/14 puntos
- Motricidad: ${motorScore}/12 puntos

ÍNDICE ADAPTATIVO GLOBAL: ${indiceGlobal}/14

NOTAS: ${responses.com_notas || ''} ${responses.vida_notas || ''}

GENERA JSON:
{
  "analisis_vineland_ia": "Interpretación del nivel de autonomía (2 párrafos)",
  "areas_fortaleza": "• Fortaleza 1\n• Fortaleza 2\n• Fortaleza 3",
  "areas_prioridad": "• Objetivo prioritario 1\n• Objetivo 2\n• Objetivo 3\n• Objetivo 4",
  "informe_padres_vineland": "Guía para padres sobre autonomía (2 párrafos prácticos)"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  
  const parsed = parseJSON(responseText, {
    analisis_vineland_ia: "Análisis",
    areas_fortaleza: "Fortalezas",
    areas_prioridad: "Prioridades",
    informe_padres_vineland: "Informe"
  });

  return {
    ...parsed,
    puntuacion_comunicacion: comunicacionScore,
    puntuacion_vida_diaria: vidaDiariaScore,
    puntuacion_socializacion: socializacionScore,
    indice_conducta_adaptativa: indiceGlobal,
    metricas: {
      comunicacion: comunicacionScore,
      vida_diaria: vidaDiariaScore,
      socializacion: socializacionScore,
      motor: motorScore,
      indice_global: indiceGlobal
    }
  };
}

// ============================================================================
// ANÁLISIS WISC-V
// ============================================================================
async function analyzeWISCV(model: any, responses: any, childName: string, childAge: number) {
  const icv = sumScalars(responses, ['icv_semejanzas', 'icv_vocabulario', 'icv_informacion', 'icv_comprension']);
  const ive = sumScalars(responses, ['ive_cubos', 'ive_puzles']);
  const irf = sumScalars(responses, ['irf_matrices', 'irf_balanzas', 'irf_aritmetica']);
  const imt = sumScalars(responses, ['imt_digitos', 'imt_imagenes']);
  const ivp = sumScalars(responses, ['ivp_claves', 'ivp_busqueda', 'ivp_cancelacion']);

  const sumaPonderada = icv + ive + irf + imt + ivp;
  const ciTotal = Math.round(100 + ((sumaPonderada - 50) * 1.5));
  
  let clasificacion = '';
  if (ciTotal >= 130) clasificacion = 'MUY SUPERIOR';
  else if (ciTotal >= 120) clasificacion = 'SUPERIOR';
  else if (ciTotal >= 110) clasificacion = 'PROMEDIO ALTO';
  else if (ciTotal >= 90) clasificacion = 'PROMEDIO';
  else if (ciTotal >= 80) clasificacion = 'PROMEDIO BAJO';
  else if (ciTotal >= 70) clasificacion = 'LIMÍTROFE';
  else clasificacion = 'DISCAPACIDAD INTELECTUAL';

  const prompt = `
Eres neuropsicólogo especializado en evaluación cognitiva. Analiza WISC-V.

PACIENTE: ${childName}, ${childAge} años

ÍNDICES:
- Comprensión Verbal (ICV): ${icv}
- Visoespacial (IVE): ${ive}
- Razonamiento Fluido (IRF): ${irf}
- Memoria Trabajo (IMT): ${imt}
- Velocidad Procesamiento (IVP): ${ivp}

CI TOTAL: ${ciTotal} (${clasificacion})

NOTAS: ${responses.icv_notas || ''} ${responses.imt_notas || ''}

GENERA JSON:
{
  "perfil_cognitivo_ia": "Análisis del perfil (discrepancias, fortalezas, debilidades - 2 párrafos)",
  "fortalezas_debilidades": "FORTALEZAS:\n• ...\n\nDEBILIDADES:\n• ...",
  "implicaciones_educativas": "• Estrategia educativa 1\n• Estrategia 2\n• Adaptación curricular específica",
  "recomendaciones_cognitivas": "• Recomendación 1\n• Recomendación 2\n• Recomendación 3",
  "informe_padres_wisc": "Explicación del CI para padres (2 párrafos, sin tecnicismos)"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  
  const parsed = parseJSON(responseText, {
    perfil_cognitivo_ia: "Perfil",
    fortalezas_debilidades: "Análisis",
    implicaciones_educativas: "Implicaciones",
    recomendaciones_cognitivas: "Recomendaciones",
    informe_padres_wisc: "Informe"
  });

  return {
    ...parsed,
    ci_total: ciTotal,
    clasificacion_ci: clasificacion,
    metricas: {
      icv, ive, irf, imt, ivp,
      ci_total: ciTotal,
      clasificacion
    }
  };
}

// ============================================================================
// ANÁLISIS BASC-3
// ============================================================================
async function analyzeBASC3(model: any, responses: any, childName: string, childAge: number) {
  const hiperactividad = parseInt(responses.basc_hiperactividad) || 0;
  const agresion = parseInt(responses.basc_agresion) || 0;
  const problemasConducta = parseInt(responses.basc_problemas_conducta) || 0;
  const ansiedad = parseInt(responses.basc_ansiedad) || 0;
  const depresion = parseInt(responses.basc_depresion) || 0;
  const somatizacion = parseInt(responses.basc_somatizacion) || 0;
  
  const habilidadesSociales = parseInt(responses.basc_habilidades_sociales) || 0;
  const liderazgo = parseInt(responses.basc_liderazgo) || 0;
  const habilidadesEstudio = parseInt(responses.basc_habilidades_estudio) || 0;
  const adaptabilidad = parseInt(responses.basc_adaptabilidad) || 0;

  const externalizante = hiperactividad + agresion + problemasConducta;
  const internalizante = ansiedad + depresion + somatizacion;
  const adaptativo = habilidadesSociales + liderazgo + habilidadesEstudio + adaptabilidad;

  const indiceSintomas = externalizante + internalizante;
  
  let perfilRiesgo = '';
  if (indiceSintomas < 10) perfilRiesgo = 'BAJO - Funcionamiento típico';
  else if (indiceSintomas < 15) perfilRiesgo = 'MODERADO - Requiere monitoreo';
  else perfilRiesgo = 'ALTO - Requiere intervención';

  const prompt = `
Eres psicólogo clínico experto. Analiza BASC-3.

PACIENTE: ${childName}, ${childAge} años

ESCALAS CLÍNICAS:
Externalizantes: ${externalizante}/15 (Hiperactividad: ${hiperactividad}, Agresión: ${agresion}, Problemas conducta: ${problemasConducta})
Internalizantes: ${internalizante}/15 (Ansiedad: ${ansiedad}, Depresión: ${depresion}, Somatización: ${somatizacion})

ESCALAS ADAPTATIVAS:
Total: ${adaptativo}/20 (Sociales: ${habilidadesSociales}, Liderazgo: ${liderazgo}, Estudio: ${habilidadesEstudio}, Adaptabilidad: ${adaptabilidad})

ÍNDICE SÍNTOMAS: ${indiceSintomas} → ${perfilRiesgo}

GENERA JSON:
{
  "analisis_basc_ia": "Análisis conductual/emocional integral (2 párrafos)",
  "areas_preocupacion": "• Preocupación 1\n• Preocupación 2\n• Preocupación 3",
  "fortalezas_conductuales": "• Fortaleza 1\n• Fortaleza 2",
  "plan_intervencion_conductual": "• Intervención específica 1\n• Intervención 2\n• Intervención 3\n• Intervención 4",
  "informe_padres_basc": "Explicación para padres (2 párrafos, esperanzador)"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();
  
  const parsed = parseJSON(responseText, {
    analisis_basc_ia: "Análisis",
    areas_preocupacion: "Áreas",
    fortalezas_conductuales: "Fortalezas",
    plan_intervencion_conductual: "Plan",
    informe_padres_basc: "Informe"
  });

  return {
    ...parsed,
    indice_sintomas_conductuales: indiceSintomas,
    perfil_riesgo: perfilRiesgo,
    metricas: {
      externalizante,
      internalizante,
      adaptativo,
      indice_sintomas: indiceSintomas,
      perfil_riesgo: perfilRiesgo
    }
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================
function sumItems(responses: any, prefix: string, count: number | string[]): number {
  if (Array.isArray(count)) {
    return count.reduce((sum, key) => sum + (parseInt(responses[key]) || 0), 0);
  }
  let total = 0;
  for (let i = 1; i <= count; i++) {
    total += parseInt(responses[`${prefix}${i}`]) || 0;
  }
  return total;
}

function sumScalars(responses: any, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (parseInt(responses[key]) || 0), 0);
}

function calculateVinelandScore(responses: any, keys: string[]): number {
  return keys.reduce((sum, key) => {
    const val = responses[key];
    if (val === 'Usualmente') return sum + 2;
    if (val === 'A veces') return sum + 1;
    return sum;
  }, 0);
}

function getDescriptor(score: number, max: number): string {
  const percent = (score / max) * 100;
  if (percent < 33) return '✓ Adecuado';
  if (percent < 66) return '⚠ Moderado';
  return '⚠⚠ Elevado';
}

function parseJSON(text: string, fallback: any): any {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : fallback;
  } catch {
    return fallback;
  }
}