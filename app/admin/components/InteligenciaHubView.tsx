'use client'
// app/admin/components/InteligenciaHubView.tsx
// 🧠 Hub de Inteligencia Artificial — Predicciones + Seguridad + Competitividad

import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Shield, Trophy, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, RefreshCw, Users, Target,
  Lock, Eye, BarChart3, Zap, ArrowUp, ArrowDown,
  ChevronRight, Activity, Sparkles, Clock, Star
} from 'lucide-react'

type Tab = 'predicciones' | 'seguridad' | 'competitividad'

interface Paciente { id: string; name: string; diagnosis: string }
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
                <span className="text-white font-black text-sm">{p.name.charAt(0)}</span>
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
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function InteligenciaHubView() {
  const [tab, setTab] = useState<Tab>('predicciones')
  const [pacientes, setPacientes] = useState<Paciente[]>([])

  useEffect(() => {
    fetch('/api/admin/users?tipo=pacientes')
      .then(r => r.json())
      .then(d => setPacientes(d.data || d.pacientes || []))
      .catch(async () => {
        // Fallback: cargar desde supabase-client
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await sb.from('children').select('id, name, diagnosis').order('name')
        setPacientes(data || [])
      })
  }, [])

  const tabs = [
    { id: 'predicciones' as Tab, icon: Brain, label: 'Predicciones IA', color: 'blue' },
    { id: 'seguridad' as Tab, icon: Shield, label: 'Seguridad', color: 'emerald' },
    { id: 'competitividad' as Tab, icon: Trophy, label: 'vs Central Reach', color: 'purple' },
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
          <p className="text-xs text-slate-400">Predicciones · Seguridad · Competitividad vs Central Reach</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 rounded-xl p-1.5 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.id
                ? `bg-white shadow-sm ${t.color === 'blue' ? 'text-blue-700' : t.color === 'emerald' ? 'text-emerald-700' : 'text-purple-700'}`
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'predicciones' && <TabPredicciones pacientes={pacientes} />}
      {tab === 'seguridad' && <TabSeguridad />}
      {tab === 'competitividad' && <TabCompetitividad />}
    </div>
  )
}
