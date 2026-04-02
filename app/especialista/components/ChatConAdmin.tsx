'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  Send, Loader2, MessageCircle, CheckCheck, Check,
  Paperclip, Mic, MicOff, Trash2, X,
  FileText, Play, Pause, Square,
  Reply, Copy, Forward, Pin, Star, Flag, Camera, Smile
} from 'lucide-react'

// ─── Emojis de reacción ───────────────────────────────────────────────────────
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Mensaje {
  id: string
  content: string
  sender_id: string
  sender_role: string
  sender_name: string
  created_at: string
  read_at: string | null
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  message_type?: 'text' | 'file' | 'audio'
  reaction?: string | null
}

interface Jefe {
  id: string
  full_name: string
  role: string
  avatar_url?: string | null
}

interface ContextMenu {
  msgId: string
  x: number
  y: number
}

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({
  name,
  avatarUrl,
  size = 'md',
  online = false,
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
}) {
  const sz =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  const dot = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sz} rounded-full object-cover ring-2 ring-white shadow-sm`}
        />
      ) : (
        <div
          className={`${sz} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black shadow-sm`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dot} bg-emerald-400 rounded-full ring-2 ring-white`}
        />
      )}
    </div>
  )
}

// ─── Upload de avatar ─────────────────────────────────────────────────────────
function AvatarUpload({
  userId,
  currentUrl,
  name,
  onUpdate,
}: {
  userId: string
  currentUrl?: string | null
  name: string
  onUpdate: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Máximo 5MB para la foto de perfil')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${userId}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('chat-files')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from('chat-files').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      onUpdate(publicUrl)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => inputRef.current?.click()}
      title="Cambiar foto de perfil"
    >
      <Avatar name={name} avatarUrl={currentUrl} size="lg" />
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {uploading ? (
          <Loader2 size={14} className="animate-spin text-white" />
        ) : (
          <Camera size={14} className="text-white" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  )
}

// ─── Menú contextual WhatsApp ─────────────────────────────────────────────────
function MessageContextMenu({
  menu,
  esMio,
  onClose,
  onReply,
  onCopy,
  onReact,
  onForward,
  onPin,
  onStar,
  onReport,
  onDelete,
}: {
  menu: ContextMenu
  esMio: boolean
  onClose: () => void
  onReply: () => void
  onCopy: () => void
  onReact: (emoji: string) => void
  onForward: () => void
  onPin: () => void
  onStar: () => void
  onReport: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const style: React.CSSProperties = {
    position: 'fixed',
    top: menu.y,
    left: Math.min(menu.x, window.innerWidth - 220),
    zIndex: 9999,
  }

  return (
    <div ref={ref} style={style} className="animate-in fade-in zoom-in-95 duration-100">
      {/* Emojis */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 px-3 py-2 mb-1.5 flex items-center gap-1">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReact(emoji); onClose() }}
            className="text-xl hover:scale-125 transition-transform active:scale-90 p-0.5"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden min-w-[180px]">
        {[
          { icon: Reply, label: 'Responder', action: onReply },
          { icon: Copy, label: 'Copiar', action: onCopy },
          { icon: Smile, label: 'Reaccionar', action: () => {} },
          { icon: Forward, label: 'Reenviar', action: onForward },
          { icon: Pin, label: 'Fijar', action: onPin },
          { icon: Star, label: 'Destacar', action: onStar },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={() => { action(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm transition-colors"
          >
            <Icon size={15} className="text-slate-500" />
            {label}
          </button>
        ))}
        <div className="h-px bg-slate-100" />
        {esMio && (
          <button
            onClick={() => { onDelete(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm transition-colors"
          >
            <Trash2 size={15} /> Eliminar
          </button>
        )}
        {!esMio && (
          <button
            onClick={() => { onReport(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-orange-500 text-sm transition-colors"
          >
            <Flag size={15} /> Reportar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ChatConAdmin({
  userId,
  userName,
  userAvatarUrl,
}: {
  userId: string
  userName: string
  userAvatarUrl?: string | null
}) {
  const toast = useToast()

  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [jefes, setJefes] = useState<Jefe[]>([])
  const [jefeSeleccionado, setJefeSeleccionado] = useState<Jefe | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  // Audio
  const [grabando, setGrabando] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [reproduciendo, setReproduciendo] = useState<string | null>(null)
  const [mostrarConfirmBorrar, setMostrarConfirmBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0)

  // Avatar propio
  const [myAvatar, setMyAvatar] = useState<string | null | undefined>(userAvatarUrl)

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [contextMsgId, setContextMsgId] = useState<string | null>(null)

  // Reply
  const [replyTo, setReplyTo] = useState<Mensaje | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const scrollAbajo = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [])

  // ── Cargar jefes ──────────────────────────────────────────────────────────
  const cargarJefes = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('role', 'jefe')
      .order('full_name')
    if (data && data.length > 0) {
      setJefes(data)
      setJefeSeleccionado(data[0])
    }
  }, [])

  // ── Cargar mensajes ───────────────────────────────────────────────────────
  const cargarMensajes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_especialista_admin')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMensajes(data || [])
      scrollAbajo()
      const noLeidos = (data || []).filter(
        (m: Mensaje) => m.sender_id !== userId && !m.read_at
      )
      if (noLeidos.length > 0) {
        await supabase
          .from('chat_especialista_admin')
          .update({ read_at: new Date().toISOString() })
          .in('id', noLeidos.map((m: Mensaje) => m.id))
      }
    } catch {
      toast.error('Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }, [userId, scrollAbajo])

  useEffect(() => {
    cargarMensajes()
    cargarJefes()
    const channel = supabase
      .channel('especialista_chat_' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_especialista_admin' },
        (payload) => {
          const nuevo = payload.new as Mensaje
          setMensajes((prev) =>
            prev.find((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]
          )
          scrollAbajo()
          if (nuevo.sender_id !== userId) {
            supabase
              .from('chat_especialista_admin')
              .update({ read_at: new Date().toISOString() })
              .eq('id', nuevo.id)
              .then(() => {})
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [cargarMensajes, cargarJefes, userId, scrollAbajo])

  useEffect(() => {
    scrollAbajo()
  }, [mensajes, scrollAbajo])

  // ── Enviar ────────────────────────────────────────────────────────────────
  const enviar = async () => {
    const contenido = texto.trim()
    if (!contenido || enviando || !jefeSeleccionado) return
    setEnviando(true)
    setTexto('')
    setReplyTo(null)
    try {
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: replyTo
          ? `↩ ${replyTo.sender_name}: "${replyTo.content.slice(0, 60)}"\n\n${contenido}`
          : contenido,
        sender_id: userId,
        sender_role: 'especialista',
        sender_name: userName,
        recipient_id: jefeSeleccionado.id,
        message_type: 'text',
        read_at: null,
      })
      if (error) throw error
    } catch {
      toast.error('Error al enviar')
      setTexto(contenido)
    } finally {
      setEnviando(false)
      textareaRef.current?.focus()
    }
  }

  // ── Archivo ───────────────────────────────────────────────────────────────
  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jefeSeleccionado) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Máximo 10MB')
      return
    }
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `chat/${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('chat-files')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw new Error(upErr.message)
      const {
        data: { publicUrl },
      } = supabase.storage.from('chat-files').getPublicUrl(path)
      const isImage = file.type.startsWith('image/')
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: isImage ? '📷 Imagen' : `📎 ${file.name}`,
        sender_id: userId,
        sender_role: 'especialista',
        sender_name: userName,
        recipient_id: jefeSeleccionado.id,
        message_type: 'file',
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        read_at: null,
      })
      if (error) throw new Error(error.message)
      toast.success('Archivo enviado')
    } catch (err) {
      toast.error(
        `Error al subir: ${err instanceof Error ? err.message : 'Error desconocido'}`
      )
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Grabación ─────────────────────────────────────────────────────────────
  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      setGrabando(true)
      setTiempoGrabacion(0)
      timerRef.current = setInterval(
        () => setTiempoGrabacion((t) => t + 1),
        1000
      )
    } catch {
      toast.error('No se pudo acceder al micrófono')
    }
  }

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setGrabando(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const cancelarAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTiempoGrabacion(0)
  }

  const enviarAudio = async () => {
    if (!audioBlob || !jefeSeleccionado) return
    setSubiendo(true)
    try {
      const audioName = `audio_${Date.now()}.webm`
      const path = `chat/${userId}/${audioName}`
      const { error: upErr } = await supabase.storage
        .from('chat-files')
        .upload(path, audioBlob, { contentType: 'audio/webm', upsert: false })
      if (upErr) throw new Error(upErr.message)
      const {
        data: { publicUrl },
      } = supabase.storage.from('chat-files').getPublicUrl(path)
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: '🎤 Nota de voz',
        sender_id: userId,
        sender_role: 'especialista',
        sender_name: userName,
        recipient_id: jefeSeleccionado.id,
        message_type: 'audio',
        file_url: publicUrl,
        file_name: audioName,
        file_type: 'audio/webm',
        read_at: null,
      })
      if (error) throw new Error(error.message)
      cancelarAudio()
      toast.success('Audio enviado')
    } catch (err) {
      toast.error(
        `Error al enviar audio: ${err instanceof Error ? err.message : 'Error desconocido'}`
      )
    } finally {
      setSubiendo(false)
    }
  }

  const toggleAudio = (id: string, url: string) => {
    if (reproduciendo === id) {
      audioRefs.current[id]?.pause()
      setReproduciendo(null)
    } else {
      Object.values(audioRefs.current).forEach((a) => a.pause())
      if (!audioRefs.current[id]) {
        const audio = new Audio(url)
        audio.onended = () => setReproduciendo(null)
        audioRefs.current[id] = audio
      }
      audioRefs.current[id].play()
      setReproduciendo(id)
    }
  }

  // ── Borrar chat ───────────────────────────────────────────────────────────
  const borrarChat = async () => {
    setBorrando(true)
    try {
      await supabase
        .from('chat_especialista_admin')
        .delete()
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      setMensajes([])
      setMostrarConfirmBorrar(false)
      toast.success('Chat borrado')
    } catch {
      toast.error('Error al borrar')
    } finally {
      setBorrando(false)
    }
  }

  // ── Context menu ──────────────────────────────────────────────────────────
  const openContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 220)
    const y = Math.min(e.clientY, window.innerHeight - 320)
    setContextMenu({ msgId, x, y })
    setContextMsgId(msgId)
  }

  const handleReaction = async (msgId: string, emoji: string) => {
    await supabase
      .from('chat_especialista_admin')
      .update({ reaction: emoji } as any)
      .eq('id', msgId)
    setMensajes((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reaction: emoji } : m))
    )
  }

  const handleDelete = async (msgId: string) => {
    await supabase.from('chat_especialista_admin').delete().eq('id', msgId)
    setMensajes((prev) => prev.filter((m) => m.id !== msgId))
  }

  const handleCopy = (msgId: string) => {
    const msg = mensajes.find((m) => m.id === msgId)
    if (msg) navigator.clipboard.writeText(msg.content)
    toast.success('Copiado')
  }

  // ── Utilidades ────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  const formatFecha = (iso: string) => {
    const d = new Date(iso), hoy = new Date(), ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
  }
  const formatTiempo = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const mensajesAgrupados: { fecha: string; items: Mensaje[] }[] = []
  mensajes.forEach((m) => {
    const fecha = formatFecha(m.created_at)
    const last = mensajesAgrupados[mensajesAgrupados.length - 1]
    if (last && last.fecha === fecha) last.items.push(m)
    else mensajesAgrupados.push({ fecha, items: [m] })
  })

  const contextMsg = contextMsgId ? mensajes.find((m) => m.id === contextMsgId) : null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {contextMenu && contextMsg && (
        <MessageContextMenu
          menu={contextMenu}
          esMio={contextMsg.sender_id === userId}
          onClose={() => { setContextMenu(null); setContextMsgId(null) }}
          onReply={() => setReplyTo(contextMsg)}
          onCopy={() => handleCopy(contextMsg.id)}
          onReact={(emoji) => handleReaction(contextMsg.id, emoji)}
          onForward={() => toast.success('Función de reenvío próximamente')}
          onPin={() => toast.success('Mensaje fijado')}
          onStar={() => toast.success('Mensaje destacado')}
          onReport={() => toast.success('Mensaje reportado')}
          onDelete={() => handleDelete(contextMsg.id)}
        />
      )}

      <div className="flex flex-col h-[calc(100vh-160px)] min-h-[400px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-3 shadow-sm">
          {/* Mi avatar + upload */}
          <AvatarUpload
            userId={userId}
            currentUrl={myAvatar}
            name={userName}
            onUpdate={(url) => setMyAvatar(url)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800">{userName}</p>
            <p className="text-[10px] text-slate-400">Toca la foto para cambiarla</p>
          </div>

          {/* Chat con jefe */}
          {jefeSeleccionado && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100">
              <Avatar name={jefeSeleccionado.full_name} avatarUrl={jefeSeleccionado.avatar_url} size="sm" online />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">
                  {jefeSeleccionado.full_name}
                </p>
                <p className="text-[9px] text-emerald-500 font-semibold">● En línea</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setMostrarConfirmBorrar(true)}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-400 transition-colors"
            title="Borrar chat"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Banner reply */}
        {replyTo && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-start gap-2">
            <Reply size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-600">{replyTo.sender_name}</p>
              <p className="text-[11px] text-slate-600 truncate">{replyTo.content.slice(0, 80)}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-400"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Mensajes */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(238,242,255,0.6) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,243,255,0.4) 0%, transparent 60%), #f8fafc',
          }}
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-blue-500" />
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <MessageCircle size={28} className="text-indigo-300" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Inicia una conversación</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Canal directo con el jefe. Envía mensajes, archivos y notas de voz.
              </p>
            </div>
          ) : (
            mensajesAgrupados.map((grupo) => (
              <div key={grupo.fecha}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200/70" />
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    {grupo.fecha}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/70" />
                </div>
                <div className="space-y-0.5">
                  {grupo.items.map((msg, idx) => {
                    const esMio = msg.sender_id === userId
                    const prevMsg = idx > 0 ? grupo.items[idx - 1] : null
                    const mismoEmisor = prevMsg?.sender_id === msg.sender_id
                    const isAudio = msg.message_type === 'audio'
                    const isImage = msg.message_type === 'file' && msg.file_type?.startsWith('image/')
                    const isFile = msg.message_type === 'file' && !msg.file_type?.startsWith('image/')

                    const avatarUrl = esMio
                      ? myAvatar
                      : jefeSeleccionado?.avatar_url

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${esMio ? 'justify-end' : 'justify-start'} ${mismoEmisor ? 'mt-0.5' : 'mt-3'}`}
                      >
                        {!esMio && (
                          <div className={`flex-shrink-0 ${mismoEmisor ? 'opacity-0 pointer-events-none' : ''}`}>
                            <Avatar
                              name={msg.sender_name}
                              avatarUrl={jefeSeleccionado?.avatar_url}
                              size="sm"
                            />
                          </div>
                        )}

                        <div
                          className={`max-w-[72%] flex flex-col group ${esMio ? 'items-end' : 'items-start'}`}
                          onContextMenu={(e) => openContextMenu(e, msg.id)}
                        >
                          {!mismoEmisor && !esMio && (
                            <p className="text-[10px] font-bold text-indigo-500 mb-1 ml-1">
                              {msg.sender_name}
                            </p>
                          )}

                          {isImage && msg.file_url && (
                            <div className="relative">
                              <a href={msg.file_url} target="_blank" rel="noreferrer">
                                <img
                                  src={msg.file_url}
                                  alt="imagen"
                                  className="max-w-[220px] rounded-2xl border border-slate-200 shadow-sm hover:opacity-90 transition-opacity"
                                />
                              </a>
                              {msg.reaction && (
                                <span className="absolute -bottom-2 -right-1 text-base bg-white rounded-full shadow-sm px-1">
                                  {msg.reaction}
                                </span>
                              )}
                            </div>
                          )}

                          {isFile && msg.file_url && (
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm hover:opacity-80 transition-opacity
                                ${esMio
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : 'bg-white text-slate-800 border-slate-200'
                                }`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${esMio ? 'bg-indigo-500' : 'bg-slate-100'}`}>
                                <FileText size={16} className={esMio ? 'text-white' : 'text-slate-500'} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate max-w-[150px]">{msg.file_name}</p>
                                <p className={`text-[10px] ${esMio ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  Toca para abrir
                                </p>
                              </div>
                            </a>
                          )}

                          {isAudio && msg.file_url && (
                            <div
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm min-w-[200px]
                                ${esMio ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-slate-200'}`}
                            >
                              <button
                                onClick={() => toggleAudio(msg.id, msg.file_url!)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                                  ${esMio ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-100 hover:bg-indigo-200'}`}
                              >
                                {reproduciendo === msg.id
                                  ? <Pause size={15} className={esMio ? 'text-white' : 'text-indigo-600'} />
                                  : <Play size={15} className={esMio ? 'text-white' : 'text-indigo-600'} />}
                              </button>
                              <div className="flex-1">
                                <div className={`h-1.5 rounded-full ${esMio ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                                <p className={`text-[10px] mt-1 ${esMio ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  Nota de voz
                                </p>
                              </div>
                            </div>
                          )}

                          {(!msg.message_type || msg.message_type === 'text') && (
                            <div className="relative">
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                  ${esMio
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                                  }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              {msg.reaction && (
                                <span className="absolute -bottom-2 -right-1 text-base bg-white rounded-full shadow-sm px-1 border border-slate-100">
                                  {msg.reaction}
                                </span>
                              )}
                            </div>
                          )}

                          <div className={`flex items-center gap-1 mt-1.5 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] text-slate-400">{formatHora(msg.created_at)}</span>
                            {esMio && (msg.read_at
                              ? <CheckCheck size={11} className="text-indigo-400" />
                              : <Check size={11} className="text-slate-300" />)}
                          </div>
                        </div>

                        {esMio && (
                          <div className={`flex-shrink-0 ${mismoEmisor ? 'opacity-0 pointer-events-none' : ''}`}>
                            <Avatar name={userName} avatarUrl={myAvatar} size="sm" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Preview audio */}
        {audioUrl && !grabando && (
          <div className="bg-indigo-50 border-t border-indigo-100 px-4 py-3 flex items-center gap-3">
            <Mic size={16} className="text-indigo-500 flex-shrink-0" />
            <audio src={audioUrl} controls className="flex-1 h-8" style={{ minWidth: 0 }} />
            <button onClick={cancelarAudio} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-400 flex-shrink-0">
              <X size={14} />
            </button>
            <button
              onClick={enviarAudio}
              disabled={subiendo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
            >
              {subiendo ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Enviar
            </button>
          </div>
        )}

        {/* Barra grabando */}
        {grabando && (
          <div className="bg-red-50 border-t border-red-100 px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-sm font-bold text-red-600 flex-1">
              Grabando... {formatTiempo(tiempoGrabacion)}
            </span>
            <button
              onClick={detenerGrabacion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600"
            >
              <Square size={12} /> Detener
            </button>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-slate-100 px-4 py-3">
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendo || grabando}
              className="w-9 h-9 flex-shrink-0 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40"
              title="Adjuntar archivo"
            >
              {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleArchivo}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />

            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all">
              <textarea
                ref={textareaRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje…"
                rows={1}
                disabled={grabando}
                className="w-full bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder:text-slate-400 max-h-32 disabled:opacity-50"
                style={{ lineHeight: '1.5' }}
              />
            </div>

            <button
              onMouseDown={iniciarGrabacion}
              onMouseUp={detenerGrabacion}
              onTouchStart={iniciarGrabacion}
              onTouchEnd={detenerGrabacion}
              disabled={subiendo || !!audioUrl}
              className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40
                ${grabando
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                }`}
              title="Mantén presionado para grabar"
            >
              {grabando ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {texto.trim() && (
              <button
                onClick={enviar}
                disabled={enviando}
                className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-sm shadow-indigo-200"
              >
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
            Shift+Enter nueva línea · Mantén 🎤 para grabar · Clic derecho en mensaje para más opciones
          </p>
        </div>
      </div>

      {/* Modal borrar */}
      {mostrarConfirmBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-black text-slate-800 text-center mb-1">¿Borrar todo el chat?</h3>
            <p className="text-xs text-slate-400 text-center mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmBorrar(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={borrarChat}
                disabled={borrando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {borrando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {borrando ? 'Borrando...' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
