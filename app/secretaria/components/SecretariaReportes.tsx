'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, BarChart3, Calendar, Users, CheckCircle2, XCircle,
  Clock, Loader2, RefreshCw, Download, AlertTriangle, CalendarDays
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function SecretariaReportes() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre'>('mes')
  const [stats, setStats] = useState({
    total: 0, confirmed: 0, completed: 0, cancelled: 0, pending: 0,
    porDia: [] as any[], porPaciente: [] as any[], tasaAsistencia: 0
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      let desde: Date
      if (periodo === 'semana') { desde = new Date(now); desde.setDate(now.getDate() - 7) }
      else if (periodo === 'mes') { desde = new Date(now.getFullYear(), now.getMonth(), 1) }
      else { desde = new Date(now); desde.setMonth(now.getMonth() - 3) }

      const desdeStr = desde.toISOString().split('T')[0]

      const { data: allApts } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, service_type, child_id, children(name)')
        .gte('appointment_date', desdeStr)
        .order('appointment_date')

      const apts = allApts || []

      // Group by day for chart
      const byDay: Record<string, { dia: string; confirmadas: number; completadas: number; canceladas: number; pendientes: number }> = {}
      apts.forEach(a => {
        const d = a.appointment_date
        const date = new Date(d + 'T00:00:00')
        const label = `${date.getDate()} ${MESES_CORTOS[date.getMonth()]}`
        if (!byDay[d]) byDay[d] = { dia: label, confirmadas: 0, completadas: 0, canceladas: 0, pendientes: 0 }
        if (a.status === 'confirmed') byDay[d].confirmadas++
        if (a.status === 'completed') byDay[d].completadas++
        if (a.status === 'cancelled') byDay[d].canceladas++
        if (a.status === 'pending')   byDay[d].pendientes++
      })

      // Group by patient (no clinical data — just name and count)
      const byPaciente: Record<string, { nombre: string; total: number; asistidas: number }> = {}
      apts.forEach(a => {
        const id = a.child_id
        const nombre = (a.children as any)?.name || 'Sin nombre'
        if (!byPaciente[id]) byPaciente[id] = { nombre, total: 0, asistidas: 0 }
        byPaciente[id].total++
        if (a.status === 'completed' || a.status === 'confirmed') byPaciente[id].asistidas++
      })

      const completed = apts.filter(a => a.status === 'completed').length
      const confirmed = apts.filter(a => a.status === 'confirmed').length
      const attended = completed + confirmed
      const tasaAsistencia = apts.length > 0 ? Math.round((attended / apts.length) * 100) : 0

      setStats({
        total: apts.length,
        confirmed,
        completed,
        cancelled: apts.filter(a => a.status === 'cancelled').length,
        pending: apts.filter(a => a.status === 'pending').length,
        porDia: Object.values(byDay).slice(-14),
        porPaciente: Object.values(byPaciente).sort((a, b) => b.total - a.total).slice(0, 10),
        tasaAsistencia
      })
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  const pieData = [
    { name: 'Confirmadas', value: stats.confirmed, color: '#10b981' },
    { name: 'Completadas', value: stats.completed, color: '#3b82f6' },
    { name: 'Canceladas',  value: stats.cancelled, color: '#ef4444' },
    { name: 'Pendientes',  value: stats.pending,   color: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Reportes de Asistencia</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gráficos generales de programación y asistencia</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors">
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium">
          Este módulo muestra únicamente estadísticas generales de asistencia y programación.
          No incluye información clínica, diagnósticos ni datos sensibles de los pacientes.
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wide">Período:</span>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {([['semana','Últimos 7 días'], ['mes','Este mes'], ['trimestre','Último trimestre']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPeriodo(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${periodo === val ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total citas', value: stats.total, icon: Calendar, color: 'bg-slate-100 text-slate-700' },
              { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Completadas', value: stats.completed, icon: CheckCircle2, color: 'bg-blue-100 text-blue-700' },
              { label: 'Canceladas', value: stats.cancelled, icon: XCircle, color: 'bg-red-100 text-red-600' },
              { label: '% Asistencia', value: `${stats.tasaAsistencia}%`, icon: TrendingUp, color: 'bg-violet-100 text-violet-700' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(' ')[0]}`}>
                  <Icon size={17} className={color.split(' ')[1]} />
                </div>
                <p className="text-2xl font-black text-slate-800">{value}</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart — sessions by day */}
          {stats.porDia.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-black text-sm text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-violet-500" /> Sesiones por día
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.porDia} barSize={12} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} interval={Math.ceil(stats.porDia.length / 10) - 1} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="confirmadas" name="Confirmadas" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="completadas" name="Completadas" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="canceladas"  name="Canceladas"  fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="pendientes"  name="Pendientes"  fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-black text-sm text-slate-800 mb-4">Distribución por estado</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name ?? ''} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Patients attendance table */}
            {stats.porPaciente.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-black text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <Users size={15} className="text-violet-500" /> Asistencia por paciente
                </h3>
                <div className="space-y-2">
                  {stats.porPaciente.map(({ nombre, total, asistidas }) => {
                    const pct = total > 0 ? Math.round((asistidas / total) * 100) : 0
                    return (
                      <div key={nombre} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-black text-violet-600 flex-shrink-0">
                          {nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-bold text-slate-700 truncate">{nombre}</p>
                            <span className="text-xs font-black text-slate-500 ml-2">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{asistidas} de {total} sesiones</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {stats.total === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-16 text-center text-slate-300">
              <CalendarDays size={36} className="mx-auto mb-3" />
              <p className="font-semibold">No hay datos para el período seleccionado</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
