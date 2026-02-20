'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Loader2, User, Baby, FileText, Eye, MessageCircle, RefreshCw,
  Stethoscope, AlertTriangle, Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const TIPO_LABEL: Record<string, string> = {
  conducta: 'Evaluación de Conducta',
  progreso: 'Reporte de Progreso',
  sesion: 'Nota de Sesión',
  familia: 'Recomendaciones para Familia',
}

const STATUS_CFG = {
  pending_approval: { label: 'Pendiente', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: Clock },
  approved: { label: 'Aprobado', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: XCircle },
}

interface Submission {
  id: string
  specialist_id: string
  child_id: string
  tipo: string
  titulo: string
  contenido: string
  observaciones?: string
  recomendaciones?: string
  status: 'pending_approval' | 'approved' | 'rejected'
  admin_comment?: string
  created_at: string
  children?: { name: string }
  profiles?: { full_name: string; specialty: string }
}

export default function AprobacionesEspecialista() {
  const toast = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pending_approval' | 'approved' | 'rejected' | 'all'>('pending_approval')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [accionando, setAccionando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('specialist_submissions')
        .select('*, children(name), profiles!specialist_submissions_specialist_id_fkey(full_name, specialty)')
        .order('created_at', { ascending: false })

      if (filtro !== 'all') q = q.eq('status', filtro)

      const { data, error } = await q
      if (error) throw error
      setSubmissions(data || [])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { cargar() }, [cargar])

  const accion = async (id: string, tipo: 'approved' | 'rejected') => {
    setAccionando(id)
    try {
      const { error } = await supabase
        .from('specialist_submissions')
        .update({
          status: tipo,
          admin_comment: comentarios[id] || null,
          approved_at: tipo === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
      if (error) throw error
      toast.success(tipo === 'approved' ? '✅ Evaluación aprobada' : '❌ Evaluación rechazada')
      setExpandido(null)
      cargar()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setAccionando(null)
    }
  }

  const pendientesCount = submissions.filter(s => s.status === 'pending_approval').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Aprobaciones de Especialistas</h2>
            {filtro === 'pending_approval' && pendientesCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{pendientesCount}</span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Revisa y aprueba lo que envían los especialistas</p>
        </div>
        <button onClick={cargar} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['pending_approval', 'approved', 'rejected', 'all'] as const).map(f => {
          const cfg = f !== 'all' ? STATUS_CFG[f] : null
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filtro === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
              {f === 'all' ? 'Todas' : STATUS_CFG[f].label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <ShieldCheck size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {filtro === 'pending_approval' ? '¡Sin pendientes! Todo está al día.' : 'Sin registros en este estado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => {
            const cfg = STATUS_CFG[sub.status]
            const Icon = cfg.icon
            const abierto = expandido === sub.id
            const esPendiente = sub.status === 'pending_approval'
            return (
              <div key={sub.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Encabezado */}
                <div className="p-4 flex items-start gap-4">
                  <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${cfg.bg}`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{sub.titulo}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Baby size={11} /> {sub.children?.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Stethoscope size={11} /> {sub.profiles?.full_name}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{TIPO_LABEL[sub.tipo] || sub.tipo}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(sub.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium', timeStyle: 'short' } as any)}
                    </p>
                    {sub.admin_comment && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="font-medium">Tu comentario:</span> {sub.admin_comment}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setExpandido(abierto ? null : sub.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex-shrink-0">
                    {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Detalle expandido */}
                {abierto && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="px-5 py-4 space-y-4">
                      <Section title="Contenido" content={sub.contenido} />
                      {sub.observaciones && <Section title="Observaciones" content={sub.observaciones} />}
                      {sub.recomendaciones && <Section title="Recomendaciones" content={sub.recomendaciones} />}

                      {esPendiente && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                              Comentario para el especialista (opcional)
                            </label>
                            <textarea
                              value={comentarios[sub.id] || ''}
                              onChange={e => setComentarios(c => ({ ...c, [sub.id]: e.target.value }))}
                              rows={3}
                              placeholder="Ej: Excelente trabajo, queda aprobado. / Favor revisar la sección de recomendaciones..."
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => accion(sub.id, 'rejected')}
                              disabled={!!accionando}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                              {accionando === sub.id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                              Rechazar
                            </button>
                            <button
                              onClick={() => accion(sub.id, 'approved')}
                              disabled={!!accionando}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm">
                              {accionando === sub.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                              Aprobar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  )
}
