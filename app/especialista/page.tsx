'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, LogOut, Calendar, FileText,
  User, Loader2, Menu, X, Stethoscope, Bell, ChevronRight,
  Shield
} from 'lucide-react'
import { ThemeToggleButton } from '@/components/ThemeContext'
import { useToast } from '@/components/Toast'
import EspecialistaHome from './components/EspecialistaHome'
import MisPacientes from './components/MisPacientes'
import MisEvaluaciones from './components/MisEvaluaciones'
import MiAgenda from './components/MiAgenda'
import MiPerfil from './components/MiPerfil'

const NAV_ITEMS = [
  { id: 'inicio',       icon: LayoutDashboard, label: 'Inicio'        },
  { id: 'pacientes',    icon: Users,           label: 'Pacientes'     },
  { id: 'evaluaciones', icon: FileText,        label: 'Evaluaciones'  },
  { id: 'agenda',       icon: Calendar,        label: 'Mi Agenda'     },
  { id: 'perfil',       icon: User,            label: 'Mi Perfil'     },
]

function SidebarLink({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left text-sm
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
    >
      <Icon size={18} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
      <span className="font-semibold truncate flex-1">{label}</span>
      {active && <ChevronRight size={14} className="text-white/70" />}
    </button>
  )
}

export default function EspecialistaDashboard() {
  const router = useRouter()
  const toast = useToast()
  const [activeView, setActiveView] = useState('inicio')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Redirigir si no es especialista
      if (!prof || (prof.role !== 'especialista' && prof.role !== 'admin')) {
        if (prof?.role === 'jefe') { router.push('/admin'); return }
        if (prof?.role === 'padre') { router.push('/padre'); return }
        router.push('/login'); return
      }

      setProfile(prof)
    } catch (e: any) {
      toast.error('Error al cargar sesión')
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

  const renderView = () => {
    if (!profile) return null
    switch (activeView) {
      case 'inicio':       return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
      case 'pacientes':    return <MisPacientes />
      case 'evaluaciones': return <MisEvaluaciones userId={profile.id} />
      case 'agenda':       return <MiAgenda />
      case 'perfil':       return <MiPerfil profile={profile} onUpdate={loadProfile} />
      default:             return <EspecialistaHome userId={profile.id} profile={profile} setActiveView={setActiveView} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando panel...</p>
        </div>
      </div>
    )
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-3'}`}>
      {/* Logo */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <p className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">Panel Especialista</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{profile?.specialty || 'Clínico'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <SidebarLink
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => { setActiveView(item.id); if (mobile) setSidebarOpen(false) }}
          />
        ))}
      </nav>

      {/* Badge de rol */}
      <div className="mt-4 mb-2 px-2">
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2">
          <Shield size={13} className="text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">{profile?.full_name}</p>
            <p className="text-xs text-blue-500 dark:text-blue-400">Especialista</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
        <LogOut size={16} className="flex-shrink-0" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </aside>

      {/* Overlay sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="absolute top-3 right-3">
              <button onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X size={18} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-slate-800 dark:text-slate-100">
              {NAV_ITEMS.find(n => n.id === activeView)?.label || 'Inicio'}
            </h1>
          </div>
          <ThemeToggleButton />
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {profile?.full_name?.[0]?.toUpperCase() || 'E'}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-48 p-2 z-50">
                <button onClick={() => { setActiveView('perfil'); setShowProfileMenu(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                  <User size={14} /> Mi Perfil
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                <button onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2">
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
