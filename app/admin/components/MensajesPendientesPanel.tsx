'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, MessageCircle, CheckCircle, XCircle, Edit3, Send,
  Clock, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  AlertTriangle, User, Baby, FileText, Eye, Loader2, X,
  TrendingUp, Target, Home, Star, Zap
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface PendingMessage {
  id: string
  child_id: string
  parent_id: string
  source: string
  source_title: string
  ai_message: string
  edited_message: string
  ai_analysis: any
  session_data: any
  status: 'pending_approval' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  children?: { name: string }
  profiles?: { full_name: string; email: string }
}

export default function MensajesPendientesPanel() {
  const toast = useToast()
  const [messages, setMessages] = useState<PendingMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending_approval' | 'approved' | 'rejected'>('pending_approval')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [previewAnalysis, setPreviewAnalysis] = useState<any>(null)

  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/parent-messages?status=${statusFilter}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setMessages(json.data || [])
    } catch (err: any) {
      toast.error('Error cargando mensajes: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadMessages() }, [loadMessages])

  const startEdit = (msg: PendingMessage) => {
    setEditingId(msg.id)
    setEditText(msg.edited_message || msg.ai_message)
    setExpanded(msg.id)
  }

  const saveEdit = async (id: string) => {
    setActionLoading(id + '_save')
    try {
      const res = await fetch('/api/admin/parent-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, edited_message: editText, action: 'save_edit' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Cambios guardados')
      setEditingId(null)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, edited_message: editText } : m))
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const approveMessage = async (id: string) => {
    const msg = messages.find(m => m.id === id)
    const textToSend = editingId === id ? editText : (msg?.edited_message || msg?.ai_message)
    setActionLoading(id + '_approve')
    try {
      const res = await fetch('/api/admin/parent-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, edited_message: textToSend, action: 'approve' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('✅ Mensaje aprobado y enviado al padre/madre')
      setEditingId(null)
      loadMessages()
    } catch (err: any) {
      toast.error('Error al aprobar: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const rejectMessage = async (id: string) => {
    if (!confirm('¿Descartar este mensaje? No llegará al padre/madre.')) return
    setActionLoading(id + '_reject')
    try {
      const res = await fetch('/api/admin/parent-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success('Mensaje descartado')
      loadMessages()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const sourceLabel: Record<string, string> = {
    parent_form: '📝 Formulario de Padre', session_report: '📊 Reporte de Sesión',
    neuroforma: '🧠 NeuroForma', evaluacion: '📋 Evaluación', entorno_hogar: '🏠 Entorno Hogar',
  }
  const pendingCount = messages.filter(m => m.status === 'pending_approval').length

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-black text-2xl text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl">
              <ShieldCheck className="text-amber-600" size={26}/>
            </div>
            Bandeja de Aprobación
          </h2>
          <p className="text-slate-400 text-sm mt-1 ml-1">
            Revisa, edita y autoriza mensajes antes de enviarlos a los padres
          </p>
        </div>
        <button onClick={loadMessages}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-amber-400 hover:text-amber-600 transition-all">
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18}/>
        <div>
          <p className="font-black text-amber-800 text-sm">Flujo de aprobación activo</p>
          <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
            <strong>Ningún mensaje llega a los padres sin tu autorización.</strong> Los mensajes generados por IA — de formularios, sesiones y evaluaciones — quedan aquí primero para que los revises y apruebes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        {([
          { key: 'pending_approval', label: '⏳ Pendientes' },
          { key: 'approved',         label: '✅ Enviados' },
          { key: 'rejected',         label: '🗑️ Descartados' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${statusFilter === key ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
            {key === 'pending_approval' && pendingCount > 0 && (
              <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/>
          <p className="text-slate-400 text-sm font-medium">Cargando...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-14 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={26} className="text-slate-300"/>
          </div>
          <p className="font-bold text-slate-500">
            {statusFilter === 'pending_approval' ? 'No hay mensajes pendientes' :
             statusFilter === 'approved' ? 'No hay mensajes enviados aún' : 'Sin mensajes descartados'}
          </p>
          {statusFilter === 'pending_approval' && (
            <p className="text-xs text-slate-300 mt-1">Los mensajes aparecerán aquí cuando la IA los genere</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => {
            const isExpanded = expanded === msg.id
            const isEditing = editingId === msg.id
            const hasBeenEdited = msg.edited_message !== msg.ai_message
            const isLoadingApprove = actionLoading === msg.id + '_approve'
            const isLoadingReject = actionLoading === msg.id + '_reject'
            const isLoadingSave = actionLoading === msg.id + '_save'
            const analysis = msg.ai_analysis || {}

            return (
              <div key={msg.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                  msg.status === 'pending_approval' ? 'border-amber-200' :
                  msg.status === 'approved' ? 'border-emerald-200' : 'border-slate-200 opacity-70'
                }`}>

                {/* Card header */}
                <div className="p-5 cursor-pointer hover:bg-slate-50/50 transition-all"
                  onClick={() => setExpanded(isExpanded ? null : msg.id)}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-violet-100">
                      {sourceLabel[msg.source]?.split(' ')[0] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-slate-800 text-sm">{msg.source_title || 'Mensaje generado por IA'}</p>
                        {hasBeenEdited && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black border border-blue-200">✏️ Editado</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                          msg.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          msg.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {msg.status === 'pending_approval' ? '⏳ Pendiente' : msg.status === 'approved' ? '✅ Enviado' : '🗑️ Descartado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Baby size={10}/> {msg.children?.name || 'Paciente'}</span>
                        <span className="flex items-center gap-1"><User size={10}/> {msg.profiles?.full_name || 'Padre/Madre'}</span>
                        <span className="flex items-center gap-1"><Clock size={10}/> {new Date(msg.created_at).toLocaleDateString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">"{msg.edited_message || msg.ai_message}"</p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0"/> : <ChevronDown size={16} className="text-slate-400 shrink-0"/>}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-5">

                    {/* AI Analysis Preview */}
                    {analysis.resumen_ejecutivo && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} className="text-violet-500"/> Análisis Clínico Generado
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{analysis.resumen_ejecutivo}</p>

                        <div className="grid grid-cols-2 gap-3">
                          {analysis.areas_fortaleza?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">💪 Fortalezas</p>
                              <ul className="space-y-1">
                                {analysis.areas_fortaleza.slice(0,3).map((f: string, i: number) => (
                                  <li key={i} className="text-xs text-slate-600 bg-emerald-50 rounded-lg p-2 border border-emerald-100">• {f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.areas_trabajo?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">🎯 Áreas de Trabajo</p>
                              <ul className="space-y-1">
                                {analysis.areas_trabajo.slice(0,3).map((a: string, i: number) => (
                                  <li key={i} className="text-xs text-slate-600 bg-orange-50 rounded-lg p-2 border border-orange-100">• {a}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {analysis.actividades_en_casa?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">🏠 Actividades en Casa</p>
                            <ul className="space-y-1">
                              {analysis.actividades_en_casa.map((a: string, i: number) => (
                                <li key={i} className="text-xs text-slate-600 bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-start gap-2">
                                  <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shrink-0">{i+1}</span>{a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.recomendaciones?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">💡 Recomendaciones Terapéuticas</p>
                            <ul className="space-y-1">
                              {analysis.recomendaciones.slice(0,3).map((r: string, i: number) => (
                                <li key={i} className="text-xs text-slate-600 bg-violet-50 rounded-lg p-2 border border-violet-100">• {r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Original AI message */}
                    <div>
                      <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Sparkles size={12}/> Mensaje original de la IA
                      </p>
                      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-4 text-white">
                        <p className="text-sm leading-relaxed text-blue-100">{msg.ai_message}</p>
                      </div>
                    </div>

                    {/* Editable message - only for pending */}
                    {msg.status === 'pending_approval' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Edit3 size={12}/> {isEditing ? 'Editando mensaje...' : 'Mensaje a enviar'}
                          </p>
                          {!isEditing && (
                            <button onClick={() => startEdit(msg)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all">
                              <Edit3 size={11}/> Editar
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              rows={4}
                              className="w-full p-4 bg-white border-2 border-blue-300 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                              placeholder="Edita el mensaje para los padres..."
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setEditingId(null)}
                                className="px-4 py-2 text-slate-500 font-bold text-sm bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                                Cancelar
                              </button>
                              <button onClick={() => saveEdit(msg.id)} disabled={!!isLoadingSave}
                                className="px-4 py-2 text-blue-600 font-bold text-sm bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center gap-1.5">
                                {isLoadingSave ? <Loader2 size={14} className="animate-spin"/> : null} Guardar cambios
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
                            <p className="text-sm leading-relaxed text-blue-100">{msg.edited_message || msg.ai_message}</p>
                          </div>
                        )}

                        {/* Approve / Reject */}
                        <div className="flex gap-3 mt-4">
                          <button onClick={() => rejectMessage(msg.id)} disabled={!!isLoadingReject}
                            className="flex-1 py-3 px-4 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoadingReject ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>}
                            Descartar
                          </button>
                          <button onClick={() => approveMessage(msg.id)} disabled={!!isLoadingApprove}
                            className="flex-[2] py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoadingApprove ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                            {isLoadingApprove ? 'Enviando...' : '✅ Aprobar y Enviar al Padre/Madre'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Already approved info */}
                    {msg.status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                          <CheckCircle size={16}/> Enviado al padre/madre
                        </p>
                        {msg.approved_at && <p className="text-xs text-emerald-600 mt-1">{new Date(msg.approved_at).toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>}
                        <div className="mt-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl p-3 text-white">
                          <p className="text-xs text-emerald-100 leading-relaxed">{msg.edited_message || msg.ai_message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
