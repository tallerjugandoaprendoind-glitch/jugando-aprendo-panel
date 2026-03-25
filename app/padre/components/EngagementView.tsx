'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import { Brain, CheckCircle, Circle, Clock, Star, ChevronRight,
  Sparkles, Heart, Target, Loader2, RefreshCw, TrendingUp, Trophy, Zap } from 'lucide-react'

interface Actividad {
  titulo: string; descripcion: string; duracion_minutos: number
  dificultad: 'facil'|'media'|'alta'; area: string
  materiales_necesarios: string[]; por_que_importa: string
  dias_recomendados: string[]; completada?: boolean
}
interface Plan {
  semana: string; mensaje_motivacional: string
  actividades: Actividad[]; child_name: string; completadas_pct?: number
}

const AREA: Record<string,{bg:string;text:string;border:string}> = {
  comunicacion: { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  conducta:     { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
  habilidades:  { bg:'#faf5ff', text:'#6d28d9', border:'#ddd6fe' },
  socializacion:{ bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' },
  autonomia:    { bg:'#fffbeb', text:'#b45309', border:'#fde68a' },
}
const DIFF: Record<string,{bg:string;text:string}> = {
  facil: { bg:'#f0fdf4', text:'#16a34a' },
  media: { bg:'#fffbeb', text:'#d97706' },
  alta:  { bg:'#fef2f2', text:'#dc2626' },
}

export default function EngagementView({ childId }: { childId: string }) {
  const { t } = useI18n()
  const [plan, setPlan] = useState<Plan|null>(null)
  const [planId, setPlanId] = useState<string|null>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [expanded, setExpanded] = useState<number|null>(null)
  const [completadas, setCompletadas] = useState<Set<number>>(new Set())

  const cargar = async () => {
    setLoading(true)
    try {
      const loc = typeof window!=='undefined'?(localStorage.getItem('vanty_locale')||'es'):'es'
      const r = await fetch(`/api/engagement-padres?child_id=${childId}&locale=${loc}`)
      const j = await r.json()
      if (j.plan) {
        setPlan(j.plan); setPlanId(j.plan.id||null)
        const c = new Set<number>()
        j.plan.actividades?.forEach((a:Actividad,i:number)=>{ if(a.completada) c.add(i) })
        setCompletadas(c)
      }
      setHistorial(j.historial||[])
    } catch {}
    setLoading(false)
  }

  const generar = async () => {
    setGenerando(true)
    try {
      const loc = typeof window!=='undefined'?(localStorage.getItem('vanty_locale')||'es'):'es'
      const r = await fetch('/api/engagement-padres',{ method:'POST', headers:{'Content-Type':'application/json','x-locale':loc}, body:JSON.stringify({childId,accion:'generar_plan',locale:loc}) })
      const j = await r.json()
      if (j.error) throw new Error(j.error)
      setPlan(j.plan); setPlanId(j.plan.id||null); setCompletadas(new Set())
    } catch(e:any) { alert('Error: '+e.message) }
    setGenerando(false)
  }

  const toggle = async (idx: number) => {
    if (!plan) return
    const next = new Set(completadas)
    if (next.has(idx)) next.delete(idx); else next.add(idx)
    setCompletadas(next)
    const acts = plan.actividades.map((a,i)=>({...a,completada:next.has(i)}))
    try {
      const loc = typeof window!=='undefined'?(localStorage.getItem('vanty_locale')||'es'):'es'
      await fetch('/api/engagement-padres',{ method:'POST', headers:{'Content-Type':'application/json','x-locale':loc}, body:JSON.stringify({childId,accion:'actualizar_completadas',planId,actividades:acts,completadas_pct:Math.round(next.size/(plan.actividades.length||1)*100)}) })
    } catch {}
  }

  useEffect(()=>{ if(childId) cargar() },[childId])
  const pct = plan ? Math.round(completadas.size/(plan.actividades?.length||1)*100) : 0
  const all = plan?.actividades?.length||0

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:180 }}>
      <Loader2 size={32} color="#7c3aed" style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14,maxWidth:640,margin:'0 auto',paddingBottom:16 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.eng-card{animation:fadeUp .35s ease both}`}</style>

      {/* Header */}
      <div className="eng-card" style={{ background:'linear-gradient(135deg,#be185d 0%,#9333ea 50%,#7c3aed 100%)',borderRadius:28,padding:'22px 22px 18px',color:'#fff',boxShadow:'0 16px 50px rgba(147,51,234,.3)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-20,right:-20,width:120,height:120,background:'rgba(255,255,255,.08)',borderRadius:'50%' }}/>
        <div style={{ position:'relative',zIndex:1,display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
              <div style={{ width:32,height:32,background:'rgba(255,255,255,.2)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}><Heart size={16}/></div>
              <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:'rgba(255,255,255,.7)' }}>Actividades en casa</span>
            </div>
            <h1 style={{ fontSize:20,fontWeight:900,margin:'0 0 4px',letterSpacing:'-0.4px' }}>Plan semanal de {plan?.child_name||'tu hijo/a'}</h1>
            <p style={{ fontSize:12,color:'rgba(255,255,255,.65)',margin:0 }}>Actividades diseñadas por tu especialista con IA</p>
          </div>
          <button onClick={generar} disabled={generando} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(255,255,255,.2)',border:'none',color:'#fff',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
            {generando?<Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/>:<RefreshCw size={13}/>}
            {generando?'Generando...':'Nuevo plan'}
          </button>
        </div>
      </div>

      {!plan ? (
        <div className="eng-card" style={{ background:'#fff',borderRadius:22,border:'1.5px solid #f1f5f9',padding:'48px 24px',textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
          <div style={{ width:64,height:64,background:'linear-gradient(135deg,#fce7f3,#ede9fe)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}><Brain size={28} color="#9333ea"/></div>
          <p style={{ fontWeight:800,fontSize:15,color:'#475569',margin:'0 0 6px' }}>Sin plan esta semana</p>
          <p style={{ fontSize:13,color:'#94a3b8',lineHeight:1.6,maxWidth:260,margin:'0 auto 20px' }}>La IA generará actividades basadas en el progreso terapéutico de tu hijo/a.</p>
          <button onClick={generar} disabled={generando} style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#be185d,#7c3aed)',color:'#fff',border:'none',padding:'11px 20px',borderRadius:14,fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 16px rgba(147,51,234,.3)' }}>
            <Sparkles size={15}/>{generando?'Generando...':'Generar actividades'}
          </button>
        </div>
      ) : (
        <>
          {/* Disclaimer */}
          <div className="eng-card" style={{ background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:16,padding:'10px 14px',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:14,flexShrink:0 }}>📋</span>
            <p style={{ fontSize:12,color:'#0284c7',margin:0,lineHeight:1.5 }}>Plan diseñado por tu especialista con IA. Consultá con el terapeuta ante cualquier duda.</p>
          </div>

          {/* Motivación */}
          <div className="eng-card" style={{ background:'linear-gradient(135deg,#faf5ff,#fce7f3)',border:'1.5px solid #ddd6fe',borderRadius:18,padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:10 }}>
            <Sparkles size={18} color="#7c3aed" style={{ flexShrink:0,marginTop:1 }}/>
            <p style={{ fontSize:13,color:'#6d28d9',fontWeight:600,lineHeight:1.6,margin:0 }}>{plan.mensaje_motivacional}</p>
          </div>

          {/* Progreso */}
          <div className="eng-card" style={{ background:'#fff',borderRadius:20,border:'1.5px solid #f1f5f9',padding:'16px 18px',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <TrendingUp size={16} color="#7c3aed"/>
                <span style={{ fontSize:13,fontWeight:700,color:'#475569' }}>Progreso semanal</span>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ fontSize:22,fontWeight:900,color:'#7c3aed' }}>{completadas.size}</span>
                <span style={{ fontSize:14,color:'#94a3b8',fontWeight:600 }}>/ {all}</span>
                {completadas.size===all&&all>0&&<Trophy size={18} color="#f59e0b"/>}
              </div>
            </div>
            <div style={{ height:10,background:'#f1f5f9',borderRadius:20,overflow:'hidden',marginBottom:6 }}>
              <div style={{ height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#be185d,#9333ea,#7c3aed)',borderRadius:20,transition:'width .7s cubic-bezier(.22,1,.36,1)' }}/>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>{plan.semana}</p>
              <p style={{ fontSize:12,fontWeight:700,color:pct===100?'#16a34a':'#7c3aed',margin:0 }}>{pct}% completado</p>
            </div>
            {pct===100&&<div style={{ marginTop:10,background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',border:'1px solid #bbf7d0',borderRadius:12,padding:'8px 12px',display:'flex',alignItems:'center',gap:8 }}><Trophy size={16} color="#16a34a"/><p style={{ fontSize:12,fontWeight:700,color:'#15803d',margin:0 }}>¡Semana completada! ¡Excelente trabajo! 🎉</p></div>}
          </div>

          {/* Actividades */}
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {plan.actividades?.map((act,i)=>{
              const done = completadas.has(i)
              const aCol = AREA[act.area]||{bg:'#f8fafc',text:'#64748b',border:'#e2e8f0'}
              const dCol = DIFF[act.dificultad]||{bg:'#f8fafc',text:'#64748b'}
              const open = expanded===i
              return (
                <div key={i} style={{ background:done?'#f0fdf4':'#fff',borderRadius:18,border:`1.5px solid ${done?'#bbf7d0':'#f1f5f9'}`,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.04)',transition:'all .2s' }}>
                  <div onClick={()=>setExpanded(open?null:i)} style={{ padding:'14px 16px',cursor:'pointer' }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:12 }}>
                      <button onClick={e=>{e.stopPropagation();toggle(i)}} style={{ background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0,marginTop:1 }}>
                        {done?<CheckCircle size={22} color="#10b981"/>:<Circle size={22} color="#cbd5e1"/>}
                      </button>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8 }}>
                          <p style={{ fontWeight:800,fontSize:14,color:done?'#94a3b8':'#0f172a',margin:'0 0 6px',textDecoration:done?'line-through':'none',lineHeight:1.3 }}>{act.titulo}</p>
                          <ChevronRight size={15} color="#94a3b8" style={{ flexShrink:0,transition:'transform .2s',transform:open?'rotate(90deg)':'rotate(0)' }}/>
                        </div>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                          <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:aCol.bg,color:aCol.text,border:`1px solid ${aCol.border}` }}>{act.area}</span>
                          <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:dCol.bg,color:dCol.text }}>{act.dificultad}</span>
                          <span style={{ fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',gap:3 }}><Clock size={10}/>{act.duracion_minutos} min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding:'0 16px 14px',borderTop:'1px solid #f1f5f9' }}>
                      <p style={{ fontSize:13,color:'#475569',lineHeight:1.6,margin:'12px 0 10px' }}>{act.descripcion}</p>
                      <div style={{ background:'#faf5ff',borderRadius:14,padding:'10px 12px',marginBottom:8 }}>
                        <p style={{ fontSize:11,fontWeight:700,color:'#7c3aed',margin:'0 0 4px',display:'flex',alignItems:'center',gap:5 }}><Target size={12}/>¿Por qué importa?</p>
                        <p style={{ fontSize:12,color:'#6d28d9',margin:0,lineHeight:1.5 }}>{act.por_que_importa}</p>
                      </div>
                      {act.materiales_necesarios?.length>0 && (
                        <div style={{ marginBottom:8 }}>
                          <p style={{ fontSize:11,fontWeight:700,color:'#94a3b8',margin:'0 0 5px' }}>Materiales:</p>
                          <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                            {act.materiales_necesarios.map((m,j)=><span key={j} style={{ fontSize:11,background:'#f1f5f9',color:'#475569',padding:'3px 8px',borderRadius:20 }}>{m}</span>)}
                          </div>
                        </div>
                      )}
                      {act.dias_recomendados?.length>0 && (
                        <div>
                          <p style={{ fontSize:11,fontWeight:700,color:'#94a3b8',margin:'0 0 5px' }}>Días recomendados:</p>
                          <div style={{ display:'flex',gap:4 }}>
                            {act.dias_recomendados.map((d,j)=><span key={j} style={{ fontSize:11,background:'#eff6ff',color:'#2563eb',padding:'3px 8px',borderRadius:20,textTransform:'capitalize' }}>{d}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Historial */}
          {historial.length>1 && (
            <div className="eng-card" style={{ background:'#fff',borderRadius:20,border:'1.5px solid #f1f5f9',padding:'16px 18px',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
              <p style={{ fontSize:12,fontWeight:700,color:'#475569',margin:'0 0 12px',display:'flex',alignItems:'center',gap:6 }}><TrendingUp size={14} color="#7c3aed"/>Historial de semanas</p>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {historial.slice(0,5).map((h,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <span style={{ fontSize:11,color:'#94a3b8',width:72,flexShrink:0 }}>Sem. {h.semana}</span>
                    <div style={{ flex:1,height:8,background:'#f1f5f9',borderRadius:20,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${h.completadas_pct||0}%`,background:'linear-gradient(90deg,#be185d,#7c3aed)',borderRadius:20 }}/>
                    </div>
                    <span style={{ fontSize:12,fontWeight:700,color:'#7c3aed',width:36,textAlign:'right' }}>{h.completadas_pct||0}%</span>
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
