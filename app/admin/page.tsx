'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import {
  LayoutDashboard, Users, LogOut, Bell, Brain, Calendar, BookOpen,
  X, User, FileText, Loader2, Key, BarChart3, ShieldCheck, Upload,
  ChevronRight, Settings
} from 'lucide-react'

import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useToast } from '@/components/Toast'
import DashboardHome from './components/DashboardHome'
import PatientsView from './components/PatientsView'
import CalendarView from './components/CalendarView'
import ExcelImportView from './components/ExcelImportView'
import UserManagementView from './components/UserManagementView'
import EvaluacionesUnificadas from './components/EvaluacionesUnificadas'
import ResourcesManagementView from './components/ResourcesManagementView'
import MensajesPendientesPanel from './components/MensajesPendientesPanel'
import AIReportView from './components/AIReportView'

const NAV_ITEMS = [
  { id: 'inicio',       icon: LayoutDashboard, label: 'Inicio' },
  { id: 'agenda',       icon: Calendar,        label: 'Agenda' },
  { id: 'ninos',        icon: Users,           label: 'Pacientes' },
  { id: 'evaluaciones', icon: FileText,        label: 'Evaluaciones' },
  { id: 'reportes',     icon: Brain,           label: 'Historial & IA' },
  { id: 'recursos',     icon: BookOpen,        label: 'Recursos' },
]

const SECONDARY_NAV = [
  { id: 'aprobaciones', icon: ShieldCheck, label: 'Aprobaciones' },
  { id: 'usuarios',     icon: Key,         label: 'Usuarios' },
  { id: 'importar',     icon: Upload,      label: 'Importar CSV' },
]

function SidebarLink({ icon: Icon, label, active, onClick, small }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        } ${small ? 'text-xs' : 'text-sm'}`}
    >
      <Icon size={small ? 15 : 18} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className={`font-semibold truncate ${small ? 'text-xs' : ''}`}>{label}</span>
    </button>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const toast = useToast()
  const [currentView, setCurrentView] = useState('inicio')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedChildReport, setSelectedChildReport] = useState<{id: string, name: string} | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
    fetchNotifications()
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
    usuarios: 'Usuarios', importar: 'Importar CSV',
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static z-40 h-full
        w-60 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-800 leading-tight">Jugando Aprendo</p>
            <p className="text-[10px] text-slate-400 font-medium">Panel Directora</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
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

          <div className="pt-4 mt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Configuración</p>
            {SECONDARY_NAV.map(item => (
              <SidebarLink
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={currentView === item.id}
                onClick={() => navigateTo(item.id)}
                small
              />
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">D</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">Directora</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
            <Settings size={14} className="text-slate-400 flex-shrink-0" />
          </div>
          {showProfileMenu && (
            <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <button onClick={() => { setShowChangePassword(true); setShowProfileMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <Key size={14} /> Cambiar contraseña
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50">
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
              <LayoutDashboard size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-800">{PAGE_TITLES[currentView] || 'Panel'}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Jugando Aprendo · Gestión Integral</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'reportes' && selectedChildReport && (
              <button onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-xs shadow hover:shadow-md transition-all">
                <BarChart3 size={14} /> Analytics
              </button>
            )}

            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false) }}
                className="p-2 hover:bg-slate-100 rounded-lg relative">
                <Bell size={18} className="text-slate-500" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Citas de hoy</p>
                    <button onClick={() => setShowNotifications(false)}><X size={16} className="text-slate-400" /></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-slate-700 font-medium">{n.detalle}</p>
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
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          {currentView === 'inicio'       && <DashboardHome navigateTo={navigateTo} />}
          {currentView === 'agenda'       && <CalendarView />}
          {currentView === 'ninos'        && <PatientsView />}
          {currentView === 'evaluaciones' && <EvaluacionesUnificadas />}
          {currentView === 'reportes'     && <AIReportView onChildSelect={setSelectedChildReport} />}
          {currentView === 'recursos'     && <ResourcesManagementView />}
          {currentView === 'aprobaciones' && <MensajesPendientesPanel />}
          {currentView === 'usuarios'     && <UserManagementView />}
          {currentView === 'importar'     && <ExcelImportView />}
        </div>
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-800">Cambiar Contraseña</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
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
