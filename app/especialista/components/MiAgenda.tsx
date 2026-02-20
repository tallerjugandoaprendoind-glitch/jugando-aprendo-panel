'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Clock, User, Baby, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  confirmed: { label: 'Confirmada', color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  pending:   { label: 'Pendiente',  color: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500'   },
  cancelled: { label: 'Cancelada',  color: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500'     },
  completed: { label: 'Completada', color: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500'    },
}

export default function MiAgenda() {
  const toast = useToast()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, children(name, profiles!children_parent_id_fkey(full_name))')
        .order('appointment_date', { ascending: true })
      if (error) throw error
      setCitas(data || [])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const año = mes.getFullYear()
  const mesN = mes.getMonth()
  const primerDia = new Date(año, mesN, 1).getDay()
  const diasEnMes = new Date(año, mesN + 1, 0).getDate()

  const citasDelMes = citas.filter(c => {
    const f = new Date(c.appointment_date + 'T00:00:00')
    return f.getFullYear() === año && f.getMonth() === mesN
  })

  const citasPorDia: Record<number, any[]> = {}
  citasDelMes.forEach(c => {
    const d = new Date(c.appointment_date + 'T00:00:00').getDate()
    if (!citasPorDia[d]) citasPorDia[d] = []
    citasPorDia[d].push(c)
  })

  const citasDelDia = diaSeleccionado
    ? citas.filter(c => c.appointment_date === diaSeleccionado)
    : []

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mi Agenda</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Citas y sesiones programadas • Solo lectura</p>
        </div>
        <button onClick={cargar} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Calendario */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header mes */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setMes(new Date(año, mesN - 1, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{MESES[mesN]} {año}</h3>
          <button onClick={() => setMes(new Date(año, mesN + 1, 1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
          {DIAS.map(d => (
            <div key={d} className="text-center py-2 text-xs font-semibold text-slate-400 dark:text-slate-500">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-7 p-2 gap-1">
            {Array.from({ length: primerDia }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasEnMes }, (_, i) => {
              const dia = i + 1
              const fechaStr = `${año}-${String(mesN + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const tienesCitas = citasPorDia[dia] || []
              const esHoy = fechaStr === hoy
              const seleccionado = diaSeleccionado === fechaStr
              return (
                <button key={dia} onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${seleccionado ? 'bg-blue-600 text-white shadow-md' : esHoy ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                  {dia}
                  {tienesCitas.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tienesCitas.slice(0, 3).map((c, idx) => {
                        const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                        return <span key={idx} className={`w-1.5 h-1.5 rounded-full ${seleccionado ? 'bg-white/70' : cfg.dot}`} />
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Citas del día seleccionado */}
      {diaSeleccionado && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-MX', { dateStyle: 'full' })}
            </h3>
            <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}
            </span>
          </div>
          {citasDelDia.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <p className="text-sm">Sin citas este día</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {citasDelDia.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map(c => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                return (
                  <div key={c.id} className="px-5 py-4 flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{c.children?.name || 'Paciente'}</span>
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{c.service_type}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={11} /> {c.appointment_time}
                        {c.children?.profiles?.full_name && (
                          <span className="ml-2"><User size={11} className="inline mr-0.5" />{c.children.profiles.full_name}</span>
                        )}
                      </div>
                      {c.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{c.notes}"</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Próximas citas */}
      {!diaSeleccionado && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Próximas Citas</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {citas
                .filter(c => c.appointment_date >= hoy && c.status !== 'cancelled')
                .slice(0, 8)
                .map(c => {
                  const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                  return (
                    <div key={c.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="text-center w-12">
                        <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(c.appointment_date + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })}</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{new Date(c.appointment_date + 'T00:00:00').getDate()}</p>
                      </div>
                      <div className={`w-0.5 h-10 rounded-full ${cfg.dot} opacity-60`} />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{c.children?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.service_type} • {c.appointment_time}</p>
                      </div>
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  )
                })}
              {citas.filter(c => c.appointment_date >= hoy && c.status !== 'cancelled').length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  Sin citas próximas
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
