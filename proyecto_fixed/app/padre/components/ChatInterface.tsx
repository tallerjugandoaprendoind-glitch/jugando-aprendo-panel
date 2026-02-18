'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function ChatInterface({ childId, childName }: any) {
    const [messages, setMessages] = useState<any[]>([
        {
            role:'ai', 
            text: `¡Hola! 👋 Soy tu Asistente Clínico Inteligente. He revisado el historial completo de ${childName || 'tu hijo/a'} y estoy aquí para apoyarte en todo momento.\n\n¿En qué puedo ayudarte hoy? Puedo:\n• Explicarte los reportes de las sesiones\n• Darte consejos para actividades en casa\n• Responder dudas sobre el desarrollo\n• Apoyarte emocionalmente en este proceso`
        }
    ])
    const [input, setInput] = useState('')
    const [typing, setTyping] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)
    const quickQuestions = [
        "¿Cómo le fue en la última sesión?",
        "Dame consejos para casa",
        "¿Qué objetivos está trabajando?",
        "Necesito apoyo emocional"
    ]

    const send = async (customText?: string) => {
        const txt = customText || input
        if(!txt.trim()) return
        
        if(!childId) {
            setMessages(p => [...p, {
                role:'ai', 
                text: '⚠️ Un momento, estoy cargando el perfil completo del paciente para poder ayudarte mejor...'
            }])
            return
        }

        setMessages(p => [...p, {role:'user', text: txt}])
        setInput('')
        setTyping(true)

        try {
            const res = await fetch('/api/parent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: txt, 
                    childId: childId,
                    childName: childName
                })
            })
            
            const data = await res.json()
            const aiResponse = data.text || "Lo siento, no pude procesar tu pregunta. ¿Podrías reformularla?"
            
            setMessages(p => [...p, {role:'ai', text: aiResponse}])

        } catch(e) {
            setMessages(p => [...p, {
                role:'ai', 
                text: "❌ Disculpa, hubo un problema de conexión. Por favor, intenta nuevamente en unos momentos."
            }])
        } finally {
            setTyping(false)
        }
    }

    useEffect(() => {
        endRef.current?.scrollIntoView({behavior:'smooth'})
    }, [messages])

    useEffect(() => {
        setMessages([{
            role:'ai', 
            text: `✨ He actualizado mi información con el historial de ${childName || 'tu hijo/a'}. Ahora puedo ayudarte de manera más personalizada. ¿Qué necesitas saber?`
        }])
    }, [childId])

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50/20">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m,i)=>(
                    <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                            m.role==='user'
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md' 
                            : 'bg-white text-slate-700 rounded-bl-md border border-slate-200/60'
                        }`}>
                            {m.role === 'ai' && (
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                                        <Sparkles size={14} className="text-indigo-600"/>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asistente IA</span>
                                </div>
                            )}
                            <p style={{whiteSpace: 'pre-wrap'}} className="font-medium">{m.text}</p>
                        </div>
                    </div>
                ))}
                
                {typing && (
                    <div className="flex items-center gap-3 ml-4">
                        <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                            <Loader2 size={18} className="animate-spin text-indigo-600"/>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600">Analizando historial clínico...</p>
                            <p className="text-[10px] text-slate-400">Esto puede tomar unos segundos</p>
                        </div>
                    </div>
                )}
                
                <div ref={endRef}></div>
            </div>

            {messages.length <= 2 && !typing && (
                <div className="px-6 pb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Preguntas frecuentes:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => send(q)}
                                className="px-4 py-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-2xl text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200/60 flex gap-3 shadow-lg">
                <input 
                    className="flex-1 bg-slate-50 rounded-3xl px-6 py-4 text-sm font-medium outline-none border-2 border-transparent focus:bg-white focus:border-indigo-300 transition-all placeholder:text-slate-400" 
                    value={input} 
                    onChange={e=>setInput(e.target.value)} 
                    onKeyDown={e=>e.key==='Enter' && !typing && send()} 
                    placeholder={`Pregúntame sobre ${childName || 'tu hijo/a'}...`}
                    disabled={typing}
                />
                <button 
                    onClick={() => send()} 
                    disabled={typing || !input.trim()}
                    className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed active:scale-95"
                >
                    <Send size={20}/>
                </button>
            </div>
        </div>
    )
}


export default ChatInterface
