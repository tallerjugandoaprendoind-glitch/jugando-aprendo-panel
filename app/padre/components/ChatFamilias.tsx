'use client'
// app/padre/components/ChatFamilias.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, MessageCircle, CheckCheck, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Msg {
  id: string; content: string; sender_id: string; sender_role: string
  sender_name: string; read_by: string[]; created_at: string; message_type: string
}
interface Props { childId: string; childName: string; profile: any }

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  jefe:         { label: 'Dirección',  color: '#7c3aed', bg: '#f5f3ff' },
  admin:        { label: 'Admin',      color: '#2563eb', bg: '#eff6ff' },
  especialista: { label: 'Terapeuta',  color: '#059669', bg: '#f0fdf4' },
  terapeuta:    { label: 'Terapeuta',  color: '#059669', bg: '#f0fdf4' },
  secretaria:   { label: 'Secretaría', color: '#d97706', bg: '#fffbeb' },
  padre:        { label: 'Tú',         color: '#2563eb', bg: '#eff6ff' },
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }}/>
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
  const userName = profile?.full_name || profile?.name || 'Familia'

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
      fetch('/api/chat-familias', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, user_id: userId }),
      }).catch(() => {})
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
      await fetch('/api/chat-familias', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, content: text, sender_id: userId, sender_role: 'padre', sender_name: userName }),
      })
      scrollToBottom()
    } finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0' }}>

      {/* HEADER */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>
          {childName?.[0]?.toUpperCase() || 'E'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: 0 }}>Equipo de {childName}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>Chat privado · Admin + Terapeutas</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>En línea</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Loader2 size={20} style={{ color: '#94a3b8', animation: 'cfspin 1s linear infinite' }}/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#eff6ff', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}>
              <MessageCircle size={24} color="#2563eb"/>
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', margin: 0 }}>¡Escríbenos!</p>
            <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 240, margin: 0, lineHeight: 1.6 }}>
              Este chat es privado entre tu familia y el equipo del centro.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              {['📅 Consultar cita', '📊 Pedir reporte', '❓ Tengo una duda'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ padding: '6px 14px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe    = msg.sender_id === userId
              const cfg     = ROLE_CFG[msg.sender_role] || ROLE_CFG.admin
              const showDay = isNewDay(msg.created_at, messages[i - 1]?.created_at)
              const isRead  = msg.read_by?.length > 1
              return (
                <div key={msg.id}>
                  {showDay && <DayDivider date={msg.created_at}/>}
                  {!isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, marginTop: 8, paddingLeft: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{msg.sender_name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, padding: '1px 7px', borderRadius: 20, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    <div style={{
                      maxWidth: '68%', padding: '8px 12px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#fff',
                      color: isMe ? '#fff' : '#0f172a', fontSize: 13, lineHeight: 1.55,
                      wordBreak: 'break-word', border: isMe ? 'none' : '1px solid #e2e8f0',
                      boxShadow: isMe ? '0 2px 10px rgba(37,99,235,.2)' : '0 1px 3px rgba(0,0,0,.05)',
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 }}>
                        <span style={{ fontSize: 10, opacity: isMe ? .7 : undefined, color: isMe ? '#fff' : '#94a3b8' }}>{formatTime(msg.created_at)}</span>
                        {isMe && (isRead
                          ? <CheckCheck size={11} style={{ color: '#93c5fd' }}/>
                          : <Check size={11} style={{ color: 'rgba(255,255,255,.6)' }}/>
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

      {/* INPUT */}
      <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#f8fafc', borderRadius: 16, padding: '7px 7px 7px 13px', border: '1.5px solid #e2e8f0' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje al equipo..." rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', resize: 'none', maxHeight: 90, lineHeight: 1.5, fontFamily: 'inherit', paddingTop: 2 }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 90) + 'px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: input.trim() ? 'pointer' : 'default', background: input.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0, boxShadow: input.trim() ? '0 2px 8px rgba(37,99,235,.25)' : 'none' }}>
            {sending
              ? <Loader2 size={15} color={input.trim() ? '#fff' : '#94a3b8'} style={{ animation: 'cfspin 1s linear infinite' }}/>
              : <Send size={15} color={input.trim() ? '#fff' : '#94a3b8'}/>
            }
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '5px 0 0' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>

      <style>{`@keyframes cfspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
