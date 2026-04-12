'use client'

import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState, useCallback } from 'react'
import type { JSX } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Phone, CalendarDays, Baby, Video, Loader2,
  ChevronLeft, ChevronRight, Mail, Info, MapPin, Users
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

const MESES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS    = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']

const ST: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pill_bg: string; pill_text: string }> = {
  confirmed: { label: 'Confirmada',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb',  pill_bg: '#2563eb',  pill_text: '#fff' },
  pending:   { label: 'Por confirmar', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#d97706',  pill_bg: '#f59e0b',  pill_text: '#fff' },
  cancelled: { label: 'Cancelada',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#dc2626',  pill_bg: '#ef4444',  pill_text: '#fff' },
  completed: { label: 'Realizada',     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed',  pill_bg: '#7c3aed',  pill_text: '#fff' },
  realizada: { label: 'Realizada',     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed',  pill_bg: '#7c3aed',  pill_text: '#fff' },
}

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

export default function MisCitasView({ profile, selectedChild, onCancelAppointment, onChangeView }: Props) {
  const supabase = supabaseClient
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [videoSession, setVideoSession] = useState<any>(null)
  const [activeVid, setActiveVid]       = useState<Record<string, any>>({})
  const [mes, setMes]                   = useState(new Date())

  const año       = mes.getFullYear()
  const mesN      = mes.getMonth()
  const hoy       = new Date().toISOString().split('T')[0]
  const primerDia = new Date(año, mesN, 1).getDay()
  const diasEnMes = new Date(año, mesN + 1, 0).getDate()

  // Group by date
  const porFecha: Record<string, Appointment[]> = {}
  appointments.forEach(a => { (porFecha[a.appointment_date] = porFecha[a.appointment_date] || []).push(a) })

  const citasDelDia   = diaSeleccionado ? (porFecha[diaSeleccionado] || []) : []
  const proximasCitas = appointments.filter(a => a.appointment_date >= hoy && a.status !== 'cancelled').slice(0, 12)

  const pollVid = useCallback(async (apts: Appointment[]) => {
    const virt = apts.filter(a => (a as any).modalidad === 'virtual' && isUpcoming(a.appointment_date) && (a.status === 'confirmed' || a.status === 'pending'))
    if (!virt.length) return
    const res: Record<string, any> = {}
    await Promise.all(virt.map(async apt => {
      try { const r = await fetch(`/api/video-call?appointment_id=${apt.id}`); const d = await r.json(); if (d.session?.roomUrl) res[apt.id] = d.session } catch {}
    }))
    setActiveVid(res)
  }, [])

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

  const upcoming  = appointments.filter(a => a.appointment_date >= hoy && a.status !== 'cancelled').length
  const completed = appointments.filter(a => a.status === 'completed' || a.status === 'realizada').length

  // Colors (light mode — parent portal is always light)
  const base    = '#ffffff'
  const surf    = '#f8fafc'
  const bord    = '#e2e8f0'
  const t1      = '#0f172a'
  const t2      = '#64748b'
  const t3      = '#94a3b8'
  const hover   = '#f8fafc'

  return (
    <>
      <style>{`
        @keyframes mcv-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes mcv-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mcv-fade { animation: mcv-in .3s ease both }
        .mcv-cell-btn:hover { background: #f8fafc !important }
        .mcv-row-btn:hover  { background: #f8fafc !important }
        @media(min-width:1024px){
          .mcv-main { display: grid !important; grid-template-columns: 1fr 300px; gap: 18px; align-items: start }
        }
      `}</style>

      {videoSession && (
        <VideoCallModal roomUrl={videoSession.roomUrl} sessionId={videoSession.sessionId}
          appointmentId={videoSession.appointmentId} participantName={profile?.full_name || 'Padre/Madre'}
          onClose={() => { setVideoSession(null); load() }}/>
      )}

      <div style={{ paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── HEADER ── */}
        <div className="mcv-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${bord}` }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: t1, margin: 0, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={20} color="#2563eb"/>
              </div>
              Mis sesiones
            </h1>
            <p style={{ fontSize: 12, color: t2, margin: '4px 0 0 48px' }}>
              {selectedChild?.name ? `${selectedChild.name.split(' ')[0]} · ` : ''}{appointments.length} citas · {upcoming} próximas · {completed} realizadas
            </p>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { n: upcoming,            label: 'próximas',  color: '#2563eb', bg: '#eff6ff' },
              { n: completed,           label: 'realizadas', color: '#7c3aed', bg: '#f5f3ff' },
              { n: appointments.length, label: 'total',     color: t2,        bg: surf      },
            ].map(({ n, label, color, bg }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${bord}`, borderRadius: 12, padding: '7px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="mcv-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ─── CALENDAR ─── */}
          <div className="mcv-fade" style={{ background: base, borderRadius: 20, border: `1px solid ${bord}`, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>

            {/* Month nav */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setMes(new Date(año, mesN - 1, 1))}
                className="mcv-cell-btn"
                style={{ width: 32, height: 32, borderRadius: 10, background: surf, border: `1px solid ${bord}`, color: t2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={15}/>
              </button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: t1 }}>{MESES[mesN]}</span>
                {' '}
                <span style={{ fontSize: 14, fontWeight: 500, color: t2 }}>{año}</span>
              </div>
              <button onClick={() => setMes(new Date(año, mesN + 1, 1))}
                className="mcv-cell-btn"
                style={{ width: 32, height: 32, borderRadius: 10, background: surf, border: `1px solid ${bord}`, color: t2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={15}/>
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${bord}` }}>
              {DIAS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: i === 0 || i === 6 ? t3 : t2 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 size={20} style={{ color: '#2563eb', animation: 'mcv-spin 1s linear infinite' }}/>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {/* Empty prefix */}
                {Array.from({ length: primerDia }, (_, i) => (
                  <div key={`e-${i}`} style={{ minHeight: 80, borderBottom: `1px solid ${bord}`, borderRight: `1px solid ${bord}`, background: '#fafafa' }}/>
                ))}

                {Array.from({ length: diasEnMes }, (_, i) => {
                  const dia      = i + 1
                  const fechaStr = `${año}-${String(mesN + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                  const citasDia = porFecha[fechaStr] || []
                  const esHoy    = fechaStr === hoy
                  const esSel    = fechaStr === diaSeleccionado
                  const hasCitas = citasDia.length > 0
                  const activeCitas = citasDia.filter(c => c.status !== 'cancelled')

                  return (
                    <button key={dia}
                      onClick={() => setDiaSeleccionado(esSel ? '' : fechaStr)}
                      className="mcv-cell-btn"
                      style={{
                        minHeight: 80, borderBottom: `1px solid ${bord}`, borderRight: `1px solid ${bord}`,
                        padding: '6px 6px 4px', textAlign: 'left', cursor: 'pointer',
                        background: esSel ? '#eff6ff' : esHoy ? '#f0f7ff' : 'transparent',
                        display: 'flex', flexDirection: 'column', gap: 3,
                        border: 'none', borderBottom: `1px solid ${bord}`, borderRight: `1px solid ${bord}`,
                        outline: 'none', transition: 'background .12s',
                      }}>
                      {/* Day number */}
                      <span style={{
                        width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: esSel || esHoy || hasCitas ? 700 : 400, flexShrink: 0,
                        background: esSel || esHoy ? '#2563eb' : 'transparent',
                        color: esSel || esHoy ? '#fff' : hasCitas ? t1 : t3,
                      }}>{dia}</span>

                      {/* Appointment pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        {citasDia.slice(0, 2).map((c, idx) => {
                          const s = ST[c.status] || ST.confirmed
                          return (
                            <div key={idx} style={{
                              width: '100%', padding: '2px 5px', borderRadius: 5, fontSize: 9, fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden',
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                            }}>
                              {(c as any).modalidad === 'virtual' ? <Video size={7} style={{ flexShrink: 0 }}/> : <MapPin size={7} style={{ flexShrink: 0 }}/>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.appointment_time?.slice(0, 5)} {c.children?.name || selectedChild?.name}
                              </span>
                            </div>
                          )
                        })}
                        {citasDia.length > 2 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: t2, paddingLeft: 2 }}>+{citasDia.length - 2} más</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Day detail */}
            <div className="mcv-fade" style={{ background: base, borderRadius: 18, border: `1px solid ${bord}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={14} color="#2563eb"/>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: t3, margin: 0 }}>
                      {diaSeleccionado === hoy ? 'HOY' : 'DÍA SELECCIONADO'}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: t1, margin: 0, textTransform: 'capitalize' }}>
                      {diaSeleccionado
                        ? new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
                        : 'Selecciona un día'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: surf, color: t2, border: `1px solid ${bord}` }}>
                  {citasDelDia.length} citas
                </span>
              </div>

              {citasDelDia.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: surf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarDays size={20} color={t3}/>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t3, margin: 0 }}>Sin sesiones este día</p>
                  <p style={{ fontSize: 11, color: t3, margin: 0, opacity: 0.7 }}>Selecciona un día con citas del calendario</p>
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {citasDelDia
                    .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                    .map(c => {
                      const s = ST[c.status] || ST.confirmed
                      const roomUrl = activeVid[c.id]?.roomUrl || (c as any).video_link
                      return (
                        <div key={c.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${bord}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 3, height: 36, borderRadius: 4, flexShrink: 0, background: s.color }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 800, color: t1, margin: 0 }}>{c.service_type || c.type || 'Terapia ABA'}</p>
                              <p style={{ fontSize: 11, color: t2, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={9} color={t3}/> {fmt(c.appointment_time)}
                                {c.children?.name && <><Baby size={9} color={t3}/> {c.children.name}</>}
                              </p>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }}>
                              {s.label}
                            </span>
                          </div>
                          {/* Video link */}
                          {roomUrl && (c.status === 'confirmed' || c.status === 'pending') && (
                            <a href={roomUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 11, textDecoration: 'none', marginLeft: 15 }}>
                              <Video size={12}/> Unirse a videollamada
                            </a>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Upcoming appointments */}
            <div className="mcv-fade" style={{ background: base, borderRadius: 18, border: `1px solid ${bord}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={14} color="#059669"/>
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: t1, margin: 0 }}>Próximas sesiones</h3>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: surf, color: t2, border: `1px solid ${bord}` }}>
                  {proximasCitas.length}
                </span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                  <Loader2 size={18} style={{ color: '#2563eb', animation: 'mcv-spin 1s linear infinite' }}/>
                </div>
              ) : proximasCitas.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: surf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} color={t3}/>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: t3, margin: 0 }}>Sin sesiones próximas</p>
                  <p style={{ fontSize: 11, color: t3, margin: 0, opacity: 0.7 }}>Las citas son programadas por el centro</p>
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {proximasCitas.map(c => {
                    const s      = ST[c.status] || ST.confirmed
                    const fecha  = new Date(c.appointment_date + 'T00:00:00')
                    const esHoyC = c.appointment_date === hoy
                    const dia    = fecha.getDate()
                    const mesC   = MESES_S[fecha.getMonth()]
                    return (
                      <button key={c.id}
                        className="mcv-row-btn"
                        onClick={() => { setDiaSeleccionado(c.appointment_date); setMes(fecha) }}
                        style={{ width: '100%', padding: '10px 14px', borderBottom: `1px solid ${bord}`, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 'none', borderBottom: `1px solid ${bord}`, cursor: 'pointer', textAlign: 'left', transition: 'background .12s', outline: 'none' }}>
                        {/* Date badge */}
                        <div style={{ width: 40, height: 44, borderRadius: 12, flexShrink: 0, background: esHoyC ? '#2563eb' : surf, border: `1px solid ${esHoyC ? '#2563eb' : bord}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: esHoyC ? 'rgba(255,255,255,.75)' : t3, lineHeight: 1 }}>{mesC}</span>
                          <span style={{ fontSize: 17, fontWeight: 900, color: esHoyC ? '#fff' : t1, lineHeight: 1.1 }}>{dia}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.service_type || c.type || 'Terapia ABA'}
                          </p>
                          <p style={{ fontSize: 11, color: t2, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} color={t3}/> {fmt(c.appointment_time)}
                            {esHoyC && <span style={{ color: '#2563eb', fontWeight: 700 }}>· Hoy</span>}
                          </p>
                        </div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.dot }}/>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="mcv-fade" style={{ background: base, border: `1px solid ${bord}`, borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: t1, margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Info size={12} color="#2563eb"/> Gestionar sesiones
              </p>
              <p style={{ fontSize: 11, color: t2, margin: '0 0 10px', lineHeight: 1.5 }}>
                Contacta al centro para solicitar, cambiar o cancelar citas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <a href="tel:+51924807183" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: surf, border: `1px solid ${bord}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: t1, textDecoration: 'none' }}>
                  <Phone size={12} color="#2563eb"/> +51 924 807 183
                </a>
                <a href="mailto:tallerjugandoaprendoind@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: surf, border: `1px solid ${bord}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: t1, textDecoration: 'none' }}>
                  <Mail size={12} color="#2563eb"/> Escribir al centro
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
