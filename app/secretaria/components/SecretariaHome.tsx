'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, CalendarDays, Users, CheckCircle2, XCircle,
  AlertCircle, Loader2, ArrowRight, DollarSign, MessageSquare, BarChart3, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, bar, onClick }: any) {
  return (
    <div onClick={onClick}
      className={`rounded-xl p-5 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-3 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${bar}12` }}>
          <Icon size={14} style={{ color: bar }} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black leading-none pl-3 mb-1 break-all" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
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
  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Confirmada', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    pending:   { label: 'Pendiente',  color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
    cancelled: { label: 'Cancelada',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
    completed: { label: 'Completada', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    realizada: { label: 'Realizada',  color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  }
  const s = statusCfg[apt.status] || { label: apt.status, color: '#6b7280', bg: 'var(--muted-bg)' }
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity">
      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: esHoy ? 'rgba(58,104,160,0.12)' : 'var(--muted-bg)' }}>
        <span className="text-[9px] font-black uppercase leading-none" style={{ color: esHoy ? '#3a68a0' : 'var(--text-muted)' }}>{mesCorto}</span>
        <span className="text-sm font-black leading-tight" style={{ color: esHoy ? '#3a68a0' : 'var(--text-primary)' }}>{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{apt.children?.name || apt.patient_name || 'Paciente'}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{apt.appointment_time?.slice(0, 5) || '—'} · {apt.therapist_name || 'Terapeuta'}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
        style={{ color: s.color, background: s.bg }}>{s.label}</span>
    </div>
  )
}

// ── Weekly chart — compacto y limpio ─────────────────────────────────────────
function WeeklyChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
        const today = new Date()
        const dow   = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
        const weekDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday); d.setDate(monday.getDate() + i)
          return d.toISOString().split('T')[0]
        })
        const { data: apts } = await supabase
          .from('appointments').select('appointment_date, status')
          .in('appointment_date', weekDates)
        const todayStr = today.toISOString().split('T')[0]
        const rows = weekDates.map((date, i) => {
          const da = (apts || []).filter(a => a.appointment_date === date)
          return {
            day: DAYS[i],
            dayNum: new Date(date + 'T12:00:00').getDate(),
            date, isToday: date === todayStr, isPast: date < todayStr,
            total:       da.length,
            completadas: da.filter(a => ['completed','realizada'].includes(a.status)).length,
            pendientes:  da.filter(a => a.status === 'pending').length,
            canceladas:  da.filter(a => a.status === 'cancelled').length,
          }
        })
        setData(rows)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const max = Math.max(...data.map(d => d.total), 1)
  const total    = data.reduce((s, d) => s + d.total, 0)
  const compTotal = data.reduce((s, d) => s + d.completadas, 0)
  const pendTotal = data.reduce((s, d) => s + d.pendientes, 0)
  const cancTotal = data.reduce((s, d) => s + d.canceladas, 0)

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Barras verticales compactas */}
      <div className="flex items-end gap-1.5" style={{ height: 72 }}>
        {data.map(d => {
          const barH = d.total > 0 ? Math.max((d.total / max) * 56, 10) : 0
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
              {/* Número encima solo si tiene citas */}
              <span className="text-[10px] font-black" style={{ color: 'var(--text-primary)', opacity: d.total > 0 ? 1 : 0 }}>
                {d.total}
              </span>
              {/* Barra o línea vacía */}
              <div className="w-full flex flex-col justify-end" style={{ height: 56 }}>
                {d.total > 0 ? (
                  <div className="w-full rounded-md overflow-hidden flex flex-col-reverse transition-all"
                    style={{ height: barH }}>
                    <div style={{ flex: d.completadas || 0, background: '#10b981', minHeight: d.completadas > 0 ? 3 : 0 }} />
                    <div style={{ flex: d.pendientes  || 0, background: '#f59e0b', minHeight: d.pendientes  > 0 ? 3 : 0 }} />
                    <div style={{ flex: d.canceladas  || 0, background: '#f87171', minHeight: d.canceladas  > 0 ? 3 : 0 }} />
                  </div>
                ) : (
                  <div className="w-full rounded-sm" style={{
                    height: 3,
                    background: d.isToday ? 'rgba(59,130,246,0.3)' : 'var(--card-border)',
                  }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Etiquetas de días */}
      <div className="flex gap-1.5">
        {data.map(d => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5" style={{ minWidth: 0 }}>
            <span className="text-[10px] font-black" style={{
              color: d.isToday ? '#3b82f6' : 'var(--text-muted)',
            }}>{d.day}</span>
            {d.isToday && (
              <span className="text-[9px] font-black px-1 rounded-sm"
                style={{ background: '#3b82f6', color: '#fff', lineHeight: '13px' }}>
                {d.dayNum}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda + resumen en una fila */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-3">
          {[{ c: '#10b981', l: 'OK' }, { c: '#f59e0b', l: 'Pend' }, { c: '#f87171', l: 'Canc' }].map(x => (
            <div key={x.l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: x.c }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{x.l}</span>
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-black">
            <span style={{ color: '#10b981' }}>{compTotal} ✓</span>
            {pendTotal > 0 && <span style={{ color: '#f59e0b' }}>{pendTotal} ⏳</span>}
            {cancTotal > 0 && <span style={{ color: '#f87171' }}>{cancTotal} ✗</span>}
          </div>
        )}
      </div>
    </div>
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
        completadas: allApts.filter(a => ['completed', 'realizada'].includes(a.status)).length,
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

      {/* Hero */}
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPI label="Citas hoy"         value={loading ? '—' : stats.hoy}         sub="Total del día"        icon={Calendar}     bar="#3a68a0" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Esta semana"       value={loading ? '—' : stats.semana}      sub="Lunes a domingo"     icon={CalendarDays} bar="#6355a0" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Pendientes"        value={loading ? '—' : stats.pendientes}  sub="Por confirmar"       icon={AlertCircle}  bar="#b07830" onClick={() => onNavigate?.('agenda')} />
        <KPI label="Pacientes activos" value={loading ? '—' : stats.pacientes}   sub="Total registrados"   icon={Users}        bar="#2e7a56" />
        <KPI label="Completadas"       value={loading ? '—' : stats.completadas} sub="Sesiones realizadas"  icon={CheckCircle2} bar="#10b981" />
        <KPI label="Canceladas"        value={loading ? '—' : stats.canceladas}  sub="Este período"        icon={XCircle}      bar="#f87171" />
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
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--muted-bg)', color: 'var(--text-muted)' }}>
              {stats.semana} total
            </span>
          </div>
          <div className="px-5 py-4">
            <WeeklyChart />
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
          <div className="p-3 space-y-0.5">
            {(proximasCitas.length > 0 ? proximasCitas : citasRecientes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar size={28} className="mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Sin citas registradas</p>
              </div>
            ) : (proximasCitas.length > 0 ? proximasCitas : citasRecientes).slice(0, 6).map(apt =>
              <AppointmentRow key={apt.id} apt={apt} />
            )}
          </div>
          <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--card-border)', background: 'var(--muted-bg)' }}>
            <button onClick={() => onNavigate?.('agenda')}
              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: '#3a68a0' }}>
              Ver agenda completa <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Acceso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Calendar,      label: 'Agenda',        sub: 'Citas y calendario',      action: 'agenda',       color: '#3a68a0' },
          { icon: MessageSquare, label: 'Comunicación',  sub: 'Recordatorios a familias', action: 'comunicacion', color: '#8b5cf6' },
          { icon: DollarSign,    label: 'Pagos',         sub: 'Ingresos y facturación',   action: 'pagos',        color: '#10b981' },
          { icon: BarChart3,     label: 'Reportes',      sub: 'Asistencia y estadísticas', action: 'reportes',    color: '#f59e0b' },
        ].map(({ icon: Icon, label, sub, action, color }) => (
          <button key={label} onClick={() => onNavigate?.(action)}
            className="rounded-xl p-4 text-left flex items-center gap-3 hover:shadow-sm transition-all group active:scale-[0.98]"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
            <ArrowRight size={12} className="flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}
