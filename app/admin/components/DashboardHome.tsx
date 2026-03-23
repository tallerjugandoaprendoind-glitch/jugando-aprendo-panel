'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import {
  Activity, Brain, Calendar, ChevronRight, Clock,
  FileText, Users, Loader2, AlertTriangle, Heart,
  Sparkles, Bell, ArrowUpRight, MessageCircle,
  TrendingUp, CheckCircle2, AlertCircle, Zap,
  BarChart3, UserCheck, Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ─── Mini sparkline SVG ───────────────────────────────────────────────────────
function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 64, h = 28
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, bar, trend, onClick, urgent }: any) {
  return (
    <div onClick={onClick}
      className={`rounded-xl p-4 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      style={{ background: 'var(--card)', border: urgent ? `1px solid ${bar}50` : '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-black leading-none mb-1" style={{ color: urgent ? bar : 'var(--text-primary)' }}>{value}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${bar}12` }}>
          <Icon size={16} style={{ color: bar }} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 pl-2">
          <TrendingUp size={10} style={{ color: bar }} />
          <span className="text-[10px] font-semibold" style={{ color: bar }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

// ─── Alerta clínica ───────────────────────────────────────────────────────────
function AlertaClinica({ tipo, paciente, mensaje, onClick }: any) {
  const colors: Record<string, { bar: string; icon: string }> = {
    sin_sesion:     { bar: '#b07830', icon: '○' },
    bienestar_bajo: { bar: '#3a68a0', icon: '◇' },
    sin_cita:       { bar: '#c0524a', icon: '△' },
  }
  const c = colors[tipo] || colors.sin_sesion
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-80"
      style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${c.bar}` }}>
      <span className="text-xs font-black w-4 text-center flex-shrink-0" style={{ color: c.bar }}>{c.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-wide mb-0.5" style={{ color: c.bar }}>
          {tipo === 'sin_sesion' ? 'Sin sesión' : tipo === 'bienestar_bajo' ? 'Bienestar' : 'Sin cita'}
        </p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{paciente}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{mensaje}</p>
      </div>
      <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
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
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all`}
      style={{ background: esHoy ? 'rgba(58,104,160,0.06)' : 'transparent', border: esHoy ? '1px solid rgba(58,104,160,0.15)' : '1px solid transparent' }}>
      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: esHoy ? '#3a68a0' : 'var(--muted-bg)', color: esHoy ? '#fff' : 'var(--text-secondary)' }}>
        <span className="text-[8px] font-bold leading-none">{mes}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{cita.children?.name || 'Paciente'}</p>
        <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Clock size={9} /> {cita.appointment_time?.slice(0, 5)}
          {esHoy && <span className="font-bold" style={{ color: '#3a68a0' }}> · Hoy</span>}
        </p>
      </div>
    </div>
  )
}

// ─── Actividad item ───────────────────────────────────────────────────────────
function ActividadItem({ item, locale }: any) {
  const inicial = item.children?.name?.charAt(0)?.toUpperCase() || '?'
  const colors = ['#3a68a0', '#2e7a56', '#6355a0', '#b07830', '#c0524a']
  const color = colors[inicial.charCodeAt(0) % colors.length]
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
        style={{ background: color }}>
        {inicial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.children?.name}</p>
        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{item.datos?.objetivo || 'Sesión registrada'}</p>
      </div>
      <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {new Date(item.created_at).toLocaleDateString(toBCP47(locale), { day: '2-digit', month: 'short' })}
      </p>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const [stats, setStats] = useState({ pacientes: 0, sesionesHoy: 0, sinSesion30d: 0, mensajesPendientes: 0, analisisIA: 0, completados: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [alertasClinicas, setAlertasClinicas] = useState<any[]>([])
  const [bienestarData, setBienestarData] = useState<any[]>([])
  const [sesionesSemanales, setSesionesSemanales] = useState<number[]>([])
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
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const [
      { count: pacientes },
      { data: citasHoy },
      { data: citas },
      { data: actividad },
      { data: sesionesRecientes },
      { data: sesiones7d },
      { data: todosNinos },
      { count: mensajesPendientes },
      { data: bienestar },
      { data: analisis },
      { data: sesCompletas },
    ] = await Promise.all([
      supabase.from('children').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*').eq('appointment_date', hoy).in('status', ['confirmed', 'pending']),
      supabase.from('appointments').select('*, children(name)').gte('appointment_date', hoy).neq('status', 'cancelled').neq('status', 'completed').order('appointment_date').order('appointment_time').limit(5),
      supabase.from('registro_aba').select('*, children:child_id(name)').order('fecha_sesion', { ascending: false }).limit(6),
      supabase.from('aba_sessions_v2').select('child_id').gte('session_date', hace30),
      supabase.from('registro_aba').select('fecha_sesion').gte('fecha_sesion', hace7),
      supabase.from('children').select('id, name'),
      supabase.from('parent_message_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('parent_forms').select('*').eq('status', 'completed').eq('form_type', 'wellbeing').order('created_at', { ascending: false }).limit(20),
      supabase.from('registro_aba').select('*').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(50),
      supabase.from('appointments').select('*').eq('status', 'completed').gte('appointment_date', hace7),
    ])

    // Sesiones por día últimos 7 días
    const diasMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      diasMap[d] = 0
    }
    ;(sesiones7d || []).forEach((s: any) => { if (diasMap[s.fecha_sesion] !== undefined) diasMap[s.fecha_sesion]++ })
    setSesionesSemanales(Object.values(diasMap))

    const conSesion = new Set((sesionesRecientes || []).map((s: any) => s.child_id))
    const sinSesion = (todosNinos || []).filter((n: any) => !conSesion.has(n.id))

    const alertas: any[] = sinSesion.slice(0, 3).map((n: any) => ({
      tipo: 'sin_sesion', paciente: n.name, mensaje: 'Sin sesión en los últimos 30 días. Revisa si hubo cancelaciones.'
    }))

    setStats({
      pacientes: pacientes || 0,
      sesionesHoy: citasHoy?.length || 0,
      sinSesion30d: sinSesion.length,
      mensajesPendientes: mensajesPendientes || 0,
      analisisIA: analisis?.length || 0,
      completados: sesCompletas?.length || 0,
    })
    setProximasCitas(citas || [])
    setActividadReciente(actividad || [])
    setAlertasClinicas(alertas)
    setBienestarData(bienestar || [])
  }

  const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    .slice(new Date().getDay() + 1).concat(['D', 'L', 'M', 'X', 'J', 'V', 'S'].slice(0, new Date().getDay() + 1))

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── HERO ── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        {/* Accent strip */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #3a68a0, #6355a0, #2e7a56)' }} />
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium capitalize mb-1" style={{ color: 'var(--text-muted)' }}>{diaStr}</p>
            <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              {saludo}, Directora 👋
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={12} />
                <span>{stats.sesionesHoy} citas hoy</span>
              </div>
              {stats.sinSesion30d > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(176,120,48,0.1)', color: '#b07830', border: '1px solid rgba(176,120,48,0.25)' }}>
                  <AlertCircle size={10} />
                  {stats.sinSesion30d} sin sesión reciente
                </div>
              )}
              {stats.mensajesPendientes > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(58,104,160,0.1)', color: '#3a68a0', border: '1px solid rgba(58,104,160,0.25)' }}>
                  <MessageCircle size={10} />
                  {stats.mensajesPendientes} mensajes pendientes
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-4xl font-black tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
              {horaActual ? horaActual.toLocaleTimeString(toBCP47(locale), { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {horaActual ? horaActual.toLocaleDateString(toBCP47(locale), { weekday: 'short' }) : ''} · {horaActual?.getSeconds()}s
            </p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPICard label="Pacientes activos"   value={stats.pacientes}          sub="Total registrados" icon={Users}          bar="#3a68a0" onClick={() => navigateTo('ninos')} />
        <KPICard label="Sesiones hoy"        value={stats.sesionesHoy}        sub="Por realizar"      icon={Calendar}       bar="#2e7a56" onClick={() => navigateTo('agenda')} />
        <KPICard label="Sin sesión (30d)"    value={stats.sinSesion30d}       sub="Requieren atención" icon={AlertTriangle}  bar="#b07830" urgent={stats.sinSesion30d > 0} onClick={() => navigateTo('ninos')} />
        <KPICard label="Mensajes pendientes" value={stats.mensajesPendientes} sub="Sin revisar"        icon={MessageCircle}  bar="#6355a0" urgent={stats.mensajesPendientes > 2} onClick={() => navigateTo('mensajes')} />
      </div>

      {/* ── ACTIVIDAD SEMANAL ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Sesiones 7 días */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sesiones últimos 7 días</p>
              <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {sesionesSemanales.reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <MiniSparkline values={sesionesSemanales} color="#3a68a0" />
          </div>
          <div className="flex items-end gap-1 h-8">
            {sesionesSemanales.map((v, i) => {
              const max = Math.max(...sesionesSemanales, 1)
              const isToday = i === sesionesSemanales.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm transition-all"
                    style={{ height: `${Math.max(3, (v / max) * 28)}px`, background: isToday ? '#3a68a0' : 'var(--muted-bg)' }} />
                </div>
              )
            })}
          </div>
          <div className="flex mt-1">
            {diasSemana.slice(-7).map((d, i) => (
              <div key={i} className="flex-1 text-center text-[9px]" style={{ color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Completados esta semana */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Citas completadas (7d)</p>
          <p className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>{stats.completados}</p>
          <div className="space-y-2">
            {[
              { label: 'Tasa de asistencia', pct: stats.sesionesHoy > 0 ? Math.round((stats.completados / Math.max(stats.pacientes, 1)) * 100) : 0, color: '#2e7a56' },
              { label: 'Pacientes con sesión', pct: stats.pacientes > 0 ? Math.round(((stats.pacientes - stats.sinSesion30d) / stats.pacientes) * 100) : 0, color: '#3a68a0' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-black" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted-bg)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bienestar padres */}
        <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <p className="text-[10px] font-black uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Bienestar de familias</p>
          {bienestarData.length > 0 ? (
            <>
              <p className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>{bienestarData.length} <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>respuestas</span></p>
              <div className="space-y-2">
                {[
                  { label: 'Con energía',     count: bienestarData.filter(d => (d.responses?.answer || '').includes('Bien')).length,     color: '#2e7a56' },
                  { label: 'Regular',         count: bienestarData.filter(d => (d.responses?.answer || '').includes('Regular')).length,  color: '#b07830' },
                  { label: 'Necesita apoyo',  count: bienestarData.filter(d => (d.responses?.answer || '').includes('Difícil')).length,  color: '#c0524a' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span className="text-xs font-black ml-2" style={{ color }}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-16">
              <Heart size={20} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin datos este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ALERTAS + ACCIONES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Alertas clínicas */}
        <div className="lg:col-span-1 rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Bell size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Alertas Clínicas</p>
            </div>
            {alertasClinicas.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(176,120,48,0.12)', color: '#b07830', border: '1px solid rgba(176,120,48,0.25)' }}>
                {alertasClinicas.length} nueva(s)
              </span>
            )}
          </div>
          <div className="p-3 space-y-2">
            {alertasClinicas.length > 0
              ? alertasClinicas.map((a, i) => <AlertaClinica key={i} {...a} onClick={() => navigateTo(a.tipo === 'bienestar_bajo' ? 'mensajes' : 'ninos')} />)
              : (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle2 size={24} style={{ color: '#2e7a56', opacity: 0.5 }} />
                  <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>Sin alertas activas</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Próximas citas */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Próximas Citas</p>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{proximasCitas.length} agendadas</span>
          </div>
          <div className="p-3">
            {proximasCitas.length > 0
              ? <>
                  {proximasCitas.map((c, i) => <CitaRow key={i} cita={c} />)}
                  <button onClick={() => navigateTo('agenda')}
                    className="w-full mt-2 py-2 text-xs font-semibold rounded-lg transition-all"
                    style={{ color: '#3a68a0', background: 'rgba(58,104,160,0.06)' }}>
                    Ver agenda completa →
                  </button>
                </>
              : (
                <div className="flex flex-col items-center py-8">
                  <Calendar size={24} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin citas agendadas</p>
                  <button onClick={() => navigateTo('agenda')}
                    className="mt-3 text-xs font-bold" style={{ color: '#3a68a0' }}>
                    Agendar ahora →
                  </button>
                </div>
              )
            }
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acciones Rápidas</p>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {[
              { label: 'Nueva Evaluación',  icon: FileText,      view: 'evaluaciones', bar: '#3a68a0' },
              { label: 'Agendar Cita',      icon: Calendar,      view: 'agenda',       bar: '#2e7a56' },
              { label: 'Ver Pacientes',     icon: Users,         view: 'ninos',        bar: '#6355a0' },
              { label: 'Hub IA',            icon: Brain,         view: 'hub-ia',       bar: '#b07830' },
              { label: 'Reportes Word',     icon: FileText,      view: 'reportes',     bar: '#64748b' },
            ].map(({ label, icon: Icon, view, bar }) => (
              <button key={view} onClick={() => navigateTo(view)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'var(--muted-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${bar}` }}>
                <div className="flex items-center gap-2.5">
                  <Icon size={14} style={{ color: bar }} />
                  {label}
                </div>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIVIDAD RECIENTE + BANNER IA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Actividad Reciente</p>
            </div>
          </div>
          <div className="px-4 divide-y" style={{ borderColor: 'var(--card-border)' }}>
            {actividadReciente.length > 0
              ? actividadReciente.map((a, i) => <ActividadItem key={i} item={a} locale={locale} />)
              : (
                <div className="flex flex-col items-center py-8">
                  <Activity size={24} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Banner IA */}
        <div className="rounded-xl p-5 flex flex-col justify-between"
          style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}>
          <div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Brain size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p className="font-black text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Hub de Inteligencia</p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              {stats.analisisIA} registros procesados esta semana. Detecta patrones, genera reportes y predice progreso clínico.
            </p>
          </div>
          <div className="space-y-2">
            <button onClick={() => navigateTo('hub-ia')}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--text-primary)', color: 'var(--card)' }}>
              <Sparkles size={14} /> Abrir Hub IA
            </button>
            <button onClick={() => navigateTo('reportes')}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
              <BarChart3 size={14} /> Ver Reportes
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
