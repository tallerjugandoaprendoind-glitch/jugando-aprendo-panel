'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useEffect, useState, useRef } from 'react'
import { supabase as supabaseClient } from '@/lib/supabase'
import {
  CalendarDays, Clock, CheckCircle, XCircle, RefreshCw,
  TrendingUp, Target, Activity, Award, ChevronRight,
  Sparkles, Baby, BarChart3, AlertCircle,
  Heart, Trophy, PartyPopper, X,
  MessageCircle, Brain
} from 'lucide-react'

interface Props {
  child: any
  onChangeView: (view: string) => void
  refreshTrigger: number
  onCancelAppointment: (id: string, reschedule: boolean) => void
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function calcAge(birthDate: string) {
  if (!birthDate) return 0
  const today = new Date(), birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { day: d, month: MONTHS_ES[m-1], monthFull: MONTHS_FULL[m-1], year: y }
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return <>{val}</>
}

function GoalCelebration({ childName, goalsAchieved, onClose }: { childName: string; goalsAchieved: number; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)' }}>
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9)', borderRadius: 32, padding: '48px 40px', textAlign: 'center', maxWidth: 400, width: '90%', boxShadow: '0 0 80px rgba(79,70,229,.6)', position: 'relative', overflow: 'hidden', animation: 'celebIn .5s cubic-bezier(.175,.885,.32,1.275)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 18 }}>×</button>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontWeight: 900, fontSize: 30, color: '#fff', marginBottom: 8 }}>¡Gran logro!</h2>
        <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
          <strong style={{ color: '#fbbf24' }}>{childName}</strong> alcanzó <strong style={{ color: '#fbbf24' }}>{goalsAchieved} objetivo{goalsAchieved !== 1 ? 's' : ''}</strong> con dominio ≥80%.
        </p>
      </div>
      <style>{`@keyframes celebIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function WellbeingSurvey({ childName, onClose }: { childName: string; onClose: () => void }) {
  const [answered, setAnswered] = useState(false)
  const options = [
    { emoji: '😊', label: 'Bien, con energía para seguir', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { emoji: '😐', label: 'Regular, algo cansado/a', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { emoji: '😔', label: 'Difícil, necesito más apoyo', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ]
  const handleAnswer = () => { setAnswered(true); setTimeout(onClose, 3000) }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', padding: '0 16px 24px' }}>
      <div style={{ background: '#fff', borderRadius: '28px 28px 20px 20px', padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 -30px 80px rgba(0,0,0,.15)', animation: 'slideUp .4s cubic-bezier(.175,.885,.32,1.275)' }}>
        {!answered ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#fce7f3,#ede9fe)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={18} color="#be185d" /></div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', margin: 0 }}>¿Cómo estás tú?</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Chequeo de bienestar mensual</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 16 }}>Acompañar a <strong>{childName || 'tu hijo/a'}</strong> es un trabajo importante. ¿Cómo te has sentido esta semana?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map(opt => (
                <button key={opt.label} onClick={handleAnswer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: opt.bg, border: `2px solid ${opt.border}`, borderRadius: 14, fontSize: 14, fontWeight: 600, color: opt.color, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💙</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 8 }}>¡Gracias por compartir!</h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Tu terapeuta tomará esto en cuenta.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

export default function HomeViewInnovative({ child, onChangeView, refreshTrigger, onCancelAppointment }: Props) {
  const { t, locale } = useI18n()
  const supabase = supabaseClient
  const [nextAppt, setNextAppt] = useState<any>(null)
  const [stats, setStats] = useState({ sessions: 0, goalsAchieved: 0, hoursTotal: 0, level: 'Inicial', monthSessions: 0, masteryRate: 0, totalGoals: 0 })
  const [loading, setLoading] = useState(true)
  const [parentMessages, setParentMessages] = useState<any[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [prevGoals, setPrevGoals] = useState(-1)
  const [showWellbeing, setShowWellbeing] = useState(false)
  const [prediccion, setPrediccion] = useState<any>(null)
  const [patrones, setPatrones] = useState<any>(null)
  const [programas, setProgramas] = useState<any[]>([])
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
  const [gcalBannerDismissed, setGcalBannerDismissed] = useState(false)

  useEffect(() => {
    if (gcalBannerDismissed) return
    const dismissed = sessionStorage.getItem('gcal_banner_dismissed')
    if (dismissed) { setGcalBannerDismissed(true); return }
    const checkGcal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) return
        const res = await fetch(`/api/google-calendar?action=status&userId=${session.user.id}`)
        const data = await res.json()
        setGcalConnected(!!data.connected)
      } catch { }
    }
    checkGcal()
  }, [gcalBannerDismissed])

  useEffect(() => { if (!child?.id) return; loadData() }, [child?.id, refreshTrigger])

  useEffect(() => {
    const key = `wellbeing_shown_${new Date().getFullYear()}_${new Date().getMonth()}`
    if (!localStorage.getItem(key) && child?.id) {
      const timer = setTimeout(() => { setShowWellbeing(true); localStorage.setItem(key, '1') }, 18000)
      return () => clearTimeout(timer)
    }
  }, [child?.id])

  const loadData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0,7) + '-01'
    const { data: appts } = await supabase.from('appointments').select('*').eq('child_id', child.id).gte('appointment_date', today).neq('status', 'cancelled').neq('status', 'completed').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }).limit(1)
    setNextAppt(appts?.[0] || null)
    const [{ data: monthSess }, { data: allSess }, { data: allSessV2 }] = await Promise.all([
      supabase.from('registro_aba').select('id').eq('child_id', child.id).gte('fecha_sesion', monthStart),
      supabase.from('registro_aba').select('id, datos').eq('child_id', child.id),
      supabase.from('aba_sessions_v2').select('id, duration_minutes').eq('child_id', child.id),
    ])
    const [{ data: goals }, { data: progsData }] = await Promise.all([
      supabase.from('goal_progress').select('id, mastery_level, goal_name').eq('child_id', child.id),
      supabase.from('programas_aba').select('id, nombre, area, estado').eq('child_id', child.id).limit(4),
    ])
    if (progsData) setProgramas(progsData)
    const [{ data: msgs }, { data: parentMsgs }] = await Promise.all([
      supabase.from('notifications').select('*').eq('user_id', child.parent_id || '').eq('is_read', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('parent_messages').select('*').eq('child_id', child.id).order('created_at', { ascending: false }).limit(5),
    ])
    setParentMessages([...(msgs || []), ...(parentMsgs || [])].slice(0, 5))
    const [{ data: pred }, { data: pats }] = await Promise.all([
      supabase.from('predicciones_ia').select('*').eq('child_id', child.id).single(),
      supabase.from('patrones_detectados').select('*').eq('child_id', child.id).single(),
    ])
    if (pred) setPrediccion(pred)
    if (pats) setPatrones(pats)
    const totalSess = Math.max(allSess?.length || 0, allSessV2?.length || 0)
    const totalMinutes = (allSessV2 || []).reduce((s: number, x: any) => s + (x.duration_minutes || 45), 0) || totalSess * 45
    const achieved = (goals || []).filter((g: any) => (g.mastery_level || 0) >= 80).length
    const totalGoals = goals?.length || 0
    const masteryRate = totalGoals > 0 ? Math.round((achieved / totalGoals) * 100) : 0
    let level = 'Inicial'
    if (totalSess >= 50) level = 'Avanzado'
    else if (totalSess >= 20) level = 'Intermedio'
    else if (totalSess >= 5) level = 'Básico'
    if (prevGoals !== -1 && achieved > prevGoals && achieved > 0) setShowCelebration(true)
    setPrevGoals(achieved)
    setStats({ sessions: totalSess, goalsAchieved: achieved, hoursTotal: Math.round(totalMinutes / 60 * 10) / 10, level, monthSessions: monthSess?.length || 0, masteryRate, totalGoals })
    setLoading(false)
  }

  const age = child ? calcAge(child.birth_date) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8, width: '100%' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{from{background-position:200% center}to{background-position:-200% center}}
        .hv-card{animation:fadeUp .4s ease both}
        .hv-card:nth-child(1){animation-delay:.05s}.hv-card:nth-child(2){animation-delay:.1s}
        .hv-card:nth-child(3){animation-delay:.15s}.hv-card:nth-child(4){animation-delay:.2s}
        .hv-card:nth-child(5){animation-delay:.25s}.hv-card:nth-child(6){animation-delay:.3s}
        .hv-stat{transition:transform .2s ease}.hv-stat:hover{transform:scale(1.02)}
        .hv-prog{transition:width 1s cubic-bezier(.22,1,.36,1)}
        /* Responsive grid */
        @media(min-width:640px){
          .hv-stats-grid{grid-template-columns:repeat(4,1fr)!important}
        }
        @media(max-width:380px){
          .hv-hero-title{font-size:22px!important}
          .hv-hero-pad{padding:18px 16px 16px!important}
        }
      `}</style>

      {showCelebration && <GoalCelebration childName={child?.name||'tu hijo/a'} goalsAchieved={stats.goalsAchieved} onClose={()=>setShowCelebration(false)}/>}
      {showWellbeing && <WellbeingSurvey childName={child?.name} onClose={()=>setShowWellbeing(false)}/>}

      {/* GOOGLE CALENDAR BANNER */}
      {gcalConnected===false && !gcalBannerDismissed && (
        <div className="hv-card" style={{ background:'linear-gradient(135deg,#4285f4,#1a73e8)',borderRadius:20,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 4px 20px rgba(66,133,244,.3)' }}>
          <div style={{ fontSize:26,flexShrink:0 }}>📅</div>
          <div style={{ flex:1 }}>
            <p style={{ color:'#fff',fontWeight:700,fontSize:13,margin:0 }}>Recibí tus citas en Google Calendar</p>
            <p style={{ color:'rgba(255,255,255,.8)',fontSize:11,margin:'2px 0 0' }}>Conectá tu cuenta y las citas aparecerán automáticamente.</p>
          </div>
          <div style={{ display:'flex',gap:8,flexShrink:0 }}>
            <button onClick={()=>onChangeView('profile')} style={{ background:'#fff',color:'#1a73e8',border:'none',borderRadius:10,padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer' }}>Conectar</button>
            <button onClick={()=>{sessionStorage.setItem('gcal_banner_dismissed','1');setGcalBannerDismissed(true)}} style={{ background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:10,padding:'7px 10px',fontSize:12,cursor:'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {/* HERO CARD */}
      <div className="hv-card" style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)',borderRadius:28,padding:'24px 24px 20px',color:'#fff',boxShadow:'0 20px 60px rgba(79,70,229,.35)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,background:'rgba(255,255,255,.08)',borderRadius:'50%' }}/>
        <div style={{ position:'absolute',bottom:-30,left:-10,width:120,height:120,background:'rgba(168,85,247,.3)',borderRadius:'50%' }}/>
        <div style={{ position:'relative',zIndex:1,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12 }}>
          <div style={{ flex:1 }}>
            <p style={{ color:'#c4b5fd',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,margin:'0 0 4px' }}>Paciente activo</p>
            <h1 style={{ fontSize:26,fontWeight:900,margin:'0 0 10px',letterSpacing:'-0.5px',lineHeight:1.1 }}>{child?.name||'Sin seleccionar'}</h1>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              <span style={{ background:'rgba(255,255,255,.18)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20 }}>{age} años</span>
              <span style={{ background:'rgba(255,255,255,.18)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20 }}>{child?.diagnosis||'En evaluación'}</span>
              <span style={{ background:'rgba(255,255,255,.18)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20 }}>{stats.sessions} sesiones</span>
              {stats.level!=='Inicial'&&<span style={{ background:'rgba(251,191,36,.25)',color:'#fde68a',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,border:'1px solid rgba(251,191,36,.3)' }}>⭐ Nivel {stats.level}</span>}
            </div>
          </div>
          <div style={{ position:'relative',flexShrink:0 }}>
            <div style={{ width:60,height:60,background:'rgba(255,255,255,.2)',backdropFilter:'blur(10px)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,border:'2px solid rgba(255,255,255,.3)' }}>
              {child?.name?.[0]?.toUpperCase()||'?'}
            </div>
            {stats.sessions>0&&<div style={{ position:'absolute',bottom:-3,right:-3,width:18,height:18,background:'#10b981',borderRadius:'50%',border:'2px solid #fff' }}/>}
          </div>
        </div>
        {stats.sessions>0&&(
          <div style={{ marginTop:18,position:'relative',zIndex:1 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
              <span style={{ color:'rgba(255,255,255,.7)',fontSize:11,fontWeight:600 }}>Dominio de objetivos</span>
              <span style={{ color:'#fff',fontSize:11,fontWeight:800 }}>{stats.masteryRate}%</span>
            </div>
            <div style={{ height:6,background:'rgba(255,255,255,.2)',borderRadius:10,overflow:'hidden' }}>
              <div className="hv-prog" style={{ height:'100%',width:`${stats.masteryRate}%`,background:'linear-gradient(90deg,#a5f3fc,#fff)',borderRadius:10 }}/>
            </div>
          </div>
        )}
      </div>

      {/* STATS GRID */}
      <div className="hv-card hv-stats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12 }}>
        {[
          { value:stats.sessions, label:'Sesiones', sub:stats.monthSessions>0?`+${stats.monthSessions} este mes`:'Total realizadas', icon:<Activity size={20}/>, grad:'linear-gradient(135deg,#3b82f6,#1d4ed8)', glow:'rgba(59,130,246,.2)' },
          { value:stats.goalsAchieved, label:'Objetivos', sub:stats.totalGoals>0?`de ${stats.totalGoals} totales`:'Con dominio ≥80%', icon:<Target size={20}/>, grad:'linear-gradient(135deg,#10b981,#059669)', glow:'rgba(16,185,129,.2)' },
          { value:`${stats.hoursTotal}h`, label:'Horas acumuladas', sub:stats.sessions>0?`~${Math.round(stats.hoursTotal/Math.max(stats.sessions,1)*10)/10}h/sesión`:'Sin sesiones', icon:<Clock size={20}/>, grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)', glow:'rgba(139,92,246,.2)' },
          { value:stats.level, label:'Nivel', sub:'Basado en progreso', icon:<Award size={20}/>, grad:'linear-gradient(135deg,#f59e0b,#d97706)', glow:'rgba(245,158,11,.2)' },
        ].map(({ value, label, sub, icon, grad, glow })=>(
          <div key={label} className="hv-stat" style={{ background:'#fff',borderRadius:20,padding:'16px 14px',border:'1.5px solid #f1f5f9',boxShadow:`0 4px 16px ${glow}`,display:'flex',flexDirection:'column',gap:10 }}>
            <div style={{ width:40,height:40,background:grad,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>{icon}</div>
            <div>
              <p style={{ fontSize:26,fontWeight:900,color:'#0f172a',margin:0,lineHeight:1,letterSpacing:'-0.5px' }}>
                {typeof value==='number'&&!loading?<CountUp target={value}/>:value}
              </p>
              <p style={{ fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,margin:'2px 0 0' }}>{label}</p>
            </div>
            <p style={{ fontSize:11,fontWeight:600,color:'#64748b',margin:0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* IA INSIGHT */}
      {(prediccion||patrones)&&(
        <div className="hv-card" style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b,#0c0a1e)',borderRadius:24,padding:'20px 24px',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-30,right:-30,width:140,height:140,background:'radial-gradient(circle,rgba(139,92,246,.4),transparent 70%)',borderRadius:'50%' }}/>
          <div style={{ position:'relative',zIndex:1 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
              <div style={{ width:36,height:36,background:'linear-gradient(135deg,#7c3aed,#2563eb)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}><Brain size={18} color="#fff"/></div>
              <div>
                <p style={{ color:'#c4b5fd',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1,margin:0 }}>IA • Análisis Predictivo</p>
                <p style={{ color:'#fff',fontSize:13,fontWeight:700,margin:0 }}>Vista de progreso</p>
              </div>
              {prediccion?.confianza&&<span style={{ marginLeft:'auto',background:'rgba(139,92,246,.3)',color:'#c4b5fd',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20 }}>{prediccion.confianza}% confianza</span>}
            </div>
            {prediccion?.prediccion_30d&&<p style={{ color:'rgba(255,255,255,.85)',fontSize:13,lineHeight:1.5,margin:0 }}>{prediccion.prediccion_30d}</p>}
            {prediccion?.areas_fortaleza?.length>0&&(
              <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:10 }}>
                {prediccion.areas_fortaleza.slice(0,3).map((a:string,i:number)=><span key={i} style={{ background:'rgba(16,185,129,.2)',color:'#6ee7b7',fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,border:'1px solid rgba(16,185,129,.3)' }}>✦ {a}</span>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRÓXIMA CITA */}
      <div className="hv-card" style={{ background:'#fff',borderRadius:24,border:'1.5px solid #f1f5f9',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'16px 20px 12px',borderBottom:'1px solid #f8fafc' }}>
          <CalendarDays size={16} color="#7c3aed"/>
          <h2 style={{ fontWeight:800,fontSize:13,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,margin:0 }}>Próxima sesión</h2>
        </div>
        {loading ? (
          <div style={{ padding:'18px 20px' }}>
            <div style={{ height:64,background:'linear-gradient(90deg,#f8fafc,#f1f5f9,#f8fafc)',backgroundSize:'200%',borderRadius:16,animation:'shimmer 1.5s linear infinite' }}/>
          </div>
        ) : nextAppt ? (
          <div style={{ padding:'16px 20px' }}>
            {(()=>{
              const d=formatDate(nextAppt.appointment_date)
              return (
                <div style={{ display:'flex',alignItems:'center',gap:16 }}>
                  <div style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',borderRadius:18,padding:'10px 16px',textAlign:'center',flexShrink:0,boxShadow:'0 8px 20px rgba(124,58,237,.3)' }}>
                    <div style={{ fontSize:28,fontWeight:900,lineHeight:1 }}>{d.day}</div>
                    <div style={{ fontSize:11,fontWeight:700,opacity:.8,marginTop:2,textTransform:'uppercase' }}>{d.month}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,marginBottom:4,...(nextAppt.status==='confirmed'?{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}:{background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a'}) }}>
                      {nextAppt.status==='confirmed'?<CheckCircle size={10}/>:<AlertCircle size={10}/>}
                      {nextAppt.status==='confirmed'?'Confirmada':'Pendiente'}
                    </span>
                    <p style={{ fontWeight:800,fontSize:15,color:'#0f172a',margin:'0 0 2px' }}>{nextAppt.service_type||'Terapia ABA'}</p>
                    <p style={{ fontSize:13,color:'#64748b',margin:0,display:'flex',alignItems:'center',gap:4 }}><Clock size={12}/>{formatTime(nextAppt.appointment_time)}</p>
                  </div>
                </div>
              )
            })()}
            <div style={{ display:'flex',gap:8,marginTop:14,paddingTop:14,borderTop:'1px solid #f1f5f9' }}>
              <button onClick={()=>onCancelAppointment(nextAppt.id,true)} style={{ flex:1,padding:'9px 12px',background:'#f5f3ff',color:'#7c3aed',border:'1.5px solid #ddd6fe',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}><RefreshCw size={13}/>Reprogramar</button>
              <button onClick={()=>onCancelAppointment(nextAppt.id,false)} style={{ flex:1,padding:'9px 12px',background:'#fef2f2',color:'#dc2626',border:'1.5px solid #fecaca',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}><XCircle size={13}/>Cancelar</button>
              <button onClick={()=>onChangeView('miscitas')} style={{ padding:'9px 14px',background:'#0f172a',color:'#fff',border:'none',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>Ver todas<ChevronRight size={13}/></button>
            </div>
          </div>
        ) : (
          <div style={{ padding:'28px 20px',textAlign:'center' }}>
            <div style={{ width:64,height:64,background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}><CalendarDays size={28} color="#a78bfa"/></div>
            <p style={{ fontWeight:800,fontSize:15,color:'#1e293b',margin:'0 0 8px' }}>Sin citas programadas</p>
            <p style={{ fontSize:13,color:'#94a3b8',lineHeight:1.6,margin:'0 auto 18px',maxWidth:280 }}>La constancia en las sesiones es clave. Contactá con el centro para agendar tu próxima cita.</p>
            <button onClick={()=>onChangeView('miscitas')} style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',border:'none',padding:'10px 20px',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 16px rgba(124,58,237,.3)' }}><CalendarDays size={15}/>Ver mis citas</button>
          </div>
        )}
      </div>

      {/* PROGRAMAS ABA */}
      {programas.length>0&&(
        <div className="hv-card" style={{ background:'#fff',borderRadius:24,border:'1.5px solid #f1f5f9',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 12px',borderBottom:'1px solid #f8fafc' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}><Brain size={16} color="#0ea5e9"/><h2 style={{ fontWeight:800,fontSize:13,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,margin:0 }}>Programas ABA activos</h2></div>
            <span style={{ background:'#f0f9ff',color:'#0284c7',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,border:'1px solid #bae6fd' }}>{programas.length}</span>
          </div>
          <div style={{ padding:'12px 16px',display:'flex',flexDirection:'column',gap:8 }}>
            {programas.map((prog:any,i:number)=>(
              <div key={prog.id||i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'#f8fafc',borderRadius:14 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:prog.estado==='activo'?'#10b981':prog.estado==='completado'?'#6366f1':'#f59e0b',flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700,fontSize:13,color:'#1e293b',margin:0 }}>{prog.nombre||'Programa'}</p>
                  {prog.area&&<p style={{ fontSize:11,color:'#94a3b8',margin:'1px 0 0' }}>{prog.area}</p>}
                </div>
                <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,padding:'3px 8px',borderRadius:10,...(prog.estado==='activo'?{background:'#f0fdf4',color:'#16a34a'}:prog.estado==='completado'?{background:'#f5f3ff',color:'#7c3aed'}:{background:'#fffbeb',color:'#d97706'}) }}>{prog.estado||'activo'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROGRESO GENERAL */}
      <div className="hv-card" style={{ background:'#fff',borderRadius:24,border:'1.5px solid #f1f5f9',padding:'18px 20px',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}><TrendingUp size={16} color="#7c3aed"/><h3 style={{ fontWeight:800,fontSize:13,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,margin:0 }}>Progreso general</h3></div>
          {stats.goalsAchieved>0&&<button onClick={()=>setShowCelebration(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'#fffbeb',color:'#d97706',border:'1.5px solid #fde68a',borderRadius:20,fontSize:11,fontWeight:700,padding:'5px 12px',cursor:'pointer' }}><Trophy size={12}/>Ver logro 🎉</button>}
        </div>
        {stats.sessions===0 ? (
          <div style={{ textAlign:'center',padding:'20px 0' }}>
            <div style={{ width:60,height:60,background:'linear-gradient(135deg,#f8fafc,#f5f3ff)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}><BarChart3 size={28} color="#c4b5fd"/></div>
            <p style={{ fontWeight:700,fontSize:14,color:'#64748b',margin:'0 0 6px' }}>El progreso aparecerá aquí</p>
            <p style={{ fontSize:12,color:'#94a3b8',lineHeight:1.6,maxWidth:260,margin:'0 auto' }}>Después de las primeras sesiones verás gráficos de avance y objetivos logrados.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {[
              { label:'Dominio de objetivos', value:stats.masteryRate, color:'linear-gradient(90deg,#10b981,#059669)' },
              { label:'Asistencia al mes', value:Math.min(100,stats.monthSessions*25), color:'linear-gradient(90deg,#3b82f6,#7c3aed)' },
              { label:'Horas de terapia', value:Math.min(100,Math.round(stats.hoursTotal/20*100)), color:'linear-gradient(90deg,#f59e0b,#ef4444)' },
            ].map(({ label, value, color })=>(
              <div key={label}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:600,color:'#64748b' }}>{label}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:'#1e293b' }}>{value}%</span>
                </div>
                <div style={{ height:8,background:'#f1f5f9',borderRadius:20,overflow:'hidden' }}>
                  <div className="hv-prog" style={{ height:'100%',width:`${value}%`,background:color,borderRadius:20 }}/>
                </div>
              </div>
            ))}
            {stats.masteryRate>=80&&(
              <div style={{ marginTop:4,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1.5px solid #bbf7d0',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:12 }}>
                <PartyPopper size={20} color="#16a34a" style={{ flexShrink:0,marginTop:1 }}/>
                <div>
                  <p style={{ fontWeight:800,fontSize:13,color:'#15803d',margin:'0 0 3px' }}>¡Rendimiento excepcional!</p>
                  <p style={{ fontSize:12,color:'#16a34a',lineHeight:1.5,margin:0 }}>{child?.name?.split(' ')[0]||'Tu hijo/a'} domina sus objetivos con {stats.masteryRate}% de éxito.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MENSAJES DEL TERAPEUTA */}
      {parentMessages.length>0&&(
        <div className="hv-card" style={{ background:'#fff',borderRadius:24,border:'1.5px solid #ede9fe',overflow:'hidden',boxShadow:'0 4px 20px rgba(124,58,237,.07)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 12px',borderBottom:'1px solid #faf5ff' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}><MessageCircle size={16} color="#7c3aed"/><h2 style={{ fontWeight:800,fontSize:13,color:'#475569',textTransform:'uppercase',letterSpacing:0.5,margin:0 }}>Mensajes del terapeuta</h2></div>
            <span style={{ background:'#f5f3ff',color:'#7c3aed',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,border:'1px solid #ddd6fe' }}>{parentMessages.length} nuevo{parentMessages.length!==1?'s':''}</span>
          </div>
          <div>
            {parentMessages.map((msg:any,idx:number)=>(
              <div key={idx} style={{ padding:'14px 20px',borderBottom:idx<parentMessages.length-1?'1px solid #faf5ff':'none' }}>
                <p style={{ fontSize:11,fontWeight:700,color:'#94a3b8',margin:'0 0 3px' }}>{msg.created_at?new Date(msg.created_at).toLocaleDateString(toBCP47(locale),{dateStyle:'medium'}):''}</p>
                <p style={{ fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 4px' }}>{msg.title||msg.subject||'Mensaje del terapeuta'}</p>
                <p style={{ fontSize:13,color:'#64748b',lineHeight:1.5,margin:0,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{msg.body||msg.message||msg.content||''}</p>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px' }}>
            <button onClick={()=>onChangeView('mensajes')} style={{ width:'100%',padding:'10px',background:'#f5f3ff',color:'#7c3aed',border:'1.5px solid #ddd6fe',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><MessageCircle size={14}/>Ver todos los mensajes</button>
          </div>
        </div>
      )}
    </div>
  )
}
