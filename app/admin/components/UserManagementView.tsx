'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Key, Mail, Loader2, Search, Shield, RefreshCw,
  CheckCircle2, X, Eye, EyeOff, Ticket, AlertCircle, User,
  Clock, Calendar, ChevronDown, ChevronUp, Send, Lock
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface UserData {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed: boolean
  profile: {
    full_name?: string
    role?: string
    tokens?: number
    phone?: string
  } | null
}

function UserManagementView() {
  const toast = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Password change state
  const [changingPasswordFor, setChangingPasswordFor] = useState<UserData | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Token management
  const [editingTokensFor, setEditingTokensFor] = useState<string | null>(null)
  const [newTokens, setNewTokens] = useState(0)
  const [savingTokens, setSavingTokens] = useState(false)

  // Reset email
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null)

  const cargarUsuarios = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setUsers(json.data || [])
    } catch (err: any) {
      toast.error('Error cargando usuarios: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  const handleChangePassword = async () => {
    if (!changingPasswordFor) return
    if (!newPassword || newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', userId: changingPasswordFor.id, newPassword }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`✅ Contraseña de ${changingPasswordFor.profile?.full_name || changingPasswordFor.email} actualizada`)
      setChangingPasswordFor(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSendResetEmail = async (user: UserData) => {
    setSendingResetTo(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_reset_email', email: user.email }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`📧 Email de recuperación enviado a ${user.email}`)
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSendingResetTo(null)
    }
  }

  const handleUpdateTokens = async (userId: string) => {
    setSavingTokens(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_tokens', userId, tokens: newTokens }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Tokens actualizados')
      setEditingTokensFor(null)
      cargarUsuarios()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingTokens(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchTerm ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'todos' || u.profile?.role === filterRole
    return matchSearch && matchRole
  })

  const padresCount = users.filter(u => u.profile?.role === 'padre').length
  const adminCount = users.filter(u => u.profile?.role === 'admin').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-6 lg:p-8 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-2xl">
              <Users className="text-indigo-600" size={28} />
            </div>
            Gestión de Usuarios
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1 ml-1">
            {users.length} usuarios · {padresCount} familias · {adminCount} administradores
          </p>
        </div>
        <button onClick={cargarUsuarios} className="p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 transition-all">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Usuarios', value: users.length, colorClass: 'indigo' },
          { label: 'Familias', value: padresCount, colorClass: 'blue' },
          { label: 'Confirmados', value: users.filter(u => u.email_confirmed).length, colorClass: 'emerald' },
          { label: 'Con Tokens', value: users.filter(u => (u.profile?.tokens||0) > 0).length, colorClass: 'amber' },
        ].map(({ label, value, colorClass }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-black text-${colorClass}-600 mt-1`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 transition-all"
        >
          <option value="todos">Todos los roles</option>
          <option value="padre">Familias / Padres</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-400" size={36} />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
              {/* User row */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-all"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${
                  user.profile?.role === 'admin'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  {(user.profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 truncate">
                      {user.profile?.full_name || 'Sin nombre'}
                    </p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      user.profile?.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {user.profile?.role || 'sin rol'}
                    </span>
                    {!user.email_confirmed && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                        No confirmado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-medium truncate">{user.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-300 font-bold">
                    <span className="flex items-center gap-1">
                      <Ticket size={10} /> {user.profile?.tokens || 0} tokens
                    </span>
                    {user.last_sign_in_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {new Date(user.last_sign_in_at).toLocaleDateString('es-PE')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {expandedUser === user.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </div>

              {/* Expanded actions */}
              {expandedUser === user.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Change Password */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Key size={16} className="text-blue-600" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Cambiar Contraseña</p>
                      </div>
                      <button
                        onClick={() => setChangingPasswordFor(user)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all"
                      >
                        Establecer Nueva Clave
                      </button>
                    </div>

                    {/* Send Reset Email */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Mail size={16} className="text-emerald-600" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Email de Recuperación</p>
                      </div>
                      <button
                        onClick={() => handleSendResetEmail(user)}
                        disabled={sendingResetTo === user.id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sendingResetTo === user.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Enviar al correo
                      </button>
                    </div>

                    {/* Manage Tokens */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Ticket size={16} className="text-amber-600" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Créditos (Tokens)</p>
                      </div>
                      {editingTokensFor === user.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            value={newTokens}
                            onChange={e => setNewTokens(Number(e.target.value))}
                            className="flex-1 p-2 bg-slate-50 border-2 border-amber-200 rounded-xl text-sm font-bold outline-none text-center"
                          />
                          <button onClick={() => handleUpdateTokens(user.id)} disabled={savingTokens} className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all disabled:opacity-50">
                            {savingTokens ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          </button>
                          <button onClick={() => setEditingTokensFor(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingTokensFor(user.id); setNewTokens(user.profile?.tokens || 0) }}
                          className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                        >
                          <Ticket size={14} /> {user.profile?.tokens || 0} tokens → Editar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredUsers.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-5 bg-slate-100 rounded-3xl mb-4">
                <Users size={40} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-400">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Change Password */}
      {changingPasswordFor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                <Key size={20} className="text-blue-600" /> Cambiar Contraseña
              </h3>
              <button onClick={() => setChangingPasswordFor(null)} className="p-2 rounded-full hover:bg-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-blue-800 text-sm">Cambiando contraseña para:</p>
                <p className="text-blue-600 text-sm font-bold">{changingPasswordFor.profile?.full_name || changingPasswordFor.email}</p>
                <p className="text-blue-500 text-xs">{changingPasswordFor.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-xl text-sm font-bold outline-none transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 font-bold mt-1 ml-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setChangingPasswordFor(null); setNewPassword(''); setConfirmPassword('') }} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-xl transition-all border-2 border-slate-100">
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700"
                >
                  {savingPassword ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                  {savingPassword ? 'Actualizando...' : 'Guardar Contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementView
