'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar, Baby,
  TrendingUp, AlertTriangle, Sparkles, ChevronRight, Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  profile: any
  setActiveView: (v: string) => void
}

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const [stats, setStats] = useState({
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    citasHoy: 0,
    totalPacientes: 0,
    citasProximas: 0,
  })
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
          .limit(4)
        setRecientes(rec || [])
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [userId])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const STATUS_COLOR: Record<string, string> = {
    pending_approval: 'text-amber-600 dark:text-amber-400',
    approved: 'text-emerald-600 dark:text-emerald-400',
    rejected: 'text-red-600 dark:text-red-400',
  }
  const STATUS_LABEL: Record<string, string> = {
    pending_approval: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">{saludo}</p>
        <h2 className="text-2xl font-bold mt-1">{profile?.full_name?.split(' ')[0] || 'Especialista'} 👋</h2>
        <p className="text-blue-200 text-sm mt-1">{profile?.specialty || 'Especialista Clínico'}</p>

        {stats.citasHoy > 0 && (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <Calendar size={18} className="text-blue-200" />
            <div>
              <p className="font-semibold text-white">Tienes {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy</p>
              <p className="text-xs text-blue-200">Revisa tu agenda para más detalles</p>
            </div>
            <button onClick={() => setActiveView('agenda')} className="ml-auto text-blue-200 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {stats.pendientes > 0 && (
          <div className="mt-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock size={18} className="text-amber-300" />
            <div>
              <p className="font-semibold text-white">{stats.pendientes} evaluación{stats.pendientes !== 1 ? 'es' : ''} pendiente{stats.pendientes !== 1 ? 's' : ''}</p>
              <p className="text-xs text-blue-200">Esperando aprobación del jefe</p>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Baby} label="Pacientes" value={stats.totalPacientes} color="blue" onClick={() => setActiveView('pacientes')} />
        <StatCard icon={Calendar} label="Citas próximas" value={stats.citasProximas} color="indigo" onClick={() => setActiveView('agenda')} />
        <StatCard icon={Clock} label="En revisión" value={stats.pendientes} color="amber" onClick={() => setActiveView('evaluaciones')} />
        <StatCard icon={CheckCircle2} label="Aprobadas" value={stats.aprobadas} color="emerald" onClick={() => setActiveView('evaluaciones')} />
        <StatCard icon={XCircle} label="Rechazadas" value={stats.rechazadas} color="red" onClick={() => setActiveView('evaluaciones')} />
        <StatCard icon={Activity} label="Total enviadas" value={stats.pendientes + stats.aprobadas + stats.rechazadas} color="slate" onClick={() => setActiveView('evaluaciones')} />
      </div>

      {/* Actividad reciente */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Actividad Reciente</h3>
          </div>
          <button onClick={() => setActiveView('evaluaciones')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver todo</button>
        </div>
        {recientes.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin actividad reciente</p>
            <button onClick={() => setActiveView('evaluaciones')}
              className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Crear primera evaluación
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recientes.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{r.titulo}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{r.children?.name} • {new Date(r.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</p>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aviso de flujo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex gap-4">
        <AlertTriangle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Flujo de trabajo</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            Todo lo que registres (evaluaciones, notas, recomendaciones) será revisado por el jefe antes de ser visible para los padres. Recibirás una notificación cuando sea aprobado o si requiere cambios.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }: any) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    slate: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800',
  }
  return (
    <button onClick={onClick}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </button>
  )
}
