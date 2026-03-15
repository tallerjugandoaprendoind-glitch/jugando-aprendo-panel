// Bilingual New Clinical Forms — IEP Objective, Session Note, Monthly Report, ABC Record

export const FORM_TABLE_MAPPING_NEW: Record<string, string> = {
  'objetivo_iep': 'evaluacion_objetivos_iep',
  'nota_sesion': 'registro_nota_sesion',
  'informe_mensual': 'informe_mensual_progreso',
  'registro_conductual': 'registro_conductual_abc',
}

const S = (isEN: boolean, es: string, en: string) => isEN ? en : es
const A = (isEN: boolean, es: string[], en: string[]) => isEN ? en : es

export function getObjetivoIepData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: s('1. Identificación del Objetivo','1. Objective Identification'), questions: [
      { id:'dominio', label:s('Dominio de Intervención','Intervention Domain'), type:'select', options:a(['Comunicación y Lenguaje','Habilidades Sociales','Conducta Adaptativa','Habilidades Académicas','Autonomía y Vida Diaria','Motricidad Fina','Motricidad Gruesa','Regulación Emocional','Habilidades de Juego'],['Communication & Language','Social Skills','Adaptive Behavior','Academic Skills','Autonomy & Daily Living','Fine Motor','Gross Motor','Emotional Regulation','Play Skills']) },
      { id:'objetivo_largo_plazo', label:s('Meta Anual (Largo Plazo)','Annual Goal (Long-term)'), type:'textarea', placeholder:s('Ej: El niño aumentará su vocabulario funcional para comunicar necesidades básicas...','E.g.: The child will increase functional vocabulary to communicate basic needs...') },
      { id:'objetivo_corto_plazo', label:s('Objetivo a Corto Plazo (trimestral)','Short-term Objective (quarterly)'), type:'textarea', placeholder:s('Ej: El niño nombrará 10 objetos del hogar al 80% de las oportunidades en 3 sesiones consecutivas...','E.g.: The child will name 10 household objects at 80% of opportunities in 3 consecutive sessions...') },
      { id:'nivel_actual', label:s('Nivel de Desempeño Actual (Línea Base)','Current Performance Level (Baseline)'), type:'textarea', placeholder:s('Describe el rendimiento actual del paciente en esta habilidad...','Describe the patient\'s current performance on this skill...') },
    ]},
    { title: s('2. Criterios de Evaluación y Estrategias','2. Evaluation Criteria & Strategies'), questions: [
      { id:'criterio_dominio', label:s('Criterio de Dominio','Mastery Criterion'), type:'text', placeholder:'E.g.: 80% correct trials in 3 consecutive sessions' },
      { id:'metodo_ensenanza', label:s('Método de Enseñanza Principal','Primary Teaching Method'), type:'select', options:['DTT (Discrete Trial Training)','NET (Natural Environment Training)','PECS',s('Modelado','Modeling'),s('Encadenamiento hacia atrás','Backward chaining'),s('Encadenamiento hacia adelante','Forward chaining'),'Incidental Teaching','PRT (Pivotal Response Training)'] },
      { id:'tipo_ayuda', label:s('Tipo de Ayuda (Prompt) Inicial','Initial Prompt Type'), type:'select', options:a(['Sin ayuda','Gestual','Verbal parcial','Verbal completo','Físico parcial','Físico completo','Visual/Pictograma'],['No prompt','Gestural','Partial verbal','Full verbal','Partial physical','Full physical','Visual/Pictogram']) },
      { id:'materiales', label:s('Materiales y Recursos Necesarios','Materials & Resources Needed'), type:'textarea', placeholder:s('Lista los materiales específicos para trabajar este objetivo...','List specific materials needed for this objective...') },
    ]},
    { title: s('3. Generalización y Mantenimiento','3. Generalization & Maintenance'), questions: [
      { id:'escenarios_generalizacion', label:s('Escenarios para Generalización','Generalization Scenarios'), type:'multiselect', options:a(['Hogar','Colegio','Parque/exterior','Supermercado','Con otros adultos','Con pares','Diferentes materiales','Diferentes momentos del día'],['Home','School','Park/outdoors','Supermarket','With other adults','With peers','Different materials','Different times of day']) },
      { id:'estrategia_generalizacion', label:s('Plan de Generalización','Generalization Plan'), type:'textarea', placeholder:s('Describe cómo se promoverá la generalización al hogar y comunidad...','Describe how generalization to home and community will be promoted...') },
      { id:'fecha_inicio_objetivo', label:s('Fecha de Inicio','Start Date'), type:'date' },
      { id:'fecha_revision', label:s('Fecha de Revisión Programada','Scheduled Review Date'), type:'date' },
      { id:'responsable', label:s('Terapeuta Responsable','Responsible Therapist'), type:'text', placeholder:s('Nombre del terapeuta','Therapist name') },
    ]},
  ]
}

export function getNotaSesionData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: s('1. Datos de la Sesión','1. Session Data'), questions: [
      { id:'numero_sesion',       label:s('Número de Sesión','Session Number'),        type:'number', placeholder:s('Ej: 42','E.g.: 42') },
      { id:'duracion_minutos',    label:s('Duración (minutos)','Duration (minutes)'),  type:'number', placeholder:'45' },
      { id:'tipo_sesion',         label:s('Modalidad','Modality'),                     type:'select', options:a(['Presencial - Centro','Presencial - Domicilio','Presencial - Escuela','Semipresencial','Remota/Virtual'],['In-person - Center','In-person - Home','In-person - School','Semi-in-person','Remote/Virtual']) },
      { id:'estado_animo_inicio', label:s('Estado del Paciente al Inicio','Patient State at Start'), type:'select', options:a(['Tranquilo y colaborador','Levemente ansioso','Irritable','Cansado/somnoliento','Muy activo/hiperestimulado','Con llanto','Resistente','Alegre y motivado'],['Calm and cooperative','Mildly anxious','Irritable','Tired/drowsy','Very active/overstimulated','Crying','Resistant','Happy and motivated']) },
    ]},
    { title: s('2. Objetivos Trabajados y Rendimiento','2. Objectives & Performance'), questions: [
      { id:'objetivos_sesion',       label:s('Objetivos IEP Trabajados','IEP Objectives Worked On'), type:'textarea', placeholder:s('Lista los objetivos abordados en esta sesión...','List the objectives addressed in this session...') },
      { id:'porcentaje_correcto',    label:s('% Promedio de Respuestas Correctas','% Average Correct Responses'), type:'number', placeholder:s('Ej: 75','E.g.: 75') },
      { id:'programas_trabajados',   label:s('Programas / Actividades Realizadas','Programs / Activities Completed'), type:'textarea', placeholder:s('Describe las actividades, juegos y programas realizados durante la sesión...','Describe the activities, games and programs completed during the session...') },
      { id:'reforzadores_efectivos', label:s('Reforzadores Más Efectivos Hoy','Most Effective Reinforcers Today'), type:'text', placeholder:s('Ej: Pompas de jabón, elogios verbales, tablet 2 min','E.g.: Bubbles, verbal praise, tablet 2 min') },
    ]},
    { title: s('3. Conductas y Observaciones Clínicas','3. Behaviors & Clinical Observations'), questions: [
      { id:'conductas_problema',     label:s('¿Se presentaron conductas problema?','Were there problem behaviors?'), type:'select', options:a(['No','Sí - leve (no interfirió)','Sí - moderado (interfirió parcialmente)','Sí - severo (interrumpió la sesión)'],['No','Yes - mild (did not interfere)','Yes - moderate (partially interfered)','Yes - severe (interrupted the session)']) },
      { id:'descripcion_conductas',  label:s('Descripción de Conductas (si aplica)','Behavior Description (if applicable)'), type:'textarea', placeholder:s('Describe topografía, frecuencia, duración e intensidad...','Describe topography, frequency, duration and intensity...') },
      { id:'estrategia_manejo',      label:s('Estrategia de Manejo Utilizada','Management Strategy Used'), type:'textarea', placeholder:s('Describe cómo se manejó la conducta...','Describe how the behavior was managed...') },
      { id:'observaciones_generales',label:s('Observaciones Clínicas Generales','General Clinical Observations'), type:'textarea', placeholder:s('Observaciones del terapeuta sobre el estado clínico, nuevas habilidades, regresiones, etc.','Therapist observations on clinical state, new skills, regressions, etc.') },
    ]},
    { title: s('4. Recomendaciones y Plan','4. Recommendations & Plan'), questions: [
      { id:'tarea_casa',          label:s('Actividades para Casa','Home Activities'),                              type:'textarea', placeholder:s('Actividades específicas que los padres deben practicar esta semana...','Specific activities parents should practice this week...') },
      { id:'ajuste_programa',     label:s('¿Se requieren ajustes al programa?','Are program adjustments needed?'),  type:'select', options:a(['No, continuar igual','Aumentar dificultad','Reducir exigencia','Cambiar reforzador','Revisar método de enseñanza','Consultar con supervisor'],['No, continue as is','Increase difficulty','Reduce demand','Change reinforcer','Review teaching method','Consult supervisor']) },
      { id:'plan_proxima_sesion', label:s('Plan para Próxima Sesión','Plan for Next Session'),                     type:'textarea', placeholder:s('Objetivos prioritarios y estrategias para la siguiente sesión...','Priority objectives and strategies for the next session...') },
      { id:'comunicar_padres',    label:s('¿Mensaje para los Padres?','Message for Parents?'),                     type:'textarea', placeholder:s('Logros o información importante para comunicar a la familia...','Achievements or important information to share with the family...') },
    ]},
  ]
}

export function getInformeMensualData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const progress = a(['Sin avance / Regresión','Avance mínimo (<20%)','Avance moderado (20-50%)','Avance significativo (50-80%)','Objetivo logrado (>80%)','No trabajado este mes'],['No progress / Regression','Minimal progress (<20%)','Moderate progress (20-50%)','Significant progress (50-80%)','Objective achieved (>80%)','Not worked this month'])
  return [
    { title: s('1. Resumen del Período','1. Period Summary'), questions: [
      { id:'mes_evaluado',    label:s('Mes Evaluado','Month Evaluated'), type:'select', options:a(['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],['January','February','March','April','May','June','July','August','September','October','November','December']) },
      { id:'total_sesiones',  label:s('Total de Sesiones Realizadas','Total Sessions Completed'), type:'number', placeholder:s('Ej: 8','E.g.: 8') },
      { id:'sesiones_faltadas',label:s('Sesiones No Realizadas','Sessions Not Completed'),        type:'number', placeholder:s('Ej: 1','E.g.: 1') },
      { id:'horas_terapia',   label:s('Horas de Terapia Directa','Direct Therapy Hours'),         type:'number', placeholder:s('Ej: 6','E.g.: 6') },
      { id:'resumen_periodo', label:s('Resumen General del Mes','General Monthly Summary'),        type:'textarea', placeholder:s('Descripción breve del desempeño general del paciente durante el mes...','Brief description of the patient\'s overall performance during the month...') },
    ]},
    { title: s('2. Avance por Dominio','2. Progress by Domain'), questions: [
      { id:'avance_comunicacion',label:s('Comunicación y Lenguaje','Communication & Language'), type:'select', options:progress },
      { id:'avance_social',      label:s('Habilidades Sociales','Social Skills'),                type:'select', options:progress },
      { id:'avance_conducta',    label:s('Conducta Adaptativa','Adaptive Behavior'),             type:'select', options:progress },
      { id:'avance_autonomia',   label:s('Autonomía y Vida Diaria','Autonomy & Daily Living'),   type:'select', options:progress },
      { id:'avance_academico',   label:s('Habilidades Académicas / Pre-académicas','Academic / Pre-academic Skills'), type:'select', options:progress },
    ]},
    { title: s('3. Objetivos Logrados y Nuevos','3. Achieved & New Objectives'), questions: [
      { id:'objetivos_logrados',    label:s('Objetivos Dominados Este Mes','Objectives Mastered This Month'), type:'textarea', placeholder:s('Lista los objetivos que alcanzaron criterio de dominio...','List the objectives that reached mastery criterion...') },
      { id:'objetivos_nuevos',      label:s('Nuevos Objetivos Incorporados','New Objectives Added'),          type:'textarea', placeholder:s('Nuevos objetivos que se comenzaron a trabajar...','New objectives that were started...') },
      { id:'conductas_preocupacion',label:s('Conductas de Preocupación','Concerning Behaviors'),              type:'textarea', placeholder:s('Conductas problema que persisten o emergieron este mes...','Problem behaviors that persist or emerged this month...') },
    ]},
    { title: s('4. Recomendaciones y Plan Próximo Mes','4. Recommendations & Next Month Plan'), questions: [
      { id:'recomendaciones_familia', label:s('Recomendaciones para la Familia','Family Recommendations'),         type:'textarea', placeholder:s('Estrategias específicas para implementar en casa...','Specific strategies to implement at home...') },
      { id:'plan_proximo_mes',        label:s('Objetivos Prioritarios Próximo Mes','Priority Objectives Next Month'), type:'textarea', placeholder:s('Describe el enfoque terapéutico del siguiente período...','Describe the therapeutic focus for the next period...') },
      { id:'coordinacion_escuela',    label:s('¿Requiere Coordinación con Escuela?','Requires School Coordination?'), type:'select', options:a(['No','Sí - enviar informe','Sí - reunión recomendada','Sí - visita de observación','Ya coordinado'],['No','Yes - send report','Yes - meeting recommended','Yes - observation visit','Already coordinated']) },
      { id:'necesita_reevaluacion',   label:s('¿Se Recomienda Reevaluación?','Re-evaluation Recommended?'),         type:'select', options:a(['No en este momento','Sí - en 1 mes','Sí - en 3 meses','Sí - urgente'],['Not at this time','Yes - in 1 month','Yes - in 3 months','Yes - urgent']) },
    ]},
  ]
}

export function getRegistroConductualData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: s('1. Datos del Episodio','1. Episode Data'), questions: [
      { id:'hora_inicio',         label:s('Hora de Inicio','Start Time'),           type:'time' },
      { id:'hora_fin',            label:s('Hora de Fin','End Time'),                 type:'time' },
      { id:'duracion_estimada',   label:s('Duración Estimada','Estimated Duration'), type:'select', options:a(['Menos de 1 minuto','1-5 minutos','5-10 minutos','10-30 minutos','Más de 30 minutos'],['Less than 1 minute','1-5 minutes','5-10 minutes','10-30 minutes','More than 30 minutes']) },
      { id:'lugar',               label:s('Lugar donde Ocurrió','Location'),         type:'select', options:['Therapy center','Home - living room','Home - bedroom','Home - kitchen','School - classroom','School - recess','Outdoors/street','Supermarket/store','Transport','Other location'] },
      { id:'personas_presentes',  label:s('Personas Presentes','People Present'),   type:'multiselect', options:a(['Terapeuta','Madre','Padre','Hermanos','Abuelos','Docente','Compañeros de clase','Personas desconocidas'],['Therapist','Mother','Father','Siblings','Grandparents','Teacher','Classmates','Unknown people']) },
    ]},
    { title: s('2. Antecedente (A) - ¿Qué pasó ANTES?','2. Antecedent (A) - What happened BEFORE?'), questions: [
      { id:'actividad_previa',    label:s('Actividad que se estaba realizando','Activity being performed'), type:'text', placeholder:s('Ej: Trabajando en la mesa con fichas de colores','E.g.: Working at the table with colored tokens') },
      { id:'demanda_presentada',  label:s('¿Se presentó alguna demanda?','Was a demand presented?'), type:'select', options:a(['No','Sí - tarea académica','Sí - cambio de actividad','Sí - instrucción verbal','Sí - límite/negativa','Sí - espera/turno'],['No','Yes - academic task','Yes - activity change','Yes - verbal instruction','Yes - limit/refusal','Yes - waiting/turn']) },
      { id:'cambio_ambiente',     label:s('¿Hubo algún cambio en el ambiente?','Was there an environmental change?'), type:'select', options:a(['No','Sí - ruido/sonido','Sí - persona nueva','Sí - cambio de lugar','Sí - cambio de rutina','Sí - estímulo visual'],['No','Yes - noise/sound','Yes - new person','Yes - change of location','Yes - routine change','Yes - visual stimulus']) },
      { id:'estado_previo',       label:s('Estado del Niño Previo al Episodio','Child State Prior to Episode'), type:'select', options:a(['Normal/neutro','Ya estaba irritable','Cansado','Con hambre/sed','Enfermo/malestar físico','Hiperestimulado','Acababa de perder un reforzador'],['Normal/neutral','Already irritable','Tired','Hungry/thirsty','Sick/physical discomfort','Overstimulated','Just lost a reinforcer']) },
    ]},
    { title: s('3. Conducta (B) - ¿Qué ocurrió EXACTAMENTE?','3. Behavior (B) - What happened EXACTLY?'), questions: [
      { id:'topografia_conducta', label:s('Descripción Precisa de la Conducta','Precise Behavior Description'), type:'textarea', placeholder:s('Describe EXACTAMENTE lo que hizo el niño (sin interpretar): movimientos, vocalizaciones, acciones...','Describe EXACTLY what the child did (without interpreting): movements, vocalizations, actions...') },
      { id:'tipo_conducta',       label:s('Categoría de la Conducta','Behavior Category'), type:'multiselect', options:a(['Agresión a personas','Autolesión','Destrucción de objetos','Escapar/huir','Llanto intenso','Gritos/vocalizaciones','Negativa/resistencia','Estereotipia','Rabieta','No cumplir instrucción'],['Aggression toward people','Self-injury','Property destruction','Escape/flee','Intense crying','Screaming/vocalizations','Refusal/resistance','Stereotypy','Tantrum','Non-compliance']) },
      { id:'intensidad',          label:s('Intensidad del Episodio','Episode Intensity'), type:'select', options:a(['1 - Muy leve','2 - Leve','3 - Moderado','4 - Intenso','5 - Muy intenso / Crisis'],['1 - Very mild','2 - Mild','3 - Moderate','4 - Intense','5 - Very intense / Crisis']) },
      { id:'frecuencia',          label:s('Frecuencia en las últimas 2 semanas','Frequency in the last 2 weeks'), type:'select', options:a(['Primera vez','2-3 veces','4-7 veces','8-14 veces','Más de 14 veces (diario)'],['First time','2-3 times','4-7 times','8-14 times','More than 14 times (daily)']) },
    ]},
    { title: s('4. Consecuencia (C) y Función Hipotética','4. Consequence (C) & Hypothetical Function'), questions: [
      { id:'consecuencia_adulto', label:s('¿Cómo Reaccionaron los Adultos?','How Did Adults React?'), type:'multiselect', options:a(['Redirigieron la actividad','Eliminaron la demanda','Dieron atención verbal','Dieron objeto preferido','Ignoraron','Contención física','Timeout/aislamiento','Realizaron la tarea por el niño'],['Redirected the activity','Removed the demand','Gave verbal attention','Gave preferred item','Ignored','Physical restraint','Timeout/isolation','Completed the task for the child']) },
      { id:'resultado_conducta',  label:s('¿Qué Obtuvo el Niño con la Conducta?','What Did the Child Obtain with the Behavior?'), type:'select', options:a(['Atención de adulto','Evitar/escapar tarea','Obtener objeto/comida','Estimulación sensorial','Control/poder','No está claro'],['Adult attention','Avoid/escape task','Obtain item/food','Sensory stimulation','Control/power','Not clear']) },
      { id:'funcion_hipotetica',  label:s('Función Hipotética de la Conducta','Hypothetical Function of Behavior'), type:'select', options:a(['Acceso a tangibles','Acceso a atención','Escape/evitación','Sensorial/automática','Múltiples funciones','No determinado aún'],['Access to tangibles','Access to attention','Escape/avoidance','Sensory/automatic','Multiple functions','Not yet determined']) },
      { id:'plan_intervencion',   label:s('Plan de Intervención Sugerido','Suggested Intervention Plan'), type:'textarea', placeholder:s('Basado en el análisis funcional, describe estrategias de intervención...','Based on functional analysis, describe intervention strategies...') },
    ]},
  ]
}

// Legacy exports for backwards compatibility
export const OBJETIVO_IEP_DATA          = getObjetivoIepData(false)
export const NOTA_SESION_DATA           = getNotaSesionData(false)
export const INFORME_MENSUAL_DATA       = getInformeMensualData(false)
export const REGISTRO_CONDUCTUAL_ABC_DATA = getRegistroConductualData(false)
