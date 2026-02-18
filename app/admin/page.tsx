'use client'

import { supabase } from '@/lib/supabase' 
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { 
  LayoutDashboard, Users, LogOut, Bell, Brain, Calendar, BookOpen, 
  X, User, FileText, Loader2, Upload, Key, BarChart3, ShieldCheck
} from 'lucide-react'

import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useToast } from '@/components/Toast'
import { NavItem } from './components/shared'
import DashboardHome from './components/DashboardHome'
import PatientsView from './components/PatientsView'
import EvaluationsView from './components/EvaluationsView'
import AIReportView from './components/AIReportView'
import CalendarView from './components/CalendarView'
import ExcelImportView from './components/ExcelImportView'
import UserManagementView from './components/UserManagementView'
import EvaluacionesUnificadas from './components/EvaluacionesUnificadas'
import ResourcesManagementView from './components/ResourcesManagementView'
import MensajesPendientesPanel from './components/MensajesPendientesPanel'

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
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*, children(name)')
      .eq('appointment_date', hoy)
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      const listaFormateada = data.map((cita) => ({
        id: cita.id,
        titulo: "Cita para hoy",
        detalle: `Paciente: ${cita.children?.name} - Hora: ${cita.appointment_time.slice(0, 5)}`,
      }));
      setNotifications(listaFormateada);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Hubo un error al cerrar sesión')
    }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    setShowProfileMenu(false)
  }

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu)
    setShowNotifications(false)
  }

  const handleOpenChangePassword = () => {
    setShowChangePassword(true)
    setShowProfileMenu(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.warning('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast.success('Contraseña actualizada exitosamente')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      toast.error('Error al cambiar la contraseña: ' + error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  const navigateTo = (view: string) => {
    setCurrentView(view)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-slate-600 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative z-40
        w-64 md:w-16 lg:w-64 
        bg-white border-r border-slate-200 
        flex flex-col justify-between 
        transition-all duration-300 shadow-2xl md:shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="h-16 md:h-20 flex items-center justify-between px-4 border-b border-slate-100">
             <div className="flex items-center gap-3">
                <div className="relative w-9 h-9"><Image src="/images/logo.png" alt="Logo" fill className="object-contain" /></div>
                <span className="block md:hidden lg:block font-bold text-base lg:text-lg text-blue-700 tracking-tight">Panel Directora</span>
             </div>
             <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg"><X size={20}/></button>
          </div>
          <nav className="p-3 md:p-4 space-y-2">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Inicio" active={currentView === 'inicio'} onClick={() => navigateTo('inicio')} />
            <NavItem icon={<Calendar size={20}/>} label="Agenda" active={currentView === 'agenda'} onClick={() => navigateTo('agenda')} />
            <NavItem icon={<Users size={20}/>} label="Pacientes" active={currentView === 'ninos'} onClick={() => navigateTo('ninos')} />
            <NavItem icon={<FileText size={20}/>} label="Evaluaciones" active={currentView === 'evaluaciones'} onClick={() => navigateTo('evaluaciones')} />
            <NavItem icon={<Brain size={20}/>} label="Historial & IA" active={currentView === 'reportes'} onClick={() => navigateTo('reportes')} />
            <NavItem icon={<Key size={20}/>} label="Usuarios" active={currentView === 'usuarios'} onClick={() => navigateTo('usuarios')} />
            <NavItem icon={<BookOpen size={20}/>} label="Recursos" active={currentView === 'recursos'} onClick={() => navigateTo('recursos')} />
            <NavItem icon={<ShieldCheck size={20}/>} label="Aprobaciones" active={currentView === 'aprobaciones'} onClick={() => navigateTo('aprobaciones')} />
            <NavItem icon={<Upload size={20}/>} label="Importar CSV" active={currentView === 'importar'} onClick={() => navigateTo('importar')} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 md:p-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors justify-center lg:justify-start">
            <LogOut size={20} /> <span className="block md:hidden lg:block font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative bg-[#F0F2F5]">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto h-full flex flex-col">
            <header className="flex justify-between items-center mb-4 md:mb-6 lg:mb-8 flex-shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-white rounded-lg border border-slate-200">
                      <LayoutDashboard size={20}/>
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800 capitalize tracking-tight">
                        {currentView === 'inicio' ? 'Resumen del Día' : 
                        currentView === 'reportes' ? 'Historial Clínico' :
                        currentView === 'importar' ? 'Gestión Masiva' :
                        currentView === 'agenda' ? 'Calendario' : 
                        currentView === 'evaluaciones' ? 'Evaluaciones' :
                        currentView === 'aprobaciones' ? 'Bandeja de Aprobación' : 'Pacientes'}
                        </h1>
                        <p className="text-slate-400 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">Jugando Aprendo - Gestión Integral</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 relative">
                    {currentView === 'reportes' && selectedChildReport && (
                      <button
                        onClick={() => setShowAnalytics(true)}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-xs md:text-sm"
                      >
                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Ver Analytics</span>
                        <span className="sm:hidden">Analytics</span>
                      </button>
                    )}
                    
                    <button onClick={toggleNotifications} className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 relative">
                      <Bell size={18} className="md:w-5 md:h-5"/>
                      {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-14 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-black text-sm text-slate-800 uppercase tracking-tighter">Notificaciones</h3>
                          <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                           <X size={18} />
                          </button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((n: any) => (
                             <div key={n.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                               <p className="text-xs font-bold text-blue-900">{n.titulo}</p>
                               <p className="text-xs text-blue-600 mt-1">{n.detalle}</p>
                             </div>
                          ))
                        ) : (
                          <p className="text-center text-slate-400 text-xs py-4">No hay citas para hoy</p>
                        )}
                      </div>
                    </div>
                  )}

                    <button onClick={toggleProfileMenu} className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 text-sm md:text-base">D</button>

                    {showProfileMenu && (
                      <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <User size={24} />
                          </div>
                          <p className="text-center font-black text-sm">Directora</p>
                          <p className="text-center text-xs opacity-90 mt-1">{userEmail || 'directora@jugandoaprendo.com'}</p>
                        </div>
                        <div className="p-2">
                          <button onClick={handleOpenChangePassword} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <Key size={18} />
                            <span>Cambiar Contraseña</span>
                          </button>
                          <div className="border-t border-slate-100 my-2"></div>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut size={18} />
                            <span>Cerrar Sesión</span>
                          </button>
                        </div>
                      </div>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0">
                {currentView === 'inicio' && <DashboardHome navigateTo={navigateTo} />}
                {currentView === 'agenda' && <CalendarView />}
                {currentView === 'ninos' && <PatientsView />}
                {currentView === 'evaluaciones' && <EvaluacionesUnificadas />}
                {currentView === 'reportes' && <AIReportView onChildSelect={setSelectedChildReport} />}
                {currentView === 'importar' && <ExcelImportView />}
                {currentView === 'usuarios' && <UserManagementView />}
                {currentView === 'recursos' && <ResourcesManagementView />}
                {currentView === 'aprobaciones' && <MensajesPendientesPanel />}
            </div>
        </div>
      </main>

      {/* Modal de Cambiar Contraseña */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Cambiar Contraseña</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowChangePassword(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ANALYTICS */}
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
