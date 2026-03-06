'use client'
// components/graficos/ProgresoGraficas.tsx
// Gráficos ABA profesionales con criterio de logro, selector de tipo, histograma y pie chart

import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Legend, ReferenceLine, Cell, PieChart, Pie, ComposedChart, Area
} from 'recharts'

interface ProgresoGraficasProps {
  childId: string
  modoParent?: boolean
}

type TipoGrafico = 'lineas' | 'barras' | 'combinado' | 'histograma' | 'pie' | 'radar'

const TIPOS_GRAFICO = [
  { id: 'lineas'    as TipoGrafico, label: 'Líneas',     emoji: '📈', desc: 'Evolución temporal' },
  { id: 'barras'    as TipoGrafico, label: 'Barras',     emoji: '📊', desc: 'Comparación por sesión' },
  { id: 'combinado' as TipoGrafico, label: 'Combinado',  emoji: '📉', desc: 'Línea + área' },
  { id: 'histograma'as TipoGrafico, label: 'Histograma', emoji: '🗂️', desc: 'Distribución de logros' },
  { id: 'pie'       as TipoGrafico, label: 'Pie Chart',  emoji: '🥧', desc: 'Proporción de niveles' },
  { id: 'radar'     as TipoGrafico, label: 'Radar',      emoji: '🎯', desc: 'Perfil de habilidades' },
]

const CRITERIO_PCT  = 90
const CRITERIO_SESS = 2

function colorLogro(pct: number) {
  if (pct >= 90) return '#059669'
  if (pct >= 70) return '#1B5EA1'
  if (pct >= 45) return '#D97706'
  return '#DC2626'
}

function TooltipABA({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const pct = payload[0]?.value
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-black text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}%</p>
      ))}
      {pct >= CRITERIO_PCT && <p className="text-emerald-600 font-black mt-1">✅ Criterio logrado</p>}
    </div>
  )
}

export default function ProgresoGraficas({ childId, modoParent = false }: ProgresoGraficasProps) {
  const [datos, setDatos]             = useState<any>(null)
  const [cargando, setCargando]       = useState(true)
  const [semanas, setSemanas]         = useState(12)
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('lineas')
  const [mostrarSelector, setMostrarSelector] = useState(false)

  useEffect(() => { cargarDatos() }, [childId, semanas])

  async function cargarDatos() {
    setCargando(true)
    try {
      const res = await fetch(`/api/progreso-paciente?child_id=${childId}&semanas=${semanas}`)
      setDatos(await res.json())
    } catch {}
    finally { setCargando(false) }
  }

  if (cargando) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      <p className="text-slate-400 text-sm">Cargando datos...</p>
    </div>
  )

  if (!datos) return <p className="text-slate-400 text-center py-8">Sin datos disponibles</p>

  const { graficaABA = [], asistencia, tareas, evaluaciones, reporteSemanal } = datos

  // Calcular criterio de dominio
  let sesionesConsecutivas = 0
  let criterioCumplido = false
  let sesionesCriterio = 0
  for (let i = graficaABA.length - 1; i >= 0; i--) {
    if (graficaABA[i].logro >= CRITERIO_PCT) {
      sesionesConsecutivas++
      if (sesionesConsecutivas >= CRITERIO_SESS) { criterioCumplido = true; sesionesCriterio = sesionesConsecutivas; break }
    } else break
  }

  const promedioLogro = graficaABA.length > 0
    ? Math.round(graficaABA.reduce((a: number, s: any) => a + s.logro, 0) / graficaABA.length) : 0

  const histogramaData = [
    { rango: '0-25%',   count: graficaABA.filter((s: any) => s.logro < 26).length,                        color: '#DC2626' },
    { rango: '26-50%',  count: graficaABA.filter((s: any) => s.logro >= 26 && s.logro < 51).length,       color: '#D97706' },
    { rango: '51-75%',  count: graficaABA.filter((s: any) => s.logro >= 51 && s.logro < 76).length,       color: '#1B5EA1' },
    { rango: '76-89%',  count: graficaABA.filter((s: any) => s.logro >= 76 && s.logro < 90).length,       color: '#0891B2' },
    { rango: '90-100%', count: graficaABA.filter((s: any) => s.logro >= 90).length,                       color: '#059669' },
  ]

  const pieData = histogramaData.filter(h => h.count > 0).map(h => ({ name: h.rango, value: h.count, color: h.color }))

  const ultimasSesiones = graficaABA.slice(-3)
  const radarData = ultimasSesiones.length > 0 ? [
    { habilidad: 'Logro',        valor: Math.round(ultimasSesiones.reduce((a: number, s: any) => a + s.logro, 0) / ultimasSesiones.length) },
    { habilidad: 'Atención',     valor: Math.round(ultimasSesiones.reduce((a: number, s: any) => a + s.atencion, 0) / ultimasSesiones.length) },
    { habilidad: 'Tolerancia',   valor: Math.round(ultimasSesiones.reduce((a: number, s: any) => a + s.tolerancia, 0) / ultimasSesiones.length) },
    { habilidad: 'Comunicación', valor: Math.round(ultimasSesiones.reduce((a: number, s: any) => a + s.comunicacion, 0) / ultimasSesiones.length) },
    { habilidad: 'Asistencia',   valor: asistencia?.tasa || 0 },
    { habilidad: 'Tareas casa',  valor: tareas?.adherencia || 0 },
  ] : []

  const graficaConColores = graficaABA.map((s: any) => ({ ...s, fill: colorLogro(s.logro) }))
  const tipoActual = TIPOS_GRAFICO.find(t => t.id === tipoGrafico)

  return (
    <div className="space-y-5">

      {/* Periodo + selector de gráfico */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[4, 8, 12, 24].map(s => (
            <button key={s} onClick={() => setSemanas(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                semanas === s ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>{s} sem</button>
          ))}
        </div>
        {!modoParent && (
          <div className="relative">
            <button onClick={() => setMostrarSelector(!mostrarSelector)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-violet-400 transition-all">
              <span>{tipoActual?.emoji}</span>
              <span>{tipoActual?.label}</span>
              <span className="text-slate-400">▾</span>
            </button>
            {mostrarSelector && (
              <div className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-52">
                <p className="text-[10px] font-black text-slate-400 uppercase px-2 py-1">Tipo de gráfico</p>
                {TIPOS_GRAFICO.map(t => (
                  <button key={t.id} onClick={() => { setTipoGrafico(t.id); setMostrarSelector(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                      tipoGrafico === t.id ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-600'
                    }`}>
                    <span className="text-lg">{t.emoji}</span>
                    <div>
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-400">{t.desc}</p>
                    </div>
                    {tipoGrafico === t.id && <span className="ml-auto text-violet-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Criterio de dominio */}
      <div className={`rounded-2xl p-4 border-2 flex items-center gap-4 ${
        criterioCumplido ? 'bg-emerald-50 border-emerald-300' :
        sesionesConsecutivas > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
          criterioCumplido ? 'bg-emerald-100' : sesionesConsecutivas > 0 ? 'bg-amber-100' : 'bg-slate-100'
        }`}>
          {criterioCumplido ? '🏆' : sesionesConsecutivas > 0 ? '🔥' : '🎯'}
        </div>
        <div className="flex-1">
          <p className={`font-black text-sm ${criterioCumplido ? 'text-emerald-800' : sesionesConsecutivas > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
            Criterio de dominio: {CRITERIO_PCT}% en {CRITERIO_SESS} sesiones consecutivas
          </p>
          <p className={`text-xs mt-0.5 ${criterioCumplido ? 'text-emerald-600' : sesionesConsecutivas > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {criterioCumplido
              ? `✅ ¡Criterio cumplido! ${sesionesCriterio} sesiones consecutivas ≥ ${CRITERIO_PCT}%`
              : sesionesConsecutivas > 0
              ? `⚡ ${sesionesConsecutivas}/${CRITERIO_SESS} sesiones consecutivas — cerca del criterio`
              : `Promedio actual: ${promedioLogro}% — Meta: ${CRITERIO_PCT}%`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-black text-2xl ${criterioCumplido ? 'text-emerald-600' : sesionesConsecutivas > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {promedioLogro}%
          </p>
          <p className="text-[10px] text-slate-400">promedio</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Asistencia</p>
          <p className="text-3xl font-black text-violet-700">{asistencia?.tasa || 0}%</p>
          <p className="text-xs text-slate-400 mt-1">{asistencia?.asistidas || 0} de {asistencia?.total || 0} sesiones</p>
          <div className="mt-2 bg-slate-100 rounded-full h-1.5">
            <div className="bg-violet-500 h-full rounded-full" style={{ width: `${asistencia?.tasa || 0}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tareas en casa</p>
          <p className="text-3xl font-black text-emerald-700">{tareas?.adherencia || 0}%</p>
          <p className="text-xs text-slate-400 mt-1">{tareas?.completadas || 0} de {tareas?.total || 0} tareas</p>
          <div className="mt-2 bg-slate-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${tareas?.adherencia || 0}%` }} />
          </div>
        </div>
      </div>

      {/* Reporte IA */}
      {reporteSemanal && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🤖</span>
            <p className="font-black text-violet-800 text-sm">Análisis del período</p>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{reporteSemanal}</p>
        </div>
      )}

      {/* Gráfico principal */}
      {graficaABA.length > 1 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-700 text-sm flex items-center gap-2">
              <span>{tipoActual?.emoji}</span>
              {modoParent ? 'Progreso en sesiones' : `Progreso ABA — ${tipoActual?.label}`}
            </h3>
            {(tipoGrafico === 'lineas' || tipoGrafico === 'barras' || tipoGrafico === 'combinado') && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="inline-block w-4 border-t-2 border-dashed border-red-400"></span>
                Criterio {CRITERIO_PCT}%
              </div>
            )}
          </div>

          {tipoGrafico === 'lineas' && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={graficaABA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={f => f.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <Tooltip content={<TooltipABA />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={CRITERIO_PCT} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2}
                  label={{ value: `${CRITERIO_PCT}%`, position: 'insideTopRight', fontSize: 10, fill: '#EF4444' }} />
                <Line type="monotone" dataKey="logro" stroke="#5B21B6" strokeWidth={2.5} dot={{ r: 4 }} name="Logro objetivos" />
                {!modoParent && (
                  <>
                    <Line type="monotone" dataKey="atencion"    stroke="#059669" strokeWidth={1.5} dot={false} name="Atención" />
                    <Line type="monotone" dataKey="tolerancia"  stroke="#D97706" strokeWidth={1.5} dot={false} name="Tolerancia" />
                    <Line type="monotone" dataKey="comunicacion" stroke="#0891B2" strokeWidth={1.5} dot={false} name="Comunicación" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'barras' && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={graficaConColores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={f => f.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <Tooltip content={<TooltipABA />} />
                <ReferenceLine y={CRITERIO_PCT} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2}
                  label={{ value: `${CRITERIO_PCT}%`, position: 'right', fontSize: 10, fill: '#EF4444' }} />
                <Bar dataKey="logro" name="Logro objetivos" radius={[4, 4, 0, 0]}>
                  {graficaConColores.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'combinado' && (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={graficaABA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={f => f.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <Tooltip content={<TooltipABA />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={CRITERIO_PCT} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2} />
                <Area type="monotone" dataKey="logro" fill="#EDE9FE" stroke="#5B21B6" strokeWidth={2} name="Logro objetivos" />
                {!modoParent && (
                  <Line type="monotone" dataKey="atencion" stroke="#059669" strokeWidth={1.5} dot={false} name="Atención" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'histograma' && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogramaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="rango" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v} sesiones`, 'Cantidad']} />
                <Bar dataKey="count" name="Sesiones" radius={[4, 4, 0, 0]}>
                  {histogramaData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {tipoGrafico === 'pie' && (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} sesiones`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {histogramaData.map(h => (
                  <div key={h.rango} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: h.color }} />
                    <span className="text-xs text-slate-600 flex-1">{h.rango}</span>
                    <span className="text-xs font-black" style={{ color: h.color }}>{h.count}</span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">Total: {graficaABA.length} sesiones</p>
              </div>
            </div>
          )}

          {tipoGrafico === 'radar' && radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e7ff" />
                <PolarAngleAxis dataKey="habilidad" tick={{ fontSize: 11 }} />
                <Radar dataKey="valor" stroke="#5B21B6" fill="#5B21B6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip formatter={(v: any) => [`${v}%`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Evaluaciones */}
      {!modoParent && evaluaciones && Object.keys(evaluaciones).length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <h3 className="font-black text-slate-700 text-sm mb-3">🧠 Evaluaciones neuropsicológicas</h3>
          <div className="space-y-2">
            {Object.entries(evaluaciones).map(([nombre, datos]: [string, any]) => (
              <div key={nombre} className="flex items-center justify-between p-2.5 bg-violet-50 rounded-xl">
                <span className="font-black text-violet-800 text-sm uppercase">{nombre}</span>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{datos[0]?.created_at ? new Date(datos[0].created_at).toLocaleDateString('es-PE') : 'N/A'}</p>
                  <p className="text-xs text-violet-600 font-bold">{datos.length} registro{datos.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {graficaABA.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-500 text-sm font-bold">Sin sesiones en este período</p>
          <p className="text-slate-300 text-xs mt-1">Registrá sesiones para ver el progreso</p>
        </div>
      )}
    </div>
  )
}
