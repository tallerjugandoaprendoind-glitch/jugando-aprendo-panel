'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, CalendarDays, Users, CheckCircle2, XCircle,
  AlertCircle, Loader2, ArrowRight, Clock, ChevronRight,
  TrendingUp, Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── AppointmentRow ────────────────────────────────────────────────────────────
function AppointmentRow({ apt }: { apt: any }) {
  const fecha = new Date(apt.appointment_date + 'T00:00:00')
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).replace('.', '').toUpperCase()
  const dia = fecha.getDate()
  const esHoy = apt.appointment_date === new Date().toISOString().split('T')[0]

  const statusCfg: Record<string, { label: string; dot: string }> = {
    confirmed: { label: 'Confirmada', dot: '#10b981' },
    pending:   { label: 'Pendiente',  dot: '#f59e0b' },
    cancelled: { label: 'Cancelada',  dot: '#ef4444' },
    completed: { label: 'Completada', dot: '#3b82f6' },
    realizada: { label: 'Realizada',  dot: '#3b82f6' },
  }
  const s = statusCfg[apt.status] || { label: apt.status, dot: '#9ca3af' }

  return (
    <div className="flex items-center gap-3 py-3 px-4"
      style={{ borderBottom: '1px solid var(--card-border)' }}>
      {/* Fecha pill */}
      <div className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: esHoy ? '#3b82f6' : 'var(--muted-bg)' }}>
        <span className="text-[9px] font-black uppercase leading-none"
          style={{ color: esHoy ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>{mesCorto}</span>
        <span className="text-sm font-black leading-tight"
          style={{ color: esHoy ? '#fff' : 'var(--text-primary)' }}>{dia}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
          {apt.children?.name || apt.patient_name || 'Paciente'}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {apt.appointment_time?.slice(0, 5) || '—'} · {apt.therapist_name || 'Terapeuta'}
        </p>
      </div>

      {/* Status dot + label */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
        <span className="text-[11px] font-semibold" style={{ color: s.dot }}>{s.label}</span>
      </div>
    </div>
  )
}

// ── WeeklyMiniChart ───────────────────────────────────────────────────────────
function WeeklyMiniChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const DAYS = ['L','M','X','J','V','S','D']
        const today = new Date()
        const dow = today.getDay()
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
            day: DAYS[i], date, isToday: date === todayStr,
            total: da.length,
            ok:   da.filter(a => ['completed','realizada','confirmed'].includes(a.status)).length,
            pend: da.filter(a => a.status === 'pending').length,
            canc: da.filter(a => a.status === 'cancelled').length,
          }
        })
        setData(rows)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center py-4">
      <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  )

  const max = Math.max(...data.map(d => d.total), 1)

  return (
    <div className="flex items-end gap-2 px-1" style={{ height: 60 }}>
      {data.map(d => {
        const barH = d.total > 0 ? Math.max((d.total / max) * 40, 6) : 0
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            {d.total > 0 && (
              <span className="text-[10px] font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {d.total}
              </span>
            )}
            <div className="flex flex-col justify-end w-full" style={{ height: 40 }}>
              {d.total > 0 ? (
                <div className="w-full rounded-md overflow-hidden"
                  style={{
                    height: barH,
                    background: d.isToday ? '#3b82f6' : '#10b981',
                    opacity: d.isToday ? 1 : 0.7
                  }} />
              ) : (
                <div className="w-full rounded-sm" style={{
                  height: 3,
                  background: d.isToday ? 'rgba(59,130,246,0.4)' : 'var(--card-border)'
                }} />
              )}
            </div>
            <span className="text-[10px] font-black"
              style={{ color: d.isToday ? '#3b82f6' : 'var(--text-muted)' }}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { onNavigate?: (view: string) => void }

export default function SecretariaHome({ onNavigate }: Props) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [horaActual, setHoraActual] = useState<Date | null>(null)
  const [stats, setStats] = useState({
    hoy: 0, semana: 0, pendientes: 0, canceladas: 0, pacientes: 0, completadas: 0
  })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [citasRecientes, setCitasRecientes] = useState<any[]>([])

  useEffect(() => {
    setHoraActual(new Date())
    const t = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const cargar = async () => {
    setLoading(true)
    try {
      const hoyStr = new Date().toISOString().split('T')[0]
      const d = new Date(); const day = d.getDay()
      const lunesStr = (() => { const x = new Date(d); x.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return x.toISOString().split('T')[0] })()
      const viernesStr = (() => { const x = new Date(d); x.setDate(d.getDate() + (day === 0 ? 0 : 7 - day)); return x.toISOString().split('T')[0] })()
      const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)

      const { data: todas } = await supabase
        .from('appointments').select('*, children(name)')
        .gte('appointment_date', hace30.toISOString().split('T')[0])
        .order('appointment_date', { ascending: false }).limit(200)
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

  const hoyStr = new Date().toISOString().split('T')[0]
  const citasHoy = (proximasCitas.length > 0 ? proximasCitas : citasRecientes)
    .filter(a => a.appointment_date === hoyStr)
  const listaCitas = proximasCitas.length > 0 ? proximasCitas : citasRecientes

  return (
    <div className="pb-6 space-y-4">

      {/* ── HERO CARD ── */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200 mb-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
              .replace(/^\w/, c => c.toUpperCase())}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[22px] font-black text-white leading-tight">
                {saludo} 👋
              </h2>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {loading ? '—' : stats.hoy} citas hoy
                </span>
                {!loading && stats.pendientes > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.25)', color: '#fde68a' }}>
                    ⚠ {stats.pendientes} pendientes
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black tabular-nums text-white leading-none">
                {horaActual ? horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
              <p className="text-[11px] text-blue-300 mt-0.5 tabular-nums">
                {horaActual ? String(horaActual.getSeconds()).padStart(2, '0') + 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Mini stats strip */}
        <div className="grid grid-cols-3 divide-x"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)', divideColor: 'rgba(255,255,255,0.12)' }}>
          {[
            { label: 'Esta semana', value: stats.semana, icon: '📅' },
            { label: 'Completadas', value: stats.completadas, icon: '✅' },
            { label: 'Pacientes',   value: stats.pacientes,   icon: '👥' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex flex-col items-center py-3 px-2">
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-lg font-black text-white tabular-nums mt-0.5">
                {loading ? '—' : value}
              </span>
              <span className="text-[10px] text-blue-200 mt-0.5 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI GRID 2x2 ── */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Citas hoy',   value: stats.hoy,         icon: Calendar,     color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  nav: 'agenda' },
          { label: 'Pendientes',  value: stats.pendientes,  icon: AlertCircle,  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  nav: 'agenda' },
          { label: 'Canceladas',  value: stats.canceladas,  icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   nav: undefined },
          { label: 'Completadas', value: stats.completadas, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.08)',  nav: undefined },
        ].map(({ label, value, icon: Icon, color, bg, nav }) => (
          <button key={label}
            onClick={() => nav && onNavigate?.(nav)}
            className="rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="text-2xl font-black tabular-nums" style={{ color: loading ? 'var(--text-muted)' : color }}>
              {loading ? '—' : value}
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* ── GRÁFICA SEMANAL ── */}
      <div className="mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={15} style={{ color: '#3b82f6' }} />
            <h3 className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>
              Actividad semanal
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            {loading ? '—' : stats.semana} citas
          </span>
        </div>
        <div className="px-4 pb-4">
          <WeeklyMiniChart />
        </div>
      </div>

      {/* ── CITAS DE HOY ── */}
      <div className="mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: '#3b82f6' }} />
            <h3 className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>
              Hoy
            </h3>
            {citasHoy.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: '#3b82f6', color: '#fff' }}>
                {citasHoy.length}
              </span>
            )}
          </div>
          <button onClick={() => onNavigate?.('agenda')}
            className="flex items-center gap-1 text-[11px] font-bold"
            style={{ color: '#3b82f6' }}>
            Ver agenda <ChevronRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : citasHoy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--muted-bg)' }}>
              <Calendar size={22} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Sin citas para hoy</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Disfruta el día libre 🎉</p>
          </div>
        ) : (
          <div>
            {citasHoy.slice(0, 5).map(apt => <AppointmentRow key={apt.id} apt={apt} />)}
          </div>
        )}
      </div>

      {/* ── PRÓXIMAS / RECIENTES ── */}
      <div className="mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>
              {proximasCitas.length > 0 ? 'Próximas citas' : 'Citas recientes'}
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : listaCitas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Calendar size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Sin citas registradas</p>
          </div>
        ) : (
          <div>
            {listaCitas.slice(0, 6).map(apt => <AppointmentRow key={apt.id} apt={apt} />)}
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--card-border)', background: 'var(--muted-bg)' }}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {listaCitas.length > 6 ? `+${listaCitas.length - 6} más` : `${listaCitas.length} citas`}
          </span>
          <button onClick={() => onNavigate?.('agenda')}
            className="flex items-center gap-1 text-[12px] font-bold transition-opacity hover:opacity-70"
            style={{ color: '#3b82f6' }}>
            Ver agenda completa <ArrowRight size={12} />
          </button>
        </div>
      </div>

    </div>
  )
}
