'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, TrendingUp, Users, Calendar, Download,
  RefreshCw, Loader2, BarChart3, FileText, CheckCircle2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORS = ['#3a68a0','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4']

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

export default function AdminReportesFinancieros() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ingresos' | 'terapeutas' | 'pacientes' | 'servicios'>('ingresos')
  const [anio, setAnio] = useState(new Date().getFullYear())

  const [data, setData] = useState({
    totalAnio: 0, totalMes: 0, cobrados: 0, pendiente: 0,
    porMes: [] as any[], porTerapeuta: [] as any[],
    porPaciente: [] as any[], porServicio: [] as any[],
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const inicio = `${anio}-01-01`
      const fin    = `${anio}-12-31`
      const mesActual = new Date().getMonth()
      const inicioMes = `${anio}-${String(mesActual + 1).padStart(2,'0')}-01`

      const { data: pays } = await supabase
        .from('payments')
        .select('*, children(name, profiles(full_name))')
        .gte('created_at', inicio)
        .lte('created_at', fin + 'T23:59:59')
        .order('created_at')

      const all = pays || []
      const paid = all.filter(p => p.status === 'paid')
      const sum = (arr: any[]) => arr.reduce((a, p) => a + Number(p.amount), 0)

      // Por mes
      const porMes = Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2,'0')
        const monthPays = paid.filter(p => (p.paid_at || p.created_at).startsWith(`${anio}-${m}`))
        return { mes: MESES[i], ingresos: sum(monthPays), cantidad: monthPays.length }
      })

      // Por terapeuta (via appointments linkage - estimate from concept/notes)
      const tMap: Record<string, { ingresos: number; sesiones: number }> = {}
      paid.forEach(p => {
        const t = p.therapist_name || 'Sin asignar'
        if (!tMap[t]) tMap[t] = { ingresos: 0, sesiones: 0 }
        tMap[t].ingresos += Number(p.amount)
        tMap[t].sesiones++
      })
      const porTerapeuta = Object.entries(tMap).sort(([,a],[,b]) => b.ingresos - a.ingresos).slice(0, 8)
        .map(([name, v], i) => ({ name, ...v, color: COLORS[i % COLORS.length] }))

      // Por paciente
      const pMap: Record<string, { name: string; ingresos: number; pagos: number }> = {}
      paid.forEach(p => {
        const id = p.child_id || 'none'
        if (!pMap[id]) pMap[id] = { name: p.children?.name || '—', ingresos: 0, pagos: 0 }
        pMap[id].ingresos += Number(p.amount)
        pMap[id].pagos++
      })
      const porPaciente = Object.values(pMap).sort((a, b) => b.ingresos - a.ingresos).slice(0, 10)

      // Por servicio/concepto
      const sMap: Record<string, { value: number }> = {}
      paid.forEach(p => {
        const s = p.concept || 'Otro'
        if (!sMap[s]) sMap[s] = { value: 0 }
        sMap[s].value += Number(p.amount)
      })
      const porServicio = Object.entries(sMap).sort(([,a],[,b]) => b.value - a.value)
        .map(([name, v], i) => ({ name, ...v, color: COLORS[i % COLORS.length] }))

      setData({
        totalAnio: sum(paid),
        totalMes: sum(paid.filter(p => (p.paid_at || p.created_at) >= inicioMes)),
        cobrados: paid.length,
        pendiente: sum(all.filter(p => p.status === 'pending')),
        porMes, porTerapeuta, porPaciente, porServicio,
      })
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [anio])

  useEffect(() => { cargar() }, [cargar])

  const exportCSV = async () => {
    const { data: pays } = await supabase.from('payments')
      .select('*, children(name)').gte('created_at', `${anio}-01-01`).order('created_at')
    const rows = [
      ['Fecha','Paciente','Concepto','Monto','Método','Estado'],
      ...(pays || []).map((p: any) => [
        new Date(p.created_at).toLocaleDateString('es-PE'),
        p.children?.name || '—', p.concept, p.amount, p.payment_method,
        p.status
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `reporte_financiero_${anio}.csv`; a.click()
    URL.revokeObjectURL(url); toast.success('Reporte exportado')
  }

  const fmt = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #10b981, #3a68a0, #f59e0b)' }} />
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Reportes Financieros</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ingresos, facturación y métricas del centro</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Año selector */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--card-border)' }}>
              {[new Date().getFullYear() - 1, new Date().getFullYear()].map(y => (
                <button key={y} onClick={() => setAnio(y)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{ background: anio === y ? '#10b981' : 'var(--muted-bg)', color: anio === y ? '#fff' : 'var(--text-muted)' }}>
                  {y}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
              style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={cargar} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--muted-bg)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={`Ingresos ${anio}`} value={loading ? '—' : fmt(data.totalAnio)}  sub="Total del año"         icon={DollarSign}  bar="#10b981" />
        <KPI label="Este mes"           value={loading ? '—' : fmt(data.totalMes)}   sub="Mes en curso"          icon={TrendingUp}  bar="#3a68a0" />
        <KPI label="Cobros realizados"  value={loading ? '—' : data.cobrados}        sub="Transacciones pagadas" icon={CheckCircle2} bar="#8b5cf6" />
        <KPI label="Por cobrar"         value={loading ? '—' : fmt(data.pendiente)}  sub="Pendiente de pago"     icon={Calendar}    bar="#f59e0b" />
      </div>

      {/* Sub-tabs */}
      <div className="flex rounded-2xl p-1.5 border gap-1.5" style={{ background: 'var(--muted-bg)', borderColor: 'var(--card-border)' }}>
        {[
          { id: 'ingresos',    label: '📈 Ingresos por mes' },
          { id: 'terapeutas',  label: '👤 Por terapeuta' },
          { id: 'pacientes',   label: '🧒 Por paciente' },
          { id: 'servicios',   label: '🏷️ Por servicio' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: tab === t.id ? 'var(--card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.id ? '1px solid var(--card-border)' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
      ) : (
        <>
          {/* Ingresos por mes */}
          {tab === 'ingresos' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos mensuales {anio}</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.porMes} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50}
                      tickFormatter={v => `S/${v}`} />
                    <Tooltip formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, 'Ingresos']}
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} cursor={{ fill: 'var(--muted-bg)' }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Tabla resumen */}
                <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
                  <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: 'var(--muted-bg)', color: 'var(--text-muted)', borderBottom: '1px solid var(--card-border)' }}>
                    <span>Mes</span><span className="text-right">Cobros</span><span className="text-right">Total</span>
                  </div>
                  {data.porMes.filter(m => m.ingresos > 0).map(m => (
                    <div key={m.mes} className="grid grid-cols-3 px-4 py-2.5"
                      style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.mes}</span>
                      <span className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{m.cantidad}</span>
                      <span className="text-xs font-black text-right" style={{ color: '#10b981' }}>S/ {m.ingresos.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Por terapeuta */}
          {tab === 'terapeutas' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos por terapeuta</h3>
              </div>
              <div className="p-5">
                {data.porTerapeuta.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Sin datos para este período</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.porTerapeuta} barSize={28} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `S/${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip formatter={(v: any) => [`S/ ${Number(v).toFixed(2)}`, 'Ingresos']}
                          contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'var(--muted-bg)' }} />
                        <Bar dataKey="ingresos" fill="#3a68a0" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {data.porTerapeuta.map(t => (
                        <div key={t.name} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: t.color }}>{t.name.charAt(0)}</div>
                          <div className="flex-1">
                            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.sesiones} cobros</p>
                          </div>
                          <p className="text-sm font-black" style={{ color: '#10b981' }}>S/ {t.ingresos.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Por paciente */}
          {tab === 'pacientes' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos por paciente</h3>
              </div>
              <div className="overflow-x-auto">
                {data.porPaciente.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--muted-bg)', borderBottom: '1px solid var(--card-border)' }}>
                        {['Paciente','Pagos','Total'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.porPaciente.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                          <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>{p.pagos}</td>
                          <td className="px-5 py-3 font-black" style={{ color: '#10b981' }}>S/ {p.ingresos.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Por servicio */}
          {tab === 'servicios' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Ingresos por servicio</h3>
              </div>
              <div className="p-5 flex items-start gap-6">
                {data.porServicio.length === 0 ? (
                  <p className="text-sm py-8" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
                ) : (
                  <>
                    <ResponsiveContainer width="45%" height={200}>
                      <PieChart>
                        <Pie data={data.porServicio} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                          {data.porServicio.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `S/ ${Number(v).toFixed(2)}`}
                          contentStyle={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {data.porServicio.map(s => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          <span className="text-xs flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                          <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>S/ {s.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
