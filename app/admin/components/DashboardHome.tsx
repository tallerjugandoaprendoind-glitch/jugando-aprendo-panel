'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Brain, Calendar, ChevronRight, Clock,
  FileText, Plus, Ticket, TrendingUp, Users, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function StatCard({ title, value, sub, icon: Icon, accent }: any) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${accent.bg}`}>
          <Icon size={18} className={accent.icon} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${accent.badge}`}>
          {sub}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-800 mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-400">{title}</p>
    </div>
  )
}

function CitaRow({ cita }: { cita: any }) {
  const fecha = new Date(cita.appointment_date)
  const mesCorto = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const dia = fecha.getDate()
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
        <span className="text-[9px] font-bold leading-none">{mesCorto}</span>
        <span className="text-sm font-black leading-none">{dia}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 truncate">{cita.children?.name || 'Sin nombre'}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {cita.appointment_time?.slice(0, 5)}
        </p>
      </div>
      <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </div>
  )
}

function ActividadRow({ act }: { act: any }) {
  const inicial = act.children?.name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">
        {inicial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 truncate">{act.children?.name}</p>
        <p className="text-xs text-slate-400 truncate">{act.datos?.objetivo || 'Sesión registrada'}</p>
      </div>
      <p className="text-[10px] text-slate-400 font-medium flex-shrink-0">
        {new Date(act.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
      </p>
    </div>
  )
}

function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [emailCredito, setEmailCredito] = useState('')
  const [stats, setStats] = useState({ pacientes: 0, sesionesHoy: 0, creditosActivos: 0, analisisIA: 0 })
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [horaActual, setHoraActual] = useState(new Date())

  useEffect(() => {
    const iv = setInterval(() => setHoraActual(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const hoy = new Date().toISOString().split('T')[0]

    const [
      { count: pacientes },
      { data: citasHoy },
      { data: profiles },
      { data: analisis },
      { data: citas },
      { data: actividad },
    ] = await Promise.all([
      supabase.from('children').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*').eq('appointment_date', hoy),
      supabase.from('profiles').select('tokens').gt('tokens', 0),
      supabase.from('registro_aba').select('*').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(50),
      supabase.from('appointments').select('*, children(name)').gte('appointment_date', hoy).order('appointment_date').order('appointment_time').limit(5),
      supabase.from('registro_aba').select('*, children(name)').order('created_at', { ascending: false }).limit(5),
    ])

    const creditos = profiles?.reduce((s, p) => s + (p.tokens || 0), 0) || 0
    setStats({ pacientes: pacientes || 0, sesionesHoy: citasHoy?.length || 0, creditosActivos: creditos, analisisIA: analisis?.length || 0 })
    setProximasCitas(citas || [])
    setActividadReciente(actividad || [])
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
    } catch { toast.error('Error al cargar crédito') }
    finally { setLoading(false) }
  }

  const hoy = new Date()
  const saludo = hoy.getHours() < 12 ? 'Buenos días' : hoy.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'
  const diaStr = hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const STAT_CARDS = [
    { title: 'Pacientes activos', value: stats.pacientes, sub: 'Total', icon: Users, accent: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' } },
    { title: 'Citas programadas hoy', value: stats.sesionesHoy, sub: 'Hoy', icon: Calendar, accent: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' } },
    { title: 'Créditos en circulación', value: stats.creditosActivos, sub: 'Activos', icon: Ticket, accent: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' } },
    { title: 'Análisis IA esta semana', value: stats.analisisIA, sub: '7 días', icon: Brain, accent: { bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-50 text-violet-600' } },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-blue-200">
        <div>
          <p className="text-blue-200 text-sm font-medium capitalize">{diaStr}</p>
          <h2 className="text-2xl font-black mt-1">{saludo}, Directora 👋</h2>
          <p className="text-blue-200 text-sm mt-1">Tienes <span className="text-white font-bold">{stats.sesionesHoy} citas</span> programadas hoy</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-blue-300 text-xs font-medium">Hora actual</p>
          <p className="text-3xl font-black tabular-nums">
            {horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-blue-300 text-xs">{horaActual.toLocaleTimeString('es-PE', { second: '2-digit' })} seg</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => <StatCard key={card.title} {...card} />)}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Acciones rápidas + Créditos */}
        <div className="space-y-4">
          {/* Acciones */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Acciones rápidas</p>
            <div className="space-y-2">
              {[
                { label: 'Nueva Evaluación', icon: FileText, view: 'evaluaciones', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
                { label: 'Agendar Cita', icon: Calendar, view: 'agenda', color: 'bg-slate-800 hover:bg-slate-900 text-white' },
                { label: 'Historial & IA', icon: Brain, view: 'reportes', color: 'bg-violet-600 hover:bg-violet-700 text-white' },
                { label: 'Ver Pacientes', icon: Users, view: 'ninos', color: 'bg-slate-100 hover:bg-slate-200 text-slate-700' },
              ].map(({ label, icon: Icon, view, color }) => (
                <button key={view} onClick={() => navigateTo(view)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${color}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {label}
                  </div>
                  <ChevronRight size={15} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Créditos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Cargar créditos</p>
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-3"
              placeholder="email@familia.com"
              value={emailCredito}
              onChange={e => setEmailCredito(e.target.value)}
              type="email"
            />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleCargarCredito(1)} disabled={loading || !emailCredito.trim()}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 1 Crédito
              </button>
              <button onClick={() => handleCargarCredito(4)} disabled={loading || !emailCredito.trim()}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 4 Créditos
              </button>
            </div>
          </div>
        </div>

        {/* Próximas citas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Próximas citas</p>
            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-full">
              {proximasCitas.length} agendadas
            </span>
          </div>
          <div className="space-y-1">
            {proximasCitas.length > 0
              ? proximasCitas.map((c, i) => <CitaRow key={i} cita={c} />)
              : <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <Calendar size={36} className="mb-2" />
                  <p className="text-sm font-medium">Sin citas próximas</p>
                </div>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Actividad reciente</p>
            <Activity size={14} className="text-slate-300" />
          </div>
          <div className="space-y-1">
            {actividadReciente.length > 0
              ? actividadReciente.map((a, i) => <ActividadRow key={i} act={a} />)
              : <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <Activity size={36} className="mb-2" />
                  <p className="text-sm font-medium">Sin actividad reciente</p>
                </div>
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
    </div>
  )
}

export default DashboardHome
