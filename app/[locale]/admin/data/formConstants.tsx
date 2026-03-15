'use client'
// Bilingual form constants — all data exported as functions accepting isEN: boolean

import {
  Brain, Activity, Target, Heart, TrendingUp, Zap, Award, BookOpen,
  Home, MessageCircle, Calendar, Eye, Users, Sparkles
} from 'lucide-react'

export const FORM_TABLE_MAPPING = {
  'brief2': 'evaluacion_brief2', 'ados2': 'evaluacion_ados2',
  'vineland3': 'evaluacion_vineland3', 'wiscv': 'evaluacion_wiscv', 'basc3': 'evaluacion_basc3'
}
export const EVALUATION_COLORS = {
  'brief2':   { primary: 'from-indigo-500 to-indigo-600',  light: 'bg-indigo-50 text-indigo-700 border-indigo-200',   hover: 'hover:border-indigo-400' },
  'ados2':    { primary: 'from-teal-500 to-teal-600',      light: 'bg-teal-50 text-teal-700 border-teal-200',         hover: 'hover:border-teal-400' },
  'vineland3':{ primary: 'from-emerald-500 to-emerald-600',light: 'bg-emerald-50 text-emerald-700 border-emerald-200',hover: 'hover:border-emerald-400' },
  'wiscv':    { primary: 'from-violet-500 to-violet-600',  light: 'bg-violet-50 text-violet-700 border-violet-200',   hover: 'hover:border-violet-400' },
  'basc3':    { primary: 'from-rose-500 to-rose-600',      light: 'bg-rose-50 text-rose-700 border-rose-200',         hover: 'hover:border-rose-400' }
}



const S = (isEN: boolean, es: string, en: string) => isEN ? en : es
const A = (isEN: boolean, esArr: string[], enArr: string[]) => isEN ? enArr : esArr

// ─── ANAMNESIS ───────────────────────────────────────────────────────────────
export function getAnamnesisData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: s("1. Datos de Filiación","1. Identification Data"), questions: [
      { id:"informante",  label:s("Nombre del informante","Informant name"),       type:"text",   placeholder:s("Nombre completo","Full name") },
      { id:"parentesco",  label:s("Parentesco con el niño","Relationship to child"),type:"select", options:a(["Madre","Padre","Abuelo/a","Tutor","Otro"],["Mother","Father","Grandparent","Guardian","Other"]) },
      { id:"vive_con",    label:s("¿Con quién vive el niño?","Who does the child live with?"), type:"text", placeholder:s("Ej: Padres y hermanos","E.g.: Parents and siblings") },
      { id:"escolaridad", label:s("Escolaridad actual","Current schooling"), type:"select", options:a(["No escolarizado","Nido/Inicial","Primaria","CEBE"],["Not enrolled","Preschool","Primary","Special Ed."]) },
    ]},
    { title: s("2. Motivo de Consulta","2. Reason for Consultation"), questions: [
      { id:"motivo_principal",label:s("Motivo principal de la consulta","Main reason for consultation"),type:"textarea",placeholder:s("Describe el problema o preocupación principal...","Describe the main problem or concern...") },
      { id:"derivado_por",    label:s("¿Quién lo deriva?","Referred by?"),type:"select",options:a(["Iniciativa propia","Institución Educativa","Médico Pediatra","Psicólogo","Otro"],["Self-referral","Educational Institution","Pediatrician","Psychologist","Other"]) },
      { id:"expectativas",    label:s("¿Qué espera lograr con la terapia?","What do you hope to achieve with therapy?"),type:"textarea",placeholder:s("Objetivos de los padres...","Parent goals...") },
    ]},
    { title: s("3. Historia Prenatal (Embarazo y Parto)","3. Prenatal History (Pregnancy & Delivery)"), questions: [
      { id:"tipo_embarazo",      label:s("¿El embarazo fue planificado?","Was the pregnancy planned?"),type:"radio",options:a(["Sí","No"],["Yes","No"]) },
      { id:"complicaciones_emb", label:s("¿Hubo complicaciones en el embarazo?","Were there pregnancy complications?"),type:"textarea",placeholder:s("Amenazas de aborto, infecciones...","Threatened miscarriage, infections...") },
      { id:"tipo_parto",         label:s("Tipo de parto","Delivery type"),type:"select",options:a(["Natural","Cesárea de emergencia","Cesárea programada"],["Natural","Emergency C-section","Planned C-section"]) },
      { id:"llanto",             label:s("¿Lloró al nacer?","Did the baby cry at birth?"),type:"radio",options:a(["Sí","No","No sabe"],["Yes","No","Unknown"]) },
      { id:"incubadora",         label:s("¿Requirió incubadora?","Required incubator?"),type:"radio",options:a(["Sí","No"],["Yes","No"]) },
    ]},
    { title: s("4. Historia Médica","4. Medical History"), questions: [
      { id:"enfermedades",label:s("¿Ha tenido enfermedades graves?","Any serious illnesses?"),type:"textarea",placeholder:s("Convulsiones, fiebres altas, otitis...","Seizures, high fevers, ear infections...") },
      { id:"examenes",    label:s("¿Tiene exámenes previos?","Previous exams/studies?"),type:"select",options:a(["Ninguno","Audición","Visión","Neurológico","Genético","Varios"],["None","Hearing","Vision","Neurological","Genetic","Multiple"]) },
      { id:"medicacion",  label:s("¿Toma alguna medicación actual?","Current medications?"),type:"text",placeholder:s("Nombre y dosis...","Name and dose...") },
    ]},
    { title: s("5. Desarrollo Psicomotor","5. Psychomotor Development"), questions: [
      { id:"sosten_cefalico",label:s("Edad de sostén cefálico","Age of head control"),type:"text",placeholder:s("Ej: 3 meses","E.g.: 3 months") },
      { id:"gateo",          label:s("Edad de gateo","Age of crawling"),type:"text",placeholder:s("Ej: 8 meses","E.g.: 8 months") },
      { id:"marcha",         label:s("Edad de marcha (caminar solo)","Age of independent walking"),type:"text",placeholder:s("Ej: 1 año 2 meses","E.g.: 1 year 2 months") },
      { id:"caidas",         label:s("¿Se cae con frecuencia?","Falls frequently?"),type:"radio",options:a(["Sí","No"],["Yes","No"]) },
      { id:"motricidad_fina",label:s("Motricidad fina (pinza, agarre)","Fine motor skills (pincer, grip)"),type:"select",options:a(["Adecuada","Dificultad para agarrar","Torpeza manual"],["Adequate","Difficulty gripping","Manual clumsiness"]) },
    ]},
    { title: s("6. Desarrollo del Lenguaje","6. Language Development"), questions: [
      { id:"primeras_palabras",     label:s("Edad de primeras palabras","Age of first words"),type:"text",placeholder:s("Ej: 1 año","E.g.: 1 year") },
      { id:"intencion_comunicativa",label:s("¿Tiene intención comunicativa?","Shows communicative intent?"),type:"radio",options:a(["Sí","No","A veces"],["Yes","No","Sometimes"]) },
      { id:"comprension",           label:s("Nivel de comprensión","Comprehension level"),type:"select",options:a(["Entiende todo","Entiende órdenes simples","No parece entender","Ignora su nombre"],["Understands everything","Understands simple commands","Doesn't seem to understand","Ignores own name"]) },
      { id:"frases",                label:s("¿Estructura frases?","Forms sentences?"),type:"radio",options:a(["Sí (sujeto+verbo)","Solo palabras sueltas","No habla"],["Yes (subject+verb)","Single words only","Does not speak"]) },
    ]},
    { title: s("7. Alimentación y Sueño","7. Feeding & Sleep"), questions: [
      { id:"apetito",       label:s("Apetito","Appetite"),type:"select",options:a(["Bueno","Selectivo/Melindroso","Voraz","Poco apetito"],["Good","Selective/Picky","Voracious","Poor appetite"]) },
      { id:"masticacion",   label:s("¿Mastica bien los sólidos?","Chews solids well?"),type:"radio",options:a(["Sí","No, se atora","Solo come papillas"],["Yes","No, chokes","Only eats purées"]) },
      { id:"sueno_calidad", label:s("Calidad del sueño","Sleep quality"),type:"select",options:a(["Duerme toda la noche","Despertares frecuentes","Dificultad para conciliar","Pesadillas"],["Sleeps through the night","Frequent awakenings","Difficulty falling asleep","Nightmares"]) },
      { id:"duerme_con",    label:s("¿Con quién duerme?","Who does the child sleep with?"),type:"text",placeholder:s("Solo, padres, hermanos...","Alone, parents, siblings...") },
    ]},
    { title: s("8. Autonomía e Higiene","8. Autonomy & Hygiene"), questions: [
      { id:"control_esfinteres",label:s("Control de esfínteres (baño)","Bladder/bowel control"),type:"select",options:a(["Controla día y noche","Solo día","Avisar","Usa pañal"],["Controls day and night","Day only","Needs reminders","Uses diapers"]) },
      { id:"vestido",           label:s("Vestimenta","Dressing"),type:"select",options:a(["Se viste solo","Ayuda parcial","Dependiente total"],["Dresses independently","Partial help","Fully dependent"]) },
      { id:"aseo",              label:s("Aseo personal (lavado manos/dientes)","Personal hygiene (hands/teeth)"),type:"select",options:a(["Independiente","Necesita ayuda","Se resiste"],["Independent","Needs help","Resists"]) },
    ]},
    { title: s("9. Área Emocional y Social","9. Emotional & Social Area"), questions: [
      { id:"contacto_visual",label:s("Contacto visual","Eye contact"),type:"select",options:a(["Sostenido","Fugaz","Nulo/Evita"],["Sustained","Fleeting","Absent/Avoids"]) },
      { id:"juego",          label:s("Tipo de juego","Play type"),type:"select",options:a(["Simbólico (imaginación)","Funcional (carritos)","Repetitivo/Alinear","Sensorial"],["Symbolic (imaginative)","Functional (toy cars)","Repetitive/Lining","Sensory"]) },
      { id:"rabietas",       label:s("¿Presenta rabietas frecuentes?","Frequent tantrums?"),type:"radio",options:a(["Sí, diarias","Ocasionales","Rara vez"],["Yes, daily","Occasional","Rarely"]) },
      { id:"pares",          label:s("Relación con otros niños","Relationship with other children"),type:"select",options:a(["Juega e interactúa","Observa sin jugar","Ignora/Aisla","Agrede"],["Plays and interacts","Observes without playing","Ignores/Isolates","Aggresses"]) },
    ]},
    { title: s("10. OBSERVACIONES DEL TERAPEUTA","10. THERAPIST OBSERVATIONS"), questions: [
      { id:"apariencia",          label:s("Apariencia física y aliño:","Physical appearance:"),type:"textarea",placeholder:s("Descripción física...","Physical description...") },
      { id:"actitud_evaluacion",  label:s("Actitud ante la evaluación:","Attitude during evaluation:"),type:"radio",options:a(["Colaborador","Inhibido","Oposicionista"],["Cooperative","Inhibited","Oppositional"]) },
      { id:"contacto_visual_obs", label:s("Contacto visual (Observación):","Eye contact (Observation):"),type:"radio",options:a(["Adecuado","Fugaz","Ausente"],["Adequate","Fleeting","Absent"]) },
      { id:"notas_adicionales",   label:s("Notas Adicionales:","Additional Notes:"),type:"textarea",placeholder:s("Observaciones finales...","Final observations...") },
    ]},
  ]
}

// ─── ABA SESSION ─────────────────────────────────────────────────────────────
export function getAbaData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title:s("1. Información de la Sesión","1. Session Information"), icon:<Calendar size={20}/>, questions:[
      { id:"fecha_sesion",      label:s("Fecha de la sesión","Session date"),              type:"date",     required:true },
      { id:"duracion_minutos",  label:s("Duración (minutos)","Duration (minutes)"),        type:"number",   placeholder:"45", min:15, max:120 },
      { id:"tipo_sesion",       label:s("Tipo de sesión","Session type"),                  type:"select",   options:a(["Individual","Grupal","Domiciliaria","Virtual"],["Individual","Group","Home visit","Virtual"]), required:true },
      { id:"objetivo_principal",label:s("Objetivo principal de la sesión","Main session objective"), type:"textarea", placeholder:s("Describe el objetivo terapéutico...","Describe the therapeutic objective..."), required:true },
    ]},
    { title:s("2. Registro ABC (Análisis Conductual)","2. ABC Record (Behavioral Analysis)"), icon:<Activity size={20}/>, questions:[
      { id:"antecedente",     label:s("Antecedente (A)","Antecedent (A)"),              type:"textarea", placeholder:s("¿Qué sucedió ANTES de la conducta?","What happened BEFORE the behavior?") },
      { id:"conducta",        label:s("Conducta Observada (B)","Observed Behavior (B)"),type:"textarea", placeholder:s("Describe EXACTAMENTE qué hizo el niño...","Describe EXACTLY what the child did..."), required:true },
      { id:"consecuencia",    label:s("Consecuencia (C)","Consequence (C)"),            type:"textarea", placeholder:s("¿Qué pasó DESPUÉS?","What happened AFTER?") },
      { id:"funcion_estimada",label:s("Función estimada de la conducta","Estimated function of behavior"), type:"select", options:a(["Acceso a Tangible","Atención Social","Escape/Evitación","Sensorial/Automático","Múltiple"],["Access to Tangible","Social Attention","Escape/Avoidance","Sensory/Automatic","Multiple"]) },
    ]},
    { title:s("3. Métricas de Desempeño","3. Performance Metrics"), icon:<TrendingUp size={20}/>, questions:[
      { id:"nivel_atencion",          label:s("Nivel de atención sostenida","Sustained attention level"),    type:"range",min:1,max:5,labels:a(["Muy disperso","Disperso","Moderado","Bueno","Excelente"],["Very scattered","Scattered","Moderate","Good","Excellent"]) },
      { id:"respuesta_instrucciones", label:s("Respuesta a instrucciones","Response to instructions"),       type:"range",min:1,max:5,labels:a(["Nula","Mínima","Parcial","Buena","Inmediata"],["None","Minimal","Partial","Good","Immediate"]) },
      { id:"iniciativa_comunicativa", label:s("Iniciativa comunicativa","Communicative initiative"),         type:"range",min:1,max:5,labels:a(["Nula","Muy baja","Baja","Moderada","Alta"],["None","Very low","Low","Moderate","High"]) },
      { id:"tolerancia_frustracion",  label:s("Tolerancia a la frustración","Frustration tolerance"),        type:"range",min:1,max:5,labels:a(["Muy baja","Baja","Moderada","Buena","Excelente"],["Very low","Low","Moderate","Good","Excellent"]) },
      { id:"interaccion_social",      label:s("Calidad de interacción social","Social interaction quality"), type:"range",min:1,max:5,labels:a(["Evitativa","Mínima","Funcional","Buena","Espontánea"],["Avoidant","Minimal","Functional","Good","Spontaneous"]) },
    ]},
    { title:s("4. Habilidades Trabajadas","4. Skills Practiced"), icon:<Target size={20}/>, questions:[
      { id:"habilidades_objetivo",  label:s("Habilidades específicas trabajadas","Specific skills practiced"), type:"multiselect", options:a(
          ["Contacto visual","Imitación motora","Seguimiento de instrucciones","Comunicación funcional","Juego simbólico","Habilidades sociales","Autorregulación emocional","Motricidad fina","Motricidad gruesa","Atención conjunta","Espera de turnos","Flexibilidad cognitiva"],
          ["Eye contact","Motor imitation","Following instructions","Functional communication","Symbolic play","Social skills","Emotional self-regulation","Fine motor","Gross motor","Joint attention","Turn taking","Cognitive flexibility"])},
      { id:"nivel_logro_objetivos", label:s("Nivel de logro de objetivos","Objective achievement level"), type:"select", options:a(["No logrado (0-25%)","Parcialmente logrado (26-50%)","Mayormente logrado (51-75%)","Completamente logrado (76-100%)"],["Not achieved (0-25%)","Partially achieved (26-50%)","Mostly achieved (51-75%)","Fully achieved (76-100%)"]) },
      { id:"ayudas_utilizadas",     label:s("Nivel de ayudas proporcionadas","Level of prompts provided"), type:"select", options:a(["Independiente (sin ayuda)","Ayuda gestual","Ayuda verbal","Modelado","Guía física parcial","Guía física total"],["Independent (no prompt)","Gestural prompt","Verbal prompt","Modeling","Partial physical guidance","Full physical guidance"]) },
    ]},
    { title:s("5. Intervenciones y Estrategias","5. Interventions & Strategies"), icon:<Zap size={20}/>, questions:[
      { id:"tecnicas_aplicadas",     label:s("Técnicas ABA aplicadas","ABA techniques applied"), type:"multiselect", options:a(
          ["Reforzamiento positivo","Extinción","Moldeamiento","Encadenamiento","Análisis de tareas","Tiempo fuera","Economía de fichas","Contrato conductual","Entrenamiento en comunicación funcional"],
          ["Positive reinforcement","Extinction","Shaping","Chaining","Task analysis","Time out","Token economy","Behavioral contract","Functional communication training"])},
      { id:"reforzadores_efectivos", label:s("Reforzadores más efectivos","Most effective reinforcers"), type:"textarea", placeholder:s("Lista los reforzadores que funcionaron mejor hoy...","List the reinforcers that worked best today...") },
      { id:"conductas_desafiantes",  label:s("Conductas desafiantes presentadas","Challenging behaviors presented"), type:"textarea", placeholder:s("Describe frecuencia e intensidad...","Describe frequency and intensity...") },
      { id:"estrategias_manejo",     label:s("Estrategias de manejo utilizadas","Management strategies used"), type:"textarea", placeholder:s("Cómo se abordaron las conductas desafiantes...","How challenging behaviors were addressed...") },
    ]},
    { title:s("6. Progreso y Evolución","6. Progress & Development"), icon:<Award size={20}/>, hasIA:true, questions:[
      { id:"avances_observados", label:s("Avances observados en esta sesión","Progress observed in this session"),   type:"textarea", placeholder:s("Logros específicos, mejoras respecto a sesiones anteriores...","Specific achievements, improvements vs. previous sessions..."), aiGenerated:true },
      { id:"areas_dificultad",   label:s("Áreas de dificultad persistente","Areas of persistent difficulty"),        type:"textarea", placeholder:s("Aspectos que requieren más trabajo...","Aspects that require more work..."), aiGenerated:true },
      { id:"patron_aprendizaje", label:s("Patrón de aprendizaje observado","Observed learning pattern"),             type:"select",   options:a(["Aprendizaje rápido y generalización","Aprendizaje gradual","Requiere repetición intensiva","Dificultad para generalizar","Aprendizaje inconsistente"],["Fast learning and generalization","Gradual learning","Requires intensive repetition","Difficulty generalizing","Inconsistent learning"]), aiGenerated:true },
    ]},
    { title:s("7. Observaciones Clínicas (Interno)","7. Clinical Observations (Internal)"), icon:<BookOpen size={20}/>, hasIA:true, questions:[
      { id:"observaciones_tecnicas", label:s("Notas técnicas para el equipo","Technical notes for the team"),  type:"textarea", placeholder:s("Análisis profesional, hipótesis clínicas...","Professional analysis, clinical hypotheses..."), aiGenerated:true },
      { id:"alertas_clinicas",       label:s("Alertas o banderas rojas","Alerts or red flags"),                 type:"textarea", placeholder:s("Señales de preocupación, regresiones...","Warning signs, regressions..."), aiGenerated:true },
      { id:"recomendaciones_equipo", label:s("Recomendaciones para el equipo","Team recommendations"),         type:"textarea", placeholder:s("Sugerencias para siguientes sesiones...","Suggestions for upcoming sessions..."), aiGenerated:true },
      { id:"coordinacion_familia",   label:s("Necesidad de coordinación con familia","Need for family coordination"), type:"radio", options:a(["Urgente","Necesaria","Rutinaria","No necesaria"],["Urgent","Necessary","Routine","Not needed"]), aiGenerated:true },
    ]},
    { title:s("8. Tarea para Casa","8. Home Assignment"), icon:<Home size={20}/>, hasIA:true, questions:[
      { id:"actividad_casa",       label:s("Actividad sugerida para practicar en casa","Suggested home activity"),         type:"textarea", placeholder:s("Descripción detallada de la actividad...","Detailed description of the activity..."), aiGenerated:true },
      { id:"instrucciones_padres", label:s("Instrucciones específicas para los padres","Specific instructions for parents"),type:"textarea", placeholder:s("Pasos claros, qué hacer y qué evitar...","Clear steps, what to do and what to avoid..."), aiGenerated:true },
      { id:"objetivo_tarea",       label:s("Objetivo de la tarea","Assignment objective"),                                 type:"text",     placeholder:s("¿Qué habilidad refuerza esta actividad?","What skill does this activity reinforce?"), aiGenerated:true },
    ]},
    { title:s("9. Comunicación con la Familia (VISIBLE PARA PADRES)","9. Family Communication (VISIBLE TO PARENTS)"), icon:<MessageCircle size={20}/>, hasIA:true, questions:[
      { id:"mensaje_padres",    label:s("Mensaje para WhatsApp/Informe","Message for WhatsApp/Report"),      type:"textarea", placeholder:s("Este mensaje será visible para los padres...","This message will be visible to parents..."), aiGenerated:true },
      { id:"destacar_positivo", label:s("Logros para destacar a los padres","Achievements to share with parents"), type:"textarea", placeholder:s("Aspectos positivos que los padres deben saber...","Positive aspects that parents should know..."), aiGenerated:true },
      { id:"proximos_pasos",    label:s("Próximos pasos (para compartir)","Next steps (to share)"),           type:"textarea", placeholder:s("Qué viene en las siguientes sesiones...","What's coming in the next sessions..."), aiGenerated:true },
    ]},
    { title:s("10. Análisis y Planificación","10. Analysis & Planning"), icon:<Brain size={20}/>, hasIA:true, questions:[
      { id:"efectividad_sesion",     label:s("Efectividad global de la sesión","Overall session effectiveness"),   type:"range",min:1,max:5,labels:a(["Muy baja","Baja","Moderada","Alta","Muy alta"],["Very low","Low","Moderate","High","Very high"]), aiGenerated:true },
      { id:"ajustes_proxima_sesion", label:s("Ajustes para la próxima sesión","Adjustments for next session"),     type:"textarea", placeholder:s("Qué modificar, qué mantener...","What to modify, maintain..."), aiGenerated:true },
      { id:"necesidades_materiales", label:s("Materiales o recursos necesarios","Materials or resources needed"),  type:"text",     placeholder:s("Qué se necesita conseguir para próximas sesiones...","What is needed for upcoming sessions..."), aiGenerated:true },
    ]},
  ]
}

// ─── HOME ENVIRONMENT ────────────────────────────────────────────────────────
export function getEntornoHogarData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title:s("1. Información General de la Visita","1. Visit General Information"), questions:[
      { id:"fecha_visita",       label:s("Fecha de la visita domiciliaria","Home visit date"),                         type:"date" },
      { id:"duracion_visita",    label:s("Duración aproximada","Approximate duration"),                               type:"text", placeholder:s("Ej: 1 hora 30 min","E.g.: 1 hour 30 min") },
      { id:"personas_presentes", label:s("¿Quiénes estuvieron presentes?","Who was present?"),                       type:"textarea", placeholder:s("Madre, padre, hermanos...","Mother, father, siblings...") },
    ]},
    { title:s("2. Estructura y Condiciones del Hogar","2. Home Structure & Conditions"), questions:[
      { id:"tipo_vivienda",           label:s("Tipo de vivienda","Housing type"),                          type:"select", options:a(["Casa independiente","Departamento","Cuarto alquilado","Vivienda compartida","Otro"],["Single-family home","Apartment","Rented room","Shared housing","Other"]) },
      { id:"num_habitaciones",        label:s("Número de habitaciones","Number of rooms"),                 type:"text", placeholder:s("Ej: 2 dormitorios","E.g.: 2 bedrooms") },
      { id:"espacio_juego",           label:s("¿Existe espacio dedicado para juego/terapia?","Is there dedicated play/therapy space?"), type:"radio", options:a(["Sí, espacio amplio","Espacio reducido","No hay espacio específico"],["Yes, ample space","Limited space","No specific space"]) },
      { id:"condiciones_higiene",     label:s("Condiciones generales de higiene","General hygiene conditions"),        type:"select", options:a(["Excelente","Buena","Regular","Necesita mejoras"],["Excellent","Good","Fair","Needs improvement"]) },
      { id:"iluminacion_ventilacion", label:s("Iluminación y ventilación","Lighting and ventilation"),                type:"select", options:a(["Adecuada","Insuficiente","Excesiva"],["Adequate","Insufficient","Excessive"]) },
    ]},
    { title:s("3. Recursos y Materiales Disponibles","3. Available Resources & Materials"), questions:[
      { id:"juguetes_disponibles",label:s("Juguetes y materiales educativos","Toys and educational materials"),        type:"textarea", placeholder:s("Lista los juguetes, libros, materiales sensoriales disponibles...","List available toys, books, sensory materials...") },
      { id:"acceso_tecnologia",   label:s("Acceso a tecnología (tablet, TV, computadora)","Technology access (tablet, TV, computer)"), type:"radio", options:a(["Sí, con supervisión","Sí, sin límites","No tiene acceso"],["Yes, supervised","Yes, unlimited","No access"]) },
      { id:"tiempo_pantalla",     label:s("Tiempo diario frente a pantallas","Daily screen time"),                    type:"text", placeholder:s("Ej: 2 horas","E.g.: 2 hours") },
    ]},
    { title:s("4. Rutinas y Estructura Familiar","4. Routines & Family Structure"), questions:[
      { id:"rutina_diaria",        label:s("Descripción de la rutina diaria del niño","Child's daily routine"),                   type:"textarea", placeholder:s("Hora de despertar, comidas, siestas...","Wake time, meals, naps...") },
      { id:"consistencia_rutinas", label:s("¿Las rutinas son consistentes?","Are routines consistent?"),                         type:"radio",    options:a(["Sí, muy estructuradas","Parcialmente","No, son variables"],["Yes, very structured","Partially","No, they vary"]) },
      { id:"hora_dormir",          label:s("Horario habitual de dormir","Usual bedtime"),                                        type:"text",     placeholder:"E.g.: 8:30 PM" },
      { id:"actividades_familia",  label:s("Actividades que realiza la familia junta","Family activities together"),              type:"textarea", placeholder:s("Comidas, paseos, juegos...","Meals, outings, games...") },
    ]},
    { title:s("5. Dinámica Familiar y Relaciones","5. Family Dynamics & Relationships"), questions:[
      { id:"interaccion_padres",  label:s("Calidad de interacción padres-niño observada","Observed parent-child interaction quality"), type:"select", options:a(["Muy positiva y cálida","Funcional","Tensa o conflictiva","Distante"],["Very positive and warm","Functional","Tense or conflictive","Distant"]) },
      { id:"estilo_crianza",      label:s("Estilo de crianza predominante","Predominant parenting style"),                            type:"select", options:a(["Autoritativo (límites + afecto)","Permisivo","Autoritario","Negligente","Mixto"],["Authoritative (limits + warmth)","Permissive","Authoritarian","Neglectful","Mixed"]) },
      { id:"manejo_conductas",    label:s("¿Cómo manejan las conductas desafiantes?","How are challenging behaviors handled?"),        type:"textarea", placeholder:s("Estrategias que usan los padres...","Strategies parents use...") },
      { id:"apoyo_red_familiar",  label:s("Red de apoyo familiar/social","Family/social support network"),                            type:"textarea", placeholder:s("Abuelos, tíos, vecinos...","Grandparents, relatives, neighbors...") },
    ]},
    { title:s("6. Alimentación y Hábitos de Salud","6. Feeding & Health Habits"), questions:[
      { id:"tipo_alimentacion",    label:s("Tipo de alimentación del niño","Child's diet"),      type:"textarea", placeholder:s("Describe dieta típica, preferencias, rechazos...","Describe typical diet, preferences, rejections...") },
      { id:"quien_prepara_comida", label:s("¿Quién prepara las comidas?","Who prepares meals?"), type:"text",     placeholder:s("Ej: Madre principalmente","E.g.: Mother primarily") },
      { id:"come_familia",         label:s("¿Come junto a la familia?","Eats with the family?"),type:"radio",    options:a(["Sí, siempre","A veces","No, come solo"],["Yes, always","Sometimes","No, eats alone"]) },
    ]},
    { title:s("7. Observaciones del Comportamiento en Casa","7. Behavior Observations at Home"), questions:[
      { id:"comportamiento_observado", label:s("Comportamiento del niño durante la visita","Child's behavior during the visit"),       type:"textarea", placeholder:s("Actividad, estado de ánimo, interacción con familiares...","Activity, mood, interaction with family members...") },
      { id:"diferencias_consultorio",  label:s("¿Diferencias con el comportamiento en consultorio?","Differences from clinic behavior?"), type:"textarea", placeholder:s("Conductas que aparecen solo en casa o solo en terapia...","Behaviors that appear only at home or only in therapy...") },
      { id:"estimulacion_sensorial",   label:s("Estímulos sensoriales del entorno (ruido, luz, texturas)","Environmental sensory stimuli (noise, light, textures)"), type:"textarea", placeholder:s("TV encendida, música, mascotas, olores...","TV on, music, pets, smells...") },
    ]},
    { title:s("8. Barreras y Facilitadores para la Terapia","8. Barriers & Facilitators for Therapy"), questions:[
      { id:"barreras_identificadas",label:s("Barreras para implementar estrategias en casa","Barriers to implementing home strategies"), type:"textarea", placeholder:s("Falta de tiempo, espacios reducidos, resistencia familiar...","Lack of time, limited space, family resistance...") },
      { id:"facilitadores",         label:s("Facilitadores y fortalezas del entorno","Environmental facilitators and strengths"),       type:"textarea", placeholder:s("Compromiso de padres, buenos recursos, rutinas claras...","Parent commitment, good resources, clear routines...") },
      { id:"disposicion_cambio",    label:s("Disposición de la familia para realizar cambios","Family readiness to make changes"),      type:"radio", options:a(["Muy motivados","Moderadamente dispuestos","Resistentes","Ambivalentes"],["Very motivated","Moderately willing","Resistant","Ambivalent"]) },
    ]},
    { title:s("9. Recomendaciones Específicas para el Hogar","9. Specific Home Recommendations"), questions:[
      { id:"recomendaciones_espacio", label:s("Recomendaciones sobre el espacio físico","Physical space recommendations"),      type:"textarea", placeholder:s("Adaptar rincón sensorial, reducir distractores...","Adapt sensory corner, reduce distractors...") },
      { id:"recomendaciones_rutinas", label:s("Ajustes sugeridos en rutinas","Suggested routine adjustments"),                 type:"textarea", placeholder:s("Horarios de sueño, estructura de comidas...","Sleep schedules, meal structure...") },
      { id:"actividades_casa",        label:s("Actividades terapéuticas sugeridas para realizar en casa","Suggested therapeutic home activities"), type:"textarea", placeholder:s("Ejercicios de motricidad, juegos de imitación...","Motor exercises, imitation games...") },
    ]},
    { title:s("10. Análisis e Impresión General (IA Asistida)","10. General Analysis & Impression (AI-Assisted)"), hasIA:true, questions:[
      { id:"impresion_general",      label:s("Impresión General del Entorno","General Environmental Impression"),              type:"textarea", placeholder:s("Resumen de la visita y evaluación global...","Visit summary and overall assessment...") },
      { id:"mensaje_padres_entorno", label:s("Mensaje para los Padres (Generado por IA)","Message for Parents (AI-Generated)"),type:"textarea", placeholder:s("Este campo puede ser generado por IA...","This field can be AI-generated..."), aiGenerated:true },
      { id:"seguimiento_requerido",  label:s("¿Requiere seguimiento o nueva visita?","Follow-up or new visit required?"),      type:"radio", options:a(["Sí, en 1 mes","Sí, en 3 meses","No necesario por ahora"],["Yes, in 1 month","Yes, in 3 months","Not needed for now"]) },
    ]},
  ]
}

// ─── BRIEF-2 ─────────────────────────────────────────────────────────────────
export function getBrief2Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq = a(["Nunca","A veces","Con frecuencia"],["Never","Sometimes","Often"])
  return [
    { title:s("1. Información de la Evaluación","1. Evaluation Information"), icon:<Brain size={20}/>, questions:[
      { id:"fecha_evaluacion", label:s("Fecha de evaluación","Evaluation date"),                 type:"date",   required:true },
      { id:"evaluador",        label:s("Nombre del evaluador","Evaluator name"),                 type:"text",   required:true },
      { id:"informante",       label:s("Informante","Informant"),                               type:"select", options:a(["Madre","Padre","Ambos padres","Maestro/a","Terapeuta","Otro"],["Mother","Father","Both parents","Teacher","Therapist","Other"]) },
      { id:"edad_evaluado",    label:s("Edad del niño (años)","Child's age (years)"),            type:"number", min:2, max:18 },
      { id:"motivo_evaluacion",label:s("Motivo de la evaluación","Reason for evaluation"),       type:"textarea", placeholder:s("Por qué se realiza esta evaluación...","Why this evaluation is being conducted...") },
    ]},
    { title:s("2. Índice de Inhibición","2. Inhibition Index"), description:s("Capacidad para resistir impulsos y detener comportamiento en el momento apropiado","Ability to resist impulses and stop behavior at the appropriate moment"), icon:<Activity size={20}/>, questions:[
      { id:"inhibe_1",    label:s("Tiene problemas para esperar su turno","Has trouble waiting their turn"),                      type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_2",    label:s("Actúa de manera más salvaje o ruidosa que otros niños","Acts wilder or louder than other children"), type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_3",    label:s("Interrumpe conversaciones de otros","Interrupts others' conversations"),                       type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_4",    label:s("Reacciona de manera exagerada ante pequeños problemas","Overreacts to small problems"),        type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_5",    label:s("Tiene problemas para controlar sus emociones","Has trouble controlling emotions"),             type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_6",    label:s("Tiene arrebatos de ira desproporcionados","Has disproportionate anger outbursts"),            type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_notas",label:s("Observaciones sobre inhibición","Observations on inhibition"),                               type:"textarea", placeholder:s("Ejemplos específicos, contextos donde mejora/empeora...","Specific examples, contexts where it improves/worsens...") },
    ]},
    { title:s("3. Índice de Flexibilidad Cognitiva","3. Cognitive Flexibility Index"), description:s("Capacidad para cambiar de actividad, revisar planes y adaptarse a nuevas situaciones","Ability to shift activities, revise plans, and adapt to new situations"), icon:<Target size={20}/>, questions:[
      { id:"flex_1",    label:s("Se resiste a cambios de rutina, comida, lugares","Resists changes in routine, food, places"),       type:"range",min:1,max:3,labels:freq },
      { id:"flex_2",    label:s("Se altera por situaciones inesperadas","Gets upset by unexpected situations"),                      type:"range",min:1,max:3,labels:freq },
      { id:"flex_3",    label:s("Persiste en la misma respuesta aunque no funcione","Persists with the same response even if it doesn't work"), type:"range",min:1,max:3,labels:freq },
      { id:"flex_4",    label:s("Tiene problemas aceptando diferentes formas de resolver problemas","Has trouble accepting different ways to solve problems"), type:"range",min:1,max:3,labels:freq },
      { id:"flex_5",    label:s("Se queda atascado en un tema o actividad","Gets stuck on a topic or activity"),                    type:"range",min:1,max:3,labels:freq },
      { id:"flex_6",    label:s("Le cuesta pasar de una actividad a otra","Has trouble transitioning between activities"),           type:"range",min:1,max:3,labels:freq },
      { id:"flex_notas",label:s("Observaciones sobre flexibilidad","Observations on flexibility"),                                  type:"textarea", placeholder:s("Situaciones de rigidez, estrategias que funcionan...","Rigidity situations, strategies that work...") },
    ]},
    { title:s("4. Control Emocional","4. Emotional Control"), description:s("Capacidad para modular respuestas emocionales apropiadamente","Ability to modulate emotional responses appropriately"), icon:<Heart size={20}/>, questions:[
      { id:"emocional_1",    label:s("Tiene estallidos emocionales por razones mínimas","Has emotional outbursts for minor reasons"),type:"range",min:1,max:3,labels:freq },
      { id:"emocional_2",    label:s("Las pequeñas cosas provocan grandes reacciones","Small things cause big reactions"),           type:"range",min:1,max:3,labels:freq },
      { id:"emocional_3",    label:s("Cambia de humor rápidamente","Mood changes quickly"),                                         type:"range",min:1,max:3,labels:freq },
      { id:"emocional_4",    label:s("Se altera fácilmente","Gets upset easily"),                                                   type:"range",min:1,max:3,labels:freq },
      { id:"emocional_5",    label:s("Reacciona más emocionalmente que otros niños de su edad","Reacts more emotionally than peers"),type:"range",min:1,max:3,labels:freq },
      { id:"emocional_notas",label:s("Observaciones sobre control emocional","Observations on emotional control"),                  type:"textarea", placeholder:s("Desencadenantes, duración de episodios, recuperación...","Triggers, episode duration, recovery...") },
    ]},
    { title:s("5. Memoria de Trabajo","5. Working Memory"), description:s("Capacidad para mantener información en la mente para completar una tarea","Ability to hold information in mind to complete a task"), icon:<Brain size={20}/>, questions:[
      { id:"memoria_1",    label:s("Olvida lo que debía hacer","Forgets what they were supposed to do"),                     type:"range",min:1,max:3,labels:freq },
      { id:"memoria_2",    label:s("Tiene problemas recordando instrucciones","Has trouble remembering instructions"),        type:"range",min:1,max:3,labels:freq },
      { id:"memoria_3",    label:s("Pierde el hilo de lo que está haciendo","Loses track of what they are doing"),           type:"range",min:1,max:3,labels:freq },
      { id:"memoria_4",    label:s("Tiene problemas recordando lo que acaba de escuchar","Has trouble remembering what was just said"), type:"range",min:1,max:3,labels:freq },
      { id:"memoria_5",    label:s("Necesita que le repitan las cosas varias veces","Needs things repeated multiple times"), type:"range",min:1,max:3,labels:freq },
      { id:"memoria_notas",label:s("Observaciones sobre memoria","Observations on memory"),                                  type:"textarea", placeholder:s("Estrategias de compensación, apoyos visuales...","Compensation strategies, visual supports...") },
    ]},
    { title:s("6. Planificación y Organización","6. Planning & Organization"), description:s("Capacidad para manejar tareas presentes y futuras","Ability to manage present and future tasks"), icon:<Target size={20}/>, questions:[
      { id:"plan_1",    label:s("No planifica con anticipación las tareas","Does not plan tasks in advance"),                    type:"range",min:1,max:3,labels:freq },
      { id:"plan_2",    label:s("Tiene problemas para organizar actividades","Has trouble organizing activities"),               type:"range",min:1,max:3,labels:freq },
      { id:"plan_3",    label:s("Subestima el tiempo necesario para completar tareas","Underestimates the time needed to complete tasks"), type:"range",min:1,max:3,labels:freq },
      { id:"plan_4",    label:s("Deja las cosas desordenadas","Leaves things disorganized"),                                    type:"range",min:1,max:3,labels:freq },
      { id:"plan_5",    label:s("Tiene problemas para priorizar actividades","Has trouble prioritizing activities"),             type:"range",min:1,max:3,labels:freq },
      { id:"plan_notas",label:s("Observaciones sobre planificación","Observations on planning"),                                type:"textarea", placeholder:s("Estrategias compensatorias...","Compensatory strategies...") },
    ]},
    { title:s("7. Análisis y Conclusiones (IA)","7. Analysis & Conclusions (AI)"), icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"analisis_ia",       label:s("Análisis Integral IA","AI Comprehensive Analysis"),  type:"textarea", placeholder:s("Análisis completo generado por IA...","Complete AI-generated analysis..."), aiGenerated:true },
      { id:"recomendaciones_ia",label:s("Recomendaciones Terapéuticas","Therapeutic Recommendations"), type:"textarea", placeholder:s("Recomendaciones específicas...","Specific recommendations..."), aiGenerated:true },
      { id:"informe_padres",    label:s("Informe para Padres","Parent Report"),               type:"textarea", placeholder:s("Informe comprensible para la familia...","Comprehensible report for the family..."), aiGenerated:true },
    ]},
  ]
}

// ─── ADOS-2 ───────────────────────────────────────────────────────────────────
export function getAdos2Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const sev = a(["Apropiado","Leve","Marcado","Ausente"],["Appropriate","Mild","Marked","Absent"])
  const pres = a(["Ausente","Presente","Frecuente"],["Absent","Present","Frequent"])
  return [
    { title:s("1. Datos de la Evaluación","1. Evaluation Data"), icon:<Eye size={20}/>, questions:[
      { id:"fecha_eval",            label:s("Fecha de evaluación","Evaluation date"),          type:"date",   required:true },
      { id:"modulo_aplicado",       label:s("Módulo aplicado","Module applied"),               type:"select", options:a(["Módulo 1 (Sin lenguaje)","Módulo 2 (Frases)","Módulo 3 (Fluente)","Módulo 4 (Adolescente/Adulto)"],["Module 1 (No language)","Module 2 (Phrases)","Module 3 (Fluent)","Module 4 (Adolescent/Adult)"]) },
      { id:"duracion_eval",         label:s("Duración de la evaluación (minutos)","Evaluation duration (minutes)"), type:"number", min:30, max:90 },
      { id:"evaluador_certificado", label:s("Evaluador certificado ADOS-2","Certified ADOS-2 evaluator"), type:"text" },
    ]},
    { title:s("2. Comunicación Social","2. Social Communication"), description:s("Evaluación de habilidades comunicativas y sociales","Assessment of communicative and social skills"), icon:<MessageCircle size={20}/>, questions:[
      { id:"contacto_visual",       label:s("Contacto visual durante la interacción social","Eye contact during social interaction"),             type:"range",min:0,max:3,labels:sev },
      { id:"expresiones_faciales",  label:s("Expresiones faciales dirigidas a otros","Facial expressions directed at others"),                   type:"range",min:0,max:3,labels:sev },
      { id:"integracion_mirada",    label:s("Integración de mirada y otras conductas sociales","Integration of gaze with other social behaviors"),type:"range",min:0,max:3,labels:sev },
      { id:"sonrisa_social",        label:s("Sonrisa social compartida","Shared social smile"),                                                   type:"range",min:0,max:3,labels:sev },
      { id:"comunicacion_afectiva", label:s("Rango de comunicación afectiva","Range of affective communication"),                                type:"range",min:0,max:3,labels:sev },
      { id:"atencion_conjunta",     label:s("Respuesta a atención conjunta","Response to joint attention"),                                      type:"range",min:0,max:3,labels:sev },
      { id:"inicio_atencion",       label:s("Iniciativa de atención conjunta","Initiating joint attention"),                                     type:"range",min:0,max:3,labels:sev },
      { id:"notas_comunicacion",    label:s("Observaciones comunicación","Communication observations"),                                          type:"textarea" },
    ]},
    { title:s("3. Interacción Social Recíproca","3. Reciprocal Social Interaction"), description:s("Calidad de las interacciones sociales bidireccionales","Quality of bidirectional social interactions"), icon:<Users size={20}/>, questions:[
      { id:"busqueda_compartir",   label:s("Búsqueda de compartir experiencias","Seeking to share experiences"), type:"range",min:0,max:3,labels:sev },
      { id:"ofrecimiento_consuelo",label:s("Ofrecimiento de consuelo","Offering comfort"),                       type:"range",min:0,max:3,labels:sev },
      { id:"respuesta_nombre",     label:s("Respuesta al nombre","Response to name"),                            type:"range",min:0,max:3,labels:sev },
      { id:"reciprocidad_social",  label:s("Calidad de reciprocidad social","Quality of social reciprocity"),    type:"range",min:0,max:3,labels:sev },
      { id:"interes_otros",        label:s("Interés en otros niños","Interest in other children"),               type:"range",min:0,max:3,labels:sev },
      { id:"notas_interaccion",    label:s("Observaciones interacción","Interaction observations"),              type:"textarea" },
    ]},
    { title:s("4. Juego e Imaginación","4. Play & Imagination"), description:s("Evaluación de juego simbólico y creatividad","Assessment of symbolic play and creativity"), icon:<Activity size={20}/>, questions:[
      { id:"juego_funcional",   label:s("Juego funcional con objetos","Functional play with objects"),    type:"range",min:0,max:3,labels:sev },
      { id:"juego_imaginativo", label:s("Juego imaginativo/creativo","Imaginative/creative play"),        type:"range",min:0,max:3,labels:sev },
      { id:"juego_imitativo",   label:s("Juego imitativo social","Social imitative play"),                type:"range",min:0,max:3,labels:sev },
      { id:"notas_juego",       label:s("Observaciones sobre juego","Play observations"),                 type:"textarea" },
    ]},
    { title:s("5. Conductas Restringidas y Repetitivas","5. Restricted & Repetitive Behaviors"), description:s("Patrones de comportamiento estereotipados","Stereotyped behavioral patterns"), icon:<Target size={20}/>, questions:[
      { id:"estereotipias_motoras",  label:s("Estereotipias motoras","Motor stereotypies"),              type:"range",min:0,max:2,labels:pres },
      { id:"manipulacion_objetos",   label:s("Uso repetitivo de objetos","Repetitive use of objects"),  type:"range",min:0,max:2,labels:pres },
      { id:"intereses_restringidos", label:s("Intereses restringidos intensos","Intense restricted interests"), type:"range",min:0,max:2,labels:pres },
      { id:"rituales_compulsiones",  label:s("Rituales o compulsiones","Rituals or compulsions"),       type:"range",min:0,max:2,labels:pres },
      { id:"sensibilidad_sensorial", label:s("Sensibilidad sensorial inusual","Unusual sensory sensitivity"), type:"range",min:0,max:2,labels:pres },
      { id:"notas_conductas",        label:s("Observaciones conductas","Behavior observations"),        type:"textarea" },
    ]},
    { title:s("6. Análisis Diagnóstico (IA)","6. Diagnostic Analysis (AI)"), icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"puntuacion_total",             label:s("Puntuación total calculada","Calculated total score"),     type:"number", readonly:true },
      { id:"nivel_severidad",              label:s("Nivel de severidad","Severity level"),                     type:"text",   readonly:true },
      { id:"analisis_diagnostico_ia",      label:s("Análisis Diagnóstico IA","AI Diagnostic Analysis"),        type:"textarea", aiGenerated:true },
      { id:"recomendaciones_intervencion", label:s("Recomendaciones de Intervención","Intervention Recommendations"), type:"textarea", aiGenerated:true },
      { id:"informe_familia_ados",         label:s("Informe para Familia","Family Report"),                    type:"textarea", aiGenerated:true },
    ]},
  ]
}

// ─── VINELAND-3 ───────────────────────────────────────────────────────────────
export function getVineland3Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq   = a(["Usualmente","A veces","Nunca"],["Usually","Sometimes","Never"])
  const freqNA = a(["Usualmente","A veces","Nunca","N/A"],["Usually","Sometimes","Never","N/A"])
  return [
    { title:s("1. Información General","1. General Information"), icon:<Users size={20}/>, questions:[
      { id:"fecha_eval_vineland", label:s("Fecha de evaluación","Evaluation date"),   type:"date",   required:true },
      { id:"informante_vineland", label:s("Informante","Informant"),                  type:"select", options:a(["Madre","Padre","Ambos","Cuidador primario","Maestro"],["Mother","Father","Both","Primary caregiver","Teacher"]) },
      { id:"forma_aplicacion",    label:s("Forma de aplicación","Administration form"),type:"select", options:a(["Entrevista semi-estructurada","Formulario para padres","Formulario para maestros"],["Semi-structured interview","Parent report form","Teacher report form"]) },
    ]},
    { title:s("2. Dominio de Comunicación","2. Communication Domain"), description:s("Habilidades receptivas, expresivas y escritas","Receptive, expressive, and written language skills"), icon:<MessageCircle size={20}/>, questions:[
      { id:"com_receptiva",           label:s("¿Entiende cuando se le dice 'no'?","Understands when told 'no'?"),          type:"radio",options:freq },
      { id:"com_sigue_instrucciones", label:s("¿Sigue instrucciones simples?","Follows simple instructions?"),             type:"radio",options:freq },
      { id:"com_entiende_2pasos",     label:s("¿Sigue instrucciones de 2 pasos?","Follows 2-step instructions?"),          type:"radio",options:freq },
      { id:"com_expresiva_palabras",  label:s("¿Usa palabras para pedir cosas?","Uses words to ask for things?"),          type:"radio",options:freq },
      { id:"com_frases_completas",    label:s("¿Usa frases completas de 4+ palabras?","Uses complete sentences of 4+ words?"), type:"radio",options:freq },
      { id:"com_cuenta_experiencias", label:s("¿Cuenta experiencias con detalle?","Recounts experiences in detail?"),      type:"radio",options:freq },
      { id:"com_escrita",             label:s("¿Escribe su nombre?","Writes their name?"),                                 type:"radio",options:freqNA },
      { id:"com_notas",               label:s("Observaciones comunicación","Communication observations"),                  type:"textarea" },
    ]},
    { title:s("3. Dominio de Vida Diaria","3. Daily Living Domain"), description:s("Autonomía personal, doméstica y comunitaria","Personal, domestic, and community autonomy"), icon:<Home size={20}/>, questions:[
      { id:"vida_come_solo",     label:s("¿Come solo con cuchara/tenedor?","Eats independently with spoon/fork?"),    type:"radio",options:freq },
      { id:"vida_bebe_vaso",     label:s("¿Bebe de un vaso sin derramar?","Drinks from a cup without spilling?"),     type:"radio",options:freq },
      { id:"vida_lava_manos",    label:s("¿Se lava las manos solo?","Washes hands independently?"),                   type:"radio",options:freq },
      { id:"vida_viste_superior",label:s("¿Se pone ropa superior solo?","Puts on upper clothing independently?"),     type:"radio",options:freq },
      { id:"vida_bano",          label:s("¿Usa el baño independientemente?","Uses the bathroom independently?"),      type:"radio",options:freq },
      { id:"vida_tareas_casa",   label:s("¿Ayuda en tareas domésticas simples?","Helps with simple household tasks?"),type:"radio",options:freq },
      { id:"vida_dinero",        label:s("¿Entiende el concepto de dinero?","Understands the concept of money?"),     type:"radio",options:freqNA },
      { id:"vida_notas",         label:s("Observaciones vida diaria","Daily living observations"),                    type:"textarea" },
    ]},
    { title:s("4. Dominio de Socialización","4. Socialization Domain"), description:s("Relaciones interpersonales, juego y manejo emocional","Interpersonal relationships, play, and emotional management"), icon:<Heart size={20}/>, questions:[
      { id:"soc_sonrie_familiar",label:s("¿Sonríe a personas familiares?","Smiles at familiar people?"),              type:"radio",options:freq },
      { id:"soc_muestra_afecto", label:s("¿Muestra afecto a cuidadores?","Shows affection toward caregivers?"),        type:"radio",options:freq },
      { id:"soc_juega_otros",    label:s("¿Juega interactivamente con otros niños?","Plays interactively with other children?"), type:"radio",options:freq },
      { id:"soc_comparte",       label:s("¿Comparte juguetes espontáneamente?","Shares toys spontaneously?"),          type:"radio",options:freq },
      { id:"soc_respeta_turnos", label:s("¿Respeta turnos en juegos?","Respects turns in games?"),                    type:"radio",options:freq },
      { id:"soc_empatia",        label:s("¿Muestra preocupación por otros?","Shows concern for others?"),             type:"radio",options:freq },
      { id:"soc_amistad",        label:s("¿Tiene amigos cercanos?","Has close friends?"),                             type:"radio",options:freqNA },
      { id:"soc_notas",          label:s("Observaciones socialización","Socialization observations"),                 type:"textarea" },
    ]},
    { title:s("5. Dominio de Habilidades Motoras","5. Motor Skills Domain"), description:s("Motricidad gruesa y fina","Gross and fine motor skills"), icon:<Activity size={20}/>, questions:[
      { id:"motor_camina",label:s("¿Camina sin ayuda?","Walks without assistance?"),             type:"radio",options:freq },
      { id:"motor_corre", label:s("¿Corre coordinadamente?","Runs in a coordinated way?"),       type:"radio",options:freq },
      { id:"motor_salta", label:s("¿Salta con ambos pies?","Jumps with both feet?"),             type:"radio",options:freq },
      { id:"motor_pelota",label:s("¿Atrapa una pelota?","Catches a ball?"),                      type:"radio",options:freq },
      { id:"motor_pinza", label:s("¿Usa pinza digital (pulgar-índice)?","Uses pincer grasp (thumb-index)?"), type:"radio",options:freq },
      { id:"motor_dibuja",label:s("¿Dibuja formas reconocibles?","Draws recognizable shapes?"),  type:"radio",options:freqNA },
      { id:"motor_notas", label:s("Observaciones motoras","Motor observations"),                 type:"textarea" },
    ]},
    { title:s("6. Análisis de Conducta Adaptativa (IA)","6. Adaptive Behavior Analysis (AI)"), icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"puntuacion_comunicacion",    label:s("Puntuación Comunicación","Communication Score"),                type:"number",readonly:true },
      { id:"puntuacion_vida_diaria",     label:s("Puntuación Vida Diaria","Daily Living Score"),                  type:"number",readonly:true },
      { id:"puntuacion_socializacion",   label:s("Puntuación Socialización","Socialization Score"),               type:"number",readonly:true },
      { id:"indice_conducta_adaptativa", label:s("Índice Global de Conducta Adaptativa","Adaptive Behavior Composite"), type:"number",readonly:true },
      { id:"analisis_vineland_ia",       label:s("Análisis Integral IA","AI Comprehensive Analysis"),            type:"textarea",aiGenerated:true },
      { id:"areas_fortaleza",            label:s("Áreas de Fortaleza","Strength Areas"),                         type:"textarea",aiGenerated:true },
      { id:"areas_prioridad",            label:s("Áreas Prioritarias de Intervención","Priority Intervention Areas"), type:"textarea",aiGenerated:true },
      { id:"informe_padres_vineland",    label:s("Informe para Padres","Parent Report"),                         type:"textarea",aiGenerated:true },
    ]},
  ]
}

// ─── WISC-V ───────────────────────────────────────────────────────────────────
export function getWiscvData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  return [
    { title:s("1. Información de la Evaluación","1. Evaluation Information"), icon:<Brain size={20}/>, questions:[
      { id:"fecha_eval_wisc",       label:s("Fecha de evaluación","Evaluation date"),                         type:"date",   required:true },
      { id:"evaluador_wisc",        label:s("Psicólogo evaluador","Evaluating psychologist"),                 type:"text",   required:true },
      { id:"edad_cronologica",      label:s("Edad cronológica (años, meses)","Chronological age (years, months)"), type:"text", placeholder:s("Ej: 7 años, 3 meses","E.g.: 7 years, 3 months") },
      { id:"motivo_eval_cognitiva", label:s("Motivo de evaluación","Reason for evaluation"),                  type:"textarea" },
    ]},
    { title:s("2. Índice de Comprensión Verbal (ICV)","2. Verbal Comprehension Index (VCI)"), description:s("Razonamiento verbal, formación de conceptos","Verbal reasoning, concept formation"), icon:<MessageCircle size={20}/>, questions:[
      { id:"icv_semejanzas",  label:s("Semejanzas — Puntuación escalar","Similarities — Scaled score"),    type:"number",min:1,max:19 },
      { id:"icv_vocabulario", label:s("Vocabulario — Puntuación escalar","Vocabulary — Scaled score"),     type:"number",min:1,max:19 },
      { id:"icv_informacion", label:s("Información — Puntuación escalar","Information — Scaled score"),    type:"number",min:1,max:19 },
      { id:"icv_comprension", label:s("Comprensión — Puntuación escalar","Comprehension — Scaled score"),  type:"number",min:1,max:19 },
      { id:"icv_total",       label:s("ICV Total","VCI Total"),                                            type:"number",readonly:true },
      { id:"icv_percentil",   label:s("Percentil ICV","VCI Percentile"),                                   type:"number",readonly:true },
      { id:"icv_notas",       label:s("Observaciones ICV","VCI Observations"),                             type:"textarea" },
    ]},
    { title:s("3. Índice Visoespacial (IVE)","3. Visual Spatial Index (VSI)"), description:s("Razonamiento espacial y visual","Spatial and visual reasoning"), icon:<Eye size={20}/>, questions:[
      { id:"ive_cubos",     label:s("Cubos — Puntuación escalar","Block Design — Scaled score"),       type:"number",min:1,max:19 },
      { id:"ive_puzles",    label:s("Puzles visuales — Puntuación escalar","Visual Puzzles — Scaled score"), type:"number",min:1,max:19 },
      { id:"ive_total",     label:s("IVE Total","VSI Total"),                                         type:"number",readonly:true },
      { id:"ive_percentil", label:s("Percentil IVE","VSI Percentile"),                                type:"number",readonly:true },
      { id:"ive_notas",     label:s("Observaciones IVE","VSI Observations"),                          type:"textarea" },
    ]},
    { title:s("4. Índice de Razonamiento Fluido (IRF)","4. Fluid Reasoning Index (FRI)"), description:s("Razonamiento lógico y solución de problemas","Logical reasoning and problem solving"), icon:<Target size={20}/>, questions:[
      { id:"irf_matrices",   label:s("Matrices — Puntuación escalar","Matrix Reasoning — Scaled score"),  type:"number",min:1,max:19 },
      { id:"irf_balanzas",   label:s("Balanzas — Puntuación escalar","Figure Weights — Scaled score"),    type:"number",min:1,max:19 },
      { id:"irf_aritmetica", label:s("Aritmética — Puntuación escalar","Arithmetic — Scaled score"),      type:"number",min:1,max:19 },
      { id:"irf_total",      label:s("IRF Total","FRI Total"),                                           type:"number",readonly:true },
      { id:"irf_percentil",  label:s("Percentil IRF","FRI Percentile"),                                  type:"number",readonly:true },
      { id:"irf_notas",      label:s("Observaciones IRF","FRI Observations"),                            type:"textarea" },
    ]},
    { title:s("5. Índice de Memoria de Trabajo (IMT)","5. Working Memory Index (WMI)"), description:s("Memoria auditiva a corto plazo","Short-term auditory memory"), icon:<Brain size={20}/>, questions:[
      { id:"imt_digitos",    label:s("Dígitos — Puntuación escalar","Digit Span — Scaled score"),          type:"number",min:1,max:19 },
      { id:"imt_imagenes",   label:s("Span de imágenes — Puntuación escalar","Picture Span — Scaled score"),type:"number",min:1,max:19 },
      { id:"imt_total",      label:s("IMT Total","WMI Total"),                                            type:"number",readonly:true },
      { id:"imt_percentil",  label:s("Percentil IMT","WMI Percentile"),                                   type:"number",readonly:true },
      { id:"imt_notas",      label:s("Observaciones IMT","WMI Observations"),                             type:"textarea" },
    ]},
    { title:s("6. Índice de Velocidad de Procesamiento (IVP)","6. Processing Speed Index (PSI)"), description:s("Velocidad y precisión perceptiva","Perceptual speed and accuracy"), icon:<Activity size={20}/>, questions:[
      { id:"ivp_claves",      label:s("Claves — Puntuación escalar","Coding — Scaled score"),             type:"number",min:1,max:19 },
      { id:"ivp_busqueda",    label:s("Búsqueda de símbolos — Puntuación escalar","Symbol Search — Scaled score"), type:"number",min:1,max:19 },
      { id:"ivp_cancelacion", label:s("Cancelación — Puntuación escalar","Cancellation — Scaled score"),  type:"number",min:1,max:19 },
      { id:"ivp_total",       label:s("IVP Total","PSI Total"),                                           type:"number",readonly:true },
      { id:"ivp_percentil",   label:s("Percentil IVP","PSI Percentile"),                                  type:"number",readonly:true },
      { id:"ivp_notas",       label:s("Observaciones IVP","PSI Observations"),                            type:"textarea" },
    ]},
    { title:s("7. Análisis Cognitivo Integral (IA)","7. Comprehensive Cognitive Analysis (AI)"), icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"ci_total",                  label:s("CI Total (Escala Completa)","Full Scale IQ (FSIQ)"),          type:"number",min:40,max:160,readonly:true },
      { id:"ci_percentil",              label:s("Percentil CI Total","FSIQ Percentile"),                       type:"number",readonly:true },
      { id:"clasificacion_ci",          label:s("Clasificación Descriptiva","Descriptive Classification"),     type:"text",  readonly:true },
      { id:"perfil_cognitivo_ia",       label:s("Análisis del Perfil Cognitivo","Cognitive Profile Analysis"),type:"textarea",aiGenerated:true },
      { id:"fortalezas_debilidades",    label:s("Fortalezas y Debilidades","Strengths and Weaknesses"),        type:"textarea",aiGenerated:true },
      { id:"implicaciones_educativas",  label:s("Implicaciones Educativas","Educational Implications"),        type:"textarea",aiGenerated:true },
      { id:"recomendaciones_cognitivas",label:s("Recomendaciones Específicas","Specific Recommendations"),     type:"textarea",aiGenerated:true },
      { id:"informe_padres_wisc",       label:s("Informe para Padres","Parent Report"),                        type:"textarea",aiGenerated:true },
    ]},
  ]
}

// ─── BASC-3 ───────────────────────────────────────────────────────────────────
export function getBasc3Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq5  = a(["Nunca","Rara vez","A veces","Frecuente","Muy frecuente"],["Never","Rarely","Sometimes","Often","Very often"])
  const level5 = a(["Muy bajo","Bajo","Promedio","Alto","Muy alto"],["Very low","Low","Average","High","Very high"])
  return [
    { title:s("1. Información de la Evaluación","1. Evaluation Information"), icon:<Activity size={20}/>, questions:[
      { id:"fecha_eval_basc", label:s("Fecha de evaluación","Evaluation date"), type:"date",   required:true },
      { id:"informante_basc", label:s("Informante","Informant"),                type:"select", options:a(["Padre","Madre","Ambos","Maestro","Autoevaluación"],["Father","Mother","Both","Teacher","Self-report"]) },
      { id:"forma_basc",      label:s("Forma aplicada","Form applied"),         type:"select", options:["Preschool (2-5 years)","Children (6-11 years)","Adolescents (12-21 years)"] },
    ]},
    { title:s("2. Escalas Clínicas - Problemas Externalizantes","2. Clinical Scales - Externalizing Problems"), description:s("Conductas dirigidas hacia el exterior","Behaviors directed outward"), icon:<Activity size={20}/>, questions:[
      { id:"basc_hiperactividad",     label:s("Hiperactividad","Hyperactivity"),       type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_agresion",           label:s("Agresión","Aggression"),                type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_problemas_conducta", label:s("Problemas de conducta","Conduct problems"), type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_notas_extern",       label:s("Observaciones externalizantes","Externalizing observations"), type:"textarea" },
    ]},
    { title:s("3. Escalas Clínicas - Problemas Internalizantes","3. Clinical Scales - Internalizing Problems"), description:s("Conductas dirigidas hacia adentro","Behaviors directed inward"), icon:<Heart size={20}/>, questions:[
      { id:"basc_ansiedad",     label:s("Ansiedad","Anxiety"),         type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_depresion",    label:s("Depresión","Depression"),     type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_somatizacion", label:s("Somatización","Somatization"),type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_notas_intern", label:s("Observaciones internalizantes","Internalizing observations"), type:"textarea" },
    ]},
    { title:s("4. Escalas Adaptativas","4. Adaptive Scales"), description:s("Habilidades positivas y adaptativas","Positive and adaptive skills"), icon:<Activity size={20}/>, questions:[
      { id:"basc_habilidades_sociales", label:s("Habilidades sociales","Social skills"),        type:"range",min:1,max:5,labels:level5 },
      { id:"basc_liderazgo",            label:s("Liderazgo","Leadership"),                      type:"range",min:1,max:5,labels:level5 },
      { id:"basc_habilidades_estudio",  label:s("Habilidades de estudio","Study skills"),       type:"range",min:1,max:5,labels:level5 },
      { id:"basc_adaptabilidad",        label:s("Adaptabilidad","Adaptability"),                type:"range",min:1,max:5,labels:level5 },
      { id:"basc_notas_adapt",          label:s("Observaciones adaptativas","Adaptive observations"), type:"textarea" },
    ]},
    { title:s("5. Análisis Conductual Integral (IA)","5. Comprehensive Behavioral Analysis (AI)"), icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"indice_sintomas_conductuales", label:s("Índice de Síntomas Conductuales","Behavioral Symptoms Index"), type:"number",readonly:true },
      { id:"perfil_riesgo",                label:s("Perfil de Riesgo","Risk Profile"),                             type:"text",  readonly:true },
      { id:"analisis_basc_ia",             label:s("Análisis Conductual IA","AI Behavioral Analysis"),             type:"textarea",aiGenerated:true },
      { id:"areas_preocupacion",           label:s("Áreas de Preocupación","Areas of Concern"),                    type:"textarea",aiGenerated:true },
      { id:"fortalezas_conductuales",      label:s("Fortalezas Conductuales","Behavioral Strengths"),              type:"textarea",aiGenerated:true },
      { id:"plan_intervencion_conductual", label:s("Plan de Intervención","Intervention Plan"),                    type:"textarea",aiGenerated:true },
      { id:"informe_padres_basc",          label:s("Informe para Padres","Parent Report"),                         type:"textarea",aiGenerated:true },
    ]},
  ]
}

// Legacy exports kept for backward compat — default Spanish
export const ANAMNESIS_DATA      = getAnamnesisData(false)
export const ABA_DATA            = getAbaData(false)
export const ENTORNO_HOGAR_DATA  = getEntornoHogarData(false)
export const BRIEF2_DATA         = getBrief2Data(false)
export const ADOS2_DATA          = getAdos2Data(false)
export const VINELAND3_DATA      = getVineland3Data(false)
export const WISCV_DATA          = getWiscvData(false)
export const BASC3_DATA          = getBasc3Data(false)
