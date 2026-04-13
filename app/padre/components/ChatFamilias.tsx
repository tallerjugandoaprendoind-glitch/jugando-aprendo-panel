'use client'
// app/padre/components/ChatFamilias.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageCircle, CheckCheck, Check, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Msg {
  id: string; content: string; sender_id: string; sender_role: string
  sender_name: string; read_by: string[]; created_at: string
  sender_avatar?: string
}
interface Props { childId: string; childName: string; profile: any }

const ROLE_CFG: Record<string, { label: string; color: string; bg: string; grad: string }> = {
  jefe:         { label: 'Director(a)',  color: '#7c3aed', bg: '#f5f3ff', grad: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  admin:        { label: 'Admin',        color: '#2563eb', bg: '#eff6ff', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
  especialista: { label: 'Terapeuta ABA',color: '#059669', bg: '#f0fdf4', grad: 'linear-gradient(135deg,#059669,#047857)' },
  terapeuta:    { label: 'Terapeuta ABA',color: '#059669', bg: '#f0fdf4', grad: 'linear-gradient(135deg,#059669,#047857)' },
  secretaria:   { label: 'Secretaría',   color: '#d97706', bg: '#fffbeb', grad: 'linear-gradient(135deg,#d97706,#b45309)' },
  padre:        { label: 'Tú',           color: '#2563eb', bg: '#eff6ff', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
}

function formatTime(iso: string) {
  const d = new Date(iso), now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
function isNewDay(curr: string, prev?: string) {
  if (!prev) return true
  return new Date(curr).toDateString() !== new Date(prev).toDateString()
}

function DayDivider({ date }: { date: string }) {
  const d = new Date(date), now = new Date()
  const label = d.toDateString() === now.toDateString()
    ? 'Hoy'
    : d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap',
        padding: '3px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
    </div>
  )
}

function SenderAvatar({ name, role, avatarUrl }: { name: string; role: string; avatarUrl?: string }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.admin
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${cfg.color}30` }}/>
  ) : (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export default function ChatFamilias({ childId, childName, profile }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  const userId   = profile?.id || ''
  const userName = profile?.full_name || 'Familia'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const loadMessages = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/chat-familias?child_id=${childId}&user_id=${userId}`)
      const json = await res.json()
      if (json.data) { setMessages(json.data); scrollToBottom() }
    } finally { setLoading(false) }
  }, [childId, userId, scrollToBottom])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    const markRead = () => {
      if (!childId || !userId) return
      fetch('/api/chat-familias', { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, user_id: userId }) }).catch(() => {})
    }
    window.addEventListener('focus', markRead); markRead()
    return () => window.removeEventListener('focus', markRead)
  }, [childId, userId])

  useEffect(() => {
    if (!childId) return
    channelRef.current = supabase
      .channel(`chat_familias_${childId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_familias', filter: `child_id=eq.${childId}` },
        (payload) => {
          const newMsg = payload.new as Msg
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          scrollToBottom()
          if (newMsg.sender_id !== userId)
            fetch('/api/chat-familias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ child_id: childId, user_id: userId }) }).catch(() => {})
        })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [childId, userId, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending || !childId) return
    setSending(true); setInput('')
    try {
      await fetch('/api/chat-familias', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, content: text, sender_id: userId, sender_role: 'padre', sender_name: userName }) })
      scrollToBottom()
    } finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff',
      borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2563eb', flexShrink: 0, border: '2px solid #bfdbfe' }}>
          {childName?.[0]?.toUpperCase() || 'E'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: 0 }}>Equipo de {childName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Users size={10} color="#94a3b8"/>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Chat privado · Admin + Terapeutas</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>En línea</span>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0, background: '#f8fafc' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Loader2 size={22} style={{ color: '#94a3b8', animation: 'cfspin 1s linear infinite' }}/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#eff6ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}>
              <MessageCircle size={26} color="#2563eb"/>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', margin: '0 0 6px' }}>¡Escríbenos!</p>
              <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 240, margin: 0, lineHeight: 1.6 }}>
                Este chat es privado entre tu familia y el equipo del centro.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['📅 Consultar cita', '📊 Pedir reporte', '❓ Tengo una duda'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe     = msg.sender_id === userId
              const cfg      = ROLE_CFG[msg.sender_role] || ROLE_CFG.admin
              const showDay  = isNewDay(msg.created_at, messages[i - 1]?.created_at)
              const isRead   = msg.read_by?.length > 1
              const showName = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)
              const showAvatar = !isMe && (i === messages.length - 1 || messages[i+1]?.sender_id !== msg.sender_id)

              return (
                <div key={msg.id} style={{ marginBottom: 2 }}>
                  {showDay && <DayDivider date={msg.created_at}/>}

                  {/* Sender name + role */}
                  {showName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, marginTop: 10, paddingLeft: 46 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{msg.sender_name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, padding: '1px 8px', borderRadius: 20, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    {/* Avatar for received messages */}
                    {!isMe && (
                      showAvatar
                        ? <SenderAvatar name={msg.sender_name} role={msg.sender_role} avatarUrl={msg.sender_avatar}/>
                        : <div style={{ width: 34, flexShrink: 0 }}/>
                    )}

                    <div style={{
                      maxWidth: '68%', padding: '9px 13px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#fff',
                      color: isMe ? '#fff' : '#0f172a',
                      fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word',
                      border: isMe ? 'none' : '1px solid #e5e7eb',
                      boxShadow: isMe ? '0 2px 12px rgba(37,99,235,.25)' : '0 1px 4px rgba(0,0,0,.06)',
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, opacity: isMe ? .7 : undefined, color: isMe ? '#fff' : '#94a3b8' }}>{formatTime(msg.created_at)}</span>
                        {isMe && (isRead
                          ? <CheckCheck size={12} style={{ color: '#93c5fd' }}/>
                          : <Check size={12} style={{ color: 'rgba(255,255,255,.6)' }}/>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* ── INPUT ── */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f8fafc', borderRadius: 18, padding: '8px 8px 8px 14px', border: '1.5px solid #e2e8f0' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje al equipo..." rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', resize: 'none', maxHeight: 100, lineHeight: 1.5, fontFamily: 'inherit', paddingTop: 2 }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            style={{ width: 38, height: 38, borderRadius: 12, border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0,
              boxShadow: input.trim() ? '0 2px 8px rgba(37,99,235,.3)' : 'none' }}>
            {sending
              ? <Loader2 size={16} color={input.trim() ? '#fff' : '#94a3b8'} style={{ animation: 'cfspin 1s linear infinite' }}/>
              : <Send size={16} color={input.trim() ? '#fff' : '#94a3b8'}/>
            }
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '6px 0 0' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>

      <style>{`@keyframes cfspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
