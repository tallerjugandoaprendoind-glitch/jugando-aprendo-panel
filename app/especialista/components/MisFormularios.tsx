'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardList, Search, ChevronLeft, ChevronRight, X, Loader2,
  Send, Sparkles, CheckCircle2, FileText, Brain, Zap, Target,
  Activity, Home, Star, Baby, Clock, AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { ALL_FORMS } from '@/app/admin/data/neurodivergentForms'
import { calcularEdadNumerica } from '@/app/admin/utils/helpers'

// ─── COLORES POR CATEGORÍA ──────────────────────────────────────────────────
const CAT_COLORS: Record<string, { accent: string; glow: string; badge: string }> = {
  tdah:        { accent: '#f59e0b', glow: '#f59e0b20', badge: '#f59e0b15' },
  tea:         { accent: '#8b5cf6', glow: '#8b5cf620', badge: '#8b5cf615' },
  conductual:  { accent: '#ef4444', glow: '#ef444420', badge: '#ef444415' },
  sensorial:   { accent: '#06b6d4', glow: '#06b6d420', badge: '#06b6d415' },
  habilidades: { accent: '#10b981', glow: '#10b98120', badge: '#10b98115' },
  familia:     { accent: '#f472b6', glow: '#f472b620', badge: '#f472b615' },
  seguimiento: { accent: '#64748b', glow: '#64748b20', badge: '#64748b15' },
}
const defaultColor = { accent: '#06b6d4', glow: '#06b6d420', badge: '#06b6d415' }

const CAT_ICONS: Record<string, string> = {
  tdah: '⚡', tea: '🧩', conductual: '🎯', sensorial: '🌀',
  habilidades: '🤝', familia: '🏠', seguimiento: '📈',
}

// ─── FORMULARIO RENDERER ────────────────────────────────────────────────────
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
  const answered = Object.keys(responses).length
  const colors = CAT_COLORS[form.category] || defaultColor

  const answer = (id: string, val: any) => setResponses(p => ({ ...p, [id]: val }))

  const handleAnalyze = async () => {
    if (!childId) { toast.error('Selecciona un paciente'); return }
    if (answered < 2) { toast.error('Responde al menos 2 preguntas'); return }
    setAnalyzing(true)
    try {
      const child = children.find((c: any) => c.id === childId)
      const res = await fetch('/api/analyze-neurodivergent-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: form.id, formData: responses,
          childName: child?.name || 'Paciente',
          childAge: child?.age || calcularEdadNumerica(child?.birth_date) || 'N/E',
          diagnosis: child?.diagnosis || '',
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAiAnalysis(json.analysis)
      setEditedMsg(json.analysis?.mensaje_padres || '')
      toast.success('✨ Análisis IA generado')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally { setAnalyzing(false) }
  }

  const handleSave = async () => {
    if (!childId) { toast.error('Selecciona un paciente'); return }
    setSaving(true)
    try {
      // 1. Guardar el formulario
      await supabase.from('form_responses').insert([{
        child_id: childId,
        form_type: form.id,
        form_title: form.title,
        responses,
        ai_analysis: aiAnalysis,
        created_at: new Date().toISOString(),
      }])

      // 2. Guardar como specialist_submission (para el flujo de aprobación)
      await supabase.from('specialist_submissions').insert([{
        specialist_id: userId,
        child_id: childId,
        tipo: 'familia',
        titulo: `[Formulario] ${form.title}`,
        contenido: Object.entries(responses).slice(0,5)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n'),
        observaciones: aiAnalysis?.analisis_clinico || aiAnalysis?.resumen_ejecutivo || '',
        recomendaciones: (aiAnalysis?.recomendaciones || []).join('\n'),
        status: 'pending_approval',
      }])

      // 3. Cola de aprobación para el padre (requiere autorización del jefe)
      if (aiAnalysis?.mensaje_padres) {
        const { data: child } = await supabase
          .from('children').select('parent_id').eq('id', childId).single()
        if ((child as any)?.parent_id) {
          await fetch('/api/admin/parent-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: childId,
              parent_id: (child as any).parent_id,
              source: 'neuroforma',
              source_title: `Especialista: ${form.title}`,
              ai_message: editedMsg || aiAnalysis.mensaje_padres,
              ai_analysis: aiAnalysis,
              session_data: { form_type: form.id, responses, submitted_by: 'especialista', specialist_id: userId },
            }),
          }).catch(() => {})
        }
      }

      setDone(true)
      toast.success('✅ Enviado para revisión del jefe')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally { setSaving(false) }
  }

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 py-16">
      <div style={{ background: '#10b98120', border: '1px solid #10b98140' }}
        className="w-20 h-20 rounded-full flex items-center justify-center">
        <CheckCircle2 size={40} style={{ color: '#10b981' }} />
      </div>
      <div>
        <h3 style={{ color: '#f1f5f9' }} className="text-2xl font-black mb-2">¡Formulario enviado!</h3>
        <p style={{ color: '#475569' }} className="text-sm max-w-xs mx-auto leading-relaxed">
          El análisis fue enviado al jefe para revisión. Tras aprobación, llegará al padre/madre automáticamente.
        </p>
      </div>
      <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b30' }}
        className="flex items-start gap-3 rounded-2xl p-4 max-w-xs text-left">
        <AlertTriangle size={16} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
        <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
          El mensaje a los padres está en <strong style={{ color: '#fbbf24' }}>Bandeja de Aprobación</strong> del jefe. No llegará hasta que lo autorice.
        </p>
      </div>
      <button onClick={onBack}
        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
        className="px-8 py-3 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all">
        Volver a formularios
      </button>
    </div>
  )

  const inputStyle = {
    background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0'
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Back + Progress */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div style={{ background: 'rgba(255,255,255,0.06)' }} className="h-2 rounded-full overflow-hidden">
            <div style={{ background: colors.accent, width: `${progress}%` }}
              className="h-full rounded-full transition-all duration-500" />
          </div>
          <div className="flex justify-between mt-1">
            <p style={{ color: '#334155' }} className="text-xs">{form.title}</p>
            <p style={{ color: colors.accent }} className="text-xs font-bold">Paso {step + 1}/{total}</p>
          </div>
        </div>
      </div>

      {/* Patient selector - always visible */}
      <div style={{ background: '#0d1a2d', border: `1px solid ${colors.accent}25` }}
        className="rounded-2xl p-4">
        <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">
          <Baby size={10} className="inline mr-1" /> Paciente *
        </label>
        <select value={childId} onChange={e => setChildId(e.target.value)}
          style={inputStyle}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all">
          <option value="" style={{ background: '#0b1628' }}>Seleccionar paciente...</option>
          {children.map((c: any) => (
            <option key={c.id} value={c.id} style={{ background: '#0b1628' }}>
              {c.name}{c.age ? ` (${c.age} años)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Section Questions */}
      {section && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }}
          className="rounded-2xl p-5 space-y-5">
          <div>
            <h4 style={{ color: '#f1f5f9' }} className="font-black text-lg">{section.title}</h4>
            {section.description && (
              <p style={{ color: '#475569' }} className="text-sm mt-1">{section.description}</p>
            )}
          </div>

          {section.questions.map((q: any) => (
            <div key={q.id} className="space-y-2">
              <label style={{ color: '#94a3b8' }} className="block text-sm font-semibold">{q.label}</label>

              {(q.type === 'select' || q.type === 'frequency') && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: string) => (
                    <button key={opt} type="button" onClick={() => answer(q.id, opt)}
                      style={{
                        background: responses[q.id] === opt ? colors.badge : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${responses[q.id] === opt ? colors.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                        color: responses[q.id] === opt ? colors.accent : '#64748b',
                      }}
                      className="w-full text-left p-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5">
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'multiselect' && (
                <div className="flex flex-wrap gap-2">
                  {(q.options || []).map((opt: string) => {
                    const sel: string[] = Array.isArray(responses[q.id]) ? responses[q.id] : []
                    const isSelected = sel.includes(opt)
                    return (
                      <button key={opt} type="button"
                        onClick={() => answer(q.id, isSelected ? sel.filter(x => x !== opt) : [...sel, opt])}
                        style={{
                          background: isSelected ? colors.badge : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? colors.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                          color: isSelected ? colors.accent : '#64748b',
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all">
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'scale' && (
                <div className="flex gap-2">
                  {Array.from({ length: (q.max || 5) - (q.min || 1) + 1 }, (_, i) => i + (q.min || 1)).map(n => (
                    <button key={n} onClick={() => answer(q.id, n)}
                      style={{
                        background: responses[q.id] === n ? colors.accent : 'rgba(255,255,255,0.05)',
                        color: responses[q.id] === n ? '#fff' : '#475569',
                      }}
                      className="w-10 h-10 rounded-xl font-bold text-sm transition-all hover:brightness-125">
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {(q.type === 'text' || q.type === 'number') && (
                <input type={q.type} value={responses[q.id] || ''} onChange={e => answer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  style={inputStyle}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all" />
              )}

              {q.type === 'textarea' && (
                <textarea value={responses[q.id] || ''} onChange={e => answer(q.id, e.target.value)}
                  rows={3} placeholder={q.placeholder}
                  style={inputStyle}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all resize-none" />
              )}

              {q.type === 'boolean' && (
                <div className="flex gap-3">
                  {['Sí', 'No'].map(v => (
                    <button key={v} onClick={() => answer(q.id, v)}
                      style={{
                        background: responses[q.id] === v ? colors.badge : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${responses[q.id] === v ? colors.accent + '60' : 'rgba(255,255,255,0.06)'}`,
                        color: responses[q.id] === v ? colors.accent : '#64748b',
                      }}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all">
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            className="flex-1 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
            ← Anterior
          </button>
        )}
        {step < total - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            style={{ background: colors.badge, color: colors.accent, border: `1px solid ${colors.accent}40` }}
            className="flex-1 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
            Siguiente →
          </button>
        ) : (
          <button onClick={handleAnalyze} disabled={analyzing || !childId}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 0 30px #8b5cf620' }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {analyzing ? 'Analizando...' : '✨ Analizar con IA'}
          </button>
        )}
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(139,92,246,0.25)' }}
          className="rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div style={{ background: '#8b5cf620', color: '#8b5cf6' }}
              className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h4 style={{ color: '#f1f5f9' }} className="font-bold">Análisis IA</h4>
          </div>

          {aiAnalysis.nivel_alerta && (
            <div style={{
              background: aiAnalysis.nivel_alerta === 'alto' ? '#ef444415' : aiAnalysis.nivel_alerta === 'moderado' ? '#f59e0b15' : '#10b98115',
              border: `1px solid ${aiAnalysis.nivel_alerta === 'alto' ? '#ef444430' : aiAnalysis.nivel_alerta === 'moderado' ? '#f59e0b30' : '#10b98130'}`,
            }} className="flex items-center gap-2 px-3 py-2 rounded-xl">
              <AlertTriangle size={14} style={{ color: aiAnalysis.nivel_alerta === 'alto' ? '#ef4444' : aiAnalysis.nivel_alerta === 'moderado' ? '#f59e0b' : '#10b981' }} />
              <p style={{ color: '#94a3b8' }} className="text-xs font-bold">
                Nivel de alerta: <span style={{ color: aiAnalysis.nivel_alerta === 'alto' ? '#ef4444' : aiAnalysis.nivel_alerta === 'moderado' ? '#fbbf24' : '#10b981', textTransform: 'capitalize' }}>{aiAnalysis.nivel_alerta}</span>
              </p>
            </div>
          )}

          {aiAnalysis.resumen_ejecutivo && (
            <p style={{ color: '#94a3b8', lineHeight: 1.8 }} className="text-sm">{aiAnalysis.resumen_ejecutivo}</p>
          )}

          {/* Mensaje para padre - editable */}
          {aiAnalysis.mensaje_padres && (
            <div>
              <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">
                Mensaje para los padres (editable)
              </label>
              <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b20' }}
                className="rounded-xl p-3 mb-2">
                <p style={{ color: '#94a3b8' }} className="text-xs leading-relaxed">
                  <strong style={{ color: '#fbbf24' }}>⚠️</strong> Este mensaje va primero al jefe para aprobación. No llegará al padre hasta que lo autorice.
                </p>
              </div>
              <textarea value={editedMsg} onChange={e => setEditedMsg(e.target.value)} rows={3}
                style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all resize-none" />
            </div>
          )}

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 30px #10b98120' }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {saving ? 'Guardando...' : 'Guardar y Enviar para Aprobación'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function MisFormularios({ userId }: { userId: string }) {
  const toast = useToast()
  const [children, setChildren] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [selectedForm, setSelectedForm] = useState<any>(null)

  useEffect(() => {
    supabase.from('children').select('id, name, age, birth_date, diagnosis')
      .eq('is_active', true).order('name')
      .then(({ data }) => setChildren(data || []))
  }, [])

  const cats = [
    { id: 'all', label: 'Todos', icon: '🗂️' },
    { id: 'tdah', label: 'TDAH', icon: '⚡' },
    { id: 'tea', label: 'TEA', icon: '🧩' },
    { id: 'conductual', label: 'Conductual', icon: '🎯' },
    { id: 'sensorial', label: 'Sensorial', icon: '🌀' },
    { id: 'habilidades', label: 'Habilidades', icon: '🤝' },
    { id: 'familia', label: 'Familia', icon: '🏠' },
  ]

  const filtered = ALL_FORMS.filter(f => {
    const matchCat = activeCat === 'all' || f.category === activeCat
    const matchSearch = search === '' ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.subtitle.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (selectedForm) return (
    <FormFillView
      form={selectedForm}
      children={children}
      onBack={() => setSelectedForm(null)}
      userId={userId}
      toast={toast}
    />
  )

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div>
        <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">
          Formularios Clínicos
        </h2>
        <p style={{ color: '#475569' }} className="text-sm mt-1">
          Completa y analiza con IA — el jefe revisa antes de enviar a los padres
        </p>
      </div>

      {/* Info banner */}
      <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b25' }}
        className="rounded-2xl p-4 flex gap-3">
        <AlertTriangle size={16} style={{ color: '#f59e0b' }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p style={{ color: '#fbbf24' }} className="text-xs font-black mb-0.5">Flujo de aprobación activo</p>
          <p style={{ color: '#64748b' }} className="text-xs leading-relaxed">
            Todo formulario analizado con IA pasa primero por el jefe antes de llegar al padre/madre.
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search size={16} style={{ color: '#334155' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar formulario..."
          style={{ background: 'transparent', color: '#e2e8f0', outline: 'none' }}
          className="flex-1 text-sm font-medium placeholder-slate-600" />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: '#475569' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(cat => {
          const isActive = activeCat === cat.id
          const colors = CAT_COLORS[cat.id] || defaultColor
          return (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              style={{
                background: isActive ? (cat.id === 'all' ? '#06b6d415' : colors.badge) : '#0d1a2d',
                border: `1px solid ${isActive ? (cat.id === 'all' ? '#06b6d430' : colors.accent + '40') : 'rgba(255,255,255,0.06)'}`,
                color: isActive ? (cat.id === 'all' ? '#06b6d4' : colors.accent) : '#475569',
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all">
              <span>{cat.icon}</span> {cat.label}
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
          {filtered.map(form => {
            const colors = CAT_COLORS[form.category] || defaultColor
            return (
              <button key={form.id}
                onClick={() => setSelectedForm(form)}
                style={{ background: '#0d1a2d', border: `1px solid ${colors.accent}20` }}
                className="rounded-2xl p-5 text-left group hover:scale-[1.02] transition-all duration-200 relative overflow-hidden">
                <div style={{ background: colors.accent, filter: 'blur(40px)', opacity: 0.1 }}
                  className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full pointer-events-none" />
                <div className="flex items-start gap-3 relative">
                  <div style={{ background: colors.badge, border: `1px solid ${colors.accent}30` }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {form.icon || CAT_ICONS[form.category] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#f1f5f9' }} className="font-bold text-sm leading-tight">{form.title}</p>
                    <p style={{ color: '#475569' }} className="text-xs mt-0.5 line-clamp-2">{form.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span style={{ background: colors.badge, color: colors.accent }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {CAT_ICONS[form.category]} {form.category.toUpperCase()}
                      </span>
                      <span style={{ color: '#334155' }} className="text-[10px]">
                        ~{form.estimatedMinutes || 10} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: colors.accent }} className="flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
