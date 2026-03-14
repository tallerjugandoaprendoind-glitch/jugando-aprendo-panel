'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MessageCircle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Sparkles, Baby, RefreshCw, Home, Target, Activity, BookOpen,
  Heart, Star, Info, Calendar, User
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
  const loc = typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es'; return d.toLocaleDateString(loc === 'en' ? 'en-US' : 'es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AnalysisCard({ analysis }: { analysis: any }) {
  if (!analysis) return null
  const { resumen_ejecutivo, areas_fortaleza, areas_trabajo, actividades_en_casa, recomendaciones } = analysis
  if (!resumen_ejecutivo && !areas_fortaleza?.length) return null

  return (
    <div className="mt-5 space-y-4">
      {/* Resumen ejecutivo destacado */}
      {resumen_ejecutivo && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-blue-100 p-5">
          <p className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Info size={13} /> Resumen clínico
          </p>
          <p className="text-base text-slate-700 leading-relaxed font-medium">
            {resumen_ejecutivo}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {areas_fortaleza?.length > 0 && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Star size={13} /> Fortalezas de tu hijo/a
            </p>
            <ul className="space-y-2">
              {areas_fortaleza.slice(0, 4).map((f: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 bg-white rounded-xl p-3 border border-emerald-100 leading-relaxed flex items-start gap-2 shadow-sm">
                  <span className="text-emerald-500 font-black text-base leading-none mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {areas_trabajo?.length > 0 && (
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
            <p className="text-xs font-black text-orange-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target size={13} /> Áreas en desarrollo
            </p>
            <ul className="space-y-2">
              {areas_trabajo.slice(0, 4).map((a: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 bg-white rounded-xl p-3 border border-orange-100 leading-relaxed flex items-start gap-2 shadow-sm">
                  <span className="text-orange-500 font-black text-base leading-none mt-0.5">→</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {actividades_en_casa?.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
          <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Home size={13} /> {t('familias.actividadesCasa')}
          </p>
          <ul className="space-y-2">
            {actividades_en_casa.map((a: string, i: number) => (
              <li key={i} className="text-sm text-slate-700 bg-white rounded-xl p-3.5 border border-blue-100 leading-relaxed flex items-start gap-3 shadow-sm">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recomendaciones?.length > 0 && (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-xs font-black text-violet-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen size={13} /> {t('mensajes.recomendacionesTerapeuta')}
          </p>
          <ul className="space-y-2">
            {recomendaciones.slice(0, 3).map((r: string, i: number) => (
              <li key={i} className="text-sm text-slate-700 bg-white rounded-xl p-3 border border-violet-100 leading-relaxed flex items-start gap-2 shadow-sm">
                <span className="text-violet-500 font-black leading-none mt-0.5">💡</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MensajesView({ profile }: { profile: any }) {
  const { t, locale } = useI18n()
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
        <p className="text-slate-400 text-sm font-medium">{t('common.cargandoMensajes')}</p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-violet-600 text-white rounded-full text-sm font-black">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-base mt-2 ml-1 leading-relaxed">
            Aquí encontrarás todos los mensajes, análisis y recomendaciones que el equipo clínico te envía sobre el progreso de tu hijo/a.
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
          <p className="font-black text-slate-500 text-lg mb-2">{t('ui.no_messages')}</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Cuando el terapeuta te envíe un mensaje o análisis sobre tu hijo/a, aparecerá aquí con toda la información detallada.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(noti => {
            const isOpen = expanded === noti.id
            const meta = noti.metadata || {}
            const sourceKey = meta.source || noti.type || 'parent_message'
            const sourceInfo = SOURCE_LABELS[sourceKey] || SOURCE_LABELS['parent_message']
            const analysis = meta.ai_analysis

            return (
              <div
                key={noti.id}
                className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all ${
                  !noti.is_read ? 'border-violet-300 shadow-violet-100' : 'border-slate-100'
                }`}
              >
                {/* Card header */}
                <div
                  className="p-5 md:p-6 cursor-pointer hover:bg-slate-50/50 transition-all"
                  onClick={() => toggle(noti.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 ${sourceInfo.bg}`}>
                      {sourceInfo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="font-black text-slate-800 text-base md:text-lg">
                          {meta.source_title || noti.title || 'Mensaje del terapeuta'}
                        </p>
                        {!noti.is_read && (
                          <span className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-black border border-violet-200 animate-pulse">
                            NUEVO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${sourceInfo.bg} ${sourceInfo.color}`}>
                          {sourceInfo.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Calendar size={12} />
                          {formatDate(noti.created_at)}
                        </span>
                      </div>
                      {/* Preview del mensaje */}
                      <div className={`text-sm text-slate-600 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                        {noti.message}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center gap-2 mt-1">
                      {noti.is_read
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <div className="w-3.5 h-3.5 bg-violet-500 rounded-full animate-pulse" />
                      }
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400">
                        {isOpen
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t-2 border-slate-100 bg-slate-50/40 p-5 md:p-6">
                    {/* Mensaje principal grande */}
                    <div
                      className="rounded-2xl p-6 text-white leading-relaxed"
                      style={{ background: 'linear-gradient(135deg, #5b21b6, #6d28d9, #7c3aed)' }}
                    >
                      <p className="text-xs font-black text-purple-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageCircle size={12} /> {t('mensajes.mensajeDeTuTerapeuta')}
                      </p>
                      <p className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        {noti.message}
                      </p>
                    </div>

                    {/* Análisis clínico detallado */}
                    {analysis && <AnalysisCard analysis={analysis} />}

                    {/* Footer informativo */}
                    <div className="mt-5 flex items-start gap-3 text-sm text-slate-500 bg-white rounded-2xl p-4 border border-slate-100 leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        {t('ui.message_reviewed')}
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
