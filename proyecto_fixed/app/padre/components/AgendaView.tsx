'use client'

import { useState } from 'react'
import {
  AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Phone, Sparkles, Ticket, Zap
} from 'lucide-react'
import { TimeSlotBtn } from './shared'
import { TIME_SLOTS } from '../utils/helpers'

function AgendaView({ profile, selectedDate, setSelectedDate, takenSlots, bookingLoading, handleBookAppointment }: any) {
    const today = new Date().toISOString().split('T')[0]
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                        <Calendar className="text-blue-600" size={28}/>
                    </div>
                    Cronograma de Citas
                </h2>
                <p className="text-slate-500 font-medium">Programa tu próxima sesión de terapia ABA</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm p-7 rounded-3xl shadow-lg border border-slate-200/60">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                            <Calendar size={12}/> Seleccionar Día
                        </label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            min={today} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all cursor-pointer text-center text-lg shadow-inner hover:bg-white"
                        />
                        
                        {selectedDate < today && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-xs text-red-600 font-bold flex items-center gap-2">
                                    <AlertCircle size={14}/> Selecciona una fecha futura
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-7 rounded-3xl text-white shadow-2xl shadow-blue-300/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 opacity-10">
                            <Sparkles size={120}/>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Sparkles size={20}/>
                                </div>
                                <p className="font-bold text-lg">Política de Citas</p>
                            </div>
                            <p className="text-blue-50 text-sm leading-relaxed mb-3">
                                • Sesiones de 45 minutos<br/>
                                • Cancela hasta 24h antes<br/>
                                • Reembolso automático de tokens<br/>
                                • Máximo 2 reprogramaciones
                            </p>
                            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                                <p className="text-xs text-blue-100 font-semibold flex items-center gap-2">
                                    <Zap size={14}/> Tip: Agenda con anticipación para mejores horarios
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-8">
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-slate-200/60">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-700 text-lg">Horarios Disponibles</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12}/> {TIME_SLOTS.length - takenSlots.length} libres
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-bold">
                                    {takenSlots.length} ocupados
                                </span>
                            </div>
                        </div>
                        
                        {(profile?.tokens || 0) > 0 ? (
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div> 
                                        Mañana (08:00 - 12:00)
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) < 12).map(time => (
                                            <TimeSlotBtn 
                                                key={time} 
                                                time={time} 
                                                isTaken={takenSlots.includes(time)} 
                                                loading={bookingLoading} 
                                                onClick={() => handleBookAppointment(time)}
                                                isPast={selectedDate === today && time < new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                     <div className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div> 
                                        Tarde (12:00 - 18:00)
                                    </div>
                                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) >= 12).map(time => (
                                            <TimeSlotBtn 
                                                key={time} 
                                                time={time} 
                                                isTaken={takenSlots.includes(time)} 
                                                loading={bookingLoading} 
                                                onClick={() => handleBookAppointment(time)}
                                                isPast={selectedDate === today && time < new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-6 bg-slate-100 rounded-3xl mb-4 relative">
                                    <Ticket size={48} className="text-slate-300"/>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 border-4 border-red-200 rounded-full animate-ping"></div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-700 text-lg mb-2">Sin créditos disponibles</h3>
                                <p className="text-sm text-slate-400 max-w-xs mb-6">Necesitas tokens para visualizar y agendar citas. Contacta al centro para recargar.</p>
                                <a 
                                    href="https://wa.me/51924807183" 
                                    target="_blank"
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                                >
                                    <Phone size={18}/> Solicitar Recarga
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


export default AgendaView
