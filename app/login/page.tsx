'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, Loader2, Eye, EyeOff, AlertCircle, MessageCircle, ArrowRight } from 'lucide-react'

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
        const adminRoles = ['admin', 'jefe', 'especialista']
        router.push(adminRoles.includes(profile?.role) ? '/admin' : '/padre')
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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .login-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #f5f4fe;
        }
        .lp-left {
          display: none;
          width: 50%;
          position: relative;
          background: linear-gradient(160deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%);
          overflow: hidden;
          padding: 52px 56px;
          flex-direction: column;
          justify-content: space-between;
        }
        @media(min-width: 900px){ .lp-left { display: flex; } }
        .lp-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .lp-orb { position: absolute; border-radius: 50%; filter: blur(70px); animation: orbFloat 9s ease-in-out infinite alternate; }
        .lp-orb-1 { width: 380px; height: 380px; background: #818cf8; opacity: .25; top: -120px; left: -80px; }
        .lp-orb-2 { width: 300px; height: 300px; background: #a78bfa; opacity: .2; bottom: 0; right: -60px; animation-delay: 4s; }
        .lp-orb-3 { width: 180px; height: 180px; background: #60a5fa; opacity: .3; bottom: 180px; left: 80px; animation-delay: 7s; }
        @keyframes orbFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(16px,-24px) scale(1.06); } }
        .lp-card {
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12);
          backdrop-filter: blur(12px); border-radius: 18px; padding: 18px 20px;
          display: flex; align-items: center; gap: 14px; transition: background .3s;
        }
        .lp-card:hover { background: rgba(255,255,255,.12); }
        .lp-card-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; background: rgba(255,255,255,.12); }
        .lp-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; }
        .lp-form-box { width: 100%; max-width: 430px; }
        .lp-field { position: relative; margin-bottom: 15px; }
        .lp-field label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; margin-bottom: 7px; }
        .lp-field input { width: 100%; padding: 13px 16px 13px 44px; background: #fff; border: 2px solid #e5e7eb; border-radius: 13px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; color: #111827; outline: none; transition: border-color .2s, box-shadow .2s; }
        .lp-field input:focus { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.1); }
        .lp-field .lp-icon { position: absolute; left: 14px; bottom: 14px; color: #9ca3af; pointer-events: none; }
        .lp-field .lp-eye { position: absolute; right: 14px; bottom: 13px; color: #9ca3af; cursor: pointer; background: none; border: none; padding: 0; transition: color .2s; display: flex; }
        .lp-field .lp-eye:hover { color: #4f46e5; }
        .lp-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none; border-radius: 13px; font-size: 15px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity .2s, transform .15s, box-shadow .2s; box-shadow: 0 8px 24px rgba(79,70,229,.3); margin-top: 6px; }
        .lp-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); box-shadow: 0 12px 28px rgba(79,70,229,.35); }
        .lp-btn:disabled { opacity: .6; cursor: not-allowed; }
        .lp-error { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1.5px solid #fca5a5; color: #dc2626; border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 14px; }
        .lp-sep { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: #d1d5db; font-size: 12px; }
        .lp-sep::before, .lp-sep::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
        .lp-forgot { background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 13px; padding: 15px 17px; margin-bottom: 14px; }
        .lp-forgot p { font-size: 13px; color: #3730a3; line-height: 1.6; margin-bottom: 11px; }
        .lp-forgot a { display: flex; align-items: center; justify-content: center; gap: 8px; background: #16a34a; color: #fff; border-radius: 10px; padding: 11px 16px; font-size: 13px; font-weight: 700; text-decoration: none; transition: background .2s; }
        .lp-forgot a:hover { background: #15803d; }
        .lp-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(79,70,229,.08); border: 1px solid rgba(79,70,229,.15); color: #4f46e5; border-radius: 99px; padding: 5px 13px; font-size: 12px; font-weight: 700; margin-bottom: 22px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media(min-width:900px) { .mobile-logo { display: none !important; } }
      `}</style>

      <div className="login-root" style={{ background: '#f5f4fe', colorScheme: 'light' }}>

        {/* LEFT */}
        <div className="lp-left">
          <div className="lp-grid" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />

          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 52 }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src="/images/logo.png" alt="Logo" width={30} height={30} style={{ objectFit: 'contain' }} />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>Jugando Aprendo</p>
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>Centro Terapéutico · Pisco</p>
              </div>
            </div>

            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 36, lineHeight: 1.2, marginBottom: 14 }}>
              Tu hijo merece<br/><span style={{ color: '#a5b4fc' }}>lo mejor.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, lineHeight: 1.75, marginBottom: 44, maxWidth: 340 }}>
              Plataforma de gestión clínica ABA potenciada con Inteligencia Artificial para el seguimiento real de tu hijo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🧩', title: 'Formularios TEA y TDAH', desc: 'BRIEF-2, ADOS-2, WISC-V y más' },
                { icon: '🤖', title: 'Análisis con IA Gemini', desc: 'Informes clínicos automáticos' },
                { icon: '📊', title: 'Progreso en tiempo real', desc: 'Gráficos y seguimiento visual' },
                { icon: '💙', title: 'Portal para familias', desc: 'Citas, formularios y asistente IA' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="lp-card">
                  <div className="lp-card-icon">{icon}</div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</p>
                    <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 22 }}>
            <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>© 2025 Jugando Aprendo · Pisco, Ica, Perú</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lp-right">
          <div className="lp-form-box">

            <div className="mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
              <Image src="/images/logo.png" alt="Logo" width={34} height={34} style={{ objectFit: 'contain' }} />
              <p style={{ fontWeight: 800, color: '#1e1b4b', fontSize: 16 }}>Jugando Aprendo</p>
            </div>

            <div className="lp-pill">✦ {isSignUp ? 'Crea tu cuenta gratis' : 'Acceso seguro'}</div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 6, lineHeight: 1.2 }}>
              {isSignUp ? 'Bienvenido al equipo' : 'Ingresa a tu cuenta'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
              {isSignUp ? 'Completa los datos para comenzar' : 'Continúa el seguimiento de tu hijo'}
            </p>

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="lp-field">
                  <label>Nombre Completo</label>
                  <User size={15} className="lp-icon" />
                  <input name="fullName" type="text" placeholder="Ej: María García" required />
                </div>
              )}

              <div className="lp-field">
                <label>Correo Electrónico</label>
                <Mail size={15} className="lp-icon" />
                <input name="email" type="email" placeholder="tu@correo.com" required />
              </div>

              <div className="lp-field">
                <label>Contraseña</label>
                <Lock size={15} className="lp-icon" />
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'} required minLength={6} style={{ paddingRight: 44 }} />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {!isSignUp && (
                <button type="button" onClick={() => setShowForgotInfo(!showForgotInfo)}
                  style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14, padding: 0, fontFamily: 'inherit', display: 'block' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              {showForgotInfo && (
                <div className="lp-forgot">
                  <p>Comunícate con <strong>Jugando Aprendo</strong> y restablecerán tu acceso de inmediato.</p>
                  <a href="https://wa.me/51924807183?text=Hola,%20olvidé%20mi%20contraseña." target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={14} /> Contactar por WhatsApp
                  </a>
                </div>
              )}

              {errorMessage && (
                <div className="lp-error">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {errorMessage}
                </div>
              )}

              <button type="submit" className="lp-btn" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={17} className="spin" /> Procesando...</>
                  : <>{isSignUp ? 'Crear Cuenta' : 'Ingresar'} <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="lp-sep"><span>o</span></div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>{isSignUp ? '¿Ya tienes cuenta? ' : '¿Primera vez? '}</span>
              <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setShowForgotInfo(false) }}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isSignUp ? 'Iniciar sesión' : 'Crear una cuenta'}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Lock size={10} /> Acceso cifrado y protegido
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
