'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, ChevronDown,
  ChevronUp, Loader2, Send, AlertTriangle, Eye, X, Baby, Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const STATUS = {
  pending_approval: { label: 'Pendiente de aprobación', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: Clock },
  approved: { label: 'Aprobado', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  rejected: { label: 'Rechazado', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: XCircle },
}

const TIPOS_EVALUACION = [
  { id: 'conducta', label: 'Evaluación de Conducta', desc: 'Análisis ABC y patrones conductuales' },
  { id: 'progreso', label: 'Reporte de Progreso', desc: 'Avance en objetivos terapéuticos' },
  { id: 'sesion', label: 'Nota de Sesión', desc: 'Registro detallado de sesión clínica' },
  { id: 'familia', label: 'Recomendaciones para Familia', desc: 'Guías y actividades para el hogar' },
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

  const [form, setForm] = useState({
    child_id: '',
    tipo: 'conducta',
    titulo: '',
    contenido: '',
    observaciones: '',
    recomendaciones: '',
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [evalRes, ninosRes] = await Promise.all([
        supabase
          .from('specialist_submissions')
          .select('*, children(name)')
          .eq('specialist_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('children').select('id, name').eq('is_active', true).order('name')
      ])
      setEvaluaciones(evalRes.data || [])
      setNinos(ninosRes.data || [])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  const enviar = async () => {
    if (!form.child_id || !form.titulo || !form.contenido) {
      toast.error('Completa los campos requeridos')
      return
    }
    setEnviando(true)
    try {
      const { error } = await supabase.from('specialist_submissions').insert({
        specialist_id: userId,
        child_id: form.child_id,
        tipo: form.tipo,
        titulo: form.titulo,
        contenido: form.contenido,
        observaciones: form.observaciones,
        recomendaciones: form.recomendaciones,
        status: 'pending_approval',
      })
      if (error) throw error
      toast.success('¡Enviado para aprobación del jefe!')
      setMostrarForm(false)
      setForm({ child_id: '', tipo: 'conducta', titulo: '', contenido: '', observaciones: '', recomendaciones: '' })
      cargar()
    } catch (e: any) {
      toast.error('Error al enviar: ' + e.message)
    } finally {
      setEnviando(false)
    }
  }

  const filtradas = filtro === 'all' ? evaluaciones : evaluaciones.filter(e => e.status === filtro)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mis Evaluaciones</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Requieren aprobación del jefe antes de ser visibles</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus size={16} /> Nueva Evaluación
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending_approval', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
            {f === 'all' ? 'Todas' : STATUS[f as keyof typeof STATUS]?.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <FileText size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Sin evaluaciones {filtro !== 'all' ? 'en este estado' : ''}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Crea una nueva para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(ev => {
            const cfg = STATUS[ev.status as keyof typeof STATUS] || STATUS.pending_approval
            const Icon = cfg.icon
            const abierto = expandido === ev.id
            return (
              <div key={ev.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} border`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{ev.titulo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ev.children?.name} • {TIPOS_EVALUACION.find(t => t.id === ev.tipo)?.label}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(ev.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</p>
                    {ev.admin_comment && (
                      <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Comentario del jefe:</span> {ev.admin_comment}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setExpandido(abierto ? null : ev.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 p-1">
                    {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                {abierto && (
                  <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Contenido</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ev.contenido}</p>
                    </div>
                    {ev.observaciones && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Observaciones</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ev.observaciones}</p>
                      </div>
                    )}
                    {ev.recomendaciones && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Recomendaciones</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ev.recomendaciones}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nueva evaluación */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Nueva Evaluación</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                  <Clock size={11} /> Será enviada al jefe para aprobación
                </p>
              </div>
              <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Paciente */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Paciente *</label>
                <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar paciente...</option>
                  {ninos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Evaluación *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIPOS_EVALUACION.map(t => (
                    <button key={t.id} onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                      className={`text-left p-3 rounded-xl border transition-all ${form.tipo === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Evaluación de conducta - Sesión 12"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contenido *</label>
                <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                  rows={5} placeholder="Describe los hallazgos clínicos, conductas observadas, desempeño en actividades..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Observaciones adicionales</label>
                <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  rows={3} placeholder="Notas clínicas adicionales, patrones observados, alertas..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Recomendaciones */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Recomendaciones</label>
                <textarea value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))}
                  rows={3} placeholder="Estrategias sugeridas, ajustes al plan terapéutico, actividades para casa..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold mb-0.5">Flujo de aprobación</p>
                  <p>Esta evaluación quedará en estado <strong>Pendiente</strong> hasta que el jefe la revise y apruebe. Solo entonces será visible para el padre del paciente.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMostrarForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={enviar} disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
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
