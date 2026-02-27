'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronRight, Baby, Loader2, Eye, FileText, Activity, AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function calcularEdad(fecha: string) {
  if (!fecha) return 'N/D'
  const hoy = new Date(), nac = new Date(fecha)
  const anos = hoy.getFullYear() - nac.getFullYear()
  return `${hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate()) ? anos - 1 : anos} años`
}

const AVATAR_COLORS = [
  'from-cyan-500 to-purple-600',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-red-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-amber-500',
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
      // Load from multiple sources for complete history
      const [abaRes, formRes, anamnesisRes, entornoRes] = await Promise.all([
        supabase.from('registro_aba').select('id, fecha_sesion, datos, form_title').eq('child_id', nino.id).order('fecha_sesion', { ascending: false }).limit(15),
        supabase.from('form_responses').select('id, form_type, form_title, created_at, ai_analysis').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(15),
        supabase.from('anamnesis_completa').select('id, fecha_creacion, datos, form_title').eq('child_id', nino.id).order('fecha_creacion', { ascending: false }).limit(1),
        supabase.from('registro_entorno_hogar').select('id, fecha_visita, datos, form_title').eq('child_id', nino.id).order('fecha_visita', { ascending: false }).limit(5),
      ])
      
      const combined: any[] = [
        ...(abaRes.data || []).map((r: any) => ({ ...r, _type: 'Sesión ABA', _date: r.fecha_sesion, _content: r.datos?.conducta || r.datos?.objetivo_principal || 'Sesión registrada' })),
        ...(anamnesisRes.data || []).map((r: any) => ({ ...r, _type: 'Anamnesis', _date: r.fecha_creacion?.split('T')[0], _content: r.datos?.motivo_principal || 'Historia clínica inicial' })),
        ...(entornoRes.data || []).map((r: any) => ({ ...r, _type: 'Visita Domiciliaria', _date: r.fecha_visita?.split('T')[0], _content: r.datos?.impresion_general || 'Visita al hogar' })),
        ...(formRes.data || []).map((r: any) => ({ ...r, _type: r.form_title || r.form_type, _date: r.created_at?.split('T')[0], _content: r.ai_analysis?.analisis_clinico?.slice?.(0, 100) || 'Formulario completado' })),
      ].sort((a, b) => (b._date || '').localeCompare(a._date || ''))
      
      setHistorial(combined.slice(0, 20))
    } catch { setHistorial([]) }
    finally { setLoadingHistorial(false) }
  }

  useEffect(() => { cargar() }, [cargar])

  const filtrados = ninos.filter(n =>
    n.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.diagnosis?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (seleccionado) {
    const colorClass = AVATAR_COLORS[seleccionado.name?.charCodeAt(0) % AVATAR_COLORS.length]
    return (
      <div className="space-y-5 pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSeleccionado(null)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Paciente</p>
            <h2 className="text-xl font-black text-slate-800">{seleccionado.name}</h2>
          </div>
        </div>

        {/* Patient card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row gap-5 shadow-sm">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg`}>
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity size={14} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Historial de Sesiones</h3>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          {loadingHistorial ? (
            <div className="flex justify-center py-12">
              <Loader2 size={20} className="animate-spin text-blue-600" />
            </div>
          ) : historial.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">Sin sesiones registradas</p>
            </div>
          ) : (
            <div>
              {historial.map((h, idx) => (
                <div key={h.id + idx} className={`px-5 py-4 ${idx < historial.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">{h._type || 'Registro'}</span>
                    <p className="text-xs font-bold text-slate-400">
                      {h._date ? new Date(h._date).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : ''}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {h._content || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Mis Pacientes</h2>
          <p className="text-sm text-slate-500 mt-1">Vista de consulta · Solo lectura</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex-shrink-0">
          <AlertCircle size={11} /> Consulta
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 flex items-center gap-3 px-4 py-3 shadow-sm">
        <Search size={15} className="text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o diagnóstico..."
          className="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-400" />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {!loading && (
        <div className="flex items-center gap-2 px-1">
          <Baby size={14} className="text-purple-500" />
          <p className="text-xs text-slate-500 font-semibold">
            <span className="font-black text-slate-800">{filtrados.length}</span> paciente{filtrados.length !== 1 ? 's' : ''}
            {busqueda && <span className="text-slate-400"> · "{busqueda}"</span>}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-2">
          {filtrados.map((n, idx) => {
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length]
            return (
              <div key={n.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all group shadow-sm">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow`}>
                  {n.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800">{n.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{calcularEdad(n.birth_date)} · {n.diagnosis || 'Sin diagnóstico'}</p>
                  <p className="text-xs text-slate-400 truncate">{n.profiles?.full_name || 'Sin tutor'}</p>
                </div>
                <button onClick={() => verHistorial(n)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Eye size={13} /> Ver
                </button>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Baby size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">Sin resultados</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
