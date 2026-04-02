'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MessageCircle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Sparkles, RefreshCw, Home, Target, BookOpen, Star, Info, Calendar
} from 'lucide-react'

interface Notification {
  id: string; title: string; message: string; type: string
  is_read: boolean; created_at: string
  metadata?: { source?: string; source_title?: string; child_id?: string; ai_analysis?: any; form_type?: string }
}

const SOURCE: Record<string,{label:string;emoji:string;grad:string;text:string}> = {
  parent_form:    { label:'Formulario respondido', emoji:'📝', grad:'linear-gradient(135deg,#3b82f6,#1d4ed8)', text:'#1e40af' },
  session_report: { label:'Reporte de sesión',     emoji:'📊', grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)', text:'#5b21b6' },
  neuroforma:     { label:'NeuroForma',             emoji:'🧠', grad:'linear-gradient(135deg,#6366f1,#4338ca)', text:'#3730a3' },
  evaluacion:     { label:'Evaluación clínica',     emoji:'📋', grad:'linear-gradient(135deg,#0891b2,#0e7490)', text:'#164e63' },
  entorno_hogar:  { label:'Entorno del hogar',      emoji:'🏠', grad:'linear-gradient(135deg,#059669,#047857)', text:'#064e3b' },
  parent_message: { label:'Mensaje del terapeuta',  emoji:'💬', grad:'linear-gradient(135deg,#7c3aed,#5b21b6)', text:'#4c1d95' },
}

function AnalysisCard({ analysis }: { analysis: any }) {
  if (!analysis) return null
  const { resumen_ejecutivo, areas_fortaleza, areas_trabajo, actividades_en_casa, recomendaciones } = analysis
  if (!resumen_ejecutivo && !areas_fortaleza?.length) return null
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12,marginTop:16 }}>
      {resumen_ejecutivo && (
        <div style={{ background:'linear-gradient(135deg,#f8fafc,#f0f9ff)',borderRadius:18,border:'1px solid #bae6fd',padding:'16px 18px' }}>
          <p style={{ fontSize:10,fontWeight:800,color:'#0284c7',textTransform:'uppercase',letterSpacing:1,margin:'0 0 8px',display:'flex',alignItems:'center',gap:6 }}><Info size={12}/>Resumen clínico</p>
          <p style={{ fontSize:14,color:'#334155',lineHeight:1.7,margin:0,fontWeight:500 }}>{resumen_ejecutivo}</p>
        </div>
      )}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12 }}>
        {areas_fortaleza?.length>0 && (
          <div style={{ background:'#f0fdf4',borderRadius:18,border:'1px solid #bbf7d0',padding:'14px 16px' }}>
            <p style={{ fontSize:10,fontWeight:800,color:'#15803d',textTransform:'uppercase',letterSpacing:1,margin:'0 0 10px',display:'flex',alignItems:'center',gap:6 }}><Star size={12}/>Fortalezas</p>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {areas_fortaleza.slice(0,4).map((f:string,i:number)=>(
                <div key={i} style={{ background:'#fff',borderRadius:12,padding:'8px 12px',border:'1px solid #dcfce7',fontSize:13,color:'#1e293b',display:'flex',alignItems:'flex-start',gap:6 }}>
                  <span style={{ color:'#16a34a',fontWeight:800,flexShrink:0 }}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
        )}
        {areas_trabajo?.length>0 && (
          <div style={{ background:'#fff7ed',borderRadius:18,border:'1px solid #fed7aa',padding:'14px 16px' }}>
            <p style={{ fontSize:10,fontWeight:800,color:'#c2410c',textTransform:'uppercase',letterSpacing:1,margin:'0 0 10px',display:'flex',alignItems:'center',gap:6 }}><Target size={12}/>En desarrollo</p>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {areas_trabajo.slice(0,4).map((a:string,i:number)=>(
                <div key={i} style={{ background:'#fff',borderRadius:12,padding:'8px 12px',border:'1px solid #fed7aa',fontSize:13,color:'#1e293b',display:'flex',alignItems:'flex-start',gap:6 }}>
                  <span style={{ color:'#ea580c',fontWeight:800,flexShrink:0 }}>→</span>{a}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {actividades_en_casa?.length>0 && (
        <div style={{ background:'#eff6ff',borderRadius:18,border:'1px solid #bfdbfe',padding:'14px 16px' }}>
          <p style={{ fontSize:10,fontWeight:800,color:'#1d4ed8',textTransform:'uppercase',letterSpacing:1,margin:'0 0 10px',display:'flex',alignItems:'center',gap:6 }}><Home size={12}/>Actividades en casa</p>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {actividades_en_casa.map((a:string,i:number)=>(
              <div key={i} style={{ background:'#fff',borderRadius:12,padding:'10px 12px',border:'1px solid #bfdbfe',fontSize:13,color:'#1e293b',display:'flex',alignItems:'flex-start',gap:10 }}>
                <span style={{ width:22,height:22,background:'#2563eb',color:'#fff',borderRadius:'50%',fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{i+1}</span>{a}
              </div>
            ))}
          </div>
        </div>
      )}
      {recomendaciones?.length>0 && (
        <div style={{ background:'#faf5ff',borderRadius:18,border:'1px solid #ddd6fe',padding:'14px 16px' }}>
          <p style={{ fontSize:10,fontWeight:800,color:'#6d28d9',textTransform:'uppercase',letterSpacing:1,margin:'0 0 10px',display:'flex',alignItems:'center',gap:6 }}><BookOpen size={12}/>Recomendaciones</p>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            {recomendaciones.slice(0,3).map((r:string,i:number)=>(
              <div key={i} style={{ background:'#fff',borderRadius:12,padding:'8px 12px',border:'1px solid #ddd6fe',fontSize:13,color:'#1e293b',display:'flex',alignItems:'flex-start',gap:6 }}>
                <span style={{ flexShrink:0 }}>💡</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MensajesView({ profile }: { profile: any }) {
  const { t, locale } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string|null>(null)

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*').eq('user_id',profile.id).order('created_at',{ascending:false})
    if (data) {
      setNotifications(data)
      const unread = data.filter(n=>!n.is_read).map(n=>n.id)
      if (unread.length) await supabase.from('notifications').update({is_read:true}).in('id',unread)
    }
    setLoading(false)
  }
  useEffect(()=>{ load() },[profile?.id])

  if (loading) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',gap:12 }}>
      <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid #e2e8f0',borderTop:'3px solid #7c3aed',animation:'spin 1s linear infinite' }}/>
      <p style={{ fontSize:13,color:'#94a3b8' }}>Cargando mensajes...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16,paddingBottom:32,width:'100%',minHeight:'calc(100vh - 180px)' }}>
      <style>{`
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .msg-card{animation:fadeUp .35s ease both}
  @media(min-width:640px){
    .msg-analysis-grid{grid-template-columns:repeat(2,1fr)!important}
  }
  @media(max-width:380px){
    .msg-card-inner{flex-direction:column!important;gap:10px!important}
  }
`}</style>

      {/* Header */}
      <div className="msg-card" style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#3730a3 50%,#4f46e5 100%)',borderRadius:28,padding:'24px',color:'#fff',boxShadow:'0 20px 60px rgba(79,70,229,.3)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-20,right:-20,width:140,height:140,background:'radial-gradient(circle,rgba(255,255,255,.1),transparent 70%)',borderRadius:'50%' }}/>
        <div style={{ position:'relative',zIndex:1 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                <div style={{ width:36,height:36,background:'rgba(255,255,255,.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}><MessageCircle size={18}/></div>
                <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:'rgba(255,255,255,.7)' }}>Centro de mensajes</span>
              </div>
              <h1 style={{ fontSize:22,fontWeight:900,margin:'0 0 4px',letterSpacing:'-0.5px' }}>Mensajes del terapeuta</h1>
              <p style={{ fontSize:12,color:'rgba(255,255,255,.65)',margin:0,lineHeight:1.5 }}>Análisis, reportes y recomendaciones clínicas personalizadas.</p>
            </div>
            <button onClick={load} style={{ width:38,height:38,borderRadius:12,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <RefreshCw size={16}/>
            </button>
          </div>
          {notifications.length>0 && (
            <div style={{ display:'flex',gap:12,marginTop:16 }}>
              {[['Total',notifications.length],['Sin leer',notifications.filter(n=>!n.is_read).length]].map(([l,v])=>(
                <div key={l as string} style={{ background:'rgba(255,255,255,.15)',backdropFilter:'blur(8px)',borderRadius:12,padding:'8px 14px',textAlign:'center' }}>
                  <div style={{ fontSize:20,fontWeight:900,lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:10,color:'rgba(255,255,255,.7)',fontWeight:700,marginTop:1 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {notifications.length===0 ? (
        <div className="msg-card" style={{ background:'#fff',borderRadius:24,border:'1.5px solid #f1f5f9',padding:'56px 24px',textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
          <div style={{ width:64,height:64,background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}><MessageCircle size={28} color="#a78bfa"/></div>
          <p style={{ fontWeight:800,fontSize:15,color:'#475569',margin:'0 0 8px' }}>Sin mensajes aún</p>
          <p style={{ fontSize:13,color:'#94a3b8',lineHeight:1.6,maxWidth:280,margin:'0 auto' }}>Cuando el terapeuta te envíe un análisis o recomendación, aparecerá aquí con todos los detalles.</p>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          {notifications.map((noti,idx)=>{
            const open = expanded===noti.id
            const meta = noti.metadata||{}
            const src = SOURCE[meta.source||noti.type||'parent_message']||SOURCE.parent_message
            return (
              <div key={noti.id} className="msg-card" style={{ animationDelay:`${idx*.06}s`,background:'#fff',borderRadius:22,border:`1.5px solid ${!noti.is_read?'#c4b5fd':'#f1f5f9'}`,overflow:'hidden',boxShadow:`0 4px 20px rgba(0,0,0,.04)` }}>
                <div onClick={()=>setExpanded(open?null:noti.id)} style={{ padding:'16px 18px',cursor:'pointer',transition:'background .15s' }} onMouseEnter={e=>(e.currentTarget as any).style.background='#faf5ff'} onMouseLeave={e=>(e.currentTarget as any).style.background='transparent'}>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
                    <div style={{ width:48,height:48,borderRadius:14,background:src.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 4px 12px rgba(0,0,0,.15)' }}>{src.emoji}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4 }}>
                        <p style={{ fontWeight:800,fontSize:14,color:'#0f172a',margin:0 }}>{meta.source_title||noti.title||'Mensaje del terapeuta'}</p>
                        {!noti.is_read && <span style={{ background:'#7c3aed',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,letterSpacing:.5 }}>NUEVO</span>}
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:src.text,background:`${src.grad.split(',')[0].replace('linear-gradient(135deg,','')}15`,padding:'3px 10px',borderRadius:20 }}>{src.label}</span>
                        <span style={{ fontSize:11,color:'#94a3b8',display:'flex',alignItems:'center',gap:4 }}><Calendar size={11}/>{new Date(noti.created_at).toLocaleDateString(toBCP47(locale),{dateStyle:'medium'})}</span>
                      </div>
                      <p style={{ fontSize:13,color:'#64748b',lineHeight:1.5,margin:0,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:open?100:2,WebkitBoxOrient:'vertical' }}>{noti.message}</p>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0 }}>
                      {noti.is_read ? <CheckCircle2 size={16} color="#10b981"/> : <div style={{ width:12,height:12,borderRadius:'50%',background:'#7c3aed',animation:'pulse 2s infinite' }}/>}
                      <div style={{ padding:6,borderRadius:8,background:'#f8fafc',color:'#94a3b8' }}>{open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
                    </div>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop:'1.5px solid #f5f3ff',background:'#faf5ff',padding:'16px 18px' }}>
                    <div style={{ background:src.grad,borderRadius:18,padding:'18px 20px',color:'#fff' }}>
                      <p style={{ fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:'rgba(255,255,255,.65)',margin:'0 0 10px',display:'flex',alignItems:'center',gap:6 }}><MessageCircle size={11}/>Mensaje de tu terapeuta</p>
                      <p style={{ fontSize:14,lineHeight:1.7,margin:0,fontWeight:500,whiteSpace:'pre-wrap' }}>{noti.message}</p>
                    </div>
                    {meta.ai_analysis && <AnalysisCard analysis={meta.ai_analysis}/>}
                    <div style={{ marginTop:12,display:'flex',alignItems:'center',gap:8,background:'#fff',borderRadius:14,padding:'10px 14px',border:'1px solid #f1f5f9' }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink:0 }}/>
                      <span style={{ fontSize:12,color:'#64748b' }}>Este mensaje ha sido revisado y marcado como leído.</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}
