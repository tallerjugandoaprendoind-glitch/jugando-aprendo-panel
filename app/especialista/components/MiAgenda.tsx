'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  Loader2, CalendarDays, Check, Users
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

/* ── Google Calendar mini ───────────────────────────────────────────────── */
function GoogleCalendarMini({ userId, isDark }: { userId: string; isDark: boolean }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [busy,   setBusy]   = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/google-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
    } catch { setStatus('disconnected') }
  }

  useEffect(() => {
    if (!userId) return
    check()
    const p = new URLSearchParams(window.location.search)
    if (p.get('gcal') === 'connected') {
      toast.success('✅ Google Calendar conectado')
      check()
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}&role=especialista`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error conectando Google Calendar'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return
    await fetch(`/api/google-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected')
    toast.success('Google Calendar desconectado')
  }

  if (status === 'loading') return null

  return status === 'connected' ? (
    <button
      onClick={disconnect}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
        ${isDark
          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800 hover:bg-red-900/40 hover:text-red-400 hover:border-red-800'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
        }`}
    >
      <CalendarDays size={13} /><Check size={11} /> Google
    </button>
  ) : (
    <button
      onClick={connect}
      disabled={busy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50
        ${isDark
          ? 'bg-[#21262d] text-slate-300 border border-[#30363d] hover:bg-blue-900/40 hover:text-blue-400 hover:border-blue-700'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
        }`}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <CalendarDays size={13} />} Google
    </button>
  )
}

/* ── Microsoft / Outlook mini ───────────────────────────────────────────── */
function MicrosoftCalendarMini({ userId, isDark }: { userId: string; isDark: boolean }) {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [busy,   setBusy]   = useState(false)

  const check = async () => {
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=status&userId=${userId}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
    } catch { setStatus('disconnected') }
  }

  useEffect(() => {
    if (!userId) return
    check()
    const p = new URLSearchParams(window.location.search)
    if (p.get('mscal') === 'connected') {
      toast.success('✅ Outlook Calendar conectado')
      check()
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [userId])

  const connect = async () => {
    setBusy(true)
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}&role=especialista`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { toast.error('Error conectando Outlook Calendar'); setBusy(false) }
  }

  const disconnect = async () => {
    if (!confirm('¿Desconectar Outlook Calendar?')) return
    await fetch(`/api/microsoft-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected')
    toast.success('Outlook Calendar desconectado')
  }

  const MSIcon = () => (
    <svg width="13" height="13" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  )

  if (status === 'loading') return null

  return status === 'connected' ? (
    <button
      onClick={disconnect}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
        ${isDark
          ? 'bg-blue-900/40 text-blue-400 border border-blue-800 hover:bg-red-900/40 hover:text-red-400 hover:border-red-800'
          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
        }`}
    >
      <MSIcon /><Check size={11} /> Outlook
    </button>
  ) : (
    <button
      onClick={connect}
      disabled={busy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50
        ${isDark
          ? 'bg-[#21262d] text-slate-300 border border-[#30363d] hover:bg-blue-900/40 hover:text-blue-400 hover:border-blue-700'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
        }`}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <MSIcon />} Outlook
    </button>
  )
}

/* ── Constants ──────────────────────────────────────────────────────────── */
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DIAS_CORTO = ['D','L','M','M','J','V','S']

const STATUS_CFG: Record<string, {
  label: string; dot: string
  badgeLight: string; badgeDark: string; bar: string
}> = {
  confirmed: {
    label:      'Confirmada',
    dot:        'bg-emerald-500',
    badgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeDark:  'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    bar:        '#10b981',
  },
  pending: {
    label:      'Pendiente',
    dot:        'bg-amber-400',
    badgeLight: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeDark:  'bg-amber-900/40 text-amber-400 border-amber-800',
    bar:        '#f59e0b',
  },
  cancelled: {
    label:      'Cancelada',
    dot:        'bg-red-400',
    badgeLight: 'bg-red-50 text-red-700 border-red-200',
    badgeDark:  'bg-red-900/40 text-red-400 border-red-800',
    bar:        '#ef4444',
  },
  completed: {
    label:      'Completada',
    dot:        'bg-blue-500',
    badgeLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeDark:  'bg-blue-900/40 text-blue-400 border-blue-800',
    bar:        '#3b82f6',
  },
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function MiAgenda({ isDark = false }: { isDark?: boolean }) {
  const toast        = useToast()
  const { t }        = useI18n()
  const [citas,           setCitas]           = useState<any[]>([])
  const [loading,         setLoading]         = useState(true)
  const [mes,             setMes]             = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user?.id) setUserId(session.user.id)
    })
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*, children(name, profiles!children_parent_id_fkey(full_name))')
        .order('appointment_date')
        .order('appointment_time')
      setCitas(data || [])
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  /* Cálculos del calendario */
  const año       = mes.getFullYear()
  const mesN      = mes.getMonth()
  const hoy       = new Date().toISOString().split('T')[0]
  const primerDia = new Date(año, mesN, 1).getDay()
  const diasEnMes = new Date(año, mesN + 1, 0).getDate()

  const citasPorFecha: Record<string, any[]> = {}
  citas.forEach(c => {
    if (!citasPorFecha[c.appointment_date]) citasPorFecha[c.appointment_date] = []
    citasPorFecha[c.appointment_date].push(c)
  })

  const citasDelDia   = diaSeleccionado ? (citasPorFecha[diaSeleccionado] || []) : []
  const proximasCitas = citas
    .filter(c => c.appointment_date >= hoy && c.status !== 'cancelled')
    .slice(0, 10)

  const fechaSelFmt = diaSeleccionado
    ? new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : ''

  /* Shorthand helpers — mismo patrón que page.tsx */
  const card    = isDark ? 'bg-[#161b22] border-[#21262d]'  : 'bg-white border-slate-200'
  const cardSub = isDark ? 'bg-[#1c2128] border-[#21262d]'  : 'bg-slate-50 border-slate-100'
  const divLine = isDark ? 'border-[#21262d]'               : 'border-slate-100'
  const txt1    = isDark ? 'text-slate-100'                 : 'text-slate-800'
  const txt2    = isDark ? 'text-slate-400'                 : 'text-slate-500'
  const txt3    = isDark ? 'text-slate-500'                 : 'text-slate-400'
  const hoverBg = isDark ? 'hover:bg-[#1c2128]'             : 'hover:bg-slate-50'

  return (
    <div className="space-y-5 pb-20 md:pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-black ${txt1}`}>Mi Agenda</h2>
          <p className={`text-sm mt-0.5 ${txt3}`}>Calendario de citas y sesiones</p>
        </div>
        {userId && (
          <div className="flex items-center gap-2">
            <GoogleCalendarMini userId={userId} isDark={isDark} />
            <MicrosoftCalendarMini userId={userId} isDark={isDark} />
          </div>
        )}
      </div>

      {/* ── Grid: calendario + panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ════ CALENDARIO ════ */}
        <div className={`lg:col-span-3 ${card} rounded-2xl border shadow-sm overflow-hidden`}>

          {/* Navegación mes */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${divLine}`}>
            <button
              onClick={() => setMes(new Date(año, mesN - 1, 1))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${txt2}
                ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}`}
            >
              <ChevronLeft size={16} />
            </button>

            <h3 className={`font-black text-base ${txt1}`}>
              {MESES[mesN]}{' '}
              <span className={`font-semibold ${txt3}`}>{año}</span>
            </h3>

            <button
              onClick={() => setMes(new Date(año, mesN + 1, 1))}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${txt2}
                ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Cabecera días de semana */}
          <div className={`grid grid-cols-7 border-b ${divLine}`}>
            {DIAS_CORTO.map((d, i) => (
              <div key={i} className={`text-center py-3 text-[11px] font-black uppercase tracking-wider ${txt3}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={22} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 p-3 gap-1.5">
              {Array.from({ length: primerDia }, (_, i) => <div key={`e-${i}`} />)}

              {Array.from({ length: diasEnMes }, (_, i) => {
                const dia        = i + 1
                const fechaStr   = `${año}-${String(mesN + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                const citasDia   = citasPorFecha[fechaStr] || []
                const esHoy      = fechaStr === hoy
                const esSel      = fechaStr === diaSeleccionado
                const tieneCitas = citasDia.length > 0

                let cellClass = ''
                if (esSel) {
                  cellClass = 'bg-blue-600 shadow-md shadow-blue-900/40'
                } else if (esHoy) {
                  cellClass = isDark
                    ? 'bg-blue-950/60 border-2 border-blue-700'
                    : 'bg-blue-50 border-2 border-blue-300'
                } else if (tieneCitas) {
                  cellClass = isDark
                    ? 'bg-[#1c2128] border border-[#21262d] hover:bg-[#21262d]'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                } else {
                  cellClass = isDark ? 'hover:bg-[#1c2128]' : 'hover:bg-slate-50'
                }

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSeleccionado(esSel ? '' : fechaStr)}
                    className={`relative flex flex-col items-center justify-start pt-2 pb-1.5 px-1
                      rounded-xl min-h-[64px] transition-all ${cellClass}`}
                  >
                    <span className={`text-sm font-black leading-none mb-1.5
                      ${esSel
                        ? 'text-white'
                        : esHoy
                          ? isDark ? 'text-blue-400' : 'text-blue-600'
                          : isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {dia}
                    </span>

                    {tieneCitas && (
                      <div className="flex flex-col gap-0.5 w-full px-0.5">
                        {citasDia.slice(0, 2).map((c, idx) => {
                          const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                          return (
                            <div key={idx} className={`w-full h-1.5 rounded-full ${esSel ? 'bg-white/40' : cfg.dot}`} />
                          )
                        })}
                        {citasDia.length > 2 && (
                          <span className={`text-[9px] font-black text-center
                            ${esSel ? 'text-white/70' : txt3}`}>
                            +{citasDia.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Leyenda */}
          <div className={`px-5 py-3 border-t ${divLine} flex items-center gap-4 flex-wrap`}>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className={`text-[10px] font-semibold ${txt3}`}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ════ PANEL DERECHO ════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* ── Detalle del día ── */}
          <div className={`${card} rounded-2xl border shadow-sm overflow-hidden flex flex-col`}>

            <div className={`px-5 py-4 border-b ${divLine} flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                <Calendar size={15} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black uppercase tracking-widest ${txt3}`}>
                  {diaSeleccionado === hoy ? 'HOY' : 'Día seleccionado'}
                </p>
                <p className={`text-sm font-black capitalize truncate ${txt1}`}>
                  {fechaSelFmt || 'Selecciona un día'}
                </p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0
                ${isDark ? 'bg-[#21262d] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {citasDelDia.length} cita{citasDelDia.length !== 1 ? 's' : ''}
              </span>
            </div>

            {citasDelDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${cardSub}`}>
                  <CalendarDays size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                </div>
                <p className={`text-sm font-black ${txt3}`}>Sin citas este día</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                  Selecciona otro día del calendario
                </p>
              </div>
            ) : (
              <div className={`divide-y ${divLine}`}>
                {citasDelDia
                  .sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
                  .map(c => {
                    const cfg = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                    return (
                      <div
                        key={c.id}
                        className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${hoverBg}`}
                      >
                        <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{ background: cfg.bar }} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black truncate ${txt1}`}>{c.children?.name}</p>
                          <p className={`text-xs flex items-center gap-1 mt-0.5 ${txt3}`}>
                            <Clock size={10} />
                            {c.appointment_time?.slice(0,5)}
                            {c.service_type && <> · {c.service_type}</>}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0
                          ${isDark ? cfg.badgeDark : cfg.badgeLight}`}>
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* ── Próximas citas ── */}
          <div className={`${card} rounded-2xl border shadow-sm overflow-hidden flex-1`}>

            <div className={`px-5 py-4 border-b ${divLine} flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                <Clock size={15} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
              </div>
              <h3 className={`font-black text-sm flex-1 ${txt1}`}>Próximas citas</h3>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full border
                ${isDark
                  ? 'bg-[#21262d] text-slate-500 border-[#30363d]'
                  : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                {proximasCitas.length}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={18} className="animate-spin text-blue-500" />
              </div>
            ) : proximasCitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${cardSub}`}>
                  <Users size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                </div>
                <p className={`text-sm font-black ${txt3}`}>Sin citas próximas</p>
              </div>
            ) : (
              <div className={`divide-y ${divLine} max-h-80 overflow-y-auto`}>
                {proximasCitas.map(c => {
                  const cfg       = STATUS_CFG[c.status] || STATUS_CFG.confirmed
                  const fecha     = new Date(c.appointment_date + 'T00:00:00')
                  const esHoyItem = c.appointment_date === hoy
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setDiaSeleccionado(c.appointment_date); setMes(fecha) }}
                      className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${hoverBg}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0
                        ${esHoyItem
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-[#21262d] text-slate-400'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold leading-none uppercase">
                          {MESES[fecha.getMonth()].slice(0,3)}
                        </span>
                        <span className="text-base font-black leading-tight">{fecha.getDate()}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black truncate ${txt1}`}>{c.children?.name}</p>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${txt3}`}>
                          <Clock size={9} />
                          {c.appointment_time?.slice(0,5)}
                          {esHoyItem && (
                            <span className={`font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              · Hoy
                            </span>
                          )}
                        </p>
                      </div>

                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
