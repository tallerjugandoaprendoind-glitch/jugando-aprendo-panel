'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, CalendarDays, Users, CheckCircle2, XCircle,
  ChevronRight, Loader2, AlertCircle, Plus, BarChart3,
  ArrowRight, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/components/ThemeContext'

function WeeklyChart({ isDark }: { isDark: boolean }) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d.toISOString().split('T')[0]
      })

      const { data: apts } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .in('appointment_date', weekDates)

      const result = weekDates.map((date, i) => {
        const dayApts = (apts || []).filter(a => a.appointment_date === date)
        return {
          day: days[i],
          completadas: dayApts.filter(a => ['completed','realizada'].includes(a.status)).length,
          pendientes:  dayApts.filter(a => a.status === 'pending').length,
          canceladas:  dayApts.filter(a => a.status === 'cancelled').length,
        }
      })
      setData(result)
    }
    load()
  }, [])

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={10} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#21262d' : '#f1f5f9'} vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: isDark ? '#161b22' : '#fff', border: `1px solid ${isDark ? '#21262d' : '#e2e8f0'}`, borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 700 }}
          cursor={{ fill: isDark ? '#21262d' : '#f8fafc' }}
        />
        <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[4,4,0,0]} />
        <Bar dataKey="pendientes"  name="Pendientes"  fill="#f59e0b" radius={[4,4,0,0]} />
        <Bar dataKey="canceladas"  name="Canceladas"  fill="#f87171" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function AppointmentRow({ apt, isDark }: { apt: any; isDark: boolean }) {
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
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'}`}>
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0
        ${esHoy ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50' : isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>
        <span className={`text-[9px] font-black uppercase leading-none ${esHoy ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>{mesCorto}</span>
        <span className={`text-sm font-black leading-tight ${esHoy ? 'text-indigo-600' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{apt.children?.name || apt.patient_name || 'Paciente'}</p>
        <p className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{apt.appointment_time?.slice(0, 5) || '—'} · {apt.therapist_name || 'Terapeuta'}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${s.cls}`}>{s.label}</span>
    </div>
  )
}

interface Props { onNavigate?: (view: string) => void }

export default function SecretariaHome({ onNavigate }: Props) {
  const toast = useToast()
  const { isDark } = useTheme()
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
      const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)
      const { data: todas } = await supabase.from('appointments').select('*, children(name)').gte('appointment_date', hace30.toISOString().split('T')[0]).order('appointment_date', { ascending: false }).limit(200)
      const { data: pacientes } = await supabase.from('children').select('id').eq('is_active', true)
      const allApts = todas || []
      const hoy = allApts.filter(a => a.appointment_date === hoyStr)
      setCitasHoy(hoy)
      setProximasCitas(allApts.filter(a => a.appointment_date >= hoyStr).slice(0, 8))
      setCitasRecientes(allApts.filter(a => a.appointment_date < hoyStr).slice(0, 6))
      setStats({
        hoy: hoy.length,
        semana: allApts.filter(a => a.appointment_date >= lunesStr && a.appointment_date <= viernesStr).length,
        pendientes: allApts.filter(a => a.status === 'pending').length,
        canceladas: allApts.filter(a => a.status === 'cancelled').length,
        pacientes: pacientes?.length || 0,
        completadas: allApts.filter(a => a.status === 'completed' || a.status === 'realizada').length,
      })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={22} className="animate-spin text-blue-500" />
    </div>
  )

  const cc = {
    card: isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200',
    txt1: isDark ? 'text-slate-100' : 'text-slate-800',
    txt3: isDark ? 'text-slate-500' : 'text-slate-400',
    divider: isDark ? 'border-[#21262d]' : 'border-slate-100',
    footer: isDark ? 'border-[#21262d] bg-[#0d1117]/50' : 'border-slate-50 bg-slate-50/50',
  }

  const statItems = [
    { label: 'Citas hoy',        value: stats.hoy,         icon: Calendar,     color: 'text-blue-500',    bg: isDark ? 'bg-blue-900/20'    : 'bg-blue-50',    action: 'agenda' },
    { label: 'Esta semana',       value: stats.semana,      icon: CalendarDays, color: 'text-indigo-500',  bg: isDark ? 'bg-indigo-900/20'  : 'bg-indigo-50',  action: 'agenda' },
    { label: 'Pendientes',        value: stats.pendientes,  icon: AlertCircle,  color: 'text-amber-500',   bg: isDark ? 'bg-amber-900/20'   : 'bg-amber-50',   action: 'agenda' },
    { label: 'Pacientes activos', value: stats.pacientes,   icon: Users,        color: 'text-emerald-500', bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50', action: undefined },
    { label: 'Completadas',       value: stats.completadas, icon: CheckCircle2, color: 'text-teal-500',    bg: isDark ? 'bg-teal-900/20'    : 'bg-teal-50',    action: undefined },
    { label: 'Canceladas',        value: stats.canceladas,  icon: XCircle,      color: 'text-rose-500',    bg: isDark ? 'bg-rose-900/20'    : 'bg-rose-50',    action: undefined },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className={`${cc.card} border rounded-2xl p-5 flex items-center justify-between`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${cc.txt3}`}>Panel Administrativo</p>
          <h2 className={`text-xl font-black ${cc.txt1}`}>Bienvenida 👋</h2>
          <p className={`text-sm mt-0.5 ${cc.txt3}`}>
            {(() => { const s = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1) })()}
          </p>
        </div>
        <button onClick={cargar}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all
            ${isDark ? 'border-[#30363d] text-slate-400 hover:bg-[#21262d]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statItems.map(({ label, value, icon: Icon, color, bg, action }) => (
          <button key={label} onClick={() => action && onNavigate?.(action)}
            className={`${cc.card} border rounded-2xl p-4 text-left transition-all hover:shadow-sm ${action ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className={`text-2xl font-black ${cc.txt1}`}>{value}</p>
            <p className={`text-xs font-medium mt-0.5 ${cc.txt3}`}>{label}</p>
          </button>
        ))}
      </div>

      {/* Chart + Citas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gráfica semanal */}
        <div className={`${cc.card} border rounded-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${cc.divider}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className={`font-black text-sm ${cc.txt1}`}>Citas esta semana</h3>
            </div>
            <span className={`text-[11px] font-bold ${cc.txt3}`}>{stats.semana} total</span>
          </div>
          <div className="p-5">
            <WeeklyChart isDark={isDark} />
          </div>
          <div className={`px-5 py-3 border-t ${cc.footer}`}>
            <div className="flex items-center gap-4 text-[11px]">
              {[
                { color: 'bg-emerald-500', label: 'Completadas' },
                { color: 'bg-amber-400',  label: 'Pendientes' },
                { color: 'bg-red-400',    label: 'Canceladas' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className={cc.txt3}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Citas recientes */}
        <div className={`${cc.card} border rounded-2xl overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${cc.divider}`}>
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className={cc.txt3} />
              <h3 className={`font-black text-sm ${cc.txt1}`}>{proximasCitas.length > 0 ? 'Próximas citas' : 'Citas recientes'}</h3>
            </div>
          </div>
          <div className="p-3 space-y-0.5 min-h-[120px]">
            {(proximasCitas.length > 0 ? proximasCitas : citasRecientes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar size={28} className={`mb-2 ${cc.txt3}`} />
                <p className={`text-xs font-semibold ${cc.txt3}`}>Sin citas registradas</p>
              </div>
            ) : (proximasCitas.length > 0 ? proximasCitas : citasRecientes).slice(0, 6).map(apt =>
              <AppointmentRow key={apt.id} apt={apt} isDark={isDark} />
            )}
          </div>
          <div className={`px-5 py-2.5 border-t ${cc.footer}`}>
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Plus,         label: 'Nueva cita',  sub: 'Agendar sesión',       action: 'agenda',     color: 'text-blue-500',    bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50' },
          { icon: CalendarDays, label: 'Cronograma',  sub: 'Ver semana completa',   action: 'cronograma', color: 'text-indigo-500',  bg: isDark ? 'bg-indigo-900/20' : 'bg-indigo-50' },
          { icon: BarChart3,    label: 'Reportes',    sub: 'Asistencia y métricas', action: 'reportes',   color: 'text-emerald-500', bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50' },
        ].map(({ icon: Icon, label, sub, action, color, bg }) => (
          <button key={label} onClick={() => onNavigate?.(action)}
            className={`${cc.card} border rounded-2xl p-4 text-left flex items-center gap-4 hover:shadow-sm transition-all group active:scale-[0.98]`}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-black ${cc.txt1}`}>{label}</p>
              <p className={`text-[11px] font-medium ${cc.txt3}`}>{sub}</p>
            </div>
            <ChevronRight size={14} className={`flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${cc.txt3}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
