'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  Heart, Users, MapPin, CheckCircle, ArrowRight, HelpCircle,
  Brain, Calendar, Sparkles, LineChart, MessageSquareHeart,
  Star, Award, Clock, Phone, Mail, Instagram, Facebook, ChevronDown
} from 'lucide-react'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [count50, setCount50] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // counter animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true
        let n = 0
        const timer = setInterval(() => {
          n += 2
          setCount50(n)
          if (n >= 50) clearInterval(timer)
        }, 40)
      }
    }, { threshold: 0.4 })
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1a1a2e; overflow-x: hidden; }

        /* ── NAV ── */
        .nav-bar {
          position: sticky; top: 0; z-index: 100;
          transition: all .3s;
          border-bottom: 1px solid transparent;
        }
        .nav-bar.scrolled {
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(16px);
          border-color: #f1f0ff;
          box-shadow: 0 4px 24px rgba(79,70,229,.06);
        }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 70px; display: flex; align-items: center; justify-content: space-between; }
        .nav-links { display: none; gap: 32px; }
        @media(min-width:768px){ .nav-links { display: flex; } }
        .nav-links a { font-size: 14px; font-weight: 600; color: #4b5563; text-decoration: none; transition: color .2s; }
        .nav-links a:hover { color: #4f46e5; }
        .nav-cta-outline { padding: 9px 22px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 700; color: #374151; text-decoration: none; transition: all .2s; }
        .nav-cta-outline:hover { border-color: #4f46e5; color: #4f46e5; }
        .nav-cta-fill { padding: 9px 22px; background: #4f46e5; border-radius: 10px; font-size: 14px; font-weight: 700; color: #fff; text-decoration: none; transition: all .2s; box-shadow: 0 4px 14px rgba(79,70,229,.3); }
        .nav-cta-fill:hover { background: #4338ca; box-shadow: 0 6px 18px rgba(79,70,229,.4); transform: translateY(-1px); }

        /* ── HERO ── */
        .hero {
          min-height: 92vh;
          display: flex; align-items: center;
          background: linear-gradient(170deg, #f5f4fe 0%, #fff 55%, #f0fdf4 100%);
          position: relative; overflow: hidden;
          padding: 80px 24px 60px;
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image: radial-gradient(circle, rgba(79,70,229,.06) 1px, transparent 1px);
          background-size: 36px 36px;
        }
        .hero-blob-1 { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(79,70,229,.12) 0%, transparent 70%); top: -200px; right: -100px; border-radius: 50%; }
        .hero-blob-2 { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(168,85,247,.08) 0%, transparent 70%); bottom: -100px; left: -100px; border-radius: 50%; }
        .hero-inner { max-width: 1200px; margin: 0 auto; width: 100%; display: grid; gap: 60px; position: relative; z-index: 1; align-items: center; }
        @media(min-width:900px){ .hero-inner { grid-template-columns: 1fr 1fr; } }

        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #fce7f3, #ede9fe);
          border: 1px solid #f9a8d4; border-radius: 99px;
          padding: 7px 16px; font-size: 12px; font-weight: 700;
          color: #be185d; margin-bottom: 20px;
          animation: fadeSlideUp .6s ease both;
        }
        .hero-h1 {
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800; line-height: 1.13;
          color: #111827; margin-bottom: 20px;
          animation: fadeSlideUp .6s .1s ease both;
        }
        .hero-h1 em { font-style: normal; color: #4f46e5; }
        .hero-p {
          font-size: 18px; color: #6b7280; line-height: 1.75;
          margin-bottom: 36px; max-width: 480px;
          animation: fadeSlideUp .6s .2s ease both;
        }
        .hero-btns { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 44px; animation: fadeSlideUp .6s .3s ease both; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 15px 30px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 13px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all .25s; box-shadow: 0 8px 24px rgba(79,70,229,.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(79,70,229,.4); }
        .btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 15px 28px; border: 2px solid #e5e7eb; color: #374151; border-radius: 13px; font-weight: 700; font-size: 15px; text-decoration: none; background: #fff; transition: all .25s; cursor: pointer; font-family: inherit; }
        .btn-outline:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f4fe; }

        .hero-badges { display: flex; flex-wrap: wrap; gap: 16px; animation: fadeSlideUp .6s .4s ease both; }
        .hero-badge { display: flex; align-items: center; gap: 10px; }
        .hero-badge-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .hero-badge span { font-size: 13px; font-weight: 700; color: #374151; }

        /* hero image side */
        .hero-img-wrap { position: relative; animation: fadeSlideUp .7s .2s ease both; }
        .hero-img-main {
          border-radius: 28px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,.15);
          aspect-ratio: 4/3; position: relative;
          border: 4px solid #fff;
          transform: rotate(1.5deg);
          transition: transform .4s;
        }
        .hero-img-main:hover { transform: rotate(0); }
        .hero-badge-float {
          position: absolute; background: #fff;
          border-radius: 14px; padding: 12px 18px;
          box-shadow: 0 8px 30px rgba(0,0,0,.12);
          display: flex; align-items: center; gap: 10px;
          font-weight: 700; font-size: 13px;
        }
        .hero-badge-tl { top: 20px; left: -20px; color: #1e1b4b; }
        .hero-badge-br { bottom: 20px; right: -20px; color: #065f46; }

        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* ── STATS STRIP ── */
        .stats-strip { background: linear-gradient(135deg, #1e1b4b, #4f46e5); padding: 56px 24px; }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(2,1fr); gap: 32px; }
        @media(min-width:640px){ .stats-inner { grid-template-columns: repeat(4,1fr); } }
        .stat-item { text-align: center; }
        .stat-num { font-size: 46px; font-weight: 800; color: #fff; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,.6); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }

        /* ── SECTION COMMON ── */
        .section { padding: 100px 24px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-tag { display: inline-flex; align-items: center; gap: 7px; background: #ede9fe; color: #7c3aed; border-radius: 99px; padding: 5px 14px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
        .section-h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: #111827; line-height: 1.2; margin-bottom: 16px; }
        .section-p { font-size: 17px; color: #6b7280; line-height: 1.75; max-width: 600px; }

        /* ── IA SECTION ── */
        .ia-section { background: linear-gradient(160deg, #0f0c29 0%, #1e1b4b 50%, #1a2a4a 100%); padding: 100px 24px; position: relative; overflow: hidden; }
        .ia-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 48px 48px; }
        .ia-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        .ia-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); backdrop-filter: blur(10px); border-radius: 22px; padding: 36px; transition: all .3s; }
        .ia-card:hover { background: rgba(255,255,255,.09); transform: translateY(-4px); border-color: rgba(255,255,255,.2); }
        .ia-card-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .ia-card h4 { color: #fff; font-weight: 700; font-size: 18px; margin-bottom: 10px; }
        .ia-card p { color: rgba(255,255,255,.55); font-size: 14px; line-height: 1.7; }

        /* ── SERVICIOS ── */
        .services-section { background: #f9f8ff; padding: 100px 24px; }
        .svc-card { background: #fff; border-radius: 22px; padding: 36px; border: 2px solid #f3f4f6; transition: all .3s; position: relative; overflow: hidden; }
        .svc-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #4f46e5, #7c3aed); transform: scaleX(0); transform-origin: left; transition: transform .3s; }
        .svc-card:hover::before { transform: scaleX(1); }
        .svc-card:hover { border-color: #e0e7ff; box-shadow: 0 20px 60px rgba(79,70,229,.1); transform: translateY(-4px); }
        .svc-card.featured { background: linear-gradient(150deg, #4f46e5, #7c3aed); border-color: transparent; color: #fff; }
        .svc-card.featured::before { display: none; }
        .svc-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .svc-popular { position: absolute; top: 20px; right: 20px; background: #fbbf24; color: #1a1a2e; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }

        /* ── FAQ ── */
        .faq-item { border: 2px solid #f3f4f6; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all .2s; margin-bottom: 12px; background: #fff; }
        .faq-item:hover { border-color: #e0e7ff; box-shadow: 0 4px 20px rgba(79,70,229,.06); }
        .faq-item.open { border-color: #c7d2fe; }
        .faq-q { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; }
        .faq-q h4 { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 12px; }
        .faq-a { padding: 0 24px 22px; font-size: 14px; color: #6b7280; line-height: 1.75; }

        /* ── MAP ── */
        .map-section { position: relative; height: 520px; }
        .map-card { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 32px; border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.15); max-width: 380px; width: calc(100% - 48px); }
        @media(min-width:768px){ .map-card { left: 64px; transform: translateY(-50%); } }

        /* ── FOOTER ── */
        .footer { background: #0f0c29; color: rgba(255,255,255,.45); padding: 72px 24px 32px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; gap: 40px; margin-bottom: 48px; }
        @media(min-width:768px){ .footer-inner { grid-template-columns: 2fr 1fr 1fr 1fr; } }
        .footer h4 { color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 18px; }
        .footer ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer ul li a { color: rgba(255,255,255,.45); text-decoration: none; font-size: 14px; transition: color .2s; }
        .footer ul li a:hover { color: #fff; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,.06); padding-top: 24px; text-align: center; font-size: 13px; }
        .social-btn { width: 38px; height: 38px; background: rgba(255,255,255,.07); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: rgba(255,255,255,.5); transition: all .2s; text-decoration: none; margin-right: 8px; }
        .social-btn:hover { background: #4f46e5; color: #fff; }

        /* whatsapp */
        @keyframes waBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .wa-btn { position: fixed; bottom: 24px; right: 24px; z-index: 999; width: 60px; height: 60px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(37,211,102,.4); animation: waBounce 3s ease-in-out infinite; transition: transform .2s, box-shadow .2s; text-decoration: none; }
        .wa-btn:hover { transform: scale(1.1); box-shadow: 0 12px 30px rgba(37,211,102,.5); }
        .wa-ping { position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; background: #ef4444; border-radius: 50%; }
        .wa-ping::before { content: ''; position: absolute; inset: 0; background: #ef4444; border-radius: 50%; animation: ping 1.5s cubic-bezier(0,0,.2,1) infinite; }
        @keyframes ping { 75%,100%{transform:scale(2); opacity:0} }

        /* grid cards */
        .grid-3 { display: grid; gap: 24px; }
        @media(min-width:640px){ .grid-3 { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:900px){ .grid-3 { grid-template-columns: repeat(3,1fr); } }
        .grid-4 { display: grid; gap: 20px; grid-template-columns: repeat(2,1fr); }
        @media(min-width:640px){ .grid-4 { grid-template-columns: repeat(4,1fr); } }
      `}</style>

      {/* WHATSAPP FLOAT */}
      <a href="https://wa.me/51924807183" target="_blank" rel="noopener noreferrer" className="wa-btn">
        <Phone size={26} color="#fff" />
        <div className="wa-ping" />
      </a>

      {/* NAV */}
      <nav className={`nav-bar ${isScrolled ? 'scrolled' : ''}`} style={{ background: isScrolled ? undefined : 'transparent' }}>
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <Image src="/images/logo.png?v=2" alt="Logo" fill style={{ objectFit: 'contain' }} priority unoptimized />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', lineHeight: 1.1 }}>Jugando Aprendo</p>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Centro de Desarrollo Infantil</p>
            </div>
          </div>

          <div className="nav-links">
            <a href="#ia-innovacion">Innovación IA</a>
            <a href="#servicios">Servicios</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#faq">Preguntas</a>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" className="nav-cta-outline">Ingresar</Link>
            <Link href="/login?mode=signup" className="nav-cta-fill">Registrarse</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-grid" />
        <div className="hero-blob-1" />
        <div className="hero-blob-2" />
        <div className="hero-inner">
          <div>
            <div className="hero-tag">
              <Heart size={13} style={{ fill: 'currentColor' }} /> Terapia + Tecnología + Amor
            </div>
            <h1 className="hero-h1">
              Impulsando el<br/>potencial de{' '}
              <em>mentes brillantes.</em>
            </h1>
            <p className="hero-p">
              Centro especializado en neurodivergencia en Pisco. Combinamos la evidencia científica ABA con la innovación de la Inteligencia Artificial y el corazón de nuestra familia.
            </p>
            <div className="hero-btns">
              <Link href="/login?mode=signup" className="btn-primary">
                Empezar Ahora <ArrowRight size={17} />
              </Link>
              <button className="btn-outline" onClick={() => scrollToSection('ia-innovacion')}>
                <Sparkles size={17} color="#7c3aed" /> Ver Innovación IA
              </button>
            </div>
            <div className="hero-badges">
              {[
                { bg: '#dcfce7', icon: <CheckCircle size={18} color="#16a34a" />, label: 'Metodología ABA' },
                { bg: '#dbeafe', icon: <Star size={18} color="#2563eb" style={{ fill: '#2563eb' }} />, label: '+50 Familias' },
                { bg: '#f3e8ff', icon: <Award size={18} color="#9333ea" />, label: 'Certificados' },
              ].map(({ bg, icon, label }) => (
                <div key={label} className="hero-badge">
                  <div className="hero-badge-icon" style={{ background: bg }}>{icon}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-img-wrap">
            <div className="hero-img-main">
              <Image src="/images/hero-image.jpg?v=2" alt="Niños en terapia" fill style={{ objectFit: 'cover' }} priority unoptimized />
            </div>
            <div className="hero-badge-float hero-badge-tl">
              <div style={{ width: 32, height: 32, background: '#dbeafe', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={16} color="#2563eb" />
              </div>
              <span>Metodología ABA</span>
            </div>
            <div className="hero-badge-float hero-badge-br" style={{ color: '#065f46' }}>
              <CheckCircle size={20} color="#16a34a" />
              <span>100% Personalizado</span>
            </div>
          </div>
        </div>
      </header>

      {/* STATS */}
      <div className="stats-strip" ref={statsRef} id="nosotros">
        <div className="stats-inner">
          {[
            { num: `+${count50}`, label: 'Familias felices' },
            { num: '100%', label: 'Personalizado' },
            { num: 'ABA', label: 'Metodología' },
            { num: 'Pisco', label: 'Sede Central' },
          ].map(({ num, label }) => (
            <div key={label} className="stat-item">
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* IA SECTION */}
      <section id="ia-innovacion" className="ia-section">
        <div className="ia-grid" />
        <div className="ia-inner">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.3)', color: '#c4b5fd', borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
              <Sparkles size={14} /> Tecnología al servicio del desarrollo
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              Tu copiloto inteligente:<br/><span style={{ color: '#818cf8' }}>IA con datos reales</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 17, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
              No estás solo entre sesiones. Nuestra IA aprende exclusivamente de los registros clínicos diarios de tu hijo.
            </p>
          </div>

          <div className="grid-3">
            {[
              { icon: <LineChart size={26} color="#818cf8" />, bg: 'rgba(129,140,248,.15)', title: 'Seguimiento Preciso', desc: 'La IA analiza tendencias en la conducta y el aprendizaje sesión tras sesión, detectando patrones invisibles.' },
              { icon: <MessageSquareHeart size={26} color="#c084fc" />, bg: 'rgba(192,132,252,.15)', title: 'Apoyo para Padres', desc: 'Resúmenes fáciles de entender y recomendaciones personalizadas para trabajar desde casa.' },
              { icon: <Brain size={26} color="#6ee7b7" />, bg: 'rgba(110,231,183,.15)', title: 'Progreso Visible', desc: 'Gráficos interactivos que muestran la evolución de tu hijo en tiempo real con cada sesión.' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="ia-card">
                <div className="ia-card-icon" style={{ background: bg }}>{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="services-section">
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag"><Star size={13} /> Nuestros Servicios</div>
            <h2 className="section-h2">Soluciones integrales<br/>para el desarrollo</h2>
          </div>

          <div className="grid-3">
            <div className="svc-card">
              <div className="svc-icon" style={{ background: '#dbeafe' }}>
                <Brain size={26} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Terapia ABA</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>Intervención basada en evidencia para mejorar habilidades sociales, comunicación y aprendizaje.</p>
              <button onClick={() => scrollToSection('faq')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'gap .2s' }}>
                Conocer más <ArrowRight size={16} />
              </button>
            </div>

            <div className="svc-card featured">
              <div className="svc-popular">Popular</div>
              <div className="svc-icon" style={{ background: 'rgba(255,255,255,.2)' }}>
                <Users size={26} color="#fff" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Habilidades Sociales</h3>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>Talleres grupales donde los niños aprenden a interactuar en un entorno seguro y estimulante.</p>
              <button onClick={() => scrollToSection('faq')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Conocer más <ArrowRight size={16} />
              </button>
            </div>

            <div className="svc-card">
              <div className="svc-icon" style={{ background: '#dcfce7' }}>
                <Calendar size={26} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Escuela para Padres</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>Capacitación constante para que las familias sean parte activa del progreso de sus hijos.</p>
              <button onClick={() => scrollToSection('faq')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Conocer más <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{ background: '#fff' }}>
        <div className="section-inner" style={{ maxWidth: 780 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-tag"><HelpCircle size={13} /> Preguntas Frecuentes</div>
            <h2 className="section-h2">Resolvemos tus dudas</h2>
          </div>

          {[
            { q: '¿A qué edad pueden empezar las terapias?', a: 'Atendemos niños desde los 1 año en adelante. La intervención temprana es clave para obtener mejores resultados. Nuestro equipo especializado adapta las sesiones según la edad y necesidades específicas de cada niño.' },
            { q: '¿Cómo puedo conocer el progreso de mi hijo?', a: 'Utilizamos una aplicación web exclusiva donde podrás ver reportes diarios, gráficos de avance y observaciones detalladas de cada sesión. Además, nuestra IA genera resúmenes semanales personalizados.' },
            { q: '¿Qué metodología utilizan?', a: 'Trabajamos con la metodología ABA (Applied Behavior Analysis), reconocida mundialmente como el enfoque más efectivo basado en evidencia científica para el tratamiento de la neurodivergencia.' },
            { q: '¿Qué es la terapia ABA y por qué la usamos?', a: 'Es el Análisis Conductual Aplicado, un método con respaldo científico que ayuda a mejorar conductas y facilitar el aprendizaje. Registramos cada pequeño avance bajo este modelo para medir el progreso real y adaptar objetivos semana a semana.' },
          ].map((faq, i) => (
            <div key={i} className={`faq-item ${activeAccordion === i ? 'open' : ''}`} onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}>
              <div className="faq-q">
                <h4>
                  <span style={{ width: 28, height: 28, background: '#ede9fe', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>{i + 1}</span>
                  {faq.q}
                </h4>
                <ChevronDown size={20} color="#9ca3af" style={{ transform: activeAccordion === i ? 'rotate(180deg)' : '', transition: 'transform .3s', flexShrink: 0 }} />
              </div>
              {activeAccordion === i && <div className="faq-a">{faq.a}</div>}
            </div>
          ))}

          <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 22, padding: '40px 36px', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>¿Aún tienes dudas?</h3>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, marginBottom: 24 }}>Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus preguntas.</p>
            <a href="https://wa.me/51924807183" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 28px', background: '#fff', color: '#4f46e5', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'transform .2s, box-shadow .2s', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
              <Phone size={18} /> Hablar con un especialista
            </a>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="ubicacion" className="map-section">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.4229091779425!2d-76.0288421240214!3d-13.692817174731204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91104331c0093305%3A0x21adbeb7d8eb168d!2sC.%20Victor%20Raul%20Haya%20de%20la%20Torre%2C%2011641!5e0!3m2!1ses-419!2spe!4v1770256602309!5m2!1ses-419!2spe"
          width="100%" height="100%" style={{ border: 0, position: 'absolute', inset: 0 }}
          allowFullScreen loading="lazy"
        />
        <div className="map-card">
          <h3 style={{ fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin color="#ef4444" size={22} /> Visítanos
          </h3>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Estamos en Independencia, Pisco. Un ambiente seguro y adaptado para el desarrollo de tus hijos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
              <Clock size={16} color="#4f46e5" /><span><strong>Lun - Vie:</strong> 8:00 AM - 6:00 PM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
              <Phone size={16} color="#16a34a" /><span>+51 924 807 183</span>
            </div>
          </div>
          <a href="https://maps.app.goo.gl/fv9HhtWj5R45a5paA" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            <MapPin size={18} /> Ver en Google Maps
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <Image src="/images/logo.png?v=2" alt="Logo" fill style={{ objectFit: 'contain' }} unoptimized />
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Jugando Aprendo</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Centro especializado en terapia y desarrollo infantil potenciado por IA.</p>
            <div>
              <a href="#" className="social-btn"><Facebook size={16} /></a>
              <a href="#" className="social-btn"><Instagram size={16} /></a>
            </div>
          </div>

          <div>
            <h4>Enlaces</h4>
            <ul>
              <li><a href="#ia-innovacion">Innovación IA</a></li>
              <li><a href="#servicios">Servicios</a></li>
              <li><a href="#nosotros">Nosotros</a></li>
              <li><a href="#faq">Preguntas</a></li>
            </ul>
          </div>

          <div>
            <h4>Contacto</h4>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Independencia, Pisco</p>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Ica - Perú</p>
            <p style={{ fontSize: 14 }}>tallerjugandoaprendoind@gmail.com</p>
          </div>

          <div>
            <h4>Horarios</h4>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Lun - Vie: 8AM - 6PM</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.25)' }}>Sábado: Cerrado</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.25)' }}>Domingo: Cerrado</p>
          </div>
        </div>
        <div className="footer-bottom">
          © 2025 Jugando Aprendo. Todos los derechos reservados.
        </div>
      </footer>
    </>
  )
}
