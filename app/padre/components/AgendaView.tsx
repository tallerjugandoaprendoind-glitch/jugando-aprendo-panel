'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Phone, Mail, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ST: Record<string,{label:string;dot:string;bg:string;text:string;Icon:any}> = {
  confirmed: { label:'Confirmada', dot:'#10b981', bg:'#f0fdf4', text:'#15803d', Icon:CheckCircle2 },
  pending:   { label:'Pendiente',  dot:'#f59e0b', bg:'#fffbeb', text:'#b45309', Icon:AlertCircle },
  cancelled: { label:'Cancelada',  dot:'#ef4444', bg:'#fef2f2', text:'#dc2626', Icon:XCircle },
  completed: { label:'Completada', dot:'#6366f1', bg:'#f5f3ff', text:'#4338ca', Icon:CheckCircle2 },
}
const MONTHS_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function AgendaView({ selectedChild }: { selectedChild?: any }) {
  const { t } = useI18n()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (!selectedChild?.id) { setLoading(false); return }
    setLoading(true)
    supabase.from('appointments').select('*').eq('child_id',selectedChild.id)
      .order('appointment_date',{ascending:true})
      .then(({data})=>{ setCitas(data||[]); setLoading(false) })
  },[selectedChild])

  const today = new Date().toISOString().split('T')[0]
  const proximas = citas.filter(c=>c.appointment_date>=today&&c.status!=='cancelled')
  const pasadas  = citas.filter(c=>c.appointment_date<today||c.status==='completed')

  if (!selectedChild) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:10 }}>
      <div style={{ width:64,height:64,background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center' }}><Calendar size={28} color="#a78bfa"/></div>
      <p style={{ fontWeight:700,fontSize:14,color:'#94a3b8',margin:0 }}>Seleccioná un niño/a para ver sus citas</p>
    </div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14,paddingBottom:16 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.av-card{animation:fadeUp .35s ease both}`}</style>

      {/* Header */}
      <div className="av-card" style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)',borderRadius:24,padding:'20px 22px',color:'#fff',boxShadow:'0 16px 50px rgba(79,70,229,.3)',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-20,right:-20,width:100,height:100,background:'rgba(255,255,255,.08)',borderRadius:'50%' }}/>
        <div style={{ position:'relative',zIndex:1 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}><Calendar size={15}/><span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:1.2,color:'rgba(255,255,255,.7)' }}>Agenda de citas</span></div>
          <h2 style={{ fontSize:20,fontWeight:900,margin:'0 0 4px' }}>Citas de {selectedChild?.name}</h2>
          <p style={{ fontSize:12,color:'rgba(255,255,255,.65)',margin:0 }}>Programadas por el equipo del centro terapéutico</p>
        </div>
      </div>

      {/* Info contacto */}
      <div className="av-card" style={{ background:'#f0f9ff',border:'1.5px solid #bae6fd',borderRadius:18,padding:'12px 16px',display:'flex',alignItems:'flex-start',gap:10 }}>
        <Info size={15} color="#0284c7" style={{ flexShrink:0,marginTop:1 }}/>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:'#0369a1',margin:'0 0 2px' }}>¿Necesitás cambiar una cita?</p>
          <p style={{ fontSize:12,color:'#0284c7',margin:'0 0 8px' }}>Contactá directamente con el centro.</p>
          <div style={{ display:'flex',flexWrap:'wrap',gap:12 }}>
            <a href="tel:+51924807183" style={{ fontSize:12,fontWeight:700,color:'#0369a1',display:'flex',alignItems:'center',gap:4,textDecoration:'none' }}><Phone size={11}/>+51 924 807 183</a>
            <a href="mailto:tallerjugandoaprendoind@gmail.com" style={{ fontSize:12,fontWeight:700,color:'#0369a1',display:'flex',alignItems:'center',gap:4,textDecoration:'none' }}><Mail size={11}/>Email</a>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:'40px 0' }}>
          <div style={{ width:32,height:32,borderRadius:'50%',border:'3px solid #e2e8f0',borderTop:'3px solid #7c3aed',animation:'spin 1s linear infinite' }}/>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          <div className="av-card">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
              <p style={{ fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,margin:0 }}>Próximas ({proximas.length})</p>
            </div>
            {proximas.length===0 ? (
              <div style={{ background:'#f8fafc',border:'2px dashed #e2e8f0',borderRadius:18,padding:'32px 20px',textAlign:'center' }}>
                <Calendar size={28} color="#cbd5e1" style={{ margin:'0 auto 10px',display:'block' }}/>
                <p style={{ fontWeight:700,fontSize:13,color:'#94a3b8',margin:'0 0 4px' }}>Sin citas próximas</p>
                <p style={{ fontSize:12,color:'#cbd5e1',margin:0 }}>El centro te notificará cuando se asigne una nueva cita.</p>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {proximas.map(cita=>{
                  const s = ST[cita.status]||ST.confirmed; const Icon = s.Icon
                  const fecha = new Date(cita.appointment_date+'T12:00:00')
                  return (
                    <div key={cita.id} style={{ background:'#fff',borderRadius:18,border:`1.5px solid ${s.dot}30`,padding:'14px 16px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
                      <div style={{ background:`linear-gradient(135deg,#7c3aed,#4f46e5)`,color:'#fff',borderRadius:14,padding:'10px 12px',textAlign:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(124,58,237,.25)' }}>
                        <div style={{ fontSize:10,fontWeight:700,opacity:.8,textTransform:'uppercase' }}>{MONTHS_S[fecha.getMonth()]}</div>
                        <div style={{ fontSize:22,fontWeight:900,lineHeight:1.1 }}>{fecha.getDate()}</div>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontWeight:800,fontSize:14,color:'#0f172a',margin:'0 0 4px' }}>{cita.service_type||'Terapia ABA'}</p>
                        <p style={{ fontSize:12,color:'#64748b',margin:'0 0 4px',display:'flex',alignItems:'center',gap:4 }}><Clock size={11}/>{cita.appointment_time}</p>
                        {cita.notes&&<p style={{ fontSize:11,color:'#94a3b8',margin:0 }}>{cita.notes}</p>}
                      </div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.text,flexShrink:0 }}><Icon size={11}/>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {pasadas.length>0 && (
            <div className="av-card">
              <p style={{ fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,margin:'0 0 10px' }}>Historial ({pasadas.length})</p>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {pasadas.slice(0,6).map(cita=>(
                  <div key={cita.id} style={{ borderRadius:14,border:'1px solid #f1f5f9',background:'#f8fafc',padding:'10px 14px',display:'flex',alignItems:'center',gap:10,opacity:.65 }}>
                    <Calendar size={13} color="#cbd5e1" style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:12,color:'#94a3b8' }}>
                      {new Date(cita.appointment_date+'T12:00:00').toLocaleDateString('es',{day:'2-digit',month:'short',year:'numeric'})} · {cita.appointment_time}
                    </span>
                    <span style={{ marginLeft:'auto',fontSize:11,fontWeight:600,color:'#94a3b8' }}>{cita.service_type||'Terapia'}</span>
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
