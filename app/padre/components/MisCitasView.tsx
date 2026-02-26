'use client'
import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  ChevronRight, Phone, MessageCircle, RefreshCw, 
  CalendarDays, Filter, Sparkles, Baby, ArrowRight,
  MapPin, Star, TrendingUp, Video, Loader2
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
    icon: <CheckCircle size={14}/>,
    dot: 'bg-emerald-500'
  },
  pending: { 
    label: 'Pendiente', 
    color: 'text-amber-700', 
    bg: 'bg-amber-50 border-amber-200', 
    icon: <AlertCircle size={14}/>,
    dot: 'bg-amber-500'
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200', 
    icon: <XCircle size={14}/>,
    dot: 'bg-red-400'
  },
  completed: { 
    label: 'Completada', 
    color: 'text-slate-500', 
    bg: 'bg-slate-50 border-slate-200', 
    icon: <CheckCircle size={14}/>,
    dot: 'bg-slate-400'
  },
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day: d,
    month: MONTHS_ES[m - 1],
    year: y,
    dayName: DAYS_ES[date.getDay()],
    full: `${DAYS_ES[date.getDay()]}, ${d} de ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]} ${y}`
  }
}

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

export default function MisCitasView({ profile, selectedChild, onCancelAppointment, onChangeView }: Props) {
  const supabase = supabaseClient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [videoSession, setVideoSession] = useState<{roomUrl:string;sessionId:string}|null>(null)
  const [joiningCall, setJoiningCall] = useState<string|null>(null)

  const handleJoinVideoCall = async (notification: any) => {
    if (!notification?.metadata?.room_url) return
    setJoiningCall(notification.id)
    // Mark notification as read
    await supabaseClient.from('notifications').update({is_read:true}).eq('id', notification.id)
    setVideoSession({ roomUrl: notification.metadata.room_url, sessionId: notification.metadata.session_id || '' })
    setJoiningCall(null)
  }
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadAppointments()
  }, [profile?.id, selectedChild?.id])

  const loadAppointments = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      // Strategy: get all children of this parent, then query appointments by parent_id OR child_id IN [children_ids]
      const { data: myChildren } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', profile.id)

      const childIds = (myChildren || []).map((c: any) => c.id)

      let query = supabase
        .from('appointments')
        .select('*, children(name, birth_date)')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

      // Apply child filter if selectedChild is set
      if (selectedChild?.id) {
        query = query.eq('child_id', selectedChild.id)
      } else if (childIds.length > 0) {
        // Filter by parent_id OR child_id in our children list
        const childFilter = childIds.map((id: string) => `child_id.eq.${id}`).join(',')
        query = query.or(`parent_id.eq.${profile.id},${childFilter}`)
      } else {
        query = query.eq('parent_id', profile.id)
      }

      const { data, error } = await query
      if (error) throw error
      setAppointments(data || [])
    } catch (e) {
      console.error('Error cargando citas:', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = appointments.filter(a => {
    const up = isUpcoming(a.appointment_date)
    if (filter === 'upcoming' && !up) return false
    if (filter === 'past' && up) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const upcomingCount = appointments.filter(a => isUpcoming(a.appointment_date) && a.status !== 'cancelled').length
  const completedCount = appointments.filter(a => a.status === 'completed').length
  const totalSessions = appointments.filter(a => a.status === 'completed').length

  // Group by month
  const grouped: Record<string, Appointment[]> = {}
  filtered.forEach(a => {
    const [y, m] = a.appointment_date.split('-').map(Number)
    const key = `${MONTHS_ES[m-1]} ${y}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  })

  return (
    <>
      {videoSession && (
        <VideoCallModal
          roomUrl={videoSession.roomUrl}
          sessionId={videoSession.sessionId}
          participantName={profile?.full_name || 'Padre/Madre'}
          onClose={() => setVideoSession(null)}
        />
      )}
    <div className="animate-fade-in space-y-6 pb-8">
      
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl shadow-purple-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"/>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-8 -translate-x-8"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={18} className="opacity-80"/>
            <span className="text-purple-200 text-sm font-semibold tracking-wide uppercase">Mis Citas</span>
          </div>
          <h1 className="text-2xl font-black mb-4">
            {selectedChild?.name?.split(' ')[0] || 'Todas las citas'}
          </h1>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-2xl font-black">{upcomingCount}</div>
              <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider mt-0.5">Próximas</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-2xl font-black">{completedCount}</div>
              <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider mt-0.5">Realizadas</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-2xl font-black">{appointments.length}</div>
              <div className="text-[10px] text-purple-200 font-semibold uppercase tracking-wider mt-0.5">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Time filter */}
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          {[
            { key: 'upcoming', label: '📅 Próximas' },
            { key: 'past', label: '📋 Historial' },
            { key: 'all', label: '🗓️ Todas' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                filter === key
                  ? 'bg-white text-slate-800 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'confirmed', label: '✅ Confirmadas' },
            { key: 'pending', label: '⏳ Pendientes' },
            { key: 'completed', label: '🏆 Completadas' },
            { key: 'cancelled', label: '❌ Canceladas' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                statusFilter === key
                  ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"/>
          <p className="text-slate-400 font-medium">Cargando citas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={36} className="text-violet-400"/>
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">Sin citas aquí</h3>
          <p className="text-slate-400 text-sm mb-6">
            {filter === 'upcoming' 
              ? 'No tienes citas próximas agendadas.'
              : 'No hay citas en el historial seleccionado.'}
          </p>
          {filter === 'upcoming' && (
            <button
              onClick={() => onChangeView('agenda')}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-purple-200"
            >
              <Calendar size={16}/> Agendar ahora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([monthYear, appts]) => (
            <div key={monthYear}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"/>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full">
                  {monthYear}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"/>
              </div>

              {/* Appointments */}
              <div className="space-y-3">
                {appts.map(apt => {
                  const dateInfo = formatDate(apt.appointment_date)
                  const upcoming = isUpcoming(apt.appointment_date)
                  const cfg = statusConfig[apt.status] || statusConfig.pending
                  const childName = (apt as any).children?.name || selectedChild?.name || ''

                  return (
                    <div
                      key={apt.id}
                      className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all group ${
                        upcoming && apt.status !== 'cancelled' 
                          ? 'border-violet-200 hover:border-violet-300' 
                          : 'border-slate-100'
                      }`}
                    >
                      <div className="flex">
                        {/* Date column */}
                        <div className={`flex flex-col items-center justify-center w-20 shrink-0 py-4 ${
                          upcoming && apt.status !== 'cancelled'
                            ? 'bg-gradient-to-b from-violet-600 to-purple-700 text-white'
                            : 'bg-slate-50 text-slate-600'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {dateInfo.dayName}
                          </span>
                          <span className="text-3xl font-black leading-none">{dateInfo.day}</span>
                          <span className="text-[11px] font-bold uppercase opacity-70">{dateInfo.month}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                                  {cfg.icon}
                                  {cfg.label}
                                </span>
                                {apt.is_group && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-200">
                                    👥 Grupal
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-bold text-slate-800 text-sm">
                                {apt.service_type || apt.type || 'Terapia'}
                              </h3>
                              
                              {childName && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Baby size={10}/> {childName}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-1 mt-2">
                                <Clock size={12} className="text-slate-400"/>
                                <span className="text-xs font-semibold text-slate-600">
                                  {formatTime(apt.appointment_time)}
                                </span>
                              </div>

                              {apt.notes && (
                                <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-1">
                                  "{apt.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ── Botón unirse a videollamada virtual ── */}
                          {upcoming && (apt as any).modalidad === 'virtual' && (apt.status === 'confirmed' || apt.status === 'pending') && (() => {
                            // Buscar notificación de videollamada para esta cita
                            return null // placeholder: se maneja desde notificaciones
                          })()}

                          {/* Actions for upcoming confirmed */}
                          {upcoming && (apt.status === 'confirmed' || apt.status === 'pending') && (
                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100">
                              {/* Badge virtual */}
                              {(apt as any).modalidad === 'virtual' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                  <Video size={13} className="text-indigo-500 shrink-0"/>
                                  <p className="text-xs text-indigo-600 font-semibold flex-1">Cita virtual · El terapeuta te enviará el link cuando inicie</p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onCancelAppointment(apt.id, true)}
                                  className="flex-1 py-1.5 px-3 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold hover:bg-violet-100 transition-all flex items-center justify-center gap-1"
                                >
                                  <RefreshCw size={11}/> Reprogramar
                                </button>
                                <button
                                  onClick={() => onCancelAppointment(apt.id, false)}
                                  className="flex-1 py-1.5 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                >
                                  <XCircle size={11}/> Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book new CTA */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-800 text-sm">¿Necesitas una nueva cita?</p>
          <p className="text-xs text-slate-500 mt-0.5">Tienes {profile?.tokens || 0} token{(profile?.tokens || 0) !== 1 ? 's' : ''} disponible{(profile?.tokens || 0) !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => onChangeView('agenda')}
          className="shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <Calendar size={15}/> Agendar
        </button>
      </div>
    </div>
    </>
  )
}