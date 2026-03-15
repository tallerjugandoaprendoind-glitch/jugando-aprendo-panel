// app/admin/data/competitiveForms.ts
// Formularios de nivel competitivo - Thread Learning / Central Reach level
// Basados en: DSM-5-TR, Principios de Conducta (Malott), IBAO Guidelines, LuTr

import { FormDefinition, FormSection } from './neurodivergentForms'

const FREQ = ['Never', 'Rarely (1-2/month)', 'Sometimes (1-2/week)', 'Frequently (3-4/week)', 'Almost always (daily)', 'Always (multiple times/day)']
const INTENSITY = ['Not applicable', 'Mild', 'Moderate', 'Intense', 'Very intense / debilitating']
const CONCERN = ['No concern', 'Mild', 'Moderate', 'Significant', 'Severe']
const NIVEL_INDEPENDENCIA = ['Does not perform / Total dependence', 'With full physical assistance', 'With partial physical assistance', 'With modeling', 'With verbal prompt', 'With cue or gesture', 'Independent with errors', 'Independent']

// ═══════════════════════════════════════════════════════════════════════════
// 1. FUNCTIONAL BEHAVIOR ASSESSMENT (FBA)
// Most important tool in ABA - Thread Learning has it, so do we
// ═══════════════════════════════════════════════════════════════════════════
export const EVALUACION_FUNCIONAL_CONDUCTA: FormDefinition = {
  id: 'fba',
  title: 'Functional Behavior Assessment (FBA)',
  subtitle: 'Analysis of the function of challenging behaviors',
  category: 'conductual',
  icon: '🔍',
  color: 'from-red-600 to-rose-700',
  targetRole: 'admin',
  estimatedMinutes: 35,
  description: 'Identifies the function of challenging behaviors to design evidence-based interventions (Malott, Ch. 18-22)',
  tags: ['FBA', 'Function', 'Behavior', 'ABA', 'Intervention'],
  sections: [
    {
      title: '🎯 Target Behavior Identification',
      description: 'Define la conducta de forma operacional (observable y medible)',
      questions: [
        { id: 'conducta_objetivo', label: 'Operational description of the behavior', type: 'textarea', required: true, placeholder: 'Describe exactamente qué hace el niño: movimientos específicos, vocalizaciones, duración aproximada. Ej: "Se tira al piso, patea con ambas piernas y grita con voz alta durante 2-10 minutos"', helpText: 'Una buena definición operacional describe TOPOGRAFÍA (cómo se ve), no intenciones' },
        { id: 'frecuencia_conducta', label: 'How often does the behavior occur?', type: 'select', options: FREQ, required: true },
        { id: 'duracion_episodio', label: 'Typical duration of each episode', type: 'select', options: ['Seconds (less than 1 min)', '1-5 minutes', '5-15 minutes', '15-30 minutes', 'More than 30 minutes', 'Variable'] },
        { id: 'intensidad_conducta', label: 'Typical intensity of the behavior', type: 'select', options: INTENSITY },
        { id: 'conductas_asociadas', label: 'Are there other behaviors that occur together with this one?', type: 'textarea', placeholder: 'Ej: Antes de tirar objetos, cierra los puños y aprieta los dientes...' },
        { id: 'riesgo_dano', label: '¿Representa riesgo de daño físico?', type: 'select', options: ['No', 'Risk to self (self-injury)', 'Risk to others', 'Risk to objects / environment', 'Multiple risks'] },
      ]
    },
    {
      title: '🌡️ Antecedents (A of ABC)',
      description: 'What happens BEFORE the behavior? Context, triggers, conditions',
      questions: [
        { id: 'contextos_ocurrencia', label: 'In which contexts/environments does it occur most?', type: 'multiselect', options: ['Sala de terapia', 'Casa', 'Escuela/aula', 'Lugares públicos', 'Transiciones', 'Hora de comida', 'Hora de dormir', 'Todos los contextos'] },
        { id: 'contextos_no_ocurrencia', label: '¿En qué contextos casi NUNCA ocurre?', type: 'multiselect', options: ['Jugando libremente', 'Con actividad preferida', 'Con persona específica', 'En silencio', 'En actividades 1:1', 'Después de ejercicio', 'Por la mañana', 'Por la tarde'] },
        { id: 'triggers_inmediatos', label: '¿Cuáles son los desencadenantes (triggers) más comunes?', type: 'multiselect', options: ['Instrucción o demanda', 'Transición entre actividades', 'Se acaba algo que le gusta', 'Otra persona recibe atención', 'Cambio en la rutina', 'Estimulación sensorial', 'Espera o demora', 'Interacción social no deseada', 'Tarea difícil', 'Frustración ante error'] },
        { id: 'condiciones_motivacionales', label: 'Motivating operations: what conditions increase the probability?', type: 'multiselect', options: ['Fatiga o sueño', 'Hambre', 'Dolor o malestar físico', 'Medicación (cambio o ausencia)', 'Estrés ambiental (ruido, luz)', 'Privación de reforzador preferido', 'Cambio en agenda o rutina', 'Interacción negativa previa'] },
        { id: 'sd_conducta', label: '¿Existe algún Sd (estímulo discriminativo) específico que casi siempre precede la conducta?', type: 'textarea', placeholder: 'Ej: Cuando el terapeuta saca el libro de trabajo, cuando dice "es hora de..."' },
        { id: 'tiempo_antes', label: '¿Cuánto tiempo transcurre entre el trigger y la conducta?', type: 'select', options: ['Inmediata (segundos)', '1-5 minutos', '5-15 minutos', 'Más de 15 minutos', 'Variable / sin patrón claro'] },
      ]
    },
    {
      title: '⚡ Consequences (C of ABC)',
      description: 'What happens AFTER the behavior? What maintains it?',
      questions: [
        { id: 'consecuencias_tipicas', label: '¿Qué sucede después de la conducta?', type: 'multiselect', options: ['Se termina la tarea/actividad (escape/evitación)', 'Recibe atención (positiva o negativa)', 'Obtiene objeto o actividad deseada', 'Lo ignoran completamente', 'Se le da tiempo fuera', 'Se redirige a otra actividad', 'Recibe corrección verbal', 'Nada cambia / sin consecuencia consistente'] },
        { id: 'quien_responde', label: '¿Quién responde a la conducta habitualmente?', type: 'multiselect', options: ['Terapeuta ABA', 'Madre/Padre', 'Maestro/a', 'Hermanos/as', 'Varios / inconsistente'] },
        { id: 'consistencia_consecuencias', label: 'Are consequences consistent across caregivers?', type: 'select', options: ['Sí - todos responden igual', 'Parcialmente - algunos sí, otros no', 'No - cada persona responde diferente', 'No se sabe'] },
        { id: 'efecto_conducta', label: 'Does the behavior achieve what it seems to seek?', type: 'select', options: ['Yes - generally achieves the goal', 'Sometimes - inconsistent results', 'Rarely - almost never works', 'No - never achieves anything apparent'] },
      ]
    },
    {
      title: '🧪 Functional Hypothesis',
      description: 'Based on A-B-C, what is the maintaining function of the behavior?',
      questions: [
        { id: 'hipotesis_funcion_primaria', label: 'Primary function hypothesis', type: 'select', required: true, options: ['Reforzamiento positivo - Atención social (obtener atención)', 'Reforzamiento positivo - Tangible (obtener objeto/actividad)', 'Reforzamiento negativo - Escape de demanda/tarea', 'Reforzamiento negativo - Escape sensorial / evitación', 'Reforzamiento automático - Estimulación sensorial (autoestimulación)', 'Reforzamiento automático - Reducción de malestar interno', 'Función mixta (combinación de las anteriores)', 'Función desconocida - se requiere más evaluación'] },
        { id: 'hipotesis_funcion_secundaria', label: '¿Existe una función secundaria?', type: 'select', options: ['No', 'Positive reinforcement - Attention', 'Positive reinforcement - Tangible', 'Negative reinforcement - Escape', 'Automatic reinforcement'] },
        { id: 'evidencia_hipotesis', label: 'Evidence supporting this hypothesis', type: 'textarea', placeholder: 'Describe the observed patterns that lead to this functional conclusion...', required: true },
        { id: 'confirmacion_metodo', label: 'Hypothesis confirmation method', type: 'select', options: ['Análisis descriptivo (ABC naturalistic)', 'Análisis funcional análogo (experimental)', 'Entrevista funcional (FAST/MAS)', 'Combinación de métodos', 'Pendiente de verificación'] },
        { id: 'declaracion_funcion', label: 'Complete functional statement', type: 'textarea', required: true, placeholder: 'In the presence of [Antecedent], [Name] exhibits [Behavior], and as a result obtains/escapes [Consequence], which increases the future probability of the behavior.' },
      ]
    },
    {
      title: '💪 Alternative Behaviors and Prerequisite Skills',
      questions: [
        { id: 'conducta_alternativa_funcion', label: '¿Existe una conducta alternativa que cumpla la misma función de forma apropiada?', type: 'textarea', placeholder: 'Ej: Puede pedir ayuda verbalmente, puede usar tarjeta "descanso", puede señalar lo que quiere...' },
        { id: 'habilidades_prerrequisito', label: '¿Qué habilidades necesita desarrollar para usar la conducta alternativa?', type: 'multiselect', options: ['Comunicación funcional (pedir, rechazar, comentar)', 'Tolerancia a la demora', 'Autorregulación emocional', 'Seguimiento de instrucciones', 'Transición entre actividades', 'Tolerancia a frustración', 'Habilidades cognitivas específicas'] },
        { id: 'nivel_comunicacion_actual', label: 'Nivel de comunicación funcional actual del niño', type: 'select', options: ['Pre-verbal / sin comunicación intencional', 'Comunicación gestual / señalamiento', 'Comunicación con pictogramas / PECS', 'Palabras aisladas (1-2 palabras)', 'Frases simples (2-3 palabras)', 'Oraciones completas', 'Comunicación verbal funcional compleja'] },
        { id: 'observaciones_fba', label: 'Additional evaluator observations', type: 'textarea', placeholder: 'Additional patterns, important contextual factors, overall clinical impression...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BEHAVIOR INTERVENTION PLAN (BIP)
// ═══════════════════════════════════════════════════════════════════════════
export const PLAN_INTERVENCION_CONDUCTUAL: FormDefinition = {
  id: 'bip',
  title: 'Behavior Intervention Plan (BIP)',
  subtitle: 'Intervention design based on FBA',
  category: 'conductual',
  icon: '📋',
  color: 'from-blue-600 to-indigo-700',
  targetRole: 'admin',
  estimatedMinutes: 40,
  description: 'Structured intervention plan for challenging behaviors, based on the function identified in the FBA',
  tags: ['BIP', 'Intervention', 'Plan', 'ABA', 'Reduction'],
  sections: [
    {
      title: '📌 Target Behavior and Function',
      questions: [
        { id: 'conducta_bip', label: 'Target behavior (operational definition)', type: 'textarea', required: true, placeholder: 'Copia o resume la definición operacional del FBA' },
        { id: 'funcion_bip', label: 'Identified function (from FBA)', type: 'select', required: true, options: ['Social attention', 'Tangible (object/activity)', 'Escape from demand', 'Sensory escape', 'Automatic stimulation', 'Discomfort reduction', 'Mixed'] },
        { id: 'meta_reduccion', label: 'Reduction goal', type: 'textarea', required: true, placeholder: 'Ej: Reducir la conducta de rabietas de una frecuencia de 5/día a 1/día en un período de 8 semanas, con criterio de mantenimiento de 1 mes' },
      ]
    },
    {
      title: '🛡️ Antecedent Strategies (Prevention)',
      description: 'Modificaciones al ambiente ANTES de que ocurra la conducta',
      questions: [
        { id: 'modificaciones_ambiente', label: '¿Qué cambios al ambiente físico se implementarán?', type: 'multiselect', options: ['Reducir estímulos distractores', 'Zona de trabajo estructurada', 'Señales visuales (agenda, temporizador)', 'Acceso anticipado al reforzador', 'Asiento preferencial', 'Espacio de descanso disponible', 'Materiales organizados visualmente'] },
        { id: 'first_then', label: '¿Se usará First-Then (Primero-Luego)?', type: 'select', options: ['Sí - pictogramas', 'Sí - verbal', 'Sí - pizarra/tablero', 'No aplica'] },
        { id: 'aviso_previo', label: 'Will advance warning be given before transitions?', type: 'select', options: ['Sí - 5 minutos de anticipación', 'Sí - verbal + timer', 'Sí - señal visual', 'Depende del contexto', 'No aplica'] },
        { id: 'demandas_graduadas', label: 'Will the difficulty of demands be adjusted?', type: 'textarea', placeholder: 'Ej: Iniciar con tareas de alta probabilidad antes de tareas difíciles (high-p sequence)' },
        { id: 'om_estrategias', label: 'Strategies for motivating operations', type: 'textarea', placeholder: 'Ej: Asegurar descanso previo, ofrecer snack antes de sesiones exigentes, permitir acceso libre a reforzador antes de trabajo...' },
      ]
    },
    {
      title: '🗣️ Replacement Strategies (Teaching)',
      description: 'Teach an alternative behavior that serves the same function',
      questions: [
        { id: 'conducta_reemplazo', label: 'Replacement behavior to teach', type: 'textarea', required: true, placeholder: 'Ej: Enseñar a pedir "descanso" con tarjeta PECS o palabra, que tenga la misma función de escape que la rabieta' },
        { id: 'metodo_ensenanza', label: 'Método de enseñanza de la conducta de reemplazo', type: 'multiselect', options: ['Ensayo discreto (DTT)', 'Enseñanza en ambiente natural (NET)', 'PECS (Sistema de comunicación por intercambio)', 'MAND training (entrenamiento de mando)', 'Modelado + imitación', 'Video modeling', 'Role-play'] },
        { id: 'prompt_strategy', label: 'Estrategia de ayuda (prompting)', type: 'select', options: ['Most-to-least (de más a menos ayuda)', 'Least-to-most (de menos a más ayuda)', 'Prompt de posición', 'Modelado', 'Prompt verbal + físico simultáneo'] },
        { id: 'reforzamiento_reemplazo', label: 'What reinforcer will be used for the replacement behavior?', type: 'textarea', required: true, placeholder: 'El MISMO reforzador que mantiene la conducta problemática debe ser accesible vía conducta apropiada' },
      ]
    },
    {
      title: '📉 Consequence Strategies for Problem Behavior',
      description: 'What to do AFTER the behavior occurs (based on extinction + DRA/DRO)',
      questions: [
        { id: 'procedimiento_extincion', label: 'Extinction procedure', type: 'textarea', required: true, placeholder: 'Basado en la función: si es escape → no quitar la demanda, si es atención → retirar atención, si es tangible → no dar objeto...' },
        { id: 'dra_dro', label: 'Will DRA, DRO, or DRI be used?', type: 'select', options: ['DRA - Reforzamiento diferencial de conducta alternativa', 'DRO - Reforzamiento de ausencia de conducta', 'DRI - Reforzamiento de conducta incompatible', 'Combinación DRA + DRO', 'No aplica en esta fase'] },
        { id: 'safety_response', label: 'Si hay riesgo de daño, ¿cómo se procede?', type: 'textarea', placeholder: 'Protocolo de seguridad: qué personas intervienen, cómo, cuándo se detiene la sesión...' },
        { id: 'crisis_plan', label: '¿Existe plan de crisis documentado?', type: 'select', options: ['Sí - adjunto en expediente', 'Sí - en elaboración', 'No requerido', 'Pendiente'] },
      ]
    },
    {
      title: '📊 Monitoring and Success Criteria',
      questions: [
        { id: 'metodo_medicion', label: 'Behavior measurement method', type: 'select', required: true, options: ['Frecuencia (conteo de ocurrencias)', 'Duración (tiempo total)', 'Latencia (tiempo hasta inicio)', 'Tasa (ocurrencias por tiempo)', 'Intervalo parcial', 'Intervalo completo', 'Momentary time sampling'] },
        { id: 'criterio_exito_bip', label: 'BIP success criterion', type: 'textarea', required: true, placeholder: 'Ej: Reducir de 5 rabietas/día a 1 o menos/día en 3 semanas consecutivas, con mantenimiento de 4 semanas' },
        { id: 'revision_bip', label: '¿Cada cuánto se revisará el plan?', type: 'select', options: ['Cada semana', 'Cada 2 semanas', 'Cada mes', 'Cada 6 semanas', 'Al alcanzar criterio parcial'] },
        { id: 'responsables_bip', label: 'Who will implement the plan?', type: 'multiselect', options: ['Terapeuta ABA principal', 'Terapeuta de soporte', 'Padres en casa', 'Maestro en escuela', 'Todos los adultos significativos'] },
        { id: 'capacitacion_requerida', label: '¿Se requiere capacitación a padres/maestros?', type: 'select', options: ['Sí - capacitación formal programada', 'Sí - seguimiento de modelo', 'Parcial - refuerzo de estrategias', 'No - ya conocen el plan', 'Pendiente de evaluación'] },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. IEP GOALS / INDIVIDUAL INTERVENTION PLAN
// ═══════════════════════════════════════════════════════════════════════════
export const OBJETIVOS_IEP: FormDefinition = {
  id: 'iep',
  title: 'Individual Intervention Plan (IEP/IIP)',
  subtitle: 'Annual functional goals with progress metrics',
  category: 'seguimiento',
  icon: '🗺️',
  color: 'from-indigo-600 to-violet-700',
  targetRole: 'admin',
  estimatedMinutes: 45,
  description: 'Master document of annual therapeutic goals with measurable mastery criteria, per IBAO standards',
  tags: ['IEP', 'Goals', 'Plan', 'Annual', 'Targets'],
  sections: [
    {
      title: '📊 Current Performance Level (Present Levels)',
      description: 'Baseline: where the child is TODAY in each area',
      questions: [
        { id: 'nivel_comunicacion', label: 'Communication and Language - current level', type: 'textarea', required: true, placeholder: 'Ej: Utiliza 50 palabras aproximadas, combina 2 palabras ocasionalmente, comprende instrucciones de 1 paso consistentemente...' },
        { id: 'nivel_social', label: 'Social Skills - current level', type: 'textarea', placeholder: 'Ej: Juego paralelo con pares, responde a nombre 80% en ambiente 1:1, iniciación social ausente...' },
        { id: 'nivel_autonomia', label: 'Autonomy and Daily Living - current level', type: 'textarea', placeholder: 'E.g.: Eats alone with spoon under supervision, requires partial dressing assistance, toilet training in progress...' },
        { id: 'nivel_cognitivo', label: 'Cognitive and Academic Skills - current level', type: 'textarea', placeholder: 'Ej: Matching de colores y formas básicas, secuencia de 3 imágenes, conteo 1-5 con apoyo...' },
        { id: 'nivel_conductual', label: 'Behavior and Emotional Regulation - current level', type: 'textarea', placeholder: 'Ej: 3-5 rabietas/semana, duración 5-15 min, función escape, conductas de autoestimulación 40% del tiempo...' },
        { id: 'fortalezas_principales', label: 'Strengths and motivational areas', type: 'textarea', required: true, placeholder: 'Ej: Alta motivación por vehículos y música, excelente memoria visual, buen seguimiento de rutinas predecibles...' },
      ]
    },
    {
      title: '🎯 Area 1: Communication and Language',
      questions: [
        { id: 'obj_com_1_lp', label: 'Annual communication goal', type: 'textarea', placeholder: 'Al final del año, [Nombre] podrá... [conducta] en [condiciones] con [criterio de dominio]' },
        { id: 'obj_com_1_cp1', label: 'Short-term goal 1 (quarter 1)', type: 'textarea', placeholder: 'Measurable goal for the first 3 months...' },
        { id: 'obj_com_1_cp2', label: 'Short-term goal 2 (quarter 2)', type: 'textarea', placeholder: '' },
        { id: 'obj_com_metodo', label: 'Communication intervention strategies', type: 'multiselect', options: ['MAND training (verbal behavior)', 'PECS (Phase I-VI)', 'AAC / Dispositivo de comunicación', 'Terapia de lenguaje ABA', 'Incidental teaching', 'PRT (Pivotal Response Training)'] },
      ]
    },
    {
      title: '🎯 Area 2: Behavior and Regulation',
      questions: [
        { id: 'obj_cond_1_lp', label: 'Annual behavior/regulation goal', type: 'textarea', placeholder: '' },
        { id: 'obj_cond_1_cp1', label: 'Short-term goal 1', type: 'textarea', placeholder: '' },
        { id: 'obj_cond_estrategia', label: 'Primary behavioral strategy', type: 'select', options: ['DRA (Reforzamiento diferencial de alternativa)', 'DRO (Reforzamiento de ausencia)', 'Economía de fichas', 'Extinción planificada', 'Costo de respuesta', 'Enseñanza de regulación emocional', 'Social Stories', 'Power Cards'] },
      ]
    },
    {
      title: '🎯 Area 3: Social Skills',
      questions: [
        { id: 'obj_social_lp', label: 'Annual social skills goal', type: 'textarea', placeholder: '' },
        { id: 'obj_social_cp1', label: 'Short-term goal 1', type: 'textarea', placeholder: '' },
        { id: 'obj_social_metodo', label: 'Strategies', type: 'multiselect', options: ['Social Skills Groups', 'Peer-mediated intervention', 'Video modeling', 'Social Stories', 'PEERS curriculum', 'Role play estructurado'] },
      ]
    },
    {
      title: '🎯 Area 4: Autonomy and Daily Living',
      questions: [
        { id: 'obj_autonomia_lp', label: 'Annual autonomy goal', type: 'textarea', placeholder: '' },
        { id: 'obj_autonomia_cp1', label: 'Short-term goal 1', type: 'textarea', placeholder: '' },
        { id: 'obj_autonomia_metodo', label: 'Strategies', type: 'multiselect', options: ['Task analysis (análisis de tarea)', 'Chaining (encadenamiento hacia adelante)', 'Backward chaining (encadenamiento hacia atrás)', 'Video prompting', 'Guías visuales / pictogramas', 'Horarios estructurados'] },
      ]
    },
    {
      title: '📋 Services and Team',
      questions: [
        { id: 'horas_aba_semana', label: 'Weekly ABA therapy hours', type: 'select', options: ['5-10 hours', '10-15 hours', '15-20 hours', '20-25 hours', '25-30 hours', 'More than 30 hours'] },
        { id: 'servicios_adicionales', label: 'Additional services', type: 'multiselect', options: ['Speech therapy', 'Occupational therapy', 'Physical therapy', 'School support', 'Social skills groups', 'Psychotherapy', 'Parent support'] },
        { id: 'equipo_intervencion', label: 'Intervention team members', type: 'multiselect', options: ['Analista de conducta (IBA)', 'Terapeuta de conducta (IBT)', 'Terapeuta de lenguaje', 'Terapeuta ocupacional', 'Maestro de educación especial', 'Psicólogo', 'Padres / cuidadores'] },
        { id: 'revision_iep', label: 'Next IEP review', type: 'select', options: ['In 3 months', 'In 6 months', 'In 1 year', 'Based on clinical progress'] },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. LANGUAGE AND COMMUNICATION ASSESSMENT (VB-MAPP / Verbal Behavior)
// ═══════════════════════════════════════════════════════════════════════════
export const EVALUACION_LENGUAJE_VERBAL: FormDefinition = {
  id: 'lenguaje_verbal',
  title: 'Verbal Behavior Assessment (VB-MAPP adapted)',
  subtitle: 'Language and communication skills profile',
  category: 'habilidades',
  icon: '🗣️',
  color: 'from-teal-500 to-cyan-600',
  targetRole: 'admin',
  estimatedMinutes: 30,
  description: 'Evaluates verbal operants (mand, tact, echoic, intraverbal) to design ABA communication programs',
  tags: ['Language', 'VB-MAPP', 'Verbal Behavior', 'Communication', 'Mand'],
  sections: [
    {
      title: '🎤 Mando (Solicitudes / Requests)',
      description: 'Capacidad de pedir lo que necesita o desea',
      questions: [
        { id: 'mando_nivel', label: 'Nivel de mando actual', type: 'select', required: true, options: NIVEL_INDEPENDENCIA },
        { id: 'mando_modalidad', label: 'Primary request modality', type: 'select', options: ['No tiene solicitudes funcionales', 'Llanto / vocalizaciones no dirigidas', 'Jalar la mano / guiar físicamente', 'Señalamiento', 'Alcance + contacto ocular', 'Pictogramas / PECS', 'Signos / LSP', 'Palabras aisladas (1 palabra)', 'Frases (2+ palabras)', 'Oraciones completas'] },
        { id: 'mando_variedad', label: '¿Cuántas solicitudes diferentes hace aprox.?', type: 'select', options: ['0-5 tipos de solicitudes', '5-20 tipos', '20-50 tipos', '50-100 tipos', 'Más de 100 tipos / ilimitadas'] },
        { id: 'mando_contexto', label: '¿En qué contextos hace solicitudes?', type: 'multiselect', options: ['Solo con personas muy conocidas', 'Con cualquier adulto familiar', 'En sesión de terapia', 'En casa', 'En escuela', 'En público', 'En todos los contextos'] },
        { id: 'mando_espontaneo', label: '¿Hace solicitudes espontáneas (sin prompt)?', type: 'select', options: ['Nunca espontáneo - requiere prompt', 'Ocasionalmente espontáneo', 'Frecuentemente espontáneo', 'Casi siempre espontáneo'] },
      ]
    },
    {
      title: '👁️ Tact (Labeling)',
      description: 'Capacidad de nombrar o etiquetar lo que ve, escucha, toca',
      questions: [
        { id: 'tacto_objetos', label: 'Nombra objetos (táctos de objetos)', type: 'select', options: ['0 objects', '1-10 objects', '10-50 objects', '50-100 objects', '100-200 objects', 'More than 200 objects'] },
        { id: 'tacto_acciones', label: 'Names actions (verbs)', type: 'select', options: ['None', '1-10 actions', '10-50 actions', 'More than 50 actions'] },
        { id: 'tacto_atributos', label: 'Names attributes (colors, sizes, shapes)', type: 'multiselect', options: ['Basic colors (3+)', 'Basic shapes', 'Sizes (big/small)', 'Textures', 'Basic emotions in photos', 'Body parts (10+)', 'Animals (10+)', 'Foods (10+)'] },
        { id: 'tacto_funcion', label: 'Nombra por función o característica', type: 'select', options: ['No nombra por función', 'Lo hace con prompt', 'Lo hace espontáneamente con algunos', 'Lo hace espontáneamente con muchos'] },
      ]
    },
    {
      title: '👂 Listener / Comprehension',
      description: 'What the child understands and follows',
      questions: [
        { id: 'comprension_instrucciones', label: 'Level of instructions followed', type: 'select', required: true, options: ['No sigue instrucciones verbales', 'Instrucciones de 1 paso con gestos', 'Instrucciones de 1 paso solo verbales', 'Instrucciones de 2 pasos', 'Instrucciones de 3+ pasos', 'Instrucciones complejas / condicionales'] },
        { id: 'comprension_vocabulario', label: 'Discrimina vocabulario (apunta a..., toca...)', type: 'select', options: ['0-10 words', '10-50 words', '50-100 words', '100-200 words', 'More than 200 words'] },
        { id: 'comprension_grupo', label: 'Follows instructions in group (not only 1:1)', type: 'select', options: ['Solo en 1:1 (no en grupo)', 'Con su nombre mencionado', 'En grupo pequeño (3-5 personas)', 'En grupo grande (clase)'] },
      ]
    },
    {
      title: '🔄 Intraverbal and Conversation',
      description: 'Conversation, questions, sentence completion',
      questions: [
        { id: 'intraverbal_nivel', label: 'Intraverbal response level', type: 'select', options: ['No responde a preguntas verbales', 'Responde a "¿Cómo te llamas?"', 'Responde ¿qué? y ¿quién? sobre objetos', 'Completa frases conocidas ("Sol, luna y...")', 'Responde preguntas sobre actividades', 'Conversación bidireccional básica (3-5 turnos)', 'Conversación sostenida con temas variados'] },
        { id: 'ecoico', label: 'Ecoico: ¿Repite palabras al ser pedido?', type: 'select', options: ['No imita sonidos ni palabras', 'Imita vocales aisladas', 'Imita consonantes + vocales (CV)', 'Imita palabras de 1 sílaba', 'Imita palabras de 2 sílabas', 'Imita palabras de 3+ sílabas', 'Imita oraciones cortas'] },
        { id: 'juego_simbolico', label: 'Symbolic / imaginative play', type: 'select', options: ['No hay juego simbólico', 'Juego funcional (objetos con función real)', 'Juego simbólico simple (hace "como si")', 'Juego simbólico elaborado', 'Juego sociodramático con pares'] },
      ]
    },
    {
      title: '📋 Summary and Recommendations',
      questions: [
        { id: 'nivel_vb_global', label: 'Global verbal development level (VB-MAPP adapted)', type: 'select', required: true, options: ['Nivel 1 (0-18 meses equiv.) - prerrequisitos y primeras palabras', 'Nivel 2 (18-30 meses equiv.) - expansión de vocabulario', 'Nivel 3 (30-48 meses equiv.) - conversación básica', 'Por encima de nivel 3 - habilidades lingüísticas funcionales'] },
        { id: 'barreras_lenguaje', label: 'Main barriers to language learning', type: 'multiselect', options: ['Déficit motivacional / escasa motivación', 'Conductas de interferencia (autoestimulación)', 'Déficit sensorial (auditivo)', 'Dificultades motoras del habla (apraxia)', 'Escasa imitación motora (prerrequisito)', 'Falta de contacto visual', 'Rigidez / inflexibilidad'] },
        { id: 'prioridad_intervencion_lenguaje', label: 'Priority intervention area in language', type: 'select', required: true, options: ['MAND training (enseñar a pedir)', 'Ecoico (imitación vocal)', 'Tácto (nombrar)', 'Oyente (comprensión)', 'Intraverbal (conversación)', 'Todas por igual', 'Evaluación adicional necesaria'] },
        { id: 'observaciones_lenguaje', label: 'Evaluator observations', type: 'textarea', placeholder: 'Notas adicionales sobre el perfil de comunicación, factores contextuales, recomendaciones específicas...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. MONTHLY PROGRESS REPORT (for parents and supervisors)
// ═══════════════════════════════════════════════════════════════════════════
export const INFORME_PROGRESO_MENSUAL: FormDefinition = {
  id: 'informe_mensual_prog',
  title: 'Monthly Progress Report',
  subtitle: 'Clinical progress report for parents and supervisor',
  category: 'seguimiento',
  icon: '📈',
  color: 'from-emerald-500 to-teal-600',
  targetRole: 'admin',
  estimatedMinutes: 20,
  description: 'Monthly progress report with objective data, clinical analysis and family communication',
  tags: ['Mensual', 'Progreso', 'Informe', 'Reporte', 'Familia'],
  sections: [
    {
      title: '📊 ABA Program Progress',
      questions: [
        { id: 'programas_en_progreso', label: 'Programs worked on this month', type: 'textarea', required: true, placeholder: 'Lista los programas, el % de éxito inicial y final del mes, y el estado actual...' },
        { id: 'programas_dominados', label: 'Did any program reach mastery criterion?', type: 'textarea', placeholder: 'Program name and mastery date...' },
        { id: 'programas_nuevos', label: 'Were new programs started?', type: 'textarea', placeholder: 'Programa nuevo + justificación clínica...' },
        { id: 'tendencia_general', label: 'Tendencia general de progreso del mes', type: 'select', required: true, options: ['Consistent progress in all programs', 'Progress in most programs', 'Mixed progress (some advance, others do not)', 'General stagnation', 'Regression in some programs', 'Significant regression'] },
      ]
    },
    {
      title: '🧠 Behavior and Regulation',
      questions: [
        { id: 'conductas_desafiantes_mes', label: 'Challenging behaviors this month', type: 'textarea', placeholder: 'Frequency, intensity, changes compared to previous month...' },
        { id: 'estrategias_efectivas', label: 'Estrategias que fueron efectivas', type: 'textarea', placeholder: 'Qué funcionó bien para manejar conductas o promover el aprendizaje...' },
        { id: 'ajustes_realizados', label: 'Ajustes realizados a los programas o estrategias', type: 'textarea', placeholder: 'Cambios de reforzadores, modificaciones de procedimientos, cambios de fase...' },
      ]
    },
    {
      title: '🏠 Generalization and Family Collaboration',
      questions: [
        { id: 'generalizacion', label: '¿Ha generalizado habilidades fuera de la sesión?', type: 'textarea', placeholder: 'En casa, escuela, comunidad... qué habilidades aplicó de forma espontánea...' },
        { id: 'participacion_familia', label: 'Participación y adherencia de la familia', type: 'select', options: ['Excellent - implement strategies consistently', 'Good - most of the time', 'Fair - needs more support and follow-up', 'Difficult - significant barriers', 'No data available'] },
        { id: 'necesidades_familia', label: 'What does the family need this month?', type: 'multiselect', options: ['Capacitación en nuevas estrategias', 'Apoyo emocional y psicoeducación', 'Coordinación con escuela', 'Ajuste de actividades en casa', 'Reunión de seguimiento', 'Sin necesidades urgentes'] },
      ]
    },
    {
      title: '🗺️ Plan for Next Month',
      questions: [
        { id: 'objetivos_proximo_mes', label: 'Goals for next month', type: 'textarea', required: true, placeholder: 'What is expected to be achieved, which programs will be prioritized...' },
        { id: 'ajustes_plan', label: 'Will the intervention plan be modified?', type: 'select', options: ['No - se continúa según IEP', 'Sí - ajuste menor de estrategias', 'Sí - nuevo programa(s) a agregar', 'Sí - revisión mayor del IEP requerida', 'Consulta a supervisor/equipo necesaria'] },
        { id: 'recomendaciones_padres', label: 'Specific recommendations for parents this month', type: 'textarea', required: true, placeholder: 'Actividades concretas, estrategias a practicar, qué observar y registrar...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. ADAPTIVE SKILLS ASSESSMENT (complements Vineland)
// ═══════════════════════════════════════════════════════════════════════════
export const HABILIDADES_ADAPTATIVAS: FormDefinition = {
  id: 'habilidades_adaptativas',
  title: 'Adaptive Skills Assessment',
  subtitle: 'Daily living functioning and autonomy',
  category: 'habilidades',
  icon: '🌟',
  color: 'from-amber-500 to-yellow-600',
  targetRole: 'admin',
  estimatedMinutes: 25,
  description: 'Evaluates daily living skills, self-care and adaptive functioning (complements Vineland-3)',
  tags: ['Adaptive', 'Autonomy', 'Daily living', 'Self-care', 'DSM-5'],
  sections: [
    {
      title: '🍽️ Feeding',
      questions: [
        { id: 'come_solo', label: 'Eats independently', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'uso_utensilios', label: 'Use of utensils (spoon, fork)', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'variedad_alimentos', label: 'Dietary variety', type: 'select', options: ['Very restricted (1-5 foods)', 'Restricted (5-15 foods)', 'Moderate (15-30 foods)', 'Broad (no significant restrictions)'] },
        { id: 'conductas_alimentacion', label: 'Problematic feeding behaviors', type: 'multiselect', options: ['Ninguna', 'Rechazo de texturas', 'Rechazo de colores/presentación', 'Conductas de escupir', 'Masticación problemática', 'Arcadas / náuseas', 'Comer solo alimentos de marca específica'] },
      ]
    },
    {
      title: '🚿 Hygiene and Self-Care',
      questions: [
        { id: 'control_esfinteres', label: 'Toilet training', type: 'select', options: ['Sin control (pañal)', 'En entrenamiento - accidentes frecuentes', 'Parcial - mayoría del tiempo seco', 'Controlado con recordatorios', 'Control independiente diurno', 'Control independiente diurno y nocturno'] },
        { id: 'lavado_manos', label: 'Handwashing', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'cepillado_dientes', label: 'Tooth brushing', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'bano', label: 'Bath / shower', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'vestido', label: 'Dressing / undressing', type: 'select', options: NIVEL_INDEPENDENCIA },
        { id: 'calzado', label: 'Ponerse y quitarse calzado', type: 'select', options: NIVEL_INDEPENDENCIA },
      ]
    },
    {
      title: '🏠 Home and Community',
      questions: [
        { id: 'desplazamiento_casa', label: 'Se desplaza seguro dentro de casa', type: 'select', options: ['Requiere supervisión constante', 'Supervisión cercana', 'Supervisión a distancia', 'Independiente en casa'] },
        { id: 'seguridad_hogar', label: '¿Comprende normas básicas de seguridad?', type: 'multiselect', options: ['Does not open dangerous doors/windows', 'Does not touch outlets/cables', 'Does not climb high surfaces unsupervised', 'Understands "hot" and "danger"', 'None of the above'] },
        { id: 'uso_comunidad', label: 'Can go to community places?', type: 'select', options: ['No tolera salidas a la comunidad', 'Tolera salidas cortas con apoyo', 'Tolera actividades en comunidad con supervisión', 'Participación activa en comunidad con adulto', 'Desplazamiento parcialmente autónomo'] },
        { id: 'manejo_dinero', label: 'Manejo básico de dinero/transacciones', type: 'select', options: ['No aplica por edad', 'No hay comprensión del dinero', 'Reconoce monedas/billetes', 'Transacciones simples con apoyo', 'Transacciones autónomas simples'] },
      ]
    },
    {
      title: '💤 Sleep and Routines',
      questions: [
        { id: 'patron_sueno', label: 'Sleep pattern', type: 'select', options: ['Sin problemas de sueño', 'Dificultad para iniciar sueño', 'Despertares nocturnos frecuentes', 'Muy temprano (antes de 5am)', 'Horario irregular', 'Requiere adulto para dormirse'] },
        { id: 'horas_sueno', label: 'Hours of sleep per night (approx)', type: 'select', options: ['Less than 7 hours', '7-8 hours', '8-9 hours', '9-10 hours', '10-11 hours', 'More than 11 hours'] },
        { id: 'seguimiento_rutinas', label: 'Follows structured routines?', type: 'select', options: ['No sigue rutinas / muy disruptivo con cambios', 'Sigue rutinas con estructura muy rígida', 'Sigue rutinas con algunos apoyos visuales', 'Sigue rutinas con recordatorios verbales', 'Sigue rutinas de forma independiente'] },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. ADVANCED SENSORY PROFILE ASSESSMENT (for ASD/SPD)
// ═══════════════════════════════════════════════════════════════════════════
export const PERFIL_SENSORIAL_AVANZADO: FormDefinition = {
  id: 'sensorial_avanzado',
  title: 'Advanced Sensory Profile (Dunn adapted)',
  subtitle: 'Detailed sensory processing assessment',
  category: 'sensorial',
  icon: '🌀',
  color: 'from-violet-600 to-purple-700',
  targetRole: 'admin',
  estimatedMinutes: 25,
  description: 'Complete assessment of 8 sensory systems with processing profile per Dunn model (1997)',
  tags: ['Sensory', 'SPD', 'Dunn', 'ASD', 'Sensory integration'],
  sections: [
    {
      title: '👀 Visual Processing',
      questions: [
        { id: 'vis_sensible', label: '¿Le molestan luces brillantes o espacios muy iluminados?', type: 'frequency', options: FREQ },
        { id: 'vis_busca', label: 'Intensely watches objects that move or spin?', type: 'frequency', options: FREQ },
        { id: 'vis_distracto', label: '¿Se distrae visualmente con movimientos en el ambiente?', type: 'frequency', options: FREQ },
        { id: 'vis_perder', label: '¿Pierde su lugar al leer o seguir texto?', type: 'frequency', options: FREQ },
      ]
    },
    {
      title: '👂 Auditory Processing',
      questions: [
        { id: 'aud_ruidos', label: '¿Se angustia o protege los oídos ante ruidos cotidianos (secador, licuadora)?', type: 'frequency', options: FREQ },
        { id: 'aud_busca', label: 'Actively seeks loud sounds or produces them?', type: 'frequency', options: FREQ },
        { id: 'aud_no_responde', label: 'Seems not to hear when spoken to directly?', type: 'frequency', options: FREQ },
        { id: 'aud_ambiente', label: 'Has difficulty in environments with a lot of background noise?', type: 'frequency', options: FREQ },
      ]
    },
    {
      title: '✋ Tactile Processing',
      questions: [
        { id: 'tac_texturas', label: 'Avoids specific textures in clothing, food, or surfaces?', type: 'frequency', options: FREQ },
        { id: 'tac_contacto', label: '¿Se angustia con el contacto físico inesperado?', type: 'frequency', options: FREQ },
        { id: 'tac_busca', label: '¿Busca activamente experiencias táctiles (toca todo, se mancha)?', type: 'frequency', options: FREQ },
        { id: 'tac_temperatura', label: 'Shows indifference to cold, heat, or pain?', type: 'frequency', options: FREQ },
        { id: 'tac_higiene', label: '¿Resistencia al corte de uñas, peinado o lavado de cabello?', type: 'frequency', options: FREQ },
      ]
    },
    {
      title: '🏃 Proprioceptive and Vestibular Processing',
      questions: [
        { id: 'prop_busca', label: '¿Busca presión profunda (abrazos fuertes, aplastarse contra objetos)?', type: 'frequency', options: FREQ },
        { id: 'prop_fuerza', label: 'Uses excessive force when grabbing objects or people?', type: 'frequency', options: FREQ },
        { id: 'vest_movimiento', label: 'Actively seeks movement (swings, spinning, bouncing)?', type: 'frequency', options: FREQ },
        { id: 'vest_mareo', label: 'Gets dizzy easily with normal movements?', type: 'frequency', options: FREQ },
        { id: 'vest_evita', label: '¿Evita actividades que requieran dejar los pies del suelo?', type: 'frequency', options: FREQ },
      ]
    },
    {
      title: '👃 Olfato y Gusto (Interoceptivos)',
      questions: [
        { id: 'olfato_sensible', label: 'Reacts strongly to smells others do not notice?', type: 'frequency', options: FREQ },
        { id: 'gusto_restriccion', label: 'Has food restrictions based on taste/texture?', type: 'frequency', options: FREQ },
        { id: 'interocepcion', label: 'Has difficulty identifying internal sensations (hunger, thirst, need to use the bathroom)?', type: 'frequency', options: FREQ },
      ]
    },
    {
      title: '📊 Functional Impact',
      questions: [
        { id: 'impacto_aprendizaje', label: 'Impacto en el aprendizaje y atención', type: 'select', options: CONCERN },
        { id: 'impacto_social_sens', label: 'Impact on social interactions', type: 'select', options: CONCERN },
        { id: 'impacto_avd', label: 'Impact on daily living activities', type: 'select', options: CONCERN },
        { id: 'patron_sensorial', label: 'Predominant sensory pattern', type: 'select', required: true, options: ['Registro bajo (hiposensibilidad general)', 'Buscador sensorial (seeker)', 'Sensibilidad sensorial (hipersensibilidad)', 'Evitador sensorial', 'Perfil mixto', 'Sin patrón claro - variado'] },
        { id: 'recomendaciones_ot', label: 'Recommendations for occupational therapy / sensory strategies', type: 'textarea', placeholder: 'Qué tipo de dieta sensorial, adaptaciones de ambiente, estrategias de autorregulación...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. ENHANCED ABC BEHAVIOR RECORD (with integrated function analysis)
// ═══════════════════════════════════════════════════════════════════════════
export const REGISTRO_ABC_AVANZADO: FormDefinition = {
  id: 'abc_avanzado',
  title: 'Advanced ABC Record + Function',
  subtitle: 'Antecedent → Behavior → Consequence with functional analysis',
  category: 'conductual',
  icon: '📊',
  color: 'from-orange-500 to-amber-600',
  targetRole: 'admin',
  estimatedMinutes: 10,
  description: 'ABC observational record with integrated function analysis for systematic behavioral data collection',
  tags: ['ABC', 'Record', 'Function', 'Observation', 'Data'],
  sections: [
    {
      title: '🕐 Episode Context',
      questions: [
        { id: 'fecha_abc', label: 'Approximate date and time', type: 'text', placeholder: 'Ej: 15 marzo, 10:30am' },
        { id: 'lugar', label: 'Location', type: 'select', options: ['Sala de terapia', 'Casa - sala', 'Casa - comedor', 'Casa - cuarto', 'Escuela - aula', 'Escuela - recreo', 'Comunidad / externo', 'Otro'] },
        { id: 'actividad_en_curso', label: 'Ongoing activity', type: 'text', placeholder: 'E.g.: table work, free time, lunch, transition...' },
        { id: 'personas_presentes', label: 'People present', type: 'multiselect', options: ['Only with therapist', 'With mother/father', 'With siblings', 'With peers/classmates', 'In group', 'Alone'] },
      ]
    },
    {
      title: 'A — Antecedent',
      questions: [
        { id: 'antecedente_especifico', label: 'What happened just before the behavior?', type: 'textarea', required: true, placeholder: 'Describe en detalle qué ocurrió en los 1-2 minutos antes de la conducta...' },
        { id: 'tipo_antecedente', label: 'Antecedent type', type: 'select', options: ['Direct instruction or demand', 'End of preferred activity', 'Transition', 'Attention directed to another person', 'Waiting or delay', 'Sensory stimulation', 'Peer-initiated social interaction', 'No clear antecedent / spontaneous behavior'] },
      ]
    },
    {
      title: 'B — Behavior',
      questions: [
        { id: 'conducta_observada', label: 'Operational description of the behavior', type: 'textarea', required: true, placeholder: 'Describe exactly what the child did: topography, approximate duration, intensity...' },
        { id: 'duracion_episodio_abc', label: 'Episode duration', type: 'select', options: ['Seconds', '1-5 minutes', '5-15 minutes', '15-30 minutes', 'More than 30 minutes'] },
        { id: 'intensidad_episodio', label: 'Intensity', type: 'select', options: INTENSITY },
      ]
    },
    {
      title: 'C — Consequence',
      questions: [
        { id: 'consecuencia_inmediata', label: 'What happened immediately after?', type: 'textarea', required: true, placeholder: 'Describe exactly the adult response and the outcome for the child...' },
        { id: 'tipo_consecuencia', label: 'Consequence type', type: 'select', options: ['Se retiró la demanda / escape concedido', 'Se dio atención al niño (aunque negativa)', 'Se le dio lo que pedía (tangible)', 'Fue ignorado / sin consecuencia social', 'Tiempo fuera', 'Redirección', 'Corrección verbal', 'Restricción física', 'Consecuencia inconsistente'] },
        { id: 'funcion_hipotesis_abc', label: 'Function hypothesis (this episode)', type: 'select', required: true, options: ['Social attention', 'Tangible (object/activity)', 'Escape from demand', 'Automatic stimulation', 'Multiple', 'Unknown'] },
        { id: 'notas_abc', label: 'Additional observer notes', type: 'textarea', placeholder: 'Contextual factors, observed motivating operations, variations from previous episodes...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
export const COMPETITIVE_FORMS: FormDefinition[] = [
  EVALUACION_FUNCIONAL_CONDUCTA,
  PLAN_INTERVENCION_CONDUCTUAL,
  OBJETIVOS_IEP,
  EVALUACION_LENGUAJE_VERBAL,
  INFORME_PROGRESO_MENSUAL,
  HABILIDADES_ADAPTATIVAS,
  PERFIL_SENSORIAL_AVANZADO,
  REGISTRO_ABC_AVANZADO,
]
