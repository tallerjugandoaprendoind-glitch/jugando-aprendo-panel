'use client'

import { useI18n } from '@/lib/i18n-context'
// app/admin/components/InteligenciaHubView.tsx
// 🧠 Hub de Inteligencia Artificial — Predicciones + Seguridad + Engagement Padres

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts'
import {
  Brain, Shield, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, RefreshCw, Users, Target,
  Lock, Eye, BarChart3, Zap, ArrowUp, ArrowDown,
  ChevronRight, Activity, Sparkles, Clock, Star, Heart,
  MessageCircle, BookOpen, Award, UserCheck
} from 'lucide-react'

type Tab = 'predicciones' | 'seguridad' | 'patrones' | 'objetivos' | 'reportes' | 'sugerencias'

interface Paciente { id: string; name: string; nombre?: string; diagnosis: string }

interface Prediccion {
  prediccion_30d: number
  prediccion_90d: number
  confianza: number
  tendencia: 'positiva' | 'negativa' | 'estable'
  areas_riesgo: string[]
  areas_fortaleza: string[]
  analisis_ia: string | null
  ultimo_logro: number
  sesiones_analizadas: number
  data_points: { sesion: number; logro: number }[]
}
interface Benchmark {
  scoreGlobal: number
  nivelCompetitivo: string
  centralReachScore: number
  ventaja: number
  metricas: Record<string, { valor: number; score: number; benchmark: { label: string; optimo: number; bueno: number } }>
  analisisEstrategico: string | null
  totalPacientes: number
  totalSesiones: number
}
interface Seguridad {
  scoreSeguridad: number
  totalAccesos: number
  alertasActivas: number
  alertasCriticas: number
  exportacionesTotal: number
  accesosPorRol: Record<string, number>
  actividadHoras: number[]
  estado: 'seguro' | 'alerta' | 'critico'
}

// ─── Helpers visuales ────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, color }: { score: number; size?: number; color: string }) {
  const { t } = useI18n()

  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.22} fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const { t } = useI18n()

  const colors: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors[color] || colors.blue}`}>
      {label}
    </span>
  )
}

// ─── Mini Barra de Progreso ──────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {

  const pct = Math.min(100, (value / max) * 100)
  const colors: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-emerald-500', red: 'bg-red-500',
    yellow: 'bg-amber-500', purple: 'bg-purple-500', gray: 'bg-slate-400'
  }
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${colors[color] || colors.blue}`}
        style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Sparkline con Recharts ──────────────────────────────────────────────────
function Sparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  const { t } = useI18n()
  if (!data || data.length < 2) return <span className="text-xs text-slate-400">{t('common.sinDatos')}</span>
  const pts = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width={100} height={36}>
      <LineChart data={pts} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 2" strokeWidth={1} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Gráfico de líneas de progreso ABA (para analytics) ──────────────────────
function LineChartProgreso({ sesiones, criterio = 90, color = '#7c3aed', titulo = '' }: {

  sesiones: { fecha: string; porcentaje_exito: number; fase?: string }[]
  criterio?: number
  color?: string
  titulo?: string
}) {
  const { t } = useI18n()
  if (!sesiones || sesiones.length < 2) return (
    <div className="flex items-center justify-center h-24 rounded-xl border" style={{ borderColor: 'var(--card-border)', background: 'var(--muted-bg)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('ui.few_sessions')}</p>
    </div>
  )

  const data = sesiones.map((s, i) => ({
    n: i + 1,
    pct: s.porcentaje_exito,
    fecha: s.fecha?.slice(5) || '',
  }))

  return (
    <div className="w-full">
      {titulo && <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>{titulo}</p>}
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
          <XAxis dataKey="n" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11 }}
            formatter={(v: any) => [`${v}%`, locale === 'en' ? 'Achievement' : 'Logro']}
          />
          <ReferenceLine y={criterio} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
          <Area type="monotone" dataKey="pct" fill={`${color}18`} stroke="none" />
          <Line type="monotone" dataKey="pct" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PREDICCIONES
// ═══════════════════════════════════════════════════════════════════════════════
function TabPredicciones({ pacientes }: { pacientes: Paciente[] }) {
    const { t } = useI18n()

    const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null)
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null)
  const [loading, setLoading] = useState(false)

  const generarPrediccion = async (p: Paciente) => {
    setSelectedPaciente(p)
    setLoading(true)
    setPrediccion(null)
    try {
      const res = await fetch('/api/agente-prediccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ locale: localStorage.getItem('vanty_locale') || 'es', childId: p.id, childName: p.name, semanas: 12 })
      })
      const data = await res.json()
      setPrediccion(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const tendenciaIcon = prediccion?.tendencia === 'positiva' ? <TrendingUp size={16} className="text-emerald-500" />
    : prediccion?.tendencia === 'negativa' ? <TrendingDown size={16} className="text-red-500" />
    : <Minus size={16} className="text-slate-400" />

  const tendenciaColor = prediccion?.tendencia === 'positiva' ? 'green'
    : prediccion?.tendencia === 'negativa' ? 'red' : 'blue'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Lista de pacientes */}
      <div className="lg:col-span-1  rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="p-4 border-b" style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)" }}>
          <h3 className="font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Users size={16} className="text-blue-600" /> {t('ui.generarPrediccion2')}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t('hub.iaAnalizara')}</p>
        </div>
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {pacientes.length === 0 && (
            <p className="p-4 text-sm text-slate-400 text-center">{t('ui.no_patients')}</p>
          )}
          {pacientes.map(p => (
            <button key={p.id} onClick={() => generarPrediccion(p)}
              className={`w-full text-left p-3.5 transition-colors flex items-center gap-3 ${selectedPaciente?.id === p.id ? 'border-l-2 border-blue-500' : ''}`} style={{ background: selectedPaciente?.id === p.id ? 'rgba(37,99,235,0.1)' : 'transparent' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = selectedPaciente?.id === p.id ? 'rgba(37,99,235,0.1)' : 'var(--muted-bg)'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = selectedPaciente?.id === p.id ? 'rgba(37,99,235,0.1)' : 'transparent'}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">{(p.name || p.nombre || '?').charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{p.diagnosis || 'Sin diagnóstico'}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Panel predicciones */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedPaciente && !loading && (
          <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <Brain size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="font-medium" style={{ color: "var(--text-muted)" }}>{t('ui.seleccionaPacientePrediccion').replace(' para generar predicción','')} {t('ui.seleccionaPacientePrediccion').split(' para')[1] || ''} predicciones con IA</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">{t('hub.analizandoPatrones')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('ui.calculating')}</p>
          </div>
        )}

        {prediccion && !loading && selectedPaciente && (
          <>
            {/* Header paciente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">{t('hub.analisPorPrograma')}</p>
                  <h3 className="text-xl font-black">{selectedPaciente.name}</h3>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {(prediccion as any).programas_analizados || 0} programas · {(prediccion as any).analisis_por_programa?.reduce((a: number, p: any) => a + p.total_sesiones, 0) || 0} sesiones totales
                  </p>
                </div>
                <div className="bg-white/15 rounded-xl px-3 py-2 text-center">
                  <p className="text-white/70 text-[10px] uppercase tracking-wide">{t('ui.criteria')}</p>
                  <p className="text-white font-black text-sm">≥90% × 2</p>
                  <p className="text-white/70 text-[10px]">sesiones consecutivas</p>
                </div>
              </div>
            </div>

            {/* Sin programas */}
            {((prediccion as any).programas_analizados === 0) && (
              <div className="rounded-xl p-6 text-center border-2 border-dashed" style={{ borderColor: "var(--card-border)", background: "var(--muted-bg)" }}>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Sin programas ABA activos</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('hub.creaProgramas')}el paciente para generar análisis por nivel.</p>
              </div>
            )}

            {/* Por programa */}
            {((prediccion as any).analisis_por_programa || []).map((prog: any) => (
              <div key={prog.programa_id} className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
                {/* Header del programa */}
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate" style={{ color: "var(--text-primary)" }}>{prog.nombre}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{prog.objetivo}</p>
                  </div>
                  <span className={`ml-3 shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    prog.criterio_logrado
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : prog.ultimo_porcentaje >= prog.criterio_dominio
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                    {prog.estado_general}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Métricas clave */}
                  {prog.total_sesiones > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: t('hub.ultimaSesion'), value: `${prog.ultimo_porcentaje}%`, highlight: prog.ultimo_porcentaje >= prog.criterio_dominio },
                          { label: "Media", value: `${prog.media}%`, highlight: false },
                          { label: "Mediana", value: `${prog.mediana}%`, highlight: false },
                        ].map(m => (
                          <div key={m.label} className="rounded-xl p-2.5 text-center border" style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)" }}>
                            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>{m.label}</p>
                            <p className={`text-lg font-black ${m.highlight ? "text-emerald-400" : ""}`} style={!m.highlight ? { color: "var(--text-primary)" } : {}}>
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Sets */}
                      {prog.sets && prog.sets.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t('ui.sets')}</p>
                          {prog.sets.map((set: any) => (
                            <div key={set.nombre} className="flex items-center justify-between rounded-lg px-3 py-2 border" style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)" }}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${set.criterio_logrado ? "bg-emerald-400" : "bg-amber-400"}`}/>
                                <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{set.nombre}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-2">
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>media {set.media}%</span>
                                <span className={`text-xs font-black ${set.criterio_logrado ? "text-emerald-400" : "text-amber-400"}`}>
                                  {set.criterio_logrado ? "✅ Logrado" : `${set.ultimo_pct}%`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tendencia */}
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Tendencia: <span className={`font-bold ${prog.tendencia_slope > 0 ? "text-emerald-400" : prog.tendencia_slope < 0 ? "text-red-400" : ""}`}>
                          {prog.tendencia_descripcion}
                        </span>
                        {" · "}{prog.total_sesiones} sesiones
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>{t('ui.no_sessions')}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Análisis IA general */}
            {(prediccion as any).resumen_general && (
              <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
                <p className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Sparkles size={12} className="text-blue-500" /> ANÁLISIS CLÍNICO IA — SUPERVISORA
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                  {(prediccion as any).resumen_general}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SEGURIDAD
// ═══════════════════════════════════════════════════════════════════════════════
function TabSeguridad() {
  const [datos, setDatos] = useState<Seguridad | null>(null)
  const { locale } = useI18n()
  const isEN = locale === 'en'
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/agente-guardian?tipo=resumen&dias=7'),
        fetch('/api/agente-guardian?tipo=alertas&dias=30')
      ])
      const d1 = await res1.json()
      const d2 = await res2.json()
      setDatos(d1)
      setAlertas(d2.alertas || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const estadoColor = datos?.estado === 'seguro' ? 'emerald' : datos?.estado === 'alerta' ? 'amber' : 'red'
  const scoreColor = (datos?.scoreSeguridad || 0) >= 80 ? '#10b981' : (datos?.scoreSeguridad || 0) >= 60 ? '#f59e0b' : '#ef4444'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Score header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1  rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center" style={{ background: "var(--card)" }}>
          <div className="relative">
            <ScoreRing score={datos?.scoreSeguridad || 0} size={100} color={scoreColor} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black" style={{ color: scoreColor }}>{datos?.scoreSeguridad}</span>
            </div>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase mt-2">Score Seguridad</p>
          <Badge label={datos?.estado || 'desconocido'} color={estadoColor} />
        </div>

        {[
          { icon: Eye, label: isEN ? 'Accesses (7d)' : 'Accesos (7d)', value: datos?.totalAccesos || 0, color: 'blue' },
          { icon: AlertTriangle, label: isEN ? 'Active alerts' : 'Alertas activas', value: datos?.alertasActivas || 0, color: (datos?.alertasActivas || 0) > 0 ? 'red' : 'green' },
          { icon: Shield, label: isEN ? 'Exports' : 'Exportaciones', value: datos?.exportacionesTotal || 0, color: 'purple' },
        ].map(m => (
          <div key={m.label} className=" rounded-2xl border border-slate-200 p-5 flex flex-col justify-between" style={{ background: "var(--card)" }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              m.color === 'blue' ? 'bg-blue-50' : m.color === 'red' ? 'bg-red-50' : m.color === 'green' ? 'bg-emerald-50' : 'bg-purple-50'
            }`}>
              <m.icon size={18} className={
                m.color === 'blue' ? 'text-blue-600' : m.color === 'red' ? 'text-red-600' : m.color === 'green' ? 'text-emerald-600' : 'text-purple-600'
              } />
            </div>
            <p className={`text-3xl font-black ${
              m.color === 'blue' ? 'text-blue-700' : m.color === 'red' ? 'text-red-600' : m.color === 'green' ? 'text-emerald-600' : 'text-purple-700'
            }`}>{m.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Accesos por rol */}
      {datos?.accesosPorRol && Object.keys(datos.accesosPorRol).length > 0 && (
        <div className=" rounded-2xl border border-slate-200 p-5" style={{ background: "var(--card)" }}>
          <h4 className="font-black text-slate-700 text-sm mb-4 flex items-center gap-2">
            <Users size={14} className="text-blue-500" /> Accesos por Rol (últimos 7 días)
          </h4>
          <div className="space-y-3">
            {Object.entries(datos.accesosPorRol).map(([rol, count]) => {
              const total = Object.values(datos.accesosPorRol).reduce((a, b) => a + b, 0)
              const pct = Math.round((count / total) * 100)
              return (
                <div key={rol}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 capitalize">{rol}</span>
                    <span className="text-slate-400">{count} accesos ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} color="blue" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alertas activas */}
      <div className=" rounded-2xl border border-slate-200 overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" /> Alertas de Seguridad
          </h4>
          <button onClick={cargar} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
            <RefreshCw size={11} /> Actualizar
          </button>
        </div>
        {alertas.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">✅ Sin alertas activas. Sistema seguro.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {alertas.map((a, i) => (
              <div key={i} className={`p-4 flex gap-3 ${a.nivel === 'critico' ? 'bg-red-50' : 'bg-amber-50/30'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.nivel === 'critico' ? 'bg-red-100' : 'bg-amber-100'}`}>
                  <AlertTriangle size={14} className={a.nivel === 'critico' ? 'text-red-600' : 'text-amber-600'} />
                </div>
                <div>
                  <p className="font-black text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{a.tipo?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{a.descripcion}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(a.timestamp).toLocaleString('es')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: COMPETITIVIDAD
// ═══════════════════════════════════════════════════════════════════════════════
function TabCompetitividad() {
  const { t } = useI18n()

  const [datos, setDatos] = useState<Benchmark | null>(null)
  const [loading, setLoading] = useState(true)
  const [dias, setDias] = useState(30)

  const cargar = useCallback(async (d = dias) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/benchmark?dias=${d}`)
      setDatos(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dias])

  useEffect(() => { cargar() }, [cargar])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  )

  if (!datos) return null

  const scoreColor = datos.scoreGlobal >= 80 ? '#10b981' : datos.scoreGlobal >= 65 ? '#3b82f6' : datos.scoreGlobal >= 50 ? '#f59e0b' : '#ef4444'
  const ventajaPositiva = datos.ventaja > 0

  return (
    <div className="space-y-5">
      {/* Header competitivo */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-200 text-xs font-black uppercase tracking-wider mb-1">Score Competitivo</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black">{datos.scoreGlobal}</span>
              <span className="text-purple-300 text-lg mb-1">/100</span>
            </div>
            <p className="text-purple-100 font-bold mt-1">{datos.nivelCompetitivo}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm mb-2 ${ventajaPositiva ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
              {ventajaPositiva ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {Math.abs(datos.ventaja)} pts vs Central Reach
            </div>
            <p className="text-purple-300 text-xs">Central Reach: {datos.centralReachScore}/100</p>
            <p className="text-purple-400 text-xs mt-1">{datos.totalPacientes} pacientes · {datos.totalSesiones} sesiones</p>
          </div>
        </div>

        {/* Mini comparativa visual */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-200 w-28">Jugando Aprendo</span>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${datos.scoreGlobal}%` }} />
            </div>
            <span className="text-white font-black w-8">{datos.scoreGlobal}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-300 w-28">Central Reach</span>
            <div className="flex-1 bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full bg-purple-300 transition-all duration-700" style={{ width: `${datos.centralReachScore}%` }} />
            </div>
            <span className="text-purple-300 font-black w-8">{datos.centralReachScore}</span>
          </div>
        </div>
      </div>

      {/* Métricas detalladas */}
      <div className=" rounded-2xl border border-slate-200 overflow-hidden" style={{ background: "var(--card)" }}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
            <BarChart3 size={14} className="text-purple-500" /> Métricas vs Estándares de Industria
          </h4>
          <div className="flex gap-1.5">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => { setDias(d); cargar(d) }}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors ${dias === d ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(datos.metricas).map(([key, m]) => {
            const score = Math.round(m.score)
            const scoreColor = score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'red'
            return (
              <div key={key} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-bold text-slate-700 truncate">{m.benchmark.label}</p>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-sm font-black text-slate-800" style={{ color: "var(--text-primary)" }}>{m.valor}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        scoreColor === 'green' ? 'bg-emerald-100 text-emerald-700' :
                        scoreColor === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>{score}%</span>
                    </div>
                  </div>
                  <ProgressBar value={score} color={scoreColor === 'green' ? 'green' : scoreColor === 'yellow' ? 'yellow' : 'red'} />
                  <p className="text-[10px] text-slate-400 mt-1">Óptimo: {m.benchmark.optimo} · Bueno: {m.benchmark.bueno}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Análisis estratégico IA */}
      {datos.analisisEstrategico && (
        <div className=" rounded-2xl border border-slate-200 p-5" style={{ background: "var(--card)" }}>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-500" /> ANÁLISIS ESTRATÉGICO IA
          </p>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {datos.analisisEstrategico}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PATRONES ABA (CAPA 1)
// ═══════════════════════════════════════════════════════════════════════════════
function TabPatrones({ pacientes }: { pacientes: Paciente[] }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  const [selected, setSelected] = useState<Paciente | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analizar = async () => {
    if (!selected) return
    setLoading(true); setError(''); setResultado(null)
    try {
      const res = await fetch('/api/agente-patrones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ locale: localStorage.getItem('vanty_locale') || 'es', childId: selected.id, childName: selected.name }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResultado(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const colorTipo: Record<string, string> = {
    regresion: 'bg-red-100 text-red-700 border-red-200',
    estancamiento: 'bg-amber-100 text-amber-700 border-amber-200',
    aceleracion: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inconsistencia: 'bg-orange-100 text-orange-700 border-orange-200',
    dominio: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  return (
    <div className="space-y-4">
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} className="text-violet-600" />
          <span className="font-bold text-violet-800 text-sm">{t('hub.detectorPatrones')}</span>
        </div>
        <p className="text-xs text-violet-600">Analiza el historial de sesiones y detecta regresiones, estancamientos, aceleraciones e inconsistencias.</p>
      </div>
      <div className=" rounded-2xl border border-slate-100 p-4 space-y-3" style={{ background: "var(--card)" }}>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('ui.select_patient')}</label>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">{t('hub.seleccionar')}</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={analizar} disabled={!selected || loading}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
          {loading ? <><RefreshCw size={14} className="animate-spin" /> Analizando patrones...</> : <><Activity size={14} /> Detectar Patrones</>}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
      {resultado && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: isEN ? 'Sessions' : 'Sesiones', val: resultado.sesiones_analizadas || 0 },
              { label: isEN ? 'Patterns' : 'Patrones', val: resultado.patrones?.length || 0 },
              { label: isEN ? 'Urgent' : 'Urgentes', val: resultado.patrones_urgentes || 0 },
            ].map(m => (
              <div key={m.label} className=" rounded-xl border border-slate-100 p-3 text-center" style={{ background: "var(--card)" }}>
                <p className="text-2xl font-black text-slate-800" style={{ color: "var(--text-primary)" }}>{m.val}</p>
                <p className="text-xs text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
          {(resultado.patrones || []).map((p: any, i: number) => (
            <div key={i} className={`rounded-xl border p-4 ${colorTipo[p.tipo] || 'border-slate-200'}`} style={{ background: "var(--card)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${colorTipo[p.tipo] || ''}`}>{p.tipo}</span>
                <span className="text-xs text-slate-400">{p.confianza}% confianza</span>
              </div>
              <p className="font-bold text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{p.area}</p>
              <p className="text-xs text-slate-600 mt-1">{p.descripcion}</p>
              <p className="text-xs font-semibold mt-2 rounded-lg px-3 py-2" style={{ background: "var(--muted-bg)", color: "var(--text-secondary)" }}>💡 {p.accion_sugerida}</p>
            </div>
          ))}
          {(resultado.analisis_ia || resultado.resumen) && (
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
              <p className="text-xs font-bold text-violet-700 mb-2">Resumen IA</p>
              <p className="text-sm text-violet-800">{resultado.analisis_ia || resultado.resumen}</p>
            </div>
          )}
          {/* Gráficos de progreso por programa */}
          {resultado.programas && resultado.programas.length > 0 && (
            <div className="rounded-xl border p-4" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                📈 Progreso por programa
              </p>
              <div className="space-y-4">
                {resultado.programas.slice(0, 4).map((prog: any) => (
                  prog.sesiones?.length >= 2 && (
                    <LineChartProgreso
                      key={prog.id}
                      sesiones={prog.sesiones}
                      criterio={prog.criterio || 90}
                      titulo={prog.titulo}
                      color="#7c3aed"
                    />
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OBJETIVOS ADAPTATIVOS (CAPA 1)
// ═══════════════════════════════════════════════════════════════════════════════
function TabObjetivos({ pacientes }: { pacientes: Paciente[] }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  const [selected, setSelected] = useState<Paciente | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [accion, setAccion] = useState<'generar' | 'ajustar' | 'evaluar_dominio'>('generar')
  const [error, setError] = useState('')

  const ejecutar = async () => {
    if (!selected) return
    setLoading(true); setError(''); setResultado(null)
    try {
      const res = await fetch('/api/agente-objetivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ locale: localStorage.getItem('vanty_locale') || 'es', childId: selected.id, childName: selected.name, accion }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResultado(json)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-amber-600" />
          <span className="font-bold text-amber-800 text-sm">{t('hub.generadorObjetivos')}</span>
        </div>
        <p className="text-xs text-amber-600">Genera o ajusta objetivos terapéuticos ABA automáticamente según el progreso real del paciente.</p>
      </div>
      <div className=" rounded-2xl border border-slate-100 p-4 space-y-3" style={{ background: "var(--card)" }}>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">{t('hub.selecPaciente')}</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-2">
          {((isEN ? [['generar', 'Generate new'], ['ajustar', 'Adjust existing'], ['evaluar_dominio', 'Evaluate mastery']] : [['generar', 'Generar nuevos'], ['ajustar', 'Ajustar existentes'], ['evaluar_dominio', 'Evaluar dominio']]) as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setAccion(val)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${accion === val ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              {lbl}
            </button>
          ))}
        </div>
        <button onClick={ejecutar} disabled={!selected || loading}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
          {loading ? <><RefreshCw size={14} className="animate-spin" /> {t('common.procesando')}</> : <><Target size={14} /> Ejecutar</>}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
      {resultado && (
        <div className="space-y-3">
          {/* generar → resultado.resultado.objetivos_sugeridos */}
          {(resultado.resultado?.objetivos_sugeridos || []).map((obj: any, i: number) => (
            <div key={i} className=" rounded-xl border border-amber-100 p-4" style={{ background: "var(--card)" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{obj.titulo}</p>
                <div className="flex gap-1">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{obj.area}</span>
                  {obj.prioridad && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${obj.prioridad === 'alta' ? 'bg-red-100 text-red-600' : obj.prioridad === 'media' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{obj.prioridad}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-500">{obj.descripcion}</p>
              {obj.criterio_dominio && <p className="text-xs font-semibold text-slate-600 mt-1">✓ Meta: {obj.criterio_dominio}</p>}
              {obj.metodologia && <p className="text-xs text-slate-500 mt-1">Método: {obj.metodologia}</p>}
              {obj.justificacion_clinica && <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-2 rounded-lg">{obj.justificacion_clinica}</p>}
            </div>
          ))}
          {/* ajustar → resultado.resultado.ajustes */}
          {(resultado.resultado?.ajustes || []).map((obj: any, i: number) => (
            <div key={i} className=" rounded-xl border border-orange-100 p-4" style={{ background: "var(--card)" }}>
              <p className="font-bold text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{obj.area}</p>
              <p className="text-xs text-slate-600 mt-1"><strong>{t('hub.queAjustar')}</strong> {obj.que_ajustar}</p>
              <p className="text-xs text-slate-600 mt-1"><strong>{t('hub.como')}</strong> {obj.como_ajustar}</p>
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-2 rounded-lg">Meta 4 semanas: {obj.meta_4_semanas}</p>
            </div>
          ))}
          {/* evaluar_dominio → resultado.resultado.evaluaciones */}
          {(resultado.resultado?.evaluaciones || []).map((obj: any, i: number) => (
            <div key={i} className=" rounded-xl border border-blue-100 p-4" style={{ background: "var(--card)" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{obj.programa}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${obj.estado === 'listo_para_avanzar' ? 'bg-green-100 text-green-700' : obj.estado === 'necesita_ajuste' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{obj.estado?.replace(/_/g,' ')}</span>
              </div>
              <p className="text-xs text-slate-600">Acción: {obj.accion}</p>
              <p className="text-xs text-slate-500 mt-1">{obj.justificacion}</p>
              {obj.siguiente_paso && <p className="text-xs text-blue-700 mt-2 bg-blue-50 px-3 py-2 rounded-lg">→ {obj.siguiente_paso}</p>}
            </div>
          ))}
          {/* texto_libre fallback */}
          {resultado.resultado?.texto_libre && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{resultado.resultado.texto_libre}</p>
            </div>
          )}
          <p className="text-xs text-slate-400">Programas analizados: {resultado.programas_analizados || 0} · Patrones considerados: {resultado.patrones_considerados || 0}</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ALERTAS PROACTIVAS (CAPA 4)
// ═══════════════════════════════════════════════════════════════════════════════
function TabSugerencias() {
  const { t } = useI18n()

  const [sugerencias, setSugerencias] = useState<any[]>([])
  const [insightGlobal, setInsightGlobal] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ urgentes: number; pacientes_analizados: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true); setError('')
    try {
      // ✅ FIX: usar GET (no POST). POST solo sirve para marcar sugerencias como resueltas.
      const res = await fetch('/api/agente-sugerencias')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setSugerencias(json.sugerencias || [])
      setInsightGlobal(json.insight_global || null)
      setMeta({ urgentes: json.urgentes || 0, pacientes_analizados: json.pacientes_analizados || 0 })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const prioColor: Record<string, string> = {
    alta: 'bg-red-100 text-red-700 border-red-200',
    media: 'bg-amber-100 text-amber-700 border-amber-200',
    baja: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-orange-600" />
            <span className="font-bold text-orange-800 text-sm">Alertas Proactivas — CAPA 4</span>
          </div>
          <p className="text-xs text-orange-600">{t('hub.iaAlertaAntes')}</p>
          {meta && (
            <p className="text-[11px] text-orange-500 mt-1">
              {meta.pacientes_analizados} pacientes analizados · {meta.urgentes} alertas urgentes
            </p>
          )}
        </div>
        <button onClick={cargar} disabled={loading} className="p-2 hover:bg-orange-100 rounded-xl transition">
          <RefreshCw size={14} className={`text-orange-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Insight global IA (solo aparece si hay ≥2 alertas urgentes) */}
      {insightGlobal && (
        <div className=" rounded-xl border border-orange-200 p-4" style={{ background: "var(--card)" }}>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> RESUMEN EJECUTIVO IA
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{insightGlobal}</p>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
      {loading && <div className="flex justify-center py-8"><RefreshCw size={24} className="animate-spin text-orange-400" /></div>}
      {!loading && sugerencias.length === 0 && (
        <div className=" rounded-2xl border border-slate-100 p-10 text-center" style={{ background: "var(--card)" }}>
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700" style={{ color: "var(--text-secondary)" }}>Sin alertas activas</p>
          <p className="text-xs text-slate-400 mt-1">{t('hub.todosPacientesOk')}</p>
        </div>
      )}
      {sugerencias.map((s: any, i: number) => (
        <div key={i} className=" rounded-xl border border-slate-100 p-4" style={{ background: "var(--card)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${prioColor[s.prioridad]}`}>{s.prioridad}</span>
              <span className="ml-2 text-[10px] text-slate-400">{s.child_name}</span>
            </div>
            <span className="text-[10px] text-slate-400">{s.semanas_detectado}w</span>
          </div>
          <p className="font-bold text-sm text-slate-800" style={{ color: "var(--text-primary)" }}>{s.titulo}</p>
          <p className="text-xs text-slate-500 mt-1">{s.descripcion}</p>
          <p className="text-xs font-semibold mt-2 rounded-lg px-3 py-2" style={{ background: "var(--muted-bg)", color: "var(--text-secondary)" }}>→ {s.accion_concreta}</p>
          {s.dato_clave && <p className="text-[10px] text-slate-400 mt-1">Dato: {s.dato_clave}</p>}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: REPORTES IA (CAPA 2)
// ═══════════════════════════════════════════════════════════════════════════════
function TabReportes({ pacientes }: { pacientes: Paciente[] }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  const [selected, setSelected] = useState<Paciente | null>(null)
  const [tipo, setTipo] = useState<'padres' | 'seguro' | 'comparativo'>('padres')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const generar = async () => {
    if (!selected) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/reporte-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ locale: localStorage.getItem('vanty_locale') || 'es', childId: selected.id, tipo }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || (isEN ? 'Error generating report' : 'Error generando reporte'))
      }
      // Descargar el .docx directamente
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') || ''
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match?.[1] || `Report_${tipo}_${selected.name}.docx`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(`✅ Reporte Word descargado: ${a.download}`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const tipoInfo = {
    padres:      { label: isEN ? 'For parents'  : 'Para padres',         desc: isEN ? 'Emotional and accessible language'         : 'Lenguaje emocional y accesible',    emoji: '👨‍👩‍👧' },
    seguro:      { label: isEN ? 'For insurance' : 'Para seguros / IMSS', desc: isEN ? 'Technical-legal format with ICD-10'         : 'Formato técnico-legal con CIE-10',  emoji: '🏥' },
    comparativo: { label: isEN ? 'Comparative + pred.' : 'Comparativo + pred.', desc: isEN ? '"In 3 months they will achieve X"' : '"En 3 meses logrará X"', emoji: '📊' },
  }

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-teal-600" />
          <span className="font-bold text-teal-800 text-sm">Reportes Profesionales Word — CAPA 2</span>
        </div>
        <p className="text-xs text-teal-600">Genera documentos .docx profesionales listos para imprimir o enviar: para padres, aseguradoras o análisis comparativo.</p>
      </div>
      <div className=" rounded-2xl border border-slate-100 p-4 space-y-3" style={{ background: "var(--card)" }}>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{'Paciente'}</label>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">{t('hub.seleccionar')}</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('hub.tipoReporte')}</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(tipoInfo) as [typeof tipo, typeof tipoInfo['padres']][]).map(([k, v]) => (
            <button key={k} onClick={() => setTipo(k)}
              className={`p-3 rounded-xl border text-left transition ${tipo === k ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-teal-200'}`}>
              <p className="text-lg mb-1">{v.emoji}</p>
              <p className={`text-xs font-bold ${tipo === k ? 'text-teal-700' : 'text-slate-600'}`}>{v.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>

        <button onClick={generar} disabled={!selected || loading}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Generando documento Word...</>
            : <><BookOpen size={14} /> Generar y Descargar .docx</>}
        </button>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-red-600 text-xs">{error}</p></div>}
        {success && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><p className="text-emerald-700 text-sm font-semibold">{success}</p></div>}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '👨‍👩‍👧', title: isEN ? 'Parents' : 'Padres', desc: isEN ? 'Emotional letter with achievements, home activities and prediction. No jargon.' : 'Carta emocional con logros, actividades en casa y predicción. Sin tecnicismos.' },
          { emoji: '🏥', title: isEN ? 'Insurance' : 'Seguros', desc: isEN ? 'ICD-10, medical justification, program table, professional signature.' : 'CIE-10, justificación médica, tabla de programas, firma profesional.' },
          { emoji: '📊', title: isEN ? 'Comparative' : 'Comparativo', desc: isEN ? 'Progress between periods with 30 and 90-day prediction charts.' : 'Progreso entre períodos con gráficos de predicción a 30 y 90 días.' },
        ].map((c, i) => (
          <div key={i} className=" border border-slate-100 rounded-xl p-3" style={{ background: "var(--card)" }}>
            <p className="text-xl mb-1">{c.emoji}</p>
            <p className="text-xs font-bold text-slate-700" style={{ color: "var(--text-secondary)" }}>{c.title}</p>
            <p className="text-[10px] text-slate-400 mt-1">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function InteligenciaHubView() {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const [tab, setTab] = useState<Tab>('predicciones')
  const [pacientes, setPacientes] = useState<Paciente[]>([])

  useEffect(() => {
    // Usar API server-side que bypassa RLS de Supabase
    fetch('/api/admin/children')
      .then(r => r.json())
      .then(json => {
        const data = json.data || []
        setPacientes(data.map((r: any) => ({
          id: r.id,
          name: r.name || r.nombre || (typeof window !== 'undefined' && localStorage.getItem('vanty_locale') === 'en' ? 'No name' : 'Sin nombre'),
          diagnosis: r.diagnosis || r.diagnostico || '',
        })))
      })
      .catch(e => console.error('Error cargando pacientes Hub IA:', e))
  }, [])

  const tabs = [
    { id: 'predicciones' as Tab, icon: Brain, label: t('hub.predicciones'), color: 'blue' },
    { id: 'patrones' as Tab, icon: Activity, label: isEN ? 'ABA Patterns' : 'Patrones ABA', color: 'violet' },
    { id: 'objetivos' as Tab, icon: Target, label: isEN ? 'AI Goals' : 'Objetivos IA', color: 'amber' },
    { id: 'sugerencias' as Tab, icon: Sparkles, label: isEN ? 'Proactive Alerts' : 'Alertas Proactivas', color: 'orange' },
    { id: 'reportes' as Tab, icon: BookOpen, label: isEN ? 'AI Reports' : 'Reportes IA', color: 'teal' },
    { id: 'seguridad' as Tab, icon: Shield, label: isEN ? 'Security' : 'Seguridad', color: 'emerald' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800" style={{ color: "var(--text-primary)" }}>{t('hub.hubInteligencia')}</h1>
          <p className="text-xs text-slate-400">6 agentes IA · Predicciones · Patrones · Objetivos · Reportes · Seguridad</p>
        </div>
      </div>

      {/* Tabs scrollable */}
      <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1.5 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.id
                ? `bg-white shadow-sm ${
                    t.color === 'blue' ? 'text-blue-700' :
                    t.color === 'violet' ? 'text-violet-700' :
                    t.color === 'amber' ? 'text-amber-700' :
                    t.color === 'orange' ? 'text-orange-700' :
                    t.color === 'teal' ? 'text-teal-700' :
                    'text-emerald-700'
                  }`
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'predicciones' && <TabPredicciones pacientes={pacientes} />}
      {tab === 'patrones' && <TabPatrones pacientes={pacientes} />}
      {tab === 'objetivos' && <TabObjetivos pacientes={pacientes} />}
      {tab === 'sugerencias' && <TabSugerencias />}
      {tab === 'reportes' && <TabReportes pacientes={pacientes} />}
      {tab === 'seguridad' && <TabSeguridad />}
    </div>
  )
}
