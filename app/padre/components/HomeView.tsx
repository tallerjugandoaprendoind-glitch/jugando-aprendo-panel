'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Award, Baby, Bell, Book, Brain, Calendar, CheckCircle2, ChevronRight, Clock, Eye, Flame, Heart, Home, Loader2, MessageCircle, PlayCircle, RefreshCw, Smile, Sparkles, Star, Stethoscope, Target, Trash2, TrendingDown, TrendingUp, User, X, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { StatCard, ObjectiveBar } from './shared'
import { calculateAge } from '../utils/helpers'

function HomeViewInnovative({ child, onChangeView, refreshTrigger, onCancelAppointment }: any) {
    const [lastSession, setLastSession] = useState<any>(null)
    const [nextApt, setNextApt] = useState<any>(null)
    const [sessionHistory, setSessionHistory] = useState<any[]>([])
    const [showTaskGuide, setShowTaskGuide] = useState(false)
    const [showProgresoDetalle, setShowProgresoDetalle] = useState(false)
    const [showReporteDetalle, setShowReporteDetalle] = useState(false)
    const [mensajesTerapeuta, setMensajesTerapeuta] = useState<any[]>([])
    
    const [calculatedObjectives, setCalculatedObjectives] = useState({
        verbal: 0, emotional: 0, social: 0, adaptive: 0
    })
    const [insights, setInsights] = useState({ trend: '', strongArea: '', focusArea: '' })
    const [weeklyProgress, setWeeklyProgress] = useState(0)

    useEffect(() => {
        if(!child) return
        const load = async () => {
            const { data: aba } = await supabase.from('registro_aba').select('*').eq('child_id', child.id).order('fecha_sesion', {ascending: false}).limit(1).single()
            setLastSession(aba)
            
            const { data: apt } = await supabase.from('appointments').select('*').eq('child_id', child.id).gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', {ascending: true}).limit(1).single()
            setNextApt(apt)

            const { data: history } = await supabase.from('registro_aba').select('*').eq('child_id', child.id).order('fecha_sesion', {ascending: false}).limit(20)
            setSessionHistory(history || [])

            // ── Mensajes del terapeuta (ABA + visitas hogar) ──────────────
            const { data: entorno } = await supabase.from('registro_entorno_hogar').select('*').eq('child_id', child.id).order('fecha_visita', {ascending: false}).limit(3)
            const mensajesAba = (history || [])
                .filter((s:any) => s.datos?.mensaje_padres || s.datos?.destacar_positivo || s.datos?.actividad_casa || s.datos?.tarea_hogar || s.datos?.instrucciones_padres)
                .slice(0, 5)
                .map((s:any) => ({
                    id: s.id,
                    tipo: 'aba',
                    fecha: s.fecha_sesion || s.created_at,
                    mensaje: s.datos?.mensaje_padres || s.datos?.destacar_positivo || '',
                    tarea: s.datos?.actividad_casa || s.datos?.instrucciones_padres || s.datos?.tarea_hogar || '',
                    barreras: s.datos?.barreras || '',
                    facilitadores: s.datos?.facilitadores || '',
                    objetivo: s.datos?.objetivo_principal || s.datos?.conducta || '',
                }))
            const mensajesEntorno = (entorno || [])
                .filter((e:any) => e.datos?.mensaje_padres_entorno || e.datos?.impresion_general || e.datos?.recomendaciones_espacio)
                .map((e:any) => ({
                    id: e.id,
                    tipo: 'hogar',
                    fecha: e.fecha_visita || e.created_at,
                    mensaje: e.datos?.mensaje_padres_entorno || e.datos?.impresion_general || '',
                    tarea: e.datos?.actividades_casa || e.datos?.recomendaciones_espacio || '',
                    barreras: e.datos?.barreras_identificadas || '',
                    facilitadores: e.datos?.facilitadores || '',
                    objetivo: '',
                }))
            const todos = [...mensajesAba, ...mensajesEntorno].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 6)
            setMensajesTerapeuta(todos)
            // ─────────────────────────────────────────────────────────────

            const lastWeek = new Date()
            lastWeek.setDate(lastWeek.getDate() - 7)
            const { data: weekSessions } = await supabase.from('registro_aba').select('*').eq('child_id', child.id).gte('fecha_sesion', lastWeek.toISOString())
            if (weekSessions && weekSessions.length > 0) {
                const avgProgress = weekSessions.reduce((acc:number, s:any) => {
                    const result = s.datos?.resultado_sesion || ""
                    if (result.includes("logrado")) return acc + 100
                    if (result.includes("Parcialmente")) return acc + 65
                    return acc + 40
                }, 0) / weekSessions.length
                setWeeklyProgress(Math.round(avgProgress))
            }
            
            if (history && history.length > 0) {
                let scores = { verbal:{total:0,count:0}, emotional:{total:0,count:0}, social:{total:0,count:0}, adaptive:{total:0,count:0} }
                history.forEach((session:any) => {
                    const d = session.datos || {}
                    const result = d.resultado_sesion || ""
                    const text = ((d.conducta||"")+" "+(d.objetivo_sesion||"")+" "+(d.objetivo_principal||"")).toLowerCase()
                    let score = 0
                    if (result.includes("Objetivo logrado")||result.includes("Excelente")) score = 100
                    else if (result.includes("Parcialmente")||result.includes("Bueno")) score = 65
                    else if (result.includes("En proceso")) score = 40
                    else score = 25
                    if (text.match(/\b(habl|lenguaje|palabra|voz|manda|tacto|comunic|verbal|ecoica|intraverbal)\b/)) { scores.verbal.total+=score; scores.verbal.count++ }
                    if (text.match(/\b(llanto|grito|berrinche|espera|tolerancia|frustra|conducta|regula|calma|enojo)\b/)) { scores.emotional.total+=score; scores.emotional.count++ }
                    if (text.match(/\b(juego|turno|mirada|contacto|social|amigo|compartir|interacc|grupo|par)\b/)) { scores.social.total+=score; scores.social.count++ }
                    if (text.match(/\b(vestir|comer|baño|higiene|autónomo|independencia|rutina|tarea|ayuda)\b/)) { scores.adaptive.total+=score; scores.adaptive.count++ }
                })
                const calc = {
                    verbal:   scores.verbal.count   > 0 ? Math.round(scores.verbal.total/scores.verbal.count)     : 0,
                    emotional:scores.emotional.count> 0 ? Math.round(scores.emotional.total/scores.emotional.count): 0,
                    social:   scores.social.count   > 0 ? Math.round(scores.social.total/scores.social.count)     : 0,
                    adaptive: scores.adaptive.count > 0 ? Math.round(scores.adaptive.total/scores.adaptive.count) : 0,
                }
                setCalculatedObjectives(calc)
                const areas = [{name:'Comunicación',value:calc.verbal},{name:'Regulación Emocional',value:calc.emotional},{name:'Habilidades Sociales',value:calc.social},{name:'Adaptativas',value:calc.adaptive}]
                const sorted = [...areas].sort((a,b)=>b.value-a.value)
                const trend = history.length>=5 ? (calc.verbal>70?'mejorando':calc.verbal>40?'estable':'requiere atención') : 'en evaluación'
                setInsights({ trend, strongArea:sorted[0].name, focusArea:sorted[sorted.length-1].name })
            }
        }
        load()
    }, [child, refreshTrigger]) 

    if(!child) return (
        <div className="text-center p-20 opacity-60">
            <User size={64} className="mx-auto mb-4 text-slate-300"/>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Selecciona un paciente arriba 👆</p>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 🎯 HEADER HERO */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl shadow-blue-300/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10"><Heart size={180}/></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">Paciente Activo</p>
                        <h1 className="text-4xl font-black mb-2">{child.name}</h1>
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">{calculateAge(child.birth_date)} años</span>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">{child.diagnosis || 'En evaluación'}</span>
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Activity size={12}/> {sessionHistory.length} sesiones</span>
                        </div>
                    </div>
                    {insights.trend && (
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                            <p className="text-xs text-blue-100 font-bold uppercase tracking-wide mb-1">Tendencia</p>
                            <p className="text-xl font-black capitalize flex items-center gap-2">
                                {insights.trend==='mejorando'&&<TrendingUp size={20}/>}
                                {insights.trend==='estable'&&<Activity size={20}/>}
                                {insights.trend==='requiere atención'&&<TrendingDown size={20}/>}
                                {insights.trend}
                            </p>
                        </div>
                    )}
                </div>
                {weeklyProgress > 0 && (
                    <div className="mt-6 relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-100">Progreso Esta Semana</span>
                            <span className="text-sm font-black">{weeklyProgress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{width:`${weeklyProgress}%`}}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* 📅 PRÓXIMA CITA */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-slate-200/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-xl"><Calendar className="text-blue-600" size={20}/></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próxima Sesión</p>
                    </div>
                    {nextApt ? (
                        <div>
                            <h2 className="text-5xl font-black text-slate-800 mb-2">
                                {nextApt.appointment_date.split('-')[2]}
                                <span className="text-xl text-slate-400 font-bold ml-2">{['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(nextApt.appointment_date.split('-')[1])-1]}</span>
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2"><Clock size={16}/> {nextApt.appointment_time?.slice(0,5)}</span>
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2"><CheckCircle2 size={14}/> Confirmada</span>
                                <span className="text-slate-400 text-xs font-semibold">{nextApt.service_type}</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={()=>onCancelAppointment(nextApt.id,true)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all hover:scale-105 active:scale-95"><RefreshCw size={16}/> Reprogramar</button>
                                <button onClick={()=>onCancelAppointment(nextApt.id,false)} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all hover:scale-105 active:scale-95"><Trash2 size={16}/> Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Sin citas programadas</h2>
                            <p className="text-sm text-slate-400 font-medium mb-4">Agenda tu próxima sesión de terapia</p>
                            <button onClick={()=>onChangeView('agenda')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95">Agendar Ahora <ChevronRight size={18}/></button>
                        </div>
                    )}
                </div>
                {nextApt && (
                    <div className="lg:border-l lg:border-slate-200 lg:pl-8">
                        <button onClick={()=>onChangeView('agenda')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95">Ver Calendario <ChevronRight size={18}/></button>
                    </div>
                )}
            </div>

            {/* 📊 PROGRESO POR ÁREAS + ÚLTIMO REPORTE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progreso por áreas - con botón "Ver detalle" funcional */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-slate-200/60">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl"><TrendingUp className="text-green-600" size={20}/></div>
                            Progreso por Áreas
                        </h3>
                        <button 
                            onClick={()=>setShowProgresoDetalle(true)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            Ver detalle <ChevronRight size={12}/>
                        </button>
                    </div>
                    {calculatedObjectives.verbal===0 && calculatedObjectives.emotional===0 && calculatedObjectives.social===0 && calculatedObjectives.adaptive===0 ? (
                        <div className="text-center py-12">
                            <div className="p-6 bg-slate-50 rounded-3xl inline-block mb-4"><Activity className="text-slate-300" size={48}/></div>
                            <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">Aún no hay suficientes datos. El progreso se calculará automáticamente después de las primeras sesiones.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <ObjectiveBar label="Comunicación Verbal" progress={calculatedObjectives.verbal} color="bg-blue-500" icon={<MessageCircle size={14}/>}/>
                            <ObjectiveBar label="Regulación Emocional" progress={calculatedObjectives.emotional} color="bg-purple-500" icon={<Heart size={14}/>}/>
                            <ObjectiveBar label="Habilidades Sociales" progress={calculatedObjectives.social} color="bg-green-500" icon={<User size={14}/>}/>
                            <ObjectiveBar label="Conductas Adaptativas" progress={calculatedObjectives.adaptive} color="bg-orange-500" icon={<Star size={14}/>}/>
                        </div>
                    )}
                    {insights.strongArea && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-2"><Award size={14}/> Área Fuerte</p>
                            <p className="text-sm font-bold text-blue-900">{insights.strongArea}</p>
                        </div>
                    )}
                </div>

                {/* Último reporte - con botón "Ver detalle" funcional */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-3xl border border-indigo-100 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 opacity-5"><Brain size={160}/></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-200 rounded-xl"><Activity className="text-indigo-700" size={20}/></div>
                            <h3 className="font-bold text-indigo-900 text-lg">Último Reporte Clínico</h3>
                        </div>
                        {lastSession && (
                            <button 
                                onClick={()=>setShowReporteDetalle(true)}
                                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Ver detalle <ChevronRight size={12}/>
                            </button>
                        )}
                    </div>
                    {lastSession ? (
                        <div className="relative z-10 space-y-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-2"><Clock size={12}/> {lastSession.fecha_sesion}</span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${lastSession.datos?.nivel_logro_objetivos?.includes('logrado')||lastSession.datos?.resultado_sesion?.includes('logrado') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {lastSession.datos?.nivel_logro_objetivos || lastSession.datos?.resultado_sesion || 'En proceso'}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                    "{lastSession.datos?.mensaje_padres || lastSession.datos?.destacar_positivo || lastSession.datos?.conducta || "Sin comentarios registrados."}"
                                </p>
                            </div>
                            {(lastSession.datos?.objetivo_principal || lastSession.datos?.objetivo_sesion) && (
                                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-2"><Target size={12}/> Objetivo trabajado</p>
                                    <p className="text-sm font-semibold text-indigo-900">{lastSession.datos?.objetivo_principal || lastSession.datos?.objetivo_sesion}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 relative z-10">
                            <div className="p-5 bg-white/50 rounded-3xl inline-block mb-3"><Clock className="text-indigo-300" size={40}/></div>
                            <p className="text-indigo-400 font-medium text-sm">Esperando primera sesión...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 💬 MENSAJES DEL TERAPEUTA */}
            {mensajesTerapeuta.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl"><MessageCircle className="text-green-700" size={20}/></div>
                        <h3 className="font-bold text-slate-800 text-lg">Mensajes del Terapeuta</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">{mensajesTerapeuta.length} mensaje{mensajesTerapeuta.length>1?'s':''}</span>
                    </div>
                    {mensajesTerapeuta.map((m:any, idx:number) => (
                        <div key={m.id||idx} className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-all">
                            <div className={`px-6 py-3 flex items-center justify-between ${m.tipo==='hogar' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                                <div className="flex items-center gap-2">
                                    {m.tipo==='hogar' ? <Home size={16} className="text-white"/> : <Activity size={16} className="text-white"/>}
                                    <span className="text-white font-bold text-sm uppercase tracking-wide">{m.tipo==='hogar' ? 'Visita al Hogar' : 'Sesión ABA'}</span>
                                </div>
                                <span className="text-white/80 text-xs font-semibold">{new Date(m.fecha).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</span>
                            </div>
                            <div className="p-6 space-y-3">
                                {m.mensaje && (
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-2"><Heart size={12}/> Mensaje del terapeuta</p>
                                        <p className="text-slate-700 text-sm leading-relaxed font-medium">{m.mensaje}</p>
                                    </div>
                                )}
                                {m.tarea && (
                                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                        <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-2 flex items-center gap-2"><Zap size={12}/> Actividad para casa</p>
                                        <p className="text-slate-700 text-sm leading-relaxed">{m.tarea}</p>
                                    </div>
                                )}
                                {(m.barreras||m.facilitadores) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {m.barreras && <div className="bg-red-50 p-3 rounded-xl border border-red-100"><p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">⚠️ Barrera</p><p className="text-xs text-red-700 font-medium">{m.barreras}</p></div>}
                                        {m.facilitadores && <div className="bg-blue-50 p-3 rounded-xl border border-blue-100"><p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">✅ Facilitador</p><p className="text-xs text-blue-700 font-medium">{m.facilitadores}</p></div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🏠 TAREA PARA CASA (legacy) */}
            {lastSession?.datos?.legacy_home_task && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-200 flex items-start gap-5 shadow-lg hover:shadow-xl transition-all group">
                    <div className="bg-yellow-200 p-4 rounded-2xl text-yellow-700 shrink-0 group-hover:scale-110 transition-transform"><Heart size={28}/></div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-yellow-900 uppercase text-sm tracking-widest flex items-center gap-2"><Zap size={16}/> Misión Familiar de la Semana</h4>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-bold">Activa</span>
                        </div>
                        <p className="text-yellow-900 font-semibold leading-relaxed text-base mb-3">{lastSession.datos.legacy_home_task}</p>
                        <button onClick={()=>setShowTaskGuide(true)} className="text-sm text-yellow-700 font-bold hover:underline flex items-center gap-2 hover:gap-3 transition-all">Ver guía completa <ChevronRight size={14}/></button>
                    </div>
                </div>
            )}

            {/* 📈 ESTADÍSTICAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Activity className="text-blue-600"/>} label="Sesiones" value={sessionHistory.length} color="bg-blue-50" trend="+3 este mes" />
                <StatCard icon={<Target className="text-green-600"/>} label="Objetivos logrados" value={sessionHistory.filter((s:any)=>s.datos?.nivel_logro_objetivos?.includes('logrado')||s.datos?.resultado_sesion?.includes('logrado')).length} color="bg-green-50" trend="75% tasa" />
                <StatCard icon={<Clock className="text-purple-600"/>} label="Horas acumuladas" value={Math.round(sessionHistory.length * 0.75)} color="bg-purple-50" trend="45 min/sesión" />
                <StatCard icon={<Award className="text-yellow-600"/>} label="Nivel" value={sessionHistory.length>20?'Avanzado':sessionHistory.length>10?'Intermedio':'Inicial'} color="bg-yellow-50" trend="En progreso" />
            </div>

            {/* ── MODAL: VER DETALLE PROGRESO ──────────────────────────── */}
            {showProgresoDetalle && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={()=>setShowProgresoDetalle(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in" onClick={e=>e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><TrendingUp size={24}/></div>
                                <div><h3 className="font-bold text-lg">Detalle de Progreso</h3><p className="text-xs text-green-100">{child.name} · {sessionHistory.length} sesiones</p></div>
                            </div>
                            <button onClick={()=>setShowProgresoDetalle(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="space-y-5">
                                {[
                                    {label:'Comunicación Verbal',progress:calculatedObjectives.verbal,color:'bg-blue-500',icon:<MessageCircle size={16} className="text-blue-600"/>, desc:'Uso de palabras, frases y comunicación funcional'},
                                    {label:'Regulación Emocional',progress:calculatedObjectives.emotional,color:'bg-purple-500',icon:<Heart size={16} className="text-purple-600"/>, desc:'Manejo de berrinches, espera, tolerancia'},
                                    {label:'Habilidades Sociales',progress:calculatedObjectives.social,color:'bg-green-500',icon:<User size={16} className="text-green-600"/>, desc:'Contacto visual, juego, interacción con pares'},
                                    {label:'Conductas Adaptativas',progress:calculatedObjectives.adaptive,color:'bg-orange-500',icon:<Star size={16} className="text-orange-600"/>, desc:'Autonomía en higiene, vestido, rutinas'},
                                ].map(area=>(
                                    <div key={area.label} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">{area.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-slate-800 text-sm">{area.label}</p>
                                                    <span className={`text-sm font-black ${area.progress>70?'text-green-600':area.progress>40?'text-yellow-600':'text-red-400'}`}>{area.progress>0?`${area.progress}%`:'Sin datos'}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">{area.desc}</p>
                                            </div>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${area.color} transition-all duration-1000`} style={{width:`${area.progress}%`}}></div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">
                                            {area.progress>70?'✅ Buen progreso, continúa reforzando en casa':area.progress>40?'🔄 Progreso moderado, practicar más en casa':area.progress>0?'⚡ Área en desarrollo inicial, requiere más práctica':'📊 Aún no hay sesiones que trabajen esta área'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {insights.trend && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Tendencia General</p>
                                    <p className="text-lg font-black text-slate-800 capitalize">{insights.trend}</p>
                                    {insights.strongArea && <p className="text-sm text-slate-600 mt-1">Área fuerte: <strong>{insights.strongArea}</strong></p>}
                                    {insights.focusArea && <p className="text-sm text-slate-600">Área a reforzar: <strong>{insights.focusArea}</strong></p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: VER DETALLE REPORTE CLÍNICO ──────────────────── */}
            {showReporteDetalle && lastSession && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={()=>setShowReporteDetalle(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in" onClick={e=>e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Activity size={24}/></div>
                                <div><h3 className="font-bold text-lg">Reporte Clínico Completo</h3><p className="text-xs text-indigo-100">Sesión del {lastSession.fecha_sesion}</p></div>
                            </div>
                            <button onClick={()=>setShowReporteDetalle(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {[
                                {label:'Mensaje del Terapeuta',value:lastSession.datos?.mensaje_padres||lastSession.datos?.destacar_positivo,icon:<MessageCircle size={14}/>,color:'bg-green-50 border-green-100',text:'text-green-600'},
                                {label:'Objetivo Principal',value:lastSession.datos?.objetivo_principal||lastSession.datos?.objetivo_sesion,icon:<Target size={14}/>,color:'bg-blue-50 border-blue-100',text:'text-blue-600'},
                                {label:'Conducta Observada',value:lastSession.datos?.conducta,icon:<Eye size={14}/>,color:'bg-purple-50 border-purple-100',text:'text-purple-600'},
                                {label:'Avances Observados',value:lastSession.datos?.avances_observados,icon:<TrendingUp size={14}/>,color:'bg-emerald-50 border-emerald-100',text:'text-emerald-600'},
                                {label:'Actividad para Casa',value:lastSession.datos?.actividad_casa||lastSession.datos?.instrucciones_padres||lastSession.datos?.tarea_hogar,icon:<Home size={14}/>,color:'bg-yellow-50 border-yellow-100',text:'text-yellow-600'},
                                {label:'Próximos Pasos',value:lastSession.datos?.proximos_pasos||lastSession.datos?.ajustes_proxima_sesion,icon:<ChevronRight size={14}/>,color:'bg-orange-50 border-orange-100',text:'text-orange-600'},
                                {label:'Nivel de Logro',value:lastSession.datos?.nivel_logro_objetivos,icon:<Award size={14}/>,color:'bg-indigo-50 border-indigo-100',text:'text-indigo-600'},
                            ].filter(item=>item.value).map(item=>(
                                <div key={item.label} className={`p-4 rounded-2xl border ${item.color}`}>
                                    <p className={`text-xs font-bold ${item.text} uppercase tracking-wide mb-2 flex items-center gap-2`}>{item.icon} {item.label}</p>
                                    <p className="text-slate-700 text-sm leading-relaxed font-medium">{item.value}</p>
                                </div>
                            ))}
                            {lastSession.datos?.habilidades_objetivo && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Zap size={14}/> Habilidades Trabajadas</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(lastSession.datos.habilidades_objetivo)?lastSession.datos.habilidades_objetivo:[lastSession.datos.habilidades_objetivo]).map((h:string,i:number)=>(
                                            <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">{h}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                                {lastSession.datos?.nivel_atencion && <div className="bg-blue-50 p-3 rounded-xl text-center"><p className="text-xs font-bold text-blue-500 uppercase mb-1">Atención</p><p className="text-xl font-black text-blue-700">{lastSession.datos.nivel_atencion}<span className="text-xs">/5</span></p></div>}
                                {lastSession.datos?.interaccion_social && <div className="bg-green-50 p-3 rounded-xl text-center"><p className="text-xs font-bold text-green-500 uppercase mb-1">Social</p><p className="text-xl font-black text-green-700">{lastSession.datos.interaccion_social}<span className="text-xs">/5</span></p></div>}
                                {lastSession.datos?.tolerancia_frustracion && <div className="bg-orange-50 p-3 rounded-xl text-center"><p className="text-xs font-bold text-orange-500 uppercase mb-1">Tolerancia</p><p className="text-xl font-black text-orange-700">{lastSession.datos.tolerancia_frustracion}<span className="text-xs">/5</span></p></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GUÍA DE TAREA */}
            {showTaskGuide && lastSession?.datos?.legacy_home_task && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                    <Heart size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Guía Completa de Actividad</h3>
                                    <p className="text-xs text-yellow-100">Para practicar en casa</p>
                                </div>
                            </div>
                            <button onClick={()=>setShowTaskGuide(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
                                <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                                    <Target size={18}/> Objetivo de la actividad
                                </h4>
                                <p className="text-yellow-800 leading-relaxed">
                                    {lastSession.datos.legacy_home_task}
                                </p>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={18}/> Paso a paso
                                </h4>
                                <ol className="space-y-3 text-blue-800">
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">1.</span>
                                        <span>Encuentra un momento tranquilo del día donde {child.name} esté receptivo/a</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">2.</span>
                                        <span>Practica la actividad durante 5-10 minutos inicialmente</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">3.</span>
                                        <span>Refuerza inmediatamente cada intento apropiado con elogios específicos</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">4.</span>
                                        <span>Mantén un registro sencillo de los progresos diarios</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black text-blue-600">5.</span>
                                        <span>Si hay dificultades, reduce la complejidad y consulta con el terapeuta</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                    <Sparkles size={18}/> Tips importantes
                                </h4>
                                <ul className="space-y-2 text-purple-800 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Star size={14} className="mt-1 shrink-0"/> Sé consistente con la frecuencia (ideal: diariamente)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star size={14} className="mt-1 shrink-0"/> Mantén un ambiente libre de distracciones
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star size={14} className="mt-1 shrink-0"/> Celebra los pequeños avances
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star size={14} className="mt-1 shrink-0"/> No fuerces si hay resistencia, intenta más tarde
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Star size={14} className="mt-1 shrink-0"/> Documenta con fotos o videos para compartir con el terapeuta
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <Heart size={18}/> Recuerda
                                </h4>
                                <p className="text-green-800 leading-relaxed">
                                    Cada niño/a progresa a su propio ritmo. Lo más importante es la calidad de la interacción y el vínculo positivo que construyes durante estas actividades. ¡Tú eres parte fundamental del equipo terapéutico!
                                </p>
                            </div>

                            <button 
                                onClick={()=>setShowTaskGuide(false)}
                                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                Entendido, ¡vamos a practicar!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


export default HomeViewInnovative
