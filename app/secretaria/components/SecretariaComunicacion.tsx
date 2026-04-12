'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Send, Users, Calendar, Loader2,
  Bell, RefreshCw, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── KPI mini ──────────────────────────────────────────────────────────────────
function MiniKPI({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: color }} />
      <div className="flex items-center gap-3 pl-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function SecretariaComunicacion({ profile }: { profile: any }) {
  const toast = useToast()
  const [tab, setTab]           = useState<'recordatorios' | 'familias' | 'masivo'>('recordatorios')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState<string | null>(null)
  const [citasHoy, setCitasHoy] = useState<any[]>([])
  const [citasSemana, setCitasSemana] = useState<any[]>([])
  const [familias, setFamilias] = useState<any[]>([])

  // Masivo form state
  const [masivo, setMasivo] = useState({ asunto: '', mensaje: '', canal: 'whatsapp' })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const hoy   = new Date().toISOString().split('T')[0]
      const d     = new Date()
      const dow   = d.getDay()
      const lunes = new Date(d)
      lunes.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)

      // Citas de hoy — sin join a profiles (evita error de FK)
      const { data: hoyData } = await supabase
        .from('appointments')
        .select('id, appointment_time, status, children(id, name, parent_id)')
        .eq('appointment_date', hoy)
        .order('appointment_time')

      // Citas de la semana
      const { data: semData } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, children(id, name, parent_id)')
        .gte('appointment_date', lunes.toISOString().split('T')[0])
        .lte('appointment_date', domingo.toISOString().split('T')[0])
        .order('appointment_date')
        .order('appointment_time')

      setCitasHoy(hoyData || [])
      setCitasSemana(semData || [])

      // Padres — separado
      const { data: padres } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('role', 'padre')

      // Construir mapa de familia → pacientes (de la semana)
      const famMap: Record<string, { id: string; nombre: string; email: string; phone: string; pacientes: string[]; citas: number }> = {}
      ;(padres || []).forEach(p => {
        famMap[p.id] = { id: p.id, nombre: p.full_name || 'Padre/Tutor', email: p.email || '', phone: p.phone || '', pacientes: [], citas: 0 }
      })
      ;(semData || []).forEach(a => {
        const pid = a.children?.parent_id
        if (pid && famMap[pid]) {
          const name = a.children?.name || ''
          if (name && !famMap[pid].pacientes.includes(name)) famMap[pid].pacientes.push(name)
          famMap[pid].citas++
        }
      })

      setFamilias(Object.values(famMap).filter(f => f.citas > 0))
    } catch (e: any) {
      toast.error('Error cargando datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Enviar recordatorio individual ──────────────────────────────────────────
  const sendReminder = async (apt: any) => {
    if (!apt.children?.parent_id) { toast.error('El paciente no tiene tutor vinculado'); return }
    setSending(apt.id)
    try {
      const res = await fetch('/api/whatsapp-service/notify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId:  apt.children.parent_id,
          childName: apt.children.name,
          date:      new Date().toISOString().split('T')[0],
          time:      apt.appointment_time,
          type:      'reminder',
        }),
      })
      if (res.ok) toast.success(`Recordatorio enviado — ${apt.children.name}`)
      else        toast.warning(`Recordatorio registrado — WhatsApp no configurado`)
    } catch {
      toast.warning(`Recordatorio registrado para ${apt.children?.name}`)
    } finally {
      setSending(null)
    }
  }

  // ── Enviar recordatorio a todos ─────────────────────────────────────────────
  const sendAll = async () => {
    if (citasHoy.length === 0) return
    setSending('all')
    let ok = 0
    for (const apt of citasHoy) {
      if (!apt.children?.parent_id) continue
      try {
        await fetch('/api/whatsapp-service/notify-parent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId:  apt.children.parent_id,
            childName: apt.children.name,
            date:      new Date().toISOString().split('T')[0],
            time:      apt.appointment_time,
            type:      'reminder',
          }),
        })
        ok++
      } catch {}
    }
    toast.success(`${ok} recordatorios enviados`)
    setSending(null)
  }

  // ── Enviar cronograma a familia ─────────────────────────────────────────────
  const sendSchedule = async (familia: any) => {
    if (!familia.phone && !familia.email) { toast.error('La familia no tiene teléfono ni email registrado'); return }
    setSending(familia.id)
    try {
      const citasFam = citasSemana.filter(a => a.children?.parent_id === familia.id)
      const detalle  = citasFam.map(a => {
        const d = new Date(a.appointment_date + 'T12:00:00')
        return `${d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })} — ${a.appointment_time?.slice(0,5)} — ${a.children?.name}`
      }).join('\n')

      const res = await fetch('/api/whatsapp-service/notify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId:  familia.id,
          childName: familia.pacientes.join(', '),
          type:      'schedule',
          message:   `Cronograma de esta semana:\n${detalle}`,
        }),
      })
      if (res.ok) toast.success(`Cronograma enviado a ${familia.nombre}`)
      else        toast.warning(`Cronograma registrado — WhatsApp no configurado`)
    } catch {
      toast.warning(`Cronograma registrado para ${familia.nombre}`)
    } finally {
      setSending(null)
    }
  }

  // ── Envío masivo ─────────────────────────────────────────────────────────────
  const sendMassivo = async () => {
    if (!masivo.mensaje.trim()) { toast.error('Escribe un mensaje'); return }
    if (familias.length === 0)  { toast.error('No hay familias con citas esta semana'); return }
    setSending('masivo')
    let ok = 0
    for (const fam of familias) {
      try {
        await fetch('/api/whatsapp-service/notify-parent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId:  fam.id,
            childName: fam.pacientes.join(', '),
            type:      'custom',
            message:   masivo.mensaje
              .replace('{nombre}', fam.pacientes[0] || '')
              .replace('{tutor}',  fam.nombre),
          }),
        })
        ok++
      } catch {}
    }
    toast.success(`Mensaje enviado a ${ok} familias`)
    setMasivo(m => ({ ...m, mensaje: '' }))
    setSending(null)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none bg-[var(--muted-bg)] border-[var(--card-border)] text-[var(--text-primary)] focus:border-blue-500"

  const tabs = [
    { id: 'recordatorios', label: 'Recordatorios de hoy' },
    { id: 'familias',      label: 'Cronograma semanal' },
    { id: 'masivo',        label: 'Mensaje masivo' },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0, #8b5cf6, #10b981)' }} />
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Comunicación con familias</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Recordatorios, cronogramas y mensajes a padres/tutores</p>
          </div>
          <button onClick={cargar} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MiniKPI icon={Calendar}  label="Citas hoy"        value={citasHoy.length}    color="#3b82f6" />
        <MiniKPI icon={Users}     label="Citas esta semana" value={citasSemana.length} color="#8b5cf6" />
        <MiniKPI icon={Bell}      label="Familias activas"  value={familias.length}    color="#10b981" />
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1.5 border gap-1.5" style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-3 rounded-xl text-xs font-black transition-all"
            style={{
              background: tab === t.id ? 'var(--card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.id ? '1px solid var(--card-border)' : '1px solid transparent',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RECORDATORIOS ─────────────────────────────────────────────────────── */}
      {tab === 'recordatorios' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              {citasHoy.length > 0
                ? `${citasHoy.length} citas hoy · ${new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}`
                : 'Sin citas para hoy'}
            </p>
            {citasHoy.length > 0 && (
              <button onClick={sendAll} disabled={!!sending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all">
                {sending === 'all' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Enviar a todos
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : citasHoy.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin citas para hoy</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No hay recordatorios que enviar</p>
            </div>
          ) : citasHoy.map(apt => (
            <div key={apt.id} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Clock size={17} style={{ color: '#3b82f6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {apt.children?.name || 'Paciente'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {apt.appointment_time?.slice(0,5) || '—'} ·&nbsp;
                  <span style={{ color: apt.children?.parent_id ? '#10b981' : '#ef4444' }}>
                    {apt.children?.parent_id ? 'Tutor vinculado' : 'Sin tutor'}
                  </span>
                </p>
              </div>
              {apt.children?.parent_id ? (
                <button onClick={() => sendReminder(apt)} disabled={sending === apt.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-50"
                  style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                  {sending === apt.id ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
                  Recordatorio
                </button>
              ) : (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  Sin tutor
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CRONOGRAMA SEMANAL ─────────────────────────────────────────────────── */}
      {tab === 'familias' && (
        <div className="space-y-3">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Envía el cronograma de la semana a cada familia con sus sesiones programadas
          </p>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : familias.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin familias con citas esta semana</p>
            </div>
          ) : familias.map(fam => (
            <div key={fam.id} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                style={{ background: '#8b5cf6' }}>
                {fam.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{fam.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {fam.pacientes.join(', ')} · {fam.citas} sesión{fam.citas !== 1 ? 'es' : ''}
                </p>
                {fam.phone && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fam.phone}</p>}
              </div>
              <button onClick={() => sendSchedule(fam)} disabled={sending === fam.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                style={{ background: '#8b5cf6' }}>
                {sending === fam.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Cronograma
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── MENSAJE MASIVO ──────────────────────────────────────────────────────── */}
      {tab === 'masivo' && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
              Mensaje a todas las familias activas
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Se enviará a {familias.length} familia{familias.length !== 1 ? 's' : ''} con citas esta semana
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Mensaje
            </label>
            <textarea rows={5} value={masivo.mensaje}
              onChange={e => setMasivo(m => ({ ...m, mensaje: e.target.value }))}
              placeholder="Estimada familia, les comunicamos que..."
              className={`${inputCls} resize-none`} />
          </div>

          {/* Variables */}
          <div>
            <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Variables disponibles:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '{nombre}', desc: 'Nombre del paciente' },
                { label: '{tutor}',  desc: 'Nombre del tutor' },
              ].map(v => (
                <button key={v.label} onClick={() => setMasivo(m => ({ ...m, mensaje: m.mensaje + v.label }))}
                  title={v.desc}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-mono font-bold hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canal */}
          <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid var(--card-border)' }}>
            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Canal:</label>
            {[{ id: 'whatsapp', label: 'WhatsApp' }, { id: 'email', label: 'Email' }].map(c => (
              <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--text-secondary)' }}>
                <input type="radio" name="canal" value={c.id}
                  checked={masivo.canal === c.id}
                  onChange={() => setMasivo(m => ({ ...m, canal: c.id }))} />
                {c.label}
              </label>
            ))}
            <button onClick={sendMassivo} disabled={!!sending || !masivo.mensaje.trim() || familias.length === 0}
              className="ml-auto flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all">
              {sending === 'masivo' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending === 'masivo' ? 'Enviando...' : `Enviar a ${familias.length} familias`}
            </button>
          </div>

          {familias.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={14} style={{ color: '#f59e0b' }} />
              <p className="text-xs font-medium" style={{ color: '#b45309' }}>No hay familias con citas esta semana para enviar mensajes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
