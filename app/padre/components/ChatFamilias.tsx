'use client'
// app/padre/components/ChatFamilias.tsx
// Chat grupal privado: padre ↔ admin + especialistas del centro

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageCircle, Users, CheckCheck, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Msg {
  id: string
  content: string
  sender_id: string
  sender_role: string
  sender_name: string
  read_by: string[]
  created_at: string
  message_type: string
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  jefe:         { label: 'Dirección',   color: '#7c3aed', bg: '#f5f3ff' },
  admin:        { label: 'Admin',       color: '#2563eb', bg: '#eff6ff' },
  especialista: { label: 'Terapeuta',   color: '#059669', bg: '#f0fdf4' },
  terapeuta:    { label: 'Terapeuta',   color: '#059669', bg: '#f0fdf4' },
  secretaria:   { label: 'Secretaría',  color: '#d97706', bg: '#fffbeb' },
  padre:        { label: 'Tú',          color: '#2563eb', bg: '#eff6ff' },
}

function Avatar({ name, role }: { name: string; role: string }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.admin
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: cfg.bg, border: `2px solid ${cfg.color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function isNewDay(curr: string, prev?: string) {
  if (!prev) return true
  return new Date(curr).toDateString() !== new Date(prev).toDateString()
}

function DayDivider({ date }: { date: string }) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const label = isToday ? 'Hoy' : d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  )
}

interface Props {
  childId: string
  childName: string
  profile: any  // padre's profile with id and name
}

export default function ChatFamilias({ childId, childName, profile }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const userId   = profile?.id || ''
  const userName = profile?.full_name || profile?.name || 'Familia'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/chat-familias?child_id=${childId}&user_id=${userId}`)
      const json = await res.json()
      if (json.data) { setMessages(json.data); scrollToBottom() }
    } finally { setLoading(false) }
  }, [childId, userId, scrollToBottom])

  useEffect(() => { loadMessages() }, [loadMessages])

  // Mark read on focus
  useEffect(() => {
    const markRead = () => {
      if (!childId || !userId) return
      fetch('/api/chat-familias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, user_id: userId }),
      }).catch(() => {})
    }
    window.addEventListener('focus', markRead)
    markRead()
    return () => window.removeEventListener('focus', markRead)
  }, [childId, userId])

  // Real-time subscription
  useEffect(() => {
    if (!childId) return
    channelRef.current = supabase
      .channel(`chat_familias_${childId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_familias',
        filter: `child_id=eq.${childId}`,
      }, (payload) => {
        const newMsg = payload.new as Msg
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        scrollToBottom()
        // Auto-mark as read if sender is not this user
        if (newMsg.sender_id !== userId) {
          fetch('/api/chat-familias', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ child_id: childId, user_id: userId }),
          }).catch(() => {})
        }
      })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [childId, userId, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending || !childId) return
    setSending(true)
    setInput('')
    try {
      await fetch('/api/chat-familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id:    childId,
          content:     text,
          sender_id:   userId,
          sender_role: 'padre',
          sender_name: userName,
        }),
      })
      scrollToBottom()
    } finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: 0 }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle size={20} color="#fff"/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: 0 }}>Chat con el equipo</p>
          <p style={{ fontSize: 11, color: '#64748b', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={10}/> Equipo de {childName} · Admin y terapeutas
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf7d0', flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>En línea</span>
        </div>
      </div>

      {/* ── NOTICE ── */}
      <div style={{ margin: '10px 16px 0', padding: '8px 12px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#1d4ed8', margin: 0, lineHeight: 1.5 }}>
          💬 Este chat es privado entre tu familia y el equipo del centro. Responderemos en horario de atención.
        </p>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Loader2 size={20} style={{ color: '#94a3b8', animation: 'spin 1s linear infinite' }}/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
            <div style={{ width: 56, height: 56, background: '#f5f3ff', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={24} color="#a78bfa"/>
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', margin: 0 }}>¡Inicia la conversación!</p>
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', maxWidth: 240, margin: 0, lineHeight: 1.6 }}>
              Escríbele al equipo del centro. Puedes preguntar sobre el progreso, actividades o citas.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === userId
            const cfg  = ROLE_CFG[msg.sender_role] || ROLE_CFG.admin
            const showDay = isNewDay(msg.created_at, messages[i - 1]?.created_at)
            const isRead = msg.read_by?.length > 1

            return (
              <div key={msg.id}>
                {showDay && <DayDivider date={msg.created_at}/>}

                {/* Sender name for staff messages (only show when role changes or first) */}
                {!isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, marginTop: 8, paddingLeft: 42 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{msg.sender_name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: cfg.bg, padding: '1px 7px', borderRadius: 20, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                  {!isMe && (i === messages.length - 1 || messages[i+1]?.sender_id !== msg.sender_id) && (
                    <Avatar name={msg.sender_name} role={msg.sender_role}/>
                  )}
                  {!isMe && messages[i+1]?.sender_id === msg.sender_id && <div style={{ width: 32, flexShrink: 0 }}/>}

                  <div style={{
                    maxWidth: '72%',
                    padding: '9px 13px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f8fafc',
                    color: isMe ? '#fff' : '#1e293b',
                    fontSize: 13,
                    lineHeight: 1.55,
                    boxShadow: isMe ? '0 2px 12px rgba(37,99,235,.25)' : '0 1px 4px rgba(0,0,0,.06)',
                    border: isMe ? 'none' : '1px solid #e5e7eb',
                    wordBreak: 'break-word',
                  }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 10, opacity: isMe ? 0.7 : undefined, color: isMe ? '#fff' : '#94a3b8' }}>
                        {formatTime(msg.created_at)}
                      </span>
                      {isMe && (isRead
                        ? <CheckCheck size={12} style={{ color: '#93c5fd' }}/>
                        : <Check size={12} style={{ color: 'rgba(255,255,255,.6)' }}/>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* ── INPUT ── */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f1f5f9', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f8fafc', borderRadius: 18, padding: '8px 8px 8px 14px', border: '1.5px solid #e2e8f0' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: '#0f172a', resize: 'none', maxHeight: 100,
              lineHeight: 1.5, paddingTop: 2,
              fontFamily: 'inherit',
            }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 100) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: input.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s', flexShrink: 0,
              boxShadow: input.trim() ? '0 2px 8px rgba(37,99,235,.3)' : 'none',
            }}
          >
            {sending
              ? <Loader2 size={16} color={input.trim() ? '#fff' : '#94a3b8'} style={{ animation: 'spin 1s linear infinite' }}/>
              : <Send size={16} color={input.trim() ? '#fff' : '#94a3b8'}/>
            }
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '6px 0 0' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
