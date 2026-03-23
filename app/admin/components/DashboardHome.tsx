'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import {
  Activity, Brain, Calendar, ChevronRight, Clock,
  Users, AlertTriangle, TrendingUp, MessageCircle,
  AlertCircle, CheckCircle2, Bell, Sparkles, BarChart3,
  ArrowUpRight, Target, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Donut chart SVG ──────────────────────────────────────────────────────────
function DonutChart({ value, total, color, size = 56 }: { value: number; total: number; color: string; size?: number }) {
  const r = size / 2 - 5
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(value / total, 1) : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--muted-bg)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transform: `rotate(-90deg)`, transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight="800" fill={color}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ values, color, labels }: { values: number[]; color: string; labels?: string[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => {
        const isLast = i === values.length - 1
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full rounded-sm transition-all duration-500"
              style={{ height: `${Math.max(2, (v / max) * 36)}px`, background: isLast ? color : `${color}50` }} />
            {labels && <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{labels[i]}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, bar, urgent, onClick, extra }: any) {
  return (
    <div onClick={onClick}
      className={`rounded-xl p-4 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ background: 'var(--card)', border: urgent ? `1px solid ${bar}40` : '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-2">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-black leading-none mb-1" style={{ color: urgent ? bar : 'var(--text-primary)' }}>{value}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${bar}12` }}>
          <Icon size={16} style={{ color: bar }} />
        </div>
      </div>
      {extra}
    </div>
  )
}

// ─── Alerta row ───────────────────────────────────────────────────────────────
function AlertaRow({ tipo, paciente, mensaje, onClick }: any) {
  const bar = tipo === 'sin_sesion' ? '#b07830' : tipo === 'bienestar_bajo' ? '#3a68a0' : '#c0524a'
  const icon = tipo === 'sin_sesion' ? '○' : tipo === 'bienestar_bajo' ? '◇' : '△'
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:opacity-80"
      style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${bar}` }}>
      <span className="text-[10px] font-black w-3 flex-shrink-0" style={{ color: bar }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wider mb-0.5" style={{ color: bar }}>
          {tipo === 'sin_sesion' ? 'Sin sesión 30d' : tipo === 'bienestar_bajo' ? 'Bienestar' : 'Sin cita'}
        </p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{paciente}</p>
      </div>
      <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
    </button>
  )
}

// ─── Cita row ─────────────────────────────────────────────────────────────────
function CitaRow({ cita }: { cita: any }) {
  const esHoy = cita.appointment_date === new Date().toISOString().split('T')[0]
  const fecha = new Date(cita.appointment_date + 'T00:00:00')
  const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const dia = fecha.getDate()
  return (
    <div className="flex items-center gap-3 py-2.5"
      style={{ borderBottom: '1px solid var(--card-border)' }}>
      <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-xs"
        style={{ background: esHoy ? '#3a68a0' : 'var(--muted-bg)', color: esHoy ? '#fff' : 'var(--text-secondary)' }}>
        <span className="text-[7px] font-bold leading-none">{mes}</span>
        <span className="font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{cita.children?.name || 'Paciente'}</p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <Clock size={8} className="inline mr-1" />{cita.appointment_time?.slice(0, 5)}
          {esHoy && <span className="font-bold ml-1" style={{ color: '#3a68a0' }}>· Hoy</span>}
        </p>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const { t, locale } = useI18n()

  const [stats, setStats] = useState({
    pacientes: 0, sesionesHoy: 0, sinSesion30d: 0,
    mensajesPendientes: 0, analisisIA: 0, completados7d: 0,
    programasActivos: 0, objetivosCompletos: 0,
  })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [alertasClinicas, setAlertasClinicas] = useState<any[]>([])
  const [sesionesSemanales, setSesionesSemanales] = useState<number[]>([0,0,0,0,0,0,0])
  const [diasLabels, setDiasLabels] = useState<string[]>([])
  const [progresoPacientes, setProgresoPacientes] = useState<{ name: string; pct: number; color: string }[]>([])
  const [horaActual, setHoraActual] = useState<Date | null>(null)
  const [diaStr, setDiaStr] = useState('')
  const [saludo, setSaludo] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setHoraActual(now)
      setSaludo(now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches')
      setDiaStr(now.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [locale])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    // Build 7-day labels
    const labels: string[] = []
    const datesArr: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      labels.push(d.toLocaleDateString('es', { weekday: 'short' }).charAt(0).toUpperCase())
      datesArr.push(d.toISOString().split('T')[0])
    }
    setDiasLabels(labels)

    const [
      { count: pacientes },
      { data: citasHoy },
      { data: citas },
      { data: actividad },
      { data: sesV2_30d },
      { data: sesABA_30d },
      { data: todosNinos },
      { count: mensajesPendientes },
      { data: analisis },
      { data: sesCompletas },
      { data: programas },
      { data: objetivos },
    ] = await Promise.all([
      supabase.from('children').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*').eq('appointment_date', hoy).in('status', ['confirmed', 'pending']),
      supabase.from('appointments').select('*, children(name)').gte('appointment_date', hoy).neq('status', 'cancelled').neq('status', 'completed').order('appointment_date').order('appointment_time').limit(5),
      // Actividad reciente — try join, fallback handled below
      supabase.from('registro_aba').select('id, child_id, fecha_sesion, datos, created_at').order('fecha_sesion', { ascending: false }).limit(10),
      // FIX: fetch BOTH tables to detect who has had a session in last 30 days
      supabase.from('aba_sessions_v2').select('child_id').gte('session_date', hace30),
      supabase.from('registro_aba').select('child_id, fecha_sesion').gte('fecha_sesion', hace30),
      supabase.from('children').select('id, name'),
      supabase.from('parent_message_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('registro_aba').select('*').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(50),
      supabase.from('appointments').select('*').eq('status', 'completed').gte('appointment_date', datesArr[0]),
      supabase.from('programas_aba').select('id, estado, child_id').eq('estado', 'activo'),
      supabase.from('objetivos_cp').select('id, estado').eq('estado', 'dominado'),
    ])

    // Manual name enrichment — join actividad with todosNinos by child_id
    const ninosMap: Record<string, string> = {}
    ;(todosNinos || []).forEach((n: any) => { ninosMap[n.id] = n.name })
    const actividadEnriquecida = (actividad || []).map((a: any) => ({
      ...a,
      children: { name: ninosMap[a.child_id] || 'Paciente' }
    }))

    // Sesiones por día (últimos 7 días) — usar sesABA_30d filtrado
    const diasMap: Record<string, number> = {}
    datesArr.forEach(d => { diasMap[d] = 0 })
    ;(sesABA_30d || []).forEach((s: any) => { if (s.fecha_sesion && diasMap[s.fecha_sesion] !== undefined) diasMap[s.fecha_sesion]++ })
    setSesionesSemanales(Object.values(diasMap))

    // FIX: combine BOTH tables — a patient counts as "active" if in either table
    const conSesionV2 = new Set((sesV2_30d || []).map((s: any) => s.child_id))
    const conSesionABA = new Set((sesABA_30d || []).map((s: any) => s.child_id))
    const conSesion = new Set([...conSesionV2, ...conSesionABA])
    const sinSesion = (todosNinos || []).filter((n: any) => !conSesion.has(n.id))

    // Alertas — show ALL patients without session, no artificial slice limit
    const alertas = sinSesion.map((n: any) => ({
      tipo: 'sin_sesion', paciente: n.name,
      mensaje: 'Sin sesión en los últimos 30 días.'
    }))

    // Progreso top pacientes — sesiones últimos 30d por paciente
    const sesMap: Record<string, { name: string; count: number }> = {}
    ;(actividadEnriquecida || []).forEach((a: any) => {
      const id = a.child_id
      const name = a.children?.name || ninosMap[id] || 'Paciente'
      if (id) { sesMap[id] = sesMap[id] || { name, count: 0 }; sesMap[id].count++ }
    })
    const maxSes = Math.max(...Object.values(sesMap).map(v => v.count), 1)
    const colors = ['#3a68a0', '#2e7a56', '#6355a0', '#b07830', '#c0524a']
    setProgresoPacientes(
      Object.values(sesMap).sort((a, b) => b.count - a.count).slice(0, 4).map((v, i) => ({
        name: v.name, pct: Math.round((v.count / maxSes) * 100), color: colors[i % colors.length]
      }))
    )

    setStats({
      pacientes: pacientes || 0,
      sesionesHoy: citasHoy?.length || 0,
      sinSesion30d: sinSesion.length,
      mensajesPendientes: mensajesPendientes || 0,
      analisisIA: analisis?.length || 0,
      completados7d: sesCompletas?.length || 0,
      programasActivos: programas?.length || 0,
      objetivosCompletos: objetivos?.length || 0,
    })
    setProximasCitas(citas || [])
    setActividadReciente(actividadEnriquecida || [])
    setAlertasClinicas(alertas)
  }

  const tasaAsistencia = stats.pacientes > 0
    ? Math.round(((stats.pacientes - stats.sinSesion30d) / stats.pacientes) * 100)
    : 0

  return (
    <div className="space-y-5">

      {/* ── HERO ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0 0%, #6355a0 50%, #2e7a56 100%)' }} />
        <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs capitalize mb-0.5" style={{ color: 'var(--text-muted)' }}>{diaStr}</p>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{saludo}, Directora 👋</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={11} /> {stats.sesionesHoy} citas hoy
              </span>
              {stats.sinSesion30d > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(176,120,48,0.1)', color: '#b07830', border: '1px solid rgba(176,120,48,0.2)' }}>
                  <AlertCircle size={10} /> {stats.sinSesion30d} sin sesión
                </span>
              )}
              {stats.mensajesPendientes > 0 && (
                <button onClick={() => navigateTo('mensajes')}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(99,85,160,0.1)', color: '#6355a0', border: '1px solid rgba(99,85,160,0.2)' }}>
                  <MessageCircle size={10} /> {stats.mensajesPendientes} mensajes
                </button>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {horaActual ? horaActual.toLocaleTimeString(toBCP47(locale), { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{horaActual?.getSeconds()}s</p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard label="Pacientes" value={stats.pacientes} sub="Total registrados" icon={Users} bar="#3a68a0" onClick={() => navigateTo('ninos')} />
        <KPICard label="Sesiones hoy" value={stats.sesionesHoy} sub="Citas agendadas" icon={Calendar} bar="#2e7a56" onClick={() => navigateTo('agenda')} />
        <KPICard label="Sin sesión 30d" value={stats.sinSesion30d} sub="Requieren seguimiento" icon={AlertTriangle} bar="#b07830" urgent={stats.sinSesion30d > 0} onClick={() => navigateTo('ninos')} />
        <KPICard label="Programas activos" value={stats.programasActivos} sub="En intervención ABA" icon={Target} bar="#6355a0" onClick={() => navigateTo('ninos')} />
      </div>

      {/* ── ROW 2: Métricas clínicas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Sesiones 7 días */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sesiones — últimos 7 días</p>
            <span className="text-lg font-black" style={{ color: '#3a68a0' }}>
              {sesionesSemanales.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <BarChart values={sesionesSemanales} color="#3a68a0" labels={diasLabels} />
        </div>

        {/* Tasa de retención */}
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <DonutChart value={stats.pacientes - stats.sinSesion30d} total={stats.pacientes} color="#2e7a56" size={64} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Retención activa</p>
            <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {stats.pacientes - stats.sinSesion30d}<span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>/ {stats.pacientes}</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>pacientes con sesión reciente</p>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: stats.objetivosCompletos > 0 ? '#2e7a56' : 'var(--text-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stats.objetivosCompletos} objetivos dominados</span>
            </div>
          </div>
        </div>

        {/* Progreso pacientes top */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <p className="text-[10px] font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Actividad por paciente</p>
          {progresoPacientes.length > 0 ? (
            <div className="space-y-2.5">
              {progresoPacientes.map(({ name, pct, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)', maxWidth: '70%' }}>{name}</span>
                    <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted-bg)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <Activity size={20} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Alertas + Citas + Actividad ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Alertas */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Bell size={12} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Alertas Clínicas</p>
            </div>
            {alertasClinicas.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(176,120,48,0.1)', color: '#b07830', border: '1px solid rgba(176,120,48,0.2)' }}>
                {alertasClinicas.length}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '320px' }}>
            {alertasClinicas.length > 0
              ? alertasClinicas.map((a, i) => <AlertaRow key={i} {...a} onClick={() => navigateTo('ninos')} />)
              : (
                <div className="flex flex-col items-center py-5">
                  <CheckCircle2 size={20} style={{ color: '#2e7a56', opacity: 0.5 }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin alertas activas</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Próximas citas */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Próximas Citas</p>
            </div>
            <button onClick={() => navigateTo('agenda')}
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: '#3a68a0' }}>
              Ver agenda <ArrowUpRight size={10} />
            </button>
          </div>
          <div className="px-4">
            {proximasCitas.length > 0
              ? proximasCitas.map((c, i) => <CitaRow key={i} cita={c} />)
              : (
                <div className="flex flex-col items-center py-8">
                  <Calendar size={20} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin citas agendadas</p>
                  <button onClick={() => navigateTo('agenda')} className="mt-2 text-xs font-bold" style={{ color: '#3a68a0' }}>
                    Agendar →
                  </button>
                </div>
              )
            }
          </div>
        </div>

        {/* Actividad + Hub IA */}
        <div className="flex flex-col gap-3">
          {/* Actividad reciente */}
          <div className="rounded-xl overflow-hidden flex-1" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <Activity size={12} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Última Actividad</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
              {actividadReciente.length > 0
                ? actividadReciente.slice(0, 3).map((a, i) => {
                    const inicial = a.children?.name?.charAt(0)?.toUpperCase() || '?'
                    const colors = ['#3a68a0','#2e7a56','#6355a0','#b07830']
                    const color = colors[inicial.charCodeAt(0) % colors.length]
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                          style={{ background: color }}>
                          {inicial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.children?.name}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{a.datos?.objetivo || 'Sesión ABA'}</p>
                        </div>
                        <p className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {new Date(a.created_at).toLocaleDateString(toBCP47(locale), { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    )
                  })
                : (
                  <div className="flex flex-col items-center py-5">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
                  </div>
                )
              }
            </div>
          </div>

          {/* Hub IA mini banner */}
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Brain size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Hub IA</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stats.analisisIA} registros · {stats.objetivosCompletos} dominados</p>
            </div>
            <button onClick={() => navigateTo('inteligencia')}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--text-primary)', color: 'var(--card)' }}>
              <Sparkles size={11} /> Abrir
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
