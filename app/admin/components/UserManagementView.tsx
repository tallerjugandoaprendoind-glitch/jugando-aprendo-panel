'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Key, Mail, Loader2, Search, Shield, RefreshCw,
  CheckCircle2, X, Eye, EyeOff, Ticket, AlertCircle, User,
  Clock, Calendar, ChevronDown, ChevronUp, Send, Lock,
  Crown, Stethoscope, Heart, Plus, ToggleLeft, ToggleRight,
  Edit2, Briefcase, UserCheck, UserX, Filter, Download
} from 'lucide-react'
import { useToast } from '@/components/Toast'

const ROLES = [
  {
    value: 'jefe',
    label: 'Jefe',
    description: 'Acceso total al sistema',
    icon: Crown,
    badgeClass: 'role-jefe',
    dotColor: 'bg-purple-500',
  },
  {
    value: 'especialista',
    label: 'Especialista',
    description: 'Terapeuta / Clínico',
    icon: Stethoscope,
    badgeClass: 'role-especialista',
    dotColor: 'bg-blue-500',
  },
  {
    value: 'padre',
    label: 'Padre / Tutor',
    description: 'Portal de familias',
    icon: Heart,
    badgeClass: 'role-padre',
    dotColor: 'bg-emerald-500',
  },
]

function getRoleInfo(role: string) {
  return ROLES.find(r => r.value === role || (role === 'admin' && r.value === 'jefe')) || ROLES[0]
}

function RoleBadge({ role }: { role: string }) {
  const info = getRoleInfo(role)
  const Icon = info.icon
  return (
    <span className={`role-badge ${info.badgeClass}`}>
      <Icon size={10} />
      {info.label}
    </span>
  )
}

function RoleSelector({ currentRole, onSelect, disabled }: {
  currentRole: string
  onSelect: (role: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const current = getRoleInfo(currentRole)

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-sm font-medium hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <current.icon size={14} className="text-slate-500" />
        <span>{current.label}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200
          dark:border-slate-700 rounded-xl shadow-lg min-w-[200px] overflow-hidden animate-scale-in">
          {ROLES.map(r => {
            const RIcon = r.icon
            return (
              <button
                key={r.value}
                onClick={() => { onSelect(r.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700
                  transition-colors text-left ${currentRole === r.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${r.dotColor}`} />
                <RIcon size={14} className="text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.description}</p>
                </div>
                {(currentRole === r.value || (currentRole === 'admin' && r.value === 'jefe')) && (
                  <CheckCircle2 size={14} className="ml-auto text-blue-500" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
    specialty?: string
    is_active?: boolean
  } | null
}

function StatCard({ value, label, icon: Icon, color }: any) {
  return (
    <div className="card-pro p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{value}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function UserManagementView() {
  const toast = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  // Create user form
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'especialista', specialty: '' })
  const [creatingUser, setCreatingUser] = useState(false)

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

  const handleChangeRole = async (user: UserData, newRole: string) => {
    setSavingRole(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', userId: user.id, role: newRole }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`✅ Rol de ${user.profile?.full_name || user.email} → ${newRole}`)
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, profile: { ...u.profile, role: newRole } } : u
      ))
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingRole(null)
    }
  }

  const handleToggleActive = async (user: UserData) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', userId: user.id }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      const newActive = json.is_active
      toast.success(newActive ? '✅ Usuario activado' : '⏸ Usuario desactivado')
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, profile: { ...u.profile, is_active: newActive } } : u
      ))
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    }
  }

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
      toast.success('✅ Tokens actualizados')
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, profile: { ...u.profile, tokens: newTokens } } : u
      ))
      setEditingTokensFor(null)
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingTokens(false)
    }
  }

  const handleSendResetEmail = async (user: UserData) => {
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
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email y contraseña son requeridos')
      return
    }
    setCreatingUser(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_user', ...createForm }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Usuario creado exitosamente')
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', full_name: '', role: 'especialista', specialty: '' })
      cargarUsuarios()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setCreatingUser(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase()
    const matchSearch = !term ||
      u.email.toLowerCase().includes(term) ||
      u.profile?.full_name?.toLowerCase().includes(term)
    const role = u.profile?.role || ''
    const matchRole = filterRole === 'todos' ||
      (filterRole === 'jefe' && (role === 'jefe' || role === 'admin')) ||
      filterRole === role
    return matchSearch && matchRole
  })

  // Stats
  const totalJefes = users.filter(u => u.profile?.role === 'jefe' || u.profile?.role === 'admin').length
  const totalEspecialistas = users.filter(u => u.profile?.role === 'especialista').length
  const totalPadres = users.filter(u => u.profile?.role === 'padre').length
  const totalActivos = users.filter(u => u.profile?.is_active !== false).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} usuarios registrados en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarUsuarios}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Recargar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={totalActivos} label="Activos" icon={UserCheck} color="bg-emerald-500" />
        <StatCard value={totalJefes} label="Jefes" icon={Crown} color="bg-purple-500" />
        <StatCard value={totalEspecialistas} label="Especialistas" icon={Stethoscope} color="bg-blue-500" />
        <StatCard value={totalPadres} label="Padres" icon={Heart} color="bg-pink-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los roles</option>
          <option value="jefe">Jefe</option>
          <option value="especialista">Especialista</option>
          <option value="padre">Padre / Tutor</option>
        </select>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 && (
          <div className="card-pro p-12 text-center">
            <Users size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron usuarios</p>
          </div>
        )}
        {filteredUsers.map(user => {
          const isExpanded = expandedUser === user.id
          const isActive = user.profile?.is_active !== false
          const role = user.profile?.role || 'padre'

          return (
            <div key={user.id} className={`card-pro overflow-hidden transition-all duration-200
              ${!isActive ? 'opacity-60' : ''}`}>
              {/* User Row */}
              <div className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0
                  ${role === 'jefe' || role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : role === 'especialista' ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                  {(user.profile?.full_name || user.email).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {user.profile?.full_name || 'Sin nombre'}
                    </p>
                    <RoleBadge role={role} />
                    {!isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                        INACTIVO
                      </span>
                    )}
                    {!user.email_confirmed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
                        Sin verificar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                  {user.profile?.specialty && (
                    <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1">
                      <Briefcase size={10} />
                      {user.profile.specialty}
                    </p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Role Selector */}
                  {savingRole === user.id ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  ) : (
                    <RoleSelector
                      currentRole={role}
                      onSelect={(newRole) => handleChangeRole(user, newRole)}
                    />
                  )}

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(user)}
                    title={isActive ? 'Desactivar usuario' : 'Activar usuario'}
                    className={`p-2 rounded-lg transition-colors ${isActive
                      ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 bg-slate-50 dark:bg-slate-900/50 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Meta info */}
                    <div className="col-span-1 space-y-2 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        Creado: {new Date(user.created_at).toLocaleDateString('es')}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock size={11} />
                        Último acceso: {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString('es')
                          : 'Nunca'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Ticket size={11} />
                        Tokens: <strong className="text-slate-700 dark:text-slate-300">{user.profile?.tokens ?? 0}</strong>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex flex-wrap gap-2">
                      {/* Change Password */}
                      <button
                        onClick={() => { setChangingPasswordFor(user); setNewPassword(''); setConfirmPassword('') }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                          text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-all"
                      >
                        <Lock size={12} /> Cambiar contraseña
                      </button>

                      {/* Send Reset Email */}
                      <button
                        onClick={() => handleSendResetEmail(user)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                          text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 transition-all"
                      >
                        <Send size={12} /> Enviar reset
                      </button>

                      {/* Edit Tokens */}
                      {editingTokensFor === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newTokens}
                            onChange={e => setNewTokens(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                              bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateTokens(user.id)}
                            disabled={savingTokens}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {savingTokens ? <Loader2 size={12} className="animate-spin" /> : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditingTokensFor(null)}
                            className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingTokensFor(user.id); setNewTokens(user.profile?.tokens || 0) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                            text-slate-600 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 transition-all"
                        >
                          <Ticket size={12} /> Editar tokens
                        </button>
                      )}

                      {/* Confirm email */}
                      {!user.email_confirmed && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/admin/users', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'confirm_email', userId: user.id }),
                              })
                              const json = await res.json()
                              if (json.error) throw new Error(json.error)
                              toast.success('✅ Email confirmado')
                              cargarUsuarios()
                            } catch (err: any) {
                              toast.error('Error: ' + err.message)
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                            bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all"
                        >
                          <CheckCircle2 size={12} /> Confirmar email
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Change Password Modal */}
      {changingPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-800 dark:text-slate-200">Cambiar contraseña</h3>
              <button onClick={() => setChangingPasswordFor(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Usuario: <strong className="text-slate-700 dark:text-slate-300">
                {changingPasswordFor.profile?.full_name || changingPasswordFor.email}
              </strong>
            </p>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              Actualizar contraseña
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                Crear nuevo usuario
              </h3>
              <button onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Nombre completo"
                value={createForm.full_name}
                onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="Email"
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="Contraseña (mínimo 6 caracteres)"
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="jefe">👑 Jefe — Acceso total</option>
                <option value="especialista">🩺 Especialista — Terapeuta / Clínico</option>
                <option value="padre">🌱 Padre / Tutor — Portal de familias</option>
              </select>
              {createForm.role === 'especialista' && (
                <input
                  placeholder="Especialidad (ej: Psicología, ABA, Terapia Ocupacional)"
                  value={createForm.specialty}
                  onChange={e => setCreateForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <button
              onClick={handleCreateUser}
              disabled={creatingUser}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
                text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creatingUser ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Crear usuario
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
