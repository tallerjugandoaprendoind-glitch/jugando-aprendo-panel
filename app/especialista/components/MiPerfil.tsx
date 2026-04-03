'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Phone, Stethoscope, Eye, EyeOff,
  Save, Loader2, CheckCircle2, Edit3, CalendarDays,
  ChevronRight, Check, Unlink, Camera, X, Lock,
  AlertCircle, BadgeCheck, Globe, Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

/* ─── Google Calendar ─── */
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

  if (status === 'loading') return <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />

  const GCalIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M20 3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#4285F4"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  )

  return status === 'connected' ? (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <GCalIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">Google Calendar</p>
        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 truncate"><Check size={9} />{email}</p>
      </div>
      <button onClick={disconnect} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
        <Unlink size={12} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group disabled:opacity-50 text-left">
      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        {busy ? <Loader2 size={13} className="text-blue-500 animate-spin" /> : <GCalIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">{busy ? 'Conectando...' : 'Google Calendar'}</p>
        <p className="text-[10px] text-slate-400">Sincronizar sesiones</p>
      </div>
      {!busy && <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />}
    </button>
  )
}

/* ─── Microsoft Calendar ─── */
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

  if (status === 'loading') return <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />

  const MSIcon = () => (
    <svg width="13" height="13" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" rx="1"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" rx="1"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" rx="1"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" rx="1"/>
    </svg>
  )

  return status === 'connected' ? (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <MSIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">Outlook Calendar</p>
        <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1 truncate"><Check size={9} />{email}</p>
      </div>
      <button onClick={disconnect} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
        <Unlink size={12} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group disabled:opacity-50 text-left">
      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        {busy ? <Loader2 size={13} className="text-blue-500 animate-spin" /> : <MSIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">{busy ? 'Conectando...' : 'Outlook Calendar'}</p>
        <p className="text-[10px] text-slate-400">Sincronizar en Outlook</p>
      </div>
      {!busy && <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />}
    </button>
  )
}

/* ─── Fila de campo info ─── */
function InfoRow({ label, icon: Icon, value, accent, bg }: {
  label: string; icon: any; value: string; accent: string; bg: string
}) {
  const empty = value === 'No registrado'
  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={13} className={accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${empty ? 'text-slate-300 italic' : 'text-slate-700'}`}>{value}</p>
      </div>
      {!empty && <Check size={11} className="text-emerald-400 flex-shrink-0" />}
    </div>
  )
}

/* ─── Componente principal ─── */
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
    } catch { toast.error('Error al subir imagen') }
    finally { setUploadingAvatar(false) }
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase.from('profiles').update({ ...datos, updated_at: new Date().toISOString() }).eq('id', profile.id)
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
    setDatos({ full_name: profile?.full_name || '', phone: profile?.phone || '', specialty: profile?.specialty || '' })
    setEditando(false)
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-colors placeholder:text-slate-300"
  const initial = profile?.full_name?.[0]?.toUpperCase() || 'E'

  const passwordStrength = (pwd: string) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label: 'Muy corta', color: 'bg-red-400', text: 'text-red-500', w: 'w-1/4' }
    if (pwd.length < 8) return { label: 'Débil', color: 'bg-orange-400', text: 'text-orange-500', w: 'w-2/4' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Media', color: 'bg-yellow-400', text: 'text-yellow-600', w: 'w-3/4' }
    return { label: 'Fuerte', color: 'bg-emerald-400', text: 'text-emerald-600', w: 'w-full' }
  }
  const strength = passwordStrength(pass.nueva)
  const passMatch = pass.confirmar && pass.nueva === pass.confirmar && pass.nueva.length >= 6
  const passMismatch = pass.confirmar && pass.nueva !== pass.confirmar

  return (
    <div className="pb-20 md:pb-8 w-full">

      {/* Título */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Mi Perfil</h2>
        <p className="text-sm text-slate-400 mt-0.5">Gestiona tu información y configuración de cuenta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* ══ IZQUIERDA (2/5) ══ */}
        <div className="lg:col-span-2 space-y-3">

          {/* Hero card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

            <div className="flex items-center gap-3.5 relative">
              <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => fileRef.current?.click()}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/30" />
                  : <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-xl ring-2 ring-white/20">{initial}</div>
                }
                <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {uploadingAvatar ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">{profile?.full_name}</p>
                <p className="text-blue-200 text-xs mt-0.5 truncate">{profile?.specialty || 'Especialista Clínico'}</p>
                <div className="mt-2 inline-flex items-center gap-1 bg-white/15 border border-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <BadgeCheck size={10} className="text-emerald-300" /> Verificado
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 relative">
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Email</p>
                <p className="text-white text-[11px] font-semibold truncate mt-0.5">{profile?.email?.split('@')[0]}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
                <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider">Rol</p>
                <p className="text-white text-[11px] font-semibold mt-0.5">Especialista</p>
              </div>
            </div>
          </div>

          {/* Calendarios */}
          {userId && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-50">
                <CalendarDays size={12} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Calendarios</span>
              </div>
              <div className="p-3 space-y-2">
                <GoogleCalendarBlock userId={userId} />
                <MicrosoftCalendarBlock userId={userId} />
              </div>
            </div>
          )}

          {/* Estado de cuenta */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de cuenta</p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-5 h-5 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0">
                <Shield size={10} className="text-emerald-500" />
              </div>
              <span className="font-medium">Cuenta verificada y activa</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                <Globe size={10} className="text-blue-500" />
              </div>
              <span className="font-medium truncate">Panel Especialista · Jugando Aprendo</span>
            </div>
          </div>
        </div>

        {/* ══ DERECHA (3/5) ══ */}
        <div className="lg:col-span-3 space-y-3">

          {/* Información Personal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">{t('especialista.infoPersonal')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Datos visibles en tu perfil</p>
              </div>
              {!editando && (
                <button onClick={() => setEditando(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                  <Edit3 size={11} /> Editar
                </button>
              )}
            </div>

            {editando ? (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Nombre completo', icon: User, key: 'full_name', placeholder: 'Tu nombre completo', type: 'text' },
                    { label: 'Teléfono', icon: Phone, key: 'phone', placeholder: '+51 999 999 999', type: 'tel' },
                    { label: t('perfil.especialidad'), icon: Stethoscope, key: 'specialty', placeholder: 'Ej: Terapeuta ABA', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        <f.icon size={9} /> {f.label}
                      </label>
                      <input type={f.type} value={(datos as any)[f.key]}
                        onChange={e => setDatos(d => ({ ...d, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} className={inputCls} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={cancelarEdicion} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
                    style={{ transition: 'background-color 150ms ease-out, transform 100ms ease-out' }}>
                    {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-1 grid grid-cols-2 divide-x divide-slate-50">
                <div className="pr-4 divide-y divide-slate-50">
                  <InfoRow label="Email" icon={Mail} value={profile?.email || ''} accent="text-blue-500" bg="bg-blue-50" />
                  <InfoRow label="Teléfono" icon={Phone} value={profile?.phone || 'No registrado'} accent="text-emerald-500" bg="bg-emerald-50" />
                </div>
                <div className="pl-4 divide-y divide-slate-50">
                  <InfoRow label={t('common.nombre')} icon={User} value={profile?.full_name || ''} accent="text-purple-500" bg="bg-purple-50" />
                  <InfoRow label={t('perfil.especialidad')} icon={Stethoscope} value={profile?.specialty || 'No registrado'} accent="text-orange-500" bg="bg-orange-50" />
                </div>
              </div>
            )}
          </div>

          {/* Cambiar contraseña */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setCambioPass(!cambioPass)}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={13} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{t('ui.change_password')}</p>
                <p className="text-[11px] text-slate-400">Actualiza tu contraseña de acceso</p>
              </div>
              <ChevronRight size={13} className="text-slate-300 flex-shrink-0 transition-transform duration-200"
                style={{ transform: cambioPass ? 'rotate(90deg)' : 'rotate(0deg)' }} />
            </button>

            {cambioPass && (
              <div className="border-t border-slate-50 px-5 pb-4 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nueva contraseña</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={pass.nueva}
                        onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                        placeholder="Mínimo 6 caracteres" className={`${inputCls} pr-10`} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {strength && (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${strength.color} ${strength.w}`} style={{ transition: 'width 200ms ease-out' }} />
                        </div>
                        <p className={`text-[10px] font-semibold ${strength.text}`}>{strength.label}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirmar contraseña</label>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} value={pass.confirmar}
                        onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
                        placeholder="Repite la contraseña"
                        className={`${inputCls} pr-10 ${passMismatch ? 'border-red-200' : ''} ${passMatch ? 'border-emerald-200' : ''}`} />
                      <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                        {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {passMismatch && <p className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1"><X size={9} />No coinciden</p>}
                    {passMatch && <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1"><Check size={9} />Coinciden</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCambioPass(false); setPass({ nueva: '', confirmar: '' }) }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={cambiarPassword} disabled={guardando || !!passMismatch || pass.nueva.length < 6}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm disabled:opacity-40 transition-colors"
                    style={{ transition: 'background-color 150ms ease-out, transform 100ms ease-out' }}>
                    {guardando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Actualizar contraseña
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Zona de peligro — inline, compacta */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={13} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-500">Zona de peligro</p>
              <p className="text-xs text-slate-400 mt-0.5">Para eliminar o desactivar tu cuenta, contacta con el administrador.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
