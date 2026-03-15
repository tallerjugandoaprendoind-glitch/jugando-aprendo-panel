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



const S = (isEN: boolean, es: string, en: string) => en
const A = (isEN: boolean, esArr: string[], enArr: string[]) => enArr

// ─── ANAMNESIS ───────────────────────────────────────────────────────────────
export function getAnamnesisData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title: "1. Identification Data", questions: [
      { id:"informante",  label:"Informant name",       type:"text",   placeholder:"Full name" },
      { id:"parentesco",  label:"Relationship to child",type:"select", options:["Mother","Father","Grandparent","Guardian","Other"] },
      { id:"vive_con",    label:"Who does the child live with?", type:"text", placeholder:"E.g.: Parents and siblings" },
      { id:"escolaridad", label:"Current schooling", type:"select", options:["Not enrolled","Preschool","Primary","Special Ed."] },
    ]},
    { title: "2. Reason for Consultation", questions: [
      { id:"motivo_principal",label:"Main reason for consultation",type:"textarea",placeholder:"Describe the main problem or concern..." },
      { id:"derivado_por",    label:"Referred by?",type:"select",options:["Self-referral","Educational Institution","Pediatrician","Psychologist","Other"] },
      { id:"expectativas",    label:"What do you hope to achieve with therapy?",type:"textarea",placeholder:"Parent goals..." },
    ]},
    { title: "3. Prenatal History (Pregnancy & Delivery)", questions: [
      { id:"tipo_embarazo",      label:"Was the pregnancy planned?",type:"radio",options:["Yes","No"] },
      { id:"complicaciones_emb", label:"Were there pregnancy complications?",type:"textarea",placeholder:"Threatened miscarriage, infections..." },
      { id:"tipo_parto",         label:"Delivery type",type:"select",options:["Natural","Emergency C-section","Planned C-section"] },
      { id:"llanto",             label:"Did the baby cry at birth?",type:"radio",options:["Yes","No","Unknown"] },
      { id:"incubadora",         label:"Required incubator?",type:"radio",options:["Yes","No"] },
    ]},
    { title: "4. Medical History", questions: [
      { id:"enfermedades",label:"Any serious illnesses?",type:"textarea",placeholder:"Seizures, high fevers, ear infections..." },
      { id:"examenes",    label:"Previous exams/studies?",type:"select",options:["None","Hearing","Vision","Neurological","Genetic","Multiple"] },
      { id:"medicacion",  label:"Current medications?",type:"text",placeholder:"Name and dose..." },
    ]},
    { title: "5. Psychomotor Development", questions: [
      { id:"sosten_cefalico",label:"Age of head control",type:"text",placeholder:"E.g.: 3 months" },
      { id:"gateo",          label:"Age of crawling",type:"text",placeholder:"E.g.: 8 months" },
      { id:"marcha",         label:"Age of independent walking",type:"text",placeholder:"E.g.: 1 year 2 months" },
      { id:"caidas",         label:"Falls frequently?",type:"radio",options:["Yes","No"] },
      { id:"motricidad_fina",label:"Fine motor skills (pincer, grip)",type:"select",options:["Adequate","Difficulty gripping","Manual clumsiness"] },
    ]},
    { title: "6. Language Development", questions: [
      { id:"primeras_palabras",     label:"Age of first words",type:"text",placeholder:"E.g.: 1 year" },
      { id:"intencion_comunicativa",label:"Shows communicative intent?",type:"radio",options:["Yes","No","Sometimes"] },
      { id:"comprension",           label:"Comprehension level",type:"select",options:["Understands everything","Understands simple commands","Doesn't seem to understand","Ignores own name"] },
      { id:"frases",                label:"Forms sentences?",type:"radio",options:["Yes (subject+verb)","Single words only","Does not speak"] },
    ]},
    { title: "7. Feeding & Sleep", questions: [
      { id:"apetito",       label:"Appetite",type:"select",options:["Good","Selective/Picky","Voracious","Poor appetite"] },
      { id:"masticacion",   label:"Chews solids well?",type:"radio",options:["Yes","No, chokes","Only eats purées"] },
      { id:"sueno_calidad", label:"Sleep quality",type:"select",options:["Sleeps through the night","Frequent awakenings","Difficulty falling asleep","Nightmares"] },
      { id:"duerme_con",    label:"Who does the child sleep with?",type:"text",placeholder:"Alone, parents, siblings..." },
    ]},
    { title: "8. Autonomy & Hygiene", questions: [
      { id:"control_esfinteres",label:"Bladder/bowel control",type:"select",options:["Controls day and night","Day only","Needs reminders","Uses diapers"] },
      { id:"vestido",           label:"Dressing",type:"select",options:["Dresses independently","Partial help","Fully dependent"] },
      { id:"aseo",              label:"Personal hygiene (hands/teeth)",type:"select",options:["Independent","Needs help","Resists"] },
    ]},
    { title: "9. Emotional & Social Area", questions: [
      { id:"contacto_visual",label:"Eye contact",type:"select",options:["Sustained","Fleeting","Absent/Avoids"] },
      { id:"juego",          label:"Play type",type:"select",options:["Symbolic (imaginative)","Functional (toy cars)","Repetitive/Lining","Sensory"] },
      { id:"rabietas",       label:"Frequent tantrums?",type:"radio",options:["Yes, daily","Occasional","Rarely"] },
      { id:"pares",          label:"Relationship with other children",type:"select",options:["Plays and interacts","Observes without playing","Ignores/Isolates","Aggresses"] },
    ]},
    { title: "10. THERAPIST OBSERVATIONS", questions: [
      { id:"apariencia",          label:"Physical appearance:",type:"textarea",placeholder:"Physical description..." },
      { id:"actitud_evaluacion",  label:"Attitude during evaluation:",type:"radio",options:["Cooperative","Inhibited","Oppositional"] },
      { id:"contacto_visual_obs", label:"Eye contact (Observation):",type:"radio",options:["Adequate","Fleeting","Absent"] },
      { id:"notas_adicionales",   label:"Additional Notes:",type:"textarea",placeholder:"Final observations..." },
    ]},
  ]
}

// ─── ABA SESSION ─────────────────────────────────────────────────────────────
export function getAbaData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title:"1. Session Information", icon:<Calendar size={20}/>, questions:[
      { id:"fecha_sesion",      label:"Session date",              type:"date",     required:true },
      { id:"duracion_minutos",  label:"Duration (minutes)",        type:"number",   placeholder:"45", min:15, max:120 },
      { id:"tipo_sesion",       label:"Session type",                  type:"select",   options:["Individual","Group","Home visit","Virtual"], required:true },
      { id:"objetivo_principal",label:"Main session objective", type:"textarea", placeholder:"Describe the therapeutic objective...", required:true },
    ]},
    { title:"2. ABC Record (Behavioral Analysis)", icon:<Activity size={20}/>, questions:[
      { id:"antecedente",     label:"Antecedent (A)",              type:"textarea", placeholder:"What happened BEFORE the behavior?" },
      { id:"conducta",        label:"Observed Behavior (B)",type:"textarea", placeholder:"Describe EXACTLY what the child did...", required:true },
      { id:"consecuencia",    label:"Consequence (C)",            type:"textarea", placeholder:"What happened AFTER?" },
      { id:"funcion_estimada",label:"Estimated function of behavior", type:"select", options:["Access to Tangible","Social Attention","Escape/Avoidance","Sensory/Automatic","Multiple"] },
    ]},
    { title:"3. Performance Metrics", icon:<TrendingUp size={20}/>, questions:[
      { id:"nivel_atencion",          label:"Sustained attention level",    type:"range",min:1,max:5,labels:["Very scattered","Scattered","Moderate","Good","Excellent"] },
      { id:"respuesta_instrucciones", label:"Response to instructions",       type:"range",min:1,max:5,labels:["None","Minimal","Partial","Good","Immediate"] },
      { id:"iniciativa_comunicativa", label:"Communicative initiative",         type:"range",min:1,max:5,labels:["None","Very low","Low","Moderate","High"] },
      { id:"tolerancia_frustracion",  label:"Frustration tolerance",        type:"range",min:1,max:5,labels:["Very low","Low","Moderate","Good","Excellent"] },
      { id:"interaccion_social",      label:"Social interaction quality", type:"range",min:1,max:5,labels:["Avoidant","Minimal","Functional","Good","Spontaneous"] },
    ]},
    { title:"4. Skills Practiced", icon:<Target size={20}/>, questions:[
      { id:"habilidades_objetivo",  label:"Specific skills practiced", type:"multiselect", options:["Eye contact","Motor imitation","Following instructions","Functional communication","Symbolic play","Social skills","Emotional self-regulation","Fine motor","Gross motor","Joint attention","Turn taking","Cognitive flexibility"]},
      { id:"nivel_logro_objetivos", label:"Objective achievement level", type:"select", options:["Not achieved (0-25%)","Partially achieved (26-50%)","Mostly achieved (51-75%)","Fully achieved (76-100%)"] },
      { id:"ayudas_utilizadas",     label:"Level of prompts provided", type:"select", options:["Independent (no prompt)","Gestural prompt","Verbal prompt","Modeling","Partial physical guidance","Full physical guidance"] },
    ]},
    { title:"5. Interventions & Strategies", icon:<Zap size={20}/>, questions:[
      { id:"tecnicas_aplicadas",     label:"ABA techniques applied", type:"multiselect", options:["Positive reinforcement","Extinction","Shaping","Chaining","Task analysis","Time out","Token economy","Behavioral contract","Functional communication training"]},
      { id:"reforzadores_efectivos", label:"Most effective reinforcers", type:"textarea", placeholder:"List the reinforcers that worked best today..." },
      { id:"conductas_desafiantes",  label:"Challenging behaviors presented", type:"textarea", placeholder:"Describe frequency and intensity..." },
      { id:"estrategias_manejo",     label:"Management strategies used", type:"textarea", placeholder:"How challenging behaviors were addressed..." },
    ]},
    { title:"6. Progress & Development", icon:<Award size={20}/>, hasIA:true, questions:[
      { id:"avances_observados", label:"Progress observed in this session",   type:"textarea", placeholder:"Specific achievements, improvements vs. previous sessions...", aiGenerated:true },
      { id:"areas_dificultad",   label:"Areas of persistent difficulty",        type:"textarea", placeholder:"Aspects that require more work...", aiGenerated:true },
      { id:"patron_aprendizaje", label:"Observed learning pattern",             type:"select",   options:["Fast learning and generalization","Gradual learning","Requires intensive repetition","Difficulty generalizing","Inconsistent learning"], aiGenerated:true },
    ]},
    { title:"7. Clinical Observations (Internal)", icon:<BookOpen size={20}/>, hasIA:true, questions:[
      { id:"observaciones_tecnicas", label:"Technical notes for the team",  type:"textarea", placeholder:"Professional analysis, clinical hypotheses...", aiGenerated:true },
      { id:"alertas_clinicas",       label:"Alerts or red flags",                 type:"textarea", placeholder:"Warning signs, regressions...", aiGenerated:true },
      { id:"recomendaciones_equipo", label:"Team recommendations",         type:"textarea", placeholder:"Suggestions for upcoming sessions...", aiGenerated:true },
      { id:"coordinacion_familia",   label:"Need for family coordination", type:"radio", options:["Urgent","Necessary","Routine","Not needed"], aiGenerated:true },
    ]},
    { title:"8. Home Assignment", icon:<Home size={20}/>, hasIA:true, questions:[
      { id:"actividad_casa",       label:"Suggested home activity",         type:"textarea", placeholder:"Detailed description of the activity...", aiGenerated:true },
      { id:"instrucciones_padres", label:"Specific instructions for parents",type:"textarea", placeholder:"Clear steps, what to do and what to avoid...", aiGenerated:true },
      { id:"objetivo_tarea",       label:"Assignment objective",                                 type:"text",     placeholder:"What skill does this activity reinforce?", aiGenerated:true },
    ]},
    { title:"9. Family Communication (VISIBLE TO PARENTS)", icon:<MessageCircle size={20}/>, hasIA:true, questions:[
      { id:"mensaje_padres",    label:"Message for WhatsApp/Report",      type:"textarea", placeholder:"This message will be visible to parents...", aiGenerated:true },
      { id:"destacar_positivo", label:"Achievements to share with parents", type:"textarea", placeholder:"Positive aspects that parents should know...", aiGenerated:true },
      { id:"proximos_pasos",    label:"Next steps (to share)",           type:"textarea", placeholder:"What's coming in the next sessions...", aiGenerated:true },
    ]},
    { title:"10. Analysis & Planning", icon:<Brain size={20}/>, hasIA:true, questions:[
      { id:"efectividad_sesion",     label:"Overall session effectiveness",   type:"range",min:1,max:5,labels:["Very low","Low","Moderate","High","Very high"], aiGenerated:true },
      { id:"ajustes_proxima_sesion", label:"Adjustments for next session",     type:"textarea", placeholder:"What to modify, maintain...", aiGenerated:true },
      { id:"necesidades_materiales", label:"Materials or resources needed",  type:"text",     placeholder:"What is needed for upcoming sessions...", aiGenerated:true },
    ]},
  ]
}

// ─── HOME ENVIRONMENT ────────────────────────────────────────────────────────
export function getEntornoHogarData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  return [
    { title:"1. Visit General Information", questions:[
      { id:"fecha_visita",       label:"Home visit date",                         type:"date" },
      { id:"duracion_visita",    label:"Approximate duration",                               type:"text", placeholder:"E.g.: 1 hour 30 min" },
      { id:"personas_presentes", label:"Who was present?",                       type:"textarea", placeholder:"Mother, father, siblings..." },
    ]},
    { title:"2. Home Structure & Conditions", questions:[
      { id:"tipo_vivienda",           label:"Housing type",                          type:"select", options:["Single-family home","Apartment","Rented room","Shared housing","Other"] },
      { id:"num_habitaciones",        label:"Number of rooms",                 type:"text", placeholder:"E.g.: 2 bedrooms" },
      { id:"espacio_juego",           label:"Is there dedicated play/therapy space?", type:"radio", options:["Yes, ample space","Limited space","No specific space"] },
      { id:"condiciones_higiene",     label:"General hygiene conditions",        type:"select", options:["Excellent","Good","Fair","Needs improvement"] },
      { id:"iluminacion_ventilacion", label:"Lighting and ventilation",                type:"select", options:["Adequate","Insufficient","Excessive"] },
    ]},
    { title:"3. Available Resources & Materials", questions:[
      { id:"juguetes_disponibles",label:"Toys and educational materials",        type:"textarea", placeholder:"List available toys, books, sensory materials..." },
      { id:"acceso_tecnologia",   label:"Technology access (tablet, TV, computer)", type:"radio", options:["Yes, supervised","Yes, unlimited","No access"] },
      { id:"tiempo_pantalla",     label:"Daily screen time",                    type:"text", placeholder:"E.g.: 2 hours" },
    ]},
    { title:"4. Routines & Family Structure", questions:[
      { id:"rutina_diaria",        label:"Child's daily routine",                   type:"textarea", placeholder:"Wake time, meals, naps..." },
      { id:"consistencia_rutinas", label:"Are routines consistent?",                         type:"radio",    options:["Yes, very structured","Partially","No, they vary"] },
      { id:"hora_dormir",          label:"Usual bedtime",                                        type:"text",     placeholder:"E.g.: 8:30 PM" },
      { id:"actividades_familia",  label:"Family activities together",              type:"textarea", placeholder:"Meals, outings, games..." },
    ]},
    { title:"5. Family Dynamics & Relationships", questions:[
      { id:"interaccion_padres",  label:"Observed parent-child interaction quality", type:"select", options:["Very positive and warm","Functional","Tense or conflictive","Distant"] },
      { id:"estilo_crianza",      label:"Predominant parenting style",                            type:"select", options:["Authoritative (limits + warmth)","Permissive","Authoritarian","Neglectful","Mixed"] },
      { id:"manejo_conductas",    label:"How are challenging behaviors handled?",        type:"textarea", placeholder:"Strategies parents use..." },
      { id:"apoyo_red_familiar",  label:"Family/social support network",                            type:"textarea", placeholder:"Grandparents, relatives, neighbors..." },
    ]},
    { title:"6. Feeding & Health Habits", questions:[
      { id:"tipo_alimentacion",    label:"Child's diet",      type:"textarea", placeholder:"Describe typical diet, preferences, rejections..." },
      { id:"quien_prepara_comida", label:"Who prepares meals?", type:"text",     placeholder:"E.g.: Mother primarily" },
      { id:"come_familia",         label:"Eats with the family?",type:"radio",    options:["Yes, always","Sometimes","No, eats alone"] },
    ]},
    { title:"7. Behavior Observations at Home", questions:[
      { id:"comportamiento_observado", label:"Child's behavior during the visit",       type:"textarea", placeholder:"Activity, mood, interaction with family members..." },
      { id:"diferencias_consultorio",  label:"Differences from clinic behavior?", type:"textarea", placeholder:"Behaviors that appear only at home or only in therapy..." },
      { id:"estimulacion_sensorial",   label:"Environmental sensory stimuli (noise, light, textures)", type:"textarea", placeholder:"TV on, music, pets, smells..." },
    ]},
    { title:"8. Barriers & Facilitators for Therapy", questions:[
      { id:"barreras_identificadas",label:"Barriers to implementing home strategies", type:"textarea", placeholder:"Lack of time, limited space, family resistance..." },
      { id:"facilitadores",         label:"Environmental facilitators and strengths",       type:"textarea", placeholder:"Parent commitment, good resources, clear routines..." },
      { id:"disposicion_cambio",    label:"Family readiness to make changes",      type:"radio", options:["Very motivated","Moderately willing","Resistant","Ambivalent"] },
    ]},
    { title:"9. Specific Home Recommendations", questions:[
      { id:"recomendaciones_espacio", label:"Physical space recommendations",      type:"textarea", placeholder:"Adapt sensory corner, reduce distractors..." },
      { id:"recomendaciones_rutinas", label:"Suggested routine adjustments",                 type:"textarea", placeholder:"Sleep schedules, meal structure..." },
      { id:"actividades_casa",        label:"Suggested therapeutic home activities", type:"textarea", placeholder:"Motor exercises, imitation games..." },
    ]},
    { title:"10. General Analysis & Impression (AI-Assisted)", hasIA:true, questions:[
      { id:"impresion_general",      label:"General Environmental Impression",              type:"textarea", placeholder:"Visit summary and overall assessment..." },
      { id:"mensaje_padres_entorno", label:"Message for Parents (AI-Generated)",type:"textarea", placeholder:"This field can be AI-generated...", aiGenerated:true },
      { id:"seguimiento_requerido",  label:"Follow-up or new visit required?",      type:"radio", options:["Yes, in 1 month","Yes, in 3 months","Not needed for now"] },
    ]},
  ]
}

// ─── BRIEF-2 ─────────────────────────────────────────────────────────────────
export function getBrief2Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq = ["Never","Sometimes","Often"]
  return [
    { title:"1. Evaluation Information", icon:<Brain size={20}/>, questions:[
      { id:"fecha_evaluacion", label:"Evaluation date",                 type:"date",   required:true },
      { id:"evaluador",        label:"Evaluator name",                 type:"text",   required:true },
      { id:"informante",       label:"Informant",                               type:"select", options:["Mother","Father","Both parents","Teacher","Therapist","Other"] },
      { id:"edad_evaluado",    label:"Child's age (years)",            type:"number", min:2, max:18 },
      { id:"motivo_evaluacion",label:"Reason for evaluation",       type:"textarea", placeholder:"Why this evaluation is being conducted..." },
    ]},
    { title:"2. Inhibition Index", description:"Ability to resist impulses and stop behavior at the appropriate moment", icon:<Activity size={20}/>, questions:[
      { id:"inhibe_1",    label:"Has trouble waiting their turn",                      type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_2",    label:"Acts wilder or louder than other children", type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_3",    label:"Interrupts others' conversations",                       type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_4",    label:"Overreacts to small problems",        type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_5",    label:"Has trouble controlling emotions",             type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_6",    label:"Has disproportionate anger outbursts",            type:"range",min:1,max:3,labels:freq },
      { id:"inhibe_notas",label:"Observations on inhibition",                               type:"textarea", placeholder:"Specific examples, contexts where it improves/worsens..." },
    ]},
    { title:"3. Cognitive Flexibility Index", description:"Ability to shift activities, revise plans, and adapt to new situations", icon:<Target size={20}/>, questions:[
      { id:"flex_1",    label:"Resists changes in routine, food, places",       type:"range",min:1,max:3,labels:freq },
      { id:"flex_2",    label:"Gets upset by unexpected situations",                      type:"range",min:1,max:3,labels:freq },
      { id:"flex_3",    label:"Persists with the same response even if it doesn't work", type:"range",min:1,max:3,labels:freq },
      { id:"flex_4",    label:"Has trouble accepting different ways to solve problems", type:"range",min:1,max:3,labels:freq },
      { id:"flex_5",    label:"Gets stuck on a topic or activity",                    type:"range",min:1,max:3,labels:freq },
      { id:"flex_6",    label:"Has trouble transitioning between activities",           type:"range",min:1,max:3,labels:freq },
      { id:"flex_notas",label:"Observations on flexibility",                                  type:"textarea", placeholder:"Rigidity situations, strategies that work..." },
    ]},
    { title:"4. Emotional Control", description:"Ability to modulate emotional responses appropriately", icon:<Heart size={20}/>, questions:[
      { id:"emocional_1",    label:"Has emotional outbursts for minor reasons",type:"range",min:1,max:3,labels:freq },
      { id:"emocional_2",    label:"Small things cause big reactions",           type:"range",min:1,max:3,labels:freq },
      { id:"emocional_3",    label:"Mood changes quickly",                                         type:"range",min:1,max:3,labels:freq },
      { id:"emocional_4",    label:"Gets upset easily",                                                   type:"range",min:1,max:3,labels:freq },
      { id:"emocional_5",    label:"Reacts more emotionally than peers",type:"range",min:1,max:3,labels:freq },
      { id:"emocional_notas",label:"Observations on emotional control",                  type:"textarea", placeholder:"Triggers, episode duration, recovery..." },
    ]},
    { title:"5. Working Memory", description:"Ability to hold information in mind to complete a task", icon:<Brain size={20}/>, questions:[
      { id:"memoria_1",    label:"Forgets what they were supposed to do",                     type:"range",min:1,max:3,labels:freq },
      { id:"memoria_2",    label:"Has trouble remembering instructions",        type:"range",min:1,max:3,labels:freq },
      { id:"memoria_3",    label:"Loses track of what they are doing",           type:"range",min:1,max:3,labels:freq },
      { id:"memoria_4",    label:"Has trouble remembering what was just said", type:"range",min:1,max:3,labels:freq },
      { id:"memoria_5",    label:"Needs things repeated multiple times", type:"range",min:1,max:3,labels:freq },
      { id:"memoria_notas",label:"Observations on memory",                                  type:"textarea", placeholder:"Compensation strategies, visual supports..." },
    ]},
    { title:"6. Planning & Organization", description:"Ability to manage present and future tasks", icon:<Target size={20}/>, questions:[
      { id:"plan_1",    label:"Does not plan tasks in advance",                    type:"range",min:1,max:3,labels:freq },
      { id:"plan_2",    label:"Has trouble organizing activities",               type:"range",min:1,max:3,labels:freq },
      { id:"plan_3",    label:"Underestimates the time needed to complete tasks", type:"range",min:1,max:3,labels:freq },
      { id:"plan_4",    label:"Leaves things disorganized",                                    type:"range",min:1,max:3,labels:freq },
      { id:"plan_5",    label:"Has trouble prioritizing activities",             type:"range",min:1,max:3,labels:freq },
      { id:"plan_notas",label:"Observations on planning",                                type:"textarea", placeholder:"Compensatory strategies..." },
    ]},
    { title:"7. Analysis & Conclusions (AI)", icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"analisis_ia",       label:"AI Comprehensive Analysis",  type:"textarea", placeholder:"Complete AI-generated analysis...", aiGenerated:true },
      { id:"recomendaciones_ia",label:"Therapeutic Recommendations", type:"textarea", placeholder:"Specific recommendations...", aiGenerated:true },
      { id:"informe_padres",    label:"Parent Report",               type:"textarea", placeholder:"Comprehensible report for the family...", aiGenerated:true },
    ]},
  ]
}

// ─── ADOS-2 ───────────────────────────────────────────────────────────────────
export function getAdos2Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const sev = ["Appropriate","Mild","Marked","Absent"]
  const pres = ["Absent","Present","Frequent"]
  return [
    { title:"1. Evaluation Data", icon:<Eye size={20}/>, questions:[
      { id:"fecha_eval",            label:"Evaluation date",          type:"date",   required:true },
      { id:"modulo_aplicado",       label:"Module applied",               type:"select", options:["Module 1 (No language)","Module 2 (Phrases)","Module 3 (Fluent)","Module 4 (Adolescent/Adult)"] },
      { id:"duracion_eval",         label:"Evaluation duration (minutes)", type:"number", min:30, max:90 },
      { id:"evaluador_certificado", label:"Certified ADOS-2 evaluator", type:"text" },
    ]},
    { title:"2. Social Communication", description:"Assessment of communicative and social skills", icon:<MessageCircle size={20}/>, questions:[
      { id:"contacto_visual",       label:"Eye contact during social interaction",             type:"range",min:0,max:3,labels:sev },
      { id:"expresiones_faciales",  label:"Facial expressions directed at others",                   type:"range",min:0,max:3,labels:sev },
      { id:"integracion_mirada",    label:"Integration of gaze with other social behaviors",type:"range",min:0,max:3,labels:sev },
      { id:"sonrisa_social",        label:"Shared social smile",                                                   type:"range",min:0,max:3,labels:sev },
      { id:"comunicacion_afectiva", label:"Range of affective communication",                                type:"range",min:0,max:3,labels:sev },
      { id:"atencion_conjunta",     label:"Response to joint attention",                                      type:"range",min:0,max:3,labels:sev },
      { id:"inicio_atencion",       label:"Initiating joint attention",                                     type:"range",min:0,max:3,labels:sev },
      { id:"notas_comunicacion",    label:"Communication observations",                                          type:"textarea" },
    ]},
    { title:"3. Reciprocal Social Interaction", description:"Quality of bidirectional social interactions", icon:<Users size={20}/>, questions:[
      { id:"busqueda_compartir",   label:"Seeking to share experiences", type:"range",min:0,max:3,labels:sev },
      { id:"ofrecimiento_consuelo",label:"Offering comfort",                       type:"range",min:0,max:3,labels:sev },
      { id:"respuesta_nombre",     label:"Response to name",                            type:"range",min:0,max:3,labels:sev },
      { id:"reciprocidad_social",  label:"Quality of social reciprocity",    type:"range",min:0,max:3,labels:sev },
      { id:"interes_otros",        label:"Interest in other children",               type:"range",min:0,max:3,labels:sev },
      { id:"notas_interaccion",    label:"Interaction observations",              type:"textarea" },
    ]},
    { title:"4. Play & Imagination", description:"Assessment of symbolic play and creativity", icon:<Activity size={20}/>, questions:[
      { id:"juego_funcional",   label:"Functional play with objects",    type:"range",min:0,max:3,labels:sev },
      { id:"juego_imaginativo", label:"Imaginative/creative play",        type:"range",min:0,max:3,labels:sev },
      { id:"juego_imitativo",   label:"Social imitative play",                type:"range",min:0,max:3,labels:sev },
      { id:"notas_juego",       label:"Play observations",                 type:"textarea" },
    ]},
    { title:"5. Restricted & Repetitive Behaviors", description:"Stereotyped behavioral patterns", icon:<Target size={20}/>, questions:[
      { id:"estereotipias_motoras",  label:"Motor stereotypies",              type:"range",min:0,max:2,labels:pres },
      { id:"manipulacion_objetos",   label:"Repetitive use of objects",  type:"range",min:0,max:2,labels:pres },
      { id:"intereses_restringidos", label:"Intense restricted interests", type:"range",min:0,max:2,labels:pres },
      { id:"rituales_compulsiones",  label:"Rituals or compulsions",       type:"range",min:0,max:2,labels:pres },
      { id:"sensibilidad_sensorial", label:"Unusual sensory sensitivity", type:"range",min:0,max:2,labels:pres },
      { id:"notas_conductas",        label:"Behavior observations",        type:"textarea" },
    ]},
    { title:"6. Diagnostic Analysis (AI)", icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"puntuacion_total",             label:"Calculated total score",     type:"number", readonly:true },
      { id:"nivel_severidad",              label:"Severity level",                     type:"text",   readonly:true },
      { id:"analisis_diagnostico_ia",      label:"AI Diagnostic Analysis",        type:"textarea", aiGenerated:true },
      { id:"recomendaciones_intervencion", label:"Intervention Recommendations", type:"textarea", aiGenerated:true },
      { id:"informe_familia_ados",         label:"Family Report",                    type:"textarea", aiGenerated:true },
    ]},
  ]
}

// ─── VINELAND-3 ───────────────────────────────────────────────────────────────
export function getVineland3Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq   = ["Usually","Sometimes","Never"]
  const freqNA = ["Usually","Sometimes","Never","N/A"]
  return [
    { title:"1. General Information", icon:<Users size={20}/>, questions:[
      { id:"fecha_eval_vineland", label:"Evaluation date",   type:"date",   required:true },
      { id:"informante_vineland", label:"Informant",                  type:"select", options:["Mother","Father","Both","Primary caregiver","Teacher"] },
      { id:"forma_aplicacion",    label:"Administration form",type:"select", options:["Semi-structured interview","Parent report form","Teacher report form"] },
    ]},
    { title:"2. Communication Domain", description:"Receptive, expressive, and written language skills", icon:<MessageCircle size={20}/>, questions:[
      { id:"com_receptiva",           label:"Understands when told 'no'?",          type:"radio",options:freq },
      { id:"com_sigue_instrucciones", label:"Follows simple instructions?",             type:"radio",options:freq },
      { id:"com_entiende_2pasos",     label:"Follows 2-step instructions?",          type:"radio",options:freq },
      { id:"com_expresiva_palabras",  label:"Uses words to ask for things?",          type:"radio",options:freq },
      { id:"com_frases_completas",    label:"Uses complete sentences of 4+ words?", type:"radio",options:freq },
      { id:"com_cuenta_experiencias", label:"Recounts experiences in detail?",      type:"radio",options:freq },
      { id:"com_escrita",             label:"Writes their name?",                                 type:"radio",options:freqNA },
      { id:"com_notas",               label:"Communication observations",                  type:"textarea" },
    ]},
    { title:"3. Daily Living Domain", description:"Personal, domestic, and community autonomy", icon:<Home size={20}/>, questions:[
      { id:"vida_come_solo",     label:"Eats independently with spoon/fork?",    type:"radio",options:freq },
      { id:"vida_bebe_vaso",     label:"Drinks from a cup without spilling?",     type:"radio",options:freq },
      { id:"vida_lava_manos",    label:"Washes hands independently?",                   type:"radio",options:freq },
      { id:"vida_viste_superior",label:"Puts on upper clothing independently?",     type:"radio",options:freq },
      { id:"vida_bano",          label:"Uses the bathroom independently?",      type:"radio",options:freq },
      { id:"vida_tareas_casa",   label:"Helps with simple household tasks?",type:"radio",options:freq },
      { id:"vida_dinero",        label:"Understands the concept of money?",     type:"radio",options:freqNA },
      { id:"vida_notas",         label:"Daily living observations",                    type:"textarea" },
    ]},
    { title:"4. Socialization Domain", description:"Interpersonal relationships, play, and emotional management", icon:<Heart size={20}/>, questions:[
      { id:"soc_sonrie_familiar",label:"Smiles at familiar people?",              type:"radio",options:freq },
      { id:"soc_muestra_afecto", label:"Shows affection toward caregivers?",        type:"radio",options:freq },
      { id:"soc_juega_otros",    label:"Plays interactively with other children?", type:"radio",options:freq },
      { id:"soc_comparte",       label:"Shares toys spontaneously?",          type:"radio",options:freq },
      { id:"soc_respeta_turnos", label:"Respects turns in games?",                    type:"radio",options:freq },
      { id:"soc_empatia",        label:"Shows concern for others?",             type:"radio",options:freq },
      { id:"soc_amistad",        label:"Has close friends?",                             type:"radio",options:freqNA },
      { id:"soc_notas",          label:"Socialization observations",                 type:"textarea" },
    ]},
    { title:"5. Motor Skills Domain", description:"Gross and fine motor skills", icon:<Activity size={20}/>, questions:[
      { id:"motor_camina",label:"Walks without assistance?",             type:"radio",options:freq },
      { id:"motor_corre", label:"Runs in a coordinated way?",       type:"radio",options:freq },
      { id:"motor_salta", label:"Jumps with both feet?",             type:"radio",options:freq },
      { id:"motor_pelota",label:"Catches a ball?",                      type:"radio",options:freq },
      { id:"motor_pinza", label:"Uses pincer grasp (thumb-index)?", type:"radio",options:freq },
      { id:"motor_dibuja",label:"Draws recognizable shapes?",  type:"radio",options:freqNA },
      { id:"motor_notas", label:"Motor observations",                 type:"textarea" },
    ]},
    { title:"6. Adaptive Behavior Analysis (AI)", icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"puntuacion_comunicacion",    label:"Communication Score",                type:"number",readonly:true },
      { id:"puntuacion_vida_diaria",     label:"Daily Living Score",                  type:"number",readonly:true },
      { id:"puntuacion_socializacion",   label:"Socialization Score",               type:"number",readonly:true },
      { id:"indice_conducta_adaptativa", label:"Adaptive Behavior Composite", type:"number",readonly:true },
      { id:"analisis_vineland_ia",       label:"AI Comprehensive Analysis",            type:"textarea",aiGenerated:true },
      { id:"areas_fortaleza",            label:"Strength Areas",                         type:"textarea",aiGenerated:true },
      { id:"areas_prioridad",            label:"Priority Intervention Areas", type:"textarea",aiGenerated:true },
      { id:"informe_padres_vineland",    label:"Parent Report",                         type:"textarea",aiGenerated:true },
    ]},
  ]
}

// ─── WISC-V ───────────────────────────────────────────────────────────────────
export function getWiscvData(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  return [
    { title:"1. Evaluation Information", icon:<Brain size={20}/>, questions:[
      { id:"fecha_eval_wisc",       label:"Evaluation date",                         type:"date",   required:true },
      { id:"evaluador_wisc",        label:"Evaluating psychologist",                 type:"text",   required:true },
      { id:"edad_cronologica",      label:"Chronological age (years, months)", type:"text", placeholder:"E.g.: 7 years, 3 months" },
      { id:"motivo_eval_cognitiva", label:"Reason for evaluation",                  type:"textarea" },
    ]},
    { title:"2. Verbal Comprehension Index (VCI)", description:"Verbal reasoning, concept formation", icon:<MessageCircle size={20}/>, questions:[
      { id:"icv_semejanzas",  label:"Similarities — Scaled score",    type:"number",min:1,max:19 },
      { id:"icv_vocabulario", label:"Vocabulary — Scaled score",     type:"number",min:1,max:19 },
      { id:"icv_informacion", label:"Information — Scaled score",    type:"number",min:1,max:19 },
      { id:"icv_comprension", label:"Comprehension — Scaled score",  type:"number",min:1,max:19 },
      { id:"icv_total",       label:"VCI Total",                                            type:"number",readonly:true },
      { id:"icv_percentil",   label:"VCI Percentile",                                   type:"number",readonly:true },
      { id:"icv_notas",       label:"VCI Observations",                             type:"textarea" },
    ]},
    { title:"3. Visual Spatial Index (VSI)", description:"Spatial and visual reasoning", icon:<Eye size={20}/>, questions:[
      { id:"ive_cubos",     label:"Block Design — Scaled score",       type:"number",min:1,max:19 },
      { id:"ive_puzles",    label:"Visual Puzzles — Scaled score", type:"number",min:1,max:19 },
      { id:"ive_total",     label:"VSI Total",                                         type:"number",readonly:true },
      { id:"ive_percentil", label:"VSI Percentile",                                type:"number",readonly:true },
      { id:"ive_notas",     label:"VSI Observations",                          type:"textarea" },
    ]},
    { title:"4. Fluid Reasoning Index (FRI)", description:"Logical reasoning and problem solving", icon:<Target size={20}/>, questions:[
      { id:"irf_matrices",   label:"Matrix Reasoning — Scaled score",  type:"number",min:1,max:19 },
      { id:"irf_balanzas",   label:"Figure Weights — Scaled score",    type:"number",min:1,max:19 },
      { id:"irf_aritmetica", label:"Arithmetic — Scaled score",      type:"number",min:1,max:19 },
      { id:"irf_total",      label:"FRI Total",                                           type:"number",readonly:true },
      { id:"irf_percentil",  label:"FRI Percentile",                                  type:"number",readonly:true },
      { id:"irf_notas",      label:"FRI Observations",                            type:"textarea" },
    ]},
    { title:"5. Working Memory Index (WMI)", description:"Short-term auditory memory", icon:<Brain size={20}/>, questions:[
      { id:"imt_digitos",    label:"Digit Span — Scaled score",          type:"number",min:1,max:19 },
      { id:"imt_imagenes",   label:"Picture Span — Scaled score",type:"number",min:1,max:19 },
      { id:"imt_total",      label:"WMI Total",                                            type:"number",readonly:true },
      { id:"imt_percentil",  label:"WMI Percentile",                                   type:"number",readonly:true },
      { id:"imt_notas",      label:"WMI Observations",                             type:"textarea" },
    ]},
    { title:"6. Processing Speed Index (PSI)", description:"Perceptual speed and accuracy", icon:<Activity size={20}/>, questions:[
      { id:"ivp_claves",      label:"Coding — Scaled score",             type:"number",min:1,max:19 },
      { id:"ivp_busqueda",    label:"Symbol Search — Scaled score", type:"number",min:1,max:19 },
      { id:"ivp_cancelacion", label:"Cancellation — Scaled score",  type:"number",min:1,max:19 },
      { id:"ivp_total",       label:"PSI Total",                                           type:"number",readonly:true },
      { id:"ivp_percentil",   label:"PSI Percentile",                                  type:"number",readonly:true },
      { id:"ivp_notas",       label:"PSI Observations",                            type:"textarea" },
    ]},
    { title:"7. Comprehensive Cognitive Analysis (AI)", icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"ci_total",                  label:"Full Scale IQ (FSIQ)",          type:"number",min:40,max:160,readonly:true },
      { id:"ci_percentil",              label:"FSIQ Percentile",                       type:"number",readonly:true },
      { id:"clasificacion_ci",          label:"Descriptive Classification",     type:"text",  readonly:true },
      { id:"perfil_cognitivo_ia",       label:"Cognitive Profile Analysis",type:"textarea",aiGenerated:true },
      { id:"fortalezas_debilidades",    label:"Strengths and Weaknesses",        type:"textarea",aiGenerated:true },
      { id:"implicaciones_educativas",  label:"Educational Implications",        type:"textarea",aiGenerated:true },
      { id:"recomendaciones_cognitivas",label:"Specific Recommendations",     type:"textarea",aiGenerated:true },
      { id:"informe_padres_wisc",       label:"Parent Report",                        type:"textarea",aiGenerated:true },
    ]},
  ]
}

// ─── BASC-3 ───────────────────────────────────────────────────────────────────
export function getBasc3Data(isEN: boolean) {
  const s = (es: string, en: string) => S(isEN, es, en)
  const a = (es: string[], en: string[]) => A(isEN, es, en)
  const freq5  = ["Never","Rarely","Sometimes","Often","Very often"]
  const level5 = ["Very low","Low","Average","High","Very high"]
  return [
    { title:"1. Evaluation Information", icon:<Activity size={20}/>, questions:[
      { id:"fecha_eval_basc", label:"Evaluation date", type:"date",   required:true },
      { id:"informante_basc", label:"Informant",                type:"select", options:["Father","Mother","Both","Teacher","Self-report"] },
      { id:"forma_basc",      label:"Form applied",         type:"select", options:["Preschool (2-5 years)","Children (6-11 years)","Adolescents (12-21 years)"] },
    ]},
    { title:"2. Clinical Scales - Externalizing Problems", description:"Behaviors directed outward", icon:<Activity size={20}/>, questions:[
      { id:"basc_hiperactividad",     label:"Hyperactivity",       type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_agresion",           label:"Aggression",                type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_problemas_conducta", label:"Conduct problems", type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_notas_extern",       label:"Externalizing observations", type:"textarea" },
    ]},
    { title:"3. Clinical Scales - Internalizing Problems", description:"Behaviors directed inward", icon:<Heart size={20}/>, questions:[
      { id:"basc_ansiedad",     label:"Anxiety",         type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_depresion",    label:"Depression",     type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_somatizacion", label:"Somatization",type:"range",min:1,max:5,labels:freq5 },
      { id:"basc_notas_intern", label:"Internalizing observations", type:"textarea" },
    ]},
    { title:"4. Adaptive Scales", description:"Positive and adaptive skills", icon:<Activity size={20}/>, questions:[
      { id:"basc_habilidades_sociales", label:"Social skills",        type:"range",min:1,max:5,labels:level5 },
      { id:"basc_liderazgo",            label:"Leadership",                      type:"range",min:1,max:5,labels:level5 },
      { id:"basc_habilidades_estudio",  label:"Study skills",       type:"range",min:1,max:5,labels:level5 },
      { id:"basc_adaptabilidad",        label:"Adaptability",                type:"range",min:1,max:5,labels:level5 },
      { id:"basc_notas_adapt",          label:"Adaptive observations", type:"textarea" },
    ]},
    { title:"5. Comprehensive Behavioral Analysis (AI)", icon:<Sparkles size={20}/>, hasIA:true, questions:[
      { id:"indice_sintomas_conductuales", label:"Behavioral Symptoms Index", type:"number",readonly:true },
      { id:"perfil_riesgo",                label:"Risk Profile",                             type:"text",  readonly:true },
      { id:"analisis_basc_ia",             label:"AI Behavioral Analysis",             type:"textarea",aiGenerated:true },
      { id:"areas_preocupacion",           label:"Areas of Concern",                    type:"textarea",aiGenerated:true },
      { id:"fortalezas_conductuales",      label:"Behavioral Strengths",              type:"textarea",aiGenerated:true },
      { id:"plan_intervencion_conductual", label:"Intervention Plan",                    type:"textarea",aiGenerated:true },
      { id:"informe_padres_basc",          label:"Parent Report",                         type:"textarea",aiGenerated:true },
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
