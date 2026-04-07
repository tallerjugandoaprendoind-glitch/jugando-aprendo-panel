'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar,
  Baby, ChevronRight, Activity, ArrowUpRight,
  Plus, Brain, Sparkles, Users, Heart, BookOpen, AlertTriangle
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
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all duration-500"
            style={{ height: `${Math.max(2, (v / max) * 36)}px`, background: i === values.length - 1 ? color : `${color}55` }} />
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

function KPI({ label, value, sub, icon: Icon, color, onClick, isText }: any) {
  return (
    <button onClick={onClick}
      className="rounded-xl p-4 text-left hover:opacity-90 transition-all relative overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: color }} />
      <div className="pl-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <p className={`${isText ? 'text-base' : 'text-3xl'} font-black tabular-nums mb-0.5`} style={{ color: 'var(--text-primary)' }}>
          {value ?? '—'}
        </p>
        <p className="text-[11px] font-black mb-0.5" style={{ color }}>{label}</p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
    </button>
  )
}

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const { locale } = useI18n()

  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0, citasHoy: 0, totalPacientes: 0, sesionesEstaSemana: 0 })
  const [recientes, setRecientes]         = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [ultimaSesion, setUltimaSesion]   = useState<string | null>(null)
  const [pacientesRecientes, setPacientesRecientes] = useState<any[]>([])
  const [sesSemanales, setSesSemanales]   = useState<number[]>([0,0,0,0,0,0,0])
  const [diasLabels, setDiasLabels]       = useState<string[]>(['L','M','M','J','V','S','D'])
  const [loading, setLoading]             = useState(true)
  const [tipIndex]                        = useState(() => Math.floor(Math.random() * TIPS_CLINICOS.length))
  const [horaActual, setHoraActual]       = useState<Date | null>(null)
  const [saludo, setSaludo]               = useState('')
  const [fechaStr, setFechaStr]           = useState('')

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

      const [subRes, citRes, nRes, sesRes, sesDetalle, ultSesRes] = await Promise.all([
        supabase.from('specialist_submissions').select('status').eq('specialist_id', userId),
        supabase.from('appointments').select('appointment_date, appointment_time, children(name)').eq('appointment_date', hoy).neq('status', 'cancelled').order('appointment_time'),
        supabase.from('children').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('appointments').select('id').neq('status', 'cancelled').gte('appointment_date', hace7dias),
        supabase.from('appointments').select('appointment_date').neq('status', 'cancelled').gte('appointment_date', datesArr[0]),
        supabase.from('appointments').select('appointment_date').neq('status', 'cancelled').lt('appointment_date', hoy).order('appointment_date', { ascending: false }).limit(1),
      ])

      const subs = subRes.data || []
      const ultDate = ultSesRes.data?.[0]?.appointment_date
      setUltimaSesion(ultDate ? new Date(ultDate + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : null)

      const sesMap: Record<string, number> = {}
      datesArr.forEach(d => { sesMap[d] = 0 })
      ;(sesDetalle.data || []).forEach((s: any) => { if (sesMap[s.appointment_date] !== undefined) sesMap[s.appointment_date]++ })
      setSesSemanales(Object.values(sesMap))

      setStats({
        pendientes: subs.filter(s => s.status === 'pending_approval').length,
        aprobadas: subs.filter(s => s.status === 'approved').length,
        rechazadas: subs.filter(s => s.status === 'rejected').length,
        citasHoy: (citRes.data || []).length,
        totalPacientes: nRes.count || 0,
        sesionesEstaSemana: (sesRes.data || []).length,
      })
      setProximasCitas(citRes.data || [])

      const { data: rec } = await supabase.from('specialist_submissions').select('*, children(name)').eq('specialist_id', userId).order('created_at', { ascending: false }).limit(5)
      setRecientes(rec || [])

      const { data: pacs } = await supabase.from('children').select('id, name, birth_date, is_active').eq('is_active', true).order('created_at', { ascending: false }).limit(4)
      setPacientesRecientes(pacs || [])
    } finally { setLoading(false) }
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  const tip      = TIPS_CLINICOS[tipIndex]
  const total    = stats.aprobadas + stats.pendientes + stats.rechazadas
  const totalSes = sesSemanales.reduce((a, b) => a + b, 0)

  const STATUS_CFG: Record<string, any> = {
    pending_approval: { label: 'En revisión', color: '#b45309', bg: '#fef3c7', dot: '#f59e0b', Icon: Clock },
    approved:         { label: 'Aprobada',    color: '#065f46', bg: '#d1fae5', dot: '#10b981', Icon: CheckCircle2 },
    rejected:         { label: 'Rechazada',   color: '#991b1b', bg: '#fee2e2', dot: '#ef4444', Icon: XCircle },
  }

  const horaFmt = horaActual ? horaActual.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''

  return (
    <div className="space-y-4 pb-8">

      {/* HERO */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f4c75 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #38bdf8, transparent)', transform: 'translate(35%,-35%)' }} />
        <div className="relative p-5 md:p-7">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest capitalize">{fechaStr}</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
                {saludo}, {profile?.role === 'especialista' ? 'Especialista' : profile?.full_name?.split(' ')[0] || 'Bienvenida'} 👋
              </h2>
            </div>
            {horaActual && (
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl md:text-4xl font-black text-white tabular-nums tracking-tight leading-none">{horaFmt}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{String(horaActual.getSeconds()).padStart(2,'0')}s</p>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-xs font-medium mb-4">{profile?.specialty || 'Especialista Clínico'}</p>
          <div className="flex flex-wrap items-center gap-2">
            {stats.citasHoy > 0 ? (
              <button onClick={() => setActiveView('agenda')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 hover:bg-white/10 transition-all" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Calendar size={12} className="text-sky-400" />{stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <CheckCircle2 size={12} className="text-emerald-400" /> 0 sesiones hoy
              </div>
            )}
            {stats.pendientes > 0 && (
              <button onClick={() => setActiveView('formularios')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 border border-amber-400/30 hover:bg-amber-400/10 transition-all" style={{ background: 'rgba(251,191,36,0.08)' }}>
                <AlertTriangle size={12} />{stats.pendientes} sin sesión (30d)<ArrowUpRight size={11} />
              </button>
            )}
            <button onClick={() => setActiveView('formularios')} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-md whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>
              <Sparkles size={12} /> Nueva evaluación
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Pacientes"     value={loading ? '—' : stats.totalPacientes}     sub="Total activos"      icon={Users}    color="#8b5cf6" onClick={() => setActiveView('pacientes')} />
        <KPI label="Citas"         value={loading ? '—' : stats.sesionesEstaSemana} sub="Últimos 7 días"     icon={Activity} color="#10b981" onClick={() => setActiveView('agenda')} />
        <KPI label="Evaluaciones"  value={loading ? '—' : total}                   sub="Total registradas"  icon={FileText} color="#f59e0b" onClick={() => setActiveView('formularios')} />
        <KPI label="Última sesión" value={loading ? '—' : (ultimaSesion ?? '—')}   sub="Fecha más reciente" icon={Calendar} color="#3b82f6" onClick={() => setActiveView('agenda')} isText />
      </div>

      {/* CONTENIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Columna izquierda */}
        <div className="space-y-4">

          {/* Sesiones semanales */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sesiones — últimos 7 días</p>
              <span className="text-lg font-black" style={{ color: '#3b82f6' }}>{loading ? '—' : totalSes}</span>
            </div>
            {loading
              ? <div className="h-10 rounded animate-pulse" style={{ background: 'var(--card-border)' }} />
              : <BarChart values={sesSemanales} labels={diasLabels} color="#3b82f6" />}
          </div>

          {/* Mis pacientes */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: '#8b5cf6' }} />
                <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Mis pacientes</p>
              </div>
              <button onClick={() => setActiveView('pacientes')} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                Ver todos <ChevronRight size={12} />
              </button>
            </div>
            {loading ? (
              <div>{[1,2,3].map(i => (
                <div key={i} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <div className="w-8 h-8 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--card-border)' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 rounded animate-pulse w-3/4" style={{ background: 'var(--card-border)' }} />
                    <div className="h-2 rounded animate-pulse w-1/2" style={{ background: 'var(--card-border)' }} />
                  </div>
                </div>
              ))}</div>
            ) : pacientesRecientes.length === 0 ? (
              <div className="px-4 py-6 text-center"><p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sin pacientes activos</p></div>
            ) : (
              <div>
                {pacientesRecientes.map((p: any) => {
                  const edad = p.birth_date ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)) : null
                  const initials = p.name?.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase() || '?'
                  const clrs = ['#8b5cf6','#3b82f6','#10b981','#f59e0b']
                  const clr  = clrs[p.id?.charCodeAt(0) % clrs.length] || '#8b5cf6'
                  return (
                    <button key={p.id} onClick={() => setActiveView('pacientes')} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:opacity-80 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black" style={{ background: clr }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        {edad !== null && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{edad} año{edad !== 1 ? 's' : ''}</p>}
                      </div>
                      <ChevronRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    </button>
                  )
                })}
                {stats.totalPacientes > 4 && (
                  <button onClick={() => setActiveView('pacientes')} className="w-full px-4 py-2.5 text-center text-xs font-black" style={{ color: '#8b5cf6' }}>
                    +{stats.totalPacientes - 4} más
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tip clínico */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: '#0ea5e9' }} />
              <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#0ea5e9' }}>Tip clínico del día</p>
            </div>
            <div className="text-2xl mb-2">{tip.emoji}</div>
            <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>{tip.texto}</p>
          </div>

          {/* Recordatorio */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={13} style={{ color: '#a855f7' }} />
              <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#a855f7' }}>Recordatorio</p>
            </div>
            <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
              Tu trabajo hace una diferencia real en la vida de cada familia. ¡Gracias por tu dedicación! 💜
            </p>
          </div>
        </div>

        {/* Columna derecha — Evaluaciones + Citas */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="flex items-center gap-2.5">
              <BookOpen size={14} style={{ color: '#3b82f6' }} />
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Mis evaluaciones recientes</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveView('formularios')} className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-black rounded-lg hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <Plus size={12} /> Nueva
              </button>
              <button onClick={() => setActiveView('formularios')} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                Ver todo <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--card-border)', borderTopColor: '#3b82f6' }} />
            </div>
          ) : recientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} className="mb-4" />
              <p className="font-black text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Sin evaluaciones aún</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Registra el progreso de tus pacientes.</p>
              <button onClick={() => setActiveView('formularios')} className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-black rounded-xl hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                <Plus size={15} /> Nueva evaluación
              </button>
            </div>
          ) : (
            <>
              <div>
                {recientes.map((r) => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending_approval
                  const { Icon: StatusIcon } = cfg
                  return (
                    <div key={r.id} className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:opacity-80 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }} onClick={() => setActiveView('formularios')}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                        <StatusIcon size={15} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{r.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Baby size={10} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{r.children?.name}</p>
                          <span style={{ color: 'var(--card-border)' }}>·</span>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                        <span className="text-xs font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {proximasCitas.length > 0 && (
                <>
                  <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--card-border)', borderTop: '1px solid var(--card-border)' }}>
                    <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Citas de hoy</p>
                  </div>
                  <div>
                    {proximasCitas.slice(0, 3).map((c: any, i: number) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }} onClick={() => setActiveView('agenda')}>
                        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-blue-600 text-white">
                          <span className="text-[8px] font-bold leading-none">{new Date().toLocaleDateString('es', { month: 'short' }).toUpperCase().slice(0,3)}</span>
                          <span className="text-sm font-black leading-none">{new Date().getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate" style={{ color: 'var(--text-primary)' }}>{c.children?.name || 'Paciente'}</p>
                          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={9} /> {c.appointment_time?.slice(0, 5)}<span className="font-bold text-blue-500"> · Hoy</span>
                          </p>
                        </div>
                        <ChevronRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="px-5 py-4">
                <button onClick={() => setActiveView('formularios')} className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2" style={{ border: '2px dashed var(--card-border)', color: 'var(--text-muted)' }}>
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
