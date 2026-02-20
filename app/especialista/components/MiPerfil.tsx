'use client'

import { useState } from 'react'
import { User, Mail, Phone, Stethoscope, Key, Eye, EyeOff, Save, Loader2, Shield, CheckCircle2, Edit3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export default function MiPerfil({ profile, onUpdate }: { profile: any; onUpdate: () => void }) {
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cambioPass, setCambioPass] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [datos, setDatos] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '', specialty: profile?.specialty || '' })
  const [pass, setPass] = useState({ nueva: '', confirmar: '' })

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
    if (pass.nueva.length < 6) { toast.error('Mínimo 6 caracteres'); return }
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

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all placeholder:text-slate-700"
  const inputStyle = { background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 max-w-2xl">
      <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">Mi Perfil</h2>

      {/* Hero card */}
      <div style={{ background: 'linear-gradient(135deg, #06b6d418 0%, #8b5cf618 100%)', border: '1px solid rgba(6,182,212,0.2)' }}
        className="rounded-3xl p-8 text-center relative overflow-hidden">
        <div style={{ background: '#06b6d4', filter: 'blur(80px)', opacity: 0.08 }}
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none" />
        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-5 shadow-2xl">
          {profile?.full_name?.[0]?.toUpperCase() || 'E'}
        </div>
        <h3 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black mb-1">{profile?.full_name}</h3>
        <p style={{ color: '#64748b' }} className="text-sm font-medium mb-4">{profile?.specialty || 'Especialista Clínico'}</p>
        <div style={{ background: '#10b98120', border: '1px solid #10b98130', color: '#10b981' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold">
          <Shield size={13} /> Especialista verificado
        </div>
      </div>

      {/* Info / Editar */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-2xl overflow-hidden">
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          className="px-5 py-4 flex items-center justify-between">
          <h4 style={{ color: '#e2e8f0' }} className="font-bold text-sm">Información Personal</h4>
          {!editando && (
            <button onClick={() => setEditando(true)}
              style={{ background: '#06b6d415', color: '#06b6d4', border: '1px solid #06b6d430' }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full hover:brightness-125 transition-all">
              <Edit3 size={11} /> Editar
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          {editando ? (
            <>
              {[
                { label: 'Nombre completo', icon: User, key: 'full_name', placeholder: 'Tu nombre' },
                { label: 'Teléfono', icon: Phone, key: 'phone', placeholder: '+52 55 1234 5678' },
                { label: 'Especialidad', icon: Stethoscope, key: 'specialty', placeholder: 'Ej: Terapeuta ABA' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: '#334155' }} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-2">
                    <f.icon size={11} /> {f.label}
                  </label>
                  <input value={(datos as any)[f.key]} onChange={e => setDatos(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} style={inputStyle} className={inputCls} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditando(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 20px #06b6d425' }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50">
                  {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Guardar
                </button>
              </div>
            </>
          ) : (
            <>
              {[
                { label: 'Email', icon: Mail, value: profile?.email },
                { label: 'Nombre', icon: User, value: profile?.full_name },
                { label: 'Teléfono', icon: Phone, value: profile?.phone || 'No registrado' },
                { label: 'Especialidad', icon: Stethoscope, value: profile?.specialty || 'No registrado' },
              ].map((item, idx) => (
                <div key={item.label}
                  style={{ borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  className="flex items-center gap-4 pb-4 last:pb-0">
                  <div style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#334155' }} className="text-xs font-bold uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p style={{ color: '#94a3b8' }} className="text-sm font-medium truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Contraseña */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }} className="rounded-2xl overflow-hidden">
        <button onClick={() => setCambioPass(!cambioPass)}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
          <div style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
            <Key size={15} />
          </div>
          <span style={{ color: '#94a3b8' }} className="font-bold text-sm flex-1 text-left">Cambiar contraseña</span>
          <span style={{ color: '#334155' }} className="text-xs font-medium">{cambioPass ? '↑ Cerrar' : '↓ Abrir'}</span>
        </button>
        {cambioPass && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-5 pb-5 pt-4 space-y-3">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass.nueva}
                onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                style={inputStyle} className={`${inputCls} pr-12`} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ color: '#475569' }} className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-slate-300 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input type="password" value={pass.confirmar}
              onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Confirmar contraseña"
              style={inputStyle} className={inputCls} />
            <button onClick={cambiarPassword} disabled={guardando}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', boxShadow: '0 0 20px #06b6d420' }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all">
              {guardando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Actualizar contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
