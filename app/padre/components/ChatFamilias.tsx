'use client'
// app/padre/components/ChatFamilias.tsx
// Chat familiar con soporte de voz, imágenes y documentos — estilo WhatsApp

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Loader2, MessageCircle, CheckCheck, Check, Users,
  Paperclip, Mic, Image, FileText, X, Play, Pause,
  Download, StopCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Msg {
  id: string
  content: string
  sender_id: string
  sender_role: string
  sender_name: string
  read_by: string[]
  created_at: string
  sender_avatar?: string
  message_type?: 'text' | 'image' | 'audio' | 'document'
  file_url?: string
  file_name?: string
  file_size?: number
}
interface Props { childId: string; childName: string; profile: any }

// ─── Config ────────────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; color: string; bg: string; grad: string }> = {
  jefe:         { label: 'Director(a)',   color: '#7c3aed', bg: '#f5f3ff', grad: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
  admin:        { label: 'Admin',         color: '#2563eb', bg: '#eff6ff', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
  especialista: { label: 'Terapeuta ABA', color: '#059669', bg: '#f0fdf4', grad: 'linear-gradient(135deg,#059669,#047857)' },
  terapeuta:    { label: 'Terapeuta ABA', color: '#059669', bg: '#f0fdf4', grad: 'linear-gradient(135deg,#059669,#047857)' },
  secretaria:   { label: 'Secretaría',    color: '#d97706', bg: '#fffbeb', grad: 'linear-gradient(135deg,#d97706,#b45309)' },
  padre:        { label: 'Tú',            color: '#2563eb', bg: '#eff6ff', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function getFileIcon(name?: string) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['zip', 'rar'].includes(ext)) return '🗜️'
  return '📎'
}

// ─── Sub-components ────────────────────────────────────────────────────────────
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

function AudioPlayer({ url, isMe }: { url: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onLoad = () => setDuration(audio.duration)
    const onEnd  = () => { setPlaying(false); setCurrent(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoad)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoad)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const progress = duration ? (current / duration) * 100 : 0
  const textColor  = isMe ? 'rgba(255,255,255,0.85)' : '#0f172a'
  const trackColor = isMe ? 'rgba(255,255,255,0.25)' : '#e2e8f0'
  const fillColor  = isMe ? '#fff' : '#2563eb'
  const btnBg      = isMe ? 'rgba(255,255,255,0.2)' : '#eff6ff'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button onClick={toggle} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: btnBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: isMe ? '#fff' : '#2563eb' }}>
        {playing ? <Pause size={16}/> : <Play size={16}/>}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ position: 'relative', height: 4, background: trackColor, borderRadius: 4, cursor: 'pointer', marginBottom: 6 }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            if (audioRef.current) audioRef.current.currentTime = pct * duration
          }}>
          <div style={{ width: `${progress}%`, height: '100%', background: fillColor, borderRadius: 4, transition: 'width .1s' }}/>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 18, marginBottom: 4 }}>
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [4,6,10,8,14,12,16,10,8,12,16,14,10,8,6,10,14,12,8,16,10,8,12,14,8,10,6,4]
            const h = heights[i] || 6
            const active = (i / 28) * 100 < progress
            return <div key={i} style={{ width: 2, height: h, borderRadius: 2,
              background: active ? fillColor : trackColor, transition: 'background .1s' }}/>
          })}
        </div>
        <span style={{ fontSize: 10, color: textColor }}>
          {playing ? formatDuration(current) : formatDuration(duration || 0)}
        </span>
      </div>
    </div>
  )
}

function MessageContent({ msg, isMe }: { msg: Msg; isMe: boolean }) {
  if (msg.message_type === 'image' && msg.file_url) {
    return (
      <div>
        <img src={msg.file_url} alt="imagen"
          style={{ width: '100%', maxWidth: 220, borderRadius: 10, display: 'block', cursor: 'pointer' }}
          onClick={() => window.open(msg.file_url, '_blank')} />
        {msg.content && msg.content !== '📷 Imagen' && (
          <p style={{ margin: '6px 2px 0', fontSize: 13, whiteSpace: 'pre-wrap', color: isMe ? '#fff' : '#0f172a' }}>{msg.content}</p>
        )}
      </div>
    )
  }
  if (msg.message_type === 'audio' && msg.file_url) {
    return <AudioPlayer url={msg.file_url} isMe={isMe} />
  }
  if (msg.message_type === 'document' && msg.file_url) {
    const icon = getFileIcon(msg.file_name)
    const bg     = isMe ? 'rgba(255,255,255,0.15)' : '#f8fafc'
    const border = isMe ? 'none' : '1px solid #e2e8f0'
    return (
      <a href={msg.file_url} target="_blank" rel="noreferrer" download={msg.file_name}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          background: bg, border, borderRadius: 12, padding: '10px 14px', minWidth: 190 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isMe ? '#fff' : '#1e293b',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
            {msg.file_name || 'Documento'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: isMe ? 'rgba(255,255,255,0.65)' : '#94a3b8' }}>
            {formatFileSize(msg.file_size)} · Toca para abrir
          </p>
        </div>
        <Download size={14} color={isMe ? 'rgba(255,255,255,0.75)' : '#94a3b8'}/>
      </a>
    )
  }
  return <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>{msg.content}</p>
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/')
  const url = isImage ? URL.createObjectURL(file) : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, marginBottom: 8 }}>
      {isImage && url ? (
        <img src={url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}/>
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e0f2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {getFileIcon(file.name)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{formatFileSize(file.size)}</p>
      </div>
      <button onClick={onRemove} style={{ border: 'none', background: '#fee2e2', borderRadius: '50%',
        width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <X size={12} color="#ef4444"/>
      </button>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChatFamilias({ childId, childName, profile }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)

  // File attachment
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [showAttach, setShowAttach]     = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Voice recording
  const [recording, setRecording]   = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const recTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const channelRef  = useRef<any>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const avatarCache = useRef<Record<string, string | null>>({})

  const userId   = profile?.id || ''
  const userName = profile?.full_name || 'Familia'

  // Resuelve el avatar de un sender_id (con caché)
  const resolveAvatar = useCallback(async (senderId: string): Promise<string | null> => {
    if (senderId in avatarCache.current) return avatarCache.current[senderId]
    try {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', senderId).single()
      avatarCache.current[senderId] = data?.avatar_url || null
    } catch { avatarCache.current[senderId] = null }
    return avatarCache.current[senderId]
  }, [])

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
        async (payload) => {
          const newMsg = payload.new as Msg
          // Resolver avatar desde caché o profiles
          newMsg.sender_avatar = (await resolveAvatar(newMsg.sender_id)) ?? undefined
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          scrollToBottom()
          if (newMsg.sender_id !== userId)
            fetch('/api/chat-familias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ child_id: childId, user_id: userId }) }).catch(() => {})
        })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [childId, userId, scrollToBottom, resolveAvatar])

  // ── Upload helper ─────────────────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('child_id', childId)
    const res  = await fetch('/api/chat-familias/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al subir')
    return { url: json.url as string, fileName: json.fileName as string, fileSize: json.fileSize as number }
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = async (opts?: {
    text?: string; type?: string
    fileUrl?: string; fileName?: string; fileSize?: number
  }) => {
    const text     = opts?.text ?? input.trim()
    const type     = opts?.type || 'text'
    const hasMedia = !!(opts?.fileUrl || attachedFile)
    if (!text && !hasMedia) return
    if (sending || !childId) return

    setSending(true)
    const prevInput = input
    setInput('')

    try {
      let fileUrl   = opts?.fileUrl
      let fileName  = opts?.fileName
      let fileSize  = opts?.fileSize
      let msgType   = opts?.type || 'text'

      if (attachedFile && !fileUrl) {
        setUploading(true)
        const up = await uploadFile(attachedFile)
        setUploading(false)
        fileUrl  = up.url
        fileName = up.fileName
        fileSize = up.fileSize
        msgType  = attachedFile.type.startsWith('image/') ? 'image' : 'document'
        setAttachedFile(null)
      }

      const content = text ||
        (msgType === 'image' ? '📷 Imagen' : msgType === 'audio' ? '🎤 Mensaje de voz' : '📎 Documento')

      await fetch('/api/chat-familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id:     childId,
          content,
          sender_id:    userId,
          sender_role:  'padre',
          sender_name:  userName,
          message_type: msgType,
          file_url:     fileUrl  || null,
          file_name:    fileName || null,
          file_size:    fileSize || null,
        }),
      })
      scrollToBottom()
    } catch {
      setInput(prevInput)
    } finally {
      setSending(false)
      setUploading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Voice recording ───────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.start(100)
      mediaRecorderRef.current = mr
      setRecording(true)
      setRecSeconds(0)
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos del navegador.')
    }
  }

  const stopRecording = async (cancel = false) => {
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
    setRecording(false)
    setRecSeconds(0)
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stream.getTracks().forEach(t => t.stop())
    if (cancel) { mr.stop(); audioChunksRef.current = []; return }

    await new Promise<void>(resolve => { mr.onstop = () => resolve(); mr.stop() })
    if (!audioChunksRef.current.length) return

    const mimeType = mr.mimeType || 'audio/webm'
    const blob = new Blob(audioChunksRef.current, { type: mimeType })
    const ext  = mimeType.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], `voz_${Date.now()}.${ext}`, { type: mimeType })

    setUploading(true)
    setSending(true)
    try {
      const up = await uploadFile(file)
      await fetch('/api/chat-familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id:     childId,
          content:      '🎤 Mensaje de voz',
          sender_id:    userId,
          sender_role:  'padre',
          sender_name:  userName,
          message_type: 'audio',
          file_url:     up.url,
          file_name:    up.fileName,
          file_size:    up.fileSize,
        }),
      })
      scrollToBottom()
    } catch { /* silently fail */ }
    finally { setUploading(false); setSending(false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setAttachedFile(file); setShowAttach(false) }
    e.target.value = ''
  }

  const canSend = !!(input.trim() || attachedFile)

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}
      className="lg:rounded-[20px] lg:border lg:border-slate-200 lg:shadow-sm">

      {/* HEADER */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex',
        alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#2563eb', flexShrink: 0, border: '2px solid #bfdbfe' }}>
          {childName?.[0]?.toUpperCase() || 'E'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: 0 }}>Equipo de {childName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Users size={10} color="#94a3b8"/>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Chat privado · Admin + Terapeutas</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4',
          padding: '4px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>En línea</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex',
        flexDirection: 'column', gap: 0, background: '#f8fafc' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Loader2 size={22} style={{ color: '#94a3b8', animation: 'cfspin 1s linear infinite' }}/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flex: 1, gap: 12, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#eff6ff', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}>
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
                  style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid #e2e8f0',
                    borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe       = msg.sender_id === userId
              const cfg        = ROLE_CFG[msg.sender_role] || ROLE_CFG.admin
              const showDay    = isNewDay(msg.created_at, messages[i - 1]?.created_at)
              const isRead     = msg.read_by?.length > 1
              const showName   = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id)
              const showAvatar = !isMe && (i === messages.length - 1 || messages[i+1]?.sender_id !== msg.sender_id)
              const isMedia    = msg.message_type === 'image'

              return (
                <div key={msg.id} style={{ marginBottom: 2 }}>
                  {showDay && <DayDivider date={msg.created_at}/>}

                  {showName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, marginTop: 10, paddingLeft: 46 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{msg.sender_name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color,
                        padding: '1px 8px', borderRadius: 20, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8,
                    justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    {!isMe && (showAvatar
                      ? <SenderAvatar name={msg.sender_name} role={msg.sender_role} avatarUrl={msg.sender_avatar}/>
                      : <div style={{ width: 34, flexShrink: 0 }}/>
                    )}

                    <div style={{
                      maxWidth: isMedia ? 250 : '68%',
                      padding: isMedia ? '5px 5px 0' : '9px 13px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#fff',
                      color: isMe ? '#fff' : '#0f172a',
                      border: isMe ? 'none' : '1px solid #e5e7eb',
                      boxShadow: isMe ? '0 2px 12px rgba(37,99,235,.25)' : '0 1px 4px rgba(0,0,0,.06)',
                      overflow: 'hidden',
                    }}>
                      <MessageContent msg={msg} isMe={isMe}/>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                        marginTop: 4, padding: isMedia ? '0 6px 4px' : '0' }}>
                        <span style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
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
            })}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '8px 16px 14px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 }}>

        {/* File preview */}
        {attachedFile && (
          <FilePreview file={attachedFile} onRemove={() => setAttachedFile(null)}/>
        )}

        {/* Recording indicator */}
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
            background: '#fff5f5', borderRadius: 12, marginBottom: 8, border: '1.5px solid #fecaca' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
              animation: 'cfpulse 1s ease-in-out infinite' }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Grabando</span>
            <span style={{ fontSize: 13, color: '#ef4444', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {formatDuration(recSeconds)}
            </span>
            <button onClick={() => stopRecording(true)}
              style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
              Cancelar
            </button>
          </div>
        )}

        {/* Attach menu */}
        {showAttach && !recording && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => { imageInputRef.current?.click(); setShowAttach(false) }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '12px 0', background: '#eff6ff', border: '1.5px solid #bfdbfe',
                borderRadius: 14, cursor: 'pointer', flex: 1, transition: 'all .15s' }}>
              <Image size={22} color="#2563eb"/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>Imagen</span>
            </button>
            <button onClick={() => { fileInputRef.current?.click(); setShowAttach(false) }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '12px 0', background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                borderRadius: 14, cursor: 'pointer', flex: 1, transition: 'all .15s' }}>
              <FileText size={22} color="#059669"/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Documento</span>
            </button>
          </div>
        )}

        {/* Main input row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>

          {/* Attach button */}
          {!recording && (
            <button onClick={() => setShowAttach(v => !v)}
              title="Adjuntar archivo"
              style={{ width: 38, height: 38, borderRadius: 12, border: 'none', flexShrink: 0,
                background: showAttach ? '#2563eb' : '#f1f5f9', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
              {showAttach ? <X size={16} color="#fff"/> : <Paperclip size={16} color="#64748b"/>}
            </button>
          )}

          {/* Text box (hidden while recording) */}
          {!recording && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', background: '#f8fafc',
              borderRadius: 18, padding: '8px 8px 8px 14px', border: '1.5px solid #e2e8f0' }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje al equipo..." rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, color: '#0f172a', resize: 'none', maxHeight: 100, lineHeight: 1.5,
                  fontFamily: 'inherit', paddingTop: 2 }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 100) + 'px'
                }}
              />
            </div>
          )}

          {/* Right action button — mic or send */}
          {recording ? (
            /* Stop button */
            <button onClick={() => stopRecording(false)} title="Enviar audio"
              style={{ width: 38, height: 38, borderRadius: 12, border: 'none', flexShrink: 0,
                background: 'linear-gradient(135deg,#ef4444,#dc2626)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(239,68,68,.4)', animation: 'cfglow 1.2s ease-in-out infinite' }}>
              <StopCircle size={16} color="#fff"/>
            </button>
          ) : canSend ? (
            /* Send button */
            <button onClick={() => sendMessage()} disabled={sending || uploading}
              style={{ width: 38, height: 38, borderRadius: 12, border: 'none', flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,.35)', transition: 'all .2s' }}>
              {(sending || uploading)
                ? <Loader2 size={16} color="#fff" style={{ animation: 'cfspin 1s linear infinite' }}/>
                : <Send size={16} color="#fff"/>}
            </button>
          ) : (
            /* Mic button — hold to record */
            <button
              onMouseDown={startRecording}
              onMouseUp={() => stopRecording(false)}
              onTouchStart={e => { e.preventDefault(); startRecording() }}
              onTouchEnd={e => { e.preventDefault(); stopRecording(false) }}
              title="Mantén presionado para grabar voz"
              style={{ width: 38, height: 38, borderRadius: 12, border: 'none', flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,.3)' }}>
              <Mic size={16} color="#fff"/>
            </button>
          )}
        </div>

        <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '6px 0 0' }}>
          {recording
            ? 'Suelta el botón para enviar el audio'
            : canSend
              ? 'Enter para enviar · Shift+Enter para nueva línea'
              : '🎤 Mantén para grabar · 📎 Adjuntar archivos'}
        </p>
      </div>

      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange}/>
      <input ref={fileInputRef}  type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
        style={{ display: 'none' }} onChange={handleFileChange}/>

      <style>{`
        @keyframes cfspin  { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes cfpulse { 0%,100%{opacity:1}          50%{opacity:.3} }
        @keyframes cfglow  { 0%,100%{box-shadow:0 2px 10px rgba(239,68,68,.4)} 50%{box-shadow:0 2px 20px rgba(239,68,68,.7)} }
      `}</style>
    </div>
  )
}
