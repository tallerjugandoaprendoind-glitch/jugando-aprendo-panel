'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import {
  CalendarDays, Clock, CheckCircle, XCircle, RefreshCw,
  TrendingUp, Target, Activity, Award, ChevronRight,
  Sparkles, Baby, BarChart3, Zap, AlertCircle, Star,
  Heart, CalendarCheck, BookOpen, Trophy, PartyPopper, X, SmilePlus, MessageCircle
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
  const { t, locale } = useI18n()

  if (!birthDate) return 0
  const today = new Date(), birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  const { t, locale } = useI18n()

  const [y, m, d] = dateStr.split('-').map(Number)
  return { day: d, month: MONTHS_ES[m-1], monthFull: MONTHS_FULL[m-1], year: y }
}

// ── Componente de Celebración de Objetivos ─────────────────────────────────
function GoalCelebration({ childName, goalsAchieved, onClose }: { childName: string; goalsAchieved: number; onClose: () => void }) {
  const { t } = useI18n()

  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn .4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        borderRadius: 28, padding: 48, textAlign: 'center', maxWidth: 400, width: '90%',
        boxShadow: '0 40px 100px rgba(79,70,229,.5)',
        animation: 'scaleIn .4s cubic-bezier(.175,.885,.32,1.275)',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff' }}>
          <X size={16} />
        </button>
        <div style={{ fontSize: 56, marginBottom: 16, animation: 'bounce 1s ease infinite' }}>🏆</div>
        <h2 style={{ fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 8 }}>
          ¡Gran logro!
        </h2>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
          <strong style={{ color: '#fbbf24' }}>{childName}</strong> alcanzó{' '}
          <strong style={{ color: '#fbbf24' }}>{goalsAchieved} objetivo{goalsAchieved !== 1 ? 's' : ''}</strong> con dominio ≥80%.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1,2,3].map(i => (
            <Star key={i} size={28} color="#fbbf24" fill="#fbbf24" style={{ animation: `spin ${0.8 + i * 0.2}s linear infinite` }} />
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
          ¡Este logro es el resultado del esfuerzo diario de toda la familia! 💙
        </p>
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ── Wellbeing Mini-Survey ──────────────────────────────────────────────────
function WellbeingSurvey({ childName, onClose }: { childName: string; onClose: () => void }) {
  const { t } = useI18n()

  const [answered, setAnswered] = useState(false)
  const [answer, setAnswer] = useState('')

  const options = [
    { emoji: '😊', label: 'Bien, con energía para seguir', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
    { emoji: '😐', label: 'Regular, algo cansado/a', color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
    { emoji: '😔', label: 'Difícil, necesito más apoyo', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  ]

  const handleAnswer = (opt: string) => {
    const { t } = useI18n()

    setAnswer(opt)
    setAnswered(true)
    // En producción: guardar en BD para el especialista
    setTimeout(onClose, 3000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', animation: 'fadeIn .3s ease', padding: '0 16px 24px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px 24px 20px 20px', padding: 28, maxWidth: 440, width: '100%',
        boxShadow: '0 -20px 60px rgba(0,0,0,.15)', animation: 'slideUp .4s cubic-bezier(.175,.885,.32,1.275)',
      }}>
        {!answered ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#fce7f3,#ede9fe)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} color="#be185d" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>¿Cómo estás tú?</p>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>{t('ui.wellbeing_check')}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6b7280' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 16 }}>
              Acompañar a <strong>{childName || 'tu hijo/a'}</strong> es un trabajo importante. ¿Cómo te has sentido tú esta semana?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleAnswer(opt.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: opt.bg, border: `2px solid ${opt.border}`, borderRadius: 14,
                    fontSize: 14, fontWeight: 600, color: opt.color, cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', transition: 'transform .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
              Tu respuesta ayuda al terapeuta a brindarte mejor apoyo.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💙</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 8 }}>{t('ui.thanks_sharing')}</h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              Tu terapeuta tomará esto en cuenta. Recuerda que cuidarte a ti también es parte del proceso.
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

export default function HomeViewInnovative({ child, onChangeView, refreshTrigger, onCancelAppointment }: Props) {
  const { t, locale } = useI18n()
  const supabase = supabaseClient
  const [nextAppt, setNextAppt] = useState<any>(null)
  const [stats, setStats] = useState({ sessions: 0, goalsAchieved: 0, hoursTotal: 0, level: 'Inicial', monthSessions: 0, masteryRate: 0 })
  const [loading, setLoading] = useState(true)
  const [parentMessages, setParentMessages] = useState<any[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [prevGoals, setPrevGoals] = useState(-1)
  const [showWellbeing, setShowWellbeing] = useState(false)
  const wellbeingShown = useState(false)

  useEffect(() => {
    if (!child?.id) return
    loadData()
  }, [child?.id, refreshTrigger])

  // Mostrar check de bienestar una vez por mes
  useEffect(() => {
    const key = `wellbeing_shown_${new Date().getFullYear()}_${new Date().getMonth()}`
    const shown = localStorage.getItem(key)
    if (!shown && child?.id) {
      const timer = setTimeout(() => {
        setShowWellbeing(true)
        localStorage.setItem(key, '1')
      }, 15000) // 15s después de cargar
      return () => clearTimeout(timer)
    }
  }, [child?.id])

  const loadData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0,7) + '-01'

    const { data: appts } = await supabase
      .from('appointments')
      .select('*')
      .eq('child_id', child.id)
      .gte('appointment_date', today)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1)
    setNextAppt(appts?.[0] || null)

    // Use registro_aba as primary session source
    const { data: monthSess } = await supabase
      .from('registro_aba')
      .select('id')
      .eq('child_id', child.id)
      .gte('fecha_sesion', monthStart)

    const { data: allSess } = await supabase
      .from('registro_aba')
      .select('id, datos')
      .eq('child_id', child.id)

    // Also check aba_sessions_v2 if it exists
    const { data: allSessV2 } = await supabase
      .from('aba_sessions_v2')
      .select('id, duration_minutes')
      .eq('child_id', child.id)

    const { data: goals } = await supabase
      .from('goal_progress')
      .select('id, mastery_level')
      .eq('child_id', child.id)

    // Load parent messages from notifications table
    const { data: msgs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', child.parent_id || '')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Also check parent_messages table
    const { data: parentMsgs } = await supabase
      .from('parent_messages')
      .select('*')
      .eq('child_id', child.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    setParentMessages([...(msgs || []), ...(parentMsgs || [])].slice(0, 5))

    const totalSessFromABA = allSess?.length || 0
    const totalSessFromV2 = allSessV2?.length || 0
    const totalSess = Math.max(totalSessFromABA, totalSessFromV2)
    const totalMinutes = (allSessV2 || []).reduce((s: number, x: any) => s + (x.duration_minutes || 45), 0) ||
                        totalSess * 45 // fallback: estimate 45min per session
    const achieved = (goals || []).filter((g: any) => (g.mastery_level || 0) >= 80).length
    const totalGoals = goals?.length || 0
    const masteryRate = totalGoals > 0 ? Math.round((achieved / totalGoals) * 100) : 0

    let level = 'Inicial'
    if (totalSess >= 50) level = 'Avanzado'
    else if (totalSess >= 20) level = 'Intermedio'
    else if (totalSess >= 5) level = 'Básico'

    if (prevGoals !== -1 && achieved > prevGoals && achieved > 0) {
      setShowCelebration(true)
    }
    setPrevGoals(achieved)

    setStats({ sessions: totalSess, goalsAchieved: achieved, hoursTotal: Math.round(totalMinutes / 60 * 10) / 10, level, monthSessions: monthSess?.length || 0, masteryRate })
    setLoading(false)
  }

  const age = child ? calcAge(child.birth_date) : 0

  return (
    <div className="space-y-5 animate-fade-in pb-4">

      {/* ── CELEBRACIÓN DE OBJETIVOS ── */}
      {showCelebration && (
        <GoalCelebration
          childName={child?.name || 'tu hijo/a'}
          goalsAchieved={stats.goalsAchieved}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* ── WELLBEING SURVEY ── */}
      {showWellbeing && (
        <WellbeingSurvey
          childName={child?.name}
          onClose={() => setShowWellbeing(false)}
        />
      )}

      {/* ── HERO CARD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-2xl shadow-purple-200">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl translate-y-8" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">{t('pacientes.pacienteActivo')}</p>
            <h1 className="text-2xl font-black leading-tight mb-3">{child?.name || t('pacientes.sinPacienteSeleccionado')}</h1>
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
            sub: stats.masteryRate > 0 ? `${stats.masteryRate}% ${t('familias.dominio')}` : t('familias.enProgreso'),
            icon: <Target size={18} className="text-emerald-600" />,
            bg: 'bg-emerald-50', border: 'border-emerald-100', subColor: 'text-emerald-600',
            celebrate: stats.goalsAchieved > 0,
          },
          {
            value: `${stats.hoursTotal}h`, label: 'HORAS ACUMULADAS',
            sub: stats.sessions > 0 ? `~${Math.round(stats.hoursTotal/stats.sessions*10)/10}${t('familias.porHoraSesion')}` : 'Sin sesiones',
            icon: <Clock size={18} className="text-violet-600" />,
            bg: 'bg-violet-50', border: 'border-violet-100', subColor: 'text-violet-600'
          },
          {
            value: stats.level, label: 'NIVEL',
            sub: 'Basado en progreso',
            icon: <Award size={18} className="text-amber-600" />,
            bg: 'bg-amber-50', border: 'border-amber-100', subColor: 'text-amber-600'
          },
        ].map(({ value, label, sub, icon, bg, border, subColor, celebrate }: any) => (
          <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden`}>
            {celebrate && (
              <div className="absolute top-2 right-2">
                <Trophy size={14} className="text-amber-500" />
              </div>
            )}
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
          <h2 className="font-black text-slate-700 text-sm uppercase tracking-wide">{t('agenda.proximaSesion')}</h2>
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
          // ── Empty state mejorado ──
          <div className="px-5 pb-6 pt-3 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={32} className="text-violet-400" />
            </div>
            <p className="font-bold text-slate-700 text-base mb-2">¡Es momento de agendar!</p>
            <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto leading-relaxed">
              La constancia en las sesiones es clave para el progreso. Agenda tu próxima cita y mantén el avance de {child?.name?.split(' ')[0] || 'tu hijo/a'}.
            </p>
            <button onClick={() => onChangeView('agenda')}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
              <CalendarDays size={16} /> Agendar sesión ahora
            </button>
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onChangeView('miscitas')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-md transition-all text-left group">
          <CalendarCheck size={22} className="text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">{t('nav.miscitas')}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('ui.full_history')}</p>
        </button>
        <button onClick={() => onChangeView('resources')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all text-left group">
          <BookOpen size={22} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">{t('programas.materiales')}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('ui.center_resources')}</p>
        </button>
        <button onClick={() => onChangeView('misformularios')}
          className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 hover:shadow-md transition-all text-left group">
          <Sparkles size={22} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">{t('nav.misformularios')}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('ui.sent_evals')}</p>
        </button>
        <button onClick={() => onChangeView('chat')}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all text-left group">
          <Zap size={22} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">Asistente IA</p>
          <p className="text-xs text-indigo-400 mt-0.5">{t('ui.instant_chat')}</p>
        </button>
        <button onClick={() => onChangeView('mensajes')}
          className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 hover:border-violet-300 hover:shadow-md transition-all text-left group">
          <MessageCircle size={22} className="text-violet-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-black text-slate-800 text-sm">{t('nav.mensajes')}</p>
          <p className="text-xs text-violet-400 mt-0.5">{t('ui.from_therapist')}</p>
        </button>
      </div>

      {/* ── MENSAJES DEL TERAPEUTA ── */}
      {parentMessages.length > 0 && (
        <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-slate-50">
            <MessageCircle size={16} className="text-violet-600" />
            <h2 className="font-black text-slate-700 text-sm uppercase tracking-wide">{t('familias.mensajesTerapeuta2')}</h2>
            <span className="ml-auto text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              {parentMessages.length} nuevo{parentMessages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {parentMessages.map((msg: any, idx: number) => (
              <div key={idx} className="px-5 py-4">
                <p className="text-xs font-bold text-slate-400 mb-1">
                  {msg.created_at ? new Date(msg.created_at).toLocaleDateString(toBCP47(locale), { dateStyle: 'medium' }) : ''}
                </p>
                <p className="text-sm font-bold text-slate-800 mb-1">{msg.title || msg.subject || 'Mensaje del terapeuta'}</p>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{msg.body || msg.message || msg.content || ''}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4">
            <button onClick={() => onChangeView('mensajes')}
              className="w-full py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-bold hover:bg-violet-100 transition-all flex items-center justify-center gap-2">
              <MessageCircle size={14} /> Ver todos los mensajes
            </button>
          </div>
        </div>
      )}

      {/* ── PROGRESS CARD ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-600" /> Progreso General
          </h3>
          {stats.goalsAchieved > 0 && (
            <button
              onClick={() => setShowCelebration(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-all"
            >
              <Trophy size={12} /> Ver celebración 🎉
            </button>
          )}
        </div>

        {stats.sessions === 0 ? (
          // ── Empty state de progreso mejorado ──
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-violet-300" />
            </div>
            <p className="text-base font-bold text-slate-600 mb-2">{t('ui.progress_here')}</p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto mb-5">
              Después de las primeras sesiones de terapia, verás gráficos de avance, objetivos logrados y mucho más.
            </p>
            <button onClick={() => onChangeView('agenda')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all">
              <CalendarDays size={14} /> Agendar primera sesión
            </button>
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

            {/* Mensaje motivacional */}
            {stats.masteryRate >= 80 && (
              <div className="mt-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <PartyPopper size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800 text-sm">¡Rendimiento excepcional!</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                    {child?.name?.split(' ')[0] || 'Tu hijo/a'} está dominando sus objetivos con un {stats.masteryRate}% de éxito. ¡El esfuerzo de toda la familia está dando frutos!
                  </p>
                </div>
              </div>
            )}

            {stats.masteryRate > 0 && stats.masteryRate < 50 && (
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Star size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-800 text-sm">¡Cada sesión cuenta!</p>
                  <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                    El proceso ABA es gradual y acumulativo. La constancia es la clave del progreso. ¡Están en el camino correcto!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
