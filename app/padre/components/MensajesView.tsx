'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MessageCircle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Sparkles, Baby, RefreshCw, Home, Target, Activity, BookOpen
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: {
    source?: string
    source_title?: string
    child_id?: string
    ai_analysis?: any
    form_type?: string
  }
}

const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  parent_form:     { label: 'Formulario respondido',  icon: '📝', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  session_report:  { label: 'Reporte de sesión',      icon: '📊', color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  neuroforma:      { label: 'NeuroForma',              icon: '🧠', color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
  evaluacion:      { label: 'Evaluación',              icon: '📋', color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200' },
  entorno_hogar:   { label: 'Entorno del hogar',       icon: '🏠', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  parent_message:  { label: 'Mensaje del terapeuta',   icon: '💬', color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AnalysisCard({ analysis }: { analysis: any }) {
  if (!analysis) return null
  const { resumen_ejecutivo, areas_fortaleza, areas_trabajo, actividades_en_casa, recomendaciones } = analysis
  if (!resumen_ejecutivo && !areas_fortaleza?.length) return null

  return (
    <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Sparkles size={12} className="text-violet-500" /> Análisis clínico del terapeuta
      </p>

      {resumen_ejecutivo && (
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
          {resumen_ejecutivo}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {areas_fortaleza?.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Activity size={10} /> Fortalezas
            </p>
            <ul className="space-y-1.5">
              {areas_fortaleza.slice(0, 4).map((f: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 leading-relaxed">
                  💪 {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {areas_trabajo?.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Target size={10} /> Áreas de trabajo
            </p>
            <ul className="space-y-1.5">
              {areas_trabajo.slice(0, 4).map((a: string, i: number) => (
                <li key={i} className="text-xs text-slate-600 bg-orange-50 rounded-xl p-2.5 border border-orange-100 leading-relaxed">
                  🎯 {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {actividades_en_casa?.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Home size={10} /> Actividades para casa
          </p>
          <ul className="space-y-1.5">
            {actividades_en_casa.map((a: string, i: number) => (
              <li key={i} className="text-xs text-slate-600 bg-blue-50 rounded-xl p-2.5 border border-blue-100 leading-relaxed flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recomendaciones?.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2 flex items-center gap-1">
            <BookOpen size={10} /> Recomendaciones
          </p>
          <ul className="space-y-1.5">
            {recomendaciones.slice(0, 3).map((r: string, i: number) => (
              <li key={i} className="text-xs text-slate-600 bg-violet-50 rounded-xl p-2.5 border border-violet-100 leading-relaxed">
                💡 {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MensajesView({ profile }: { profile: any }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadNotifications = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (data) {
        setNotifications(data)
        // Mark all as read
        const unreadIds = data.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [profile?.id])

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Cargando mensajes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-black text-2xl text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 rounded-2xl">
              <MessageCircle className="text-violet-600" size={24} />
            </div>
            Mensajes del terapeuta
          </h2>
          <p className="text-slate-400 text-sm mt-1 ml-1">
            Aquí verás todos los mensajes que el equipo clínico te ha enviado
          </p>
        </div>
        <button
          onClick={loadNotifications}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-all"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <MessageCircle size={28} className="text-violet-300" />
          </div>
          <p className="font-black text-slate-500 text-lg mb-2">Aún no hay mensajes</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Cuando el terapeuta te envíe un mensaje o análisis sobre tu hijo/a, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(noti => {
            const isOpen = expanded === noti.id
            const meta = noti.metadata || {}
            const sourceKey = meta.source || noti.type || 'parent_message'
            const sourceInfo = SOURCE_LABELS[sourceKey] || SOURCE_LABELS['parent_message']
            const analysis = meta.ai_analysis

            return (
              <div
                key={noti.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                  !noti.is_read ? 'border-violet-300 shadow-violet-100' : 'border-slate-100'
                }`}
              >
                {/* Card header */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-all"
                  onClick={() => toggle(noti.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${sourceInfo.bg}`}>
                      {sourceInfo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-slate-800 text-sm">
                          {meta.source_title || noti.title || 'Mensaje del terapeuta'}
                        </p>
                        {!noti.is_read && (
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[9px] font-black border border-violet-200">
                            NUEVO
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${sourceInfo.bg} ${sourceInfo.color}`}>
                          {sourceInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Clock size={10} />
                        <span>{formatDate(noti.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 italic line-clamp-2">
                        "{noti.message}"
                      </p>
                    </div>

                    <div className="shrink-0 mt-1">
                      {noti.is_read
                        ? <CheckCircle2 size={16} className="text-emerald-400" />
                        : <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
                      }
                    </div>

                    <div className="shrink-0">
                      {isOpen
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                    {/* Main message */}
                    <div
                      className="rounded-2xl p-5 text-white leading-relaxed text-sm"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                    >
                      <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MessageCircle size={11} /> Mensaje del terapeuta
                      </p>
                      <p className="text-indigo-50 leading-relaxed whitespace-pre-wrap">
                        {noti.message}
                      </p>
                    </div>

                    {/* AI Analysis if present */}
                    {analysis && <AnalysisCard analysis={analysis} />}

                    {/* Footer */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-white rounded-xl p-3 border border-slate-100">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>
                        Este mensaje fue revisado y aprobado por tu terapeuta antes de enviártelo.
                      </span>
                    </div>
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
