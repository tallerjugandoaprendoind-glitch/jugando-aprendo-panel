'use client'

import { useState } from 'react'
import {
  User, Mail, Phone, Stethoscope, Key, Eye, EyeOff,
  Save, Loader2, Shield, CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export default function MiPerfil({ profile, onUpdate }: { profile: any; onUpdate: () => void }) {
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cambioPass, setCambioPass] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [datos, setDatos] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    specialty: profile?.specialty || '',
  })
  const [pass, setPass] = useState({ nueva: '', confirmar: '' })

  const guardar = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: datos.full_name,
        phone: datos.phone,
        specialty: datos.specialty,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      if (error) throw error
      toast.success('Perfil actualizado')
      setEditando(false)
      onUpdate()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async () => {
    if (pass.nueva.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    if (pass.nueva !== pass.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setGuardando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pass.nueva })
      if (error) throw error
      toast.success('Contraseña actualizada correctamente')
      setCambioPass(false)
      setPass({ nueva: '', confirmar: '' })
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mi Perfil</h2>

      {/* Tarjeta principal */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold mb-3">
            {profile?.full_name?.[0]?.toUpperCase() || 'E'}
          </div>
          <h3 className="text-xl font-bold text-white">{profile?.full_name}</h3>
          <p className="text-blue-200 text-sm">{profile?.specialty || 'Especialista'}</p>
          <div className="mt-3 flex items-center gap-1.5 bg-white/15 text-white/90 text-xs px-3 py-1 rounded-full">
            <Shield size={12} /> Rol: Especialista
          </div>
        </div>

        <div className="p-6 space-y-4">
          {editando ? (
            <>
              <Field label="Nombre completo" icon={User}>
                <input value={datos.full_name} onChange={e => setDatos(d => ({ ...d, full_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="Teléfono" icon={Phone}>
                <input value={datos.phone} onChange={e => setDatos(d => ({ ...d, phone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="Especialidad" icon={Stethoscope}>
                <input value={datos.specialty} onChange={e => setDatos(d => ({ ...d, specialty: e.target.value }))}
                  placeholder="Ej: Terapeuta ABA, Psicólogo Clínico..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditando(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                  {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Guardar
                </button>
              </div>
            </>
          ) : (
            <>
              <InfoRow icon={Mail} label="Correo" value={profile?.email} />
              <InfoRow icon={User} label="Nombre" value={profile?.full_name} />
              <InfoRow icon={Phone} label="Teléfono" value={profile?.phone || 'No registrado'} />
              <InfoRow icon={Stethoscope} label="Especialidad" value={profile?.specialty || 'No registrado'} />
              <button onClick={() => setEditando(true)}
                className="w-full py-2.5 mt-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                Editar información
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button onClick={() => setCambioPass(!cambioPass)}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <Key size={18} className="text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex-1 text-left">Cambiar contraseña</span>
          <span className="text-xs text-slate-400">{cambioPass ? 'Cerrar' : 'Abrir'}</span>
        </button>
        {cambioPass && (
          <div className="px-6 pb-5 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass.nueva}
                onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input type="password" value={pass.confirmar}
              onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Confirmar nueva contraseña"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={cambiarPassword} disabled={guardando}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white disabled:opacity-50 text-white dark:text-slate-800 text-sm font-semibold transition-colors">
              {guardando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Actualizar contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }: any) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  )
}
