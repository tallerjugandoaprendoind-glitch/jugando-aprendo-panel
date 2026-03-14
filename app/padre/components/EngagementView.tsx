'use client'

import { useI18n } from '@/lib/i18n-context'
// app/padre/components/EngagementView.tsx
// 👨‍👩‍👧 Actividades en casa — basadas en el programa terapéutico — generado por IA

import { useState, useEffect } from 'react'
import { Brain, CheckCircle, Circle, Clock, Star, ChevronRight,
  Sparkles, Heart, Target, Loader2, RefreshCw, TrendingUp } from 'lucide-react'

interface Actividad {
  titulo: string
  descripcion: string
  duracion_minutos: number
  dificultad: 'facil' | 'media' | 'alta'
  area: string
  materiales_necesarios: string[]
  por_que_importa: string
  dias_recomendados: string[]
  completada?: boolean
}

interface Plan {
  semana: string
  mensaje_motivacional: string
  actividades: Actividad[]
  child_name: string
  completadas_pct?: number
}

const AREA_COLORS: Record<string, string> = {
  comunicacion: 'bg-blue-100 text-blue-700',
  conducta: 'bg-orange-100 text-orange-700',
  habilidades: 'bg-purple-100 text-purple-700',
  socializacion: 'bg-green-100 text-green-700',
  autonomia: 'bg-amber-100 text-amber-700',
}
const DIFICULTAD_COLORS: Record<string, string> = {
  facil: 'text-emerald-600 bg-emerald-50',
  media: 'text-amber-600 bg-amber-50',
  alta: 'text-rose-600 bg-rose-50',
}

export default function EngagementView({ childId }: { childId: string }) {
  const { t, locale } = useI18n()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [completadas, setCompletadas] = useState<Set<number>>(new Set())

  const cargarPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/engagement-padres?child_id=${childId}&locale=${locale || 'es'}`)
      const json = await res.json()
      if (json.plan) {
        setPlan(json.plan)
        setPlanId(json.plan.id || null)
        // Restaurar completadas desde Supabase
        const comp = new Set<number>()
        json.plan.actividades?.forEach((a: Actividad, i: number) => { if (a.completada) comp.add(i) })
        setCompletadas(comp)
      }
      setHistorial(json.historial || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const DISCLAIMER_IA = '📋 {t('familias.actividadesCasa')} diseñado por tu especialista. Siempre consultá con el terapeuta ante cualquier duda.'

const generarPlan = async () => {
    setGenerando(true)
    try {
      const res = await fetch('/api/engagement-padres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({ childId, accion: 'generar_plan', locale: locale || 'es' }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setPlan(json.plan)
      setPlanId(json.plan.id || null)
      setCompletadas(new Set())
    } catch (e: any) {
      alert('Error generando plan: ' + e.message)
    } finally { setGenerando(false) }
  }

  const toggleCompletada = async (idx: number) => {
    if (!plan) return

    // Optimistic update en UI
    const next = new Set(completadas)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setCompletadas(next)

    // Construir actividades actualizadas con campo completada
    const actividadesActualizadas = plan.actividades.map((a, i) => ({
      ...a,
      completada: next.has(i),
    }))
    const completadas_pct = Math.round((next.size / plan.actividades.length) * 100)

    // Persistir en Supabase
    try {
      await fetch('/api/engagement-padres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          childId,
          accion: 'actualizar_completadas',
          planId,
          actividades: actividadesActualizadas,
          completadas_pct,
        }),
      })
    } catch (e) {
      console.error('Error guardando progreso:', e)
    }
  }

  useEffect(() => { if (childId) cargarPlan() }, [childId])

  const pct = plan ? Math.round((completadas.size / (plan.actividades?.length || 1)) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="animate-spin text-violet-400" size={32} />
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">{t('ui.plan_week')}</h2>
            <p className="text-xs text-slate-400">{t('familias.actividadesDise')} {plan?.child_name || 'tu hijo/a'}</p>
          </div>
        </div>
        <button onClick={generarPlan} disabled={generando}
          className="flex items-center gap-2 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-sm font-semibold transition">
          {generando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {generando ? 'Generando...' : 'Nuevo plan'}
        </button>
      </div>

      {!plan ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Brain size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">{t('ui.no_plan')}</p>
          <p className="text-slate-400 text-sm mb-5">{t('familias.iaGenerara')}as en el progreso de tu hijo/a</p>
          <button onClick={generarPlan} disabled={generando}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition">
            <Sparkles size={16} />
            {generando ? 'Generando...' : 'Generar actividades'}
          </button>
        </div>
      ) : (
        <>
          {/* Disclaimer complemento terapeuta */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-blue-400 shrink-0 mt-0.5">📋</span>
            <p className="text-xs text-blue-600 leading-relaxed">{t('familias.actividadesCasa')} diseñado por tu especialista. Consultá con el terapeuta ante cualquier duda.</p>
          </div>

          {/* Mensaje motivacional */}
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-violet-500 shrink-0 mt-0.5" />
              <p className="text-sm text-violet-800 font-medium">{plan.mensaje_motivacional}</p>
            </div>
          </div>

          {/* Progreso */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">{t('ui.week_progress')}</span>
              <span className="text-lg font-black text-violet-600">{completadas.size}/{plan.actividades?.length || 0}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">{plan.semana}</p>
          </div>

          {/* Actividades */}
          <div className="space-y-3">
            {plan.actividades?.map((act, i) => (
              <div key={i} className={`bg-white rounded-2xl border transition-all ${completadas.has(i) ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-violet-200'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === i ? null : i)}>
                  <div className="flex items-start gap-3">
                    <button onClick={e => { e.stopPropagation(); toggleCompletada(i) }}
                      className="shrink-0 mt-0.5">
                      {completadas.has(i)
                        ? <CheckCircle size={22} className="text-emerald-500" />
                        : <Circle size={22} className="text-slate-300" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-bold text-sm ${completadas.has(i) ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {act.titulo}
                        </p>
                        <ChevronRight size={16} className={`text-slate-400 shrink-0 transition-transform ${expanded === i ? 'rotate-90' : ''}`} />
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${AREA_COLORS[act.area] || 'bg-slate-100 text-slate-600'}`}>
                          {act.area}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFICULTAD_COLORS[act.dificultad]}`}>
                          {act.dificultad}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {act.duracion_minutos} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded === i && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    <p className="text-sm text-slate-600">{act.descripcion}</p>
                    <div className="bg-violet-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-violet-700 mb-1 flex items-center gap-1">
                        <Target size={12} /> ¿Por qué importa?
                      </p>
                      <p className="text-xs text-violet-600">{act.por_que_importa}</p>
                    </div>
                    {act.materiales_necesarios?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-1">Materiales:</p>
                        <div className="flex flex-wrap gap-1">
                          {act.materiales_necesarios.map((m, j) => (
                            <span key={j} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-1">Días recomendados:</p>
                      <div className="flex gap-1">
                        {act.dias_recomendados?.map((d, j) => (
                          <span key={j} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Historial */}
          {historial.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-500" /> {t('familias.actividadesEnCasa')}
              </p>
              <div className="space-y-2">
                {historial.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20">Semana {h.semana}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-violet-400 h-2 rounded-full" style={{ width: `${h.completadas_pct || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8">{h.completadas_pct || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
