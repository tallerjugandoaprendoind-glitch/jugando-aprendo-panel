'use client'
import React from 'react'

import { useState, useEffect, useRef } from 'react'
import {
  User, Lock, Bell, Palette, Shield, Eye, EyeOff,
  Save, Loader2, CheckCircle, Camera, Mail, Phone,
  Globe, ChevronRight, LogOut, Trash2, AlertTriangle,
} from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import WhatsAppConfigView from './WhatsAppConfigView'

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'perfil',        label: 'Mi Perfil',      icon: User    },
  { id: 'seguridad',     label: 'Contraseña',     icon: Lock    },
  { id: 'notificaciones',label: 'Notificaciones', icon: Bell    },
  { id: 'apariencia',    label: 'Apariencia',     icon: Palette },
  { id: 'cuenta',        label: 'Cuenta',         icon: Shield  },
] as const
type Tab = typeof TABS[number]['id']

// ── Card genérica ─────────────────────────────────────────────────────────────
function Card({ title, subtitle, icon: Icon, iconColor, children }: {
  title: string; subtitle?: string; icon: any; iconColor: string; children: React.ReactNode
}) {
  const { isDark } = useTheme()
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
      <div className={`px-6 py-5 border-b flex items-center gap-4 ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Input estilizado ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { isDark } = useTheme()
  return (
    <div>
      <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const { isDark } = useTheme()
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all border-2 ${
        isDark
          ? 'bg-[#0d1117] border-[#30363d] text-slate-200 placeholder-slate-600 focus:border-blue-500'
          : 'bg-slate-50 border-transparent text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white shadow-sm'
      } ${className}`}
    />
  )
}

// ── Tab: Mi Perfil ────────────────────────────────────────────────────────────
function TabPerfil({ onAvatarUpdate }: { onAvatarUpdate?: (url: string) => void }) {
  const { isDark } = useTheme()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setForm({
        full_name: profile?.full_name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        role: profile?.role || '',
      })
      setAvatarUrl(profile?.avatar_url || null)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) throw error
      toast.success('Perfil actualizado correctamente')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const ROLE_LABEL: Record<string, string> = {
    jefe: '👑 Jefe / Owner',
    admin: '🛡️ Administrador',
    especialista: '🩺 Especialista',
    terapeuta: '💚 Terapeuta',
  }

  const initial = form.full_name?.charAt(0)?.toUpperCase() || '?'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Avatar & nombre */}
      <Card title="Foto y Nombre" subtitle="Tu identidad en el sistema" icon={User} iconColor="bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-100" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-100">
                <span className="text-2xl font-black text-white">{initial}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              const path = `avatars/${user.id}.${file.name.split('.').pop()}`
              await supabase.storage.from('store-images').upload(path, file, { upsert: true })
              const url = supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl
              await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
              setAvatarUrl(url)
              onAvatarUpdate?.(url)
              toast.success('Foto actualizada')
            }} />
          </div>
          <div>
            <p className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{form.full_name || 'Sin nombre'}</p>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.email}</p>
            {form.role && (
              <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                {ROLE_LABEL[form.role] || form.role}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo">
            <Input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Ej: María García"
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Ej: +51 987 654 321"
            />
          </Field>
        </div>
      </Card>

      {/* Email (info) */}
      <Card title="Correo Electrónico" subtitle="Tu email de acceso al sistema" icon={Mail} iconColor="bg-gradient-to-br from-slate-500 to-slate-700">
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-slate-50 border-transparent'}`}>
          <Mail size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          <span className={`text-sm font-medium flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{form.email}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>No editable</span>
        </div>
        <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          El correo es tu identificador de acceso. Para cambiarlo contacta al administrador del sistema.
        </p>
      </Card>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── Tab: Contraseña ───────────────────────────────────────────────────────────
function TabSeguridad() {
  const { isDark } = useTheme()
  const toast = useToast()
  const [form, setForm] = useState({ current: '', nueva: '', confirmar: '' })
  const [show, setShow] = useState({ current: false, nueva: false, confirmar: false })
  const [saving, setSaving] = useState(false)
  const [strength, setStrength] = useState(0)

  const calcStrength = (pwd: string) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }

  const handleChange = async () => {
    if (!form.nueva) { toast.error('Ingresa la nueva contraseña'); return }
    if (form.nueva.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    if (form.nueva !== form.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.nueva })
      if (error) throw error
      toast.success('¡Contraseña actualizada!')
      setForm({ current: '', nueva: '', confirmar: '' })
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500']
  const s = calcStrength(form.nueva)

  return (
    <div className="space-y-4">
      <Card title="Cambiar Contraseña" subtitle="Mantén tu cuenta segura con una contraseña fuerte" icon={Lock} iconColor="bg-gradient-to-br from-violet-500 to-purple-600">
        <div className="space-y-4">
          <Field label="Nueva contraseña">
            <div className="relative">
              <Input
                type={show.nueva ? 'text' : 'password'}
                value={form.nueva}
                onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="pr-11"
              />
              <button onClick={() => setShow(s => ({ ...s, nueva: !s.nueva }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg">
                {show.nueva ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
              </button>
            </div>
            {form.nueva && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= s ? strengthColors[s] : isDark ? 'bg-[#30363d]' : 'bg-slate-200'}`} />
                  ))}
                </div>
                {s > 0 && <p className={`text-[11px] font-bold ${s <= 1 ? 'text-red-500' : s === 2 ? 'text-orange-500' : s === 3 ? 'text-amber-500' : 'text-emerald-500'}`}>{strengthLabels[s]}</p>}
              </div>
            )}
          </Field>

          <Field label="Confirmar nueva contraseña">
            <div className="relative">
              <Input
                type={show.confirmar ? 'text' : 'password'}
                value={form.confirmar}
                onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                placeholder="Repite la contraseña"
                className="pr-11"
              />
              <button onClick={() => setShow(s => ({ ...s, confirmar: !s.confirmar }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg">
                {show.confirmar ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
              </button>
            </div>
            {form.confirmar && form.nueva && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${form.nueva === form.confirmar ? 'text-emerald-500' : 'text-red-500'}`}>
                {form.nueva === form.confirmar
                  ? <><CheckCircle size={12} /> Las contraseñas coinciden</>
                  : <><AlertTriangle size={12} /> No coinciden</>}
              </div>
            )}
          </Field>
        </div>

        {/* Requisitos */}
        <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-slate-50 border-slate-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Requisitos</p>
          {[
            { label: 'Mínimo 8 caracteres', ok: form.nueva.length >= 8 },
            { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(form.nueva) },
            { label: 'Al menos un número', ok: /[0-9]/.test(form.nueva) },
            { label: 'Un carácter especial (!@#$…)', ok: /[^A-Za-z0-9]/.test(form.nueva) },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2 py-0.5">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.ok ? 'bg-emerald-500' : isDark ? 'bg-[#21262d]' : 'bg-slate-200'}`}>
                {r.ok && <CheckCircle size={9} className="text-white" />}
              </div>
              <span className={`text-xs ${r.ok ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : isDark ? 'text-slate-500' : 'text-slate-400'}`}>{r.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <button
        onClick={handleChange}
        disabled={saving || !form.nueva || form.nueva !== form.confirmar}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {saving ? 'Actualizando…' : 'Actualizar contraseña'}
      </button>
    </div>
  )
}

// ── Tab: Notificaciones ───────────────────────────────────────────────────────
function TabNotificaciones() {
  const { isDark } = useTheme()
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
      <div className={`px-6 py-5 border-b flex items-center gap-4 ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Bell size={18} className="text-white" />
        </div>
        <div>
          <h3 className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>WhatsApp & Notificaciones</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Configuración de mensajería con las familias</p>
        </div>
      </div>
      <div className="p-6">
        <WhatsAppConfigView />
      </div>
    </div>
  )
}

// ── Tab: Apariencia ───────────────────────────────────────────────────────────
function TabApariencia() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="space-y-4">
      <Card title="Tema de la Interfaz" subtitle="Personaliza cómo se ve el panel" icon={Palette} iconColor="bg-gradient-to-br from-indigo-500 to-blue-600">
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'light', label: 'Claro', emoji: '☀️', desc: 'Fondo blanco y colores vivos' },
            { id: 'dark',  label: 'Oscuro', emoji: '🌙', desc: 'Fondo oscuro, menos fatiga visual' },
          ].map(t => {
            const isActive = (t.id === 'dark') === isDark
            return (
              <button key={t.id}
                onClick={() => { if (!isActive) toggleTheme() }}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${isActive
                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                  : isDark ? 'border-[#30363d] hover:border-[#4a5568]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className="text-3xl block mb-3">{t.emoji}</span>
                <p className={`font-black text-sm ${isActive ? 'text-blue-700' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.label}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.desc}</p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <CheckCircle size={11} className="text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="Idioma del Sistema" subtitle="El idioma del panel de administración" icon={Globe} iconColor="bg-gradient-to-br from-teal-500 to-emerald-600">
        <div className={`rounded-xl p-4 text-sm ${isDark ? 'text-slate-300 bg-teal-900/10 border border-teal-800/30' : 'text-teal-800 bg-teal-50 border border-teal-200'}`}>
          El idioma se cambia desde el selector <strong>ES / EN</strong> en la barra superior derecha. Se guarda automáticamente para tu sesión.
        </div>
        <div className="flex gap-2 mt-3">
          {[{ label: '🇪🇸 Español', active: true }, { label: '🇺🇸 English', active: false }].map(l => (
            <div key={l.label} className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all ${l.active
              ? 'border-teal-500 bg-teal-50 text-teal-700'
              : isDark ? 'border-[#30363d] text-slate-500' : 'border-slate-200 text-slate-400'}`}>{l.label}</div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Tab: Cuenta ───────────────────────────────────────────────────────────────
function TabCuenta() {
  const { isDark } = useTheme()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: any } }) => {
      if (!user) return
      setEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(data?.role || '')
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const ROLE_INFO: Record<string, { label: string; color: string; perms: string[] }> = {
    jefe:        { label: '👑 Jefe / Owner',   color: isDark ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800/40' : 'bg-yellow-50 text-yellow-800 border-yellow-200', perms: ['Todo el sistema', 'Usuarios', 'Configuración', 'Tienda', 'Agenda'] },
    admin:       { label: '🛡️ Administrador', color: isDark ? 'bg-blue-900/20 text-blue-300 border-blue-800/40'       : 'bg-blue-50 text-blue-800 border-blue-200',         perms: ['Pacientes', 'Agenda', 'Recursos', 'Reportes', 'Hub IA'] },
    especialista:{ label: '🩺 Especialista',   color: isDark ? 'bg-violet-900/20 text-violet-300 border-violet-800/40': 'bg-violet-50 text-violet-800 border-violet-200',   perms: ['Pacientes asignados', 'Evaluaciones', 'Hub IA', 'Recursos'] },
    terapeuta:   { label: '💚 Terapeuta',       color: isDark ? 'bg-green-900/20 text-green-300 border-green-800/40'  : 'bg-green-50 text-green-800 border-green-200',       perms: ['Pacientes asignados', 'Evaluaciones', 'Recursos'] },
  }

  const info = ROLE_INFO[role]

  return (
    <div className="space-y-4">
      {/* Info de la cuenta */}
      <Card title="Información de Cuenta" subtitle="Detalles de tu acceso al sistema" icon={Shield} iconColor="bg-gradient-to-br from-slate-500 to-slate-700">
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
            <Mail size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</p>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{email}</p>
            </div>
          </div>
          {info && (
            <div className={`rounded-xl border p-4 ${info.color}`}>
              <p className="text-xs font-black mb-2">{info.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {info.perms.map(p => (
                  <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-white/10' : 'bg-white/60'}`}>{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cerrar sesión */}
      <Card title="Sesión" subtitle="Administra tu sesión activa" icon={LogOut} iconColor="bg-gradient-to-br from-orange-500 to-red-500">
        <div className="space-y-3">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Al cerrar sesión saldrás del panel y deberás ingresar nuevamente con tu email y contraseña.
          </p>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-red-600 border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-all w-full justify-center active:scale-[0.98]">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </Card>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ConfiguracionView({ onAvatarUpdate }: { onAvatarUpdate?: (url: string) => void }) {
  const { isDark } = useTheme()
  const [tab, setTab] = useState<Tab>('perfil')

  return (
    <div className="w-full flex gap-6">
      {/* Sidebar */}
      <aside className={`w-52 shrink-0 rounded-2xl border p-2 h-fit sticky top-4 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
        <p className={`text-[10px] font-black uppercase tracking-widest px-3 pt-2 pb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mi cuenta</p>
        <div className="space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${tab === t.id
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:bg-[#21262d] hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <t.icon size={15} className="shrink-0" />
              {t.label}
              {tab === t.id && <ChevronRight size={13} className="ml-auto opacity-60" />}
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {tab === 'perfil'         && <TabPerfil onAvatarUpdate={onAvatarUpdate} />}
        {tab === 'seguridad'      && <TabSeguridad />}
        {tab === 'notificaciones' && <TabNotificaciones />}
        {tab === 'apariencia'     && <TabApariencia />}
        {tab === 'cuenta'         && <TabCuenta />}
      </div>
    </div>
  )
}
