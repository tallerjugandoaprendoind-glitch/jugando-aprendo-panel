'use client'
// components/graficos/ProgresoGraficas.tsx
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend } from 'recharts'

interface ProgresoGraficasProps {
  childId: string
  modoParent?: boolean
}

export default function ProgresoGraficas({ childId, modoParent = false }: ProgresoGraficasProps) {
  const [datos, setDatos]   = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [semanas, setSemanas]   = useState(12)

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
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (!datos) return <p className="text-gray-400 text-center py-8">Sin datos disponibles</p>

  const { graficaABA, asistencia, tareas, evaluaciones, reporteSemanal } = datos

  // Datos para radar de habilidades (últimas 3 sesiones promedio)
  const ultimasSesiones = (graficaABA || []).slice(-3)
  const promedioHabilidades = ultimasSesiones.length > 0 ? {
    atencion:     Math.round(ultimasSesiones.reduce((a: number, s: any) => a + (s.atencion || 0), 0) / ultimasSesiones.length),
    tolerancia:   Math.round(ultimasSesiones.reduce((a: number, s: any) => a + (s.tolerancia || 0), 0) / ultimasSesiones.length),
    comunicacion: Math.round(ultimasSesiones.reduce((a: number, s: any) => a + (s.comunicacion || 0), 0) / ultimasSesiones.length),
    logro:        Math.round(ultimasSesiones.reduce((a: number, s: any) => a + (s.logro || 0), 0) / ultimasSesiones.length),
  } : null

  const radarData = promedioHabilidades ? [
    { habilidad: 'Atención',      valor: promedioHabilidades.atencion },
    { habilidad: 'Tolerancia',    valor: promedioHabilidades.tolerancia },
    { habilidad: 'Comunicación',  valor: promedioHabilidades.comunicacion },
    { habilidad: 'Logro',         valor: promedioHabilidades.logro },
    { habilidad: 'Asistencia',    valor: asistencia?.tasa || 0 },
    { habilidad: 'Tareas',        valor: tareas?.adherencia || 0 },
  ] : []

  return (
    <div className="space-y-5">

      {/* Filtro de periodo */}
      <div className="flex gap-2">
        {[4, 8, 12, 24].map(s => (
          <button key={s} onClick={() => setSemanas(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              semanas === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s} sem
          </button>
        ))}
      </div>

      {/* Reporte IA */}
      {reporteSemanal && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🤖</span>
            <p className="font-semibold text-blue-800 text-sm">Análisis del período</p>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{reporteSemanal}</p>
        </div>
      )}

      {/* Stats de asistencia y tareas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-1">Asistencia</p>
          <p className="text-3xl font-bold text-blue-700">{asistencia?.tasa || 0}%</p>
          <p className="text-xs text-gray-400 mt-1">{asistencia?.asistidas || 0} de {asistencia?.total || 0} sesiones</p>
          <div className="mt-2 bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${asistencia?.tasa || 0}%` }} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tareas en casa</p>
          <p className="text-3xl font-bold text-green-700">{tareas?.adherencia || 0}%</p>
          <p className="text-xs text-gray-400 mt-1">{tareas?.completadas || 0} de {tareas?.total || 0} tareas</p>
          <div className="mt-2 bg-gray-100 rounded-full h-1.5">
            <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${tareas?.adherencia || 0}%` }} />
          </div>
        </div>
      </div>

      {/* Gráfico de progreso en sesiones */}
      {graficaABA && graficaABA.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">
            {modoParent ? '📈 Progreso en sesiones' : '📈 Progreso ABA - Evolución'}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={graficaABA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={f => f.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
              <Tooltip formatter={(v: any) => v + '%'} labelFormatter={l => 'Fecha: ' + l} />
              <Legend />
              <Line type="monotone" dataKey="logro" stroke="#1B5EA1" strokeWidth={2} dot={{ r: 3 }} name="Logro objetivos" />
              {!modoParent && (
                <>
                  <Line type="monotone" dataKey="atencion"    stroke="#1E8449" strokeWidth={1.5} dot={false} name="Atención" />
                  <Line type="monotone" dataKey="tolerancia"  stroke="#CA6F1E" strokeWidth={1.5} dot={false} name="Tolerancia" />
                  <Line type="monotone" dataKey="comunicacion" stroke="#8E44AD" strokeWidth={1.5} dot={false} name="Comunicación" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar de habilidades */}
      {radarData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-4">
            {modoParent ? '🎯 Fortalezas actuales' : '🎯 Perfil de habilidades (últimas 3 sesiones)'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e0e7ff" />
              <PolarAngleAxis dataKey="habilidad" tick={{ fontSize: 11 }} />
              <Radar dataKey="valor" stroke="#1B5EA1" fill="#1B5EA1" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evaluaciones neuropsicológicas (solo modo profesional) */}
      {!modoParent && evaluaciones && Object.keys(evaluaciones).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">🧠 Evaluaciones neuropsicológicas</h3>
          <div className="space-y-2">
            {Object.entries(evaluaciones).map(([nombre, datos]: [string, any]) => (
              <div key={nombre} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800 text-sm uppercase">{nombre}</span>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {datos[0]?.created_at ? new Date(datos[0].created_at).toLocaleDateString('es-PE') : 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600">{datos.length} registro{datos.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {graficaABA.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-gray-500 text-sm">Sin sesiones en este período</p>
        </div>
      )}
    </div>
  )
}
