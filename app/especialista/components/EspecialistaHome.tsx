'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar, Baby,
  TrendingUp, AlertTriangle, ChevronRight, Activity, Sparkles, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  profile: any
  setActiveView: (v: string) => void
}

export default function EspecialistaHome({ userId, profile, setActiveView }: Props) {
  const [stats, setStats] = useState({ pendientes: 0, aprobadas: 0, rechazadas: 0, citasHoy: 0, totalPacientes: 0, citasProximas: 0 })
  const [recientes, setRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const [subRes, citRes, nRes] = await Promise.all([
          supabase.from('specialist_submissions').select('status').eq('specialist_id', userId),
          supabase.from('appointments').select('appointment_date').neq('status', 'cancelled'),
          supabase.from('children').select('id', { count: 'exact' }).eq('is_active', true),
        ])
        const subs = subRes.data || []
        const citas = citRes.data || []
        setStats({
          pendientes: subs.filter(s => s.status === 'pending_approval').length,
          aprobadas: subs.filter(s => s.status === 'approved').length,
          rechazadas: subs.filter(s => s.status === 'rejected').length,
          citasHoy: citas.filter(c => c.appointment_date === hoy).length,
          totalPacientes: nRes.count || 0,
          citasProximas: citas.filter(c => c.appointment_date > hoy).length,
        })
        const { data: rec } = await supabase
          .from('specialist_submissions')
          .select('*, children(name)')
          .eq('specialist_id', userId)
          .order('created_at', { ascending: false })
          .limit(4)
        setRecientes(rec || [])
      } finally { setLoading(false) }
    }
    cargar()
  }, [userId])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const STAT_CARDS = [
    { label: 'Pacientes', value: stats.totalPacientes, accent: '#8b5cf6', glow: '#8b5cf620', view: 'pacientes', icon: Baby, trend: 'Total activos' },
    { label: 'Citas próximas', value: stats.citasProximas, accent: '#10b981', glow: '#10b98120', view: 'agenda', icon: Calendar, trend: 'Próximas sesiones' },
    { label: 'En revisión', value: stats.pendientes, accent: '#f59e0b', glow: '#f59e0b20', view: 'evaluaciones', icon: Clock, trend: 'Esperando al jefe' },
    { label: 'Aprobadas', value: stats.aprobadas, accent: '#06b6d4', glow: '#06b6d420', view: 'evaluaciones', icon: CheckCircle2, trend: 'Confirmadas' },
  ]

  const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
    pending_approval: { label: 'En revisión', color: '#f59e0b', dot: '#f59e0b' },
    approved:         { label: 'Aprobado',    color: '#10b981', dot: '#10b981' },
    rejected:         { label: 'Rechazado',   color: '#ef4444', dot: '#ef4444' },
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">

      {/* ── HERO SALUDO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1f35 0%, #141f35 50%, #0d2235 100%)',
        border: '1px solid rgba(6,182,212,0.15)',
      }} className="relative rounded-3xl p-7 overflow-hidden">
        {/* Decorative blobs */}
        <div style={{ background: '#06b6d4', filter: 'blur(60px)', opacity: 0.12 }}
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none" />
        <div style={{ background: '#8b5cf6', filter: 'blur(80px)', opacity: 0.08 }}
          className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full pointer-events-none" />

        <div className="relative">
          <p style={{ color: '#06b6d4' }} className="text-sm font-bold tracking-widest uppercase mb-1">{saludo}</p>
          <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }}
            className="text-3xl font-black mb-1">
            {profile?.full_name?.split(' ')[0] || 'Especialista'}
          </h2>
          <p style={{ color: '#475569' }} className="text-sm font-medium">
            {profile?.specialty || 'Especialista Clínico'} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Alertas inline */}
          <div className="mt-5 flex flex-wrap gap-3">
            {stats.citasHoy > 0 && (
              <button onClick={() => setActiveView('agenda')}
                style={{ background: '#10b98115', border: '1px solid #10b98130', color: '#34d399' }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all">
                <Calendar size={14} />
                {stats.citasHoy} cita{stats.citasHoy !== 1 ? 's' : ''} hoy
                <ArrowUpRight size={13} />
              </button>
            )}
            {stats.pendientes > 0 && (
              <button onClick={() => setActiveView('evaluaciones')}
                style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#fbbf24' }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all">
                <Clock size={14} />
                {stats.pendientes} pendiente{stats.pendientes !== 1 ? 's' : ''} de aprobación
                <ArrowUpRight size={13} />
              </button>
            )}
            {stats.citasHoy === 0 && stats.pendientes === 0 && (
              <div style={{ background: '#06b6d415', border: '1px solid #06b6d430', color: '#67e8f9' }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                <Sparkles size={14} /> Todo al día ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((card) => (
          <button key={card.label} onClick={() => setActiveView(card.view)}
            style={{ background: '#0d1a2d', border: `1px solid ${card.accent}25` }}
            className="rounded-2xl p-5 text-left group hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl relative overflow-hidden">
            <div style={{ background: card.accent, filter: 'blur(40px)', opacity: 0.12 }}
              className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full pointer-events-none" />
            <div style={{ background: `${card.accent}20`, color: card.accent }}
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-4">
              <card.icon size={18} />
            </div>
            <p style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }}
              className="text-4xl font-black mb-1 tabular-nums">
              {loading ? '—' : card.value}
            </p>
            <p style={{ color: card.accent }} className="text-xs font-bold mb-0.5">{card.label}</p>
            <p style={{ color: '#334155' }} className="text-xs">{card.trend}</p>
          </button>
        ))}
      </div>

      {/* ── ACTIVIDAD RECIENTE ── */}
      <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)' }}
        className="rounded-2xl overflow-hidden">
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{ background: '#06b6d420', color: '#06b6d4' }}
              className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Activity size={14} />
            </div>
            <h3 style={{ color: '#e2e8f0' }} className="font-bold text-sm">Actividad Reciente</h3>
          </div>
          <button onClick={() => setActiveView('evaluaciones')}
            style={{ color: '#06b6d4' }}
            className="text-xs font-bold flex items-center gap-1 hover:brightness-125 transition-all">
            Ver todo <ChevronRight size={13} />
          </button>
        </div>

        {recientes.length === 0 ? (
          <div className="py-16 text-center">
            <div style={{ background: 'rgba(255,255,255,0.04)' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={24} style={{ color: '#334155' }} />
            </div>
            <p style={{ color: '#475569' }} className="text-sm font-semibold">Sin actividad reciente</p>
            <button onClick={() => setActiveView('evaluaciones')}
              style={{ color: '#06b6d4' }}
              className="mt-3 text-xs font-bold hover:underline">
              Crear primera evaluación →
            </button>
          </div>
        ) : (
          <div>
            {recientes.map((r, idx) => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending_approval
              return (
                <div key={r.id}
                  style={{ borderBottom: idx < recientes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <div style={{ background: `${cfg.dot}20` }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={15} style={{ color: cfg.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#e2e8f0' }} className="text-sm font-semibold truncate">{r.titulo}</p>
                    <p style={{ color: '#475569' }} className="text-xs">{r.children?.name} · {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div style={{ background: `${cfg.dot}18`, color: cfg.color }}
                    className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full">
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FLUJO INFO ── */}
      <div style={{ background: 'linear-gradient(135deg, #0d1a2d, #111827)', border: '1px solid rgba(251,191,36,0.15)' }}
        className="rounded-2xl p-5 flex gap-4">
        <div style={{ background: '#f59e0b20', color: '#f59e0b' }}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p style={{ color: '#fbbf24' }} className="text-sm font-bold mb-1">Cómo funciona tu panel</p>
          <p style={{ color: '#475569', lineHeight: 1.7 }} className="text-sm">
            Todo lo que registres pasa primero por revisión del jefe antes de ser visible para los padres.
            Recibirás feedback cuando algo sea aprobado o necesite ajustes.
          </p>
        </div>
      </div>
    </div>
  )
}
