'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  Send, Loader2, MessageCircle, CheckCheck, Check,
  Search, RefreshCw, Users, Circle
} from 'lucide-react'

interface Especialista {
  id: string
  full_name: string
  specialty: string | null
  role: string
  unread: number
  lastMessage: string | null
  lastTime: string | null
}

interface Mensaje {
  id: string
  content: string
  sender_id: string
  sender_role: string
  sender_name: string
  created_at: string
  read_at: string | null
}

export default function ChatEspecialistas({ userId, userName }: { userId: string; userName: string }) {
  const toast = useToast()
  const [especialistas, setEspecialistas] = useState<Especialista[]>([])
  const [seleccionado, setSeleccionado] = useState<Especialista | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loadingEsp, setLoadingEsp] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollAbajo = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [])

  const cargarEspecialistas = useCallback(async () => {
    try {
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, full_name, specialty, role')
        .in('role', ['especialista', 'terapeuta'])
        .order('full_name')

      if (!perfiles) return

      // Para cada especialista, contar mensajes no leídos y último mensaje
      const conInfo = await Promise.all(
        perfiles.map(async (p) => {
          const { data: msgs } = await supabase
            .from('chat_especialista_admin')
            .select('content, created_at, read_at, sender_id')
            .or(`sender_id.eq.${p.id},recipient_id.eq.${p.id}`)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count } = await supabase
            .from('chat_especialista_admin')
            .select('id', { count: 'exact', head: true })
            .eq('sender_id', p.id)
            .is('read_at', null)

          const last = msgs?.[0]
          return {
            ...p,
            unread: count || 0,
            lastMessage: last?.content || null,
            lastTime: last?.created_at || null,
          }
        })
      )

      // Ordenar: primero los que tienen mensajes no leídos, luego por último mensaje
      conInfo.sort((a, b) => {
        if (b.unread !== a.unread) return b.unread - a.unread
        if (a.lastTime && b.lastTime) return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
        return 0
      })

      setEspecialistas(conInfo)
    } catch {
      toast.error('Error al cargar especialistas')
    } finally {
      setLoadingEsp(false)
    }
  }, [])

  const cargarMensajes = useCallback(async (espId: string) => {
    setLoadingMsg(true)
    try {
      const { data, error } = await supabase
        .from('chat_especialista_admin')
        .select('*')
        .or(`sender_id.eq.${espId},recipient_id.eq.${espId}`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMensajes(data || [])
      scrollAbajo()

      // Marcar como leídos los que me enviaron
      const noLeidos = (data || []).filter(
        (m: Mensaje) => m.sender_id === espId && !m.read_at
      )
      if (noLeidos.length > 0) {
        await supabase
          .from('chat_especialista_admin')
          .update({ read_at: new Date().toISOString() })
          .in('id', noLeidos.map((m: Mensaje) => m.id))

        // Actualizar contador local
        setEspecialistas(prev =>
          prev.map(e => e.id === espId ? { ...e, unread: 0 } : e)
        )
      }
    } catch {
      toast.error('Error al cargar mensajes')
    } finally {
      setLoadingMsg(false)
    }
  }, [scrollAbajo])

  useEffect(() => {
    cargarEspecialistas()
  }, [cargarEspecialistas])

  useEffect(() => {
    if (!seleccionado) return
    cargarMensajes(seleccionado.id)

    const channel = supabase
      .channel('admin_chat_' + seleccionado.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_especialista_admin' },
        (payload) => {
          const nuevo = payload.new as Mensaje
          setMensajes(prev => {
            if (prev.find(m => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
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

    return () => { supabase.removeChannel(channel) }
  }, [seleccionado, cargarMensajes, userId, scrollAbajo])

  useEffect(() => { scrollAbajo() }, [mensajes, scrollAbajo])

  const enviar = async () => {
    const contenido = texto.trim()
    if (!contenido || enviando || !seleccionado) return

    setEnviando(true)
    setTexto('')

    try {
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: contenido,
        sender_id: userId,
        sender_role: 'jefe',
        sender_name: userName,
        recipient_id: seleccionado.id,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const formatHora = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  const formatFecha = (iso: string) => {
    const d = new Date(iso)
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
  }

  const mensajesAgrupados: { fecha: string; items: Mensaje[] }[] = []
  mensajes.forEach(m => {
    const fecha = formatFecha(m.created_at)
    const last = mensajesAgrupados[mensajesAgrupados.length - 1]
    if (last && last.fecha === fecha) last.items.push(m)
    else mensajesAgrupados.push({ fecha, items: [m] })
  })

  const filtrados = especialistas.filter(e =>
    e.full_name.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

      {/* Panel izquierdo — lista de especialistas */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Users size={15} className="text-blue-500" /> Especialistas
            </h2>
            <button
              onClick={cargarEspecialistas}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingEsp ? (
            <div className="flex justify-center py-10">
              <Loader2 size={18} className="animate-spin text-blue-400" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-slate-400">No hay especialistas registrados</p>
            </div>
          ) : (
            filtrados.map(esp => (
              <button
                key={esp.id}
                onClick={() => setSeleccionado(esp)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-colors
                  ${seleccionado?.id === esp.id
                    ? 'bg-blue-50 border-l-2 border-l-blue-500'
                    : 'hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm">
                      {esp.full_name.charAt(0).toUpperCase()}
                    </div>
                    {esp.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {esp.unread > 9 ? '9+' : esp.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${esp.unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {esp.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {esp.specialty || esp.role}
                    </p>
                    {esp.lastMessage && (
                      <p className={`text-[10px] truncate mt-1 ${esp.unread > 0 ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                        {esp.lastMessage}
                      </p>
                    )}
                  </div>
                  {esp.lastTime && (
                    <span className="text-[9px] text-slate-400 flex-shrink-0 mt-0.5">
                      {formatHora(esp.lastTime)}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Panel derecho — conversación */}
      <div className="flex-1 flex flex-col min-w-0">
        {!seleccionado ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-slate-50/50">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center">
              <MessageCircle size={36} className="text-blue-300" />
            </div>
            <div>
              <p className="text-slate-600 font-bold text-base">Selecciona un especialista</p>
              <p className="text-slate-400 text-sm mt-1">
                Elige un especialista de la lista para ver su conversación
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black shadow-md shadow-blue-200">
                  {seleccionado.full_name.charAt(0).toUpperCase()}
                </div>
                <Circle size={10} className="absolute bottom-0 right-0 fill-emerald-400 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">{seleccionado.full_name}</p>
                <p className="text-[11px] text-slate-400">{seleccionado.specialty || seleccionado.role}</p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white px-4 py-4 space-y-1">
              {loadingMsg ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-blue-400" />
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <MessageCircle size={24} className="text-blue-300" />
                  </div>
                  <p className="text-slate-400 text-sm">Sin mensajes aún con este especialista</p>
                </div>
              ) : (
                mensajesAgrupados.map(grupo => (
                  <div key={grupo.fecha}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {grupo.fecha}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="space-y-1">
                      {grupo.items.map((msg, idx) => {
                        const esMio = msg.sender_id === userId
                        const prevMsg = idx > 0 ? grupo.items[idx - 1] : null
                        const mismoEmisor = prevMsg?.sender_id === msg.sender_id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${esMio ? 'justify-end' : 'justify-start'} ${mismoEmisor ? 'mt-0.5' : 'mt-3'}`}
                          >
                            <div className={`max-w-[72%] ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                              {!mismoEmisor && !esMio && (
                                <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.sender_name}</p>
                              )}
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                  ${esMio
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                                  }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${esMio ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-[10px] text-slate-400">{formatHora(msg.created_at)}</span>
                                {esMio && (
                                  msg.read_at
                                    ? <CheckCheck size={11} className="text-blue-400" />
                                    : <Check size={11} className="text-slate-300" />
                                )}
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

            {/* Input */}
            <div className="bg-white border-t border-slate-100 px-4 py-3">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Escribe a ${seleccionado.full_name.split(' ')[0]}…`}
                    rows={1}
                    className="w-full bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder:text-slate-400 max-h-32"
                    style={{ lineHeight: '1.5' }}
                  />
                </div>
                <button
                  onClick={enviar}
                  disabled={!texto.trim() || enviando}
                  className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-sm shadow-blue-200 disabled:shadow-none"
                >
                  {enviando
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />
                  }
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Shift+Enter para nueva línea</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
