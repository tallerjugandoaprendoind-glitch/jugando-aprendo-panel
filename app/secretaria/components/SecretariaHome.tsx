'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import {
  Calendar, Clock, Users, CheckCircle2, XCircle,
  ChevronRight, Loader2, TrendingUp,
  RefreshCw, CalendarDays, Bell, ArrowRight, Sparkles,
  Activity, AlertCircle, Plus, BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function StatCard({ title, value, sub, icon: Icon, gradient, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl p-5 text-left overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] ${gradient}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6" />
      <div className="relative flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Icon size={18} className="text-white" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-white/20 text-white/90">
          {sub}
        </span>
      </div>
      <p className="text-3xl font-black text-white leading-none mb-1 relative">{value}</p>
      <p className="text-xs font-semibold text-white/70 relative">{title}</p>
      {onClick && (
        <ChevronRight size={14} className="absolute bottom-4 right-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
      )}
    </button>
  )
}

function AppointmentRow({ apt }: { apt: any }) {
  const fecha = new Date(apt.appointment_date + 'T00:00:00')
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).replace('.', '').toUpperCase()
  const dia = fecha.getDate()
  const esHoy = apt.appointment_date === new Date().toISOString().split('T')[0]

  const statusCfg: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    pending:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-600 border border-red-200' },
    completed: { label: 'Completada', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    realizada: { label: 'Realizada',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  }
  const s = statusCfg[apt.status] || { label: apt.status, cls: 'bg-slate-100 text-slate-600' }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center ${esHoy ? 'bg-violet-100' : 'bg-slate-100'}`}>
        <span className={`text-[9px] font-black uppercase leading-none ${esHoy ? 'text-violet-500' : 'text-slate-400'}`}>{mesCorto}</span>
        <span className={`text-sm font-black leading-tight ${esHoy ? 'text-violet-700' : 'text-slate-700'}`}>{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{apt.children?.name || apt.patient_name || 'Paciente'}</p>
        <p className="text-[11px] text-slate-400 font-medium">{apt.appointment_time?.slice(0, 5) || '—'} · {apt.therapist_name || 'Terapeuta'}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${s.cls}`}>{s.label}</span>
    </div>
  )
}

interface Props { onNavigate?: (view: string) => void }

export default function SecretariaHome({ onNavigate }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, pendientes: 0, canceladas: 0, pacientes: 0, completadas: 0 })
  const [citasHoy, setCitasHoy] = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [citasRecientes, setCitasRecientes] = useState<any[]>([])

  const cargar = async () => {
    setLoading(true)
    try {
      const hoyStr = new Date().toISOString().split('T')[0]
      const d = new Date(); const day = d.getDay()
      const lunesStr = (() => { const x = new Date(d); x.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return x.toISOString().split('T')[0] })()
      const viernesStr = (() => { const x = new Date(d); x.setDate(d.getDate() + (day === 0 ? 0 : 7 - day)); return x.toISOString().split('T')[0] })()
      const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30); const hace30Str = hace30.toISOString().split('T')[0]
      const { data: todas } = await supabase.from('appointments').select('*, children(name)').gte('appointment_date', hace30Str).order('appointment_date', {ascending: false}).limit(200)
      const { data: pacientes } = await supabase.from('children').select('id').eq('is_active', true)
      const allApts = todas || []
      const hoy = allApts.filter(a => a.appointment_date === hoyStr)
      const futuras = allApts.filter(a => a.appointment_date >= hoyStr)
      const semana = allApts.filter(a => a.appointment_date >= lunesStr && a.appointment_date <= viernesStr)
      setCitasHoy(hoy)
      setProximasCitas(futuras.slice(0, 8))
      const pasadas = allApts.filter(a => a.appointment_date < hoyStr)
      setCitasRecientes(pasadas.slice(0, 6))
      setStats({ hoy: hoy.length, semana: semana.length, pendientes: allApts.filter(a => a.status === 'pending').length, canceladas: allApts.filter(a => a.status === 'cancelled').length, pacientes: pacientes?.length || 0, completadas: allApts.filter(a => a.status === 'completed' || a.status === 'realizada').length })
    } catch (e: any) { toast.error('Error cargando datos: ' + e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin text-violet-500" />
        <p className="text-xs text-slate-400 font-medium">Cargando panel...</p>
      </div>
    </div>
  )

  const todayCap = (() => {
    const s = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white overflow-hidden shadow-xl shadow-violet-200/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-10 -translate-x-10" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-violet-200 uppercase tracking-widest mb-1">Panel Administrativo</p>
            <h2 className="text-2xl font-black leading-tight">Bienvenida 👋</h2>
            <p className="text-sm text-violet-200 mt-1">{todayCap}</p>
          </div>
          <button onClick={cargar} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all border border-white/10 flex-shrink-0">
            <RefreshCw size={12} /> Actualizar
          </button>
        </div>
        {/* Mini stats inline */}
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Citas hoy', value: stats.hoy },
            { label: 'Esta semana', value: stats.semana },
            { label: 'Pacientes', value: stats.pacientes },
          ].map(item => (
            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center border border-white/10">
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-[10px] text-violet-200 font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard title="Citas hoy" value={stats.hoy} sub="Hoy"
          icon={Calendar} gradient="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200/40"
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Esta semana" value={stats.semana} sub="Semana"
          icon={CalendarDays} gradient="bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200/40"
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Pendientes" value={stats.pendientes}
          sub={stats.pendientes > 0 ? '⚠ Acción' : 'Al día'}
          icon={stats.pendientes > 0 ? AlertCircle : CheckCircle2}
          gradient={stats.pendientes > 0
            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/40"
            : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg shadow-slate-200/40"}
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Pacientes activos" value={stats.pacientes} sub="Total"
          icon={Users} gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/40" />
        <StatCard title="Completadas" value={stats.completadas} sub="Próximas"
          icon={CheckCircle2} gradient="bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-200/40" />
        <StatCard title="Canceladas" value={stats.canceladas} sub="Próximas"
          icon={XCircle} gradient="bg-gradient-to-br from-rose-400 to-red-500 shadow-lg shadow-red-200/40" />
      </div>

      {/* Two column lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Citas hoy */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-black text-sm text-slate-800">Citas de hoy</h3>
              {citasHoy.length > 0 && (
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{citasHoy.length}</span>
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="p-3 space-y-0.5 min-h-[120px]">
            {citasHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <CalendarDays size={28} className="mb-2" />
                <p className="text-xs font-semibold text-slate-400">Sin citas para hoy</p>
              </div>
            ) : (
              citasHoy.map(apt => <AppointmentRow key={apt.id} apt={apt} />)
            )}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-50 bg-slate-50/50">
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Ver agenda completa <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Próximas citas / Recientes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-slate-400" />
              <h3 className="font-black text-sm text-slate-800">{proximasCitas.length > 0 ? 'Próximas citas' : 'Citas recientes'}</h3>
            </div>
          </div>
          <div className="p-3 space-y-0.5 min-h-[120px]">
            {(proximasCitas.length > 0 ? proximasCitas : citasRecientes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <Calendar size={28} className="mb-2" />
                <p className="text-xs font-semibold text-slate-400">Sin citas registradas</p>
              </div>
            ) : (
              (proximasCitas.length > 0 ? proximasCitas : citasRecientes).slice(0, 6).map(apt => <AppointmentRow key={apt.id} apt={apt} />)
            )}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-50 bg-slate-50/50">
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Plus,        label: 'Nueva cita',          sub: 'Agendar sesión',       action: 'agenda',      from: 'from-blue-500',   to: 'to-blue-600' },
          { icon: CalendarDays, label: 'Cronograma',         sub: 'Ver semana completa',   action: 'cronograma',  from: 'from-violet-500', to: 'to-purple-600' },
          { icon: BarChart3,   label: 'Reportes',            sub: 'Asistencia y métricas', action: 'reportes',    from: 'from-emerald-500', to: 'to-teal-600' },
        ].map(({ icon: Icon, label, sub, action, from, to }) => (
          <button
            key={label}
            onClick={() => onNavigate?.(action)}
            className={`group flex items-center gap-4 bg-gradient-to-br ${from} ${to} rounded-2xl p-4 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-95`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon size={18} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-black truncate">{label}</p>
              <p className="text-[11px] text-white/70 font-medium truncate">{sub}</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        ))}
      </div>

    </div>
  )
}
