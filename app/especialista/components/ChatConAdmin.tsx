'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  Send, Loader2, MessageCircle, CheckCheck, Check,
  RefreshCw, Paperclip, Mic, MicOff, Trash2, X,
  FileText, Play, Pause, Square
} from 'lucide-react'

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
}

interface Jefe {
  id: string
  full_name: string
  role: string
}

export default function ChatConAdmin({ userId, userName }: { userId: string; userName: string }) {
  const toast = useToast()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [jefes, setJefes] = useState<Jefe[]>([])
  const [jefeSeleccionado, setJefeSeleccionado] = useState<Jefe | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [grabando, setGrabando] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [reproduciendo, setReproduciendo] = useState<string | null>(null)
  const [mostrarConfirmBorrar, setMostrarConfirmBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0)

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

  const cargarJefes = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'jefe')
      .order('full_name')
    if (data && data.length > 0) {
      setJefes(data)
      setJefeSeleccionado(data[0])
    }
  }, [])

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
      const noLeidos = (data || []).filter((m: Mensaje) => m.sender_id !== userId && !m.read_at)
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
      .channel('chat_esp_' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_especialista_admin' }, (payload) => {
        const nuevo = payload.new as Mensaje
        setMensajes(prev => prev.find(m => m.id === nuevo.id) ? prev : [...prev, nuevo])
        scrollAbajo()
        if (nuevo.sender_id !== userId) {
          supabase.from('chat_especialista_admin').update({ read_at: new Date().toISOString() }).eq('id', nuevo.id).then(() => {})
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_especialista_admin' }, () => {
        cargarMensajes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, cargarMensajes, cargarJefes, scrollAbajo])

  useEffect(() => { scrollAbajo() }, [mensajes, scrollAbajo])

  const enviar = async () => {
    const contenido = texto.trim()
    if (!contenido || enviando || !jefeSeleccionado) return
    setEnviando(true)
    setTexto('')
    try {
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: contenido,
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

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !jefeSeleccionado) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return }
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `chat/${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('chat-files').upload(path, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path)
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
      if (error) throw error
      toast.success('Archivo enviado')
    } catch {
      toast.error('Error al subir archivo')
    } finally {
      setSubiendo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setGrabando(true)
      setTiempoGrabacion(0)
      timerRef.current = setInterval(() => setTiempoGrabacion(t => t + 1), 1000)
    } catch {
      toast.error('No se pudo acceder al micrófono')
    }
  }

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setGrabando(false)
    if (timerRef.current) clearInterval(timerRef.current)
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
      const path = `chat/${userId}/audio_${Date.now()}.webm`
      const { error: upErr } = await supabase.storage.from('chat-files').upload(path, audioBlob)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(path)
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: '🎤 Mensaje de voz',
        sender_id: userId,
        sender_role: 'especialista',
        sender_name: userName,
        recipient_id: jefeSeleccionado.id,
        message_type: 'audio',
        file_url: publicUrl,
        file_name: `audio_${Date.now()}.webm`,
        file_type: 'audio/webm',
        read_at: null,
      })
      if (error) throw error
      cancelarAudio()
      toast.success('Audio enviado')
    } catch {
      toast.error('Error al enviar audio')
    } finally {
      setSubiendo(false)
    }
  }

  const toggleAudio = (id: string, url: string) => {
    if (reproduciendo === id) {
      audioRefs.current[id]?.pause()
      setReproduciendo(null)
    } else {
      Object.values(audioRefs.current).forEach(a => a.pause())
      if (!audioRefs.current[id]) {
        const audio = new Audio(url)
        audio.onended = () => setReproduciendo(null)
        audioRefs.current[id] = audio
      }
      audioRefs.current[id].play()
      setReproduciendo(id)
    }
  }

  const borrarChat = async () => {
    setBorrando(true)
    try {
      const { error } = await supabase
        .from('chat_especialista_admin')
        .delete()
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      if (error) throw error
      setMensajes([])
      setMostrarConfirmBorrar(false)
      toast.success('Chat eliminado')
    } catch {
      toast.error('Error al borrar')
    } finally {
      setBorrando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const formatHora = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  const formatFecha = (iso: string) => {
    const d = new Date(iso), hoy = new Date(), ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
  }
  const formatTiempo = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const mensajesAgrupados: { fecha: string; items: Mensaje[] }[] = []
  mensajes.forEach(m => {
    const fecha = formatFecha(m.created_at)
    const last = mensajesAgrupados[mensajesAgrupados.length - 1]
    if (last && last.fecha === fecha) last.items.push(m)
    else mensajesAgrupados.push({ fecha, items: [m] })
  })

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">

      {/* Header */}
      <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 px-5 py-3 flex items-center gap-3 shadow-sm">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
            {(jefeSeleccionado?.full_name || 'J').charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          {jefes.length > 1 ? (
            <select
              value={jefeSeleccionado?.id || ''}
              onChange={e => setJefeSeleccionado(jefes.find(j => j.id === e.target.value) || null)}
              className="text-sm font-black text-slate-800 bg-transparent focus:outline-none cursor-pointer w-full"
            >
              {jefes.map(j => <option key={j.id} value={j.id}>{j.full_name}</option>)}
            </select>
          ) : (
            <p className="text-sm font-black text-slate-800 truncate">{jefeSeleccionado?.full_name || 'Jefe'}</p>
          )}
          <p className="text-[11px] text-emerald-500 font-semibold">En línea</p>
        </div>
        <button onClick={cargarMensajes} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors" title="Actualizar">
          <RefreshCw size={15} />
        </button>
        <button onClick={() => setMostrarConfirmBorrar(true)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Borrar chat">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white border-x border-slate-200 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <MessageCircle size={28} className="text-blue-400" />
            </div>
            <p className="text-slate-500 text-sm font-semibold">Inicia una conversación</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Canal directo con el jefe. Envía mensajes, archivos y notas de voz.
            </p>
          </div>
        ) : (
          mensajesAgrupados.map(grupo => (
            <div key={grupo.fecha}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{grupo.fecha}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-1">
                {grupo.items.map((msg, idx) => {
                  const esMio = msg.sender_id === userId
                  const prevMsg = idx > 0 ? grupo.items[idx - 1] : null
                  const mismoEmisor = prevMsg?.sender_id === msg.sender_id
                  const isAudio = msg.message_type === 'audio'
                  const isImage = msg.message_type === 'file' && msg.file_type?.startsWith('image/')
                  const isFile = msg.message_type === 'file' && !msg.file_type?.startsWith('image/')

                  return (
                    <div key={msg.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} ${mismoEmisor ? 'mt-0.5' : 'mt-3'}`}>
                      <div className={`max-w-[75%] flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                        {!mismoEmisor && !esMio && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.sender_name}</p>
                        )}

                        {isImage && msg.file_url && (
                          <a href={msg.file_url} target="_blank" rel="noreferrer">
                            <img src={msg.file_url} alt="imagen" className="max-w-[220px] rounded-2xl border border-slate-200 shadow-sm hover:opacity-90 transition-opacity" />
                          </a>
                        )}

                        {isFile && msg.file_url && (
                          <a href={msg.file_url} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm hover:opacity-80 transition-opacity
                              ${esMio ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-800 border-slate-200'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${esMio ? 'bg-blue-500' : 'bg-slate-100'}`}>
                              <FileText size={16} className={esMio ? 'text-white' : 'text-slate-500'} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate max-w-[150px]">{msg.file_name}</p>
                              <p className={`text-[10px] ${esMio ? 'text-blue-200' : 'text-slate-400'}`}>Toca para abrir</p>
                            </div>
                          </a>
                        )}

                        {isAudio && msg.file_url && (
                          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm min-w-[180px]
                            ${esMio ? 'bg-blue-600 border-blue-500' : 'bg-white border-slate-200'}`}>
                            <button
                              onClick={() => toggleAudio(msg.id, msg.file_url!)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                                ${esMio ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-100 hover:bg-blue-200'}`}
                            >
                              {reproduciendo === msg.id
                                ? <Pause size={15} className={esMio ? 'text-white' : 'text-blue-600'} />
                                : <Play size={15} className={esMio ? 'text-white' : 'text-blue-600'} />}
                            </button>
                            <div className="flex-1">
                              <div className={`h-1 rounded-full ${esMio ? 'bg-blue-400' : 'bg-slate-200'}`} />
                              <p className={`text-[10px] mt-1 ${esMio ? 'text-blue-200' : 'text-slate-400'}`}>Nota de voz</p>
                            </div>
                          </div>
                        )}

                        {(!msg.message_type || msg.message_type === 'text') && (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${esMio ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-1 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[10px] text-slate-400">{formatHora(msg.created_at)}</span>
                          {esMio && (msg.read_at
                            ? <CheckCheck size={11} className="text-blue-400" />
                            : <Check size={11} className="text-slate-300" />)}
                        </div>
                      </div>
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
        <div className="bg-blue-50 border-x border-blue-200 px-4 py-3 flex items-center gap-3">
          <Mic size={16} className="text-blue-500 flex-shrink-0" />
          <audio src={audioUrl} controls className="flex-1 h-8" style={{ minWidth: 0 }} />
          <button onClick={cancelarAudio} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 flex-shrink-0">
            <X size={14} />
          </button>
          <button onClick={enviarAudio} disabled={subiendo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex-shrink-0">
            {subiendo ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Enviar
          </button>
        </div>
      )}

      {/* Barra grabando */}
      {grabando && (
        <div className="bg-red-50 border-x border-red-200 px-4 py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-sm font-bold text-red-600 flex-1">Grabando... {formatTiempo(tiempoGrabacion)}</span>
          <button onClick={detenerGrabacion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600">
            <Square size={12} /> Detener
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-b-2xl border border-slate-200 border-t px-4 py-3 shadow-sm">
        <div className="flex items-end gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={subiendo || grabando}
            className="w-9 h-9 flex-shrink-0 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40"
            title="Adjuntar archivo">
            {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleArchivo}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
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
              ${grabando ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
            title="Mantén presionado para grabar">
            {grabando ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {texto.trim() && (
            <button onClick={enviar} disabled={enviando}
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-sm shadow-blue-200">
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Shift+Enter nueva línea · Mantén 🎤 para grabar</p>
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
              <button onClick={() => setMostrarConfirmBorrar(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={borrarChat} disabled={borrando}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {borrando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {borrando ? 'Borrando...' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
