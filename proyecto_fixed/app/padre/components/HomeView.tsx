'use client'
import { useEffect, useState } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import {
  CalendarDays, Clock, CheckCircle, XCircle, RefreshCw,
  TrendingUp, Target, Activity, Award, ChevronRight,
  Sparkles, Baby, BarChart3, Zap, AlertCircle, Star,
  Heart, CalendarCheck, BookOpen
} from 'lucide-react'

interface Props {
  child: any
  onChangeView: (view: string) => void
  refreshTrigger: number
  onCancelAppointment: (id: string, reschedule: boolean) => void
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function calcAge(birthDate: string) {
  if (!birthDate) return 0
  const today = new Date(), birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { day: d, month: MONTHS_ES[m-1], monthFull: MONTHS_FULL[m-1], year: y }
}

export default function HomeViewInnovative({ child, onChangeView, refreshTrigger, onCancelAppointment }: Props) {
  const supabase = supabaseClient
  const [nextAppt, setNextAppt] = useState<any>(null)
  const [stats, setStats] = useState({ sessions: 0, goalsAchieved: 0, hoursTotal: 0, level: 'Inicial', monthSessions: 0, masteryRate: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!child?.id) return
    loadData()
  }, [child?.id, refreshTrigger])

  const loadData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0,7) + '-01'

    // Próxima cita
    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('child_id', child.id)
      .gte('appointment_date', today)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1)
    setNextAppt(appts?.[0] || null)

    // Sesiones del mes
    const { data: monthSess } = await supabase
      .from('aba_sessions_v2')
      .select('id')
      .eq('child_id', child.id)
      .gte('session_date', monthStart)

    // Todas las sesiones
    const { data: allSess } = await supabase
      .from('aba_sessions_v2')
      .select('id, duration_minutes')
      .eq('child_id', child.id)

    // Objetivos
    const { data: goals } = await supabase
      .from('goal_progress')
      .select('id, mastery_level')
      .eq('child_id', child.id)

    const totalSess = allSess?.length || 0
    const totalMinutes = (allSess || []).reduce((s: number, x: any) => s + (x.duration_minutes || 45), 0)
    const achieved = (goals || []).filter((g: any) => (g.mastery_level || 0) >= 80).length
    const totalGoals = goals?.length || 0
    const masteryRate = totalGoals > 0 ? Math.round((achieved / totalGoals) * 100) : 0

    let level = 'Inicial'
    if (totalSess >= 50) level = 'Avanzado'
    else if (totalSess >= 20) level = 'Intermedio'
    else if (totalSess >= 5) level = 'Básico'

    setStats({
      sessions: totalSess,
      goalsAchieved: achieved,
      hoursTotal: Math.round(totalMinutes / 60 * 10) / 10,
      level,
      monthSessions: monthSess?.length || 0,
      masteryRate,
    })
    setLoading(false)
  }

  const age = child ? calcAge(child.birth_date) : 0

  return (
    <div className="space-y-5 animate-fade-in pb-4">

      {/* ── HERO CARD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-2xl shadow-purple-200">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl translate-y-8" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Paciente Activo</p>
            <h1 className="text-2xl font-black leading-tight mb-3">{child?.name || 'Sin paciente seleccionado'}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-1">
                <Baby size={11} /> {age} años
              </span>
              <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold">
                {child?.diagnosis || 'En evaluación'}
              </span>
              <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-1">
                <Activity size={11} /> {stats.sessions} sesiones
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shrink-0">
            {child?.name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            value: stats.sessions, label: 'SESIONES',
            sub: stats.monthSessions > 0 ? `+${stats.monthSessions} este mes` : 'Total realizadas',
            icon: <Activity size={18} className="text-blue-600" />,
            bg: 'bg-blue-50', border: 'border-blue-100', subColor: 'text-blue-600'
          },
          {
            value: stats.goalsAchieved, label: 'OBJETIVOS LOGRADOS',
            sub: stats.masteryRate > 0 ? `${stats.masteryRate}% dominio` : 'En progreso',
            icon: <Target size={18} className="text-emerald-600" />,
            bg: 'bg-emerald-50', border: 'border-emerald-100', subColor: 'text-emerald-600'
          },
          {
            value: `${stats.hoursTotal}h`, label: 'HORAS ACUMULADAS',
            sub: stats.sessions > 0 ? `~${Math.round(stats.hoursTotal/stats.sessions*10)/10}h/sesión` : 'Sin sesiones',
            icon: <Clock size={18} className="text-violet-600" />,
            bg: 'bg-violet-50', border: 'border-violet-100', subColor: 'text-violet-600'
          },
          {
            value: stats.level, label: 'NIVEL',
            sub: 'Basado en progreso',
            icon: <Award size={18} className="text-amber-600" />,
            bg: 'bg-amber-50', border: 'border-amber-100', subColor: 'text-amber-600'
          },
        ].map(({ value, label, sub, icon, bg, border, subColor }) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-2`}>
            <div className="flex items-center justify-between">
              {icon}
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest text-right leading-tight">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className={`text-xs font-bold ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── PRÓXIMA CITA ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-slate-50">
          <CalendarDays size={16} className="text-violet-600" />
          <h2 className="font-black text-slate-700 text-sm uppercase tracking-wide">Próxima Sesión</h2>
        </div>

        {loading ? (
          <div className="px-5 pb-5 pt-3">
            <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : nextAppt ? (
          <div className="p-5">
            {(() => {
              const d = formatDate(nextAppt.appointment_date)
              return (
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-b from-violet-600 to-purple-700 text-white rounded-2xl px-4 py-3 text-center shrink-0 shadow-lg shadow-purple-200">
                    <div className="text-3xl font-black leading-none">{d.day}</div>
                    <div className="text-xs font-bold uppercase opacity-80 mt-0.5">{d.month}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${nextAppt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {nextAppt.status === 'confirmed' ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                        {nextAppt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800">{nextAppt.service_type || 'Terapia'}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> {formatTime(nextAppt.appointment_time)}
                    </p>
                  </div>
                </div>
              )
            })()}
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => onCancelAppointment(nextAppt.id, true)}
                className="flex-1 py-2.5 px-4 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-bold hover:bg-violet-100 transition-all flex items-center justify-center gap-1.5">
                <RefreshCw size={13} /> Reprogramar
              </button>
              <button onClick={() => onCancelAppointment(nextAppt.id, false)}
                className="flex-1 py-2.5 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5">
                <XCircle size={13} /> Cancelar
              </button>
              <button onClick={() => onChangeView('miscitas')}
                className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all flex items-center gap-1.5">
                Ver todas <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-6 pt-3 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CalendarDays size={28} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-500 text-sm mb-1">Sin citas próximas</p>
            <p className="text-xs text-slate-400 mb-4">Agenda una sesión para continuar el progreso</p>
            <button onClick={() => onChangeView('agenda')}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:opacity-90 transition-all">
              Agendar sesión
            </button>
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onChangeView('miscitas')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-md transition-all text-left group">
          <CalendarCheck size={22} className="text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">Mis Citas</p>
          <p className="text-xs text-slate-400 mt-0.5">Ver historial completo</p>
        </button>
        <button onClick={() => onChangeView('resources')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all text-left group">
          <BookOpen size={22} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">Materiales</p>
          <p className="text-xs text-slate-400 mt-0.5">Recursos del centro</p>
        </button>
        <button onClick={() => onChangeView('misformularios')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 hover:shadow-md transition-all text-left group">
          <Sparkles size={22} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">Mis Formularios</p>
          <p className="text-xs text-slate-400 mt-0.5">Evaluaciones enviadas</p>
        </button>
        <button onClick={() => onChangeView('chat')}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all text-left group">
          <Zap size={22} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">Asistente IA</p>
          <p className="text-xs text-indigo-400 mt-0.5">Consulta al instante</p>
        </button>
      </div>

      {/* ── PROGRESS CARD ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-600" /> Progreso General
          </h3>
          <span className="text-xs text-slate-400 font-medium">{stats.goalsAchieved} de {stats.goalsAchieved + (stats.sessions > 0 ? 3 : 0)} objetivos</span>
        </div>

        {stats.sessions === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">Datos disponibles pronto</p>
            <p className="text-xs text-slate-300 mt-1">El progreso se calcula automáticamente después de las primeras sesiones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Dominio de objetivos', value: stats.masteryRate, color: 'from-emerald-400 to-green-500' },
              { label: 'Asistencia al mes', value: Math.min(100, stats.monthSessions * 25), color: 'from-blue-400 to-violet-500' },
              { label: 'Horas de terapia', value: Math.min(100, Math.round(stats.hoursTotal / 20 * 100)), color: 'from-amber-400 to-orange-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>{label}</span><span>{value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
