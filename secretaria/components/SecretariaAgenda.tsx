'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2,
  Clock, User, Users, MapPin, Video, CheckCircle2, XCircle,
  Edit2, RefreshCw, Search, Bell, CalendarDays, FileText,
  Phone, TrendingUp, MoreHorizontal, CheckCheck, Check, Unlink, Link2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── Mini botón Google Calendar ─────────────────────────────────────────────────
function GoogleCalendarMini({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [busy, setBusy]     = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/google-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
    } catch { setStatus('disconnected') }
  }

  useEffect(() => { if (userId) check() }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}&role=secretaria`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error conectando Google Calendar'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return
    await fetch(`/api/google-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected')
    toast.success('Google Calendar desconectado')
  }

  if (status === 'loading') return null

  return status === 'connected' ? (
    <button onClick={disconnect} title="Google Calendar conectado — clic para desconectar"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
      <CalendarDays size={14} className="text-emerald-500" />
      <Check size={12} />
      Google
    </button>
  ) : (
    <button onClick={connect} disabled={busy} title="Vincular Google Calendar"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
      Google
    </button>
  )
}

// ── Mini botón Microsoft / Outlook Calendar ────────────────────────────────────
function MicrosoftCalendarMini({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [busy, setBusy]     = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
    } catch { setStatus('disconnected') }
  }

  useEffect(() => { if (userId) check() }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}&role=secretaria`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error conectando Outlook Calendar'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Outlook Calendar?')) return
    await fetch(`/api/microsoft-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected')
    toast.success('Outlook Calendar desconectado')
  }

  if (status === 'loading') return null

  return status === 'connected' ? (
    <button onClick={disconnect} title="Outlook Calendar conectado — clic para desconectar"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
      <svg width="14" height="14" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
      <Check size={12} />
      Outlook
    </button>
  ) : (
    <button onClick={connect} disabled={busy} title="Vincular Outlook Calendar"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50">
      {busy
        ? <Loader2 size={14} className="animate-spin" />
        : <svg width="14" height="14" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
      }
      Outlook
    </button>
  )
}

const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS        = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmed: { label: 'Confirmada', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  pending:   { label: 'Pendiente',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-400'  },
  cancelled: { label: 'Cancelada',  color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         dot: 'bg-red-400'    },
  completed: { label: 'Completada', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500'   },
}

const SERVICES = [
  'Terapia ABA','Evaluación Inicial','Seguimiento BRIEF-2','Evaluación ADOS-2',
  'Evaluación Vineland-3','Evaluación WISC-V','Evaluación BASC-3',
  'Sesión Familiar','Sesión de Orientación','Visita Domiciliaria',
]

const HORARIOS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
]

function formatHour(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Llama a la API de secretaria (incluye notificaciones) ─────────────────────
async function aptAPI(method: 'POST' | 'PATCH' | 'DELETE', body: object) {
  const res = await fetch('/api/secretaria/appointments', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export default function SecretariaAgenda({ profile }: { profile?: any }) {
  const toast   = useToast()
  const { t }   = useI18n()

  const [mes, setMes]                     = useState<Date>(new Date())
  const [apts, setApts]                   = useState<any[]>([])
  const [ninos, setNinos]                 = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [diaSeleccionado, setDia]         = useState<string | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [editingApt, setEditingApt]       = useState<any>(null)
  const [isSaving, setIsSaving]           = useState(false)
  const [searchText, setSearchText]       = useState('')
  const [filterStatus, setFilterStatus]   = useState('todos')
  const [activeMenu, setActiveMenu]       = useState<string | null>(null)

  const secretariaName = profile?.full_name || profile?.email || 'Secretaria'
  const [userId, setUserId] = useState<string | null>(profile?.id || null)

  useEffect(() => {
    if (!profile?.id) {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
        if (session?.user?.id) setUserId(session.user.id)
      })
    }
  }, [])

  const emptyForm = {
    child_id: '', child_ids: [] as string[], service: SERVICES[0], date: '', time: '',
    status: 'confirmed', notes: '', modality: 'presencial', session_type: 'individual'
  }
  const [form, setForm] = useState(emptyForm)

  const year     = mes.getFullYear()
  const month    = mes.getMonth()
  const todayStr = new Date().toISOString().split('T')[0]

  // ── Carga datos ────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: aptsData }, { data: ninosData }] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, children(name, profiles!children_parent_id_fkey(full_name, phone))')
          .order('appointment_date').order('appointment_time'),
        supabase.from('children').select('id, name').eq('is_active', true).order('name'),
      ])
      setApts(aptsData || [])
      setNinos(ninosData || [])
    } catch (e: any) {
      toast.error('Error cargando datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayApts    = apts.filter(a => a.appointment_date === todayStr && a.status !== 'cancelled')
  const upcomingApts = apts.filter(a => a.appointment_date >= todayStr && a.status !== 'cancelled')
  const monthApts    = apts.filter(a => { const [y,m] = a.appointment_date.split('-').map(Number); return y===year && m===month+1 })
  const pendingApts  = apts.filter(a => a.status === 'pending')

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getDayApts = (day: number) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return apts.filter(a => a.appointment_date === dateStr)
  }

  const selectedApts = diaSeleccionado
    ? apts.filter(a =>
        a.appointment_date === diaSeleccionado &&
        (filterStatus === 'todos' || a.status === filterStatus) &&
        (searchText === '' || a.children?.name?.toLowerCase().includes(searchText.toLowerCase()))
      )
    : []

  // ── Guardar (crear / editar) ───────────────────────────────────────────────
  const handleSave = async () => {
    const isGrupal = form.session_type === 'grupal'
    const idsAUsar = isGrupal ? form.child_ids : [form.child_id]
    if (idsAUsar.length === 0 || !form.date || !form.time) {
      toast.warning('Paciente, fecha y hora son obligatorios')
      return
    }
    setIsSaving(true)
    try {
      const makePayload = (cid: string) => ({
        child_id:         cid,
        appointment_date: form.date,
        appointment_time: form.time + ':00',
        service_type:     form.service,
        status:           form.status,
        notes:            form.notes,
        modalidad:        form.modality,
        is_group:         isGrupal,
        secretaria_name:  secretariaName,
      })

      if (editingApt) {
        await aptAPI('PATCH', { id: editingApt.id, accion: 'updated', ...makePayload(form.child_id) })
        toast.success('✅ Cita actualizada · Padre y administrador notificados')
      } else {
        for (const cid of idsAUsar) {
          await aptAPI('POST', makePayload(cid))
        }
        const msg = isGrupal ? idsAUsar.length + ' citas grupales creadas' : 'Cita creada · Padre y administrador notificados'
        toast.success('✅ ' + msg)
        setDia(form.date)
      }

      setShowForm(false); setEditingApt(null); setForm(emptyForm)
      cargar()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Cancelar (soft-delete: cambia status → 'cancelled', NO borra el registro)
  // Así las citas quedan en BD y aparecen en los reportes de asistencia.
  const handleDelete = async (apt: any) => {
    if (!confirm(`¿Cancelar la cita de ${apt.children?.name || 'este paciente'}?\nEl registro quedará guardado y aparecerá en los reportes.`)) return
    try {
      await aptAPI('PATCH', {
        id:             apt.id,
        status:         'cancelled',
        accion:         'status_changed',
        secretaria_name: secretariaName,
      })
      toast.success('Cita cancelada · Padre y administrador notificados')
      cargar()
    } catch (e: any) { toast.error('Error: ' + e.message) }
  }

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  const handleStatusChange = async (apt: any, status: string) => {
    try {
      await aptAPI('PATCH', {
        id:              apt.id,
        status,
        accion:          'status_changed',
        secretaria_name: secretariaName,
      })
      toast.success('Estado actualizado · Padre y administrador notificados')
      setActiveMenu(null)
      cargar()
    } catch (e: any) { toast.error(e.message) }
  }

  // ── Abrir edición ──────────────────────────────────────────────────────────
  const openEdit = (apt: any) => {
    setForm({
      child_id:     apt.child_id,
      child_ids:    [],
      service:      apt.service_type || SERVICES[0],
      date:         apt.appointment_date,
      time:         apt.appointment_time?.slice(0,5) || '',
      status:       apt.status,
      notes:        apt.notes || '',
      modality:     apt.modalidad || 'presencial',
      session_type: apt.is_group ? 'grupal' : 'individual',
    })
    setEditingApt(apt); setShowForm(true); setActiveMenu(null)
  }

  const formatDateLabel = (dateStr: string) => {
    const [y,m,d] = dateStr.split('-').map(Number)
    const date = new Date(y, m-1, d)
    return `${DIAS[date.getDay()]}, ${d} de ${MESES[m-1]} ${y}`
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 bg-violet-100 rounded-2xl flex items-center justify-center">
              <CalendarDays size={18} className="text-violet-600"/>
            </div>
            Agenda de Citas
          </h2>
          <p className="text-sm text-slate-400 mt-0.5 ml-12">Gestión de citas · Jugando Aprendo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {userId && (
            <>
              <GoogleCalendarMini userId={userId} />
              <MicrosoftCalendarMini userId={userId} />
            </>
          )}
          <button
            onClick={() => { setForm(emptyForm); setEditingApt(null); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-200/60 active:scale-95"
          >
            <Plus size={16}/> Nueva Cita
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Hoy',        val: todayApts.length,    icon: <Clock size={16}/>,        bg: 'bg-blue-50',    ic: 'text-blue-600'    },
          { label: 'Próximas',   val: upcomingApts.length, icon: <CalendarDays size={16}/>, bg: 'bg-violet-50',  ic: 'text-violet-600'  },
          { label: 'Este mes',   val: monthApts.length,    icon: <TrendingUp size={16}/>,   bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Pendientes', val: pendingApts.length,  icon: <Bell size={16}/>,         bg: 'bg-amber-50',   ic: 'text-amber-600'   },
        ].map(({ label, val, icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${ic}`}>{icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-800 leading-none">{val}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notification hint */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
        <Bell size={15} className="text-emerald-500 shrink-0"/>
        <p className="text-xs text-emerald-700 font-semibold">
          Cada vez que creás, editás o cancelás una cita, el padre del paciente y el administrador reciben una notificación automática.
        </p>
      </div>

      {/* Calendar + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-600 to-purple-700">
            <button onClick={() => setMes(new Date(year, month-1))} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90">
              <ChevronLeft size={16}/>
            </button>
            <div className="text-center">
              <h3 className="font-black text-white text-sm">{MESES[month]} {year}</h3>
              <p className="text-purple-200 text-[10px] mt-0.5">{monthApts.length} cita{monthApts.length!==1?'s':''} este mes</p>
            </div>
            <button onClick={() => setMes(new Date(year, month+1))} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90">
              <ChevronRight size={16}/>
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 mb-3">
              {DIAS.map((d,i) => (
                <div key={d} className={`text-center text-[10px] font-black py-1 ${i===0||i===6?'text-slate-300':'text-slate-400'}`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`}/>)}
              {Array(daysInMonth).fill(null).map((_,i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const dayApts = getDayApts(day)
                const isToday    = dateStr === todayStr
                const isSelected = diaSeleccionado === dateStr
                const isPast     = dateStr < todayStr

                return (
                  <button
                    key={day}
                    onClick={() => setDia(isSelected ? null : dateStr)}
                    className={`
                      relative flex flex-col items-center justify-start pt-1.5 h-10 rounded-xl text-xs font-bold transition-all
                      ${isSelected
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105 ring-2 ring-violet-400 ring-offset-1'
                        : isToday
                          ? 'bg-violet-50 text-violet-700 ring-2 ring-violet-300'
                          : dayApts.length > 0
                            ? isPast ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-violet-50 text-slate-800 font-black'
                            : 'hover:bg-slate-50 text-slate-400'
                      }
                    `}
                  >
                    {day}
                    {dayApts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayApts.slice(0,4).map((a,idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white/80'
                            : a.status==='confirmed' ? 'bg-emerald-500'
                            : a.status==='pending'   ? 'bg-amber-400'
                            : a.status==='cancelled' ? 'bg-red-300'
                            : 'bg-blue-400'
                          }`}/>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
            {[{dot:'bg-emerald-500',label:'Confirmada'},{dot:'bg-amber-400',label:'Pendiente'},{dot:'bg-blue-400',label:'Completada'}].map(({dot,label})=>(
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dot}`}/>
                <span className="text-[10px] text-slate-400 font-semibold">{label}</span>
              </div>
            ))}
            <button onClick={cargar} disabled={loading} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors font-semibold disabled:opacity-50">
              <RefreshCw size={11} className={loading?'animate-spin':''}/> Actualizar
            </button>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">

          {!diaSeleccionado ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-300">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                <CalendarDays size={36} className="text-slate-200"/>
              </div>
              <p className="text-sm font-bold text-slate-300">Seleccioná un día del calendario</p>
              <p className="text-xs text-slate-200 mt-1">o creá una nueva cita con el botón de arriba</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm capitalize">{formatDateLabel(diaSeleccionado)}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedApts.length} cita{selectedApts.length!==1?'s':''} ·{' '}
                      {diaSeleccionado===todayStr ? '🔵 Hoy' : diaSeleccionado<todayStr ? '📋 Pasada' : '📅 Próxima'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setForm({...emptyForm,date:diaSeleccionado}); setEditingApt(null); setShowForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-violet-200 active:scale-95"
                  >
                    <Plus size={12}/> Agregar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Buscar paciente..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"/>
                  </div>
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 font-semibold text-slate-600 transition-all">
                    <option value="todos">Todos</option>
                    {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-50 overflow-y-auto" style={{maxHeight:480}}>
                {selectedApts.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar size={24} className="text-slate-200"/>
                    </div>
                    <p className="text-sm font-bold text-slate-300">Sin citas para este día</p>
                    <button onClick={()=>{setForm({...emptyForm,date:diaSeleccionado});setShowForm(true)}}
                      className="mt-3 text-xs font-bold text-violet-500 hover:text-violet-700 hover:underline transition-colors">
                      + Crear cita aquí
                    </button>
                  </div>
                ) : selectedApts.map(apt => {
                  const cfg = STATUS_CFG[apt.status] || STATUS_CFG.pending
                  const isMenuOpen = activeMenu === apt.id

                  return (
                    <div key={apt.id} className="px-5 py-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {apt.is_group ? <Users size={16} className="text-violet-600"/> : <User size={16} className="text-violet-600"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm text-slate-800 truncate">{apt.children?.name || '—'}</p>
                              <p className="text-xs text-slate-500 truncate font-semibold">{apt.service_type || 'Terapia'}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                              <Clock size={11} className="text-slate-400"/> {formatHour(apt.appointment_time)}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              {apt.modalidad==='virtual' ? <><Video size={11}/> Virtual</> : <><MapPin size={11}/> Presencial</>}
                            </span>
                            {apt.is_group && <span className="text-xs text-blue-500 font-bold flex items-center gap-1"><Users size={10}/> Grupal</span>}
                          </div>
                          {apt.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic truncate flex items-center gap-1">
                              <FileText size={10}/> {apt.notes}
                            </p>
                          )}
                          {apt.children?.profiles?.phone && (
                            <a href={`tel:${apt.children.profiles.phone}`} className="text-[10px] text-slate-400 hover:text-violet-500 flex items-center gap-1 mt-1 w-fit transition-colors">
                              <Phone size={9}/> {apt.children.profiles.phone}
                            </a>
                          )}
                        </div>

                        {/* Dropdown */}
                        <div className="relative flex-shrink-0">
                          <button onClick={()=>setActiveMenu(isMenuOpen?null:apt.id)}
                            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreHorizontal size={15}/>
                          </button>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 min-w-[200px] overflow-hidden">
                              <div className="p-1.5">
                                <button onClick={()=>openEdit(apt)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                                  <Edit2 size={13}/> Editar cita
                                </button>
                                <div className="mx-2 my-1 h-px bg-slate-100"/>
                                <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar estado</p>
                                {Object.entries(STATUS_CFG).map(([k,v])=>(
                                  <button key={k} onClick={()=>handleStatusChange(apt,k)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${apt.status===k?`${v.bg} ${v.color}`:'text-slate-600 hover:bg-slate-50'}`}>
                                    <div className={`w-2 h-2 rounded-full ${v.dot}`}/>{v.label}
                                    {apt.status===k && <CheckCheck size={11} className="ml-auto"/>}
                                  </button>
                                ))}
                                <div className="mx-2 my-1 h-px bg-slate-100"/>
                                <button onClick={()=>handleDelete(apt)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                                  <XCircle size={13}/> Cancelar cita
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
            </>
          )}
        </div>
      </div>

      {activeMenu && <div className="fixed inset-0 z-10" onClick={()=>setActiveMenu(null)}/>}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">

            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-violet-600 to-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  {editingApt ? <Edit2 size={16} className="text-white"/> : <Plus size={16} className="text-white"/>}
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">{editingApt ? 'Editar Cita' : 'Nueva Cita'}</h3>
                  <p className="text-purple-200 text-[10px] mt-0.5">Padre y administrador serán notificados al guardar</p>
                </div>
              </div>
              <button onClick={()=>{setShowForm(false);setEditingApt(null)}} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                <X size={16}/>
              </button>
            </div>

            <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-50 border-b border-emerald-100">
              <Bell size={14} className="text-emerald-500 shrink-0"/>
              <p className="text-xs text-emerald-700 font-semibold">
                Al guardar: el padre recibirá una notificación y el administrador será informado automáticamente.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tipo de sesión</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'individual',icon:'👤',label:'Individual'},{v:'grupal',icon:'👥',label:'Grupal'}].map(opt=>(
                    <button key={opt.v} onClick={()=>setForm(p=>({...p,session_type:opt.v}))}
                      className={`py-3 rounded-2xl font-bold text-sm border-2 flex items-center justify-center gap-2 transition-all ${form.session_type===opt.v?'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200':'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                      <span>{opt.icon}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Modalidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'presencial',icon:'📍',label:'Presencial'},{v:'virtual',icon:'📹',label:'Virtual'}].map(opt=>(
                    <button key={opt.v} onClick={()=>setForm(p=>({...p,modality:opt.v}))}
                      className={`py-3 rounded-2xl font-bold text-sm border-2 flex items-center justify-center gap-2 transition-all ${form.modality===opt.v?'bg-slate-800 text-white border-slate-800 shadow-md':'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                      <span>{opt.icon}</span>{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                  {form.session_type === 'grupal' ? 'Pacientes del grupo' : 'Paciente'} <span className="text-red-400">*</span>
                  {form.session_type === 'grupal' && form.child_ids.length > 0 && (
                    <span className="ml-2 bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-[10px] font-black">{form.child_ids.length} seleccionados</span>
                  )}
                </label>
                {form.session_type === 'grupal' ? (
                  <div className="max-h-48 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-slate-50 divide-y divide-slate-100">
                    {ninos.map(n => {
                      const checked = form.child_ids.includes(n.id)
                      return (
                        <button key={n.id} type="button"
                          onClick={() => setForm(p => ({
                            ...p,
                            child_ids: checked ? p.child_ids.filter((id: string) => id !== n.id) : [...p.child_ids, n.id]
                          }))}
                          className={'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors text-left ' + (checked ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-white')}>
                          <div className={'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ' + (checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300')}>
                            {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                          </div>
                          {n.name}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <select value={form.child_id} onChange={e=>setForm(p=>({...p,child_id:e.target.value}))}
                    className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50 transition-colors">
                    <option value="">Seleccionar paciente...</option>
                    {ninos.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Servicio</label>
                <select value={form.service} onChange={e=>setForm(p=>({...p,service:e.target.value}))}
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50 transition-colors">
                  {SERVICES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fecha <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                    className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50 transition-colors"/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Hora <span className="text-red-400">*</span></label>
                  <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}
                    className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Estado inicial</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CFG).map(([k,v])=>(
                    <button key={k} onClick={()=>setForm(p=>({...p,status:k}))}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 flex items-center gap-2 transition-all ${form.status===k?`${v.bg} ${v.color} border-current`:'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      <div className={`w-2 h-2 rounded-full ${v.dot}`}/>{v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Notas <span className="text-slate-300">(opcional)</span></label>
                <textarea rows={3} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  placeholder="Observaciones, indicaciones especiales..."
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 text-sm focus:border-violet-400 focus:outline-none bg-slate-50 resize-none transition-colors"/>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={()=>{setShowForm(false);setEditingApt(null)}}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-200 active:scale-95">
                {isSaving
                  ? <><Loader2 size={16} className="animate-spin"/> Guardando...</>
                  : <><CheckCircle2 size={16}/>{editingApt?'Actualizar Cita':'Confirmar Cita'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
