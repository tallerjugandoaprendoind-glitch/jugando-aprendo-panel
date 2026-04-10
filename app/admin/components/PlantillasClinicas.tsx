'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp,
  Loader2, FileText, CheckCircle, Copy, Settings,
  AlignLeft, List, ToggleLeft, Calendar, Hash, Type
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── Types ────────────────────────────────────────────────────────────────────
interface FieldDef {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'checkbox' | 'radio'
  required: boolean
  placeholder?: string
  options?: string[]
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  fields: FieldDef[]
  is_active: boolean
  is_default: boolean
  created_at: string
}

interface TemplateResponse {
  id: string
  template_id: string
  child_id: string
  filled_by: string
  filler_name: string
  filler_role: string
  responses: Record<string, any>
  notes: string | null
  created_at: string
  clinical_templates?: { name: string }
}

const FIELD_TYPES = [
  { id: 'text',        label: 'Texto corto',       icon: Type },
  { id: 'textarea',    label: 'Texto largo',        icon: AlignLeft },
  { id: 'select',      label: 'Lista desplegable',  icon: List },
  { id: 'radio',       label: 'Opción única',       icon: ToggleLeft },
  { id: 'date',        label: 'Fecha',              icon: Calendar },
  { id: 'number',      label: 'Número',             icon: Hash },
  { id: 'checkbox',    label: 'Casilla de verificación', icon: CheckCircle },
]

const CATEGORIES = [
  { id: 'historia_clinica',   label: 'Historia Clínica' },
  { id: 'motivo_consulta',    label: 'Motivo de Consulta' },
  { id: 'seguimiento',        label: 'Seguimiento' },
  { id: 'evaluacion_inicial', label: 'Evaluación Inicial' },
  { id: 'otro',               label: 'Otro' },
]

// ── Admin: Template Manager ─────────────────────────────────────────────────
export function GestorPlantillas({ isDark = false }: { isDark?: boolean }) {
  const toast = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew]     = useState(false)

  const card    = isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const txt1    = isDark ? 'text-slate-100' : 'text-slate-800'
  const txt3    = isDark ? 'text-slate-500' : 'text-slate-400'
  const inputCls = isDark
    ? 'bg-[#0d1117] border-[#30363d] text-slate-200 placeholder:text-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clinical_templates').select('*').order('created_at')
    setTemplates(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const deleteTemplate = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    await supabase.from('clinical_templates').delete().eq('id', id)
    toast.success('Plantilla eliminada')
    load()
  }

  const toggleActive = async (t: Template) => {
    await supabase.from('clinical_templates').update({ is_active: !t.is_active }).eq('id', t.id)
    setTemplates(prev => prev.map(tp => tp.id === t.id ? { ...tp, is_active: !tp.is_active } : tp))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-black text-base ${txt1}`}>
            <Settings size={16} className="inline mr-2 text-indigo-500" />
            Plantillas de Fichas Clínicas
          </h3>
          <p className={`text-xs mt-0.5 ${txt3}`}>Crea y gestiona los modelos de historia clínica de tu centro</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
          <Plus size={14} /> Nueva plantilla
        </button>
      </div>

      {showNew && (
        <PlantillaEditor
          isDark={isDark} onSave={() => { setShowNew(false); load() }} onCancel={() => setShowNew(false)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-indigo-500" /></div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className={`${card} border rounded-2xl overflow-hidden`}>
              {editingId === t.id ? (
                <PlantillaEditor isDark={isDark} template={t}
                  onSave={() => { setEditingId(null); load() }} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-black text-sm ${txt1}`}>{t.name}</p>
                      {t.is_default && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Sistema
                        </span>
                      )}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full
                        ${t.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : isDark ? 'bg-[#21262d] text-slate-500' : 'bg-slate-100 text-slate-400'
                        }`}>
                        {t.is_active ? '✓ Activa' : '● Inactiva'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${isDark ? 'bg-[#21262d] text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
                        {CATEGORIES.find(c => c.id === t.category)?.label}
                      </span>
                    </div>
                    {t.description && <p className={`text-xs mt-1 ${txt3}`}>{t.description}</p>}
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      {t.fields.length} campo{t.fields.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(t)} title={t.is_active ? 'Desactivar' : 'Activar'}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}
                        ${t.is_active ? 'text-emerald-500' : txt3}`}>
                      <ToggleLeft size={15} />
                    </button>
                    <button onClick={() => setEditingId(t.id)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <Edit2 size={14} />
                    </button>
                    {!t.is_default && (
                      <button onClick={() => deleteTemplate(t.id)}
                        className={`p-2 rounded-lg transition-colors text-red-400 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Template Editor ──────────────────────────────────────────────────────────
function PlantillaEditor({
  isDark, template, onSave, onCancel
}: {
  isDark: boolean; template?: Template; onSave: () => void; onCancel: () => void
}) {
  const toast = useToast()
  const [name, setName]         = useState(template?.name || '')
  const [desc, setDesc]         = useState(template?.description || '')
  const [category, setCategory] = useState(template?.category || 'historia_clinica')
  const [fields, setFields]     = useState<FieldDef[]>(template?.fields || [])
  const [saving, setSaving]     = useState(false)

  const txt1    = isDark ? 'text-slate-100' : 'text-slate-800'
  const txt3    = isDark ? 'text-slate-500' : 'text-slate-400'
  const card    = isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-all ${isDark ? 'bg-[#0d1117] border-[#30363d] text-slate-200 placeholder:text-slate-600 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400'}`

  const addField = () => {
    setFields(prev => [...prev, {
      id: `field_${Date.now()}`, label: '', type: 'text', required: false
    }])
  }

  const updateField = (idx: number, patch: Partial<FieldDef>) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  const removeField = (idx: number) => {
    setFields(prev => prev.filter((_, i) => i !== idx))
  }

  const moveField = (idx: number, dir: -1 | 1) => {
    const arr = [...fields]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setFields(arr)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    if (fields.length === 0) { toast.error('Agrega al menos un campo'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = { name: name.trim(), description: desc.trim() || null, category, fields, is_active: true }
      if (template) {
        await supabase.from('clinical_templates').update(payload).eq('id', template.id)
        toast.success('Plantilla actualizada')
      } else {
        await supabase.from('clinical_templates').insert({ ...payload, created_by: user?.id })
        toast.success('Plantilla creada')
      }
      onSave()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${card} border rounded-2xl p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-black ${txt1}`}>{template ? 'Editar plantilla' : 'Nueva plantilla'}</p>
        <button onClick={onCancel} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}`}>
          <X size={14} className={txt3} />
        </button>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${txt3}`}>Nombre *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Historia Clínica General" className={inputCls} />
        </div>
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${txt3}`}>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className={`${inputCls} cursor-pointer`}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${txt3}`}>Descripción</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Para qué sirve esta plantilla..." className={inputCls} />
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ${txt3}`}>Campos ({fields.length})</label>
          <button onClick={addField}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1">
            <Plus size={12} /> Añadir campo
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={field.id} className={`rounded-xl border p-3 space-y-2.5 ${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveField(idx, -1)} className={`text-[10px] ${txt3} hover:text-blue-500`}>▲</button>
                  <button onClick={() => moveField(idx, 1)} className={`text-[10px] ${txt3} hover:text-blue-500`}>▼</button>
                </div>
                <input value={field.label} onChange={e => updateField(idx, { label: e.target.value })}
                  placeholder="Nombre del campo"
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? 'bg-[#161b22] border-[#21262d] text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`} />
                <select value={field.type} onChange={e => updateField(idx, { type: e.target.value as FieldDef['type'] })}
                  className={`px-2 py-2 rounded-lg text-xs border outline-none cursor-pointer ${isDark ? 'bg-[#161b22] border-[#21262d] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                  {FIELD_TYPES.map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })}
                    className="rounded" />
                  <span className={txt3}>*</span>
                </label>
                <button onClick={() => removeField(idx)} className="text-red-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>

              {/* Options for select/radio/multiselect */}
              {['select','radio','multiselect'].includes(field.type) && (
                <div>
                  <input
                    value={(field.options || []).join(', ')}
                    onChange={e => updateField(idx, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                    placeholder="Opciones separadas por coma: Leve, Moderado, Severo"
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none ${isDark ? 'bg-[#161b22] border-[#21262d] text-slate-300 placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-700'}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${isDark ? 'border-[#30363d] text-slate-400 hover:bg-[#21262d]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando...' : 'Guardar plantilla'}
        </button>
      </div>
    </div>
  )
}

// ── Fill Template Form ───────────────────────────────────────────────────────
export function RellenarFicha({
  childId, childName, isDark = false, onSaved
}: {
  childId: string; childName: string; isDark?: boolean; onSaved?: () => void
}) {
  const toast = useToast()
  const [templates, setTemplates]   = useState<Template[]>([])
  const [responses, setResponses]   = useState<TemplateResponse[]>([])
  const [selected, setSelected]     = useState<Template | null>(null)
  const [answers, setAnswers]       = useState<Record<string, any>>({})
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const txt1    = isDark ? 'text-slate-100' : 'text-slate-800'
  const txt3    = isDark ? 'text-slate-500' : 'text-slate-400'
  const card    = isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-all ${isDark ? 'bg-[#0d1117] border-[#30363d] text-slate-200 placeholder:text-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'}`

  useEffect(() => {
    const load = async () => {
      const [{ data: tmpl }, { data: resp }] = await Promise.all([
        supabase.from('clinical_templates').select('*').eq('is_active', true).order('name'),
        supabase.from('clinical_template_responses')
          .select('*, clinical_templates(name)')
          .eq('child_id', childId)
          .order('created_at', { ascending: false }),
      ])
      setTemplates(tmpl || [])
      setResponses(resp || [])
      setLoading(false)
    }
    load()
  }, [childId])

  const handleSave = async () => {
    if (!selected) return
    const missing = selected.fields.filter(f => f.required && !answers[f.id])
    if (missing.length > 0) { toast.error(`Completa: ${missing.map(f => f.label).join(', ')}`); return }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', user!.id).single()

      await supabase.from('clinical_template_responses').insert({
        template_id: selected.id,
        child_id:    childId,
        filled_by:   user!.id,
        filler_role: profile?.role || 'especialista',
        filler_name: profile?.full_name || 'Clínico',
        responses:   answers,
        notes:       notes.trim() || null,
      })
      toast.success('✅ Ficha guardada correctamente')
      setAnswers({})
      setNotes('')
      setSelected(null)
      onSaved?.()
      // Reload responses
      const { data: resp } = await supabase.from('clinical_template_responses')
        .select('*, clinical_templates(name)').eq('child_id', childId).order('created_at', { ascending: false })
      setResponses(resp || [])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-black text-base ${txt1}`}>
            <FileText size={16} className="inline mr-2 text-blue-500" />
            Fichas Clínicas
          </h3>
          <p className={`text-xs mt-0.5 ${txt3}`}>Completa una ficha para {childName}</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
            ${isDark ? 'border-[#30363d] text-slate-400 hover:bg-[#21262d]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          {showHistory ? 'Nueva ficha' : `Historial (${responses.length})`}
        </button>
      </div>

      {showHistory ? (
        /* History view */
        <div className="space-y-3">
          {responses.length === 0 ? (
            <div className={`${card} border rounded-2xl p-8 text-center`}>
              <FileText size={28} className={`mx-auto mb-2 ${txt3}`} />
              <p className={`text-sm font-black ${txt3}`}>Sin fichas registradas</p>
            </div>
          ) : responses.map(r => (
            <ResponseCard key={r.id} response={r} templates={templates} isDark={isDark} />
          ))}
        </div>
      ) : (
        /* Fill form */
        <div className="space-y-4">
          {/* Template selector */}
          {!selected ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => { setSelected(t); setAnswers({}) }}
                  className={`${card} border rounded-2xl p-4 text-left hover:border-blue-400 transition-all group`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${txt1}`}>{t.name}</p>
                      {t.description && <p className={`text-xs mt-0.5 ${txt3}`}>{t.description}</p>}
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        {t.fields.length} campos · {CATEGORIES.find(c => c.id === t.category)?.label}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelected(null)}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}`}>
                  <ChevronDown size={16} className="rotate-90 text-slate-400" />
                </button>
                <p className={`font-black text-sm ${txt1}`}>{selected.name}</p>
              </div>

              <div className="space-y-4">
                {selected.fields.map(field => (
                  <div key={field.id}>
                    <label className={`block text-xs font-black mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' && (
                      <textarea rows={3} value={answers[field.id] || ''} placeholder={field.placeholder}
                        onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                        className={`${inputCls} resize-none`} />
                    )}
                    {field.type === 'text' && (
                      <input type="text" value={answers[field.id] || ''} placeholder={field.placeholder}
                        onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                        className={inputCls} />
                    )}
                    {field.type === 'number' && (
                      <input type="number" value={answers[field.id] || ''} placeholder={field.placeholder}
                        onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                        className={inputCls} />
                    )}
                    {field.type === 'date' && (
                      <input type="date" value={answers[field.id] || ''}
                        onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                        className={inputCls} />
                    )}
                    {field.type === 'select' && (
                      <select value={answers[field.id] || ''} onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.value }))}
                        className={`${inputCls} cursor-pointer`}>
                        <option value="">Seleccionar...</option>
                        {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {field.type === 'radio' && (
                      <div className="flex flex-wrap gap-2">
                        {(field.options || []).map(o => (
                          <button key={o} onClick={() => setAnswers(p => ({ ...p, [field.id]: o }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all
                              ${answers[field.id] === o
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : isDark ? 'border-[#30363d] text-slate-400 hover:border-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                              }`}>
                            {o}
                          </button>
                        ))}
                      </div>
                    )}
                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!answers[field.id]}
                          onChange={e => setAnswers(p => ({ ...p, [field.id]: e.target.checked }))} />
                        <span className={`text-sm ${txt1}`}>{field.placeholder || 'Sí'}</span>
                      </label>
                    )}
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <label className={`block text-xs font-black mb-1.5 ${txt3}`}>Observaciones adicionales</label>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Notas del clínico..."
                    className={`${inputCls} resize-none`} />
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar ficha'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Response Card ────────────────────────────────────────────────────────────
function ResponseCard({ response, templates, isDark }: {
  response: TemplateResponse; templates: Template[]; isDark: boolean
}) {
  const [open, setOpen] = useState(false)
  const template = templates.find(t => t.id === response.template_id)
  const txt1 = isDark ? 'text-slate-100' : 'text-slate-800'
  const txt3 = isDark ? 'text-slate-500' : 'text-slate-400'
  const card = isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'

  return (
    <div className={`${card} border rounded-2xl overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className={`w-full p-4 text-left flex items-center gap-3 ${isDark ? 'hover:bg-[#1c2128]' : 'hover:bg-slate-50'} transition-colors`}>
        <FileText size={16} className="text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black ${txt1}`}>{(response as any).clinical_templates?.name || 'Ficha'}</p>
          <p className={`text-xs ${txt3}`}>
            {response.filler_name} · {new Date(response.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {open ? <ChevronUp size={16} className={txt3} /> : <ChevronDown size={16} className={txt3} />}
      </button>

      {open && template && (
        <div className={`p-4 border-t space-y-3 ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
          {template.fields.map(field => {
            const val = response.responses[field.id]
            if (!val && val !== 0 && val !== false) return null
            return (
              <div key={field.id}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${txt3}`}>{field.label}</p>
                <p className={`text-sm ${txt1}`}>{String(val)}</p>
              </div>
            )
          })}
          {response.notes && (
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${txt3}`}>Observaciones</p>
              <p className={`text-sm ${txt1}`}>{response.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
