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

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: JSX.Element }> = {
  confirmed: { label: 'Confirmada',    color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: <CheckCircle size={11}/> },
  pending:   { label: 'Por confirmar', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: <AlertCircle size={11}/> },
  cancelled: { label: 'Cancelada',     color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: <XCircle size={11}/> },
  completed: { label: 'Realizada',     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: <CheckCircle size={11}/> },
  realizada: { label: 'Realizada',     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: <CheckCircle size={11}/> },
}
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_MIN = ['D','L','M','M','J','V','S']
const DAYS     = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function fmt(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function isUpcoming(d: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, mo, dy] = d.split('-').map(Number)
  return new Date(y, mo - 1, dy) >= today
}

// ── Appointment Card ─────────────────────────────────────────────────────────
function AptCard({ apt, selectedChild, activeVid, joiningCall, onJoin }: any) {
  const st = STATUS[apt.status] || STATUS.pending
  const childName = apt.children?.name || selectedChild?.name || ''
  const upcoming  = isUpcoming(apt.appointment_date)
  const [y, mo, d] = apt.appointment_date.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  const dim = !upcoming || apt.status === 'cancelled'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: `1px solid ${upcoming && apt.status === 'confirmed' ? '#e0e7ff' : '#f1f5f9'}`,
      boxShadow: upcoming && apt.status !== 'cancelled' ? '0 1px 8px rgba(0,0,0,.05)' : 'none',
      opacity: dim ? 0.65 : 1,
    }}>
      {/* top accent */}
      <div style={{ height: 3, background: apt.status === 'confirmed' ? '#6366f1' : apt.status === 'completed' || apt.status === 'realizada' ? '#a5b4fc' : apt.status === 'cancelled' ? '#fca5a5' : '#fcd34d' }}/>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Date badge */}
          <div style={{ width: 52, flexShrink: 0, borderRadius: 12, background: upcoming && !dim ? '#eef2ff' : '#f8fafc', border: `1px solid ${upcoming && !dim ? '#e0e7ff' : '#f1f5f9'}`, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: upcoming && !dim ? '#818cf8' : '#94a3b8' }}>{MONTHS_S[mo - 1]}</span>
            <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: upcoming && !dim ? '#3730a3' : '#94a3b8' }}>{d}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: upcoming && !dim ? '#818cf8' : '#cbd5e1' }}>{DAYS[date.getDay()]}</span>
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                {st.icon} {st.label}
              </span>
              {apt.is_group && <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 7px', borderRadius: 20, border: '1px solid #e9d5ff' }}>Grupal</span>}
            </div>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.2 }}>{apt.service_type || apt.type || 'Terapia ABA'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} color="#94a3b8"/> {fmt(apt.appointment_time)}</span>
              {childName && <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Baby size={10}/> {childName}</span>}
              {(apt as any).modalidad === 'virtual' && <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Video size={10}/> Virtual</span>}
            </div>
            {apt.notes && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, fontStyle: 'italic', lineHeight: 1.4 }}>"{apt.notes}"</p>}
          </div>
        </div>
        {/* Video button */}
        {upcoming && (apt.status === 'confirmed' || apt.status === 'pending') && (apt as any).modalidad === 'virtual' && (() => {
          const vs = activeVid[apt.id]
          const roomUrl = vs?.roomUrl || (apt as any).video_link || (apt as any).videoLink
          return roomUrl ? (
            <a href={roomUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px', borderRadius: 10, background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,102,241,.3)' }}>
              <Video size={13}/> Unirse a videollamada
            </a>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: '#eef2ff', borderRadius: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'apt-pulse 2s infinite' }}/>
              <p style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, margin: 0 }}>El enlace aparecerá al inicio de la sesión</p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MisCitasView({ profile, selectedChild, onCancelAppointment, onChangeView }: Props) {
  const { t } = useI18n()
  const supabase = supabaseClient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedDay, setSelectedDay]   = useState<string | null>(null)
  const [videoSession, setVideoSession] = useState<any>(null)
  const [joiningCall, setJoiningCall]   = useState<string | null>(null)
  const [activeVid, setActiveVid]       = useState<Record<string, any>>({})
  const [listView, setListView]         = useState<'upcoming' | 'all'>('upcoming')
  const [statusFilter, setStatusFilter] = useState('all')

  const todayDate   = new Date()
  const [vy, setVy] = useState(todayDate.getFullYear())
  const [vm, setVm] = useState(todayDate.getMonth())
  const todayStr    = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
  const tomorrowStr = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0] })()

  const calMap: Record<string, Appointment[]> = {}
  appointments.forEach(a => { (calMap[a.appointment_date] = calMap[a.appointment_date] || []).push(a) })
  const firstDay    = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const calCells    = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (calCells.length % 7) calCells.push(null)

  const pollVid = useCallback(async (apts: Appointment[]) => {
    const virt = apts.filter(a => (a as any).modalidad === 'virtual' && isUpcoming(a.appointment_date) && (a.status === 'confirmed' || a.status === 'pending'))
    if (!virt.length) return
    const res: Record<string, any> = {}
    await Promise.all(virt.map(async apt => {
      try { const r = await fetch(`/api/video-call?appointment_id=${apt.id}`); const d = await r.json(); if (d.session?.roomUrl) res[apt.id] = d.session } catch {}
    }))
    setActiveVid(res)
  }, [])

  const onJoin = (apt: Appointment) => {
    const s = activeVid[apt.id]; if (!s) return
    setJoiningCall(apt.id)
    setVideoSession({ roomUrl: s.roomUrl, sessionId: s.sessionId, appointmentId: apt.id })
    setJoiningCall(null)
  }

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    const [{ data: kids1 }, { data: parentLinks }] = await Promise.all([
      supabase.from('children').select('id').eq('parent_id', profile.id),
      supabase.from('parent_accounts').select('child_id').eq('user_id', profile.id),
    ])
    const allChildIds = [...new Set([...(kids1 || []).map((c: any) => c.id), ...(parentLinks || []).map((p: any) => p.child_id)])]
    let q = supabase.from('appointments').select('*, children(name, birth_date)').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })
    if (selectedChild?.id) q = q.eq('child_id', selectedChild.id)
    else if (allChildIds.length > 0) { const parts = [...allChildIds.map((id: string) => `child_id.eq.${id}`), `parent_id.eq.${profile.id}`]; q = q.or(parts.join(',')) }
    else q = q.eq('parent_id', profile.id)
    const { data } = await q
    setAppointments(data || [])
    pollVid(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile?.id, selectedChild?.id])
  useEffect(() => { if (!appointments.length) return; const i = setInterval(() => pollVid(appointments), 15000); return () => clearInterval(i) }, [appointments, pollVid])

  const today      = new Date().toISOString().split('T')[0]
  const upcoming   = appointments.filter(a => a.appointment_date >= today && a.status !== 'cancelled').length
  const completed  = appointments.filter(a => a.status === 'completed' || a.status === 'realizada').length
  const selAppts   = selectedDay ? appointments.filter(a => a.appointment_date === selectedDay) : []
  const listAppts  = appointments.filter(a => {
    if (selectedDay) return false
    if (listView === 'upcoming') return a.appointment_date >= today && a.status !== 'cancelled'
    return statusFilter === 'all' || a.status === statusFilter
  })
  const grouped: Record<string, Appointment[]> = {}
  listAppts.forEach(a => { (grouped[a.appointment_date] = grouped[a.appointment_date] || []).push(a) })
  const nextAppt = appointments.find(a => a.appointment_date >= today && a.status !== 'cancelled')

  return (
    <>
      <style>{`
        @keyframes apt-spin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes apt-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes apt-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .apt-in { animation: apt-in .3s ease both }
        .apt-in:nth-child(1){animation-delay:.03s} .apt-in:nth-child(2){animation-delay:.07s}
        .apt-in:nth-child(3){animation-delay:.11s} .apt-in:nth-child(4){animation-delay:.15s}
        .apt-hover { transition: background .15s ease, box-shadow .15s ease }
        .apt-hover:hover { background: #f8fafc !important }
        @media(min-width:960px){
          .apt-grid { display: grid !important; grid-template-columns: 280px 1fr; gap: 20px; align-items: start }
        }
      `}</style>

      {videoSession && <VideoCallModal roomUrl={videoSession.roomUrl} sessionId={videoSession.sessionId} appointmentId={videoSession.appointmentId} participantName={profile?.full_name || 'Padre/Madre'} onClose={() => { setVideoSession(null); load() }}/>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 32, width: '100%' }}>

        {/* ── HEADER ── */}
        <div className="apt-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>Mis sesiones</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
              {selectedChild?.name ? `${selectedChild.name.split(' ')[0]} ·` : ''} Programadas por el equipo del centro
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { n: upcoming,            label: 'próximas',  color: '#6366f1', bg: '#eef2ff', border: '#e0e7ff' },
              { n: completed,           label: 'realizadas', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
              { n: appointments.length, label: 'total',     color: '#94a3b8', bg: '#f8fafc', border: '#f1f5f9' },
            ].map(({ n, label, color, bg, border }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '7px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── NEXT APPOINTMENT HIGHLIGHT ── */}
        {!loading && nextAppt && (() => {
          const [y, mo, d] = nextAppt.appointment_date.split('-').map(Number)
          const dt = new Date(y, mo - 1, d)
          const isT  = nextAppt.appointment_date === today
          const isTm = nextAppt.appointment_date === tomorrowStr
          const when = isT ? 'Hoy' : isTm ? 'Mañana' : `${DAYS[dt.getDay()]} ${d} ${MONTHS_S[mo - 1]}`
          const st   = STATUS[nextAppt.status] || STATUS.pending
          return (
            <div className="apt-in" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e7ff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(99,102,241,.07)', flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 50, background: '#eef2ff', borderRadius: 12, border: '1px solid #e0e7ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{MONTHS_S[mo - 1]}</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#3730a3', lineHeight: 1.1 }}>{d}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: isT ? '#dc2626' : '#6366f1' }}>{isT ? '● Hoy' : isTm ? '◑ Mañana' : `● ${when}`}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
                </div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: '0 0 2px' }}>{nextAppt.service_type || nextAppt.type || 'Terapia ABA'}</p>
                <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} color="#94a3b8"/> {fmt(nextAppt.appointment_time)}</span>
              </div>
              <span style={{ fontSize: 24, flexShrink: 0 }}>📋</span>
            </div>
          )
        })()}

        {/* ── LOADING ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2.5px solid #e0e7ff', borderTop: '2.5px solid #6366f1', animation: 'apt-spin 1s linear infinite' }}/>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Cargando sesiones...</p>
          </div>
        ) : (
          <div className="apt-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── LEFT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Calendar */}
              <div className="apt-in" style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                {/* Month nav */}
                <div style={{ padding: '11px 14px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => { if (vm === 0) { setVm(11); setVy((y: number) => y - 1) } else setVm((m: number) => m - 1) }}
                    className="apt-hover" style={{ width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={13}/>
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{MONTHS[vm]} {vy}</span>
                  <button onClick={() => { if (vm === 11) { setVm(0); setVy((y: number) => y + 1) } else setVm((m: number) => m + 1) }}
                    className="apt-hover" style={{ width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={13}/>
                  </button>
                </div>

                <div style={{ padding: '10px 12px 8px' }}>
                  {/* Day labels */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 3 }}>
                    {DAYS_MIN.map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: i === 0 || i === 6 ? '#e2e8f0' : '#d1d5db', padding: '2px 0', textTransform: 'uppercase' }}>{d}</div>
                    ))}
                  </div>
                  {/* Date grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
                    {calCells.map((day, i) => {
                      if (!day) return <div key={i} style={{ height: 32 }}/>
                      const ds = `${vy}-${String(vm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const appts = calMap[ds] || []
                      const has = appts.length > 0
                      const isTod = ds === todayStr
                      const isSel = ds === selectedDay
                      const isPast = ds < todayStr
                      const hasActive = appts.some((a: Appointment) => a.status !== 'cancelled')
                      return (
                        <button key={i} onClick={() => has ? setSelectedDay(isSel ? null : ds) : undefined} disabled={!has}
                          style={{ height: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', cursor: has ? 'pointer' : 'default', fontSize: 12, fontWeight: isSel || isTod || has ? 700 : 400, transition: 'all .12s',
                            background: isSel ? '#6366f1' : isTod ? '#f0f0ff' : hasActive && !isPast ? '#f5f3ff' : 'transparent',
                            color: isSel ? '#fff' : isTod ? '#4f46e5' : hasActive && !isPast ? '#4338ca' : has && isPast ? '#94a3b8' : has ? '#475569' : '#d1d5db',
                            outline: isTod && !isSel ? '2px solid #c7d2fe' : 'none', outlineOffset: -1,
                          }}>
                          {day}
                          {has && <div style={{ width: 3, height: 3, borderRadius: '50%', marginTop: 1, background: isSel ? 'rgba(255,255,255,.7)' : hasActive && !isPast ? '#6366f1' : '#fcd34d' }}/>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ padding: '0 12px 10px', display: 'flex', gap: 10 }}>
                  {[['#6366f1','Con cita'], ['#fcd34d','Pendiente'], ['#c7d2fe','Hoy']].map(([c, l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }}/>
                      <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="apt-in" style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Info size={12} color="#6366f1"/> Gestionar citas
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Contáctanos para solicitar, cambiar o cancelar sesiones.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <a href="tel:+51924807183" className="apt-hover" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                    <Phone size={12} color="#6366f1"/> +51 924 807 183
                  </a>
                  <a href="mailto:tallerjugandoaprendoind@gmail.com" className="apt-hover" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
                    <Mail size={12} color="#6366f1"/> Escribir al centro
                  </a>
                </div>
              </div>
            </div>

            {/* ── RIGHT: LIST ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Selected day */}
              {selectedDay && selAppts.length > 0 && (
                <div className="apt-in" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e7ff', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} color="#6366f1"/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                        {(() => { const [y,mo,d] = selectedDay.split('-').map(Number); const dt = new Date(y,mo-1,d); return `${DAYS[dt.getDay()]}, ${d} de ${MONTHS[mo-1]}` })()}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>· {selAppts.length} cita{selAppts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => setSelectedDay(null)} className="apt-hover" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', color: '#94a3b8', cursor: 'pointer', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selAppts.map(apt => <AptCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVid={activeVid} joiningCall={joiningCall} onJoin={onJoin}/>)}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="apt-in" style={{ display: 'flex', background: '#f8fafc', borderRadius: 12, padding: 3, gap: 3, border: '1px solid #f1f5f9' }}>
                {([['upcoming', '📅 Próximas'], ['all', '🗂 Historial']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setListView(k)}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                      background: listView === k ? '#fff' : 'transparent',
                      color: listView === k ? '#1e293b' : '#9ca3af',
                      boxShadow: listView === k ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
                    }}>{label}</button>
                ))}
              </div>

              {/* Status filters */}
              {listView === 'all' && (
                <div className="apt-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {([['all','Todas'],['confirmed','✅ Confirmadas'],['pending','⏳ Pendientes'],['completed','🏆 Realizadas'],['cancelled','✕ Canceladas']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setStatusFilter(k)}
                      style={{ padding: '4px 11px', borderRadius: 20, border: `1px solid ${statusFilter === k ? '#6366f1' : '#e5e7eb'}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                        background: statusFilter === k ? '#6366f1' : '#fff',
                        color: statusFilter === k ? '#fff' : '#6b7280',
                      }}>{label}</button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {listAppts.length === 0 ? (
                <div className="apt-in" style={{ background: '#fff', borderRadius: 16, padding: '40px 20px', textAlign: 'center', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 48, height: 48, background: '#f8fafc', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={22} color="#c7d2fe"/>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#475569', margin: 0 }}>Sin sesiones aquí</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {listView === 'upcoming' ? 'No tienes sesiones próximas agendadas.' : 'No hay citas con ese filtro.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(grouped).map(([ds, appts]) => {
                    const [y, mo, d] = ds.split('-').map(Number)
                    const dt  = new Date(y, mo - 1, d)
                    const isT = ds === today
                    const isTm = ds === tomorrowStr
                    const label = isT ? '● Hoy' : isTm ? '◑ Mañana' : `${DAYS[dt.getDay()]} ${d} ${MONTHS_S[mo - 1]}`
                    return (
                      <div key={ds} className="apt-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                            background: isT ? '#6366f1' : isTm ? '#eef2ff' : '#f8fafc',
                            color: isT ? '#fff' : isTm ? '#4338ca' : '#9ca3af',
                            border: isT ? 'none' : `1px solid ${isTm ? '#e0e7ff' : '#f1f5f9'}`,
                          }}>{label}</span>
                          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}/>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(appts as Appointment[]).map(apt => (
                            <AptCard key={apt.id} apt={apt} selectedChild={selectedChild} activeVid={activeVid} joiningCall={joiningCall} onJoin={onJoin}/>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
