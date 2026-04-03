'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Phone, Stethoscope, Key, Eye, EyeOff,
  Save, Loader2, Shield, CheckCircle2, Edit3, CalendarDays,
  ChevronRight, Check, Unlink, Link2, Camera, X, Lock,
  Sparkles, AlertCircle, BadgeCheck, Clock, Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

/* ─────────────────────────── Google Calendar ─────────────────────────── */
function GoogleCalendarBlock({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const check = async () => {
    try {
      const res = await fetch(`/api/google-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
      setEmail(data.email ?? null)
    } catch { setStatus('disconnected') }
  }

  useEffect(() => {
    if (!userId) return
    check()
    const p = new URLSearchParams(window.location.search)
    if (p.get('gcal') === 'connected') { toast.success('✅ Google Calendar conectado'); check(); window.history.replaceState({}, '', window.location.pathname) }
    else if (p.get('gcal') === 'error') { toast.error('Error al conectar Google Calendar'); window.history.replaceState({}, '', window.location.pathname) }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}&role=especialista`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error iniciando conexión'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return
    await fetch(`/api/google-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected'); setEmail(null)
    toast.success('Google Calendar desconectado')
  }

  if (status === 'loading') return (
    <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
  )

  const GCalIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#4285F4"/>
      <path d="M15.5 12c0 1.93-1.57 3.5-3.5 3.5S8.5 13.93 8.5 12 10.07 8.5 12 8.5s3.5 1.57 3.5 3.5z" fill="white"/>
      <path d="M12 7V5M12 19v-2M5 12H3M21 12h-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  return status === 'connected' ? (
    <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
        <GCalIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">Google Calendar</p>
        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate">
          <Check size={10} /> {email}
        </p>
      </div>
      <button onClick={disconnect} className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0">
        <Unlink size={14} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group disabled:opacity-50 text-left">
      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
        {busy ? <Loader2 size={16} className="text-blue-500 animate-spin" /> : <GCalIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">{busy ? 'Conectando...' : 'Google Calendar'}</p>
        <p className="text-[11px] text-slate-400">Sincronizar sesiones</p>
      </div>
      {!busy && <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-all flex-shrink-0" />}
    </button>
  )
}

/* ─────────────────────────── Microsoft Calendar ─────────────────────────── */
function MicrosoftCalendarBlock({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const check = async () => {
    try {
      const res = await fetch(`/api/microsoft-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
      setEmail(data.email ?? null)
    } catch { setStatus('disconnected') }
  }

  useEffect(() => {
    if (!userId) return
    check()
    const p = new URLSearchParams(window.location.search)
    if (p.get('mscal') === 'connected') { toast.success('✅ Outlook Calendar conectado'); check(); window.history.replaceState({}, '', window.location.pathname) }
    else if (p.get('mscal') === 'error') { toast.error('Error al conectar Outlook Calendar'); window.history.replaceState({}, '', window.location.pathname) }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}&role=especialista`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error iniciando conexión'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Outlook Calendar?')) return
    await fetch(`/api/microsoft-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected'); setEmail(null)
    toast.success('Outlook Calendar desconectado')
  }

  if (status === 'loading') return (
    <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
  )

  const MSIcon = () => (
    <svg width="16" height="16" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" rx="1"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" rx="1"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" rx="1"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" rx="1"/>
    </svg>
  )

  return status === 'connected' ? (
    <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
        <MSIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">Outlook Calendar</p>
        <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 truncate">
          <Check size={10} /> {email}
        </p>
      </div>
      <button onClick={disconnect} className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0">
        <Unlink size={14} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group disabled:opacity-50 text-left">
      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
        {busy ? <Loader2 size={16} className="text-blue-500 animate-spin" /> : <MSIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">{busy ? 'Conectando...' : 'Outlook Calendar'}</p>
        <p className="text-[11px] text-slate-400">Sincronizar en Outlook</p>
      </div>
      {!busy && <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-all flex-shrink-0" />}
    </button>
  )
}

/* ─────────────────────────── Componente principal ─────────────────────────── */
export default function MiPerfil({ profile, onUpdate, onAvatarUpdate }: {
  profile: any; onUpdate: () => void; onAvatarUpdate?: (url: string) => void
}) {
  const toast = useToast()
  const { t } = useI18n()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cambioPass, setCambioPass] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [datos, setDatos] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    specialty: profile?.specialty || ''
  })
  const [pass, setPass] = useState({ nueva: '', confirmar: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const userId: string | null = profile?.id ?? null

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${userId}.${ext}`
      await supabase.storage.from('store-images').upload(path, file, { upsert: true })
      const url = supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
      setAvatarUrl(url)
      onAvatarUpdate?.(url)
      toast.success('Foto actualizada ✓')
    } catch (e: any) {
      toast.error('Error al subir imagen')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase.from('profiles').update({
        ...datos,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id)
      if (error) throw error
      toast.success('Perfil actualizado ✓')
      setEditando(false)
      onUpdate()
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setGuardando(false) }
  }

  const cambiarPassword = async () => {
    if (pass.nueva.length < 6) { toast.error(t('especialista.min6Chars')); return }
    if (pass.nueva !== pass.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pass.nueva })
      if (error) throw error
      toast.success('Contraseña actualizada ✓')
      setCambioPass(false)
      setPass({ nueva: '', confirmar: '' })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setGuardando(false) }
  }

  const cancelarEdicion = () => {
    setDatos({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      specialty: profile?.specialty || ''
    })
    setEditando(false)
  }

  const inputCls = "w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all placeholder:text-slate-300 shadow-sm"
  const initial = profile?.full_name?.[0]?.toUpperCase() || 'E'

  const passwordStrength = (pwd: string) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Muy corta', color: 'bg-red-400', w: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Débil', color: 'bg-orange-400', w: 'w-2/4' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Media', color: 'bg-yellow-400', w: 'w-3/4' }
    return { label: 'Fuerte', color: 'bg-emerald-400', w: 'w-full' }
  }
  const strength = passwordStrength(pass.nueva)

  return (
    <div className="pb-20 md:pb-8 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mi Perfil</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gestiona tu información y configuración de cuenta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Hero card del especialista */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-6 text-center overflow-hidden shadow-xl shadow-blue-200/60">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8 pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-16 h-16 bg-white/5 rounded-full -translate-x-4 pointer-events-none" />

            {/* Avatar */}
            <div
              className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar"
                  className="w-24 h-24 rounded-3xl object-cover shadow-xl border-3 border-white/30" />
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-xl border-2 border-white/30">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 rounded-3xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                {uploadingAvatar
                  ? <Loader2 size={20} className="text-white animate-spin" />
                  : <>
                    <Camera size={18} className="text-white" />
                    <span className="text-white text-[10px] font-bold mt-1">Cambiar</span>
                  </>
                }
              </div>
              {/* Badge de cámara */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Camera size={12} className="text-blue-600" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <h3 className="text-xl font-black text-white leading-tight">{profile?.full_name}</h3>
            <p className="text-blue-200 text-sm font-medium mt-1 mb-4">
              {profile?.specialty || 'Especialista Clínico'}
            </p>

            {/* Badge verificado */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-4 py-2 rounded-full text-xs font-bold">
              <BadgeCheck size={13} className="text-emerald-300" />
              Especialista verificado
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/10 rounded-2xl p-2.5">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Email</p>
                <p className="text-white text-xs font-bold truncate mt-0.5">{profile?.email?.split('@')[0]}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">Rol</p>
                <p className="text-white text-xs font-bold mt-0.5">Especialista</p>
              </div>
            </div>
          </div>

          {/* Integraciones de calendario */}
          {userId && (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CalendarDays size={13} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-black text-slate-700 text-sm">Calendarios</h4>
                  <p className="text-[10px] text-slate-400">Sincroniza tus sesiones</p>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <GoogleCalendarBlock userId={userId} />
                <MicrosoftCalendarBlock userId={userId} />
              </div>
            </div>
          )}

          {/* Info de la cuenta */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-3xl border border-slate-100 p-4 space-y-2.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cuenta</p>
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Shield size={11} className="text-blue-500" />
              </div>
              <span className="font-medium">Cuenta verificada y activa</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Globe size={11} className="text-indigo-500" />
              </div>
              <span className="font-medium">Panel Especialista · Jugando Aprendo</span>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Información personal */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <User size={14} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{t('especialista.infoPersonal')}</h4>
                  <p className="text-[11px] text-slate-400">Datos visibles en tu perfil</p>
                </div>
              </div>
              {!editando && (
                <button
                  onClick={() => setEditando(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-2 rounded-xl hover:bg-blue-100 hover:border-blue-200 transition-all"
                >
                  <Edit3 size={11} /> Editar
                </button>
              )}
            </div>

            {editando ? (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Nombre completo', icon: User, key: 'full_name', placeholder: 'Tu nombre completo', type: 'text' },
                    { label: 'Teléfono', icon: Phone, key: 'phone', placeholder: '+51 999 999 999', type: 'tel' },
                    { label: t('perfil.especialidad'), icon: Stethoscope, key: 'specialty', placeholder: 'Ej: Terapeuta ABA', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <f.icon size={10} /> {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={(datos as any)[f.key]}
                        onChange={e => setDatos(d => ({ ...d, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={cancelarEdicion}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm disabled:opacity-50 shadow-md shadow-blue-200 transition-all"
                  >
                    {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {[
                  { label: 'Email', icon: Mail, value: profile?.email, accent: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: t('common.nombre'), icon: User, value: profile?.full_name, accent: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Teléfono', icon: Phone, value: profile?.phone || 'No registrado', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: t('perfil.especialidad'), icon: Stethoscope, value: profile?.specialty || 'No registrado', accent: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 ${item.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={16} className={item.accent} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className={`text-sm font-semibold mt-0.5 truncate ${item.value === 'No registrado' ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                        {item.value}
                      </p>
                    </div>
                    {item.value !== 'No registrado' && item.label !== 'Email' && (
                      <div className="flex-shrink-0">
                        <Check size={13} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seguridad / Contraseña */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <button
              onClick={() => setCambioPass(!cambioPass)}
              className="w-full px-6 py-4 flex items-center gap-3.5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Lock size={15} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-800">{t('ui.change_password')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Actualiza tu contraseña de acceso</p>
              </div>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${cambioPass ? 'bg-slate-100 rotate-180' : 'bg-slate-50'}`}>
                <ChevronRight size={13} className={`text-slate-400 transition-transform ${cambioPass ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {cambioPass && (
              <div className="border-t border-slate-50 px-6 pb-6 pt-4 space-y-4">

                {/* Alerta info */}
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Usa al menos 8 caracteres, una mayúscula y un número para una contraseña segura.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nueva contraseña */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={pass.nueva}
                      onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className={`${inputCls} pr-12`}
                    />
                    <button
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Indicador de fortaleza */}
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                      </div>
                      <p className={`text-[10px] font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={pass.confirmar}
                      onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
                      placeholder="Repite la contraseña"
                      className={`${inputCls} pr-12 ${pass.confirmar && pass.nueva !== pass.confirmar ? 'border-red-200 focus:ring-red-400/40' : ''}`}
                    />
                    <button
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pass.confirmar && pass.nueva !== pass.confirmar && (
                    <p className="text-[11px] text-red-400 font-semibold mt-1.5 flex items-center gap-1">
                      <X size={10} /> Las contraseñas no coinciden
                    </p>
                  )}
                  {pass.confirmar && pass.nueva === pass.confirmar && pass.nueva.length >= 6 && (
                    <p className="text-[11px] text-emerald-500 font-semibold mt-1.5 flex items-center gap-1">
                      <Check size={10} /> Las contraseñas coinciden
                    </p>
                  )}
                </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setCambioPass(false); setPass({ nueva: '', confirmar: '' }) }}
                    className="px-4 py-3 rounded-2xl font-bold text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={cambiarPassword}
                    disabled={guardando || pass.nueva !== pass.confirmar || pass.nueva.length < 6}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm disabled:opacity-40 shadow-md shadow-amber-100 transition-all"
                  >
                    {guardando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Actualizar contraseña
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zona de peligro — placeholder deshabilitado visualmente */}
          <div className="bg-red-50/50 rounded-3xl border border-red-100 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle size={14} className="text-red-400" />
              </div>
              <div>
                <h4 className="font-black text-sm text-red-600">Zona de peligro</h4>
                <p className="text-[11px] text-red-400">Acciones irreversibles sobre tu cuenta</p>
              </div>
            </div>
            <p className="text-xs text-red-400/70 mt-2 ml-11">
              Para eliminar o desactivar tu cuenta, contacta con el administrador del sistema.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
