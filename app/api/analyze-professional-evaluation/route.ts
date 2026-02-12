// ==============================================================================
// API: ANÁLISIS IA PARA EVALUACIONES PROFESIONALES (VERSIÓN EXTENDIDA)
// Ruta: /api/analyze-professional-evaluation/route.ts
// ==============================================================================

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Definimos interfaces para tipado básico (opcional pero recomendado)
interface EvaluationRequest {
  evaluationType: 'brief2' | 'ados2' | 'vineland3' | 'wiscv' | 'basc3';
  responses: any;
  childName: string;
  childAge: number;
}

export async function POST(req: Request) {
  try {
    const body: EvaluationRequest = await req.json();
    const { evaluationType, responses, childName, childAge } = body;

    // 1. Verificación de Seguridad
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ CRÍTICO: No se encontró GEMINI_API_KEY");
      return NextResponse.json({ error: "Configuración del servidor incompleta (API Key)" }, { status: 500 });
    }

    // 2. Inicialización de Gemini 1.5 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Modelo estable
        generationConfig: { 
            responseMimeType: "application/json", // Forzamos respuesta JSON pura
            temperature: 0.4 // Temperatura baja para análisis clínico preciso
        }
    });

    let analysisResult: any = {};

    // 3. Router de Evaluaciones
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
        return NextResponse.json({ error: `Tipo de evaluación no soportado: ${evaluationType}` }, { status: 400 });
    }

    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error("❌ Error en el análisis de IA:", error);
    return NextResponse.json({ 
        error: error.message || "Error desconocido procesando la evaluación clínica." 
    }, { status: 500 });
  }
}

// ============================================================================
// 1. LÓGICA BRIEF-2 (Funciones Ejecutivas)
// ============================================================================
async function analyzeBRIEF2(model: any, responses: any, childName: string, childAge: number) {
  // Cálculos matemáticos precisos
  const inhibicionScore = sumItems(responses, 'inhibe_', 6);
  const flexibilidadScore = sumItems(responses, 'flex_', 6);
  const emocionalScore = sumItems(responses, 'emocional_', 5);
  const memoriaScore = sumItems(responses, 'memoria_', 5);
  const planificacionScore = sumItems(responses, 'plan_', 5);

  const totalScore = inhibicionScore + flexibilidadScore + emocionalScore + memoriaScore + planificacionScore;
  const maxScore = 81; // 27 items * 3
  const percentScore = (totalScore / maxScore) * 100;

  // Determinar nivel de riesgo clínico
  let nivelRiesgo = '';
  if (percentScore < 40) nivelRiesgo = 'SIN RIESGO CLÍNICO (Funcionamiento Ejecutivo Adecuado)';
  else if (percentScore < 60) nivelRiesgo = 'RIESGO LEVE (Dificultades Específicas)';
  else if (percentScore < 80) nivelRiesgo = 'RIESGO MODERADO (Disfunción Ejecutiva Significativa)';
  else nivelRiesgo = 'RIESGO SEVERO (Disfunción Ejecutiva Global)';

  const prompt = `
    ACTÚA COMO: Neuropsicólogo clínico infantil con especialización en Funciones Ejecutivas.
    TAREA: Redactar un informe clínico detallado basado en la prueba BRIEF-2.

    DATOS DEL PACIENTE:
    - Nombre: ${childName}
    - Edad: ${childAge} años
    
    RESULTADOS CUANTITATIVOS:
    1. Inhibición: ${inhibicionScore}/18 (${getDescriptor(inhibicionScore, 18)})
    2. Flexibilidad Cognitiva: ${flexibilidadScore}/18 (${getDescriptor(flexibilidadScore, 18)})
    3. Control Emocional: ${emocionalScore}/15 (${getDescriptor(emocionalScore, 15)})
    4. Memoria de Trabajo: ${memoriaScore}/15 (${getDescriptor(memoriaScore, 15)})
    5. Planificación/Organización: ${planificacionScore}/15 (${getDescriptor(planificacionScore, 15)})
    
    GLOBAL: ${percentScore.toFixed(1)}% -> ${nivelRiesgo}

    OBSERVACIONES CUALITATIVAS (Notas del evaluador):
    ${responses.inhibe_notas ? `• Inhibición: ${responses.inhibe_notas}` : ''}
    ${responses.flex_notas ? `• Flexibilidad: ${responses.flex_notas}` : ''}
    ${responses.emocional_notas ? `• Emocional: ${responses.emocional_notas}` : ''}

    INSTRUCCIONES DE FORMATO (JSON):
    Genera un JSON válido con las siguientes claves estrictas:
    {
      "analisis_ia": "Escribe 2 párrafos densos. Primero analiza el perfil global y el índice de regulación conductual (inhibición/emocional). Luego analiza el índice de metacognición (memoria/planificación). Usa lenguaje clínico profesional.",
      "recomendaciones_ia": "Lista de 4 a 6 recomendaciones prácticas y específicas para escuela y casa, separadas por saltos de línea. Enfócate en las áreas con mayor puntaje de déficit.",
      "informe_padres": "Un resumen de 150 palabras dirigido a los padres, usando tono empático, sin jerga médica compleja, explicando qué significan estos desafíos en la vida diaria."
    }
  `;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

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
// 2. LÓGICA ADOS-2 (Diagnóstico Autismo)
// ============================================================================
async function analyzeADOS2(model: any, responses: any, childName: string, childAge: number) {
  // Agrupación por dominios ADOS-2
  const comunicacionScore = sumItems(responses, '', ['contacto_visual', 'expresiones_faciales', 'integracion_mirada', 'sonrisa_social', 'comunicacion_afectiva', 'atencion_conjunta', 'inicio_atencion']);
  const interaccionScore = sumItems(responses, '', ['busqueda_compartir', 'ofrecimiento_consuelo', 'respuesta_nombre', 'reciprocidad_social', 'interes_otros']);
  const juegoScore = sumItems(responses, '', ['juego_funcional', 'juego_imaginativo', 'juego_imitativo']);
  const conductasScore = sumItems(responses, '', ['estereotipias_motoras', 'manipulacion_objetos', 'intereses_restringidos', 'rituales_compulsiones', 'sensibilidad_sensorial']);

  // Algoritmo simplificado de clasificación ADOS
  const totalScore = comunicacionScore + interaccionScore; 
  let severidad = '';
  let clasificacionClinica = '';

  if (totalScore <= 7) {
    severidad = 'NO TEA';
    clasificacionClinica = 'Puntaje por debajo del umbral clínico para Espectro Autista.';
  } else if (totalScore <= 10) {
    severidad = 'TEA LEVE';
    clasificacionClinica = 'Clasificación: Autismo (Nivel de soporte 1 sugerido).';
  } else if (totalScore <= 15) {
    severidad = 'TEA MODERADO';
    clasificacionClinica = 'Clasificación: Autismo (Nivel de soporte 2 sugerido).';
  } else {
    severidad = 'TEA SEVERO';
    clasificacionClinica = 'Clasificación: Autismo (Nivel de soporte 3 sugerido).';
  }

  const prompt = `
    ACTÚA COMO: Especialista certificado en ADOS-2 y diagnóstico diferencial de TEA.
    TAREA: Generar interpretación diagnóstica.

    PACIENTE: ${childName}, ${childAge} años.

    PERFIL DE PUNTUACIONES:
    - Afecto Social (Comunicación + Interacción): ${totalScore} puntos.
    - Comportamiento Restringido y Repetitivo: ${conductasScore} puntos.
    
    DESGLOSE:
    1. Comunicación: ${comunicacionScore} (Déficits en comunicación no verbal y verbal).
    2. Interacción Social Recíproca: ${interaccionScore} (Calidad de la relación social).
    3. Juego e Imaginación: ${juegoScore} (Creatividad y simbolismo).
    4. Conductas Repetitivas: ${conductasScore} (Estereotipias o intereses sensoriales).

    CONCLUSIÓN ALGORÍTMICA: ${clasificacionClinica} (${severidad})

    NOTAS DE OBSERVACIÓN DIRECTA:
    ${responses.notas_comunicacion || 'No se registraron notas específicas.'}

    INSTRUCCIONES DE FORMATO (JSON):
    Genera un JSON válido:
    {
      "analisis_diagnostico_ia": "Redacta un análisis clínico profundo (2-3 párrafos). Correlaciona los déficits en Afecto Social con las conductas repetitivas. Menciona si el perfil sugiere autismo clásico o atípico.",
      "recomendaciones_intervencion": "Provee una lista priorizada de intervenciones basadas en evidencia (ej. ABA, Denver/ESDM, PECS, Integración Sensorial) justificando por qué aplica a este niño.",
      "informe_familia_ados": "Un mensaje para la devolución a padres. Debe ser extremadamente cuidadoso, claro y constructivo. Evita ser alarmista pero sé honesto sobre las necesidades de apoyo."
    }
  `;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

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
// 3. LÓGICA VINELAND-3 (Conducta Adaptativa)
// ============================================================================
async function analyzeVineland3(model: any, responses: any, childName: string, childAge: number) {
  // Función auxiliar interna para Vineland (0, 1, 2)
  const calcV = (keys: string[]) => calculateVinelandScore(responses, keys);

  const comunicacionScore = calcV(['com_receptiva', 'com_sigue_instrucciones', 'com_entiende_2pasos', 'com_expresiva_palabras', 'com_frases_completas', 'com_cuenta_experiencias', 'com_escrita']);
  const vidaDiariaScore = calcV(['vida_come_solo', 'vida_bebe_vaso', 'vida_lava_manos', 'vida_viste_superior', 'vida_bano', 'vida_tareas_casa', 'vida_dinero']);
  const socializacionScore = calcV(['soc_sonrie_familiar', 'soc_muestra_afecto', 'soc_juega_otros', 'soc_comparte', 'soc_respeta_turnos', 'soc_empatia', 'soc_amistad']);
  const motorScore = calcV(['motor_camina', 'motor_corre', 'motor_salta', 'motor_pelota', 'motor_pinza', 'motor_dibuja']);

  const indiceGlobal = Math.round((comunicacionScore + vidaDiariaScore + socializacionScore) / 3);

  const prompt = `
    ACTÚA COMO: Terapeuta Ocupacional y Especialista en Conducta Adaptativa.
    TAREA: Informe de funcionalidad y autonomía (Vineland-3).

    PACIENTE: ${childName}, ${childAge} años.

    DOMINIOS EVALUADOS:
    1. Comunicación (Receptiva/Expresiva): ${comunicacionScore}/14
    2. Habilidades de la Vida Diaria (Autocuidado/Doméstico): ${vidaDiariaScore}/14
    3. Socialización (Interpersonal/Juego): ${socializacionScore}/14
    4. Habilidades Motoras (Gruesa/Fina): ${motorScore}/12
    
    ÍNDICE DE CONDUCTA ADAPTATIVA: ${indiceGlobal} (Escala referencial interna)

    NOTAS DE CONTEXTO: 
    ${responses.vida_notas || ''} 
    ${responses.soc_notas || ''}

    INSTRUCCIONES DE FORMATO (JSON):
    Genera un JSON válido:
    {
      "analisis_vineland_ia": "Análisis narrativo del nivel de independencia del niño. Compara sus habilidades con lo esperado para su edad cronológica (${childAge} años).",
      "areas_fortaleza": "Lista con viñetas de las habilidades que el niño YA domina.",
      "areas_prioridad": "Lista con viñetas de las habilidades emergentes o ausentes que deben ser Objetivos Terapéuticos inmediatos.",
      "informe_padres_vineland": "Guía para casa: Sugiere 3 actividades cotidianas (hora de comer, baño, juego) para fomentar la autonomía basándose en los déficits encontrados."
    }
  `;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return {
    ...parsed,
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
// 4. LÓGICA WISC-V (Inteligencia / Cognitivo)
// ============================================================================
async function analyzeWISCV(model: any, responses: any, childName: string, childAge: number) {
  // Suma de escalares
  const icv = sumScalars(responses, ['icv_semejanzas', 'icv_vocabulario', 'icv_informacion', 'icv_comprension']);
  const ive = sumScalars(responses, ['ive_cubos', 'ive_puzles']);
  const irf = sumScalars(responses, ['irf_matrices', 'irf_balanzas', 'irf_aritmetica']);
  const imt = sumScalars(responses, ['imt_digitos', 'imt_imagenes']);
  const ivp = sumScalars(responses, ['ivp_claves', 'ivp_busqueda', 'ivp_cancelacion']);

  // Aproximación de CI Total (Nota: Esto es una estimación programática, el WISC real usa tablas normativas)
  const sumaPonderada = icv + ive + irf + imt + ivp;
  // Fórmula de regresión aproximada para simulación
  const ciTotal = Math.round(100 + ((sumaPonderada - 50) * 1.5));
  
  let clasificacion = '';
  if (ciTotal >= 130) clasificacion = 'Muy Superior';
  else if (ciTotal >= 120) clasificacion = 'Superior';
  else if (ciTotal >= 110) clasificacion = 'Promedio Alto';
  else if (ciTotal >= 90) clasificacion = 'Promedio';
  else if (ciTotal >= 80) clasificacion = 'Promedio Bajo';
  else if (ciTotal >= 70) clasificacion = 'Limítrofe';
  else clasificacion = 'Discapacidad Intelectual';

  const prompt = `
    ACTÚA COMO: Neuropsicólogo clínico experto en evaluación cognitiva (WISC-V).
    TAREA: Perfil Cognitivo.

    PACIENTE: ${childName}, ${childAge} años.
    
    PERFIL DE ÍNDICES:
    - Comprensión Verbal (ICV): ${icv} (Razonamiento verbal, formación de conceptos).
    - Visoespacial (IVE): ${ive} (Procesamiento espacial, integración visomotora).
    - Razonamiento Fluido (IRF): ${irf} (Resolución de problemas novedosos).
    - Memoria de Trabajo (IMT): ${imt} (Atención, concentración, manipulación mental).
    - Velocidad de Procesamiento (IVP): ${ivp} (Rapidez mental y grafomotora).

    COEFICIENTE INTELECTUAL TOTAL (Estimado): ${ciTotal} - Categoría: ${clasificacion}

    INSTRUCCIONES DE FORMATO (JSON):
    Genera un JSON válido:
    {
      "perfil_cognitivo_ia": "Explica cómo procesa la información el niño. ¿Es mejor verbalmente o visualmente? ¿Su memoria de trabajo limita su inteligencia fluida? Analiza las discrepancias entre índices.",
      "fortalezas_debilidades": "Sección clara dividida en FORTALEZAS y DEBILIDADES cognitivas.",
      "implicaciones_educativas": "Estrategias pedagógicas para el aula. (Ej. Tiempo extra, material visual, instrucciones cortas).",
      "recomendaciones_cognitivas": "Ejercicios de estimulación cognitiva recomendados.",
      "informe_padres_wisc": "Explicación sencilla del CI y cómo apoyar el aprendizaje en casa."
    }
  `;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return {
    ...parsed,
    ci_total: ciTotal,
    clasificacion_ci: clasificacion,
    metricas: {
      icv, ive, irf, imt, ivp, ci_total: ciTotal, clasificacion
    }
  };
}

// ============================================================================
// 5. LÓGICA BASC-3 (Conducta y Emociones)
// ============================================================================
async function analyzeBASC3(model: any, responses: any, childName: string, childAge: number) {
  // Parseo seguro de integers
  const toInt = (k: string) => parseInt(responses[k]) || 0;

  const hiperactividad = toInt('basc_hiperactividad');
  const agresion = toInt('basc_agresion');
  const problemasConducta = toInt('basc_problemas_conducta');
  const ansiedad = toInt('basc_ansiedad');
  const depresion = toInt('basc_depresion');
  const somatizacion = toInt('basc_somatizacion');
  
  const habilidadesSociales = toInt('basc_habilidades_sociales');
  const liderazgo = toInt('basc_liderazgo');
  const habilidadesEstudio = toInt('basc_habilidades_estudio');
  const adaptabilidad = toInt('basc_adaptabilidad');

  // Cálculos compuestos
  const externalizante = hiperactividad + agresion + problemasConducta;
  const internalizante = ansiedad + depresion + somatizacion;
  const adaptativo = habilidadesSociales + liderazgo + habilidadesEstudio + adaptabilidad;
  const indiceSintomas = externalizante + internalizante;
  
  let perfilRiesgo = '';
  if (indiceSintomas < 10) perfilRiesgo = 'Bajo (Sin significancia clínica)';
  else if (indiceSintomas < 20) perfilRiesgo = 'En Riesgo (Atención sugerida)';
  else perfilRiesgo = 'Clínicamente Significativo (Intervención necesaria)';

  const prompt = `
    ACTÚA COMO: Psicólogo Conductual Infantil.
    TAREA: Interpretación del sistema BASC-3.

    PACIENTE: ${childName}, ${childAge} años.

    DIMENSIONES CLÍNICAS (SÍNTOMAS):
    1. Externalizantes (Conducta visible): ${externalizante}/30
       - Hiperactividad: ${hiperactividad}, Agresión: ${agresion}.
    2. Internalizantes (Emocional): ${internalizante}/30
       - Ansiedad: ${ansiedad}, Depresión: ${depresion}, Somatización: ${somatizacion}.

    DIMENSIONES ADAPTATIVAS (RECURSOS):
    - Total Recursos: ${adaptativo}/40
    - Habilidades Sociales: ${habilidadesSociales}, Adaptabilidad: ${adaptabilidad}.

    PERFIL DE RIESGO GENERAL: ${perfilRiesgo}

    INSTRUCCIONES DE FORMATO (JSON):
    Genera un JSON válido:
    {
      "analisis_basc_ia": "Analiza la relación entre lo que el niño siente (internalizante) y cómo actúa (externalizante). ¿Tiene recursos adaptativos suficientes para enfrentar sus problemas?",
      "areas_preocupacion": "Lista las escalas específicas que están elevadas y qué significan.",
      "fortalezas_conductuales": "Identifica los factores protectores del niño.",
      "plan_intervencion_conductual": "Plan de modificación de conducta y apoyo emocional.",
      "informe_padres_basc": "Explicación sobre el bienestar emocional del niño para los padres."
    }
  `;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return {
    ...parsed,
    metricas: {
      externalizante, internalizante, adaptativo, indice_sintomas: indiceSintomas, perfil_riesgo: perfilRiesgo
    }
  };
}

// ============================================================================
// UTILIDADES Y AYUDANTES (Helpers)
// ============================================================================

// Suma items dinámicamente (ej. 'item_1', 'item_2'...)
function sumItems(responses: any, prefix: string, count: number | string[]): number {
  if (Array.isArray(count)) {
    return count.reduce((sum, key) => sum + (parseInt(responses[key]) || 0), 0);
  }
  let total = 0;
  for (let i = 1; i <= (count as number); i++) {
    total += parseInt(responses[`${prefix}${i}`]) || 0;
  }
  return total;
}

// Suma valores directos de un objeto
function sumScalars(responses: any, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (parseInt(responses[key]) || 0), 0);
}

// Lógica específica de Vineland (0, 1, 2)
function calculateVinelandScore(responses: any, keys: string[]): number {
  return keys.reduce((sum, key) => {
    const val = responses[key];
    if (val === 'Usualmente' || val === 'Siempre' || val === '2') return sum + 2;
    if (val === 'A veces' || val === '1') return sum + 1;
    return sum; // 'Nunca' o '0' suma 0
  }, 0);
}

// Generador de descripciones textuales para puntajes
function getDescriptor(score: number, max: number): string {
  const percent = (score / max) * 100;
  if (percent < 33) return 'Bajo';
  if (percent < 66) return 'Medio';
  return 'Alto';
}