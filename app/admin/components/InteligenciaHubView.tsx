'use client'
// app/admin/components/InteligenciaHubView.tsx
// 🧠 Hub de Inteligencia Artificial — Predicciones + Seguridad + Engagement Padres

import { useState, useEffect, useCallback } from 'react'
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

// ─── Sparkline mini-chart ────────────────────────────────────────────────────
function Sparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return <span className="text-xs text-slate-400">Sin datos</span>
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80; const h = 30
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PREDICCIONES
// ═══════════════════════════════════════════════════════════════════════════════
function TabPredicciones({ pacientes }: { pacientes: Paciente[] }) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: p.id, childName: p.name, semanas: 12 })
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
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Selecciona un paciente
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">La IA analizará sus últimas 12 semanas</p>
        </div>
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {pacientes.length === 0 && (
            <p className="p-4 text-sm text-slate-400 text-center">Sin pacientes registrados</p>
          )}
          {pacientes.map(p => (
            <button key={p.id} onClick={() => generarPrediccion(p)}
              className={`w-full text-left p-3.5 hover:bg-blue-50/50 transition-colors flex items-center gap-3 ${selectedPaciente?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">{(p.name || p.nombre || '?').charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-800 truncate">{p.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{p.diagnosis || 'Sin diagnóstico'}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Panel predicciones */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedPaciente && !loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Brain size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Selecciona un paciente para generar predicciones con IA</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Analizando patrones con IA...</p>
            <p className="text-xs text-slate-400 mt-1">Calculando tendencias y proyecciones</p>
          </div>
        )}

        {prediccion && !loading && selectedPaciente && (
          <>
            {/* Header paciente */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Predicción IA</p>
                  <h3 className="text-xl font-black">{selectedPaciente.name}</h3>
                  <p className="text-blue-200 text-sm mt-0.5">{prediccion.sesiones_analizadas} sesiones analizadas</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    {tendenciaIcon}
                    <Badge label={prediccion.tendencia} color={tendenciaColor} />
                  </div>
                  <p className="text-blue-200 text-xs">Confianza: <span className="text-white font-black">{prediccion.confianza}%</span></p>
                </div>
              </div>
            </div>

            {/* Métricas predicción */}
            {prediccion.prediccion_30d !== null ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Logro actual', value: `${prediccion.ultimo_logro}%`, sub: 'Última sesión', color: 'slate' },
                  { label: 'Proyección 30 días', value: `${prediccion.prediccion_30d}%`, sub: 'Con tendencia actual', color: 'blue' },
                  { label: 'Proyección 90 días', value: `${prediccion.prediccion_90d}%`, sub: 'Estimado', color: 'indigo' },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{m.label}</p>
                    <p className={`text-2xl font-black ${m.color === 'blue' ? 'text-blue-600' : m.color === 'indigo' ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {m.value}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{m.sub}</p>
                    {m.color !== 'slate' && (
                      <div className="mt-2">
                        <ProgressBar value={parseInt(m.value)} color={m.color === 'blue' ? 'blue' : 'purple'} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-700 font-medium text-sm">{prediccion.analisis_ia || 'Se necesitan más sesiones para generar predicciones precisas.'}</p>
              </div>
            )}

            {/* Criterio de logro ABA */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-3">
              <span className="text-indigo-500 text-lg leading-none">🎯</span>
              <div>
                <p className="text-xs font-black text-indigo-700 uppercase tracking-wide mb-0.5">Criterio de Logro ABA</p>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  <strong>≥ 90% en 2 sesiones consecutivas</strong> en el mismo SET se considera logro.
                  La proyección se basa en la media/mediana del historial de sesiones registradas.
                </p>
              </div>
            </div>

            {/* Áreas */}
            {(prediccion.areas_fortaleza.length > 0 || prediccion.areas_riesgo.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {prediccion.areas_fortaleza.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-black text-emerald-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle size={12} /> FORTALEZAS
                    </p>
                    {prediccion.areas_fortaleza.map(a => (
                      <p key={a} className="text-xs text-emerald-700 py-0.5">• {a}</p>
                    ))}
                  </div>
                )}
                {prediccion.areas_riesgo.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-black text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> ÁREAS EN RIESGO
                    </p>
                    {prediccion.areas_riesgo.map(a => (
                      <p key={a} className="text-xs text-red-700 py-0.5">• {a}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Análisis IA */}
            {prediccion.analisis_ia && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-blue-500" /> ANÁLISIS CLÍNICO PREDICTIVO
                </p>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {prediccion.analisis_ia}
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
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center">
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
          { icon: Eye, label: 'Accesos (7d)', value: datos?.totalAccesos || 0, color: 'blue' },
          { icon: AlertTriangle, label: 'Alertas activas', value: datos?.alertasActivas || 0, color: (datos?.alertasActivas || 0) > 0 ? 'red' : 'green' },
          { icon: Shield, label: 'Exportaciones', value: datos?.exportacionesTotal || 0, color: 'purple' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
                  <p className="font-black text-sm text-slate-800">{a.tipo?.replace(/_/g, ' ')}</p>
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
                      <span className="text-sm font-black text-slate-800">{m.valor}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selected.id, childName: selected.name }),
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
          <span className="font-bold text-violet-800 text-sm">Detector de Patrones ABA — CAPA 1</span>
        </div>
        <p className="text-xs text-violet-600">Analiza el historial de sesiones y detecta regresiones, estancamientos, aceleraciones e inconsistencias.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selecciona paciente</label>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">— Seleccionar —</option>
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
              { label: 'Sesiones', val: resultado.sesiones_analizadas || 0 },
              { label: 'Patrones', val: resultado.patrones?.length || 0 },
              { label: 'Urgentes', val: resultado.patrones_urgentes || 0 },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                <p className="text-2xl font-black text-slate-800">{m.val}</p>
                <p className="text-xs text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
          {(resultado.patrones || []).map((p: any, i: number) => (
            <div key={i} className={`bg-white rounded-xl border p-4 ${colorTipo[p.tipo] || 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${colorTipo[p.tipo] || ''}`}>{p.tipo}</span>
                <span className="text-xs text-slate-400">{p.confianza}% confianza</span>
              </div>
              <p className="font-bold text-sm text-slate-800">{p.area}</p>
              <p className="text-xs text-slate-600 mt-1">{p.descripcion}</p>
              <p className="text-xs font-semibold text-slate-700 mt-2 bg-slate-50 rounded-lg px-3 py-2">💡 {p.accion_sugerida}</p>
            </div>
          ))}
          {(resultado.analisis_ia || resultado.resumen) && (
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
              <p className="text-xs font-bold text-violet-700 mb-2">Resumen IA</p>
              <p className="text-sm text-violet-800">{resultado.analisis_ia || resultado.resumen}</p>
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selected.id, childName: selected.name, accion }),
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
          <span className="font-bold text-amber-800 text-sm">Generador de Objetivos Adaptativos — CAPA 1</span>
        </div>
        <p className="text-xs text-amber-600">Genera o ajusta objetivos terapéuticos ABA automáticamente según el progreso real del paciente.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">— Seleccionar paciente —</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-2">
          {([['generar', 'Generar nuevos'], ['ajustar', 'Ajustar existentes'], ['evaluar_dominio', 'Evaluar dominio']] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setAccion(val)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${accion === val ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              {lbl}
            </button>
          ))}
        </div>
        <button onClick={ejecutar} disabled={!selected || loading}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
          {loading ? <><RefreshCw size={14} className="animate-spin" /> Procesando...</> : <><Target size={14} /> Ejecutar</>}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
      {resultado && (
        <div className="space-y-3">
          {/* generar → resultado.resultado.objetivos_sugeridos */}
          {(resultado.resultado?.objetivos_sugeridos || []).map((obj: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-amber-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-slate-800">{obj.titulo}</p>
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
            <div key={i} className="bg-white rounded-xl border border-orange-100 p-4">
              <p className="font-bold text-sm text-slate-800">{obj.area}</p>
              <p className="text-xs text-slate-600 mt-1"><strong>Qué ajustar:</strong> {obj.que_ajustar}</p>
              <p className="text-xs text-slate-600 mt-1"><strong>Cómo:</strong> {obj.como_ajustar}</p>
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-3 py-2 rounded-lg">Meta 4 semanas: {obj.meta_4_semanas}</p>
            </div>
          ))}
          {/* evaluar_dominio → resultado.resultado.evaluaciones */}
          {(resultado.resultado?.evaluaciones || []).map((obj: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-blue-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-slate-800">{obj.programa}</p>
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
          <p className="text-xs text-orange-600">La IA analiza todos los pacientes y alerta antes de que haya un problema.</p>
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
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> RESUMEN EJECUTIVO IA
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{insightGlobal}</p>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
      {loading && <div className="flex justify-center py-8"><RefreshCw size={24} className="animate-spin text-orange-400" /></div>}
      {!loading && sugerencias.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Sin alertas activas</p>
          <p className="text-xs text-slate-400 mt-1">Todos los pacientes están en progreso normal</p>
        </div>
      )}
      {sugerencias.map((s: any, i: number) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${prioColor[s.prioridad]}`}>{s.prioridad}</span>
              <span className="ml-2 text-[10px] text-slate-400">{s.child_name}</span>
            </div>
            <span className="text-[10px] text-slate-400">{s.semanas_detectado}w</span>
          </div>
          <p className="font-bold text-sm text-slate-800">{s.titulo}</p>
          <p className="text-xs text-slate-500 mt-1">{s.descripcion}</p>
          <p className="text-xs font-semibold text-slate-700 mt-2 bg-slate-50 rounded-lg px-3 py-2">→ {s.accion_concreta}</p>
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selected.id, tipo }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error generando reporte')
      }
      // Descargar el .docx directamente
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const cd = res.headers.get('content-disposition') || ''
      const match = cd.match(/filename="([^"]+)"/)
      a.download = match?.[1] || `Reporte_${tipo}_${selected.name}.docx`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(`✅ Reporte Word descargado: ${a.download}`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const tipoInfo = {
    padres:      { label: 'Para padres',          desc: 'Lenguaje emocional y accesible',    emoji: '👨‍👩‍👧' },
    seguro:      { label: 'Para seguros / IMSS',  desc: 'Formato técnico-legal con CIE-10',  emoji: '🏥' },
    comparativo: { label: 'Comparativo + pred.',  desc: '"En 3 meses logrará X"',            emoji: '📊' },
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
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paciente</label>
        <select className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={selected?.id || ''} onChange={e => setSelected(pacientes.find(p => p.id === e.target.value) || null)}>
          <option value="">— Seleccionar —</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo de reporte</label>
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
          { emoji: '👨‍👩‍👧', title: 'Padres', desc: 'Carta emocional con logros, actividades en casa y predicción. Sin tecnicismos.' },
          { emoji: '🏥', title: 'Seguros', desc: 'CIE-10, justificación médica, tabla de programas, firma profesional.' },
          { emoji: '📊', title: 'Comparativo', desc: 'Progreso entre períodos con gráficos de predicción a 30 y 90 días.' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl p-3">
            <p className="text-xl mb-1">{c.emoji}</p>
            <p className="text-xs font-bold text-slate-700">{c.title}</p>
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
          name: r.name || r.nombre || 'Sin nombre',
          diagnosis: r.diagnosis || r.diagnostico || '',
        })))
      })
      .catch(e => console.error('Error cargando pacientes Hub IA:', e))
  }, [])

  const tabs = [
    { id: 'predicciones' as Tab, icon: Brain, label: 'Predicciones IA', color: 'blue' },
    { id: 'patrones' as Tab, icon: Activity, label: 'Patrones ABA', color: 'violet' },
    { id: 'objetivos' as Tab, icon: Target, label: 'Objetivos IA', color: 'amber' },
    { id: 'sugerencias' as Tab, icon: Sparkles, label: 'Alertas Proactivas', color: 'orange' },
    { id: 'reportes' as Tab, icon: BookOpen, label: 'Reportes IA', color: 'teal' },
    { id: 'seguridad' as Tab, icon: Shield, label: 'Seguridad', color: 'emerald' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800">Hub de Inteligencia</h1>
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
