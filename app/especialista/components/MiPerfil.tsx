'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState } from 'react'
import { User, Mail, Phone, Stethoscope, Key, Eye, EyeOff, Save, Loader2, Shield, CheckCircle2, Edit3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export default function MiPerfil({ profile, onUpdate }: { profile: any; onUpdate: () => void }) {
  const toast = useToast()
  const { t } = useI18n()
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

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"

  return (
    <div className="space-y-5 pb-20 md:pb-6 max-w-2xl">
      <h2 className="text-2xl font-black text-slate-800">{t('nav.miperfil')}</h2>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-center relative overflow-hidden shadow-lg shadow-blue-200">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-5 shadow-xl border-2 border-white/30">
          {profile?.full_name?.[0]?.toUpperCase() || 'E'}
        </div>
        <h3 className="text-2xl font-black text-white mb-1">{profile?.full_name}</h3>
        <p className="text-blue-200 text-sm font-medium mb-4">{profile?.specialty || t('especialista.especialistaClinico')}</p>
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-2 rounded-full text-sm font-bold">
          <Shield size={13} /> {t('especialista.especialistaVerificado')}
        </div>
      </div>

      {/* Info / Editar */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm">{t('especialista.infoPersonal')}</h4>
          {!editando && (
            <button onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <Edit3 size={11} /> Editar
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          {editando ? (
            <>
              {[
                { label: t('perfil.nombreCompleto'), icon: User, key: 'full_name', placeholder: 'Tu nombre' },
                { label: 'Teléfono', icon: Phone, key: 'phone', placeholder: '+52 55 1234 5678' },
                { label: t('perfil.especialidad'), icon: Stethoscope, key: 'specialty', placeholder: 'Ej: Terapeuta ABA' },
              ].map(f => (
                <div key={f.key}>
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    <f.icon size={11} /> {f.label}
                  </label>
                  <input value={(datos as any)[f.key]} onChange={e => setDatos(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className={inputCls} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditando(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 shadow-sm transition-colors">
                  {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Guardar
                </button>
              </div>
            </>
          ) : (
            <>
              {[
                { label: 'Email', icon: Mail, value: profile?.email },
                { label: t('common.nombre'), icon: User, value: profile?.full_name },
                { label: 'Teléfono', icon: Phone, value: profile?.phone || 'No registrado' },
                { label: t('perfil.especialidad'), icon: Stethoscope, value: profile?.specialty || 'No registrado' },
              ].map((item, idx) => (
                <div key={item.label} className={`flex items-center gap-4 ${idx < 3 ? 'pb-4 border-b border-slate-50' : ''}`}>
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-500">
                    <item.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <button onClick={() => setCambioPass(!cambioPass)}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-500">
            <Key size={15} />
          </div>
          <span className="font-bold text-sm text-slate-700 flex-1 text-left">{t('ui.change_password')}</span>
          <span className="text-xs text-slate-400 font-medium">{cambioPass ? '↑ Cerrar' : '↓ Abrir'}</span>
        </button>
        {cambioPass && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass.nueva}
                onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                {...{placeholder: t('ui.new_password')}}
                className={`${inputCls} pr-12`} />
              <button onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input type="password" value={pass.confirmar}
              onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
              {...{placeholder: t('ui.confirm_password')}}
              className={inputCls} />
            <button onClick={cambiarPassword} disabled={guardando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 shadow-sm transition-colors">
              {guardando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Actualizar contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
