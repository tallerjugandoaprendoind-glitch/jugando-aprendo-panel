'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  ChevronRight, HelpCircle, Lock, LogOut, Mail, Phone, User,
  Check, Unlink, Loader2, CalendarDays, Shield, Star, Settings,
  Bell, MessageCircle, Heart, CheckCircle, AlertCircle, X
} from 'lucide-react'
import { InfoRow, HelpItem } from './shared'

function CalBtn({ label, icon, grad, profile, apiBase, paramKey, role='padre' }: any) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading'|'connected'|'disconnected'>('loading')
  const [email, setEmail] = useState<string|null>(null)
  const [connecting, setConnecting] = useState(false)

  const check = async () => {
    if (!profile?.id) return
    try {
      const r = await fetch(`/api/${apiBase}?action=status&userId=${profile.id}`)
      const d = await r.json()
      setStatus(d.connected?'connected':'disconnected'); setEmail(d.email||null)
    } catch { setStatus('disconnected') }
  }
  useEffect(()=>{
    check()
    const p = new URLSearchParams(window.location.search)
    const v = p.get(paramKey)
    if (v==='connected') { toast.success(`✅ ${label} conectado.`); check(); window.history.replaceState({},'',window.location.pathname) }
    else if (v==='error') { toast.error(`Error al conectar ${label}`); window.history.replaceState({},'',window.location.pathname) }
  },[profile?.id])

  const connect = async () => {
    if (!profile?.id) return; setConnecting(true)
    try {
      const r = await fetch(`/api/${apiBase}?action=auth-url&userId=${profile.id}&role=${role}`)
      const d = await r.json(); if (d.url) window.location.href = d.url
    } catch { toast.error('Error iniciando conexión'); setConnecting(false) }
  }
  const disconnect = async () => {
    if (!profile?.id||!confirm(`¿Desconectar ${label}?`)) return
    await fetch(`/api/${apiBase}?action=disconnect&userId=${profile.id}`)
    setStatus('disconnected'); setEmail(null); toast.success(`${label} desconectado`)
  }

  if (status==='loading') return null
  return status==='connected' ? (
    <div style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:'1px solid #f1f5f9' }}>
      <div style={{ width:42,height:42,background:grad,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,boxShadow:'0 4px 12px rgba(0,0,0,.15)',flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <p style={{ fontWeight:700,fontSize:14,color:'#1e293b',margin:0 }}>{label}</p>
        <p style={{ fontSize:12,color:'#10b981',display:'flex',alignItems:'center',gap:4,margin:'2px 0 0' }}><Check size={11}/>Conectado · <span style={{ color:'#64748b' }}>{email}</span></p>
      </div>
      <button onClick={disconnect} style={{ fontSize:12,fontWeight:700,color:'#ef4444',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'6px 12px',cursor:'pointer',flexShrink:0 }}>Quitar</button>
    </div>
  ) : (
    <button onClick={connect} disabled={connecting} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:'1px solid #f1f5f9',background:'none',border:'none',cursor:'pointer',transition:'background .15s',fontFamily:'inherit' }}
      onMouseEnter={e=>(e.currentTarget as any).style.background='#f8fafc'}
      onMouseLeave={e=>(e.currentTarget as any).style.background='transparent'}>
      <div style={{ width:42,height:42,background:`${grad.replace('linear-gradient(135deg,','').split(',')[0]}18`,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>
        {connecting?<Loader2 size={18} style={{ animation:'spin 1s linear infinite' }} color="#64748b"/>:icon}
      </div>
      <div style={{ textAlign:'left',flex:1,minWidth:0 }}>
        <p style={{ fontWeight:700,fontSize:14,color:'#1e293b',margin:0 }}>{connecting?'Conectando...':label}</p>
        <p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>Sincronizá tus citas automáticamente</p>
      </div>
      {!connecting&&<ChevronRight size={18} color="#cbd5e1" style={{ flexShrink:0 }}/>}
    </button>
  )
}

function MenuItem({ icon, label, sub, onClick, danger=false, badge='' }: any) {
  return (
    <button onClick={onClick} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 20px',background:'none',border:'none',borderBottom:'1px solid #f1f5f9',cursor:'pointer',transition:'background .15s',fontFamily:'inherit' }}
      onMouseEnter={e=>(e.currentTarget as any).style.background=danger?'#fff5f5':'#f8fafc'}
      onMouseLeave={e=>(e.currentTarget as any).style.background='transparent'}>
      <div style={{ width:42,height:42,borderRadius:13,background:danger?'#fef2f2':'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1,textAlign:'left' }}>
        <p style={{ fontWeight:700,fontSize:14,color:danger?'#ef4444':'#1e293b',margin:0 }}>{label}</p>
        {sub&&<p style={{ fontSize:12,color:'#94a3b8',margin:'2px 0 0' }}>{sub}</p>}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
        {badge&&<span style={{ background:'#7c3aed',color:'#fff',fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:20 }}>{badge}</span>}
        {!danger&&<ChevronRight size={16} color="#cbd5e1"/>}
      </div>
    </button>
  )
}

function WhatsAppSection({ profile, onUpdated }: { profile: any; onUpdated: (p: string) => void }) {
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(!profile?.phone)

  const handleSave = async () => {
    if (!phone.trim()) { setError('Ingresá tu número'); return }
    const clean = phone.replace(/\s/g, '')
    if (!clean.startsWith('+') || clean.length < 10) {
      setError('Incluí el código de país, ej: +51 924 807 183'); return
    }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ phone: clean, wsp_notif: true, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (err) throw err
      setSaved(true); setEditing(false); onUpdated(clean)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleRemove = async () => {
    if (!confirm('¿Desactivar notificaciones WhatsApp?')) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ phone: null, wsp_notif: false }).eq('id', profile.id)
      setPhone(''); setEditing(true); onUpdated('')
    } finally { setSaving(false) }
  }

  const hasPhone = !!profile?.phone && !editing

  return (
    <div style={{ background:'#fff', borderRadius:22, border:'1.5px solid #f1f5f9', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
      <div style={{ padding:'14px 20px 10px' }}>
        <p style={{ fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,margin:0 }}>Notificaciones WhatsApp</p>
      </div>

      {hasPhone ? (
        <div style={{ padding:'12px 20px 16px' }}>
          {/* Estado activo */}
          <div style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 14px',background:'linear-gradient(135deg,#f0fdf4,#dcfce7)',borderRadius:16,border:'1.5px solid #86efac',marginBottom:12 }}>
            <div style={{ width:40,height:40,background:'linear-gradient(135deg,#22c55e,#16a34a)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>📱</div>
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontWeight:800,fontSize:13,color:'#15803d',margin:0,display:'flex',alignItems:'center',gap:5 }}>
                <CheckCircle size={13}/> Activo
              </p>
              <p style={{ fontSize:12,color:'#16a34a',margin:'2px 0 0',fontWeight:600 }}>{profile?.phone}</p>
            </div>
            <div style={{ display:'flex',gap:6 }}>
              <button onClick={() => setEditing(true)} style={{ fontSize:11,fontWeight:700,color:'#6d28d9',background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:10,padding:'6px 10px',cursor:'pointer' }}>Cambiar</button>
              <button onClick={handleRemove} disabled={saving} style={{ fontSize:11,fontWeight:700,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'6px 10px',cursor:'pointer' }}>Quitar</button>
            </div>
          </div>
          {/* Qué recibirá */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6 }}>
            {['📅 Nueva cita agendada','❌ Cita cancelada','📊 Informe disponible','💬 Mensaje del terapeuta'].map(item => (
              <div key={item} style={{ fontSize:11,color:'#64748b',fontWeight:600,padding:'6px 10px',background:'#f8fafc',borderRadius:10,display:'flex',alignItems:'center',gap:6 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding:'4px 20px 16px' }}>
          <p style={{ fontSize:12,color:'#64748b',lineHeight:1.5,margin:'0 0 12px' }}>
            Ingresá tu número con código de país para recibir alertas importantes.
          </p>
          <div style={{ display:'flex',gap:8,marginBottom:error?8:0 }}>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              placeholder="+51 924 807 183"
              style={{ flex:1,padding:'11px 14px',borderRadius:14,border:`1.5px solid ${error?'#fca5a5':'#e2e8f0'}`,fontSize:13,fontWeight:600,color:'#1e293b',outline:'none',fontFamily:'inherit',background:'#f8fafc' }}
              onKeyDown={e => e.key==='Enter' && handleSave()}
            />
            <button onClick={handleSave} disabled={saving} style={{ padding:'11px 18px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontWeight:700,fontSize:13,cursor:saving?'not-allowed':'pointer',flexShrink:0,display:'flex',alignItems:'center',gap:6,fontFamily:'inherit',boxShadow:'0 4px 12px rgba(34,197,94,.3)' }}>
              {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Check size={14}/>}
              {saving ? '' : 'Activar'}
            </button>
          </div>
          {error && <p style={{ fontSize:11,color:'#dc2626',margin:'4px 0 0',fontWeight:600 }}>{error}</p>}
          {saved && <p style={{ fontSize:11,color:'#16a34a',margin:'6px 0 0',fontWeight:700,display:'flex',alignItems:'center',gap:5 }}><CheckCircle size={11}/>¡Listo! Notificaciones activadas</p>}
          <p style={{ fontSize:10,color:'#cbd5e1',margin:'8px 0 0' }}>Perú: +51 · Colombia: +57 · México: +52 · España: +34 · Tu número no se comparte con terceros.</p>
        </div>
      )}
    </div>
  )
}

function ProfileView({ profile, onLogout, onChangePass, onEditProfile, onPrivacy, onHelp, onPhoneUpdated }: any) {
  const { t } = useI18n()
  const initial = profile?.full_name?.charAt(0)||'U'
  const name = profile?.full_name||'Usuario'
  const email = profile?.email||'—'
  const phone = profile?.phone

  return (
    <div className="flex flex-col gap-5 pb-10 w-full">
      <style>{`
        @keyframes pv-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pv-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pv-card{animation:pv-in .3s ease both}
        .pv-card:nth-child(1){animation-delay:.04s}.pv-card:nth-child(2){animation-delay:.08s}
        .pv-card:nth-child(3){animation-delay:.12s}.pv-card:nth-child(4){animation-delay:.16s}
      `}</style>

      {/* ── HEADER ── */}
      <div className="pv-card flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={17} className="text-indigo-600"/>
          </div>
          Mi Perfil
        </h1>
      </div>

      {/* ── PROFILE CARD — specialist style ── */}
      <div className="pv-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg text-slate-800 leading-tight">{name}</h2>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5"><Mail size={12}/>{email}</p>
            {phone
              ? <p className="text-sm text-emerald-600 font-semibold mt-0.5 flex items-center gap-1.5"><Phone size={12}/>{phone}</p>
              : <button onClick={onEditProfile} className="text-xs text-amber-600 font-bold mt-0.5 flex items-center gap-1 hover:text-amber-700 transition-colors bg-none border-none cursor-pointer p-0">📱 Agrega tu WhatsApp</button>
            }
          </div>
          <button onClick={onEditProfile} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 flex-shrink-0">
            <Settings size={16}/>
          </button>
        </div>
      </div>

      {/* ── MI CUENTA ── */}
      <div className="pv-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mi cuenta</p>
        </div>
        <MenuItem icon={<User size={17} color="#7c3aed"/>} label="Editar perfil" sub="Nombre y teléfono" onClick={onEditProfile}/>
        <MenuItem icon={<Lock size={17} color="#3b82f6"/>} label="Cambiar contraseña" sub="Actualizar acceso" onClick={onChangePass}/>
        <MenuItem icon={<Shield size={17} color="#8b5cf6"/>} label="Privacidad y seguridad" sub="Gestión de datos" onClick={onPrivacy}/>
        <MenuItem icon={<HelpCircle size={17} color="#10b981"/>} label="Centro de ayuda" sub="Guías y soporte" onClick={onHelp}/>
      </div>

      {/* ── CALENDARIOS ── */}
      <div className="pv-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calendarios vinculados</p>
          <p className="text-xs text-slate-300 mt-0.5">Tus citas aparecerán automáticamente</p>
        </div>
        <CalBtn label="Google Calendar" icon="📅" grad="linear-gradient(135deg,#4285f4,#1a73e8)" profile={profile} apiBase="google-calendar" paramKey="gcal"/>
        <CalBtn label="Outlook Calendar" icon={<svg width="16" height="16" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>} grad="linear-gradient(135deg,#0078d4,#106ebe)" profile={profile} apiBase="microsoft-calendar" paramKey="mscal"/>
      </div>

      {/* ── WHATSAPP ── */}
      <div className="pv-card">
        <WhatsAppSection profile={profile} onUpdated={onPhoneUpdated || (()=>{})}/>
      </div>

      {/* ── APP INFO ── */}
      <div className="pv-card bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Versión</p>
          <p className="font-black text-xl text-slate-800 leading-none">2.0.0</p>
          <p className="text-xs text-slate-400 mt-1">Jugando Aprendo · Portal de familias</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center">
          <Star size={20} className="text-indigo-500"/>
        </div>
      </div>

      {/* ── CERRAR SESIÓN ── */}
      <div className="pv-card bg-white rounded-2xl border border-red-100 overflow-hidden">
        <MenuItem icon={<LogOut size={17} color="#ef4444"/>} label="Cerrar sesión" danger onClick={onLogout}/>
      </div>
    </div>
  )
}

export default ProfileView
