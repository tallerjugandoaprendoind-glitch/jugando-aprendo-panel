'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Loader2, Send, AlertTriangle, X, Baby
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const STATUS: Record<string, any> = {
  pending_approval: { label: 'En revisión', color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b30', icon: Clock },
  approved:         { label: 'Aprobado',    color: '#10b981', bg: '#10b98115', border: '#10b98130', icon: CheckCircle2 },
  rejected:         { label: 'Rechazado',   color: '#ef4444', bg: '#ef444415', border: '#ef444430', icon: XCircle },
}

const TIPOS = [
  { id: 'conducta', label: 'Conducta',       desc: 'Análisis ABC', color: '#8b5cf6' },
  { id: 'progreso', label: 'Progreso',        desc: 'Avance terapéutico', color: '#06b6d4' },
  { id: 'sesion',   label: 'Nota de sesión',  desc: 'Registro clínico', color: '#10b981' },
  { id: 'familia',  label: 'Para familia',    desc: 'Guías para el hogar', color: '#f59e0b' },
]

export default function MisEvaluaciones({ userId }: { userId: string }) {
  const toast = useToast()
  const [evaluaciones, setEvaluaciones] = useState<any[]>([])
  const [ninos, setNinos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('all')
  const [form, setForm] = useState({ child_id: '', tipo: 'conducta', titulo: '', contenido: '', observaciones: '', recomendaciones: '' })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [evalRes, ninosRes] = await Promise.all([
        supabase.from('specialist_submissions').select('*, children(name)').eq('specialist_id', userId).order('created_at', { ascending: false }),
        supabase.from('children').select('id, name').eq('is_active', true).order('name')
      ])
      setEvaluaciones(evalRes.data || [])
      setNinos(ninosRes.data || [])
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  const enviar = async () => {
    if (!form.child_id || !form.titulo || !form.contenido) { toast.error('Completa los campos requeridos'); return }
    setEnviando(true)
    try {
      const { error } = await supabase.from('specialist_submissions').insert({ specialist_id: userId, ...form, status: 'pending_approval' })
      if (error) throw error
      toast.success('¡Enviado para aprobación!')
      setMostrarForm(false)
      setForm({ child_id: '', tipo: 'conducta', titulo: '', contenido: '', observaciones: '', recomendaciones: '' })
      cargar()
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setEnviando(false) }
  }

  const filtradas = filtro === 'all' ? evaluaciones : evaluaciones.filter(e => e.status === filtro)
  const counts = { all: evaluaciones.length, pending_approval: evaluaciones.filter(e => e.status === 'pending_approval').length, approved: evaluaciones.filter(e => e.status === 'approved').length, rejected: evaluaciones.filter(e => e.status === 'rejected').length }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all"
  const inputStyle = { background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }
  const inputFocusStyle = { '--tw-ring-color': '#06b6d4' } as any

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">Mis Evaluaciones</h2>
          <p style={{ color: '#475569' }} className="text-sm mt-1">Requieren aprobación antes de llegar a los padres</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 30px #06b6d430' }}
          className="flex items-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-xl hover:brightness-110 transition-all flex-shrink-0">
          <Plus size={16} /> Nueva
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending_approval', 'approved', 'rejected'] as const).map(f => {
          const isActive = filtro === f
          const cfg = f !== 'all' ? STATUS[f] : null
          return (
            <button key={f} onClick={() => setFiltro(f)}
              style={{
                background: isActive ? (cfg?.bg || '#06b6d415') : '#0d1a2d',
                border: `1px solid ${isActive ? (cfg?.border || '#06b6d430') : 'rgba(255,255,255,0.06)'}`,
                color: isActive ? (cfg?.color || '#06b6d4') : '#475569',
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all">
              {f === 'all' ? 'Todas' : STATUS[f].label}
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : '#475569',
              }} className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black">
                {counts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} style={{ color: '#06b6d4' }} className="animate-spin" />
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }}
          className="rounded-2xl py-20 text-center">
          <div style={{ background: 'rgba(255,255,255,0.04)' }} className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} style={{ color: '#334155' }} />
          </div>
          <p style={{ color: '#475569' }} className="text-sm font-semibold">Sin evaluaciones</p>
          <button onClick={() => setMostrarForm(true)} style={{ color: '#06b6d4' }}
            className="mt-3 text-xs font-bold hover:underline">
            Crear nueva →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(ev => {
            const cfg = STATUS[ev.status] || STATUS.pending_approval
            const Icon = cfg.icon
            const abierto = expandido === ev.id
            const tipo = TIPOS.find(t => t.id === ev.tipo)
            return (
              <div key={ev.id}
                style={{ background: '#0d1a2d', border: `1px solid ${abierto ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}` }}
                className="rounded-2xl overflow-hidden transition-all">
                <div className="p-5 flex items-start gap-4">
                  {/* Status indicator */}
                  <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p style={{ color: '#e2e8f0' }} className="text-sm font-bold">{ev.titulo}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span style={{ color: '#64748b' }} className="text-xs">{ev.children?.name}</span>
                          {tipo && (
                            <span style={{ background: `${tipo.color}18`, color: tipo.color }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full">{tipo.label}</span>
                          )}
                          <span style={{ color: '#334155' }} className="text-xs">
                            {new Date(ev.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">{cfg.label}</span>
                    </div>
                    {ev.admin_comment && (
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid #06b6d4' }}
                        className="mt-3 px-3 py-2 rounded-r-xl text-xs" style2={{ color: '#94a3b8' }}>
                        <p style={{ color: '#64748b' }} className="text-[10px] font-bold uppercase tracking-wide mb-0.5">Comentario del jefe</p>
                        <p style={{ color: '#94a3b8' }}>{ev.admin_comment}</p>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setExpandido(abierto ? null : ev.id)}
                    style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
                    className="p-2 rounded-lg flex-shrink-0 hover:bg-white/10 transition-colors">
                    {abierto ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {abierto && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
                    className="px-5 py-5 space-y-4">
                    <ExpandedSection title="Contenido" content={ev.contenido} />
                    {ev.observaciones && <ExpandedSection title="Observaciones" content={ev.observaciones} />}
                    {ev.recomendaciones && <ExpandedSection title="Recomendaciones" content={ev.recomendaciones} />}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL NUEVA EVALUACIÓN ── */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0b1628', border: '1px solid rgba(255,255,255,0.08)' }}
            className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">

            {/* Modal header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, #0d1f35, #0b1628)' }}
              className="sticky top-0 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="font-black text-lg">Nueva Evaluación</h3>
                <div style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b25' }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1.5">
                  <Clock size={10} /> Pendiente de aprobación al enviar
                </div>
              </div>
              <button onClick={() => setMostrarForm(false)}
                style={{ color: '#475569', background: 'rgba(255,255,255,0.05)' }}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Paciente */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Paciente *</label>
                <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))}
                  style={{ ...inputStyle }} className={inputCls}>
                  <option value="" style={{ background: '#0b1628' }}>Seleccionar...</option>
                  {ninos.map(n => <option key={n.id} value={n.id} style={{ background: '#0b1628' }}>{n.name}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS.map(t => (
                    <button key={t.id} onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                      style={{
                        background: form.tipo === t.id ? `${t.color}18` : '#0a1628',
                        border: form.tipo === t.id ? `1px solid ${t.color}40` : '1px solid rgba(255,255,255,0.06)',
                      }}
                      className="text-left p-3 rounded-xl transition-all">
                      <p style={{ color: form.tipo === t.id ? t.color : '#94a3b8' }} className="text-sm font-bold">{t.label}</p>
                      <p style={{ color: '#475569' }} className="text-xs mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Evaluación de conducta — Sesión 12"
                  style={inputStyle} className={inputCls} />
              </div>

              {/* Contenido */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Contenido *</label>
                <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={5} placeholder="Hallazgos clínicos, conductas observadas, desempeño..."
                  style={inputStyle} className={`${inputCls} resize-none`} />
              </div>

              {/* Observaciones */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Observaciones <span style={{ color: '#334155' }}>(opcional)</span></label>
                <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  rows={3} placeholder="Notas adicionales, patrones observados, alertas..."
                  style={inputStyle} className={`${inputCls} resize-none`} />
              </div>

              {/* Recomendaciones */}
              <div>
                <label style={{ color: '#64748b' }} className="block text-xs font-bold uppercase tracking-widest mb-2">Recomendaciones <span style={{ color: '#334155' }}>(opcional)</span></label>
                <textarea value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))}
                  rows={3} placeholder="Estrategias, ajustes al plan, actividades para casa..."
                  style={inputStyle} className={`${inputCls} resize-none`} />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setMostrarForm(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
                <button onClick={enviar} disabled={enviando}
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 30px #06b6d425' }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {enviando ? 'Enviando...' : 'Enviar para aprobación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExpandedSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p style={{ color: '#334155' }} className="text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
      <p style={{ color: '#94a3b8', lineHeight: 1.8 }} className="text-sm whitespace-pre-wrap">{content}</p>
    </div>
  )
}
