'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronRight, Baby, Loader2, Eye, FileText, Activity, Clock, AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function calcularEdad(fecha: string) {
  if (!fecha) return 'N/D'
  const hoy = new Date(), nac = new Date(fecha)
  const anos = hoy.getFullYear() - nac.getFullYear()
  return `${hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate()) ? anos - 1 : anos} años`
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #06b6d4, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #f472b6)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #10b981, #f59e0b)',
]

export default function MisPacientes() {
  const toast = useToast()
  const [ninos, setNinos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('children').select('*, profiles!children_parent_id_fkey(full_name, email)').eq('is_active', true).order('name')
      setNinos(data || [])
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  const verHistorial = async (nino: any) => {
    setSeleccionado(nino)
    setLoadingHistorial(true)
    try {
      const { data } = await supabase.from('session_records').select('*').eq('child_id', nino.id).order('fecha_sesion', { ascending: false }).limit(10)
      setHistorial(data || [])
    } catch { setHistorial([]) }
    finally { setLoadingHistorial(false) }
  }

  useEffect(() => { cargar() }, [cargar])

  const filtrados = ninos.filter(n =>
    n.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.diagnosis?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (seleccionado) {
    const grad = AVATAR_GRADIENTS[seleccionado.name?.charCodeAt(0) % AVATAR_GRADIENTS.length]
    return (
      <div className="space-y-5 pb-24 lg:pb-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSeleccionado(null)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <p style={{ color: '#475569' }} className="text-xs font-bold uppercase tracking-wide">Paciente</p>
            <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-xl font-black">{seleccionado.name}</h2>
          </div>
        </div>

        {/* Patient card */}
        <div style={{ background: 'linear-gradient(135deg, #0d1f35 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
          className="rounded-2xl p-6 flex flex-col sm:flex-row gap-5">
          <div style={{ background: grad }} className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
            {seleccionado.name?.[0]?.toUpperCase()}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
            {[
              { label: 'Edad', value: calcularEdad(seleccionado.birth_date) },
              { label: 'Diagnóstico', value: seleccionado.diagnosis || 'No registrado' },
              { label: 'Tutor', value: seleccionado.profiles?.full_name || '—' },
              { label: 'Contacto', value: seleccionado.profiles?.email || '—' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ color: '#334155' }} className="text-xs font-bold uppercase tracking-wide mb-1">{item.label}</p>
                <p style={{ color: '#94a3b8' }} className="text-sm font-medium truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }} className="rounded-2xl overflow-hidden">
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            className="px-5 py-4 flex items-center gap-3">
            <div style={{ background: '#06b6d420', color: '#06b6d4' }}
              className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Activity size={14} />
            </div>
            <h3 style={{ color: '#e2e8f0' }} className="font-bold text-sm">Historial de Sesiones</h3>
            <span style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          {loadingHistorial ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} style={{ color: '#06b6d4' }} className="animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={28} style={{ color: '#1e293b' }} className="mx-auto mb-3" />
              <p style={{ color: '#334155' }} className="text-sm font-semibold">Sin sesiones registradas</p>
            </div>
          ) : (
            <div>
              {historial.map((h, idx) => (
                <div key={h.id}
                  style={{ borderBottom: idx < historial.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ background: '#06b6d420' }} className="w-1.5 h-1.5 rounded-full" style2={{ background: '#06b6d4' }} />
                    <span style={{ background: '#06b6d4' }} className="w-1.5 h-1.5 rounded-full inline-block" />
                    <p style={{ color: '#475569' }} className="text-xs font-bold">
                      {new Date(h.fecha_sesion).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                    </p>
                  </div>
                  {h.datos?.conducta && (
                    <p style={{ color: '#94a3b8' }} className="text-sm leading-relaxed">
                      <span style={{ color: '#64748b' }} className="font-semibold">Conducta: </span>{h.datos.conducta}
                    </p>
                  )}
                  {h.datos?.observations && (
                    <p style={{ color: '#64748b' }} className="text-xs mt-1 leading-relaxed">{h.datos.observations}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }} className="text-2xl font-black">Pacientes</h2>
          <p style={{ color: '#475569' }} className="text-sm mt-1">Vista de consulta · Solo lectura</p>
        </div>
        <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b' }}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
          <AlertCircle size={11} /> Consulta
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} style={{ color: '#334155' }} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar paciente o diagnóstico..."
          style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all placeholder:text-slate-600" />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={{ color: '#475569' }}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }}
          className="rounded-xl px-4 py-3 flex items-center gap-3">
          <Baby size={14} style={{ color: '#8b5cf6' }} />
          <p style={{ color: '#64748b' }} className="text-xs font-semibold">
            <span style={{ color: '#e2e8f0' }} className="font-black">{filtrados.length}</span> paciente{filtrados.length !== 1 ? 's' : ''}
            {busqueda && <span> · filtrando por "{busqueda}"</span>}
          </p>
        </div>
      )}

      {/* Grid de pacientes */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} style={{ color: '#06b6d4' }} className="animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((n, idx) => {
            const grad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
            return (
              <div key={n.id}
                style={{ background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.05)' }}
                className="rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.02] transition-all group">
                <div style={{ background: grad }} className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg">
                  {n.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#e2e8f0' }} className="font-bold text-sm">{n.name}</p>
                  <p style={{ color: '#475569' }} className="text-xs mt-0.5">{calcularEdad(n.birth_date)} · {n.diagnosis || 'Sin diagnóstico'}</p>
                  <p style={{ color: '#334155' }} className="text-xs truncate">{n.profiles?.full_name || 'Sin tutor'}</p>
                </div>
                <button onClick={() => verHistorial(n)}
                  style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-cyan-500/20 transition-colors flex-shrink-0">
                  <Eye size={13} /> Ver
                </button>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="text-center py-16">
              <Baby size={32} style={{ color: '#1e293b' }} className="mx-auto mb-3" />
              <p style={{ color: '#334155' }} className="text-sm font-semibold">Sin resultados</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
