'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, Loader2, Eye, EyeOff, AlertCircle, MessageCircle, ArrowRight, Shield } from 'lucide-react'

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
        if (profile?.role === 'secretaria') router.push('/secretaria')
        else {
          const adminRoles = ['admin', 'jefe', 'especialista']
          router.push(adminRoles.includes(profile?.role) ? '/admin' : '/padre')
        }
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f7ff; }

        .lg-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8f7ff;
        }

        /* ══ LEFT PANEL ══════════════════════════════════════════ */
        .lg-left {
          display: none;
          width: 48%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          background: linear-gradient(150deg, #1e1048 0%, #2d1b69 40%, #4c1d95 75%, #5b21b6 100%);
          padding: 52px 56px;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 900px) { .lg-left { display: flex; } }

        /* Soft radial glow blobs */
        .lg-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .lg-blob-1 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%);
          top: -120px; left: -100px;
          animation: blobDrift 14s ease-in-out infinite alternate;
        }
        .lg-blob-2 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          bottom: -60px; right: -60px;
          animation: blobDrift 18s ease-in-out infinite alternate-reverse;
        }
        .lg-blob-3 {
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%);
          top: 45%; left: 55%;
          animation: blobDrift 10s ease-in-out infinite alternate;
        }
        @keyframes blobDrift {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(20px, -30px) scale(1.08); }
        }

        /* Subtle grid */
        .lg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Decorative arc */
        .lg-arc {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lg-arc-1 { width: 560px; height: 560px; top: -200px; right: -200px; }
        .lg-arc-2 { width: 280px; height: 280px; bottom: 40px; left: -80px; }

        .lg-left-inner {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
          height: 100%; justify-content: space-between;
        }

        .lg-logo-row { display: flex; align-items: center; gap: 13px; }
        .lg-logo-box {
          width: 46px; height: 46px; border-radius: 13px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .lg-brand { color: #fff; font-weight: 800; font-size: 16px; letter-spacing: -0.2px; line-height: 1.1; }
        .lg-brand-sub { color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 400; margin-top: 2px; }

        .lg-hero { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0 32px; }

        .lg-tag {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.75); border-radius: 99px;
          padding: 5px 14px; font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          width: fit-content; margin-bottom: 24px;
        }
        .lg-tag-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #a78bfa;
          animation: tagPulse 2.4s ease-in-out infinite;
        }
        @keyframes tagPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        .lg-headline {
          font-size: clamp(34px, 3.4vw, 46px);
          font-weight: 800; color: #fff;
          line-height: 1.12; letter-spacing: -1.2px;
          margin-bottom: 18px;
        }
        .lg-headline span { color: #c4b5fd; }

        .lg-desc {
          color: rgba(255,255,255,0.5); font-size: 14px;
          line-height: 1.85; font-weight: 400;
          max-width: 360px; margin-bottom: 44px;
        }

        /* Feature cards */
        .lg-cards { display: flex; flex-direction: column; gap: 8px; }
        .lg-card {
          display: flex; align-items: center; gap: 14px;
          padding: 15px 18px; border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 0.25s, border-color 0.25s;
          cursor: default;
        }
        .lg-card:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.13); }
        .lg-card-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .lg-card-title { color: rgba(255,255,255,0.9); font-weight: 700; font-size: 13px; line-height: 1.2; }
        .lg-card-desc { color: rgba(255,255,255,0.4); font-size: 11.5px; margin-top: 2px; font-weight: 400; }

        /* Stats row */
        .lg-stats {
          display: flex; gap: 0;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; overflow: hidden; margin-top: 10px;
        }
        .lg-stat { flex: 1; padding: 14px 16px; text-align: center; }
        .lg-stat + .lg-stat { border-left: 1px solid rgba(255,255,255,0.08); }
        .lg-stat-num { color: #e9d5ff; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; }
        .lg-stat-label { color: rgba(255,255,255,0.35); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

        .lg-footer { color: rgba(255,255,255,0.22); font-size: 11px; font-weight: 400; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }

        /* ══ RIGHT PANEL ══════════════════════════════════════════ */
        .lg-right {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 28px;
          background: #f8f7ff;
          position: relative;
          overflow: hidden;
        }

        /* Very subtle purple tint at top */
        .lg-right::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 260px;
          background: linear-gradient(180deg, rgba(109,40,217,0.05) 0%, transparent 100%);
          pointer-events: none;
        }

        .lg-form-box {
          width: 100%; max-width: 420px;
          position: relative; z-index: 1;
          animation: formSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes formSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile logo */
        .lg-mob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
        @media (min-width: 900px) { .lg-mob-logo { display: none; } }
        .lg-mob-logo-box { width: 36px; height: 36px; border-radius: 10px; background: #ede9fe; display: flex; align-items: center; justify-content: center; }

        /* Form header */
        .lg-form-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ede9fe; color: #5b21b6; border-radius: 99px;
          padding: 5px 13px; font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.01em; margin-bottom: 18px;
        }
        .lg-form-title {
          font-size: 28px; font-weight: 800; color: #1e1048;
          letter-spacing: -0.6px; line-height: 1.2; margin-bottom: 7px;
        }
        .lg-form-sub { font-size: 14px; color: #6b7280; font-weight: 400; margin-bottom: 30px; line-height: 1.55; }

        /* The form card */
        .lg-form-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #ede9fe;
          padding: 28px 28px 24px;
          box-shadow: 0 2px 20px rgba(109,40,217,0.06), 0 1px 3px rgba(0,0,0,0.04);
          margin-bottom: 20px;
        }

        /* Fields */
        .lg-field { margin-bottom: 16px; }
        .lg-label {
          display: block; font-size: 12px; font-weight: 700;
          color: #374151; margin-bottom: 7px; letter-spacing: 0.01em;
        }
        .lg-input-wrap { position: relative; }
        .lg-input {
          width: 100%; height: 48px;
          padding: 0 16px 0 44px;
          background: #faf8ff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lg-input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .lg-input::placeholder { color: #b0afc0; }
        .lg-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #c4b5fd; pointer-events: none; display: flex; align-items: center;
        }
        .lg-eye-btn {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #a8a0c4;
          padding: 4px; display: flex; align-items: center; border-radius: 8px;
          transition: color 0.2s, background 0.15s;
        }
        .lg-eye-btn:hover { color: #7c3aed; background: #ede9fe; }

        /* Forgot */
        .lg-forgot-btn {
          background: none; border: none; color: #7c3aed; font-size: 12.5px;
          font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0; display: block; margin-bottom: 18px;
          transition: color 0.2s;
        }
        .lg-forgot-btn:hover { color: #5b21b6; text-decoration: underline; }

        .lg-forgot-box {
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          border: 1.5px solid #ddd6fe; border-radius: 14px;
          padding: 16px 18px; margin-bottom: 16px;
        }
        .lg-forgot-text { font-size: 13px; color: #4c1d95; line-height: 1.65; margin-bottom: 12px; }
        .lg-wa-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff; border-radius: 11px; font-size: 13px; font-weight: 700;
          text-decoration: none; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.2s, transform 0.15s;
        }
        .lg-wa-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Error */
        .lg-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fff1f2; border: 1.5px solid #fda4af;
          color: #be123c; border-radius: 12px; padding: 12px 14px;
          font-size: 13px; margin-bottom: 14px; line-height: 1.5; font-weight: 500;
        }
        .lg-error svg { flex-shrink: 0; margin-top: 1px; }

        /* Submit */
        .lg-btn {
          width: 100%; height: 52px;
          background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #6d28d9 100%);
          color: #fff; border: none; border-radius: 13px;
          font-size: 15px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(109,40,217,0.35);
          position: relative; overflow: hidden;
          letter-spacing: -0.1px;
        }
        .lg-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%);
        }
        .lg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(109,40,217,0.42); }
        .lg-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 4px 14px rgba(109,40,217,0.3); }
        .lg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Divider */
        .lg-sep {
          display: flex; align-items: center; gap: 12px;
          color: #c9c5de; font-size: 12px; font-weight: 600;
          margin: 22px 0 20px;
        }
        .lg-sep::before, .lg-sep::after { content: ''; flex: 1; height: 1px; background: #e9e5fb; }

        /* OAuth buttons */
        .lg-oauth {
          width: 100%; height: 48px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #fff; border: 1.5px solid #e5e1f8; border-radius: 12px;
          color: #374151; font-size: 14px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer; margin-bottom: 10px;
          transition: all 0.2s;
        }
        .lg-oauth:hover { border-color: #c4b5fd; box-shadow: 0 2px 12px rgba(124,58,237,0.1); transform: translateY(-1px); }
        .lg-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Toggle */
        .lg-toggle { text-align: center; margin-top: 4px; }
        .lg-toggle span { font-size: 13.5px; color: #6b7280; }
        .lg-toggle button {
          background: none; border: none; color: #7c3aed; font-size: 13.5px;
          font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.2s; padding: 0 2px;
        }
        .lg-toggle button:hover { color: #4c1d95; }

        /* Footer */
        .lg-form-footer { text-align: center; margin-top: 24px; }
        .lg-security {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 99px;
          padding: 4px 12px; color: #16a34a; font-size: 11px; font-weight: 600;
          margin-bottom: 12px;
        }
        .lg-security-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: tagPulse 2.4s ease-in-out infinite; }
        .lg-links { font-size: 11.5px; color: #9ca3af; }
        .lg-links a { color: #9ca3af; text-decoration: none; transition: color 0.2s; }
        .lg-links a:hover { color: #5b21b6; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <div className="lg-root">

        {/* ══ LEFT ══ */}
        <div className="lg-left">
          <div className="lg-grid"/>
          <div className="lg-blob lg-blob-1"/>
          <div className="lg-blob lg-blob-2"/>
          <div className="lg-blob lg-blob-3"/>
          <div className="lg-arc lg-arc-1"/>
          <div className="lg-arc lg-arc-2"/>

          <div className="lg-left-inner">
            {/* Logo */}
            <div className="lg-logo-row">
              <div className="lg-logo-box">
                <Image src="/images/logo.png" alt="Logo" width={28} height={28} style={{ objectFit: 'contain' }}/>
              </div>
              <div>
                <div className="lg-brand">Jugando Aprendo</div>
                <div className="lg-brand-sub">Centro Terapéutico · Pisco, Ica</div>
              </div>
            </div>

            {/* Hero */}
            <div className="lg-hero">
              <div className="lg-tag">
                <span className="lg-tag-dot"/>
                Plataforma clínica ABA
              </div>
              <h2 className="lg-headline">
                Tu hijo merece<br/><span>lo mejor.</span>
              </h2>
              <p className="lg-desc">
                Plataforma de gestión clínica potenciada con Inteligencia Artificial para el seguimiento real de tu hijo y su familia.
              </p>

              <div className="lg-cards">
                {[
                  { icon: '🧩', title: 'Formularios TEA y TDAH', desc: 'BRIEF-2, ADOS-2, WISC-V y más' },
                  { icon: '🤖', title: 'Análisis con IA', desc: 'Informes clínicos automáticos' },
                  { icon: '📊', title: 'Progreso en tiempo real', desc: 'Gráficos y seguimiento visual' },
                  { icon: '💙', title: 'Portal para familias', desc: 'Citas, formularios y asistente IA' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="lg-card">
                    <div className="lg-card-icon">{icon}</div>
                    <div>
                      <div className="lg-card-title">{title}</div>
                      <div className="lg-card-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg-stats" style={{ marginTop: 20 }}>
                <div className="lg-stat"><div className="lg-stat-num">+50</div><div className="lg-stat-label">Pacientes</div></div>
                <div className="lg-stat"><div className="lg-stat-num">ABA</div><div className="lg-stat-label">Metodología</div></div>
                <div className="lg-stat"><div className="lg-stat-num">24/7</div><div className="lg-stat-label">Portal activo</div></div>
              </div>
            </div>

            <div className="lg-footer">© 2025 Jugando Aprendo · Pisco, Ica, Perú</div>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="lg-right">
          <div className="lg-form-box">

            {/* Mobile logo */}
            <div className="lg-mob-logo">
              <div className="lg-mob-logo-box">
                <Image src="/images/logo.png" alt="Logo" width={22} height={22} style={{ objectFit: 'contain' }}/>
              </div>
              <span style={{ fontWeight: 800, color: '#1e1048', fontSize: 15 }}>Jugando Aprendo</span>
            </div>

            <div className="lg-form-badge">
              ✦ {isSignUp ? 'Crea tu cuenta gratis' : 'Acceso seguro'}
            </div>
            <h1 className="lg-form-title">
              {isSignUp ? 'Bienvenido al equipo' : 'Hola, bienvenido de vuelta'}
            </h1>
            <p className="lg-form-sub">
              {isSignUp ? 'Completa los datos para comenzar' : 'Ingresa para continuar el seguimiento de tu hijo'}
            </p>

            {/* Form card */}
            <div className="lg-form-card">
              <form onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="lg-field">
                    <label className="lg-label">Nombre completo</label>
                    <div className="lg-input-wrap">
                      <span className="lg-input-icon"><User size={15}/></span>
                      <input className="lg-input" name="fullName" type="text" placeholder="Ej: María García" required/>
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

                <div className="lg-field" style={{ marginBottom: isSignUp ? 16 : 8 }}>
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
                      {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
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
                    <a href="https://wa.me/51924807183?text=Hola,%20olvidé%20mi%20contraseña." target="_blank" rel="noopener noreferrer" className="lg-wa-btn">
                      <MessageCircle size={14}/> Contactar por WhatsApp
                    </a>
                  </div>
                )}

                {errorMessage && (
                  <div className="lg-error">
                    <AlertCircle size={15}/> {errorMessage}
                  </div>
                )}

                <button type="submit" className="lg-btn" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 size={17} className="spin"/> Procesando...</>
                    : <>{isSignUp ? 'Crear Cuenta' : 'Ingresar'} <ArrowRight size={15}/></>
                  }
                </button>
              </form>

              <div className="lg-sep"><span>o continúa con</span></div>

              <button className="lg-oauth" onClick={handleGoogleLogin} disabled={isLoading}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
                </svg>
                Continuar con Google
              </button>

              <button className="lg-oauth" onClick={handleMicrosoftLogin} disabled={isLoading} style={{ marginBottom: 0 }}>
                <svg width="18" height="18" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Continuar con Microsoft
              </button>
            </div>

            <div className="lg-toggle">
              <span>{isSignUp ? '¿Ya tienes cuenta? ' : '¿Primera vez aquí? '}</span>
              <button onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setShowForgotInfo(false) }}>
                {isSignUp ? 'Iniciar sesión' : 'Crear una cuenta'}
              </button>
            </div>

            <div className="lg-form-footer">
              <div>
                <span className="lg-security">
                  <span className="lg-security-dot"/>
                  Acceso cifrado y protegido
                </span>
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
