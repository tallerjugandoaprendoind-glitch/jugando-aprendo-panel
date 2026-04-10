'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, CalendarDays, Users, CheckCircle2, XCircle,
  AlertCircle, Loader2, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── KPI card — exact same style as EspecialistaHome ──────────────────────────
function KPI({ label, value, sub, icon: Icon, bar, onClick }: any) {
  return (
    <div onClick={onClick}
      className={`rounded-xl p-5 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-3 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${bar}12` }}>
          <Icon size={14} style={{ color: bar }} />
        </div>
      </div>
      <p className="text-4xl font-black leading-none pl-3 mb-1" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
      <p className="text-xs pl-3" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

// ── Appointment row ───────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'transparent' }}>
      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
        style={{ background: esHoy ? 'rgba(58,104,160,0.1)' : 'var(--muted-bg)' }}>
        <span className="text-[9px] font-black uppercase leading-none" style={{ color: esHoy ? '#3a68a0' : 'var(--text-muted)' }}>{mesCorto}</span>
        <span className="text-sm font-black leading-tight" style={{ color: esHoy ? '#3a68a0' : 'var(--text-primary)' }}>{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{apt.children?.name || apt.patient_name || 'Paciente'}</p>
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{apt.appointment_time?.slice(0, 5) || '—'} · {apt.therapist_name || 'Terapeuta'}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${s.cls}`}>{s.label}</span>
    </div>
  )
}

// ── Weekly chart ──────────────────────────────────────────────────────────────
function WeeklyChart() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i)
        return d.toISOString().split('T')[0]
      })
      const { data: apts } = await supabase.from('appointments').select('appointment_date, status').in('appointment_date', weekDates)
      setData(weekDates.map((date, i) => {
        const dayApts = (apts || []).filter(a => a.appointment_date === date)
        return {
          day: days[i],
          completadas: dayApts.filter(a => ['completed','realizada'].includes(a.status)).length,
          pendientes:  dayApts.filter(a => a.status === 'pending').length,
          canceladas:  dayApts.filter(a => a.status === 'cancelled').length,
        }
      }))
    }
    load()
  }, [])

  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} barSize={10} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} cursor={{ fill: 'var(--muted-bg)' }} />
        <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[4,4,0,0]} />
        <Bar dataKey="pendientes"  name="Pendientes"  fill="#f59e0b" radius={[4,4,0,0]} />
        <Bar dataKey="canceladas"  name="Canceladas"  fill="#f87171" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { onNavigate?: (view: string) => void }

export default function SecretariaHome({ onNavigate }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [horaActual, setHoraActual] = useState<Date | null>(null)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, pendientes: 0, canceladas: 0, pacientes: 0, completadas: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [citasRecientes, setCitasRecientes] = useState<any[]>([])

  // Clock
  useEffect(() => {
    setHoraActual(new Date())
    const timer = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
      setProximasCitas(allApts.filter(a => a.appointment_date >= hoyStr).slice(0, 8))
      setCitasRecientes(allApts.filter(a => a.appointment_date < hoyStr).slice(0, 6))
      setStats({
        hoy: allApts.filter(a => a.appointment_date === hoyStr).length,
        semana: allApts.filter(a => a.appointment_date >= lunesStr && a.appointment_date <= viernesStr).length,
        pendientes: allApts.filter(a => a.status === 'pending').length,
        canceladas: allApts.filter(a => a.status === 'cancelled').length,
        pacientes: pacientes?.length || 0,
        completadas: allApts.filter(a => ['completed','realizada'].includes(a.status)).length,
      })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const saludo = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  })()

  const diaStr = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())

  return (
    <div className="space-y-5">

      {/* Hero — igual al especialista */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0, #6355a0, #2e7a56)' }} />
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs capitalize mb-0.5" style={{ color: 'var(--text-muted)' }}>{diaStr}</p>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {saludo}, Secretaria 👋
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--muted-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                {stats.hoy} citas hoy
              </span>
              {stats.pendientes > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(176,120,48,0.1)', color: '#b07830', border: '1px solid rgba(176,120,48,0.25)' }}>
                  <AlertCircle size={10} className="inline mr-1" />{stats.pendientes} pendientes
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-5xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {horaActual ? horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{horaActual?.getSeconds()}s</p>
          </div>
        </div>
      </div>

      {/* KPIs — mismo estilo que especialista */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPI label="Citas hoy"        value={loading ? '—' : stats.hoy}         sub="Total del día"       icon={Calendar}     bar="#3a68a0" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Esta semana"      value={loading ? '—' : stats.semana}      sub="Lunes a domingo"    icon={CalendarDays} bar="#6355a0" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Pendientes"       value={loading ? '—' : stats.pendientes}  sub="Por confirmar"      icon={AlertCircle}  bar="#b07830" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Pacientes activos" value={loading ? '—' : stats.pacientes}  sub="Total registrados"  icon={Users}        bar="#2e7a56" />
        <KPI label="Completadas"      value={loading ? '—' : stats.completadas} sub="Sesiones realizadas" icon={CheckCircle2} bar="#10b981" />
        <KPI label="Canceladas"       value={loading ? '—' : stats.canceladas}  sub="Este período"       icon={XCircle}      bar="#f87171" />
      </div>

      {/* Gráfica + Citas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gráfica semanal */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Citas esta semana</h3>
            </div>
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{stats.semana} total</span>
          </div>
          <div className="p-5">
            <WeeklyChart />
            <div className="flex items-center gap-4 mt-3 text-[11px]">
              {[{ color: '#10b981', label: 'Completadas' }, { color: '#f59e0b', label: 'Pendientes' }, { color: '#f87171', label: 'Canceladas' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Citas recientes */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2.5">
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                {proximasCitas.length > 0 ? 'Próximas citas' : 'Citas recientes'}
              </h3>
            </div>
          </div>
          <div className="p-3 space-y-0.5 min-h-[180px]">
            {(proximasCitas.length > 0 ? proximasCitas : citasRecientes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Calendar size={28} className="mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Sin citas registradas</p>
              </div>
            ) : (proximasCitas.length > 0 ? proximasCitas : citasRecientes).slice(0, 6).map(apt =>
              <AppointmentRow key={apt.id} apt={apt} />
            )}
          </div>
          <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--card-border)', background: 'var(--muted-bg)' }}>
            <button onClick={() => onNavigate?.('agenda')} className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: '#3a68a0' }}>
              Ver agenda completa <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
