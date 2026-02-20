'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar, Baby,
  AlertTriangle, ChevronRight, Activity, Sparkles, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  profile: any
  setActiveView: (v: string) => void
}

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0, citasHoy: 0, totalPacientes: 0, citasProximas: 0 })
  const [recientes, setRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const [subRes, citRes, nRes] = await Promise.all([
          supabase.from('specialist_submissions').select('status').eq('specialist_id', userId),
          supabase.from('appointments').select('appointment_date').neq('status', 'cancelled'),
          supabase.from('children').select('id', { count: 'exact' }).eq('is_active', true),
        ])
        const subs = subRes.data || []
        const citas = citRes.data || []
        setStats({
          pendientes: subs.filter(s => s.status === 'pending_approval').length,
          aprobadas: subs.filter(s => s.status === 'approved').length,
          rechazadas: subs.filter(s => s.status === 'rejected').length,
          citasHoy: citas.filter(c => c.appointment_date === hoy).length,
          totalPacientes: nRes.count || 0,
          citasProximas: citas.filter(c => c.appointment_date > hoy).length,
        })
        const { data: rec } = await supabase
          .from('specialist_submissions')
          .select('*, children(name)')
          .eq('specialist_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecientes(rec || [])
      } finally { setLoading(false) }
    }
    cargar()
  }, [userId])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const STAT_CARDS = [
    { label: 'Pacientes', value: stats.totalPacientes, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', view: 'pacientes', icon: Baby, sub: 'Total activos' },
    { label: 'Citas próximas', value: stats.citasProximas, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', view: 'agenda', icon: Calendar, sub: 'Próximas sesiones' },
    { label: 'En revisión', value: stats.pendientes, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', view: 'evaluaciones', icon: Clock, sub: 'Esperando al jefe' },
    { label: 'Aprobadas', value: stats.aprobadas, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', view: 'evaluaciones', icon: CheckCircle2, sub: 'Confirmadas' },
  ]

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    pending_approval: { label: 'En revisión', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
    approved:         { label: 'Aprobado',    color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
    rejected:         { label: 'Rechazado',   color: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
  }

  return (
    <div className="space-y-6">
      {/* Hero saludo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-7 text-white relative overflow-hidden shadow-lg shadow-blue-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-8" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">{saludo}</p>
          <h2 className="text-3xl font-black mb-1 tracking-tight">
            {profile?.full_name?.split(' ')[0] || 'Especialista'}
          </h2>
          <p className="text-blue-200 text-sm font-medium">
            {profile?.specialty || 'Especialista Clínico'} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {stats.citasHoy > 0 && (
              <button onClick={() => setActiveView('agenda')}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all border border-white/20">
                <Calendar size={14} />
                {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy
                <ArrowUpRight size={13} />
              </button>
            )}
            {stats.pendientes > 0 && (
              <button onClick={() => setActiveView('evaluaciones')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400/20 hover:bg-amber-400/30 rounded-xl text-sm font-semibold text-amber-100 transition-all border border-amber-400/30">
                <Clock size={14} />
                {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''} de aprobación
                <ArrowUpRight size={13} />
              </button>
            )}
            {stats.citasHoy === 0 && stats.pendientes === 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-xl text-sm font-semibold border border-white/20">
                <Sparkles size={14} /> Todo al día ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => (
          <button key={card.label} onClick={() => setActiveView(card.view)}
            className={`bg-white rounded-2xl p-5 text-left group hover:shadow-md transition-all duration-200 border ${card.border} hover:scale-[1.02]`}>
            <div className={`${card.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1 tabular-nums">
              {loading ? '—' : card.value}
            </p>
            <p className={`text-xs font-bold mb-0.5 ${card.color}`}>{card.label}</p>
            <p className="text-xs text-slate-400">{card.sub}</p>
          </button>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity size={14} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Actividad Reciente</h3>
          </div>
          <button onClick={() => setActiveView('evaluaciones')}
            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            Ver todo <ChevronRight size={13} />
          </button>
        </div>

        {recientes.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm font-semibold">Sin actividad reciente</p>
            <button onClick={() => setActiveView('evaluaciones')}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline">
              Crear primera evaluación →
            </button>
          </div>
        ) : (
          <div>
            {recientes.map((r, idx) => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending_approval
              return (
                <div key={r.id}
                  className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${idx < recientes.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <FileText size={14} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.titulo}</p>
                    <p className="text-xs text-slate-400">{r.children?.name} · {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info flujo */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={17} className="text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 mb-1">Cómo funciona tu panel</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Todo lo que registres pasa primero por revisión del jefe antes de ser visible para los padres.
            Recibirás feedback cuando algo sea aprobado o necesite ajustes.
          </p>
        </div>
      </div>
    </div>
  )
}
