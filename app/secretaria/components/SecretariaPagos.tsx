'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DollarSign, Plus, Search, Download, TrendingUp,
  CheckCircle2, Clock, XCircle, Loader2, Calendar,
  Save, X, Package, ChevronDown, ChevronUp, Repeat
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, icon: Icon, bar }: any) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: bar }} />
      <div className="flex items-start justify-between pl-3 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${bar}15` }}>
          <Icon size={14} style={{ color: bar }} />
        </div>
      </div>
      <p className="text-3xl font-black leading-none pl-3 mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs pl-3" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid:      { label: 'Pagado',    color: '#10b981', bg: '#d1fae5' },
  pending:   { label: 'Pendiente', color: '#f59e0b', bg: '#fef3c7' },
  partial:   { label: 'Parcial',   color: '#3b82f6', bg: '#dbeafe' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2' },
  refunded:  { label: 'Devuelto',  color: '#8b5cf6', bg: '#ede9fe' },
}

const METHODS = ['efectivo','yape','plin','transferencia','tarjeta','otro']
const MESES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const COLORS  = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6] // 0=Dom, 1=Lun...

// Generate dates for a recurring package
function generatePackageDates(startDate: string, frequency: 'weekly' | 'biweekly' | 'monthly', sessions: number): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T12:00:00')
  let current = new Date(start)
  for (let i = 0; i < sessions; i++) {
    dates.push(current.toISOString().split('T')[0])
    if (frequency === 'weekly')    current.setDate(current.getDate() + 7)
    if (frequency === 'biweekly')  current.setDate(current.getDate() + 14)
    if (frequency === 'monthly')   current.setMonth(current.getMonth() + 1)
  }
  return dates
}

// Group payments by patient + month
function groupByPatientMonth(payments: any[]) {
  const groups: Record<string, { childName: string; month: string; monthLabel: string; payments: any[]; total: number }> = {}
  payments.forEach(p => {
    const date = new Date((p.paid_at || p.created_at))
    const key = `${p.child_id}_${date.getFullYear()}_${date.getMonth()}`
    if (!groups[key]) {
      groups[key] = {
        childName: p.children?.name || '—',
        month: `${date.getFullYear()}-${date.getMonth()}`,
        monthLabel: `${MESES_LARGO[date.getMonth()]} ${date.getFullYear()}`,
        payments: [],
        total: 0,
      }
    }
    groups[key].payments.push(p)
    groups[key].total += Number(p.amount)
  })
  return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month))
}

export default function SecretariaPagos({ profile }: { profile: any }) {
  const toast = useToast()
  const realtimeRef = useRef<any>(null)

  const [tab, setTab]           = useState<'dashboard' | 'registros' | 'agrupado'>('dashboard')
  const [payments, setPayments] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [rates, setRates]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [periodo, setPeriodo]   = useState<'semana' | 'mes' | 'anio'>('mes')
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNew, setShowNew]   = useState(false)
  const [showPackage, setShowPackage] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const [stats, setStats] = useState({
    totalIngresos: 0, pagados: 0, pendientes: 0, cancelados: 0,
    ingresosMes: [] as any[], porMetodo: [] as any[]
  })

  const buildStats = useCallback((allPays: any[]) => {
    const paid      = allPays.filter(p => p.status === 'paid')
    const pending   = allPays.filter(p => p.status === 'pending')
    const cancelled = allPays.filter(p => p.status === 'cancelled')
    const sum = (arr: any[]) => arr.reduce((a, p) => a + Number(p.amount), 0)

    const ingresosMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
      const m = d.getMonth(); const y = d.getFullYear()
      const mp = paid.filter(p => {
        const pd = new Date(p.paid_at || p.created_at)
        return pd.getMonth() === m && pd.getFullYear() === y
      })
      return { mes: MESES[m], total: sum(mp) }
    })

    const porMetodo = METHODS.map((m, i) => ({
      name: m.charAt(0).toUpperCase() + m.slice(1),
      value: sum(paid.filter(p => p.payment_method === m)),
      color: COLORS[i % COLORS.length],
    })).filter(m => m.value > 0)

    setStats({ totalIngresos: sum(paid), pagados: paid.length, pendientes: sum(pending), cancelados: cancelled.length, ingresosMes, porMetodo })
  }, [])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      let desde: Date
      if (periodo === 'semana') { desde = new Date(now); desde.setDate(now.getDate() - 7) }
      else if (periodo === 'mes') { desde = new Date(now.getFullYear(), now.getMonth(), 1) }
      else { desde = new Date(now.getFullYear(), 0, 1) }

      const [{ data: pays }, { data: kids }, { data: svcRates }] = await Promise.all([
        supabase.from('payments').select('*, children(name)').gte('created_at', desde.toISOString()).order('created_at', { ascending: false }).limit(500),
        supabase.from('children').select('id, name').eq('is_active', true).order('name'),
        supabase.from('service_rates').select('*').eq('is_active', true),
      ])
      const allPays = pays || []
      setPayments(allPays)
      setChildren(kids || [])
      setRates(svcRates || [])
      buildStats(allPays)
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [periodo, buildStats])

  // Initial load
  useEffect(() => { cargar() }, [cargar])

  // ── Real-time subscription ──────────────────────────────────────────────────
  useEffect(() => {
    // Suscripción a cambios en payments
    realtimeRef.current = supabase
      .channel('payments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        setPayments(prev => {
          let updated: any[]
          if (payload.eventType === 'INSERT') {
            updated = [payload.new, ...prev]
          } else if (payload.eventType === 'UPDATE') {
            updated = prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
          } else if (payload.eventType === 'DELETE') {
            updated = prev.filter(p => p.id !== payload.old.id)
          } else {
            updated = prev
          }
          buildStats(updated)
          return updated
        })
      })
      .subscribe()

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    }
  }, [buildStats])

  // ── Single payment form ────────────────────────────────────────────────────
  const [form, setForm] = useState({ child_id: '', amount: '', concept: 'Sesión de terapia', method: 'efectivo', status: 'paid', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.child_id) { toast.error('Selecciona el paciente'); return }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Ingresa un monto válido'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('payments').insert({
        child_id: form.child_id, amount: Number(form.amount),
        concept: form.concept, payment_method: form.method,
        status: form.status, notes: form.notes || null,
        paid_at: form.status === 'paid' ? new Date().toISOString() : null,
        created_by: profile?.id,
      }).select('*, children(name)').single()
      if (error) throw error
      toast.success('✅ Pago registrado')
      setShowNew(false)
      setForm({ child_id: '', amount: '', concept: 'Sesión de terapia', method: 'efectivo', status: 'paid', notes: '' })
      // Real-time handles state update
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  // ── Package form ───────────────────────────────────────────────────────────
  const [pkg, setPkg] = useState({
    child_id: '', sessions: '4', amount_per_session: '',
    concept: 'Sesión ABA Individual', method: 'efectivo',
    status: 'paid', start_date: new Date().toISOString().split('T')[0],
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
  })
  const [savingPkg, setSavingPkg] = useState(false)
  const [pkgPreview, setPkgPreview] = useState<string[]>([])

  useEffect(() => {
    if (pkg.start_date && pkg.sessions && Number(pkg.sessions) > 0) {
      setPkgPreview(generatePackageDates(pkg.start_date, pkg.frequency, Number(pkg.sessions)))
    }
  }, [pkg.start_date, pkg.sessions, pkg.frequency])

  const handleSavePackage = async () => {
    if (!pkg.child_id) { toast.error('Selecciona el paciente'); return }
    if (!pkg.amount_per_session || isNaN(Number(pkg.amount_per_session))) { toast.error('Ingresa el monto por sesión'); return }
    if (pkgPreview.length === 0) { toast.error('Genera las fechas primero'); return }
    setSavingPkg(true)
    try {
      const inserts = pkgPreview.map((date, i) => ({
        child_id: pkg.child_id,
        amount: Number(pkg.amount_per_session),
        concept: `${pkg.concept} (${i + 1}/${pkgPreview.length})`,
        payment_method: pkg.method,
        status: pkg.status,
        paid_at: pkg.status === 'paid' ? new Date(date + 'T12:00:00').toISOString() : null,
        notes: `Paquete de ${pkgPreview.length} sesiones`,
        created_by: profile?.id,
      }))
      const { error } = await supabase.from('payments').insert(inserts)
      if (error) throw error
      const total = Number(pkg.amount_per_session) * pkgPreview.length
      toast.success(`✅ Paquete creado: ${pkgPreview.length} sesiones · S/ ${total.toFixed(2)} total`)
      setShowPackage(false)
      setPkg({ child_id: '', sessions: '4', amount_per_session: '', concept: 'Sesión ABA Individual', method: 'efectivo', status: 'paid', start_date: new Date().toISOString().split('T')[0], frequency: 'weekly' })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setSavingPkg(false) }
  }

  const exportCSV = () => {
    const rows = [
      ['Paciente','Concepto','Monto','Método','Estado','Fecha'],
      ...filtered.map(p => [
        p.children?.name || '—', p.concept, p.amount, p.payment_method,
        STATUS_CFG[p.status]?.label || p.status,
        new Date(p.created_at).toLocaleDateString('es-PE'),
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `pagos_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url); toast.success('CSV exportado')
  }

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const matchS = filterStatus === 'all' || p.status === filterStatus
    const matchQ = !q || (p.children?.name || '').toLowerCase().includes(q) || p.concept.toLowerCase().includes(q)
    return matchS && matchQ
  })

  const grouped = groupByPatientMonth(filtered)

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-all"
    + " bg-[var(--muted-bg)] border-[var(--card-border)] text-[var(--text-primary)] focus:border-blue-500"

  const freqLabel: Record<string, string> = { weekly: 'Semanal (cada 7 días)', biweekly: 'Quincenal (cada 14 días)', monthly: 'Mensual' }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0, #10b981, #f59e0b)' }} />
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Pagos y Facturación</h2>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              Gestión de ingresos del centro
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Tiempo real
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
              {(['semana','mes','anio'] as const).map(p => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{ background: periodo === p ? '#3b82f6' : 'var(--muted-bg)', color: periodo === p ? '#fff' : 'var(--text-muted)' }}>
                  {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Ingresos"   value={loading ? '—' : `S/ ${stats.totalIngresos.toFixed(2)}`} sub="Pagos recibidos"  icon={DollarSign}   bar="#10b981" />
        <KPI label="Cobros"     value={loading ? '—' : stats.pagados}                          sub="Transacciones"   icon={CheckCircle2} bar="#3b82f6" />
        <KPI label="Pendiente"  value={loading ? '—' : `S/ ${stats.pendientes.toFixed(2)}`}   sub="Por cobrar"      icon={Clock}        bar="#f59e0b" />
        <KPI label="Cancelados" value={loading ? '—' : stats.cancelados}                       sub="Este período"    icon={XCircle}      bar="#ef4444" />
      </div>

      {/* Sub-tabs */}
      <div className="flex rounded-2xl p-1.5 border gap-1.5" style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'registros', label: '💳 Registros' },
          { id: 'agrupado',  label: '📅 Por paciente' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
            style={{
              background: tab === t.id ? 'var(--card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: tab === t.id ? '1px solid var(--card-border)' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos por mes</h3>
              <TrendingUp size={15} style={{ color: '#10b981' }} />
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.ingresosMes} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `S/${v}`} />
                  <Tooltip formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, 'Ingresos']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} cursor={{ fill: 'var(--muted-bg)' }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Por método de pago</h3>
              <DollarSign size={15} style={{ color: '#f59e0b' }} />
            </div>
            <div className="p-5">
              {stats.porMetodo.length === 0 ? (
                <div className="flex items-center justify-center h-[180px]">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin datos para este período</p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={stats.porMetodo} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                        {stats.porMetodo.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `S/ ${Number(v).toFixed(2)}`}
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {stats.porMetodo.map(m => (
                      <div key={m.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                        <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{m.name}</span>
                        <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>S/{m.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarifas */}
          {rates.length > 0 && (
            <div className="rounded-xl overflow-hidden lg:col-span-2" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Tarifas del centro</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {rates.map(r => (
                  <div key={r.id} className="p-3 rounded-xl" style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}>
                    <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                    <p className="text-xl font-black text-blue-500 mt-1">S/ {Number(r.amount).toFixed(2)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.duration_min} min</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REGISTROS ── */}
      {tab === 'registros' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente o concepto..."
                className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border-2 outline-none"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}>
              <option value="all">Todos los estados</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
              style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => { setShowPackage(false); setShowNew(!showNew) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all"
              style={{ borderColor: '#3b82f6', color: '#3b82f6', background: showNew ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
              <Plus size={13} /> Pago único
            </button>
            <button onClick={() => { setShowNew(false); setShowPackage(!showPackage) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all">
              <Package size={13} /> Paquete
            </button>
          </div>

          {/* Single payment form */}
          {showNew && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Registrar pago único</p>
                <button onClick={() => setShowNew(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Paciente *</label>
                  <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Monto (S/) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Concepto</label>
                  <select value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} className={inputCls}>
                    {rates.map(r => <option key={r.id}>{r.name}</option>)}
                    <option>Sesión de terapia</option><option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Método</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className={inputCls}>
                    {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Notas</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional..." className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Package form */}
          {showPackage && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '2px solid #3b82f6' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={16} style={{ color: '#3b82f6' }} />
                  <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Crear paquete de sesiones</p>
                </div>
                <button onClick={() => setShowPackage(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Paciente *</label>
                  <select value={pkg.child_id} onChange={e => setPkg(p => ({ ...p, child_id: e.target.value }))} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Concepto</label>
                  <select value={pkg.concept} onChange={e => setPkg(p => ({ ...p, concept: e.target.value }))} className={inputCls}>
                    {rates.map(r => <option key={r.id}>{r.name}</option>)}
                    <option>Sesión ABA Individual</option><option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Monto por sesión (S/) *</label>
                  <input type="number" value={pkg.amount_per_session} onChange={e => setPkg(p => ({ ...p, amount_per_session: e.target.value }))}
                    placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>N° de sesiones</label>
                  <input type="number" min="1" max="52" value={pkg.sessions} onChange={e => setPkg(p => ({ ...p, sessions: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha primera sesión</label>
                  <input type="date" value={pkg.start_date} onChange={e => setPkg(p => ({ ...p, start_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Frecuencia</label>
                  <select value={pkg.frequency} onChange={e => setPkg(p => ({ ...p, frequency: e.target.value as any }))} className={inputCls}>
                    <option value="weekly">Semanal (cada 7 días)</option>
                    <option value="biweekly">Quincenal (cada 14 días)</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Método de pago</label>
                  <select value={pkg.method} onChange={e => setPkg(p => ({ ...p, method: e.target.value }))} className={inputCls}>
                    {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado de los pagos</label>
                  <select value={pkg.status} onChange={e => setPkg(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {pkgPreview.length > 0 && pkg.child_id && pkg.amount_per_session && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                      Vista previa — {children.find(c => c.child_id === pkg.child_id)?.name || children.find(c => c.id === pkg.child_id)?.name || 'Paciente'}
                    </p>
                    <p className="text-xs font-black" style={{ color: '#10b981' }}>
                      Total: S/ {(Number(pkg.amount_per_session) * pkgPreview.length).toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {pkgPreview.map((date, i) => {
                      const d = new Date(date + 'T12:00:00')
                      const label = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`
                      return (
                        <div key={date} className="flex items-center justify-between py-1 px-2 rounded-lg"
                          style={{ background: 'var(--card)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {label} &nbsp;·&nbsp; {pkg.concept}
                          </span>
                          <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                            S/ {Number(pkg.amount_per_session).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowPackage(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSavePackage} disabled={savingPkg || !pkg.child_id || !pkg.amount_per_session}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingPkg ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
                  {savingPkg ? 'Creando...' : `Crear ${pkgPreview.length} pagos`}
                </button>
              </div>
            </div>
          )}

          {/* Payments list */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <DollarSign size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin pagos registrados</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="grid grid-cols-5 gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
                <span>Paciente</span><span>Concepto</span><span>Monto</span><span>Método</span><span>Estado</span>
              </div>
              {filtered.map(p => {
                const st = STATUS_CFG[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' }
                return (
                  <div key={p.id} className="grid grid-cols-5 gap-3 px-5 py-3.5 items-center"
                    style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.children?.name || '—'}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.concept}</p>
                    <p className="text-sm font-black" style={{ color: '#10b981' }}>S/ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</p>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg inline-block"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── AGRUPADO POR PACIENTE/MES ── */}
      {tab === 'agrupado' && (
        <div className="space-y-3">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Pagos agrupados por paciente y mes, con detalle de cada sesión
          </p>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
          ) : grouped.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Sin registros para este período</p>
            </div>
          ) : grouped.map((g, gi) => {
            const key = `${g.childName}_${g.month}`
            const expanded = expandedGroups.has(key)
            const toggle = () => setExpandedGroups(prev => {
              const s = new Set(prev)
              s.has(key) ? s.delete(key) : s.add(key)
              return s
            })
            return (
              <div key={gi} className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                {/* Group header */}
                <button onClick={toggle} className="w-full flex items-center justify-between px-5 py-4 text-left transition-opacity hover:opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                      style={{ background: '#3a68a0' }}>
                      {g.childName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{g.childName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.monthLabel} · {g.payments.length} sesión{g.payments.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-black" style={{ color: '#10b981' }}>S/ {g.total.toFixed(2)}</p>
                    {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div style={{ borderTop: '1px solid var(--card-border)' }}>
                    {g.payments.map((p, pi) => {
                      const d = new Date(p.paid_at || p.created_at)
                      const label = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`
                      const st = STATUS_CFG[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' }
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-5 py-3"
                          style={{ borderBottom: pi < g.payments.length - 1 ? '1px solid var(--card-border)' : 'none', background: 'var(--muted-bg)' }}>
                          <span className="text-xs font-mono font-bold w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{p.concept}</span>
                          <span className="text-sm font-black" style={{ color: '#10b981' }}>S/ {Number(p.amount).toFixed(2)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                      )
                    })}
                    {/* Total row */}
                    <div className="flex items-center justify-between px-5 py-3"
                      style={{ borderTop: '1px solid var(--card-border)', background: 'var(--card)' }}>
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
    </div>
  )
}
