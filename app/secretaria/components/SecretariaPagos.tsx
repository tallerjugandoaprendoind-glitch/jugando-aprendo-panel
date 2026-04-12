'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DollarSign, Plus, Search, Download, TrendingUp, CheckCircle2,
  Clock, XCircle, Loader2, Calendar, Save, X, Package, ChevronDown,
  ChevronUp, Repeat, Pencil, Trash2, Settings2, Check
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid:      { label: 'Pagado',    color: '#10b981', bg: '#d1fae5' },
  pending:   { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7' },
  partial:   { label: 'Parcial',   color: '#3b82f6', bg: '#dbeafe' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
  refunded:  { label: 'Devuelto',  color: '#8b5cf6', bg: '#ede9fe' },
}
const METHODS      = ['efectivo','yape','plin','transferencia','tarjeta','otro']
const MESES        = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const COLORS       = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

// ─── Helper: generate recurring dates ────────────────────────────────────────
function generateDates(start: string, freq: 'weekly'|'biweekly'|'monthly', n: number) {
  const dates: string[] = []
  const cur = new Date(start + 'T12:00:00')
  for (let i = 0; i < n; i++) {
    dates.push(cur.toISOString().split('T')[0])
    if (freq === 'weekly')   cur.setDate(cur.getDate() + 7)
    if (freq === 'biweekly') cur.setDate(cur.getDate() + 14)
    if (freq === 'monthly')  cur.setMonth(cur.getMonth() + 1)
  }
  return dates
}

// ─── Group payments by patient + month ───────────────────────────────────────
function groupByPatientMonth(pays: any[]) {
  const g: Record<string, any> = {}
  pays.forEach(p => {
    const d = new Date(p.paid_at || p.created_at)
    const k = `${p.child_id}_${d.getFullYear()}_${d.getMonth()}`
    if (!g[k]) g[k] = { key: k, child: p.children?.name || '—', month: `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`, monthLabel: `${MESES_LARGO[d.getMonth()]} ${d.getFullYear()}`, pays: [], total: 0 }
    g[k].pays.push(p); g[k].total += Number(p.amount)
  })
  return Object.values(g).sort((a: any, b: any) => b.month.localeCompare(a.month))
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, bar }: any) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-2xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${bar}15` }}>
          <Icon size={15} style={{ color: bar }} />
        </div>
      </div>
      <p className="text-3xl font-black leading-none pl-3 mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-semibold pl-3" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-[10px] pl-3 mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

// ─── Input helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function SecretariaPagos({ profile }: { profile: any }) {
  const toast    = useToast()
  const rtRef    = useRef<any>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const [tab, setTab]           = useState<'dashboard'|'registros'|'agrupado'|'tarifas'>('dashboard')
  const [payments, setPayments] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [rates, setRates]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [periodo, setPeriodo]   = useState<'semana'|'mes'|'anio'>('mes')
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Forms
  const [showNew, setShowNew]     = useState(false)
  const [showPkg, setShowPkg]     = useState(false)
  const [showRateForm, setShowRateForm] = useState(false)
  const [editingRate, setEditingRate]   = useState<any>(null)

  // Stats
  const [stats, setStats] = useState({ total: 0, cobros: 0, pendiente: 0, cancelados: 0, porMes: [] as any[], porMetodo: [] as any[] })

  const buildStats = useCallback((pays: any[]) => {
    const paid = pays.filter(p => p.status === 'paid')
    const pend = pays.filter(p => p.status === 'pending')
    const canc = pays.filter(p => p.status === 'cancelled')
    const sum  = (a: any[]) => a.reduce((s, p) => s + Number(p.amount), 0)
    const porMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
      const m = d.getMonth(); const y = d.getFullYear()
      const mp = paid.filter(p => { const pd = new Date(p.paid_at || p.created_at); return pd.getMonth() === m && pd.getFullYear() === y })
      return { mes: MESES[m], total: sum(mp) }
    })
    const porMetodo = METHODS.map((m, i) => ({ name: m.charAt(0).toUpperCase() + m.slice(1), value: sum(paid.filter(p => p.payment_method === m)), color: COLORS[i] })).filter(m => m.value > 0)
    setStats({ total: sum(paid), cobros: paid.length, pendiente: sum(pend), cancelados: canc.length, porMes, porMetodo })
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      let desde = new Date()
      if (periodo === 'semana') desde.setDate(now.getDate() - 7)
      else if (periodo === 'mes') desde = new Date(now.getFullYear(), now.getMonth(), 1)
      else desde = new Date(now.getFullYear(), 0, 1)

      const [{ data: pays }, { data: kids }, { data: svcRates }] = await Promise.all([
        supabase.from('payments').select('*, children(name)').gte('created_at', desde.toISOString()).order('created_at', { ascending: false }).limit(500),
        supabase.from('children').select('id, name').eq('is_active', true).order('name'),
        supabase.from('service_rates').select('*').order('amount', { ascending: true }),
      ])
      const p = pays || []
      setPayments(p); setChildren(kids || []); setRates(svcRates || [])
      buildStats(p)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [periodo, buildStats])

  useEffect(() => { cargar() }, [cargar])

  // Real-time
  useEffect(() => {
    rtRef.current = supabase.channel('payments-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        setPayments(prev => {
          let u = prev
          if (payload.eventType === 'INSERT') u = [payload.new, ...prev]
          else if (payload.eventType === 'UPDATE') u = prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
          else if (payload.eventType === 'DELETE') u = prev.filter(p => p.id !== (payload.old as any).id)
          buildStats(u); return u
        })
      }).subscribe()
    return () => { if (rtRef.current) supabase.removeChannel(rtRef.current) }
  }, [buildStats])

  // ─── Payment form ───────────────────────────────────────────────────────────
  const emptyForm = { child_id: '', amount: '', concept: '', method: 'efectivo', status: 'paid', notes: '', date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const rateNames = rates.map(r => r.name)

  const handleSave = async () => {
    if (!form.child_id) { toast.error('Selecciona el paciente'); return }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Ingresa un monto válido'); return }
    if (!form.concept.trim()) { toast.error('Ingresa el concepto'); return }
    setSaving(true)
    try {
      await supabase.from('payments').insert({
        child_id: form.child_id, amount: Number(form.amount), concept: form.concept.trim(),
        payment_method: form.method, status: form.status, notes: form.notes || null,
        paid_at: form.status === 'paid' ? new Date(form.date).toISOString() : null,
        created_by: profile?.id,
      })
      toast.success('✅ Pago registrado'); setShowNew(false); setForm(emptyForm)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ─── Package form ───────────────────────────────────────────────────────────
  const emptyPkg = { child_id: '', sessions: '4', amount: '', concept: '', method: 'efectivo', status: 'paid', start: new Date().toISOString().split('T')[0], freq: 'weekly' as 'weekly'|'biweekly'|'monthly' }
  const [pkg, setPkg] = useState(emptyPkg)
  const [pkgDates, setPkgDates] = useState<string[]>([])
  const [savingPkg, setSavingPkg] = useState(false)

  useEffect(() => {
    if (pkg.start && Number(pkg.sessions) > 0) setPkgDates(generateDates(pkg.start, pkg.freq, Number(pkg.sessions)))
  }, [pkg.start, pkg.sessions, pkg.freq])

  const handleSavePkg = async () => {
    if (!pkg.child_id) { toast.error('Selecciona el paciente'); return }
    if (!pkg.amount || isNaN(Number(pkg.amount))) { toast.error('Ingresa el monto por sesión'); return }
    if (!pkg.concept.trim()) { toast.error('Ingresa el concepto'); return }
    setSavingPkg(true)
    try {
      const inserts = pkgDates.map((date, i) => ({
        child_id: pkg.child_id, amount: Number(pkg.amount),
        concept: `${pkg.concept.trim()} (${i+1}/${pkgDates.length})`,
        payment_method: pkg.method, status: pkg.status,
        paid_at: pkg.status === 'paid' ? new Date(date + 'T12:00:00').toISOString() : null,
        notes: `Paquete de ${pkgDates.length} sesiones`, created_by: profile?.id,
      }))
      const { error } = await supabase.from('payments').insert(inserts)
      if (error) throw error
      toast.success(`✅ ${pkgDates.length} pagos creados · S/ ${(Number(pkg.amount) * pkgDates.length).toFixed(2)} total`)
      setShowPkg(false); setPkg(emptyPkg)
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingPkg(false) }
  }

  // ─── Rate CRUD ──────────────────────────────────────────────────────────────
  const emptyRate = { name: '', description: '', amount: '', duration_min: '60' }
  const [rateForm, setRateForm] = useState(emptyRate)
  const [savingRate, setSavingRate] = useState(false)

  const openRateForm = (r?: any) => {
    if (r) { setEditingRate(r); setRateForm({ name: r.name, description: r.description || '', amount: String(r.amount), duration_min: String(r.duration_min) }) }
    else { setEditingRate(null); setRateForm(emptyRate) }
    setShowRateForm(true)
  }

  const handleSaveRate = async () => {
    if (!rateForm.name.trim()) { toast.error('Ingresa el nombre del servicio'); return }
    if (!rateForm.amount || isNaN(Number(rateForm.amount))) { toast.error('Ingresa un monto válido'); return }
    setSavingRate(true)
    try {
      const payload = { name: rateForm.name.trim(), description: rateForm.description.trim() || null, amount: Number(rateForm.amount), duration_min: Number(rateForm.duration_min) || 60, is_active: true }
      if (editingRate) await supabase.from('service_rates').update(payload).eq('id', editingRate.id)
      else await supabase.from('service_rates').insert(payload)
      toast.success(editingRate ? 'Tarifa actualizada' : 'Tarifa creada')
      setShowRateForm(false); cargar()
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingRate(false) }
  }

  const deleteRate = async (id: string) => {
    if (!confirm('¿Eliminar esta tarifa?')) return
    await supabase.from('service_rates').delete().eq('id', id)
    toast.success('Tarifa eliminada'); cargar()
  }

  // ─── Excel export via API ───────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const params = new URLSearchParams()
      const now = new Date()
      let desde = new Date()
      if (periodo === 'semana') desde.setDate(now.getDate() - 7)
      else if (periodo === 'mes') desde = new Date(now.getFullYear(), now.getMonth(), 1)
      else desde = new Date(now.getFullYear(), 0, 1)
      params.set('desde', desde.toISOString())
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      const res = await fetch(`/api/pagos/export?${params}`)
      if (!res.ok) throw new Error('Error al generar el reporte')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url
      a.download = `pagos_jugando_aprendo_${new Date().toISOString().slice(0,10)}.xlsx`; a.click()
      URL.revokeObjectURL(url); toast.success('📊 Excel exportado')
    } catch (e: any) { toast.error(e.message) }
  }

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    return (filterStatus === 'all' || p.status === filterStatus) &&
           (!q || (p.children?.name || '').toLowerCase().includes(q) || (p.concept || '').toLowerCase().includes(q))
  })
  const grouped = groupByPatientMonth(filtered)

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-all bg-[var(--muted-bg)] border-[var(--card-border)] text-[var(--text-primary)] focus:border-blue-500 focus:bg-[var(--card)]"

  // Autocomplete list for concept
  const ConceptInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="relative">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Ej: Sesión ABA, Evaluación, Terapia..." className={inputCls} list="concepts-list" />
      <datalist id="concepts-list">
        {rateNames.map(n => <option key={n} value={n} />)}
        <option value="Sesión de terapia" />
        <option value="Evaluación inicial" />
        <option value="Consulta de seguimiento" />
        <option value="Material terapéutico" />
      </datalist>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #f59e0b 100%)' }} />
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Pagos y Facturación</h2>
            <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              Gestión de ingresos del centro
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En tiempo real
              </span>
            </p>
          </div>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
            {(['semana','mes','anio'] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)}
                className="px-4 py-2 text-xs font-bold transition-all"
                style={{ background: periodo === p ? '#3b82f6' : 'var(--muted-bg)', color: periodo === p ? '#fff' : 'var(--text-muted)' }}>
                {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Ingresos cobrados" value={loading ? '—' : `S/ ${stats.total.toFixed(2)}`}     sub="Pagos recibidos"    icon={DollarSign}   bar="#10b981" />
        <KPI label="Transacciones"     value={loading ? '—' : stats.cobros}                         sub="Cobros realizados"  icon={CheckCircle2} bar="#3b82f6" />
        <KPI label="Por cobrar"        value={loading ? '—' : `S/ ${stats.pendiente.toFixed(2)}`}  sub="Pendiente de pago"  icon={Clock}        bar="#f59e0b" />
        <KPI label="Cancelados"        value={loading ? '—' : stats.cancelados}                     sub="Este período"       icon={XCircle}      bar="#ef4444" />
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────────── */}
      <div className="flex rounded-2xl p-1.5 border gap-1.5" style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'registros', label: '💳 Registros' },
          { id: 'agrupado',  label: '📅 Por paciente' },
          { id: 'tarifas',   label: '🏷️ Tarifas' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: tab === t.id ? 'var(--card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.id ? '1px solid var(--card-border)' : '1px solid transparent',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ──────────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos por mes</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses</p>
              </div>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={stats.porMes} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `S/${v}`} />
                  <Tooltip formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, 'Ingresos']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} cursor={{ fill: 'var(--muted-bg)' }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Métodos de pago</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Distribución de cobros</p>
              </div>
              <DollarSign size={16} style={{ color: '#f59e0b' }} />
            </div>
            <div className="p-5">
              {stats.porMetodo.length === 0 ? (
                <div className="flex items-center justify-center h-[190px]">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin datos para este período</p>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <ResponsiveContainer width="50%" height={190}>
                    <PieChart>
                      <Pie data={stats.porMetodo} cx="50%" cy="50%" innerRadius={48} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {stats.porMetodo.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `S/ ${Number(v).toFixed(2)}`}
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {stats.porMetodo.map(m => {
                      const tot = stats.porMetodo.reduce((a, x) => a + x.value, 0)
                      const pct = tot > 0 ? Math.round(m.value / tot * 100) : 0
                      return (
                        <div key={m.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{m.name}</span>
                            </div>
                            <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>S/{m.value.toFixed(0)}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted-bg)' }}>
                            <div style={{ width: `${pct}%`, background: m.color, height: '100%', borderRadius: 999 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTROS ──────────────────────────────────────────────────────────── */}
      {tab === 'registros' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-0"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente o concepto..."
                className="flex-1 text-sm bg-transparent outline-none min-w-0" style={{ color: 'var(--text-primary)' }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border-2 outline-none flex-shrink-0"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}>
              <option value="all">Todos los estados</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
              <Download size={13} /> Excel
            </button>
            <button onClick={() => { setShowPkg(false); setShowNew(v => !v) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex-shrink-0"
              style={{ borderColor: '#3b82f6', color: '#3b82f6', background: showNew ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
              <Plus size={13} /> Pago único
            </button>
            <button onClick={() => { setShowNew(false); setShowPkg(v => !v) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0 transition-all"
              style={{ background: showPkg ? '#1d4ed8' : '#3b82f6' }}>
              <Package size={13} /> Paquete
            </button>
          </div>

          {/* Single payment form */}
          {showNew && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '2px solid var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Registrar pago único</p>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Paciente *">
                  <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Concepto *">
                  <ConceptInput value={form.concept} onChange={v => setForm(f => ({ ...f, concept: v }))} />
                </Field>
                <Field label="Monto (S/) *">
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="Fecha de pago">
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Método de pago">
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className={inputCls}>
                    {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Estado">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Notas (opcional)">
                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones adicionales..." className={inputCls} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar pago
                </button>
              </div>
            </div>
          )}

          {/* Package form */}
          {showPkg && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '2px solid #3b82f6' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center"><Package size={15} className="text-blue-600" /></div>
                  <div>
                    <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Paquete de sesiones recurrentes</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Genera múltiples cobros automáticamente</p>
                  </div>
                </div>
                <button onClick={() => setShowPkg(false)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Paciente *">
                  <select value={pkg.child_id} onChange={e => setPkg(p => ({ ...p, child_id: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Concepto *">
                  <ConceptInput value={pkg.concept} onChange={v => setPkg(p => ({ ...p, concept: v }))} />
                </Field>
                <Field label="Monto por sesión (S/) *">
                  <input type="number" value={pkg.amount} onChange={e => setPkg(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className={inputCls} />
                </Field>
                <Field label="N° de sesiones">
                  <input type="number" min="1" max="52" value={pkg.sessions} onChange={e => setPkg(p => ({ ...p, sessions: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Fecha primera sesión">
                  <input type="date" value={pkg.start} onChange={e => setPkg(p => ({ ...p, start: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Frecuencia">
                  <select value={pkg.freq} onChange={e => setPkg(p => ({ ...p, freq: e.target.value as any }))} className={inputCls}>
                    <option value="weekly">Semanal (cada 7 días)</option>
                    <option value="biweekly">Quincenal (cada 14 días)</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </Field>
                <Field label="Método de pago">
                  <select value={pkg.method} onChange={e => setPkg(p => ({ ...p, method: e.target.value }))} className={inputCls}>
                    {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Estado de pagos">
                  <select value={pkg.status} onChange={e => setPkg(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                {pkg.amount && pkg.sessions && (
                  <div className="flex items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-center py-3">
                      <p className="text-2xl font-black" style={{ color: '#10b981' }}>S/ {(Number(pkg.amount) * Number(pkg.sessions)).toFixed(2)}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Total del paquete</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {pkgDates.length > 0 && pkg.child_id && pkg.amount && pkg.concept && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--muted-bg)', borderBottom: '1px solid var(--card-border)' }}>
                    <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                      Vista previa — {children.find(c => c.id === pkg.child_id)?.name}
                    </p>
                    <p className="text-xs font-black" style={{ color: '#10b981' }}>Total: S/ {(Number(pkg.amount) * pkgDates.length).toFixed(2)}</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {pkgDates.map((date, i) => {
                      const d = new Date(date + 'T12:00:00')
                      const lbl = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`
                      return (
                        <div key={date} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < pkgDates.length-1 ? '1px solid var(--card-border)' : 'none' }}>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{lbl}</span>
                          <span className="text-xs flex-1 mx-4 truncate" style={{ color: 'var(--text-secondary)' }}>{pkg.concept} ({i+1}/{pkgDates.length})</span>
                          <span className="text-sm font-black flex-shrink-0" style={{ color: 'var(--text-primary)' }}>S/ {Number(pkg.amount).toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowPkg(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSavePkg} disabled={savingPkg || !pkg.child_id || !pkg.amount || !pkg.concept}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {savingPkg ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
                  {savingPkg ? 'Creando...' : `Crear ${pkgDates.length} cobros`}
                </button>
              </div>
            </div>
          )}

          {/* Payments table */}
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <DollarSign size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin pagos registrados en este período</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Usa los botones de arriba para registrar un pago</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="grid grid-cols-[1fr_1.5fr_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
                <span>Paciente</span><span>Concepto</span><span>Monto</span><span>Método</span><span>Estado</span>
              </div>
              {filtered.map(p => {
                const st = STATUS_CFG[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' }
                return (
                  <div key={p.id} className="grid grid-cols-[1fr_1.5fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-[var(--muted-bg)]"
                    style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.children?.name || '—'}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.concept}</p>
                    <p className="text-sm font-black whitespace-nowrap" style={{ color: '#10b981' }}>S/ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs capitalize whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</p>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                )
              })}
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--muted-bg)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} registros</p>
                <p className="text-sm font-black" style={{ color: '#10b981' }}>
                  Total: S/ {filtered.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGRUPADO POR PACIENTE ──────────────────────────────────────────────── */}
      {tab === 'agrupado' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : grouped.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Calendar size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin registros</p>
            </div>
          ) : (grouped as any[]).map((g: any) => {
            const isOpen = expanded.has(g.key)
            return (
              <div key={g.key} className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <button onClick={() => setExpanded(s => { const n = new Set(s); n.has(g.key) ? n.delete(g.key) : n.add(g.key); return n })}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ background: '#3a68a0' }}>{g.child.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{g.child}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.monthLabel} · {g.pays.length} sesión{g.pays.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-black" style={{ color: '#10b981' }}>S/ {g.total.toFixed(2)}</p>
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--card-border)' }}>
                    {g.pays.map((p: any, pi: number) => {
                      const d = new Date(p.paid_at || p.created_at)
                      const lbl = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`
                      const st = STATUS_CFG[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' }
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-6 py-3"
                          style={{ borderBottom: pi < g.pays.length-1 ? '1px solid var(--card-border)' : 'none', background: 'var(--muted-bg)' }}>
                          <span className="text-xs font-mono font-bold w-20 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{lbl}</span>
                          <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{p.concept}</span>
                          <span className="text-sm font-black flex-shrink-0" style={{ color: '#10b981' }}>S/ {Number(p.amount).toFixed(2)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--card-border)' }}>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total {g.monthLabel}</span>
                      <span className="text-lg font-black" style={{ color: '#10b981' }}>S/ {g.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TARIFAS EDITABLES ──────────────────────────────────────────────────── */}
      {tab === 'tarifas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              Define los servicios y tarifas de tu centro. Se usan como sugerencias al registrar pagos.
            </p>
            <button onClick={() => openRateForm()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-all">
              <Plus size={13} /> Nueva tarifa
            </button>
          </div>

          {/* Rate form */}
          {showRateForm && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '2px solid #3b82f6' }}>
              <div className="flex items-center justify-between">
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{editingRate ? 'Editar tarifa' : 'Nueva tarifa'}</p>
                <button onClick={() => setShowRateForm(false)} style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Nombre del servicio *">
                    <input value={rateForm.name} onChange={e => setRateForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ej: Sesión ABA Individual, Evaluación, Consulta..." className={inputCls} />
                  </Field>
                </div>
                <Field label="Descripción">
                  <input value={rateForm.description} onChange={e => setRateForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción opcional del servicio" className={inputCls} />
                </Field>
                <Field label="Duración (minutos)">
                  <input type="number" value={rateForm.duration_min} onChange={e => setRateForm(f => ({ ...f, duration_min: e.target.value }))}
                    placeholder="60" className={inputCls} />
                </Field>
                <Field label="Precio (S/) *">
                  <input type="number" value={rateForm.amount} onChange={e => setRateForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" className={inputCls} />
                </Field>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowRateForm(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2" style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSaveRate} disabled={savingRate}
                  className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingRate ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingRate ? 'Actualizar' : 'Crear tarifa'}
                </button>
              </div>
            </div>
          )}

          {/* Rates grid */}
          {rates.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Settings2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin tarifas configuradas</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Agrega las tarifas de tu centro para usarlas como referencia rápida</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rates.map((r, i) => (
                <div key={r.id} className="rounded-2xl p-5 group relative" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="flex items-start justify-between pl-2 mb-3">
                    <p className="text-sm font-black leading-tight flex-1 pr-2" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openRateForm(r)}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                        style={{ background: 'var(--muted-bg)', color: 'var(--text-muted)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteRate(r.id)}
                        className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                        style={{ background: '#fee2e2', color: '#ef4444' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-2xl font-black pl-2" style={{ color: COLORS[i % COLORS.length] }}>S/ {Number(r.amount).toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2 pl-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--muted-bg)', color: 'var(--text-muted)' }}>{r.duration_min} min</span>
                    {r.description && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{r.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
