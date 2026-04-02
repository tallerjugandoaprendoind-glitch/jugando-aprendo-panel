'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Calendar, CalendarDays, BarChart3,
  User, LogOut, Menu, X, Loader2, Key,
  ClipboardList, ChevronRight, Sparkles
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
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-left text-sm relative overflow-hidden
        ${active
          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200/50'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
    >
      <Icon size={17} className={`flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`} />
      <span className={`font-semibold truncate flex-1 ${active ? 'text-white' : ''}`}>{label}</span>
      {badge && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-700'}`}>
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

  const [activeView, setActiveView]                 = useState('inicio')
  const [profile, setProfile]                       = useState<any>(null)
  const [loading, setLoading]                       = useState(true)
  const [sidebarOpen, setSidebarOpen]               = useState(false)
  const [showProfileMenu, setShowProfileMenu]       = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword]               = useState('')
  const [confirmPassword, setConfirmPassword]       = useState('')
  const [changingPassword, setChangingPassword]     = useState(false)

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!prof) { router.push('/login'); return }
      if (prof.role === 'secretaria') { setProfile(prof) }
      else if (prof.role === 'jefe' || prof.role === 'admin') { router.push('/admin'); return }
      else if (prof.role === 'padre') { router.push('/padre'); return }
      else if (prof.role === 'especialista') { router.push('/especialista'); return }
      else { router.push('/login'); return }
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

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':     return <SecretariaHome onNavigate={setActiveView} />
      case 'agenda':     return <SecretariaAgenda profile={profile} />
      case 'cronograma': return <SecretariaCronograma />
      case 'reportes':   return <SecretariaReportes />
      case 'perfil':     return <SecretariaPerfil profile={profile} onUpdate={loadProfile} onAvatarUpdate={(url: string) => setProfile((p: any) => ({ ...p, avatar_url: url }))} />
      default:           return <SecretariaHome onNavigate={setActiveView} />
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-300/50">
            <ClipboardList size={30} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles size={9} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-black text-slate-800 text-sm">Jugando Aprendo</p>
          <p className="text-xs text-slate-400 mt-0.5">Cargando panel administrativo...</p>
        </div>
        <Loader2 size={18} className="animate-spin text-violet-500" />
      </div>
    </div>
  )

  const userName = profile?.full_name || 'Secretaria'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#f8f8fb] font-sans overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed md:static z-40 h-full w-[215px] flex flex-col
        bg-white border-r border-slate-100 shadow-sm
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-[60px] border-b border-slate-100/80 flex-shrink-0">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[13px] leading-tight text-slate-800">Jugando Aprendo</p>
            <p className="text-[10px] text-slate-400">Panel Administrativo</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100/80">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Secretaria</span>
          </div>
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

        {/* User */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md shadow-violet-200/60 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-700">{userName}</p>
              <p className="text-[10px] truncate text-slate-400">Secretaria(o)</p>
            </div>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-0.5" />
          </div>
          {showProfileMenu && (
            <div className="mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 ring-1 ring-black/5">
              <button
                onClick={() => { setShowChangePassword(true); setShowProfileMenu(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Key size={13} className="text-slate-400" /> Cambiar contraseña
              </button>
              <div className="h-px bg-slate-50 mx-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={13} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-[60px] flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-800">{PAGE_TITLES[activeView] || 'Panel'}</h1>
              <p className="text-[10px] hidden sm:block text-slate-400">Jugando Aprendo · Secretaría</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <LocaleSelector compact={true} />
            <ThemeToggleButton />
            <button
              onClick={() => setActiveView('perfil')}
              className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors ml-1"
            >
              <span className="text-xs font-semibold text-slate-500 hidden sm:block">{userName.split(' ')[0]}</span>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-200/50 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : userInitial}
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={activeView === 'perfil' ? 'pb-24 md:pb-8' : 'p-4 md:p-6 pb-24 md:pb-8'}>
            {renderView()}
          </div>
        </div>
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
                  ${isActive ? 'bg-violet-600 text-white shadow-sm shadow-violet-300' : 'text-slate-400'}`}>
                  <item.icon size={15} />
                </div>
                <span className={`font-bold truncate w-full text-center px-0.5 transition-colors
                  ${isActive ? 'text-violet-600' : 'text-slate-400'}`} style={{ fontSize: 9 }}>
                  {item.label.replace('de Citas', '').replace('de Sesiones', '').replace('de Asistencia', '').trim()}
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
                <h3 className="font-black text-slate-800">Cambiar contraseña</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mínimo 6 caracteres</p>
              </div>
              <button onClick={() => setShowChangePassword(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
              <button onClick={handleChangePassword} disabled={changingPassword}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
                {changingPassword ? <Loader2 size={15} className="animate-spin" /> : null}
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
