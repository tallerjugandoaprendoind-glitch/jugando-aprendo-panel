// Bilingual New Clinical Forms — IEP Objective, Session Note, Monthly Report, ABC Record

export const FORM_TABLE_MAPPING_NEW: Record<string, string> = {
  'objetivo_iep': 'evaluacion_objetivos_iep',
  'nota_sesion': 'registro_nota_sesion',
  'informe_mensual': 'informe_mensual_progreso',
  'registro_conductual': 'registro_conductual_abc',
}

const S = (isEN: boolean, es: string, en: string) => en
const A = (isEN: boolean, es: string[], en: string[]) => en

export function getObjetivoIepData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: '1. Objective Identification', questions: [
      { id:'dominio', label:'Intervention Domain', type:'select', options:['Communication & Language','Social Skills','Adaptive Behavior','Academic Skills','Autonomy & Daily Living','Fine Motor','Gross Motor','Emotional Regulation','Play Skills'] },
      { id:'objetivo_largo_plazo', label:'Annual Goal (Long-term)', type:'textarea', placeholder:'E.g.: The child will increase functional vocabulary to communicate basic needs...' },
      { id:'objetivo_corto_plazo', label:'Short-term Objective (quarterly)', type:'textarea', placeholder:'E.g.: The child will name 10 household objects at 80% of opportunities in 3 consecutive sessions...' },
      { id:'nivel_actual', label:'Current Performance Level (Baseline)', type:'textarea', placeholder:'Describe the patient\'s current performance on this skill...' },
    ]},
    { title: '2. Evaluation Criteria & Strategies', questions: [
      { id:'criterio_dominio', label:'Mastery Criterion', type:'text', placeholder:'E.g.: 80% correct trials in 3 consecutive sessions' },
      { id:'metodo_ensenanza', label:'Primary Teaching Method', type:'select', options:['DTT (Discrete Trial Training)','NET (Natural Environment Training)','PECS','Modeling','Backward chaining','Forward chaining','Incidental Teaching','PRT (Pivotal Response Training)'] },
      { id:'tipo_ayuda', label:'Initial Prompt Type', type:'select', options:['No prompt','Gestural','Partial verbal','Full verbal','Partial physical','Full physical','Visual/Pictogram'] },
      { id:'materiales', label:'Materials & Resources Needed', type:'textarea', placeholder:'List specific materials needed for this objective...' },
    ]},
    { title: '3. Generalization & Maintenance', questions: [
      { id:'escenarios_generalizacion', label:'Generalization Scenarios', type:'multiselect', options:['Home','School','Park/outdoors','Supermarket','With other adults','With peers','Different materials','Different times of day'] },
      { id:'estrategia_generalizacion', label:'Generalization Plan', type:'textarea', placeholder:'Describe how generalization to home and community will be promoted...' },
      { id:'fecha_inicio_objetivo', label:'Start Date', type:'date' },
      { id:'fecha_revision', label:'Scheduled Review Date', type:'date' },
      { id:'responsable', label:'Responsible Therapist', type:'text', placeholder:'Therapist name' },
    ]},
  ]
}

export function getNotaSesionData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: '1. Session Data', questions: [
      { id:'numero_sesion',       label:'Session Number',        type:'number', placeholder:'E.g.: 42' },
      { id:'duracion_minutos',    label:'Duration (minutes)',  type:'number', placeholder:'45' },
      { id:'tipo_sesion',         label:'Modality',                     type:'select', options:['In-person - Center','In-person - Home','In-person - School','Semi-in-person','Remote/Virtual'] },
      { id:'estado_animo_inicio', label:'Patient State at Start', type:'select', options:['Calm and cooperative','Mildly anxious','Irritable','Tired/drowsy','Very active/overstimulated','Crying','Resistant','Happy and motivated'] },
    ]},
    { title: '2. Objectives & Performance', questions: [
      { id:'objetivos_sesion',       label:'IEP Objectives Worked On', type:'textarea', placeholder:'List the objectives addressed in this session...' },
      { id:'porcentaje_correcto',    label:'% Average Correct Responses', type:'number', placeholder:'E.g.: 75' },
      { id:'programas_trabajados',   label:'Programs / Activities Completed', type:'textarea', placeholder:'Describe the activities, games and programs completed during the session...' },
      { id:'reforzadores_efectivos', label:'Most Effective Reinforcers Today', type:'text', placeholder:'E.g.: Bubbles, verbal praise, tablet 2 min' },
    ]},
    { title: '3. Behaviors & Clinical Observations', questions: [
      { id:'conductas_problema',     label:'Were there problem behaviors?', type:'select', options:['No','Yes - mild (did not interfere)','Yes - moderate (partially interfered)','Yes - severe (interrupted the session)'] },
      { id:'descripcion_conductas',  label:'Behavior Description (if applicable)', type:'textarea', placeholder:'Describe topography, frequency, duration and intensity...' },
      { id:'estrategia_manejo',      label:'Management Strategy Used', type:'textarea', placeholder:'Describe how the behavior was managed...' },
      { id:'observaciones_generales',label:'General Clinical Observations', type:'textarea', placeholder:'Therapist observations on clinical state, new skills, regressions, etc.' },
    ]},
    { title: '4. Recommendations & Plan', questions: [
      { id:'tarea_casa',          label:'Home Activities',                              type:'textarea', placeholder:'Specific activities parents should practice this week...' },
      { id:'ajuste_programa',     label:'Are program adjustments needed?',  type:'select', options:['No, continue as is','Increase difficulty','Reduce demand','Change reinforcer','Review teaching method','Consult supervisor'] },
      { id:'plan_proxima_sesion', label:'Plan for Next Session',                     type:'textarea', placeholder:'Priority objectives and strategies for the next session...' },
      { id:'comunicar_padres',    label:'Message for Parents?',                     type:'textarea', placeholder:'Achievements or important information to share with the family...' },
    ]},
  ]
}

export function getInformeMensualData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const progress = ['No progress / Regression','Minimal progress (<20%)','Moderate progress (20-50%)','Significant progress (50-80%)','Objective achieved (>80%)','Not worked this month']
  return [
    { title: '1. Period Summary', questions: [
      { id:'mes_evaluado',    label:'Month Evaluated', type:'select', options:['January','February','March','April','May','June','July','August','September','October','November','December'] },
      { id:'total_sesiones',  label:'Total Sessions Completed', type:'number', placeholder:'E.g.: 8' },
      { id:'sesiones_faltadas',label:'Sessions Not Completed',        type:'number', placeholder:'E.g.: 1' },
      { id:'horas_terapia',   label:'Direct Therapy Hours',         type:'number', placeholder:'E.g.: 6' },
      { id:'resumen_periodo', label:'General Monthly Summary',        type:'textarea', placeholder:'Brief description of the patient\'s overall performance during the month...' },
    ]},
    { title: '2. Progress by Domain', questions: [
      { id:'avance_comunicacion',label:'Communication & Language', type:'select', options:progress },
      { id:'avance_social',      label:'Social Skills',                type:'select', options:progress },
      { id:'avance_conducta',    label:'Adaptive Behavior',             type:'select', options:progress },
      { id:'avance_autonomia',   label:'Autonomy & Daily Living',   type:'select', options:progress },
      { id:'avance_academico',   label:'Academic / Pre-academic Skills', type:'select', options:progress },
    ]},
    { title: '3. Achieved & New Objectives', questions: [
      { id:'objetivos_logrados',    label:'Objectives Mastered This Month', type:'textarea', placeholder:'List the objectives that reached mastery criterion...' },
      { id:'objetivos_nuevos',      label:'New Objectives Added',          type:'textarea', placeholder:'New objectives that were started...' },
      { id:'conductas_preocupacion',label:'Concerning Behaviors',              type:'textarea', placeholder:'Problem behaviors that persist or emerged this month...' },
    ]},
    { title: '4. Recommendations & Next Month Plan', questions: [
      { id:'recomendaciones_familia', label:'Family Recommendations',         type:'textarea', placeholder:'Specific strategies to implement at home...' },
      { id:'plan_proximo_mes',        label:'Priority Objectives Next Month', type:'textarea', placeholder:'Describe the therapeutic focus for the next period...' },
      { id:'coordinacion_escuela',    label:'Requires School Coordination?', type:'select', options:['No','Yes - send report','Yes - meeting recommended','Yes - observation visit','Already coordinated'] },
      { id:'necesita_reevaluacion',   label:'Re-evaluation Recommended?',         type:'select', options:['Not at this time','Yes - in 1 month','Yes - in 3 months','Yes - urgent'] },
    ]},
  ]
}

export function getRegistroConductualData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: '1. Episode Data', questions: [
      { id:'hora_inicio',         label:'Start Time',           type:'time' },
      { id:'hora_fin',            label:'End Time',                 type:'time' },
      { id:'duracion_estimada',   label:'Estimated Duration', type:'select', options:['Less than 1 minute','1-5 minutes','5-10 minutes','10-30 minutes','More than 30 minutes'] },
      { id:'lugar',               label:'Location',         type:'select', options:['Therapy center','Home - living room','Home - bedroom','Home - kitchen','School - classroom','School - recess','Outdoors/street','Supermarket/store','Transport','Other location'] },
      { id:'personas_presentes',  label:'People Present',   type:'multiselect', options:['Therapist','Mother','Father','Siblings','Grandparents','Teacher','Classmates','Unknown people'] },
    ]},
    { title: '2. Antecedent (A) - What happened BEFORE?', questions: [
      { id:'actividad_previa',    label:'Activity being performed', type:'text', placeholder:'E.g.: Working at the table with colored tokens' },
      { id:'demanda_presentada',  label:'Was a demand presented?', type:'select', options:['No','Yes - academic task','Yes - activity change','Yes - verbal instruction','Yes - limit/refusal','Yes - waiting/turn'] },
      { id:'cambio_ambiente',     label:'Was there an environmental change?', type:'select', options:['No','Yes - noise/sound','Yes - new person','Yes - change of location','Yes - routine change','Yes - visual stimulus'] },
      { id:'estado_previo',       label:'Child State Prior to Episode', type:'select', options:['Normal/neutral','Already irritable','Tired','Hungry/thirsty','Sick/physical discomfort','Overstimulated','Just lost a reinforcer'] },
    ]},
    { title: '3. Behavior (B) - What happened EXACTLY?', questions: [
      { id:'topografia_conducta', label:'Precise Behavior Description', type:'textarea', placeholder:'Describe EXACTLY what the child did (without interpreting): movements, vocalizations, actions...' },
      { id:'tipo_conducta',       label:'Behavior Category', type:'multiselect', options:['Aggression toward people','Self-injury','Property destruction','Escape/flee','Intense crying','Screaming/vocalizations','Refusal/resistance','Stereotypy','Tantrum','Non-compliance'] },
      { id:'intensidad',          label:'Episode Intensity', type:'select', options:['1 - Very mild','2 - Mild','3 - Moderate','4 - Intense','5 - Very intense / Crisis'] },
      { id:'frecuencia',          label:'Frequency in the last 2 weeks', type:'select', options:['First time','2-3 times','4-7 times','8-14 times','More than 14 times (daily)'] },
    ]},
    { title: '4. Consequence (C) & Hypothetical Function', questions: [
      { id:'consecuencia_adulto', label:'How Did Adults React?', type:'multiselect', options:['Redirected the activity','Removed the demand','Gave verbal attention','Gave preferred item','Ignored','Physical restraint','Timeout/isolation','Completed the task for the child'] },
      { id:'resultado_conducta',  label:'What Did the Child Obtain with the Behavior?', type:'select', options:['Adult attention','Avoid/escape task','Obtain item/food','Sensory stimulation','Control/power','Not clear'] },
      { id:'funcion_hipotetica',  label:'Hypothetical Function of Behavior', type:'select', options:['Access to tangibles','Access to attention','Escape/avoidance','Sensory/automatic','Multiple functions','Not yet determined'] },
      { id:'plan_intervencion',   label:'Suggested Intervention Plan', type:'textarea', placeholder:'Based on functional analysis, describe intervention strategies...' },
    ]},
  ]
}

// Legacy exports for backwards compatibility
export const OBJETIVO_IEP_DATA          = getObjetivoIepData(false)
export const NOTA_SESION_DATA           = getNotaSesionData(false)
export const INFORME_MENSUAL_DATA       = getInformeMensualData(false)
export const REGISTRO_CONDUCTUAL_ABC_DATA = getRegistroConductualData(false)
