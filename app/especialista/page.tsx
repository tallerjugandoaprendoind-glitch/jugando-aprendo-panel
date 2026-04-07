'use client'

import { useI18n } from '@/lib/i18n-context'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Users, LogOut, Calendar, FileText,
  User, Loader2, Menu, X, Stethoscope, MessageCircle,
  Key, ChevronRight, Sparkles, Maximize2, Minimize2, Minus,
  Zap, Bell
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import EspecialistaHome from './components/EspecialistaHome'
import MisPacientes from './components/MisPacientes'
import DashboardHome from '@/app/admin/components/DashboardHome'
import PatientsView from '@/app/admin/components/PatientsView'
import ChatConAdmin from './components/ChatConAdmin'
import MiAgenda from './components/MiAgenda'
import MiPerfil from './components/MiPerfil'
import MisFormularios from './components/MisFormularios'
import LocaleSelector from '@/app/components/LocaleSelector'
import { ThemeToggleButton, useTheme } from '@/components/ThemeContext'
import ARIAAgentChat from '@/app/admin/components/ARIAAgentChat'
import InteligenciaHubView from '@/app/admin/components/InteligenciaHubView'

function SidebarLink({ icon: Icon, label, active, onClick, small, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left
        ${active
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/50'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        } ${small ? 'text-xs' : 'text-sm'}`}
    >
      <Icon size={small ? 15 : 17} className={`flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
      <span className={`font-semibold truncate flex-1 ${small ? 'text-xs' : ''}`}>{label}</span>
      {badge > 0 && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0
          ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function EspecialistaDashboard() {
  const router = useRouter()
  const toast = useToast()
  const { t } = useI18n()
  const { isDark } = useTheme()

  const NAV_ITEMS = [
    { id: 'inicio',       icon: LayoutDashboard, label: t('nav.inicio') },
    { id: 'agenda',       icon: Calendar,        label: 'Agenda' },
    { id: 'pacientes',    icon: Users,           label: 'Pacientes' },
    { id: 'prediccion',   icon: Zap,             label: 'Análisis Predictivo' },
    { id: 'evaluaciones', icon: MessageCircle,   label: 'Chat Equipo' },
    { id: 'perfil',       icon: User,            label: t('nav.miperfil') },
  ]

  const PAGE_TITLES: Record<string, string> = {
    inicio:       'Panel Principal',
    agenda:       'Agenda',
    pacientes:    'Pacientes',
    prediccion:   'Análisis Predictivo',
    evaluaciones: 'Chat Equipo',
    perfil:       'Mi Perfil',
  }

  const [activeView, setActiveView]                 = useState('inicio')
  const [profile, setProfile]                       = useState<any>(null)
  const [loading, setLoading]                       = useState(true)
  const [sidebarOpen, setSidebarOpen]               = useState(false)
  const [showProfileMenu, setShowProfileMenu]       = useState(false)
  const [showNotifications, setShowNotifications]   = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword]               = useState('')
  const [confirmPassword, setConfirmPassword]       = useState('')
  const [changingPassword, setChangingPassword]     = useState(false)
  const [ariaOpen, setAriaOpen]                     = useState(false)
  const [ariaExpanded, setAriaExpanded]             = useState(false)
  const [ariaMinimized, setAriaMinimized]           = useState(false)
  const [activeChild, setActiveChild]               = useState<{id: string, name: string} | null>(null)

  useEffect(() => { if (activeView !== 'pacientes') setActiveChild(null) }, [activeView])

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof || (prof.role !== 'especialista' && prof.role !== 'admin')) {
        if (prof?.role === 'jefe') { router.push('/admin'); return }
        if (prof?.role === 'padre') { router.push('/padre'); return }
        if (prof?.role === 'secretaria') { router.push('/secretaria'); return }
        router.push('/login'); return
      }
      setProfile(prof)
    } catch { router.push('/login') }
    finally { setLoading(false) }
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
      setNewPassword(''); setConfirmPassword('')
    } catch (e: any) { toast.error(e.message) }
    finally { setChangingPassword(false) }
  }

  // Adapta los destinos del admin ('ninos','agenda') al sistema del especialista
  const adminNavigateTo = (view: string) => {
    if (view === 'ninos') setActiveView('pacientes')
    else if (view === 'agenda') setActiveView('agenda')
    else setActiveView(view)
  }

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':       return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
      case 'pacientes':    return <PatientsView onPatientSelect={(id, name) => id && name ? setActiveChild({ id, name }) : setActiveChild(null)} />
      case 'prediccion':   return <InteligenciaHubView />
      case 'formularios':  return <MisFormularios userId={profile.id} />
      case 'evaluaciones': return <ChatConAdmin userId={profile.id} userName={profile.full_name || 'Especialista'} userAvatarUrl={profile.avatar_url} onAvatarUpdate={(url: string) => setProfile((p: any) => ({ ...p, avatar_url: url }))} />
      case 'agenda':       return <MiAgenda />
      case 'perfil':       return <MiPerfil profile={profile} onUpdate={loadProfile} onAvatarUpdate={(url: string) => setProfile((p: any) => ({ ...p, avatar_url: url }))} onLogout={handleLogout} />
      default:             return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-300/50">
            <Stethoscope size={30} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles size={9} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-black text-slate-800 text-sm">Jugando Aprendo</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('especialista.cargandoPanel')}</p>
        </div>
        <Loader2 size={18} className="animate-spin text-blue-500" />
      </div>
    </div>
  )

  const userName = profile?.full_name || 'Especialista'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#f8f8fb] font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:static z-40 h-full w-[215px] flex flex-col sidebar-transition
        border-r transition-transform duration-300
        ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-100'} shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-[60px] border-b flex-shrink-0
          ${isDark ? 'border-[#21262d]' : 'border-slate-100/80'}`}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-[13px] leading-tight truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Jugando Aprendo
            </p>
            <p className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Panel Clínico
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
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
        <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
          <div
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors
              ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {userName}
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {profile?.specialty || t('especialista.especialistaClinico')}
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
          </div>
          {showProfileMenu && (
            <div className={`mt-1 rounded-xl shadow-lg overflow-hidden border
              ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'}`}>
              <button
                onClick={() => { setShowChangePassword(true); setShowProfileMenu(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors
                  ${isDark ? 'text-slate-300 hover:bg-[#21262d]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Key size={14} /> Cambiar contraseña
              </button>
              <div className={`h-px mx-2 ${isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`} />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} /> {t('common.cerrarSesion')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay - removed, sidebar is desktop only */}

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className={`h-14 md:h-16 flex items-center justify-between px-3 md:px-6 flex-shrink-0 border-b
          ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className={`text-sm md:text-base font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {PAGE_TITLES[activeView] || 'Panel'}
              </h1>
              <p className={`text-[10px] hidden sm:block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Jugando Aprendo · {t('especialista.titulo')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSelector compact={true} />
            <ThemeToggleButton />
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg relative transition-colors
                ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        {activeView === 'evaluaciones' ? (
          <div className="flex-1 overflow-hidden p-3 md:p-4">
            {renderView()}
          </div>
        ) : activeView === 'pacientes' ? (
          <div className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
            {renderView()}
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-[#0d1117]' : 'bg-[#f8f8fb]'}`}>
            <div className="p-3 md:p-4 pb-20 md:pb-4">
              {renderView()}
            </div>
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 px-2 py-1.5">
        <div className="flex items-center">
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className="flex flex-col items-center gap-1 py-1 flex-1 min-w-0 transition-all active:scale-95">
                <div className={`w-8 h-6 rounded-lg flex items-center justify-center transition-all
                  ${isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-300' : 'text-slate-400'}`}>
                  <item.icon size={15} />
                </div>
                <span className={`font-bold truncate w-full text-center px-0.5 transition-colors
                  ${isActive ? 'text-blue-600' : 'text-slate-400'}`} style={{ fontSize: 9 }}>
                  {item.label.replace('Mi ', '').replace('Mis ', '')}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-slate-800">{t('especialista.cambiarPass')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mínimo 6 caracteres</p>
              </div>
              <button onClick={() => setShowChangePassword(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="password" placeholder={t('ui.new_password')} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              <input type="password" placeholder={t('ui.confirm_password')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              <button onClick={handleChangePassword} disabled={changingPassword}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                {changingPassword ? <Loader2 size={15} className="animate-spin" /> : null}
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── ARIA FLOTANTE ── */}
      {ariaOpen && (
        <div className="fixed bottom-6 right-4 md:right-6 z-[90] w-[calc(100vw-2rem)] rounded-3xl shadow-2xl overflow-hidden border flex flex-col transition-all duration-300 bg-white dark:bg-[#161b22] border-slate-200 dark:border-[#30363d]"
          style={{
            maxWidth: ariaExpanded ? '900px' : '448px',
            height: ariaMinimized ? '54px' : ariaExpanded ? '860px' : '560px',
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="9" width="16" height="13" rx="3" fill="white" fillOpacity="0.9"/>
                  <rect x="9" y="13" width="3" height="3" rx="1" fill="#7c3aed"/>
                  <rect x="16" y="13" width="3" height="3" rx="1" fill="#7c3aed"/>
                  <rect x="11" y="17" width="6" height="1.5" rx="0.75" fill="#7c3aed"/>
                  <rect x="13" y="6" width="2" height="4" rx="1" fill="white" fillOpacity="0.9"/>
                  <circle cx="14" cy="5.5" r="1.5" fill="white"/>
                  <rect x="2" y="12" width="2.5" height="5" rx="1.25" fill="white" fillOpacity="0.7"/>
                  <rect x="23.5" y="12" width="2.5" height="5" rx="1.25" fill="white" fillOpacity="0.7"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight flex items-center gap-2">
                  ARIA <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[9px] font-black">IA</span>
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                  <p className="text-violet-200 text-[10px] font-medium">{activeChild ? `Caso: ${activeChild.name}` : 'Asistente Clínico · Activa'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setAriaMinimized(m => !m)} className="p-1.5 hover:bg-white/20 rounded-xl transition-all" title={ariaMinimized ? 'Restaurar' : 'Minimizar'}>
                <Minus size={15} className="text-white"/>
              </button>
              <button onClick={() => { setAriaExpanded(x => !x); setAriaMinimized(false) }} className="p-1.5 hover:bg-white/20 rounded-xl transition-all" title={ariaExpanded ? 'Reducir' : 'Ampliar'}>
                {ariaExpanded ? <Minimize2 size={15} className="text-white"/> : <Maximize2 size={15} className="text-white"/>}
              </button>
              <button onClick={() => { setAriaOpen(false); setAriaExpanded(false); setAriaMinimized(false) }} className="p-1.5 hover:bg-white/20 rounded-xl transition-all" title="Cerrar">
                <X size={16} className="text-white"/>
              </button>
            </div>
          </div>
          {!ariaMinimized && (
            <div className="flex-1 min-h-0">
              <ARIAAgentChat userId={profile?.id || ''} compact={true}
                childId={activeChild?.id}
                childName={activeChild?.name}
                contexto={activeChild ? 'paciente' : 'general'} />
            </div>
          )}
        </div>
      )}

      {/* Botón flotante ARIA */}
      {!ariaOpen && (
        <button onClick={() => setAriaOpen(true)}
          className="fixed bottom-6 right-4 md:right-6 z-[91] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-violet-600 to-indigo-600"
          title="ARIA — Asistente IA">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="9" width="16" height="13" rx="3" fill="white" fillOpacity="0.9"/>
            <rect x="9" y="13" width="3" height="3" rx="1" fill="#7c3aed"/>
            <rect x="16" y="13" width="3" height="3" rx="1" fill="#7c3aed"/>
            <rect x="11" y="17" width="6" height="1.5" rx="0.75" fill="#7c3aed"/>
            <rect x="13" y="6" width="2" height="4" rx="1" fill="white" fillOpacity="0.9"/>
            <circle cx="14" cy="5.5" r="1.5" fill="white"/>
            <rect x="2" y="12" width="2.5" height="5" rx="1.25" fill="white" fillOpacity="0.7"/>
            <rect x="23.5" y="12" width="2.5" height="5" rx="1.25" fill="white" fillOpacity="0.7"/>
          </svg>
          <span className="pointer-events-none absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-20"/>
        </button>
      )}
    </div>
  )
}
