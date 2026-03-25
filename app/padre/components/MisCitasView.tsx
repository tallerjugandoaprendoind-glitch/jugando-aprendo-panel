'use client'

import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback } from 'react'
import type { JSX } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Phone, RefreshCw, CalendarDays, Baby, Video, Loader2,
  ChevronLeft, ChevronRight, Mail, Info, MapPin, Stethoscope
} from 'lucide-react'
import VideoCallModal from '@/components/VideoCallModal'

interface Appointment {
  id: string; child_id: string; parent_id: string
  appointment_date: string; appointment_time: string
  service_type: string; status: string; notes: string
  is_group: boolean; group_name: string; type: string
  children?: { name: string; birth_date: string }
}
interface Props {
  profile: any; selectedChild: any
  onCancelAppointment: (id: string, reschedule: boolean) => void
  onChangeView: (view: string) => void
}

const STATUS: Record<string, { label: string; dot: string; pill: string; text: string; icon: JSX.Element }> = {
  confirmed: { label: 'Confirmada', dot: '#10b981', pill: '#f0fdf4', text: '#15803d', icon: <CheckCircle size={12}/> },
  pending:   { label: 'Pendiente',  dot: '#f59e0b', pill: '#fffbeb', text: '#b45309', icon: <AlertCircle size={12}/> },
  cancelled: { label: 'Cancelada',  dot: '#ef4444', pill: '#fef2f2', text: '#dc2626', icon: <XCircle size={12}/> },
  completed: { label: 'Completada', dot: '#94a3b8', pill: '#f8fafc', text: '#64748b', icon: <CheckCircle size={12}/> },
}
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_MIN = ['D','L','M','M','J','V','S']
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function fmt(t: string) {
  if (!t) return ''
  const [h,m] = t.split(':').map(Number)
  return `${h%12||12}:${m.toString().padStart(2,'0')} ${h>=12?'PM':'AM'}`
}
function isUpcoming(d: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [y,mo,dy] = d.split('-').map(Number)
  return new Date(y,mo-1,dy) >= today
}

function Calendar2({ appointments, onSelectDay, selectedDay }: { appointments: Appointment[]; onSelectDay: (d: string|null) => void; selectedDay: string|null }) {
  const today = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const map: Record<string,Appointment[]> = {}
  appointments.forEach(a => { (map[a.appointment_date] = map[a.appointment_date]||[]).push(a) })
  const firstDay = new Date(vy,vm,1).getDay()
  const daysInMonth = new Date(vy,vm+1,0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const cells = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)]
  while (cells.length%7) cells.push(null)

  return (
    <div style={{ background:'#fff', borderRadius:24, overflow:'hidden', border:'1.5px solid #f1f5f9', boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
      <div style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={()=>{ if(vm===0){setVm(11);setVy(y=>y-1)}else setVm(m=>m-1) }} style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.2)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={16}/></button>
          <div style={{ textAlign:'center' }}>
            <p style={{ color:'#fff',fontWeight:900,fontSize:15,margin:0 }}>{MONTHS[vm]}</p>
            <p style={{ color:'rgba(255,255,255,.7)',fontSize:11,margin:0 }}>{vy}</p>
          </div>
          <button onClick={()=>{ if(vm===11){setVm(0);setVy(y=>y+1)}else setVm(m=>m+1) }} style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.2)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={16}/></button>
        </div>
      </div>
      <div style={{ padding:'12px 16px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6 }}>
          {DAYS_MIN.map((d,i)=><div key={i} style={{ textAlign:'center',fontSize:10,fontWeight:800,padding:'4px 0',color:i===0||i===6?'#cbd5e1':'#94a3b8' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px 0' }}>
          {cells.map((day,i)=>{
            if (!day) return <div key={i}/>
            const ds = `${vy}-${String(vm+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const appts = map[ds]||[]; const has = appts.length>0
            const isTod = ds===todayStr; const isSel = ds===selectedDay; const isPast = ds<todayStr
            const hasActive = appts.some(a=>a.status!=='cancelled')
            return (
              <button key={i} onClick={()=>has?onSelectDay(isSel?null:ds):undefined} disabled={!has}
                style={{ position:'relative',aspectRatio:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:10,border:'none',cursor:has?'pointer':'default',fontSize:12,fontWeight:700,transition:'all .15s',
                  background: isSel?'#7c3aed':isTod&&has?'#7c3aed':isTod?'transparent':hasActive&&!isPast?'#f5f3ff':has?'#f8fafc':'transparent',
                  color: isSel||isTod&&has?'#fff':isTod?'#7c3aed':hasActive&&!isPast?'#6d28d9':has?'#475569':'#cbd5e1',
                  outline: isTod&&!has?'2px solid #c4b5fd':'none',
                  transform: isSel?'scale(1.1)':'scale(1)',
                  boxShadow: isSel?'0 4px 12px rgba(124,58,237,.4)':'none',
                }}>
                {day}
                {has && <div style={{ display:'flex',gap:2,marginTop:1 }}>
                  {appts.slice(0,3).map((a,j)=><div key={j} style={{ width:4,height:4,borderRadius:'50%',background:isSel||isTod&&has?'rgba(255,255,255,.8)':a.status==='confirmed'?'#10b981':a.status==='pending'?'#f59e0b':'#ef4444' }}/>)}
                </div>}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ padding:'8px 16px 14px',display:'flex',flexWrap:'wrap',gap:'8px 16px' }}>
        {[['#10b981','Confirmada'],['#f59e0b','Pendiente'],['#7c3aed','Con cita']].map(([c,l])=>(
          <div key={l} style={{ display:'flex',alignItems:'center',gap:5 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:c }}/>
            <span style={{ fontSize:10,color:'#94a3b8',fontWeight:600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AptCard({ apt, selectedChild, activeVid, joiningCall, onJoin }: any) {
  const st = STATUS[apt.status]||STATUS.pending
  const childName = apt.children?.name||selectedChild?.name||''
  const upcoming = isUpcoming(apt.appointment_date)
  const [y,mo,d] = apt.appointment_date.split('-').map(Number)
  const date = new Date(y,mo-1,d)

  return (
    <div style={{ background:'#fff', borderRadius:20, border:`1.5px solid ${upcoming&&apt.status!=='cancelled'?'#ede9fe':'#f1f5f9'}`, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.04)', opacity:!upcoming||apt.status==='cancelled'?.65:1 }}>
      <div style={{ display:'flex' }}>
        <div style={{ width:5,flexShrink:0,background:st.dot }}/>
        <div style={{ flex:1,padding:'14px 16px' }}>
          <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
            <div style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',borderRadius:14,padding:'10px 12px',textAlign:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(124,58,237,.25)' }}>
              <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',opacity:.8 }}>{MONTHS_S[mo-1]}</div>
              <div style={{ fontSize:22,fontWeight:900,lineHeight:1.1 }}>{d}</div>
              <div style={{ fontSize:10,opacity:.7 }}>{DAYS[date.getDay()]}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:st.pill,color:st.text,border:`1px solid ${st.dot}30` }}>
                  {st.icon}{st.label}
                </span>
                {apt.is_group && <span style={{ fontSize:10,fontWeight:700,color:'#7c3aed',background:'#f5f3ff',padding:'2px 8px',borderRadius:20 }}>Grupal</span>}
              </div>
              <p style={{ fontWeight:800,fontSize:15,color:'#0f172a',margin:'0 0 4px' }}>{apt.service_type||apt.type||'Terapia ABA'}</p>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                {childName && <span style={{ fontSize:12,color:'#94a3b8',display:'flex',alignItems:'center',gap:3 }}><Baby size={11}/>{childName}</span>}
                <span style={{ fontSize:12,color:'#64748b',fontWeight:600,display:'flex',alignItems:'center',gap:3 }}><Clock size={11}/>{fmt(apt.appointment_time)}</span>
                {apt.modalidad==='virtual'&&<span style={{ fontSize:11,color:'#6366f1',fontWeight:700,display:'flex',alignItems:'center',gap:3 }}><Video size={11}/>Virtual</span>}
              </div>
              {apt.notes && <p style={{ fontSize:11,color:'#94a3b8',marginTop:6,fontStyle:'italic' }}>"{apt.notes}"</p>}
            </div>
          </div>
          {upcoming&&(apt.status==='confirmed'||apt.status==='pending')&&apt.modalidad==='virtual'&&(() => {
            const vs = activeVid[apt.id]
            return vs ? (
              <div style={{ marginTop:12,paddingTop:12,borderTop:'1px solid #f1f5f9' }}>
                <button onClick={()=>onJoin(apt)} disabled={joiningCall===apt.id} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'0 4px 12px rgba(99,102,241,.3)' }}>
                  {joiningCall===apt.id?<><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>Conectando...</>:<><Video size={14}/>🟢 Unirse a videollamada</>}
                </button>
              </div>
            ) : (
              <div style={{ marginTop:12,paddingTop:12,borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#f0f4ff',borderRadius:12 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:'#6366f1',animation:'pulse 2s infinite' }}/>
                <p style={{ fontSize:11,color:'#6366f1',fontWeight:600,margin:0 }}>El enlace aparecerá cuando inicie la sesión</p>
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
  const [selectedDay, setSelectedDay] = useState<string|null>(null)
  const [videoSession, setVideoSession] = useState<any>(null)
  const [joiningCall, setJoiningCall] = useState<string|null>(null)
  const [activeVid, setActiveVid] = useState<Record<string,any>>({})
  const [listView, setListView] = useState<'upcoming'|'all'>('upcoming')
  const [statusFilter, setStatusFilter] = useState('all')

  const pollVid = useCallback(async (apts: Appointment[]) => {
    const virt = apts.filter(a=>(a as any).modalidad==='virtual'&&isUpcoming(a.appointment_date)&&(a.status==='confirmed'||a.status==='pending'))
    if (!virt.length) return
    const res: Record<string,any> = {}
    await Promise.all(virt.map(async apt => {
      try {
        const r = await fetch(`/api/video-call?appointment_id=${apt.id}`)
        const d = await r.json()
        if (d.session?.roomUrl) res[apt.id] = d.session
      } catch {}
    }))
    setActiveVid(res)
  }, [])

  const onJoin = (apt: Appointment) => {
    const s = activeVid[apt.id]; if (!s) return
    setJoiningCall(apt.id)
    setVideoSession({ roomUrl:s.roomUrl, sessionId:s.sessionId, appointmentId:apt.id })
    setJoiningCall(null)
  }

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data: kids } = await supabase.from('children').select('id').eq('parent_id',profile.id)
    const childIds = (kids||[]).map((c:any)=>c.id)
    let q = supabase.from('appointments').select('*, children(name, birth_date)').order('appointment_date',{ascending:true}).order('appointment_time',{ascending:true})
    if (selectedChild?.id) q = q.eq('child_id',selectedChild.id)
    else if (childIds.length>0) q = q.or(`parent_id.eq.${profile.id},${childIds.map((id:string)=>`child_id.eq.${id}`).join(',')}`)
    else q = q.eq('parent_id',profile.id)
    const { data } = await q
    setAppointments(data||[])
    pollVid(data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[profile?.id,selectedChild?.id])
  useEffect(()=>{ if (!appointments.length) return; const i = setInterval(()=>pollVid(appointments),15000); return ()=>clearInterval(i) },[appointments,pollVid])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter(a=>a.appointment_date>=today&&a.status!=='cancelled').length
  const completed = appointments.filter(a=>a.status==='completed').length
  const selAppts = selectedDay ? appointments.filter(a=>a.appointment_date===selectedDay) : []
  const listAppts = appointments.filter(a=>{
    if (selectedDay) return false
    if (listView==='upcoming') return a.appointment_date>=today&&a.status!=='cancelled'
    return statusFilter==='all'||a.status===statusFilter
  })
  const grouped: Record<string,Appointment[]> = {}
  listAppts.forEach(a=>{ (grouped[a.appointment_date]=grouped[a.appointment_date]||[]).push(a) })

  return (
    <>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.mcv-card{animation:fadeUp .4s ease both}`}</style>
      {videoSession && <VideoCallModal roomUrl={videoSession.roomUrl} sessionId={videoSession.sessionId} appointmentId={videoSession.appointmentId} participantName={profile?.full_name||'Padre/Madre'} onClose={()=>{setVideoSession(null);load()}}/>}

      <div style={{ display:'flex',flexDirection:'column',gap:16,paddingBottom:32 }}>
        {/* Hero */}
        <div className="mcv-card" style={{ background:'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)',borderRadius:28,padding:'24px 24px 20px',color:'#fff',boxShadow:'0 20px 60px rgba(79,70,229,.3)',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-30,right:-30,width:160,height:160,background:'rgba(255,255,255,.08)',borderRadius:'50%' }}/>
          <div style={{ position:'relative',zIndex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
              <CalendarDays size={15} style={{ opacity:.7 }}/>
              <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:'rgba(255,255,255,.7)' }}>Mis Citas</span>
            </div>
            <h1 style={{ fontSize:24,fontWeight:900,margin:'0 0 16px',letterSpacing:'-0.5px' }}>{selectedChild?.name?.split(' ')[0]||profile?.full_name?.split(' ')[0]||'Mis citas'}</h1>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {[['Próximas',upcoming],['Realizadas',completed],['Total',appointments.length]].map(([l,v])=>(
                <div key={l as string} style={{ background:'rgba(255,255,255,.15)',backdropFilter:'blur(8px)',borderRadius:14,padding:'10px 8px',textAlign:'center' }}>
                  <div style={{ fontSize:24,fontWeight:900,lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:700,marginTop:2,textTransform:'uppercase',letterSpacing:.5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mcv-card" style={{ background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:20,padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:12 }}>
          <div style={{ width:36,height:36,background:'#e0f2fe',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Info size={16} color="#0284c7"/></div>
          <div>
            <p style={{ fontSize:13,fontWeight:700,color:'#075985',margin:'0 0 2px' }}>Las citas son asignadas por el equipo del centro</p>
            <p style={{ fontSize:12,color:'#0284c7',margin:'0 0 8px' }}>Para solicitar, cambiar o cancelar, contactá directamente con recepción.</p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:12 }}>
              <a href="tel:+51924807183" style={{ fontSize:12,fontWeight:700,color:'#0369a1',display:'flex',alignItems:'center',gap:4,textDecoration:'none' }}><Phone size={11}/> +51 924 807 183</a>
              <a href="mailto:tallerjugandoaprendoind@gmail.com" style={{ fontSize:12,fontWeight:700,color:'#0369a1',display:'flex',alignItems:'center',gap:4,textDecoration:'none' }}><Mail size={11}/> Escribir email</a>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 0',gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e8f0',borderTop:'3px solid #7c3aed',animation:'spin 1s linear infinite' }}/>
            <p style={{ fontSize:13,color:'#94a3b8',fontWeight:500 }}>Cargando citas...</p>
          </div>
        ) : (
          <>
            <div className="mcv-card"><Calendar2 appointments={appointments} onSelectDay={setSelectedDay} selectedDay={selectedDay}/></div>

            {selectedDay && selAppts.length > 0 && (
              <div className="mcv-card" style={{ background:'#fff',borderRadius:20,border:'1.5px solid #ede9fe',overflow:'hidden',boxShadow:'0 4px 20px rgba(124,58,237,.08)' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#faf5ff',borderBottom:'1px solid #f3e8ff' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <Calendar size={14} color="#7c3aed"/>
                    <span style={{ fontSize:13,fontWeight:800,color:'#6d28d9' }}>{(() => { const [y,mo,d]=selectedDay.split('-').map(Number); const dt=new Date(y,mo-1,d); return `${DAYS[dt.getDay()]}, ${d} de ${MONTHS[mo-1]}` })()}</span>
                    <span style={{ fontSize:11,color:'#a78bfa',fontWeight:600 }}>({selAppts.length} cita{selAppts.length!==1?'s':''})</span>
                  </div>
                  <button onClick={()=>setSelectedDay(null)} style={{ background:'none',border:'none',fontSize:16,color:'#a78bfa',cursor:'pointer',width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                </div>
                <div style={{ padding:'12px',display:'flex',flexDirection:'column',gap:8 }}>
                  {selAppts.map(apt=><AptCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVid={activeVid} joiningCall={joiningCall} onJoin={onJoin}/>)}
                </div>
              </div>
            )}

            {!selectedDay && (
              <>
                <div className="mcv-card" style={{ display:'flex',background:'#f8fafc',borderRadius:16,padding:4,gap:4 }}>
                  {[['upcoming','📅 Próximas'],['all','📋 Todas']].map(([k,label])=>(
                    <button key={k} onClick={()=>setListView(k as any)} style={{ flex:1,padding:'10px',borderRadius:12,border:'none',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s',background:listView===k?'#fff':'transparent',color:listView===k?'#1e293b':'#94a3b8',boxShadow:listView===k?'0 2px 8px rgba(0,0,0,.08)':'none' }}>{label}</button>
                  ))}
                </div>

                {listView==='all' && (
                  <div className="mcv-card" style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {[['all','Todas'],['confirmed','✅ Confirmadas'],['pending','⏳ Pendientes'],['completed','🏆 Completadas'],['cancelled','❌ Canceladas']].map(([k,label])=>(
                      <button key={k} onClick={()=>setStatusFilter(k)} style={{ padding:'6px 12px',borderRadius:20,border:`1.5px solid ${statusFilter===k?'#7c3aed':'#e2e8f0'}`,fontSize:12,fontWeight:700,cursor:'pointer',background:statusFilter===k?'#7c3aed':'#fff',color:statusFilter===k?'#fff':'#64748b' }}>{label}</button>
                    ))}
                  </div>
                )}

                {listAppts.length===0 ? (
                  <div className="mcv-card" style={{ background:'#fff',borderRadius:20,padding:'48px 20px',textAlign:'center',border:'1.5px solid #f1f5f9' }}>
                    <div style={{ width:56,height:56,background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}><CalendarDays size={24} color="#a78bfa"/></div>
                    <p style={{ fontWeight:700,fontSize:14,color:'#64748b',margin:'0 0 6px' }}>Sin citas aquí</p>
                    <p style={{ fontSize:12,color:'#94a3b8' }}>{listView==='upcoming'?'No tienes citas próximas agendadas.':'No hay citas con ese filtro.'}</p>
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                    {Object.entries(grouped).map(([ds,appts])=>{
                      const [y,mo,d]=ds.split('-').map(Number); const dt=new Date(y,mo-1,d); const isT=ds===today
                      return (
                        <div key={ds}>
                          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                            <span style={{ fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:.5,padding:'4px 10px',borderRadius:20,background:isT?'#7c3aed':'#f1f5f9',color:isT?'#fff':'#94a3b8' }}>
                              {isT?'🔵 Hoy':`${DAYS[dt.getDay()]} ${d} ${MONTHS_S[mo-1]}`}
                            </span>
                            <div style={{ flex:1,height:1,background:'#f1f5f9' }}/>
                          </div>
                          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                            {appts.map(apt=><AptCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVid={activeVid} joiningCall={joiningCall} onJoin={onJoin}/>)}
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
