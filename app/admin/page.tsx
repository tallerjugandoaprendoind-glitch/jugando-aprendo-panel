'use client'

import { supabase } from '@/lib/supabase' 
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import * as XLSX from 'xlsx' 

import { 
  LayoutDashboard, Users, LogOut, Search, Bell, Plus, Brain, Calendar, 
  X, User, Mail, Activity, Clock, Ticket, FileText, ClipboardList, Loader2, 
  Sparkles, ChevronRight, ChevronLeft, CheckCircle2, Heart, Baby, Stethoscope, Save,
  Utensils, Smile, MessageCircle, Home, History, Upload, FileSpreadsheet, 
  ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, BookOpen, Trash2, Eye, FileWarning, Send, MoreHorizontal,
  UserPlus, Edit, Phone, Key, TrendingUp, Target, Zap, Award, BarChart3
} from 'lucide-react'

// ==============================================================================
// 1. CONFIGURACIÓN DE DATOS - FORMULARIOS 
// ==============================================================================

const ANAMNESIS_DATA = [
  {
    title: "1. Datos de Filiación",
    questions: [
      { id: "informante", label: "Nombre del informante", type: "text", placeholder: "Nombre completo" },
      { id: "parentesco", label: "Parentesco con el niño", type: "select", options: ["Madre", "Padre", "Abuelo/a", "Tutor", "Otro"] },
      { id: "vive_con", label: "¿Con quién vive el niño?", type: "text", placeholder: "Ej: Padres y hermanos" },
      { id: "escolaridad", label: "Escolaridad actual", type: "select", options: ["No escolarizado", "Nido/Inicial", "Primaria", "CEBE"] },
    ]
  },
  {
    title: "2. Motivo de Consulta",
    questions: [
      { id: "motivo_principal", label: "Motivo principal de la consulta", type: "textarea", placeholder: "Describe el problema o preocupación principal..." },
      { id: "derivado_por", label: "¿Quién lo deriva?", type: "select", options: ["Iniciativa propia", "Institución Educativa", "Médico Pediatra", "Psicólogo", "Otro"] },
      { id: "expectativas", label: "¿Qué espera lograr con la terapia?", type: "textarea", placeholder: "Objetivos de los padres..." },
    ]
  },
  {
    title: "3. Historia Prenatal (Embarazo y Parto)",
    questions: [
      { id: "tipo_embarazo", label: "¿El embarazo fue planificado?", type: "radio", options: ["Sí", "No"] },
      { id: "complicaciones_emb", label: "¿Hubo complicaciones en el embarazo?", type: "textarea", placeholder: "Amenazas de aborto, infecciones, caídas, estrés fuerte..." },
      { id: "tipo_parto", label: "Tipo de parto", type: "select", options: ["Natural", "Cesárea de emergencia", "Cesárea programada"] },
      { id: "llanto", label: "¿Lloró al nacer?", type: "radio", options: ["Sí", "No", "No sabe"] },
      { id: "incubadora", label: "¿Requirió incubadora?", type: "radio", options: ["Sí", "No"] },
    ]
  },
  {
    title: "4. Historia Médica",
    questions: [
      { id: "enfermedades", label: "¿Ha tenido enfermedades graves?", type: "textarea", placeholder: "Convulsiones, fiebres altas, otitis, alergias..." },
      { id: "examenes", label: "¿Tiene exámenes previos?", type: "select", options: ["Ninguno", "Audición", "Visión", "Neurológico", "Genético", "Varios"] },
      { id: "medicacion", label: "¿Toma alguna medicación actual?", type: "text", placeholder: "Nombre y dosis..." },
    ]
  },
  {
    title: "5. Desarrollo Psicomotor",
    questions: [
      { id: "sosten_cefalico", label: "Edad de sostén cefálico (sostener cabeza)", type: "text", placeholder: "Ej: 3 meses" },
      { id: "gateo", label: "Edad de gateo", type: "text", placeholder: "Ej: 8 meses" },
      { id: "marcha", label: "Edad de marcha (caminar solo)", type: "text", placeholder: "Ej: 1 año 2 meses" },
      { id: "caidas", label: "¿Se cae con frecuencia?", type: "radio", options: ["Sí", "No"] },
      { id: "motricidad_fina", label: "Motricidad fina (pinza, agarre)", type: "select", options: ["Adecuada", "Dificultad para agarrar", "Torpeza manual"] },
    ]
  },
  {
    title: "6. Desarrollo del Lenguaje",
    questions: [
      { id: "primeras_palabras", label: "Edad de primeras palabras", type: "text", placeholder: "Ej: 1 año" },
      { id: "intencion_comunicativa", label: "¿Tiene intención comunicativa?", type: "radio", options: ["Sí", "No", "A veces"] },
      { id: "comprension", label: "Nivel de comprensión", type: "select", options: ["Entiende todo", "Entiende órdenes simples", "No parece entender", "Ignora su nombre"] },
      { id: "frases", label: "¿Estructura frases?", type: "radio", options: ["Sí (sujeto+verbo)", "Solo palabras sueltas", "No habla"] },
    ]
  },
  {
    title: "7. Alimentación y Sueño",
    questions: [
      { id: "apetito", label: "Apetito", type: "select", options: ["Bueno", "Selectivo/Melindroso", "Voraz", "Poco apetito"] },
      { id: "masticacion", label: "¿Mastica bien los sólidos?", type: "radio", options: ["Sí", "No, se atora", "Solo come papillas"] },
      { id: "sueno_calidad", label: "Calidad del sueño", type: "select", options: ["Duerme toda la noche", "Despertares frecuentes", "Dificultad para conciliar", "Pesadillas"] },
      { id: "duerme_con", label: "¿Con quién duerme?", type: "text", placeholder: "Solo, padres, hermanos..." },
    ]
  },
  {
    title: "8. Autonomía e Higiene",
    questions: [
      { id: "control_esfinteres", label: "Control de esfínteres (baño)", type: "select", options: ["Controla día y noche", "Solo día", "Avisar", "Usa pañal"] },
      { id: "vestido", label: "Vestimenta", type: "select", options: ["Se viste solo", "Ayuda parcial", "Dependiente total"] },
      { id: "aseo", label: "Aseo personal (lavado manos/dientes)", type: "select", options: ["Independiente", "Necesita ayuda", "Se resiste"] },
    ]
  },
  {
    title: "9. Área Emocional y Social",
    questions: [
      { id: "contacto_visual", label: "Contacto visual", type: "select", options: ["Sostenido", "Fugaz", "Nulo/Evita"] },
      { id: "juego", label: "Tipo de juego", type: "select", options: ["Simbólico (imaginación)", "Funcional (carritos)", "Repetitivo/Alinear", "Sensorial"] },
      { id: "rabietas", label: "¿Presenta rabietas frecuentes?", type: "radio", options: ["Sí, diarias", "Ocasionales", "Rara vez"] },
      { id: "pares", label: "Relación con otros niños", type: "select", options: ["Juega e interactúa", "Observa sin jugar", "Ignora/Aisla", "Agrede"] },
    ]
  },
  {
    title: "10. OBSERVACIONES DEL TERAPEUTA",
    questions: [
      { id: "apariencia", label: "Apariencia física y aliño:", type: "textarea", placeholder: "Descripción física..." },
      { id: "actitud_evaluacion", label: "Actitud ante la evaluación:", type: "radio", options: ["Colaborador", "Inhibido", "Oposicionista"] },
      { id: "contacto_visual_obs", label: "Contacto visual (Observación):", type: "radio", options: ["Adecuado", "Fugaz", "Ausente"] },
      { id: "notas_adicionales", label: "Notas Adicionales:", type: "textarea", placeholder: "Observaciones finales..." },
    ]
  }
]

const ABA_DATA = [
  {
    title: "1. Información de la Sesión",
    icon: <Calendar size={20}/>,
    questions: [
      { id: "fecha_sesion", label: "Fecha de la sesión", type: "date", required: true },
      { id: "duracion_minutos", label: "Duración (minutos)", type: "number", placeholder: "45", min: 15, max: 120 },
      { id: "tipo_sesion", label: "Tipo de sesión", type: "select", options: ["Individual", "Grupal", "Domiciliaria", "Virtual"], required: true },
      { id: "objetivo_principal", label: "Objetivo principal de la sesión", type: "textarea", placeholder: "Describe el objetivo terapéutico...", required: true },
    ]
  },
  {
    title: "2. Registro ABC (Análisis Conductual)",
    icon: <Activity size={20}/>,
    questions: [
      { id: "antecedente", label: "Antecedente (A)", type: "textarea", placeholder: "¿Qué sucedió ANTES de la conducta? Contexto, actividad, personas presentes..." },
      { id: "conducta", label: "Conducta Observada (B)", type: "textarea", placeholder: "Describe EXACTAMENTE qué hizo el niño (observable y medible)...", required: true },
      { id: "consecuencia", label: "Consecuencia (C)", type: "textarea", placeholder: "¿Qué pasó DESPUÉS? Respuesta del terapeuta, del entorno..." },
      { id: "funcion_estimada", label: "Función estimada de la conducta", type: "select", options: ["Acceso a Tangible", "Atención Social", "Escape/Evitación", "Sensorial/Automático", "Múltiple"] },
    ]
  },
  {
    title: "3. Métricas de Desempeño",
    icon: <TrendingUp size={20}/>,
    questions: [
      { id: "nivel_atencion", label: "Nivel de atención sostenida", type: "range", min: 1, max: 5, labels: ["Muy disperso", "Disperso", "Moderado", "Bueno", "Excelente"] },
      { id: "respuesta_instrucciones", label: "Respuesta a instrucciones", type: "range", min: 1, max: 5, labels: ["Nula", "Mínima", "Parcial", "Buena", "Inmediata"] },
      { id: "iniciativa_comunicativa", label: "Iniciativa comunicativa", type: "range", min: 1, max: 5, labels: ["Nula", "Muy baja", "Baja", "Moderada", "Alta"] },
      { id: "tolerancia_frustracion", label: "Tolerancia a la frustración", type: "range", min: 1, max: 5, labels: ["Muy baja", "Baja", "Moderada", "Buena", "Excelente"] },
      { id: "interaccion_social", label: "Calidad de interacción social", type: "range", min: 1, max: 5, labels: ["Evitativa", "Mínima", "Funcional", "Buena", "Espontánea"] },
    ]
  },
  {
    title: "4. Habilidades Trabajadas",
    icon: <Target size={20}/>,
    questions: [
      { id: "habilidades_objetivo", label: "Habilidades específicas trabajadas", type: "multiselect", options: [
        "Contacto visual", "Imitación motora", "Seguimiento de instrucciones", 
        "Comunicación funcional", "Juego simbólico", "Habilidades sociales",
        "Autorregulación emocional", "Motricidad fina", "Motricidad gruesa",
        "Atención conjunta", "Espera de turnos", "Flexibilidad cognitiva"
      ]},
      { id: "nivel_logro_objetivos", label: "Nivel de logro de objetivos", type: "select", options: [
        "No logrado (0-25%)", "Parcialmente logrado (26-50%)", 
        "Mayormente logrado (51-75%)", "Completamente logrado (76-100%)"
      ]},
      { id: "ayudas_utilizadas", label: "Nivel de ayudas proporcionadas", type: "select", options: [
        "Independiente (sin ayuda)", "Ayuda gestual", "Ayuda verbal",
        "Modelado", "Guía física parcial", "Guía física total"
      ]},
    ]
  },
  {
    title: "5. Intervenciones y Estrategias",
    icon: <Zap size={20}/>,
    questions: [
      { id: "tecnicas_aplicadas", label: "Técnicas ABA aplicadas", type: "multiselect", options: [
        "Reforzamiento positivo", "Extinción", "Moldeamiento",
        "Encadenamiento", "Análisis de tareas", "Tiempo fuera",
        "Economía de fichas", "Contrato conductual", "Entrenamiento en comunicación funcional"
      ]},
      { id: "reforzadores_efectivos", label: "Reforzadores más efectivos", type: "textarea", placeholder: "Lista los reforzadores que funcionaron mejor hoy..." },
      { id: "conductas_desafiantes", label: "Conductas desafiantes presentadas", type: "textarea", placeholder: "Describe frecuencia e intensidad..." },
      { id: "estrategias_manejo", label: "Estrategias de manejo utilizadas", type: "textarea", placeholder: "Cómo se abordaron las conductas desafiantes..." },
    ]
  },
  {
    title: "6. Progreso y Evolución",
    icon: <Award size={20}/>,
    questions: [
      { id: "avances_observados", label: "Avances observados en esta sesión", type: "textarea", placeholder: "Logros específicos, mejoras respecto a sesiones anteriores..." },
      { id: "areas_dificultad", label: "Áreas de dificultad persistente", type: "textarea", placeholder: "Aspectos que requieren más trabajo..." },
      { id: "patron_aprendizaje", label: "Patrón de aprendizaje observado", type: "select", options: [
        "Aprendizaje rápido y generalización", "Aprendizaje gradual",
        "Requiere repetición intensiva", "Dificultad para generalizar",
        "Aprendizaje inconsistente"
      ]},
    ]
  },
  {
    title: "7. Observaciones Clínicas (Interno)",
    icon: <BookOpen size={20}/>,
    questions: [
      { id: "observaciones_tecnicas", label: "Notas técnicas para el equipo", type: "textarea", placeholder: "Análisis profesional, hipótesis clínicas, ajustes necesarios..." },
      { id: "alertas_clinicas", label: "Alertas o banderas rojas", type: "textarea", placeholder: "Señales de preocupación, regresiones, cambios significativos..." },
      { id: "recomendaciones_equipo", label: "Recomendaciones para el equipo", type: "textarea", placeholder: "Sugerencias para siguientes sesiones, derivaciones necesarias..." },
      { id: "coordinacion_familia", label: "Necesidad de coordinación con familia", type: "radio", options: ["Urgente", "Necesaria", "Rutinaria", "No necesaria"] },
    ]
  },
  {
    title: "8. Tarea para Casa",
    icon: <Home size={20}/>,
    questions: [
      { id: "actividad_casa", label: "Actividad sugerida para practicar en casa", type: "textarea", placeholder: "Descripción detallada de la actividad, materiales necesarios, frecuencia..." },
      { id: "instrucciones_padres", label: "Instrucciones específicas para los padres", type: "textarea", placeholder: "Pasos claros, qué hacer y qué evitar..." },
      { id: "objetivo_tarea", label: "Objetivo de la tarea", type: "text", placeholder: "¿Qué habilidad refuerza esta actividad?" },
    ]
  },
  {
    title: "9. Comunicación con la Familia (VISIBLE PARA PADRES)",
    icon: <MessageCircle size={20}/>,
    hasIA: true,
    questions: [
      { id: "mensaje_padres", label: "Mensaje para WhatsApp/Informe", type: "textarea", placeholder: "Este mensaje será visible para los padres. Usa lenguaje positivo y claro...", aiGenerated: true },
      { id: "destacar_positivo", label: "Logros para destacar a los padres", type: "textarea", placeholder: "Aspectos positivos que los padres deben saber..." },
      { id: "proximos_pasos", label: "Próximos pasos (para compartir)", type: "textarea", placeholder: "Qué viene en las siguientes sesiones..." },
    ]
  },
  {
    title: "10. Análisis y Planificación",
    icon: <Brain size={20}/>,
    questions: [
      { id: "efectividad_sesion", label: "Efectividad global de la sesión", type: "range", min: 1, max: 5, labels: ["Muy baja", "Baja", "Moderada", "Alta", "Muy alta"] },
      { id: "ajustes_proxima_sesion", label: "Ajustes para la próxima sesión", type: "textarea", placeholder: "Qué modificar, qué mantener, nuevas estrategias a probar..." },
      { id: "necesidades_materiales", label: "Materiales o recursos necesarios", type: "text", placeholder: "Qué se necesita conseguir para próximas sesiones..." },
    ]
  }
]

const ENTORNO_HOGAR_DATA = [
  {
    title: "1. Información General de la Visita",
    questions: [
      { id: "fecha_visita", label: "Fecha de la visita domiciliaria", type: "date" },
      { id: "duracion_visita", label: "Duración aproximada", type: "text", placeholder: "Ej: 1 hora 30 min" },
      { id: "personas_presentes", label: "¿Quiénes estuvieron presentes?", type: "textarea", placeholder: "Madre, padre, hermanos, abuelos..." },
    ]
  },
  {
    title: "2. Estructura y Condiciones del Hogar",
    questions: [
      { id: "tipo_vivienda", label: "Tipo de vivienda", type: "select", options: ["Casa independiente", "Departamento", "Cuarto alquilado", "Vivienda compartida", "Otro"] },
      { id: "num_habitaciones", label: "Número de habitaciones", type: "text", placeholder: "Ej: 2 dormitorios" },
      { id: "espacio_juego", label: "¿Existe espacio dedicado para juego/terapia?", type: "radio", options: ["Sí, espacio amplio", "Espacio reducido", "No hay espacio específico"] },
      { id: "condiciones_higiene", label: "Condiciones generales de higiene", type: "select", options: ["Excelente", "Buena", "Regular", "Necesita mejoras"] },
      { id: "iluminacion_ventilacion", label: "Iluminación y ventilación", type: "select", options: ["Adecuada", "Insuficiente", "Excesiva"] },
    ]
  },
  {
    title: "3. Recursos y Materiales Disponibles",
    questions: [
      { id: "juguetes_disponibles", label: "Juguetes y materiales educativos", type: "textarea", placeholder: "Lista los juguetes, libros, materiales sensoriales disponibles..." },
      { id: "acceso_tecnologia", label: "Acceso a tecnología (tablet, TV, computadora)", type: "radio", options: ["Sí, con supervisión", "Sí, sin límites", "No tiene acceso"] },
      { id: "tiempo_pantalla", label: "Tiempo diario frente a pantallas", type: "text", placeholder: "Ej: 2 horas" },
    ]
  },
  {
    title: "4. Rutinas y Estructura Familiar",
    questions: [
      { id: "rutina_diaria", label: "Descripción de la rutina diaria del niño", type: "textarea", placeholder: "Hora de despertar, comidas, siestas, actividades..." },
      { id: "consistencia_rutinas", label: "¿Las rutinas son consistentes?", type: "radio", options: ["Sí, muy estructuradas", "Parcialmente", "No, son variables"] },
      { id: "hora_dormir", label: "Horario habitual de dormir", type: "text", placeholder: "Ej: 8:30 PM" },
      { id: "actividades_familia", label: "Actividades que realiza la familia junta", type: "textarea", placeholder: "Comidas, paseos, juegos..." },
    ]
  },
  {
    title: "5. Dinámica Familiar y Relaciones",
    questions: [
      { id: "interaccion_padres", label: "Calidad de interacción padres-niño observada", type: "select", options: ["Muy positiva y cálida", "Funcional", "Tensa o conflictiva", "Distante"] },
      { id: "estilo_crianza", label: "Estilo de crianza predominante", type: "select", options: ["Autoritativo (límites + afecto)", "Permisivo", "Autoritario", "Negligente", "Mixto"] },
      { id: "manejo_conductas", label: "¿Cómo manejan las conductas desafiantes?", type: "textarea", placeholder: "Estrategias que usan los padres..." },
      { id: "apoyo_red_familiar", label: "Red de apoyo familiar/social", type: "textarea", placeholder: "Abuelos, tíos, vecinos, amigos que ayudan..." },
    ]
  },
  {
    title: "6. Alimentación y Hábitos de Salud",
    questions: [
      { id: "tipo_alimentacion", label: "Tipo de alimentación del niño", type: "textarea", placeholder: "Describe dieta típica, preferencias, rechazos..." },
      { id: "quien_prepara_comida", label: "¿Quién prepara las comidas?", type: "text", placeholder: "Ej: Madre principalmente" },
      { id: "come_familia", label: "¿Come junto a la familia?", type: "radio", options: ["Sí, siempre", "A veces", "No, come solo"] },
    ]
  },
  {
    title: "7. Observaciones del Comportamiento en Casa",
    questions: [
      { id: "comportamiento_observado", label: "Comportamiento del niño durante la visita", type: "textarea", placeholder: "Actividad, estado de ánimo, interacción con familiares..." },
      { id: "diferencias_consultorio", label: "¿Diferencias con el comportamiento en consultorio?", type: "textarea", placeholder: "Conductas que aparecen solo en casa o solo en terapia..." },
      { id: "estimulacion_sensorial", label: "Estímulos sensoriales del entorno (ruido, luz, texturas)", type: "textarea", placeholder: "TV encendida, música, mascotas, olores..." },
    ]
  },
  {
    title: "8. Barreras y Facilitadores para la Terapia",
    questions: [
      { id: "barreras_identificadas", label: "Barreras para implementar estrategias en casa", type: "textarea", placeholder: "Falta de tiempo, espacios reducidos, resistencia familiar..." },
      { id: "facilitadores", label: "Facilitadores y fortalezas del entorno", type: "textarea", placeholder: "Compromiso de padres, buenos recursos, rutinas claras..." },
      { id: "disposicion_cambio", label: "Disposición de la familia para realizar cambios", type: "radio", options: ["Muy motivados", "Moderadamente dispuestos", "Resistentes", "Ambivalentes"] },
    ]
  },
  {
    title: "9. Recomendaciones Específicas para el Hogar",
    questions: [
      { id: "recomendaciones_espacio", label: "Recomendaciones sobre el espacio físico", type: "textarea", placeholder: "Adaptar rincón sensorial, reducir distractores..." },
      { id: "recomendaciones_rutinas", label: "Ajustes sugeridos en rutinas", type: "textarea", placeholder: "Horarios de sueño, estructura de comidas..." },
      { id: "actividades_casa", label: "Actividades terapéuticas sugeridas para realizar en casa", type: "textarea", placeholder: "Ejercicios de motricidad, juegos de imitación..." },
    ]
  },
  {
    title: "10. Análisis e Impresión General (IA Asistida)",
    questions: [
      { id: "impresion_general", label: "Impresión General del Entorno", type: "textarea", placeholder: "Resumen de la visita y evaluación global..." },
      { id: "mensaje_padres_entorno", label: "Mensaje para los Padres (Generado por IA)", type: "textarea", placeholder: "Este campo puede ser generado por IA..." },
      { id: "seguimiento_requerido", label: "¿Requiere seguimiento o nueva visita?", type: "radio", options: ["Sí, en 1 mes", "Sí, en 3 meses", "No necesario por ahora"] },
    ]
  }
]

// ==============================================================================
// FUNCIONES AUXILIARES
// ==============================================================================

function calcularEdad(birthDate: string | null): string | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? `${age} años` : null
}

function calcularEdadNumerica(birthDate: string | null): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ==============================================================================
// 2. COMPONENTE PRINCIPAL
// ==============================================================================

export default function AdminDashboard() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('Hubo un error al cerrar sesión')
    }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    setShowProfileMenu(false)
  }

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu)
    setShowNotifications(false)
  }

  const handleOpenChangePassword = () => {
    setShowChangePassword(true)
    setShowProfileMenu(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      alert('✅ Contraseña actualizada exitosamente')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      alert('❌ Error al cambiar la contraseña: ' + error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const navigateTo = (view: string) => {
    setCurrentView(view)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-slate-600 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative z-40
        w-64 md:w-16 lg:w-64 
        bg-white border-r border-slate-200 
        flex flex-col justify-between 
        transition-all duration-300 shadow-2xl md:shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="h-16 md:h-20 flex items-center justify-between px-4 border-b border-slate-100">
             <div className="flex items-center gap-3">
                <div className="relative w-9 h-9"><Image src="/images/logo.png" alt="Logo" fill className="object-contain" /></div>
                <span className="block md:hidden lg:block font-bold text-base lg:text-lg text-blue-700 tracking-tight">Panel Directora</span>
             </div>
             <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg"><X size={20}/></button>
          </div>
          <nav className="p-3 md:p-4 space-y-2">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Inicio" active={currentView === 'inicio'} onClick={() => navigateTo('inicio')} />
            <NavItem icon={<Calendar size={20}/>} label="Agenda" active={currentView === 'agenda'} onClick={() => navigateTo('agenda')} />
            <NavItem icon={<Users size={20}/>} label="Pacientes" active={currentView === 'ninos'} onClick={() => navigateTo('ninos')} />
            <NavItem icon={<FileText size={20}/>} label="Evaluaciones" active={currentView === 'evaluaciones'} onClick={() => navigateTo('evaluaciones')} />
            <NavItem icon={<Brain size={20}/>} label="Historial & IA" active={currentView === 'reportes'} onClick={() => navigateTo('reportes')} />
            <NavItem icon={<Upload size={20}/>} label="Importar CSV" active={currentView === 'importar'} onClick={() => navigateTo('importar')} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 md:p-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors justify-center lg:justify-start">
            <LogOut size={20} /> <span className="block md:hidden lg:block font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative bg-[#F0F2F5]">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto h-full flex flex-col">
            <header className="flex justify-between items-center mb-4 md:mb-6 lg:mb-8 flex-shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-white rounded-lg border border-slate-200">
                      <LayoutDashboard size={20}/>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800 capitalize tracking-tight">
                        {currentView === 'inicio' ? 'Resumen del Día' : 
                        currentView === 'reportes' ? 'Historial Clínico' :
                        currentView === 'importar' ? 'Gestión Masiva' :
                        currentView === 'agenda' ? 'Calendario' : 
                        currentView === 'evaluaciones' ? 'Evaluaciones' : 'Pacientes'}
                        </h1>
                        <p className="text-slate-400 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">Jugando Aprendo - Gestión Integral</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 relative">
                    <button onClick={toggleNotifications} className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 relative">
                      <Bell size={18} className="md:w-5 md:h-5"/>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {showNotifications && (
                      <div className="absolute right-14 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-black text-sm text-slate-800">NOTIFICACIONES</h3>
                          <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-900">Nueva cita agendada</p>
                            <p className="text-xs text-blue-600 mt-1">Paciente: María López - 14:00</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <p className="text-xs font-bold text-purple-900">Recordatorio de sesión</p>
                            <p className="text-xs text-purple-600 mt-1">Sesión grupal en 30 minutos</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button onClick={toggleProfileMenu} className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 text-sm md:text-base">D</button>

                    {showProfileMenu && (
                      <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <User size={24} />
                          </div>
                          <p className="text-center font-black text-sm">Directora</p>
                          <p className="text-center text-xs opacity-90 mt-1">{userEmail || 'directora@jugandoaprendo.com'}</p>
                        </div>
                        <div className="p-2">
                          <button onClick={handleOpenChangePassword} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <Key size={18} />
                            <span>Cambiar Contraseña</span>
                          </button>
                          <div className="border-t border-slate-100 my-2"></div>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut size={18} />
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0">
                {currentView === 'inicio' && <DashboardHome navigateTo={navigateTo} />}
                {currentView === 'agenda' && <MonthlyCalendarView />}
                {currentView === 'ninos' && <PatientsView />}
                {currentView === 'evaluaciones' && <DynamicEvaluationsView />}
                {currentView === 'reportes' && <AIReportView />}
                {currentView === 'importar' && <ExcelImportView />}
            </div>
        </div>
      </main>

      {/* Modal de Cambiar Contraseña */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Cambiar Contraseña</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowChangePassword(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// VISTA: DASHBOARD HOME
// ==============================================================================
function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const [emailBusqueda, setEmailBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [sesionesHoy, setSesionesHoy] = useState(0)
  const [sesionesCompletadas, setSesionesCompletadas] = useState(0)
  const [creditosActivos, setCreditosActivos] = useState(0)
  const [familiasActivas, setFamiliasActivas] = useState(0)
  const [analisisIA, setAnalisisIA] = useState(0)
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [estadisticasSemana, setEstadisticasSemana] = useState({
    sesiones: 0,
    evaluaciones: 0,
    analisisIA: 0,
    visitasHogar: 0,
    tasaAsistencia: 0
  })
  const [horaActual, setHoraActual] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    cargarDatosCompletos()
  }, [])

  const cargarDatosCompletos = async () => {
    try {
      const { data: pacientes, count: countPacientes } = await supabase
        .from('children')
        .select('*', { count: 'exact' })
      setTotalPacientes(countPacientes || 0)

      const hoy = new Date().toISOString().split('T')[0]
      const { data: citasHoy } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', hoy)
      setSesionesHoy(citasHoy?.length || 0)

      const { data: sesionesHoyRegistradas } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', `${hoy}T00:00:00`)
        .lte('created_at', `${hoy}T23:59:59`)
      setSesionesCompletadas(sesionesHoyRegistradas?.length || 0)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('tokens')
        .gt('tokens', 0)
      
      const totalCreditos = profiles?.reduce((sum, p) => sum + (p.tokens || 0), 0) || 0
      setCreditosActivos(totalCreditos)
      setFamiliasActivas(profiles?.length || 0)

      const inicioSemana = new Date()
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
      inicioSemana.setHours(0, 0, 0, 0)

      const { data: analisisSemanales } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())
        .not('datos->mensaje_padres', 'is', null)
      setAnalisisIA(analisisSemanales?.length || 0)

      const { data: actividadData } = await supabase
        .from('registro_aba')
        .select('*, children(name)')
        .order('created_at', { ascending: false })
        .limit(5)
      setActividadReciente(actividadData || [])

      const { data: citasProximas } = await supabase
        .from('appointments')
        .select('*, children(name)')
        .gte('appointment_date', hoy)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(4)
      setProximasCitas(citasProximas || [])

      const { data: sesionesSemanales } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: evaluacionesSemanales } = await supabase
        .from('anamnesis_completa')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: visitasSemanales } = await supabase
        .from('registro_entorno_hogar')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: citasSemanales } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', inicioSemana.toISOString().split('T')[0])
        .lte('appointment_date', hoy)

      const tasaAsistencia = citasSemanales?.length 
        ? Math.round((sesionesSemanales?.length || 0) / citasSemanales.length * 100)
        : 0

      setEstadisticasSemana({
        sesiones: sesionesSemanales?.length || 0,
        evaluaciones: evaluacionesSemanales?.length || 0,
        analisisIA: analisisSemanales?.length || 0,
        visitasHogar: visitasSemanales?.length || 0,
        tasaAsistencia
      })

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    }
  }

  const handleCargarToken = async (cantidad: number) => {
    if (!emailBusqueda.trim()) {
      alert("Por favor, ingresa un correo electrónico")
      return
    }

    setLoading(true)
    try {
      const cleanEmail = emailBusqueda.trim().toLowerCase()
      
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('id, tokens, email')
        .eq('email', cleanEmail)
        .single()

      if (searchError || !profile) {
        alert("❌ No se encontró ningún padre con ese correo electrónico")
        setLoading(false)
        return
      }

      const nuevosTokens = (profile.tokens || 0) + cantidad
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: nuevosTokens })
        .eq('id', profile.id)

      if (updateError) {
        alert("❌ Error al actualizar los créditos: " + updateError.message)
      } else {
        alert(`✅ ¡Éxito! Se cargaron ${cantidad} crédito(s) a ${cleanEmail}\n\nTotal: ${nuevosTokens} créditos`)
        setEmailBusqueda('')
        cargarDatosCompletos()
      }
    } catch (err: any) {
      console.error('Error:', err)
      alert("❌ Error de conexión: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">
                ¡Bienvenida, Directora! 👋
              </h2>
              <p className="text-blue-100 text-sm md:text-base">
                {new Date().toLocaleDateString('es-PE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
              <Clock className="text-blue-200" size={24}/>
              <div>
                <p className="text-xs text-blue-200 font-bold">Hora actual</p>
                <p className="text-xl font-black">
                  {horaActual.toLocaleTimeString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Sparkles className="absolute -bottom-8 -right-8 text-white opacity-10" size={200}/>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCardPremium 
          title="Total Pacientes" 
          value={totalPacientes} 
          icon={<Users className="text-blue-500" size={24}/>} 
          color="from-blue-500 to-blue-600" 
          trend="+2 este mes"
          trendUp={true}
        />
        <StatCardPremium 
          title="Sesiones Hoy" 
          value={sesionesHoy} 
          icon={<Calendar className="text-purple-500" size={24}/>} 
          color="from-purple-500 to-purple-600" 
          trend={`${sesionesCompletadas} completadas`}
          trendUp={true}
        />
        <StatCardPremium 
          title="Créditos Activos" 
          value={creditosActivos} 
          icon={<Ticket className="text-green-500" size={24}/>} 
          color="from-green-500 to-green-600" 
          trend={`${familiasActivas} familias`}
          trendUp={true}
        />
        <StatCardPremium 
          title="IA Análisis" 
          value={analisisIA} 
          icon={<Brain className="text-orange-500" size={24}/>} 
          color="from-orange-500 to-orange-600" 
          trend="Esta semana"
          trendUp={true}
        />
      </div>
      
      {/* 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* COLUMNA 1: RECARGA + ACCIONES */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all">
            <h3 className="font-bold text-slate-700 mb-6 text-lg md:text-xl flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Ticket size={24} className="text-blue-600"/>
              </div>
              Recarga Rápida
            </h3>
            <div className="space-y-4">
              <input 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
                placeholder="email@ejemplo.com" 
                value={emailBusqueda} 
                onChange={e=>setEmailBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCargarToken(1)}
                type="email"
              />
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={()=>handleCargarToken(1)} 
                  disabled={loading || !emailBusqueda.trim()}
                  className="px-6 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                  1 Crédito
                </button>
                <button 
                  onClick={()=>handleCargarToken(4)} 
                  disabled={loading || !emailBusqueda.trim()}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                  4 Créditos
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 text-lg flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Sparkles size={20} className="text-purple-600"/>
              </div>
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <QuickActionButton 
                icon={<FileText size={18}/>} 
                label="Nueva Evaluación" 
                color="bg-blue-50 hover:bg-blue-100 text-blue-700"
                onClick={() => navigateTo('evaluaciones')}
              />
              <QuickActionButton 
                icon={<Calendar size={18}/>} 
                label="Agendar Cita" 
                color="bg-purple-50 hover:bg-purple-100 text-purple-700"
                onClick={() => navigateTo('agenda')}
              />
              <QuickActionButton 
                icon={<Brain size={18}/>} 
                label="Análisis IA" 
                color="bg-orange-50 hover:bg-orange-100 text-orange-700"
                onClick={() => navigateTo('reportes')}
              />
              <QuickActionButton 
                icon={<Upload size={18}/>} 
                label="Importar Datos" 
                color="bg-green-50 hover:bg-green-100 text-green-700"
                onClick={() => navigateTo('importar')}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 2: PRÓXIMAS CITAS */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 text-lg flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <Calendar size={20} className="text-green-600"/>
                </div>
                Próximas Citas
              </h3>
              <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold">
                {proximasCitas.length} Agendadas
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {proximasCitas.length > 0 ? proximasCitas.map((cita, idx) => (
                <div key={idx} className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-xs font-bold opacity-80">
                        {new Date(cita.appointment_date).toLocaleString('es', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-black">{new Date(cita.appointment_date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate">{cita.children?.name || 'Sin nombre'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-400"/>
                        <p className="text-xs text-slate-500 font-bold">{cita.appointment_time?.slice(0,5) || '00:00'}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-slate-200 mb-4" size={48}/>
                  <p className="text-slate-400 text-sm font-bold">No hay citas próximas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA 3: ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 text-lg flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <Activity size={20} className="text-orange-600"/>
                </div>
                Actividad Reciente
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {actividadReciente.length > 0 ? actividadReciente.map((act, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-orange-50 hover:border-orange-200 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md">
                      {act.children?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate">{act.children?.name || 'Sin nombre'}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {act.datos?.conducta || 'Sesión registrada'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">
                        {new Date(act.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto text-slate-200 mb-4" size={48}/>
                  <p className="text-slate-400 text-sm font-bold">Sin actividad reciente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILA INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Activity size={24}/>
              </div>
              <div>
                <h3 className="font-bold text-xl">Monitor Sistema</h3>
                <p className="text-slate-400 text-xs font-bold">Estado en tiempo real</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <StatusRow label="Base de Datos" status="Operativa" color="green"/>
              <StatusRow label="IA Gemini" status="Activa" color="green"/>
              <StatusRow label="Almacenamiento" status="Normal" color="green"/>
              <StatusRow label="API Supabase" status="Online" color="green"/>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="font-bold text-sm">Todos los servicios operativos</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 text-xl mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BarChart3 size={24} className="text-blue-600"/>
            </div>
            Estadísticas de la Semana
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStatCard 
              value={estadisticasSemana.sesiones} 
              label="Sesiones" 
              icon={<Calendar size={18}/>} 
              color="bg-blue-50 text-blue-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.evaluaciones} 
              label="Evaluaciones" 
              icon={<FileText size={18}/>} 
              color="bg-purple-50 text-purple-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.analisisIA} 
              label="Análisis IA" 
              icon={<Brain size={18}/>} 
              color="bg-orange-50 text-orange-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.visitasHogar} 
              label="Visitas Hogar" 
              icon={<Home size={18}/>} 
              color="bg-green-50 text-green-600"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-500 font-bold">Tasa de asistencia</span>
              <span className="text-green-600 font-black text-lg">{estadisticasSemana.tasaAsistencia}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full shadow-lg transition-all duration-1000" 
                style={{width: `${estadisticasSemana.tasaAsistencia}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function StatCardPremium({ title, value, icon, color, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl md:rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1 group cursor-default relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg text-white`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trendUp ? '↗' : '↘'}
          </div>
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
        <h4 className="text-4xl font-black text-slate-800 mb-2">{value}</h4>
        <p className="text-xs text-slate-500 font-bold">{trend}</p>
      </div>
    </div>
  )
}

function QuickActionButton({ icon, label, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${color} transition-all font-bold text-sm hover:scale-105 active:scale-95 shadow-sm`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function StatusRow({ label, status, color }: any) {
  const colors = {
    green: 'bg-green-400 shadow-green-400/50',
    yellow: 'bg-yellow-400 shadow-yellow-400/50',
    red: 'bg-red-400 shadow-red-400/50'
  }
  
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors[color as keyof typeof colors]} animate-pulse`}></div>
        <span className="text-sm font-bold">{status}</span>
      </div>
    </div>
  )
}

function MiniStatCard({ value, label, icon, color }: any) {
  return (
    <div className={`${color} p-4 rounded-2xl text-center hover:scale-105 transition-transform cursor-default`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <h4 className="text-2xl font-black mb-1">{value}</h4>
      <p className="text-xs font-bold opacity-80">{label}</p>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      {icon && <div className="mt-0.5 text-slate-400">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: any) { 
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'text-slate-500 hover:bg-slate-50 hover:pl-4 md:hover:pl-6'}`}
    >
      {icon} 
      <span className="block md:hidden lg:block font-black text-[10px] md:text-xs uppercase tracking-[0.15em]">{label}</span>
    </button>
  ) 
}

// ==============================================================================
// VISTA: PACIENTES
// ==============================================================================
function PatientsView() {
    const [listaNinos, setListaNinos] = useState<any[]>([])
    const [listaNinosFiltrada, setListaNinosFiltrada] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDiagnosis, setFilterDiagnosis] = useState('todos')
    const [sortBy, setSortBy] = useState('nombre')
    
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [showPatientModal, setShowPatientModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [editForm, setEditForm] = useState({
        name: '',
        birth_date: '',
        diagnosis: '',
        age: 0
    })

    useEffect(() => { 
        cargarPacientes()
    }, [])

    const cargarPacientes = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('children')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (data) {
            setListaNinos(data)
            setListaNinosFiltrada(data)
        }
        setIsLoading(false)
    }

    const calcularEdadDesdeString = (birthDate: string): number => {
        if (!birthDate) return 0
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age > 0 ? age : 0
    }

    const handleBirthDateChange = (newBirthDate: string) => {
        const edad = calcularEdadDesdeString(newBirthDate)
        setEditForm({
            ...editForm, 
            birth_date: newBirthDate,
            age: edad
        })
    }

    useEffect(() => {
        let resultado = [...listaNinos]
        if (searchTerm) {
            resultado = resultado.filter(nino => nino.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }
        if (filterDiagnosis !== 'todos') {
            resultado = resultado.filter(nino => nino.diagnosis === filterDiagnosis)
        }
        resultado.sort((a, b) => {
            if (sortBy === 'nombre') return a.name.localeCompare(b.name)
            if (sortBy === 'edad') return (b.age || 0) - (a.age || 0)
            if (sortBy === 'reciente') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return 0
        })
        setListaNinosFiltrada(resultado)
    }, [searchTerm, filterDiagnosis, sortBy, listaNinos])

    const diagnosticosUnicos = ['todos', ...new Set(listaNinos.map(n => n.diagnosis).filter(Boolean))]

    const verDetallePaciente = (paciente: any) => {
        setSelectedPatient(paciente)
        setIsEditing(false)
        setShowPatientModal(true)
    }

    const activarEdicion = () => {
        const edad = calcularEdadDesdeString(selectedPatient.birth_date)
        setEditForm({
            name: selectedPatient.name || '',
            birth_date: selectedPatient.birth_date || '',
            diagnosis: selectedPatient.diagnosis || '',
            age: edad
        })
        setIsEditing(true)
    }

    const guardarCambios = async () => {
        if (!editForm.name.trim()) return alert("❌ Nombre obligatorio");
        if (!editForm.birth_date) return alert("❌ Fecha obligatoria");

        setIsSaving(true);

        try {
            const fechaNac = new Date(editForm.birth_date);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const m = hoy.getMonth() - fechaNac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            edad = Math.max(0, edad);
            const { data, error } = await supabase
                .from('children')
                .update({
                    name: editForm.name.trim(),
                    birth_date: editForm.birth_date,
                    age: edad,
                    diagnosis: editForm.diagnosis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPatient.id)
                .select();
            if (error) {
                alert(`❌ ERROR: ${error.message}`);
            } else if (!data || data.length === 0) {
                alert("⚠️ No se actualizó ningún registro. Verifica los permisos.");
            } else {
                alert(`✅ Guardado correctamente. Edad: ${edad} años.`);
                await cargarPacientes();
                setIsEditing(false);
                setShowPatientModal(false);
            }

        } catch (e: any) {
            alert("❌ Error: " + e.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col animate-fade-in-up">
            <div className="p-4 md:p-6 lg:p-8 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-xl md:text-2xl text-slate-800 flex items-center gap-3">
                            <Users className="text-blue-600" size={28}/> Directorio de Pacientes
                        </h3>
                        <p className="text-slate-400 text-xs md:text-sm mt-1">{listaNinosFiltrada.length} de {listaNinos.length} pacientes</p>
                    </div>
                    <button onClick={cargarPacientes} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all flex items-center gap-2">
                        <Activity size={16}/> Actualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"/>
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"><X size={16} className="text-slate-400"/></button>}
                    </div>
                    <div className="md:col-span-4">
                        <select value={filterDiagnosis} onChange={(e) => setFilterDiagnosis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white transition-all font-bold text-slate-700">
                            {diagnosticosUnicos.map(diag => <option key={diag} value={diag}>{diag === 'todos' ? '🔍 Todos' : `📋 ${diag}`}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white transition-all font-bold text-slate-700">
                            <option value="nombre">📊 Por Nombre</option>
                            <option value="edad">🎂 Por Edad</option>
                            <option value="reciente">📅 Más Recientes</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={48} /><p className="text-slate-400 font-bold">Cargando...</p></div>
                ) : listaNinosFiltrada.length === 0 ? (
                    <div className="p-20 text-center"><Users className="mx-auto text-slate-200 mb-4" size={64}/><p className="text-slate-400 font-bold text-lg">No se encontraron pacientes</p></div>
                ) : (
                    <>
                        <div className="md:hidden p-4 space-y-3">
                            {listaNinosFiltrada.map((nino) => (
                                <div key={nino.id} onClick={() => verDetallePaciente(nino)} className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">{nino.name.charAt(0)}</div>
                                        <div className="flex-1"><h4 className="font-black text-slate-800 text-base">{nino.name}</h4></div>
                                        <ChevronRight size={20} className="text-slate-300"/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs border border-purple-100">{nino.diagnosis || "En evaluación"}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-black text-xs">
                                            {nino.age ? `${nino.age}a` : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-4 lg:p-6 lg:pl-10">Paciente</th>
                                    <th className="p-4 lg:p-6">F. Nacimiento</th>
                                    <th className="p-4 lg:p-6">Edad</th>
                                    <th className="p-4 lg:p-6">Diagnóstico</th>
                                    <th className="p-4 lg:p-6 text-right lg:pr-10">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {listaNinosFiltrada.map((nino) => (
                                    <tr key={nino.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4 lg:p-6 lg:pl-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-md">{nino.name.charAt(0)}</div>
                                                <span className="font-black text-slate-700 text-base">{nino.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 lg:p-6 text-slate-500 text-sm font-medium">
                                            {nino.birth_date ? new Date(nino.birth_date).toLocaleDateString('es-PE') : "---"}
                                        </td>
                                        <td className="p-4 lg:p-6">
                                            <span className="font-black text-slate-700">
                                                {nino.age ? `${nino.age} años` : "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-4 lg:p-6"><span className="px-4 py-2 rounded-xl text-xs font-black bg-purple-50 text-purple-600 border border-purple-100 inline-block">{nino.diagnosis || "En evaluación"}</span></td>
                                        <td className="p-4 lg:p-6 text-right lg:pr-10">
                                            <button onClick={() => verDetallePaciente(nino)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg"><Eye size={14}/> Ver</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                        <div className={`p-6 text-white transition-colors ${isEditing ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black backdrop-blur-sm">
                                        {isEditing ? <Edit size={32}/> : selectedPatient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black">{isEditing ? 'Editar Paciente' : selectedPatient.name}</h3>
                                        <p className="text-white/80 text-sm font-bold">{selectedPatient.diagnosis || "Diagnóstico pendiente"}</p>
                                    </div>
                                </div>
                                <button onClick={() => {setShowPatientModal(false); setIsEditing(false)}} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {!isEditing ? (
                                <>
                                    <InfoRow label="Fecha de Nacimiento" value={selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toLocaleDateString('es-PE') : "No registrada"} icon={<Calendar size={16}/>}/>
                                    <InfoRow label="Edad" value={selectedPatient.age ? `${selectedPatient.age} años` : "No disponible"} icon={<Baby size={16}/>}/>
                                    <InfoRow label="Diagnóstico" value={selectedPatient.diagnosis || "En evaluación"} icon={<Stethoscope size={16}/>}/>
                                </>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label>
                                            <input 
                                                type="date" 
                                                value={editForm.birth_date} 
                                                onChange={e => handleBirthDateChange(e.target.value)} 
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Edad (auto)</label>
                                            <div className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl font-black text-green-700 flex items-center justify-center">
                                                {editForm.age > 0 ? `${editForm.age} años` : 'Sin edad'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Diagnóstico</label>
                                        <select 
                                            value={editForm.diagnosis} 
                                            onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {diagnosticosUnicos.filter(d => d !== 'todos').map(d => <option key={d} value={d}>{d}</option>)}
                                            <option value="TEA">TEA</option>
                                            <option value="TDAH">TDAH</option>
                                            <option value="Retraso del lenguaje">Retraso del lenguaje</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            {!isEditing ? (
                                <>
                                    <button onClick={() => setShowPatientModal(false)} className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-700 transition-all">Cerrar</button>
                                    <button onClick={activarEdicion} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                        <Edit size={18}/> Editar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-700 transition-all disabled:opacity-50">Cancelar</button>
                                    <button onClick={guardarCambios} disabled={isSaving} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==============================================================================
// VISTA: EVALUACIONES CON FORMULARIO ABA MEJORADO
// ==============================================================================
function DynamicEvaluationsView() {
  const [activeForm, setActiveForm] = useState<'aba' | 'anamnesis' | 'entorno_hogar' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChild, setSelectedChild] = useState('');
  const [listaNinos, setListaNinos] = useState<any[]>([]);
  const [respuestas, setRespuestas] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    supabase.from('children').select('id, name').then(({ data }) => data && setListaNinos(data));
  }, []);

  const formConfig = activeForm === 'anamnesis' ? ANAMNESIS_DATA : 
                     activeForm === 'aba' ? ABA_DATA : 
                     activeForm === 'entorno_hogar' ? ENTORNO_HOGAR_DATA : null;
  const currentSection = formConfig ? formConfig[currentStep] : null;
  const totalSteps = formConfig ? formConfig.length : 0;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const handleInputChange = (id: string, value: any) => {
    setRespuestas({ ...respuestas, [id]: value });
  };

  // 🆕 MANEJO DE MULTISELECT
  const handleMultiselectChange = (id: string, option: string) => {
    const current = respuestas[id] || [];
    const newValue = current.includes(option)
      ? current.filter((item: string) => item !== option)
      : [...current, option];
    setRespuestas({ ...respuestas, [id]: newValue });
  };

  const handleGenerateEntornoIA = async () => {
    if (!respuestas['comportamiento_observado'] && !respuestas['barreras_identificadas']) {
        return alert("⚠️ Necesitas describir el comportamiento o las barreras antes de usar IA.");
    }
    
    setIsGenerating(true);
    try {
        const response = await fetch('/api/generate-home-environment-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comportamiento_observado: respuestas['comportamiento_observado'] || '',
                barreras_identificadas: respuestas['barreras_identificadas'] || '',
                facilitadores: respuestas['facilitadores'] || '',
                rutina_diaria: respuestas['rutina_diaria'] || '',
                interaccion_padres: respuestas['interaccion_padres'] || ''
            })
        });
        const data = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.error || "Error al conectar con el servidor");
        }

        setRespuestas((prev: any) => ({
            ...prev,
            impresion_general: data.impresion_general,
            mensaje_padres_entorno: data.mensaje_padres,
            recomendaciones_espacio: data.recomendaciones_espacio,
            recomendaciones_rutinas: data.recomendaciones_rutinas,
            actividades_casa: data.actividades_sugeridas
        }));
        alert("✨ ¡Análisis completado!");

    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateGemini = async () => {
    if (!respuestas['conducta']) {
        return alert("⚠️ Describe la 'Conducta' antes de solicitar análisis IA.");
    }
    
    setIsGenerating(true);
    try {
        const response = await fetch('/api/generate-session-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                antecedente: respuestas['antecedente'] || 'No especificado',
                conducta: respuestas['conducta'],
                consecuencia: respuestas['consecuencia'] || 'No especificado',
                // 🆕 Datos adicionales del nuevo formulario
                objetivo_principal: respuestas['objetivo_principal'] || '',
                habilidades_objetivo: respuestas['habilidades_objetivo'] || [],
                avances_observados: respuestas['avances_observados'] || '',
                areas_dificultad: respuestas['areas_dificultad'] || ''
            })
        });
        const data = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.error || "Error al conectar");
        }

        setRespuestas((prev: any) => ({
            ...prev,
            mensaje_padres: data.mensaje_padres,          
            observaciones_tecnicas: data.observaciones_clinicas,
            alertas_clinicas: data.red_flags,
            recomendaciones_equipo: data.mentoring_interno
        }));
        alert("✨ ¡Análisis IA completado!");

    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChild) return alert("Selecciona un paciente");
    setIsSaving(true);
    const tabla = activeForm === 'anamnesis' ? 'anamnesis_completa' : 
                  activeForm === 'aba' ? 'registro_aba' :
                  activeForm === 'entorno_hogar' ? 'registro_entorno_hogar' : '';
    
    const dataToInsert = activeForm === 'entorno_hogar' ? 
      { child_id: selectedChild, fecha_visita: respuestas['fecha_visita'] || new Date().toISOString(), datos: respuestas } :
      activeForm === 'aba' ? { child_id: selectedChild, fecha_sesion: respuestas['fecha_sesion'] || new Date().toISOString(), datos: respuestas } :
      { child_id: selectedChild, datos: respuestas };
    
    const { error } = await supabase.from(tabla).insert([dataToInsert]);
    
    if (error) { 
        alert("Error: " + error.message);
    } else { 
        alert("✅ ¡Guardado exitosamente!"); 
        setActiveForm(null); 
        setCurrentStep(0); 
        setRespuestas({}); 
        setSelectedChild('');
    }
    setIsSaving(false);
  };

  const resetForm = () => {
    setActiveForm(null);
    setCurrentStep(0);
    setRespuestas({});
    setSelectedChild('');
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!activeForm ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl w-full">
            
            {/* Card ABA MEJORADA */}
            <button 
              onClick={() => setActiveForm('aba')} 
              className="group relative bg-white rounded-3xl md:rounded-[2.5rem] border-2 border-slate-100 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 p-8 md:p-12 flex flex-col items-center justify-center text-center h-[320px] md:h-[420px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-purple-200">
                   <Activity size={40} className="md:w-16 md:h-16" strokeWidth={2.5}/>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 md:mb-4 tracking-tight">
                  Registro ABA
                </h3>
                
                <p className="text-slate-500 text-sm md:text-base max-w-xs font-medium leading-relaxed mb-4">
                  Sistema completo con análisis ABC, métricas de desempeño y generación IA
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">
                    10 Secciones
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                    Métricas
                  </span>
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                    IA Pro
                  </span>
                </div>
              </div>
            </button>

            {/* Card Anamnesis */}
            <button 
              onClick={() => setActiveForm('anamnesis')} 
              className="group relative bg-white rounded-3xl md:rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 p-8 md:p-12 flex flex-col items-center justify-center text-center h-[320px] md:h-[420px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-blue-200">
                   <FileText size={40} className="md:w-16 md:h-16" strokeWidth={2.5}/>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 md:mb-4 tracking-tight">
                  Anamnesis
                </h3>
                
                <p className="text-slate-500 text-sm md:text-base max-w-xs font-medium leading-relaxed mb-4">
                  Expediente completo de admisión con historia clínica detallada
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                    10 Secciones
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                    Completa
                  </span>
                </div>
              </div>
            </button>

            {/* Card Entorno Hogar */}
            <button 
              onClick={() => setActiveForm('entorno_hogar')} 
              className="group relative bg-white rounded-3xl md:rounded-[2.5rem] border-2 border-slate-100 hover:border-green-400 hover:shadow-2xl transition-all duration-300 p-8 md:p-12 flex flex-col items-center justify-center text-center h-[320px] md:h-[420px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-green-200">
                   <Home size={40} className="md:w-16 md:h-16" strokeWidth={2.5}/>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 md:mb-4 tracking-tight">
                  Entorno Hogar
                </h3>
                
                <p className="text-slate-500 text-sm md:text-base max-w-xs font-medium leading-relaxed mb-4">
                  Análisis domiciliario con recomendaciones personalizadas por IA
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                    10 Secciones
                  </span>
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                    IA Avanzada
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        // FORMULARIO ACTIVO
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full max-w-7xl mx-auto w-full my-2 md:my-4">
          
          {/* HEADER CON PROGRESO */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 md:px-8 py-4 md:py-6 text-white shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden flex-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center font-black text-lg md:text-xl border border-white/20">
                     {currentStep + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                      <p className="text-blue-300 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate mb-1">
                        {activeForm === 'anamnesis' ? '📋 EXPEDIENTE CLÍNICO' : 
                         activeForm === 'aba' ? '🧠 PROTOCOLO ABA MEJORADO' : 
                         '🏠 EVALUACIÓN DOMICILIARIA'}
                      </p>
                      <h2 className="text-base md:text-xl lg:text-2xl font-black truncate leading-tight">
                        {currentSection?.title}
                      </h2>
                  </div>
              </div>
              <button 
                onClick={resetForm}
                className="p-2 md:p-2.5 hover:bg-white/10 rounded-xl transition-colors shrink-0 ml-2"
              >
                <X size={20} className="md:w-6 md:h-6"/>
              </button>
            </div>

            <div className="relative">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-blue-400/50"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-200 font-bold mt-2 text-center">
                Sección {currentStep + 1} de {totalSteps} • {Math.round(progress)}% completado
              </p>
            </div>
          </div>

          {/* CONTENIDO DEL FORMULARIO */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-white">
             <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                {/* Selector de Paciente */}
                <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all">
                   <label className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                     <User size={16}/>
                     Seleccionar Paciente
                   </label>
                   <select 
                      className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl font-bold text-base md:text-lg text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                     value={selectedChild} 
                     onChange={(e) => setSelectedChild(e.target.value)}
                   >
                      <option value="">-- Buscar paciente --</option>
                      {listaNinos.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                   </select>
                </div>

                {/* Preguntas del Formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {currentSection?.questions.map((q: any) => (
                    <div key={q.id} className={`space-y-3 ${q.type === 'textarea' || q.type === 'multiselect' ? 'md:col-span-2' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <label className="text-sm md:text-base font-bold text-slate-700 ml-1 flex items-center gap-2">
                            {q.label}
                            {q.required && <span className="text-red-500">*</span>}
                            {q.aiGenerated && (
                              <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-black">
                                IA
                              </span>
                            )}
                          </label>
                          {(q.id === 'mensaje_padres' || q.id === 'mensaje_padres_entorno') && (
                              <button 
                                onClick={activeForm === 'entorno_hogar' ? handleGenerateEntornoIA : handleGenerateGemini}
                                disabled={isGenerating}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin"/>
                                    <span>Generando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14}/>
                                    <span>Generar IA</span>
                                  </>
                                )}
                              </button>
                          )}
                      </div>

                      {/* Campo Date */}
                      {q.type === 'date' && (
                        <input 
                          type="date" 
                          className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                          value={respuestas[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)} 
                        />
                      )}
                      
                      {/* Campo Number */}
                      {q.type === 'number' && (
                        <input 
                          type="number"
                          min={q.min}
                          max={q.max}
                          placeholder={q.placeholder}
                          className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                          value={respuestas[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)} 
                        />
                      )}
                      
                      {/* Campo Text */}
                      {q.type === 'text' && (
                        <input 
                          className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium" 
                          placeholder={q.placeholder} 
                          value={respuestas[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)} 
                        />
                      )}
                      
                      {/* Campo Textarea */}
                      {q.type === 'textarea' && (
                        <textarea 
                            className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium min-h-[120px] md:min-h-[140px] resize-none leading-relaxed" 
                            placeholder={q.placeholder} 
                            value={respuestas[q.id] || ''} 
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                        ></textarea>
                      )}
                      
                      {/* Campo Select */}
                      {q.type === 'select' && (
                        <div className="relative">
                            <select 
                              className="w-full p-4 md:p-5 bg-white border-2 border-slate-200 rounded-xl md:rounded-2xl text-sm md:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 appearance-none cursor-pointer font-medium pr-12" 
                              value={respuestas[q.id] || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {q.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/>
                        </div>
                      )}
                      
                      {/* 🆕 Campo Range (Escala 1-5) */}
                      {q.type === 'range' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500">
                              {q.labels?.[0] || 'Mínimo'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-blue-600">
                                {respuestas[q.id] || q.min || 1}
                              </span>
                              <span className="text-sm text-slate-400">/ {q.max || 5}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-500">
                              {q.labels?.[q.labels.length - 1] || 'Máximo'}
                            </span>
                          </div>
                          <input 
                            type="range"
                            min={q.min || 1}
                            max={q.max || 5}
                            step="1"
                            value={respuestas[q.id] || q.min || 1}
                            onChange={(e) => handleInputChange(q.id, parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-blue-700"
                          />
                          {q.labels && (
                            <p className="text-xs text-center font-bold text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
                              {q.labels[respuestas[q.id] - 1] || q.labels[0]}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* 🆕 Campo Multiselect */}
                      {q.type === 'multiselect' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt: string) => (
                              <label 
                                key={opt}
                                className={`px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                                  (respuestas[q.id] || []).includes(opt)
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={(respuestas[q.id] || []).includes(opt)}
                                  onChange={() => handleMultiselectChange(q.id, opt)}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                          {(respuestas[q.id] || []).length > 0 && (
                            <p className="text-xs text-slate-500 font-bold">
                              ✓ {(respuestas[q.id] || []).length} seleccionada(s)
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Campo Radio */}
                      {q.type === 'radio' && (
                        <div className="flex flex-wrap gap-3">
                            {q.options.map((opt: string) => (
                                <label 
                                  key={opt} 
                                  className={`flex items-center gap-2 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all text-sm md:text-base font-bold ${
                                      respuestas[q.id] === opt 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                    <input 
                                      type="radio" 
                                      name={q.id} 
                                      value={opt} 
                                      className="hidden" 
                                      checked={respuestas[q.id] === opt}
                                      onChange={(e) => handleInputChange(q.id, e.target.value)} 
                                    />
                                    <span>{opt}</span>
                                    {respuestas[q.id] === opt && <CheckCircle2 size={18}/>}
                                </label>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* FOOTER CON NAVEGACIÓN */}
          <div className="p-5 md:p-6 bg-white border-t-2 border-slate-100 flex justify-between shrink-0 gap-4 shadow-lg">
              <button 
                disabled={currentStep === 0} 
                onClick={() => setCurrentStep(currentStep-1)} 
                className="px-6 md:px-8 py-3 md:py-4 font-black text-sm md:text-base text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={18}/>
                Atrás
              </button>
              
              {currentStep < (formConfig!.length - 1) ? (
                 <button 
                   onClick={() => setCurrentStep(currentStep+1)} 
                   className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:from-black hover:to-slate-900 transition-all flex items-center gap-2 shadow-xl"
                 >
                   <span>Siguiente</span>
                   <ChevronRight size={18}/>
                 </button>
              ) : (
                 <button 
                   onClick={handleSave} 
                   disabled={isSaving || !selectedChild} 
                   className="px-10 md:px-14 py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 shadow-xl shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSaving ? (
                     <>
                       <Loader2 className="animate-spin" size={18}/>
                       <span>Guardando...</span>
                     </>
                   ) : (
                     <>
                       <Save size={18}/>
                       <span>Guardar</span>
                     </>
                   )}
                 </button>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// VISTA: HISTORIAL & IA
// ==============================================================================
function AIReportView() {
  const [listaNinos, setListaNinos] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [historyData, setHistoryData] = useState<any>({ anamnesis: null, aba: [], entorno: [] })
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<any[]>([
      { role: 'ai', text: 'Hola 👋. Selecciona un paciente para iniciar el análisis clínico.' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('children').select('id, name').then(({ data }) => data && setListaNinos(data))
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typing])

  const handleSelectChild = async (childId: string) => {
    setSelectedChild(childId)
    setHistoryData({ anamnesis: null, aba: [], entorno: [] }) 
    
    setMessages([{ role: 'ai', text: 'Cargando historial del paciente...' }])
    
    const { data: anamnesis } = await supabase
      .from('anamnesis_completa')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    const { data: aba } = await supabase
      .from('registro_aba')
      .select('*')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
    
    const { data: entorno } = await supabase
      .from('registro_entorno_hogar')
      .select('*')
      .eq('child_id', childId)
      .order('fecha_visita', { ascending: false })
    
    setHistoryData({ 
      anamnesis: anamnesis ? anamnesis.datos : null, 
      aba: aba || [],
      entorno: entorno || []
    })
    
    const nombre = listaNinos.find(n => n.id === childId)?.name || 'el paciente';
    
    setMessages([{ 
      role: 'ai', 
      text: `✅ He cargado el historial completo de **${nombre}**.\n\n📊 Poseo:\n• ${aba?.length || 0} sesiones ABA\n• ${entorno?.length || 0} visitas domiciliarias\n• ${anamnesis ? '1 anamnesis' : 'Sin anamnesis'}\n\n¿Qué deseas analizar?` 
    }])
  }

  const sendMessage = async () => {
    if(!input.trim()) return;
    if(!selectedChild) {
        alert("Selecciona un paciente primero.");
        return;
    }

    const text = input;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    try {
        const response = await fetch('/api/admin-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: text, 
                childId: selectedChild 
            })
        });

        const data = await response.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.text }]);

    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', text: "❌ Error de conexión." }]);
    } finally {
        setTyping(false);
    }
  }

  const toggleCard = (id: string) => setExpandedCardId(expandedCardId === id ? null : id)

  return (
    <div className="h-full flex flex-col gap-4 md:gap-6 animate-fade-in-up overflow-hidden">
      <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 flex-shrink-0">
        <h3 className="font-bold text-slate-700 text-lg md:text-xl flex items-center gap-2 md:gap-3 shrink-0">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Brain size={24} className="text-purple-600"/>
          </div>
          Analizador Inteligente
        </h3>
        <select 
          className="p-3 md:p-4 bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl outline-none font-bold text-slate-700 text-sm w-full md:w-[400px] focus:bg-white focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all" 
          onChange={(e) => handleSelectChild(e.target.value)}
          value={selectedChild}
        >
          <option value="">🔍 Seleccionar Paciente...</option>
          {listaNinos.map(n => <option key={n.id} value={n.id}>👤 {n.name}</option>)}
        </select>
      </div>

      {selectedChild ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 overflow-hidden min-h-0">
            
            {/* ANAMNESIS */}
            <div className="hidden xl:block xl:col-span-3 bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100 font-extrabold text-slate-700 text-xs uppercase tracking-[0.2em] flex items-center gap-2 sticky top-0 z-10">
                    <FileText size={16} className="text-blue-600"/> Ficha de Ingreso
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                    {historyData.anamnesis ? Object.entries(historyData.anamnesis).slice(0, 15).map(([key, value]: any) => (
                      <div key={key} className="group hover:bg-slate-50 p-3 rounded-xl transition-all">
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-wider">{key.replace(/_/g, ' ')}</span>
                            <p className="text-sm text-slate-700 font-bold leading-tight">{String(value)}</p>
                      </div>
                    )) : (
                        <div className="text-center py-20">
                            <FileText className="mx-auto text-slate-200 mb-3" size={48}/>
                            <p className="text-xs text-slate-300 mt-2">No hay datos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* HISTORIAL */}
            <div className="col-span-1 lg:col-span-7 xl:col-span-5 bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                      <History size={18} className="text-orange-500"/> 
                      Registro Clínico
                    </span>
                    <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">
                      {historyData.aba.length + historyData.entorno.length} Registros
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                   {historyData.entorno.map((visita: any) => {
                        const isExpanded = expandedCardId === `entorno-${visita.id}`
                        const d = visita.datos || {}

                        return (
                            <div key={`entorno-${visita.id}`} className={`bg-gradient-to-br from-green-50 to-white rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 ${isExpanded ? 'border-green-400 shadow-xl ring-4 ring-green-50' : 'border-green-100 hover:border-green-200'}`}>
                                <div className="p-4 md:p-5 cursor-pointer flex items-center justify-between" onClick={() => toggleCard(`entorno-${visita.id}`)}>
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center bg-green-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg">
                                            <Home size={20}/>
                                            <span className="text-[10px] font-bold uppercase opacity-80 mt-1">Hogar</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="text-sm font-black text-slate-700 truncate">Visita Domiciliaria</p>
                                            <span className="text-xs text-green-600 font-bold">{visita.fecha_visita}</span>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-full transition-all ${isExpanded ? 'bg-green-600 text-white rotate-180' : 'bg-green-50 text-green-400'}`}>
                                      <ChevronDown size={20}/>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 pt-0 border-t border-green-50 bg-white animate-fade-in">
                                        <div className="flex flex-col gap-4 mt-6">
                                            <DetailBox title="Personas Presentes" content={d.personas_presentes} icon={<Users size={14}/>} color="bg-blue-50 border-blue-100 text-blue-900" full/>
                                            <DetailBox title="Comportamiento" content={d.comportamiento_observado} icon={<Eye size={14}/>} color="bg-purple-50 border-purple-100 text-purple-900" full/>
                                            <DetailBox title="Impresión IA" content={d.impresion_general} icon={<Brain size={14}/>} color="bg-indigo-50 border-indigo-100 text-indigo-900" full/>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <DetailBox title="Barreras" content={d.barreras_identificadas} icon={<ShieldAlert size={14}/>} color="bg-red-50 border-red-100 text-red-900"/>
                                                <DetailBox title="Facilitadores" content={d.facilitadores} icon={<CheckCircle2 size={14}/>} color="bg-green-50 border-green-100 text-green-900"/>
                                            </div>

                                            <DetailBox title="Mensaje Padres" content={d.mensaje_padres_entorno} icon={<MessageCircle size={14}/>} color="bg-green-50 border-green-100 text-green-900" full/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {historyData.aba.map((sesion: any) => {
                        const isExpanded = expandedCardId === `aba-${sesion.id}`
                        const d = sesion.datos || {}

                        return (
                            <div key={`aba-${sesion.id}`} className={`bg-white rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 ${isExpanded ? 'border-blue-400 shadow-xl ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                <div className="p-5 cursor-pointer flex items-center justify-between" onClick={() => toggleCard(`aba-${sesion.id}`)}>
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center bg-slate-800 text-white rounded-xl p-3 min-w-[70px] shadow-lg">
                                            <span className="text-[10px] font-bold uppercase opacity-60">
                                              {new Date(sesion.fecha_sesion).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-black">{new Date(sesion.fecha_sesion).getDate() + 1}</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="text-sm font-black text-slate-700 truncate">{d.conducta || "Sesión ABA"}</p>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-full transition-all ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                      <ChevronDown size={20}/>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 pt-0 border-t border-slate-50 bg-white animate-fade-in">
                                        <div className="flex flex-col gap-4 mt-6">
                                            <DetailBox title="Objetivo" content={d.objetivo_principal} icon={<Target size={14}/>} color="bg-blue-50 border-blue-100 text-blue-900" full/>
                                            <DetailBox title="Observaciones" content={d.observaciones_tecnicas} icon={<Eye size={14}/>} color="bg-slate-50 border-slate-100" full/>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <DetailBox title="ABC" content={d.antecedente} icon={<Activity size={14}/>} color="bg-purple-50 border-purple-100 text-purple-900"/>
                                                <DetailBox title="Intervención" content={d.estrategias_manejo} icon={<Zap size={14}/>} color="bg-orange-50 border-orange-100 text-orange-900"/>
                                            </div>

                                            <DetailBox title="Mensaje WhatsApp" content={d.mensaje_padres} icon={<MessageCircle size={14}/>} color="bg-green-50 border-green-100 text-green-900" full/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    
                    {(historyData.aba.length === 0 && historyData.entorno.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                        <History size={80} className="mb-6"/>
                        <p className="text-lg font-black uppercase tracking-[0.3em]">Sin Registros</p>
                      </div>
                    )}
                </div>
            </div>

            {/* CHAT IA */}
            <div className="col-span-1 lg:col-span-5 xl:col-span-4 bg-white rounded-3xl md:rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shadow-lg">
                   <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles size={22}/>
                        </div>
                        <div>
                            <span className="font-black text-sm uppercase tracking-widest">Asistente IA</span>
                            <span className="text-[10px] text-green-400 font-bold uppercase flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> 
                              Gemini v4.0
                            </span>
                        </div>
                    </div>
                </div>
                
                <div 
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 bg-gradient-to-br from-slate-50 to-white" 
                  ref={chatContainerRef}
                >
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[90%] p-4 rounded-2xl md:rounded-[1.5rem] text-sm leading-relaxed shadow-md ${
                              m.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border-b-4 border-blue-800' 
                                : 'bg-white border-2 border-slate-200 text-slate-700 rounded-bl-none'
                            }`}>
                                {m.role === 'ai' ? (
                                  <p className="font-medium whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                    __html: m.text
                                      .replace(/\*\*(.*?)\*\*/g, '<b class="font-black">$1</b>')
                                      .replace(/\n/g, '<br/>')
                                  }}></p>
                                ) : m.text}
                            </div>
                        </div>
                    ))}
                    {typing && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={16}/>
                          <span className="text-xs font-bold text-slate-400">Analizando...</span>
                        </div>
                      </div>
                    )}
                </div>

                <div className="p-4 md:p-5 border-t-2 border-slate-200 bg-white flex gap-3 shadow-lg">
                    <input 
                        className="flex-1 bg-slate-100 border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                        placeholder="Pregunta sobre evolución..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!input.trim()}
                      className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl hover:scale-105 active:scale-95 transition shadow-xl disabled:opacity-50"
                    >
                      <Send size={20}/>
                    </button>
                </div>
            </div>
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-40">
              <Brain size={120} className="mb-8 text-slate-200"/>
              <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Seleccionar Paciente</p>
          </div>
      )}
    </div>
  )
}

function DetailBox({ title, content, icon, color, full }: any) {
    const safeContent = content ? String(content) : ""; 
    const isEmpty = safeContent === "" || safeContent === "undefined";
    const finalStyle = isEmpty ? "bg-slate-50 border-slate-100 text-slate-400" : color;

    return (
        <div className={`p-4 rounded-2xl border ${finalStyle} shadow-sm transition-all ${full ? 'w-full' : ''}`}>
            <p className={`font-black uppercase mb-2 flex items-center gap-2 text-[10px] tracking-widest`}>
              {icon} {title}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {isEmpty ? "SIN REGISTRO" : safeContent}
            </p>
        </div>
    )
}

// ==============================================================================
// VISTA: CALENDARIO
// ==============================================================================
function MonthlyCalendarView() {
    const [apts, setApts] = useState<any[]>([])
    const [ninos, setNinos] = useState<any[]>([])
    const [show, setShow] = useState(false)
    const [tipoSesion, setTipoSesion] = useState<'individual' | 'grupal'>('individual')
    const [newApt, setNewApt] = useState({ 
        child_id: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '09:00', 
        service: 'Terapia ABA',
        is_group: false,
        group_name: '',
        participants: [] as string[]
    });
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

    useEffect(() => { 
        cargarCitas()
        supabase.from('children').select('id, name').then(({data})=>data&&setNinos(data));
    }, [])

    const cargarCitas = async () => {
        const { data } = await supabase
            .from('appointments')
            .select('*, children(name)')
        if (data) setApts(data)
    }

    const eliminarCita = async (id: string, e: any) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar esta cita?")) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);
            if (error) throw error;

            alert("🗑️ Cita eliminada");
            cargarCitas();
        } catch (error: any) {
            alert("❌ Error: " + error.message);
        }
    }
    
    const handleSave = async () => {
        if (tipoSesion === 'individual' && !newApt.child_id) {
            return alert("Selecciona un paciente")
        }
        
        if (tipoSesion === 'grupal' && selectedParticipants.length === 0) {
            return alert("Selecciona al menos un participante")
        }

        if (tipoSesion === 'grupal') {
            const citas = selectedParticipants.map(childId => ({
                child_id: childId,
                appointment_date: newApt.date,
                appointment_time: newApt.time,
                service_type: `${newApt.service} (Grupal: ${newApt.group_name || 'Sin nombre'})`,
                is_group: true,
                group_name: newApt.group_name
            }))

            const { error } = await supabase.from('appointments').insert(citas)
            if (!error) {
                alert(`✅ Sesión grupal agendada`)
                resetForm()
                cargarCitas()
            } else {
                alert("Error: " + error.message)
            }
        } else {
            const { error } = await supabase.from('appointments').insert([{
                child_id: newApt.child_id,
                appointment_date: newApt.date,
                appointment_time: newApt.time,
                service_type: newApt.service,
                is_group: false
             }])
            
            if (!error) {
                alert("✅ Cita agendada")
                resetForm()
                cargarCitas()
            } else {
               alert("Error: " + error.message)
            }
        }
    }

    const resetForm = () => {
        setShow(false)
        setTipoSesion('individual')
        setNewApt({ 
            child_id: '', 
            date: new Date().toISOString().split('T')[0], 
            time: '09:00', 
            service: 'Terapia ABA',
            is_group: false,
            group_name: '',
            participants: []
        })
        setSelectedParticipants([])
    }

    const toggleParticipant = (childId: string) => {
        if (selectedParticipants.includes(childId)) {
            setSelectedParticipants(selectedParticipants.filter(id => id !== childId))
        } else {
            setSelectedParticipants([...selectedParticipants, childId])
        }
    }

    return (
        <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-200 h-full flex flex-col animate-fade-in-up overflow-hidden">
            <div className="p-6 md:p-8 lg:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-10 bg-white gap-4">
                <div>
                    <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tighter flex items-center gap-3">
                        <Calendar className="text-blue-600" size={32}/>
                        Calendario de Citas
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm font-bold mt-1">
                        {apts.length} citas programadas
                    </p>
                </div>
                <button 
                    onClick={()=>setShow(true)} 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-200 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    <Plus size={18} className="md:w-5 md:h-5"/> 
                    Nueva Cita
                </button>
            </div>
            
            <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {apts.map(a => (
                        <div key={a.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all group relative">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <span className={`text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest ${
                                        a.is_group 
                                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                 {a.is_group ? '👥 Grupal' : a.service_type || 'Sesión'}
                                </span>
                                
                                <button 
                                    onClick={(e) => eliminarCita(a.id, e)}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                >
                                     <Trash2 size={18}/>
                                </button>
                            </div>
                            
                            <h4 className="font-black text-lg md:text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors mb-2">
                                {a.children?.name || 'Paciente'}
                            </h4>
                            
                            {a.group_name && (
                                <p className="text-xs text-purple-600 font-bold mb-3 bg-purple-50 px-2 py-1 rounded-lg inline-block">
                                    {a.group_name}
                                </p>
                            )}
                            
                            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-50 flex items-center gap-2 md:gap-3 text-slate-400 font-bold text-[10px] md:text-xs uppercase">
                                <Clock size={16}/>
                                <span>{a.appointment_date} • {a.appointment_time?.slice(0,5)}</span>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={()=>setShow(true)} 
                        className="border-4 border-dashed border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all h-[200px] md:h-[240px]"
                    >
                        <Plus size={32} className="md:w-10 md:h-10 mb-3 md:mb-4"/>
                        <span className="font-black text-xs md:text-sm uppercase tracking-widest">Agendar</span>
                    </button>
                </div>
            </div>

            {show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-6">
                    <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 md:mb-10">
                            <h3 className="font-black text-xl md:text-2xl text-slate-800">Nueva Cita</h3>
                            <button onClick={resetForm} className="p-2 rounded-full hover:bg-slate-100">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                    Tipo de Sesión
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {setTipoSesion('individual'); setSelectedParticipants([])}}
                                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                                            tipoSesion === 'individual' 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        👤 Individual
                                    </button>
                                    <button
                                        onClick={() => {setTipoSesion('grupal'); setNewApt({...newApt, child_id: ''})}}
                                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                                            tipoSesion === 'grupal' 
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                        }`}
                                    >
                                        👥 Grupal
                                    </button>
                                </div>
                            </div>

                            {tipoSesion === 'individual' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Paciente
                                    </label>
                                    <select 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                                        onChange={e=>setNewApt({...newApt, child_id: e.target.value})}
                                        value={newApt.child_id}
                                    >
                                        <option value="">Buscar...</option>
                                        {ninos.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {tipoSesion === 'grupal' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                              Nombre del Grupo
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Grupo habilidades sociales"
                                            className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all"
                                            onChange={e=>setNewApt({...newApt, group_name: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                            Participantes ({selectedParticipants.length})
                                        </label>
                                        <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                                            <div className="space-y-2">
                                                {ninos.map(n => (
                                                    <label 
                                                        key={n.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                                            selectedParticipants.includes(n.id) 
                                                              ? 'bg-purple-600 text-white shadow-md' 
                                                                : 'bg-white hover:bg-purple-50 border border-slate-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={selectedParticipants.includes(n.id)}
                                                            onChange={() => toggleParticipant(n.id)}
                                                        />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                                                            selectedParticipants.includes(n.id) 
                                                                ? 'bg-white border-white' 
                                                                : 'border-slate-300'
                                                        }`}>
                                                            {selectedParticipants.includes(n.id) && (
                                                                <CheckCircle2 size={14} className="text-purple-600"/>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-sm">{n.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Fecha
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                                        value={newApt.date}
                                        onChange={e=>setNewApt({...newApt, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Hora
                                    </label>
                                    <input 
                                        type="time" 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                                        value={newApt.time}
                                        onChange={e=>setNewApt({...newApt, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button 
                                    onClick={resetForm} 
                                    className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className={`flex-[2] p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                                        tipoSesion === 'individual' 
                                            ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' 
                                            : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
                                    }`}
                                >
                                    {tipoSesion === 'individual' ? 'Agendar' : `Agendar Grupal`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==============================================================================
// VISTA: IMPORTACIÓN EXCEL
// ==============================================================================
function ExcelImportView() {
  const [listaNinos, setListaNinos] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    supabase.from('children').select('id, name').then(({ data }) => data && setListaNinos(data)) 
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChild) return alert("Selecciona paciente y archivo");
    setImporting(true);
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'array', codepage: 65001 });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);
        const recordsToInsert = rawData.map((row: any) => {
            const c: any = {}; 
            Object.keys(row).forEach(k => c[k.trim()] = row[k]);
            return {
              child_id: selectedChild,
              fecha_sesion: c['date'] ? new Date((c['date'] - 25569) * 86400 * 1000).toISOString() : new Date().toISOString(),
              datos: { 
                legacy_observations: c['legacy_observations'] || '',
                legacy_abc_analysis: c['legacy_abc_analysis'] || '',
                mentoring_notes: c['mentoring_notes'] || '',
                legacy_behavior_text: c['legacy_behavior_text'] || '',
                legacy_barriers: c['legacy_barriers'] || '',
                legacy_red_flags: c['legacy_red_flags'] || '',
                legacy_activity: c['legacy_activity'] || '',
                legacy_justification: c['legacy_justification'] || '',
                legacy_home_task: c['legacy_home_task'] || '',
                legacy_whatsapp: c['legacy_whatsapp'] || '',
                conducta: c['legacy_behavior_text'] || ''
              }
            }
        });
        const { error } = await supabase.from('registro_aba').insert(recordsToInsert);
        if (error) throw error;
        alert("✅ ¡Carga exitosa!");
      } catch (err: any) { 
        alert("Error: " + err.message);
      } finally { 
        setImporting(false); 
      }
    };
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-6 md:py-10 px-4 animate-fade-in-up">
      <div className="bg-white p-8 md:p-16 rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-slate-200 text-center max-w-2xl w-full">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl shadow-green-200">
          <FileSpreadsheet size={40} className="md:w-[60px] md:h-[60px]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 md:mb-3 tracking-tight">Importación Masiva</h2>
        <p className="text-slate-400 text-xs md:text-sm mb-8 md:mb-12 font-medium">Sincroniza historial desde CSV/Excel</p>

        <div className="space-y-6 text-left">
          <div className="space-y-2">
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Paciente</label>
             <select 
               className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-base text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
               value={selectedChild} 
               onChange={(e) => setSelectedChild(e.target.value)}
             >
                <option value="">Seleccionar...</option>
                {listaNinos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
             </select>
          </div>

          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept=".csv, .xlsx" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
              disabled={!selectedChild}
            />
            <div className={`w-full p-12 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
              importing 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-white border-blue-100 group-hover:bg-blue-50 group-hover:border-blue-400'
            }`}>
               {importing ? (
                 <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
               ) : (
                 <Upload className="text-blue-500 mb-4" size={48}/>
               )}
               <span className="text-lg font-black text-slate-600">
                 {importing ? 'Sincronizando...' : 'Seleccionar Archivo'}
               </span>
               <span className="text-xs text-slate-400 mt-2 font-bold uppercase">
                 CSV (UTF-8) o XLSX
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}