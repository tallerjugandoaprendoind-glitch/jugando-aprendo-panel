'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  Heart, Users, MapPin, CheckCircle, ArrowRight, HelpCircle,
  Brain, Calendar, Sparkles, LineChart, MessageSquareHeart,
  Star, Clock, Phone, Mail, Instagram, Facebook, ChevronDown,
  Quote, Play, Video, Image as ImageIcon,
  BookOpen, ClipboardList, Bell, Shield, ChevronLeft, ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [count50, setCount50] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true
        let n = 0
        const timer = setInterval(() => { n += 2; setCount50(n); if (n >= 50) clearInterval(timer) }, 40)
      }
    }, { threshold: 0.4 })
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveImg(p => (p + 1) % 4), 4000)
    return () => clearInterval(t)
  }, [])

  const whatsappMsg = encodeURIComponent('Hola, vi su página web y me interesa agendar una evaluación gratuita para mi hijo/a. ¿Me pueden dar más información?')
  const whatsappUrl = `https://wa.me/51924807183?text=${whatsappMsg}`

  const galleryImages = [
    { src: '/images/hero-image.jpg', alt: 'Sesión de terapia ABA', caption: 'Sesiones personalizadas de terapia ABA' },
    { src: '/images/hero-image.jpg', alt: 'Actividades grupales', caption: 'Talleres de habilidades sociales' },
    { src: '/images/hero-image.jpg', alt: 'Trabajo con familias', caption: 'Escuela para Padres' },
    { src: '/images/hero-image.jpg', alt: 'Evaluación inicial', caption: 'Evaluaciones especializadas' },
  ]

  const videos = [
    { thumb: '/images/hero-image.jpg', title: '¿Qué es la terapia ABA?', duration: '3:24' },
    { thumb: '/images/hero-image.jpg', title: 'Testimonio: Familia Rodríguez', duration: '2:10' },
    { thumb: '/images/hero-image.jpg', title: 'Cómo funciona nuestra plataforma', duration: '1:45' },
  ]

  const testimonials = [
    { name: 'María G.', desc: 'Mamá de Rodrigo, 6 años · TEA Nivel 2', avatar: 'M', color: '#4f46e5', text: 'En 3 meses mi hijo empezó a comunicarse con frases completas. Los reportes con IA nos ayudan a entender su progreso sin tecnicismos. ¡Los recomiendo al 100%!' },
    { name: 'Carlos R.', desc: 'Papá de Valentina, 4 años · TDAH', avatar: 'C', color: '#16a34a', text: 'Lo que más me sorprendió fue poder seguir el avance semana a semana desde mi celular. El asistente IA nos da consejos para trabajar en casa. Valentina ha mejorado muchísimo.' },
    { name: 'Rosa T.', desc: 'Mamá de Mateo, 5 años · TEA Nivel 1', avatar: 'R', color: '#dc2626', text: 'Al principio tenía miedo de no entender los términos clínicos. La terapeuta y el sistema de reportes lo explican todo de manera muy sencilla. Me siento acompañada.' },
  ]

  const parentBenefits = [
    { icon: <ClipboardList size={22} color="#4f46e5" />, bg: '#ede9fe', title: 'Reportes diarios', desc: 'Recibe un resumen claro de cada sesión con logros y observaciones del terapeuta.' },
    { icon: <LineChart size={22} color="#0891b2" />, bg: '#e0f2fe', title: 'Gráficos de progreso', desc: 'Visualiza la evolución de tu hijo semana a semana en habilidades sociales y conducta.' },
    { icon: <MessageSquareHeart size={22} color="#16a34a" />, bg: '#dcfce7', title: 'Chat con especialistas', desc: 'Comunícate directamente con el equipo terapéutico desde la app. Siempre hay respuesta.' },
    { icon: <Brain size={22} color="#7c3aed" />, bg: '#f3e8ff', title: 'Asistente IA 24/7', desc: 'Nuestro robot inteligente analiza los datos de tu hijo y te da sugerencias para el hogar.' },
    { icon: <Calendar size={22} color="#ea580c" />, bg: '#fff7ed', title: 'Agenda de citas', desc: 'Consulta, reserva y confirma sesiones en un solo lugar, sin llamadas ni confusiones.' },
    { icon: <BookOpen size={22} color="#0e7490" />, bg: '#ecfeff', title: 'Biblioteca de recursos', desc: 'Accede a guías, videos y actividades ABA para reforzar el aprendizaje en casa.' },
    { icon: <Bell size={22} color="#f59e0b" />, bg: '#fffbeb', title: 'Notificaciones', desc: 'Alertas de progreso, recordatorios de citas y mensajes del equipo en tiempo real.' },
    { icon: <Shield size={22} color="#16a34a" />, bg: '#f0fdf4', title: 'Datos protegidos', desc: 'La información de tu hijo está 100% segura con estándares clínicos de privacidad.' },
  ]

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Nunito', sans-serif; background: #fff; color: #1a1a2e; overflow-x: hidden; }

        .nav-bar { position: sticky; top: 0; z-index: 100; transition: all .3s; border-bottom: 1px solid transparent; }
        .nav-bar.scrolled { background: rgba(255,255,255,.96); backdrop-filter: blur(16px); border-color: #f1f0ff; box-shadow: 0 4px 24px rgba(79,70,229,.06); }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 70px; display: flex; align-items: center; justify-content: space-between; }
        .nav-links { display: none; gap: 28px; }
        @media(min-width:768px){ .nav-links { display: flex; } }
        .nav-links a { font-size: 14px; font-weight: 700; color: #4b5563; text-decoration: none; transition: color .2s; }
        .nav-links a:hover { color: #4f46e5; }
        .nav-cta-outline { padding: 9px 22px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-weight: 700; color: #374151; text-decoration: none; transition: all .2s; }
        .nav-cta-outline:hover { border-color: #4f46e5; color: #4f46e5; }
        .nav-cta-fill { padding: 9px 22px; background: #4f46e5; border-radius: 10px; font-size: 14px; font-weight: 700; color: #fff; text-decoration: none; transition: all .2s; }
        .nav-cta-fill:hover { background: #4338ca; transform: translateY(-1px); }

        .hero { min-height: 90vh; display: flex; align-items: center; background: linear-gradient(160deg, #f0efff 0%, #fff 55%, #f0fdf4 100%); position: relative; overflow: hidden; padding: 80px 24px 60px; }
        .hero-grid { position: absolute; inset: 0; z-index: 0; background-image: radial-gradient(circle, rgba(79,70,229,.05) 1px, transparent 1px); background-size: 36px 36px; }
        .hero-blob-1 { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(79,70,229,.1) 0%, transparent 70%); top: -150px; right: -80px; border-radius: 50%; }
        .hero-blob-2 { position: absolute; width: 350px; height: 350px; background: radial-gradient(circle, rgba(168,85,247,.07) 0%, transparent 70%); bottom: -80px; left: -80px; border-radius: 50%; }
        .hero-inner { max-width: 1200px; margin: 0 auto; width: 100%; display: grid; gap: 60px; position: relative; z-index: 1; align-items: center; }
        @media(min-width:900px){ .hero-inner { grid-template-columns: 1fr 1fr; } }
        .hero-tag { display: inline-flex; align-items: center; gap: 8px; background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 99px; padding: 7px 16px; font-size: 12px; font-weight: 800; color: #7c3aed; margin-bottom: 20px; animation: fadeUp .6s ease both; }
        .hero-h1 { font-family: 'DM Serif Display', serif; font-size: clamp(38px, 5vw, 62px); line-height: 1.1; color: #111827; margin-bottom: 20px; animation: fadeUp .6s .1s ease both; }
        .hero-h1 em { font-style: italic; color: #4f46e5; }
        .hero-p { font-size: 17px; color: #6b7280; line-height: 1.8; margin-bottom: 36px; max-width: 480px; animation: fadeUp .6s .2s ease both; }
        .hero-btns { display: flex; flex-wrap: wrap; gap: 14px; animation: fadeUp .6s .3s ease both; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; transition: all .25s; box-shadow: 0 6px 20px rgba(79,70,229,.28); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(79,70,229,.38); }
        .btn-green { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: #25d366; color: #fff; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; transition: all .25s; }
        .btn-green:hover { transform: translateY(-2px); }
        .btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; border: 2px solid #e5e7eb; color: #374151; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; background: #fff; transition: all .25s; cursor: pointer; font-family: inherit; }
        .btn-outline:hover { border-color: #4f46e5; color: #4f46e5; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .stats-strip { background: linear-gradient(135deg, #1e1b4b, #4f46e5); padding: 52px 24px; }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(2,1fr); gap: 32px; }
        @media(min-width:640px){ .stats-inner { grid-template-columns: repeat(4,1fr); } }
        .stat-item { text-align: center; }
        .stat-num { font-family: 'DM Serif Display', serif; font-size: 46px; color: #fff; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-size: 12px; color: rgba(255,255,255,.55); font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }

        .section { padding: 96px 24px; }
        .section-inner { max-width: 1200px; margin: 0 auto; }
        .section-tag { display: inline-flex; align-items: center; gap: 7px; background: #ede9fe; color: #7c3aed; border-radius: 99px; padding: 5px 14px; font-size: 12px; font-weight: 800; margin-bottom: 16px; }
        .section-h2 { font-family: 'DM Serif Display', serif; font-size: clamp(30px, 4vw, 46px); color: #111827; line-height: 1.15; margin-bottom: 16px; }
        .section-p { font-size: 17px; color: #6b7280; line-height: 1.8; max-width: 600px; }

        .benefits-grid { display: grid; gap: 20px; }
        @media(min-width:600px){ .benefits-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:960px){ .benefits-grid { grid-template-columns: repeat(4,1fr); } }
        .benefit-card { background: #fff; border: 2px solid #f3f4f6; border-radius: 20px; padding: 28px 24px; transition: all .3s; }
        .benefit-card:hover { border-color: #e0e7ff; box-shadow: 0 16px 48px rgba(79,70,229,.08); transform: translateY(-3px); }
        .benefit-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .benefit-card h4 { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 8px; }
        .benefit-card p { font-size: 13px; color: #6b7280; line-height: 1.7; }

        .testi-card { background: #fff; border-radius: 22px; padding: 32px; border: 2px solid #f3f4f6; transition: all .3s; }
        .testi-card:hover { border-color: #e0e7ff; box-shadow: 0 20px 60px rgba(79,70,229,.08); transform: translateY(-4px); }

        .ia-section { background: linear-gradient(160deg, #0f0c29 0%, #1e1b4b 50%, #162040 100%); padding: 100px 24px; position: relative; overflow: hidden; }
        .ia-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px); background-size: 48px 48px; }
        .ia-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }

        .robot-wrap { display: flex; justify-content: center; margin-bottom: 64px; }
        .robot { position: relative; width: 180px; }
        @keyframes robotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .robot-body { animation: robotFloat 4s ease-in-out infinite; }
        .robot-head { width: 120px; height: 90px; background: linear-gradient(145deg, #818cf8, #4f46e5); border-radius: 24px; margin: 0 auto 4px; position: relative; box-shadow: 0 0 40px rgba(129,140,248,.4); display: flex; align-items: center; justify-content: center; gap: 18px; }
        .robot-eye { width: 22px; height: 22px; background: #fff; border-radius: 50%; position: relative; animation: blink 4s ease-in-out infinite; }
        .robot-eye::after { content:''; position:absolute; width:10px; height:10px; background:#1e1b4b; border-radius:50%; top:6px; left:6px; }
        @keyframes blink { 0%,95%,100%{transform:scaleY(1)} 97%{transform:scaleY(0.05)} }
        .robot-antenna { width: 4px; height: 24px; background: #818cf8; border-radius: 99px; position: absolute; top: -22px; left: 50%; transform: translateX(-50%); }
        .robot-antenna::after { content:''; position:absolute; width:12px;height:12px; background:#c084fc; border-radius:50%; top:-8px;left:-4px; box-shadow:0 0 12px rgba(192,132,252,.7); }
        .robot-torso { width: 140px; height: 80px; background: linear-gradient(145deg, #4f46e5, #3730a3); border-radius: 20px; margin: 0 auto; position: relative; display: flex; align-items: center; justify-content: center; }
        .robot-screen { width: 90px; height: 50px; background: rgba(0,0,0,.4); border-radius: 10px; border: 1px solid rgba(129,140,248,.4); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
        .scan { width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #6ee7b7, transparent); animation: scanLine 2s linear infinite; }
        .robot-arm-l,.robot-arm-r { width: 22px; height: 60px; background: linear-gradient(145deg, #4f46e5, #3730a3); border-radius: 10px; position: absolute; top: 8px; }
        .robot-arm-l { left: -28px; transform: rotate(15deg); }
        .robot-arm-r { right: -28px; transform: rotate(-15deg); }
        .robot-legs { display: flex; justify-content: center; gap: 20px; margin-top: 4px; }
        .robot-leg { width: 28px; height: 36px; background: linear-gradient(145deg, #4f46e5, #3730a3); border-radius: 0 0 12px 12px; }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        .robot-glow { position: absolute; width: 200px; height: 200px; border-radius: 50%; background: rgba(129,140,248,.08); top: 50%; left: 50%; transform: translate(-50%,-50%); animation: pulse-ring 3s ease-out infinite; }

        .ia-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); backdrop-filter: blur(10px); border-radius: 22px; padding: 32px; transition: all .3s; }
        .ia-card:hover { background: rgba(255,255,255,.09); transform: translateY(-4px); }
        .ia-card-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .ia-card h4 { color: #fff; font-weight: 800; font-size: 17px; margin-bottom: 10px; }
        .ia-card p { color: rgba(255,255,255,.5); font-size: 13px; line-height: 1.75; }

        .gallery-main { position: relative; border-radius: 24px; overflow: hidden; aspect-ratio: 16/9; cursor: pointer; }
        .gallery-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,.7)); padding: 24px; color: #fff; font-weight: 700; font-size: 15px; }
        .gallery-thumbs { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 16px; }
        .gallery-thumb { border-radius: 14px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all .2s; aspect-ratio: 4/3; position: relative; }
        .gallery-thumb.active { border-color: #4f46e5; }

        .video-card { background: #fff; border: 2px solid #f3f4f6; border-radius: 20px; overflow: hidden; transition: all .3s; cursor: pointer; }
        .video-card:hover { border-color: #e0e7ff; box-shadow: 0 16px 48px rgba(79,70,229,.1); transform: translateY(-3px); }
        .video-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #1e1b4b; }
        .video-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); transition: background .2s; }
        .video-card:hover .video-play { background: rgba(79,70,229,.45); }
        .play-btn { width: 52px; height: 52px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
        .video-duration { position: absolute; bottom: 10px; right: 12px; background: rgba(0,0,0,.7); color: #fff; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
        .video-info { padding: 20px; }
        .video-info h4 { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 6px; }

        .svc-card { background: #fff; border-radius: 22px; padding: 36px; border: 2px solid #f3f4f6; transition: all .3s; position: relative; overflow: hidden; }
        .svc-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #4f46e5, #7c3aed); transform: scaleX(0); transform-origin: left; transition: transform .3s; }
        .svc-card:hover::before { transform: scaleX(1); }
        .svc-card:hover { border-color: #e0e7ff; box-shadow: 0 20px 60px rgba(79,70,229,.1); transform: translateY(-4px); }
        .svc-card.featured { background: linear-gradient(150deg, #4f46e5, #7c3aed); border-color: transparent; }
        .svc-card.featured::before { display: none; }
        .svc-popular { position: absolute; top: 20px; right: 20px; background: #fbbf24; color: #1a1a2e; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; }

        .team-card { background: #fff; border-radius: 22px; padding: 32px; border: 2px solid #f3f4f6; text-align: center; transition: all .3s; }
        .team-card:hover { border-color: #e0e7ff; box-shadow: 0 20px 60px rgba(79,70,229,.08); transform: translateY(-4px); }
        .team-avatar { width: 80px; height: 80px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 28px; color: #fff; margin: 0 auto 16px; }

        .faq-item { border: 2px solid #f3f4f6; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all .2s; margin-bottom: 12px; background: #fff; }
        .faq-item:hover { border-color: #e0e7ff; }
        .faq-item.open { border-color: #c7d2fe; }
        .faq-q { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; }
        .faq-q h4 { font-size: 15px; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 12px; }
        .faq-a { padding: 0 24px 22px; font-size: 14px; color: #6b7280; line-height: 1.8; }

        .map-section { position: relative; height: 520px; }
        .map-card { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 32px; border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.15); max-width: 380px; width: calc(100% - 48px); }
        @media(min-width:768px){ .map-card { left: 64px; transform: translateY(-50%); } }

        .footer { background: #0f0c29; color: rgba(255,255,255,.45); padding: 72px 24px 32px; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; gap: 40px; margin-bottom: 48px; }
        @media(min-width:768px){ .footer-inner { grid-template-columns: 2fr 1fr 1fr 1fr; } }
        .footer h4 { color: #fff; font-weight: 800; font-size: 14px; margin-bottom: 18px; }
        .footer ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer ul li a { color: rgba(255,255,255,.45); text-decoration: none; font-size: 14px; transition: color .2s; }
        .footer ul li a:hover { color: #fff; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,.06); padding-top: 24px; text-align: center; font-size: 13px; }
        .social-btn { width: 38px; height: 38px; background: rgba(255,255,255,.07); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: rgba(255,255,255,.5); transition: all .2s; text-decoration: none; margin-right: 8px; }
        .social-btn:hover { background: #4f46e5; color: #fff; }

        @keyframes waBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .wa-btn { position: fixed; bottom: 24px; right: 24px; z-index: 999; width: 60px; height: 60px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(37,211,102,.4); animation: waBounce 3s ease-in-out infinite; text-decoration: none; }
        .wa-btn:hover { transform: scale(1.1); }
        .wa-ping { position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; background: #ef4444; border-radius: 50%; }
        .wa-ping::before { content: ''; position: absolute; inset: 0; background: #ef4444; border-radius: 50%; animation: ping 1.5s cubic-bezier(0,0,.2,1) infinite; }
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }

        .grid-3 { display: grid; gap: 24px; }
        @media(min-width:640px){ .grid-3 { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:900px){ .grid-3 { grid-template-columns: repeat(3,1fr); } }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalBusiness", "name": "Jugando Aprendo", "telephone": "+51924807183", "address": { "@type": "PostalAddress", "addressLocality": "Pisco", "addressRegion": "Ica", "addressCountry": "PE" } }) }} />

      {/* WA FLOAT */}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="wa-btn" aria-label="WhatsApp">
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
              <p style={{ fontWeight: 900, fontSize: 16, color: '#111827', lineHeight: 1.1 }}>Jugando Aprendo</p>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Centro de Desarrollo Infantil · Pisco</p>
            </div>
          </div>
          <div className="nav-links">
            <a href="#para-padres">Para Padres</a>
            <a href="#ia-innovacion">Asistente IA</a>
            <a href="#servicios">Servicios</a>
            <a href="#galeria">Galería</a>
            <a href="#faq">Preguntas</a>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/login" className="nav-cta-outline">Ingresar</Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="nav-cta-fill">Evaluar gratis</a>
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
              <Heart size={13} style={{ fill: 'currentColor' }} /> Terapia · Tecnología · Amor
            </div>
            <h1 className="hero-h1">
              Impulsando el potencial de<br/><em>mentes brillantes.</em>
            </h1>
            <p className="hero-p">
              Centro especializado en neurodivergencia en Pisco. Combinamos terapia ABA basada en evidencia, seguimiento digital en tiempo real y la calidez de nuestro equipo.
            </p>
            <div className="hero-btns">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-green">
                <Phone size={17} /> Agenda tu evaluación gratuita
              </a>
              <button className="btn-outline" onClick={() => document.getElementById('para-padres')?.scrollIntoView({ behavior: 'smooth' })}>
                <Sparkles size={17} color="#7c3aed" /> ¿Qué ofrecemos?
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 36 }}>
              {[
                { bg: '#dcfce7', icon: <CheckCircle size={17} color="#16a34a" />, label: 'Metodología ABA' },
                { bg: '#dbeafe', icon: <Star size={17} color="#2563eb" fill="#2563eb" />, label: '+50 Familias' },
                { bg: '#f3e8ff', icon: <Brain size={17} color="#9333ea" />, label: 'IA Incluida' },
              ].map(({ bg, icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 36, height: 36, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', animation: 'fadeUp .7s .2s ease both' }}>
            <div
              style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.14)', aspectRatio: '4/3', position: 'relative', border: '4px solid #fff', transform: 'rotate(1.5deg)', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(1.5deg)')}
            >
              <Image src="/images/hero-image.jpg?v=2" alt="Niños en terapia ABA" fill style={{ objectFit: 'cover' }} priority unoptimized />
            </div>
            <div style={{ position: 'absolute', top: 20, left: -20, background: '#fff', borderRadius: 14, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13, color: '#1e1b4b' }}>
              <div style={{ width: 32, height: 32, background: '#dbeafe', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={16} color="#2563eb" /></div>
              Metodología ABA
            </div>
            <div style={{ position: 'absolute', bottom: 20, right: -20, background: '#fff', borderRadius: 14, padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 13, color: '#065f46' }}>
              <CheckCircle size={20} color="#16a34a" /> 100% Personalizado
            </div>
          </div>
        </div>
      </header>

      {/* STATS */}
      <div className="stats-strip" ref={statsRef}>
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

      {/* PARA PADRES */}
      <section id="para-padres" className="section" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag"><Heart size={13} /> Para las familias</div>
            <h2 className="section-h2">Todo lo que brindamos<br/>a los padres</h2>
            <p className="section-p" style={{ margin: '0 auto' }}>
              Sabemos que acompañar a tu hijo es un camino compartido. Por eso diseñamos herramientas digitales y humanas para que estés siempre informado, empoderado y parte activa del proceso.
            </p>
          </div>
          <div className="benefits-grid">
            {parentBenefits.map(({ icon, bg, title, desc }) => (
              <div key={title} className="benefit-card">
                <div className="benefit-icon" style={{ background: bg }}>{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link href="/login?mode=signup" className="btn-primary" style={{ display: 'inline-flex' }}>
              Accede a la plataforma de padres <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ background: '#f9f8ff', padding: '96px 24px' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag"><Quote size={13} /> Familias reales</div>
            <h2 className="section-h2">Resultados que<br/>hablan por sí solos</h2>
          </div>
          <div className="grid-3">
            {testimonials.map(({ name, desc, avatar, color, text }) => (
              <div key={name} className="testi-card">
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.8, marginBottom: 24, fontStyle: 'italic' }}>&ldquo;{text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff' }}>{avatar}</div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{name}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex' }}>
              Quiero resultados así para mi hijo/a <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* IA + ROBOT */}
      <section id="ia-innovacion" className="ia-section">
        <div className="ia-grid-bg" />
        <div className="ia-inner">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.3)', color: '#c4b5fd', borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 800, marginBottom: 20 }}>
              <Sparkles size={14} /> Tecnología al servicio del desarrollo
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px,4vw,46px)', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              Tu copiloto inteligente:<br/><span style={{ color: '#818cf8' }}>IA con datos reales</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 16, lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
              No estás solo entre sesiones. Nuestro asistente virtual aprende exclusivamente de los registros clínicos diarios de tu hijo.
            </p>
          </div>

          {/* ROBOT */}
          <div className="robot-wrap">
            <div className="robot">
              <div className="robot-glow" />
              <div className="robot-body">
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <div className="robot-antenna" />
                  <div className="robot-head">
                    <div className="robot-eye" />
                    <div className="robot-eye" />
                  </div>
                </div>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <div className="robot-arm-l" />
                  <div className="robot-torso">
                    <div className="robot-screen"><div className="scan" /></div>
                  </div>
                  <div className="robot-arm-r" />
                </div>
                <div className="robot-legs">
                  <div className="robot-leg" />
                  <div className="robot-leg" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid-3">
            {[
              { icon: <LineChart size={24} color="#818cf8" />, bg: 'rgba(129,140,248,.15)', title: 'Seguimiento Preciso', desc: 'La IA analiza tendencias conductuales sesión a sesión, detectando patrones invisibles al ojo humano.' },
              { icon: <MessageSquareHeart size={24} color="#c084fc" />, bg: 'rgba(192,132,252,.15)', title: 'Apoyo para Padres 24/7', desc: 'Resúmenes en lenguaje sencillo y recomendaciones personalizadas para reforzar el aprendizaje en casa.' },
              { icon: <Brain size={24} color="#6ee7b7" />, bg: 'rgba(110,231,183,.15)', title: 'Progreso Visible', desc: 'Gráficos interactivos que muestran la evolución en tiempo real con cada sesión registrada.' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="ia-card">
                <div className="ia-card-icon" style={{ background: bg }}>{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link href="/login?mode=signup" className="btn-primary" style={{ display: 'inline-flex', background: 'linear-gradient(135deg,#818cf8,#c084fc)' }}>
              Accede a la plataforma <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* GALERÍA DE IMÁGENES */}
      <section id="galeria" className="section" style={{ background: '#f9f8ff' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-tag"><ImageIcon size={13} /> Galería de fotos</div>
            <h2 className="section-h2">Nuestro centro<br/>en imágenes</h2>
            <p className="section-p" style={{ margin: '0 auto' }}>
              Conoce el ambiente seguro, cálido y estimulante donde los niños aprenden y crecen cada día.
            </p>
          </div>

          <div className="gallery-main">
            <Image src={galleryImages[activeImg].src} alt={galleryImages[activeImg].alt} fill style={{ objectFit: 'cover' }} unoptimized />
            <div className="gallery-caption">{galleryImages[activeImg].caption}</div>
            <button onClick={() => setActiveImg((activeImg - 1 + 4) % 4)}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft size={20} color="#111827" />
            </button>
            <button onClick={() => setActiveImg((activeImg + 1) % 4)}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.9)', border: 'none', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronRight size={20} color="#111827" />
            </button>
          </div>
          <div className="gallery-thumbs">
            {galleryImages.map((img, i) => (
              <div key={i} className={`gallery-thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                <Image src={img.src} alt={img.alt} fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA DE VIDEOS */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-tag"><Video size={13} /> Videos</div>
            <h2 className="section-h2">Conoce cómo<br/>trabajamos</h2>
            <p className="section-p" style={{ margin: '0 auto' }}>
              Mira de cerca nuestros métodos, conoce familias reales y entiende cómo la tecnología potencia el desarrollo de cada niño.
            </p>
          </div>

          <div className="grid-3">
            {videos.map((v, i) => (
              <a key={i} href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="video-card" style={{ textDecoration: 'none' }}>
                <div className="video-thumb">
                  <Image src={v.thumb} alt={v.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  <div className="video-play">
                    <div className="play-btn">
                      <Play size={20} color="#4f46e5" fill="#4f46e5" />
                    </div>
                  </div>
                  <div className="video-duration">{v.duration}</div>
                </div>
                <div className="video-info">
                  <h4>{v.title}</h4>
                  <p style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}><Play size={12} color="#9ca3af" /> Ver video</p>
                </div>
              </a>
            ))}
          </div>

          <div style={{ marginTop: 40, background: '#f9f8ff', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, border: '2px solid #ede9fe' }}>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: 17, color: '#111827', marginBottom: 4 }}>¿Quieres ver más contenido?</h4>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Síguenos en redes para ver actividades, consejos y novedades del centro.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                <Facebook size={16} /> Facebook
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                <Instagram size={16} /> Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="section" style={{ background: '#f9f8ff' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag"><Star size={13} /> Nuestros Servicios</div>
            <h2 className="section-h2">Soluciones integrales<br/>para el desarrollo</h2>
          </div>
          <div className="grid-3">
            <div className="svc-card">
              <div style={{ width: 56, height: 56, background: '#dbeafe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Brain size={26} color="#2563eb" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Terapia ABA</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>Intervención basada en evidencia para mejorar habilidades sociales, comunicación y aprendizaje adaptativo.</p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Agendar evaluación <ArrowRight size={16} /></a>
            </div>
            <div className="svc-card featured">
              <div className="svc-popular">Popular</div>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Users size={26} color="#fff" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#fff' }}>Habilidades Sociales</h3>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>Talleres grupales donde los niños aprenden a interactuar en un entorno seguro, lúdico y estimulante.</p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Agendar evaluación <ArrowRight size={16} /></a>
            </div>
            <div className="svc-card">
              <div style={{ width: 56, height: 56, background: '#dcfce7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Calendar size={26} color="#16a34a" /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Escuela para Padres</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>Capacitación constante para que las familias sean parte activa del proceso de desarrollo de sus hijos.</p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Más información <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag"><Heart size={13} /> Nuestro Equipo</div>
            <h2 className="section-h2">Profesionales que<br/>aman lo que hacen</h2>
          </div>
          <div className="grid-3">
            {[
              { initial: 'S', color: 'linear-gradient(135deg,#4f46e5,#7c3aed)', name: 'Terapeuta Principal', role: 'Especialista en Análisis Conductual Aplicado (ABA)', spec: 'Autismo · TDAH · TEA' },
              { initial: 'A', color: 'linear-gradient(135deg,#0891b2,#0e7490)', name: 'Psicóloga Clínica', role: 'Evaluación y diagnóstico neuropsicológico infantil', spec: 'Evaluaciones · Reportes · Familias' },
              { initial: 'M', color: 'linear-gradient(135deg,#059669,#047857)', name: 'Coordinadora', role: 'Gestión de casos y seguimiento familiar', spec: 'Comunicación · Agenda · Soporte' },
            ].map(({ initial, color, name, role, spec }) => (
              <div key={name} className="team-card">
                <div className="team-avatar" style={{ background: color }}>{initial}</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 6 }}>{name}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 12 }}>{role}</p>
                <div style={{ display: 'inline-block', background: '#ede9fe', color: '#7c3aed', borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>{spec}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{ background: '#f9f8ff' }}>
        <div className="section-inner" style={{ maxWidth: 780 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-tag"><HelpCircle size={13} /> Preguntas Frecuentes</div>
            <h2 className="section-h2">Resolvemos tus dudas</h2>
          </div>
          {[
            { q: '¿A qué edad pueden empezar las terapias?', a: 'Atendemos niños desde los 1 año en adelante. La intervención temprana es clave. Nuestro equipo adapta las sesiones según la edad y necesidades de cada niño.' },
            { q: '¿Cómo es el proceso para empezar? ¿Hay evaluación gratuita?', a: 'Sí. El primer paso es una evaluación gratuita donde conocemos a tu hijo y familia. Luego diseñamos un plan personalizado. Contáctanos por WhatsApp.' },
            { q: '¿Cómo puedo conocer el progreso de mi hijo?', a: 'A través de nuestra plataforma web verás reportes diarios, gráficos de avance y observaciones de cada sesión. El asistente IA genera resúmenes semanales en lenguaje sencillo.' },
            { q: '¿Qué metodología utilizan?', a: 'Trabajamos con la metodología ABA (Applied Behavior Analysis), reconocida como el enfoque más efectivo con respaldo científico para la neurodivergencia.' },
            { q: '¿Qué es la terapia ABA y por qué la usamos?', a: 'Es el Análisis Conductual Aplicado, un método que ayuda a mejorar conductas y facilitar el aprendizaje. Registramos cada avance para medir el progreso real y adaptar objetivos semana a semana.' },
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

          <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 22, padding: '40px 36px', textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>¿Listo para dar el primer paso?</h3>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, marginBottom: 24 }}>Agenda hoy tu evaluación gratuita. Sin compromiso, con mucho amor.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 28px', background: '#fff', color: '#16a34a', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
              <Phone size={18} /> Hablar con un especialista
            </a>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="ubicacion" className="map-section">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.4229091779425!2d-76.0288421240214!3d-13.692817174731204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91104331c0093305%3A0x21adbeb7d8eb168d!2sC.%20Victor%20Raul%20Haya%20de%20la%20Torre%2C%2011641!5e0!3m2!1ses-419!2spe!4v1770256602309!5m2!1ses-419!2spe"
          width="100%" height="100%" style={{ border: 0, position: 'absolute', inset: 0 }} allowFullScreen loading="lazy" title="Ubicación" />
        <div className="map-card">
          <h3 style={{ fontWeight: 800, fontSize: 22, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin color="#ef4444" size={22} /> Visítanos
          </h3>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Estamos en Independencia, Pisco. Un ambiente seguro y adaptado para el desarrollo de tus hijos.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}><Clock size={16} color="#4f46e5" /><span><strong>Lun - Vie:</strong> 8:00 AM - 6:00 PM</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}><Phone size={16} color="#16a34a" /><span>+51 924 807 183</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}><Mail size={16} color="#f59e0b" /><span>tallerjugandoaprendoind@gmail.com</span></div>
          </div>
          <a href="https://maps.app.goo.gl/fv9HhtWj5R45a5paA" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
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
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>Jugando Aprendo</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Centro especializado en terapia ABA y desarrollo infantil potenciado por IA. Pisco, Ica, Perú.</p>
            <div>
              <a href="https://www.facebook.com" className="social-btn" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="https://www.instagram.com" className="social-btn" aria-label="Instagram"><Instagram size={16} /></a>
            </div>
          </div>
          <div>
            <h4>Servicios</h4>
            <ul>
              <li><a href={whatsappUrl}>Terapia ABA</a></li>
              <li><a href={whatsappUrl}>Habilidades Sociales</a></li>
              <li><a href={whatsappUrl}>Escuela para Padres</a></li>
              <li><a href={whatsappUrl}>Evaluación Gratuita</a></li>
            </ul>
          </div>
          <div>
            <h4>Plataforma</h4>
            <ul>
              <li><a href="/login">Ingresar</a></li>
              <li><a href="/login?mode=signup">Registrarse</a></li>
              <li><a href="#para-padres">Para Padres</a></li>
              <li><a href="#ia-innovacion">Asistente IA</a></li>
            </ul>
          </div>
          <div>
            <h4>Horarios</h4>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Lun - Vie: 8AM - 6PM</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.25)', marginBottom: 4 }}>Sábado: Cerrado</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.25)', marginBottom: 16 }}>Domingo: Cerrado</p>
            <p style={{ fontSize: 13 }}>Independencia, Pisco, Ica</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>tallerjugandoaprendoind@gmail.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          © 2025 Jugando Aprendo — Centro de Desarrollo Infantil · Pisco, Ica, Perú. Todos los derechos reservados.
        </div>
      </footer>
    </>
  )
}
