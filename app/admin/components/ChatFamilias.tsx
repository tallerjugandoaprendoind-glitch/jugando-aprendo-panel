'use client'
// app/admin/components/ChatFamilias.tsx
// Panel admin: lista de familias + chat en tiempo real con cada una

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Loader2, Search, Users, CheckCheck, Check, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Msg {
  id: string; content: string; sender_id: string; sender_role: string
  sender_name: string; sender_avatar?: string | null; read_by: string[]; created_at: string
}
interface Family {
  child_id: string; child_name: string; lastMsg: string
  lastTime: string; unread: number; lastSender: string
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  jefe:         { label: 'Dirección',   color: '#7c3aed', bg: '#f5f3ff' },
  admin:        { label: 'Admin',       color: '#2563eb', bg: '#eff6ff' },
  especialista: { label: 'Terapeuta',   color: '#059669', bg: '#f0fdf4' },
  terapeuta:    { label: 'Terapeuta',   color: '#059669', bg: '#f0fdf4' },
  secretaria:   { label: 'Secretaría',  color: '#d97706', bg: '#fffbeb' },
  padre:        { label: 'Familia',     color: '#64748b', bg: '#f8fafc' },
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function isNewDay(curr: string, prev?: string) {
  if (!prev) return true
  return new Date(curr).toDateString() !== new Date(prev).toDateString()
}

function DayDivider({ date }: { date: string }) {
  const d = new Date(date)
  const isToday = d.toDateString() === new Date().toDateString()
  const label = isToday ? 'Hoy' : d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--card-border, #e5e7eb)' }}/>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--card-border, #e5e7eb)' }}/>
    </div>
  )
}

interface Props { profile?: any; userId?: string; userName?: string; isDark?: boolean }

export default function ChatFamilias({ profile, userId: _userId, userName: _userName, isDark: _isDark }: Props) {
  const [families, setFamilies]     = useState<Family[]>([])
  const [selected, setSelected]     = useState<Family | null>(null)
  const [messages, setMessages]     = useState<Msg[]>([])
  const [input, setInput]           = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending]       = useState(false)
  const [search, setSearch]         = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const channelRef  = useRef<any>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)

  const userId   = _userId || profile?.id || ''
  const userName = _userName || profile?.full_name || profile?.name || 'Equipo'
  const userRole = profile?.role || 'admin'

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // ── Cargar lista de familias con último mensaje ────────────────────────────
  const loadFamilies = useCallback(async () => {
    setLoadingList(true)
    try {
      // Traer todos los mensajes recientes agrupados por child_id
      const { data } = await supabase
        .from('chat_familias')
        .select('child_id, content, sender_name, sender_id, sender_role, read_by, created_at, children(name)')
        .order('created_at', { ascending: false })
        .limit(300)

      if (!data) return

      // Agrupar por child_id
      const map: Record<string, any> = {}
      data.forEach((m: any) => {
        if (!map[m.child_id]) {
          map[m.child_id] = {
            child_id:   m.child_id,
            child_name: (m.children as any)?.name || 'Familia',
            lastMsg:    m.content,
            lastTime:   m.created_at,
            lastSender: m.sender_name,
            unread: 0,
          }
        }
        // Count unread (from padre, not read by me)
        if (m.sender_role === 'padre' && !m.read_by?.includes(userId)) {
          map[m.child_id].unread++
        }
      })

      // También cargar niños que aún no tienen mensajes
      const { data: children } = await supabase
        .from('children')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      children?.forEach((c: any) => {
        if (!map[c.id]) {
          map[c.id] = { child_id: c.id, child_name: c.name, lastMsg: '', lastTime: '', lastSender: '', unread: 0 }
        }
      })

      const list = Object.values(map).sort((a: any, b: any) => {
        if (b.unread !== a.unread) return b.unread - a.unread
        return b.lastTime.localeCompare(a.lastTime)
      })
      setFamilies(list)
    } finally { setLoadingList(false) }
  }, [userId])

  useEffect(() => { loadFamilies() }, [loadFamilies])

  // ── Real-time: lista ──────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel('chat_familias_list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_familias' }, () => {
        loadFamilies()
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadFamilies])

  // ── Cargar mensajes de familia seleccionada ───────────────────────────────
  const loadMessages = useCallback(async (childId: string) => {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/chat-familias?child_id=${childId}&user_id=${userId}`)
      const json = await res.json()
      if (json.data) { setMessages(json.data); scrollToBottom() }
      // Mark read
      await fetch('/api/chat-familias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, user_id: userId }),
      })
      // Update unread count in list
      setFamilies(prev => prev.map(f => f.child_id === childId ? { ...f, unread: 0 } : f))
    } finally { setLoadingMsgs(false) }
  }, [userId, scrollToBottom])

  const selectFamily = (f: Family) => {
    setSelected(f)
    setMessages([])
    setMobileShowChat(true)
    loadMessages(f.child_id)
  }

  // ── Real-time: mensajes ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`chat_familias_admin_${selected.child_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_familias',
        filter: `child_id=eq.${selected.child_id}`,
      }, (payload) => {
        const newMsg = payload.new as Msg
        setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
        scrollToBottom()
        if (newMsg.sender_id !== userId) {
          fetch('/api/chat-familias', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ child_id: selected.child_id, user_id: userId }),
          }).catch(() => {})
          setFamilies(prev => prev.map(f => f.child_id === selected.child_id ? { ...f, unread: 0, lastMsg: newMsg.content, lastTime: newMsg.created_at, lastSender: newMsg.sender_name } : f))
        }
      }).subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [selected, userId, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending || !selected) return
    setSending(true); setInput('')
    try {
      await fetch('/api/chat-familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: selected.child_id, content: text,
          sender_id: userId, sender_role: userRole, sender_name: userName,
        }),
      })
      scrollToBottom()
    } finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const filtered = families.filter(f => f.child_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--card, #fff)', borderRadius: 20, border: '1px solid var(--card-border, #e2e8f0)', overflow: 'hidden' }}>

      {/* ── LISTA DE FAMILIAS ── */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: '1px solid var(--card-border, #e2e8f0)',
        flexDirection: 'column',
      }} className={`${mobileShowChat ? 'hidden' : 'flex'} lg:flex`}>
        {/* Header lista */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Users size={16} style={{ color: 'var(--text-muted)' }}/>
            <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>Familias</p>
            {families.filter(f => f.unread > 0).length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                {families.filter(f => f.unread > 0).length} sin leer
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--muted-bg, #f8fafc)', borderRadius: 10, padding: '7px 10px', border: '1px solid var(--card-border, #e2e8f0)' }}>
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar familia..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-primary)' }}/>
          </div>
        </div>

        {/* Family list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingList ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Loader2 size={18} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}/>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: 20 }}>Sin familias</p>
          ) : filtered.map(f => (
            <button key={f.child_id} onClick={() => selectFamily(f)}
              style={{
                width: '100%', textAlign: 'left', padding: '11px 16px',
                background: selected?.child_id === f.child_id ? 'var(--muted-bg, #f0f9ff)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--card-border, #f1f5f9)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background .15s',
              }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2563eb', flexShrink: 0, border: f.unread > 0 ? '2px solid #2563eb' : '2px solid transparent' }}>
                {f.child_name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: f.unread > 0 ? 800 : 600, fontSize: 13, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.child_name}</p>
                  {f.lastTime && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>{formatTime(f.lastTime)}</span>}
                </div>
                {f.lastMsg && <p style={{ fontSize: 11, color: f.unread > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: f.unread > 0 ? 600 : 400 }}>
                  {f.lastSender ? `${f.lastSender.split(' ')[0]}: ` : ''}{f.lastMsg}
                </p>}
              </div>
              {f.unread > 0 && <span style={{ background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.unread > 9 ? '9+' : f.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL DE CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 60, height: 60, background: 'var(--muted-bg, #f8fafc)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={28} style={{ color: 'var(--text-muted)' }}/>
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Selecciona una familia</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Elige una familia de la lista para ver su chat</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--card-border, #e2e8f0)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <button onClick={() => { setMobileShowChat(false); setSelected(null) }}
                className="lg:hidden"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}>
                <ChevronLeft size={20}/>
              </button>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>
                {selected.child_name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>Familia de {selected.child_name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>Chat privado · Padre + Admin + Terapeutas</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--muted-bg, #f8fafc)' }}>
              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <Loader2 size={20} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}/>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <MessageCircle size={28} style={{ color: 'var(--text-muted)' }}/>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Sin mensajes aún. ¡Inicia la conversación!</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.sender_id === userId
                const cfg  = ROLE_CFG[msg.sender_role] || ROLE_CFG.admin
                const showDay = isNewDay(msg.created_at, messages[i-1]?.created_at)
                const isRead  = msg.read_by?.length > 1

                return (
                  <div key={msg.id}>
                    {showDay && <DayDivider date={msg.created_at}/>}
                    {!isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, marginTop: 8, paddingLeft: 42 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{msg.sender_name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, padding: '1px 7px', borderRadius: 20, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginBottom: 2 }}>
                      {/* Avatar lado izquierdo (mensajes de otros) */}
                      {!isMe && (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${cfg.color}40`, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 2 }}>
                          {msg.sender_avatar
                            ? <img src={msg.sender_avatar} alt={msg.sender_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{msg.sender_name?.[0]?.toUpperCase() || '?'}</span>
                          }
                        </div>
                      )}
                      <div style={{
                        maxWidth: '68%', padding: '8px 12px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'linear-gradient(135deg,var(--primary,#2563eb),#1d4ed8)' : 'var(--card, #fff)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word',
                        border: isMe ? 'none' : '1px solid var(--card-border, #e2e8f0)',
                        boxShadow: isMe ? '0 2px 10px rgba(37,99,235,.2)' : '0 1px 3px rgba(0,0,0,.05)',
                      }}>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 }}>
                          <span style={{ fontSize: 10, opacity: isMe ? .7 : undefined, color: isMe ? '#fff' : 'var(--text-muted)' }}>{formatTime(msg.created_at)}</span>
                          {isMe && (isRead
                            ? <CheckCheck size={11} style={{ color: '#93c5fd' }}/>
                            : <Check size={11} style={{ color: 'rgba(255,255,255,.6)' }}/>
                          )}
                        </div>
                      </div>
                      {/* Avatar lado derecho (mis mensajes) */}
                      {isMe && (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(37,99,235,.3)', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 2 }}>
                          {msg.sender_avatar
                            ? <img src={msg.sender_avatar} alt={msg.sender_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb' }}>{msg.sender_name?.[0]?.toUpperCase() || '?'}</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding: '8px 14px 12px', borderTop: '1px solid var(--card-border, #e2e8f0)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--muted-bg, #f8fafc)', borderRadius: 16, padding: '7px 7px 7px 13px', border: '1.5px solid var(--card-border, #e2e8f0)' }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={`Responder a la familia de ${selected.child_name}...`} rows={1}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', resize: 'none', maxHeight: 90, lineHeight: 1.5, fontFamily: 'inherit' }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 90) + 'px' }}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: input.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'var(--card-border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}>
                  {sending
                    ? <Loader2 size={15} color={input.trim() ? '#fff' : 'var(--text-muted)'} style={{ animation: 'spin 1s linear infinite' }}/>
                    : <Send size={15} color={input.trim() ? '#fff' : 'var(--text-muted)'}/>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
