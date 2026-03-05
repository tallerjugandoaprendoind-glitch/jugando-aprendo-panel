'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import {
  LayoutDashboard, Users, LogOut, Bell, Brain, Calendar, BookOpen,
  X, User, FileText, Loader2, Key, BarChart3, ShieldCheck, Upload,
  ChevronRight, Settings, Crown, Stethoscope, ShoppingBag, Activity,
  Database, Sparkles
} from 'lucide-react'

import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useToast } from '@/components/Toast'
import { ThemeToggleButton, useTheme } from '@/components/ThemeContext'
import DashboardHome from './components/DashboardHome'
import PatientsView from './components/PatientsView'
import CalendarView from './components/CalendarView'
import ExcelImportView from './components/ExcelImportView'
import UserManagementView from './components/UserManagementView'
import EvaluacionesUnificadas from './components/EvaluacionesUnificadas'
import ResourcesManagementView from './components/ResourcesManagementView'
import MensajesPendientesPanel from './components/MensajesPendientesPanel'
import AIReportView from './components/AIReportView'
import AprobacionesEspecialista from './components/AprobacionesEspecialista'
import StoreManagementView from './components/StoreManagementView'
import KnowledgeBaseView from './components/KnowledgeBaseView'
import ARIAAgentChat from './components/ARIAAgentChat'
import ProgramasABAView from './components/ProgramasABAView'

// Vista general de programas (sin paciente específico)
function ProgramasABAViewGeneral({ navigateTo, userId }: { navigateTo: (v: string) => void; userId: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigateTo('ninos')}
          className="bg-white border-2 border-indigo-100 rounded-2xl p-6 text-left hover:border-indigo-300 transition-all group">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users size={20} className="text-indigo-600" />
          </div>
          <h3 className="font-black text-slate-800">Ver por paciente</h3>
          <p className="text-xs text-slate-400 mt-1">Selecciona un niño para ver y registrar sus programas</p>
        </button>
        <button onClick={() => navigateTo('vadi')}
          className="bg-white border-2 border-violet-100 rounded-2xl p-6 text-left hover:border-violet-300 transition-all group">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles size={20} className="text-violet-600" />
          </div>
          <h3 className="font-black text-slate-800">Consultar a ARIA</h3>
          <p className="text-xs text-slate-400 mt-1">Pide análisis de tendencias o sugerencias de programas</p>
        </button>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'inicio',       icon: LayoutDashboard, label: 'Inicio' },
  { id: 'agenda',       icon: Calendar,        label: 'Agenda' },
  { id: 'ninos',        icon: Users,           label: 'Pacientes' },
  { id: 'programas',    icon: Activity,        label: 'Programas ABA' },
  { id: 'evaluaciones', icon: FileText,        label: 'Evaluaciones' },
  { id: 'reportes',     icon: Brain,           label: 'Historial & IA' },
  { id: 'vadi',         icon: Sparkles,        label: 'ARIA Agente' },
  { id: 'cerebro',      icon: Database,        label: 'Cerebro IA' },
  { id: 'recursos',     icon: BookOpen,        label: 'Recursos' },
  { id: 'tienda',       icon: ShoppingBag,     label: 'Tienda' },
]

const MOBILE_NAV_ITEMS = [
  { id: 'inicio',       icon: LayoutDashboard, label: 'Inicio' },
  { id: 'ninos',        icon: Users,           label: 'Pacientes' },
  { id: 'programas',    icon: Activity,        label: 'ABA' },
  { id: 'vadi',         icon: Sparkles,        label: 'ARIA' },
  { id: 'evaluaciones', icon: FileText,        label: 'Evaluac.' },
]

const SECONDARY_NAV = [
  { id: 'aprobaciones', icon: ShieldCheck, label: 'Aprobaciones' },
  { id: 'usuarios',     icon: Key,         label: 'Usuarios' },
  { id: 'importar',     icon: Upload,      label: 'Importar CSV', hidden: true },
]

const ROLE_ICON: Record<string, any> = {
  jefe: Crown,
  admin: Crown,
  especialista: Stethoscope,
}

function SidebarLink({ icon: Icon, label, active, onClick, small, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
        } ${small ? 'text-xs' : 'text-sm'}`}
    >
      <Icon size={small ? 15 : 18} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
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

export default function AdminDashboard() {
  const router = useRouter()
  const toast = useToast()
  const { isDark } = useTheme()
  const [currentView, setCurrentView] = useState('inicio')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedChildReport, setSelectedChildReport] = useState<{id: string, name: string} | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [pendingMessages, setPendingMessages] = useState(0)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email)
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profile) setUserProfile(profile)
      }
    })
    fetchNotifications()
    fetchPendingCount()
  }, [])

  const fetchNotifications = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('*, children(name)')
      .eq('appointment_date', hoy)
      .order('appointment_time', { ascending: true })
    if (data) {
      setNotifications(data.map(c => ({
        id: c.id,
        titulo: 'Cita para hoy',
        detalle: `${c.children?.name} · ${c.appointment_time?.slice(0, 5)}`,
      })))
    }
  }

  const fetchPendingCount = async () => {
    try {
      const [msgRes, subRes] = await Promise.all([
        supabase.from('parent_message_approvals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_approval'),
        supabase.from('specialist_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_approval'),
      ])
      setPendingMessages((msgRes.count || 0) + (subRes.count || 0))
    } catch { setPendingMessages(0) }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch { toast.error('Error al cerrar sesión') }
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
    } catch (e: any) { toast.error(e.message) }
    finally { setChangingPassword(false) }
  }

  const navigateTo = (view: string) => { setCurrentView(view); setSidebarOpen(false) }

  const PAGE_TITLES: Record<string, string> = {
    inicio: 'Panel Principal', agenda: 'Agenda', ninos: 'Pacientes',
    evaluaciones: 'Evaluaciones', reportes: 'Historial & IA',
    recursos: 'Recursos', aprobaciones: 'Aprobaciones',
    mensajes: 'Mensajes a Padres', usuarios: 'Usuarios', importar: 'Importar CSV',
    programas: 'Programas ABA', vadi: 'ARIA — Agente IA', cerebro: 'Cerebro de la IA',
  }

  const role = userProfile?.role || 'admin'
  const RoleIcon = ROLE_ICON[role] || User
  const roleName = role === 'jefe' || role === 'admin' ? 'Jefe' : role === 'especialista' ? 'Especialista' : 'Usuario'
  const userName = userProfile?.full_name || 'Usuario'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200
      ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static z-40 h-full w-64 flex flex-col sidebar-transition
        border-r transition-transform duration-300
        ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-5 h-16 border-b flex-shrink-0
          ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-sm leading-tight truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Jugando Aprendo
            </p>
            <p className={`text-[10px] font-medium flex items-center gap-1
              ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <RoleIcon size={9} />
              Panel {roleName}
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <SidebarLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={currentView === item.id}
              onClick={() => navigateTo(item.id)}
            />
          ))}

          <div className={`pt-4 mt-2 border-t ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-2
              ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              Configuración
            </p>
            {SECONDARY_NAV.filter((item: any) => !item.hidden).map(item => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={currentView === item.id}
                onClick={() => navigateTo(item.id)}
                small
                badge={item.id === 'aprobaciones' ? pendingMessages : 0}
              />
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
          <div
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors
              ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {userName}
              </p>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {userEmail}
              </p>
            </div>
            <Settings size={14} className="text-slate-400 flex-shrink-0" />
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
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className={`h-14 md:h-16 flex items-center justify-between px-3 md:px-6 flex-shrink-0 border-b
          ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-2 rounded-lg transition-colors
                ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <LayoutDashboard size={18} />
            </button>
            <div>
              <h1 className={`text-sm md:text-base font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {PAGE_TITLES[currentView] || 'Panel'}
              </h1>
              <p className={`text-[10px] hidden sm:block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Jugando Aprendo · Gestión Integral
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Analytics shortcut */}
            {currentView === 'reportes' && selectedChildReport && (
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-xs shadow hover:shadow-md transition-all"
              >
                <BarChart3 size={14} /> Analytics
              </button>
            )}

            {/* Dark mode toggle */}
            <ThemeToggleButton />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                className={`p-2 rounded-lg relative transition-colors
                  ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <Bell size={18} />
                {(notifications.length > 0 || pendingMessages > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className={`absolute right-0 top-11 w-72 rounded-2xl shadow-2xl border p-4 z-50 animate-scale-in
                  ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Citas de hoy
                    </p>
                    <button onClick={() => setShowNotifications(false)}>
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                  {pendingMessages > 0 && (
                    <button
                      onClick={() => { navigateTo('aprobaciones'); setShowNotifications(false) }}
                      className="w-full flex items-center gap-2 p-2.5 mb-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-100 transition-colors"
                    >
                      <ShieldCheck size={12} />
                      {pendingMessages} mensaje(s) pendiente(s) de aprobación
                    </button>
                  )}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl
                        ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {n.detalle}
                        </p>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 text-center py-4">Sin citas para hoy</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={`flex-1 overflow-hidden p-3 md:p-6 transition-colors flex flex-col admin-content pb-20 md:pb-6
          ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
          {/* Views that scroll normally */}
          {currentView !== 'usuarios' && (
            <div className="flex-1 overflow-y-auto">
              {currentView === 'inicio'       && <DashboardHome navigateTo={navigateTo} />}
              {currentView === 'agenda'       && <CalendarView />}
              {currentView === 'ninos'        && <PatientsView />}
              {currentView === 'evaluaciones' && <EvaluacionesUnificadas />}
              {currentView === 'reportes'     && <AIReportView onChildSelect={setSelectedChildReport} />}
              {currentView === 'recursos'     && <ResourcesManagementView />}
              {currentView === 'tienda'       && <StoreManagementView />}
              {currentView === 'programas'    && (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-sm text-indigo-700">
                    💡 Selecciona un paciente desde <button onClick={() => navigateTo('ninos')} className="font-black underline">Pacientes</button> para ver sus programas ABA. O usa esta vista general.
                  </div>
                  <ProgramasABAViewGeneral navigateTo={navigateTo} userId={userId} />
                </div>
              )}
              {currentView === 'vadi'         && (
                <div className="max-w-3xl mx-auto">
                  <ARIAAgentChat userId={userId} />
                </div>
              )}
              {currentView === 'cerebro'      && <KnowledgeBaseView />}
              {currentView === 'aprobaciones' && (
                <div className="space-y-10">
                  <MensajesPendientesPanel />
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="pt-8">
                    <AprobacionesEspecialista />
                  </div>
                </div>
              )}
              {currentView === 'mensajes' && <MensajesPendientesPanel />}
              {currentView === 'importar'     && <ExcelImportView />}
            </div>
          )}
          {/* Usuarios: flex container que maneja su propio scroll interno */}
          {currentView === 'usuarios' && (
            <div className="flex-1 min-h-0">
              <UserManagementView />
            </div>
          )}
        </div>
      </main>

      {/* ── BOTTOM NAV MÓVIL (admin) ── */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {MOBILE_NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = currentView === item.id
          return (
            <button key={item.id} onClick={() => navigateTo(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative
                ${active
                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                  : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
              <div className={`p-1.5 rounded-xl transition-all ${active ? isDark ? 'bg-blue-900/50' : 'bg-blue-50' : ''}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
              {active && (
                <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
              )}
            </button>
          )
        })}
        {/* Botón "Más" para el resto de vistas */}
        <button onClick={() => setSidebarOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all
            ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className="p-1.5 rounded-xl relative">
            <ChevronRight size={20} />
            {pendingMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {pendingMessages}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Más</span>
        </button>
      </nav>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in
            ${isDark ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Cambiar Contraseña
              </h2>
              <button onClick={() => setShowChangePassword(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? 'bg-[#21262d] border-[#30363d] text-slate-200 placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className={`w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark ? 'bg-[#21262d] border-[#30363d] text-slate-200 placeholder-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button onClick={handleChangePassword} disabled={changingPassword}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {changingPassword ? <><Loader2 size={16} className="animate-spin" /> Actualizando...</> : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAnalytics && selectedChildReport && (
        <AnalyticsDashboard
          childId={selectedChildReport.id}
          childName={selectedChildReport.name}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  )
}
