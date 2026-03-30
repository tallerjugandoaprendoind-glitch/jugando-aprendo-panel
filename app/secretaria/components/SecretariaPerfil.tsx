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
    <div className="w-full flex flex-col">

      {/* ── BANNER — edge to edge ── */}
      <div className="relative w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 md:px-10 py-8 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-6 right-28 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-40 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl flex-shrink-0">
            {initial}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">{profile?.full_name || 'Secretaria(o)'}</h1>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest">
              Secretaria(o)
            </span>
            <p className="text-white/60 text-xs mt-1">{profile?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">

        {/* Section label */}
        <div>
          <h2 className="text-lg font-black text-slate-800">Mi Perfil</h2>
          <p className="text-xs text-slate-400 mt-0.5">Información personal y seguridad</p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* LEFT */}
          <div className="space-y-5">

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <User size={13} className="text-violet-600" />
                  </div>
                  <span className="font-black text-sm text-slate-800">Información personal</span>
                </div>
                {!editMode && (
                  <button onClick={() => setEditMode(true)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1 rounded-lg hover:bg-violet-50 transition-colors">
                    Editar
                  </button>
                )}
              </div>
              <div className="p-5">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Nombre completo</label>
                      <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Teléfono</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+51 999 000 000"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setEditMode(false)}
                        className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleSaveProfile} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-md shadow-violet-200">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[
                      { icon: User, label: 'Nombre', value: profile?.full_name },
                      { icon: Mail, label: 'Email', value: profile?.email },
                      { icon: Phone, label: 'Teléfono', value: profile?.phone },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-100 hover:bg-violet-50/20 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-violet-200 transition-colors flex-shrink-0">
                          <Icon size={14} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
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

            {/* Security card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Key size={13} className="text-amber-600" />
                  </div>
                  <span className="font-black text-sm text-slate-800">Seguridad</span>
                </div>
                {!showPassSection && (
                  <button onClick={() => setShowPassSection(true)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1 rounded-lg hover:bg-violet-50 transition-colors">
                    Cambiar contraseña
                  </button>
                )}
              </div>
              <div className="p-5">
                {showPassSection ? (
                  <div className="space-y-3">
                    <input type="password" placeholder="Nueva contraseña (mín. 6 caracteres)"
                      value={passForm.nueva} onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                    <input type="password" placeholder="Confirmar nueva contraseña"
                      value={passForm.confirmar} onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => { setShowPassSection(false); setPassForm({ nueva:'', confirmar:'' }) }}
                        className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleChangePassword} disabled={changingPass}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-md shadow-violet-200">
                        {changingPass ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {changingPass ? 'Actualizando...' : 'Actualizar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Key size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700">Contraseña</p>
                      <p className="text-xs text-slate-400">Se aplica en el próximo inicio de sesión</p>
                    </div>
                    <span className="text-base tracking-widest text-slate-300">••••••</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* Calendars card */}
            {userId && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Link2 size={13} className="text-blue-600" />
                  </div>
                  <span className="font-black text-sm text-slate-800">Calendarios externos</span>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-400">Sincronizá tus citas con Google o Outlook Calendar para tener todo en un solo lugar.</p>
                  <GoogleCalendarBlock userId={userId} />
                  <MicrosoftCalendarBlock userId={userId} />
                </div>
              </div>
            )}

            {/* Account summary */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base font-black shadow-lg shadow-violet-200 flex-shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-800 truncate">{profile?.full_name || 'Secretaria(o)'}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.email || ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Rol', value: 'Secretaria' },
                  { label: 'Estado', value: 'Activa' },
                  { label: 'Acceso', value: 'Total' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/80 rounded-xl p-3 text-center border border-violet-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-black text-violet-700 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
