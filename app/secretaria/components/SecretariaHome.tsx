'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import {
  Calendar, Clock, Users, CheckCircle2, XCircle,
  ChevronRight, Loader2, TrendingUp,
  RefreshCw, CalendarDays, Bell, ArrowRight, Sparkles,
  Activity, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function StatCard({ title, value, sub, icon: Icon, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 text-left overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : 'cursor-default'}`}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 -translate-y-4 translate-x-4 ${color.blob}`} />
      <div className="flex items-start justify-between mb-4 relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.bg}`}>
          <Icon size={18} className={color.icon} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${color.badge}`}>
          {sub}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-800 leading-none mb-1.5 relative">{value}</p>
      <p className="text-xs font-semibold text-slate-400 relative">{title}</p>
      {onClick && (
        <ChevronRight size={14} className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </button>
  )
}

function AppointmentRow({ apt }: { apt: any }) {
  const fecha  = new Date(apt.appointment_date + 'T00:00:00')
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).replace('.','').toUpperCase()
  const dia    = fecha.getDate()
  const esHoy  = apt.appointment_date === new Date().toISOString().split('T')[0]

  const statusCfg: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    pending:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-600 border border-red-200' },
    completed: { label: 'Completada', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  }
  const s = statusCfg[apt.status] || { label: apt.status, cls: 'bg-slate-100 text-slate-600' }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${esHoy ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}>
      <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 ${esHoy ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <span className="text-[8px] font-bold leading-none">{mesCorto}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{apt.children?.name || '—'}</p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
          <Clock size={10} />
          {apt.appointment_time?.slice(0, 5)}
          {esHoy && <span className="text-blue-600 font-bold">· Hoy</span>}
          {apt.service_type && <span className="truncate">· {apt.service_type}</span>}
        </p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>
    </div>
  )
}

export default function SecretariaHome({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState({ hoy: 0, semana: 0, pendientes: 0, canceladas: 0, pacientes: 0, completadas: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [citasHoy, setCitasHoy]         = useState<any[]>([])

  const cargar = async () => {
    setLoading(true)
    try {
      const hoyStr = new Date().toISOString().split('T')[0]
      const d = new Date(); const day = d.getDay()
      const lunesStr = (() => { const x = new Date(d); x.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return x.toISOString().split('T')[0] })()
      const viernesStr = (() => { const x = new Date(d); x.setDate(d.getDate() + (day === 0 ? 0 : 7 - day)); return x.toISOString().split('T')[0] })()
      const { data: todas } = await supabase.from('appointments').select('*, children(name)').gte('appointment_date', hoyStr).order('appointment_date').order('appointment_time').limit(100)
      const { data: pacientes } = await supabase.from('children').select('id').eq('is_active', true)
      const allApts = todas || []
      const hoy = allApts.filter(a => a.appointment_date === hoyStr)
      const semana = allApts.filter(a => a.appointment_date >= lunesStr && a.appointment_date <= viernesStr)
      setCitasHoy(hoy)
      setProximasCitas(allApts.slice(0, 8))
      setStats({ hoy: hoy.length, semana: semana.length, pendientes: allApts.filter(a => a.status === 'pending').length, canceladas: allApts.filter(a => a.status === 'cancelled').length, pacientes: pacientes?.length || 0, completadas: allApts.filter(a => a.status === 'completed').length })
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

  const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Panel Administrativo</h2>
          <p className="text-sm text-slate-400 mt-0.5">{todayCap}</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard title="Citas hoy" value={stats.hoy} sub="Hoy"
          icon={Calendar} color={{ bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border border-blue-200', blob: 'bg-blue-400' }}
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Esta semana" value={stats.semana} sub="Semana"
          icon={CalendarDays} color={{ bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-50 text-violet-700 border border-violet-200', blob: 'bg-violet-400' }}
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Pendientes de confirmar" value={stats.pendientes}
          sub={stats.pendientes > 0 ? '⚠ Acción' : 'Al día'}
          icon={stats.pendientes > 0 ? AlertCircle : CheckCircle2}
          color={stats.pendientes > 0
            ? { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border border-amber-200', blob: 'bg-amber-400' }
            : { bg: 'bg-slate-50', icon: 'text-slate-400', badge: 'bg-slate-50 text-slate-500 border border-slate-200', blob: 'bg-slate-300' }}
          onClick={() => onNavigate?.('agenda')} />
        <StatCard title="Pacientes activos" value={stats.pacientes} sub="Total"
          icon={Users} color={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', blob: 'bg-emerald-400' }} />
        <StatCard title="Sesiones completadas" value={stats.completadas} sub="Próximas"
          icon={CheckCircle2} color={{ bg: 'bg-teal-50', icon: 'text-teal-600', badge: 'bg-teal-50 text-teal-700 border border-teal-200', blob: 'bg-teal-400' }} />
        <StatCard title="Canceladas" value={stats.canceladas} sub="Próximas"
          icon={XCircle} color={{ bg: 'bg-red-50', icon: 'text-red-400', badge: 'bg-red-50 text-red-600 border border-red-200', blob: 'bg-red-300' }} />
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

        {/* Próximas citas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-slate-400" />
              <h3 className="font-black text-sm text-slate-800">Próximas citas</h3>
            </div>
          </div>
          <div className="p-3 space-y-0.5 min-h-[120px]">
            {proximasCitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                <Calendar size={28} className="mb-2" />
                <p className="text-xs font-semibold text-slate-400">Sin citas próximas</p>
              </div>
            ) : (
              proximasCitas.slice(0, 6).map(apt => <AppointmentRow key={apt.id} apt={apt} />)
            )}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-50 bg-slate-50/50">
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions banner */}
      <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white overflow-hidden shadow-xl shadow-violet-200/40">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-8 -translate-x-8" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-violet-200" />
            <p className="text-xs font-black text-violet-200 uppercase tracking-widest">Acciones rápidas</p>
          </div>
          <h3 className="font-black text-lg mb-4">Gestión del centro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { icon: Calendar,    label: 'Nueva cita',              action: 'agenda' },
              { icon: CalendarDays, label: 'Cronograma semanal',     action: 'cronograma' },
              { icon: TrendingUp,  label: 'Reporte de asistencia',   action: 'reportes' },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={() => onNavigate?.(action)}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 transition-all text-sm font-bold active:scale-95 text-left"
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
