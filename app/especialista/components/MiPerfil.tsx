'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, Stethoscope, Key, Eye, EyeOff, Save, Loader2, Shield, CheckCircle2, Edit3, CalendarDays, ChevronRight, Check, Unlink, Link2, Camera, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function GoogleCalendarBlock({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email, setEmail]   = useState<string | null>(null)
  const [busy, setBusy]     = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/google-calendar?action=status&userId=${userId}`)
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
      const res  = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}&role=especialista`)
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

  if (status === 'loading') return null

  return status === 'connected' ? (
    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <CalendarDays size={15} className="text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">Google Calendar</p>
        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate">
          <Check size={10} /> {email}
        </p>
      </div>
      <button onClick={disconnect} className="text-[11px] font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all flex-shrink-0">
        <Unlink size={13} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group disabled:opacity-50 text-left">
      <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
        {busy ? <Loader2 size={15} className="text-blue-600 animate-spin" /> : <CalendarDays size={15} className="text-blue-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">{busy ? 'Conectando...' : 'Google Calendar'}</p>
        <p className="text-[11px] text-slate-400">Sincronizar sesiones</p>
      </div>
      {!busy && <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-all flex-shrink-0" />}
    </button>
  )
}

function MicrosoftCalendarBlock({ userId }: { userId: string }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [email, setEmail]   = useState<string | null>(null)
  const [busy, setBusy]     = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=status&userId=${userId}`)
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
      const res  = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}&role=especialista`)
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

  if (status === 'loading') return null

  const MSIcon = () => (
    <svg width="14" height="14" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  )

  return status === 'connected' ? (
    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <MSIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">Outlook Calendar</p>
        <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 truncate">
          <Check size={10} /> {email}
        </p>
      </div>
      <button onClick={disconnect} className="text-[11px] font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all flex-shrink-0">
        <Unlink size={13} />
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group disabled:opacity-50 text-left">
      <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
        {busy ? <Loader2 size={15} className="text-blue-600 animate-spin" /> : <MSIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700">{busy ? 'Conectando...' : 'Outlook Calendar'}</p>
        <p className="text-[11px] text-slate-400">Sincronizar en Outlook</p>
      </div>
      {!busy && <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-all flex-shrink-0" />}
    </button>
  )
}

export default function MiPerfil({ profile, onUpdate, onAvatarUpdate }: { profile: any; onUpdate: () => void; onAvatarUpdate?: (url: string) => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const [editando, setEditando]   = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cambioPass, setCambioPass] = useState(false)
  const [showPass, setShowPass]   = useState(false)
  const [datos, setDatos] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '', specialty: profile?.specialty || '' })
  const [pass, setPass]   = useState({ nueva: '', confirmar: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const fileRef = useRef<HTMLInputElement>(null)
  const userId: string | null = profile?.id ?? null

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const ext  = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    await supabase.storage.from('store-images').upload(path, file, { upsert: true })
    const url = supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    setAvatarUrl(url)
    onAvatarUpdate?.(url)
    toast.success('Foto actualizada ✓')
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

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
  const initial  = profile?.full_name?.[0]?.toUpperCase() || 'E'

  return (
    <div className="pb-20 md:pb-6">
      <h2 className="text-2xl font-black text-slate-800 mb-5">{t('nav.miperfil')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── COLUMNA IZQUIERDA: avatar + info ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Avatar card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-center relative overflow-hidden shadow-md shadow-blue-200">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
            <div className="relative w-20 h-20 mx-auto mb-3 group cursor-pointer" onClick={() => fileRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white/30" />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg border-2 border-white/30">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <h3 className="text-lg font-black text-white leading-tight">{profile?.full_name}</h3>
            <p className="text-blue-200 text-xs font-medium mt-0.5 mb-3">{profile?.specialty || t('especialista.especialistaClinico')}</p>
            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white px-3 py-1.5 rounded-full text-xs font-bold">
              <Shield size={11} /> {t('especialista.especialistaVerificado')}
            </div>
          </div>

          {/* Calendarios */}
          {userId && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Link2 size={13} className="text-slate-400" />
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Calendarios</h4>
              </div>
              <div className="p-3 space-y-2">
                <GoogleCalendarBlock userId={userId} />
                <MicrosoftCalendarBlock userId={userId} />
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: datos + contraseña ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Información personal */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">{t('especialista.infoPersonal')}</h4>
              {!editando && (
                <button onClick={() => setEditando(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                  <Edit3 size={11} /> Editar
                </button>
              )}
            </div>

            {editando ? (
              <div className="p-4 space-y-3">
                {[
                  { label: t('perfil.nombreCompleto'), icon: User,        key: 'full_name',  placeholder: 'Tu nombre completo' },
                  { label: 'Teléfono',                 icon: Phone,       key: 'phone',      placeholder: '+51 999 999 999' },
                  { label: t('perfil.especialidad'),   icon: Stethoscope, key: 'specialty',  placeholder: 'Ej: Terapeuta ABA' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      <f.icon size={10} /> {f.label}
                    </label>
                    <input value={(datos as any)[f.key]} onChange={e => setDatos(d => ({ ...d, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className={inputCls} />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditando(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 shadow-sm transition-colors">
                    {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Email',                    icon: Mail,        value: profile?.email },
                  { label: t('common.nombre'),         icon: User,        value: profile?.full_name },
                  { label: 'Teléfono',                 icon: Phone,       value: profile?.phone || 'No registrado' },
                  { label: t('perfil.especialidad'),   icon: Stethoscope, value: profile?.specialty || 'No registrado' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                      <item.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contraseña */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button onClick={() => setCambioPass(!cambioPass)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                <Key size={14} />
              </div>
              <span className="font-bold text-sm text-slate-700 flex-1 text-left">{t('ui.change_password')}</span>
              <span className="text-xs text-slate-400 font-medium">{cambioPass ? '↑ Cerrar' : '↓ Abrir'}</span>
            </button>
            {cambioPass && (
              <div className="border-t border-slate-100 px-5 pb-4 pt-3 space-y-2.5">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={pass.nueva}
                    onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                    {...{placeholder: t('ui.new_password')}}
                    className={`${inputCls} pr-10`} />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input type="password" value={pass.confirmar}
                  onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
                  {...{placeholder: t('ui.confirm_password')}}
                  className={inputCls} />
                <button onClick={cambiarPassword} disabled={guardando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 shadow-sm transition-colors">
                  {guardando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Actualizar contraseña
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
