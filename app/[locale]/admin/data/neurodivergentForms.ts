// ==============================================================================
// ABA CLINICAL FORMS — Jugando Aprendo
// Organized by diagnostic category with AI analysis
// ==============================================================================

export type FormCategory = 'tdah' | 'tea' | 'conductual' | 'sensorial' | 'habilidades' | 'familia' | 'seguimiento'

export interface FormDefinition {
  id: string
  title: string
  subtitle: string
  category: FormCategory
  icon: string
  color: string
  targetRole: 'admin' | 'parent' | 'both'
  estimatedMinutes: number
  description: string
  tags: string[]
  sections: FormSection[]
}

export interface FormSection {
  title: string
  description?: string
  questions: FormQuestion[]
}

export interface FormQuestion {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'scale' | 'number' | 'date' | 'time' | 'boolean' | 'frequency'
  placeholder?: string
  options?: string[]
  min?: number
  max?: number
  required?: boolean
  helpText?: string
}

// ─── CATEGORIES WITH METADATA ───────────────────────────────────────────────
export const FORM_CATEGORIES = {
  tdah: {
    label: 'ADHD',
    fullLabel: 'Attention Deficit Hyperactivity Disorder',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: '⚡',
  },
  tea: {
    label: 'ASD',
    fullLabel: 'Autism Spectrum Disorder',
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: '🧩',
  },
  conductual: {
    label: 'Behavioral',
    fullLabel: 'Behavior Analysis and Modification',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: '📊',
  },
  sensorial: {
    label: 'Sensory',
    fullLabel: 'Sensory Processing and Integration',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    icon: '🌀',
  },
  habilidades: {
    label: 'Skills',
    fullLabel: 'Social Skills, Communication and Language',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: '🤝',
  },
  familia: {
    label: 'Family',
    fullLabel: 'Forms for Parents and Family',
    color: 'from-pink-500 to-rose-400',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: '🏠',
  },
  seguimiento: {
    label: 'Follow-up',
    fullLabel: 'Clinical Follow-up and Progress',
    color: 'from-cyan-500 to-sky-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: '📈',
  },
}

const FREQ_OPTIONS = ['Never', 'Rarely (1-2 times/month)', 'Sometimes (1-2 times/week)', 'Frequently (3-4 times/week)', 'Almost always (daily)', 'Always (multiple times a day)']
const INTENSITY_OPTIONS = ['Not applicable', 'Mild - barely affects', 'Moderate - partially affects', 'Intense - affects a lot', 'Very intense - debilitating']
const CONCERN_OPTIONS = ['No concern', 'Mild concern', 'Moderate concern', 'Significant concern', 'Severe concern']

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY: ADHD
// ═══════════════════════════════════════════════════════════════════════════════

export const SCREENING_TDAH: FormDefinition = {
  id: 'screening_tdah',
  title: 'ADHD Screening (Conners Adapted)',
  subtitle: 'Assessment of inattention and hyperactivity symptoms',
  category: 'tdah',
  icon: '⚡',
  color: 'from-orange-500 to-amber-500',
  targetRole: 'admin',
  estimatedMinutes: 20,
  description: 'Assessment based on DSM-5 criteria and Conners scale to identify and quantify ADHD symptoms.',
  tags: ['ADHD', 'Inattention', 'Hyperactivity', 'Impulsivity', 'DSM-5'],
  sections: [
    {
      title: '1. Inattention Symptoms',
      description: 'Evaluate the frequency of each behavior in the last 6 months',
      questions: [
        { id: 'inat_detalles', label: 'Fails to pay attention to details or makes careless mistakes', type: 'frequency', options: FREQ_OPTIONS, required: true },
        { id: 'inat_atencion', label: 'Has difficulty sustaining attention in tasks or play', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_escucha', label: 'Often does not seem to listen when spoken to directly', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_instrucciones', label: 'Does not follow instructions and fails to finish schoolwork or chores', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_organizar', label: 'Has difficulty organizing tasks and activities', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_esfuerzo', label: 'Avoids tasks requiring sustained mental effort', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_objetos', label: 'Often loses things needed (toys, pencils, books)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_distraido', label: 'Is easily distracted by external stimuli', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'inat_olvidadizo', label: 'Is forgetful in daily activities', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '2. Hyperactivity-Impulsivity Symptoms',
      questions: [
        { id: 'hiper_manos', label: 'Often fidgets with hands or feet or squirms in seat', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_asiento', label: 'Leaves seat when expected to remain seated', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_corretea', label: 'Runs about or climbs in inappropriate situations', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_juego', label: 'Has difficulty playing or engaging in activities quietly', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_motor', label: 'Acts as if driven by a motor, always on the go', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_habla', label: 'Talks excessively', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_responde', label: 'Blurts out answers before questions are completed', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_turno', label: 'Has difficulty waiting their turn', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hiper_interrumpe', label: 'Interrupts or intrudes on conversations or games', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '3. Functional Impact',
      questions: [
        { id: 'impacto_escuela', label: 'Impact on school performance', type: 'select', options: CONCERN_OPTIONS },
        { id: 'impacto_social', label: 'Impact on peer relationships', type: 'select', options: CONCERN_OPTIONS },
        { id: 'impacto_familia', label: 'Impact on family dynamics', type: 'select', options: CONCERN_OPTIONS },
        { id: 'inicio_sintomas', label: 'Age of symptom onset (approximate)', type: 'number', placeholder: 'Ej: 4', helpText: 'DSM-5 requires symptoms before age 12' },
        { id: 'duracion_sintomas', label: 'Duration of symptoms', type: 'select', options: ['Less than 6 months', '6-12 months', '1-2 years', 'More than 2 years'] },
        { id: 'contextos', label: 'In which contexts do they occur?', type: 'multiselect', options: ['Home', 'School', 'With other children', 'In public places', 'In all contexts'] },
        { id: 'evaluacion_previa', label: 'Has had prior evaluation or diagnosis?', type: 'select', options: ['No', 'Yes - no formal diagnosis', 'Yes - ADHD Inattentive diagnosis', 'Yes - ADHD Hyperactive-Impulsive diagnosis', 'Yes - ADHD Combined diagnosis'] },
        { id: 'medicacion', label: 'Currently receiving medication?', type: 'select', options: ['No', 'Yes - Methylphenidate', 'Yes - Atomoxetine', 'Yes - other stimulant', 'Unknown'] },
        { id: 'observaciones_tdah', label: 'Additional Evaluator Observations', type: 'textarea', placeholder: 'Clinical notes on behavior during the evaluation...' },
      ]
    }
  ]
}

export const CONDUCTA_CASA_TDAH: FormDefinition = {
  id: 'conducta_casa_tdah',
  title: 'Home Behavior - ADHD',
  subtitle: 'Parent report on behaviors at home',
  category: 'tdah',
  icon: '🏠',
  color: 'from-amber-500 to-yellow-500',
  targetRole: 'parent',
  estimatedMinutes: 15,
  description: 'Form for parents to report their child\'s behavior at home.',
  tags: ['ADHD', 'Home', 'Parents', 'Routines'],
  sections: [
    {
      title: '1. Daily Routines',
      description: 'Tell us about your child\'s routines at home',
      questions: [
        { id: 'rutina_manana', label: 'How is the morning routine (waking up, breakfast, getting ready)?', type: 'select', options: ['No difficulties', 'Mild difficulties (needs reminders)', 'Moderate difficulties (requires constant help)', 'Very difficult (causes daily conflict)'] },
        { id: 'tarea_escolar', label: 'How does the child do schoolwork at home?', type: 'select', options: ['Does them alone without problems', 'Needs supervision', 'Requires constant support', 'It is a daily battle', 'Does not do them'] },
        { id: 'tiempo_tarea', label: 'How long does homework typically take?', type: 'select', options: ['Less than 30 minutes', '30-60 minutes', '1-2 hours', 'More than 2 hours', 'Does not finish'] },
        { id: 'hora_dormir', label: 'How is bedtime?', type: 'select', options: ['No problems', 'Takes long to fall asleep', 'Gets up repeatedly', 'Very difficult - great resistance', 'Very little sleep'] },
      ]
    },
    {
      title: '2. Behavior at Home',
      questions: [
        { id: 'obedece_instrucciones', label: 'Follows instructions the first time?', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'rabietas', label: 'Has tantrums or emotional outbursts?', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hermanos', label: 'How does the child get along with siblings or other children at home?', type: 'select', options: ['Very well', 'Well with some normal conflicts', 'Many conflicts', 'Very frequent and intense conflicts', 'No siblings'] },
        { id: 'actividades_preferidas', label: 'In which activities does the child concentrate well?', type: 'textarea', placeholder: 'E.g.: video games, drawing, LEGO, watching videos...' },
        { id: 'estres_familiar', label: 'How much stress does their behavior create in the family?', type: 'select', options: INTENSITY_OPTIONS },
      ]
    },
    {
      title: '3. Strategies Used by Parents',
      questions: [
        { id: 'estrategias_funcionan', label: 'What strategies work for you?', type: 'textarea', placeholder: 'Describe what things help manage their behavior...' },
        { id: 'estrategias_no_funcionan', label: 'What strategies do NOT work?', type: 'textarea', placeholder: 'Describe what does not help or makes the situation worse...' },
        { id: 'ayuda_necesaria', label: 'In what area do you need the most help as a family?', type: 'textarea', placeholder: 'Tell us how we can best support you...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY: ASD / AUTISM
// ═══════════════════════════════════════════════════════════════════════════════

export const SCREENING_TEA: FormDefinition = {
  id: 'screening_tea',
  title: 'ASD Screening (M-CHAT-R/F Adapted)',
  subtitle: 'Early detection of autism spectrum',
  category: 'tea',
  icon: '🧩',
  color: 'from-blue-500 to-indigo-500',
  targetRole: 'admin',
  estimatedMinutes: 25,
  description: 'Based on M-CHAT-R/F and DSM-5 criteria for ASD. Evaluates social communication, repetitive patterns and sensory processing.',
  tags: ['ASD', 'Autism', 'Social Communication', 'Screening'],
  sections: [
    {
      title: '1. Social Communication and Language',
      description: 'Evaluates communication and social interaction skills',
      questions: [
        { id: 'tea_contacto_visual', label: 'Eye contact with familiar people', type: 'select', options: ['Normal/consistent', 'Reduced but present', 'Scarce', 'Absent'] },
        { id: 'tea_sonrisa_social', label: 'Social smile (responds to others\' smiles)', type: 'select', options: ['Present and consistent', 'Present sometimes', 'Rarely', 'Absent'] },
        { id: 'tea_señalar', label: 'Pointing to share interest (proto-declarative)', type: 'select', options: ['Present', 'Sometimes', 'Rarely', 'Absent'] },
        { id: 'tea_nombre', label: 'Responds when called by name', type: 'select', options: ['Always/almost always', 'Sometimes', 'Rarely', 'Never'] },
        { id: 'tea_atencion_conjunta', label: 'Joint attention (looking where the adult looks)', type: 'select', options: ['Present', 'Sometimes', 'Rarely', 'Absent'] },
        { id: 'tea_mostrar_objetos', label: 'Shows objects to share with others', type: 'select', options: ['Yes, usually', 'Sometimes', 'Rarely', 'No'] },
        { id: 'tea_juego_imitativo', label: 'Imitates actions of others', type: 'select', options: ['Yes, spontaneously', 'When asked', 'Rarely', 'Does not imitate'] },
        { id: 'tea_juego_simbolico', label: 'Symbolic play (pretend play)', type: 'select', options: ['Present and varied', 'Simple functional play', 'Very limited', 'Absent'] },
        { id: 'tea_interes_ninos', label: 'Interest in playing with other children', type: 'select', options: ['Actively seeks', 'Accepts when offered', 'Prefers to play alone', 'Actively avoids'] },
        { id: 'tea_lenguaje_edad', label: 'Language level for their age', type: 'select', options: ['Within normal range', 'Mild delay', 'Moderate delay', 'Significant delay', 'No oral language'] },
      ]
    },
    {
      title: '2. Repetitive and Restricted Patterns',
      questions: [
        { id: 'tea_estereotipias', label: 'Repetitive movements (hand-flapping, rocking, spinning)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_rituales', label: 'Rigid rituals or routines', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_alineacion', label: 'Lines up or arranges objects repetitively', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_intereses_restringidos', label: 'Very intense and restricted interests', type: 'select', options: ['No', 'Mild', 'Moderate (interferes sometimes)', 'Intense (interferes frequently)'] },
        { id: 'tea_cambios', label: 'Resistance to changes in routines or environment', type: 'select', options: INTENSITY_OPTIONS },
        { id: 'tea_uso_objetos', label: 'Unusual or non-functional use of objects', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '3. Sensory Processing',
      questions: [
        { id: 'tea_hipersensibilidad_auditiva', label: 'Sound hypersensitivity (covers ears, becomes distressed)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_hipersensibilidad_tactil', label: 'Tactile hypersensitivity (does not tolerate certain textures/clothing)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_busqueda_sensorial', label: 'Sensory seeking (smells objects, scratches, licks)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tea_selectividad_comida', label: 'Extreme food selectivity', type: 'select', options: ['No / Normal', 'Mild (few restrictions)', 'Moderate (affects nutrition)', 'Severe (very few foods)'] },
      ]
    },
    {
      title: '4. History and Context',
      questions: [
        { id: 'tea_edad_primeras_preocupaciones', label: 'Age when first concerns were noticed', type: 'text', placeholder: 'E.g.: 18 months, 2 years...' },
        { id: 'tea_regresion', label: 'Was there a loss of previously acquired skills?', type: 'select', options: ['No', 'Yes - language', 'Yes - social skills', 'Yes - both', 'Not clear'] },
        { id: 'tea_diagnostico_previo', label: 'Has a prior diagnosis?', type: 'select', options: ['No', 'ASD level 1 (formerly Asperger)', 'ASD level 2', 'ASD level 3', 'ASD unspecified', 'Other PDD'] },
        { id: 'tea_nivel_funcionamiento', label: 'Estimated general functioning level', type: 'select', options: ['High - independent life possible', 'Medium - requires some support', 'Low - requires significant support', 'Very low - requires total support'] },
        { id: 'tea_antecedentes_familiares', label: 'Family history of ASD, ADHD, or other?', type: 'textarea', placeholder: 'Describe if there are family members with a similar diagnosis...' },
        { id: 'tea_observaciones', label: 'Clinical Evaluator Observations', type: 'textarea', placeholder: 'Notes on behavior during the session, diagnostic impression...' },
      ]
    }
  ]
}

export const CONDUCTA_CASA_TEA: FormDefinition = {
  id: 'conducta_casa_tea',
  title: 'My child at home - ASD',
  subtitle: 'Parent form about daily life',
  category: 'tea',
  icon: '🏡',
  color: 'from-blue-400 to-cyan-500',
  targetRole: 'parent',
  estimatedMinutes: 20,
  description: 'Tell us what your child is like at home. This information helps us personalize the therapy better.',
  tags: ['ASD', 'Home', 'Parents', 'Communication'],
  sections: [
    {
      title: '1. Communication at Home',
      description: 'Tell us about your child\'s communication',
      questions: [
        { id: 'como_comunica', label: 'How does your child mainly communicate?', type: 'multiselect', options: ['Single words', 'Short phrases', 'Complete sentences', 'Gestures and signs', 'Pictograms/PECS', 'Tablet/AAC device', 'Pointing to objects', 'Leading the adult', 'Crying or vocalizations'] },
        { id: 'palabras_funcionales', label: 'Approximately how many functional words does the child use?', type: 'select', options: ['No words', '1-10 words', '11-50 words', '51-100 words', 'More than 100 words'] },
        { id: 'pide_cosas', label: 'Does the child ask for things they want?', type: 'select', options: ['Yes, clearly with words', 'Yes, with gestures/pointing', 'Tries but with difficulty', 'Rarely tries', 'Does not ask - takes things directly'] },
        { id: 'comprende', label: 'Does the child understand what you say?', type: 'select', options: ['Understands complex instructions well', 'Understands simple instructions (1-2 steps)', 'Understands only single words', 'Understands very little'] },
      ]
    },
    {
      title: '2. Routines and Daily Life',
      questions: [
        { id: 'rutinas_importancia', label: 'How important are routines for your child?', type: 'select', options: ['Changes do not affect them', 'Prefers routines but tolerates changes', 'Needs routines, becomes upset with changes', 'Routines are essential, any change causes crisis'] },
        { id: 'higiene', label: 'How is personal hygiene (bath, teeth, etc.)?', type: 'select', options: ['No difficulties', 'Needs reminders', 'Requires physical support', 'Very difficult / intense resistance'] },
        { id: 'alimentacion', label: 'How is feeding/eating?', type: 'textarea', placeholder: 'Describe what foods the child accepts, textures rejected, schedules, etc.' },
        { id: 'sueño', label: 'How is sleep?', type: 'select', options: ['Sleeps well', 'Difficulty initiating sleep', 'Wakes frequently', 'Very little total sleep', 'Very disrupted sleep patterns'] },
      ]
    },
    {
      title: '3. What Makes Us Happy and Concerns Us',
      description: 'Share freely - all information is valuable',
      questions: [
        { id: 'fortalezas_hijo', label: 'What are your child\'s strengths and talents?', type: 'textarea', placeholder: 'What they do well, what they love, their special abilities...' },
        { id: 'mayor_preocupacion', label: 'What is your biggest concern currently?', type: 'textarea', placeholder: 'Tell us what worries you most as a parent...' },
        { id: 'sueños_familia', label: 'What do you dream for your child\'s future?', type: 'textarea', placeholder: 'Your expectations and hopes for the future...' },
        { id: 'apoyo_familia', label: 'What support do you receive as a family?', type: 'multiselect', options: ['Partner support', 'Grandparent support', 'Support from other parents with similar children', 'Support group', 'Psychologist/therapist for the family', 'None currently'] },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY: SENSORY
// ═══════════════════════════════════════════════════════════════════════════════

export const PERFIL_SENSORIAL: FormDefinition = {
  id: 'perfil_sensorial',
  title: 'Sensory Processing Profile',
  subtitle: 'Sensory integration assessment (Dunn adapted)',
  category: 'sensorial',
  icon: '🌀',
  color: 'from-violet-500 to-purple-500',
  targetRole: 'admin',
  estimatedMinutes: 20,
  description: 'Evaluates how each sensory system processes: hyper/hyposensitivity, sensory seeking and avoidance.',
  tags: ['Sensory', 'Sensory Integration', 'Processing', 'Occupational'],
  sections: [
    {
      title: '1. Auditory System',
      questions: [
        { id: 'aud_tapas', label: 'Covers ears at everyday sounds', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'aud_ruido_fondo', label: 'Distracted by background noises others ignore', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'aud_volumen', label: 'Speaks very loud or soft without realizing', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'aud_busqueda', label: 'Seeks sounds or makes noises repetitively', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'aud_multisensorial', label: 'Difficulty processing speech with background noise', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '2. Tactile System',
      questions: [
        { id: 'tac_rechazo', label: 'Rejects being touched (hugs, caresses)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tac_ropa', label: 'Sensitivity to clothing textures (tags, seams)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tac_manos', label: 'Avoids having dirty or wet hands', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tac_busqueda', label: 'Touches everything, seeks physical pressure', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tac_temperatura', label: 'Indifferent to cold, heat, or pain', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'tac_temperatura2', label: 'Hyper-reactive to pain or temperature', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '3. Visual and Olfactory System',
      questions: [
        { id: 'vis_luces', label: 'Hypersensitive to bright lights (squints, cries)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'vis_lineas', label: 'Looks at objects from the side or very close', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'olf_olores', label: 'Hypersensitive to smells (moves away, disgust face)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'olf_huele', label: 'Smells objects or people in unusual ways', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'gust_selectivo', label: 'Selectivity by food textures/flavors', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '4. Proprioceptive and Vestibular System',
      questions: [
        { id: 'vest_mareo', label: 'Gets dizzy easily (swings, cars)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'vest_busca', label: 'Seeks spinning, swinging, moving excessively', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'prop_torpeza', label: 'Clumsiness, frequently bumps into objects/people', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'prop_fuerza', label: 'Uses too much force (breaks things unintentionally)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'prop_presion', label: 'Seeks deep pressure (weights, squeezes, vests)', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'prop_postura', label: 'Poor posture, leans on everything', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '5. Impact on Functioning',
      questions: [
        { id: 'sens_participa_actividades', label: 'Avoids activities for sensory reasons?', type: 'multiselect', options: ['Contact sports', 'Art/crafts', 'Music/concerts', 'Eating at restaurants', 'Crowded public places', 'Shopping malls', 'Public transport', 'None'] },
        { id: 'sens_melts', label: 'Has "meltdowns" or sensory overload?', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'sens_duracion_colapso', label: 'Typical duration of a sensory overload', type: 'select', options: ['No meltdowns', 'Less than 5 minutes', '5-15 minutes', '15-30 minutes', 'More than 30 minutes'] },
        { id: 'sens_regulacion', label: 'What helps with self-regulation?', type: 'textarea', placeholder: 'Describe what strategies regulate overload episodes...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY: SOCIAL SKILLS
// ═══════════════════════════════════════════════════════════════════════════════

export const HABILIDADES_SOCIALES: FormDefinition = {
  id: 'habilidades_sociales',
  title: 'Social Skills Assessment',
  subtitle: 'Inventory of social and communicative competencies',
  category: 'habilidades',
  icon: '🤝',
  color: 'from-emerald-500 to-teal-500',
  targetRole: 'admin',
  estimatedMinutes: 20,
  description: 'Evaluates pragmatic skills, conflict resolution, emotional recognition and social competencies.',
  tags: ['Social Skills', 'Pragmatics', 'Emotions', 'Communication'],
  sections: [
    {
      title: '1. Initiating and Maintaining Interactions',
      questions: [
        { id: 'hs_inicia', label: 'Initiates conversations or play with peers', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hs_saluda', label: 'Greets and says goodbye appropriately', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hs_mantiene', label: 'Maintains conversation topic', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hs_turno', label: 'Respects conversational turn-taking', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'hs_contexto', label: 'Adapts language to context and listener', type: 'select', options: ['Yes, appropriately', 'Sometimes', 'Rarely', 'Does not do it'] },
        { id: 'hs_espacio_personal', label: 'Respects others\' personal space', type: 'frequency', options: FREQ_OPTIONS },
      ]
    },
    {
      title: '2. Emotional Recognition and Expression',
      questions: [
        { id: 'em_reconoce_caras', label: 'Recognizes emotions in others\' faces', type: 'select', options: ['Correctly most of the time', 'Only basic emotions (happy/sad)', 'With great difficulty', 'Does not recognize them'] },
        { id: 'em_expresa', label: 'Expresses own emotions appropriately', type: 'select', options: ['Yes, appropriately', 'Expresses them but intensely', 'Difficulty expressing them', 'Barely expresses them'] },
        { id: 'em_empatia', label: 'Shows empathy when others are sad or hurt', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'em_regula', label: 'Regulates emotions without escalating behavior', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'em_estrategias', label: 'What emotional regulation strategies are used?', type: 'textarea', placeholder: 'Breathes, asks for help, steps away, has regulatory object...' },
      ]
    },
    {
      title: '3. Conflict Resolution and Play',
      questions: [
        { id: 'conf_comparte', label: 'Shares toys and materials', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'conf_resuelve', label: 'Resolves conflicts without aggression', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'conf_pide_disculpas', label: 'Apologizes when doing something wrong', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'juego_tipo', label: 'Predominant play type', type: 'select', options: ['Solitary', 'Parallel (alongside others without interacting)', 'Associative (interacts briefly)', 'Cooperative (team play with rules)'] },
        { id: 'juego_reglas', label: 'Accepts and follows game rules', type: 'frequency', options: FREQ_OPTIONS },
        { id: 'juego_perder', label: 'Tolerates losing or things not going as desired', type: 'select', options: INTENSITY_OPTIONS },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY: FAMILY (to be filled by parents)
// ═══════════════════════════════════════════════════════════════════════════════

export const INFORME_PADRES_GENERAL: FormDefinition = {
  id: 'informe_padres_general',
  title: 'How is my child this week?',
  subtitle: 'Weekly parent report',
  category: 'familia',
  icon: '💌',
  color: 'from-pink-500 to-rose-400',
  targetRole: 'parent',
  estimatedMinutes: 10,
  description: 'Share with the therapy team how your child was during the week.',
  tags: ['Parents', 'Follow-up', 'Weekly', 'Home'],
  sections: [
    {
      title: 'How was the week?',
      description: 'All information is valuable to us 💙',
      questions: [
        { id: 'semana_general', label: 'How would you rate the week overall?', type: 'select', options: ['⭐ Very difficult', '⭐⭐ Difficult', '⭐⭐⭐ Normal', '⭐⭐⭐⭐ Good', '⭐⭐⭐⭐⭐ Excellent'] },
        { id: 'logro_semana', label: 'Was there any achievement or positive thing this week?', type: 'textarea', placeholder: 'Tell us something good that happened, even something small 😊' },
        { id: 'dificultad_semana', label: 'Was there any difficulty or challenging situation?', type: 'textarea', placeholder: 'Describe what was difficult this week...' },
        { id: 'practica_casa', label: 'Did you practice the recommended strategies?', type: 'select', options: ['Yes, every day', 'Most days', 'Some days', 'Barely could', 'Could not / did not remember'] },
        { id: 'dudas', label: 'Do you have any questions for the therapist?', type: 'textarea', placeholder: 'Write your questions here and we will answer them at the next session...' },
        { id: 'estado_animo_hijo', label: 'How was your child\'s mood?', type: 'select', options: ['Very happy and calm', 'Well overall', 'Variable', 'More irritable than usual', 'Very difficult'] },
        { id: 'sueño_semana', label: 'How was sleep this week?', type: 'select', options: ['Very well', 'Well', 'Fair', 'Poor', 'Very poor'] },
        { id: 'mensaje_terapeuta', label: 'Anything else you want to tell the therapist?', type: 'textarea', placeholder: 'Anything you consider important...' },
      ]
    }
  ]
}

export const HISTORIA_FAMILIAR: FormDefinition = {
  id: 'historia_familiar',
  title: 'Family and Developmental History',
  subtitle: 'Initial form to get to know your family',
  category: 'familia',
  icon: '👨‍👩‍👧',
  color: 'from-rose-500 to-pink-500',
  targetRole: 'parent',
  estimatedMinutes: 30,
  description: 'Initial form to learn about the family context and your child\'s developmental history.',
  tags: ['Clinical History', 'Development', 'Family', 'Initial'],
  sections: [
    {
      title: '1. Family and Environment',
      questions: [
        { id: 'fam_composicion', label: 'Who does the child live with?', type: 'multiselect', options: ['Father', 'Mother', 'Siblings', 'Grandparents', 'Other relatives', 'Only with one parent'] },
        { id: 'fam_hermanos_cuantos', label: 'How many siblings does the child have?', type: 'select', options: ['None (only child)', '1 sibling', '2 siblings', '3 or more siblings'] },
        { id: 'fam_idioma', label: 'What language(s) are spoken at home?', type: 'text', placeholder: 'E.g.: Spanish, they also speak Quechua...' },
        { id: 'fam_situacion', label: 'What is the current family situation?', type: 'select', options: ['Stable and without significant events', 'Recent change (move, job)', 'Recent separation or divorce', 'Recent family loss', 'Difficult economic situation', 'Other significant change'] },
      ]
    },
    {
      title: '2. Pregnancy and Birth',
      questions: [
        { id: 'emb_complicaciones', label: 'Were there complications during pregnancy?', type: 'textarea', placeholder: 'Infections, medications, stress, other...' },
        { id: 'emb_semanas', label: 'At how many weeks was the child born?', type: 'select', options: ['Extreme preterm (<28 wk)', 'Very preterm (28-32 wk)', 'Late preterm (33-36 wk)', 'Full term (37-42 wk)', 'Post-term (>42 wk)'] },
        { id: 'nac_peso', label: 'What was the birth weight?', type: 'text', placeholder: 'E.g.: 3.200 kg' },
        { id: 'nac_complicaciones', label: 'Were there complications at birth?', type: 'textarea', placeholder: 'NICU, oxygen, jaundice, other...' },
      ]
    },
    {
      title: '3. Developmental Milestones',
      questions: [
        { id: 'hito_sonrisa', label: 'At what age was the first social smile?', type: 'text', placeholder: 'E.g.: 2 months' },
        { id: 'hito_sento', label: 'At what age did they sit independently?', type: 'text', placeholder: 'E.g.: 6 months' },
        { id: 'hito_camino', label: 'At what age did they walk independently?', type: 'text', placeholder: 'E.g.: 12-14 months' },
        { id: 'hito_palabras', label: 'At what age were first words spoken?', type: 'text', placeholder: 'E.g.: 12 months' },
        { id: 'hito_frases', label: 'At what age were two words combined?', type: 'text', placeholder: 'E.g.: 24 months' },
        { id: 'hito_control', label: 'At what age was toilet training achieved?', type: 'select', options: ['Before 2 years', '2-3 years', '3-4 years', 'After 4 years', 'Not yet achieved'] },
        { id: 'hito_preocupaciones', label: 'At what point did you start to worry?', type: 'textarea', placeholder: 'Describe when and what you noticed...' },
      ]
    },
    {
      title: '4. Health and Medical History',
      questions: [
        { id: 'med_enfermedades', label: 'Has the child had significant illnesses?', type: 'textarea', placeholder: 'Hospitalizations, surgeries, chronic conditions...' },
        { id: 'med_medicacion', label: 'Is the child currently taking any medication?', type: 'textarea', placeholder: 'Name, dose, purpose...' },
        { id: 'med_alergias', label: 'Does the child have allergies?', type: 'text', placeholder: 'Foods, medications, other...' },
        { id: 'med_audiologia', label: 'Has hearing been evaluated?', type: 'select', options: ['Yes - normal hearing', 'Yes - mild hearing loss', 'Yes - moderate/severe hearing loss', 'Not evaluated'] },
        { id: 'med_oftalmologia', label: 'Has vision been evaluated?', type: 'select', options: ['Yes - normal vision', 'Yes - uses glasses', 'Not evaluated'] },
        { id: 'med_antecedentes_familia', label: 'Relevant family history?', type: 'textarea', placeholder: 'ASD, ADHD, intellectual disability, language problems in family...' },
      ]
    }
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE INDEX OF ALL FORMS
// ═══════════════════════════════════════════════════════════════════════════════
// Import competitive forms
import {
  EVALUACION_FUNCIONAL_CONDUCTA,
  PLAN_INTERVENCION_CONDUCTUAL,
  OBJETIVOS_IEP,
  EVALUACION_LENGUAJE_VERBAL,
  INFORME_PROGRESO_MENSUAL,
  HABILIDADES_ADAPTATIVAS,
  PERFIL_SENSORIAL_AVANZADO,
  REGISTRO_ABC_AVANZADO,
} from './competitiveForms'

export const ALL_FORMS: FormDefinition[] = [
  // Base forms
  SCREENING_TDAH,
  CONDUCTA_CASA_TDAH,
  SCREENING_TEA,
  CONDUCTA_CASA_TEA,
  PERFIL_SENSORIAL,
  HABILIDADES_SOCIALES,
  INFORME_PADRES_GENERAL,
  HISTORIA_FAMILIAR,
  // Competitive forms (Thread Learning / Central Reach level)
  EVALUACION_FUNCIONAL_CONDUCTA,
  PLAN_INTERVENCION_CONDUCTUAL,
  OBJETIVOS_IEP,
  EVALUACION_LENGUAJE_VERBAL,
  INFORME_PROGRESO_MENSUAL,
  HABILIDADES_ADAPTATIVAS,
  PERFIL_SENSORIAL_AVANZADO,
  REGISTRO_ABC_AVANZADO,
]

export const FORMS_BY_CATEGORY = {
  tdah: ALL_FORMS.filter(f => f.category === 'tdah'),
  tea: ALL_FORMS.filter(f => f.category === 'tea'),
  conductual: ALL_FORMS.filter(f => f.category === 'conductual'),
  sensorial: ALL_FORMS.filter(f => f.category === 'sensorial'),
  habilidades: ALL_FORMS.filter(f => f.category === 'habilidades'),
  familia: ALL_FORMS.filter(f => f.category === 'familia'),
  seguimiento: ALL_FORMS.filter(f => f.category === 'seguimiento'),
}

export const PARENT_FORMS = ALL_FORMS.filter(f => f.targetRole === 'parent' || f.targetRole === 'both')
export const ADMIN_FORMS = ALL_FORMS.filter(f => f.targetRole === 'admin' || f.targetRole === 'both')
