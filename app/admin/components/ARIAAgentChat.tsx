'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Loader2, User, Brain, BookOpen
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  fuentes?: string[]
}

interface ARIAAgentChatProps {
  userId: string
  childId?: string
  childName?: string
  contexto?: string
  compact?: boolean
}

export default function ARIAAgentChat({
  userId, childId, childName, contexto = 'general', compact = false
}: ARIAAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [sugerencias] = useState([
    childId ? `¿Cómo va el progreso general de ${childName || 'este paciente'}?` : '¿Cuáles son los mejores reforzadores para TEA no verbal?',
    '¿Qué dice Malott sobre extinción de escape?',
    childId ? `¿Qué programas recomiendas para ${childName || 'este paciente'}?` : '¿Cómo aplico el modelo ético IBAO ante un dilema?',
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: childId
        ? `¡Hola! 👋 Soy **ARIA**. Estoy revisando el expediente de **${childName || 'tu paciente'}** y tengo acceso a todo su historial, programas ABA y evaluaciones previas.\n\n¿En qué te puedo ayudar hoy?`
        : `¡Hola! 👋 Soy **ARIA**, tu asistente clínica de **Vanty**.\n\nEstoy entrenada en evaluación e intervención de población infantil, con base en **ABA**, ética clínica, neuropsicología y educación especial.\n\n¿En qué puedo ayudarte hoy? 🧠`,
      timestamp: new Date().toISOString(),
    }])
  }, [childId, childName])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setLoading(true)

    const userMessage: Message = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch('/api/agente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: msg, childId, userId, conversacionId, contexto }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setConversacionId(data.conversacionId)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.respuesta,
        timestamp: new Date().toISOString(),
        fuentes: data.fuentesUsadas,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, childId, userId, conversacionId, contexto])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div
      className={`flex flex-col rounded-3xl overflow-hidden border ${compact ? 'h-[500px]' : 'h-[680px]'}`}
      style={{
        background: 'var(--card)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center">
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            ARIA — Asistente Clínico IA
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[9px] font-black">BETA</span>
          </h3>
          <p className="text-violet-200 text-[10px]">
            {childId ? `Caso activo: ${childName || 'Paciente'}` : 'Conocimiento: Malott · DSM-5 · IBAO · LuTr'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white/70 text-[10px] font-bold">Activo</span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ background: 'var(--background)' }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-violet-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Brain size={14} className="text-violet-500" />
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2"
              style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}
            >
              <Loader2 size={14} className="animate-spin text-violet-500" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>ARIA está pensando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      {messages.length <= 1 && (
        <div
          className="px-4 pb-3"
          style={{ background: 'var(--background)', borderTop: '1px solid var(--card-border)' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 mt-3" style={{ color: 'var(--text-muted)' }}>
            Preguntas sugeridas
          </p>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-left leading-tight transition-all hover:border-violet-400 hover:text-violet-500"
                style={{
                  background: 'var(--muted-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className="p-4 flex-shrink-0"
        style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--card-border)',
        }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Pregúntale a ARIA sobre el caso, protocolos ABA, DSM-5..."
            className="flex-1 p-3 rounded-2xl text-sm resize-none outline-none transition-all leading-relaxed max-h-28 focus:ring-2 focus:ring-violet-400"
            style={{
              background: 'var(--input-bg)',
              border: '1.5px solid var(--input-border)',
              color: 'var(--text-primary)',
              minHeight: '44px',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-violet-600 text-white rounded-2xl flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          ARIA usa Malott, DSM-5 TR, IBAO Guidelines y el historial del paciente
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          {i < arr.length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(139,92,246,0.15)' }}
      >
        {isUser
          ? <User size={14} className="text-indigo-500" />
          : <Brain size={14} className="text-violet-500" />
        }
      </div>
      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? {
                background: '#6d28d9',
                color: '#ffffff',
                borderRadius: '1rem 0.25rem 1rem 1rem',
              }
            : {
                background: 'var(--muted-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.25rem 1rem 1rem 1rem',
              }
          }
        >
          {formatContent(message.content)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {new Date(message.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.fuentes && message.fuentes.length > 0 && (
            <div className="flex gap-1">
              {message.fuentes.map((f, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30 font-bold flex items-center gap-1">
                  <BookOpen size={8} /> {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
