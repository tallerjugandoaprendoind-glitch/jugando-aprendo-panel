'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  Send, Loader2, MessageCircle, CheckCheck, Check,
  RefreshCw, Paperclip, Smile, MoreVertical
} from 'lucide-react'

interface Mensaje {
  id: string
  content: string
  sender_id: string
  sender_role: 'especialista' | 'jefe'
  sender_name: string
  created_at: string
  read_at: string | null
}

export default function ChatConAdmin({ userId, userName }: { userId: string; userName: string }) {
  const toast = useToast()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [adminInfo, setAdminInfo] = useState<{ name: string; online: boolean } | null>(null)

  const scrollAbajo = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
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

      // Marcar como leídos los mensajes recibidos
      const noLeidos = (data || []).filter(
        (m: Mensaje) => m.sender_id !== userId && !m.read_at
      )
      if (noLeidos.length > 0) {
        await supabase
          .from('chat_especialista_admin')
          .update({ read_at: new Date().toISOString() })
          .in('id', noLeidos.map((m: Mensaje) => m.id))
      }
    } catch (e: any) {
      toast.error('Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }, [userId, scrollAbajo])

  const cargarAdminInfo = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('role', 'jefe')
        .limit(1)
        .single()
      if (data) {
        setAdminInfo({ name: data.full_name || 'Administrador', online: false })
      }
    } catch {}
  }, [])

  useEffect(() => {
    cargarMensajes()
    cargarAdminInfo()

    // Suscripción en tiempo real
    const channel = supabase
      .channel('chat_especialista_admin_' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_especialista_admin',
        },
        (payload) => {
          const nuevo = payload.new as Mensaje
          // Solo agregar si me involucra
          setMensajes(prev => {
            if (prev.find(m => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
          scrollAbajo()
          // Marcar como leído si lo recibo yo
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
  }, [userId, cargarMensajes, cargarAdminInfo, scrollAbajo])

  useEffect(() => { scrollAbajo() }, [mensajes, scrollAbajo])

  const enviar = async () => {
    const contenido = texto.trim()
    if (!contenido || enviando) return

    setEnviando(true)
    setTexto('')

    // Obtener recipient (jefe)
    const { data: adminData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'jefe')
      .limit(1)
      .single()

    try {
      const { error } = await supabase.from('chat_especialista_admin').insert({
        content: contenido,
        sender_id: userId,
        sender_role: 'especialista',
        sender_name: userName,
        recipient_id: adminData?.id || null,
        read_at: null,
      })
      if (error) throw error
    } catch (e: any) {
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

  const formatHora = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (iso: string) => {
    const d = new Date(iso)
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })
  }

  // Agrupar mensajes por fecha
  const mensajesAgrupados: { fecha: string; items: Mensaje[] }[] = []
  mensajes.forEach(m => {
    const fecha = formatFecha(m.created_at)
    const last = mensajesAgrupados[mensajesAgrupados.length - 1]
    if (last && last.fecha === fecha) {
      last.items.push(m)
    } else {
      mensajesAgrupados.push({ fecha, items: [m] })
    }
  })

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      {/* Header del chat */}
      <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 px-5 py-4 flex items-center gap-3 shadow-sm">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200">
            {(adminInfo?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-slate-800">{adminInfo?.name || 'Jefe'}</p>
          <p className="text-[11px] text-emerald-500 font-semibold">En línea</p>
        </div>
        <button
          onClick={cargarMensajes}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white border-x border-slate-200 px-4 py-4 space-y-1">
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
              Este es tu canal directo con el jefe. Puedes hacer consultas, reportar situaciones o coordinar lo que necesites.
            </p>
          </div>
        ) : (
          mensajesAgrupados.map(grupo => (
            <div key={grupo.fecha}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {grupo.fecha}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Mensajes del grupo */}
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
                      <div className={`max-w-[75%] ${esMio ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!mismoEmisor && !esMio && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.sender_name}</p>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${esMio
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                            }
                            ${mismoEmisor && esMio ? 'rounded-tr-2xl' : ''}
                            ${mismoEmisor && !esMio ? 'rounded-tl-2xl' : ''}
                          `}
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
      <div className="bg-white rounded-b-2xl border border-slate-200 border-t px-4 py-3 shadow-sm">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje… (Enter para enviar)"
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
    </div>
  )
}
