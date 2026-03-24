'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Calendar, CalendarDays, BarChart3,
  User, LogOut, Menu, X, Loader2, Settings, Key,
  ClipboardList
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useI18n } from '@/lib/i18n-context'
import LocaleSelector from '@/app/components/LocaleSelector'
import { ThemeToggleButton } from '@/components/ThemeContext'
import SecretariaHome from './components/SecretariaHome'
import SecretariaAgenda from './components/SecretariaAgenda'
import SecretariaCronograma from './components/SecretariaCronograma'
import SecretariaReportes from './components/SecretariaReportes'
import SecretariaPerfil from './components/SecretariaPerfil'

function SidebarLink({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left text-sm
        ${active
          ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
    >
      <Icon size={18} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="font-semibold truncate flex-1">{label}</span>
      {badge && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function SecretariaDashboard() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useI18n()

  const NAV_ITEMS = [
    { id: 'inicio',     icon: LayoutDashboard, label: 'Panel' },
    { id: 'agenda',     icon: Calendar,        label: 'Agenda de Citas' },
    { id: 'cronograma', icon: CalendarDays,    label: 'Cronograma' },
    { id: 'reportes',   icon: BarChart3,       label: 'Reportes' },
    { id: 'perfil',     icon: User,            label: 'Mi Perfil' },
  ]

  const PAGE_TITLES: Record<string, string> = {
    inicio:     'Panel Administrativo',
    agenda:     'Agenda de Citas',
    cronograma: 'Cronograma de Sesiones',
    reportes:   'Reportes de Asistencia',
    perfil:     'Mi Perfil',
  }

  const [activeView, setActiveView] = useState('inicio')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!prof) { router.push('/login'); return }

      // Role check — secretaria role OR redirect to correct panel
      if (prof.role === 'secretaria') {
        setProfile(prof)
      } else if (prof.role === 'jefe' || prof.role === 'admin') {
        router.push('/admin'); return
      } else if (prof.role === 'padre') {
        router.push('/padre'); return
      } else if (prof.role === 'especialista') {
        router.push('/especialista'); return
      } else {
        router.push('/login'); return
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.warning('Mínimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Contraseña actualizada')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':     return <SecretariaHome onNavigate={setActiveView} />
      case 'agenda':     return <SecretariaAgenda profile={profile} />
      case 'cronograma': return <SecretariaCronograma />
      case 'reportes':   return <SecretariaReportes />
      case 'perfil':     return <SecretariaPerfil profile={profile} onUpdate={loadProfile} />
      default:           return <SecretariaHome onNavigate={setActiveView} />
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl">
          <ClipboardList size={28} className="text-white" />
        </div>
        <Loader2 size={20} className="animate-spin text-violet-600" />
        <p className="text-sm font-medium text-slate-500">Cargando panel administrativo...</p>
      </div>
    </div>
  )

  const userName = profile?.full_name || 'Secretaria'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className={`
        fixed md:static z-40 h-full w-60 flex flex-col
        bg-white border-r border-slate-200
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight truncate text-slate-800">Jugando Aprendo</p>
            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <ClipboardList size={9} /> Panel Administrativo
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Secretaria(o)</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <SidebarLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeView === item.id}
              onClick={() => { setActiveView(item.id); setSidebarOpen(false) }}
            />
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div
            className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-700">{userName}</p>
              <p className="text-[10px] truncate text-slate-400">Secretaria(o)</p>
            </div>
            <Settings size={14} className="text-slate-400 flex-shrink-0" />
          </div>
          {showProfileMenu && (
            <div className="mt-1 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              <button
                onClick={() => { setShowChangePassword(true); setShowProfileMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Key size={14} /> Cambiar contraseña
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-800">
                {PAGE_TITLES[activeView] || 'Panel'}
              </h1>
              <p className="text-xs hidden sm:block text-slate-400">
                Jugando Aprendo · Panel Administrativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LocaleSelector compact={true} />
            <ThemeToggleButton />
            <button
              onClick={() => setActiveView('perfil')}
              className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span className="text-xs font-medium text-slate-500 hidden sm:block">{userName.split(' ')[0]}</span>
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-black shadow">
                {userInitial}
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="max-w-5xl mx-auto pb-20 md:pb-6">
            {renderView()}
          </div>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center bg-white border-t border-slate-200 px-1 py-1">
        {NAV_ITEMS.map(item => {
          const isActive = activeView === item.id
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className="flex flex-col items-center gap-0.5 py-2 flex-1 min-w-0 transition-all">
              <div className={`w-9 h-7 rounded-lg flex items-center justify-center transition-all
                ${isActive ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                <item.icon size={17} />
              </div>
              <span className={`font-bold transition-colors truncate w-full text-center px-0.5
                ${isActive ? 'text-violet-600' : 'text-slate-400'}`}
                style={{ fontSize: 9 }}>
                {item.label.replace('de Citas','').replace('de Sesiones','').replace('de Asistencia','')}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-800">Cambiar contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                {changingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
