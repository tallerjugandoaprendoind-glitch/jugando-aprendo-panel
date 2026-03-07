'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProgresoGraficas from '@/components/graficos/ProgresoGraficas'
import {
  Activity, Brain, CheckCircle2, ChevronDown, ChevronRight, Clock, Download, Eye, FileCheck, FileDown, FileText, History, Home, Loader2, MessageCircle, RefreshCw, Send, ShieldAlert, Sparkles, Target, User, Users, X, Zap, Mic, MicOff, Volume2, VolumeX, StopCircle
} from 'lucide-react'

// ── Tipos Web Speech API ──────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// ── Hook Text-to-Speech con ElevenLabs (Ivanna) ──────────────────────────────
function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return

    abortRef.current?.abort()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }

    abortRef.current = new AbortController()
    setSpeaking(true)

    try {
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('ElevenLabs TTS falló, usando fallback del navegador')
        if ('speechSynthesis' in window) {
          const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\n{2,}/g, '. ').trim().slice(0, 4000)
          const utter = new SpeechSynthesisUtterance(clean)
          utter.lang = 'es-PE'; utter.rate = 1.05
          utter.onend = () => setSpeaking(false)
          utter.onerror = () => setSpeaking(false)
          window.speechSynthesis.speak(utter)
        } else { setSpeaking(false) }
      } else { setSpeaking(false) }
    }
  }, [voiceEnabled])

  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const toggleVoice = useCallback(() => {
    if (speaking) {
      abortRef.current?.abort()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
    setVoiceEnabled(v => !v)
  }, [speaking])

  return { speak, stopSpeaking, speaking, voiceEnabled, toggleVoice }
}

// ── Hook Speech-to-Text ───────────────────────────────────────────────────────
function useSpeechToText(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const rec = new SR()
      rec.lang = 'es-PE'
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (e: any) => onResult(e.results[0][0].transcript)
      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)
      recognitionRef.current = rec
    }
  }, [onResult])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return
    setListening(true)
    recognitionRef.current.start()
  }, [listening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, startListening, stopListening }
}
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import ReportGenerator from '@/components/ReportGenerator'

function AIReportView({ onChildSelect }: { onChildSelect?: (child: {id: string, name: string} | null) => void }) {
  const [listaNinos, setListaNinos] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState('')
  const [historyData, setHistoryData] = useState<any>({ anamnesis: null, aba: [], entorno: [] })
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [reportesHistorial, setReportesHistorial] = useState<any[]>([])
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(true)
  const [mobileTab, setMobileTab] = useState<'chat' | 'history' | 'reports' | 'graficas'>('chat')
  
  const [messages, setMessages] = useState<any[]>([
      { role: 'ai', text: 'Hola 👋. Selecciona un paciente para iniciar el análisis clínico.' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // ── Voz ──
  const { speak, stopSpeaking, speaking, voiceEnabled, toggleVoice } = useTextToSpeech()

  const handleVoiceResult = useCallback((transcript: string) => {
    setInput(transcript)
    setTimeout(() => sendMessageWithText(transcript), 600)
  }, []) // eslint-disable-line

  const { listening, supported: micSupported, startListening, stopListening } = useSpeechToText(handleVoiceResult)

  useEffect(() => {
    supabase.from('children').select('id, name').then(({ data }) => data && setListaNinos(data))
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typing])

  const handleSelectChild = async (childId: string) => {
    setSelectedChild(childId)
    const selectedNino = listaNinos.find(n => n.id === childId)
    if (onChildSelect && selectedNino) {
      onChildSelect({ id: childId, name: selectedNino.name })
    }
    setHistoryData({ anamnesis: null, aba: [], entorno: [] }) 
    
    setMessages([{ role: 'ai', text: 'Cargando historial del paciente...' }])
    
    console.log('🔍 Buscando datos para child_id:', childId)
    
    // Buscar anamnesis en anamnesis_completa (llenada por admin)
    const { data: anamnesisAdmin } = await supabase
      .from('anamnesis_completa')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Si no hay, buscar en parent_forms (llenada por el padre)
    let anamnesisFromParent: any = null
    if (!anamnesisAdmin) {
      const { data: pf } = await supabase
        .from('parent_forms')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'completed')
        .in('form_type', ['anamnesis', 'historia_familiar', 'Historia Familiar y del Desarrollo'])
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()
      if (pf) {
        // Adaptar estructura para que sea compatible con el resto del código
        anamnesisFromParent = { datos: pf.responses, form_title: pf.form_title, created_at: pf.completed_at }
      }
    }

    const anamnesis = anamnesisAdmin || anamnesisFromParent
    console.log('📋 Anamnesis encontrada:', anamnesis ? (anamnesisAdmin ? 'admin' : 'padre') : 'No')
    
    const { data: aba, error: abaError } = await supabase
      .from('registro_aba')
      .select('*')
      .eq('child_id', childId)
      .order('fecha_sesion', { ascending: false })
    
    if (abaError) console.error('❌ Error cargando sesiones ABA:', abaError)
    console.log('📊 Sesiones ABA encontradas:', aba?.length || 0)
    
    const { data: entorno, error: entornoError } = await supabase
      .from('registro_entorno_hogar')
      .select('*')
      .eq('child_id', childId)
      .order('fecha_visita', { ascending: false })
    
    if (entornoError) console.error('❌ Error cargando visitas hogar:', entornoError)
    console.log('🏠 Visitas hogar encontradas:', entorno?.length || 0)

    const { data: brief2 } = await supabase
    .from('evaluacion_brief2')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: ados2 } = await supabase
    .from('evaluacion_ados2')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: vineland3 } = await supabase
    .from('evaluacion_vineland3')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: wiscv } = await supabase
    .from('evaluacion_wiscv')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: basc3 } = await supabase
    .from('evaluacion_basc3')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Load all completed NeuroForms and form_responses
  const { data: formResponses } = await supabase
    .from('form_responses')
    .select('id, form_type, form_title, ai_analysis, responses, created_at')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(30)

  // Helper: extract professional eval from form_responses if dedicated table is empty
  const fromFormResponses = (type: string) =>
    (formResponses || []).find((r: any) => r.form_type === type) || null;

  // Formularios completados por los padres
  const { data: parentFormsCompleted } = await supabase
    .from('parent_forms')
    .select('id, form_type, form_title, responses, completed_at')
    .eq('child_id', childId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(20)
     
  const resolvedBrief2   = brief2   || fromFormResponses('brief2');
  const resolvedAdos2    = ados2    || fromFormResponses('ados2');
  const resolvedVineland = vineland3 || fromFormResponses('vineland3');
  const resolvedWiscv    = wiscv    || fromFormResponses('wiscv');
  const resolvedBasc3    = basc3    || fromFormResponses('basc3');

  // Filter form_responses to exclude professional evals (already handled above)
  const filteredFormResponses = (formResponses || []).filter(
    (r: any) => !['brief2','ados2','vineland3','wiscv','basc3'].includes(r.form_type)
  );

  setHistoryData({ 
    anamnesis: anamnesis ? anamnesis.datos : null, 
    aba: aba || [],
    entorno: entorno || [],
    brief2: resolvedBrief2,
    ados2: resolvedAdos2,
    vineland3: resolvedVineland,
    wiscv: resolvedWiscv,
    basc3: resolvedBasc3,
    parentForms: parentFormsCompleted || [],
  })
    
const nombre = listaNinos.find(n => n.id === childId)?.name || 'el paciente';
  const totalEvaluaciones = [resolvedBrief2, resolvedAdos2, resolvedVineland, resolvedWiscv, resolvedBasc3].filter(Boolean).length;
  const totalFormularios = (filteredFormResponses.length || 0) + (parentFormsCompleted?.length || 0)
  const parentFormsText = (parentFormsCompleted || []).length > 0
    ? `\n📨 **Formularios de Padres (${parentFormsCompleted!.length}):**\n${parentFormsCompleted!.slice(0,5).map((f: any) => `  • ${f.form_title || f.form_type} (${f.completed_at ? new Date(f.completed_at).toLocaleDateString('es-PE') : 'Sin fecha'})`).join('\n')}`
    : '';
  
  // Añadir alertas si faltan datos críticos
  if (!anamnesis) {
    console.warn('⚠️ No se encontró anamnesis para este paciente')
  }
  if (!entorno || entorno.length === 0) {
    console.warn('⚠️ No se encontraron visitas domiciliarias para este paciente')
  }
      
     setMessages([{ 
    role: 'ai', 
    text: `✅ Historial completo de **${nombre}** cargado.\n\n📊 **Evaluaciones Profesionales:** ${totalEvaluaciones}/5\n• ${resolvedBrief2 ? "✅" : "❌"} BRIEF-2\n• ${resolvedAdos2 ? "✅" : "❌"} ADOS-2\n• ${resolvedVineland ? "✅" : "❌"} Vineland-3\n• ${resolvedWiscv ? "✅" : "❌"} WISC-V\n• ${resolvedBasc3 ? "✅" : "❌"} BASC-3\n\n📋 **Sesiones ABA:** ${aba?.length || 0}\n🏠 **Visitas Hogar:** ${entorno?.length || 0}\n📝 **NeuroFormas / Formularios:** ${totalFormularios}${totalFormularios > 0 ? `\n${[...(filteredFormResponses), ...(parentFormsCompleted||[])].slice(0,8).map((f: any) => `  • ${f.form_title || f.form_type} (${new Date(f.completed_at || f.created_at).toLocaleDateString('es-PE')})`).join('\n')}` : ''}${!anamnesis ? '\n\n⚠️ Falta Anamnesis Inicial' : ''}${(!entorno || entorno.length === 0) ? '\n⚠️ Falta Visita Domiciliaria' : ''}\n\n¿Qué deseas analizar?`
  }])

    // Cargar todos los reportes Word del paciente
    setLoadingReportes(true)
    const { data: allReportes } = await supabase
      .from('reportes_generados')
      .select('id, tipo_reporte, titulo, nombre_archivo, fecha_generacion, tamano_bytes, generado_por')
      .eq('child_id', childId)
      .order('fecha_generacion', { ascending: false })
    setReportesHistorial(allReportes || [])
    setLoadingReportes(false)
}

  const sendMessageWithText = async (text: string) => {
    if (!text.trim()) return
    if (!selectedChild) { alert('Selecciona un paciente primero.'); return }
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    stopSpeaking()
    setTyping(true)
    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, childId: selectedChild })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.text }])
      speak(data.text)
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Error de conexión.' }])
    } finally {
      setTyping(false)
    }
  }

  const sendMessage = () => sendMessageWithText(input)

  const handleMicClick = () => {
    if (listening) { stopListening() }
    else { stopSpeaking(); startListening() }
  }

  const toggleCard = (id: string) => setExpandedCardId(expandedCardId === id ? null : id)

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-fade-in-up">
      <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 flex-shrink-0">
        <h3 className="font-bold text-slate-700 text-lg md:text-xl flex items-center gap-2 md:gap-3 shrink-0">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Brain size={24} className="text-purple-600"/>
          </div>
          Analizador Inteligente
        </h3>
        <select 
          className="p-3 md:p-4 bg-slate-50 border-2 border-slate-200 rounded-xl md:rounded-2xl outline-none font-bold text-slate-700 text-sm w-full md:w-[400px] focus:bg-white focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all" 
          onChange={(e) => handleSelectChild(e.target.value)}
          value={selectedChild}
        >
          <option value="">🔍 Seleccionar Paciente...</option>
          {listaNinos.map(n => <option key={n.id} value={n.id}>👤 {n.name}</option>)}
        </select>
      </div>

      {selectedChild ? (
        <div className="flex flex-col gap-3 md:gap-6">

            {/* ── TABS MÓVIL ── */}
            <div className="flex lg:hidden gap-1 bg-slate-100 p-1 rounded-2xl flex-shrink-0">
              {([
                { id: 'chat' as const,    label: '🤖 IA Chat'  },
                { id: 'history' as const, label: '📋 Historial' },
                { id: 'reports' as const, label: '📄 Reportes'  },
                { id: 'graficas' as const,label: '📊 Gráficas'  },
              ]).map(t => (
                <button key={t.id} onClick={() => setMobileTab(t.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${mobileTab === t.id ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── REPORTES (desktop: top bar, mobile: tab) ── */}
            <div className={`flex-shrink-0 ${mobileTab !== 'reports' ? 'hidden lg:block' : ''}`}>
              <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowReportPanel(!showReportPanel)}
                  className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <span className="font-black text-slate-700 text-sm uppercase tracking-widest">
                      Reportes Word Generados
                    </span>
                    {reportesHistorial.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-black shadow-sm">
                        {reportesHistorial.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${showReportPanel ? 'rotate-180' : ''}`}
                  />
                </button>

                {showReportPanel && (
                  <div className="border-t border-slate-100 p-4 md:p-5">
                    {loadingReportes ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-bold">Cargando reportes...</span>
                      </div>
                    ) : reportesHistorial.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <FileText size={36} className="text-slate-200 mb-3" />
                        <p className="text-sm font-black text-slate-400">Sin reportes Word generados</p>
                        <p className="text-xs text-slate-300 mt-1.5 text-center max-w-xs">
                          Los reportes aparecerán aquí cuando los generes desde Evaluaciones
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {reportesHistorial.map((rep) => (
                          <ReporteHistorialCard key={rep.id} reporte={rep} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

            {/* ANAMNESIS (solo desktop XL) */}
            <div className="hidden xl:flex xl:col-span-3 bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex-col">
                <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100 font-extrabold text-slate-700 text-xs uppercase tracking-[0.2em] flex items-center gap-2 sticky top-0 z-10">
                    <FileText size={16} className="text-blue-600"/> Ficha de Ingreso
                </div>
                <div className="p-4 md:p-6 space-y-5">
                    {historyData.anamnesis ? Object.entries(historyData.anamnesis).slice(0, 15).map(([key, value]: any) => (
                      <div key={key} className="group hover:bg-slate-50 p-3 rounded-xl transition-all">
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-wider">{key.replace(/_/g, ' ')}</span>
                            <p className="text-sm text-slate-700 font-bold leading-tight">{String(value)}</p>
                      </div>
                    )) : (
                        <div className="text-center py-20">
                            <FileText className="mx-auto text-slate-200 mb-3" size={48}/>
                            <p className="text-xs text-slate-300 mt-2">No hay datos</p>
                        </div>
                    )}
                </div>
            </div>            {/* HISTORIAL (desktop: columna fija, mobile: tab) */}
            <div className={`col-span-1 lg:col-span-7 xl:col-span-5 bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col
              ${mobileTab === 'history' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                      <History size={18} className="text-orange-500"/> 
                      Registro Clínico
                    </span>
                    <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">
                      {historyData.aba.length + historyData.entorno.length} Registros
                    </span>
                </div>
                
                <div className="p-4 md:p-6 space-y-4 bg-slate-50/50">
                   {historyData.entorno.map((visita: any) => {
                        const isExpanded = expandedCardId === `entorno-${visita.id}`
                        const d = visita.datos || {}

                        return (
                            <div key={`entorno-${visita.id}`} className={`bg-gradient-to-br from-green-50 to-white rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 ${isExpanded ? 'border-green-400 shadow-xl ring-4 ring-green-50' : 'border-green-100 hover:border-green-200'}`}>
                                <div className="p-4 md:p-5 cursor-pointer flex items-center justify-between" onClick={() => toggleCard(`entorno-${visita.id}`)}>
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center bg-green-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg">
                                            <Home size={20}/>
                                            <span className="text-[10px] font-bold uppercase opacity-80 mt-1">Hogar</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="text-sm font-black text-slate-700 truncate">Visita Domiciliaria</p>
                                            <span className="text-xs text-green-600 font-bold">{visita.fecha_visita}</span>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-full transition-all ${isExpanded ? 'bg-green-600 text-white rotate-180' : 'bg-green-50 text-green-400'}`}>
                                      <ChevronDown size={20}/>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 pt-0 border-t border-green-50 bg-white animate-fade-in">
                                        <div className="flex flex-col gap-4 mt-6">
                                            <DetailBox title="Personas Presentes" content={d.personas_presentes} icon={<Users size={14}/>} color="bg-blue-50 border-blue-100 text-blue-900" full/>
                                            <DetailBox title="Comportamiento" content={d.comportamiento_observado} icon={<Eye size={14}/>} color="bg-purple-50 border-purple-100 text-purple-900" full/>
                                            <DetailBox title="Impresión IA" content={d.impresion_general} icon={<Brain size={14}/>} color="bg-indigo-50 border-indigo-100 text-indigo-900" full/>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <DetailBox title="Barreras" content={d.barreras_identificadas} icon={<ShieldAlert size={14}/>} color="bg-red-50 border-red-100 text-red-900"/>
                                                <DetailBox title="Facilitadores" content={d.facilitadores} icon={<CheckCircle2 size={14}/>} color="bg-green-50 border-green-100 text-green-900"/>
                                            </div>

                                            <DetailBox title="Mensaje Padres" content={d.mensaje_padres_entorno} icon={<MessageCircle size={14}/>} color="bg-green-50 border-green-100 text-green-900" full/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {historyData.aba.map((sesion: any) => {
                        const isExpanded = expandedCardId === `aba-${sesion.id}`
                        const d = sesion.datos || {}

                        return (
                            <div key={`aba-${sesion.id}`} className={`bg-white rounded-2xl md:rounded-[1.5rem] border-2 transition-all duration-300 ${isExpanded ? 'border-blue-400 shadow-xl ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                <div className="p-5 cursor-pointer flex items-center justify-between" onClick={() => toggleCard(`aba-${sesion.id}`)}>
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="flex flex-col items-center justify-center bg-slate-800 text-white rounded-xl p-3 min-w-[70px] shadow-lg">
                                            <span className="text-[10px] font-bold uppercase opacity-60">
                                              {new Date(sesion.fecha_sesion).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-black">{new Date(sesion.fecha_sesion).getDate() + 1}</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="text-sm font-black text-slate-700 truncate">{d.conducta || "Sesión ABA"}</p>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-full transition-all ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                      <ChevronDown size={20}/>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 pt-0 border-t border-slate-50 bg-white animate-fade-in">
                                        <div className="flex flex-col gap-4 mt-6">
                                            <DetailBox title="Objetivo" content={d.objetivo_principal} icon={<Target size={14}/>} color="bg-blue-50 border-blue-100 text-blue-900" full/>
                                            <DetailBox title="Observaciones" content={d.observaciones_tecnicas} icon={<Eye size={14}/>} color="bg-slate-50 border-slate-100" full/>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <DetailBox title="ABC" content={d.antecedente} icon={<Activity size={14}/>} color="bg-purple-50 border-purple-100 text-purple-900"/>
                                                <DetailBox title="Intervención" content={d.estrategias_manejo} icon={<Zap size={14}/>} color="bg-orange-50 border-orange-100 text-orange-900"/>
                                            </div>

                                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <MessageCircle size={12} className="text-amber-600"/>
                                                <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Mensaje Padres</span>
                                                <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[9px] font-black rounded-full border border-amber-300">⏳ En Bandeja</span>
                                              </div>
                                              <p className="text-xs text-amber-700 italic">"{d.mensaje_padres}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    
                    {(historyData.aba.length === 0 && historyData.entorno.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                        <History size={80} className="mb-6"/>
                        <p className="text-lg font-black uppercase tracking-[0.3em]">Sin Registros</p>
                      </div>
                    )}
                </div>
            </div>

            {/* CHAT IA (desktop: columna, mobile: tab chat) */}
            <div className={`col-span-1 lg:col-span-5 xl:col-span-4 bg-white rounded-3xl md:rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col
              ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shadow-lg">
                   <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles size={22}/>
                        </div>
                        <div>
                            <span className="font-black text-sm uppercase tracking-widest">Asistente IA</span>
                            <span className="text-[10px] text-green-400 font-bold uppercase flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> 
                             {speaking ? '🔊 Hablando...' : 'IA clinica v4.0'}
                            </span>
                        </div>
                    </div>
                    {/* Botón silenciar */}
                    <button onClick={toggleVoice} title={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
                      className="p-2 rounded-xl hover:bg-white/10 transition-all"
                      style={{ color: voiceEnabled ? '#86efac' : '#94a3b8' }}>
                      {voiceEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                    </button>
                </div>

                {/* Banner escuchando */}
                {listening && (
                  <div className="mx-4 mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 bg-red-50 border-2 border-red-200">
                    <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 animate-pulse">
                      <Mic size={13} className="text-white"/>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-red-700">Escuchando...</p>
                      <p className="text-[10px] text-red-500 font-medium">Habla ahora, se enviará automáticamente</p>
                    </div>
                    <button onClick={stopListening} className="p-1.5 rounded-xl bg-red-100 hover:bg-red-200 transition-all">
                      <StopCircle size={14} className="text-red-600"/>
                    </button>
                  </div>
                )}
                
                <div 
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 bg-gradient-to-br from-slate-50 to-white" 
                  ref={chatContainerRef}
                >
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[90%] p-4 rounded-2xl md:rounded-[1.5rem] text-sm leading-relaxed shadow-md ${
                              m.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border-b-4 border-blue-800' 
                                : 'bg-white border-2 border-slate-200 text-slate-700 rounded-bl-none'
                            }`}>
                                {m.role === 'ai' ? (
                                  <p className="font-medium whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                    __html: m.text
                                      .replace(/\*\*(.*?)\*\*/g, '<b class="font-black">$1</b>')
                                      .replace(/\n/g, '<br/>')
                                  }}></p>
                                ) : m.text}
                            </div>
                        </div>
                    ))}
                    {typing && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={16}/>
                          <span className="text-xs font-bold text-slate-400">Analizando...</span>
                        </div>
                      </div>
                    )}
                </div>

                <div className="p-4 md:p-5 border-t-2 border-slate-200 bg-white flex gap-2 shadow-lg">
                    <input 
                        className="flex-1 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        style={{
                          background: listening ? '#fef2f2' : '#f8fafc',
                          borderColor: listening ? '#fca5a5' : '#e2e8f0',
                        }}
                        placeholder={listening ? '🎤 Escuchando...' : 'Pregunta sobre evolución...'}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !listening && sendMessage()}
                        disabled={listening}
                    />
                    {/* Botón micrófono */}
                    {micSupported && (
                      <button
                        onClick={handleMicClick}
                        disabled={typing}
                        title={listening ? 'Detener grabación' : 'Hablar con IA'}
                        className="p-4 rounded-2xl transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                        style={{
                          background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#f1f5f9',
                          boxShadow: listening ? '0 4px 14px rgba(239,68,68,.4)' : 'none',
                        }}>
                        {listening
                          ? <MicOff size={18} className="text-white"/>
                          : <Mic size={18} className="text-slate-500"/>
                        }
                      </button>
                    )}
                    {/* Botón enviar / detener voz */}
                    {speaking ? (
                      <button onClick={stopSpeaking} title="Detener voz"
                        className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition shadow-xl animate-pulse">
                        <StopCircle size={20}/>
                      </button>
                    ) : (
                      <button 
                        onClick={sendMessage} 
                        disabled={!input.trim() || listening}
                        className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl hover:scale-105 active:scale-95 transition shadow-xl disabled:opacity-50"
                      >
                        <Send size={20}/>
                      </button>
                    )}
                </div>
                {micSupported && (
                  <p className="text-center text-[10px] text-slate-300 pb-2 font-medium">
                    {listening ? '🔴 Grabando · Habla claro' : '🎤 Micrófono disponible · Enter o botón para enviar'}
                  </p>
                )}
            </div>
            </div>{/* end main grid */}

            {/* ── PANEL GRÁFICAS (mobile tab) ── */}
            {mobileTab === 'graficas' && (
              <div className="lg:hidden flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-violet-50 rounded-xl">
                    <span className="text-lg">📊</span>
                  </div>
                  <span className="font-black text-slate-700 text-sm uppercase tracking-widest">Gráficas ABA</span>
                </div>
                <ProgresoGraficas childId={selectedChild} modoParent={false} />
              </div>
            )}

            {/* ── PANEL GRÁFICAS (desktop: siempre visible como columna extra) ── */}
            <div className="hidden lg:block flex-shrink-0 w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-violet-50 rounded-xl">
                  <span className="text-lg">📊</span>
                </div>
                <span className="font-black text-slate-700 text-sm uppercase tracking-widest">Gráficas ABA</span>
              </div>
              <ProgresoGraficas childId={selectedChild} modoParent={false} />
            </div>

        </div>
      ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-40">
              <Brain size={120} className="mb-8 text-slate-200"/>
              <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-300">Seleccionar Paciente</p>
          </div>
      )}
    </div>
  )
}

// ==============================================================================
// SUBCOMPONENTE: TARJETA DE REPORTE EN HISTORIAL
// ==============================================================================
const COLORES_REPORTE: Record<string, string> = {
  aba:           'from-purple-500 to-purple-600',
  anamnesis:     'from-blue-500 to-blue-600',
  entorno_hogar: 'from-green-500 to-green-600',
  brief2:        'from-indigo-500 to-indigo-600',
  ados2:         'from-teal-500 to-teal-600',
  vineland3:     'from-emerald-500 to-emerald-600',
  wiscv:         'from-violet-500 to-violet-600',
  basc3:         'from-rose-500 to-rose-600',
}

const BADGE_REPORTE: Record<string, string> = {
  aba:           'bg-purple-100 text-purple-700 border-purple-200',
  anamnesis:     'bg-blue-100 text-blue-700 border-blue-200',
  entorno_hogar: 'bg-green-100 text-green-700 border-green-200',
  brief2:        'bg-indigo-100 text-indigo-700 border-indigo-200',
  ados2:         'bg-teal-100 text-teal-700 border-teal-200',
  vineland3:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  wiscv:         'bg-violet-100 text-violet-700 border-violet-200',
  basc3:         'bg-rose-100 text-rose-700 border-rose-200',
}

function ReporteHistorialCard({ reporte }: { reporte: any }) {
  const handleDownload = async () => {
    try {
      const { data, error } = await supabase
        .from('reportes_generados')
        .select('file_data, nombre_archivo')
        .eq('id', reporte.id)
        .single()
      if (error) throw error
      const byteChars = atob(data.file_data)
      const bytes = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = data.nombre_archivo
      document.body.appendChild(a); a.click()
      URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch {
      alert('Error al descargar el reporte')
    }
  }

  const gradiente = COLORES_REPORTE[reporte.tipo_reporte] || 'from-slate-500 to-slate-600'
  const badge     = BADGE_REPORTE[reporte.tipo_reporte]   || 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="bg-white border-2 border-slate-100 hover:border-blue-300 hover:shadow-lg rounded-2xl overflow-hidden transition-all duration-200 group">
      {/* Barra superior con color del tipo */}
      <div className={`bg-gradient-to-r ${gradiente} p-4 flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xs truncate">{reporte.titulo}</p>
          <p className="text-white/70 text-[10px] font-bold mt-0.5">
            {(reporte.tamano_bytes / 1024).toFixed(0)} KB
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2.5">
        <span className={`inline-flex text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${badge}`}>
          {reporte.tipo_reporte}
        </span>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
          <Clock size={10} />
          <span>
            {new Date(reporte.fecha_generacion).toLocaleDateString('es-PE', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>

        {reporte.generado_por && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
            <User size={10} />
            <span>{reporte.generado_por}</span>
          </div>
        )}

        <button
          onClick={handleDownload}
          className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${gradiente} text-white rounded-xl font-black text-xs transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95`}
        >
          <Download size={14} />
          Descargar .docx
        </button>
      </div>
    </div>
  )
}

function DetailBox({ title, content, icon, color, full }: any) {
    const safeContent = content ? String(content) : ""; 
    const isEmpty = safeContent === "" || safeContent === "undefined";
    const finalStyle = isEmpty ? "bg-slate-50 border-slate-100 text-slate-400" : color;

    return (
        <div className={`p-4 rounded-2xl border ${finalStyle} shadow-sm transition-all ${full ? 'w-full' : ''}`}>
            <p className={`font-black uppercase mb-2 flex items-center gap-2 text-[10px] tracking-widest`}>
              {icon} {title}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {isEmpty ? "SIN REGISTRO" : safeContent}
            </p>
        </div>
    )
}


export default AIReportView
