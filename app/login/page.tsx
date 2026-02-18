'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Mail, Lock, User, Loader2, ArrowRight, ShieldCheck,
  Eye, EyeOff, AlertCircle, HelpCircle, MessageCircle
} from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ mode?: string }>
}

export default function LoginPage(props: PageProps) {
  const searchParams = use(props.searchParams)
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(searchParams.mode === 'signup')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotInfo, setShowForgotInfo] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    try {
      if (isSignUp) {
        const { data: authData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) throw error
        if (authData.user) await supabase.from('profiles').insert([{ id: authData.user.id, email, full_name: fullName, role: 'padre' }])
        router.push('/padre')
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single()
        router.push(profile?.role === 'admin' ? '/admin' : '/padre')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) setErrorMessage('Correo o contraseña incorrectos.')
      else if (msg.includes('Email not confirmed')) setErrorMessage('Cuenta no confirmada. Contacta al administrador.')
      else if (msg.includes('User already registered')) setErrorMessage('Este correo ya está registrado.')
      else setErrorMessage(msg || 'Error al procesar la solicitud.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 p-4 font-sans">
      <div className="flex flex-col md:flex-row w-full max-w-5xl min-h-[680px] bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* LEFT PANEL */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative items-center justify-center p-10 text-white overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"/>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl"/>
          </div>
          <div className="relative z-10 text-center space-y-8">
            <div className="inline-flex p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
              <Image src="/images/logo.png" alt="Jugando Aprendo" width={120} height={120} className="object-contain" priority/>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Jugando Aprendo</h2>
              <p className="text-blue-100 mt-2 text-sm leading-relaxed">Plataforma de gestión integral<br/>para terapias en neurodiversidad</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: '🧩', text: 'Formularios TEA, TDAH y más' },
                { icon: '🤖', text: 'Análisis con Inteligencia Artificial' },
                { icon: '📊', text: 'Seguimiento personalizado' },
                { icon: '💙', text: 'Comunicación familia-terapeuta' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-blue-50">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col p-8 md:p-12 bg-white">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Image src="/images/logo.png" alt="Logo" width={40} height={40} className="object-contain"/>
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm">Jugando Aprendo</p>
              <p className="text-xs text-slate-400">Plataforma Terapéutica</p>
            </div>
          </div>

          <div className="max-w-sm mx-auto w-full flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4">
                <ShieldCheck className="text-blue-600" size={26}/>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                {isSignUp ? '¡Bienvenido!' : '¡Hola de nuevo!'}
              </h3>
              <p className="text-slate-500 text-sm mt-1.5">
                {isSignUp ? 'Crea tu cuenta para comenzar' : 'Ingresa con tus credenciales'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input name="fullName" type="text" placeholder="Ej: María García" required className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-medium"/>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input name="email" type="email" placeholder="tu@correo.com" required className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-medium"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'} required minLength={6} className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-medium"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {!isSignUp && (
                  <button type="button" onClick={() => setShowForgotInfo(!showForgotInfo)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2.5 transition-colors">
                    <HelpCircle size={13}/> ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>

              {showForgotInfo && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-black text-blue-800 uppercase tracking-wider">Recuperar Acceso</p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Comunícate con el equipo de <strong>Jugando Aprendo</strong>. 
                    Ellos restablecerán tu contraseña inmediatamente.
                  </p>
                  <a href="https://wa.me/51924807183?text=Hola,%20olvidé%20mi%20contraseña%20y%20necesito%20ayuda."
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-md">
                    <MessageCircle size={17}/> Contactar por WhatsApp
                  </a>
                  <p className="text-[10px] text-blue-400 text-center">Tel: <strong>+51 924 807 183</strong></p>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5"/><span>{errorMessage}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2.5 mt-2 disabled:opacity-70">
                {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>{isSignUp ? 'Crear Cuenta' : 'Ingresar'} <ArrowRight size={18}/></>}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"/></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400">{isSignUp ? '¿Ya tienes cuenta?' : '¿Primera vez?'}</span></div>
              </div>
              <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setShowForgotInfo(false) }} className="text-blue-600 hover:text-blue-700 font-bold text-sm hover:underline transition-all">
                {isSignUp ? 'Iniciar Sesión' : 'Crear una cuenta'}
              </button>
            </div>
            <p className="text-[10px] text-slate-300 text-center mt-6 flex items-center justify-center gap-1"><Lock size={10}/> Acceso seguro y protegido</p>
          </div>
        </div>
      </div>
    </div>
  )
}
