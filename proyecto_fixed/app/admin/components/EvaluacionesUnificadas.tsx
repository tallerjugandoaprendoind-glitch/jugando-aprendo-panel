'use client'

/**
 * =====================================================================
 * EVALUACIONES UNIFICADAS - Centro Clínico Neurodivergente
 * Fusiona Evaluaciones Clínicas (BRIEF2, ADOS2, WISC-V...) +
 * NeuroFormas (TDAH, TEA, Sensorial, Habilidades, Casa)
 * Con IA Gemini, envío a padres, análisis clínico profesional
 * =====================================================================
 */

import { useState, useEffect } from 'react'
import {
  Brain, Send, ChevronRight, ChevronLeft, CheckCircle2, X, Loader2,
  Sparkles, FileText, Plus, Eye, Clock, AlertTriangle, Search,
  Zap, MessageCircle, BarChart3, RefreshCw, BookOpen, Target, Heart,
  Activity, Star, ChevronDown, ChevronUp, Save, ClipboardList,
  Filter, Users, TrendingUp, Shield, Stethoscope, Home, Baby,
  CalendarDays, Lock, Unlock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  ALL_FORMS, FORM_CATEGORIES, type FormDefinition, type FormCategory
} from '../data/neurodivergentForms'
import {
  ANAMNESIS_DATA, ABA_DATA, ENTORNO_HOGAR_DATA, BRIEF2_DATA,
  ADOS2_DATA, VINELAND3_DATA, WISCV_DATA, BASC3_DATA
} from '../data/formConstants'
import { calcularEdadNumerica } from '../utils/helpers'

// ─── CATEGORÍAS UNIFICADAS ──────────────────────────────────────────────────
const UNIFIED_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '🗂️', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'tdah', label: 'TDAH', icon: '⚡', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'tea', label: 'TEA', icon: '🧩', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'conductual', label: 'Conductual', icon: '🎯', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'sensorial', label: 'Sensorial', icon: '🌀', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'habilidades', label: 'Habilidades', icon: '🤝', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'cognitivo', label: 'Cognitivo', icon: '🧠', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'familia', label: 'Familia', icon: '🏠', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'clinico', label: 'Clínico Pro', icon: '🏥', color: 'bg-red-50 text-red-700 border-red-200' },
]

// Formularios clínicos profesionales (los que existían en Evaluaciones)
const CLINICAL_FORMS = [
  {
    id: 'anamnesis', title: 'Anamnesis Completa', subtitle: 'Historia clínica integral',
    category: 'clinico', icon: '📋', tags: ['Historia', 'Inicial', 'Completo'],
    color: 'from-slate-600 to-slate-800', estimatedMinutes: 30, targetRole: 'admin',
    description: 'Historia clínica completa del paciente, antecedentes familiares y desarrollo temprano',
    formKey: 'anamnesis'
  },
  {
    id: 'aba', title: 'Sesión ABA', subtitle: 'Registro de sesión conductual',
    category: 'conductual', icon: '🎯', tags: ['ABA', 'Sesión', 'Conductual'],
    color: 'from-orange-500 to-red-600', estimatedMinutes: 15, targetRole: 'admin',
    description: 'Registro estructurado de sesión de Análisis Conductual Aplicado',
    formKey: 'aba'
  },
  {
    id: 'entorno_hogar', title: 'Entorno en el Hogar', subtitle: 'Evaluación del ambiente familiar',
    category: 'familia', icon: '🏠', tags: ['Hogar', 'Familia', 'Ambiente'],
    color: 'from-pink-500 to-rose-600', estimatedMinutes: 20, targetRole: 'both',
    description: 'Análisis del entorno familiar y su impacto en el desarrollo del niño',
    formKey: 'entorno_hogar'
  },
  {
    id: 'brief2', title: 'BRIEF-2', subtitle: 'Función ejecutiva (Padres/Maestros)',
    category: 'cognitivo', icon: '🧠', tags: ['Ejecutivo', 'BRIEF-2', 'Cognitivo'],
    color: 'from-indigo-500 to-purple-600', estimatedMinutes: 25, targetRole: 'admin',
    description: 'Inventario de Evaluación del Comportamiento de la Función Ejecutiva, 2ª edición',
    formKey: 'brief2'
  },
  {
    id: 'ados2', title: 'ADOS-2', subtitle: 'Observación diagnóstica de autismo',
    category: 'tea', icon: '🔬', tags: ['TEA', 'ADOS', 'Diagnóstico'],
    color: 'from-purple-600 to-violet-700', estimatedMinutes: 45, targetRole: 'admin',
    description: 'Escala de Observación para el Diagnóstico del Autismo, 2ª edición',
    formKey: 'ados2'
  },
  {
    id: 'vineland3', title: 'Vineland-3', subtitle: 'Conducta adaptativa',
    category: 'habilidades', icon: '🌟', tags: ['Adaptativo', 'Vineland', 'Funcional'],
    color: 'from-green-500 to-emerald-600', estimatedMinutes: 35, targetRole: 'admin',
    description: 'Escalas de Comportamiento Adaptativo Vineland, 3ª edición',
    formKey: 'vineland3'
  },
  {
    id: 'wiscv', title: 'WISC-V', subtitle: 'Inteligencia (6-16 años)',
    category: 'cognitivo', icon: '📊', tags: ['CI', 'Inteligencia', 'WISC'],
    color: 'from-blue-600 to-cyan-600', estimatedMinutes: 60, targetRole: 'admin',
    description: 'Escala de Inteligencia de Wechsler para Niños, 5ª edición',
    formKey: 'wiscv'
  },
  {
    id: 'basc3', title: 'BASC-3', subtitle: 'Sistema de evaluación conductual',
    category: 'conductual', icon: '📈', tags: ['Conductual', 'BASC', 'Emocional'],
    color: 'from-amber-500 to-orange-600', estimatedMinutes: 30, targetRole: 'admin',
    description: 'Sistema de Evaluación de la Conducta de Niños y Adolescentes, 3ª edición',
    formKey: 'basc3'
  },
]

// Merge NeuroForms from neurodivergentForms.ts + Clinical forms
const ALL_UNIFIED_FORMS = [
  ...CLINICAL_FORMS,
  ...ALL_FORMS.map((f: FormDefinition) => ({ ...f, formKey: null, isNeurodivergent: true })),
]

// ─── QUESTION RENDERER ───────────────────────────────────────────────────────
function QuestionRenderer({ question, value, onChange }: any) {
  const freq = ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Casi siempre', 'Siempre']

  if (question.type === 'frequency' || question.type === 'radio') {
    const opts = question.options || freq
    return (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{question.label}</p>
        {question.helpText && <p className="text-xs text-slate-400 mb-2">{question.helpText}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {opts.map((opt: string) => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${value === opt ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (question.type === 'multiselect') {
    const selected: string[] = Array.isArray(value) ? value : []
    return (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{question.label}</p>
        {question.helpText && <p className="text-xs text-slate-400 mb-2">{question.helpText}</p>}
        <div className="flex flex-wrap gap-2">
          {(question.options || []).map((opt: string) => (
            <button key={opt} type="button"
              onClick={() => {
                const s = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
                onChange(s)
              }}
              className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${selected.includes(opt) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (question.type === 'scale') {
    const scale = [1, 2, 3, 4, 5]
    const labels = question.scaleLabels || { min: 'Nunca/Leve', max: 'Siempre/Severo' }
    return (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{question.label}</p>
        <div className="flex gap-3">
          {scale.map(n => (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`w-12 h-12 rounded-xl border-2 font-black text-lg transition-all ${value === n ? 'bg-violet-600 text-white border-violet-600 shadow-lg scale-110' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300'}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">{labels.min}</span>
          <span className="text-xs text-slate-400">{labels.max}</span>
        </div>
      </div>
    )
  }
  if (question.type === 'boolean') {
    return (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{question.label}</p>
        <div className="flex gap-3">
          {['Sí', 'No'].map(opt => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${value === opt ? (opt === 'Sí' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-600 text-white border-slate-600') : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (question.type === 'textarea') {
    return (
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">{question.label}</label>
        {question.helpText && <p className="text-xs text-slate-400 mb-2">{question.helpText}</p>}
        <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all resize-none" />
      </div>
    )
  }
  if (question.type === 'select') {
    return (
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">{question.label}</label>
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all">
          <option value="">Seleccionar...</option>
          {(question.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    )
  }
  // Range (escala deslizante 1-5 o 1-3)
  if (question.type === 'range') {
    const min = question.min || 1
    const max = question.max || 5
    const val = Number(value) || min
    const labels = question.labels || []
    return (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{question.label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">{labels[0] || min}</span>
            <span className="text-2xl font-black text-violet-600">{val}</span>
            <span className="text-xs text-slate-400 font-bold">{labels[labels.length-1] || max}</span>
          </div>
          <input type="range" min={min} max={max} step={1} value={val}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-600" />
          {labels.length > 0 && val >= min && (
            <p className="text-xs text-center font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg">
              {labels[val - min] || ''}
            </p>
          )}
        </div>
      </div>
    )
  }
  // Date
  if (question.type === 'date') {
    return (
      <div>
        <label className="text-sm font-bold text-slate-700 block mb-2">{question.label}</label>
        <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all" />
      </div>
    )
  }
  // Default: text / number input
  return (
    <div>
      <label className="text-sm font-bold text-slate-700 block mb-2">{question.label}</label>
      {question.helpText && <p className="text-xs text-slate-400 mb-2">{question.helpText}</p>}
      <input type={question.type === 'number' ? 'number' : 'text'}
        min={question.min} max={question.max}
        value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={question.placeholder}
        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all" />
    </div>
  )
}

// ─── AI ANALYSIS DISPLAY ─────────────────────────────────────────────────────
function AIAnalysisPanel({ analysis }: { analysis: any }) {
  if (!analysis) return null
  const alertColors: Record<string, string> = {
    bajo: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    moderado: 'bg-amber-50 border-amber-200 text-amber-800',
    alto: 'bg-red-50 border-red-200 text-red-800',
  }
  const alertIcons: Record<string, string> = { bajo: '✅', moderado: '⚠️', alto: '🚨' }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <h3 className="font-black text-slate-800">Análisis de IA</h3>
      </div>

      {/* Alert level */}
      {analysis.nivel_alerta && (
        <div className={`px-4 py-3 rounded-xl border-2 font-bold text-sm flex items-center gap-2 ${alertColors[analysis.nivel_alerta] || alertColors.bajo}`}>
          <span className="text-lg">{alertIcons[analysis.nivel_alerta] || '✅'}</span>
          Nivel de alerta: <span className="uppercase">{analysis.nivel_alerta}</span>
        </div>
      )}

      {/* Clinical analysis */}
      {analysis.analisis_clinico && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">📋 Análisis Clínico</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{analysis.analisis_clinico}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Strengths */}
        {analysis.areas_fortaleza?.length > 0 && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">💪 Fortalezas</h4>
            <ul className="space-y-1">
              {analysis.areas_fortaleza.map((f: string, i: number) => (
                <li key={i} className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Work areas */}
        {analysis.areas_trabajo?.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">🎯 Áreas a Trabajar</h4>
            <ul className="space-y-1">
              {analysis.areas_trabajo.map((f: string, i: number) => (
                <li key={i} className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analysis.recomendaciones?.length > 0 && (
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
          <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-2">💡 Recomendaciones</h4>
          <ul className="space-y-1.5">
            {analysis.recomendaciones.map((r: string, i: number) => (
              <li key={i} className="text-xs text-violet-800 font-medium flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0 mt-1" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key indicators */}
      {analysis.indicadores_clave?.length > 0 && (
        <div>
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">🔍 Indicadores Clave</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.indicadores_clave.map((ind: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">{ind}</span>
            ))}
          </div>
        </div>
      )}

      {/* Next recommended forms */}
      {analysis.formularios_recomendados?.length > 0 && (
        <div>
          <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-2">📋 Próximas Evaluaciones Recomendadas</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.formularios_recomendados.map((f: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-full text-xs font-bold">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Message for parents */}
      {analysis.mensaje_padres && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} /><h4 className="font-black">Mensaje para los Padres</h4>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">{analysis.mensaje_padres}</p>
        </div>
      )}
    </div>
  )
}

// ─── SEND FORM MODAL ─────────────────────────────────────────────────────────
function SendFormModal({ form, parents, children, onSend, onClose }: any) {
  const [parentId, setParentId] = useState('')
  const [childId, setChildId] = useState('')
  const [message, setMessage] = useState('')
  const [deadline, setDeadline] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!parentId) { alert('Selecciona un padre/madre'); return }
    setSending(true)
    await onSend({ parentId, childId, message, deadline })
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Send size={20} className="text-violet-600" /> Enviar a Padres
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="bg-violet-50 rounded-xl p-4 mb-6 border border-violet-100">
          <p className="text-xs font-black text-violet-400 uppercase tracking-widest mb-1">Formulario</p>
          <p className="font-bold text-violet-800">{form.title}</p>
          <p className="text-xs text-violet-600 mt-0.5">{form.estimatedMinutes} min aprox.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Destinatario *</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all">
              <option value="">Seleccionar padre/madre...</option>
              {parents.map((p: any) => <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Paciente (Opcional)</label>
            <select value={childId} onChange={e => setChildId(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all">
              <option value="">Todos los pacientes...</option>
              {children.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Mensaje</label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Ej: Por favor complete este formulario antes de la próxima sesión..."
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha Límite</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-xl border-2 border-slate-100 transition-all">Cancelar</button>
            <button onClick={handleSend} disabled={sending || !parentId}
              className="flex-[2] py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FORM FILL VIEW ─────────────────────────────────────────────────────────
function FormFillView({ form, children, onBack, toast }: any) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [selectedChild, setSelectedChild] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isNeurodivergent] = useState(!!(form as any).isNeurodivergent)

  // Get sections based on form type
  const getSections = () => {
    if (isNeurodivergent) return form.sections
    const formDataMap: Record<string, any> = {
      anamnesis: ANAMNESIS_DATA, aba: ABA_DATA, entorno_hogar: ENTORNO_HOGAR_DATA,
      brief2: BRIEF2_DATA, ados2: ADOS2_DATA, vineland3: VINELAND3_DATA,
      wiscv: WISCV_DATA, basc3: BASC3_DATA
    }
    return formDataMap[form.formKey] || []
  }

  const sections = getSections()
  const totalSteps = sections.length
  const currentSection = sections[currentStep]
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const answeredCount = Object.keys(responses).length

  const handleResponse = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }))
  }

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true)
    try {
      const child = children.find((c: any) => c.id === selectedChild)

      if (isNeurodivergent) {
        // NeuroForma - usa API específica
        const res = await fetch('/api/analyze-neurodivergent-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: form.id,
            formData: responses,
            childName: child?.name || 'Paciente',
            childAge: child?.age || calcularEdadNumerica(child?.birth_date) || 'N/E',
            diagnosis: child?.diagnosis || '',
          }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setAiAnalysis(json.analysis)
      } else {
        // Formulario clínico profesional
        let endpoint = '/api/generate-session-report'
        let payload: any = { ...responses }

        if (form.formKey === 'entorno_hogar') {
          endpoint = '/api/generate-home-environment-report'
        } else if (['brief2', 'ados2', 'vineland3', 'wiscv', 'basc3'].includes(form.formKey)) {
          endpoint = '/api/analyze-professional-evaluation'
          payload = {
            evaluationType: form.formKey.toUpperCase(),
            childName: child?.name || 'Paciente',
            childAge: child?.age || calcularEdadNumerica(child?.birth_date) || 'N/E',
            responses,
          }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        setAiAnalysis(json.analysis || { analisis_clinico: json.text || 'Análisis generado' })
      }
      toast.success('✨ Análisis IA generado')
    } catch (err: any) {
      toast.error('Error en análisis: ' + err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!selectedChild) { toast.error('Selecciona un paciente'); return }
    if (answeredCount < 2) { toast.error('Responde al menos 2 preguntas'); return }
    setIsSaving(true)
    try {
      const table = isNeurodivergent ? 'form_responses' : (
        form.formKey === 'anamnesis' ? 'anamnesis_completa' :
        form.formKey === 'aba' ? 'registro_aba' :
        form.formKey === 'entorno_hogar' ? 'registro_entorno_hogar' : 'form_responses'
      )

      await supabase.from(table).insert([{
        child_id: selectedChild,
        form_type: form.formKey || form.id,
        form_title: form.title,
        responses: isNeurodivergent ? responses : undefined,
        datos: !isNeurodivergent ? responses : undefined,
        ai_analysis: aiAnalysis,
        created_at: new Date().toISOString(),
      }])
      toast.success('✅ Guardado correctamente')
      onBack()
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentSection) return null

  const questions = currentSection.questions || currentSection.items || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/30">
      {/* Header barra */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-violet-600 font-bold transition-all text-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Sección {currentStep + 1} de {totalSteps}
              </p>
              <p className="text-xs font-bold text-violet-600">{Math.round(progress)}% completado</p>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Form info card */}
        <div className={`bg-gradient-to-r ${form.color || 'from-violet-600 to-indigo-600'} rounded-2xl p-5 text-white shadow-lg`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{form.icon} {form.category?.toUpperCase()}</p>
              <h2 className="font-black text-xl">{form.title}</h2>
              <p className="text-white/80 text-sm mt-0.5">{form.subtitle}</p>
            </div>
            <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
              className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:bg-white/30 transition-all min-w-[180px]">
              <option value="" className="text-slate-800">Seleccionar paciente...</option>
              {children.map((c: any) => <option key={c.id} value={c.id} className="text-slate-800">{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-violet-50/30 px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-lg">{currentSection.title || currentSection.section}</h3>
            {(currentSection.description || currentSection.subtitle) && (
              <p className="text-sm text-slate-500 mt-1">{currentSection.description || currentSection.subtitle}</p>
            )}
          </div>
          <div className="p-6 space-y-6">
            {questions.map((q: any) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                value={responses[q.id]}
                onChange={(val: any) => handleResponse(q.id, val)}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:border-violet-300 disabled:opacity-40 transition-all">
            <ChevronLeft size={18} /> Anterior
          </button>

          <div className="flex items-center gap-3">
            {currentStep === totalSteps - 1 && (
              <>
                <button onClick={handleAnalyzeWithAI} disabled={isAnalyzing || answeredCount < 3}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-40 transition-all shadow-lg shadow-violet-200 hover:opacity-90">
                  {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                </button>
                <button onClick={handleSave} disabled={isSaving || !selectedChild}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-40 transition-all">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Guardar
                </button>
              </>
            )}
            {currentStep < totalSteps - 1 && (
              <button onClick={() => setCurrentStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-200 hover:opacity-90">
                Siguiente <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-6">
            <AIAnalysisPanel analysis={aiAnalysis} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FORM CARD ───────────────────────────────────────────────────────────────
function FormCard({ form, onStart, onSend, catInfo }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${form.color || 'from-violet-500 to-indigo-500'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-2xl shadow-sm border border-slate-100">
            {form.icon}
          </div>
          <div className="flex items-center gap-1.5">
            {form.targetRole === 'parent' || form.targetRole === 'both' ? (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-1">
                <Send size={8} /> Padres
              </span>
            ) : null}
            {form.formKey && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-1">
                <Stethoscope size={8} /> PRO
              </span>
            )}
          </div>
        </div>

        <h3 className="font-black text-slate-800 text-sm mb-0.5 leading-tight">{form.title}</h3>
        <p className="text-xs text-slate-500 font-medium mb-2">{form.subtitle}</p>
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{form.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {form.tags?.slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-bold border border-slate-200">{tag}</span>
          ))}
          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-bold border border-slate-200 flex items-center gap-1">
            <Clock size={8} /> {form.estimatedMinutes}m
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onStart(form)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all bg-gradient-to-r ${form.color || 'from-violet-600 to-indigo-600'} text-white shadow-sm hover:shadow-md hover:opacity-90 flex items-center justify-center gap-1.5`}>
            <FileText size={13} /> Completar
          </button>
          {(form.targetRole === 'parent' || form.targetRole === 'both') && (
            <button onClick={() => onSend(form)}
              className="px-3 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-all" title="Enviar a padres">
              <Send size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function EvaluacionesUnificadas() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'biblioteca' | 'enviados' | 'historial'>('biblioteca')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [sentForms, setSentForms] = useState<any[]>([])
  const [savedForms, setSavedForms] = useState<any[]>([])
  const [sendFormModal, setSendFormModal] = useState<any>(null)
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [childrenRes, parentsRes, sentRes, savedRes] = await Promise.all([
      supabase.from('children').select('id, name, age, birth_date, diagnosis').order('name'),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'padre'),
      supabase.from('parent_forms').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('form_responses').select('*, children(name)').order('created_at', { ascending: false }).limit(30),
    ])
    if (childrenRes.data) setChildren(childrenRes.data)
    if (parentsRes.data) setParents(parentsRes.data)
    if (sentRes.data) setSentForms(sentRes.data)
    if (savedRes.data) setSavedForms(savedRes.data)
    setLoading(false)
  }

  const handleSendForm = async (form: any, { parentId, childId, message, deadline }: any) => {
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: parentId,
          child_id: childId || null,
          form_type: form.id,
          form_title: form.title,
          form_description: form.description,
          message_to_parent: message,
          deadline,
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('📤 Formulario enviado')
      loadData()
    } catch (err: any) {
      toast.error('Error al enviar: ' + err.message)
    }
  }

  // Filter forms
  const filteredForms = ALL_UNIFIED_FORMS.filter(form => {
    if (activeCategory !== 'all' && form.category !== activeCategory) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return form.title.toLowerCase().includes(term) ||
        form.subtitle.toLowerCase().includes(term) ||
        form.description.toLowerCase().includes(term) ||
        form.tags?.some((t: string) => t.toLowerCase().includes(term))
    }
    return true
  })

  // If filling a form
  if (selectedForm) {
    return <FormFillView form={selectedForm} children={children} onBack={() => setSelectedForm(null)} toast={toast} />
  }

  const stats = {
    total: ALL_UNIFIED_FORMS.length,
    neuro: ALL_FORMS.length,
    clinical: CLINICAL_FORMS.length,
    sent: sentForms.length,
    pending: sentForms.filter(f => f.status === 'pending').length,
    completed: sentForms.filter(f => f.status === 'completed').length,
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── HEADER STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Formularios', value: stats.total, icon: '📋', color: 'from-violet-600 to-indigo-600', bg: 'bg-violet-50' },
          { label: 'Enviados', value: stats.sent, icon: '📤', color: 'from-blue-600 to-cyan-600', bg: 'bg-blue-50' },
          { label: 'Pendientes', value: stats.pending, icon: '⏳', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
          { label: 'Completados', value: stats.completed, icon: '✅', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{icon}</span>
              <span className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        {[
          { key: 'biblioteca', label: '📚 Biblioteca', count: stats.total },
          { key: 'enviados', label: '📤 Enviados', count: stats.sent },
          { key: 'historial', label: '🗂️ Historial', count: savedForms.length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === key ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === key ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── BIBLIOTECA TAB ── */}
      {activeTab === 'biblioteca' && (
        <div className="space-y-5">
          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" placeholder="Buscar formularios..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all shadow-sm" />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {UNIFIED_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${activeCategory === cat.id ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200' : `${cat.color} hover:opacity-80`}`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Forms grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredForms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                onStart={(f: any) => setSelectedForm(f)}
                onSend={(f: any) => setSendFormModal(f)}
              />
            ))}
          </div>

          {filteredForms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-5 bg-slate-100 rounded-3xl mb-4">
                <Search size={40} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-400">No se encontraron formularios</p>
              <p className="text-xs text-slate-300 mt-1">Prueba con otro término de búsqueda o categoría</p>
            </div>
          )}
        </div>
      )}

      {/* ── ENVIADOS TAB ── */}
      {activeTab === 'enviados' && (
        <div className="space-y-3">
          {sentForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100">
              <div className="p-5 bg-slate-100 rounded-3xl mb-4"><Send size={40} className="text-slate-300" /></div>
              <p className="font-bold text-slate-400">No has enviado formularios aún</p>
              <p className="text-xs text-slate-300 mt-1">Ve a Biblioteca y envía formularios a los padres</p>
            </div>
          ) : sentForms.map(sf => (
            <div key={sf.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-all"
                onClick={() => setExpandedResponse(expandedResponse === sf.id ? null : sf.id)}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${sf.status === 'completed' ? 'bg-emerald-500' : sf.status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-slate-800 text-sm truncate">{sf.form_title}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${sf.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {sf.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Para: {sf.profiles?.full_name || sf.profiles?.email}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{new Date(sf.created_at).toLocaleDateString('es-PE')}</p>
                </div>
                {expandedResponse === sf.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
              {expandedResponse === sf.id && sf.status === 'completed' && sf.responses && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Respuestas</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(sf.responses).map(([k, v]) => (
                      <div key={k} className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400">{k}</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{Array.isArray(v) ? (v as string[]).join(', ') : String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── HISTORIAL TAB ── */}
      {activeTab === 'historial' && (
        <div className="space-y-3">
          {savedForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100">
              <div className="p-5 bg-slate-100 rounded-3xl mb-4"><ClipboardList size={40} className="text-slate-300" /></div>
              <p className="font-bold text-slate-400">Sin formularios guardados</p>
            </div>
          ) : savedForms.map(sf => (
            <div key={sf.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{sf.form_title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Baby size={10} /> {(sf as any).children?.name || 'Paciente'} · {new Date(sf.created_at).toLocaleDateString('es-PE')}
                  </p>
                </div>
                {sf.ai_analysis && (
                  <span className="px-2.5 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold border border-violet-200 flex items-center gap-1">
                    <Sparkles size={10} /> Con análisis IA
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send modal */}
      {sendFormModal && (
        <SendFormModal
          form={sendFormModal}
          parents={parents}
          children={children}
          onSend={(data: any) => handleSendForm(sendFormModal, data)}
          onClose={() => setSendFormModal(null)}
        />
      )}
    </div>
  )
}
