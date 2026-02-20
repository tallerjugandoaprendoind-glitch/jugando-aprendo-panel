'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, User, ChevronRight, Baby, Calendar, Loader2,
  Eye, FileText, Activity, X, Clock, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function calcularEdad(fecha: string) {
  if (!fecha) return 'N/D'
  const hoy = new Date()
  const nacimiento = new Date(fecha)
  const anos = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) return `${anos - 1} años`
  return `${anos} años`
}

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
      const { data, error } = await supabase
        .from('children')
        .select('*, profiles!children_parent_id_fkey(full_name, email)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setNinos(data || [])
    } catch (e: any) {
      toast.error('Error cargando pacientes: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const verHistorial = async (nino: any) => {
    setSeleccionado(nino)
    setLoadingHistorial(true)
    try {
      const { data } = await supabase
        .from('session_records')
        .select('*')
        .eq('child_id', nino.id)
        .order('fecha_sesion', { ascending: false })
        .limit(10)
      setHistorial(data || [])
    } catch {
      setHistorial([])
    } finally {
      setLoadingHistorial(false)
    }
  }

  useEffect(() => { cargar() }, [cargar])

  const filtrados = ninos.filter(n =>
    n.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.diagnosis?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (seleccionado) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSeleccionado(null)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <ChevronRight size={16} className="rotate-180" /> Volver
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{seleccionado.name}</h2>
        </div>

        {/* Info del paciente */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Edad</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{calcularEdad(seleccionado.birth_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Diagnóstico</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{seleccionado.diagnosis || 'No registrado'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tutor</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{seleccionado.profiles?.full_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Contacto</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{seleccionado.profiles?.email || '—'}</p>
          </div>
        </div>

        {/* Historial de sesiones (solo lectura) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Historial de Sesiones</h3>
            <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Solo lectura</span>
          </div>
          {loadingHistorial ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          ) : historial.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin sesiones registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {historial.map(h => (
                <div key={h.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={13} className="text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(h.fecha_sesion).toLocaleDateString('es-MX', { dateStyle: 'long' })}</span>
                  </div>
                  {h.datos?.conducta && <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-medium">Conducta:</span> {h.datos.conducta}</p>}
                  {h.datos?.observations && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{h.datos.observations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mis Pacientes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Vista de consulta • Solo lectura</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full">
          <AlertCircle size={12} /> Acceso de consulta
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o diagnóstico..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(n => (
            <div key={n.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {n.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{n.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{calcularEdad(n.birth_date)} • {n.diagnosis || 'Sin diagnóstico'}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{n.profiles?.full_name || 'Sin tutor'}</p>
              </div>
              <button onClick={() => verHistorial(n)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors">
                <Eye size={14} /> Ver
              </button>
            </div>
          ))}
          {filtrados.length === 0 && !loading && (
            <div className="text-center py-16 text-slate-400">
              <Baby size={36} className="mx-auto mb-2 opacity-30" />
              <p>No se encontraron pacientes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
