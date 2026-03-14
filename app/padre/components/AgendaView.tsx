'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Phone, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  confirmed:  { label: 'Confirmed',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  pending:    { label: 'Pendiente',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: AlertCircle },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: XCircle },
  completed:  { label: 'Completada', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: CheckCircle2 },
}

export default function AgendaView({ selectedChild }: { selectedChild?: any }) {
  const { t } = useI18n()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedChild?.id) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('appointments')
      .select('*')
      .eq('child_id', selectedChild.id)
      .order('appointment_date', { ascending: true })
      .then(({ data }) => { setCitas(data || []); setLoading(false) })
  }, [selectedChild])

  const today = new Date().toISOString().split('T')[0]
  const proximas = citas.filter(c => c.appointment_date >= today && c.status !== 'cancelled')
  const pasadas  = citas.filter(c => c.appointment_date < today || c.status === 'completed')

  if (!selectedChild) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Calendar size={48} className="mb-3 opacity-30"/>
      <p className="font-bold text-sm">{t('ui.select_child_appointments')}</p>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Calendar size={20}/>
          <h2 className="text-lg font-black">Citas de {selectedChild?.name}</h2>
        </div>
        <p className="text-violet-200 text-sm">Programadas por el equipo del centro de terapia.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Phone size={15} className="text-blue-500 shrink-0 mt-0.5"/>
        <div>
          <p className="text-sm font-bold text-blue-700">¿Necesitás cambiar o cancelar?</p>
          <p className="text-xs text-blue-600 mt-0.5">Contactá directamente al centro — te ayudarán a coordinar el horario.</p>
          <div className="flex gap-3 mt-2">
            <a href="tel:+51924807183" className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline">
              <Phone size={11}/> +51 924 807 183
            </a>
            <a href="mailto:tallerjugandoaprendoind@gmail.com" className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline">
              <Mail size={11}/> Email
            </a>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"/>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Próximas ({proximas.length})</p>
            {proximas.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <Calendar size={28} className="text-slate-200 mx-auto mb-2"/>
                <p className="font-bold text-slate-400 text-sm">{t('ui.no_upcoming_appts')}</p>
                <p className="text-xs text-slate-300 mt-1">El centro te notificará cuando programe tu próxima sesión.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximas.map(cita => {
                  const cfg = STATUS_CFG[cita.status] || STATUS_CFG.confirmed
                  const Icon = cfg.icon
                  const fecha = new Date(cita.appointment_date + 'T12:00:00')
                  return (
                    <div key={cita.id} className={`rounded-2xl border-2 p-4 flex items-center gap-4 ${cfg.bg}`}>
                      <div className="flex flex-col items-center justify-center bg-white rounded-xl p-3 min-w-[56px] text-center shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {fecha.toLocaleString('es', { month: 'short' })}
                        </span>
                        <span className="text-2xl font-black text-slate-800">{fecha.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-sm">{cita.service_type || 'Terapia ABA'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11}/> {cita.appointment_time}
                        </p>
                        {cita.notes && <p className="text-xs text-slate-400 mt-1 truncate">{cita.notes}</p>}
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-white border ${cfg.color}`}>
                        <Icon size={10}/> {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {pasadas.length > 0 && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{t('ui.history')}</p>
              <div className="space-y-2">
                {pasadas.slice(0, 6).map(cita => (
                  <div key={cita.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center gap-3 opacity-60">
                    <Calendar size={13} className="text-slate-300 shrink-0"/>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(cita.appointment_date + 'T12:00:00').toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}{cita.appointment_time}
                    </span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400">{cita.service_type || 'Terapia'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
