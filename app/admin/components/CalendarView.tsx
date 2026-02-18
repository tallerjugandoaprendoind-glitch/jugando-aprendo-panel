'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, User, Plus, X, Loader2,
  CheckCircle2, Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function MonthlyCalendarView() {
    const [apts, setApts] = useState<any[]>([])
    const [ninos, setNinos] = useState<any[]>([])
    const [show, setShow] = useState(false)
    const [tipoSesion, setTipoSesion] = useState<'individual' | 'grupal'>('individual')
    const [newApt, setNewApt] = useState({ 
        child_id: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '09:00', 
        service: 'Terapia ABA',
        is_group: false,
        group_name: '',
        participants: [] as string[]
    });
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

    useEffect(() => { 
        cargarCitas()
        supabase.from('children').select('id, name').then(({data})=>data&&setNinos(data));
    }, [])

    const cargarCitas = async () => {
        const { data } = await supabase
            .from('appointments')
            .select('*, children(name)')
        if (data) setApts(data)
    }

    const eliminarCita = async (id: string, e: any) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar esta cita?")) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);
            if (error) throw error;

            alert("🗑️ Cita eliminada");
            cargarCitas();
        } catch (error: any) {
            alert("❌ Error: " + error.message);
        }
    }
    
    const handleSave = async () => {
        if (tipoSesion === 'individual' && !newApt.child_id) {
            return alert("Selecciona un paciente")
        }
        
        if (tipoSesion === 'grupal' && selectedParticipants.length === 0) {
            return alert("Selecciona al menos un participante")
        }

        if (tipoSesion === 'grupal') {
            const citas = selectedParticipants.map(childId => ({
                child_id: childId,
                appointment_date: newApt.date,
                appointment_time: newApt.time,
                service_type: `${newApt.service} (Grupal: ${newApt.group_name || 'Sin nombre'})`,
                is_group: true,
                group_name: newApt.group_name
            }))

            const { error } = await supabase.from('appointments').insert(citas)
            if (!error) {
                alert(`✅ Sesión grupal agendada`)
                resetForm()
                cargarCitas()
            } else {
                alert("Error: " + error.message)
            }
        } else {
            const { error } = await supabase.from('appointments').insert([{
                child_id: newApt.child_id,
                appointment_date: newApt.date,
                appointment_time: newApt.time,
                service_type: newApt.service,
                is_group: false
             }])
            
            if (!error) {
                alert("✅ Cita agendada")
                resetForm()
                cargarCitas()
            } else {
               alert("Error: " + error.message)
            }
        }
    }

    const resetForm = () => {
        setShow(false)
        setTipoSesion('individual')
        setNewApt({ 
            child_id: '', 
            date: new Date().toISOString().split('T')[0], 
            time: '09:00', 
            service: 'Terapia ABA',
            is_group: false,
            group_name: '',
            participants: []
        })
        setSelectedParticipants([])
    }

    const toggleParticipant = (childId: string) => {
        if (selectedParticipants.includes(childId)) {
            setSelectedParticipants(selectedParticipants.filter(id => id !== childId))
        } else {
            setSelectedParticipants([...selectedParticipants, childId])
        }
    }

    return (
        <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-200 h-full flex flex-col animate-fade-in-up overflow-hidden">
            <div className="p-6 md:p-8 lg:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-10 bg-white gap-4">
                <div>
                    <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tighter flex items-center gap-3">
                        <Calendar className="text-blue-600" size={32}/>
                        Calendario de Citas
                    </h2>
                    <p className="text-slate-400 text-xs md:text-sm font-bold mt-1">
                        {apts.length} citas programadas
                    </p>
                </div>
                <button 
                    onClick={()=>setShow(true)} 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-200 transition-all flex items-center gap-2 w-full md:w-auto justify-center"
                >
                    <Plus size={18} className="md:w-5 md:h-5"/> 
                    Nueva Cita
                </button>
            </div>
            
            <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {apts.map(a => (
                        <div key={a.id} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all group relative">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <span className={`text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest ${
                                    a.is_group 
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                 {a.is_group ? '👥 Grupal' : a.service_type || 'Sesión'}
                                </span>
                                
                                <button 
                                    onClick={(e) => eliminarCita(a.id, e)}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                >
                                     <Trash2 size={18}/>
                                </button>
                            </div>
                            
                            <h4 className="font-black text-lg md:text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors mb-2">
                                {a.children?.name || 'Paciente'}
                            </h4>
                            
                            {a.group_name && (
                                <p className="text-xs text-purple-600 font-bold mb-3 bg-purple-50 px-2 py-1 rounded-lg inline-block">
                                    {a.group_name}
                                </p>
                            )}
                            
                            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-50 flex items-center gap-2 md:gap-3 text-slate-400 font-bold text-[10px] md:text-xs uppercase">
                                <Clock size={16}/>
                                <span>{a.appointment_date} • {a.appointment_time?.slice(0,5)}</span>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={()=>setShow(true)} 
                        className="border-4 border-dashed border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all h-[200px] md:h-[240px]"
                    >
                        <Plus size={32} className="md:w-10 md:h-10 mb-3 md:mb-4"/>
                        <span className="font-black text-xs md:text-sm uppercase tracking-widest">Agendar</span>
                    </button>
                </div>
            </div>

            {show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-6">
                    <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 md:mb-10">
                            <h3 className="font-black text-xl md:text-2xl text-slate-800">Nueva Cita</h3>
                            <button onClick={resetForm} className="p-2 rounded-full hover:bg-slate-100">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                    Tipo de Sesión
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {setTipoSesion('individual'); setSelectedParticipants([])}}
                                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                                            tipoSesion === 'individual' 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        👤 Individual
                                    </button>
                                    <button
                                        onClick={() => {setTipoSesion('grupal'); setNewApt({...newApt, child_id: ''})}}
                                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                                            tipoSesion === 'grupal' 
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                        }`}
                                    >
                                        👥 Grupal
                                    </button>
                                </div>
                            </div>

                            {tipoSesion === 'individual' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Paciente
                                    </label>
                                    <select 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all" 
                                        onChange={e=>setNewApt({...newApt, child_id: e.target.value})}
                                        value={newApt.child_id}
                                    >
                                        <option value="">Buscar...</option>
                                        {ninos.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {tipoSesion === 'grupal' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                                Nombre del Grupo
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Grupo habilidades sociales"
                                            className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all"
                                            onChange={e=>setNewApt({...newApt, group_name: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                            Participantes ({selectedParticipants.length})
                                        </label>
                                        <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                                            <div className="space-y-2">
                                                {ninos.map(n => (
                                                    <label 
                                                        key={n.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                                            selectedParticipants.includes(n.id) 
                                                            ? 'bg-purple-600 text-white shadow-md' 
                                                            : 'bg-white hover:bg-purple-50 border border-slate-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={selectedParticipants.includes(n.id)}
                                                            onChange={() => toggleParticipant(n.id)}
                                                        />
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                                                            selectedParticipants.includes(n.id) 
                                                                ? 'bg-white border-white' 
                                                                : 'border-slate-300'
                                                        }`}>
                                                            {selectedParticipants.includes(n.id) && (
                                                                <CheckCircle2 size={14} className="text-purple-600"/>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-sm">{n.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Fecha
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                                        value={newApt.date}
                                        onChange={e=>setNewApt({...newApt, date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                                        Hora
                                    </label>
                                    <input 
                                        type="time" 
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                                        value={newApt.time}
                                        onChange={e=>setNewApt({...newApt, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button 
                                    onClick={resetForm} 
                                    className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className={`flex-[2] p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                                        tipoSesion === 'individual' 
                                            ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' 
                                            : 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
                                    }`}
                                >
                                    {tipoSesion === 'individual' ? 'Agendar' : `Agendar Grupal`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


export default MonthlyCalendarView
