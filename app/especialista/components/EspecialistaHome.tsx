'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar, Baby,
  AlertTriangle, ChevronRight, Activity, Sparkles, ArrowUpRight,
  TrendingUp, Target, Heart, Bell, Zap, Trophy, Star,
  MessageCircle, BookOpen, Plus, Brain
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  profile: any
  setActiveView: (v: string) => void
}

// ── Tarjeta de estadística clicable ────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, border, icon: Icon, onClick, loading, pulse }: any) {
  const { t, locale } = useI18n()

  return (
    <button onClick={onClick}
      className={`bg-white rounded-2xl p-5 text-left group hover:shadow-lg transition-all duration-200 border ${border} hover:scale-[1.02] active:scale-[.98] relative overflow-hidden`}>
      {pulse && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
      )}
      <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-3xl font-black text-slate-800 mb-1 tabular-nums">
        {loading ? '—' : value}
      </p>
      <p className={`text-xs font-bold mb-0.5 ${color}`}>{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </button>
  )
}

// ── Chip de productividad semanal ───────────────────────────────────────────
function ProductividadSemanal({ aprobadas, pendientes, rechazadas }: any) {
  const { t, locale } = useI18n()

  const total = aprobadas + pendientes + rechazadas
  if (total === 0) return null
  const tasa = total > 0 ? Math.round((aprobadas / total) * 100) : 0
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={14} className="text-violet-600" />
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('ui.your_productivity')}</p>
        <span className="ml-auto text-xs bg-violet-50 text-violet-700 font-black px-2 py-0.5 rounded-full">{total} total</span>
      </div>
      <div className="flex items-end gap-3 mb-3">
        <p className="text-4xl font-black text-slate-800">{tasa}%</p>
        <p className="text-sm text-slate-400 mb-1.5">tasa de aprobación</p>
      </div>
      {/* Barra de progreso compuesta */}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex mb-3">
        <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${(aprobadas/total)*100}%` }} />
        <div className="bg-amber-400 transition-all duration-700" style={{ width: `${(pendientes/total)*100}%` }} />
        <div className="bg-red-400 transition-all duration-700 rounded-r-full" style={{ width: `${(rechazadas/total)*100}%` }} />
      </div>
      <div className="flex gap-4 text-xs font-bold">
        <span className="flex items-center gap-1.5 text-emerald-700"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />{aprobadas} aprobadas</span>
        <span className="flex items-center gap-1.5 text-amber-700"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />{pendientes} en revisión</span>
        <span className="flex items-center gap-1.5 text-red-700"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" />{rechazadas} rechazadas</span>
      </div>
    </div>
  )
}

// ── Tip clínico del día ─────────────────────────────────────────────────────
const TIPS_CLINICOS = [
  { emoji: '🎯', texto: 'Registra las conductas objetivo con antecedente, conducta y consecuencia (ABC) para mejorar la calidad de tu análisis ABA.' },
  { emoji: '📊', texto: 'Cuando un objetivo supera el 80% de dominio por 3 sesiones consecutivas, es momento de proponer un nuevo objetivo al jefe.' },
  { emoji: '💙', texto: 'Recuerda preguntar brevemente al padre/madre cómo se ha sentido esta semana. El bienestar del cuidador afecta directamente el progreso del niño.' },
  { emoji: '📝', texto: 'Las notas de sesión con observaciones específicas ("pidió agua 3 veces usando señas") son más útiles que las generales ("buena sesión").' },
  { emoji: '🏆', texto: 'Celebra los micro-logros con el niño y la familia. Un objetivo nuevo alcanzado, por pequeño que sea, merece reconocimiento.' },
]

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const { t, locale } = useI18n()
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0, citasHoy: 0, totalPacientes: 0, citasProximas: 0, sesionesEstaSemana: 0 })
  const [recientes, setRecientes] = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS_CLINICOS.length))
  const [saludo, setSaludo] = useState('')
  const [fechaStr, setFechaStr] = useState('')

  useEffect(() => {
    const now = new Date()
    const h = now.getHours()
    setSaludo(h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches')
    setFechaStr(now.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])

  useEffect(() => {
    const cargar = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const inicioSemana = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

        const [subRes, citRes, nRes, citProxRes, sesRes] = await Promise.all([
          supabase.from('specialist_submissions').select('status').eq('specialist_id', userId),
          supabase.from('appointments').select('appointment_date, appointment_time, children(name)').eq('appointment_date', hoy).neq('status', 'cancelled').order('appointment_time'),
          supabase.from('children').select('id', { count: 'exact' }).eq('is_active', true),
          supabase.from('appointments').select('appointment_date, appointment_time, children(name)').gt('appointment_date', hoy).neq('status', 'cancelled').order('appointment_date').order('appointment_time').limit(5),
          supabase.from('aba_sessions_v2').select('id').gte('session_date', inicioSemana),
        ])

        const subs = subRes.data || []
        setStats({
          pendientes: subs.filter(s => s.status === 'pending_approval').length,
          aprobadas: subs.filter(s => s.status === 'approved').length,
          rechazadas: subs.filter(s => s.status === 'rejected').length,
          citasHoy: (citRes.data || []).length,
          totalPacientes: nRes.count || 0,
          citasProximas: (citProxRes.data || []).length,
          sesionesEstaSemana: (sesRes.data || []).length,
        })
        setProximasCitas(citRes.data || [])

        const { data: rec } = await supabase
          .from('specialist_submissions')
          .select('*, children(name)')
          .eq('specialist_id', userId)
          .order('created_at', { ascending: false })
          .limit(4)
        setRecientes(rec || [])
      } finally { setLoading(false) }
    }
    cargar()
  }, [userId])

  const tip = TIPS_CLINICOS[tipIndex]

  const STAT_CARDS = [
    { label: t('nav.pacientes'), value: stats.totalPacientes, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', view: 'pacientes', icon: Baby, sub: 'Total activos' },
    { label: 'Sesiones esta semana', value: stats.sesionesEstaSemana, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', view: 'agenda', icon: Activity, sub: 'Últimos 7 días' },
    { label: 'En revisión', value: stats.pendientes, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', view: 'evaluaciones', icon: Clock, sub: 'Esperando aprobación', pulse: stats.pendientes > 0 },
    { label: 'Aprobadas', value: stats.aprobadas, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', view: 'evaluaciones', icon: CheckCircle2, sub: 'Confirmadas' },
  ]

  const STATUS_CFG: Record<string, any> = {
    pending_approval: { label: 'En revisión', color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
    approved: { label: t('especialista.aprobado'), color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
    rejected: { label: t('especialista.rechazado'), color: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
  }

  return (
    <div className="space-y-6 pb-6">

      {/* Hero con citas de hoy visibles */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-7 text-white relative overflow-hidden shadow-lg shadow-blue-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-8" />
        <div className="relative">
          <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">{saludo}</p>
          <h2 className="text-3xl font-black mb-1 tracking-tight">
            {profile?.full_name?.split(' ')[0] || 'Especialista'}
          </h2>
          <p className="text-blue-200 text-sm font-medium mb-5">
            {profile?.specialty || 'Especialista Clínico'} · {fechaStr}
          </p>

          <div className="flex flex-wrap gap-3">
            {stats.citasHoy > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/15 rounded-xl text-sm font-bold border border-white/20">
                <Calendar size={14} />
                {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy
                {proximasCitas.slice(0, 2).map((c: any, i: number) => (
                  <span key={i} className="text-blue-200 text-xs">
                    {i > 0 ? ' · ' : ' → '}{c.appointment_time?.slice(0, 5)} {c.children?.name?.split(' ')[0]}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-xl text-sm font-semibold border border-white/20">
                <CheckCircle2 size={14} /> Sin citas hoy
              </div>
            )}
            {stats.pendientes > 0 && (
              <button onClick={() => setActiveView('evaluaciones')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400/20 hover:bg-amber-400/30 rounded-xl text-sm font-semibold text-amber-100 transition-all border border-amber-400/30">
                <Clock size={14} />
                {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''} de aprobación
                <ArrowUpRight size={13} />
              </button>
            )}
            <button onClick={() => setActiveView('evaluaciones')}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-all border border-white/20">
              <Plus size={14} /> {t('especialista.nuevaEvaluacion')}
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(card => (
          <StatCard key={card.label} {...card} loading={loading} onClick={() => setActiveView(card.view)} />
        ))}
      </div>

      {/* Productividad + Tip + Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Productividad */}
          <ProductividadSemanal
            aprobadas={stats.aprobadas}
            pendientes={stats.pendientes}
            rechazadas={stats.rechazadas}
          />

          {/* Tip clínico del día */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={15} className="text-indigo-600" />
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t('ui.clinical_tip')}</p>
            </div>
            <div className="text-2xl mb-2">{tip.emoji}</div>
            <p className="text-sm text-indigo-800 leading-relaxed font-medium">{tip.texto}</p>
          </div>
        </div>

        {/* Actividad reciente — columna central+derecha */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <Activity size={14} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{t('ui.recent_evaluations')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveView('evaluaciones')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">
                <Plus size={12} /> {t('especialista.nueva2')}
              </button>
              <button onClick={() => setActiveView('evaluaciones')}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                {t('especialista.verTodo')} <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {recientes.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-bold mb-1">{t('ui.no_recent_evals')}</p>
              <p className="text-slate-300 text-xs mb-4 max-w-xs mx-auto">{t('especialista.primeraEvaluacion').split('.')[0]}. Pasará por revisión antes de llegar a los padres.</p>
              <button onClick={() => setActiveView('evaluaciones')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
                <Plus size={14} /> {t('especialista.nuevaEvaluacion')}
              </button>
            </div>
          ) : (
            <div>
              {recientes.map((r, idx) => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending_approval
                const StatusIcon = r.status === 'approved' ? CheckCircle2 : r.status === 'rejected' ? XCircle : Clock
                return (
                  <div key={r.id}
                    className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${idx < recientes.length - 1 ? 'border-b border-slate-50' : ''}`}
                    onClick={() => setActiveView('evaluaciones')}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <StatusIcon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{r.titulo}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Baby size={10} /> {r.children?.name}
                        <span className="mx-1">·</span>
                        {new Date(r.created_at).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}

          {/* Botón nueva evaluación si hay recientes */}
          {recientes.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-50">
              <button onClick={() => setActiveView('evaluaciones')}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-400 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> {t('especialista.nuevaEvaluacion')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info flujo — mejorado */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={17} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800 mb-2">¿Cómo funciona el flujo de aprobación?</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '1', label: 'Tú creas', desc: 'Registra evaluación o nota de sesión', color: 'bg-amber-100 text-amber-800' },
              { step: '2', label: 'Jefe revisa', desc: 'El admin valida y aprueba o da feedback', color: 'bg-orange-100 text-orange-800' },
              { step: '3', label: 'Padres ven', desc: 'Al aprobarse, llega a la familia', color: 'bg-green-100 text-green-800' },
            ].map(({ step, label, desc, color }) => (
              <div key={step} className={`${color} rounded-xl p-3 text-center`}>
                <div className="text-lg font-black mb-1">{step}</div>
                <p className="text-xs font-black mb-0.5">{label}</p>
                <p className="text-[10px] leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
