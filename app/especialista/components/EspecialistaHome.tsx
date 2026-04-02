'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar,
  Baby, ChevronRight, Activity, ArrowUpRight,
  Plus, Brain, Sparkles, Users, BarChart3,
  BookOpen, Heart, TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  profile: any
  setActiveView: (v: string) => void
}

const TIPS_CLINICOS = [
  { emoji: '🎯', texto: 'Registra las conductas objetivo con antecedente, conducta y consecuencia (ABC) para mejorar la calidad de tu análisis ABA.' },
  { emoji: '📊', texto: 'Cuando un objetivo supera el 80% de dominio por 3 sesiones consecutivas, es momento de proponer un nuevo objetivo al jefe.' },
  { emoji: '💙', texto: 'Recuerda preguntar brevemente al padre/madre cómo se ha sentido esta semana. El bienestar del cuidador afecta directamente el progreso del niño.' },
  { emoji: '📝', texto: 'Las notas de sesión con observaciones específicas son más útiles que las generales. Detalla cada avance con datos concretos.' },
  { emoji: '🏆', texto: 'Celebra los micro-logros con el niño y la familia. Un objetivo nuevo alcanzado, por pequeño que sea, merece reconocimiento.' },
]

function BarChart({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all duration-500"
            style={{
              height: `${Math.max(2, (v / max) * 44)}px`,
              background: i === values.length - 1 ? color : `${color}55`
            }} />
          <span className="text-[9px] text-slate-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const { locale } = useI18n()

  const [stats, setStats] = useState({
    pendientes: 0, aprobadas: 0, rechazadas: 0,
    citasHoy: 0, totalPacientes: 0, sesionesEstaSemana: 0,
  })
  const [recientes, setRecientes]         = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [sesSemanales, setSesSemanales]   = useState<number[]>([0,0,0,0,0,0,0])
  const [diasLabels, setDiasLabels]       = useState<string[]>(['L','M','M','J','V','S','D'])
  const [loading, setLoading]             = useState(true)
  const [tipIndex]                        = useState(() => Math.floor(Math.random() * TIPS_CLINICOS.length))
  const [horaActual, setHoraActual]       = useState<Date | null>(null)
  const [saludo, setSaludo]               = useState('')
  const [fechaStr, setFechaStr]           = useState('')

  // Reloj en tiempo real
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setHoraActual(now)
      setSaludo(now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches')
      setFechaStr(now.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [locale])

  const cargar = useCallback(async () => {
    try {
      const hoy       = new Date().toISOString().split('T')[0]
      const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

      const labels: string[] = []
      const datesArr: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        labels.push(d.toLocaleDateString('es', { weekday: 'short' }).charAt(0).toUpperCase())
        datesArr.push(d.toISOString().split('T')[0])
      }
      setDiasLabels(labels)

      const [subRes, citRes, nRes, sesRes, sesDetalle] = await Promise.all([
        supabase.from('specialist_submissions').select('status').eq('specialist_id', userId),
        supabase.from('appointments')
          .select('appointment_date, appointment_time, children(name)')
          .eq('appointment_date', hoy)
          .eq('specialist_id', userId)
          .neq('status', 'cancelled')
          .order('appointment_time'),
        supabase.from('children').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('aba_sessions_v2').select('id').eq('professional_id', userId).gte('session_date', hace7dias),
        supabase.from('aba_sessions_v2').select('session_date').eq('professional_id', userId).gte('session_date', datesArr[0]),
      ])

      const subs = subRes.data || []

      // Gráfico semanal
      const sesMap: Record<string, number> = {}
      datesArr.forEach(d => { sesMap[d] = 0 })
      ;(sesDetalle.data || []).forEach((s: any) => {
        if (sesMap[s.session_date] !== undefined) sesMap[s.session_date]++
      })
      setSesSemanales(Object.values(sesMap))

      setStats({
        pendientes:         subs.filter(s => s.status === 'pending_approval').length,
        aprobadas:          subs.filter(s => s.status === 'approved').length,
        rechazadas:         subs.filter(s => s.status === 'rejected').length,
        citasHoy:           (citRes.data || []).length,
        totalPacientes:     nRes.count || 0,
        sesionesEstaSemana: (sesRes.data || []).length,
      })
      setProximasCitas(citRes.data || [])

      const { data: rec } = await supabase
        .from('specialist_submissions')
        .select('*, children(name)')
        .eq('specialist_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecientes(rec || [])

    } finally { setLoading(false) }
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  const tip          = TIPS_CLINICOS[tipIndex]
  const nombre       = profile?.full_name?.split(' ')[0] || 'Especialista'
  const total        = stats.aprobadas + stats.pendientes + stats.rechazadas
  const tasa         = total > 0 ? Math.round((stats.aprobadas / total) * 100) : 0
  const totalSes     = sesSemanales.reduce((a, b) => a + b, 0)

  const STATUS_CFG: Record<string, any> = {
    pending_approval: { label: 'En revisión', color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-400',  Icon: Clock },
    approved:         { label: 'Aprobada',    color: 'text-emerald-700',bg: 'bg-emerald-50',dot: 'bg-emerald-500',Icon: CheckCircle2 },
    rejected:         { label: 'Rechazada',   color: 'text-red-700',    bg: 'bg-red-50',    dot: 'bg-red-400',    Icon: XCircle },
  }

  const horaFmt = horaActual
    ? horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
    : ''

  return (
    <div className="space-y-5 pb-8">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f4c75 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent)', transform: 'translate(35%,-35%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(-30%,30%)' }} />

        <div className="relative p-7 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{saludo}</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-1 tracking-tight">{nombre}</h1>
              <p className="text-slate-400 text-sm font-medium capitalize mb-5">
                {profile?.specialty || 'Especialista Clínico'} · {fechaStr}
              </p>

              <div className="flex flex-wrap gap-2">
                {stats.citasHoy > 0 ? (
                  <button onClick={() => setActiveView('agenda')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Calendar size={14} className="text-sky-400" />
                    {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy
                    {proximasCitas.slice(0, 2).map((c: any, i: number) => (
                      <span key={i} className="text-slate-400 text-xs">
                        {i > 0 ? ' · ' : ' → '}{c.appointment_time?.slice(0, 5)} {c.children?.name?.split(' ')[0]}
                      </span>
                    ))}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <CheckCircle2 size={14} className="text-emerald-400" /> Sin citas hoy
                  </div>
                )}
                {stats.pendientes > 0 && (
                  <button onClick={() => setActiveView('evaluaciones')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-amber-300 border border-amber-400/30 hover:bg-amber-400/10 transition-all"
                    style={{ background: 'rgba(251,191,36,0.08)' }}>
                    <Clock size={14} />
                    {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''}
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Reloj + CTA */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              {horaActual && (
                <div className="text-right">
                  <p className="text-5xl font-black text-white tabular-nums tracking-tight leading-none">{horaFmt}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                    {String(horaActual.getSeconds()).padStart(2,'0')}s
                  </p>
                </div>
              )}
              <button onClick={() => setActiveView('evaluaciones')}
                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-black text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-sky-500/30 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>
                <Sparkles size={16} /> Nueva evaluación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pacientes',   value: stats.totalPacientes,     sub: 'Total activos',         icon: Users,        color: '#8b5cf6', bg: '#f5f3ff', view: 'pacientes'    },
          { label: 'Sesiones',    value: stats.sesionesEstaSemana, sub: 'Últimos 7 días',         icon: Activity,     color: '#10b981', bg: '#ecfdf5', view: 'agenda'       },
          { label: 'En revisión', value: stats.pendientes,         sub: 'Esperando aprobación',   icon: Clock,        color: '#f59e0b', bg: '#fffbeb', view: 'evaluaciones', pulse: stats.pendientes > 0 },
          { label: 'Aprobadas',   value: stats.aprobadas,          sub: 'Evaluaciones aprobadas', icon: CheckCircle2, color: '#3b82f6', bg: '#eff6ff', view: 'evaluaciones' },
        ].map(({ label, value, sub, icon: Icon, color, bg, view, pulse }: any) => (
          <button key={label} onClick={() => setActiveView(view)}
            className="bg-white rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 border border-slate-100 relative overflow-hidden group">
            {pulse && <span className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: color }} />
            <div className="pl-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-3xl font-black text-slate-800 tabular-nums mb-0.5">{loading ? '—' : value}</p>
              <p className="text-xs font-black mb-0.5" style={{ color }}>{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Columna izquierda ── */}
        <div className="space-y-4">

          {/* Gráfico sesiones semanales */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-slate-400" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sesiones — últimos 7 días</p>
              </div>
              <span className="text-xs bg-slate-50 text-slate-400 font-black px-2 py-0.5 rounded-full border border-slate-100">
                {loading ? '—' : totalSes}
              </span>
            </div>
            {loading ? (
              <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <BarChart values={sesSemanales} labels={diasLabels} color="#3b82f6" />
            )}
          </div>

          {/* Productividad */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-slate-400" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tu productividad</p>
              </div>
              <span className="text-xs bg-slate-50 text-slate-400 font-black px-2 py-0.5 rounded-full border border-slate-100">
                {total} total
              </span>
            </div>
            {total === 0 ? (
              <div className="text-center py-3">
                <div className="text-3xl mb-2">📈</div>
                <p className="text-sm font-black text-slate-400">Aún sin evaluaciones</p>
                <p className="text-xs text-slate-300 mt-1">Creá tu primera para ver estadísticas</p>
                <button onClick={() => setActiveView('evaluaciones')}
                  className="mt-3 text-xs font-black text-blue-600 hover:underline">
                  Crear ahora →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-4xl font-black text-slate-800">{tasa}</p>
                  <p className="text-lg font-black text-slate-400">%</p>
                  <p className="text-xs text-slate-400 ml-1">aprobación</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex mb-3">
                  <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(stats.aprobadas/total)*100}%` }} />
                  <div className="bg-amber-400 transition-all duration-700"  style={{ width: `${(stats.pendientes/total)*100}%` }} />
                  <div className="bg-red-400 transition-all duration-700"    style={{ width: `${(stats.rechazadas/total)*100}%` }} />
                </div>
                <div className="flex gap-3 text-xs font-bold flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 bg-emerald-500 rounded-full" />{stats.aprobadas} aprobadas</span>
                  <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 bg-amber-400 rounded-full" />{stats.pendientes} revisión</span>
                  {stats.rechazadas > 0 && <span className="flex items-center gap-1 text-red-700"><span className="w-2 h-2 bg-red-400 rounded-full" />{stats.rechazadas} rechazadas</span>}
                </div>
              </>
            )}
          </div>

          {/* Tip clínico */}
          <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', borderColor: '#bae6fd' }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-sky-600" />
              <p className="text-xs font-black text-sky-600 uppercase tracking-widest">Tip clínico del día</p>
            </div>
            <div className="text-3xl mb-3">{tip.emoji}</div>
            <p className="text-sm text-sky-900 leading-relaxed font-medium">{tip.texto}</p>
          </div>

          {/* Motivación */}
          <div className="rounded-2xl p-5 border" style={{ background: 'linear-gradient(135deg,#fdf4ff,#fae8ff)', borderColor: '#e9d5ff' }}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-purple-600" />
              <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Recordatorio</p>
            </div>
            <p className="text-sm text-purple-900 leading-relaxed font-medium">
              Tu trabajo hace una diferencia real en la vida de cada familia. ¡Gracias por tu dedicación! 💜
            </p>
          </div>
        </div>

        {/* ── Evaluaciones recientes ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <BookOpen size={15} className="text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800 text-sm">Mis evaluaciones recientes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveView('evaluaciones')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-black rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <Plus size={12} /> Nueva
              </button>
              <button onClick={() => setActiveView('evaluaciones')}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                Ver todo <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : recientes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}>
                <FileText size={48} className="text-sky-300" />
              </div>
              <p className="text-slate-700 font-black text-xl mb-2">Sin evaluaciones aún</p>
              <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
                Creá tu primera evaluación. Pasará por revisión antes de llegar a los padres.
              </p>
              <button onClick={() => setActiveView('evaluaciones')}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <Plus size={15} /> Nueva evaluación
              </button>
              <p className="mt-6 text-xs text-slate-300 font-medium">
                Las evaluaciones pasan por revisión antes de ser enviadas a los padres
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 divide-y divide-slate-50">
                {recientes.map((r) => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending_approval
                  const { Icon: StatusIcon } = cfg
                  return (
                    <div key={r.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setActiveView('evaluaciones')}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <StatusIcon size={16} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{r.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Baby size={10} className="text-slate-300" />
                          <p className="text-xs text-slate-400 font-medium">{r.children?.name}</p>
                          <span className="text-slate-200">·</span>
                          <p className="text-xs text-slate-400">
                            {new Date(r.created_at).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                        <ChevronRight size={13} className="text-slate-200" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Citas de hoy si hay datos */}
              {proximasCitas.length > 0 && (
                <>
                  <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Citas de hoy</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {proximasCitas.slice(0, 3).map((c: any, i: number) => (
                      <div key={i}
                        className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setActiveView('agenda')}>
                        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-blue-600 text-white">
                          <span className="text-[8px] font-bold leading-none">
                            {new Date().toLocaleDateString('es', { month: 'short' }).toUpperCase().slice(0,3)}
                          </span>
                          <span className="text-sm font-black leading-none">{new Date().getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{c.children?.name || 'Paciente'}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={9} /> {c.appointment_time?.slice(0, 5)}
                            <span className="font-bold text-blue-600"> · Hoy</span>
                          </p>
                        </div>
                        <ChevronRight size={13} className="text-slate-200" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="px-6 py-4 border-t border-slate-50">
                <button onClick={() => setActiveView('evaluaciones')}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2">
                  <Plus size={13} /> Nueva evaluación
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
