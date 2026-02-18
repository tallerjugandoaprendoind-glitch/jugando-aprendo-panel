'use client'

import { useState, useEffect } from 'react'
import {
  Activity, Award, Baby, BarChart3, Brain, Calendar, CheckCircle2, ChevronRight, Clock, FileCheck, FileDown, FileText, Heart, Home, Loader2, MessageCircle, Plus, Search, Smile, Sparkles, Stethoscope, Target, Ticket, TrendingUp, Upload, UserPlus, Users, Utensils, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { StatCardPremium, QuickActionButton, StatusRow, MiniStatCard } from './shared'

function DashboardHome({ navigateTo }: { navigateTo: (view: string) => void }) {
  const toast = useToast()
  const [emailBusqueda, setEmailBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [sesionesHoy, setSesionesHoy] = useState(0)
  const [sesionesCompletadas, setSesionesCompletadas] = useState(0)
  const [creditosActivos, setCreditosActivos] = useState(0)
  const [familiasActivas, setFamiliasActivas] = useState(0)
  const [analisisIA, setAnalisisIA] = useState(0)
  const [actividadReciente, setActividadReciente] = useState<any[]>([])
  const [proximasCitas, setProximasCitas] = useState<any[]>([])
  const [estadisticasSemana, setEstadisticasSemana] = useState({
    sesiones: 0,
    evaluaciones: 0,
    analisisIA: 0,
    visitasHogar: 0,
    tasaAsistencia: 0
  })
  const [horaActual, setHoraActual] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    cargarDatosCompletos()
  }, [])

  const cargarDatosCompletos = async () => {
    try {
      const { data: pacientes, count: countPacientes } = await supabase
        .from('children')
        .select('*', { count: 'exact' })
      setTotalPacientes(countPacientes || 0)

      const hoy = new Date().toISOString().split('T')[0]
      const { data: citasHoy } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', hoy)
      setSesionesHoy(citasHoy?.length || 0)

      const { data: sesionesHoyRegistradas } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', `${hoy}T00:00:00`)
        .lte('created_at', `${hoy}T23:59:59`)
      setSesionesCompletadas(sesionesHoyRegistradas?.length || 0)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('tokens')
        .gt('tokens', 0)
      
      const totalCreditos = profiles?.reduce((sum, p) => sum + (p.tokens || 0), 0) || 0
      setCreditosActivos(totalCreditos)
      setFamiliasActivas(profiles?.length || 0)

      const inicioSemana = new Date()
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
      inicioSemana.setHours(0, 0, 0, 0)

      const { data: analisisSemanales } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())
        .not('datos->mensaje_padres', 'is', null)
      setAnalisisIA(analisisSemanales?.length || 0)

      const { data: actividadData } = await supabase
        .from('registro_aba')
        .select('*, children(name)')
        .order('created_at', { ascending: false })
        .limit(5)
      setActividadReciente(actividadData || [])

      const { data: citasProximas } = await supabase
        .from('appointments')
        .select('*, children(name)')
        .gte('appointment_date', hoy)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(4)
      setProximasCitas(citasProximas || [])

      const { data: sesionesSemanales } = await supabase
        .from('registro_aba')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: evaluacionesSemanales } = await supabase
        .from('anamnesis_completa')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: visitasSemanales } = await supabase
        .from('registro_entorno_hogar')
        .select('*')
        .gte('created_at', inicioSemana.toISOString())

      const { data: citasSemanales } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', inicioSemana.toISOString().split('T')[0])
        .lte('appointment_date', hoy)

      const tasaAsistencia = citasSemanales?.length 
        ? Math.round((sesionesSemanales?.length || 0) / citasSemanales.length * 100)
        : 0

      setEstadisticasSemana({
        sesiones: sesionesSemanales?.length || 0,
        evaluaciones: evaluacionesSemanales?.length || 0,
        analisisIA: analisisSemanales?.length || 0,
        visitasHogar: visitasSemanales?.length || 0,
        tasaAsistencia
      })

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    }
  }

  const handleCargarToken = async (cantidad: number) => {
    if (!emailBusqueda.trim()) {
      toast.warning("Por favor, ingresa un correo electrónico")
      return
    }

    setLoading(true)
    try {
      const cleanEmail = emailBusqueda.trim().toLowerCase()
      
      const { data: profile, error: searchError } = await supabase
        .from('profiles')
        .select('id, tokens, email')
        .eq('email', cleanEmail)
        .single()

      if (searchError || !profile) {
        toast.error("No se encontró ningún padre con ese correo electrónico")
        setLoading(false)
        return
      }

      const nuevosTokens = (profile.tokens || 0) + cantidad
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ tokens: nuevosTokens })
        .eq('id', profile.id)

      if (updateError) {
        toast.error("Error al actualizar los créditos: " + updateError.message)
      } else {
        toast.success(`¡Éxito! Se cargaron ${cantidad} crédito(s) a ${cleanEmail}. Total: ${nuevosTokens} créditos`)
        setEmailBusqueda('')
        cargarDatosCompletos()
      }
    } catch (err: any) {
      console.error('Error:', err)
      toast.error("Error de conexión: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in-up">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">
                ¡Bienvenida, Directora! 👋
              </h2>
              <p className="text-blue-100 text-sm md:text-base">
                {new Date().toLocaleDateString('es-PE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
              <Clock className="text-blue-200" size={24}/>
              <div>
                <p className="text-xs text-blue-200 font-bold">Hora actual</p>
                <p className="text-xl font-black">
                  {horaActual.toLocaleTimeString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Sparkles className="absolute -bottom-8 -right-8 text-white opacity-10" size={200}/>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatCardPremium 
          title="Total Pacientes" 
          value={totalPacientes} 
          icon={<Users className="text-blue-500" size={24}/>} 
          color="from-blue-500 to-blue-600" 
          trend="+2 este mes"
          trendUp={true}
        />
        <StatCardPremium 
          title="Sesiones Hoy" 
          value={sesionesHoy} 
          icon={<Calendar className="text-purple-500" size={24}/>} 
          color="from-purple-500 to-purple-600" 
          trend={`${sesionesCompletadas} completadas`}
          trendUp={true}
        />
        <StatCardPremium 
          title="Créditos Activos" 
          value={creditosActivos} 
          icon={<Ticket className="text-green-500" size={24}/>} 
          color="from-green-500 to-green-600" 
          trend={`${familiasActivas} familias`}
          trendUp={true}
        />
        <StatCardPremium 
          title="IA Análisis" 
          value={analisisIA} 
          icon={<Brain className="text-orange-500" size={24}/>} 
          color="from-orange-500 to-orange-600" 
          trend="Esta semana"
          trendUp={true}
        />
      </div>
      
      {/* 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* COLUMNA 1: RECARGA + ACCIONES */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all">
            <h3 className="font-bold text-slate-700 mb-6 text-lg md:text-xl flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Ticket size={24} className="text-blue-600"/>
              </div>
              Recarga Rápida
            </h3>
            <div className="space-y-4">
              <input 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all" 
                placeholder="email@ejemplo.com" 
                value={emailBusqueda} 
                onChange={e=>setEmailBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCargarToken(1)}
                type="email"
              />
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={()=>handleCargarToken(1)} 
                  disabled={loading || !emailBusqueda.trim()}
                  className="px-6 py-4 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                  1 Crédito
                </button>
                <button 
                  onClick={()=>handleCargarToken(4)} 
                  disabled={loading || !emailBusqueda.trim()}
                  className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                  4 Créditos
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 text-lg flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Sparkles size={20} className="text-purple-600"/>
              </div>
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <QuickActionButton 
                icon={<FileText size={18}/>} 
                label="Nueva Evaluación" 
                color="bg-blue-50 hover:bg-blue-100 text-blue-700"
                onClick={() => navigateTo('evaluaciones')}
              />
              <QuickActionButton 
                icon={<Calendar size={18}/>} 
                label="Agendar Cita" 
                color="bg-purple-50 hover:bg-purple-100 text-purple-700"
                onClick={() => navigateTo('agenda')}
              />
              <QuickActionButton 
                icon={<Brain size={18}/>} 
                label="Análisis IA" 
                color="bg-orange-50 hover:bg-orange-100 text-orange-700"
                onClick={() => navigateTo('reportes')}
              />
              <QuickActionButton 
                icon={<Upload size={18}/>} 
                label="Importar Datos" 
                color="bg-green-50 hover:bg-green-100 text-green-700"
                onClick={() => navigateTo('importar')}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 2: PRÓXIMAS CITAS */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 text-lg flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <Calendar size={20} className="text-green-600"/>
                </div>
                Próximas Citas
              </h3>
              <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold">
                {proximasCitas.length} Agendadas
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {proximasCitas.length > 0 ? proximasCitas.map((cita, idx) => (
                <div key={idx} className="group bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-xs font-bold opacity-80">
                        {new Date(cita.appointment_date).toLocaleString('es', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-black">{new Date(cita.appointment_date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate">{cita.children?.name || 'Sin nombre'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-400"/>
                        <p className="text-xs text-slate-500 font-bold">{cita.appointment_time?.slice(0,5) || '00:00'}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-slate-200 mb-4" size={48}/>
                  <p className="text-slate-400 text-sm font-bold">No hay citas próximas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA 3: ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 text-lg flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <Activity size={20} className="text-orange-600"/>
                </div>
                Actividad Reciente
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {actividadReciente.length > 0 ? actividadReciente.map((act, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-orange-50 hover:border-orange-200 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md">
                      {act.children?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-700 text-sm truncate">{act.children?.name || 'Sin nombre'}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {act.datos?.conducta || 'Sesión registrada'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2">
                        {new Date(act.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto text-slate-200 mb-4" size={48}/>
                  <p className="text-slate-400 text-sm font-bold">Sin actividad reciente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILA INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Activity size={24}/>
              </div>
              <div>
                <h3 className="font-bold text-xl">Monitor Sistema</h3>
                <p className="text-slate-400 text-xs font-bold">Estado en tiempo real</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <StatusRow label="Base de Datos" status="Operativa" color="green"/>
              <StatusRow label="IA Clinica" status="Activa" color="green"/>
              <StatusRow label="Almacenamiento" status="Normal" color="green"/>
              <StatusRow label="API Supabase" status="Online" color="green"/>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="font-bold text-sm">Todos los servicios operativos</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 text-xl mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BarChart3 size={24} className="text-blue-600"/>
            </div>
            Estadísticas de la Semana
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStatCard 
              value={estadisticasSemana.sesiones} 
              label="Sesiones" 
              icon={<Calendar size={18}/>} 
              color="bg-blue-50 text-blue-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.evaluaciones} 
              label="Evaluaciones" 
              icon={<FileText size={18}/>} 
              color="bg-purple-50 text-purple-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.analisisIA} 
              label="Análisis IA" 
              icon={<Brain size={18}/>} 
              color="bg-orange-50 text-orange-600"
            />
            <MiniStatCard 
              value={estadisticasSemana.visitasHogar} 
              label="Visitas Hogar" 
              icon={<Home size={18}/>} 
              color="bg-green-50 text-green-600"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-500 font-bold">Tasa de asistencia</span>
              <span className="text-green-600 font-black text-lg">{estadisticasSemana.tasaAsistencia}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full shadow-lg transition-all duration-1000" 
                style={{width: `${estadisticasSemana.tasaAsistencia}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default DashboardHome
