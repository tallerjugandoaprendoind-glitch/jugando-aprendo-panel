'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect } from 'react'
import {
  Search, ChevronLeft, ChevronRight, X, Loader2,
  Send, Sparkles, CheckCircle2, FileText, Baby, Clock, AlertTriangle, Brain
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { ALL_FORMS } from '@/app/admin/data/neurodivergentForms'
import {
  ANAMNESIS_DATA, ABA_DATA, ENTORNO_HOGAR_DATA, BRIEF2_DATA,
  ADOS2_DATA, VINELAND3_DATA, WISCV_DATA, BASC3_DATA
} from '@/app/admin/data/formConstants'
import { calcularEdadNumerica } from '@/app/admin/utils/helpers'

// ─── COLORES POR CATEGORÍA (light theme) ────────────────────────────────────
const CAT_STYLES: Record<string, { pill: string; icon: string; activePill: string }> = {
  tdah:        { pill: 'bg-amber-50  text-amber-700  border-amber-200',  icon: 'bg-amber-100  text-amber-600',  activePill: 'bg-amber-600  text-white border-amber-600' },
  tea:         { pill: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'bg-purple-100 text-purple-600', activePill: 'bg-purple-600 text-white border-purple-600' },
  conductual:  { pill: 'bg-red-50    text-red-700    border-red-200',    icon: 'bg-red-100    text-red-600',    activePill: 'bg-red-600    text-white border-red-600' },
  sensorial:   { pill: 'bg-cyan-50   text-cyan-700   border-cyan-200',   icon: 'bg-cyan-100   text-cyan-600',   activePill: 'bg-cyan-600   text-white border-cyan-600' },
  habilidades: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', activePill: 'bg-emerald-600 text-white border-emerald-600' },
  familia:     { pill: 'bg-pink-50   text-pink-700   border-pink-200',   icon: 'bg-pink-100   text-pink-600',   activePill: 'bg-pink-600   text-white border-pink-600' },
  seguimiento: { pill: 'bg-slate-100 text-slate-600  border-slate-200',  icon: 'bg-slate-100  text-slate-500',  activePill: 'bg-slate-600  text-white border-slate-600' },
  clinico:     { pill: 'bg-blue-50   text-blue-700   border-blue-200',   icon: 'bg-blue-100   text-blue-600',   activePill: 'bg-blue-600   text-white border-blue-600' },
  cognitivo:   { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'bg-indigo-100 text-indigo-600', activePill: 'bg-indigo-600 text-white border-indigo-600' },
}
const defaultS = { pill: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'bg-blue-100 text-blue-600', activePill: 'bg-blue-600 text-white border-blue-600' }

// ─── FORMULARIOS CLÍNICOS PROFESIONALES ─────────────────────────────────────
const CLINICAL_FORMS: any[] = [
  { id: 'anamnesis',    formKey: 'anamnesis',    title: 'Historia Clínica',              subtitle: 'Historia clínica integral del paciente',         category: 'clinico',   icon: '📋', estimatedMinutes: 30, sections: ANAMNESIS_DATA },
  { id: 'aba',          formKey: 'aba',          title: 'Registro ABA',                    subtitle: 'Análisis Aplicado de la Conducta',               category: 'conductual',icon: '🎯', estimatedMinutes: 20, sections: ABA_DATA },
  { id: 'entorno_hogar',formKey: 'entorno_hogar',title: 'Evaluación del Entorno del Hogar',subtitle: 'Visita domiciliaria y entorno familiar',          category: 'familia',   icon: '🏠', estimatedMinutes: 25, sections: ENTORNO_HOGAR_DATA },
  { id: 'brief2',       formKey: 'brief2',       title: 'BRIEF-2',                         subtitle: 'Evaluación de Funciones Ejecutivas',             category: 'cognitivo', icon: '🧠', estimatedMinutes: 25, sections: BRIEF2_DATA, evalType: 'BRIEF2' },
  { id: 'ados2',        formKey: 'ados2',        title: 'ADOS-2',                          subtitle: 'Diagnóstico del Espectro Autista',               category: 'tea',       icon: '🧩', estimatedMinutes: 30, sections: ADOS2_DATA,  evalType: 'ADOS2' },
  { id: 'vineland3',    formKey: 'vineland3',    title: 'Vineland-3',                      subtitle: 'Conducta Adaptativa',                           category: 'habilidades',icon: '🤝', estimatedMinutes: 25, sections: VINELAND3_DATA, evalType: 'VINELAND3' },
  { id: 'wiscv',        formKey: 'wiscv',        title: 'WISC-V',                          subtitle: 'Escala de Inteligencia para Niños',             category: 'cognitivo', icon: '📊', estimatedMinutes: 35, sections: WISCV_DATA,  evalType: 'WISCV' },
  { id: 'basc3',        formKey: 'basc3',        title: 'BASC-3',                          subtitle: 'Sistema de Evaluación Conductual',              category: 'conductual',icon: '📈', estimatedMinutes: 30, sections: BASC3_DATA,  evalType: 'BASC3' },
]

const ALL_SPECIALIST_FORMS = [
  ...CLINICAL_FORMS,
  ...ALL_FORMS.map(f => ({ ...f, formKey: f.id, isSoft: true })),
]

// ─── QUESTION RENDERER ───────────────────────────────────────────────────────
function QuestionField({ q, value, onChange }: any) {
  const { t } = useI18n()
  const base = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"

  if (q.type === 'select' || q.type === 'frequency') return (
    <div className="space-y-2">
      {(q.options || []).map((opt: string) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
            ${value === opt ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>
          {opt}
        </button>
      ))}
    </div>
  )

  if (q.type === 'multiselect') {
    const sel: string[] = Array.isArray(value) ? value : []
    return (
      <div className="flex flex-wrap gap-2">
        {(q.options || []).map((opt: string) => {
          const on = sel.includes(opt)
          return (
            <button key={opt} type="button"
              onClick={() => onChange(on ? sel.filter((x: string) => x !== opt) : [...sel, opt])}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                ${on ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (q.type === 'scale') {
    const min = q.min || 1; const max = q.max || 5
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`w-11 h-11 rounded-xl font-bold text-sm border-2 transition-all
              ${value === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
            {n}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'boolean' || (q.type === 'radio' && (q.options || []).length <= 3)) {
    const opts = q.options || ['Sí', 'No']
    return (
      <div className="flex gap-3 flex-wrap">
        {opts.map((v: string) => (
          <button key={v} onClick={() => onChange(v)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all
              ${value === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
            {v}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'radio') return (
    <div className="space-y-2">
      {(q.options || []).map((opt: string) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
            ${value === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}>
          {opt}
        </button>
      ))}
    </div>
  )

  if (q.type === 'textarea') return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      rows={3} placeholder={q.placeholder || ''}
      className={`${base} resize-none`} />
  )

  if (q.aiGenerated) {
    const hasVal = value && String(value).trim().length > 0
    if (q.type === 'textarea') {
      return hasVal ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={4}
          className={`${base} bg-purple-50 border-purple-200 resize-none`} />
      ) : (
        <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400 flex-shrink-0" />
          <span>{t('evaluaciones.seCompletara')} <strong className="text-purple-600">{t('evaluaciones.analizarConIA2')}</strong></span>
        </div>
      )
    }
    return hasVal ? (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`${base} bg-purple-50 border-purple-200`} />
    ) : (
      <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 flex items-center gap-2">
        <Sparkles size={14} className="text-purple-400 flex-shrink-0" />
        <span>{t('evaluaciones.seCompletara2')} <strong className="text-purple-600">{t('evaluaciones.analizarConIA2')}</strong></span>
      </div>
    )
  }

  if (q.readonly) {
    const hasVal = value !== undefined && value !== null && String(value).trim().length > 0
    return hasVal ? (
      <div className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-800">
        {value}
      </div>
    ) : (
      <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Se calculará automáticamente con la IA
      </div>
    )
  }

  return (
    <input type={q.type === 'number' ? 'number' : 'text'}
      value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={q.placeholder || ''}
      className={base} />
  )
}

// ─── FORM FILL VIEW ──────────────────────────────────────────────────────────
function FormFillView({ form, children, onBack, userId, toast }: any) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [childId, setChildId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [editedMsg, setEditedMsg] = useState('')
  const [editedActividades, setEditedActividades] = useState('')
  const [done, setDone] = useState(false)

  const sections = form.sections || []
  const total = sections.length
  const section = sections[step]
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0
  const styles = CAT_STYLES[(form as any).category] || defaultS

  const answer = (id: string, val: any) => setResponses(p => ({ ...p, [id]: val }))

  const handleAnalyze = async () => {
    if (!childId) { toast.error('Selecciona un paciente'); return }
    setAnalyzing(true)
    try {
      const child = children.find((c: any) => c.id === childId)
      const childName = child?.name || 'Paciente'
      const childAge = child?.age || calcularEdadNumerica(child?.birth_date) || 'N/E'
      let res: Response

      if (form.isSoft) {
        res = await fetch('/api/analyze-neurodivergent-form', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
          body: JSON.stringify({ formType: form.id, formData: responses, childName, childAge, childId, diagnosis: child?.diagnosis || '' , locale: localStorage.getItem('vanty_locale') || 'es' }),
        })
      } else if (form.evalType) {
        res = await fetch('/api/analyze-professional-evaluation', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
          body: JSON.stringify({ evaluationType: form.evalType.toLowerCase(), childName, childAge, childId, responses , locale: localStorage.getItem('vanty_locale') || 'es' }),
        })
      } else if (form.formKey === 'entorno_hogar') {
        res = await fetch('/api/generate-home-environment-report', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
          body: JSON.stringify({ ...responses, childName, childAge, childId , locale: localStorage.getItem('vanty_locale') || 'es' }),
        })
      } else {
        res = await fetch('/api/generate-session-report', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
          body: JSON.stringify({ ...responses, childName, childAge, childId, formType: form.formKey , locale: localStorage.getItem('vanty_locale') || 'es' }),
        })
      }
      const json = await res!.json()
      if (!res!.ok || json.error) throw new Error(json.error || `Error ${res!.status}`)

      // analyze-professional-evaluation devuelve el objeto directo (sin wrapper .analysis)
      // analyze-neurodivergent-form devuelve { analysis: { ... } }
      const rawAnalysis = json.analysis && typeof json.analysis === 'object' ? json.analysis : json
      const analysis: any = { ...rawAnalysis }

      // Aplanar métricas Vineland al nivel raíz para rellenar campos readonly/aiGenerated
      if (rawAnalysis.metricas) {
        const m = rawAnalysis.metricas
        if (m.comunicacion !== undefined)    analysis.puntuacion_comunicacion     = m.comunicacion
        if (m.vida_diaria !== undefined)     analysis.puntuacion_vida_diaria      = m.vida_diaria
        if (m.socializacion !== undefined)   analysis.puntuacion_socializacion    = m.socializacion
        if (m.indice_global !== undefined)   analysis.indice_conducta_adaptativa  = m.indice_global
        if (m.ci_total !== undefined)        analysis.ci_total                    = m.ci_total
        if (m.clasificacion !== undefined)   analysis.clasificacion_ci            = m.clasificacion
        if (m.inhibicion !== undefined)      analysis.inhibicion                  = m.inhibicion
        if (m.total !== undefined)           analysis.total_brief                 = m.total
        if (m.severidad !== undefined)       analysis.nivel_severidad             = m.severidad
        if (m.afecto_social !== undefined)   analysis.puntuacion_total            = m.afecto_social
        if (m.indice_sintomas !== undefined) analysis.indice_sintomas_conductuales = m.indice_sintomas
      }

      // Mezclar con responses para que los campos aiGenerated/readonly muestren los valores
      setResponses(prev => ({ ...prev, ...analysis }))
      setAiAnalysis(analysis)
      setEditedMsg(
        analysis?.mensaje_padres ||
        analysis?.informe_padres_vineland ||
        analysis?.informe_padres_wisc ||
        analysis?.informe_padres_basc ||
        analysis?.informe_familia_ados ||
        analysis?.informe_padres || ''
      )
      setEditedActividades(analysis?.actividades_casa || analysis?.actividad_casa || '')
      toast.success('✨ Análisis IA generado')
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setAnalyzing(false) }
  }

  const handleSave = async () => {
    if (!childId) { toast.error('Selecciona un paciente'); return }
    setSaving(true)
    try {
      const table = form.isSoft ? 'form_responses' :
        (form.formKey === 'anamnesis' ? 'anamnesis_completa' :
        form.formKey === 'aba' ? 'registro_aba' :
        form.formKey === 'entorno_hogar' ? 'registro_entorno_hogar' : 'form_responses')

      const payload: any = { child_id: childId, form_type: form.formKey || form.id, form_title: form.title, created_at: new Date().toISOString(), ai_analysis: aiAnalysis }
      if (form.isSoft || table === 'form_responses') payload.responses = responses
      else { payload.datos = responses; payload.responses = responses }

      await supabase.from(table).insert([payload])

      await supabase.from('specialist_submissions').insert([{
        specialist_id: userId, child_id: childId, tipo: 'sesion',
        titulo: `[${form.title}]`,
        contenido: Object.entries(responses).slice(0, 6).map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : v}`).join('\n'),
        observaciones: aiAnalysis?.analisis_clinico || aiAnalysis?.resumen_ejecutivo || '',
        recomendaciones: Array.isArray(aiAnalysis?.recomendaciones) ? (aiAnalysis.recomendaciones as string[]).join('\n') : (aiAnalysis?.recomendaciones || ''),
        status: 'pending_approval',
      }])

      const msgToSend = editedMsg || aiAnalysis?.mensaje_padres
      const actividadToSend = editedActividades || aiAnalysis?.actividades_casa || aiAnalysis?.actividad_casa
      if (msgToSend) {
        const { data: childData } = await supabase.from('children').select('parent_id').eq('id', childId).single()
        if ((childData as any)?.parent_id) {
          await fetch('/api/admin/parent-messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
            body: JSON.stringify({ child_id: childId, parent_id: (childData as any).parent_id, source: form.isSoft ? 'neuroforma' : 'evaluacion', source_title: `Especialista: ${form.title}`, ai_message: msgToSend, actividades_casa: actividadToSend, ai_analysis: aiAnalysis, session_data: { form_type: form.formKey || form.id, responses, specialist_id: userId } , locale: localStorage.getItem('vanty_locale') || 'es' }),
          }).catch(() => {})
        }
      }
      setDone(true)
      toast.success('✅ Enviado al jefe para aprobación')
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5 py-16">
      <div className="w-20 h-20 bg-emerald-100 border-4 border-emerald-200 rounded-full flex items-center justify-center">
        <CheckCircle2 size={40} className="text-emerald-600" />
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">{t('evaluaciones.formularioEnviado')}</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          El análisis fue guardado. El jefe lo revisará antes de enviarlo al padre/madre.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-xs flex gap-3 text-left">
        <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          {t('ui.approval_notice')}
        </p>
      </div>
      <button onClick={onBack}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-sm transition-colors shadow-sm">
        ← Volver a formularios
      </button>
    </div>
  )

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors flex-shrink-0 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-slate-400 font-medium truncate max-w-[60%]">{form.title}</p>
            <p className="text-xs font-bold text-blue-600">{step + 1} / {total}</p>
          </div>
        </div>
      </div>

      {/* Patient selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <label className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
          <Baby size={12} /> Paciente *
        </label>
        <select value={childId} onChange={e => setChildId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">{t('ui.select_patient_option')}</option>
          {children.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}{c.age ? ` · ${c.age} años` : ''}</option>
          ))}
        </select>
      </div>

      {/* Section questions */}
      {section && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <h4 className="font-black text-slate-800 text-base leading-tight">{section.title}</h4>
            {section.description && <p className="text-sm text-slate-500 mt-1">{section.description}</p>}
          </div>
          {(section.questions || []).map((q: any) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 leading-snug">
                {q.label}{q.required && <span className="text-red-500"> *</span>}
              </label>
              {q.helpText && <p className="text-xs text-slate-400">{q.helpText}</p>}
              <QuestionField q={q} value={responses[q.id]} onChange={(v: any) => answer(q.id, v)} />
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            ← Anterior
          </button>
        )}
        {step < total - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 rounded-xl bg-blue-50 border border-blue-200 font-bold text-sm text-blue-700 hover:bg-blue-100 transition-colors">
            Siguiente →
          </button>
        ) : (
          <button onClick={handleAnalyze} disabled={analyzing || !childId}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold text-sm disabled:opacity-50 shadow-md transition-all">
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {analyzing ? 'Analizando con IA...' : '✨ Analizar con IA'}
          </button>
        )}
      </div>

      {/* AI Result */}
      {aiAnalysis && (() => {
        // Helper: convierte string con guiones/saltos o array → array limpio
        const toArr = (val: any): string[] => {
          if (!val) return []
          if (Array.isArray(val)) return val.filter(Boolean)
          if (typeof val === 'string') return val.split(/\n|;/).map((s: string) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
          return []
        }
        const areasFortaleza  = toArr(aiAnalysis.areas_fortaleza)
        const recomendaciones = toArr(aiAnalysis.recomendaciones || aiAnalysis.recomendaciones_ia || aiAnalysis.plan_intervencion_conductual)
        const textoAnalisis   = aiAnalysis.resumen_ejecutivo || aiAnalysis.analisis_clinico || aiAnalysis.analisis_ia || aiAnalysis.analisis_vineland_ia || aiAnalysis.analisis_diagnostico_ia || aiAnalysis.analisis_basc_ia || aiAnalysis.perfil_cognitivo_ia || ''

        return (
        <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain size={16} className="text-purple-600" />
            </div>
            <h4 className="font-bold text-slate-800">Análisis IA</h4>
            {aiAnalysis.nivel_alerta && (
              <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border capitalize
                ${aiAnalysis.nivel_alerta === 'alto' ? 'bg-red-50 text-red-700 border-red-200' :
                  aiAnalysis.nivel_alerta === 'moderado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {aiAnalysis.nivel_alerta}
              </span>
            )}
          </div>

          {textoAnalisis ? (
            <p className="text-sm text-slate-600 leading-relaxed">{textoAnalisis}</p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {areasFortaleza.length > 0 && (
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">💪 Fortalezas</p>
                <ul className="space-y-1">
                  {areasFortaleza.map((f: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">• {f}</li>
                  ))}
                </ul>
              </div>
            )}
            {recomendaciones.length > 0 && (
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">💡 Recomendaciones</p>
                <ul className="space-y-1">
                  {recomendaciones.slice(0, 4).map((r: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(aiAnalysis.mensaje_padres || editedMsg) && (
            <div className="space-y-4">
              {/* Sección 1: Mensaje al padre */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  💬 Mensaje al padre/madre (editable)
                </label>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex gap-2">
                  <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {t('ui.pending_approval')}
                  </p>
                </div>
                <textarea value={editedMsg} onChange={e => setEditedMsg(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Sección 2: Actividad para casa */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  🏠 Actividad para realizar en casa (editable)
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 flex gap-2">
                  <span className="text-blue-600 flex-shrink-0 text-xs font-bold">1</span>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Una sola actividad basada en lo trabajado hoy en sesión.
                  </p>
                </div>
                <textarea
                  value={editedActividades || aiAnalysis?.actividades_casa || aiAnalysis?.actividad_casa || ''}
                  onChange={e => setEditedActividades(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {/* ── Producto sugerido por la IA ── */}
          {aiAnalysis.producto_sugerido_info && (
            <div className="rounded-2xl overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Producto sugerido por IA para este caso</span>
              </div>
              <div className="flex gap-4 p-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center">
                  {aiAnalysis.producto_sugerido_info.imagen_url
                    ? <img src={aiAnalysis.producto_sugerido_info.imagen_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl">{aiAnalysis.producto_sugerido_info.tipo === 'digital' ? '📄' : '📦'}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-900 text-sm mb-1">{aiAnalysis.producto_sugerido_info.nombre}</p>
                  {aiAnalysis.producto_sugerido_info.razon && (
                    <p className="text-xs text-amber-800 leading-relaxed mb-2">💡 {aiAnalysis.producto_sugerido_info.razon}</p>
                  )}
                  <p className="text-lg font-black text-amber-700">S/ {Number(aiAnalysis.producto_sugerido_info.precio_soles).toFixed(2)}</p>
                </div>
              </div>
              <div className="px-4 pb-3">
                <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
                  💬 <strong>{t('common.atencion')}:</strong> {t('ui.specialist_note')}
                </p>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50 shadow-md transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? 'Guardando...' : '✅ Guardar y Enviar para Aprobación'}
          </button>
        </div>
        )
      })()}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',        label: 'All' },
  { id: 'clinico',    label: '🏥 Clínico Pro' },
  { id: 'tea',        label: '🧩 TEA' },
  { id: 'tdah',       label: '⚡ TDAH' },
  { id: 'conductual', label: '🎯 Conductual' },
  { id: 'cognitivo',  label: '🧠 Cognitivo' },
  { id: 'sensorial',  label: '🌀 Sensorial' },
  { id: 'habilidades',label: '🤝 Habilidades' },
  { id: 'familia',    label: '🏠 Familia' },
]

export default function MisFormularios({ userId }: { userId: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const [children, setChildren] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedForm, setSelectedForm] = useState<any>(null)

  useEffect(() => {
    supabase.from('children').select('id, name, age, birth_date, diagnosis')
      .eq('is_active', true).order('name')
      .then(({ data }) => setChildren(data || []))
  }, [])

  if (selectedForm) return (
    <FormFillView form={selectedForm} children={children} onBack={() => setSelectedForm(null)} userId={userId} toast={toast} />
  )

  const filtered = ALL_SPECIALIST_FORMS.filter((f: any) => {
    const cat = f.category || 'clinico'
    const matchTab = activeTab === 'all' || cat === activeTab
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || (f.subtitle || f.description || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">Formularios Clínicos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Todos los instrumentos de evaluación — el jefe aprueba antes de enviar a los padres
        </p>
      </div>

      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          {t('ui.approval_flow_notice')}
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 flex items-center gap-3 px-4 py-3 shadow-sm">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          {...{placeholder: t('ui.search_form')}}
          className="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-400" />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-all
                ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Forms grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={22} className="text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm font-semibold">{t('ui.no_forms')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((form: any) => {
            const s = CAT_STYLES[form.category] || defaultS
            return (
              <button key={form.id}
                onClick={() => setSelectedForm(form)}
                className="bg-white rounded-2xl border border-slate-200 p-5 text-left group hover:shadow-md hover:border-blue-300 transition-all duration-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${s.icon}`}>
                    {form.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 leading-tight">{form.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {form.subtitle || form.description || ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.pill} uppercase tracking-wide`}>
                        {form.category || 'clínico'}
                      </span>
                      {form.estimatedMinutes && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={9} /> ~{form.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
