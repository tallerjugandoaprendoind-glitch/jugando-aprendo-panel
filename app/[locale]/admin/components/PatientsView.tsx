'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect } from 'react'
import {
  Activity, Baby, Calendar, ChevronRight, ClipboardList, Clock, Edit, Eye, FileText, Heart, Key, Loader2, Mail, Phone, Plus, Save, Search, Stethoscope, Ticket, Trash2, User, UserPlus, Users, X, Brain, Sparkles, BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { InfoRow } from './shared'
import { calcularEdad } from '../utils/helpers'
import ProgramasABAView from './ProgramasABAView'
import ARIAAgentChat from './ARIAAgentChat'


// ── {t('pacientes.historiaEvaluaciones')} del paciente (mini view dentro de ficha) ────────
function EvaluacionesHistorialPaciente({ childId, childName }: { childId: string; childName: string }) {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const [evaluaciones, setEvaluaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      try {
        // Cargar desde múltiples tablas de evaluaciones
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const [r1, r2, r3, r4] = await Promise.all([
          sb.from('form_responses').select('id, form_title, form_type, ai_analysis, created_at').eq('child_id', childId).order('created_at', { ascending: false }).limit(15),
          sb.from('anamnesis_completa').select('id, form_title, created_at').eq('child_id', childId).order('created_at', { ascending: false }).limit(5),
          sb.from('registro_aba').select('id, form_title, fecha_sesion, created_at').eq('child_id', childId).order('fecha_sesion', { ascending: false }).limit(5),
          sb.from('registro_entorno_hogar').select('id, form_title, created_at').eq('child_id', childId).order('created_at', { ascending: false }).limit(5),
        ])
        const all = [
          ...(r1.data || []).map((e: any) => ({ ...e, tipo: e.form_type || 'evaluacion', fuente: '📋' })),
          ...(r2.data || []).map((e: any) => ({ ...e, form_title: e.form_title || (isEN?'Anamnesis':'Anamnesis'), tipo: 'anamnesis', fuente: '📄' })),
          ...(r3.data || []).map((e: any) => ({ ...e, created_at: e.fecha_sesion || e.created_at, form_title: e.form_title || (isEN?'ABA Session':'Sesión ABA'), tipo: 'aba', fuente: '🎯' })),
          ...(r4.data || []).map((e: any) => ({ ...e, form_title: e.form_title || (isEN?'Home Environment':'Entorno Hogar'), tipo: 'entorno', fuente: '🏠' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setEvaluaciones(all)
      } catch {}
      setLoading(false)
    }
    cargar()
  }, [childId])

  if (loading) return <div className="flex items-center gap-2 py-8 justify-center text-slate-400" style={{ color: "var(--text-muted)" }}><Loader2 className="animate-spin" size={20}/> {t('pacientes.cargandoHist')}</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('pacientes.historiaEvaluaciones')} · {childName}</p>
        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-500" style={{ color: "var(--text-muted)" }}>{evaluaciones.length} registros</span>
      </div>
      {evaluaciones.length === 0 ? (
        <div className="py-8 text-center">
          <ClipboardList className="mx-auto text-slate-200 mb-2" size={36}/>
          <p className="text-slate-400 text-sm font-bold">{t('ui.no_evaluations')}</p>
          <p className="text-slate-300 text-xs mt-1">{t('pacientes.evalsAparecen')}</p>
        </div>
      ) : evaluaciones.map((ev, i) => (
        <div key={ev.id || i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-3">
          <span className="text-lg">{ev.fuente}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-700 text-sm truncate">{ev.form_title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ev.tipo} · {new Date(ev.created_at).toLocaleDateString(toBCP47(locale), { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            {ev.ai_analysis && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{typeof ev.ai_analysis === 'string' ? ev.ai_analysis.slice(0, 120) + '...' : ''}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

function PatientsView() {
    const { t, locale } = useI18n()
    const isEN = locale === 'en'
    const [listaNinos, setListaNinos] = useState<any[]>([])
    const [listaNinosFiltrada, setListaNinosFiltrada] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDiagnosis, setFilterDiagnosis] = useState('todos')
    const [sortBy, setSortBy] = useState('nombre')
    const [ultimasSesiones, setUltimasSesiones] = useState<Record<string, string>>({})
    const [patientTab, setPatientTab] = useState<'info' | 'programas' | 'vadi' | 'evaluaciones'>('info')

    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [showPatientModal, setShowPatientModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [editForm, setEditForm] = useState({
        name: '',
        birth_date: '',
        diagnosis: '',
        age: 0
    })

    useEffect(() => { 
        cargarPacientes()
    }, [])

    const cargarPacientes = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('children')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (data) {
            setListaNinos(data)
            setListaNinosFiltrada(data)
            // Cargar última sesión de cada paciente
            const { data: sesiones } = await supabase
                .from('aba_sessions_v2')
                .select('child_id, session_date')
                .order('session_date', { ascending: false })
            if (sesiones) {
                const map: Record<string, string> = {}
                sesiones.forEach((s: any) => {
                    if (!map[s.child_id]) map[s.child_id] = s.session_date
                })
                setUltimasSesiones(map)
            }
        }
        setIsLoading(false)
    }

    // Calcula días desde última sesión
    const diasSinSesion = (childId: string): number | null => {
        const fecha = ultimasSesiones[childId]
        if (!fecha) return null
        const diff = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24)
        return Math.floor(diff)
    }

    const alertaColor = (dias: number | null) => {
        if (dias === null) return { bg: 'bg-slate-100', text: 'text-slate-500', label: t('pacientes.sinSesiones') }
        if (dias <= 14) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: isEN?`${dias}d ago`:`Hace ${dias}d` }
        if (dias <= 30) return { bg: 'bg-amber-100', text: 'text-amber-700', label: isEN?`${dias}d ago ⚠️`:`Hace ${dias}d ⚠️` }
        return { bg: 'bg-red-100', text: 'text-red-700', label: isEN?`${dias}d ago 🚨`:`Hace ${dias}d 🚨` }
    }

    const calcularEdadDesdeString = (birthDate: string): number => {
        if (!birthDate) return 0
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age > 0 ? age : 0
    }

    const handleBirthDateChange = (newBirthDate: string) => {
        const edad = calcularEdadDesdeString(newBirthDate)
        setEditForm({
            ...editForm, 
            birth_date: newBirthDate,
            age: edad
        })
    }

    useEffect(() => {
        let resultado = [...listaNinos]
        if (searchTerm) {
            resultado = resultado.filter(nino => nino.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }
        if (filterDiagnosis !== 'todos') {
            resultado = resultado.filter(nino => nino.diagnosis === filterDiagnosis)
        }
        resultado.sort((a, b) => {
            if (sortBy === 'nombre') return a.name.localeCompare(b.name)
            if (sortBy === 'edad') return (b.age || 0) - (a.age || 0)
            if (sortBy === 'reciente') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return 0
        })
        setListaNinosFiltrada(resultado)
    }, [searchTerm, filterDiagnosis, sortBy, listaNinos])

    const diagnosticosUnicos = ['todos', ...new Set(listaNinos.map(n => n.diagnosis).filter(Boolean))]

    const verDetallePaciente = (paciente: any) => {
        setSelectedPatient(paciente)
        setIsEditing(false)
        setShowPatientModal(true)
    }

    const activarEdicion = () => {
        const edad = calcularEdadDesdeString(selectedPatient.birth_date)
        setEditForm({
            name: selectedPatient.name || '',
            birth_date: selectedPatient.birth_date || '',
            diagnosis: selectedPatient.diagnosis || '',
            age: edad
        })
        setIsEditing(true)
    }

    const guardarCambios = async () => {
        if (!editForm.name.trim()) return alert("❌ Nombre obligatorio");
        if (!editForm.birth_date) return alert("❌ Fecha obligatoria");

        setIsSaving(true);

        try {
            const fechaNac = new Date(editForm.birth_date);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const m = hoy.getMonth() - fechaNac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            edad = Math.max(0, edad);
            const { data, error } = await supabase
                .from('children')
                .update({
                    name: editForm.name.trim(),
                    birth_date: editForm.birth_date,
                    age: edad,
                    diagnosis: editForm.diagnosis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPatient.id)
                .select();
            if (error) {
                alert(`❌ ERROR: ${error.message}`);
            } else if (!data || data.length === 0) {
                alert("⚠️ No se actualizó ningún registro. Verifica los permisos.");
            } else {
                alert(isEN ? `✅ Saved successfully. Age: ${edad} years.` : `✅ Guardado correctamente. Edad: ${edad} años.`);
                await cargarPacientes();
                setIsEditing(false);
                setShowPatientModal(false);
            }

        } catch (e: any) {
            alert("❌ Error: " + e.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="rounded-3xl md:rounded-[2.5rem] shadow-sm overflow-hidden h-full flex flex-col animate-fade-in-up" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="p-4 md:p-6 lg:p-8 border-b sticky top-0 z-10 space-y-4" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-xl md:text-2xl text-slate-800 flex items-center gap-3">
                            <Users className="text-blue-600" size={28}/> {isEN ? 'Patient Directory' : 'Directorio de Pacientes'}
                        </h3>
                        <p className="text-slate-400 text-xs md:text-sm mt-1">{listaNinosFiltrada.length} {isEN ? "of" : "de"} {listaNinos.length} {isEN ? "patients" : "pacientes"}</p>
                    </div>
                    <button onClick={cargarPacientes} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-600 transition-all flex items-center gap-2">
                        <Activity size={16}/> {isEN ? "Refresh" : "Actualizar"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input type="text" {...{placeholder: t('ui.search_patient')}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"/>
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"><X size={16} className="text-slate-400"/></button>}
                    </div>
                    <div className="md:col-span-4">
                        <select value={filterDiagnosis} onChange={(e) => setFilterDiagnosis(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white transition-all font-bold text-slate-700" style={{ color: "var(--text-secondary)" }}>
                            {diagnosticosUnicos.map(diag => <option key={diag} value={diag}>{diag === 'todos' ? '🔍 Todos' : `📋 ${diag}`}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:bg-white transition-all font-bold text-slate-700" style={{ color: "var(--text-secondary)" }}>
                            <option value="nombre">{t('pacientes.porNombre2')}</option>
                            <option value="edad">{t('pacientes.porEdad')}</option>
                            <option value="reciente">{t('ui.most_recent')}</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={48} /><p className="text-slate-400 font-bold">{t('common.cargando')}</p></div>
                ) : listaNinosFiltrada.length === 0 ? (
                    <div className="p-20 text-center"><Users className="mx-auto text-slate-200 mb-4" size={64}/><p className="text-slate-400 font-bold text-lg">{t('ui.no_patients')}</p></div>
                ) : (
                    <>
                        <div className="md:hidden p-4 space-y-3">
                            {listaNinosFiltrada.map((nino) => (
                                <div key={nino.id} onClick={() => verDetallePaciente(nino)} className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">{nino.name.charAt(0)}</div>
                                        <div className="flex-1"><h4 className="font-black text-slate-800 text-base">{nino.name}</h4></div>
                                        <ChevronRight size={20} className="text-slate-300"/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs border border-purple-100">{(nino.diagnosis === 'En evaluación' ? t('pacientes.enEvaluacion') : nino.diagnosis) || t('pacientes.enEvaluacion')}</span>
                                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-black text-xs">
                                            {nino.age ? `${nino.age}a` : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-4 lg:p-6 lg:pl-10">{t('agenda.paciente')}</th>
                                    <th className="p-4 lg:p-6">{t('common.anos')}</th>
                                    <th className="p-4 lg:p-6">{t('pacientes.diagnostico')}</th>
                                    <th className="p-4 lg:p-6">{t('pacientes.ultimaSesion')}</th>
                                    <th className="p-4 lg:p-6 text-right lg:pr-10">{t('common.acciones')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {listaNinosFiltrada.map((nino) => (
                                    <tr key={nino.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="p-4 lg:p-6 lg:pl-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-md">{nino.name.charAt(0)}</div>
                                                <span className="font-black text-slate-700 text-base">{nino.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 lg:p-6">
                                            <span className="font-black text-slate-700" style={{ color: "var(--text-secondary)" }}>
                                                {nino.age ? isEN ? `${nino.age} years` : `${nino.age} años` : "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-4 lg:p-6"><span className="px-4 py-2 rounded-xl text-xs font-black bg-purple-50 text-purple-600 border border-purple-100 inline-block">{(nino.diagnosis === 'En evaluación' ? t('pacientes.enEvaluacion') : nino.diagnosis) || t('pacientes.enEvaluacion')}</span></td>
                                        <td className="p-4 lg:p-6">
                                            {(() => {
                                                const dias = diasSinSesion(nino.id)
                                                const cfg = alertaColor(dias)
                                                return (
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${cfg.bg} ${cfg.text} inline-block`}>
                                                        {cfg.label}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="p-4 lg:p-6 text-right lg:pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                              <button onClick={() => { verDetallePaciente(nino); setPatientTab('programas') }} className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"><BarChart3 size={13}/> Programas</button>
                                              <button onClick={() => verDetallePaciente(nino)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg"><Eye size={14}/> Ver</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {showPatientModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-scale-in" style={{ background: "var(--card)" }}>
                        <div className={`p-6 text-white transition-colors ${isEditing ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black backdrop-blur-sm">
                                        {isEditing ? <Edit size={32}/> : selectedPatient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black">{isEditing ? 'Editar Paciente' : selectedPatient.name}</h3>
                                        <p className="text-white/80 text-sm font-bold">{selectedPatient.diagnosis || "Diagnóstico pendiente"}</p>
                                        {!isEditing && selectedPatient.age && (
                                          <p className="text-white/60 text-xs mt-0.5">{selectedPatient.age} {isEN ? "years" : "años"}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isEditing && patientTab !== 'programas' && (
                                    <button
                                      onClick={() => setPatientTab('programas')}
                                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                      <Activity size={13}/> Ver programas
                                    </button>
                                  )}
                                  <button onClick={() => {setShowPatientModal(false); setIsEditing(false)}} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={24}/></button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Tabs */}
                            {!isEditing && (
                              <div className="flex gap-2 mb-4 border-b border-slate-100 pb-4">
                                {[
                                  { id: 'info', label: '📋 Info', icon: User },
                                  { id: 'programas', label: '📈 Programas ABA', icon: Activity },
                                  { id: 'evaluaciones', label: '📝 Evaluaciones', icon: ClipboardList },
                                  { id: 'vadi', label: '🤖 ARIA', icon: Brain },
                                ].map(tab => (
                                  <button key={tab.id} onClick={() => setPatientTab(tab.id as any)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                                      patientTab === tab.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}>
                                    {tab.label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!isEditing && patientTab === 'info' && (
                                <>
                                    <InfoRow label={t('pacientes.fechaNacimiento')} value={selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toLocaleDateString(toBCP47(locale)) : t('pacientes.noRegistrada')} icon={<Calendar size={16}/>}/>
                                    <InfoRow label="Edad" value={selectedPatient.age ? isEN ? `${selectedPatient.age} years` : `${selectedPatient.age} años` : "No disponible"} icon={<Baby size={16}/>}/>
                                    <InfoRow label={t('pacientes.diagnostico')} value={selectedPatient.diagnosis || t('pacientes.enEvaluacion')} icon={<Stethoscope size={16}/>}/>
                                </>
                            )}
                            {!isEditing && patientTab === 'programas' && (
                              <ProgramasABAView
                                childId={selectedPatient.id}
                                childName={selectedPatient.name}
                              />
                            )}
                            {!isEditing && patientTab === 'evaluaciones' && (
                              <EvaluacionesHistorialPaciente childId={selectedPatient.id} childName={selectedPatient.name} />
                            )}
                            {!isEditing && patientTab === 'vadi' && (
                              <ARIAAgentChat
                                userId={selectedPatient.id}
                                childId={selectedPatient.id}
                                childName={selectedPatient.name}
                                contexto="paciente"
                                compact
                              />
                            )}
                            {isEditing && (
                                <div className="space-y-4 animate-fade-in">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('pacientes.nombreCompleto')}</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('pacientes.fechaNacimiento2')}</label>
                                            <input 
                                                type="date" 
                                                value={editForm.birth_date} 
                                                onChange={e => handleBirthDateChange(e.target.value)} 
                                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Edad (auto)</label>
                                            <div className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl font-black text-green-700 flex items-center justify-center">
                                                {editForm.age > 0 ? isEN?`${editForm.age} years`:`${editForm.age} años` : isEN?'No age':'Sin edad'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('pacientes.diagnostico')}</label>
                                        <select 
                                            value={editForm.diagnosis} 
                                            onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                        >
                                            <option value="">{t('ui.select_option')}</option>
                                            {diagnosticosUnicos.filter(d => d !== 'todos').map(d => <option key={d} value={d}>{d}</option>)}
                                            <option value="TEA">TEA</option>
                                            <option value="TDAH">TDAH</option>
                                            <option value="Retraso del lenguaje">{t('ui.language_delay')}</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t flex gap-3" style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)" }}>
                            {!isEditing ? (
                                <>
                                    <button onClick={() => setShowPatientModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-80" style={{ background: "var(--muted-bg)", border: "2px solid var(--card-border)", color: "var(--text-primary)" }}>{t('common.cerrar')}</button>
                                    <button onClick={activarEdicion} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                        <Edit size={18}/> {t('common.editar')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-700 transition-all disabled:opacity-50">{t('common.cancelar')}</button>
                                    <button onClick={guardarCambios} disabled={isSaving} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        {isSaving?(isEN?'Saving...':'Guardando...'):(isEN?'Save':'Guardar')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientsView
