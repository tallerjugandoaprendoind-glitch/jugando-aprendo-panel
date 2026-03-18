'use client'

import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X, Loader2,
  Clock, User, Users, MapPin, Video, CheckCircle2, Trash2,
  Edit2, RefreshCw, Search, Filter, AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmed: { label: 'Confirmada',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  pending:   { label: 'Pendiente',   color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-400' },
  cancelled: { label: 'Cancelada',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         dot: 'bg-red-400' },
  completed: { label: 'Completada',  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500' },
}

const SERVICES = [
  'Terapia ABA','Evaluación Inicial','Seguimiento BRIEF-2','Evaluación ADOS-2',
  'Evaluación Vineland-3','Evaluación WISC-V','Evaluación BASC-3',
  'Sesión Familiar','Sesión de Orientación','Visita Domiciliaria'
]

export default function SecretariaAgenda() {
  const toast = useToast()
  const { t } = useI18n()
  const [mes, setMes] = useState<Date>(new Date())
  const [apts, setApts] = useState<any[]>([])
  const [ninos, setNinos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingApt, setEditingApt] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [searchText, setSearchText] = useState('')

  const emptyForm = {
    child_id: '', service: SERVICES[0], date: '', time: '',
    status: 'confirmed', notes: '', modality: 'presencial',
    session_type: 'individual'
  }
  const [form, setForm] = useState(emptyForm)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: aptsData }, { data: ninosData }] = await Promise.all([
        supabase.from('appointments')
          .select('*, children(name, profiles!children_parent_id_fkey(full_name, phone))')
          .order('appointment_date').order('appointment_time'),
        supabase.from('children').select('id, name').eq('is_active', true).order('name')
      ])
      setApts(aptsData || [])
      setNinos(ninosData || [])
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Calendar grid
  const year = mes.getFullYear()
  const month = mes.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getDayApts = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return apts.filter(a => a.appointment_date === dateStr)
  }

  const selectedApts = diaSeleccionado
    ? apts.filter(a => a.appointment_date === diaSeleccionado
        && (filterStatus === 'todos' || a.status === filterStatus)
        && (searchText === '' || a.children?.name?.toLowerCase().includes(searchText.toLowerCase()))
      )
    : []

  const handleSave = async () => {
    if (!form.child_id || !form.date || !form.time) {
      toast.warning('Paciente, fecha y hora son obligatorios')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        child_id: form.child_id, appointment_date: form.date,
        appointment_time: form.time + ':00', service_type: form.service,
        status: form.status, notes: form.notes, modalidad: form.modality,
        session_type: form.session_type, is_group: form.session_type === 'grupal'
      }
      if (editingApt) {
        const { error } = await supabase.from('appointments').update(payload).eq('id', editingApt.id)
        if (error) throw error
        toast.success('✅ Cita actualizada')
      } else {
        const { error } = await supabase.from('appointments').insert(payload)
        if (error) throw error
        toast.success('✅ Cita creada')
      }
      setShowForm(false); setEditingApt(null); setForm(emptyForm)
      cargar()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Confirmar eliminación de esta cita?')) return
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
      toast.success('Cita eliminada')
      cargar()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
      toast.success('Estado actualizado')
      cargar()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const openEdit = (apt: any) => {
    setForm({
      child_id: apt.child_id, service: apt.service_type || SERVICES[0],
      date: apt.appointment_date, time: apt.appointment_time?.slice(0, 5) || '',
      status: apt.status, notes: apt.notes || '', modality: apt.modalidad || 'presencial',
      session_type: apt.session_type || 'individual'
    })
    setEditingApt(apt)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Agenda de Citas</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gestión completa del calendario del centro</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingApt(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-violet-200"
        >
          <Plus size={16} /> Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={() => setMes(new Date(year, month - 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-black text-sm text-slate-800">{MESES[month]} {year}</h3>
            <button onClick={() => setMes(new Date(year, month + 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="p-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS.map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayApts = getDayApts(day)
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                const isSelected = diaSeleccionado === dateStr
                const hasPending = dayApts.some(a => a.status === 'pending')

                return (
                  <button
                    key={day}
                    onClick={() => setDiaSeleccionado(isSelected ? null : dateStr)}
                    className={`relative flex flex-col items-center justify-start pt-1 h-10 rounded-xl text-sm font-bold transition-all
                      ${isSelected ? 'bg-violet-600 text-white shadow-md' :
                        isToday ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        dayApts.length > 0 ? 'hover:bg-violet-50 text-slate-700' :
                        'hover:bg-slate-50 text-slate-500'}`}
                  >
                    {day}
                    {dayApts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayApts.slice(0, 3).map((a, idx) => (
                          <div
                            key={idx}
                            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : hasPending && a.status === 'pending' ? 'bg-amber-400' : 'bg-violet-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4">
            {loading ? (
              <Loader2 size={14} className="animate-spin text-violet-400" />
            ) : (
              <span className="text-xs text-slate-400">{apts.length} citas totales</span>
            )}
            <button onClick={cargar} className="ml-auto text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1">
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
        </div>

        {/* Day detail */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!diaSeleccionado ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
              <Calendar size={40} className="mb-3" />
              <p className="text-sm font-semibold">Seleccioná un día en el calendario</p>
            </div>
          ) : (
            <>
              {/* Day header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-800">
                    {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <button
                    onClick={() => { setForm({ ...emptyForm, date: diaSeleccionado }); setEditingApt(null); setShowForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchText} onChange={e => setSearchText(e.target.value)}
                      placeholder="Buscar paciente..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-violet-400"
                    />
                  </div>
                  <select
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-violet-400"
                  >
                    <option value="todos">Todos</option>
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Appointments list */}
              <div className="divide-y divide-slate-50 overflow-y-auto" style={{ maxHeight: 440 }}>
                {selectedApts.length === 0 ? (
                  <div className="py-12 text-center text-slate-300">
                    <AlertTriangle size={28} className="mx-auto mb-2" />
                    <p className="text-sm">No hay citas para este día</p>
                    <button
                      onClick={() => { setForm({ ...emptyForm, date: diaSeleccionado }); setShowForm(true) }}
                      className="mt-3 text-xs font-bold text-violet-600 hover:underline"
                    >+ Crear cita para este día</button>
                  </div>
                ) : selectedApts.map(apt => {
                  const cfg = STATUS_CFG[apt.status] || STATUS_CFG.pending
                  return (
                    <div key={apt.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            {apt.session_type === 'grupal' ? <Users size={16} className="text-violet-600" /> : <User size={16} className="text-violet-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-slate-800 truncate">{apt.children?.name || '—'}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {apt.appointment_time?.slice(0, 5)}
                              </span>
                              {apt.modalidad === 'virtual' ? (
                                <span className="text-xs text-indigo-500 flex items-center gap-0.5"><Video size={10} /> Virtual</span>
                              ) : (
                                <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin size={10} /> Presencial</span>
                              )}
                              {apt.service_type && <span className="text-xs text-slate-400 truncate">· {apt.service_type}</span>}
                            </div>
                            {apt.notes && <p className="text-xs text-slate-400 mt-1 truncate">{apt.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <button onClick={() => openEdit(apt)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(apt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {/* Quick status change */}
                      <div className="mt-2 flex items-center gap-1 ml-12">
                        <span className="text-[10px] text-slate-400 mr-1">Cambiar estado:</span>
                        {Object.entries(STATUS_CFG).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => handleStatusChange(apt.id, k)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border ${apt.status === k ? `${v.bg} ${v.color}` : 'border-transparent text-slate-400 hover:bg-slate-100'}`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-purple-600">
              <h3 className="font-black text-white">{editingApt ? 'Editar Cita' : 'Nueva Cita'}</h3>
              <button onClick={() => { setShowForm(false); setEditingApt(null) }} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

              {/* Session type */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Tipo de sesión</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v:'individual', label:'👤 Individual' }, { v:'grupal', label:'👥 Grupal' }].map(opt => (
                    <button key={opt.v} onClick={() => setForm(p => ({ ...p, session_type: opt.v }))}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${form.session_type === opt.v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modality */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Modalidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v:'presencial', label:'📍 Presencial' }, { v:'virtual', label:'📹 Virtual' }].map(opt => (
                    <button key={opt.v} onClick={() => setForm(p => ({ ...p, modality: opt.v }))}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${form.modality === opt.v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Paciente *</label>
                <select
                  value={form.child_id}
                  onChange={e => setForm(p => ({ ...p, child_id: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50"
                >
                  <option value="">Seleccionar paciente...</option>
                  {ninos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Servicio</label>
                <select
                  value={form.service}
                  onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50"
                >
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Fecha *</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Hora *</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm font-bold focus:border-violet-400 focus:outline-none bg-slate-50"
                >
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Notas (opcional)</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Observaciones sobre la cita..."
                  className="w-full p-3 rounded-xl border-2 border-slate-200 text-sm focus:border-violet-400 focus:outline-none bg-slate-50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => { setShowForm(false); setEditingApt(null) }}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-2 flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-200">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isSaving ? 'Guardando...' : (editingApt ? 'Actualizar Cita' : 'Confirmar Cita')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
