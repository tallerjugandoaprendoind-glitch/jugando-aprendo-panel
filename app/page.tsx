'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import {
  Heart, Users, MapPin, CheckCircle, ArrowRight, HelpCircle,
  Brain, Calendar, Sparkles, LineChart, MessageSquareHeart,
  Star, Clock, Phone, Mail, Instagram, Facebook, ChevronDown,
  Quote, Play, Video, Image as ImageIcon,
  BookOpen, ClipboardList, Bell, Shield, ChevronLeft, ChevronRight, X, Zap
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
//  EDITA TUS VIDEOS AQUÍ — soporta YouTube, TikTok, Drive, Vimeo
// ═══════════════════════════════════════════════════════════════
const VIDEOS = [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: '¿Qué es la terapia ABA?',
    desc: 'Conoce la metodología que usamos en cada sesión',
  },
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Testimonio: Familia Rodríguez',
    desc: 'Una mamá comparte su experiencia con nosotros',
  },
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Cómo funciona nuestra plataforma',
    desc: 'Tour rápido por la app para padres',
  },
]
// ═══════════════════════════════════════════════════════════════

function detectPlatform(url: string): 'youtube' | 'tiktok' | 'drive' | 'vimeo' | 'other' {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube') || u.hostname === 'youtu.be') return 'youtube'
    if (u.hostname.includes('tiktok')) return 'tiktok'
    if (u.hostname.includes('drive.google')) return 'drive'
    if (u.hostname.includes('vimeo')) return 'vimeo'
  } catch {}
  return 'other'
}

function getEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    const platform = detectPlatform(url)
    if (platform === 'youtube') {
      let id = ''
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
      else if (u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1].split('/')[0]
      else id = u.searchParams.get('v') || ''
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    }
    if (platform === 'tiktok') {
      // TikTok URL: tiktok.com/@user/video/12345 or vm.tiktok.com/ABC
      const match = u.pathname.match(/\/video\/(\d+)/)
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
      return url
    }
    if (platform === 'drive') {
      // drive.google.com/file/d/ID/view → /preview
      const match = u.pathname.match(/\/d\/([^/]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
      return url
    }
    if (platform === 'vimeo') {
      const id = u.pathname.replace('/', '').split('/')[0]
      return `https://player.vimeo.com/video/${id}?autoplay=1`
    }
  } catch {}
  return url
}

function getThumbUrl(url: string): string {
  try {
    const platform = detectPlatform(url)
    const u = new URL(url)
    if (platform === 'youtube') {
      let id = ''
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
      else if (u.pathname.includes('/shorts/')) id = u.pathname.split('/shorts/')[1].split('/')[0]
      else id = u.searchParams.get('v') || ''
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }
  } catch {}
  return '/images/hero-image.jpg'
}

function getPlatformLabel(url: string) {
  const p = detectPlatform(url)
  const labels: Record<string, { label: string; color: string }> = {
    youtube: { label: 'YouTube', color: '#ff0000' },
    tiktok:  { label: 'TikTok',  color: '#010101' },
    drive:   { label: 'Drive',   color: '#1a73e8' },
    vimeo:   { label: 'Vimeo',   color: '#1ab7ea' },
    other:   { label: 'Video',   color: '#6b7280' },
  }
  return labels[p]
}

// ── Robot ARIA animado ───────────────────────────────────────────────────────
function ARIARobot() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Glow halo */}
      <div style={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,.25) 0%, transparent 70%)',
        animation: 'ariaPulse 3s ease-in-out infinite',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      }} />

      <div style={{ animation: 'ariaFloat 4s ease-in-out infinite', position: 'relative' }}>
        {/* ── Antena ── */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 2 }}>
          <div style={{ width: 5, height: 28, background: 'linear-gradient(to top,#fbbf24,#f59e0b)', borderRadius: 99, margin: '0 auto' }} />
          <div style={{
            position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
            width: 18, height: 18, borderRadius: '50%',
            background: 'radial-gradient(circle, #fff 30%, #fbbf24 100%)',
            boxShadow: '0 0 14px 6px rgba(251,191,36,.9), 0 0 30px 10px rgba(251,191,36,.4)',
            animation: 'ariaAntenna 1.8s ease-in-out infinite',
          }} />
        </div>

        {/* ── Cabeza ── */}
        <div style={{
          width: 130, height: 100, margin: '0 auto',
          background: 'linear-gradient(145deg, #fde68a, #fbbf24, #f59e0b)',
          borderRadius: '28px 28px 22px 22px',
          boxShadow: '0 0 40px rgba(251,191,36,.6), 0 12px 30px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.4)',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 18,
        }}>
          {/* Oídos */}
          <div style={{ position: 'absolute', left: -14, top: 24, width: 16, height: 32, background: 'linear-gradient(145deg,#f59e0b,#d97706)', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,.3)' }} />
          <div style={{ position: 'absolute', right: -14, top: 24, width: 16, height: 32, background: 'linear-gradient(145deg,#f59e0b,#d97706)', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,.3)' }} />
          {/* Ojos */}
          <div style={{ width: 28, height: 28, background: '#fff', borderRadius: '50%', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,.3), inset 0 2px 4px rgba(0,0,0,.1)', animation: 'ariaBlink 5s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', width: 14, height: 14, background: '#1e1b4b', borderRadius: '50%', top: 7, left: 7 }}>
              <div style={{ position: 'absolute', width: 5, height: 5, background: '#fff', borderRadius: '50%', top: 2, left: 2 }} />
            </div>
          </div>
          <div style={{ width: 28, height: 28, background: '#fff', borderRadius: '50%', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,.3), inset 0 2px 4px rgba(0,0,0,.1)', animation: 'ariaBlink 5s ease-in-out infinite .2s' }}>
            <div style={{ position: 'absolute', width: 14, height: 14, background: '#1e1b4b', borderRadius: '50%', top: 7, left: 7 }}>
              <div style={{ position: 'absolute', width: 5, height: 5, background: '#fff', borderRadius: '50%', top: 2, left: 2 }} />
            </div>
          </div>
          {/* Boca */}
          <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 40, height: 10, background: '#fff', borderRadius: '0 0 20px 20px', opacity: .85, boxShadow: '0 2px 8px rgba(0,0,0,.2)' }} />
          {/* Mejillas */}
          <div style={{ position: 'absolute', bottom: 26, left: 16, width: 18, height: 10, background: 'rgba(251,113,133,.5)', borderRadius: '50%', filter: 'blur(3px)' }} />
          <div style={{ position: 'absolute', bottom: 26, right: 16, width: 18, height: 10, background: 'rgba(251,113,133,.5)', borderRadius: '50%', filter: 'blur(3px)' }} />
        </div>

        {/* ── Cuello ── */}
        <div style={{ width: 36, height: 12, background: 'linear-gradient(to bottom,#d97706,#b45309)', margin: '0 auto', borderRadius: '4px 4px 0 0' }} />

        {/* ── Torso ── */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* Brazo izquierdo */}
          <div style={{
            position: 'absolute', left: -30, top: 10, width: 24, height: 72, zIndex: 0,
            background: 'linear-gradient(145deg,#1e40af,#1d4ed8)',
            borderRadius: '99px 99px 12px 12px',
            boxShadow: '0 8px 20px rgba(0,0,0,.35)',
          }} />
          {/* Brazo derecho - SALUDANDO */}
          <div style={{
            position: 'absolute', right: -30, top: 10, width: 24, height: 72, zIndex: 0,
            background: 'linear-gradient(145deg,#1e40af,#1d4ed8)',
            borderRadius: '99px 99px 12px 12px',
            boxShadow: '0 8px 20px rgba(0,0,0,.35)',
            transformOrigin: 'top center',
            animation: 'ariaWave 2.5s ease-in-out infinite',
          }} />

          {/* Cuerpo principal */}
          <div style={{
            width: 148, height: 100, zIndex: 1,
            background: 'linear-gradient(145deg,#1e40af,#1d4ed8,#2563eb)',
            borderRadius: 24,
            boxShadow: '0 12px 36px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Shine */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.12) 0%, transparent 50%)', borderRadius: 24 }} />
            {/* Badge LED */}
            <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 5 }}>
              {['#34d399','#fbbf24','#f87171'].map((c,i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}`, animation: `ariaLed ${1.5+i*.4}s ease-in-out infinite` }} />
              ))}
            </div>
            {/* Pantalla */}
            <div style={{
              width: 92, height: 44, background: 'rgba(0,0,0,.5)', borderRadius: 10,
              border: '1.5px solid rgba(129,140,248,.6)',
              overflow: 'hidden', position: 'relative',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,.5)',
            }}>
              <div style={{ width: '100%', height: 3, background: 'linear-gradient(90deg,transparent,#34d399,transparent)', animation: 'ariaScan 1.6s linear infinite' }} />
              {/* Texto ARIA en pantalla */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#34d399', fontSize: 15, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2, textShadow: '0 0 8px #34d399' }}>ARIA</span>
              </div>
            </div>
            {/* Botón corazón */}
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#f43f5e,#fb7185)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(244,63,94,.5)', animation: 'ariaHeart 1.5s ease-in-out infinite' }}>
              <Heart size={13} color="#fff" fill="#fff" />
            </div>
          </div>
        </div>

        {/* ── Cintura ── */}
        <div style={{ width: 100, height: 14, background: 'linear-gradient(to bottom,#1e3a8a,#1e40af)', margin: '0 auto', borderRadius: 4 }} />

        {/* ── Piernas ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          {[0, 1].map(i => (
            <div key={i}>
              <div style={{
                width: 32, height: 44, background: 'linear-gradient(145deg,#1e40af,#1d4ed8)',
                borderRadius: '4px 4px 0 0', boxShadow: '0 6px 16px rgba(0,0,0,.3)',
                animation: i === 0 ? 'ariaLegL 4s ease-in-out infinite' : 'ariaLegR 4s ease-in-out infinite',
              }} />
              <div style={{ width: 40, height: 16, background: '#1e3a8a', borderRadius: '0 0 10px 10px', margin: '0 auto', boxShadow: '0 6px 16px rgba(0,0,0,.3)' }} />
            </div>
          ))}
        </div>

        {/* ── Sombra ── */}
        <div style={{ width: 120, height: 16, background: 'radial-gradient(ellipse,rgba(251,191,36,.4) 0%,transparent 70%)', margin: '6px auto 0', animation: 'ariaShadow 4s ease-in-out infinite', filter: 'blur(4px)' }} />
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)
  const [count50, setCount50] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [playingVideo, setPlayingVideo] = useState<number | null>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted.current) {
        counted.current = true
        let n = 0
        const t = setInterval(() => { n += 2; setCount50(n); if (n >= 50) clearInterval(t) }, 40)
      }
    }, { threshold: 0.4 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveImg(p => (p + 1) % 4), 4500)
    return () => clearInterval(t)
  }, [])

  const waMsg = encodeURIComponent('Hola, vi su página web y me interesa agendar una evaluación gratuita para mi hijo/a.')
  const waUrl = `https://wa.me/51924807183?text=${waMsg}`

  const imgs = [
    { src: '/images/hero-image.jpg', caption: 'Sesiones personalizadas de terapia ABA' },
    { src: '/images/hero-image.jpg', caption: 'Talleres de habilidades sociales' },
    { src: '/images/hero-image.jpg', caption: 'Escuela para Padres' },
    { src: '/images/hero-image.jpg', caption: 'Evaluaciones especializadas' },
  ]

  const testimonials = [
    { name: 'María G.', desc: 'Mamá de Rodrigo, 6 años · TEA Nivel 2', a: 'M', color: '#f97316', text: 'En 3 meses mi hijo empezó a comunicarse con frases completas. Los reportes con IA nos ayudan a entender su progreso sin tecnicismos. ¡Los recomiendo al 100%!' },
    { name: 'Carlos R.', desc: 'Papá de Valentina, 4 años · TDAH', a: 'C', color: '#10b981', text: 'Lo que más me sorprendió fue poder seguir el avance semana a semana desde mi celular. El asistente IA nos da consejos para trabajar en casa. Valentina ha mejorado muchísimo.' },
    { name: 'Rosa T.', desc: 'Mamá de Mateo, 5 años · TEA Nivel 1', a: 'R', color: '#8b5cf6', text: 'Al principio tenía miedo de no entender los términos clínicos. La terapeuta y el sistema de reportes lo explican todo de manera muy sencilla. Me siento acompañada.' },
  ]

  const benefits = [
    { icon: <ClipboardList size={20} color="#fff" />, bg: 'linear-gradient(135deg,#f97316,#fb923c)', title: 'Reportes diarios', desc: 'Resumen claro de cada sesión con logros y observaciones.' },
    { icon: <LineChart size={20} color="#fff" />, bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', title: 'Gráficos de progreso', desc: 'Evolución de tu hijo semana a semana en habilidades y conducta.' },
    { icon: <MessageSquareHeart size={20} color="#fff" />, bg: 'linear-gradient(135deg,#10b981,#34d399)', title: 'Chat con especialistas', desc: 'Comunícate directamente con el equipo terapéutico desde la app.' },
    { icon: <Brain size={20} color="#fff" />, bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', title: 'ARIA 24/7', desc: 'Nuestra IA analiza datos y te da sugerencias personalizadas.' },
    { icon: <Calendar size={20} color="#fff" />, bg: 'linear-gradient(135deg,#f43f5e,#fb7185)', title: 'Agenda de citas', desc: 'Reserva y confirma sesiones en un solo lugar, sin llamadas.' },
    { icon: <BookOpen size={20} color="#fff" />, bg: 'linear-gradient(135deg,#14b8a6,#2dd4bf)', title: 'Biblioteca de recursos', desc: 'Guías, videos y actividades ABA para reforzar en casa.' },
    { icon: <Bell size={20} color="#fff" />, bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', title: 'Notificaciones', desc: 'Alertas de progreso, citas y mensajes en tiempo real.' },
    { icon: <Shield size={20} color="#fff" />, bg: 'linear-gradient(135deg,#059669,#10b981)', title: 'Datos protegidos', desc: 'Información 100% segura con estándares clínicos.' },
  ]

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Nunito', sans-serif; background: #fffbf5; color: #2d1b69; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 7px; }
        ::-webkit-scrollbar-track { background: #fef3c7; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 99px; }

        /* ─ NAV ─ */
        .lp-nav { position: sticky; top: 0; z-index: 100; transition: all .3s; }
        .lp-nav.scrolled { background: rgba(255,251,245,.97); backdrop-filter: blur(16px); box-shadow: 0 4px 24px rgba(249,115,22,.12); border-bottom: 2px solid #fed7aa; }
        .lp-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 68px; display: flex; align-items: center; justify-content: space-between; }
        .lp-nav-links { display: none; gap: 24px; }
        @media(min-width:768px){ .lp-nav-links { display: flex; } }
        .lp-nav-links a { font-family: 'Baloo 2',cursive; font-size: 14px; font-weight: 700; color: #78350f; text-decoration: none; transition: color .2s; }
        .lp-nav-links a:hover { color: #f97316; }
        .lp-btn-ghost { padding: 8px 20px; border: 2px solid #fed7aa; border-radius: 99px; font-family: 'Baloo 2',cursive; font-size: 13px; font-weight: 700; color: #78350f; text-decoration: none; transition: all .2s; background: #fff; }
        .lp-btn-ghost:hover { border-color: #f97316; color: #f97316; }
        .lp-btn-fill { padding: 8px 20px; background: linear-gradient(135deg,#f97316,#ea580c); border-radius: 99px; font-family: 'Baloo 2',cursive; font-size: 13px; font-weight: 700; color: #fff; text-decoration: none; transition: all .2s; box-shadow: 0 4px 14px rgba(249,115,22,.3); }
        .lp-btn-fill:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(249,115,22,.4); }

        /* ─ HERO ─ */
        .lp-hero { min-height: 92vh; display: flex; align-items: center; background: linear-gradient(160deg,#fff7ed 0%,#fffbf5 55%,#ecfdf5 100%); position: relative; overflow: hidden; padding: 80px 20px 60px; }
        .lp-hero-inner { max-width: 1200px; margin: 0 auto; width: 100%; display: grid; gap: 48px; position: relative; z-index: 1; align-items: center; }
        @media(min-width:900px){ .lp-hero-inner { grid-template-columns: 1fr 1fr; } }

        /* ─ BOTONES ─ */
        .btn-wa { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: #25d366; color: #fff; border-radius: 99px; font-family: 'Baloo 2',cursive; font-weight: 700; font-size: 15px; text-decoration: none; transition: all .25s; box-shadow: 0 6px 20px rgba(37,211,102,.3); }
        .btn-wa:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,211,102,.4); }
        .btn-orange { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; background: linear-gradient(135deg,#f97316,#ea580c); color: #fff; border-radius: 99px; font-family: 'Baloo 2',cursive; font-weight: 700; font-size: 15px; text-decoration: none; transition: all .25s; box-shadow: 0 6px 20px rgba(249,115,22,.3); }
        .btn-orange:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(249,115,22,.4); }
        .btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; border: 2.5px solid #fed7aa; color: #78350f; border-radius: 99px; font-family: 'Baloo 2',cursive; font-weight: 700; font-size: 15px; text-decoration: none; background: #fff; transition: all .25s; cursor: pointer; }
        .btn-outline:hover { border-color: #f97316; color: #f97316; }
        @keyframes lp-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        /* ─ STATS ─ */
        .lp-stats { background: linear-gradient(135deg,#1c1917,#292524); padding: 48px 20px; }
        .lp-stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(2,1fr); gap: 28px; }
        @media(min-width:640px){ .lp-stats-inner { grid-template-columns: repeat(4,1fr); } }
        .lp-stat-num { font-family: 'Baloo 2',cursive; font-size: 44px; font-weight: 800; color: #fb923c; line-height: 1; margin-bottom: 4px; }
        .lp-stat-lbl { font-size: 11px; color: rgba(255,255,255,.45); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }

        /* ─ SECTIONS ─ */
        .lp-section { padding: 80px 20px; }
        .lp-inner { max-width: 1200px; margin: 0 auto; }
        .lp-tag { display: inline-flex; align-items: center; gap: 6px; background: #fff7ed; border: 2px solid #fed7aa; color: #c2410c; border-radius: 99px; padding: 4px 14px; font-family: 'Baloo 2',cursive; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
        .lp-h2 { font-family: 'Baloo 2',cursive; font-size: clamp(26px,4vw,42px); font-weight: 800; color: #1c1917; line-height: 1.2; margin-bottom: 14px; }
        .lp-sub { font-size: 16px; color: #78716c; line-height: 1.85; max-width: 580px; }

        /* ─ GRID ─ */
        .lp-grid-3 { display: grid; gap: 20px; }
        @media(min-width:640px){ .lp-grid-3 { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:900px){ .lp-grid-3 { grid-template-columns: repeat(3,1fr); } }
        .lp-grid-4 { display: grid; gap: 16px; }
        @media(min-width:540px){ .lp-grid-4 { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:960px){ .lp-grid-4 { grid-template-columns: repeat(4,1fr); } }

        /* ─ CARDS ─ */
        .lp-benefit-card { background: #fff; border: 2px solid #fef3c7; border-radius: 20px; padding: 24px 20px; transition: all .3s; }
        .lp-benefit-card:hover { border-color: #fed7aa; box-shadow: 0 14px 36px rgba(249,115,22,.1); transform: translateY(-4px) rotate(-.5deg); }
        .lp-testi-card { background: #fff; border-radius: 22px; padding: 28px; border: 2px solid #fef3c7; transition: all .3s; }
        .lp-testi-card:hover { border-color: #fed7aa; box-shadow: 0 16px 40px rgba(249,115,22,.08); transform: translateY(-4px); }
        .lp-svc-card { background: #fff; border-radius: 22px; padding: 32px; border: 2px solid #fef3c7; transition: all .3s; position: relative; overflow: hidden; }
        .lp-svc-card::before { content:''; position:absolute; top:0; left:0; right:0; height:5px; background:linear-gradient(90deg,#f97316,#fbbf24); transform:scaleX(0); transform-origin:left; transition:transform .35s; }
        .lp-svc-card:hover::before { transform:scaleX(1); }
        .lp-svc-card:hover { border-color: #fed7aa; box-shadow: 0 20px 60px rgba(249,115,22,.12); transform: translateY(-4px); }
        .lp-svc-card.featured { background: linear-gradient(145deg,#f97316,#ea580c); border-color: transparent; }
        .lp-svc-card.featured::before { display: none; }
        .lp-team-card { background: #fff; border-radius: 22px; padding: 28px; border: 2px solid #fef3c7; text-align: center; transition: all .3s; }
        .lp-team-card:hover { border-color: #fed7aa; box-shadow: 0 16px 40px rgba(249,115,22,.1); transform: translateY(-4px) rotate(.5deg); }
        .lp-faq-item { border: 2.5px solid #fef3c7; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all .2s; margin-bottom: 12px; background: #fff; }
        .lp-faq-item:hover { border-color: #fed7aa; }
        .lp-faq-item.open { border-color: #fb923c; background: #fff7ed; }

        /* ─ IA SECTION ─ */
        .lp-ia { background: linear-gradient(160deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%); padding: 100px 20px; position: relative; overflow: hidden; }
        .lp-ia-dots { position: absolute; inset: 0; background-image: radial-gradient(circle,rgba(251,191,36,.07) 1px,transparent 1px); background-size: 30px 30px; }
        .lp-ia-inner { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        /* IA: texto izquierda + robot derecha */
        .lp-ia-layout { display: grid; gap: 48px; align-items: center; }
        @media(min-width:900px){ .lp-ia-layout { grid-template-columns: 1fr 420px; } }
        .lp-ia-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.35); color: #fbbf24; border-radius: 99px; padding: 5px 14px; font-family: 'Baloo 2',cursive; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
        .lp-ia-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 28px; transition: all .3s; }
        .lp-ia-card:hover { background: rgba(255,255,255,.1); transform: translateY(-4px); border-color: rgba(251,191,36,.3); }
        .lp-ia-card h4 { font-family: 'Baloo 2',cursive; color: #fff; font-weight: 700; font-size: 16px; margin-bottom: 8px; }
        .lp-ia-card p { color: rgba(255,255,255,.5); font-size: 13px; line-height: 1.75; }

        /* ─ GALLERY ─ */
        .lp-gallery-main { position: relative; border-radius: 24px; overflow: hidden; aspect-ratio: 16/9; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
        .lp-gallery-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent,rgba(0,0,0,.65)); padding: 28px 20px 16px; color: #fff; font-family: 'Baloo 2',cursive; font-weight: 700; font-size: 14px; }
        .lp-gallery-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.9); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; }
        .lp-gallery-btn:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
        .lp-thumbs { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 12px; }
        .lp-thumb { border-radius: 12px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all .25s; aspect-ratio: 16/9; position: relative; }
        .lp-thumb.active { border-color: #f97316; box-shadow: 0 4px 14px rgba(249,115,22,.3); }

        /* ─ VIDEO CARDS ─ */
        .lp-video-card { background: #fff; border: 2px solid #fef3c7; border-radius: 20px; overflow: hidden; transition: all .3s; cursor: pointer; }
        .lp-video-card:hover { border-color: #fed7aa; box-shadow: 0 16px 48px rgba(249,115,22,.12); transform: translateY(-4px); }
        .lp-video-thumb { position: relative; aspect-ratio: 16/9; background: #1c1917; overflow: hidden; }
        .lp-video-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); transition: background .2s; }
        .lp-video-card:hover .lp-video-overlay { background: rgba(249,115,22,.4); }
        .lp-play-btn { width: 54px; height: 54px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,.3); transition: transform .2s; }
        .lp-video-card:hover .lp-play-btn { transform: scale(1.1); }

        /* ─ MODAL VIDEO ─ */
        .lp-modal { position: fixed; inset: 0; background: rgba(0,0,0,.88); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; animation: lp-up .2s ease; }
        .lp-modal-inner { position: relative; width: 100%; max-width: 880px; border-radius: 20px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.6); background: #000; }
        .lp-modal iframe { width: 100%; aspect-ratio: 16/9; border: none; display: block; }
        .lp-modal-x { position: absolute; top: -14px; right: -14px; background: #fff; border: none; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.3); transition: transform .2s; z-index: 10; }
        .lp-modal-x:hover { transform: scale(1.1) rotate(90deg); }

        /* ─ MAP ─ */
        .lp-map-section { position: relative; height: 500px; }
        .lp-map-card { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; padding: 28px; border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.15); max-width: 360px; width: calc(100% - 32px); border: 2px solid #fef3c7; }
        @media(min-width:768px){ .lp-map-card { left: 48px; transform: translateY(-50%); } }

        /* ─ FOOTER ─ */
        .lp-footer { background: #1c1917; color: rgba(255,255,255,.4); padding: 64px 20px 28px; }
        .lp-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; gap: 36px; margin-bottom: 40px; }
        @media(min-width:768px){ .lp-footer-inner { grid-template-columns: 2fr 1fr 1fr 1fr; } }
        .lp-footer h4 { font-family: 'Baloo 2',cursive; color: #fff; font-weight: 700; font-size: 14px; margin-bottom: 14px; }
        .lp-footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .lp-footer ul li a { color: rgba(255,255,255,.4); text-decoration: none; font-size: 13px; transition: color .2s; }
        .lp-footer ul li a:hover { color: #fb923c; }
        .lp-social { width: 38px; height: 38px; background: rgba(255,255,255,.07); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: rgba(255,255,255,.45); transition: all .2s; text-decoration: none; margin-right: 8px; }
        .lp-social:hover { background: #f97316; color: #fff; transform: translateY(-2px); }

        /* ─ WA FLOAT ─ */
        @keyframes waFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes waPing { 75%,100%{transform:scale(2);opacity:0} }
        .lp-wa { position: fixed; bottom: 22px; right: 22px; z-index: 998; width: 60px; height: 60px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(37,211,102,.45); animation: waFloat 3s ease-in-out infinite; text-decoration: none; }
        .lp-wa-ping { position: absolute; top: -3px; right: -3px; width: 18px; height: 18px; background: #ef4444; border-radius: 50%; }
        .lp-wa-ping::before { content:''; position:absolute; inset:0; background:#ef4444; border-radius:50%; animation: waPing 1.5s cubic-bezier(0,0,.2,1) infinite; }

        /* ─ ROBOT ARIA ANIMATIONS ─ */
        @keyframes ariaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes ariaBlink { 0%,90%,100%{transform:scaleY(1)} 94%{transform:scaleY(.05)} }
        @keyframes ariaWave { 0%,100%{transform:rotate(-12deg)} 40%{transform:rotate(-35deg)} 60%{transform:rotate(-20deg)} }
        @keyframes ariaAntenna { 0%,100%{box-shadow:0 0 14px 6px rgba(251,191,36,.9),0 0 30px 10px rgba(251,191,36,.4)} 50%{box-shadow:0 0 24px 10px rgba(251,191,36,1),0 0 50px 20px rgba(251,191,36,.6)} }
        @keyframes ariaScan { 0%{transform:translateY(-100%)} 100%{transform:translateY(300%)} }
        @keyframes ariaLed { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes ariaHeart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes ariaPulse { 0%,100%{opacity:.3;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.6;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes ariaShadow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.2;transform:scale(.8)} }
        @keyframes ariaLegL { 0%,100%{transform:rotate(0)} 50%{transform:rotate(3deg)} }
        @keyframes ariaLegR { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-3deg)} }

        /* ─ FLOATING SHAPES ─ */
        @keyframes shapeFloat1 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-16px) rotate(10deg)} }
        @keyframes shapeFloat2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-12px) rotate(-8deg)} }

        /* ─ MOBILE FIXES ─ */
        @media(max-width:639px){
          .lp-hero { padding: 70px 16px 50px; min-height: 100svh; }
          .lp-hero-inner { gap: 32px; }
          .lp-ia { padding: 72px 16px; }
          .lp-ia-layout { gap: 32px; }
          .lp-section { padding: 64px 16px; }
          .lp-stats { padding: 40px 16px; }
          .lp-footer { padding: 48px 16px 24px; }
          .lp-map-section { height: 580px; }
          .lp-map-card { position: static; transform: none; margin: 0 16px; box-shadow: 0 8px 24px rgba(0,0,0,.1); }
          .lp-modal { padding: 8px; }
          .lp-modal-x { top: 8px; right: 8px; }
          .lp-nav-inner { height: 60px; }
        }
      `}</style>

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="lp-wa" aria-label="WhatsApp">
        <Phone size={26} color="#fff" />
        <div className="lp-wa-ping" />
      </a>

      {/* MODAL VIDEO */}
      {playingVideo !== null && (
        <div className="lp-modal" onClick={() => setPlayingVideo(null)}>
          <div className="lp-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-x" onClick={() => setPlayingVideo(null)}><X size={18} color="#1c1917" /></button>
            <iframe src={getEmbedUrl(VIDEOS[playingVideo].url)} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={VIDEOS[playingVideo].title} />
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className={`lp-nav ${isScrolled ? 'scrolled' : ''}`} style={{ background: isScrolled ? undefined : 'transparent' }}>
        <div className="lp-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 42, height: 42 }}>
              <Image src="/images/logo.png?v=2" alt="Logo" fill style={{ objectFit: 'contain' }} priority unoptimized />
            </div>
            <div>
              <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 16, color: '#1c1917', lineHeight: 1.1 }}>Jugando Aprendo</p>
              <p style={{ fontSize: 10, color: '#a8a29e', fontWeight: 600 }}>Centro de Desarrollo Infantil · Pisco</p>
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#para-padres">Para Padres</a>
            <a href="#aria">Asistente ARIA</a>
            <a href="#servicios">Servicios</a>
            <a href="#galeria">Galería</a>
            <a href="#faq">Preguntas</a>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" className="lp-btn-ghost">Ingresar</Link>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="lp-btn-fill">Evaluar gratis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="lp-hero">
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(249,115,22,.08) 2px,transparent 2px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle,rgba(251,191,36,.14) 0%,transparent 70%)', top: -140, right: -60, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 340, height: 340, background: 'radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)', bottom: -80, left: -60, borderRadius: '50%' }} />
        {/* Floating shapes */}
        <div style={{ position: 'absolute', top: 90, left: '8%', width: 56, height: 56, background: '#fef08a', borderRadius: '50%', opacity: .55, animation: 'shapeFloat1 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 130, right: '10%', width: 38, height: 38, background: '#bbf7d0', borderRadius: '12px', opacity: .6, animation: 'shapeFloat2 5s ease-in-out infinite 1s', transform: 'rotate(25deg)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '4%', width: 26, height: 26, background: '#fecdd3', borderRadius: '50%', opacity: .7, animation: 'shapeFloat1 7s ease-in-out infinite .5s' }} />

        <div className="lp-hero-inner">
          <div style={{ animation: 'lp-up .6s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 99, padding: '6px 16px', fontFamily: "'Baloo 2',cursive", fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 18 }}>
              <Heart size={13} style={{ fill: 'currentColor' }} /> Terapia · Tecnología · Amor
            </div>
            <h1 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 'clamp(34px,5vw,58px)', fontWeight: 800, lineHeight: 1.15, color: '#1c1917', marginBottom: 18 }}>
              Impulsando el potencial de{' '}
              <span style={{ color: '#f97316', position: 'relative', display: 'inline-block' }}>
                mentes brillantes.
                <span style={{ position: 'absolute', bottom: 3, left: 0, right: 0, height: 7, background: '#fef08a', borderRadius: 99, zIndex: -1 }} />
              </span>
            </h1>
            <p style={{ fontSize: 17, color: '#57534e', lineHeight: 1.85, marginBottom: 32, maxWidth: 480 }}>
              Centro especializado en neurodivergencia en Pisco. Combinamos terapia ABA basada en evidencia, seguimiento digital en tiempo real y la calidez de nuestro equipo.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa">
                <Phone size={16} /> Evaluación gratuita
              </a>
              <button className="btn-outline" onClick={() => document.getElementById('para-padres')?.scrollIntoView({ behavior: 'smooth' })}>
                <Sparkles size={16} color="#f97316" /> ¿Qué ofrecemos?
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {[
                { bg: '#dcfce7', icon: <CheckCircle size={16} color="#16a34a" />, label: 'Metodología ABA' },
                { bg: '#fef9c3', icon: <Star size={16} color="#ca8a04" fill="#ca8a04" />, label: '+50 Familias' },
                { bg: '#fce7f3', icon: <Brain size={16} color="#db2777" />, label: 'IA Incluida' },
              ].map(({ bg, icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                  <span style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, color: '#44403c' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', animation: 'lp-up .7s .15s ease both' }}>
            <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 28px 72px rgba(0,0,0,.14)', aspectRatio: '4/3', position: 'relative', border: '5px solid #fff', transform: 'rotate(2deg)', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(2deg)')}>
              <Image src="/images/hero-image.jpg?v=2" alt="Niños en terapia ABA" fill style={{ objectFit: 'cover' }} priority unoptimized />
            </div>
            <div style={{ position: 'absolute', top: 18, left: -20, background: '#fff', borderRadius: 14, padding: '11px 16px', boxShadow: '0 8px 28px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#1c1917', border: '2px solid #fef3c7' }}>
              <div style={{ width: 30, height: 30, background: '#fef9c3', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={15} color="#d97706" /></div>
              Metodología ABA
            </div>
            <div style={{ position: 'absolute', bottom: 18, right: -20, background: '#fff', borderRadius: 14, padding: '11px 16px', boxShadow: '0 8px 28px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#1c1917', border: '2px solid #d1fae5' }}>
              <CheckCircle size={18} color="#10b981" /> 100% Personalizado
            </div>
          </div>
        </div>
      </header>

      {/* WAVE + STATS */}
      <div style={{ background: '#1c1917' }}>
        <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', background: '#fffbf5' }}>
          <path d="M0,20 C480,50 960,0 1440,25 L1440,0 L0,0 Z" fill="#1c1917" />
        </svg>
      </div>
      <div className="lp-stats" ref={statsRef}>
        <div className="lp-stats-inner">
          {[{ num: `+${count50}`, lbl: 'Familias felices' }, { num: '100%', lbl: 'Personalizado' }, { num: 'ABA', lbl: 'Metodología' }, { num: 'Pisco', lbl: 'Sede Central' }].map(({ num, lbl }) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div className="lp-stat-num">{num}</div>
              <div className="lp-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginTop: 36 }}>
          <path d="M0,0 C480,40 960,0 1440,20 L1440,40 L0,40 Z" fill="#fffbf5" />
        </svg>
      </div>

      {/* PARA PADRES */}
      <section id="para-padres" className="lp-section" style={{ background: '#fffbf5' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-tag"><Heart size={12} /> Para las familias</div>
            <h2 className="lp-h2">Todo lo que brindamos<br/>a los padres</h2>
            <p className="lp-sub" style={{ margin: '0 auto' }}>Acompañar a tu hijo es un camino compartido. Herramientas digitales y humanas para que siempre estés informado, empoderado y parte activa del proceso.</p>
          </div>
          <div className="lp-grid-4">
            {benefits.map(({ icon, bg, title, desc }) => (
              <div key={title} className="lp-benefit-card">
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{icon}</div>
                <h4 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 700, color: '#1c1917', marginBottom: 6 }}>{title}</h4>
                <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/login?mode=signup" className="btn-orange" style={{ display: 'inline-flex' }}>
              Accede a la plataforma de padres <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ background: '#fff7ed', padding: '80px 20px' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-tag"><Quote size={12} /> Familias reales</div>
            <h2 className="lp-h2">Resultados que hablan por sí solos</h2>
          </div>
          <div className="lp-grid-3">
            {testimonials.map(({ name, desc, a, color, text }) => (
              <div key={name} className="lp-testi-card">
                <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ color: '#44403c', fontSize: 14, lineHeight: 1.85, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 18, color: '#fff' }}>{a}</div>
                  <div>
                    <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, color: '#1c1917' }}>{name}</p>
                    <p style={{ fontSize: 11, color: '#a8a29e' }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-orange" style={{ display: 'inline-flex' }}>
              Quiero resultados para mi hijo/a <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── ASISTENTE ARIA + ROBOT ─────────────────────────────────────── */}
      <section id="aria" className="lp-ia">
        <div className="lp-ia-dots" />
        <div className="lp-ia-inner">

          {/* TÍTULO CENTRADO ARRIBA */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="lp-ia-tag"><Sparkles size={13} /> Inteligencia Artificial</div>
            <h2 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
              Conoce a <span style={{ color: '#fbbf24' }}>ARIA</span> 🤖<br/>
              <span style={{ fontSize: '70%', color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>Tu asistente clínica inteligente</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.85, maxWidth: 520, margin: '0 auto' }}>
              No estás solo entre sesiones. ARIA aprende exclusivamente de los registros clínicos diarios de tu hijo y te acompaña 24/7.
            </p>
          </div>

          {/* LAYOUT: TEXTO izquierda | ROBOT derecha */}
          <div className="lp-ia-layout">
            {/* IZQUIERDA: Cards de funciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <LineChart size={22} color="#fbbf24" />, bg: 'rgba(251,191,36,.15)', title: 'Seguimiento Preciso', desc: 'ARIA analiza tendencias conductuales sesión a sesión, detectando patrones invisibles al ojo humano.' },
                { icon: <MessageSquareHeart size={22} color="#34d399" />, bg: 'rgba(52,211,153,.15)', title: 'Apoyo para Padres 24/7', desc: 'Resúmenes en lenguaje sencillo y recomendaciones personalizadas para reforzar el aprendizaje en casa.' },
                { icon: <Brain size={22} color="#c084fc" />, bg: 'rgba(192,132,252,.15)', title: 'Progreso Visible', desc: 'Gráficos interactivos que muestran la evolución en tiempo real con cada sesión registrada.' },
                { icon: <Zap size={22} color="#fb923c" />, bg: 'rgba(251,146,60,.15)', title: 'Respuestas Instantáneas', desc: 'Pregúntale a ARIA en cualquier momento sobre el progreso, dudas o actividades para practicar en casa.' },
              ].map(({ icon, bg, title, desc }) => (
                <div key={title} className="lp-ia-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{title}</h4>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <Link href="/login?mode=signup" className="btn-orange" style={{ display: 'inline-flex', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#1c1917' }}>
                  Habla con ARIA ahora <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* DERECHA: ROBOT */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <ARIARobot />
              {/* Burbuja de diálogo */}
              <div style={{
                position: 'absolute', top: -10, right: 0, background: '#fff', borderRadius: '16px 16px 16px 4px',
                padding: '10px 16px', boxShadow: '0 8px 28px rgba(0,0,0,.25)',
                fontFamily: "'Baloo 2',cursive", fontSize: 13, fontWeight: 700, color: '#1c1917',
                maxWidth: 160, animation: 'ariaFloat 4s ease-in-out infinite .5s',
              }}>
                ¡Hola! Soy ARIA 👋<br/>
                <span style={{ fontWeight: 400, fontSize: 11, color: '#78716c' }}>¿En qué te ayudo hoy?</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA DE IMÁGENES */}
      <section id="galeria" className="lp-section" style={{ background: '#fffbf5' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="lp-tag"><ImageIcon size={12} /> Galería de fotos</div>
            <h2 className="lp-h2">Nuestro centro en imágenes</h2>
            <p className="lp-sub" style={{ margin: '0 auto' }}>Conoce el ambiente seguro, cálido y estimulante donde los niños aprenden y crecen.</p>
          </div>
          <div className="lp-gallery-main">
            <Image src={imgs[activeImg].src} alt={imgs[activeImg].caption} fill style={{ objectFit: 'cover' }} unoptimized />
            <div className="lp-gallery-caption">{imgs[activeImg].caption}</div>
            <button className="lp-gallery-btn" style={{ left: 12 }} onClick={() => setActiveImg((activeImg - 1 + 4) % 4)}><ChevronLeft size={18} color="#1c1917" /></button>
            <button className="lp-gallery-btn" style={{ right: 12 }} onClick={() => setActiveImg((activeImg + 1) % 4)}><ChevronRight size={18} color="#1c1917" /></button>
            <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
              {[0,1,2,3].map(i => <div key={i} onClick={() => setActiveImg(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: activeImg === i ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .2s', transform: activeImg === i ? 'scale(1.3)' : 'scale(1)' }} />)}
            </div>
          </div>
          <div className="lp-thumbs">
            {imgs.map((img, i) => (
              <div key={i} className={`lp-thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                <Image src={img.src} alt={img.caption} fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA DE VIDEOS */}
      <section className="lp-section" style={{ background: '#fff7ed' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="lp-tag"><Video size={12} /> Videos</div>
            <h2 className="lp-h2">Conoce cómo trabajamos</h2>
            <p className="lp-sub" style={{ margin: '0 auto' }}>Mira nuestros métodos, conoce familias reales y entiende cómo ARIA potencia cada sesión.</p>
          </div>

          <div className="lp-grid-3">
            {VIDEOS.map((v, i) => {
              const pl = getPlatformLabel(v.url)
              return (
                <div key={i} className="lp-video-card" onClick={() => setPlayingVideo(i)}>
                  <div className="lp-video-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getThumbUrl(v.url)} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div className="lp-video-overlay">
                      <div className="lp-play-btn">
                        <Play size={20} color="#f97316" fill="#f97316" style={{ marginLeft: 3 }} />
                      </div>
                    </div>
                    {/* Platform badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: pl.color, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: "'Baloo 2',cursive", fontWeight: 700 }}>{pl.label}</div>
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <h4 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 700, color: '#1c1917', marginBottom: 5 }}>{v.title}</h4>
                    <p style={{ fontSize: 13, color: '#a8a29e' }}>{v.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Instrucción de edición */}
          <div style={{ marginTop: 28, background: '#fff', border: '2px dashed #fed7aa', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 38, height: 38, background: '#fff7ed', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Video size={17} color="#f97316" /></div>
            <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.65 }}>
              <strong style={{ color: '#1c1917' }}>¿Cómo cambiar los videos?</strong> Abre <code style={{ background: '#f5f5f4', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>app/page.tsx</code> y edita el arreglo <code style={{ background: '#f5f5f4', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>VIDEOS</code> al inicio. Soporta <strong>YouTube, TikTok, Google Drive y Vimeo</strong>.
            </p>
          </div>

          <div style={{ marginTop: 24, background: '#fff', borderRadius: 18, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, border: '2px solid #fef3c7' }}>
            <div>
              <h4 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 16, color: '#1c1917', marginBottom: 3 }}>¿Quieres ver más contenido?</h4>
              <p style={{ color: '#78716c', fontSize: 13 }}>Síguenos en redes para actividades, consejos y novedades.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="btn-orange" style={{ padding: '9px 18px', fontSize: 13 }}><Facebook size={15} /> Facebook</a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg,#f43f5e,#ec4899)', color: '#fff', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}><Instagram size={15} /> Instagram</a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="lp-section" style={{ background: '#fffbf5' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-tag"><Star size={12} /> Nuestros Servicios</div>
            <h2 className="lp-h2">Soluciones integrales para el desarrollo</h2>
          </div>
          <div className="lp-grid-3">
            <div className="lp-svc-card">
              <div style={{ width: 56, height: 56, background: '#dbeafe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Brain size={26} color="#2563eb" /></div>
              <h3 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 10 }}>Terapia ABA</h3>
              <p style={{ color: '#78716c', fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>Intervención basada en evidencia para mejorar habilidades sociales, comunicación y aprendizaje.</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f97316', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Agendar evaluación <ArrowRight size={15} /></a>
            </div>
            <div className="lp-svc-card featured">
              <div style={{ position: 'absolute', top: 16, right: 16, background: '#fbbf24', color: '#1c1917', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontFamily: "'Baloo 2',cursive" }}>Popular</div>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Users size={26} color="#fff" /></div>
              <h3 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Habilidades Sociales</h3>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>Talleres grupales donde los niños aprenden a interactuar en un entorno seguro y lúdico.</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Agendar evaluación <ArrowRight size={15} /></a>
            </div>
            <div className="lp-svc-card">
              <div style={{ width: 56, height: 56, background: '#dcfce7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Calendar size={26} color="#16a34a" /></div>
              <h3 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 10 }}>Escuela para Padres</h3>
              <p style={{ color: '#78716c', fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>Capacitación constante para que las familias sean parte activa del proceso de desarrollo.</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Más información <ArrowRight size={15} /></a>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="lp-section" style={{ background: '#fff7ed' }}>
        <div className="lp-inner">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-tag"><Heart size={12} /> Nuestro Equipo</div>
            <h2 className="lp-h2">Profesionales que aman lo que hacen</h2>
          </div>
          <div className="lp-grid-3">
            {[
              { i: 'S', color: 'linear-gradient(135deg,#f97316,#ea580c)', name: 'Terapeuta Principal', role: 'Especialista en Análisis Conductual Aplicado (ABA)', spec: 'Autismo · TDAH · TEA' },
              { i: 'A', color: 'linear-gradient(135deg,#0ea5e9,#0284c7)', name: 'Psicóloga Clínica', role: 'Evaluación y diagnóstico neuropsicológico infantil', spec: 'Evaluaciones · Reportes · Familias' },
              { i: 'M', color: 'linear-gradient(135deg,#10b981,#059669)', name: 'Coordinadora', role: 'Gestión de casos y seguimiento familiar', spec: 'Comunicación · Agenda · Soporte' },
            ].map(({ i, color, name, role, spec }) => (
              <div key={name} className="lp-team-card">
                <div style={{ width: 76, height: 76, borderRadius: 22, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 28, color: '#fff', margin: '0 auto 14px' }}>{i}</div>
                <h3 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 17, color: '#1c1917', marginBottom: 5 }}>{name}</h3>
                <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.7, marginBottom: 10 }}>{role}</p>
                <div style={{ display: 'inline-block', background: '#fff7ed', border: '1.5px solid #fed7aa', color: '#c2410c', borderRadius: 99, padding: '3px 12px', fontSize: 11, fontFamily: "'Baloo 2',cursive", fontWeight: 700 }}>{spec}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section" style={{ background: '#fffbf5' }}>
        <div className="lp-inner" style={{ maxWidth: 760 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="lp-tag"><HelpCircle size={12} /> Preguntas Frecuentes</div>
            <h2 className="lp-h2">Resolvemos tus dudas</h2>
          </div>
          {[
            { q: '¿A qué edad pueden empezar las terapias?', a: 'Atendemos niños desde los 1 año en adelante. La intervención temprana es clave. Nuestro equipo adapta las sesiones según la edad y necesidades de cada niño.' },
            { q: '¿Hay evaluación gratuita?', a: 'Sí. El primer paso es una evaluación gratuita donde conocemos a tu hijo y familia. Luego diseñamos un plan personalizado. Contáctanos por WhatsApp.' },
            { q: '¿Cómo veo el progreso de mi hijo?', a: 'A través de nuestra plataforma verás reportes diarios, gráficos de avance y observaciones de cada sesión. ARIA genera resúmenes semanales en lenguaje sencillo.' },
            { q: '¿Qué metodología utilizan?', a: 'Trabajamos con la metodología ABA (Applied Behavior Analysis), reconocida como el enfoque más efectivo con respaldo científico para la neurodivergencia.' },
            { q: '¿Qué incluye la plataforma para padres?', a: 'Incluye: reportes diarios, gráficos de progreso, chat con el equipo, asistente ARIA 24/7, agenda de citas, biblioteca de recursos y notificaciones en tiempo real.' },
          ].map((faq, i) => (
            <div key={i} className={`lp-faq-item ${activeAccordion === i ? 'open' : ''}`} onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px' }}>
                <h4 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#f97316', flexShrink: 0 }}>{i+1}</span>
                  {faq.q}
                </h4>
                <ChevronDown size={19} color="#a8a29e" style={{ transform: activeAccordion === i ? 'rotate(180deg)' : '', transition: 'transform .3s', flexShrink: 0 }} />
              </div>
              {activeAccordion === i && <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#78716c', lineHeight: 1.8 }}>{faq.a}</div>}
            </div>
          ))}

          <div style={{ marginTop: 44, background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 22, padding: '38px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🌟</div>
            <h3 style={{ fontFamily: "'Baloo 2',cursive", color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>¿Listo para dar el primer paso?</h3>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 24 }}>Agenda hoy tu evaluación gratuita. Sin compromiso, con mucho amor.</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px', background: '#fff', color: '#f97316', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <Phone size={17} /> Hablar con un especialista
            </a>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="ubicacion" className="lp-map-section">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.4229091779425!2d-76.0288421240214!3d-13.692817174731204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91104331c0093305%3A0x21adbeb7d8eb168d!2sC.%20Victor%20Raul%20Haya%20de%20la%20Torre%2C%2011641!5e0!3m2!1ses-419!2spe!4v1770256602309!5m2!1ses-419!2spe"
          width="100%" height="100%" style={{ border: 0, position: 'absolute', inset: 0 }} allowFullScreen loading="lazy" title="Ubicación" />
        <div className="lp-map-card">
          <h3 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 20, color: '#1c1917', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
            <MapPin color="#ef4444" size={20} /> Visítanos
          </h3>
          <p style={{ color: '#78716c', fontSize: 13, lineHeight: 1.75, marginBottom: 18 }}>Independencia, Pisco. Un ambiente seguro y adaptado para tus hijos.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
            {[
              { icon: <Clock size={15} color="#f97316" />, text: <><strong>Lun - Vie:</strong> 8:00 AM - 6:00 PM</> },
              { icon: <Phone size={15} color="#25d366" />, text: '+51 924 807 183' },
              { icon: <Mail size={15} color="#f59e0b" />, text: 'tallerjugandoaprendoind@gmail.com' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#44403c' }}>
                {item.icon}<span>{item.text}</span>
              </div>
            ))}
          </div>
          <a href="https://maps.app.goo.gl/fv9HhtWj5R45a5paA" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            <MapPin size={16} /> Ver en Google Maps
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <Image src="/images/logo.png?v=2" alt="Logo" fill style={{ objectFit: 'contain' }} unoptimized />
              </div>
              <span style={{ fontFamily: "'Baloo 2',cursive", color: '#fff', fontWeight: 800, fontSize: 17 }}>Jugando Aprendo</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, marginBottom: 18 }}>Centro especializado en terapia ABA y desarrollo infantil potenciado por IA. Pisco, Ica, Perú.</p>
            <div>
              <a href="https://www.facebook.com" className="lp-social" aria-label="Facebook"><Facebook size={15} /></a>
              <a href="https://www.instagram.com" className="lp-social" aria-label="Instagram"><Instagram size={15} /></a>
            </div>
          </div>
          <div>
            <h4>Servicios</h4>
            <ul>
              {['Terapia ABA','Habilidades Sociales','Escuela para Padres','Evaluación Gratuita'].map(s => <li key={s}><a href={waUrl}>{s}</a></li>)}
            </ul>
          </div>
          <div>
            <h4>Plataforma</h4>
            <ul>
              <li><a href="/login">Ingresar</a></li>
              <li><a href="/login?mode=signup">Registrarse</a></li>
              <li><a href="#para-padres">Para Padres</a></li>
              <li><a href="#aria">Asistente ARIA</a></li>
            </ul>
          </div>
          <div>
            <h4>Horarios</h4>
            <p style={{ fontSize: 13, marginBottom: 6 }}>Lun - Vie: 8AM - 6PM</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.22)', marginBottom: 3 }}>Sábado: Cerrado</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.22)', marginBottom: 14 }}>Domingo: Cerrado</p>
            <p style={{ fontSize: 12 }}>Independencia, Pisco, Ica</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 22, textAlign: 'center', fontSize: 12 }}>
          © 2025 Jugando Aprendo — Centro de Desarrollo Infantil · Pisco, Ica, Perú. Todos los derechos reservados.
        </div>
      </footer>
    </>
  )
}
