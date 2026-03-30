'use client'

import { useState, useEffect } from 'react'
import { User, Key, Save, Loader2, Mail, Phone, Check, CalendarDays, ChevronRight, Unlink, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── Google Calendar ────────────────────────────────────────────────────────────
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
    if (p.get('gcal') === 'connected') {
      toast.success('✅ Google Calendar conectado')
      check()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (p.get('gcal') === 'error') {
      toast.error('Error al conectar Google Calendar')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}&role=secretaria`)
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
    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <CalendarDays size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">Google Calendar</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <Check size={11} /> Conectado · {email}
          </p>
        </div>
      </div>
      <button onClick={disconnect}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 border border-red-100 transition-all">
        <Unlink size={13} /> Desconectar
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 rounded-2xl transition-all group disabled:opacity-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
          {busy ? <Loader2 size={18} className="text-blue-600 animate-spin" /> : <CalendarDays size={18} className="text-blue-600" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">{busy ? 'Conectando...' : 'Vincular Google Calendar'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sincronizá las citas automáticamente</p>
        </div>
      </div>
      {!busy && <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />}
    </button>
  )
}

// ── Microsoft / Outlook Calendar ───────────────────────────────────────────────
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
    if (p.get('mscal') === 'connected') {
      toast.success('✅ Outlook Calendar conectado')
      check()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (p.get('mscal') === 'error') {
      toast.error('Error al conectar Outlook Calendar')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}&role=secretaria`)
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

  return status === 'connected' ? (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">Outlook Calendar</p>
          <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
            <Check size={11} /> Conectado · {email}
          </p>
        </div>
      </div>
      <button onClick={disconnect}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 border border-red-100 transition-all">
        <Unlink size={13} /> Desconectar
      </button>
    </div>
  ) : (
    <button onClick={connect} disabled={busy}
      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all group disabled:opacity-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          {busy
            ? <Loader2 size={18} className="text-blue-600 animate-spin" />
            : <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
          }
        </div>
        <div className="text-left">
          <p className="text-sm font-black text-slate-800">{busy ? 'Conectando...' : 'Vincular Outlook Calendar'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sincronizá las citas en Outlook automáticamente</p>
        </div>
      </div>
      {!busy && <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />}
    </button>
  )
}

export default function SecretariaPerfil({ profile, onUpdate }: { profile: any; onUpdate?: () => void }) {
  const toast = useToast()
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [passForm, setPassForm] = useState({ nueva: '', confirmar: '' })
  const [changingPass, setChangingPass] = useState(false)
  const [showPassSection, setShowPassSection] = useState(false)
  const [userId, setUserId] = useState<string | null>(profile?.id || null)

  useEffect(() => {
    if (!profile?.id) {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
        if (session?.user?.id) setUserId(session.user.id)
      })
    }
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('id', profile.id)
      if (error) throw error
      toast.success('✅ Perfil actualizado')
      setEditMode(false)
      onUpdate?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passForm.nueva.length < 6) { toast.warning('Mínimo 6 caracteres'); return }
    if (passForm.nueva !== passForm.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setChangingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.nueva })
      if (error) throw error
      toast.success('✅ Contraseña actualizada')
      setPassForm({ nueva: '', confirmar: '' })
      setShowPassSection(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setChangingPass(false)
    }
  }

  const initial = (profile?.full_name || 'S').charAt(0).toUpperCase()

  return (
    <div className="w-full h-full min-h-screen flex flex-col">
      {/* Header Banner */}
      <div className="relative w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-20 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 left-32 w-36 h-36 bg-white/5 rounded-full" />

        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{profile?.full_name || 'Secretaria(o)'}</h1>
            <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-widest">
              Secretaria(o)
            </span>
            <p className="text-white/60 text-xs mt-1.5">{profile?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Page title */}
      <div className="px-8 pt-6 pb-2">
        <h2 className="text-xl font-black text-slate-800">Mi Perfil</h2>
        <p className="text-sm text-slate-400 mt-0.5">Información personal y seguridad</p>
      </div>

      {/* Two-column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 pb-8 pt-4">

        {/* LEFT — Personal Info */}
        <div className="space-y-6">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <User size={14} className="text-violet-600" />
                </div>
                <span className="font-black text-sm text-slate-800">Información personal</span>
              </div>
              {!editMode && (
                <button onClick={() => setEditMode(true)}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
                  Editar
                </button>
              )}
            </div>

            <div className="p-6">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Nombre completo</label>
                    <input
                      value={form.full_name}
                      onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Teléfono</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+51 999 000 000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditMode(false)}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving}
                      className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-200">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: 'Nombre', value: profile?.full_name },
                    { icon: Mail, label: 'Email', value: profile?.email },
                    { icon: Phone, label: 'Teléfono', value: profile?.phone },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-violet-200 transition-colors flex-shrink-0">
                        <Icon size={15} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Key size={14} className="text-amber-600" />
                </div>
                <span className="font-black text-sm text-slate-800">Seguridad</span>
              </div>
              {!showPassSection && (
                <button onClick={() => setShowPassSection(true)}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
                  Cambiar contraseña
                </button>
              )}
            </div>
            <div className="p-6">
              {showPassSection ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                    value={passForm.nueva}
                    onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={passForm.confirmar}
                    onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setShowPassSection(false); setPassForm({ nueva:'', confirmar:'' }) }}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleChangePassword} disabled={changingPass}
                      className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-200">
                      {changingPass ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                      {changingPass ? 'Actualizando...' : 'Actualizar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Key size={15} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Contraseña</p>
                    <p className="text-xs text-slate-400 mt-0.5">Se aplica en el próximo inicio de sesión</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-lg tracking-widest text-slate-300">••••••</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Calendars */}
        <div className="space-y-6">
          {/* Calendars card */}
          {userId && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Link2 size={14} className="text-blue-600" />
                </div>
                <span className="font-black text-sm text-slate-800">Calendarios externos</span>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs text-slate-400 mb-4">Sincronizá tus citas con Google o Outlook Calendar para tener todo en un solo lugar.</p>
                <GoogleCalendarBlock userId={userId} />
                <MicrosoftCalendarBlock userId={userId} />
              </div>
            </div>
          )}

          {/* Account summary card */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-violet-200">
                {initial}
              </div>
              <div>
                <p className="font-black text-slate-800">{profile?.full_name || 'Secretaria(o)'}</p>
                <p className="text-xs text-slate-500">{profile?.email || ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Rol', value: 'Secretaria' },
                { label: 'Estado', value: 'Activa' },
                { label: 'Acceso', value: 'Total' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/70 rounded-xl p-3 text-center border border-violet-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-black text-violet-700 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
