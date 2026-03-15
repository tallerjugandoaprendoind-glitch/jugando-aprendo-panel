'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useCallback } from 'react'
import GraficoProgramaABA from '@/components/graficos/GraficoProgramaABA'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, Cell, PieChart, Pie, ComposedChart, Area
} from 'recharts'
import {
  Plus, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Target, BarChart3, BarChart2, Edit3, CheckCircle2, AlertTriangle, Clock,
  Loader2, X, Save, Activity, Zap, Brain, BookOpen, ArrowRight
} from 'lucide-react'
import { useToast } from '@/components/Toast'

// ── Tipo de gráfico por programa (guardado en estado) ─────────────────────────
type TipoGrafico = 'lineas' | 'barras' | 'histograma' | 'pie'

const getTiposGrafico = (isEN: boolean) => [
  { id: 'lineas'    as TipoGrafico, emoji: '📈', label: isEN ? 'Lines' : 'Líneas' },
  { id: 'barras'    as TipoGrafico, emoji: '📊', label: isEN ? 'Bars' : 'Barras' },
  { id: 'histograma'as TipoGrafico, emoji: '🗂️', label: isEN ? 'Histogram' : 'Histograma' },
  { id: 'pie'       as TipoGrafico, emoji: '🥧', label: 'Pie' },
]

function colorPorPct(pct: number) {
  if (pct >= 90) return '#059669'
  if (pct >= 70) return '#6366f1'
  if (pct >= 45) return '#f59e0b'
  return '#ef4444'
}

// ── Colores por área ────────────────────────────────────────────────────────
const getAreaConfig = (isEN: boolean): Record<string, any> => ({
  comunicacion: { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   label: isEN ? 'Communication' : 'Comunicación',   emoji: '💬' },
  conducta:     { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',     label: isEN ? 'Behavior' : 'Conducta',       emoji: '🎯' },
  cognitivo:    { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200',label: isEN ? 'Cognitive' : 'Cognitivo',     emoji: '🧠' },
  social:       { color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200',label: 'Social',      emoji: '👥' },
  autonomia:    { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', label: isEN ? 'Autonomy' : 'Autonomía',      emoji: '🌟' },
  academico:    { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',label: isEN ? 'Academic' : 'Académico',     emoji: '📚' },
  sensorial:    { color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200',   label: 'Sensorial',      emoji: '✋' },
})

const FASE_COLORS: Record<string, string> = {
  linea_base: '#94a3b8', intervencion: '#6366f1',
  mantenimiento: '#10b981', seguimiento: '#f59e0b',
}

export default function ProgramasABAView({ childId, childName }: { childId: string; childName: string }) {
  const toast = useToast()
  const { t, locale } = useI18n()
  const isEN = locale === 'en'


  const FASE_LABELS: Record<string, string> = {
    linea_base:    t('programas.lineaBase'),
    intervencion:  t('programas.intervencion'),
    mantenimiento: t('programas.mantenimiento'),
    seguimiento:   t('programas.seguimiento'),
  }
  const CHART_TIPO_LABELS: Record<string, string> = {
    lineas:     t('reportes.lineas'),
    barras:     t('reportes.barras'),
    histograma: t('reportes.histograma'),
    pie:        t('reportes.pie'),
  }

  const AREA_LABELS: Record<string, string> = {
    comunicacion: t('programas.areaComunicacion') || 'Communication',
    conducta:     t('programas.areaConducca') || 'Behavior',
    cognitivo:    t('programas.areaCognitivo') || 'Cognitive',
    social:       t('programas.areaSocial') || 'Social',
    autonomia:    t('programas.areaAutonomia') || 'Autonomy',
    academico:    t('programas.areaAcademico') || 'Academic',
    sensorial:    t('programas.areaSensorial') || 'Sensory',
  }

  const [programas, setProgramas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCrear, setShowCrear] = useState(false)
  const [programaActivo, setProgramaActivo] = useState<any>(null)
  const [showRegistrarSesion, setShowRegistrarSesion] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [filtroArea, setFiltroArea] = useState<string>('todos')
  // Tipo de gráfico por programa: { [programaId]: TipoGrafico }
  const [tiposGrafico, setTiposGrafico] = useState<Record<string, TipoGrafico>>({})

  function setTipoGrafico(programaId: string, tipo: TipoGrafico) {
    setTiposGrafico(prev => ({ ...prev, [programaId]: tipo }))
  }

  const loadProgramas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/programas-aba?child_id=${childId}`)
      const json = await res.json()
      setProgramas(json.data || [])
    } catch { toast.error(isEN ? 'Error loading programs' : 'Error cargando programas') }
    finally { setLoading(false) }
  }, [childId])

  useEffect(() => { loadProgramas() }, [loadProgramas])

  // Análisis proactivo del agente al cargar
  useEffect(() => {
    if (!childId) return
    setLoadingAI(true)
    fetch(`/api/agente/chat?action=analisis_proactivo&child_id=${childId}`)
      .then(r => r.json())
      .then(data => setAiAnalysis(data))
      .catch(() => {})
      .finally(() => setLoadingAI(false))
  }, [childId])

  const areas = ['todos', ...Object.keys(getAreaConfig(isEN))]
  const programasFiltrados = filtroArea === 'todos'
    ? programas
    : programas.filter(p => p.area === filtroArea)

  const stats = {
    activos: programas.filter(p => p.estado === 'activo').length,
    dominados: programas.filter(p => p.estado === 'dominado').length,
    enIntervencion: programas.filter(p => p.fase_actual === 'intervencion').length,
    alertas: aiAnalysis?.alertas?.length || 0,
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Activity size={16} className="text-indigo-600" />
            </div>
            {t('programas.titulo')}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 ml-1">Registro de datos conductuales · {childName}</p>
        </div>
        <button onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus size={16} /> {t('programas.nuevo')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t('programas.activos'), value: stats.activos, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: t('programas.dominados'), value: stats.dominados, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('programas.enIntervencion'), value: stats.enIntervencion, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: t('programas.alertasIA'), value: stats.alertas, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alertas IA proactivas */}
      {loadingAI && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-violet-500" />
          <p className="text-sm text-violet-700 font-medium">{t('dashboard.ariAnalizando')}</p>
        </div>
      )}
      {aiAnalysis && aiAnalysis.alertas?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Brain size={11} className="text-violet-500" /> Análisis ARIA
          </p>
          {aiAnalysis.resumen && (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4">
              <p className="text-sm text-violet-800 leading-relaxed">{aiAnalysis.resumen}</p>
            </div>
          )}
          {aiAnalysis.alertas.map((alerta: any, i: number) => (
            <AlertaCard key={i} alerta={alerta} />
          ))}
        </div>
      )}

      {/* Filtros por área */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {areas.map(area => (
          <button key={area} onClick={() => setFiltroArea(area)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filtroArea === area
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}>
            {area === 'todos' ? `📋 ${t('programas.todos')}` : `${getAreaConfig(isEN)[area]?.emoji} ${AREA_LABELS[area] || getAreaConfig(isEN)[area]?.label}`}
          </button>
        ))}
      </div>

      {/* Lista de programas */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
          <p className="text-slate-400 text-sm">{t('programas.sinProgramas')}</p>
        </div>
      ) : programasFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-3xl p-14 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={26} className="text-indigo-300" />
          </div>
          <p className="font-bold text-slate-500 mb-1">{t('programas.sinProgramas')}{filtroArea !== 'todos' ? ` ${t('programas.enArea').replace('{area}', getAreaConfig(isEN)[filtroArea]?.label || '')}` : ''}</p>
          <p className="text-xs text-slate-300">{t('programas.creaElPrimero').replace('{nombre}', childName)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programasFiltrados.map(prog => (
            <ProgramaCard
              key={prog.id}
              programa={prog}
              onRegistrarSesion={() => { setProgramaActivo(prog); setShowRegistrarSesion(true) }}
              onReload={loadProgramas}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showCrear && (
        <CrearProgramaModal
          childId={childId}
          onClose={() => setShowCrear(false)}
          onCreated={() => { setShowCrear(false); loadProgramas() }}
        />
      )}
      {showRegistrarSesion && programaActivo && (
        <RegistrarSesionModal
          programa={programaActivo}
          childId={childId}
          onClose={() => { setShowRegistrarSesion(false); setProgramaActivo(null) }}
          onSaved={() => { setShowRegistrarSesion(false); setProgramaActivo(null); loadProgramas() }}
        />
      )}
    </div>
  )
}

// ── Tarjeta de alerta IA ─────────────────────────────────────────────────────
function AlertaCard({ alerta }: { alerta: any }) {
  const colores: Record<string, string> = {
    alta: 'bg-red-50 border-red-200 text-red-800',
    media: 'bg-amber-50 border-amber-200 text-amber-800',
    baja: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  const icons: Record<string, string> = { alta: '🚨', media: '⚠️', baja: 'ℹ️' }
  return (
    <div className={`rounded-xl p-3.5 border text-sm ${colores[alerta.prioridad] || colores.media}`}>
      <p className="font-bold flex items-center gap-1.5">{icons[alerta.prioridad]} {alerta.titulo}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{alerta.mensaje}</p>
    </div>
  )
}

// ── Tarjeta de programa con gráfica ─────────────────────────────────────────
function ProgramaCard({ programa, onRegistrarSesion, onReload, tipoGrafico = 'lineas', onChangeTipoGrafico }: any) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const [expanded, setExpanded] = useState(false)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [detalle, setDetalle] = useState<any>(null)
  const toast = useToast()

  const area = getAreaConfig(isEN)[programa.area] || getAreaConfig(isEN).comunicacion
  const sesiones = programa.sesiones_datos_aba || []

  // Calcular tendencia local
  const recientes = sesiones.slice(-5).map((s: any) => s.porcentaje_exito).filter(Boolean)
  const promedio = recientes.length > 0 ? recientes.reduce((a: number, b: number) => a + b, 0) / recientes.length : 0
  const ultimoPct = sesiones[sesiones.length - 1]?.porcentaje_exito ?? null
  const anterior = sesiones[sesiones.length - 2]?.porcentaje_exito ?? null
  const tendencia = ultimoPct !== null && anterior !== null
    ? ultimoPct > anterior + 3 ? 'up' : ultimoPct < anterior - 3 ? 'down' : 'stable'
    : 'stable'

  const loadDetalle = async () => {
    if (detalle) { setExpanded(!expanded); return }
    setExpanded(true)
    setLoadingDetalle(true)
    try {
      const res = await fetch(`/api/programas-aba?id=${programa.id}`)
      const json = await res.json()
      // Usar el programa actual como fallback si la API no retorna detalle
      setDetalle(json.data || programa)
    } catch {
      // En caso de error, usar el programa ya cargado como detalle
      setDetalle(programa)
    }
    finally { setLoadingDetalle(false) }
  }

  // Preparar datos para la gráfica
  const chartData = sesiones.map((s: any, i: number) => ({
    sesion: i + 1,
    pct: s.porcentaje_exito,
    fase: s.fase,
    fecha: s.fecha,
  }))

  // Detectar cambios de fase para líneas verticales
  const cambiosFase: number[] = []
  for (let i = 1; i < chartData.length; i++) {
    if (chartData[i].fase !== chartData[i - 1].fase) cambiosFase.push(i + 0.5)
  }

  const faseLabel: Record<string, string> = {
    linea_base: t('programas.lineaBase'), intervencion: t('programas.intervencion'),
    mantenimiento: t('programas.mantenimiento'), seguimiento: t('programas.seguimiento'),
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:border-indigo-100 transition-all">
      {/* Header */}
      <div className="p-5 cursor-pointer" onClick={loadDetalle}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${area.bg} border shrink-0`}>
            {area.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-800 text-sm">{programa.titulo}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${area.bg} ${area.color}`}>
                {area.label}
              </span>
              <FaseTag fase={programa.fase_actual} />
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{programa.objetivo_lp}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <BarChart3 size={10} /> {sesiones.length} {t('programas.sesiones') || 'sesiones'}
              </span>
              {ultimoPct !== null && (
                <span className="text-xs font-bold flex items-center gap-1">
                  {tendencia === 'up' && <TrendingUp size={12} className="text-emerald-500" />}
                  {tendencia === 'down' && <TrendingDown size={12} className="text-red-500" />}
                  {tendencia === 'stable' && <Minus size={12} className="text-slate-400" />}
                  <span className={tendencia === 'up' ? 'text-emerald-600' : tendencia === 'down' ? 'text-red-600' : 'text-slate-500'}>
                    {ultimoPct.toFixed(0)}%
                  </span>
                </span>
              )}
              <span className="text-xs text-slate-400">
                {t('programas.criterio')}: {programa.criterio_dominio_pct}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={e => { e.stopPropagation(); onRegistrarSesion() }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
              {t('programas.agregarSesion')}
            </button>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>

        {/* Mini gráfica */}
        {sesiones.length >= 2 && (
          <div className="mt-3 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                <Line type="linear" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot={false} />
                <ReferenceLine y={programa.criterio_dominio_pct} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">
          {loadingDetalle ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-400" size={24} />
            </div>
          ) : detalle ? (
            <>
              {/* Gráfica completa con selector de tipo */}
              {chartData.length >= 2 && (
                <div>
                  {/* Header con selector de tipo */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      📈 Gráfica de progreso
                    </p>
                    {/* Selector de tipo — solo analista */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                      {([
                        { id: 'lineas'     as const, label: t('reportes.lineas'),     emoji: '📈' },
                        { id: 'barras'     as const, label: t('reportes.barras'),     emoji: '📊' },
                        { id: 'histograma' as const, label: t('reportes.histograma'), emoji: '🗂️' },
                        { id: 'pie'        as const, label: t('reportes.pie'),        emoji: '🥧' },
                      ] as const).map(t => (
                        <button key={t.id} onClick={() => onChangeTipoGrafico(t.id)}
                          title={t.label}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            tipoGrafico === t.id
                              ? 'bg-white shadow text-indigo-700'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}>
                          {t.emoji}
                          <span className="ml-1 hidden sm:inline">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    {/* Leyenda de fases */}
                    <div className="flex gap-3 mb-3 flex-wrap">
                      {Object.entries(faseLabel).map(([key, label]) => {
                        const hasFase = chartData.some((d: any) => d.fase === key)
                        if (!hasFase) return null
                        return (
                          <span key={key} className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FASE_COLORS[key] }} />
                            {label}
                          </span>
                        )
                      })}
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <span className="w-5 border-t-2 border-dashed border-emerald-500" />
                        Criterio {programa.criterio_dominio_pct}%
                      </span>
                    </div>

                    {/* ── SET band labels (Thread Learning style) ── */}
                    {tipoGrafico === 'lineas' && chartData.length > 0 && (() => {
                      // Build set bands: consecutive sessions with same 'set' value
                      type Band = { set: string; start: number; end: number; label: string }
                      const bands: Band[] = []
                      let bandStart = 0
                      let currentSet = chartData[0]?.set || 'Nivel 1'
                      chartData.forEach((d: any, i: number) => {
                        if (d.set !== currentSet || i === chartData.length - 1) {
                          bands.push({ set: currentSet, start: bandStart, end: i === chartData.length - 1 ? i : i - 1, label: currentSet || `Nivel ${bands.length + 1}` })
                          currentSet = d.set
                          bandStart = i
                        }
                      })
                      if (bands.length === 0) return null
                      const total = chartData.length
                      return (
                        <div className="flex mb-1 rounded-lg overflow-hidden border border-slate-100 text-[10px] font-black">
                          {bands.map((b, i) => {
                            const width = ((b.end - b.start + 1) / total) * 100
                            const colors = ['bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-fuchsia-100 text-fuchsia-700']
                            return (
                              <div key={i} className={`${colors[i % colors.length]} flex items-center justify-center py-1 px-1 truncate`} style={{ width: `${width}%`, minWidth: '24px' }}>
                                {b.label}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* ── Líneas ── */}
                    {tipoGrafico === 'lineas' && (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                          <XAxis dataKey="sesion" tick={{ fontSize: 10, fill: "var(--text-muted)" }} label={{ value: t('programas.sesionLabel'), position: 'insideBottom', offset: -2, fontSize: 10, fill: "var(--text-muted)" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={v => `${v}%`} />
                          <Tooltip
                            formatter={(value: any) => [`${value}%`, isEN?'Achievement':'Éxito']}
                            labelFormatter={(label) => { const d = chartData[label - 1]; return d ? `${t('programas.sesionLabel')} ${label} · ${d.fecha} · ${faseLabel[d.fase] || d.fase} · ${d.set || ''}` : `${t('programas.sesionLabel')} ${label}` }}
                          />
                          {cambiosFase.map(x => <ReferenceLine key={x} x={x} stroke="#a5b4fc" strokeDasharray="4 2" strokeWidth={1.5} />)}
                          <ReferenceLine y={programa.criterio_dominio_pct} stroke="#10b981" strokeDasharray="6 3" strokeWidth={2}
                            label={{ value: `🏆 ${programa.criterio_dominio_pct}%`, position: 'right', fontSize: 10, fill: '#10b981' }} />
                          <Line type="linear" dataKey="pct" stroke="#6366f1" strokeWidth={2.5}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {/* ── Barras (color por nivel) ── */}
                    {tipoGrafico === 'barras' && chartData.length > 0 && (() => {
                      type Band = { set: string; start: number; end: number }
                      const bands: Band[] = []
                      let bStart = 0; let cSet = chartData[0]?.set || 'Nivel 1'
                      chartData.forEach((d: any, i: number) => {
                        if (d.set !== cSet || i === chartData.length - 1) {
                          bands.push({ set: cSet, start: bStart, end: i === chartData.length - 1 ? i : i - 1 })
                          cSet = d.set; bStart = i
                        }
                      })
                      const total = chartData.length
                      return bands.length > 1 ? (
                        <div className="flex mb-1 rounded-lg overflow-hidden border border-slate-100 text-[10px] font-black">
                          {bands.map((b, i) => {
                            const colors = ['bg-amber-100 text-amber-700', 'bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-700']
                            return <div key={i} className={`${colors[i % colors.length]} flex items-center justify-center py-1 truncate`} style={{ width: `${((b.end - b.start + 1) / total) * 100}%`, minWidth: '24px' }}>{b.set}</div>
                          })}
                        </div>
                      ) : null
                    })()}

                    {tipoGrafico === 'barras' && (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                          <XAxis dataKey="sesion" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={v => `${v}%`} />
                          <Tooltip
                            formatter={(value: any) => [`${value}%`, isEN?'Achievement':'Éxito']}
                            labelFormatter={(label) => { const d = chartData[label - 1]; return d ? `${t('programas.sesionLabel')} ${label} · ${d.fecha} · ${d.set || ''}` : `${t('programas.sesionLabel')} ${label}` }}
                          />
                          <ReferenceLine y={programa.criterio_dominio_pct} stroke="#10b981" strokeDasharray="6 3" strokeWidth={2}
                            label={{ value: `🏆 ${programa.criterio_dominio_pct}%`, position: 'right', fontSize: 10, fill: '#10b981' }} />
                          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={index} fill={
                                entry.pct >= programa.criterio_dominio_pct ? '#059669'
                                : entry.pct >= 70 ? '#6366f1'
                                : entry.pct >= 45 ? '#D97706' : '#DC2626'
                              } />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* ── Histograma de distribución ── */}
                    {tipoGrafico === 'histograma' && (() => {
                      const crit = programa.criterio_dominio_pct
                      const histData = [
                        { rango: '0-25%',   count: chartData.filter((d: any) => d.pct < 26).length,               color: '#DC2626' },
                        { rango: '26-50%',  count: chartData.filter((d: any) => d.pct >= 26 && d.pct < 51).length, color: '#D97706' },
                        { rango: '51-75%',  count: chartData.filter((d: any) => d.pct >= 51 && d.pct < 76).length, color: '#6366f1' },
                        { rango: '76-89%',  count: chartData.filter((d: any) => d.pct >= 76 && d.pct < crit).length, color: '#0891B2' },
                        { rango: `${crit}%+`, count: chartData.filter((d: any) => d.pct >= crit).length,            color: '#059669' },
                      ]
                      return (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={histData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                            <XAxis dataKey="rango" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} label={{ value: isEN ? 'Sessions' : 'Sesiones', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                            <Tooltip formatter={(v: any) => [`${v} ${t('programas.sesiones') || 'sesiones'}`, t('programas.cantidad')]} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {histData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )
                    })()}

                    {/* ── Pie chart ── */}
                    {tipoGrafico === 'pie' && (() => {
                      const crit = programa.criterio_dominio_pct
                      const pieRaw = [
                        { name: `Criterio (≥${crit}%)`, value: chartData.filter((d: any) => d.pct >= crit).length, color: '#059669' },
                        { name: '70-89%',  value: chartData.filter((d: any) => d.pct >= 70 && d.pct < crit).length, color: '#6366f1' },
                        { name: '45-69%',  value: chartData.filter((d: any) => d.pct >= 45 && d.pct < 70).length,  color: '#D97706' },
                        { name: '<45%',    value: chartData.filter((d: any) => d.pct < 45).length,                  color: '#DC2626' },
                      ].filter(p => p.value > 0)
                      return (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width="55%" height={180}>
                            <PieChart>
                              <Pie data={pieRaw} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                                {pieRaw.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                              <Tooltip formatter={(v: any) => [`${v} ${t('programas.sesiones') || 'sesiones'}`, '']} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2">
                            {pieRaw.map(p => (
                              <div key={p.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                                <span className="text-[11px] text-slate-600 flex-1">{p.name}</span>
                                <span className="text-xs font-black" style={{ color: p.color }}>{p.value}</span>
                              </div>
                            ))}
                            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                              {t('programas.totalSesiones')}: {chartData.length} {t('programas.sesiones') || 'sesiones'}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Sets / Objetivos CP */}
              {detalle.objetivos_cp?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🎯 Sets / Objetivos</p>
                  <div className="space-y-2">
                    {detalle.objetivos_cp.map((obj: any) => (
                      <div key={obj.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                        obj.estado === 'dominado' ? 'bg-emerald-50 border-emerald-200' :
                        obj.estado === 'en_progreso' ? 'bg-indigo-50 border-indigo-200' :
                        'bg-white border-slate-100'
                      }`}>
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shrink-0">
                          {obj.numero_set}
                        </span>
                        <span className="flex-1 font-medium text-slate-700">{obj.descripcion}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          obj.estado === 'dominado' ? 'bg-emerald-100 text-emerald-700' :
                          obj.estado === 'en_progreso' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {obj.estado === 'dominado' ? t('programas.dominado') : obj.estado === 'en_progreso' ? t('programas.enProgreso') : t('programas.pendiente')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Últimas sesiones */}
              {detalle.sesiones_datos_aba?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📋 {t('programas.ultimasSesiones')}</p>
                  <div className="space-y-1.5">
                    {detalle.sesiones_datos_aba.slice(-6).reverse().map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 text-xs">
                        <span className="text-slate-400 w-20 shrink-0">{s.fecha}</span>
                        <FaseTag fase={s.fase} small />
                        {s.porcentaje_exito !== null && (
                          <span className={`font-black ${
                            s.porcentaje_exito >= programa.criterio_dominio_pct ? 'text-emerald-600' :
                            s.porcentaje_exito >= 70 ? 'text-amber-600' : 'text-red-500'
                          }`}>{s.porcentaje_exito}%</span>
                        )}
                        {s.oportunidades_totales > 0 && (
                          <span className="text-slate-400">{s.respuestas_correctas}/{s.oportunidades_totales}</span>
                        )}
                        {s.nivel_ayuda && <span className="text-slate-400 capitalize">{s.nivel_ayuda.replace('_', ' ')}</span>}
                        {s.notas && <span className="text-slate-400 italic flex-1 truncate">{s.notas}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalles del procedimiento */}
              {(detalle.sd_estimulo || detalle.reforzadores || detalle.materiales) && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📌 Procedimiento</p>
                  <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-100 dark:border-slate-600 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {detalle.sd_estimulo && <p><span className="font-bold">📍 Sd:</span> {detalle.sd_estimulo}</p>}
                    {detalle.unidad_positiva && <p><span className="font-bold">✅ Unidad +:</span> {detalle.unidad_positiva}</p>}
                    {detalle.unidad_negativa && <p><span className="font-bold">❎ Unidad -:</span> {detalle.unidad_negativa}</p>}
                    {(detalle.reforzadores || detalle.ayudas) && <p><span className="font-bold">🤝🏼 Ayudas:</span> {detalle.reforzadores || detalle.ayudas}</p>}
                    {detalle.correccion_error && <p><span className="font-bold">{t('programas.correccion')}</span> {detalle.correccion_error}</p>}
                    {detalle.reforzadores && <p><span className="font-bold">Reforzadores:</span> {detalle.reforzadores}</p>}
                    {detalle.materiales && <p><span className="font-bold">Materiales:</span> {detalle.materiales}</p>}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function FaseTag({ fase, small }: { fase: string; small?: boolean }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const labels: Record<string, { label: string; color: string }> = {
    linea_base:    { label: t('programas.lineaBase'),    color: 'bg-slate-100 text-slate-600' },
    intervencion:  { label: isEN ? 'Intervention' : 'Intervención',  color: 'bg-indigo-100 text-indigo-700' },
    mantenimiento: { label: t('programas.mantenimiento'), color: 'bg-emerald-100 text-emerald-700' },
    seguimiento:   { label: isEN ? 'Follow-up' : 'Seguimiento',   color: 'bg-amber-100 text-amber-700' },
    dominado:      { label: t('programas.dominado'),   color: 'bg-emerald-100 text-emerald-700' },
  }
  const cfg = labels[fase] || { label: fase, color: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`${cfg.color} rounded-full font-bold ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
      {cfg.label}
    </span>
  )
}

// ── Modal: Registrar Sesión ──────────────────────────────────────────────────
function RegistrarSesionModal({ programa, childId, onClose, onSaved }: any) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fase: programa.fase_actual || 'intervencion',
    oportunidades_totales: '',
    respuestas_correctas: '',
    nivel_ayuda: '',
    nivel_ayuda_custom: '',
    notas: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  const pct = form.oportunidades_totales && form.respuestas_correctas
    ? ((Number(form.respuestas_correctas) / Number(form.oportunidades_totales)) * 100).toFixed(1)
    : null

  const handleSave = async () => {
    if (!form.oportunidades_totales) {
      toast.error(isEN ? 'Enter total opportunities' : 'Ingresa oportunidades totales')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/programas-aba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          action: 'registrar_sesion',
          sesion: {
            programa_id: programa.id,
            child_id: childId,
            fecha: form.fecha,
            fase: form.fase,
            oportunidades_totales: Number(form.oportunidades_totales) || 0,
            respuestas_correctas: Number(form.respuestas_correctas) || 0,
            respuestas_incorrectas: Math.max(0, Number(form.oportunidades_totales) - Number(form.respuestas_correctas)),
            nivel_ayuda: form.nivel_ayuda_custom || form.nivel_ayuda,
            notas: form.notas,
          },
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(isEN?'✅ Session recorded':'✅ Sesión registrada')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-black text-lg text-slate-800">{t('programas.registrarSesion')}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{programa.titulo}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('common.fecha')}</label>
                <input type="date" value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">{t('ui.phase')}</label>
                <select value={form.fase} onChange={e => setForm(f => ({ ...f, fase: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400">
                  <option value="linea_base">{t('ui.baseline')}</option>
                  <option value="intervencion">{t('ui.intervention')}</option>
                  <option value="mantenimiento">{t('programas.mantenimiento')}</option>
                  <option value="seguimiento">{t('ui.follow_up')}</option>
                </select>
              </div>
            </div>

            {/* % de éxito */}
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">{t('programas.pctExito')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{t('ui.total_opportunities')}</label>
                  <input type="number" min="0" value={form.oportunidades_totales}
                    onChange={e => setForm(f => ({ ...f, oportunidades_totales: e.target.value }))}
                    placeholder="10" className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-center text-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">{t('ui.correct_responses')}</label>
                  <input type="number" min="0" value={form.respuestas_correctas}
                    onChange={e => setForm(f => ({ ...f, respuestas_correctas: e.target.value }))}
                    placeholder="8" className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-center text-lg" />
                </div>
              </div>
              {pct && (
                <div className={`mt-3 text-center py-2 rounded-xl font-black text-2xl ${
                  Number(pct) >= programa.criterio_dominio_pct ? 'bg-emerald-100 text-emerald-700' :
                  Number(pct) >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                }`}>
                  {pct}%
                  {Number(pct) >= programa.criterio_dominio_pct && <span className="text-sm ml-1">{t('ui.criterio')}</span>}
                </div>
              )}
            </div>



            {/* Nivel de ayuda — texto libre con sugerencias */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">🤝🏼 {t('programas.nivelAyuda')}</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(isEN ? ['Independent', 'Gesture', 'Verbal', 'Modeling', 'Partial physical', 'Full physical'] : ['Independiente', 'Gesto', 'Verbal', 'Modelado', 'Físico parcial', 'Físico total']).map(nivel => (
                  <button key={nivel}
                    onClick={() => setForm(f => ({ ...f, nivel_ayuda: nivel, nivel_ayuda_custom: nivel }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      form.nivel_ayuda_custom === nivel
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                    }`}>
                    {nivel}
                  </button>
                ))}
              </div>
              <input
                value={form.nivel_ayuda_custom}
                onChange={e => setForm(f => ({ ...f, nivel_ayuda: e.target.value, nivel_ayuda_custom: e.target.value }))}
                {...{placeholder: t('ui.observations_session')}}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">📝 Notas</label>
              <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={2} {...{placeholder: t('ui.session_observations')}}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-bold border-2 border-slate-100 rounded-xl hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? (isEN ? 'Saving...' : 'Guardando...') : (isEN ? 'Save Session' : 'Guardar Sesión')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Crear Programa ────────────────────────────────────────────────────
function CrearProgramaModal({ childId, onClose, onCreated }: any) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    titulo: '', area: 'comunicacion', objetivo_lp: '',
    sd_estimulo: '', correccion_error: '', reforzadores: '', materiales: '',
    unidad_positiva: '', unidad_negativa: '', generalizacion: isEN ? 'Encourage the family to practice this exercise at home.' : 'Promover con la familia que realicen este ejercicio en casa.',
    total_unidades: '10u.', notas_programa: '', drive_url: '',
    tipo_medicion: 'porcentaje', criterio_dominio_pct: 90, criterio_sesiones_consecutivas: 2,
  })
  const [objetivos, setObjetivos] = useState([{ descripcion: '' }])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.titulo || !form.objetivo_lp) { toast.error(isEN ? 'Title and objective are required' : 'Título y objetivo son requeridos'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/programas-aba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          action: 'crear_programa',
          programa: { ...form, child_id: childId,
            ayudas: form.reforzadores, // backward compat
          },
          objetivos: objetivos.filter(o => o.descripcion.trim()),
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Programa creado')
      onCreated()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-lg text-slate-800">{t('programas.nuevoPrograma')}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
          </div>

          {/* Steps */}
          <div className="flex gap-1 mb-5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('programas.paso1Info')}</p>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('programas.nombrePrograma')} *</label>
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  placeholder={t('programas.placeholderNombre')}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">{t('programas.area')} *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(getAreaConfig(isEN)).map(([k, v]) => (
                    <button key={k} onClick={() => set('area', k)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                        form.area === k ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-indigo-200'
                      }`}>
                      {v.emoji} {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('programas.objetivoLargoPlazo')} *</label>
                <textarea value={form.objetivo_lp} onChange={e => set('objetivo_lp', e.target.value)}
                  rows={3} placeholder={t('ui.mastery_criterion_placeholder')}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-indigo-400" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso 2 · Sets / Objetivos CP</p>
              <p className="text-xs text-slate-400">{t('programas.definePasos')}</p>
              {objetivos.map((obj, i) => (
                <div key={i} className="flex gap-2">
                  <span className="w-7 h-7 bg-indigo-600 text-white rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-2.5">{i + 1}</span>
                  <input value={obj.descripcion}
                    onChange={e => {
                      const updated = [...objetivos]
                      updated[i] = { descripcion: e.target.value }
                      setObjetivos(updated)
                    }}
                    placeholder={`Set ${i + 1}: ej: Permanece sentado ${(i + 1) * 3} minutos`}
                    className="flex-1 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
                  {objetivos.length > 1 && (
                    <button onClick={() => setObjetivos(objetivos.filter((_, j) => j !== i))}
                      className="p-2.5 text-slate-300 hover:text-red-400 mt-1"><X size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setObjetivos([...objetivos, { descripcion: '' }])}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500">
                + Agregar set
              </button>
              {/* Enlace Google Drive / Sheets opcional */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  📄 Google Sheet / Drive <span className="text-slate-300 font-normal">(opcional)</span>
                </label>
                <input value={(form as any).drive_url ?? ''} onChange={e => set('drive_url', e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">{t('programas.criterioDominio')}</label>
                  <input type="number" min="0" max="100" value={form.criterio_dominio_pct}
                    onChange={e => set('criterio_dominio_pct', Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 text-center" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Sesiones consecutivas</label>
                  <input type="number" min="1" value={form.criterio_sesiones_consecutivas}
                    onChange={e => set('criterio_sesiones_consecutivas', Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 text-center" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso 3 · Procedimiento</p>
              {[
                { key: 'materiales',       label: isEN ? '📚 Materials' : '📚 Materiales',                   placeholder: isEN ? 'Materials needed for the session' : 'Materiales necesarios para la sesión' },
                { key: 'sd_estimulo',      label: isEN ? '📍 Sd / Discriminative stimulus' : '📍 Sd / Estímulo discriminativo',  placeholder: isEN ? 'Verbal instruction or gesture that initiates behavior' : 'Instrucción verbal o gesto que inicia la conducta' },
                { key: 'unidad_positiva',  label: isEN ? '✅ Positive unit' : '✅ Unidad positiva',              placeholder: isEN ? 'Expected correct response' : 'Respuesta correcta esperada' },
                { key: 'unidad_negativa',  label: isEN ? '❎ Negative unit' : '❎ Unidad negativa',             placeholder: isEN ? 'Incorrect response / error' : 'Respuesta incorrecta / error' },
                { key: 'reforzadores',     label: isEN ? '🤝🏼 Prompts' : '🤝🏼 Ayudas',                      placeholder: isEN ? 'As indicated in the set. E.g.: Gesture + verbal' : 'Las indicadas en el set. Ej: Gesto + verbal' },
                { key: 'correccion_error', label: isEN ? '📍 Error correction' : '📍 Corrección del error',         placeholder: isEN ? 'How to correct an incorrect response' : 'Cómo se corrige si la respuesta es incorrecta' },
                { key: 'generalizacion',   label: isEN ? '➡️ Generalization' : '➡️ Generalización',              placeholder: isEN ? 'Encourage the family to practice at home.' : 'Promover con la familia que realicen este ejercicio en casa.' },
                { key: 'notas_programa',   label: isEN ? '🙈 Notes' : '🙈 Notas',                        placeholder: isEN ? 'General program observations...' : 'Observaciones generales del programa...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-500 block mb-1">{label}</label>
                  <textarea value={(form as any)[key] ?? ''} onChange={e => set(key, e.target.value)}
                    rows={key === 'generalizacion' || key === 'notas_programa' ? 2 : 1} placeholder={placeholder}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-indigo-400" />
                </div>
              ))}
              {/* Total unidades — fijo en 10 pero editable */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">📍 Total</label>
                <input value={(form as any).total_unidades ?? '10u.'} onChange={e => set('total_unidades', e.target.value)}
                  placeholder="10u."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 text-slate-500 font-bold border-2 border-slate-100 rounded-xl hover:bg-slate-50">
                ← Atrás
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!form.titulo || !form.objetivo_lp}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {t('programas.siguiente')} <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? (isEN ? 'Creating...' : 'Creando...') : (isEN ? 'Create Program' : 'Crear Programa')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
