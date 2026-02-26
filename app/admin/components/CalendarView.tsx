'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Clock, User, Plus, X, Loader2,
  CheckCircle2, Trash2, Users, RefreshCw, Video, MapPin
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import VideoCallModal from '@/components/VideoCallModal'
import VideoUsageIndicator from '@/components/VideoUsageIndicator'

const SERVICES = [
  'Terapia ABA','Evaluación Inicial','Seguimiento BRIEF-2','Evaluación ADOS-2',
  'Evaluación Vineland-3','Evaluación WISC-V','Evaluación BASC-3',
  'Sesión Familiar','Sesión de Orientación','Visita Domiciliaria',
]
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmada', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pending:   { label: 'Pendiente',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'   },
  cancelled: { label: 'Cancelada',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200'       },
  completed: { label: 'Completada', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'     },
}

function MonthlyCalendarView() {
  const toast = useToast()
  const [apts, setApts] = useState<any[]>([])
  const [ninos, setNinos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [show, setShow] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [tipoSesion, setTipoSesion] = useState<'individual'|'grupal'>('individual')
  const [modalidadCita, setModalidadCita] = useState<'presencial'|'virtual'>('presencial')
  const [newApt, setNewApt] = useState({ child_id:'', date:'', time:'09:00', service:'Terapia ABA', notes:'', group_name:'', status:'confirmed' })
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  // Video call
  const [videoSession, setVideoSession] = useState<{roomUrl:string;sessionId:string}|null>(null)
  const [startingCall, setStartingCall] = useState<string|null>(null)

  const cargarCitas = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/appointments')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setApts(json.data || [])
    } catch (err:any) { toast.error('Error: ' + err.message) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => {
    cargarCitas()
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('children').select('id, name').order('name').then(({ data }) => { if (data) setNinos(data) })
    })
  }, [cargarCitas])

  const eliminarCita = async (id:string, e:React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta cita?')) return
    try {
      const res = await fetch('/api/admin/appointments', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Cita eliminada'); cargarCitas()
    } catch (err:any) { toast.error('Error: ' + err.message) }
  }

  const handleSave = async () => {
    if (tipoSesion==='individual' && !newApt.child_id) { toast.error('Selecciona un paciente'); return }
    if (tipoSesion==='grupal' && selectedParticipants.length===0) { toast.error('Selecciona participantes'); return }
    setIsSaving(true)
    try {
      let payload: any[]
      const extra = { modalidad: modalidadCita }
      if (tipoSesion==='grupal') {
        payload = selectedParticipants.map(cid => ({ child_id:cid, appointment_date:newApt.date, appointment_time:newApt.time+':00', service_type:`${newApt.service} (Grupal: ${newApt.group_name||'Sin nombre'})`, is_group:true, group_name:newApt.group_name, notes:newApt.notes, status:newApt.status, ...extra }))
      } else {
        payload = [{ child_id:newApt.child_id, appointment_date:newApt.date, appointment_time:newApt.time+':00', service_type:newApt.service, is_group:false, notes:newApt.notes, status:newApt.status, ...extra }]
      }
      const res = await fetch('/api/admin/appointments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`✅ Cita ${modalidadCita} agendada`)
      resetForm(); cargarCitas()
    } catch (err:any) { toast.error('Error: ' + err.message) }
    finally { setIsSaving(false) }
  }

  const handleStartVideoCall = async (apt: any) => {
    setStartingCall(apt.id)
    try {
      const res = await fetch('/api/video-call', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ appointment_id: apt.id, child_id: apt.child_id, initiated_by: 'admin' }),
      })
      const data = await res.json()
      if (data.limitReached) { toast.error('⚠️ Límite mensual de 10,000 min alcanzado. Se reinicia el próximo mes.'); return }
      if (data.error) throw new Error(data.error)
      setVideoSession({ roomUrl: data.room_url, sessionId: data.session_id })
      toast.success('📹 Sala creada · Padre notificado')
    } catch (err:any) { toast.error('Error: ' + err.message) }
    finally { setStartingCall(null) }
  }

  const resetForm = () => {
    setShow(false); setTipoSesion('individual'); setModalidadCita('presencial')
    setNewApt({ child_id:'', date:new Date().toISOString().split('T')[0], time:'09:00', service:'Terapia ABA', notes:'', group_name:'', status:'confirmed' })
    setSelectedParticipants([])
  }

  const toggleParticipant = (id:string) => setSelectedParticipants(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id])
  useEffect(() => {
    const today = new Date()
    setCurrentMonth(today)
    setNewApt(prev => ({ ...prev, date: today.toISOString().split('T')[0] }))
  }, [])

  const getDaysInMonth = (d:Date) => ({ firstDay: new Date(d.getFullYear(),d.getMonth(),1).getDay(), daysInMonth: new Date(d.getFullYear(),d.getMonth()+1,0).getDate() })
  const { firstDay, daysInMonth } = currentMonth ? getDaysInMonth(currentMonth) : { firstDay: 0, daysInMonth: 31 }
  const monthYear = currentMonth ? currentMonth.toLocaleString('es-PE',{month:'long',year:'numeric'}) : ''
  const todayStr = new Date().toISOString().split('T')[0]
  const getAptsForDay = (day:number) => {
    if (!currentMonth) return null
    const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return apts.filter(a => a.appointment_date===ds)
  }
  const filteredApts = apts.filter(a => {
    const matchDate = !filterDate || a.appointment_date===filterDate
    const matchStatus = filterStatus==='todos' || (a.status||'confirmed')===filterStatus
    return matchDate && matchStatus
  }).sort((a,b) => ((a.appointment_date||'')+(a.appointment_time||'')).localeCompare((b.appointment_date||'')+(b.appointment_time||'')))

  const todayApts = apts.filter(a => a.appointment_date===todayStr)
  const weekApts = apts.filter(a => { const d=new Date(a.appointment_date); const diff=(d.getTime()-new Date().getTime())/86400000; return diff>=0&&diff<=7 })
  const virtualApts = apts.filter(a => a.modalidad==='virtual')

  return (
    <>
      {videoSession && (
        <VideoCallModal
          roomUrl={videoSession.roomUrl}
          sessionId={videoSession.sessionId}
          participantName="Terapeuta – Jugando Aprendo"
          onClose={() => setVideoSession(null)}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-2xl"><Calendar className="text-blue-600" size={28}/></div>
              Calendario de Citas
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1 ml-1">{apts.length} citas · {todayApts.length} hoy · {virtualApts.length} virtuales</p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargarCitas} className="p-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 text-slate-400 hover:text-blue-600 transition-all"><RefreshCw size={18}/></button>
            <button onClick={() => setShow(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:from-blue-700 shadow-lg shadow-blue-200/50 transition-all flex items-center gap-2">
              <Plus size={18}/> Nueva Cita
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            {label:'Total',      value:apts.length,        color:'blue'},
            {label:'Hoy',        value:todayApts.length,   color:'emerald'},
            {label:'Esta semana',value:weekApts.length,    color:'violet'},
            {label:'Virtuales',  value:virtualApts.length, color:'indigo'},
          ].map(({label,value,color}) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-black text-${color}-600 mt-1`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Video usage */}
        <div className="mb-6"><VideoUsageIndicator /></div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Calendario */}
          <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <button onClick={() => currentMonth && setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1))} className="p-2 rounded-xl hover:bg-slate-100"><ChevronLeft size={20}/></button>
              <h3 className="font-black text-slate-800 text-lg capitalize">{monthYear}</h3>
              <button onClick={() => currentMonth && setCurrentMonth(new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1))} className="p-2 rounded-xl hover:bg-slate-100"><ChevronRight size={20}/></button>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => <div key={d} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} className="min-h-[80px] border-b border-r border-slate-50 bg-slate-50/30"/>)}
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
                const dayApts = getAptsForDay(day)
                if (!currentMonth) return null
    const ds = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const isToday=ds===todayStr; const isPast=ds<todayStr
                return (
                  <div key={day} onClick={()=>{setNewApt(p=>({...p,date:ds}));setShow(true)}} className={`min-h-[80px] border-b border-r border-slate-100 p-2 cursor-pointer transition-all hover:bg-blue-50/50 group ${isToday?'bg-blue-50':isPast?'bg-slate-50/50':''}`}>
                    <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday?'bg-blue-600 text-white':isPast?'text-slate-300':'text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayApts.slice(0,2).map(apt => (
                        <div key={apt.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 ${apt.modalidad==='virtual'?'bg-indigo-100 text-indigo-700':apt.is_group?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                          {apt.modalidad==='virtual' && <Video size={8}/>}
                          {apt.appointment_time?.slice(0,5)} {apt.children?.name||'?'}
                        </div>
                      ))}
                      {dayApts.length>2 && <div className="text-[9px] text-slate-400 font-bold pl-1">+{dayApts.length-2} más</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="xl:col-span-4 space-y-4">

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtros</p>
              <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all"/>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all">
                <option value="todos">Todos los estados</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              {(filterDate||filterStatus!=='todos') && <button onClick={()=>{setFilterDate('');setFilterStatus('todos')}} className="text-xs text-blue-600 font-bold hover:underline">Limpiar filtros</button>}
            </div>

            {/* Lista citas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Citas ({filteredApts.length})</p>
              </div>
              <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-50">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-400" size={28}/></div>
                ) : filteredApts.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="p-4 bg-slate-100 rounded-2xl mb-3"><Calendar size={32} className="text-slate-300"/></div>
                    <p className="font-bold text-slate-400 text-sm">No hay citas</p>
                  </div>
                ) : filteredApts.map(a => {
                  const sc = STATUS_CONFIG[a.status||'confirmed']||STATUS_CONFIG.confirmed
                  const isVirtual = a.modalidad==='virtual'
                  const isUpcoming = a.appointment_date>=todayStr && a.status!=='cancelled' && a.status!=='completed'
                  return (
                    <div key={a.id} className="p-4 hover:bg-slate-50 transition-all group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            {isVirtual
                              ? <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase flex items-center gap-0.5"><Video size={9}/> Virtual</span>
                              : <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 uppercase flex items-center gap-0.5"><MapPin size={9}/> Presencial</span>
                            }
                            {a.is_group && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 uppercase">Grupal</span>}
                          </div>
                          <p className="font-bold text-slate-800 text-sm truncate">{a.children?.name||'Paciente'}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{a.service_type}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-bold">
                            <span className="flex items-center gap-1"><Calendar size={11}/>{a.appointment_date}</span>
                            <span className="flex items-center gap-1"><Clock size={11}/>{a.appointment_time?.slice(0,5)}</span>
                          </div>
                          {a.notes && <p className="text-[10px] text-slate-400 mt-1 italic truncate">{a.notes}</p>}

                          {/* Botón iniciar videollamada */}
                          {isVirtual && isUpcoming && (
                            <button
                              onClick={() => handleStartVideoCall(a)}
                              disabled={startingCall===a.id}
                              className="mt-2.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',boxShadow:'0 3px 12px rgba(99,102,241,0.35)'}}
                            >
                              {startingCall===a.id
                                ? <><Loader2 size={12} className="animate-spin"/> Iniciando...</>
                                : <><Video size={12}/> Iniciar videollamada</>
                              }
                            </button>
                          )}
                        </div>
                        <button onClick={e=>eliminarCita(a.id,e)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Nueva Cita ── */}
        {show && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><Plus size={20} className="text-blue-600"/> Nueva Cita</h3>
                <button onClick={resetForm} className="p-2 rounded-full hover:bg-slate-100"><X size={20}/></button>
              </div>

              <div className="space-y-5">
                {/* Tipo sesión */}
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de sesión</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['individual','grupal'] as const).map(tipo => (
                      <button key={tipo} onClick={()=>{setTipoSesion(tipo);setSelectedParticipants([]);setNewApt(p=>({...p,child_id:''}))}}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${tipoSesion===tipo?(tipo==='individual'?'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200':'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'):'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                        {tipo==='individual'?<><User size={16}/> Individual</>:<><Users size={16}/> Grupal</>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modalidad */}
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Modalidad</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      {value:'presencial',icon:<MapPin size={16}/>,label:'Presencial',active:'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200'},
                      {value:'virtual',   icon:<Video size={16}/>, label:'Virtual 📹', active:'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'},
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={()=>setModalidadCita(opt.value)}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${modalidadCita===opt.value?opt.active:'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                  {modalidadCita==='virtual' && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                      <Video size={13} className="text-indigo-500 shrink-0 mt-0.5"/>
                      <p className="text-xs text-indigo-600 font-semibold leading-relaxed">Al iniciar la sesión se genera el link automáticamente y el padre recibe una notificación para unirse.</p>
                    </div>
                  )}
                </div>

                {/* Paciente / Grupo */}
                {tipoSesion==='individual' && (
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Paciente *</label>
                    <select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" onChange={e=>setNewApt(p=>({...p,child_id:e.target.value}))} value={newApt.child_id}>
                      <option value="">Seleccionar paciente...</option>
                      {ninos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  </div>
                )}
                {tipoSesion==='grupal' && (
                  <>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del grupo</label>
                      <input type="text" placeholder="Ej: Grupo Habilidades Sociales A" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-purple-400 transition-all" value={newApt.group_name} onChange={e=>setNewApt(p=>({...p,group_name:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Participantes ({selectedParticipants.length})</label>
                      <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl border-2 border-slate-200 p-3 space-y-2">
                        {ninos.map(n => (
                          <label key={n.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedParticipants.includes(n.id)?'bg-purple-600 text-white shadow-md':'bg-white hover:bg-purple-50 border border-slate-100'}`}>
                            <input type="checkbox" className="hidden" checked={selectedParticipants.includes(n.id)} onChange={()=>toggleParticipant(n.id)}/>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selectedParticipants.includes(n.id)?'bg-white border-white':'border-slate-300'}`}>{selectedParticipants.includes(n.id)&&<CheckCircle2 size={14} className="text-purple-600"/>}</div>
                            <span className="font-bold text-sm">{n.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Servicio, fecha, hora, estado */}
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Servicio</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" value={newApt.service} onChange={e=>setNewApt(p=>({...p,service:e.target.value}))}>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha *</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" value={newApt.date} onChange={e=>setNewApt(p=>({...p,date:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Hora *</label>
                    <input type="time" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" value={newApt.time} onChange={e=>setNewApt(p=>({...p,time:e.target.value}))}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Estado</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" value={newApt.status} onChange={e=>setNewApt(p=>({...p,status:e.target.value}))}>
                    <option value="confirmed">Confirmada</option>
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Notas (opcional)</label>
                  <textarea rows={2} placeholder="Observaciones..." className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all resize-none" value={newApt.notes} onChange={e=>setNewApt(p=>({...p,notes:e.target.value}))}/>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={resetForm} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-xl transition-all border-2 border-slate-100">Cancelar</button>
                  <button onClick={handleSave} disabled={isSaving}
                    className={`flex-[2] py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-white ${modalidadCita==='virtual'?'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-200':tipoSesion==='grupal'?'bg-gradient-to-r from-purple-600 to-violet-600 shadow-purple-200':'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200'}`}>
                    {isSaving?<Loader2 size={18} className="animate-spin"/>:modalidadCita==='virtual'?<Video size={18}/>:<Plus size={18}/>}
                    {isSaving?'Guardando...':modalidadCita==='virtual'?'Agendar Virtual':tipoSesion==='grupal'?'Agendar Grupo':'Confirmar Cita'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
export default MonthlyCalendarView
