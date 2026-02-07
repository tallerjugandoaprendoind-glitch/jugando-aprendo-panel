'use client'

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, Calendar, MessageCircle, User, LogOut, Plus, 
  Clock, Ticket, CheckCircle2, AlertCircle, ChevronRight, Menu, 
  Sparkles, Send, Lock, X, Loader2, TrendingUp, Activity, Heart, Brain, Trash2, RefreshCw,
  Award, Target, Smile, Book, Star, Zap, Bell, Download, Share2, Eye, Mail, Phone,
  Settings, HelpCircle, FileText, Video, Headphones, Image as ImageIcon, ExternalLink
} from 'lucide-react'

// ==============================================================================
// 1. UTILIDADES Y CONFIGURACIÓN
// ==============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const generateTimeSlots = () => {
  const slots = []
  let startHour = 8
  let startMin = 15
  const endHour = 18
  const endMin = 15

  while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
    const timeString = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
    slots.push(timeString)
    startMin += 45
    if (startMin >= 60) { startHour += 1; startMin -= 60 }
  }
  return slots
}
const TIME_SLOTS = generateTimeSlots()

const calculateAge = (birthDate: string) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ==============================================================================
// 2. COMPONENTE PRINCIPAL (DASHBOARD PADRES)
// ==============================================================================
export default function ParentDashboard() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeView, setActiveView] = useState('home') 
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)

  const [showAddChild, setShowAddChild] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let parentEmail = session?.user?.email

        if (!parentEmail) {
           parentEmail = localStorage.getItem('padre_email') || undefined
        }

        if (!parentEmail) { 
            console.log("No se encontró sesión ni email guardado")
            router.push('/login')
            return 
        }

        const { data: parent, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', parentEmail)
            .single()
        
        if (error || !parent) throw new Error("Perfil no encontrado")

        setProfile(parent)

        const { data: children } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', parent.id)
            .order('created_at', { ascending: true })

        if (children && children.length > 0) {
            setMyChildren(children)
            if(!selectedChild) setSelectedChild(children[0])
        }

      } catch (error) {
        console.error("Error de carga:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshTrigger]) 

  useEffect(() => {
    const fetchSlots = async () => {
        const { data } = await supabase.from('appointments').select('appointment_time').eq('appointment_date', selectedDate)
        if(data) setTakenSlots(data.map(d => d.appointment_time.slice(0,5)))
    }
    fetchSlots()
  }, [selectedDate, refreshTrigger])

  const handleBookAppointment = async (time: string) => {
    if(!profile || !selectedChild) return
    if((profile.tokens || 0) <= 0) return alert("No tienes suficientes tokens para agendar.")
    
    if(!confirm(`¿Confirmar cita para ${selectedChild.name} el ${selectedDate} a las ${time}?`)) return

    setBookingLoading(true)
    try {
        const { error: aptError } = await supabase.from('appointments').insert([{
            child_id: selectedChild.id,
            appointment_date: selectedDate,
            appointment_time: time,
            service_type: 'Terapia ABA',
            status: 'confirmed'
        }])
        if(aptError) throw aptError

        const newTokens = (profile.tokens || 0) - 1
        await supabase.from('profiles').update({ tokens: newTokens }).eq('id', profile.id)
        
        setProfile({...profile, tokens: newTokens})
        alert("¡Cita agendada con éxito! Te llegará una notificación 24h antes.")
        setRefreshTrigger(prev => prev + 1)
        setActiveView('home')
    } catch (error: any) {
        alert("Error: " + error.message)
    } finally {
        setBookingLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string, isReschedule: boolean = false) => {
    if(!confirm(isReschedule 
        ? "¿Quieres cambiar la fecha? Se cancelará la cita actual, se te devolverá el token y podrás elegir un nuevo horario." 
        : "¿Seguro que deseas cancelar? Se te reembolsará el token inmediatamente."
    )) return

    setBookingLoading(true)
    try {
        const { error: delError } = await supabase.from('appointments').delete().eq('id', appointmentId)
        if(delError) throw delError

        const newTokens = (profile.tokens || 0) + 1
        await supabase.from('profiles').update({ tokens: newTokens }).eq('id', profile.id)
        
        setProfile({...profile, tokens: newTokens})
        setRefreshTrigger(prev => prev + 1) 

        if(isReschedule) {
            alert("Cita cancelada. Ahora elige tu nuevo horario.")
            setActiveView('agenda') 
        } else {
            alert("Cita cancelada y token reembolsado correctamente.")
        }

    } catch (error: any) {
        alert("Error al cancelar: " + error.message)
    } finally {
        setBookingLoading(false)
    }
  }

  const handleAddChild = async (e: any) => {
    e.preventDefault()
    const name = e.target.name.value
    const dob = e.target.dob.value
    const diagnosis = e.target.diagnosis?.value || 'En evaluación'
    if(!profile?.id) return;

    const { data, error } = await supabase.from('children').insert([{
        parent_id: profile.id, 
        name: name, 
        birth_date: dob, 
        diagnosis: diagnosis
    }]).select()

    if(!error && data) {
        setMyChildren([...myChildren, data[0]])
        if(!selectedChild) setSelectedChild(data[0])
        setShowAddChild(false)
        alert("✅ Paciente agregado correctamente")
        setRefreshTrigger(prev => prev + 1)
    }
  }

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault()
    const fullName = e.target.fullName.value
    const phone = e.target.phone.value
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: phone 
        })
        .eq('id', profile.id)
      
      if (error) throw error
      
      setProfile({...profile, full_name: fullName, phone: phone})
      alert("✅ Perfil actualizado correctamente")
      setShowEditProfile(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (error: any) {
      alert("Error al actualizar: " + error.message)
    }
  }

  const handleChangePassword = async (e: any) => {
    e.preventDefault()
    const newPass = e.target.newPassword.value
    const confirmPass = e.target.confirmPassword.value
    
    if (newPass !== confirmPass) {
      alert("❌ Las contraseñas no coinciden")
      return
    }
    
    if (newPass.length < 6) {
      alert("❌ La contraseña debe tener al menos 6 caracteres")
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error
      
      alert("✅ Contraseña actualizada exitosamente")
      setShowChangePass(false)
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 gap-4">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-600" size={56}/>
        <div className="absolute inset-0 animate-ping">
          <Loader2 className="text-blue-300 opacity-40" size={56}/>
        </div>
      </div>
      <p className="text-slate-500 font-bold text-sm tracking-widest uppercase animate-pulse">Cargando tu información...</p>
    </div>
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 font-sans text-slate-600 overflow-hidden">
        
        {/* === SIDEBAR (PC) === */}
        <aside className="hidden lg:flex w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex-col justify-between p-7 z-20 shadow-[4px_0_40px_rgba(0,0,0,0.03)]">
            <div>
                <div className="flex items-center gap-4 mb-12 px-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-200/50 ring-4 ring-blue-100/50">
                        {profile?.full_name?.charAt(0) || 'F'}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bienvenida</p>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight">Fam. {profile?.full_name?.split(' ')[0]}</h2>
                        <p className="text-xs text-slate-400 font-medium">Portal de padres</p>
                    </div>
                </div>
                
                <nav className="space-y-2">
                    <NavBtnDesktop icon={<Home size={20}/>} label="Inicio & Progreso" active={activeView==='home'} onClick={()=>setActiveView('home')} />
                    <NavBtnDesktop icon={<Calendar size={20}/>} label="Agendar Cita" active={activeView==='agenda'} onClick={()=>setActiveView('agenda')} badge={(profile?.tokens || 0) > 0 ? profile.tokens : null} />
                    <NavBtnDesktop icon={<MessageCircle size={20}/>} label="Asistente IA" active={activeView==='chat'} onClick={()=>setActiveView('chat')} badge="NUEVO" />
                    <NavBtnDesktop icon={<Book size={20}/>} label="Biblioteca" active={activeView==='resources'} onClick={()=>setActiveView('resources')} />
                    <NavBtnDesktop icon={<User size={20}/>} label="Mi Perfil" active={activeView==='profile'} onClick={()=>setActiveView('profile')} />
                </nav>
            </div>
            
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-7 rounded-3xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket size={80}/>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mis Tokens</span>
                        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl shadow-lg">
                            <Ticket size={18} className="text-yellow-400"/>
                        </div>
                    </div>
                    <div className="text-5xl font-black relative z-10 mb-2">{profile?.tokens || 0}</div>
                    <p className="text-xs text-slate-400 relative z-10 font-medium">Sesiones disponibles para agendar</p>
                    
                    {(profile?.tokens || 0) <= 2 && (
                        <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 relative z-10">
                            <p className="text-xs text-yellow-200 font-bold flex items-center gap-2">
                                <AlertCircle size={14}/> Tus tokens están por agotarse
                            </p>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={() => setShowNotifications(true)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-blue-100"
                >
                    <Bell size={16}/> Ver Notificaciones
                </button>
            </div>
        </aside>

        {/* === CONTENIDO PRINCIPAL === */}
        <div className="flex-1 flex flex-col h-full relative">
            
            <header className="lg:hidden bg-white/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                        {profile?.full_name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{profile?.full_name?.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Portal Padres</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowNotifications(true)} className="p-2 rounded-xl bg-blue-50 text-blue-600 relative">
                        <Bell size={18}/>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                        <Ticket size={14} className="text-yellow-400"/> {profile?.tokens || 0}
                    </div>
                </div>
            </header>

            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 py-4 px-4 md:px-8 flex gap-3 overflow-x-auto items-center scrollbar-hide shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2 flex items-center gap-2">
                    <User size={12}/> Viendo a:
                </span>
                {myChildren.length > 0 ? myChildren.map(child => (
                    <button 
                        key={child.id} onClick={()=>setSelectedChild(child)}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all whitespace-nowrap border-2 shadow-sm hover:shadow-md ${
                            selectedChild?.id === child.id 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-blue-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedChild?.id === child.id ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
                        <div className="text-left">
                            <span className="font-bold text-sm block">{child.name.split(' ')[0]}</span>
                            <span className={`text-[10px] font-semibold ${selectedChild?.id === child.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                {calculateAge(child.birth_date)} años
                            </span>
                        </div>
                    </button>
                )) : <span className="text-xs text-slate-400 italic">Sin pacientes registrados</span>}
                <button onClick={()=>setShowAddChild(true)} className="w-10 h-10 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0">
                    <Plus size={18}/>
                </button>
            </div>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
                <div className="max-w-6xl mx-auto">
                    {activeView === 'home' && (
                        <HomeViewInnovative 
                            child={selectedChild} 
                            onChangeView={setActiveView} 
                            refreshTrigger={refreshTrigger}
                            onCancelAppointment={handleCancelAppointment} 
                        />
                    )}
                    
                    {activeView === 'agenda' && (
                        <AgendaView 
                            profile={profile}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            takenSlots={takenSlots}
                            bookingLoading={bookingLoading}
                            handleBookAppointment={handleBookAppointment}
                        />
                    )}

                    {activeView === 'chat' && (
                         <div className="h-[calc(100vh-180px)] lg:h-[calc(100vh-120px)] bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col animate-fade-in">
                            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white flex justify-between items-center z-10 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                        <Sparkles size={24} className="text-white"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">Asistente Clínico Inteligente</h3>
                                        <p className="text-xs text-indigo-100 font-semibold flex items-center gap-2">
                                            <Brain size={12}/> Especializado en {selectedChild?.name || 'Terapia ABA'}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all">
                                    <RefreshCw size={18}/>
                                </button>
                            </div>
                            <ChatInterface childId={selectedChild?.id} childName={selectedChild?.name} />
                        </div>
                    )}

                    {activeView === 'resources' && <ResourcesView />}

                    {activeView === 'profile' && (
                        <ProfileView 
                            profile={profile} 
                            onLogout={()=>{localStorage.removeItem('padre_email'); router.push('/login')}} 
                            onChangePass={()=>setShowChangePass(true)}
                            onEditProfile={()=>setShowEditProfile(true)}
                            onPrivacy={()=>setShowPrivacy(true)}
                            onHelp={()=>setShowHelp(true)}
                        />
                    )}
                </div>
            </main>

            <nav className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 p-3 flex justify-around items-center fixed bottom-0 w-full z-30 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <NavBtnMobile icon={<Home size={22}/>} label="Inicio" active={activeView==='home'} onClick={()=>setActiveView('home')} />
                <NavBtnMobile icon={<Calendar size={22}/>} label="Agenda" active={activeView==='agenda'} onClick={()=>setActiveView('agenda')} />
                <div className="relative -top-8">
                    <button 
                        onClick={()=>setActiveView('chat')} 
                        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl border-[6px] border-white transition-all active:scale-95 ${
                            activeView==='chat'
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-purple-300' 
                            : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-300'
                        }`}
                    >
                        <Sparkles size={28}/>
                    </button>
                </div>
                <NavBtnMobile icon={<Book size={22}/>} label="Recursos" active={activeView==='resources'} onClick={()=>setActiveView('resources')} />
                <NavBtnMobile icon={<User size={22}/>} label="Perfil" active={activeView==='profile'} onClick={()=>setActiveView('profile')} />
            </nav>
        </div>

        {/* MODALES */}
        {showAddChild && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-2xl text-slate-800">Nuevo Paciente</h3>
                            <p className="text-sm text-slate-400 font-medium">Agrega la información del niño/a</p>
                        </div>
                        <button onClick={()=>setShowAddChild(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleAddChild} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Nombre Completo</label>
                            <input name="name" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" placeholder="Ej: María Fernanda López"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Fecha de Nacimiento</label>
                            <input name="dob" type="date" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Diagnóstico (Opcional)</label>
                            <input name="diagnosis" className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" placeholder="Ej: TEA Nivel 2"/>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={()=>setShowAddChild(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">
                                Cancelar
                            </button>
                            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {showChangePass && (
             <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-2xl text-slate-800">Cambiar Contraseña</h3>
                            <p className="text-sm text-slate-400">Ingresa tu nueva clave de acceso</p>
                        </div>
                        <button onClick={()=>setShowChangePass(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <input name="newPassword" type="password" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all" placeholder="Nueva contraseña"/>
                        <input name="confirmPassword" type="password" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all" placeholder="Confirmar contraseña"/>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={()=>setShowChangePass(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">Actualizar</button>
                        </div>
                    </form>
                </div>
             </div>
        )}

        {showEditProfile && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-2xl text-slate-800">Editar Perfil</h3>
                            <p className="text-sm text-slate-400">Actualiza tu información personal</p>
                        </div>
                        <button onClick={()=>setShowEditProfile(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Nombre Completo</label>
                            <input 
                                name="fullName" 
                                defaultValue={profile?.full_name}
                                required 
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Teléfono</label>
                            <input 
                                name="phone" 
                                type="tel"
                                defaultValue={profile?.phone}
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" 
                                placeholder="+51 924 807 183"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Email (no editable)</label>
                            <input 
                                value={profile?.email}
                                disabled
                                className="w-full p-4 bg-slate-100 rounded-2xl font-semibold text-slate-400 cursor-not-allowed" 
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={()=>setShowEditProfile(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {showNotifications && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Bell size={24}/>
                            <h3 className="font-bold text-lg">Notificaciones</h3>
                        </div>
                        <button onClick={()=>setShowNotifications(false)} className="p-2 hover:bg-white/10 rounded-xl">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                        <NotificationItem 
                            icon={<Calendar className="text-blue-600"/>}
                            title="Recordatorio de cita"
                            message="Tu cita está programada para mañana a las 10:00 AM"
                            time="Hace 2 horas"
                        />
                        <NotificationItem 
                            icon={<Star className="text-yellow-500"/>}
                            title="Progreso destacado"
                            message={`${selectedChild?.name} logró un nuevo objetivo en comunicación`}
                            time="Hace 1 día"
                        />
                        <NotificationItem 
                            icon={<Heart className="text-pink-500"/>}
                            title="Nueva tarea en casa"
                            message="Revisa las actividades recomendadas para esta semana"
                            time="Hace 2 días"
                        />
                    </div>
                </div>
            </div>
        )}

        {showPrivacy && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Lock size={24}/>
                            <h3 className="font-bold text-lg">Privacidad y Seguridad</h3>
                        </div>
                        <button onClick={()=>setShowPrivacy(false)} className="p-2 hover:bg-white/10 rounded-xl">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <Lock size={16}/> Protección de Datos
                            </h4>
                            <p className="text-sm text-purple-700 leading-relaxed">
                                Toda la información de tu familia está cifrada y protegida según estándares internacionales. Solo tú y los profesionales autorizados pueden acceder a los datos clínicos.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2">Compartir Información</h4>
                            <p className="text-sm text-blue-700 leading-relaxed mb-3">
                                Puedes compartir acceso temporal con:
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1 ml-4">
                                <li>• Familiares cercanos</li>
                                <li>• Otros profesionales de salud</li>
                                <li>• Instituciones educativas (con tu autorización)</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <h4 className="font-bold text-green-900 mb-2">Control Total</h4>
                            <p className="text-sm text-green-700 leading-relaxed">
                                Puedes exportar, eliminar o modificar cualquier información en cualquier momento. Tienes control absoluto sobre tus datos.
                            </p>
                        </div>

                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                            Leer Política Completa
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showHelp && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <HelpCircle size={24}/>
                            <h3 className="font-bold text-lg">Centro de Ayuda</h3>
                        </div>
                        <button onClick={()=>setShowHelp(false)} className="p-2 hover:bg-white/10 rounded-xl">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="p-6 space-y-3 overflow-y-auto">
                        <HelpItem 
                            icon={<Calendar className="text-blue-600"/>}
                            title="¿Cómo agendar una cita?"
                            description="Ve a 'Agendar Cita', selecciona fecha y horario disponible. Se descontará 1 token automáticamente."
                        />
                        <HelpItem 
                            icon={<Ticket className="text-yellow-600"/>}
                            title="¿Qué son los tokens?"
                            description="Los tokens son créditos que te permiten agendar sesiones. Cada sesión requiere 1 token. Contacta al centro para recargar."
                        />
                        <HelpItem 
                            icon={<MessageCircle className="text-purple-600"/>}
                            title="¿Cómo usar el Asistente IA?"
                            description="El asistente puede responder dudas sobre el progreso de tu hijo/a, dar consejos y explicar los reportes de las sesiones."
                        />
                        <HelpItem 
                            icon={<Book className="text-green-600"/>}
                            title="¿Dónde encuentro recursos?"
                            description="En la sección 'Biblioteca' encontrarás guías, videos y artículos sobre terapia ABA y desarrollo infantil."
                        />
                        
                        <div className="mt-6 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-2xl border border-green-200">
                            <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                <Phone size={18}/> Contacto Directo
                            </h4>
                            <div className="space-y-2 text-sm text-green-700">
                                <p className="flex items-center gap-2">
                                    <Mail size={14}/> <a href="mailto:tallerjugandoaprendoind@gmail.com" className="hover:underline">tallerjugandoaprendoind@gmail.com</a>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Phone size={14}/> <a href="tel:+51924807183" className="hover:underline">+51 924 807 183</a>
                                </p>
                                <p className="text-xs text-green-600 mt-2">Horario: Lun-Vie 8:00 AM - 6:00 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

// ==============================================================================
// SUB-COMPONENTES
// ==============================================================================

function AgendaView({ profile, selectedDate, setSelectedDate, takenSlots, bookingLoading, handleBookAppointment }: any) {
    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                        <Calendar className="text-blue-600" size={28}/>
                    </div>
                    Cronograma de Citas
                </h2>
                <p className="text-slate-500 font-medium">Programa tu próxima sesión de terapia ABA</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm p-7 rounded-3xl shadow-lg border border-slate-200/60">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                            <Calendar size={12}/> Seleccionar Día
                        </label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            min={new Date().toISOString().split('T')[0]} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all cursor-pointer text-center text-lg shadow-inner"
                        />
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-7 rounded-3xl text-white shadow-2xl shadow-blue-300/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10">
                            <Sparkles size={120}/>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Sparkles size={20}/>
                                </div>
                                <p className="font-bold text-lg">Política de Citas</p>
                            </div>
                            <p className="text-blue-50 text-sm leading-relaxed mb-3">
                                • Sesiones de 45 minutos<br/>
                                • Cancela hasta 24h antes<br/>
                                • Reembolso automático de tokens
                            </p>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                                <p className="text-xs text-blue-100 font-semibold">
                                    💡 Tip: Agenda con anticipación para mejores horarios
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-8">
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-slate-200/60">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-700 text-lg">Horarios Disponibles</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12}/> {TIME_SLOTS.length - takenSlots.length} libres
                                </span>
                                <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-full text-slate-500 font-bold">
                                    {takenSlots.length} ocupados
                                </span>
                            </div>
                        </div>
                        
                        {(profile?.tokens || 0) > 0 ? (
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div> 
                                        Mañana (08:00 - 12:00)
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) < 12).map(time => (
                                            <TimeSlotBtn key={time} time={time} isTaken={takenSlots.includes(time)} loading={bookingLoading} onClick={() => handleBookAppointment(time)}/>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                     <div className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div> 
                                        Tarde (12:00 - 18:00)
                                    </div>
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) >= 12).map(time => (
                                            <TimeSlotBtn key={time} time={time} isTaken={takenSlots.includes(time)} loading={bookingLoading} onClick={() => handleBookAppointment(time)}/>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-6 bg-slate-100 rounded-3xl mb-4">
                                    <Ticket size={48} className="text-slate-300"/>
                                </div>
                                <h3 className="font-bold text-slate-700 text-lg mb-2">Sin créditos disponibles</h3>
                                <p className="text-sm text-slate-400 max-w-xs mb-6">Necesitas tokens para visualizar y agendar citas. Contacta al centro para recargar.</p>
                                <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                                    Solicitar Recarga
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function HomeViewInnovative({ child, onChangeView, refreshTrigger, onCancelAppointment }: any) {
    const [lastSession, setLastSession] = useState<any>(null)
    const [nextApt, setNextApt] = useState<any>(null)
    const [sessionHistory, setSessionHistory] = useState<any[]>([])
    const [showTaskGuide, setShowTaskGuide] = useState(false)
    
    const [calculatedObjectives, setCalculatedObjectives] = useState({
        verbal: 0,
        emotional: 0,
        social: 0,
        adaptive: 0
    })

    const [insights, setInsights] = useState({
        trend: '',
        strongArea: '',
        focusArea: ''
    })

    useEffect(() => {
        if(!child) return
        const load = async () => {
            const { data: aba } = await supabase.from('registro_aba').select('*').eq('child_id', child.id).order('fecha_sesion', {ascending: false}).limit(1).single()
            setLastSession(aba)
            
            const { data: apt } = await supabase.from('appointments').select('*').eq('child_id', child.id).gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', {ascending: true}).limit(1).single()
            setNextApt(apt)

            const { data: history } = await supabase.from('registro_aba').select('*').eq('child_id', child.id).order('fecha_sesion', {ascending: false}).limit(20)
            setSessionHistory(history || [])
            
            if (history && history.length > 0) {
                let scores = { 
                    verbal: {total:0, count:0}, 
                    emotional: {total:0, count:0}, 
                    social: {total:0, count:0},
                    adaptive: {total:0, count:0}
                }
                
                history.forEach(session => {
                    const d = session.datos || {}
                    const result = d.resultado_sesion || ""
                    const text = ((d.conducta || "") + " " + (d.objetivo_sesion || "")).toLowerCase()
                    
                    let score = 0
                    if (result.includes("Objetivo logrado") || result.includes("Excelente")) score = 100
                    else if (result.includes("Parcialmente") || result.includes("Bueno")) score = 65
                    else if (result.includes("En proceso")) score = 40
                    else score = 25

                    if (text.match(/\b(habl|lenguaje|palabra|voz|manda|tacto|comunic|verbal|ecoica|intraverbal|conversación)\b/)) {
                        scores.verbal.total += score; scores.verbal.count++
                    }
                    if (text.match(/\b(llanto|grito|berrinche|espera|tolerancia|frustra|conducta|regula|calma|enojo|emoción)\b/)) {
                        scores.emotional.total += score; scores.emotional.count++
                    }
                    if (text.match(/\b(juego|turno|mirada|contacto|social|amigo|compartir|interacc|grupo|par)\b/)) {
                        scores.social.total += score; scores.social.count++
                    }
                    if (text.match(/\b(vestir|comer|baño|higiene|autónomo|independencia|rutina|tarea|ayuda)\b/)) {
                        scores.adaptive.total += score; scores.adaptive.count++
                    }
                })

                const calc = {
                    verbal: scores.verbal.count > 0 ? Math.round(scores.verbal.total / scores.verbal.count) : 0,
                    emotional: scores.emotional.count > 0 ? Math.round(scores.emotional.total / scores.emotional.count) : 0,
                    social: scores.social.count > 0 ? Math.round(scores.social.total / scores.social.count) : 0,
                    adaptive: scores.adaptive.count > 0 ? Math.round(scores.adaptive.total / scores.adaptive.count) : 0
                }
                
                setCalculatedObjectives(calc)

                const areas = [
                    {name: 'Comunicación', value: calc.verbal},
                    {name: 'Regulación Emocional', value: calc.emotional},
                    {name: 'Habilidades Sociales', value: calc.social},
                    {name: 'Adaptativas', value: calc.adaptive}
                ]
                
                const sorted = [...areas].sort((a,b) => b.value - a.value)
                const trend = history.length >= 5 && scores.verbal.count >= 3 ? 
                    (calc.verbal > 70 ? 'mejorando' : calc.verbal > 40 ? 'estable' : 'requiere atención') : 'en evaluación'
                
                setInsights({
                    trend,
                    strongArea: sorted[0].name,
                    focusArea: sorted[sorted.length - 1].name
                })
            }
        }
        load()
    }, [child, refreshTrigger]) 

    if(!child) return (
        <div className="text-center p-20 opacity-60">
            <User size={64} className="mx-auto mb-4 text-slate-300"/>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Selecciona un paciente arriba 👆</p>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl shadow-blue-300/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                    <Heart size={180}/>
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Paciente Activo</p>
                        <h1 className="text-4xl font-black mb-2">{child.name}</h1>
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                {calculateAge(child.birth_date)} años
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                {child.diagnosis || 'En evaluación'}
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Activity size={12}/> {sessionHistory.length} sesiones
                            </span>
                        </div>
                    </div>
                    {insights.trend && (
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                            <p className="text-xs text-blue-100 font-bold uppercase tracking-wide mb-1">Tendencia</p>
                            <p className="text-xl font-black capitalize">{insights.trend}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-slate-200/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Calendar className="text-blue-600" size={20}/>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próxima Sesión</p>
                    </div>
                    
                    {nextApt ? (
                        <div>
                            <h2 className="text-5xl font-black text-slate-800 mb-2">
                                {nextApt.appointment_date.split('-')[2]} 
                                <span className="text-xl text-slate-400 font-bold ml-2">
                                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(nextApt.appointment_date.split('-')[1]) - 1]}
                                </span>
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                                    <Clock size={16}/> {nextApt.appointment_time?.slice(0,5)}
                                </span>
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 size={14}/> Confirmada
                                </span>
                                <span className="text-slate-400 text-xs font-semibold">
                                    {nextApt.service_type}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => onCancelAppointment(nextApt.id, true)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm">
                                    <RefreshCw size={16}/> Reprogramar
                                </button>
                                <button onClick={() => onCancelAppointment(nextApt.id, false)} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all">
                                    <Trash2 size={16}/> Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Sin citas programadas</h2>
                            <p className="text-sm text-slate-400 font-medium mb-4">Agenda tu próxima sesión de terapia</p>
                            <button onClick={()=>onChangeView('agenda')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                Agendar Ahora <ChevronRight size={18}/>
                            </button>
                        </div>
                    )}
                </div>

                {nextApt && (
                    <div className="lg:border-l lg:border-slate-200 lg:pl-8">
                        <button onClick={()=>onChangeView('agenda')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap">
                            Ver Calendario <ChevronRight size={18}/>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-slate-200/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <TrendingUp className="text-green-600" size={20}/>
                            </div>
                            Progreso por Áreas
                        </h3>
                        <button className="text-xs text-blue-600 font-bold hover:underline">Ver detalle</button>
                    </div>
                    
                    {calculatedObjectives.verbal === 0 && calculatedObjectives.emotional === 0 && calculatedObjectives.social === 0 && calculatedObjectives.adaptive === 0 ? (
                        <div className="text-center py-12">
                            <div className="p-6 bg-slate-50 rounded-3xl inline-block mb-4">
                                <Activity className="text-slate-300" size={48}/>
                            </div>
                            <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                                Aún no hay suficientes datos. El progreso se calculará automáticamente después de las primeras sesiones.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <ObjectiveBar label="Comunicación Verbal" progress={calculatedObjectives.verbal} color="bg-blue-500" icon={<MessageCircle size={14}/>}/>
                            <ObjectiveBar label="Regulación Emocional" progress={calculatedObjectives.emotional} color="bg-purple-500" icon={<Heart size={14}/>}/>
                            <ObjectiveBar label="Habilidades Sociales" progress={calculatedObjectives.social} color="bg-green-500" icon={<User size={14}/>}/>
                            <ObjectiveBar label="Conductas Adaptativas" progress={calculatedObjectives.adaptive} color="bg-orange-500" icon={<Star size={14}/>}/>
                        </div>
                    )}

                    {insights.strongArea && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Área Fuerte</p>
                            <p className="text-sm font-bold text-blue-900">{insights.strongArea}</p>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-3xl border border-indigo-100 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 opacity-5">
                        <Brain size={160}/>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-indigo-200 rounded-xl">
                            <Activity className="text-indigo-700" size={20}/>
                        </div>
                        <h3 className="font-bold text-indigo-900 text-lg">Último Reporte Clínico</h3>
                    </div>
                    
                    {lastSession ? (
                        <div className="relative z-10 space-y-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                                        {lastSession.fecha_sesion}
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                        lastSession.datos?.resultado_sesion?.includes('logrado') 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {lastSession.datos?.resultado_sesion || 'En proceso'}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                    "{lastSession.datos?.mensaje_padres || lastSession.datos?.conducta || "Sin comentarios registrados."}"
                                </p>
                            </div>
                            
                            {lastSession.datos?.objetivo_sesion && (
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Objetivo trabajado</p>
                                    <p className="text-sm font-semibold text-indigo-900">{lastSession.datos.objetivo_sesion}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 relative z-10">
                            <div className="p-5 bg-white/50 rounded-3xl inline-block mb-3">
                                <Clock className="text-indigo-300" size={40}/>
                            </div>
                            <p className="text-indigo-400 font-medium text-sm">Esperando primera sesión...</p>
                        </div>
                    )}
                </div>
            </div>

            {lastSession?.datos?.legacy_home_task && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-200 flex items-start gap-5 shadow-lg hover:shadow-xl transition-all group">
                    <div className="bg-yellow-200 p-4 rounded-2xl text-yellow-700 shrink-0 group-hover:scale-110 transition-transform">
                        <Heart size={28}/>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-yellow-900 uppercase text-sm tracking-widest flex items-center gap-2">
                                <Zap size={16}/> Misión Familiar de la Semana
                            </h4>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-bold">Activa</span>
                        </div>
                        <p className="text-yellow-900 font-semibold leading-relaxed text-base mb-3">
                            {lastSession.datos.legacy_home_task}
                        </p>
                        <button 
                            onClick={() => setShowTaskGuide(true)}
                            className="text-sm text-yellow-700 font-bold hover:underline flex items-center gap-2"
                        >
                            Ver guía completa <ChevronRight size={14}/>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Activity className="text-blue-600"/>} label="Sesiones" value={sessionHistory.length} color="bg-blue-50" />
                <StatCard icon={<Target className="text-green-600"/>} label="Objetivos logrados" value={sessionHistory.filter(s => s.datos?.resultado_sesion?.includes('logrado')).length} color="bg-green-50" />
                <StatCard icon={<Clock className="text-purple-600"/>} label="Horas acumuladas" value={Math.round(sessionHistory.length * 0.75)} color="bg-purple-50" />
                <StatCard icon={<Award className="text-yellow-600"/>} label="Nivel" value={sessionHistory.length > 20 ? 'Avanzado' : sessionHistory.length > 10 ? 'Intermedio' : 'Inicial'} color="bg-yellow-50" />
            </div>

            {/* MODAL GUÍA DE TAREA */}
            {showTaskGuide && lastSession?.datos?.legacy_home_task && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Heart size={24}/>
                                <h3 className="font-bold text-lg">Guía Completa de Actividad</h3>
                            </div>
                            <button onClick={()=>setShowTaskGuide(false)} className="p-2 hover:bg-white/10 rounded-xl">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
                                <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                                    <Target size={18}/> Objetivo de la actividad
                                </h4>
                                <p className="text-yellow-800 leading-relaxed">
                                    {lastSession.datos.legacy_home_task}
                                </p>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={18}/> Paso a paso
                                </h4>
                                <ol className="space-y-3 text-blue-800">
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">1.</span>
                                        <span>Encuentra un momento tranquilo del día donde {child.name} esté receptivo/a</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">2.</span>
                                        <span>Practica la actividad durante 5-10 minutos inicialmente</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">3.</span>
                                        <span>Refuerza inmediatamente cada intento apropiado con elogios específicos</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">4.</span>
                                        <span>Mantén un registro sencillo de los progresos diarios</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">5.</span>
                                        <span>Si hay dificultades, reduce la complejidad y consulta con el terapeuta</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Sparkles size={18}/> Tips importantes
                                </h4>
                                <ul className="space-y-2 text-purple-800 text-sm">
                                    <li>• Sé consistente con la frecuencia (ideal: diariamente)</li>
                                    <li>• Mantén un ambiente libre de distracciones</li>
                                    <li>• Celebra los pequeños avances</li>
                                    <li>• No fuerces si hay resistencia, intenta más tarde</li>
                                    <li>• Documenta con fotos o videos para compartir con el terapeuta</li>
                                </ul>
                            </div>

                            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <Heart size={18}/> Recuerda
                                </h4>
                                <p className="text-green-800 leading-relaxed">
                                    Cada niño/a progresa a su propio ritmo. Lo más importante es la calidad de la interacción y el vínculo positivo que construyes durante estas actividades. ¡Tú eres parte fundamental del equipo terapéutico!
                                </p>
                            </div>

                            <button 
                                onClick={()=>setShowTaskGuide(false)}
                                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                Entendido, ¡vamos a practicar!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ResourcesView() {
    const [selectedResource, setSelectedResource] = useState<any>(null)

    const resources = [
        {
            id: 1,
            title: "Guía: Primeros pasos en ABA",
            description: "Conoce los fundamentos de la terapia ABA y cómo apoyar desde casa",
            icon: <Book className="text-blue-600"/>,
            type: "PDF",
            color: "bg-blue-50 border-blue-200",
            content: {
                sections: [
                    {
                        title: "¿Qué es ABA?",
                        text: "El Análisis Conductual Aplicado (ABA) es una terapia basada en evidencia científica que utiliza principios del aprendizaje para mejorar conductas socialmente significativas."
                    },
                    {
                        title: "Principios básicos",
                        text: "• Reforzamiento positivo\n• Enseñanza estructurada\n• Generalización de habilidades\n• Medición objetiva del progreso"
                    },
                    {
                        title: "Tu rol como padre/madre",
                        text: "Eres el miembro más importante del equipo. Tu participación activa y aplicación de estrategias en casa acelera significativamente el progreso de tu hijo/a."
                    }
                ]
            }
        },
        {
            id: 2,
            title: "Video: Técnicas de reforzamiento",
            description: "Aprende a reforzar conductas positivas efectivamente",
            icon: <Video className="text-purple-600"/>,
            type: "Video",
            color: "bg-purple-50 border-purple-200",
            content: {
                videoUrl: "https://www.youtube.com/embed/hW4dN1JTO98?si=5_66N3udoS1Gkahh",
                sections: [
                    {
                        title: "Tipos de reforzadores",
                        text: "• Sociales: elogios, abrazos, sonrisas\n• Tangibles: juguetes, stickers\n• Comestibles: snacks favoritos\n• Actividades: tiempo de juego preferido"
                    },
                    {
                        title: "Cuándo reforzar",
                        text: "Inmediatamente después de la conducta deseada. La consistencia y el timing son cruciales para el aprendizaje efectivo."
                    }
                ]
            }
        },
        {
            id: 3,
            title: "Artículo: Manejo de berrinches",
            description: "Estrategias probadas para regular emociones intensas",
            icon: <Heart className="text-pink-600"/>,
            type: "Artículo",
            color: "bg-pink-50 border-pink-200",
            content: {
                sections: [
                    {
                        title: "Prevención",
                        text: "• Establecer rutinas predecibles\n• Anticipar transiciones\n• Enseñar habilidades de comunicación\n• Identificar detonantes"
                    },
                    {
                        title: "Durante el berrinche",
                        text: "Mantén la calma, asegura la seguridad, evita reforzar la conducta inadecuada, y espera a que termine para reconectar."
                    },
                    {
                        title: "Después",
                        text: "Ayuda a tu hijo/a a identificar emociones, enseña alternativas apropiadas, y refuerza cuando use estrategias adecuadas."
                    }
                ]
            }
        },
        {
            id: 4,
            title: "Checklist: Rutinas diarias",
            description: "Estructura el día de tu hijo con rutinas visuales",
            icon: <CheckCircle2 className="text-green-600"/>,
            type: "PDF",
            color: "bg-green-50 border-green-200",
            content: {
                sections: [
                    {
                        title: "Rutina de mañana",
                        text: "☐ Despertarse\n☐ Ir al baño\n☐ Lavarse dientes\n☐ Vestirse\n☐ Desayunar\n☐ Preparar mochila"
                    },
                    {
                        title: "Rutina de tarde",
                        text: "☐ Llegar a casa\n☐ Snack\n☐ Tiempo de terapia/tarea\n☐ Juego libre\n☐ Cena\n☐ Tiempo familiar"
                    },
                    {
                        title: "Rutina de noche",
                        text: "☐ Baño\n☐ Pijama\n☐ Cepillado de dientes\n☐ Cuento\n☐ Dormir"
                    }
                ]
            }
        }
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                        <Book className="text-purple-600" size={28}/>
                    </div>
                    Biblioteca de Recursos
                </h2>
                <p className="text-slate-500 font-medium">Material educativo para familias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource) => (
                    <div 
                        key={resource.id} 
                        className={`${resource.color} p-6 rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all group cursor-pointer`}
                        onClick={() => setSelectedResource(resource)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                {resource.icon}
                            </div>
                            <span className="text-xs font-bold px-3 py-1 bg-white rounded-full shadow-sm">{resource.type}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">{resource.title}</h3>
                        <p className="text-sm text-slate-600 font-medium mb-4">{resource.description}</p>
                        <button className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
                            <Eye size={16}/> Ver contenido
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-3">¿Necesitas más apoyo?</h3>
                <p className="text-indigo-100 mb-6 font-medium">Únete a nuestra comunidad de familias y accede a webinars exclusivos</p>
                <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all">
                    Unirme ahora
                </button>
            </div>

            {/* MODAL RECURSO */}
            {selectedResource && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {selectedResource.icon}
                                <div>
                                    <span className="text-xs font-bold opacity-75 uppercase tracking-wide">{selectedResource.type}</span>
                                    <h3 className="font-bold text-lg">{selectedResource.title}</h3>
                                </div>
                            </div>
                            <button onClick={()=>setSelectedResource(null)} className="p-2 hover:bg-white/10 rounded-xl">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            {selectedResource.content.videoUrl && (
                                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={selectedResource.content.videoUrl}
                                        title={selectedResource.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {selectedResource.content.sections.map((section: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <ChevronRight size={18} className="text-blue-600"/>
                                        {section.title}
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                        {section.text}
                                    </p>
                                </div>
                            ))}

                            <div className="flex gap-3">
                                <button 
                                    onClick={()=>alert('Funcionalidad de descarga próximamente')}
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={18}/> Descargar {selectedResource.type}
                                </button>
                                <button 
                                    onClick={()=>alert('Funcionalidad de compartir próximamente')}
                                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 size={18}/> Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ProfileView({ profile, onLogout, onChangePass, onEditProfile, onPrivacy, onHelp }: any) {
    const initial = profile?.full_name ? profile.full_name.charAt(0) : 'U';
    const name = profile?.full_name || 'Usuario';
    const email = profile?.email || 'Correo no disponible';
    const phone = profile?.phone || 'No registrado';

    return (
        <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
             <div className="text-center">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-blue-300/50 mb-6 ring-4 ring-blue-100">
                    {initial}
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">{name}</h2>
                <p className="text-slate-400 font-semibold mb-1">{email}</p>
                <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Phone size={14}/> {phone}
                </p>
             </div>
             
             <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 overflow-hidden shadow-xl">
                <button onClick={onEditProfile} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors">
                            <User size={22} className="text-purple-600"/>
                        </div>
                        Editar Perfil
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>

                <button onClick={onChangePass} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors">
                            <Lock size={22} className="text-blue-600"/>
                        </div>
                        Cambiar Contraseña
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>
                
                <button onClick={onPrivacy} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors">
                            <Lock size={22} className="text-purple-600"/>
                        </div>
                        Privacidad y Seguridad
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>

                <button onClick={onHelp} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 transition-all group">
                    <span className="font-bold text-slate-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors">
                            <HelpCircle size={22} className="text-green-600"/>
                        </div>
                        Centro de Ayuda
                    </span>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all"/>
                </button>
                
                <button onClick={onLogout} className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-all group">
                    <span className="font-bold text-red-600 flex items-center gap-4 text-lg">
                        <div className="p-3 bg-red-100 rounded-2xl group-hover:bg-red-200 transition-colors">
                            <LogOut size={22}/>
                        </div>
                        Cerrar Sesión
                    </span>
                </button>
             </div>

             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Versión de la app</p>
                <p className="text-2xl font-black text-slate-800">2.0.0</p>
                <p className="text-sm text-slate-500 mt-2">Última actualización: Febrero 2026</p>
             </div>
        </div>
    )
}

// COMPONENTES AUXILIARES
function StatCard({icon, label, value, color}: any) {
    return (
        <div className={`${color} p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-black text-slate-800 mb-1">{value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
        </div>
    )
}

function ObjectiveBar({ label, progress, color, icon }: any) {
    return (
        <div className="group">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    {label}
                </span>
                <span className="text-sm font-black text-slate-800">{progress}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className={`h-full rounded-full ${color} transition-all duration-1000 ease-out relative group-hover:shadow-lg`} 
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    )
}

function TimeSlotBtn({ time, isTaken, loading, onClick }: any) {
    return (
        <button 
            disabled={isTaken || loading} 
            onClick={onClick} 
            className={`p-5 rounded-2xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 border-2 relative overflow-hidden group ${
                isTaken 
                ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg hover:scale-105'
            }`}
        >
            {!isTaken && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all"></div>}
            <span className="text-lg font-black relative z-10">{time}</span>
            <span className={`text-[9px] uppercase font-black relative z-10 ${isTaken ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-500'}`}>
                {isTaken ? 'Ocupado' : 'Disponible'}
            </span>
        </button>
    )
}

function ChatInterface({ childId, childName }: any) {
    const [messages, setMessages] = useState<any[]>([
        {
            role:'ai', 
            text: `¡Hola! 👋 Soy tu Asistente Clínico Inteligente. He revisado el historial completo de ${childName || 'tu hijo/a'} y estoy aquí para apoyarte en todo momento.\n\n¿En qué puedo ayudarte hoy? Puedo:\n• Explicarte los reportes de las sesiones\n• Darte consejos para actividades en casa\n• Responder dudas sobre el desarrollo\n• Apoyarte emocionalmente en este proceso`
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    const quickQuestions = [
        "¿Cómo le fue en la última sesión?",
        "Dame consejos para casa",
        "¿Qué objetivos está trabajando?",
        "Necesito apoyo emocional"
    ]

    const send = async (customText?: string) => {
        const txt = customText || input
        if(!txt.trim()) return
        
        if(!childId) {
            setMessages(p => [...p, {
                role:'ai', 
                text: '⚠️ Un momento, estoy cargando el perfil completo del paciente para poder ayudarte mejor...'
            }])
            return
        }

        setMessages(p => [...p, {role:'user', text: txt}])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/parent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: txt, 
                    childId: childId,
                    childName: childName
                })
            })
            
            const data = await res.json()
            const aiResponse = data.text || "Lo siento, no pude procesar tu pregunta. ¿Podrías reformularla?"
            
            setMessages(p => [...p, {role:'ai', text: aiResponse}])

        } catch(e) {
            setMessages(p => [...p, {
                role:'ai', 
                text: "❌ Disculpa, hubo un problema de conexión. Por favor, intenta nuevamente en unos momentos."
            }])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        endRef.current?.scrollIntoView({behavior:'smooth'})
    }, [messages])

    useEffect(() => {
        setMessages([{
            role:'ai', 
            text: `¡Hola! 👋 He actualizado mi información con el historial de ${childName || 'tu hijo/a'}. Ahora puedo ayudarte de manera más personalizada. ¿Qué necesitas saber?`
        }])
    }, [childId])

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50/20">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m,i)=>(
                    <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                            m.role==='user'
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md' 
                            : 'bg-white text-slate-700 rounded-bl-md border border-slate-200/60'
                        }`}>
                            {m.role === 'ai' && (
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                                        <Sparkles size={14} className="text-indigo-600"/>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asistente IA</span>
                                </div>
                            )}
                            <p style={{whiteSpace: 'pre-wrap'}} className="font-medium">{m.text}</p>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex items-center gap-3 ml-4">
                        <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                            <Loader2 size={18} className="animate-spin text-indigo-600"/>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600">Analizando historial clínico...</p>
                            <p className="text-[10px] text-slate-400">Esto puede tomar unos segundos</p>
                        </div>
                    </div>
                )}
                
                <div ref={endRef}></div>
            </div>

            {messages.length <= 2 && !loading && (
                <div className="px-6 pb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Preguntas frecuentes:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => send(q)}
                                className="px-4 py-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60 flex gap-3 shadow-lg">
                <input 
                    className="flex-1 bg-slate-50 rounded-3xl px-6 py-4 text-sm font-medium outline-none border-2 border-transparent focus:bg-white focus:border-indigo-300 transition-all placeholder:text-slate-400" 
                    value={input} 
                    onChange={e=>setInput(e.target.value)} 
                    onKeyDown={e=>e.key==='Enter' && !loading && send()} 
                    placeholder={`Pregúntame sobre ${childName || 'tu hijo/a'}...`}
                    disabled={loading}
                />
                <button 
                    onClick={() => send()} 
                    disabled={loading || !input.trim()}
                    className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    <Send size={20}/>
                </button>
            </div>
        </div>
    )
}

function NavBtnDesktop({icon, label, active, onClick, badge}: any) { 
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 px-5 rounded-2xl transition-all relative group ${
            active 
            ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold shadow-xl shadow-slate-300' 
            : 'text-slate-500 hover:bg-slate-50 font-semibold hover:text-slate-700'
        }`}>
            <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
                {icon}
            </div>
            <span className="text-sm flex-1 text-left">{label}</span>
            {badge && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    active 
                    ? 'bg-white/20 text-white' 
                    : typeof badge === 'number' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                    {badge}
                </span>
            )}
        </button>
    ) 
}

function NavBtnMobile({icon, label, active, onClick}: any) { 
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 transition-all">
            <div className={`p-3 transition-all rounded-2xl ${
                active 
                ? 'text-blue-600 bg-blue-50 shadow-sm' 
                : 'text-slate-300'
            }`}>
                {icon}
            </div>
            {label && (
                <span className={`text-[10px] font-bold ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {label}
                </span>
            )}
        </button>
    ) 
}

function NotificationItem({icon, title, message, time}: any) {
    return (
        <div className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all cursor-pointer group">
            <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm mb-1">{title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-2">{time}</p>
                </div>
            </div>
        </div>
    )
}

function HelpItem({icon, title, description}: any) {
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group">
            <div className="flex gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    {icon}
                </div>
                <div>
                    <h5 className="font-bold text-slate-800 text-sm mb-1">{title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    )
}
