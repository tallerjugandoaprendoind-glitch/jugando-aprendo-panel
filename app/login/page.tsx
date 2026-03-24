'use client'

import { useI18n } from '@/lib/i18n-context'
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
  const { t } = useI18n()
  const [isSignUp, setIsSignUp] = useState(searchParams.mode === 'signup')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotInfo, setShowForgotInfo] = useState(false)

  async function handleGoogleLogin() {
    setIsLoading(true); setErrorMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch {
      setErrorMessage('Error al conectar con Google. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  async function handleMicrosoftLogin() {
    setIsLoading(true); setErrorMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'email profile openid offline_access' },
      })
      if (error) throw error
    } catch {
      setErrorMessage('Error al conectar con Microsoft. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true); setErrorMessage('')
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
        const adminRoles = ['admin', 'jefe', 'especialista', 'secretaria']
        if (profile?.role === 'secretaria') router.push('/secretaria')
        else router.push(adminRoles.includes(profile?.role) ? '/admin' : '/padre')
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
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf9f7; }

        .lg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #faf9f7;
        }
        @media (min-width: 960px) {
          .lg-root { grid-template-columns: 1fr 1fr; }
        }

        /* ── LEFT PANEL ── */
        .lg-left {
          display: none;
          position: relative;
          overflow: hidden;
          background: #0f0e17;
          padding: 48px 52px;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 960px) { .lg-left { display: flex; } }

        /* Animated gradient mesh */
        .lg-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 20% 10%, rgba(124, 58, 237, 0.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(56, 189, 248, 0.2) 0%, transparent 55%),
            radial-gradient(ellipse 50% 70% at 60% 40%, rgba(251, 113, 133, 0.15) 0%, transparent 50%);
          animation: meshShift 12s ease-in-out infinite alternate;
        }
        @keyframes meshShift {
          0%   { opacity: 1; transform: scale(1) rotate(0deg); }
          50%  { opacity: 0.85; transform: scale(1.04) rotate(1deg); }
          100% { opacity: 1; transform: scale(1.02) rotate(-0.5deg); }
        }

        /* Noise overlay */
        .lg-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
        }

        /* Geometric line art */
        .lg-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lg-circle-1 { width: 520px; height: 520px; top: -180px; right: -180px; }
        .lg-circle-2 { width: 320px; height: 320px; bottom: -80px; left: -60px; }
        .lg-circle-3 { width: 200px; height: 200px; top: 50%; left: 50%; transform: translate(-50%, -50%); border-color: rgba(124,58,237,0.15); }

        .lg-left-content { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }

        .lg-logo-area { display: flex; align-items: center; gap: 12px; }
        .lg-logo-badge {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .lg-brand-name { color: #fff; font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
        .lg-brand-sub { color: rgba(255,255,255,0.35); font-size: 11px; font-weight: 400; margin-top: 1px; }

        .lg-hero { }
        .lg-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3);
          color: #c4b5fd; border-radius: 99px;
          padding: 4px 12px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .lg-eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: #a78bfa; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .lg-headline {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(38px, 4vw, 52px);
          line-height: 1.08;
          color: #fff;
          font-weight: 400;
          letter-spacing: -1px;
          margin-bottom: 20px;
        }
        .lg-headline em { font-style: italic; color: #c4b5fd; }

        .lg-subtext { color: rgba(255,255,255,0.45); font-size: 14px; line-height: 1.8; max-width: 360px; margin-bottom: 44px; font-weight: 300; }

        /* Feature pills */
        .lg-features { display: flex; flex-direction: column; gap: 2px; }
        .lg-feat {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid transparent;
          transition: all 0.25s;
          cursor: default;
        }
        .lg-feat:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.08); }
        .lg-feat-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
          background: rgba(255,255,255,0.07);
        }
        .lg-feat-title { color: rgba(255,255,255,0.85); font-weight: 600; font-size: 13px; }
        .lg-feat-desc { color: rgba(255,255,255,0.35); font-size: 12px; margin-top: 1px; font-weight: 400; }

        .lg-left-footer { color: rgba(255,255,255,0.2); font-size: 11px; font-weight: 300; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 20px; }

        /* ── RIGHT PANEL ── */
        .lg-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 28px;
          background: #faf9f7;
          position: relative;
        }

        /* Subtle background texture for right */
        .lg-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .lg-form-wrap { width: 100%; max-width: 400px; position: relative; z-index: 1; }

        /* Mobile logo */
        .lg-mobile-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
        @media (min-width: 960px) { .lg-mobile-logo { display: none; } }
        .lg-mobile-logo-badge { width: 38px; height: 38px; border-radius: 10px; background: #f0eefe; display: flex; align-items: center; justify-content: center; }
        .lg-mobile-logo-name { font-weight: 700; color: #1e1b4b; font-size: 15px; }

        .lg-form-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          color: #7c3aed; font-size: 12px; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          margin-bottom: 10px;
        }
        .lg-form-eyebrow-bar { width: 20px; height: 2px; background: #7c3aed; border-radius: 1px; }

        .lg-form-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 32px; font-weight: 400; color: #0f0e17;
          letter-spacing: -0.8px; line-height: 1.15;
          margin-bottom: 6px;
        }
        .lg-form-sub { font-size: 14px; color: #6b7280; font-weight: 400; margin-bottom: 32px; line-height: 1.5; }

        /* Fields */
        .lg-field { margin-bottom: 16px; }
        .lg-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #374151; margin-bottom: 7px; letter-spacing: 0.01em;
        }
        .lg-input-wrap { position: relative; }
        .lg-input {
          width: 100%; height: 50px;
          padding: 0 16px 0 44px;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lg-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .lg-input::placeholder { color: #9ca3af; }
        .lg-input-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none;
          display: flex; align-items: center;
        }
        .lg-eye-btn {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          color: #9ca3af; cursor: pointer; background: none; border: none;
          padding: 4px; display: flex; align-items: center;
          border-radius: 6px; transition: color 0.2s, background 0.2s;
        }
        .lg-eye-btn:hover { color: #7c3aed; background: rgba(124,58,237,0.06); }

        /* Forgot */
        .lg-forgot-btn {
          background: none; border: none; color: #7c3aed; font-size: 13px;
          font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif;
          padding: 0; margin-bottom: 16px; display: block;
          transition: color 0.2s;
        }
        .lg-forgot-btn:hover { color: #5b21b6; }

        .lg-forgot-box {
          background: #f5f3ff; border: 1.5px solid #ddd6fe;
          border-radius: 14px; padding: 16px; margin-bottom: 16px;
        }
        .lg-forgot-text { font-size: 13px; color: #5b21b6; line-height: 1.6; margin-bottom: 12px; }
        .lg-whatsapp-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px; background: #16a34a; color: #fff;
          border-radius: 10px; font-size: 13px; font-weight: 700;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .lg-whatsapp-btn:hover { background: #15803d; }

        /* Error */
        .lg-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fef2f2; border: 1.5px solid #fca5a5;
          color: #dc2626; border-radius: 12px; padding: 12px 14px;
          font-size: 13px; margin-bottom: 14px; line-height: 1.5;
        }
        .lg-error svg { flex-shrink: 0; margin-top: 1px; }

        /* Submit */
        .lg-submit {
          width: 100%; height: 52px;
          background: #0f0e17;
          color: #fff;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          margin-top: 4px;
          letter-spacing: -0.2px;
          position: relative;
          overflow: hidden;
        }
        .lg-submit::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(124,58,237,0.15) 100%);
          opacity: 0; transition: opacity 0.3s;
        }
        .lg-submit:hover:not(:disabled)::before { opacity: 1; }
        .lg-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(15,14,23,0.25); }
        .lg-submit:active:not(:disabled) { transform: translateY(0); }
        .lg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Divider */
        .lg-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0; color: #d1d5db; font-size: 12px; font-weight: 500;
        }
        .lg-divider::before, .lg-divider::after {
          content: ''; flex: 1; height: 1px; background: #e9e8e4;
        }

        /* OAuth */
        .lg-oauth {
          width: 100%; height: 48px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px;
          color: #374151; font-size: 14px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; margin-bottom: 10px;
          transition: all 0.2s;
        }
        .lg-oauth:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.07); background: #fafafa; }
        .lg-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Toggle */
        .lg-toggle { text-align: center; margin-top: 18px; }
        .lg-toggle span { font-size: 14px; color: #6b7280; }
        .lg-toggle button {
          background: none; border: none; color: #7c3aed; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
          padding: 0 2px; transition: color 0.2s;
        }
        .lg-toggle button:hover { color: #5b21b6; }

        /* Footer */
        .lg-form-footer { margin-top: 28px; text-align: center; }
        .lg-security { display: inline-flex; align-items: center; gap: 5px; color: #b5b0a8; font-size: 11px; margin-bottom: 10px; }
        .lg-security-dot { width: 4px; height: 4px; border-radius: 50%; background: #6ee7b7; }
        .lg-links { font-size: 11px; color: #b5b0a8; }
        .lg-links a { color: #9ca3af; text-decoration: none; transition: color 0.2s; }
        .lg-links a:hover { color: #6b7280; }

        @keyframes spinAnim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spinAnim 1s linear infinite; }

        /* Entrance animation */
        .lg-form-wrap { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .lg-left-content > * { animation: fadeIn 0.6s ease both; }
        .lg-left-content > *:nth-child(1) { animation-delay: 0.1s; }
        .lg-left-content > *:nth-child(2) { animation-delay: 0.2s; }
        .lg-left-content > *:nth-child(3) { animation-delay: 0.3s; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="lg-root">

        {/* ── LEFT ── */}
        <div className="lg-left">
          <div className="lg-mesh"/>
          <div className="lg-noise"/>
          <div className="lg-circle lg-circle-1"/>
          <div className="lg-circle lg-circle-2"/>
          <div className="lg-circle lg-circle-3"/>

          <div className="lg-left-content">
            {/* Logo */}
            <div className="lg-logo-area">
              <div className="lg-logo-badge">
                <Image src="/images/logo.png" alt="Logo" width={26} height={26} style={{ objectFit: 'contain' }}/>
              </div>
              <div>
                <div className="lg-brand-name">Jugando Aprendo</div>
                <div className="lg-brand-sub">Centro Terapéutico · Pisco</div>
              </div>
            </div>

            {/* Hero */}
            <div className="lg-hero">
              <div className="lg-eyebrow">
                <span className="lg-eyebrow-dot"/>
                Plataforma clínica ABA
              </div>
              <h2 className="lg-headline">
                Tu hijo merece<br/><em>lo mejor.</em>
              </h2>
              <p className="lg-subtext">
                Gestión clínica potenciada con Inteligencia Artificial para el seguimiento real de cada niño y su familia.
              </p>

              <div className="lg-features">
                {[
                  { icon: '🧩', title: 'Formularios TEA y TDAH', desc: 'BRIEF-2, ADOS-2, WISC-V y más' },
                  { icon: '🤖', title: 'Análisis con IA', desc: 'Informes clínicos automáticos' },
                  { icon: '📊', title: 'Progreso en tiempo real', desc: 'Gráficos y seguimiento visual' },
                  { icon: '💙', title: 'Portal para familias', desc: 'Citas, formularios y asistente IA' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="lg-feat">
                    <div className="lg-feat-icon">{icon}</div>
                    <div>
                      <div className="lg-feat-title">{title}</div>
                      <div className="lg-feat-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="lg-left-footer">© 2025 Jugando Aprendo · Pisco, Ica, Perú</div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lg-right">
          <div className="lg-form-wrap">

            {/* Mobile logo */}
            <div className="lg-mobile-logo">
              <div className="lg-mobile-logo-badge">
                <Image src="/images/logo.png" alt="Logo" width={22} height={22} style={{ objectFit: 'contain' }}/>
              </div>
              <span className="lg-mobile-logo-name">Jugando Aprendo</span>
            </div>

            {/* Eyebrow */}
            <div className="lg-form-eyebrow">
              <div className="lg-form-eyebrow-bar"/>
              {isSignUp ? 'Crear cuenta' : 'Acceso seguro'}
            </div>

            <h1 className="lg-form-title">
              {isSignUp ? 'Bienvenido al equipo' : 'Ingresa a tu cuenta'}
            </h1>
            <p className="lg-form-sub">
              {isSignUp ? 'Completa los datos para comenzar' : 'Continúa el seguimiento de tu hijo'}
            </p>

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="lg-field">
                  <label className="lg-label">Nombre completo</label>
                  <div className="lg-input-wrap">
                    <span className="lg-input-icon"><User size={15}/></span>
                    <input className="lg-input" name="fullName" type="text" placeholder="Tu nombre completo" required/>
                  </div>
                </div>
              )}

              <div className="lg-field">
                <label className="lg-label">Correo electrónico</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon"><Mail size={15}/></span>
                  <input className="lg-input" name="email" type="email" placeholder="tu@correo.com" required/>
                </div>
              </div>

              <div className="lg-field">
                <label className="lg-label">Contraseña</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon"><Lock size={15}/></span>
                  <input
                    className="lg-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                    required minLength={6}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="lg-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <button type="button" className="lg-forgot-btn" onClick={() => setShowForgotInfo(!showForgotInfo)}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              {showForgotInfo && (
                <div className="lg-forgot-box">
                  <p className="lg-forgot-text">Comunícate con <strong>Jugando Aprendo</strong> y el equipo restablecerá tu acceso.</p>
                  <a href="https://wa.me/51924807183?text=Hola,%20olvidé%20mi%20contraseña." target="_blank" rel="noopener noreferrer" className="lg-whatsapp-btn">
                    <MessageCircle size={14}/> Contactar por WhatsApp
                  </a>
                </div>
              )}

              {errorMessage && (
                <div className="lg-error">
                  <AlertCircle size={15}/> {errorMessage}
                </div>
              )}

              <button type="submit" className="lg-submit" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 size={17} className="spin"/> Procesando...</>
                  : <>{isSignUp ? 'Crear Cuenta' : 'Ingresar'} <ArrowRight size={15}/></>
                }
              </button>
            </form>

            <div className="lg-divider"><span>o continúa con</span></div>

            {/* Google */}
            <button className="lg-oauth" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
              </svg>
              Continuar con Google
            </button>

            {/* Microsoft */}
            <button className="lg-oauth" onClick={handleMicrosoftLogin} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Continuar con Microsoft
            </button>

            <div className="lg-toggle">
              <span>{isSignUp ? '¿Ya tienes cuenta? ' : '¿Primera vez? '}</span>
              <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setShowForgotInfo(false) }}>
                {isSignUp ? 'Iniciar sesión' : 'Crear una cuenta'}
              </button>
            </div>

            <div className="lg-form-footer">
              <div className="lg-security">
                <span className="lg-security-dot"/>
                Acceso cifrado y protegido
              </div>
              <div className="lg-links">
                <a href="/privacidad">Política de Privacidad</a>
                {' · '}
                <a href="/terminos">Términos de Servicio</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
