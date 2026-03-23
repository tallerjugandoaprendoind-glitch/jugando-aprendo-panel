'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Brain, Calendar, ChevronRight, Clock,
  FileText, Users, AlertTriangle, Sparkles,
  Bell, ArrowUpRight, MessageCircle, TrendingUp,
  CheckCircle2, AlertCircle, Zap, BarChart3,
  ClipboardList, Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all"
            style={{ height: `${Math.max(2, (v / max) * 36)}px`, background: i === values.length - 1 ? color : `${color}55` }} />
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function Donut({ value, total, color, size = 56 }: any) {
  const pct = total > 0 ? value / total : 0
  const r = size / 2 - 5
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--muted-bg)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill="var(--text-primary)" fontSize={size * 0.18} fontWeight="bold">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, bar, urgent, onClick }: any) {
  return (
    <div onClick={onClick}
      className={`rounded-xl p-5 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ background: 'var(--card)', border: urgent ? `1px solid ${bar}60` : '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-3 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${bar}12` }}>
          <Icon size={14} style={{ color: bar }} />
        </div>
      </div>
      <p className="text-4xl font-black leading-none pl-3 mb-1" style={{ color: urgent ? bar : 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs pl-3" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

// ─── Alerta row ───────────────────────────────────────────────────────────────
function AlertaRow({ tipo, paciente, mensaje, prioridad, onClick }: any) {
  const bar = prioridad === 1 ? '#c0524a' : prioridad === 2 ? '#b07830' : '#3a68a0'
  const tag = prioridad === 1 ? 'URGENTE' : prioridad === 2 ? 'MEDIA' : 'BAJA'
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-80"
      style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${bar}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: bar }}>{tag}</span>
          {tipo && <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{tipo.replace(/_/g, ' ')}</span>}
        </div>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{paciente || mensaje}</p>
        {paciente && mensaje && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{mensaje}</p>}
      </div>
      <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
    </button>
  )
}

// ─── Cita row ─────────────────────────────────────────────────────────────────
function CitaRow({ cita }: any) {
  const fecha = new Date((cita.fecha || cita.appointment_date) + 'T00:00:00')
  const hoy = new Date().toISOString().split('T')[0]
  const esHoy = (cita.fecha || cita.appointment_date) === hoy
  const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const dia = fecha.getDate()
  const nombre = cita.children?.name || cita.paciente || 'Paciente'
  const hora = cita.hora_inicio || cita.appointment_time
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg transition-all"
      style={{ background: esHoy ? 'rgba(58,104,160,0.06)' : 'transparent', border: esHoy ? '1px solid rgba(58,104,160,0.15)' : '1px solid transparent' }}>
      <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: esHoy ? '#3a68a0' : 'var(--muted-bg)', color: esHoy ? '#fff' : 'var(--text-secondary)' }}>
        <span className="text-[8px] font-bold leading-none">{mes}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{nombre}</p>
        <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          {hora && <><Clock size={9} /> {hora.slice(0, 5)}</>}
          {esHoy && <span className="font-bold" style={{ color: '#3a68a0' }}> · Hoy</span>}
        </p>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const { t, locale } = useI18n()

  // State
  const [metricas, setMetricas] = useState<any>(null)
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [alertasClinicas, setAlertasClinicas] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [sesSemanales, setSesSemanales] = useState<number[]>([0,0,0,0,0,0,0])
  const [diasLabels, setDiasLabels] = useState<string[]>(['L','M','M','J','V','S','D'])
  const [sinSesion, setSinSesion] = useState<any[]>([])
  const [horaActual, setHoraActual] = useState<Date | null>(null)
  const [diaStr, setDiaStr] = useState('')
  const [saludo, setSaludo] = useState('')
  const [loading, setLoading] = useState(true)

  // Clock
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

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      // 1. API de métricas (usa agenda_sesiones, agente_alertas, etc.)
      const resM = await fetch('/api/dashboard/metricas?periodo=7d')
      const dataM = resM.ok ? await resM.json() : null
      setMetricas(dataM)

      // Próximas citas del API
      if (dataM?.proximasSesiones?.length > 0) {
        setProximasCitas(dataM.proximasSesiones)
      } else {
        // Fallback: appointments table
        const hoy = new Date().toISOString().split('T')[0]
        const { data: citas } = await supabase
          .from('appointments')
          .select('*, children(name)')
          .gte('appointment_date', hoy)
          .neq('status', 'cancelled')
          .order('appointment_date').order('appointment_time')
          .limit(6)
        setProximasCitas(citas || [])
      }

      // Alertas del API
      if (dataM?.alertas?.recientes?.length > 0) {
        setAlertasClinicas(dataM.alertas.recientes.map((a: any) => ({
          tipo: a.tipo,
          paciente: a.children?.name || 'Paciente',
          mensaje: a.descripcion || a.mensaje || '',
          prioridad: a.prioridad || 2,
        })))
      }

      // 2. Sesiones por día (agenda_sesiones)
      const labels: string[] = []
      const datesArr: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        labels.push(d.toLocaleDateString('es', { weekday: 'short' }).charAt(0).toUpperCase())
        datesArr.push(d.toISOString().split('T')[0])
      }
      setDiasLabels(labels)

      if (dataM?.graficas?.sesionesXFecha?.length > 0) {
        const map: Record<string, number> = {}
        datesArr.forEach(d => { map[d] = 0 })
        dataM.graficas.sesionesXFecha.forEach((s: any) => { if (map[s.fecha] !== undefined) map[s.fecha] = s.total })
        setSesSemanales(Object.values(map))
      } else {
        // Fallback: registro_aba
        const { data: sesABA } = await supabase
          .from('registro_aba')
          .select('fecha_sesion')
          .gte('fecha_sesion', datesArr[0])
        const map: Record<string, number> = {}
        datesArr.forEach(d => { map[d] = 0 })
        ;(sesABA || []).forEach((s: any) => { if (map[s.fecha_sesion] !== undefined) map[s.fecha_sesion]++ })
        setSesSemanales(Object.values(map))
      }

      // 3. Actividad reciente — registro_aba + children lookup
      const { data: todosNinos } = await supabase.from('children').select('id, name')
      const ninosMap: Record<string, string> = {}
      ;(todosNinos || []).forEach((n: any) => { ninosMap[n.id] = n.name })

      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

      const { data: sesRecientesABA } = await supabase
        .from('registro_aba')
        .select('id, child_id, fecha_sesion, datos, created_at')
        .order('fecha_sesion', { ascending: false })
        .limit(8)

      setActividadReciente(
        (sesRecientesABA || []).map((s: any) => ({
          ...s,
          nombrePaciente: ninosMap[s.child_id] || 'Paciente',
          objetivo: s.datos?.objetivo_principal || s.datos?.objetivo || 'Sesión ABA',
        }))
      )

      // 4. Pacientes sin sesión (últimos 30 días) — registro_aba + aba_sessions_v2
      const { data: conSesABA } = await supabase
        .from('registro_aba').select('child_id').gte('fecha_sesion', hace30)
      const { data: conSesV2 } = await supabase
        .from('aba_sessions_v2').select('child_id').gte('session_date', hace30)

      const conSesion = new Set([
        ...(conSesABA || []).map((s: any) => s.child_id),
        ...(conSesV2 || []).map((s: any) => s.child_id),
      ])
      const pacientesSinSesion = (todosNinos || []).filter((n: any) => !conSesion.has(n.id))
      setSinSesion(pacientesSinSesion)

      // Merge alertas: API + sin sesión
      const alertasSinSesion = pacientesSinSesion.map((n: any) => ({
        tipo: 'sin_sesion', paciente: n.name,
        mensaje: 'Sin sesión en los últimos 30 días.', prioridad: 2,
      }))

      setAlertasClinicas(prev => {
        const existentes = prev.filter((a: any) => a.tipo !== 'sin_sesion')
        return [...existentes, ...alertasSinSesion]
      })

    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Derived stats
  const totalSesHoy = metricas?.hoy?.sesiones?.total ?? 0
  const realizadasHoy = metricas?.hoy?.sesiones?.realizadas ?? 0
  const totalPacientes = metricas?.pacientes?.total ?? 0
  const alertasUrgentes = metricas?.alertas?.urgentes ?? 0
  const mensajesPendientes = metricas?.tareas?.formPendientes ?? 0
  const tasaAsistencia = metricas?.hoy?.tasaAsistencia ?? 0
  const totalSes7d = sesSemanales.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">

      {/* ── HERO ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0, #6355a0, #2e7a56)' }} />
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs capitalize mb-0.5" style={{ color: 'var(--text-muted)' }}>{diaStr}</p>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{saludo}, Directora 👋</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--muted-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                {totalSesHoy} sesiones hoy
              </span>
              {sinSesion.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(176,120,48,0.1)', color: '#b07830', border: '1px solid rgba(176,120,48,0.25)' }}>
                  <AlertCircle size={10} className="inline mr-1" />{sinSesion.length} sin sesión (30d)
                </span>
              )}
              {alertasUrgentes > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(192,82,74,0.1)', color: '#c0524a', border: '1px solid rgba(192,82,74,0.25)' }}>
                  {alertasUrgentes} alertas urgentes
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-5xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {horaActual ? horaActual.toLocaleTimeString(toBCP47(locale), { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {horaActual?.getSeconds()}s
            </p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI label="Pacientes" value={totalPacientes} sub="Total registrados" icon={Users} bar="#3a68a0" onClick={() => navigateTo('ninos')} />
        <KPI label="Sesiones hoy" value={totalSesHoy} sub={`${realizadasHoy} realizadas`} icon={Calendar} bar="#2e7a56" onClick={() => navigateTo('agenda')} />
        <KPI label="Sin sesión 30d" value={sinSesion.length} sub="Requieren seguimiento" icon={AlertTriangle} bar="#b07830" urgent={sinSesion.length > 0} onClick={() => navigateTo('ninos')} />
        <KPI label="Forms pendientes" value={mensajesPendientes} sub="Sin revisar" icon={ClipboardList} bar="#6355a0" urgent={mensajesPendientes > 2} onClick={() => navigateTo('evaluaciones')} />
      </div>

      {/* ── MÉTRICAS MEDIAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Sesiones 7 días */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sesiones — últimos 7 días</p>
            <span className="text-lg font-black" style={{ color: '#3a68a0' }}>{totalSes7d}</span>
          </div>
          <BarChart values={sesSemanales} labels={diasLabels} color="#3a68a0" />
        </div>

        {/* Retención y asistencia */}
        <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <Donut value={totalPacientes - sinSesion.length} total={totalPacientes} color="#2e7a56" size={72} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Retención activa</p>
            <p className="text-lg font-black leading-none" style={{ color: 'var(--text-primary)' }}>
              {totalPacientes - sinSesion.length}
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>/ {totalPacientes}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>pacientes con sesión reciente</p>
            {metricas?.tareas?.total > 0 && (
              <p className="text-xs mt-2" style={{ color: '#2e7a56' }}>
                ✓ {metricas.tareas.completadas} tareas completadas
              </p>
            )}
          </div>
        </div>

        {/* Actividad por paciente */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <p className="text-[11px] font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Actividad por paciente</p>
          {actividadReciente.length > 0 ? (
            <div className="space-y-2">
              {actividadReciente.slice(0, 3).map((a, i) => {
                const colors = ['#3a68a0', '#2e7a56', '#6355a0', '#b07830']
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: colors[i % colors.length] }}>
                      {a.nombrePaciente?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.nombrePaciente}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{a.objetivo}</p>
                    </div>
                    <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {a.fecha_sesion?.slice(5)?.replace('-', '/')}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <Activity size={20} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PANEL INFERIOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Alertas clínicas */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Bell size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Alertas Clínicas</p>
            </div>
            {alertasClinicas.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(176,120,48,0.12)', color: '#b07830', border: '1px solid rgba(176,120,48,0.25)' }}>
                {alertasClinicas.length}
              </span>
            )}
          </div>
          <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
            {alertasClinicas.length > 0
              ? alertasClinicas.map((a, i) => (
                  <AlertaRow key={i} {...a} onClick={() => navigateTo('ninos')} />
                ))
              : (
                <div className="flex flex-col items-center py-8">
                  <CheckCircle2 size={22} style={{ color: '#2e7a56', opacity: 0.5 }} />
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
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Próximas Citas</p>
            </div>
            <button onClick={() => navigateTo('agenda')}
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: '#3a68a0' }}>
              Ver agenda <ArrowUpRight size={10} />
            </button>
          </div>
          <div className="p-3">
            {proximasCitas.length > 0
              ? proximasCitas.map((c, i) => <CitaRow key={i} cita={c} />)
              : (
                <div className="flex flex-col items-center py-10">
                  <Calendar size={22} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin citas agendadas</p>
                  <button onClick={() => navigateTo('agenda')} className="mt-3 text-xs font-bold" style={{ color: '#3a68a0' }}>
                    Agendar ahora →
                  </button>
                </div>
              )
            }
          </div>
        </div>

        {/* Acciones + Hub IA */}
        <div className="space-y-3">
          {/* Acciones rápidas */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: 'var(--text-muted)' }} />
                <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones Rápidas</p>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { label: 'Nueva Evaluación',  icon: FileText,   view: 'evaluaciones', bar: '#3a68a0' },
                { label: 'Agendar Cita',      icon: Calendar,   view: 'agenda',       bar: '#2e7a56' },
                { label: 'Ver Pacientes',     icon: Users,      view: 'ninos',        bar: '#6355a0' },
                { label: 'Hub IA',            icon: Brain,      view: 'hub-ia',       bar: '#b07830' },
              ].map(({ label, icon: Icon, view, bar }) => (
                <button key={view} onClick={() => navigateTo(view)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: 'var(--muted-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${bar}` }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} style={{ color: bar }} />
                    {label}
                  </div>
                  <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Banner IA */}
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Brain size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Hub IA</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {metricas?.pacientes?.progresoPromedio
                  ? `Progreso promedio: ${metricas.pacientes.progresoPromedio}%`
                  : 'Detecta patrones y genera reportes'}
              </p>
            </div>
            <button onClick={() => navigateTo('hub-ia')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
              style={{ background: 'var(--text-primary)', color: 'var(--card)' }}>
              Abrir
            </button>
          </div>
        </div>
      </div>

      {/* ── ÚLTIMA ACTIVIDAD ── */}
      {actividadReciente.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Última Actividad</p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
            {actividadReciente.map((a, i) => {
              const colors = ['#3a68a0', '#2e7a56', '#6355a0', '#b07830', '#c0524a']
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 text-white"
                    style={{ background: colors[a.nombrePaciente?.charCodeAt(0) % colors.length || 0] }}>
                    {a.nombrePaciente?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.nombrePaciente}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{a.objetivo}</p>
                  </div>
                  <p className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {a.fecha_sesion ? new Date(a.fecha_sesion + 'T12:00:00').toLocaleDateString(toBCP47(locale), { day: '2-digit', month: 'short' }) : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
