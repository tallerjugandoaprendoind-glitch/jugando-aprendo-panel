'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import {
  Plus, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Target, BarChart3, Edit3, CheckCircle2, AlertTriangle, Clock,
  Loader2, X, Save, Activity, Zap, Brain, BookOpen, ArrowRight
} from 'lucide-react'
import { useToast } from '@/components/Toast'

// ── Colores por área ────────────────────────────────────────────────────────
const AREA_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  comunicacion: { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   label: 'Comunicación',   emoji: '💬' },
  conducta:     { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',     label: 'Conducta',       emoji: '🎯' },
  cognitivo:    { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200',label: 'Cognitivo',     emoji: '🧠' },
  social:       { color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200',label: 'Social',      emoji: '👥' },
  autonomia:    { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', label: 'Autonomía',      emoji: '🌟' },
  academico:    { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',label: 'Académico',     emoji: '📚' },
  sensorial:    { color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200',   label: 'Sensorial',      emoji: '✋' },
}

const FASE_COLORS: Record<string, string> = {
  linea_base: '#94a3b8', intervencion: '#6366f1',
  mantenimiento: '#10b981', seguimiento: '#f59e0b',
}

export default function ProgramasABAView({ childId, childName }: { childId: string; childName: string }) {
  const toast = useToast()
  const [programas, setProgramas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCrear, setShowCrear] = useState(false)
  const [programaActivo, setProgramaActivo] = useState<any>(null)
  const [showRegistrarSesion, setShowRegistrarSesion] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [filtroArea, setFiltroArea] = useState<string>('todos')

  const loadProgramas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/programas-aba?child_id=${childId}`)
      const json = await res.json()
      setProgramas(json.data || [])
    } catch { toast.error('Error cargando programas') }
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

  const areas = ['todos', ...Object.keys(AREA_CONFIG)]
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
            Programas ABA
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 ml-1">Registro de datos conductuales · {childName}</p>
        </div>
        <button onClick={() => setShowCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus size={16} /> Nuevo Programa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Activos', value: stats.activos, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Dominados', value: stats.dominados, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En intervención', value: stats.enIntervencion, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Alertas IA', value: stats.alertas, color: 'text-amber-600', bg: 'bg-amber-50' },
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
          <p className="text-sm text-violet-700 font-medium">ARIA analizando progreso...</p>
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
            {area === 'todos' ? '📋 Todos' : `${AREA_CONFIG[area]?.emoji} ${AREA_CONFIG[area]?.label}`}
          </button>
        ))}
      </div>

      {/* Lista de programas */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
          <p className="text-slate-400 text-sm">Cargando programas...</p>
        </div>
      ) : programasFiltrados.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-14 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={26} className="text-indigo-300" />
          </div>
          <p className="font-bold text-slate-500 mb-1">Sin programas {filtroArea !== 'todos' ? `en ${AREA_CONFIG[filtroArea]?.label}` : ''}</p>
          <p className="text-xs text-slate-300">Crea el primer programa ABA para {childName}</p>
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
function ProgramaCard({ programa, onRegistrarSesion, onReload }: any) {
  const [expanded, setExpanded] = useState(false)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [detalle, setDetalle] = useState<any>(null)
  const toast = useToast()

  const area = AREA_CONFIG[programa.area] || AREA_CONFIG.comunicacion
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
      setDetalle(json.data)
    } catch { toast.error('Error cargando detalle') }
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
    linea_base: 'Línea Base', intervencion: 'Intervención',
    mantenimiento: 'Mantenimiento', seguimiento: 'Seguimiento',
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden hover:border-indigo-100 transition-all">
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
                <BarChart3 size={10} /> {sesiones.length} sesiones
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
                Criterio: {programa.criterio_dominio_pct}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={e => { e.stopPropagation(); onRegistrarSesion() }}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
              + Sesión
            </button>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>

        {/* Mini gráfica */}
        {sesiones.length >= 2 && (
          <div className="mt-3 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot={false} />
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
              {/* Gráfica completa */}
              {chartData.length >= 2 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    📈 Gráfica de progreso
                  </p>
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
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="sesion" tick={{ fontSize: 10 }} label={{ value: 'Sesión', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value}%`, 'Éxito']}
                          labelFormatter={(label) => {
                            const d = chartData[label - 1]
                            return d ? `Sesión ${label} · ${d.fecha} · ${faseLabel[d.fase] || d.fase}` : `Sesión ${label}`
                          }}
                        />
                        {cambiosFase.map(x => (
                          <ReferenceLine key={x} x={x} stroke="#cbd5e1" strokeDasharray="3 3" />
                        ))}
                        <ReferenceLine y={programa.criterio_dominio_pct} stroke="#10b981"
                          strokeDasharray="6 3" strokeWidth={2}
                          label={{ value: `${programa.criterio_dominio_pct}%`, position: 'right', fontSize: 10, fill: '#10b981' }} />
                        <Line
                          type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5}
                          dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
                          {obj.estado === 'dominado' ? '✅ Dominado' : obj.estado === 'en_progreso' ? '▶ En progreso' : '⏳ Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Últimas sesiones */}
              {detalle.sesiones_datos_aba?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📋 Últimas sesiones</p>
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
                  <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
                    {detalle.sd_estimulo && <p><span className="font-bold">Sd:</span> {detalle.sd_estimulo}</p>}
                    {detalle.correccion_error && <p><span className="font-bold">Corrección:</span> {detalle.correccion_error}</p>}
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
  const labels: Record<string, { label: string; color: string }> = {
    linea_base:    { label: 'Línea Base',    color: 'bg-slate-100 text-slate-600' },
    intervencion:  { label: 'Intervención',  color: 'bg-indigo-100 text-indigo-700' },
    mantenimiento: { label: 'Mantenimiento', color: 'bg-emerald-100 text-emerald-700' },
    seguimiento:   { label: 'Seguimiento',   color: 'bg-amber-100 text-amber-700' },
    dominado:      { label: '✅ Dominado',   color: 'bg-emerald-100 text-emerald-700' },
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
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fase: programa.fase_actual || 'intervencion',
    oportunidades_totales: '',
    respuestas_correctas: '',
    frecuencia_valor: '',
    duracion_segundos: '',
    nivel_ayuda: 'independiente',
    notas: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  const pct = form.oportunidades_totales && form.respuestas_correctas
    ? ((Number(form.respuestas_correctas) / Number(form.oportunidades_totales)) * 100).toFixed(1)
    : null

  const handleSave = async () => {
    if (!form.oportunidades_totales && !form.frecuencia_valor && !form.duracion_segundos) {
      toast.error('Ingresa al menos un tipo de medición')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/programas-aba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            frecuencia_valor: form.frecuencia_valor ? Number(form.frecuencia_valor) : null,
            duracion_segundos: form.duracion_segundos ? Number(form.duracion_segundos) : null,
            nivel_ayuda: form.nivel_ayuda,
            notas: form.notas,
          },
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Sesión registrada')
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-black text-lg text-slate-800">Registrar Sesión</h3>
              <p className="text-sm text-slate-400 mt-0.5">{programa.titulo}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Fecha</label>
                <input type="date" value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">Fase</label>
                <select value={form.fase} onChange={e => setForm(f => ({ ...f, fase: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400">
                  <option value="linea_base">Línea Base</option>
                  <option value="intervencion">Intervención</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="seguimiento">Seguimiento</option>
                </select>
              </div>
            </div>

            {/* % de éxito */}
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">📊 Porcentaje de éxito</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Oportunidades totales</label>
                  <input type="number" min="0" value={form.oportunidades_totales}
                    onChange={e => setForm(f => ({ ...f, oportunidades_totales: e.target.value }))}
                    placeholder="10" className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-center text-lg" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Respuestas correctas</label>
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
                  {Number(pct) >= programa.criterio_dominio_pct && <span className="text-sm ml-1">✅ Criterio!</span>}
                </div>
              )}
            </div>

            {/* Frecuencia y duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">⚡ Frecuencia</label>
                <input type="number" min="0" value={form.frecuencia_valor}
                  onChange={e => setForm(f => ({ ...f, frecuencia_valor: e.target.value }))}
                  placeholder="Nº veces" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">⏱ Duración (seg)</label>
                <input type="number" min="0" value={form.duracion_segundos}
                  onChange={e => setForm(f => ({ ...f, duracion_segundos: e.target.value }))}
                  placeholder="Segundos" className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
            </div>

            {/* Nivel de ayuda */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">🤝 Nivel de ayuda</label>
              <div className="flex flex-wrap gap-2">
                {['independiente', 'gesto', 'verbal', 'modelado', 'fisico_parcial', 'fisico_total'].map(nivel => (
                  <button key={nivel} onClick={() => setForm(f => ({ ...f, nivel_ayuda: nivel }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      form.nivel_ayuda === nivel ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                    {nivel.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1.5">📝 Notas</label>
              <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={2} placeholder="Observaciones de la sesión..."
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
              {saving ? 'Guardando...' : 'Guardar Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Modal: Crear Programa ────────────────────────────────────────────────────
function CrearProgramaModal({ childId, onClose, onCreated }: any) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    titulo: '', area: 'comunicacion', objetivo_lp: '',
    sd_estimulo: '', correccion_error: '', reforzadores: '', materiales: '',
    tipo_medicion: 'porcentaje', criterio_dominio_pct: 90, criterio_sesiones_consecutivas: 2,
  })
  const [objetivos, setObjetivos] = useState([{ descripcion: '' }])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.titulo || !form.objetivo_lp) { toast.error('Título y objetivo son requeridos'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/programas-aba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear_programa',
          programa: { ...form, child_id: childId },
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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-lg text-slate-800">Nuevo Programa ABA</h3>
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
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso 1 · Información básica</p>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Nombre del programa *</label>
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  placeholder="ej: Imitación motora con objetos"
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Área *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(AREA_CONFIG).map(([k, v]) => (
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
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Objetivo a largo plazo *</label>
                <textarea value={form.objetivo_lp} onChange={e => set('objetivo_lp', e.target.value)}
                  rows={3} placeholder="Con un criterio de éxito de 90% en 2 sesiones consecutivas, el estudiante..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-indigo-400" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso 2 · Sets / Objetivos CP</p>
              <p className="text-xs text-slate-400">Define los pasos progresivos del programa (como en LuTr)</p>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Criterio de dominio %</label>
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
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paso 3 · Procedimiento</p>
              {[
                { key: 'sd_estimulo', label: '📌 Sd / Estímulo discriminativo', placeholder: 'Instrucción verbal o gesto que inicia la conducta' },
                { key: 'correccion_error', label: '❌ Corrección del error', placeholder: 'Cómo se corrige si la respuesta es incorrecta' },
                { key: 'reforzadores', label: '✅ Reforzadores', placeholder: 'Qué reforzadores se usarán (fichas, elogios, tangibles...)' },
                { key: 'materiales', label: '📚 Materiales', placeholder: 'Materiales necesarios para la sesión' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">{label}</label>
                  <textarea value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                    rows={2} placeholder={placeholder}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-indigo-400" />
                </div>
              ))}
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
                Siguiente <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? 'Creando...' : 'Crear Programa'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
