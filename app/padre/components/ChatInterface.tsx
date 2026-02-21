'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Sparkles, Heart, MessageCircle } from 'lucide-react'

// ── Detección de carga emocional ────────────────────────────────────────────
const EMOTIONAL_KEYWORDS = [
  'cansado', 'cansada', 'agotado', 'agotada', 'frustrado', 'frustrada',
  'triste', 'llorar', 'lloro', 'no sé qué hacer', 'no sé que hacer',
  'no avanza', 'no mejora', 'sin esperanza', 'desesperado', 'desesperada',
  'culpa', 'culpable', 'mi culpa', 'difícil', 'muy difícil', 'no puedo',
  'rendirme', 'rendir', 'solo', 'sola', 'nadie entiende', 'apoyo emocional',
  'necesito ayuda', 'estoy mal', 'me siento mal', 'deprimido', 'deprimida',
  'preocupado', 'preocupada', 'angustiado', 'angustiada', 'miedo',
]

function detectsEmotion(text: string): boolean {
  const lower = text.toLowerCase()
  return EMOTIONAL_KEYWORDS.some(kw => lower.includes(kw))
}

function getEmotionalPrefix(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('cansad') || lower.includes('agotad'))
    return '💙 Entiendo que estás cansado/a, y eso es completamente válido. Acompañar a un hijo en este proceso requiere muchísima energía. Primero quiero que sepas que no estás solo/a en esto.\n\n'
  if (lower.includes('culpa') || lower.includes('culpable'))
    return '💙 Quiero que sepas algo importante: no hay culpa aquí. Eres un papá/mamá que está buscando lo mejor para su hijo/a, y eso ya dice mucho de ti. Cuídate a ti también.\n\n'
  if (lower.includes('no avanza') || lower.includes('no mejora'))
    return '💙 Lo que sientes es muy comprensible. El progreso en terapia ABA no siempre es lineal, pero sí real. Hay avances que a veces no vemos en el día a día pero que se acumulan.\n\n'
  if (lower.includes('frustrad') || lower.includes('desesperado') || lower.includes('desesperada'))
    return '💙 Tu frustración tiene todo el sentido. Es un proceso largo y exige mucho de toda la familia. Gracias por seguir adelante a pesar de eso.\n\n'
  if (lower.includes('solo') || lower.includes('sola') || lower.includes('nadie entiende'))
    return '💙 Quiero que sepas que no estás solo/a. Todo el equipo de Jugando Aprendo está aquí para acompañarte, no solo a tu hijo, sino también a ti como familia.\n\n'
  return '💙 Escucho cómo te sientes, y es completamente válido sentirse así. Estoy aquí para apoyarte en este proceso.\n\n'
}

// ── Componente principal ─────────────────────────────────────────────────────
function ChatInterface({ childId, childName }: any) {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'ai',
      text: `¡Hola! 👋 Soy tu Asistente Clínico Inteligente. He revisado el historial completo de ${childName || 'tu hijo/a'} y estoy aquí para apoyarte en todo momento.\n\n¿En qué puedo ayudarte hoy? Puedo:\n• Explicarte los reportes de las sesiones\n• Darte consejos para actividades en casa\n• Responder dudas sobre el desarrollo\n• Escucharte y apoyarte emocionalmente`,
      type: 'welcome',
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [wellbeingShown, setWellbeingShown] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const quickQuestions = [
    '¿Cómo le fue en la última sesión?',
    'Dame consejos para casa',
    '¿Qué objetivos está trabajando?',
    'Necesito apoyo emocional',
  ]

  const send = async (customText?: string) => {
    const txt = customText || input
    if (!txt.trim()) return

    if (!childId) {
      setMessages(p => [...p, { role: 'ai', text: '⚠️ Un momento, estoy cargando el perfil completo del paciente para poder ayudarte mejor...' }])
      return
    }

    const isEmotional = detectsEmotion(txt)
    setMessages(p => [...p, { role: 'user', text: txt }])
    setInput('')
    setTyping(true)

    // Si hay carga emocional, primero mostramos validación inmediata
    if (isEmotional) {
      const emotionalPrefix = getEmotionalPrefix(txt)
      await new Promise(r => setTimeout(r, 600))
      setMessages(p => [...p, {
        role: 'ai',
        text: emotionalPrefix + 'Déjame revisar el historial clínico para darte información más precisa...',
        type: 'emotional',
      }])
      await new Promise(r => setTimeout(r, 1000))
    }

    try {
      const res = await fetch('/api/parent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: isEmotional
            ? `${txt}\n\n[INSTRUCCIÓN SISTEMA: El padre/madre está experimentando carga emocional. Primero valida sus sentimientos con calidez genuina antes de dar información clínica. Usa un tono cálido, humano y esperanzador.]`
            : txt,
          childId,
          childName,
        }),
      })
      const data = await res.json()
      let aiResponse = data.text || 'Lo siento, no pude procesar tu pregunta. ¿Podrías reformularla?'

      // Si ya mostramos el prefijo emocional, quitamos el duplicado del API
      if (isEmotional) {
        setMessages(p => {
          const copy = [...p]
          // Reemplazar el mensaje de "espera" por la respuesta real
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].type === 'emotional') {
              copy[i] = { role: 'ai', text: getEmotionalPrefix(txt) + aiResponse, type: 'emotional' }
              break
            }
          }
          return copy
        })
      } else {
        setMessages(p => [...p, { role: 'ai', text: aiResponse }])
      }

      // Wellbeing check: ofrecer mini-encuesta tras 3 mensajes del usuario
      const userMsgCount = messages.filter(m => m.role === 'user').length
      if (userMsgCount >= 2 && !wellbeingShown) {
        setWellbeingShown(true)
        setTimeout(() => {
          setMessages(p => [...p, {
            role: 'ai',
            text: '—\n📋 Antes de continuar, una pregunta rápida:\n¿Cómo te has sentido tú esta semana acompañando el proceso de tu hijo/a?',
            type: 'wellbeing',
          }])
        }, 2000)
      }

    } catch {
      setMessages(p => [...p, { role: 'ai', text: '❌ Disculpa, hubo un problema de conexión. Por favor, intenta nuevamente en unos momentos.' }])
    } finally {
      setTyping(false)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([{
      role: 'ai',
      text: `✨ He actualizado mi información con el historial de ${childName || 'tu hijo/a'}. Ahora puedo ayudarte de manera más personalizada. ¿Qué necesitas saber?`,
    }])
    setWellbeingShown(false)
  }, [childId])

  const wellbeingOptions = ['😊 Bien, con energía', '😐 Regular, algo cansado/a', '😔 Difícil, necesito apoyo']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeSlideUp .3s ease' }}>
            {m.role === 'ai' && m.type === 'wellbeing' ? (
              // ── Wellbeing check card ──
              <div style={{ maxWidth: '85%', background: 'linear-gradient(135deg, #fce7f3, #ede9fe)', border: '1px solid #f9a8d4', borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Heart size={16} color="#be185d" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: '.05em' }}>Check de bienestar</span>
                </div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14, fontWeight: 500 }}>
                  ¿Cómo te has sentido tú esta semana acompañando el proceso de tu hijo/a?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {wellbeingOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => send(opt)}
                      style={{ textAlign: 'left', padding: '10px 16px', background: '#fff', border: '2px solid #f3e8ff', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.background = '#7c3aed'; (e.target as HTMLElement).style.color = '#fff' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.background = '#fff'; (e.target as HTMLElement).style.color = '#374151' }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : m.role === 'ai' && m.type === 'emotional' ? (
              // ── Emotional response card ──
              <div style={{ maxWidth: '85%', background: '#fff', border: '2px solid #bfdbfe', borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(59,130,246,.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #eff6ff' }}>
                  <Heart size={14} color="#3b82f6" fill="#3b82f6" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.05em' }}>Con todo mi apoyo</span>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#374151', lineHeight: 1.8, fontWeight: 500 }}>{m.text}</p>
              </div>
            ) : (
              // ── Normal message ──
              <div style={{
                maxWidth: '85%',
                padding: 20,
                borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                  : '#fff',
                color: m.role === 'user' ? '#fff' : '#374151',
                boxShadow: m.role === 'user' ? '0 4px 16px rgba(37,99,235,.3)' : '0 4px 16px rgba(0,0,0,.06)',
                border: m.role === 'ai' ? '1px solid rgba(226,232,240,.6)' : 'none',
              }}>
                {m.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ padding: 6, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', borderRadius: 8 }}>
                      <Sparkles size={13} color="#6366f1" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>Asistente IA</span>
                  </div>
                )}
                <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, fontWeight: 500 }}>{m.text}</p>
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 4 }}>
            <div style={{ padding: 12, background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,.08)', border: '1px solid #e2e8f0' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>Analizando historial clínico...</p>
              <p style={{ fontSize: 10, color: '#9ca3af' }}>Esto puede tomar unos segundos</p>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Preguntas rápidas */}
      {messages.length <= 2 && !typing && (
        <div style={{ padding: '0 24px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Preguntas frecuentes:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                style={{
                  padding: '8px 14px',
                  background: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#4b5563',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#6366f1'; (e.target as HTMLElement).style.color = '#6366f1' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#e5e7eb'; (e.target as HTMLElement).style.color = '#4b5563' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: 16, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(226,232,240,.6)', display: 'flex', gap: 12, boxShadow: '0 -4px 20px rgba(0,0,0,.04)' }}>
        <input
          style={{ flex: 1, background: '#f8fafc', borderRadius: 30, padding: '14px 24px', fontSize: 14, fontWeight: 500, outline: 'none', border: '2px solid transparent', transition: 'all .2s', fontFamily: 'inherit' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !typing && send()}
          onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#6366f1' }}
          onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = 'transparent' }}
          placeholder={`Pregúntame sobre ${childName || 'tu hijo/a'}...`}
          disabled={typing}
        />
        <button
          onClick={() => send()}
          disabled={typing || !input.trim()}
          style={{
            padding: 14,
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: '#fff',
            borderRadius: 30,
            border: 'none',
            cursor: 'pointer',
            opacity: typing || !input.trim() ? 0.5 : 1,
            transition: 'all .2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99,102,241,.4)',
          }}
        >
          <Send size={20} />
        </button>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}

export default ChatInterface
