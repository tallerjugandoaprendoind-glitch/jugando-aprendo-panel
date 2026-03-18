'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import {
  Calendar, Clock, Users, CheckCircle2, XCircle,
  ChevronRight, Loader2, AlertTriangle, TrendingUp,
  RefreshCw, CalendarDays, Timer, Bell, ArrowRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function StatCard({ title, value, sub, icon: Icon, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border shadow-sm transition-all duration-200 bg-white border-slate-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color.bg}`}>
          <Icon size={18} className={color.icon} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${color.badge}`}>
          {sub}
        </span>
      </div>
      <p className="text-3xl font-black mb-1 text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-400">{title}</p>
    </div>
  )
}

function UpcomingRow({ apt }: { apt: any }) {
  const fecha = new Date(apt.appointment_date + 'T00:00:00')
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const dia = fecha.getDate()
  const esHoy = apt.appointment_date === new Date().toISOString().split('T')[0]

  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${esHoy ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'}`}>
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 ${esHoy ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <span className="text-[9px] font-bold leading-none">{mesCorto}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-slate-800">{apt.children?.name || '—'}</p>
        <p className="text-xs flex items-center gap-1 mt-0.5 text-slate-400">
          <Clock size={10} /> {apt.appointment_time?.slice(0, 5)}
          {esHoy && <span className="ml-1 text-blue-600 font-bold">• Hoy</span>}
          {apt.service_type && <span className="ml-1 truncate">· {apt.service_type}</span>}
        </p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusColors[apt.status] || 'bg-slate-100 text-slate-600'}`}>
        {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'pending' ? 'Pendiente' : apt.status === 'cancelled' ? 'Cancelada' : apt.status === 'completed' ? 'Completada' : apt.status}
      </span>
    </div>
  )
}

export default function SecretariaHome({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    hoy: 0, semana: 0, pendientes: 0, canceladas: 0,
    pacientes: 0, completadas: 0
  })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [citasHoy, setCitasHoy] = useState<any[]>([])

  const cargar = async () => {
    setLoading(true)
    try {
      const hoyStr = new Date().toISOString().split('T')[0]
      const lunesStr = (() => {
        const d = new Date(); const day = d.getDay()
        d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
        return d.toISOString().split('T')[0]
      })()
      const viernesStr = (() => {
        const d = new Date(); const day = d.getDay()
        d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day))
        return d.toISOString().split('T')[0]
      })()

      const { data: todas } = await supabase
        .from('appointments')
        .select('*, children(name)')
        .gte('appointment_date', hoyStr)
        .order('appointment_date')
        .order('appointment_time')
        .limit(100)

      const { data: pacientes } = await supabase
        .from('children')
        .select('id')
        .eq('is_active', true)

      const allApts = todas || []
      const hoy = allApts.filter(a => a.appointment_date === hoyStr)
      const semana = allApts.filter(a => a.appointment_date >= lunesStr && a.appointment_date <= viernesStr)

      setCitasHoy(hoy)
      setProximasCitas(allApts.slice(0, 8))
      setStats({
        hoy: hoy.length,
        semana: semana.length,
        pendientes: allApts.filter(a => a.status === 'pending').length,
        canceladas: allApts.filter(a => a.status === 'cancelled').length,
        pacientes: pacientes?.length || 0,
        completadas: allApts.filter(a => a.status === 'completed').length,
      })
    } catch (e: any) {
      toast.error('Error cargando datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-violet-500" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Panel Administrativo</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gestión de citas y cronogramas · Jugando Aprendo</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Citas hoy"
          value={stats.hoy}
          sub="Hoy"
          icon={Calendar}
          color={{ bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' }}
          onClick={() => onNavigate?.('agenda')}
        />
        <StatCard
          title="Esta semana"
          value={stats.semana}
          sub="Semana"
          icon={CalendarDays}
          color={{ bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' }}
          onClick={() => onNavigate?.('agenda')}
        />
        <StatCard
          title="Pendientes de confirmar"
          value={stats.pendientes}
          sub={stats.pendientes > 0 ? '⚠️ Acción' : 'OK'}
          icon={Bell}
          color={{ bg: stats.pendientes > 0 ? 'bg-amber-50' : 'bg-slate-50', icon: stats.pendientes > 0 ? 'text-amber-600' : 'text-slate-400', badge: stats.pendientes > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500' }}
          onClick={() => onNavigate?.('agenda')}
        />
        <StatCard
          title="Pacientes activos"
          value={stats.pacientes}
          sub="Total"
          icon={Users}
          color={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' }}
        />
        <StatCard
          title="Sesiones completadas"
          value={stats.completadas}
          sub="Próximas"
          icon={CheckCircle2}
          color={{ bg: 'bg-teal-50', icon: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' }}
        />
        <StatCard
          title="Canceladas"
          value={stats.canceladas}
          sub="Próximas"
          icon={XCircle}
          color={{ bg: 'bg-red-50', icon: 'text-red-400', badge: 'bg-red-100 text-red-600' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Citas de hoy */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-black text-sm text-slate-800">Citas de hoy</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="p-3 space-y-1">
            {citasHoy.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No hay citas programadas para hoy</p>
              </div>
            ) : (
              citasHoy.map(apt => <UpcomingRow key={apt.id} apt={apt} />)
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              Ver agenda completa <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Próximas citas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-800">Próximas citas programadas</h3>
          </div>
          <div className="p-3 space-y-1">
            {proximasCitas.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No hay citas próximas</p>
              </div>
            ) : (
              proximasCitas.slice(0, 6).map(apt => <UpcomingRow key={apt.id} apt={apt} />)
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* Quick actions */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-200">
        <h3 className="font-black text-lg mb-1">Acciones rápidas</h3>
        <p className="text-violet-200 text-sm mb-4">Gestiona la agenda del centro desde aquí</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Nueva cita', action: 'agenda' },
            { icon: CalendarDays, label: 'Cronograma semanal', action: 'cronograma' },
            { icon: TrendingUp, label: 'Reporte de asistencia', action: 'reportes' },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={() => onNavigate?.(action)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-3 transition-all text-sm font-bold"
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
