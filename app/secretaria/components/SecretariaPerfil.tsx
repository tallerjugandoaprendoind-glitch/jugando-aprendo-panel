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
      supabase.auth.getSession().then(({ data: { session } }) => {
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
    <div className="max-w-lg space-y-6">

      <div>
        <h2 className="text-2xl font-black text-slate-800">Mi Perfil</h2>
        <p className="text-sm text-slate-400 mt-0.5">Información personal y seguridad</p>
      </div>

      {/* Avatar & name */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-200">
            {initial}
          </div>
          <div>
            <p className="font-black text-lg text-slate-800">{profile?.full_name || 'Secretaria(o)'}</p>
            <span className="inline-block mt-1 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-black uppercase tracking-wide">
              Secretaria(o)
            </span>
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Nombre completo</label>
              <input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Teléfono</label>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+51 999 000 000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditMode(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <User size={15} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nombre</p>
                <p className="text-sm font-bold text-slate-700">{profile?.full_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <Mail size={15} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-bold text-slate-700">{profile?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <Phone size={15} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Teléfono</p>
                <p className="text-sm font-bold text-slate-700">{profile?.phone || '—'}</p>
              </div>
            </div>
            <button onClick={() => setEditMode(true)} className="w-full py-3 rounded-xl border-2 border-violet-200 text-violet-600 font-bold text-sm hover:bg-violet-50 transition-colors mt-2">
              Editar información
            </button>
          </div>
        )}
      </div>

      {/* Calendarios externos */}
      {userId && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={15} className="text-slate-500" />
            <h3 className="font-black text-sm text-slate-800">Calendarios externos</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">Sincronizá tus citas con Google o Outlook Calendar.</p>
          <GoogleCalendarBlock userId={userId} />
          <MicrosoftCalendarBlock userId={userId} />
        </div>
      )}

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-slate-500" />
            <h3 className="font-black text-sm text-slate-800">Cambiar contraseña</h3>
          </div>
          {!showPassSection && (
            <button onClick={() => setShowPassSection(true)} className="text-xs font-bold text-violet-600 hover:underline">
              Cambiar
            </button>
          )}
        </div>
        {showPassSection && (
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              value={passForm.nueva}
              onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={passForm.confirmar}
              onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowPassSection(false); setPassForm({ nueva:'', confirmar:'' }) }}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleChangePassword} disabled={changingPass}
                className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-black text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {changingPass ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {changingPass ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        )}
        {!showPassSection && (
          <p className="text-xs text-slate-400">La contraseña se aplica en el próximo inicio de sesión.</p>
        )}
      </div>
    </div>
  )
}
