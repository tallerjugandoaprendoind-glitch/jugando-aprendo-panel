'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, Calendar, MessageCircle, User, LogOut, Plus, 
  Clock, Ticket, CheckCircle2, AlertCircle, ChevronRight, Menu, 
  Sparkles, Send, Lock, X, Loader2, TrendingUp, Activity, Heart, Brain, Trash2, RefreshCw,
  Award, Target, Smile, Book, Star, Zap, Bell, Download, Share2, Eye, Mail, Phone,
  Settings, HelpCircle, FileText, Video, Headphones, Image as ImageIcon, ExternalLink,
  Camera, Upload, Gift, PartyPopper, Flame, TrendingDown, Baby, Stethoscope, PlayCircle,
  CalendarDays, ShoppingBag
} from 'lucide-react'

import { NavBtnDesktop, NavBtnMobile, NotificationItem, HelpItem } from './components/shared'
import { ThemeToggleButton } from '@/components/ThemeContext'
import AgendaView from './components/AgendaView'
import HomeViewInnovative from './components/HomeView'
import ResourcesView from './components/ResourcesView'
import ParentFormsView from './components/ParentFormsView'
import MisCitasView from './components/MisCitasView'
import ProfileView from './components/ProfileView'
import StoreView from './components/StoreView'
import ChatInterface from './components/ChatInterface'
import MensajesView from './components/MensajesView'
import PushNotificationBanner from '../../components/PushNotificationBanner'
import { TIME_SLOTS, calculateAge } from './utils/helpers'

export default function ParentDashboard() {
  const router = useRouter()
   
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // --- NUEVOS ESTADOS PARA NOTIFICACIONES ---
  const [notifications, setNotifications] = useState<any[]>([])
  const unreadCount = notifications.filter(n => !n.is_read).length
  // ------------------------------------------

  const [pendingFormsCount, setPendingFormsCount] = useState(0)
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
  const [selectedNoti, setSelectedNoti] = useState<any>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')

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

        // --- CONTAR FORMULARIOS PENDIENTES ---
        if (parent?.id) {
          const { count } = await supabase
            .from('parent_forms')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', parent.id)
            .neq('status', 'completed')
          setPendingFormsCount(count || 0)
        }
        // -------------------------------------

        // --- CARGAR NOTIFICACIONES REALES ---
        if (session?.user?.id) {
            const { data: notis } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
            
            if (notis) setNotifications(notis)
        }
        // ------------------------------------

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

  const triggerCelebration = (message: string) => {
    setCelebrationMessage(message)
    setShowSuccessAnimation(true)
    setTimeout(() => setShowSuccessAnimation(false), 3000)
  }

  // --- FUNCIÓN PARA ABRIR Y MARCAR LEÍDAS ---
  const handleOpenNotifications = async () => {
    setShowNotifications(true)

    // Si hay notificaciones sin leer, marcarlas como leídas visualmente y en BD
    if (unreadCount > 0) {
        // 1. Actualización optimista (Visual)
        const updatedNotis = notifications.map(n => ({ ...n, is_read: true }))
        setNotifications(updatedNotis)

        // 2. Actualización en Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false)
        }
    }
  }
  // ------------------------------------------

  const handleBookAppointment = async (time: string) => {
    if(!profile || !selectedChild) return
    if((profile.tokens || 0) <= 0) return alert("No tienes suficientes tokens para agendar.")
    
    if(!confirm(`¿Confirmar cita para ${selectedChild.name} el ${selectedDate} a las ${time}?`)) return

    setBookingLoading(true)
    try {
        const { error: aptError } = await supabase.from('appointments').insert([{
            child_id: selectedChild.id,
            parent_id: profile.id,
            appointment_date: selectedDate,
            appointment_time: time,
            service_type: 'Terapia ABA',
            status: 'confirmed'
        }])
        if(aptError) throw aptError

        const newTokens = (profile.tokens || 0) - 1
        await supabase.from('profiles').update({ tokens: newTokens }).eq('id', profile.id)
        
        setProfile({...profile, tokens: newTokens})
        triggerCelebration('🎉 ¡Cita agendada exitosamente!')
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
            triggerCelebration('✅ Token reembolsado correctamente')
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
    
    if(!profile?.id) {
        alert("❌ Error: No se encontró tu perfil")
        return
    }

    if(!name.trim()) {
        alert("❌ El nombre es obligatorio")
        return
    }

    if(!dob) {
        alert("❌ La fecha de nacimiento es obligatoria")
        return
    }

    try {
        const age = calculateAge(dob)

        const { data, error } = await supabase.from('children').insert([{
            parent_id: profile.id, 
            name: name.trim(), 
            birth_date: dob,
            age: age,
            diagnosis: diagnosis || 'En evaluación'
        }]).select()

        if (error) {
            alert("❌ Error al guardar: " + error.message)
            return
        }

        if (!data || data.length === 0) {
            alert("⚠️ No se pudo crear el registro. Verifica los permisos en Supabase.")
            return
        }

        setMyChildren([...myChildren, data[0]])
        if(!selectedChild) setSelectedChild(data[0])
        setShowAddChild(false)
        triggerCelebration(`🎊 ${name} agregado correctamente`)
        setRefreshTrigger(prev => prev + 1)

    } catch (err: any) {
        alert("❌ Error inesperado: " + err.message)
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
      triggerCelebration('✨ Perfil actualizado')
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
      
      triggerCelebration('🔐 Contraseña actualizada')
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

  // ── ONBOARDING para primer acceso (sin hijos registrados) ─────────────────
  if (!loading && myChildren.length === 0 && profile && !showAddChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {['Bienvenida', 'Tu hijo/a', 'Primera cita'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-bold ${i === 0 ? 'text-violet-600' : 'text-slate-400'}`}>{step}</span>
                {i < 2 && <div className="w-8 h-px bg-slate-200" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-violet-100 border border-violet-100 text-center">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-violet-200 mx-auto mb-6">
              {profile?.full_name?.charAt(0) || 'F'}
            </div>

            <h1 className="text-2xl font-black text-slate-800 mb-3">
              ¡Bienvenido/a, {profile?.full_name?.split(' ')[0]}! 🎉
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-8">
              Estamos felices de tenerte en <strong className="text-violet-600">Jugando Aprendo</strong>.
              Para comenzar, necesitamos registrar a tu hijo/a y podrás acceder a todo el sistema de seguimiento con IA.
            </p>

            {/* Features preview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: '📊', label: 'Progreso en tiempo real' },
                { icon: '🤖', label: 'Asistente IA 24/7' },
                { icon: '📅', label: 'Citas con 1 click' },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-xs font-bold text-violet-700 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddChild(true)}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-violet-200 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[.98] flex items-center justify-center gap-3"
            >
              <Baby size={20} /> Registrar a mi hijo/a ahora
            </button>

            <p className="text-xs text-slate-400 mt-4">
              Solo toma 1 minuto · Tus datos están protegidos
            </p>
          </div>

          {/* Help contact */}
          <p className="text-center text-sm text-slate-400 mt-6">
            ¿Tienes dudas? Escríbenos:{' '}
            <a href="https://wa.me/51924807183" className="text-violet-600 font-bold hover:underline">
              +51 924 807 183
            </a>
          </p>
        </div>

        {/* El modal de agregar hijo ya existe en el código principal */}
        {showAddChild && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Baby size={24} className="text-white"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl text-slate-800">Paso 2: Tu hijo/a</h3>
                      <p className="text-sm text-slate-400 font-medium">Ingresa sus datos básicos</p>
                    </div>
                  </div>
                  <button onClick={()=>setShowAddChild(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                    <X size={22}/>
                  </button>
                </div>
                <form onSubmit={handleAddChild} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Nombre Completo *</label>
                    <input name="name" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" placeholder="Ej: María Fernanda López"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Fecha de Nacimiento *</label>
                    <input name="dob" type="date" required className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Diagnóstico (Opcional)</label>
                    <input name="diagnosis" className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all" placeholder="Ej: TEA Nivel 2"/>
                  </div>
                  <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-4">
                    <p className="text-xs text-violet-700 font-bold flex items-center gap-2">
                      <Sparkles size={14}/> La edad se calculará automáticamente
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={()=>setShowAddChild(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                      <CheckCircle2 size={18}/> Guardar y continuar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 font-sans text-slate-600 overflow-hidden">
        
        {/* 🔔 PUSH NOTIFICATIONS BANNER */}
        <PushNotificationBanner userId={profile?.id || null} />

        {/* 🎉 ANIMACIÓN DE ÉXITO */}
        {showSuccessAnimation && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border-4 border-green-500 animate-bounce">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <PartyPopper size={80} className="text-green-500 animate-pulse"/>
                            <div className="absolute inset-0 bg-green-400 blur-3xl opacity-50 animate-ping"></div>
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 text-center">{celebrationMessage}</h2>
                        <div className="flex gap-3">
                            <Star size={32} className="text-yellow-400 animate-spin"/>
                            <Star size={32} className="text-yellow-400 animate-spin" style={{animationDelay: '0.2s'}}/>
                            <Star size={32} className="text-yellow-400 animate-spin" style={{animationDelay: '0.4s'}}/>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === SIDEBAR (PC) === */}
        <aside className="hidden lg:flex w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex-col justify-between p-7 z-20 shadow-[4px_0_40px_rgba(0,0,0,0.03)]">
            <div>
                <div className="flex items-center gap-4 mb-12 px-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-200/50 ring-4 ring-blue-100/50 relative group cursor-pointer">
                        {profile?.full_name?.charAt(0) || 'F'}
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bienvenida</p>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight">Fam. {profile?.full_name?.split(' ')[0]}</h2>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Sparkles size={10}/> Portal de padres
                        </p>
                    </div>
                </div>
                
                <nav className="space-y-2">
                    <NavBtnDesktop icon={<Home size={20}/>} label="Inicio & Progreso" active={activeView==='home'} onClick={()=>setActiveView('home')} />
                    <NavBtnDesktop icon={<Calendar size={20}/>} label="Agendar Cita" active={activeView==='agenda'} onClick={()=>setActiveView('agenda')} badge={(profile?.tokens || 0) > 0 ? profile.tokens : null} />
                    <NavBtnDesktop icon={<CalendarDays size={20}/>} label="Mis Citas" active={activeView==='miscitas'} onClick={()=>setActiveView('miscitas')} />
                    <NavBtnDesktop icon={<MessageCircle size={20}/>} label="Asistente IA" active={activeView==='chat'} onClick={()=>setActiveView('chat')} badge="NUEVO" />
                    <NavBtnDesktop icon={<Bell size={20}/>} label="Mensajes del terapeuta" active={activeView==='mensajes'} onClick={()=>setActiveView('mensajes')} badge={unreadCount > 0 ? unreadCount : null} />
                    <NavBtnDesktop icon={<Book size={20}/>} label="Biblioteca" active={activeView==='resources'} onClick={()=>setActiveView('resources')} />
                    <NavBtnDesktop icon={<ShoppingBag size={20}/>} label="Tienda" active={activeView==='tienda'} onClick={()=>setActiveView('tienda')} />
                    <NavBtnDesktop icon={<FileText size={20}/>} label="Mi Centro" active={activeView==='misformularios'} onClick={()=>setActiveView('misformularios')} badge={pendingFormsCount > 0 ? pendingFormsCount : null} />
                    <NavBtnDesktop icon={<User size={20}/>} label="Mi Perfil" active={activeView==='profile'} onClick={()=>setActiveView('profile')} />
                </nav>
            </div>
            
            <div className="space-y-4">
                {/* 🎯 TARJETA DE TOKENS MEJORADA */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-7 rounded-3xl relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ticket size={80}/>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mis Tokens</span>
                        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl shadow-lg animate-pulse">
                            <Ticket size={18} className="text-yellow-400"/>
                        </div>
                    </div>
                    <div className="text-5xl font-black relative z-10 mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {profile?.tokens || 0}
                    </div>
                    <p className="text-xs text-slate-400 relative z-10 font-medium">Sesiones disponibles para agendar</p>
                    
                    {(profile?.tokens || 0) <= 2 && (profile?.tokens || 0) > 0 && (
                        <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 relative z-10 animate-pulse">
                            <p className="text-xs text-yellow-200 font-bold flex items-center gap-2">
                                <AlertCircle size={14}/> Tus tokens están por agotarse
                            </p>
                        </div>
                    )}

                    {(profile?.tokens || 0) === 0 && (
                        <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3 relative z-10">
                            <p className="text-xs text-red-200 font-bold flex items-center gap-2">
                                <AlertCircle size={14}/> Sin tokens disponibles
                            </p>
                        </div>
                    )}

                    {(profile?.tokens || 0) > 5 && (
                        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-xl p-3 relative z-10">
                            <p className="text-xs text-green-200 font-bold flex items-center gap-2">
                                <CheckCircle2 size={14}/> ¡Excelente! Tienes suficientes sesiones
                            </p>
                        </div>
                    )}
                </div>
                
                {/* BOTÓN NOTIFICACIONES SIDEBAR MEJORADO */}
                <button 
                    onClick={handleOpenNotifications}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-blue-100 hover:scale-105 active:scale-95 shadow-sm hover:shadow-lg relative group"
                >
                    <Bell size={16} className="group-hover:animate-bounce"/>
                    Ver Notificaciones
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </aside>

        {/* === CONTENIDO PRINCIPAL === */}
        <div className="flex-1 flex flex-col h-full relative">
            
            {/* 📱 HEADER MÓVIL MEJORADO */}
            <header className="lg:hidden bg-white/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg relative">
                        {profile?.full_name?.charAt(0)}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{profile?.full_name?.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                            <Sparkles size={10}/> Portal Padres
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggleButton />
                    <button onClick={handleOpenNotifications} className="p-2 rounded-xl bg-blue-50 text-blue-600 relative hover:scale-110 active:scale-95 transition-transform">
                        <Bell size={18}/>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </button>
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg relative group">
                        <Ticket size={14} className="text-yellow-400 group-hover:animate-spin"/> 
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{profile?.tokens || 0}</span>
                    </div>
                </div>
            </header>

            {/* 👶 SELECTOR DE HIJOS MEJORADO */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 py-4 px-4 md:px-8 flex gap-3 overflow-x-auto items-center scrollbar-hide shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2 flex items-center gap-2">
                    <User size={12}/> Viendo a:
                </span>
                {myChildren.length > 0 ? myChildren.map(child => (
                    <button 
                        key={child.id} onClick={()=>setSelectedChild(child)}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all whitespace-nowrap border-2 shadow-sm hover:shadow-md group ${
                            selectedChild?.id === child.id 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-blue-200 scale-105' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${selectedChild?.id === child.id ? 'bg-white animate-pulse' : 'bg-slate-300 group-hover:bg-blue-400'}`}></div>
                        <div className="text-left">
                            <span className="font-bold text-sm block">{child.name.split(' ')[0]}</span>
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${selectedChild?.id === child.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                <Baby size={10}/> {calculateAge(child.birth_date)} años
                            </span>
                        </div>
                    </button>
                )) : <span className="text-xs text-slate-400 italic">Sin pacientes registrados</span>}
                <button 
                    onClick={()=>setShowAddChild(true)} 
                    className="w-10 h-10 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shrink-0 hover:scale-110 active:scale-95 hover:rotate-90"
                >
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

                    {activeView === 'miscitas' && (
                        <MisCitasView
                            profile={profile}
                            selectedChild={selectedChild}
                            onCancelAppointment={handleCancelAppointment}
                            onChangeView={setActiveView}
                        />
                    )}

                    {activeView === 'chat' && (
                          <div className="h-[calc(100vh-180px)] lg:h-[calc(100vh-120px)] bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col animate-fade-in">
                            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white flex justify-between items-center z-10 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                                        <Sparkles size={24} className="text-white"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">Asistente Clínico Inteligente</h3>
                                        <p className="text-xs text-indigo-100 font-semibold flex items-center gap-2">
                                            <Brain size={12}/> Especializado en {selectedChild?.name || 'Terapia ABA'}
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all hover:rotate-180 duration-300">
                                    <RefreshCw size={18}/>
                                </button>
                            </div>
                            <ChatInterface childId={selectedChild?.id} childName={selectedChild?.name} onNavigateToStore={() => setActiveView('tienda')} />
                        </div>
                    )}

                    {activeView === 'resources' && <ResourcesView profile={profile} />}
                    {activeView === 'tienda'    && <StoreView profile={profile} />}
                    {activeView === 'misformularios' && <ParentFormsView profile={profile} selectedChild={selectedChild} onFormsLoaded={(count: number) => setPendingFormsCount(count)} />}
                    {activeView === 'mensajes' && <MensajesView profile={profile} />}

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

            {/* 📱 NAVEGACIÓN INFERIOR MÓVIL MEJORADA */}
            <nav className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 p-3 flex justify-around items-center fixed bottom-0 w-full z-30 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <NavBtnMobile icon={<Home size={22}/>} label="Inicio" active={activeView==='home'} onClick={()=>setActiveView('home')} />
                <NavBtnMobile icon={<Calendar size={22}/>} label="Agenda" active={activeView==='agenda'} onClick={()=>setActiveView('agenda')} badge={(profile?.tokens || 0)} />
                <NavBtnMobile icon={<CalendarDays size={22}/>} label="Mis Citas" active={activeView==='miscitas'} onClick={()=>setActiveView('miscitas')} />
                <div className="relative -top-8">
                    <button 
                        onClick={()=>setActiveView('chat')} 
                        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl border-[6px] border-white transition-all active:scale-95 relative group ${
                            activeView==='chat'
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-purple-300' 
                            : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-300'
                        }`}
                    >
                        <Sparkles size={28} className="group-hover:animate-spin"/>
                        {activeView !== 'chat' && (
                            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full animate-bounce">
                                IA
                            </span>
                        )}
                    </button>
                </div>
                <NavBtnMobile icon={<Book size={22}/>} label="Recursos" active={activeView==='resources'} onClick={()=>setActiveView('resources')} />
                <NavBtnMobile icon={<ShoppingBag size={22}/>} label="Tienda" active={activeView==='tienda'} onClick={()=>setActiveView('tienda')} />
                <NavBtnMobile icon={<User size={22}/>} label="Perfil" active={activeView==='profile'} onClick={()=>setActiveView('profile')} />
            </nav>
        </div>

        {/* 🎨 MODAL - AGREGAR HIJO MEJORADO */}
        {showAddChild && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in relative overflow-hidden">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100 to-yellow-100 rounded-full blur-3xl opacity-50"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Baby size={24} className="text-white"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-2xl text-slate-800">Nuevo Paciente</h3>
                                    <p className="text-sm text-slate-400 font-medium">Agrega la información del niño/a</p>
                                </div>
                            </div>
                            <button onClick={()=>setShowAddChild(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:rotate-90">
                                <X size={22}/>
                            </button>
                        </div>

                        <form onSubmit={handleAddChild} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                    <User size={14}/> Nombre Completo <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    name="name" 
                                    required 
                                    className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all hover:bg-white" 
                                    placeholder="Ej: María Fernanda López"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                    <Calendar size={14}/> Fecha de Nacimiento <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    name="dob" 
                                    type="date" 
                                    required 
                                    className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all hover:bg-white"
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                    <Stethoscope size={14}/> Diagnóstico (Opcional)
                                </label>
                                <input 
                                    name="diagnosis" 
                                    className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-400 transition-all hover:bg-white" 
                                    placeholder="Ej: TEA Nivel 2"
                                />
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
                                <p className="text-xs text-blue-700 font-bold flex items-center gap-2">
                                    <Sparkles size={14}/> La edad se calculará automáticamente
                                </p>
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={()=>setShowAddChild(false)} 
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18}/> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* 🔐 MODAL - CAMBIAR CONTRASEÑA */}
        {showChangePass && (
             <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Lock size={24} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800">Cambiar Contraseña</h3>
                                <p className="text-sm text-slate-400">Ingresa tu nueva clave de acceso</p>
                            </div>
                        </div>
                        <button onClick={()=>setShowChangePass(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:rotate-90">
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                                Nueva Contraseña
                            </label>
                            <input 
                                name="newPassword" 
                                type="password" 
                                required 
                                minLength={6}
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:border-purple-400 focus:bg-white transition-all" 
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                                Confirmar Contraseña
                            </label>
                            <input 
                                name="confirmPassword" 
                                type="password" 
                                required 
                                minLength={6}
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:border-purple-400 focus:bg-white transition-all" 
                                placeholder="Repite la contraseña"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={()=>setShowChangePass(false)} 
                                className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all hover:scale-105 active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-purple-700 transition-all hover:scale-105 active:scale-95"
                            >
                                Actualizar
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        )}

        {/* ✏️ MODAL - EDITAR PERFIL */}
        {showEditProfile && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <User size={24} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl text-slate-800">Editar Perfil</h3>
                                <p className="text-sm text-slate-400">Actualiza tu información personal</p>
                            </div>
                        </div>
                        <button onClick={()=>setShowEditProfile(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:rotate-90">
                            <X size={22}/>
                        </button>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                <User size={14}/> Nombre Completo
                            </label>
                            <input 
                                name="fullName" 
                                defaultValue={profile?.full_name}
                                required 
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-green-400 transition-all hover:bg-white" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                <Phone size={14}/> Teléfono
                            </label>
                            <input 
                                name="phone" 
                                type="tel"
                                defaultValue={profile?.phone}
                                className="w-full p-4 bg-slate-50 rounded-2xl font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-green-400 transition-all hover:bg-white" 
                                placeholder="+51 924 807 183"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
                                <Mail size={14}/> Email (no editable)
                            </label>
                            <input 
                                value={profile?.email}
                                disabled
                                className="w-full p-4 bg-slate-100 rounded-2xl font-semibold text-slate-400 cursor-not-allowed" 
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={()=>setShowEditProfile(false)} 
                                className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all hover:scale-105 active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* 🔔 MODAL - NOTIFICACIONES (FIXED: iconos + modal detalle) */}
        {showNotifications && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={()=>{ setShowNotifications(false); setSelectedNoti(null) }}>
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                <Bell size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Centro de Notificaciones</h3>
                                <p className="text-xs text-blue-100">{notifications.length} notificacion{notifications.length!==1?'es':''} · {unreadCount > 0 ? `${unreadCount} sin leer` : 'todas leídas'}</p>
                            </div>
                        </div>
                        <button onClick={()=>{ setShowNotifications(false); setSelectedNoti(null) }} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90">
                            <X size={20}/>
                        </button>
                    </div>

                    {/* Detalle de notificación seleccionada */}
                    {selectedNoti ? (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <button onClick={()=>setSelectedNoti(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                <ChevronRight size={14} className="rotate-180"/> Volver
                            </button>
                            {(()=>{
                                const ft = selectedNoti.metadata?.form_type || selectedNoti.metadata?.source || selectedNoti.type || ''
                                const cfg =
                                    ft==='aba'            ? {icon:<Activity size={20}/>,      bg:'bg-indigo-100', text:'text-indigo-700', border:'border-indigo-200', label:'Sesión ABA'} :
                                    ft==='anamnesis'      ? {icon:<FileText size={20}/>,      bg:'bg-blue-100',   text:'text-blue-700',   border:'border-blue-200',   label:'Historia Clínica'} :
                                    ft==='entorno_hogar'  ? {icon:<Home size={20}/>,          bg:'bg-green-100',  text:'text-green-700',  border:'border-green-200',  label:'Entorno del Hogar'} :
                                    ['brief2','ados2','vineland3','wiscv','basc3'].includes(ft) ? {icon:<Brain size={20}/>, bg:'bg-purple-100', text:'text-purple-700', border:'border-purple-200', label:'Evaluación Clínica'} :
                                    selectedNoti.type==='form_request'    ? {icon:<FileText size={20}/>,      bg:'bg-orange-100', text:'text-orange-700', border:'border-orange-200', label:'Nuevo formulario'} :
                                    selectedNoti.type==='parent_message'  ? {icon:<MessageCircle size={20}/>, bg:'bg-blue-100',   text:'text-blue-700',   border:'border-blue-200',   label:'Mensaje del terapeuta'} :
                                    selectedNoti.type==='success'         ? {icon:<Star size={20}/>,          bg:'bg-yellow-100', text:'text-yellow-700', border:'border-yellow-200', label:'¡Buenas noticias!'} :
                                    selectedNoti.type==='warning'         ? {icon:<AlertCircle size={20}/>,   bg:'bg-red-100',    text:'text-red-700',    border:'border-red-200',    label:'Aviso'} :
                                                                             {icon:<Bell size={20}/>,           bg:'bg-blue-100',   text:'text-blue-700',   border:'border-blue-200',   label:'Notificación'}
                                return (
                                    <div className="space-y-4">
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.border}`}>
                                            <div className={`${cfg.bg} ${cfg.text} p-3 rounded-xl`}>{cfg.icon}</div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{cfg.label}</p>
                                                <p className="font-bold text-slate-800 text-sm">{selectedNoti.title}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-5">
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNoti.message}</p>
                                        </div>
                                        {selectedNoti.metadata?.source_title && (
                                            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                                                <FileText size={14} className="text-blue-500 flex-shrink-0"/>
                                                <div>
                                                    <p className="text-xs text-blue-400">Generado por</p>
                                                    <p className="text-sm font-semibold text-blue-700">{selectedNoti.metadata.source_title}</p>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={11}/> {new Date(selectedNoti.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                        </p>
                                    </div>
                                )
                            })()}
                        </div>
                    ) : (
                    <div className="p-5 space-y-3 overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Bell size={40} className="text-slate-300"/>
                                </div>
                                <p className="font-bold text-slate-400 text-base">Sin notificaciones aún</p>
                                <p className="text-slate-300 text-sm mt-1">Aquí verás los mensajes del terapeuta</p>
                            </div>
                        ) : (
                            notifications.map((noti) => {
                                const ft = noti.metadata?.form_type || noti.metadata?.source || noti.type || ''
                                const iconConfig =
                                    ft==='aba'            ? {icon:<Activity size={20}/>,      bg:'bg-indigo-100', text:'text-indigo-600', border:'border-indigo-200', label:'Sesión ABA'} :
                                    ft==='anamnesis'      ? {icon:<FileText size={20}/>,      bg:'bg-blue-100',   text:'text-blue-600',   border:'border-blue-200',   label:'Historia Clínica'} :
                                    ft==='entorno_hogar'  ? {icon:<Home size={20}/>,          bg:'bg-green-100',  text:'text-green-600',  border:'border-green-200',  label:'Entorno del Hogar'} :
                                    ['brief2','ados2','vineland3','wiscv','basc3'].includes(ft) ? {icon:<Brain size={20}/>, bg:'bg-purple-100', text:'text-purple-600', border:'border-purple-200', label:'Evaluación Clínica'} :
                                    noti.type==='form_request'   ? {icon:<FileText size={20}/>,      bg:'bg-orange-100', text:'text-orange-600', border:'border-orange-200', label:'Nuevo formulario'} :
                                    noti.type==='parent_message' ? {icon:<MessageCircle size={20}/>, bg:'bg-blue-100',   text:'text-blue-600',   border:'border-blue-200',   label:'Mensaje del terapeuta'} :
                                    noti.type==='success'        ? {icon:<Star size={20}/>,          bg:'bg-yellow-100', text:'text-yellow-600', border:'border-yellow-200', label:'¡Buenas noticias!'} :
                                    noti.type==='warning'        ? {icon:<AlertCircle size={20}/>,   bg:'bg-red-100',    text:'text-red-600',    border:'border-red-200',    label:'Aviso'} :
                                                                   {icon:<Bell size={20}/>,           bg:'bg-blue-100',   text:'text-blue-600',   border:'border-blue-200',   label:'Notificación'}
                                return (
                                    <button key={noti.id} onClick={()=>setSelectedNoti(noti)}
                                        className={`w-full text-left bg-slate-50 rounded-2xl border ${iconConfig.border} overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                                        <div className="p-4 flex gap-3 items-start">
                                            <div className={`${iconConfig.bg} ${iconConfig.text} p-3 rounded-xl shrink-0 shadow-sm`}>
                                                {iconConfig.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-slate-800 text-sm leading-snug">{noti.title}</p>
                                                    <ChevronRight size={14} className="text-slate-300 flex-shrink-0"/>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400 mb-1">{iconConfig.label}</p>
                                                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{noti.message}</p>
                                                <p className="text-slate-300 text-[10px] font-bold mt-2 flex items-center gap-1">
                                                    <Clock size={10}/> {new Date(noti.created_at).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                                    <span className="ml-1 text-blue-400">· Toca para leer</span>
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                    )}
                </div>
            </div>
        )}

        {/* 🔒 MODAL - PRIVACIDAD */}
        {showPrivacy && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                <Lock size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Privacidad y Seguridad</h3>
                                <p className="text-xs text-purple-100">Tus datos están protegidos</p>
                            </div>
                        </div>
                        <button onClick={()=>setShowPrivacy(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90">
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

                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                            Leer Política Completa
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ❓ MODAL - AYUDA */}
        {showHelp && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                <HelpCircle size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Centro de Ayuda</h3>
                                <p className="text-xs text-green-100">Estamos aquí para ti</p>
                            </div>
                        </div>
                        <button onClick={()=>setShowHelp(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90">
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
// SUB-COMPONENTES Y VISTAS
// ==============================================================================

