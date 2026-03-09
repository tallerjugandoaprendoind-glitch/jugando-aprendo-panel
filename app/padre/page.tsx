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

// ── Chat IA illustration ───────────────────────────────────────────────────────
function ARIAChatIllustration() {
  return (
    <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
      {/* ARIA avatar circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Avatar */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg,#f97316,#ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 8px rgba(249,115,22,.12), 0 16px 40px rgba(249,115,22,.25)',
          animation: 'ariaFloat 4s ease-in-out infinite',
          position: 'relative',
        }}>
          <Brain size={44} color="#fff" />
          {/* Online dot */}
          <div style={{ position: 'absolute', bottom: 6, right: 6, width: 18, height: 18, background: '#22c55e', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 8px rgba(34,197,94,.5)' }} />
        </div>

        {/* Chat bubbles */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* ARIA message */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={16} color="#fff" />
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #fed7aa', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', fontSize: 13, color: '#44403c', lineHeight: 1.6, boxShadow: '0 4px 16px rgba(249,115,22,.08)', maxWidth: 260 }}>
              ¡Hola! Hoy Rodrigo logró <strong style={{ color: '#f97316' }}>3 nuevas habilidades</strong> en su sesión. ¿Quieres ver el reporte?
            </div>
          </div>
          {/* Parent reply */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: 13, color: '#fff', lineHeight: 1.6, maxWidth: 200 }}>
              Sí, ¡qué emoción! ¿Cómo lo refuerzo en casa?
            </div>
          </div>
          {/* ARIA response */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={16} color="#fff" />
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #fed7aa', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', fontSize: 13, color: '#44403c', lineHeight: 1.6, boxShadow: '0 4px 16px rgba(249,115,22,.08)', maxWidth: 260 }}>
              Te recomiendo <strong style={{ color: '#f97316' }}>3 actividades</strong> basadas en los datos de esta semana...
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 4, flex: 1, background: '#fed7aa', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${i*30}%`, background: '#f97316', borderRadius: 99 }} /></div>)}
              </div>
            </div>
          </div>
          {/* Typing indicator */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.5 }}>
              <Brain size={16} color="#fff" />
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #fed7aa', borderRadius: '18px 18px 18px 4px', padding: '12px 20px', boxShadow: '0 4px 16px rgba(249,115,22,.08)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', opacity: 0.4, animation: `ariaLed ${0.8+i*.2}s ease-in-out infinite` }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  JUEGOS ABA — datos y componente
// ══════════════════════════════════════════════════════════════════════════════
type GameId = 'emociones' | 'vocabulario' | 'instrucciones' | 'atencion'
type GameLevel = 1 | 2 | 3

const GAMES_INFO = [
  { id: 'emociones'    as GameId, emoji: '😊', color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', title: 'Reconocer Emociones', desc: 'Identifica cómo se sienten los personajes', aba: 'Regulación emocional · ABA' },
  { id: 'vocabulario'  as GameId, emoji: '🗣️', color: '#8b5cf6', bg: '#faf5ff', border: '#e9d5ff', title: 'Vocabulario',           desc: 'Aprende y practica nuevas palabras',        aba: 'Comunicación verbal · ABA' },
  { id: 'instrucciones'as GameId, emoji: '👂', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', title: 'Sigue Instrucciones',  desc: 'Escucha y responde correctamente',           aba: 'Conducta operante · ABA'  },
  { id: 'atencion'     as GameId, emoji: '🔍', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', title: 'Atención',             desc: '¿Qué desapareció de la imagen?',            aba: 'Discriminación visual · ABA'},
]
const NIVEL_LABELS: Record<GameLevel, { label: string; desc: string; emoji: string }> = {
  1: { label: 'Principiante', desc: '2–4 años · inicio de terapia',    emoji: '🌱' },
  2: { label: 'Intermedio',   desc: '4–7 años · en progreso',          emoji: '🌿' },
  3: { label: 'Avanzado',     desc: '7+ años · habilidades sólidas',   emoji: '🌳' },
}

type EmoItem   = { emoji: string; nombre: string; opciones: string[] }
type VocabItem = { emoji: string; palabra: string; opciones: string[] }
type InstrItem = { instruccion: string; opciones: { emoji: string; label: string; correcto: boolean }[] }
type AtencItem = { todos: string[]; falta: string; opciones: string[] }
type AnyQ      = EmoItem | VocabItem | InstrItem | AtencItem

const EMOCIONES_D: Record<GameLevel, EmoItem[]> = {
  1: [
    { emoji: '😊', nombre: 'Feliz',   opciones: ['Feliz','Triste','Enojado'] },
    { emoji: '😢', nombre: 'Triste',  opciones: ['Feliz','Triste','Asustado'] },
    { emoji: '😡', nombre: 'Enojado', opciones: ['Enojado','Feliz','Cansado'] },
    { emoji: '😴', nombre: 'Cansado', opciones: ['Feliz','Enojado','Cansado'] },
  ],
  2: [
    { emoji: '😨', nombre: 'Asustado',    opciones: ['Asustado','Emocionado','Triste','Enojado'] },
    { emoji: '🤗', nombre: 'Cariñoso',    opciones: ['Aburrido','Cariñoso','Asustado','Triste'] },
    { emoji: '😤', nombre: 'Frustrado',   opciones: ['Feliz','Frustrado','Cansado','Emocionado'] },
    { emoji: '😮', nombre: 'Sorprendido', opciones: ['Enojado','Triste','Sorprendido','Cansado'] },
    { emoji: '😌', nombre: 'Tranquilo',   opciones: ['Tranquilo','Asustado','Frustrado','Feliz'] },
  ],
  3: [
    { emoji: '😔', nombre: 'Decepcionado', opciones: ['Triste','Decepcionado','Aburrido','Cansado'] },
    { emoji: '🥺', nombre: 'Preocupado',   opciones: ['Asustado','Preocupado','Triste','Nervioso'] },
    { emoji: '😬', nombre: 'Nervioso',     opciones: ['Nervioso','Preocupado','Frustrado','Confundido'] },
    { emoji: '🤩', nombre: 'Emocionado',   opciones: ['Feliz','Orgulloso','Emocionado','Cariñoso'] },
    { emoji: '😒', nombre: 'Aburrido',     opciones: ['Cansado','Triste','Aburrido','Decepcionado'] },
  ],
}
const VOCABULARIO_D: Record<GameLevel, VocabItem[]> = {
  1: [
    { emoji: '🐶', palabra: 'Perro',   opciones: ['Gato','Perro','Pájaro'] },
    { emoji: '🍎', palabra: 'Manzana', opciones: ['Manzana','Pelota','Silla'] },
    { emoji: '🏠', palabra: 'Casa',    opciones: ['Mesa','Casa','Árbol'] },
    { emoji: '🚗', palabra: 'Carro',   opciones: ['Carro','Bicicleta','Avión'] },
    { emoji: '👧', palabra: 'Niña',    opciones: ['Niño','Niña','Mamá'] },
  ],
  2: [
    { emoji: '🏃', palabra: 'Correr', opciones: ['Dormir','Correr','Comer','Saltar'] },
    { emoji: '🎨', palabra: 'Pintar', opciones: ['Dibujar','Colorear','Pintar','Escribir'] },
    { emoji: '🌧️', palabra: 'Lluvia', opciones: ['Sol','Lluvia','Nieve','Viento'] },
    { emoji: '📚', palabra: 'Libros', opciones: ['Cuaderno','Lápiz','Libros','Mochila'] },
    { emoji: '🎵', palabra: 'Música', opciones: ['Baile','Música','Canto','Sonido'] },
  ],
  3: [
    { emoji: '🤝', palabra: 'Compartir', opciones: ['Ayudar','Compartir','Jugar','Saludar'] },
    { emoji: '💬', palabra: 'Comunicar', opciones: ['Hablar','Escuchar','Comunicar','Preguntar'] },
    { emoji: '🧩', palabra: 'Resolver',  opciones: ['Jugar','Pensar','Resolver','Crear'] },
    { emoji: '🌱', palabra: 'Crecer',    opciones: ['Plantar','Regar','Crecer','Cuidar'] },
    { emoji: '🎭', palabra: 'Actuar',    opciones: ['Cantar','Bailar','Actuar','Dibujar'] },
  ],
}
const INSTRUCCIONES_D: Record<GameLevel, InstrItem[]> = {
  1: [
    { instruccion: 'Toca el perro',    opciones: [{emoji:'🐶',label:'Perro',correcto:true},{emoji:'🐱',label:'Gato',correcto:false},{emoji:'🐦',label:'Pájaro',correcto:false}] },
    { instruccion: 'Toca la manzana', opciones: [{emoji:'🍌',label:'Plátano',correcto:false},{emoji:'🍎',label:'Manzana',correcto:true},{emoji:'🍇',label:'Uvas',correcto:false}] },
    { instruccion: 'Toca el sol',      opciones: [{emoji:'🌙',label:'Luna',correcto:false},{emoji:'⭐',label:'Estrella',correcto:false},{emoji:'☀️',label:'Sol',correcto:true}] },
    { instruccion: 'Toca el carro',    opciones: [{emoji:'✈️',label:'Avión',correcto:false},{emoji:'🚗',label:'Carro',correcto:true},{emoji:'🚢',label:'Barco',correcto:false}] },
  ],
  2: [
    { instruccion: 'Toca el animal que vuela',       opciones: [{emoji:'🐶',label:'Perro',correcto:false},{emoji:'🐦',label:'Pájaro',correcto:true},{emoji:'🐢',label:'Tortuga',correcto:false},{emoji:'🐠',label:'Pez',correcto:false}] },
    { instruccion: 'Toca la fruta',                  opciones: [{emoji:'🥕',label:'Zanahoria',correcto:false},{emoji:'🍕',label:'Pizza',correcto:false},{emoji:'🍓',label:'Fresa',correcto:true},{emoji:'🎂',label:'Torta',correcto:false}] },
    { instruccion: 'Toca algo para leer',            opciones: [{emoji:'⚽',label:'Pelota',correcto:false},{emoji:'📖',label:'Libro',correcto:true},{emoji:'🎸',label:'Guitarra',correcto:false},{emoji:'🎨',label:'Pintura',correcto:false}] },
    { instruccion: 'Toca lo que necesitas para dormir', opciones: [{emoji:'🛏️',label:'Cama',correcto:true},{emoji:'🍴',label:'Tenedor',correcto:false},{emoji:'📱',label:'Celular',correcto:false},{emoji:'💡',label:'Lámpara',correcto:false}] },
  ],
  3: [
    { instruccion: 'Toca lo que haces cuando alguien está triste', opciones: [{emoji:'😂',label:'Reír solo',correcto:false},{emoji:'🤗',label:'Abrazar',correcto:true},{emoji:'🏃',label:'Huir',correcto:false},{emoji:'📺',label:'Ver TV',correcto:false}] },
    { instruccion: 'Toca lo que ayuda a crecer sano',               opciones: [{emoji:'🍬',label:'Dulces',correcto:false},{emoji:'🥦',label:'Verduras',correcto:true},{emoji:'📱',label:'Celular todo el día',correcto:false},{emoji:'💤',label:'No dormir',correcto:false}] },
    { instruccion: 'Toca lo que usas para comunicarte',             opciones: [{emoji:'📱',label:'Teléfono',correcto:true},{emoji:'🍴',label:'Tenedor',correcto:false},{emoji:'🛏️',label:'Cama',correcto:false},{emoji:'🔑',label:'Llave',correcto:false}] },
    { instruccion: 'Toca lo que haces para pedir ayuda',            opciones: [{emoji:'🏃',label:'Correr',correcto:false},{emoji:'🤫',label:'Callarte',correcto:false},{emoji:'✋',label:'Levantar la mano',correcto:true},{emoji:'😡',label:'Enojarte',correcto:false}] },
  ],
}
const ATENCION_D: Record<GameLevel, AtencItem[]> = {
  1: [
    { todos: ['🐶','🐱','🐦','🍎'], falta: '🐱', opciones: ['🐶','🐱','🐦','🍎'] },
    { todos: ['🍎','🍌','🍇','🍓'], falta: '🍇', opciones: ['🍎','🍌','🍇','🍓'] },
    { todos: ['⭐','🌙','☀️','🌈'], falta: '☀️', opciones: ['⭐','🌙','☀️','🌈'] },
    { todos: ['🚗','✈️','🚢','🚂'], falta: '🚢', opciones: ['🚗','✈️','🚢','🚂'] },
  ],
  2: [
    { todos: ['🐶','🐱','🐦','🐠','🐢','🦁'], falta: '🐢', opciones: ['🐢','🦁','🐶','🐱'] },
    { todos: ['🍎','🍌','🍇','🍓','🍊','🍋'], falta: '🍊', opciones: ['🍊','🍋','🍇','🍓'] },
    { todos: ['⭐','🌙','☀️','🌈','⚡','❄️'], falta: '🌈', opciones: ['🌈','⚡','⭐','❄️'] },
    { todos: ['📚','✏️','📐','🎨','📏','🔬'], falta: '📏', opciones: ['📚','📏','📐','🔬'] },
  ],
  3: [
    { todos: ['🐶','🐱','🐦','🐠','🐢','🦁','🐘','🦒','🦓'], falta: '🦁', opciones: ['🦓','🦁','🐘','🦒'] },
    { todos: ['🍎','🍌','🍇','🍓','🍊','🍋','🍑','🍒','🥝'], falta: '🍑', opciones: ['🍒','🍑','🥝','🍊'] },
    { todos: ['😊','😢','😡','😨','🤗','😮','😌','😤','😴'], falta: '😮', opciones: ['😮','😌','😤','😴'] },
    { todos: ['⭐','🌙','☀️','🌈','⚡','❄️','🌊','🌸','🍀'], falta: '🌊', opciones: ['🌊','🌸','⭐','🍀'] },
  ],
}

const ABA_TIPS: Record<GameId, string> = {
  emociones:    'Practica en casa señalando emociones en cuentos o películas. Nombrar lo que siente refuerza la regulación emocional.',
  vocabulario:  'Usa objetos reales del hogar. Señala y nombra juntos durante el día para consolidar el vocabulario aprendido.',
  instrucciones:'Da instrucciones simples en casa y celebra cada vez que las sigue. Aumenta la dificultad gradualmente.',
  atencion:     'Jueguen a "¿qué cambió?" en la habitación. Mover objetos y que los encuentre mejora la atención y memoria visual.',
}

function GameHub() {
  const [screen,   setScreen]   = useState<'select'|'level'|'play'|'done'>('select')
  const [gameId,   setGameId]   = useState<GameId>('emociones')
  const [level,    setLevel]    = useState<GameLevel>(1)
  const [qIndex,   setQIndex]   = useState(0)
  const [score,    setScore]    = useState(0)
  const [selected, setSelected] = useState<string|null>(null)
  const [atPhase,  setAtPhase]  = useState<'memorize'|'answer'>('memorize')
  const atTimer = useRef<number|null>(null)

  const getQs = (g: GameId, l: GameLevel): AnyQ[] => {
    if (g === 'emociones')    return EMOCIONES_D[l]
    if (g === 'vocabulario')  return VOCABULARIO_D[l]
    if (g === 'instrucciones')return INSTRUCCIONES_D[l]
    return ATENCION_D[l]
  }
  const questions = getQs(gameId, level)
  const total = questions.length
  const currentQ = questions[qIndex]

  const startGame = (g: GameId, l: GameLevel) => {
    setGameId(g); setLevel(l); setQIndex(0); setScore(0); setSelected(null); setAtPhase('memorize'); setScreen('play')
  }
  const handleAnswer = (answer: string, correct: string) => {
    if (selected !== null) return
    setSelected(answer)
    if (answer === correct) setScore(s => s + 1)
    setTimeout(() => {
      if (qIndex + 1 >= total) { setScreen('done') }
      else { setQIndex(q => q + 1); setSelected(null); setAtPhase('memorize') }
    }, 1200)
  }
  const reset = () => { setScreen('select'); setQIndex(0); setScore(0); setSelected(null); setAtPhase('memorize') }

  useEffect(() => {
    if (gameId === 'atencion' && screen === 'play' && atPhase === 'memorize') {
      const delay = level === 1 ? 3500 : level === 2 ? 2800 : 2200
      atTimer.current = window.setTimeout(() => setAtPhase('answer'), delay)
    }
    return () => { if (atTimer.current) window.clearTimeout(atTimer.current) }
  }, [gameId, screen, atPhase, qIndex, level])

  const gameInfo = GAMES_INFO.find(g => g.id === gameId)!

  const cardBtn = (bg: string, border: string, extra?: object) => ({
    border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2',cursive", fontWeight: 700, transition: 'all .25s',
    background: bg, borderRadius: 14, border: `2.5px solid ${border}`, color: '#1c1917', ...extra,
  })

  // ── SELECT ──────────────────────────────────────────────────────────────────
  if (screen === 'select') return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
      {GAMES_INFO.map(g => (
        <div key={g.id} onClick={() => { setGameId(g.id); setScreen('level') }}
          style={{ background: '#fff', border: `2.5px solid ${g.border}`, borderRadius: 20, padding: '22px 16px', cursor: 'pointer', transition: 'all .25s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${g.color}33` }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{g.emoji}</div>
          <h4 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 14, color: '#1c1917', marginBottom: 4 }}>{g.title}</h4>
          <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, marginBottom: 8 }}>{g.desc}</p>
          <div style={{ display: 'inline-block', background: g.bg, border: `1.5px solid ${g.border}`, color: g.color, borderRadius: 99, padding: '2px 10px', fontSize: 10, fontFamily: "'Baloo 2',cursive", fontWeight: 700 }}>{g.aba}</div>
        </div>
      ))}
    </div>
  )

  // ── LEVEL ───────────────────────────────────────────────────────────────────
  if (screen === 'level') return (
    <div>
      <button onClick={() => setScreen('select')} style={{ background: 'none', border: 'none', color: '#78716c', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>← Volver</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 30 }}>{gameInfo.emoji}</span>
        <h3 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 18, color: '#1c1917' }}>{gameInfo.title}</h3>
      </div>
      <div style={{ display: 'inline-block', background: gameInfo.bg, border: `1.5px solid ${gameInfo.border}`, color: gameInfo.color, borderRadius: 99, padding: '2px 12px', fontSize: 11, fontFamily: "'Baloo 2',cursive", fontWeight: 700, marginBottom: 16 }}>{gameInfo.aba}</div>
      <p style={{ fontSize: 13, color: '#78716c', marginBottom: 14 }}>Elige el nivel según las habilidades del niño/a:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {([1, 2, 3] as GameLevel[]).map(lv => {
          const nl = NIVEL_LABELS[lv]
          return (
            <div key={lv} onClick={() => startGame(gameId, lv)}
              style={{ background: '#fff', border: '2.5px solid #fef3c7', borderRadius: 16, padding: '15px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f97316'; (e.currentTarget as HTMLElement).style.background = '#fff7ed' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#fef3c7'; (e.currentTarget as HTMLElement).style.background = '#fff' }}>
              <span style={{ fontSize: 26 }}>{nl.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 14, color: '#1c1917' }}>Nivel {lv} — {nl.label}</div>
                <div style={{ fontSize: 11, color: '#a8a29e' }}>{nl.desc}</div>
              </div>
              <span style={{ color: '#f97316', fontSize: 18 }}>▶</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (screen === 'done') {
    const pct = Math.round((score / total) * 100)
    const medal = pct === 100 ? '🏆' : pct >= 60 ? '🌟' : '💪'
    const msg   = pct === 100 ? '¡Perfecto!' : pct >= 60 ? '¡Muy bien!' : '¡Sigue practicando!'
    const col   = pct === 100 ? '#10b981' : pct >= 60 ? '#f97316' : '#f43f5e'
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 60, marginBottom: 10 }}>{medal}</div>
        <h3 style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 22, color: col, marginBottom: 4 }}>{msg}</h3>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 12 }}>Aciertos: <strong style={{ color: col }}>{score} de {total}</strong></p>
        <div style={{ background: '#f5f5f4', borderRadius: 99, height: 10, maxWidth: 200, margin: '0 auto 20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${col},${col}88)`, borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
        <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 16, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
          <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#c2410c', marginBottom: 4 }}>💡 Consejo para papá y mamá:</p>
          <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.65 }}>{ABA_TIPS[gameId]}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => startGame(gameId, level)} style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🔄 Repetir</button>
          <button onClick={reset} style={{ padding: '11px 22px', background: '#fff', border: '2px solid #fed7aa', color: '#78350f', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🎮 Otros juegos</button>
        </div>
      </div>
    )
  }

  // ── PLAY ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Barra de progreso */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={reset} style={{ background: 'none', border: 'none', color: '#78716c', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✕ Salir</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#a8a29e' }}>{qIndex+1}/{total}</span>
          <div style={{ background: '#f5f5f4', borderRadius: 99, height: 7, width: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((qIndex+1)/total)*100}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
        </div>
        <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 13, color: '#10b981' }}>⭐ {score}</div>
      </div>

      {/* EMOCIONES */}
      {gameId === 'emociones' && (() => {
        const q = currentQ as EmoItem
        return (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, color: '#78716c', marginBottom: 14 }}>¿Cómo se siente este personaje?</p>
            <div style={{ fontSize: 88, marginBottom: 20, lineHeight: 1, filter: selected ? (selected === q.nombre ? 'drop-shadow(0 0 20px #10b98188)' : 'drop-shadow(0 0 20px #f43f5e88)') : 'none', transition: 'filter .3s' }}>{q.emoji}</div>
            <div style={{ display: 'grid', gridTemplateColumns: q.opciones.length === 3 ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 10 }}>
              {q.opciones.map(op => {
                const isSel = selected === op; const isOk = op === q.nombre
                const bg = selected ? (isOk ? '#dcfce7' : isSel ? '#fee2e2' : '#fff') : '#fff'
                const bdr = selected ? (isOk ? '#10b981' : isSel ? '#f43f5e' : '#fef3c7') : '#fef3c7'
                return <button key={op} onClick={() => handleAnswer(op, q.nombre)} style={{ padding: '13px 8px', fontSize: 14, borderRadius: 14, background: bg, border: `2.5px solid ${bdr}`, color: '#1c1917', cursor: selected ? 'default' : 'pointer', fontFamily: "'Baloo 2',cursive", fontWeight: 700, transition: 'all .25s' }}>{op}{selected && isOk && ' ✅'}{selected && isSel && !isOk && ' ❌'}</button>
              })}
            </div>
          </div>
        )
      })()}

      {/* VOCABULARIO */}
      {gameId === 'vocabulario' && (() => {
        const q = currentQ as VocabItem
        return (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, color: '#78716c', marginBottom: 14 }}>¿Cómo se llama esto?</p>
            <div style={{ fontSize: 84, marginBottom: 20, lineHeight: 1 }}>{q.emoji}</div>
            <div style={{ display: 'grid', gridTemplateColumns: q.opciones.length === 3 ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 10 }}>
              {q.opciones.map(op => {
                const isSel = selected === op; const isOk = op === q.palabra
                const bg = selected ? (isOk ? '#dcfce7' : isSel ? '#fee2e2' : '#fff') : '#fff'
                const bdr = selected ? (isOk ? '#10b981' : isSel ? '#f43f5e' : '#fef3c7') : '#fef3c7'
                return <button key={op} onClick={() => handleAnswer(op, q.palabra)} style={{ padding: '13px 8px', fontSize: 14, borderRadius: 14, background: bg, border: `2.5px solid ${bdr}`, color: '#1c1917', cursor: selected ? 'default' : 'pointer', fontFamily: "'Baloo 2',cursive", fontWeight: 700, transition: 'all .25s' }}>{op}{selected && isOk && ' ✅'}{selected && isSel && !isOk && ' ❌'}</button>
              })}
            </div>
          </div>
        )
      })()}

      {/* INSTRUCCIONES */}
      {gameId === 'instrucciones' && (() => {
        const q = currentQ as InstrItem
        const correctLabel = q.opciones.find(o => o.correcto)!.label
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff7ed', border: '2.5px solid #fed7aa', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
              <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 16, color: '#c2410c' }}>📢 {q.instruccion}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: q.opciones.length === 3 ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 12 }}>
              {q.opciones.map(op => {
                const isSel = selected === op.label
                const bg = selected ? (op.correcto ? '#dcfce7' : isSel ? '#fee2e2' : '#fff') : '#fff'
                const bdr = selected ? (op.correcto ? '#10b981' : isSel ? '#f43f5e' : '#fef3c7') : '#fef3c7'
                return (
                  <button key={op.label} onClick={() => handleAnswer(op.label, correctLabel)}
                    style={{ padding: '16px 8px', fontSize: 12, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: bg, border: `2.5px solid ${bdr}`, color: '#1c1917', cursor: selected ? 'default' : 'pointer', fontFamily: "'Baloo 2',cursive", fontWeight: 700, transition: 'all .25s' }}>
                    <span style={{ fontSize: 40 }}>{op.emoji}</span>{op.label}{selected && op.correcto && ' ✅'}{selected && isSel && !op.correcto && ' ❌'}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ATENCIÓN */}
      {gameId === 'atencion' && (() => {
        const q = currentQ as AtencItem
        if (atPhase === 'memorize') return (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, color: '#78716c', marginBottom: 4 }}>👀 ¡Memoriza bien lo que ves!</p>
            <p style={{ fontSize: 11, color: '#a8a29e', marginBottom: 16 }}>En unos segundos desaparecerá uno...</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.todos.length <= 4 ? 4 : 3},1fr)`, gap: 8, maxWidth: 320, margin: '0 auto' }}>
              {q.todos.map((em, i) => <div key={i} style={{ background: '#fff', border: '2.5px solid #fef3c7', borderRadius: 12, padding: '12px 6px', textAlign: 'center', fontSize: q.todos.length > 6 ? 26 : 32 }}>{em}</div>)}
            </div>
          </div>
        )
        const shown = q.todos.filter(e => e !== q.falta)
        return (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 15, color: '#1c1917', marginBottom: 12 }}>🔍 ¿Qué elemento falta?</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.todos.length <= 4 ? 4 : 3},1fr)`, gap: 8, maxWidth: 320, margin: '0 auto 16px' }}>
              {shown.map((em, i) => <div key={i} style={{ background: '#fff', border: '2.5px solid #fef3c7', borderRadius: 12, padding: '12px 6px', textAlign: 'center', fontSize: q.todos.length > 6 ? 26 : 32 }}>{em}</div>)}
              <div style={{ background: '#f5f5f4', border: '2.5px dashed #d4d4d4', borderRadius: 12, padding: '12px 6px', textAlign: 'center', fontSize: 22 }}>❓</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, maxWidth: 240, margin: '0 auto' }}>
              {q.opciones.map(op => {
                const isSel = selected === op; const isOk = op === q.falta
                const bg = selected ? (isOk ? '#dcfce7' : isSel ? '#fee2e2' : '#fff') : '#fff'
                const bdr = selected ? (isOk ? '#10b981' : isSel ? '#f43f5e' : '#fef3c7') : '#fef3c7'
                return <button key={op} onClick={() => handleAnswer(op, q.falta)} style={{ padding: '14px 8px', fontSize: q.todos.length > 6 ? 28 : 36, borderRadius: 14, background: bg, border: `2.5px solid ${bdr}`, cursor: selected ? 'default' : 'pointer', fontFamily: "'Baloo 2',cursive", fontWeight: 700, transition: 'all .25s' }}>{op}</button>
              })}
            </div>
          </div>
        )
      })()}
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

  // ── JUEGO DE MEMORIA ──────────────────────────────────────────
  type GameCard = { id: number; emoji: string; pairId: number }
  const EMOJIS = ['🐶','🐱','🦁','🐸','🦋','🌈','⭐','🍎']
  const initCards = (): GameCard[] => {
    const pairs = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({ id: i, emoji, pairId: EMOJIS.indexOf(emoji) }))
    return pairs.sort(() => Math.random() - 0.5)
  }
  const [gameCards, setGameCards] = useState<GameCard[]>(initCards)
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [gameMoves, setGameMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const lockRef = useRef(false)

  const handleCardClick = (card: GameCard) => {
    if (lockRef.current) return
    if (flippedIds.includes(card.id)) return
    if (matchedPairs.includes(card.pairId)) return
    const newFlipped = [...flippedIds, card.id]
    setFlippedIds(newFlipped)
    if (newFlipped.length === 2) {
      setGameMoves(m => m + 1)
      const [a, b] = newFlipped.map(id => gameCards.find(c => c.id === id)!)
      if (a.pairId === b.pairId) {
        const newMatched = [...matchedPairs, a.pairId]
        setMatchedPairs(newMatched)
        setFlippedIds([])
        if (newMatched.length === EMOJIS.length) setGameWon(true)
      } else {
        lockRef.current = true
        setTimeout(() => { setFlippedIds([]); lockRef.current = false }, 900)
      }
    }
  }

  const resetGame = () => {
    setGameCards(initCards())
    setFlippedIds([])
    setMatchedPairs([])
    setGameMoves(0)
    setGameWon(false)
    lockRef.current = false
  }

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

  const waMsg = encodeURIComponent('Hola, vi su página web y me interesa conocer más sobre sus servicios de terapia para mi hijo/a.')
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
        .lp-stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; }
        @media(min-width:640px){ .lp-stats-inner { grid-template-columns: repeat(4,1fr); } }

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

        /* ─ FLOATING SHAPES ─ */
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
        .lp-map-section { position: relative; }
        .lp-map-card { background: #fff; padding: 28px; border: 2px solid #fef3c7; }
@media(min-width:640px){ .lp-map-section { height: 500px; } .lp-map-card { position: absolute; top: 50%; left: 48px; transform: translateY(-50%); border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.15); max-width: 360px; } }

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

        /* ─ ARIA FLOAT ─ */
        @keyframes ariaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ariaLed { 0%,100%{opacity:1} 50%{opacity:.25} }

        /* ─ ARIA CARDS GRID ─ */
        .aria-cards-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media(min-width:900px){ .aria-cards-grid { grid-template-columns: 1fr; } }

        /* ─ ARIA LAYOUT ─ */
        .lp-ia-layout { display: grid; gap: 56px; align-items: center; }
        @media(min-width:900px){ .lp-ia-layout { grid-template-columns: 1fr 420px; } }

        /* ─ FLOATING SHAPES ─ */
        @keyframes shapeFloat1 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-16px) rotate(10deg)} }
        @keyframes shapeFloat2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-12px) rotate(-8deg)} }

        /* ─ MOBILE FIXES ─ */
        @media(max-width:639px){
          .lp-hero { padding: 70px 16px 50px; min-height: 100svh; overflow: hidden; }
          .lp-hero-inner { gap: 32px; }
          .lp-ia { padding: 72px 16px; }
          .lp-ia-layout { gap: 32px; }
          .lp-section { padding: 64px 16px; }
          .lp-stats { padding: 40px 16px; }
          .lp-footer { padding: 48px 16px 24px; }

          /* Map: stack vertically on mobile */
          .lp-map-section { height: auto; min-height: 0; }
          .lp-map-card { position: static; transform: none; margin: 0; border-radius: 0; box-shadow: 0 -4px 20px rgba(0,0,0,.08); max-width: 100%; width: 100%; }

          .lp-modal { padding: 8px; }
          .lp-modal-x { top: 8px; right: 8px; }
          .lp-nav-inner { height: 60px; }

          /* ARIA section: 2-col cards on mobile, hide chat panel */
          .aria-cards-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .aria-card { flex-direction: column !important; gap: 10px !important; padding: 14px !important; }
          .aria-chat-panel { display: none !important; }

          /* Nav button always visible */

          /* Gallery thumbs: 2 cols on very small screens */
          .lp-thumbs { grid-template-columns: repeat(2,1fr) !important; }
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
            <a href="#juegos">🎮 Juegos</a>
            <a href="#galeria">Galería</a>
            <a href="#faq">Preguntas</a>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/login" className="lp-btn-fill">Ingresar</Link>
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
                <Phone size={16} /> Contáctanos
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
            <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 28px 72px rgba(0,0,0,.14)', aspectRatio: '4/3', position: 'relative', border: '5px solid #fff', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0deg)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <Image src="/images/hero-image.jpg?v=2" alt="Niños en terapia ABA" fill style={{ objectFit: 'cover' }} priority unoptimized />
            </div>
            <div style={{ position: 'absolute', top: 18, left: 10, background: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 28px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#1c1917', border: '2px solid #fef3c7' }}>
              <div style={{ width: 30, height: 30, background: '#fef9c3', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Brain size={15} color="#d97706" /></div>
              Metodología ABA
            </div>
            <div style={{ position: 'absolute', bottom: 18, right: 10, background: '#fff', borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 28px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 12, color: '#1c1917', border: '2px solid #d1fae5' }}>
              <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} /> 100% Personalizado
            </div>
          </div>
        </div>
      </header>

      {/* STATS */}
      <div ref={statsRef} style={{ background: '#fff', borderTop: '1.5px solid #fef3c7', borderBottom: '1.5px solid #fef3c7', padding: '48px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }} className="lp-stats-inner">
          {[
            { num: `+${count50}`, lbl: 'Familias felices', icon: '👨‍👩‍👧' },
            { num: '100%', lbl: 'Personalizado', icon: '🎯' },
            { num: 'ABA', lbl: 'Metodología', icon: '🧠' },
            { num: 'Pisco', lbl: 'Sede Central', icon: '📍' },
          ].map(({ num, lbl, icon }) => (
            <div key={lbl} style={{ textAlign: 'center', padding: '24px 16px', background: '#fff7ed', borderRadius: 20, border: '2px solid #fed7aa' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 38, fontWeight: 800, color: '#f97316', lineHeight: 1, marginBottom: 6 }}>{num}</div>
              <div style={{ fontSize: 12, color: '#a8a29e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div>
            </div>
          ))}
        </div>
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

          {/* ── MINI-JUEGO PARA NIÑOS ───────────────────────── */}
          <div style={{ marginTop: 64, background: 'linear-gradient(135deg,#fff7ed 0%,#fef9f0 100%)', border: '3px dashed #fed7aa', borderRadius: 28, padding: '40px 28px', position: 'relative', overflow: 'hidden' }}>
            {/* Decorative shapes */}
            <div style={{ position:'absolute', top:-28, right:-28, width:110, height:110, background:'#fef08a', borderRadius:'50%', opacity:.35, pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, background:'#bbf7d0', borderRadius:'50%', opacity:.4, pointerEvents:'none' }} />

            <div style={{ textAlign:'center', marginBottom:28, position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#fff', border:'2.5px solid #fed7aa', color:'#c2410c', borderRadius:99, padding:'5px 18px', fontFamily:"'Baloo 2',cursive", fontSize:12, fontWeight:700, marginBottom:12 }}>
                🎮 Juego Educativo para los Peques
              </div>
              <h3 style={{ fontFamily:"'Baloo 2',cursive", fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'#1c1917', marginBottom:8 }}>
                ¡Juego de Memoria! 🧠✨
              </h3>
              <p style={{ color:'#78716c', fontSize:14, lineHeight:1.7, maxWidth:420, margin:'0 auto' }}>
                Mientras usas la plataforma, ¡tu hijo/a puede jugar! Voltea las tarjetas y encuentra los pares iguales.
              </p>
              <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:14, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:13, color:'#78716c' }}>
                  🎯 Movimientos: <span style={{ color:'#f97316', fontSize:16 }}>{gameMoves}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:13, color:'#78716c' }}>
                  ✅ Pares: <span style={{ color:'#10b981', fontSize:16 }}>{matchedPairs.length}/{EMOJIS.length}</span>
                </div>
              </div>
            </div>

            {gameWon ? (
              <div style={{ textAlign:'center', padding:'32px 20px', position:'relative', zIndex:1 }}>
                <div style={{ fontSize:64, marginBottom:12, animation:'ariaFloat 2s ease-in-out infinite' }}>🏆</div>
                <h3 style={{ fontFamily:"'Baloo 2',cursive", fontWeight:800, fontSize:24, color:'#f97316', marginBottom:6 }}>¡Ganaste! 🎉</h3>
                <p style={{ color:'#78716c', fontSize:14, marginBottom:20 }}>Completaste el juego en <strong>{gameMoves} movimientos</strong>. ¡Excelente memoria!</p>
                <button onClick={resetGame} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff', border:'none', borderRadius:99, fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 6px 20px rgba(249,115,22,.35)' }}>
                  🔄 Jugar de nuevo
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(8px,2vw,14px)', maxWidth:480, margin:'0 auto', position:'relative', zIndex:1 }}>
                {gameCards.map(card => {
                  const isFlipped = flippedIds.includes(card.id) || matchedPairs.includes(card.pairId)
                  const isMatched = matchedPairs.includes(card.pairId)
                  return (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      style={{
                        aspectRatio:'1', borderRadius:16,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'clamp(22px,5vw,34px)',
                        cursor: isMatched ? 'default' : 'pointer',
                        userSelect:'none',
                        transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
                        transform: isFlipped ? 'rotateY(0deg) scale(1)' : 'rotateY(0deg)',
                        background: isMatched
                          ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)'
                          : isFlipped
                            ? '#fff'
                            : 'linear-gradient(135deg,#f97316,#ea580c)',
                        border: isMatched
                          ? '3px solid #10b981'
                          : isFlipped
                            ? '3px solid #fed7aa'
                            : '3px solid #fb923c',
                        boxShadow: isMatched
                          ? '0 4px 16px rgba(16,185,129,.2)'
                          : isFlipped
                            ? '0 8px 24px rgba(249,115,22,.2)'
                            : '0 4px 14px rgba(249,115,22,.25)',
                      }}
                    >
                      {isFlipped
                        ? <span style={{ filter: isMatched ? 'none' : 'none' }}>{card.emoji}</span>
                        : <span style={{ fontSize:'clamp(18px,4vw,26px)', filter:'brightness(0) invert(1)', opacity:.6 }}>❓</span>
                      }
                    </div>
                  )
                })}
              </div>
            )}

            {!gameWon && (
              <div style={{ textAlign:'center', marginTop:22, position:'relative', zIndex:1 }}>
                <button onClick={resetGame} style={{ background:'none', border:'2px solid #fed7aa', color:'#c2410c', borderRadius:99, padding:'7px 20px', fontFamily:"'Baloo 2',cursive", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#fff7ed' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='none' }}>
                  🔄 Reiniciar juego
                </button>
              </div>
            )}
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

      {/* ── ASISTENTE ARIA ─────────────────────────────────────── */}
      <section id="aria" style={{ background: '#fff', padding: '72px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle bg pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(249,115,22,.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        {/* Orange glow top right */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '2px solid #fed7aa', color: '#c2410c', borderRadius: 99, padding: '5px 16px', fontFamily: "'Baloo 2',cursive", fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              <Sparkles size={13} /> Inteligencia Artificial
            </div>
            <h2 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 'clamp(26px,4vw,46px)', fontWeight: 800, color: '#1c1917', lineHeight: 1.15, marginBottom: 12 }}>
              Conoce a <span style={{ color: '#f97316' }}>ARIA</span>
            </h2>
            <p style={{ color: '#78716c', fontSize: 15, lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
              Tu asistente clínica inteligente. Aprende de los registros diarios de tu hijo y te acompaña 24/7 entre sesiones.
            </p>
          </div>

          {/* Layout: cards left | chat right */}
          <div style={{ display: 'grid', gap: 48, alignItems: 'center' }} className="lp-ia-layout">
            {/* LEFT: Feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Mobile: 2-col grid | Desktop: stacked list */}
              <div className="aria-cards-grid">
                {[
                  { icon: <LineChart size={18} color="#f97316" />, bg: '#fff7ed', border: '#fed7aa', title: 'Seguimiento Preciso', desc: 'ARIA analiza tendencias conductuales sesión a sesión.' },
                  { icon: <MessageSquareHeart size={18} color="#10b981" />, bg: '#f0fdf4', border: '#bbf7d0', title: 'Apoyo 24/7', desc: 'Resúmenes sencillos y recomendaciones para reforzar en casa.' },
                  { icon: <Brain size={18} color="#8b5cf6" />, bg: '#faf5ff', border: '#e9d5ff', title: 'Progreso Visible', desc: 'Gráficos del avance en tiempo real de cada sesión.' },
                  { icon: <Zap size={18} color="#f59e0b" />, bg: '#fffbeb', border: '#fde68a', title: 'Respuestas Rápidas', desc: 'Pregúntale a ARIA sobre actividades o dudas al instante.' },
                ].map(({ icon, bg, border, title, desc }) => (
                  <div key={title} className="aria-card" style={{ background: '#fff', border: `2px solid ${border}`, borderRadius: 16, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all .3s', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(249,115,22,.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.04)'; }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                    <div>
                      <h4 style={{ fontFamily: "'Baloo 2',cursive", color: '#1c1917', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</h4>
                      <p style={{ color: '#78716c', fontSize: 12, lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <Link href="/login?mode=signup" className="btn-orange" style={{ display: 'inline-flex' }}>
                  Habla con ARIA ahora <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* RIGHT: Chat illustration — hidden on mobile via CSS */}
            <div className="aria-chat-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ background: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: 28, padding: '28px 24px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.06)' }}>
                {/* Header bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,.3)' }}>
                    <Brain size={22} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 15, color: '#1c1917' }}>ARIA</p>
                    <p style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> En línea · 24/7
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                    {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                  </div>
                </div>
                <ARIAChatIllustration />
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

      {/* GALERÍA DE VIDEOS — OCULTO TEMPORALMENTE */}
      {false && <section className="lp-section" style={{ background: '#fff7ed' }}>
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
      </section>}

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
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f97316', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Contáctanos <ArrowRight size={15} /></a>
            </div>
            <div className="lp-svc-card featured">
              <div style={{ position: 'absolute', top: 16, right: 16, background: '#fbbf24', color: '#1c1917', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontFamily: "'Baloo 2',cursive" }}>Popular</div>
              <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Users size={26} color="#fff" /></div>
              <h3 style={{ fontFamily: "'Baloo 2',cursive", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Habilidades Sociales</h3>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, lineHeight: 1.85, marginBottom: 20 }}>Talleres grupales donde los niños aprenden a interactuar en un entorno seguro y lúdico.</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff', fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Contáctanos <ArrowRight size={15} /></a>
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

      {/* EQUIPO — OCULTO TEMPORALMENTE */}
      {false && <section className="lp-section" style={{ background: '#fff7ed' }}>
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
      </section>}

      {/* ── JUEGOS ABA ─────────────────────────────────────────────────── */}
      <section id="juegos" style={{ background: 'linear-gradient(160deg,#fff7ed 0%,#fffbf5 60%,#f0fdf4 100%)', padding: '80px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative bg dots */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(249,115,22,.05) 2px,transparent 2px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, background: 'radial-gradient(circle,rgba(251,191,36,.12),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(16,185,129,.08),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="lp-inner" style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-tag"><Brain size={12} /> Juegos Terapéuticos</div>
            <h2 className="lp-h2">Aprende jugando 🎮</h2>
            <p className="lp-sub" style={{ margin: '0 auto' }}>Juegos diseñados con metodología ABA para trabajar emociones, vocabulario, atención e instrucciones. Cada juego se adapta al nivel del niño/a.</p>
          </div>

          {/* Layout: descripción izq | juego der */}
          <div style={{ display: 'grid', gap: 40, alignItems: 'start' }} className="lp-ia-layout">
            {/* LEFT: columna informativa */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {GAMES_INFO.map(g => (
                  <div key={g.id} style={{ background: '#fff', border: `2px solid ${g.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, background: g.bg, border: `1.5px solid ${g.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{g.emoji}</div>
                    <div>
                      <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 13, color: '#1c1917', marginBottom: 2 }}>{g.title}</div>
                      <div style={{ fontSize: 11, color: '#78716c' }}>{g.desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: g.bg, border: `1.5px solid ${g.border}`, color: g.color, borderRadius: 99, padding: '2px 8px', fontSize: 9, fontFamily: "'Baloo 2',cursive", fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>ABA</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 16, padding: '18px 20px' }}>
                <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 13, color: '#c2410c', marginBottom: 6 }}>🎯 ¿Para qué sirve?</p>
                <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.7 }}>Cada juego refuerza habilidades trabajadas en las sesiones de terapia. Los 3 niveles se adaptan a la etapa del desarrollo del niño/a, desde los 2 años hasta los 12+.</p>
              </div>
            </div>

            {/* RIGHT: panel del juego */}
            <div style={{ background: '#fff', border: '2.5px solid #fef3c7', borderRadius: 28, padding: '28px 24px', boxShadow: '0 20px 60px rgba(249,115,22,.08)' }}>
              {/* Header del panel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: '1.5px solid #fef3c7' }}>
                <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎮</div>
                <div>
                  <p style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: 15, color: '#1c1917' }}>Zona de Juegos</p>
                  <p style={{ fontSize: 11, color: '#a8a29e' }}>Elige un juego para comenzar</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                  {['#ef4444','#f59e0b','#22c55e'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
              </div>
              <GameHub />
            </div>
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
            { q: '¿Cómo puedo empezar?', a: 'Es muy sencillo. Contáctanos por WhatsApp y nuestro equipo te orientará sobre el proceso de admisión y los servicios que mejor se adaptan a las necesidades de tu hijo/a.' },
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
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 24 }}>Escríbenos hoy y da el primer paso hacia el desarrollo de tu hijo/a.</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px', background: '#fff', color: '#f97316', borderRadius: 99, fontFamily: "'Baloo 2',cursive", fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <Phone size={17} /> Hablar con un especialista
            </a>
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="ubicacion" className="lp-map-section">
        <div style={{ position: 'relative', height: 340 }}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.4229091779425!2d-76.0288421240214!3d-13.692817174731204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91104331c0093305%3A0x21adbeb7d8eb168d!2sC.%20Victor%20Raul%20Haya%20de%20la%20Torre%2C%2011641!5e0!3m2!1ses-419!2spe!4v1770256602309!5m2!1ses-419!2spe"
            width="100%" height="100%" style={{ border: 0, position: 'absolute', inset: 0 }} allowFullScreen loading="lazy" title="Ubicación" />
        </div>
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
