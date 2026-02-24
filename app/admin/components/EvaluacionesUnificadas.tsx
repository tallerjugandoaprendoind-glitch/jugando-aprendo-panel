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
  CalendarDays, Lock, Unlock, Download
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
function AIAnalysisPanel({ analysis, editableMessage, onEditMessage }: { analysis: any; editableMessage?: string; onEditMessage?: (v: string) => void }) {
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

      {/* Message for parents - editable before saving */}
      {(analysis.mensaje_padres || editableMessage !== undefined) && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <MessageCircle size={14} className="text-white"/>
            </div>
            <h4 className="font-black text-amber-800">Mensaje para los Padres</h4>
            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-300 uppercase tracking-widest">✏️ Editable</span>
          </div>
          {onEditMessage ? (
            <textarea
              rows={4}
              value={editableMessage !== undefined ? editableMessage : (analysis.mensaje_padres || '')}
              onChange={e => onEditMessage(e.target.value)}
              className="w-full p-3 bg-white/80 border-2 border-amber-200 rounded-xl text-amber-800 text-sm leading-relaxed resize-none outline-none focus:border-amber-400 transition-all font-medium mb-2"
              placeholder="Edita el mensaje antes de guardar..."
            />
          ) : (
            <p className="text-amber-700 text-sm leading-relaxed mb-3 italic">&quot;{editableMessage || analysis.mensaje_padres}&quot;</p>
          )}
          <p className="text-amber-600 text-xs font-semibold bg-amber-100 rounded-xl px-3 py-2 border border-amber-200">
            🔒 Edita el mensaje y guarda. Irá a <strong>Bandeja de Aprobación</strong> para revisarlo antes de enviarlo al padre/madre.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── SEND FORM MODAL ─────────────────────────────────────────────────────────
// ==============================================================================
// COMPONENTE: TARJETA DE FORMULARIO EN HISTORIAL CON BOTÓN "GENERAR REPORTE"
// ==============================================================================
function HistorialFormCard({ sf, onReportGenerated }: { sf: any; onReportGenerated: () => void }) {
  const [generating, setGenerating] = useState(false)
  const toast = useToast()

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      // Fetch the full responses from the DB (the list query only has metadata)
      const sourceTable = sf._source || 'form_responses'
      const isClinicalTable = ['anamnesis_completa', 'registro_aba', 'registro_entorno_hogar'].includes(sourceTable)
      const selectFields = isClinicalTable
        ? 'datos, ai_analysis, form_type, form_title'
        : 'responses, ai_analysis, form_type, form_title'
      const { data: fullRecord, error } = await supabase
        .from(sourceTable)
        .select(selectFields)
        .eq('id', sf.id)
        .single()

      if (error) throw error

      const childName = (sf as any).children?.name || 'Paciente'
      const reportData = {
        responses: fullRecord?.responses || fullRecord?.datos || {},
        ai_analysis: fullRecord?.ai_analysis,
      }
      const reportType = fullRecord?.form_type || sf.form_type || 'formulario'
      const formTitle  = fullRecord?.form_title  || sf.form_title  || 'Formulario'

      // Call generate-report from browser (no serverless timeout issue)
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          childName,
          reportData,
          evaluationId: sf.id,
          formTitle,
        }),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      if (!json.success || !json.fileData) throw new Error(json.error || 'Sin datos')

      // Save to reportes_generados
      const { error: insertError } = await supabase.from('reportes_generados').insert([{
        child_id:         sf.child_id,
        tipo_reporte:     reportType,
        titulo:           `${formTitle} - ${childName}`,
        nombre_archivo:   json.fileName,
        file_data:        json.fileData,
        mime_type:        json.mimeType,
        tamano_bytes:     Math.round((json.fileData.length * 3) / 4),
        fecha_generacion: new Date().toISOString(),
        generado_por:     'IA + Psicólogo',
        source_id:        sf.id,
      }])
      if (insertError) {
        console.error('❌ Error guardando reporte en BD:', insertError)
        toast.error('Reporte descargado pero no se pudo guardar en historial: ' + insertError.message)
      }

      // Auto-download
      const byteChars = atob(json.fileData)
      const bytes = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
      const blob = new Blob([bytes], { type: json.mimeType })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = json.fileName
      document.body.appendChild(a); a.click()
      URL.revokeObjectURL(url); document.body.removeChild(a)

      toast.success('✅ Reporte Word generado y descargado')
      onReportGenerated()
    } catch (err: any) {
      console.error('Error generando reporte:', err)
      toast.error('Error al generar reporte: ' + (err.message || 'Intenta de nuevo'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-bold text-slate-800 text-sm truncate">
              {sf.form_title || sf.form_type || 'Formulario'}
            </p>
            {sf._source && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider whitespace-nowrap">
                {sf._source === 'anamnesis_completa' ? 'Anamnesis' :
                 sf._source === 'registro_aba' ? 'ABA' :
                 sf._source === 'registro_entorno_hogar' ? 'Hogar' : 'NeuroForma'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Baby size={10} /> {(sf as any).children?.name || 'Paciente'} · {new Date(sf.created_at).toLocaleDateString('es-PE')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {sf.ai_analysis && (
            <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded-full text-[10px] font-bold border border-violet-200 flex items-center gap-1">
              <Sparkles size={9} /> Con IA
            </span>
          )}
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            {generating ? (
              <><Loader2 size={12} className="animate-spin" /> Generando...</>
            ) : (
              <><Download size={12} /> Generar Reporte</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function SendFormModal({ form, children, onSend, onClose }: any) {
  const [childId, setChildId] = useState('')
  const [message, setMessage] = useState('')
  const [deadline, setDeadline] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!childId) { alert('Selecciona un paciente'); return }
    setSending(true)
    await onSend({ childId, message, deadline })
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
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Paciente *</label>
            <select value={childId} onChange={e => setChildId(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all">
              <option value="">Seleccionar paciente...</option>
              {children.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.age ? ` (${c.age})` : ''}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">El formulario se enviará al padre/madre vinculado al paciente.</p>
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
            <button onClick={handleSend} disabled={sending || !childId}
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
  const [editedMessage, setEditedMessage] = useState('')
  const [isNeurodivergent] = useState(!!(form as any).isNeurodivergent)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null)
  const [savedChildId, setSavedChildId] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

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
        setEditedMessage(json.analysis?.mensaje_padres || '')
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
        const analysis = json.analysis || { analisis_clinico: json.text || 'Análisis generado' }
        setAiAnalysis(analysis)
        setEditedMessage(analysis?.mensaje_padres || '')
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

      // Build insert payload — form_title may not exist in all clinical tables yet
      // The migration below adds it; until then we store it only in form_responses
      const now = new Date().toISOString()
      const insertPayload: any = { child_id: selectedChild }

      if (isNeurodivergent) {
        // form_responses: tiene form_type, form_title, responses, ai_analysis, created_at
        insertPayload.form_type  = form.formKey || form.id
        insertPayload.form_title = form.title
        insertPayload.responses  = responses
        insertPayload.ai_analysis = aiAnalysis
        insertPayload.created_at  = now
      } else if (table === 'anamnesis_completa') {
        // anamnesis_completa: child_id, datos, fecha_creacion, form_title, creado_por
        insertPayload.datos          = responses
        insertPayload.fecha_creacion = now
        insertPayload.form_title     = form.title
      } else if (table === 'registro_aba') {
        // registro_aba: child_id, fecha_sesion, datos, form_title
        insertPayload.datos        = responses
        insertPayload.fecha_sesion = responses['fecha_sesion'] || now.split('T')[0]
        insertPayload.form_title   = form.title
      } else if (table === 'registro_entorno_hogar') {
        // registro_entorno_hogar: child_id, fecha_visita, datos, created_at, form_title
        insertPayload.datos        = responses
        insertPayload.fecha_visita = responses['fecha_visita'] || now
        insertPayload.created_at   = now
        insertPayload.form_title   = form.title
      } else {
        // form_responses fallback
        insertPayload.form_type   = form.formKey || form.id
        insertPayload.form_title  = form.title
        insertPayload.responses   = responses
        insertPayload.ai_analysis = aiAnalysis
        insertPayload.created_at  = now
      }

      const { data: savedRecord } = await supabase.from(table).insert([insertPayload]).select().single()

      // Guardado exitoso - mostrar pantalla de éxito con botón de reporte
      setSavedRecordId((savedRecord as any)?.id || null)
      setSavedChildId(selectedChild)
      setShowSuccessScreen(true)
      toast.success('✅ Formulario guardado correctamente')

      // Queue AI-generated parent message for admin approval (if it exists)
      if (aiAnalysis?.mensaje_padres) {
        const { data: child } = await supabase.from('children').select('parent_id').eq('id', selectedChild).single()
        if ((child as any)?.parent_id) {
          await fetch('/api/admin/parent-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: selectedChild,
              parent_id: (child as any).parent_id,
              source: isNeurodivergent ? 'neuroforma' : 'evaluacion',
              source_title: form.title,
              ai_message: editedMessage || aiAnalysis.mensaje_padres,
              ai_analysis: aiAnalysis,
              session_data: { form_type: form.formKey || form.id, responses },
            }),
          }).catch(e => console.error('Error queueing message:', e))
        }
      }
      // No llamamos onBack() aquí - la pantalla de éxito permite al usuario descargar el reporte
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── PANTALLA DE ÉXITO CON BOTÓN DE REPORTE ──────────────────────────────
  if (showSuccessScreen) {
    const handleGenerateAndDownload = async () => {
      setIsGeneratingReport(true)
      try {
        const child = children.find((c: any) => c.id === savedChildId) as any
        const childName = child?.name || 'Paciente'
        const childAge  = child?.age  || calcularEdadNumerica(child?.birth_date)
        const reportType = isNeurodivergent ? (form.id || 'neuroforma') : (form.formKey || form.id)

        const res = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType,
            childName,
            childAge,
            reportData: { responses, ai_analysis: aiAnalysis },
            evaluationId: savedRecordId || '',
            formTitle: form.title,
          }),
        })
        const json = await res.json()
        if (!json.success || !json.fileData) throw new Error(json.error || 'Sin datos')

        // Guardar en reportes_generados
        await supabase.from('reportes_generados').insert([{
          child_id:         savedChildId,
          tipo_reporte:     reportType,
          titulo:           `${form.title} - ${childName}`,
          nombre_archivo:   json.fileName,
          file_data:        json.fileData,
          mime_type:        json.mimeType,
          tamano_bytes:     Math.round((json.fileData.length * 3) / 4),
          fecha_generacion: new Date().toISOString(),
          generado_por:     'IA + Psicólogo',
          source_id:        savedRecordId,
        }])

        // Descargar automáticamente
        const byteChars = atob(json.fileData)
        const bytes = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
        const blob = new Blob([bytes], { type: json.mimeType })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.download = json.fileName
        document.body.appendChild(a); a.click()
        URL.revokeObjectURL(url); document.body.removeChild(a)

        toast.success('✅ Reporte Word descargado')
      } catch (err: any) {
        toast.error('Error generando reporte: ' + (err.message || 'Intenta de nuevo'))
      } finally {
        setIsGeneratingReport(false)
      }
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">¡Formulario guardado!</h2>
          <p className="text-slate-500 font-medium">{form.title}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            onClick={handleGenerateAndDownload}
            disabled={isGeneratingReport}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            {isGeneratingReport ? (
              <><Loader2 size={18} className="animate-spin" /> Generando reporte...</>
            ) : (
              <><Download size={18} /> Generar y Descargar Reporte Word</>
            )}
          </button>
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm transition-all"
          >
            <ChevronLeft size={18} /> Volver
          </button>
        </div>
        {aiAnalysis && (
          <p className="text-xs text-violet-600 font-bold flex items-center gap-1">
            <Sparkles size={12} /> Análisis IA disponible — se incluirá en el reporte
          </p>
        )}
      </div>
    )
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
            <AIAnalysisPanel analysis={aiAnalysis} editableMessage={editedMessage} onEditMessage={setEditedMessage} />
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
    const [childrenRes, parentsRes, sentRes, formResponsesRes, anamnesisRes, abaRes, entornoRes] = await Promise.all([
      supabase.from('children').select('id, name, age, birth_date, diagnosis').order('name'),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'padre'),
      supabase.from('parent_forms').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('form_responses').select('id, form_type, form_title, ai_analysis, created_at, child_id, children(name)').order('created_at', { ascending: false }).limit(30),
      supabase.from('anamnesis_completa').select('id, form_title, created_at, child_id, children(name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('registro_aba').select('id, form_title, datos, child_id, fecha_sesion, children(name)').order('fecha_sesion', { ascending: false }).limit(10),
      supabase.from('registro_entorno_hogar').select('id, form_title, datos, child_id, fecha_visita, created_at, children(name)').order('fecha_visita', { ascending: false }).limit(10),
    ])
    if (childrenRes.data) setChildren(childrenRes.data)
    if (parentsRes.data) setParents(parentsRes.data)
    if (sentRes.data) setSentForms(sentRes.data)

    // Merge all saved form sources into one unified historial
    const allSaved = [
      ...(formResponsesRes.data || []),
      ...(anamnesisRes.data || []).map((r: any) => ({ ...r, _source: 'anamnesis_completa', form_title: r.form_title || 'Historia Clínica (Anamnesis)' })),
      ...(abaRes.data || []).map((r: any) => ({ ...r, _source: 'registro_aba', form_title: r.form_title || 'Sesión ABA' })),
      ...(entornoRes.data || []).map((r: any) => ({ ...r, _source: 'registro_entorno_hogar', form_title: r.form_title || 'Entorno del Hogar' })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setSavedForms(allSaved)
    setLoading(false)
  }

  const handleSendForm = async (form: any, { childId, message, deadline }: any) => {
    try {
      // Derive parent_id from child record
      const { data: child } = await supabase.from('children').select('parent_id').eq('id', childId).single()
      const parentId = (child as any)?.parent_id || null

      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: parentId,
          child_id: childId,
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
            <HistorialFormCard
              key={`${sf._source || 'form_responses'}-${sf.id}`}
              sf={sf}
              onReportGenerated={loadData}
            />
          ))}
        </div>
      )}

      {/* Send modal */}
      {sendFormModal && (
        <SendFormModal
          form={sendFormModal}
          children={children}
          onSend={(data: any) => handleSendForm(sendFormModal, data)}
          onClose={() => setSendFormModal(null)}
        />
      )}
    </div>
  )
}
