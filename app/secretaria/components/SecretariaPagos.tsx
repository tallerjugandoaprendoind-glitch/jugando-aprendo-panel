'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Plus, Search, Filter, Download, TrendingUp,
  CheckCircle2, Clock, XCircle, RefreshCw, Loader2,
  Calendar, User, FileText, Edit2, Save, X, BarChart3
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
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

export default function SecretariaPagos({ profile }: { profile: any }) {
  const toast = useToast()
  const [tab, setTab]           = useState<'pagos' | 'dashboard'>('dashboard')
  const [payments, setPayments] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [rates, setRates]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [periodo, setPeriodo]   = useState<'semana' | 'mes' | 'anio'>('mes')
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNew, setShowNew]   = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalIngresos: 0, pagados: 0, pendientes: 0, cancelados: 0,
    ingresosMes: [] as any[], porMetodo: [] as any[]
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      let desde: Date
      if (periodo === 'semana') { desde = new Date(now); desde.setDate(now.getDate() - 7) }
      else if (periodo === 'mes') { desde = new Date(now.getFullYear(), now.getMonth(), 1) }
      else { desde = new Date(now.getFullYear(), 0, 1) }

      const [{ data: pays }, { data: kids }, { data: svcRates }] = await Promise.all([
        supabase.from('payments').select('*, children(name)').gte('created_at', desde.toISOString()).order('created_at', { ascending: false }).limit(200),
        supabase.from('children').select('id, name').eq('is_active', true).order('name'),
        supabase.from('service_rates').select('*').eq('is_active', true),
      ])

      const allPays = pays || []
      setPayments(allPays)
      setChildren(kids || [])
      setRates(svcRates || [])

      const paid      = allPays.filter(p => p.status === 'paid')
      const pending   = allPays.filter(p => p.status === 'pending')
      const cancelled = allPays.filter(p => p.status === 'cancelled')
      const sum = (arr: any[]) => arr.reduce((a, p) => a + Number(p.amount), 0)

      // Ingresos por mes (últimos 6 meses)
      const ingresosMes = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
        const m = d.getMonth(); const y = d.getFullYear()
        const monthPays = allPays.filter(p => {
          const pd = new Date(p.paid_at || p.created_at)
          return pd.getMonth() === m && pd.getFullYear() === y && p.status === 'paid'
        })
        return { mes: MESES[m], total: sum(monthPays) }
      })

      // Por método de pago
      const porMetodo = METHODS.map((m, i) => ({
        name: m.charAt(0).toUpperCase() + m.slice(1),
        value: sum(paid.filter(p => p.payment_method === m)),
        color: COLORS[i % COLORS.length],
      })).filter(m => m.value > 0)

      setStats({
        totalIngresos: sum(paid),
        pagados: paid.length,
        pendientes: sum(pending),
        cancelados: cancelled.length,
        ingresosMes,
        porMetodo,
      })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const matchS = filterStatus === 'all' || p.status === filterStatus
    const matchQ = !q || (p.children?.name || '').toLowerCase().includes(q) || p.concept.toLowerCase().includes(q)
    return matchS && matchQ
  })

  const formatCurrency = (n: number) => `S/ ${n.toFixed(2)}`

  // ── New Payment Form ────────────────────────────────────────────────────────
  const [form, setForm] = useState({ child_id: '', amount: '', concept: 'Sesión de terapia', method: 'efectivo', status: 'paid', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.child_id) { toast.error('Selecciona el paciente'); return }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Ingresa un monto válido'); return }
    setSaving(true)
    try {
      await supabase.from('payments').insert({
        child_id: form.child_id,
        amount: Number(form.amount),
        concept: form.concept,
        payment_method: form.method,
        status: form.status,
        notes: form.notes || null,
        paid_at: form.status === 'paid' ? new Date().toISOString() : null,
        created_by: profile?.id,
      })
      toast.success('✅ Pago registrado')
      setShowNew(false)
      setForm({ child_id: '', amount: '', concept: 'Sesión de terapia', method: 'efectivo', status: 'paid', notes: '' })
      cargar()
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    setUpdatingStatus(paymentId)
    try {
      const { error } = await supabase.from('payments').update({
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : undefined,
      }).eq('id', paymentId)
      if (error) throw error
      toast.success('✅ Estado actualizado')
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p))
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setUpdatingStatus(null)
      setEditingStatus(null)
    }
  }

  const exportExcel = async () => {
    try {
      const now = new Date()
      let desde: Date
      if (periodo === 'semana') { desde = new Date(now); desde.setDate(now.getDate() - 7) }
      else if (periodo === 'mes') { desde = new Date(now.getFullYear(), now.getMonth(), 1) }
      else { desde = new Date(now.getFullYear(), 0, 1) }

      const params = new URLSearchParams({
        desde: desde.toISOString(),
        status: filterStatus,
        search,
      })
      const res = await fetch(`/api/pagos/export?${params}`)
      if (!res.ok) throw new Error('Error al generar el archivo')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pagos_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('✅ Excel exportado')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-all"
    + " bg-[var(--muted-bg)] border-[var(--card-border)] text-[var(--text-primary)] focus:border-blue-500"

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="rounded-xl overflow-hidden flex-1" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3a68a0, #10b981, #f59e0b)' }} />
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Pagos y Facturación</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gestión de ingresos del centro</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Período */}
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
                {(['semana','mes','anio'] as const).map(p => (
                  <button key={p} onClick={() => setPeriodo(p)}
                    className="px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      background: periodo === p ? '#3b82f6' : 'var(--muted-bg)',
                      color: periodo === p ? '#fff' : 'var(--text-muted)',
                    }}>
                    {p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
                  </button>
                ))}
              </div>
              <button onClick={cargar} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Ingresos"    value={loading ? '—' : formatCurrency(stats.totalIngresos)} sub="Pagos recibidos"  icon={DollarSign}  bar="#10b981" />
        <KPI label="Cobros"      value={loading ? '—' : stats.pagados}                       sub="Transacciones"   icon={CheckCircle2} bar="#3b82f6" />
        <KPI label="Pendiente"   value={loading ? '—' : formatCurrency(stats.pendientes)}    sub="Por cobrar"      icon={Clock}        bar="#f59e0b" />
        <KPI label="Cancelados"  value={loading ? '—' : stats.cancelados}                    sub="Este período"    icon={XCircle}      bar="#ef4444" />
      </div>

      {/* Sub-tabs */}
      <div className="flex rounded-2xl p-1.5 border gap-1.5" style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}>
        {[
          { id: 'dashboard', icon: BarChart3, label: '📊 Dashboard' },
          { id: 'pagos',     icon: DollarSign, label: '💳 Registros' },
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

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Ingresos por mes */}
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
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={v => `S/${v}`} />
                  <Tooltip formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, 'Ingresos']}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} cursor={{ fill: 'var(--muted-bg)' }} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Por método de pago */}
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
                  <ResponsiveContainer width="60%" height={180}>
                    <PieChart>
                      <Pie data={stats.porMetodo} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                        {stats.porMetodo.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

          {/* Tarifas del centro */}
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
        </div>
      )}

      {/* ── REGISTROS TAB ── */}
      {tab === 'pagos' && (
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
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background: '#16a34a15', borderColor: '#16a34a40', color: '#16a34a' }}>
              <Download size={13} /> Excel
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all">
              <Plus size={13} /> Registrar pago
            </button>
          </div>

          {/* New payment form */}
          {showNew && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between">
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Registrar nuevo pago</p>
                <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
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
                    <option>Otro</option>
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
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Opcional..." className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'Guardando...' : 'Guardar pago'}
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
              {/* Header */}
              <div className="grid grid-cols-5 gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest"
                style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
                <span>Paciente</span><span>Concepto</span><span>Monto</span><span>Método</span><span>Estado</span>
              </div>
              {filtered.map(p => {
                const st = STATUS_CFG[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' }
                return (
                  <div key={p.id} className="grid grid-cols-5 gap-3 px-5 py-3.5 items-center transition-opacity hover:opacity-80"
                    style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.children?.name || '—'}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.concept}</p>
                    <p className="text-sm font-black" style={{ color: '#10b981' }}>S/ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</p>
                    <div className="relative">
                      {updatingStatus === p.id ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                          style={{ background: st.bg }}>
                          <Loader2 size={11} className="animate-spin" style={{ color: st.color }} />
                          <span className="text-[10px] font-bold" style={{ color: st.color }}>Guardando…</span>
                        </div>
                      ) : editingStatus === p.id ? (
                        <select
                          autoFocus
                          defaultValue={p.status}
                          onBlur={() => setEditingStatus(null)}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border-2 outline-none cursor-pointer"
                          style={{ background: st.bg, color: st.color, borderColor: st.color }}>
                          {Object.entries(STATUS_CFG).map(([k, v]) => (
                            <option key={k} value={k} style={{ background: '#fff', color: '#1f2937' }}>{v.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingStatus(p.id)}
                          title="Clic para cambiar estado"
                          className="text-[10px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1 group transition-all hover:opacity-80"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                          <Edit2 size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
