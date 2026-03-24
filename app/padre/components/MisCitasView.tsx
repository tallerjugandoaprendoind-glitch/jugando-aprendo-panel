'use client'

import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback } from 'react'
import type { JSX } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  Phone, RefreshCw, CalendarDays, Baby, Video, Loader2,
  ChevronLeft, ChevronRight, Mail, Info
} from 'lucide-react'
import VideoCallModal from '@/components/VideoCallModal'

interface Appointment {
  id: string
  child_id: string
  parent_id: string
  appointment_date: string
  appointment_time: string
  service_type: string
  status: string
  notes: string
  is_group: boolean
  group_name: string
  type: string
  children?: { name: string; birth_date: string }
}

interface Props {
  profile: any
  selectedChild: any
  onCancelAppointment: (id: string, reschedule: boolean) => void
  onChangeView: (view: string) => void
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: JSX.Element; dot: string }> = {
  confirmed: { 
    label: 'Confirmada', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50 border-emerald-200', 
    icon: <CheckCircle size={13}/>,
    dot: 'bg-emerald-500'
  },
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bg: 'bg-amber-50 border-amber-200', 
    icon: <AlertCircle size={13}/>,
    dot: 'bg-amber-400'
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200', 
    icon: <XCircle size={13}/>,
    dot: 'bg-red-400'
  },
  completed: { 
    label: 'Completada', 
    color: 'text-slate-500', 
    bg: 'bg-slate-50 border-slate-200', 
    icon: <CheckCircle size={13}/>,
    dot: 'bg-slate-400'
  },
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DAYS_MIN = ['D','L','M','M','J','V','S']

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

function isUpcoming(dateStr: string) {
  const today = new Date()
  today.setHours(0,0,0,0)
  const [y,m,d] = dateStr.split('-').map(Number)
  const apptDate = new Date(y, m-1, d)
  return apptDate >= today
}

function AppointmentCalendar({ appointments, onSelectDay, selectedDay }: {
  appointments: Appointment[]
  onSelectDay: (day: string | null) => void
  selectedDay: string | null
}) {
  const todayObj = new Date()
  const [viewYear, setViewYear] = useState(todayObj.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayObj.getMonth())

  const apptMap: Record<string, Appointment[]> = {}
  appointments.forEach(a => {
    if (!apptMap[a.appointment_date]) apptMap[a.appointment_date] = []
    apptMap[a.appointment_date].push(a)
  })

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1) }
    else setViewMonth(m => m + 1)
  }

  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-4">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90">
            <ChevronLeft size={16}/>
          </button>
          <div className="text-center">
            <p className="text-white font-black text-base">{MONTHS_ES[viewMonth]}</p>
            <p className="text-purple-200 text-xs font-semibold">{viewYear}</p>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90">
            <ChevronRight size={16}/>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAYS_MIN.map((d, i) => (
            <div key={i} className={`text-center text-[11px] font-black py-1 ${i === 0 || i === 6 ? 'text-slate-300' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i}/>
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayAppts = apptMap[dateStr] || []
            const hasAppt = dayAppts.length > 0
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            const isPast = dateStr < todayStr
            const hasActive = dayAppts.some(a => a.status !== 'cancelled')
            const allCancelled = dayAppts.length > 0 && dayAppts.every(a => a.status === 'cancelled')

            return (
              <button
                key={i}
                onClick={() => hasAppt ? onSelectDay(isSelected ? null : dateStr) : undefined}
                disabled={!hasAppt}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all
                  ${!hasAppt ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}
                  ${isSelected 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105 ring-2 ring-violet-400 ring-offset-1' 
                    : isToday && hasAppt
                      ? 'bg-violet-600 text-white shadow-md'
                      : isToday
                        ? 'ring-2 ring-violet-300 text-violet-700'
                        : hasActive && !isPast
                          ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-300'
                          : hasActive
                            ? 'bg-slate-100 text-slate-600'
                            : allCancelled
                              ? 'bg-red-50 text-red-300'
                              : 'text-slate-400'
                  }
                `}
              >
                <span className="leading-none text-xs">{day}</span>
                {hasAppt && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayAppts.slice(0, 3).map((a, idx) => {
                      const dotColor = a.status === 'confirmed' ? 'bg-emerald-400' 
                        : a.status === 'pending' ? 'bg-amber-400'
                        : a.status === 'cancelled' ? 'bg-red-300'
                        : 'bg-slate-400'
                      return <div key={idx} className={`w-1 h-1 rounded-full ${isSelected || (isToday && hasAppt) ? 'bg-white/80' : dotColor}`}/>
                    })}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {[
          { color: 'bg-purple-300', label: 'Con cita' },
          { color: 'bg-emerald-400', label: 'Confirmada' },
          { color: 'bg-amber-400', label: 'Pendiente' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}/>
            <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppointmentCard({ apt, selectedChild, activeVideoSessions, joiningCall, handleJoinVideoCall }: {
  apt: Appointment
  selectedChild: any
  activeVideoSessions: Record<string, any>
  joiningCall: string | null
  handleJoinVideoCall: (apt: Appointment) => void
}) {
  const cfg = statusConfig[apt.status] || statusConfig.pending
  const childName = (apt as any).children?.name || selectedChild?.name || ''
  const upcoming = isUpcoming(apt.appointment_date)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all shadow-sm hover:shadow-md ${
      upcoming && apt.status !== 'cancelled' ? 'border-violet-100' : 'border-slate-100 opacity-75'
    }`}>
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${cfg.dot}`}/>
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border mb-2 ${cfg.bg} ${cfg.color}`}>
                {cfg.icon} {cfg.label}
                {apt.is_group && <span className="ml-1 opacity-70">• Grupal</span>}
              </span>
              <h3 className="font-black text-slate-800 text-sm">{apt.service_type || apt.type || 'Terapia'}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                {childName && (
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Baby size={10}/> {childName}</span>
                )}
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Clock size={10} className="text-slate-400"/> {formatTime(apt.appointment_time)}
                </span>
                {(apt as any).modalidad === 'virtual' && (
                  <span className="text-xs text-indigo-500 font-bold flex items-center gap-1"><Video size={10}/> Virtual</span>
                )}
              </div>
              {apt.notes && <p className="text-xs text-slate-400 mt-2 italic line-clamp-2">"{apt.notes}"</p>}
            </div>
          </div>

          {upcoming && (apt.status === 'confirmed' || apt.status === 'pending') && (apt as any).modalidad === 'virtual' && (() => {
            const activeSession = activeVideoSessions[apt.id]
            if (activeSession) return (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <button
                  onClick={() => handleJoinVideoCall(apt)}
                  disabled={joiningCall === apt.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                >
                  {joiningCall === apt.id ? <><Loader2 size={15} className="animate-spin"/> Conectando...</> : <><Video size={15}/> 🟢 Unirse a videollamada</>}
                </button>
              </div>
            )
            return (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0"/>
                  <p className="text-xs text-indigo-600 font-semibold">El enlace aparecerá cuando inicie la sesión</p>
                  <Video size={13} className="text-indigo-400 ml-auto shrink-0"/>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default function MisCitasView({ profile, selectedChild, onCancelAppointment, onChangeView }: Props) {
  const { t } = useI18n()
  const supabase = supabaseClient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [videoSession, setVideoSession] = useState<{roomUrl:string;sessionId:string;appointmentId:string}|null>(null)
  const [joiningCall, setJoiningCall] = useState<string|null>(null)
  const [activeVideoSessions, setActiveVideoSessions] = useState<Record<string, {sessionId:string;roomUrl:string}>>({})
  const [listView, setListView] = useState<'upcoming' | 'all'>('upcoming')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const pollActiveSessions = useCallback(async (apts: Appointment[]) => {
    const virtualUpcoming = apts.filter(a =>
      (a as any).modalidad === 'virtual' &&
      isUpcoming(a.appointment_date) &&
      (a.status === 'confirmed' || a.status === 'pending')
    )
    if (virtualUpcoming.length === 0) return
    const results: Record<string, {sessionId:string;roomUrl:string}> = {}
    await Promise.all(
      virtualUpcoming.map(async (apt) => {
        try {
          const res = await fetch(`/api/video-call?appointment_id=${apt.id}`)
          const data = await res.json()
          if (data.session?.roomUrl) {
            results[apt.id] = { sessionId: data.session.sessionId, roomUrl: data.session.roomUrl }
          }
        } catch { /* silencioso */ }
      })
    )
    setActiveVideoSessions(results)
  }, [])

  const handleJoinVideoCall = (apt: Appointment) => {
    const session = activeVideoSessions[apt.id]
    if (!session) return
    setJoiningCall(apt.id)
    setVideoSession({ roomUrl: session.roomUrl, sessionId: session.sessionId, appointmentId: apt.id })
    setJoiningCall(null)
  }

  useEffect(() => { loadAppointments() }, [profile?.id, selectedChild?.id])

  useEffect(() => {
    if (appointments.length === 0) return
    const interval = setInterval(() => pollActiveSessions(appointments), 15000)
    return () => clearInterval(interval)
  }, [appointments, pollActiveSessions])

  const loadAppointments = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data: myChildren } = await supabase.from('children').select('id').eq('parent_id', profile.id)
      const childIds = (myChildren || []).map((c: any) => c.id)
      let query = supabase
        .from('appointments')
        .select('*, children(name, birth_date)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
      if (selectedChild?.id) {
        query = query.eq('child_id', selectedChild.id)
      } else if (childIds.length > 0) {
        const childFilter = childIds.map((id: string) => `child_id.eq.${id}`).join(',')
        query = query.or(`parent_id.eq.${profile.id},${childFilter}`)
      } else {
        query = query.eq('parent_id', profile.id)
      }
      const { data, error } = await query
      if (error) throw error
      setAppointments(data || [])
      pollActiveSessions(data || [])
    } catch (e) {
      console.error('Error cargando citas:', e)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const upcomingCount = appointments.filter(a => a.appointment_date >= today && a.status !== 'cancelled').length
  const completedCount = appointments.filter(a => a.status === 'completed').length

  const selectedDayAppts = selectedDay ? appointments.filter(a => a.appointment_date === selectedDay) : []

  const listAppointments = appointments.filter(a => {
    if (selectedDay) return false
    if (listView === 'upcoming') return a.appointment_date >= today && a.status !== 'cancelled'
    if (statusFilter !== 'all') return a.status === statusFilter
    return true
  })

  const grouped: Record<string, Appointment[]> = {}
  listAppointments.forEach(a => {
    if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []
    grouped[a.appointment_date].push(a)
  })

  return (
    <>
      {videoSession && (
        <VideoCallModal
          roomUrl={videoSession.roomUrl}
          sessionId={videoSession.sessionId}
          appointmentId={videoSession.appointmentId}
          participantName={profile?.full_name || 'Padre/Madre'}
          onClose={() => { setVideoSession(null); loadAppointments() }}
        />
      )}

      <div className="animate-fade-in space-y-5 pb-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-200/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"/>
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full blur-2xl translate-y-6 -translate-x-6"/>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={16} className="opacity-80"/>
              <span className="text-purple-200 text-xs font-bold tracking-widest uppercase">Mis Citas</span>
            </div>
            <h1 className="text-2xl font-black mb-4">
              {selectedChild?.name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'Mis citas'}
            </h1>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: upcomingCount, label: 'Próximas' },
                { val: completedCount, label: 'Realizadas' },
                { val: appointments.length, label: 'Total' },
              ].map(({ val, label }) => (
                <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black">{val}</div>
                  <div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info: citas asignadas por el centro */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Info size={15} className="text-blue-500"/>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-800">Las citas son asignadas por el equipo del centro</p>
            <p className="text-xs text-blue-600 mt-0.5">Para solicitar, cambiar o cancelar, contactá directamente con recepción.</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a href="tel:+51924807183" className="text-xs font-bold text-blue-700 flex items-center gap-1.5 hover:underline">
                <Phone size={11}/> +51 924 807 183
              </a>
              <a href="mailto:tallerjugandoaprendoind@gmail.com" className="text-xs font-bold text-blue-700 flex items-center gap-1.5 hover:underline">
                <Mail size={11}/> Escribir email
              </a>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"/>
            <p className="text-slate-400 font-medium text-sm">Cargando citas...</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <AppointmentCalendar appointments={appointments} onSelectDay={setSelectedDay} selectedDay={selectedDay}/>

            {/* Selected day detail */}
            {selectedDay && selectedDayAppts.length > 0 && (
              <div className="bg-white rounded-3xl border border-violet-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-100">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-violet-500"/>
                    <span className="text-sm font-black text-violet-700">
                      {(() => {
                        const [y,m,d] = selectedDay.split('-').map(Number)
                        const date = new Date(y, m-1, d)
                        return `${DAYS_ES[date.getDay()]}, ${d} de ${MONTHS_ES[m-1]}`
                      })()}
                    </span>
                    <span className="text-xs text-violet-400 font-semibold">({selectedDayAppts.length} cita{selectedDayAppts.length !== 1 ? 's' : ''})</span>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="text-xs text-violet-400 hover:text-violet-600 font-black w-6 h-6 flex items-center justify-center rounded-lg hover:bg-violet-100 transition-all">✕</button>
                </div>
                <div className="p-3 space-y-2">
                  {selectedDayAppts.map(apt => (
                    <AppointmentCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVideoSessions={activeVideoSessions} joiningCall={joiningCall} handleJoinVideoCall={handleJoinVideoCall}/>
                  ))}
                </div>
              </div>
            )}

            {/* List section */}
            {!selectedDay && (
              <>
                <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                  <button onClick={() => setListView('upcoming')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${listView === 'upcoming' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>📅 Próximas</button>
                  <button onClick={() => setListView('all')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${listView === 'all' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>📋 Todas</button>
                </div>

                {listView === 'all' && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'Todas' },
                      { key: 'confirmed', label: '✅ Confirmadas' },
                      { key: 'pending', label: '⏳ Pendientes' },
                      { key: 'completed', label: '🏆 Completadas' },
                      { key: 'cancelled', label: '❌ Canceladas' },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => setStatusFilter(key)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${statusFilter === key ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>{label}</button>
                    ))}
                  </div>
                )}

                {listAppointments.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CalendarDays size={28} className="text-violet-400"/>
                    </div>
                    <h3 className="font-bold text-slate-700 text-base mb-1">Sin citas aquí</h3>
                    <p className="text-slate-400 text-sm">{listView === 'upcoming' ? 'No tienes citas próximas agendadas.' : 'No hay citas con ese filtro.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(grouped).map(([dateStr, appts]) => {
                      const [y,m,d] = dateStr.split('-').map(Number)
                      const date = new Date(y, m-1, d)
                      const isToday = dateStr === today
                      return (
                        <div key={dateStr}>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isToday ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {isToday ? '🔵 Hoy' : `${DAYS_ES[date.getDay()]} ${d} ${MONTHS_SHORT[m-1]}`}
                            </span>
                            <div className="h-px flex-1 bg-slate-100"/>
                          </div>
                          <div className="space-y-2">
                            {appts.map(apt => <AppointmentCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVideoSessions={activeVideoSessions} joiningCall={joiningCall} handleJoinVideoCall={handleJoinVideoCall}/>)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
