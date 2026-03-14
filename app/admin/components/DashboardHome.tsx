'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect } from 'react'
import {
  Activity, Brain, Calendar, ChevronRight, Clock,
  FileText, Plus, Ticket, TrendingUp, Users, Loader2,
  AlertTriangle, Heart, Sparkles, Trophy, Bell, Zap,
  TrendingDown, CheckCircle, ArrowUpRight, MessageCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── Tarjeta de estadística principal ───────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, accent, onClick, alert }: any) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
      style={{ background: alert ? 'rgba(254,202,202,0.1)' : 'var(--card)', borderColor: alert ? '#fca5a5' : 'var(--card-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${accent.bg}`}>
          <Icon size={18} className={accent.icon} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${alert ? 'bg-red-100 text-red-600' : accent.badge}`}>
          {alert ? '⚠️ Atención' : sub}
        </span>
      </div>
      <p className="text-3xl font-black mb-1" style={{ color: alert ? '#dc2626' : 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  )
}

// ── Fila de cita próxima ────────────────────────────────────────────────────
function CitaRow({ cita }: { cita: any }) {
  if (!cita.appointment_date) return null
  const fecha = new Date(cita.appointment_date + 'T00:00:00')
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const dia = fecha.getDate()
  const esHoy = cita.appointment_date === new Date().toISOString().split('T')[0]
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${esHoy ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'}`}>
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 ${esHoy ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <span className="text-[9px] font-bold leading-none">{mesCorto}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{cita.children?.name || 'Sin nombre'}</p>
        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
          <Clock size={10} /> {cita.appointment_time?.slice(0, 5)}
          {esHoy && <span className="ml-1 text-blue-600 font-bold">• HOY</span>}
        </p>
      </div>
      <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </div>
  )
}

// ── Alerta clínica ──────────────────────────────────────────────────────────
function AlertaClinica({ tipo, paciente, mensaje, onClick }: any) {
  const { t } = useI18n()
  const cfg: Record<string, any> = {
    sin_sesion: { icon: '😴', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', label: t('dashboard.sinSesion') },
    bienestar_bajo: { icon: '💙', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', label: t('dashboard.bienestar') },
    sin_cita: { icon: '📅', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: t('agenda.sinCitas') },
  }
  const c = cfg[tipo] || cfg.sin_sesion
  return (
    <button onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border} hover:opacity-80 transition-all`}>
      <span className="text-lg shrink-0 mt-0.5">{c.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black uppercase tracking-wide mb-0.5 ${c.text}`}>{c.label}</p>
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{paciente}</p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{mensaje}</p>
      </div>
      <ChevronRight size={14} className="text-slate-400 shrink-0 mt-1" />
    </button>
  )
}

// ── Panel de respuestas de bienestar de padres ──────────────────────────────
function BienestarPanel({ data }: { data: any[] }) {
  if (data.length === 0) return null
  const { t } = useI18n()
  const counts = {
    bien:    data.filter(d => (d.responses?.answer || d.form_title || '').includes('Bien')).length,
    regular: data.filter(d => (d.responses?.answer || d.form_title || '').includes('Regular')).length,
    dificil: data.filter(d => (d.responses?.answer || d.form_title || '').includes('Difícil')).length,
  }
  return (
    <div className="rounded-2xl shadow-sm p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-pink-50 rounded-lg flex items-center justify-center">
          <Heart size={14} className="text-pink-600" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t('dashboard.bienestarPadres')}</p>
        <span className="ml-auto text-xs bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-full">{data.length} respuestas</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { emoji: '😊', label: 'Con energía', value: counts.bien, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { emoji: '😐', label: 'Regular', value: counts.regular, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { emoji: '😔', label: 'Necesita apoyo', value: counts.dificil, color: 'bg-red-50 text-red-700 border-red-200' },
        ].map(({ emoji, label, value, color }) => (
          <div key={label} className={`flex flex-col items-center p-3 rounded-xl border ${color}`}>
            <span className="text-xl mb-1">{emoji}</span>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] font-bold text-center leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {counts.dificil > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-bold">
            {counts.dificil} familia{counts.dificil > 1 ? 's' : ''} necesita{counts.dificil === 1 ? '' : 'n'} apoyo emocional adicional esta semana.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Dashboard principal ─────────────────────────────────────────────────────
function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [emailCredito, setEmailCredito] = useState('')
  const [stats, setStats] = useState({ pacientes: 0, sesionesHoy: 0, creditosActivos: 0, analisisIA: 0, sinSesion30d: 0, mensajesPendientes: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [alertasClinicas, setAlertasClinicas] = useState<any[]>([])
  const [bienestarData, setBienestarData] = useState<any[]>([])
  const [horaActual, setHoraActual] = useState<Date | null>(null)
  const [saludo, setSaludo] = useState('')
  const [diaStr, setDiaStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setHoraActual(now)
      setSaludo(now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches')
      setDiaStr(now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const mesActual = hoy.slice(0, 7) + '-01'

    const [
      { count: pacientes },
      { data: citasHoy },
      { data: profiles },
      { data: analisis },
      { data: citas },
      { data: actividad },
      { data: sesionesRecientes },
      { data: todosNinos },
      { count: mensajesPendientes },
      { data: bienestar },
    ] = await Promise.all([
      supabase.from('children').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*').eq('appointment_date', hoy).in('status', ['confirmed', 'pending']),
      supabase.from('profiles').select('tokens').gt('tokens', 0),
      supabase.from('registro_aba').select('*').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(50),
      supabase.from('appointments').select('*, children(name)').gte('appointment_date', hoy).neq('status', 'cancelled').neq('status', 'completed').order('appointment_date').order('appointment_time').limit(6),
      supabase.from('registro_aba').select('*, children:child_id(name)').order('fecha_sesion', { ascending: false }).limit(5),
      supabase.from('aba_sessions_v2').select('child_id').gte('session_date', hace30),
      supabase.from('children').select('id, name'),
      supabase.from('parent_message_approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('parent_forms').select('*').eq('status','completed').eq('form_type','wellbeing').gte('created_at', mesActual).order('created_at', { ascending: false }),
    ])

    // Detectar pacientes sin sesión en 30 días
    const conSesion = new Set((sesionesRecientes || []).map((s: any) => s.child_id))
    const sinSesion = (todosNinos || []).filter((n: any) => !conSesion.has(n.id))

    const alertas: any[] = []
    sinSesion.slice(0, 3).forEach((n: any) => {
      alertas.push({ tipo: 'sin_sesion', paciente: n.name, mensaje: t('dashboard.sinSesionMensaje') })
    })

    // Alertas de bienestar bajo
    const bienestarBajo = (bienestar || []).filter((b: any) => (b.responses?.answer || b.form_title || '').includes('Difícil'))
    bienestarBajo.slice(0, 2).forEach((b: any) => {
      alertas.push({ tipo: 'bienestar_bajo', paciente: `Padre/Madre (${b.created_at?.slice(0, 10)})`, mensaje: 'Reportó dificultad esta semana. Considera contactarlos.' })
    })

    const creditos = profiles?.reduce((s: number, p: any) => s + (p.tokens || 0), 0) || 0
    setStats({ pacientes: pacientes || 0, sesionesHoy: citasHoy?.length || 0, creditosActivos: creditos, analisisIA: analisis?.length || 0, sinSesion30d: sinSesion.length, mensajesPendientes: mensajesPendientes || 0 })
    setProximasCitas(citas || [])
    setActividadReciente(actividad || [])
    setAlertasClinicas(alertas)
    setBienestarData(bienestar || [])
  }

  const handleCargarCredito = async (cantidad: number) => {
    if (!emailCredito.trim()) { toast.warning('Ingresa un email'); return }
    setLoading(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('id, tokens').eq('email', emailCredito.trim()).single()
      if (!profile) { toast.error('Email no encontrado'); return }
      await supabase.from('profiles').update({ tokens: (profile.tokens || 0) + cantidad }).eq('id', profile.id)
      toast.success(`✅ ${cantidad} crédito${cantidad > 1 ? 's' : ''} añadido${cantidad > 1 ? 's' : ''}`)
      setEmailCredito('')
      cargarDatos()
    } catch { toast.error('Error al cargar crédito') }
    finally { setLoading(false) }
  }



  const STAT_CARDS = [
    { title: t('dashboard.pacientesActivos'), value: stats.pacientes, sub: t('common.total'), icon: Users, accent: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' }, onClick: () => navigateTo('ninos') },
    { title: t('dashboard.sesionesHoy'), value: stats.sesionesHoy, sub: t('dashboard.porRealizar'), icon: Calendar, accent: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' }, onClick: () => navigateTo('agenda') },
    { title: t('dashboard.sinSesion30d'), value: stats.sinSesion30d, sub: t('dashboard.revisar'), icon: AlertTriangle, accent: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-50 text-amber-600' }, alert: stats.sinSesion30d > 0, onClick: () => navigateTo('ninos') },
    { title: t('dashboard.mensajesSinLeer'), value: stats.mensajesPendientes, sub: t('nav.pacientes'), icon: MessageCircle, accent: { bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-50 text-violet-600' }, alert: stats.mensajesPendientes > 3, onClick: () => navigateTo('mensajes') },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-8" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium capitalize">{diaStr}</p>
          <h2 className="text-2xl font-black mt-1">{saludo}, Directora 👋</h2>
          <p className="text-blue-200 text-sm mt-1">
            Tienes <span className="text-white font-bold">{stats.sesionesHoy} citas</span> hoy
            {stats.sinSesion30d > 0 && (
              <span className="ml-2 text-yellow-300 font-bold">· {stats.sinSesion30d} paciente{stats.sinSesion30d > 1 ? 's' : ''} sin sesión reciente</span>
            )}
          </p>
        </div>
        <div className="text-right hidden sm:block relative">
          <p className="text-blue-300 text-xs font-medium">{t('dashboard.horaActual')}</p>
          <p className="text-3xl font-black tabular-nums">
            {horaActual ? horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </p>
          <p className="text-blue-300 text-xs">{horaActual ? horaActual.getSeconds() + 's' : ''}</p>
        </div>
      </div>

      {/* STAT CARDS — ahora clickeables */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => <StatCard key={card.title} {...card} />)}
      </div>

      {/* ALERTAS CLÍNICAS */}
      {alertasClinicas.length > 0 && (
        <div className="rounded-2xl shadow-sm p-5" style={{ background: "var(--card)", border: "1px solid #d97706" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Bell size={14} className="text-amber-600" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t('dashboard.alertasClinicas')}</p>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full animate-pulse">
              {alertasClinicas.length} nueva{alertasClinicas.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {alertasClinicas.map((a, i) => (
              <AlertaClinica key={i} {...a} onClick={() => navigateTo(a.tipo === 'bienestar_bajo' ? 'mensajes' : 'ninos')} />
            ))}
          </div>
        </div>
      )}

      {/* PANEL BIENESTAR */}
      <BienestarPanel data={bienestarData} />

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Acciones rápidas + Créditos */}
        <div className="space-y-4">
          {/* Acciones */}
          <div className="rounded-2xl border shadow-sm p-5" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>{t('dashboard.quickActions')}</p>
            <div className="space-y-2">
              {[
                { label: t('evaluaciones.nuevo'),  icon: FileText,      view: 'evaluaciones', bg: '#2563eb', fg: '#ffffff' },
                { label: t('agenda.nuevaCita'),      icon: Calendar,      view: 'agenda',       bg: '#1e293b', fg: '#ffffff' },
                { label: t('nav.historial'),    icon: Brain,         view: 'reportes',     bg: '#7c3aed', fg: '#ffffff' },
                { label: 'Ver Pacientes',     icon: Users,         view: 'ninos',        bg: '#334155', fg: '#ffffff' },
                { label: t('mensajes.titulo'),   icon: MessageCircle, view: 'mensajes',     bg: '#d1fae5', fg: '#065f46', badge: stats.mensajesPendientes },
              ].map(({ label, icon: Icon, view, bg, fg, badge }: any) => (
                <button key={view} onClick={() => navigateTo(view)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: bg, color: fg }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {label}
                  </div>
                  <div className="flex items-center gap-2">
                    {badge > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ background: '#ef4444', color: '#fff' }}>{badge}</span>
                    )}
                    <ChevronRight size={15} style={{ opacity: 0.6 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Créditos - Administrar desde el módulo de Usuarios */}
          {false && (
          <div className="rounded-2xl shadow-sm p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.cargarCreditos')}</p>
            <p className="text-xs text-slate-400 mb-3">Total en circulación: <strong className="text-slate-700">{stats.creditosActivos}</strong></p>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-3 font-medium"
              placeholder="email@familia.com"
              value={emailCredito}
              onChange={e => setEmailCredito(e.target.value)}
              type="email"
            />
            <div className="grid grid-cols-3 gap-2">
              {[1, 4, 8].map(n => (
                <button key={n} onClick={() => handleCargarCredito(n)} disabled={loading || !emailCredito.trim()}
                  className="flex items-center justify-center gap-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-40">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {n}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Próximas citas */}
        <div className="rounded-2xl shadow-sm p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t('dashboard.proximasCitas')}</p>
            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-full">
              {proximasCitas.length} agendadas
            </span>
          </div>
          <div className="space-y-1">
            {proximasCitas.length > 0
              ? proximasCitas.map((c, i) => <CitaRow key={i} cita={c} />)
              : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                    <Calendar size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{t('dashboard.sinCitas')}</p>
                  <button onClick={() => navigateTo('agenda')}
                    className="mt-3 text-xs font-bold text-blue-600 hover:underline">
                    Agendar ahora →
                  </button>
                </div>
              )
            }
          </div>
          {proximasCitas.length > 0 && (
            <button onClick={() => navigateTo('agenda')}
              className="w-full mt-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition">
              Ver agenda completa →
            </button>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-2xl shadow-sm p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('dashboard.actividadReciente')}</p>
            <Activity size={14} className="text-slate-300" />
          </div>
          <div className="space-y-1">
            {actividadReciente.length > 0
              ? actividadReciente.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">
                    {a.children?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{a.children?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{a.datos?.objetivo || 'Sesión registrada'}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                    {new Date(a.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              ))
              : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                    <Activity size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">{t('dashboard.sinActividad')}</p>
                  <button onClick={() => navigateTo('evaluaciones')}
                    className="mt-3 text-xs font-bold text-orange-500 hover:underline">
                    Registrar sesión →
                  </button>
                </div>
              )
            }
          </div>
          {actividadReciente.length > 0 && (
            <button onClick={() => navigateTo('evaluaciones')}
              className="w-full mt-3 py-2 text-xs font-bold text-orange-500 hover:bg-orange-50 rounded-xl transition">
              Ver evaluaciones →
            </button>
          )}
        </div>
      </div>

      {/* RESUMEN SEMANAL IA */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <p className="font-black text-base">{t('dashboard.analisisIA')}</p>
            <p className="text-violet-200 text-sm">{stats.analisisIA} registros procesados por IA</p>
          </div>
        </div>
        <button onClick={() => navigateTo('reportes')}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-all border border-white/30">
          Ver reportes <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default DashboardHome
