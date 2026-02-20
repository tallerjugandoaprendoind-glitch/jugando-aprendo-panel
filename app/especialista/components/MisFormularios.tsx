'use client'

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

// ─── COLORES POR CATEGORÍA / TIPO ───────────────────────────────────────────
const CAT_COLORS: Record<string, { accent: string; badge: string; border: string }> = {
  tdah:        { accent: '#f59e0b', badge: '#f59e0b15', border: '#f59e0b30' },
  tea:         { accent: '#8b5cf6', badge: '#8b5cf615', border: '#8b5cf630' },
  conductual:  { accent: '#ef4444', badge: '#ef444415', border: '#ef444430' },
  sensorial:   { accent: '#06b6d4', badge: '#06b6d415', border: '#06b6d430' },
  habilidades: { accent: '#10b981', badge: '#10b98115', border: '#10b98130' },
  familia:     { accent: '#f472b6', badge: '#f472b615', border: '#f472b630' },
  seguimiento: { accent: '#64748b', badge: '#64748b15', border: '#64748b30' },
  clinico:     { accent: '#06b6d4', badge: '#06b6d415', border: '#06b6d430' },
  cognitivo:   { accent: '#6366f1', badge: '#6366f115', border: '#6366f130' },
}
const defaultC = { accent: '#06b6d4', badge: '#06b6d415', border: '#06b6d430' }

// ─── FORMULARIOS CLÍNICOS PROFESIONALES ─────────────────────────────────────
const CLINICAL_FORMS = [
  {
    id: 'anamnesis', formKey: 'anamnesis', title: 'Anamnesis Completa',
    subtitle: 'Historia clínica integral del paciente',
    category: 'clinico', icon: '📋', estimatedMinutes: 30,
    sections: ANAMNESIS_DATA, apiEndpoint: '/api/generate-session-report',
  },
  {
    id: 'aba', formKey: 'aba', title: 'Registro ABA',
    subtitle: 'Análisis Aplicado de la Conducta',
    category: 'conductual', icon: '🎯', estimatedMinutes: 20,
    sections: ABA_DATA, apiEndpoint: '/api/generate-session-report',
  },
  {
    id: 'entorno_hogar', formKey: 'entorno_hogar', title: 'Evaluación del Entorno del Hogar',
    subtitle: 'Visita domiciliaria y entorno familiar',
    category: 'familia', icon: '🏠', estimatedMinutes: 25,
    sections: ENTORNO_HOGAR_DATA, apiEndpoint: '/api/generate-home-environment-report',
  },
  {
    id: 'brief2', formKey: 'brief2', title: 'BRIEF-2',
    subtitle: 'Evaluación de Funciones Ejecutivas',
    category: 'cognitivo', icon: '🧠', estimatedMinutes: 25,
    sections: BRIEF2_DATA, apiEndpoint: '/api/analyze-professional-evaluation', evalType: 'BRIEF2',
  },
  {
    id: 'ados2', formKey: 'ados2', title: 'ADOS-2',
    subtitle: 'Diagnóstico del Espectro Autista',
    category: 'tea', icon: '🧩', estimatedMinutes: 30,
    sections: ADOS2_DATA, apiEndpoint: '/api/analyze-professional-evaluation', evalType: 'ADOS2',
  },
  {
    id: 'vineland3', formKey: 'vineland3', title: 'Vineland-3',
    subtitle: 'Conducta Adaptativa',
    category: 'habilidades', icon: '🤝', estimatedMinutes: 25,
    sections: VINELAND3_DATA, apiEndpoint: '/api/analyze-professional-evaluation', evalType: 'VINELAND3',
  },
  {
    id: 'wiscv', formKey: 'wiscv', title: 'WISC-V',
    subtitle: 'Escala de Inteligencia para Niños',
    category: 'cognitivo', icon: '📊', estimatedMinutes: 35,
    sections: WISCV_DATA, apiEndpoint: '/api/analyze-professional-evaluation', evalType: 'WISCV',
  },
  {
    id: 'basc3', formKey: 'basc3', title: 'BASC-3',
    subtitle: 'Sistema de Evaluación Conductual',
    category: 'conductual', icon: '📈', estimatedMinutes: 30,
    sections: BASC3_DATA, apiEndpoint: '/api/analyze-professional-evaluation', evalType: 'BASC3',
  },
]

// Agregar formularios neurodivergentes al catálogo
const ALL_SPECIALIST_FORMS = [
  ...CLINICAL_FORMS,
  ...ALL_FORMS.map(f => ({ ...f, formKey: f.id, apiEndpoint: '/api/analyze-neurodivergent-form', evalType: undefined, isSoft: true })),
]

// ─── QUESTION RENDERER ───────────────────────────────────────────────────────
function QuestionField({ q, value, onChange, colors }: any) {
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
  }

  if (q.type === 'select' || q.type === 'frequency') return (
    <div className="space-y-2">
      {(q.options || []).map((opt: string) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          style={{
            background: value === opt ? colors.badge : 'rgba(255,255,255,0.03)',
            border: `1px solid ${value === opt ? colors.accent + '60' : 'rgba(255,255,255,0.07)'}`,
            color: value === opt ? colors.accent : '#64748b',
          }}
          className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5">
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
              onClick={() => onChange(on ? sel.filter(x => x !== opt) : [...sel, opt])}
              style={{
                background: on ? colors.badge : 'rgba(255,255,255,0.03)',
                border: `1px solid ${on ? colors.accent + '60' : 'rgba(255,255,255,0.07)'}`,
                color: on ? colors.accent : '#64748b',
              }}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all">
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
            style={{
              background: value === n ? colors.accent : 'rgba(255,255,255,0.05)',
              color: value === n ? '#fff' : '#475569',
              border: `1px solid ${value === n ? colors.accent : 'rgba(255,255,255,0.08)'}`,
            }}
            className="w-10 h-10 rounded-xl font-bold text-sm transition-all">
            {n}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'boolean' || (q.type === 'radio' && q.options?.length === 2)) {
    const opts = q.options || ['Sí', 'No']
    return (
      <div className="flex gap-3">
        {opts.map((v: string) => (
          <button key={v} onClick={() => onChange(v)}
            style={{
              background: value === v ? colors.badge : 'rgba(255,255,255,0.03)',
              border: `1px solid ${value === v ? colors.accent + '60' : 'rgba(255,255,255,0.07)'}`,
              color: value === v ? colors.accent : '#64748b',
            }}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all">
            {v}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'radio') {
    return (
      <div className="space-y-2">
        {(q.options || []).map((opt: string) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            style={{
              background: value === opt ? colors.badge : 'rgba(255,255,255,0.03)',
              border: `1px solid ${value === opt ? colors.accent + '60' : 'rgba(255,255,255,0.07)'}`,
              color: value === opt ? colors.accent : '#64748b',
            }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all">
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'textarea') return (
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      rows={3} placeholder={q.placeholder || ''}
      style={inputStyle}
      className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all resize-none" />
  )

  return (
    <input type={q.type === 'number' ? 'number' : 'text'}
      value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={q.placeholder || ''}
      style={inputStyle}
      className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all" />
  )
}

// ─── FORM FILL VIEW ──────────────────────────────────────────────────────────
function FormFillView({ form, children, onBack, userId, toast }: any) {
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [childId, setChildId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [editedMsg, setEditedMsg] = useState('')
  const [done, setDone] = useState(false)

  const sections = form.sections || []
  const total = sections.length
  const section = sections[step]
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0
  const colors = CAT_COLORS[form.category] || defaultC

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
        // Neurodivergent forms
        res = await fetch('/api/analyze-neurodivergent-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: form.id, formData: responses,
            childName, childAge, diagnosis: child?.diagnosis || '',
          }),
        })
      } else if (form.evalType) {
        // Professional evaluations (BRIEF-2, ADOS-2, etc.)
        res = await fetch('/api/analyze-professional-evaluation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationType: form.evalType, childName, childAge, responses,
          }),
        })
      } else if (form.formKey === 'entorno_hogar') {
        res = await fetch('/api/generate-home-environment-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...responses, childName, childAge }),
        })
      } else {
        // ABA, Anamnesis
        res = await fetch('/api/generate-session-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...responses, childName, childAge, formType: form.formKey }),
        })
      }

      const json = await res!.json()
      const analysis = json.analysis || { analisis_clinico: json.text || 'Análisis generado' }
      setAiAnalysis(analysis)
      setEditedMsg(analysis?.mensaje_padres || '')
      toast.success('✨ Análisis IA generado')
    } catch (e: any) {
      toast.error('Error en análisis: ' + e.message)
    } finally { setAnalyzing(false) }
  }

  const handleSave = async () => {
    if (!childId) { toast.error('Selecciona un paciente'); return }
    setSaving(true)
    try {
      const table = form.isSoft ? 'form_responses' : (
        form.formKey === 'anamnesis' ? 'anamnesis_completa' :
        form.formKey === 'aba' ? 'registro_aba' :
        form.formKey === 'entorno_hogar' ? 'registro_entorno_hogar' : 'form_responses'
      )

      const insertPayload: any = {
        child_id: childId,
        form_type: form.formKey || form.id,
        form_title: form.title,
        created_at: new Date().toISOString(),
        ai_analysis: aiAnalysis,
      }
      if (form.isSoft) {
        insertPayload.responses = responses
      } else {
        insertPayload.datos = responses
        if (table === 'form_responses') insertPayload.responses = responses
      }

      await supabase.from(table).insert([insertPayload])

      // Guardar como specialist_submission para revisión del jefe
      await supabase.from('specialist_submissions').insert([{
        specialist_id: userId,
        child_id: childId,
        tipo: 'sesion',
        titulo: `[${form.title}]`,
        contenido: Object.entries(responses).slice(0, 6)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : v}`)
          .join('\n'),
        observaciones: aiAnalysis?.analisis_clinico || aiAnalysis?.resumen_ejecutivo || '',
        recomendaciones: Array.isArray(aiAnalysis?.recomendaciones)
          ? (aiAnalysis.recomendaciones as string[]).join('\n')
          : (aiAnalysis?.recomendaciones || ''),
        status: 'pending_approval',
      }])

      // Cola para el padre (si hay mensaje de IA)
      const msgToSend = editedMsg || aiAnalysis?.mensaje_padres
      if (msgToSend) {
        const { data: childData } = await supabase
          .from('children').select('parent_id').eq('id', childId).single()
        if ((childData as any)?.parent_id) {
          await fetch('/api/admin/parent-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: childId,
              parent_id: (childData as any).parent_id,
              source: form.isSoft ? 'neuroforma' : 'evaluacion',
              source_title: `Especialista: ${form.title}`,
              ai_message: msgToSend,
              ai_analysis: aiAnalysis,
              session_data: { form_type: form.formKey || form.id, responses, specialist_id: userId },
            }),
          }).catch(() => {})
        }
      }

      setDone(true)
      toast.success('✅ Enviado al jefe para aprobación')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally { setSaving(false) }
  }

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5 py-16 pb-28 lg:pb-6">
      <div style={{ background: '#10b98120', border: '1px solid #10b98140' }}
        className="w-20 h-20 rounded-full flex items-center justify-center">
        <CheckCircle2 size={40} style={{ color: '#10b981' }} />
      </div>
      <div>
        <h3 style={{ color: '#f1f5f9' }} className="text-2xl font-black mb-2">¡Enviado!</h3>
        <p style={{ color: '#64748b' }} className="text-sm max-w-xs mx-auto leading-relaxed">
          El formulario fue guardado. El jefe lo revisará antes de que llegue al padre/madre.
        </p>
      </div>
      <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b25' }}
        className="flex items-start gap-3 rounded-2xl p-4 max-w-xs text-left">
        <AlertTriangle size={14} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
        <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
          El mensaje a los padres está en <strong style={{ color: '#fbbf24' }}>Bandeja de Aprobación</strong>. No llegará hasta que el jefe lo autorice.
        </p>
      </div>
      <button onClick={onBack}
        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
        className="px-8 py-3 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all">
        ← Volver a formularios
      </button>
    </div>
  )

  return (
    <div className="space-y-5 pb-28 lg:pb-6">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
          className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div style={{ background: 'rgba(255,255,255,0.06)' }} className="h-2 rounded-full overflow-hidden">
            <div style={{ background: colors.accent, width: `${progress}%` }}
              className="h-full rounded-full transition-all duration-500" />
          </div>
          <div className="flex justify-between mt-1.5">
            <p style={{ color: '#334155' }} className="text-xs font-medium truncate max-w-[60%]">{form.title}</p>
            <p style={{ color: colors.accent }} className="text-xs font-bold">
              {step + 1} / {total}
            </p>
          </div>
        </div>
      </div>

      {/* Patient selector */}
      <div style={{ background: '#0d1a2d', border: `1px solid ${colors.border}` }}
        className="rounded-2xl p-4">
        <label style={{ color: '#475569' }} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-3">
          <Baby size={12} /> Paciente *
        </label>
        <select value={childId} onChange={e => setChildId(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all appearance-none">
          <option value="" style={{ background: '#0b1628', color: '#94a3b8' }}>Seleccionar paciente...</option>
          {children.map((c: any) => (
            <option key={c.id} value={c.id} style={{ background: '#0b1628', color: '#e2e8f0' }}>
              {c.name}{c.age ? ` · ${c.age} años` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Section */}
      {section && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }}
          className="rounded-2xl p-5 space-y-5">
          <div>
            <h4 style={{ color: '#f1f5f9' }} className="font-black text-base leading-tight">{section.title}</h4>
            {section.description && (
              <p style={{ color: '#475569' }} className="text-sm mt-1">{section.description}</p>
            )}
          </div>
          {(section.questions || []).map((q: any) => (
            <div key={q.id} className="space-y-2">
              <label style={{ color: '#94a3b8' }} className="block text-sm font-semibold leading-snug">
                {q.label}
                {q.required && <span style={{ color: colors.accent }}> *</span>}
              </label>
              {q.helpText && <p style={{ color: '#334155' }} className="text-xs">{q.helpText}</p>}
              <QuestionField q={q} value={responses[q.id]} onChange={(v: any) => answer(q.id, v)} colors={colors} />
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            className="flex-1 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
            ← Anterior
          </button>
        )}
        {step < total - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            style={{ background: colors.badge, color: colors.accent, border: `1px solid ${colors.border}` }}
            className="flex-1 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
            Siguiente →
          </button>
        ) : (
          <button onClick={handleAnalyze} disabled={analyzing || !childId}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 4px 20px #8b5cf620' }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {analyzing ? 'Analizando...' : '✨ Analizar con IA'}
          </button>
        )}
      </div>

      {/* AI Result */}
      {aiAnalysis && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(139,92,246,0.3)' }}
          className="rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div style={{ background: '#8b5cf620' }} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Brain size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <h4 style={{ color: '#f1f5f9' }} className="font-bold">Análisis IA</h4>
            {aiAnalysis.nivel_alerta && (
              <span style={{
                background: aiAnalysis.nivel_alerta === 'alto' ? '#ef444415' : aiAnalysis.nivel_alerta === 'moderado' ? '#f59e0b15' : '#10b98115',
                color: aiAnalysis.nivel_alerta === 'alto' ? '#ef4444' : aiAnalysis.nivel_alerta === 'moderado' ? '#fbbf24' : '#10b981',
                border: `1px solid ${aiAnalysis.nivel_alerta === 'alto' ? '#ef444430' : aiAnalysis.nivel_alerta === 'moderado' ? '#f59e0b30' : '#10b98130'}`,
              }} className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full capitalize">
                {aiAnalysis.nivel_alerta}
              </span>
            )}
          </div>

          {(aiAnalysis.resumen_ejecutivo || aiAnalysis.analisis_clinico) && (
            <p style={{ color: '#94a3b8', lineHeight: 1.8 }} className="text-sm">
              {aiAnalysis.resumen_ejecutivo || aiAnalysis.analisis_clinico}
            </p>
          )}

          {aiAnalysis.areas_fortaleza?.length > 0 && (
            <div>
              <p style={{ color: '#10b981' }} className="text-xs font-black uppercase tracking-widest mb-2">💪 Fortalezas</p>
              <div className="space-y-1">
                {aiAnalysis.areas_fortaleza.map((f: string, i: number) => (
                  <p key={i} style={{ color: '#64748b' }} className="text-xs">• {f}</p>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.recomendaciones?.length > 0 && (
            <div>
              <p style={{ color: '#8b5cf6' }} className="text-xs font-black uppercase tracking-widest mb-2">💡 Recomendaciones</p>
              <div className="space-y-1">
                {(Array.isArray(aiAnalysis.recomendaciones) ? aiAnalysis.recomendaciones : [aiAnalysis.recomendaciones]).slice(0, 4).map((r: string, i: number) => (
                  <p key={i} style={{ color: '#64748b' }} className="text-xs">• {r}</p>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje para padres - editable */}
          {(aiAnalysis.mensaje_padres || editedMsg) && (
            <div>
              <label style={{ color: '#475569' }} className="block text-xs font-black uppercase tracking-widest mb-2">
                📩 Mensaje para los padres
              </label>
              <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b25' }}
                className="rounded-xl p-3 mb-3 flex gap-2">
                <AlertTriangle size={13} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
                <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
                  Pasará por <strong style={{ color: '#fbbf24' }}>aprobación del jefe</strong> antes de enviarse.
                </p>
              </div>
              <textarea value={editedMsg} onChange={e => setEditedMsg(e.target.value)} rows={4}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all resize-none" />
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px #10b98125' }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? 'Guardando...' : '✅ Guardar y Enviar para Aprobación'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'Todos' },
  { id: 'clinico',   label: 'Clínico' },
  { id: 'tea',       label: 'TEA' },
  { id: 'tdah',      label: 'TDAH' },
  { id: 'conductual',label: 'Conductual' },
  { id: 'sensorial', label: 'Sensorial' },
  { id: 'habilidades',label: 'Habilidades' },
  { id: 'familia',   label: 'Familia' },
]

export default function MisFormularios({ userId }: { userId: string }) {
  const toast = useToast()
  const [children, setChildren] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedForm, setSelectedForm] = useState<any>(null)

  useEffect(() => {
    supabase.from('children')
      .select('id, name, age, birth_date, diagnosis')
      .eq('is_active', true).order('name')
      .then(({ data }) => setChildren(data || []))
  }, [])

  if (selectedForm) return (
    <FormFillView
      form={selectedForm}
      children={children}
      onBack={() => setSelectedForm(null)}
      userId={userId}
      toast={toast}
    />
  )

  const filtered = ALL_SPECIALIST_FORMS.filter(f => {
    const cat = (f as any).category || 'clinico'
    const matchTab = activeTab === 'all' || cat === activeTab
    const matchSearch = !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.subtitle || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="space-y-5 pb-28 lg:pb-6">
      {/* Header */}
      <div>
        <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">
          Formularios Clínicos
        </h2>
        <p style={{ color: '#475569' }} className="text-sm mt-1">
          Todos los instrumentos de evaluación — el jefe aprueba antes de enviar a los padres
        </p>
      </div>

      {/* Banner */}
      <div style={{ background: '#f59e0b08', border: '1px solid #f59e0b20' }}
        className="rounded-2xl p-4 flex gap-3 items-start">
        <AlertTriangle size={15} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
        <p style={{ color: '#64748b' }} className="text-xs leading-relaxed">
          <strong style={{ color: '#fbbf24' }}>Flujo de aprobación activo:</strong> Todo análisis generado pasa primero por revisión del jefe antes de llegar a los padres.
        </p>
      </div>

      {/* Search */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.07)' }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search size={15} style={{ color: '#334155' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar formulario..."
          style={{ background: 'transparent', color: '#e2e8f0', outline: 'none' }}
          className="flex-1 text-sm font-medium placeholder-slate-700" />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: '#475569' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const c = CAT_COLORS[tab.id] || defaultC
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? c.badge : '#0d1a2d',
                border: `1px solid ${isActive ? c.border : 'rgba(255,255,255,0.06)'}`,
                color: isActive ? c.accent : '#475569',
                flexShrink: 0,
              }}
              className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap">
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Forms grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }}
          className="rounded-2xl py-16 text-center">
          <FileText size={28} style={{ color: '#334155' }} className="mx-auto mb-3" />
          <p style={{ color: '#475569' }} className="text-sm font-semibold">Sin formularios encontrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((form: any) => {
            const c = CAT_COLORS[(form as any).category] || defaultC
            return (
              <button key={form.id}
                onClick={() => setSelectedForm(form)}
                style={{ background: '#0d1a2d', border: `1px solid ${c.border}` }}
                className="rounded-2xl p-5 text-left group hover:scale-[1.02] hover:brightness-110 transition-all duration-200 relative overflow-hidden">
                {/* Glow */}
                <div style={{ background: c.accent, filter: 'blur(50px)', opacity: 0.08 }}
                  className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full pointer-events-none" />
                <div className="flex items-start gap-3 relative">
                  <div style={{ background: c.badge, border: `1px solid ${c.border}` }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {form.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#f1f5f9' }} className="font-bold text-sm leading-tight">{form.title}</p>
                    <p style={{ color: '#475569' }} className="text-xs mt-0.5 line-clamp-2 leading-relaxed">
                      {form.subtitle || form.description || ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span style={{ background: c.badge, color: c.accent, border: `1px solid ${c.border}` }}
                        className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {(form as any).category || 'clínico'}
                      </span>
                      {form.estimatedMinutes && (
                        <span style={{ color: '#334155' }} className="flex items-center gap-1 text-[10px]">
                          <Clock size={9} /> ~{form.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: c.accent }} className="flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
