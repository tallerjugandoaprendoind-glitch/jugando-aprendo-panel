'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect } from 'react'
import {
  FileText, CheckCircle2, Clock, ChevronRight, ChevronLeft, X, Loader2,
  Send, AlertCircle, Star, Heart, BookOpen, Video, Link as LinkIcon,
  Download, Eye, Play, Image as ImageIcon, Music, Sparkles, Bell, Gift
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── DYNAMIC FORM RENDERER (simplified for parents) ─────────────────────────
function ParentFormRenderer({ form, onSubmit, onClose }: { form: any; onSubmit: (r: any) => void; onClose: () => void }) {
  const { t, locale } = useI18n()
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formDef, setFormDef] = useState<any>(null)
  const [formError, setFormError] = useState(false)

  // Mapeo de IDs de newFormConstants a sus secciones + metadata visual
  const NEW_FORMS_MAP: Record<string, { title: string; icon: string; color: string; description: string; sections: any[] }> = {}

  useEffect(() => {
    Promise.all([
      import('@/app/admin/data/neurodivergentForms'),
      import('@/app/admin/data/newFormConstants'),
      import('@/app/admin/data/formConstants'),
    ]).then(([neuroMod, newMod, formMod]) => {
      // 1. Buscar en neurodivergentForms
      const found = neuroMod.ALL_FORMS.find((f: any) => f.id === form.form_type)
      if (found) { setFormDef(found); return }

      // 2. Buscar en newFormConstants
      const newFormsMap: Record<string, any> = {
        objetivo_iep: {
          id: 'objetivo_iep', title: 'Objetivo IEP', icon: '🎯',
          color: 'from-blue-600 to-indigo-600', description: 'Plan de educación individualizado',
          sections: newMod.OBJETIVO_IEP_DATA,
        },
        nota_sesion: {
          id: 'nota_sesion', title: 'Nota de Sesión', icon: '📋',
          color: 'from-emerald-600 to-teal-600', description: 'Registro de sesión clínica',
          sections: newMod.NOTA_SESION_DATA,
        },
        informe_mensual: {
          id: 'informe_mensual', title: 'Informe Mensual de Progreso', icon: '📊',
          color: 'from-violet-600 to-purple-600', description: 'Evaluación mensual del progreso',
          sections: newMod.INFORME_MENSUAL_DATA,
        },
        registro_conductual: {
          id: 'registro_conductual', title: 'Registro Conductual ABC', icon: '📝',
          color: 'from-orange-600 to-red-600', description: 'Análisis funcional de conducta',
          sections: newMod.REGISTRO_CONDUCTUAL_ABC_DATA,
        },
      }
      const foundNew = newFormsMap[form.form_type]
      if (foundNew) { setFormDef(foundNew); return }

      // 3. Buscar en formConstants (anamnesis, aba, entorno_hogar, evaluaciones clínicas)
      const formConstantsMap: Record<string, any> = {
        anamnesis: {
          id: 'anamnesis', title: 'Historia Clínica', icon: '📋',
          color: 'from-blue-600 to-cyan-600', description: 'Anamnesis e historia del desarrollo',
          sections: formMod.ANAMNESIS_DATA,
        },
        aba: {
          id: 'aba', title: 'Sesión ABA', icon: '🧠',
          color: 'from-indigo-600 to-violet-600', description: 'Registro de sesión de terapia ABA',
          sections: formMod.ABA_DATA,
        },
        entorno_hogar: {
          id: 'entorno_hogar', title: 'Evaluación del Entorno del Hogar', icon: '🏠',
          color: 'from-green-600 to-emerald-600', description: 'Evaluación del ambiente familiar',
          sections: formMod.ENTORNO_HOGAR_DATA,
        },
        brief2: {
          id: 'brief2', title: 'Evaluación BRIEF-2', icon: '🔬',
          color: 'from-indigo-500 to-indigo-700', description: 'Funciones ejecutivas',
          sections: formMod.BRIEF2_DATA,
        },
        ados2: {
          id: 'ados2', title: 'Evaluación ADOS-2', icon: '🔍',
          color: 'from-teal-500 to-teal-700', description: 'Diagnóstico del autismo',
          sections: formMod.ADOS2_DATA,
        },
        vineland3: {
          id: 'vineland3', title: 'Evaluación Vineland-3', icon: '📈',
          color: 'from-emerald-500 to-emerald-700', description: 'Conducta adaptativa',
          sections: formMod.VINELAND3_DATA,
        },
        wiscv: {
          id: 'wiscv', title: 'Evaluación WISC-V', icon: '🧩',
          color: 'from-violet-500 to-violet-700', description: 'Escala de inteligencia',
          sections: formMod.WISCV_DATA,
        },
        basc3: {
          id: 'basc3', title: 'Evaluación BASC-3', icon: '📊',
          color: 'from-rose-500 to-rose-700', description: 'Sistema conductual',
          sections: formMod.BASC3_DATA,
        },
      }
      const foundConst = formConstantsMap[form.form_type]
      if (foundConst) { setFormDef(foundConst); return }

      // 4. No encontrado en ningún catálogo
      console.warn(`form_type "${form.form_type}" no encontrado en ningún catálogo`)
      setFormError(true)
    }).catch(() => setFormError(true))
  }, [form.form_type])

  const answer = (qId: string, val: any) => setResponses(p => ({ ...p, [qId]: val }))


  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(responses)
    setSubmitting(false)
  }

  if (formError) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="font-black text-slate-800 text-lg mb-2">{t('ui.form_not_available')}</h3>
        <p className="text-slate-500 text-sm mb-2">El tipo <strong className="text-red-500">"{form.form_type}"</strong> no se encontró en el sistema.</p>
        <p className="text-slate-400 text-xs mb-6">Pide al administrador que vuelva a asignar el formulario.</p>
        <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">{t('common.cerrar')}</button>
      </div>
    </div>
  )

  if (!formDef) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32}/>
        <p className="text-slate-500 text-sm">Cargando formulario...</p>
      </div>
    </div>
  )

  const section = formDef.sections[currentStep]
  const total = formDef.sections.length
  const progress = ((currentStep + 1) / total) * 100

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-xl md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${formDef.color} p-5 text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all">
            <X size={18}/>
          </button>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{formDef.icon}</span>
            <div>
              <h3 className="font-black text-lg leading-tight">{formDef.title}</h3>
              <p className="text-white/80 text-xs">{form.message_to_parent || formDef.description}</p>
            </div>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
          </div>
          <p className="text-white/70 text-xs mt-1.5">Paso {currentStep + 1} de {total}</p>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h4 className="font-black text-slate-800 text-lg mb-1">{section.title}</h4>
            {section.description && <p className="text-slate-500 text-sm mb-5">{section.description}</p>}
          </div>

          {section.questions.map((q: any) => (
            <div key={q.id}>
              <label className="text-sm font-bold text-slate-700 block mb-3">{q.label}</label>

              {(q.type === 'select' || q.type === 'frequency') && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: string) => (
                    <button key={opt} type="button" onClick={() => answer(q.id, opt)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 text-sm font-medium transition-all ${responses[q.id] === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'multiselect' && (
                <div className="flex flex-wrap gap-2">
                  {(q.options || []).map((opt: string) => {
                    const sel = Array.isArray(responses[q.id]) ? responses[q.id] : []
                    return (
                      <button key={opt} type="button"
                        onClick={() => answer(q.id, sel.includes(opt) ? sel.filter((x: string) => x !== opt) : [...sel, opt])}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${sel.includes(opt) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'textarea' && (
                <textarea rows={4} value={responses[q.id] || ''} onChange={e => answer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all resize-none"/>
              )}

              {(q.type === 'text' || q.type === 'number') && (
                <input type={q.type} value={responses[q.id] || ''} onChange={e => answer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all"/>
              )}

              {q.type === 'boolean' && (
                <div className="flex gap-3">
                  {['Sí ✅', 'No ❌'].map(opt => (
                    <button key={opt} type="button" onClick={() => answer(q.id, opt)}
                      className={`flex-1 py-4 rounded-xl border-2 font-bold text-sm transition-all ${responses[q.id] === opt ? (opt.includes('Sí') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-600 text-white border-slate-600') : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="p-5 border-t border-slate-100 flex gap-3 bg-white">
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(s => s - 1)} className="px-5 py-4 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <ChevronLeft size={16}/> Atrás
            </button>
          )}
          {currentStep < total - 1 ? (
            <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 hover:from-blue-700">
              Continuar <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
              {submitting ? 'Enviando...' : '✅ Enviar Respuestas'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── RESOURCE CARD ────────────────────────────────────────────────────────────
function ResourceCard({ resource }: { resource: any }) {
  const { t } = useI18n()

  const [showPreview, setShowPreview] = useState(false)

  const icons: Record<string, any> = {
    video: { icon: <Play size={20}/>, color: 'text-red-600', bg: 'bg-red-100', label: 'Video' },
    pdf: { icon: <FileText size={20}/>, color: 'text-blue-600', bg: 'bg-blue-100', label: 'PDF' },
    link: { icon: <LinkIcon size={20}/>, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Enlace' },
    image: { icon: <ImageIcon size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Imagen' },
    document: { icon: <BookOpen size={20}/>, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Documento' },
    audio: { icon: <Music size={20}/>, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Audio' },
  }

  const typeInfo = icons[resource.resource_type] || icons.link

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 group">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${typeInfo.bg} flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <span className={typeInfo.color}>{typeInfo.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.label}</span>
              {resource.is_global && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 uppercase tracking-wider">{t('ui.for_everyone')}</span>}
            </div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{resource.title}</h4>
            {resource.description && <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">{resource.description}</p>}
            <div className="flex gap-2 mt-3">
              {resource.url && (
                <button onClick={() => resource.resource_type === 'video' ? setShowPreview(true) : window.open(resource.url, '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all">
                  {resource.resource_type === 'video' ? <Play size={12}/> : <Eye size={12}/>}
                  {resource.resource_type === 'video' ? 'Ver video' : resource.resource_type === 'pdf' ? 'Abrir PDF' : 'Abrir'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && resource.resource_type === 'video' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold">{resource.title}</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30">
                <X size={20}/>
              </button>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              <iframe src={resource.url} className="w-full h-full" allowFullScreen title={resource.title}/>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── MAIN PARENT FORMS + RESOURCES VIEW ─────────────────────────────────────
function ParentFormsResourcesView({ profile, selectedChild, onFormsLoaded }: { profile: any; selectedChild: any; onFormsLoaded?: (count: number) => void }) {
  const { t, locale } = useI18n()

  const [activeTab, setActiveTab] = useState<'forms' | 'resources'>('forms')
  const [pendingForms, setPendingForms] = useState<any[]>([])
  const [completedForms, setCompletedForms] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeForm, setActiveForm] = useState<any>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = async () => {
    if (!profile?.id) return
    setIsLoading(true)
    try {
      // Load assigned forms
      const { data: forms } = await supabase
        .from('parent_forms')
        .select('*')
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (forms) {
        const pending = forms.filter(f => f.status !== 'completed')
        const completed = forms.filter(f => f.status === 'completed')
        setPendingForms(pending)
        setCompletedForms(completed)
        if (onFormsLoaded) onFormsLoaded(pending.length)
      }

      // Load resources
      const res = await fetch(`/api/admin/resources?parent_id=${profile.id}`)
      const json = await res.json()
      if (!json.error) setResources(json.data || [])
    } catch (err) {
      console.error('Error loading:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { 
    loadData()
    // Recargar cada 30 segundos para detectar nuevos formularios en tiempo real
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [profile?.id])

  const handleSubmitForm = async (formId: string, responses: any) => {
    try {
      // 1. Get the form details
      const form = pendingForms.find(f => f.id === formId)
      
      // 2. Mark as completed in parent_forms
      await fetch('/api/admin/forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          id: formId,
          status: 'completed',
          responses,
          completed_at: new Date().toISOString(),
        }),
      })

      // 3. Trigger AI analysis + generate report for admin approval
      if (form) {
        fetch('/api/analyze-parent-form-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
          body: JSON.stringify({
            formId,
            formType: form.form_type,
            formTitle: form.form_title,
            responses,
            childId: form.child_id,
            parentId: form.parent_id || profile?.id,
          }),
        }).catch(e => console.error('Error generating report:', e))
      }
      
      setActiveForm(null)
      setSuccessMsg('¡Formulario completado! El equipo terapéutico lo revisará pronto 💙')
      setTimeout(() => setSuccessMsg(''), 5000)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const pendingCount = pendingForms.length
  const resourcesCount = resources.length

  return (
    <div className="animate-fade-in space-y-6">
      {/* Success message */}
      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
          <p className="text-emerald-800 font-semibold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-2xl">
            <FileText className="text-indigo-600" size={24}/>
          </div>
          Mi Centro
        </h2>
        <p className="text-slate-500 text-sm">Formularios y materiales del equipo terapéutico</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 bg-slate-100/60 p-1.5 rounded-2xl">
        <button onClick={() => setActiveTab('forms')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'forms' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <FileText size={16}/> Formularios
          {pendingCount > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">{pendingCount}</span>}
        </button>
        <button onClick={() => setActiveTab('resources')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'resources' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <BookOpen size={16}/> Materiales
          {resourcesCount > 0 && <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-2 py-0.5 rounded-full ml-1">{resourcesCount}</span>}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-indigo-400" size={32}/>
        </div>
      ) : activeTab === 'forms' ? (
        <div className="space-y-5">
          {/* Pending forms */}
          {pendingForms.length > 0 && (
            <div>
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <Bell size={14} className="text-amber-500 animate-pulse"/>
                Pendientes de completar ({pendingForms.length})
              </h3>
              <div className="space-y-3">
                {pendingForms.map(form => (
                  <div key={form.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-black px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full uppercase tracking-wider animate-pulse">
                              ● Pendiente
                            </span>
                            {form.deadline && (
                              <span className="text-[9px] font-black px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full flex items-center gap-1">
                                <Clock size={9}/> {t('common.hasta')} {new Date(form.deadline).toLocaleDateString(toBCP47(locale))}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-slate-800 text-base">{form.form_title}</h4>
                          {form.message_to_parent && (
                            <div className="mt-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                              <p className="text-xs text-indigo-700 font-medium flex items-start gap-2">
                                <Sparkles size={12} className="flex-shrink-0 mt-0.5"/>
                                {form.message_to_parent}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setActiveForm(form)}
                        className="mt-4 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                        <FileText size={16}/> Completar Formulario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed forms */}
          {completedForms.length > 0 && (
            <div>
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500"/>
                Completados ({completedForms.length})
              </h3>
              <div className="space-y-2">
                {completedForms.map(form => (
                  <div key={form.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 p-4 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl flex-shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-700 text-sm">{form.form_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t('common.completadoEl')} {form.completed_at ? new Date(form.completed_at).toLocaleDateString(toBCP47(locale)) : 'N/A'}
                      </p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full uppercase">
                      ✓ Listo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingForms.length === 0 && completedForms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-indigo-50 rounded-3xl mb-4">
                <FileText size={40} className="text-indigo-300"/>
              </div>
              <h3 className="font-bold text-slate-600 text-lg mb-1">{t('ui.no_forms_yet')}</h3>
              <p className="text-slate-400 text-sm max-w-xs">El equipo terapéutico enviará formularios cuando sea necesario</p>
            </div>
          )}
        </div>
      ) : (
        /* RESOURCES TAB */
        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-violet-50 rounded-3xl mb-4">
                <BookOpen size={40} className="text-violet-300"/>
              </div>
              <h3 className="font-bold text-slate-600 text-lg mb-1">{t('ui.no_materials')}</h3>
              <p className="text-slate-400 text-sm max-w-xs">Aquí aparecerán videos, guías y recursos que comparta el equipo terapéutico</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {resources.length} material{resources.length !== 1 ? 'es' : ''} disponible{resources.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {resources.map(resource => <ResourceCard key={resource.id} resource={resource}/>)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Form modal */}
      {activeForm && (
        <ParentFormRenderer
          form={activeForm}
          onSubmit={(responses) => handleSubmitForm(activeForm.id, responses)}
          onClose={() => setActiveForm(null)}
        />
      )}
    </div>
  )
}

export default ParentFormsResourcesView
