'use client'
// app/padre/components/ProgramasABAView.tsx
// Vista para que los padres vean y practiquen los programas ABA en casa

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ChevronDown, ChevronUp, CheckCircle, Circle, 
  BookOpen, Target, Clock, TrendingUp, Loader2,
  Star, Award, Calendar, BarChart2, Info
} from 'lucide-react'

interface Programa {
  id: string
  titulo: string
  descripcion: string
  area: string
  fase_actual: string
  instrucciones_casa: string
  materiales: string
  sd_estimulo: string
  reforzadores: string
  ayudas: string
  criterio_dominio_pct: number
  estado: string
  objetivos_cp: { id: string; nombre?: string; descripcion?: string; estado: string; numero_set: number }[]
  sesiones_datos_aba: { fecha: string; porcentaje_exito: number }[]
}

interface Props { childId: string; childName: string }

const AREA_CFG: Record<string, { color: string; bg: string; emoji: string }> = {
  'comunicacion':   { color: '#2563eb', bg: 'rgba(37,99,235,0.1)',    emoji: '💬' },
  'conducta':       { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   emoji: '⚡' },
  'habilidades':    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   emoji: '🧠' },
  'socializacion':  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   emoji: '👥' },
  'autonomia':      { color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   emoji: '⭐' },
  'imitacion':      { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',    emoji: '🎭' },
  'lenguaje':       { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   emoji: '🗣️' },
}
const AREA_DEFAULT = { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', emoji: '📌' }

const FASE_CFG: Record<string, { label: string; color: string }> = {
  'linea_base':   { label: 'Línea base',    color: '#64748b' },
  'intervencion': { label: 'Intervención',  color: '#2563eb' },
  'mantenimiento':{ label: 'Mantenimiento', color: '#10b981' },
  'dominado':     { label: 'Dominado ✓',    color: '#059669' },
}

function WeekTracker({ programaId, childId }: { programaId: string; childId: string }) {
  const [practiced, setPracticed] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const DAYS = ['L','M','X','J','V','S','D']
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('programa_practica_casa')
        .select('fecha')
        .eq('programa_id', programaId)
        .eq('child_id', childId)
        .in('fecha', weekDates)
      if (data) setPracticed(new Set(data.map((r: any) => r.fecha)))
    }
    load()
  }, [programaId, childId])

  const toggle = async (fecha: string) => {
    if (fecha > today.toISOString().split('T')[0]) return // no future days
    setSaving(true)
    if (practiced.has(fecha)) {
      await supabase.from('programa_practica_casa').delete()
        .eq('programa_id', programaId).eq('child_id', childId).eq('fecha', fecha)
      setPracticed(prev => { const s = new Set(prev); s.delete(fecha); return s })
    } else {
      await supabase.from('programa_practica_casa').upsert({
        programa_id: programaId, child_id: childId, fecha
      })
      setPracticed(prev => new Set([...prev, fecha]))
    }
    setSaving(false)
  }

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
        Práctica esta semana — {practiced.size}/7 días
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        {weekDates.map((date, i) => {
          const done = practiced.has(date)
          const isToday = date === todayStr
          const isPast = date <= todayStr
          return (
            <button
              key={date}
              onClick={() => isPast && toggle(date)}
              disabled={!isPast || saving}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '6px 4px', borderRadius: 10, border: 'none', cursor: isPast ? 'pointer' : 'default',
                background: done ? 'rgba(16,185,129,0.15)' : isToday ? 'rgba(37,99,235,0.1)' : 'var(--c-surface)',
                transition: 'all .15s'
              }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: isToday ? '#2563eb' : 'var(--c-text-muted)' }}>{DAYS[i]}</span>
              {done
                ? <CheckCircle size={18} color="#10b981" />
                : <Circle size={18} color={isToday ? '#2563eb' : 'var(--c-border)'} />
              }
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgramCard({ prog, childId }: { prog: Programa; childId: string }) {
  const [open, setOpen] = useState(false)
  const area = AREA_CFG[prog.area?.toLowerCase()] || AREA_DEFAULT
  const fase = FASE_CFG[prog.fase_actual] || FASE_CFG.intervencion
  const isDone = prog.fase_actual === 'dominado'

  // Last 3 sessions avg
  const lastSessions = (prog.sesiones_datos_aba || []).slice(0, 3)
  const avgPct = lastSessions.length > 0
    ? Math.round(lastSessions.reduce((s, r) => s + (r.porcentaje_exito || 0), 0) / lastSessions.length)
    : null

  return (
    <div style={{
      background: 'var(--c-card)', borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'var(--c-border)'}`,
      opacity: isDone ? 0.8 : 1
    }}>
      {/* Left accent */}
      <div style={{ height: 3, background: isDone ? '#10b981' : `linear-gradient(90deg, ${area.color}, ${area.color}88)` }} />

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: area.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {area.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-text-primary)', margin: 0, lineHeight: 1.3 }}>{prog.titulo}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: area.bg, color: area.color }}>{prog.area}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: fase.color }}>{fase.label}</span>
            {avgPct !== null && (
              <span style={{ fontSize: 10, color: 'var(--c-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <BarChart2 size={10} /> {avgPct}% últimas sesiones
              </span>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {open ? <ChevronUp size={16} color="var(--c-text-muted)" /> : <ChevronDown size={16} color="var(--c-text-muted)" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--c-border)' }}>
          {prog.descripcion && (
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.6, margin: '14px 0 12px' }}>{prog.descripcion}</p>
          )}

          {/* Cómo aplicar el programa */}
          <div style={{ background: 'var(--c-stat-blue)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '14px 16px', marginTop: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={13} /> Cómo practicarlo en casa
            </p>

            {prog.sd_estimulo && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>📍 Qué decir o hacer (Sd)</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-primary)', margin: '4px 0 0', lineHeight: 1.6 }}>{prog.sd_estimulo}</p>
              </div>
            )}

            {prog.instrucciones_casa && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>📋 Instrucciones</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-primary)', margin: '4px 0 0', lineHeight: 1.6 }}>{prog.instrucciones_casa}</p>
              </div>
            )}

            {prog.ayudas && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>🤝 Ayudas / Prompts</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-primary)', margin: '4px 0 0', lineHeight: 1.6 }}>{prog.ayudas}</p>
              </div>
            )}

            {prog.reforzadores && (
              <div style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>🎁 Reforzadores</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-primary)', margin: '4px 0 0', lineHeight: 1.6 }}>{prog.reforzadores}</p>
              </div>
            )}

            {prog.materiales && (
              <div style={{ marginTop: prog.reforzadores ? 8 : 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>🧸 Materiales</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-primary)', margin: '4px 0 0', lineHeight: 1.6 }}>{prog.materiales}</p>
              </div>
            )}

            {!prog.sd_estimulo && !prog.instrucciones_casa && !prog.ayudas && !prog.reforzadores && (
              <p style={{ fontSize: 12, color: 'var(--c-text-muted)', margin: 0, fontStyle: 'italic' }}>
                Tu terapeuta aún no ha agregado instrucciones para casa. Consúltale en la próxima sesión.
              </p>
            )}
          </div>

          {/* Sets / Objetivos actuales */}
          {prog.objetivos_cp && prog.objetivos_cp.filter(o => o.estado !== 'dominado').length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Target size={11} /> Qué está practicando ahora
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {prog.objetivos_cp.filter(o => o.estado !== 'dominado').map(obj => (
                  <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-surface)', borderRadius: 10, border: '1px solid var(--c-border)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: area.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: area.color }}>{obj.numero_set || '•'}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--c-text-primary)', lineHeight: 1.4 }}>{obj.descripcion || obj.nombre || `Set ${obj.numero_set}`}</span>
                    {obj.estado === 'en_progreso' && (
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(37,99,235,0.1)', color: '#2563eb', flexShrink: 0 }}>EN CURSO</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly tracker */}
          {!isDone && (
            <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--c-border)' }}>
              <WeekTracker programaId={prog.id} childId={childId} />
            </div>
          )}

          {isDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
              <Award size={18} color="#10b981" />
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#10b981', margin: 0 }}>¡Programa dominado!</p>
                <p style={{ fontSize: 11, color: 'var(--c-text-muted)', margin: 0 }}>Tu hijo/a alcanzó el criterio de dominio.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProgramasABAView({ childId, childName }: Props) {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'activos' | 'todos'>('activos')

  const load = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/programas-aba?child_id=${childId}`)
      const json = await res.json()
      if (json.data) setProgramas(json.data)
    } finally { setLoading(false) }
  }, [childId])

  useEffect(() => { load() }, [load])

  const activos = programas.filter(p => p.estado !== 'dominado' && p.estado !== 'archivado')
  const filtered = filtro === 'activos' ? activos : programas.filter(p => p.estado !== 'archivado')
  const totalPracticadosSemana = 0 // Could be computed from WeekTracker data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--c-text-primary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="#2563eb" />
            </div>
            Programas ABA
          </h2>
          <p style={{ fontSize: 12, color: 'var(--c-text-muted)', margin: 0, marginLeft: 44 }}>
            {activos.length} activos · {childName}
          </p>
        </div>
      </div>

      {/* Info card */}
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Estos son los programas que tu terapeuta trabaja con <strong style={{ color: 'var(--c-text-primary)' }}>{childName}</strong>. Practicarlos en casa refuerza el aprendizaje. Marca los días que lo practicaron para hacer seguimiento.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['activos', 'todos'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .15s',
              background: filtro === f ? '#2563eb' : 'var(--c-surface)',
              color: filtro === f ? '#fff' : 'var(--c-text-muted)' }}>
            {f === 'activos' ? `Activos (${activos.length})` : `Todos (${programas.length})`}
          </button>
        ))}
      </div>

      {/* Program list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} color="var(--c-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--c-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={28} color="var(--c-text-muted)" />
          </div>
          <p style={{ fontWeight: 700, color: 'var(--c-text-primary)', margin: '0 0 6px' }}>Sin programas activos</p>
          <p style={{ fontSize: 12, color: 'var(--c-text-muted)', margin: 0 }}>Tu terapeuta aún no ha asignado programas ABA.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => <ProgramCard key={p.id} prog={p} childId={childId} />)}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
