'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Key, Mail, Loader2, Search, Shield, RefreshCw,
  CheckCircle2, X, Eye, EyeOff, Ticket, AlertCircle, User,
  Clock, Calendar, ChevronDown, ChevronUp, Send, Lock,
  Crown, Stethoscope, Heart, Plus, ToggleLeft, ToggleRight,
  Edit2, Briefcase, UserCheck, UserX, Filter, Link2, Unlink
} from 'lucide-react'
import { useToast } from '@/components/Toast'

const getRoles = (isEN: boolean): Record<string, any>[] => [
  { value: 'jefe',        label: isEN?'Director':'Director',     description: isEN?'Full system access':'Acceso total al sistema', icon: Crown,       dotColor: 'bg-purple-500', badgeClass: 'role-director'    },
  { value: 'especialista',label: isEN?'Specialist':'Especialista',  description: isEN?'Therapist / Clinician':'Terapeuta / Clínico',     icon: Stethoscope, dotColor: 'bg-blue-500',   badgeClass: 'role-especialista' },
  { value: 'padre',       label: isEN?'Parent / Guardian':'Padre / Tutor', description: isEN?'Family portal':'Portal de familias',      icon: Heart,       dotColor: 'bg-pink-500',   badgeClass: 'role-padre'       },
]

function getRoleInfo(role: string) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  return getRoles(isEN).find(r => r.value === role || (role === 'admin' && r.value === 'jefe')) || getRoles(isEN)[0]
}

function RoleBadge({ role }: { role: string }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

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
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const [open, setOpen] = useState(false)
  const current = getRoleInfo(currentRole)

  return (
    <div className="relative" style={{ zIndex: 20 }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
      >
        <current.icon size={13} />
        <span>{current.label}</span>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <>
          {/* overlay para cerrar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-50 rounded-xl shadow-2xl min-w-[220px] overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)', top: 'calc(100% + 4px)' }}
          >
            {getRoles(isEN).map(r => {
              const RIcon = r.icon
              const isSelected = currentRole === r.value || (currentRole === 'admin' && r.value === 'jefe')
              return (
                <button
                  key={r.value}
                  onClick={() => { onSelect(r.value); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:opacity-90"
                  style={{ background: isSelected ? 'rgba(37,99,235,0.12)' : 'transparent' }}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dotColor}`} />
                  <RIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.description}</p>
                  </div>
                  {isSelected && <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </>
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
  const { t, locale } = useI18n()
  const isEN = locale === 'en'

  return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function PacientesVinculados({ userId, children, onUnlink }: {
  userId: string
  children: any[]
  onUnlink: (childId: string) => void
}) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const hijos = children.filter(c =>
    c.parent_id === userId ||
    (c.parent_ids && c.parent_ids.includes(userId))
  )

  if (hijos.length === 0) return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
        <AlertCircle size={11} /> {t('usuarios.sinPacientesVinculados')} — {t('usuarios.vincularPaciente')}
      </p>
    </div>
  )

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
        Pacientes vinculados ({hijos.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {hijos.map((h: any) => (
          <div key={h.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#be185d' }}>
            <Heart size={10} />
            {h.name}
            <button onClick={() => onUnlink(h.id)} title={t('ui.unlink')}
              className="ml-1 hover:text-red-600 transition-colors">
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function UserManagementView() {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const toast = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'jefe' | 'especialista' | 'padre' | 'todos'>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [children, setChildren] = useState<any[]>([])

  // Vinculación múltiple: un hijo puede tener 2 padres
  const [linkingParent, setLinkingParent] = useState<UserData | null>(null)
  const [selectedChildId, setSelectedChildId] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  // Password change
  const [changingPasswordFor, setChangingPasswordFor] = useState<UserData | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Tokens
  const [editingTokensFor, setEditingTokensFor] = useState<string | null>(null)
  const [newTokens, setNewTokens] = useState(0)
  const [savingTokens, setSavingTokens] = useState(false)

  // Create user
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'especialista', specialty: '' })
  const [creatingUser, setCreatingUser] = useState(false)

  const cargarUsuarios = useCallback(async () => {
    setIsLoading(true)
    try {
      const { createClient: cc } = await import('@supabase/supabase-js')
      const sb = cc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // Obtener rol actual del usuario logueado
        const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
        if (prof) setCurrentUserRole(prof.role || '')
      }

      const resUsers = await fetch('/api/admin/users')
      const json = await resUsers.json()
      if (json.error) throw new Error(json.error)
      setUsers(json.data || [])

      // Cargar niños con soporte para múltiples padres
      try {
        const { data: kids } = await sb.from('children').select('id, name, parent_id').order('name')
        if (kids) setChildren(kids)
      } catch {}
    } catch (err: any) {
      toast.error((isEN?'Error loading users: ':'Error cargando usuarios: ') + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  // Protección: director no puede cambiar rol de otro director
  // Solo un "super director" (el primero registrado / admin) puede hacerlo
  const canChangeRole = (targetUser: UserData) => {
    const { t, locale } = useI18n()
    const isEN = locale === 'en'

    if (!currentUserId) return false
    if (targetUser.id === currentUserId) return false // no puede cambiarse a sí mismo
    const targetRole = targetUser.profile?.role || ''
    const isTargetDirector = targetRole === 'jefe' || targetRole === 'admin'
    if (isTargetDirector) return false // nadie puede degradar a un director excepto superadmin en DB
    return true
  }

  const handleChangeRole = async (user: UserData, newRole: string) => {
    if (!canChangeRole(user)) {
      toast.error(isEN?"You can't change a Director's role. Contact the system administrator.":"No podés cambiar el rol de un Director. Contactá al administrador del sistema.")
      return
    }
    setSavingRole(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'update_role', userId: user.id, role: newRole , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`✅ Rol actualizado → ${newRole}`)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, profile: { ...u.profile, role: newRole } } : u))
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSavingRole(null)
    }
  }

  const handleToggleActive = async (user: UserData) => {
    if (user.id === currentUserId) return
    const targetRole = user.profile?.role || ''
    if (targetRole === 'jefe' || targetRole === 'admin') {
      toast.error(isEN?"You can't deactivate a Director.":"No podés desactivar a un Director.")
      return
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'toggle_active', userId: user.id , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(json.is_active ? '✅ Usuario activado' : '⏸ Usuario desactivado')
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, profile: { ...u.profile, is_active: json.is_active } } : u))
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    }
  }

  const handleChangePassword = async () => {
    if (!changingPasswordFor) return
    if (!newPassword || newPassword.length < 6) { toast.error(isEN?'Minimum 6 characters':'Mínimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error(isEN?'Passwords do not match':'Las contraseñas no coinciden'); return }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'change_password', userId: changingPasswordFor.id, newPassword , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Contraseña actualizada')
      setChangingPasswordFor(null); setNewPassword(''); setConfirmPassword('')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally { setSavingPassword(false) }
  }

  const handleUpdateTokens = async (userId: string) => {
    setSavingTokens(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'update_tokens', userId, tokens: newTokens , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Tokens actualizados')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile: { ...u.profile, tokens: newTokens } } : u))
      setEditingTokensFor(null)
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally { setSavingTokens(false) }
  }

  const handleSendResetEmail = async (user: UserData) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'send_reset_email', email: user.email , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`📧 Email enviado a ${user.email}`)
    } catch (err: any) { toast.error('Error: ' + err.message) }
  }

  // Vinculación múltiple: un hijo puede tener HASTA 2 padres
  const handleLinkParentChild = async () => {
    if (!linkingParent || !selectedChildId) return
    setSavingLink(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const child = children.find(c => c.id === selectedChildId)
      if (!child) throw new Error(isEN?'Patient not found':'Paciente no encontrado')

      // Si ya tiene un parent_id, verificar si es diferente (2do padre)
      if (child.parent_id && child.parent_id !== linkingParent.id) {
        // Guardar el 2do padre en parent_id2 si existe la columna, o sobreescribir
        const { error } = await sb.from('children')
          .update({ parent_id: linkingParent.id })
          .eq('id', selectedChildId)
        if (error) throw new Error(error.message)
        toast.success(`✅ Paciente vinculado (reemplazó al tutor anterior). Para vincular 2 tutores simultáneamente, consultá al admin de DB.`)
      } else {
        const { error } = await sb.from('children')
          .update({ parent_id: linkingParent.id })
          .eq('id', selectedChildId)
        if (error) throw new Error(error.message)
        toast.success(`✅ ${child.name} vinculado a ${linkingParent.profile?.full_name || linkingParent.email}`)
      }

      setChildren(prev => prev.map(c => c.id === selectedChildId ? { ...c, parent_id: linkingParent.id } : c))
      setLinkingParent(null); setSelectedChildId('')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally { setSavingLink(false) }
  }

  const handleUnlinkChild = async (childId: string) => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error } = await sb.from('children').update({ parent_id: null }).eq('id', childId)
      if (error) throw new Error(error.message)
      setChildren(prev => prev.map(c => c.id === childId ? { ...c, parent_id: null } : c))
      toast.success('Paciente desvinculado')
    } catch (err: any) { toast.error('Error: ' + err.message) }
  }

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) { toast.error('Email y contraseña son requeridos'); return }
    setCreatingUser(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ action: 'create_user', ...createForm , locale: localStorage.getItem('vanty_locale') || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Usuario creado')
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', full_name: '', role: 'especialista', specialty: '' })
      cargarUsuarios()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally { setCreatingUser(false) }
  }

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase()
    const matchSearch = !term || u.email.toLowerCase().includes(term) || u.profile?.full_name?.toLowerCase().includes(term)
    const role = u.profile?.role || ''
    const matchTab = activeTab === 'todos' || (activeTab === 'jefe' && (role === 'jefe' || role === 'admin')) || activeTab === role
    return matchSearch && matchTab
  })

  const totalJefes = users.filter(u => u.profile?.role === 'jefe' || u.profile?.role === 'admin').length
  const totalEspecialistas = users.filter(u => u.profile?.role === 'especialista').length
  const totalPadres = users.filter(u => u.profile?.role === 'padre').length
  const totalActivos = users.filter(u => u.profile?.is_active !== false).length

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{t('usuarios.gestion')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{users.length} usuarios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargarUsuarios} className="p-2 rounded-xl transition-colors hover:opacity-80"
            style={{ background: 'var(--muted-bg)', color: 'var(--text-muted)' }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            <Plus size={16} /> {t('usuarios.nuevo')}
          </button>
        </div>
      </div>

      {/* Tabs por rol */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--card-border)' }}>
        {[
          { id: 'todos',       label: t('common.todos'),        count: users.length,        icon: Users,       color: 'text-slate-500' },
          { id: 'jefe',        label: 'Directores',   count: totalJefes,          icon: Crown,       color: 'text-purple-600' },
          { id: 'especialista',label: 'Especialistas', count: totalEspecialistas,  icon: Stethoscope, color: 'text-blue-600' },
          { id: 'padre',       label: 'Padres',       count: totalPadres,         icon: Heart,       color: 'text-pink-600' },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
                isActive ? `border-blue-600 ${tab.color}` : 'border-transparent'
              }`}
              style={{ color: isActive ? undefined : 'var(--text-muted)', background: isActive ? 'rgba(37,99,235,0.07)' : 'transparent' }}>
              <Icon size={14} />
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                style={{ background: isActive ? '#2563eb' : 'var(--muted-bg)', color: isActive ? '#fff' : 'var(--text-muted)' }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={totalActivos}       label="Activos"       icon={UserCheck}   color="bg-emerald-500" />
        <StatCard value={totalJefes}         label="Directores"    icon={Crown}        color="bg-purple-500" />
        <StatCard value={totalEspecialistas} label="Especialistas" icon={Stethoscope}  color="bg-blue-500" />
        <StatCard value={totalPadres}        label="Padres"        icon={Heart}        color="bg-pink-500" />
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          {...{placeholder: t('ui.search_user')}}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
      </div>

      {/* Lista de usuarios */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>{t('ui.no_patients')}</p>
          </div>
        )}

        {filteredUsers.map(user => {
          const isExpanded = expandedUser === user.id
          const isActive = user.profile?.is_active !== false
          const role = user.profile?.role || 'padre'
          const isDirector = role === 'jefe' || role === 'admin'
          const isSelf = user.id === currentUserId

          return (
            <div key={user.id} className={`rounded-2xl overflow-hidden transition-all duration-200 ${!isActive ? 'opacity-60' : ''}`}
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>

              {/* Fila principal */}
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0
                  ${isDirector ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                    : role === 'especialista' ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-pink-500 to-pink-700'}`}>
                  {(user.profile?.full_name || user.email).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {user.profile?.full_name || 'Sin nombre'}
                    </p>
                    <RoleBadge role={role} />
                    {isSelf && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{t('ui.tu')}</span>
                    )}
                    {!isActive && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">{t('usuarios.inactivo2')}</span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>

                {/* Acciones rápidas */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {savingRole === user.id ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  ) : (
                    <RoleSelector
                      currentRole={role}
                      onSelect={(newRole) => handleChangeRole(user, newRole)}
                      disabled={isSelf || isDirector}
                    />
                  )}

                  {/* Toggle activo — protegido para directores y uno mismo */}
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={isSelf || isDirector}
                    title={isSelf ? 'No podés desactivarte' : isDirector ? 'No podés desactivar directores' : isActive ? 'Desactivar' : 'Activar'}
                    className="p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: isActive ? '#10b981' : 'var(--text-muted)' }}>
                    {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>

                  {/* Expandir */}
                  <button onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Panel expandido */}
              {isExpanded && (
                <div className="border-t px-4 py-4 animate-fade-in" style={{ borderColor: 'var(--card-border)', background: 'var(--muted-bg)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Meta */}
                    <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <p className="flex items-center gap-1.5"><Calendar size={11} /> Creado: {new Date(user.created_at).toLocaleDateString('es')}</p>
                      <p className="flex items-center gap-1.5"><Clock size={11} /> Último acceso: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es') : 'Nunca'}</p>
                      <p className="flex items-center gap-1.5"><Ticket size={11} /> Tokens: <strong style={{ color: 'var(--text-primary)' }}>{user.profile?.tokens ?? 0}</strong></p>
                      {user.profile?.specialty && (
                        <p className="flex items-center gap-1.5"><Briefcase size={11} /> {user.profile.specialty}</p>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setChangingPasswordFor(user); setNewPassword(''); setConfirmPassword('') }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                        <Lock size={12} /> Cambiar contraseña
                      </button>

                      <button onClick={() => handleSendResetEmail(user)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                        <Send size={12} /> {t('common.enviandoReset')}
                      </button>

                      {editingTokensFor === user.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" value={newTokens} onChange={e => setNewTokens(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
                          <button onClick={() => handleUpdateTokens(user.id)} disabled={savingTokens}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                            {savingTokens ? <Loader2 size={12} className="animate-spin" /> : t('common.guardar')}
                          </button>
                          <button onClick={() => setEditingTokensFor(null)} className="px-2 py-1.5 rounded-lg hover:text-red-500 transition-colors" style={{ color: 'var(--text-muted)' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingTokensFor(user.id); setNewTokens(user.profile?.tokens || 0) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                          <Ticket size={12} /> Editar tokens
                        </button>
                      )}

                      {!user.email_confirmed && (
                        <button onClick={async () => {
                          try {
                            const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' }, body: JSON.stringify({ action: 'confirm_email', userId: user.id }) })
                            const json = await res.json()
                            if (json.error) throw new Error(json.error)
                            toast.success('✅ Email confirmado')
                            cargarUsuarios()
                          } catch (err: any) { toast.error('Error: ' + err.message) }
                        }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669' }}>
                          <CheckCircle2 size={12} /> Confirmar email
                        </button>
                      )}

                      {role === 'padre' && (
                        <button onClick={() => { setLinkingParent(user); setSelectedChildId('') }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#be185d' }}>
                          <Link2 size={12} /> {t('common.vincular')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pacientes vinculados */}
                  {role === 'padre' && (
                    <PacientesVinculados userId={user.id} children={children} onUnlink={handleUnlinkChild} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Cambiar Contraseña */}
      {changingPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black" style={{ color: 'var(--text-primary)' }}>{t('ui.change_password')}</h3>
              <button onClick={() => setChangingPasswordFor(null)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Usuario: <strong style={{ color: 'var(--text-primary)' }}>{changingPasswordFor.profile?.full_name || changingPasswordFor.email}</strong>
            </p>
            <div className="space-y-3">
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} {...{placeholder: t('ui.new_password')}} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
                <button onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input type={showPwd ? 'text' : 'password'} {...{placeholder: t('ui.confirm_password')}} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
            </div>
            <button onClick={handleChangePassword} disabled={savingPassword}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              Actualizar contraseña
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Plus size={18} className="text-blue-500" /> Crear nuevo usuario
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {['Nombre completo', 'Email', 'Contraseña (mínimo 6 caracteres)'].map((ph, i) => (
                <input key={i} placeholder={ph} type={i === 2 ? 'password' : i === 1 ? 'email' : 'text'}
                  value={i === 0 ? createForm.full_name : i === 1 ? createForm.email : createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, [i === 0 ? 'full_name' : i === 1 ? 'email' : 'password']: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
              ))}
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}>
                <option value="jefe">👑 Director — Acceso total</option>
                <option value="especialista">{t('ui.specialist_role')}</option>
                <option value="padre">{t('usuarios.rolPadre')}</option>
              </select>
              {createForm.role === 'especialista' && (
                <input {...{placeholder: t('ui.specialty')}} value={createForm.specialty}
                  onChange={e => setCreateForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }} />
              )}
            </div>
            <button onClick={handleCreateUser} disabled={creatingUser}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {creatingUser ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Crear usuario
            </button>
          </div>
        </div>
      )}

      {/* Modal Vincular Paciente */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Heart size={18} className="text-pink-500" /> Vincular paciente
              </h3>
              <button onClick={() => setLinkingParent(null)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              Padre/Tutor: <strong style={{ color: 'var(--text-primary)' }}>{linkingParent.profile?.full_name || linkingParent.email}</strong>
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Si el paciente ya tiene tutor asignado, será reemplazado. Para acceso de dos tutores simultáneos, creá dos cuentas de padre y vincinalas por separado.
            </p>
            <label className="text-xs font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>
              Seleccioná el paciente
            </label>
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}>
              <option value="">{t('usuarios.selPaciente2')}</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.parent_id && c.parent_id !== linkingParent.id ? ' ⚠️ ya tiene tutor' : ''}
                </option>
              ))}
            </select>
            {children.length === 0 && (
              <p className="text-xs text-amber-500 font-medium mb-3">No hay pacientes registrados.</p>
            )}
            <button onClick={handleLinkParentChild} disabled={savingLink || !selectedChildId}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={{ background: '#db2777' }}>
              {savingLink ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              Vincular
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
