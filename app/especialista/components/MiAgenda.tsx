'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_ABREV = ['D','L','M','X','J','V','S']

const STATUS_CFG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  confirmed: { label: 'Confirmada', color: '#10b981', dot: '#10b981', bg: '#10b98118' },
  pending:   { label: 'Pendiente',  color: '#f59e0b', dot: '#f59e0b', bg: '#f59e0b18' },
  cancelled: { label: 'Cancelada',  color: '#ef4444', dot: '#ef4444', bg: '#ef444418' },
  completed: { label: 'Completada', color: '#06b6d4', dot: '#06b6d4', bg: '#06b6d418' },
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
  citas.filter(c => { const f = new Date(c.appointment_date + 'T00:00:00'); return f.getFullYear() === año && f.getMonth() === mesN }).forEach(c => {
    const d = new Date(c.appointment_date + 'T00:00:00').getDate()
    if (!citasPorDia[d]) citasPorDia[d] = []
    citasPorDia[d].push(c)
  })

  const citasDelDia = diaSeleccionado ? citas.filter(c => c.appointment_date === diaSeleccionado) : []
  const proximasCitas = citas.filter(c => c.appointment_date >= hoy && c.status !== 'cancelled').slice(0, 8)

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">Mi Agenda</h2>
          <p style={{ color: '#475569' }} className="text-sm mt-1">Citas y sesiones · Solo lectura</p>
        </div>
        <button onClick={cargar}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
          className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Calendario */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-2xl overflow-hidden">

        {/* Mes nav */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="flex items-center justify-between px-5 py-4">
          <button onClick={() => setMes(new Date(año, mesN - 1, 1))}
            style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <h3 style={{ color: '#e2e8f0', letterSpacing: '-0.02em' }} className="font-black text-base">
            {MESES[mesN]} <span style={{ color: '#475569' }}>{año}</span>
          </h3>
          <button onClick={() => setMes(new Date(año, mesN + 1, 1))}
            style={{ color: '#475569', background: 'rgba(255,255,255,0.04)' }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Días semana */}
        <div className="grid grid-cols-7 px-3 py-2">
          {DIAS_ABREV.map(d => (
            <div key={d} style={{ color: '#334155' }} className="text-center text-xs font-black py-1">{d}</div>
          ))}
        </div>

        {/* Grid días */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={20} style={{ color: '#06b6d4' }} className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-7 px-3 pb-4 gap-1">
            {Array.from({ length: primerDia }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasEnMes }, (_, i) => {
              const dia = i + 1
              const fechaStr = `${año}-${String(mesN + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const tieneCitas = citasPorDia[dia] || []
              const esHoy = fechaStr === hoy
              const seleccionado = diaSeleccionado === fechaStr
              return (
                <button key={dia} onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                  style={{
                    background: seleccionado ? '#06b6d4' : esHoy ? 'rgba(6,182,212,0.1)' : 'transparent',
                    border: seleccionado ? 'none' : esHoy ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
                    color: seleccionado ? '#fff' : esHoy ? '#06b6d4' : '#94a3b8',
                  }}
                  className="relative flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold hover:bg-white/5 transition-all aspect-square">
                  {dia}
                  {tieneCitas.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tieneCitas.slice(0, 3).map((c, idx) => {
                        const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                        return <span key={idx} style={{ background: seleccionado ? 'rgba(255,255,255,0.6)' : cfg.dot }}
                          className="w-1 h-1 rounded-full" />
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Detalle día seleccionado */}
      {diaSeleccionado && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(6,182,212,0.2)' }} className="rounded-2xl overflow-hidden">
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="px-5 py-4 flex items-center gap-3">
            <div style={{ background: '#06b6d420', color: '#06b6d4' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Calendar size={14} />
            </div>
            <h3 style={{ color: '#e2e8f0' }} className="font-bold text-sm">
              {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
              className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full">
              {citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}
            </span>
          </div>
          {citasDelDia.length === 0 ? (
            <p style={{ color: '#334155' }} className="text-center py-8 text-sm font-semibold">Sin citas este día</p>
          ) : (
            <div>
              {citasDelDia.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map((c, idx) => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                return (
                  <div key={c.id}
                    style={{ borderBottom: idx < citasDelDia.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    className="px-5 py-4 flex items-center gap-4">
                    <div style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}50` }}
                      className="w-2 h-2 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#e2e8f0' }} className="font-bold text-sm">{c.children?.name}</p>
                      <p style={{ color: '#475569' }} className="text-xs">{c.service_type}</p>
                      {c.children?.profiles?.full_name && (
                        <p style={{ color: '#334155' }} className="text-xs">{c.children.profiles.full_name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p style={{ color: '#e2e8f0' }} className="text-sm font-bold tabular-nums">{c.appointment_time}</p>
                      <span style={{ background: cfg.bg, color: cfg.color }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full">{cfg.label}</span>
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
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }} className="rounded-2xl overflow-hidden">
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="px-5 py-4 flex items-center gap-3">
            <div style={{ background: '#10b98120', color: '#10b981' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Clock size={14} />
            </div>
            <h3 style={{ color: '#e2e8f0' }} className="font-bold text-sm">Próximas Citas</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} style={{ color: '#06b6d4' }} className="animate-spin" /></div>
          ) : proximasCitas.length === 0 ? (
            <p style={{ color: '#334155' }} className="text-center py-10 text-sm font-semibold">Sin citas próximas</p>
          ) : (
            <div>
              {proximasCitas.map((c, idx) => {
                const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                const fecha = new Date(c.appointment_date + 'T00:00:00')
                return (
                  <div key={c.id}
                    style={{ borderBottom: idx < proximasCitas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    className="px-5 py-4 flex items-center gap-4">
                    <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.06)' }}
                      className="w-12 text-center py-2 rounded-xl flex-shrink-0">
                      <p style={{ color: '#475569' }} className="text-[10px] font-black uppercase">{MESES[fecha.getMonth()].slice(0, 3)}</p>
                      <p style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }} className="text-xl font-black leading-none">{fecha.getDate()}</p>
                    </div>
                    <div style={{ background: cfg.dot, height: 36 }} className="w-0.5 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#e2e8f0' }} className="font-bold text-sm truncate">{c.children?.name}</p>
                      <p style={{ color: '#475569' }} className="text-xs">{c.service_type} · {c.appointment_time}</p>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color }} className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">{cfg.label}</span>
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
