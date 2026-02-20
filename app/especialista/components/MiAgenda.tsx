'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_ABREV = ['D','L','M','X','J','V','S']

const STATUS_CFG: Record<string, { label: string; text: string; dot: string; badge: string }> = {
  confirmed: { label: 'Confirmada', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:   { label: 'Pendiente',  text: 'text-amber-700',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelada',  text: 'text-red-700',     dot: 'bg-red-400',     badge: 'bg-red-50 text-red-700 border-red-200' },
  completed: { label: 'Completada', text: 'text-blue-700',    dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
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
      const { data } = await supabase.from('appointments').select('*, children(name, profiles!children_parent_id_fkey(full_name))').order('appointment_date')
      setCitas(data || [])
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const año = mes.getFullYear(), mesN = mes.getMonth()
  const primerDia = new Date(año, mesN, 1).getDay()
  const diasEnMes = new Date(año, mesN + 1, 0).getDate()
  const hoy = new Date().toISOString().split('T')[0]

  const citasPorDia: Record<number, any[]> = {}
  citas.filter(c => {
    const f = new Date(c.appointment_date + 'T00:00:00')
    return f.getFullYear() === año && f.getMonth() === mesN
  }).forEach(c => {
    const d = new Date(c.appointment_date + 'T00:00:00').getDate()
    if (!citasPorDia[d]) citasPorDia[d] = []
    citasPorDia[d].push(c)
  })

  const citasDelDia = diaSeleccionado ? citas.filter(c => c.appointment_date === diaSeleccionado) : []
  const proximasCitas = citas.filter(c => c.appointment_date >= hoy && c.status !== 'cancelled').slice(0, 8)

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Mi Agenda</h2>
        <p className="text-sm text-slate-500 mt-1">Calendario de citas y sesiones</p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={() => setMes(new Date(año, mesN - 1, 1))}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-black text-slate-800 text-base">
            {MESES[mesN]} <span className="text-slate-400 font-medium">{año}</span>
          </h3>
          <button onClick={() => setMes(new Date(año, mesN + 1, 1))}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 px-3 py-2">
          {DIAS_ABREV.map(d => (
            <div key={d} className="text-center text-xs font-black text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-7 px-3 pb-4 gap-1">
            {Array.from({ length: primerDia }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasEnMes }, (_, i) => {
              const dia = i + 1
              const fechaStr = `${año}-${String(mesN + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const tieneCitas = citasPorDia[dia] || []
              const esHoy = fechaStr === hoy
              const sel = diaSeleccionado === fechaStr
              return (
                <button key={dia} onClick={() => setDiaSeleccionado(sel ? null : fechaStr)}
                  className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition-all aspect-square
                    ${sel ? 'bg-blue-600 text-white shadow-md' :
                      esHoy ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      'text-slate-600 hover:bg-slate-100'}`}>
                  {dia}
                  {tieneCitas.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tieneCitas.slice(0, 3).map((c, idx) => {
                        const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                        return <span key={idx} className={`w-1 h-1 rounded-full ${sel ? 'bg-white/70' : cfg.dot}`} />
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Day detail */}
      {diaSeleccionado && (
        <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}
            </span>
          </div>
          {citasDelDia.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400 font-semibold">Sin citas este día</p>
          ) : (
            <div>
              {citasDelDia.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map((c, idx) => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                return (
                  <div key={c.id} className={`px-5 py-4 flex items-center gap-4 ${idx < citasDelDia.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{c.children?.name}</p>
                      <p className="text-xs text-slate-500">{c.service_type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800 tabular-nums">{c.appointment_time}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Próximas Citas</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-blue-600" /></div>
          ) : proximasCitas.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400 font-semibold">Sin citas próximas</p>
          ) : (
            <div>
              {proximasCitas.map((c, idx) => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                const fecha = new Date(c.appointment_date + 'T00:00:00')
                return (
                  <div key={c.id} className={`px-5 py-4 flex items-center gap-4 ${idx < proximasCitas.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <div className="w-12 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">{MESES[fecha.getMonth()].slice(0, 3)}</p>
                      <p className="text-xl font-black text-slate-800 leading-none">{fecha.getDate()}</p>
                    </div>
                    <div className={`w-0.5 h-9 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{c.children?.name}</p>
                      <p className="text-xs text-slate-500">{c.service_type} · {c.appointment_time}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
