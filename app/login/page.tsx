'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Mail, Lock, User, Loader2, 
  ArrowRight, ShieldCheck, Eye, EyeOff, MessageCircle, Heart 
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

  // WhatsApp para recuperación de contraseña
  const handleForgotPassword = () => {
    const phoneNumber = '51924807183'
    const message = encodeURIComponent('Hola, necesito ayuda para recuperar mi contraseña de Jugando Aprendo.')
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  // Manejo de Login con contraseña
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
        // REGISTRO DE NUEVO USUARIO
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (signUpError) throw signUpError

        // Crear perfil en la tabla profiles
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                email: email,
                full_name: fullName,
                role: 'padre',
              },
            ])

          if (profileError && profileError.code !== '23505') {
            console.error('Error creando perfil:', profileError)
          }
        }

        router.push('/padre')
        
      } else {
        // LOGIN DE USUARIO EXISTENTE
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        // Verificar el rol del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        // Redirigir según el rol
        if (profile?.role === 'admin' || email === 'admin@jugandoaprendo.com') {
          router.push('/admin')
        } else {
          router.push('/padre')
        }
      }

    } catch (err: any) {
      console.error('Error en autenticación:', err)
      
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('Correo o contraseña incorrectos. Por favor verifica tus datos.')
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMessage('Por favor confirma tu correo electrónico antes de iniciar sesión.')
      } else if (err.message?.includes('User already registered')) {
        setErrorMessage('Este correo ya está registrado. Intenta iniciar sesión.')
      } else {
        setErrorMessage(err.message || 'Error al procesar tu solicitud. Intenta de nuevo.')
      }
      
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50/30 p-4 md:p-8 font-sans">
      
      {/* Tarjeta Principal */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl min-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Lado Izquierdo: Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative items-center justify-center p-12 text-white overflow-hidden">
          
          {/* Decoración de fondo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-300 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 text-center space-y-8">
            {/* Logo */}
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 inline-block shadow-xl">
              <Image 
                src="/images/logo.png" 
                alt="Logo Jugando Aprendo" 
                width={140} 
                height={140} 
                className="object-contain"
                priority
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">
                Jugando Aprendo
              </h2>
              <p className="text-lg text-blue-100 max-w-sm mx-auto leading-relaxed">
                Transformando el futuro de los niños a través del juego y el aprendizaje
              </p>
            </div>

            {/* Badge de confianza */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20 max-w-fit mx-auto">
              <Heart size={18} className="fill-pink-300 text-pink-300" />
              <span className="text-sm font-semibold">+50 Familias Confían en Nosotros</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-16 relative bg-white">
          
          {/* Botón Volver */}
          <Link 
            href="/" 
            className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm">Volver</span>
          </Link>

          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            
            {/* Header del formulario */}
            <div className="mb-10 text-center">
              <div className="inline-block p-3 bg-blue-100 rounded-2xl mb-4">
                <ShieldCheck className="text-blue-600" size={28} />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {isSignUp ? '¡Bienvenido!' : '¡Hola de nuevo!'}
              </h3>
              <p className="text-gray-600">
                {isSignUp 
                  ? 'Crea tu cuenta para comenzar' 
                  : 'Ingresa para ver el progreso de tu hijo'}
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Campo Nombre (solo en registro) */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      name="fullName"
                      type="text"
                      placeholder="Ej: María García"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    name="email"
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {/* Botón olvidé contraseña */}
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold mt-2 transition-colors"
                  >
                    <MessageCircle size={16} />
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>

              {/* Mensaje de error */}
              {errorMessage && (
                <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                  <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-6"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle entre Login y Signup */}
            <div className="mt-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    {isSignUp ? '¿Ya tienes cuenta?' : '¿Nuevo en Jugando Aprendo?'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => { 
                  setIsSignUp(!isSignUp)
                  setErrorMessage('') 
                  setShowPassword(false)
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
              >
                {isSignUp ? 'Inicia Sesión' : 'Crea una Cuenta'}
              </button>
            </div>

            {/* Nota de seguridad */}
            <p className="text-xs text-gray-400 text-center mt-6">
              🔒 Tus datos están protegidos de forma segura
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}