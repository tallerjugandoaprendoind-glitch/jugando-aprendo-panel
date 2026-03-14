'use client'

import { useI18n } from '@/lib/i18n-context'

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Users, LogOut, Calendar, FileText,
  User, Loader2, Menu, X, Stethoscope, Activity,
  Shield, Settings, Key, ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import EspecialistaHome from './components/EspecialistaHome'
import MisPacientes from './components/MisPacientes'
import MisEvaluaciones from './components/MisEvaluaciones'
import MiAgenda from './components/MiAgenda'
import MiPerfil from './components/MiPerfil'
import MisFormularios from './components/MisFormularios'



function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left text-sm
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
    >
      <Icon size={18} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="font-semibold truncate flex-1">{label}</span>
    </button>
  )
}

export default function EspecialistaDashboard() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useI18n()
  const NAV_ITEMS = [
    { id: 'inicio',        icon: LayoutDashboard, label: t('nav.inicio') },
    { id: 'pacientes',     icon: Users,           label: t('nav.mispacientes') },
    { id: 'formularios',   icon: FileText,        label: t('nav.misformularios') },
    { id: 'evaluaciones',  icon: Activity,        label: t('nav.misevaluaciones') },
    { id: 'agenda',        icon: Calendar,        label: t('nav.miagenda') },
    { id: 'perfil',        icon: User,            label: t('nav.miperfil') },
  ]
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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof || (prof.role !== 'especialista' && prof.role !== 'admin')) {
        if (prof?.role === 'jefe') { router.push('/admin'); return }
        if (prof?.role === 'padre') { router.push('/padre'); return }
        router.push('/login'); return
      }
      setProfile(prof)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.warning('Mínimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Contraseña actualizada')
      setShowChangePassword(false)
    } catch (e: any) { toast.error(e.message) }
    finally { setChangingPassword(false) }
  }

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':       return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
      case 'pacientes':    return <MisPacientes />
      case 'formularios':  return <MisFormularios userId={profile.id} />
      case 'evaluaciones': return <MisEvaluaciones userId={profile.id} />
      case 'agenda':       return <MiAgenda />
      case 'perfil':       return <MiPerfil profile={profile} onUpdate={loadProfile} />
      default:             return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
    }
  }

  const PAGE_TITLES: Record<string, string> = {
    inicio: 'Panel Principal', pacientes: 'Mis Pacientes',
    formularios: 'Formularios Clínicos', evaluaciones: 'Mis Evaluaciones',
    agenda: 'Mi Agenda', perfil: 'Mi Perfil',
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-xl">
          <Stethoscope size={28} className="text-white" />
        </div>
        <Loader2 size={20} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Cargando panel clínico...</p>
      </div>
    </div>
  )

  const userName = profile?.full_name || 'Especialista'
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
              <Stethoscope size={9} /> Panel Clínico
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-700">{userName}</p>
              <p className="text-[10px] truncate text-slate-400">{profile?.specialty || 'Especialista Clínico'}</p>
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
                <LogOut size={14} /> { t('common.cerrarSesion') }
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
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
                Jugando Aprendo · Panel Especialista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('perfil')}
              className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span className="text-xs font-medium text-slate-500 hidden sm:block">{userName.split(' ')[0]}</span>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-black shadow">
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
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                <item.icon size={17} />
              </div>
              <span className={`font-bold transition-colors truncate w-full text-center px-0.5
                ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                style={{ fontSize: 9 }}>
                {item.label.replace('Mi ', '').replace('Mis ', '')}
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
              <h3 className="font-black text-slate-800">Cambiar Contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                {...{placeholder: t('ui.new_password')}}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                {...{placeholder: t('ui.confirm_password')}}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
