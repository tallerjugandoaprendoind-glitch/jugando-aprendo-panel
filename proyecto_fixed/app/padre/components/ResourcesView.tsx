'use client'

import { useState } from 'react'
import {
  Book, CheckCircle2, ChevronRight, Download, ExternalLink, Eye, FileText, Headphones, Heart, Image as ImageIcon, PlayCircle, Share2, Sparkles, Video, X
} from 'lucide-react'

function ResourcesView() {
    const [selectedResource, setSelectedResource] = useState<any>(null)
    const resources = [
        {
            id: 1,
            title: "Guía: Primeros pasos en ABA",
            description: "Conoce los fundamentos de la terapia ABA y cómo apoyar desde casa",
            icon: <Book className="text-blue-600"/>,
            type: "PDF",
            color: "bg-blue-50 border-blue-200",
            content: {
                sections: [
                    {
                        title: "¿Qué es ABA?",
                        text: "El Análisis Conductual Aplicado (ABA) es una terapia basada en evidencia científica que utiliza principios del aprendizaje para mejorar conductas socialmente significativas."
                    },
                    {
                        title: "Principios básicos",
                        text: "• Reforzamiento positivo\n• Enseñanza estructurada\n• Generalización de habilidades\n• Medición objetiva del progreso"
                    },
                    {
                        title: "Tu rol como padre/madre",
                        text: "Eres el miembro más importante del equipo. Tu participación activa y aplicación de estrategias en casa acelera significativamente el progreso de tu hijo/a."
                    }
                ]
            }
        },
        {
            id: 2,
            title: "Video: Técnicas de reforzamiento",
            description: "Aprende a reforzar conductas positivas efectivamente",
            icon: <Video className="text-purple-600"/>,
            type: "Video",
            color: "bg-purple-50 border-purple-200",
            content: {
                videoUrl: "https://www.youtube.com/embed/hW4dN1JTO98?si=5_66N3udoS1Gkahh",
                sections: [
                    {
                        title: "Tipos de reforzadores",
                        text: "• Sociales: elogios, abrazos, sonrisas\n• Tangibles: juguetes, stickers\n• Comestibles: snacks favoritos\n• Actividades: tiempo de juego preferido"
                    },
                    {
                        title: "Cuándo reforzar",
                        text: "Inmediatamente después de la conducta deseada. La consistencia y el timing son cruciales para el aprendizaje efectivo."
                    }
                ]
            }
        },
        {
            id: 3,
            title: "Artículo: Manejo de berrinches",
            description: "Estrategias probadas para regular emociones intensas",
            icon: <Heart className="text-pink-600"/>,
            type: "Artículo",
            color: "bg-pink-50 border-pink-200",
            content: {
                sections: [
                    {
                        title: "Prevención",
                        text: "• Establecer rutinas predecibles\n• Anticipar transiciones\n• Enseñar habilidades de comunicación\n• Identificar detonantes"
                    },
                    {
                        title: "Durante el berrinche",
                        text: "Mantén la calma, asegura la seguridad, evita reforzar la conducta inadecuada, y espera a que termine para reconectar."
                    },
                    {
                        title: "Después",
                        text: "Ayuda a tu hijo/a a identificar emociones, enseña alternativas apropiadas, y refuerza cuando use estrategias adecuadas."
                    }
                ]
            }
        },
        {
            id: 4,
            title: "Checklist: Rutinas diarias",
            description: "Estructura el día de tu hijo con rutinas visuales",
            icon: <CheckCircle2 className="text-green-600"/>,
            type: "PDF",
            color: "bg-green-50 border-green-200",
            content: {
                sections: [
                    {
                        title: "Rutina de mañana",
                        text: "☐ Despertarse\n☐ Ir al baño\n☐ Lavarse dientes\n☐ Vestirse\n☐ Desayunar\n☐ Preparar mochila"
                    },
                    {
                        title: "Rutina de tarde",
                        text: "☐ Llegar a casa\n☐ Snack\n☐ Tiempo de terapia/tarea\n☐ Juego libre\n☐ Cena\n☐ Tiempo familiar"
                    },
                    {
                        title: "Rutina de noche",
                        text: "☐ Baño\n☐ Pijama\n☐ Cepillado de dientes\n☐ Cuento\n☐ Dormir"
                    }
                ]
            }
        }
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                        <Book className="text-purple-600" size={28}/>
                    </div>
                    Biblioteca de Recursos
                </h2>
                <p className="text-slate-500 font-medium">Material educativo para familias</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource) => (
                    <div 
                        key={resource.id} 
                        className={`${resource.color} p-6 rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all group cursor-pointer hover:scale-105 active:scale-95`}
                        onClick={() => setSelectedResource(resource)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                {resource.icon}
                            </div>
                            <span className="text-xs font-bold px-3 py-1 bg-white rounded-full shadow-sm">{resource.type}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">{resource.title}</h3>
                        <p className="text-sm text-slate-600 font-medium mb-4">{resource.description}</p>
                        <button className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors hover:gap-3">
                            <Eye size={16}/> Ver contenido
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 opacity-10">
                    <Sparkles size={120}/>
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-3">¿Necesitas más apoyo?</h3>
                    <p className="text-indigo-100 mb-6 font-medium">Únete a nuestra comunidad de familias y accede a webinars exclusivos</p>
                    <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                        Unirme ahora
                    </button>
                </div>
            </div>

            {/* MODAL RECURSO */}
            {selectedResource && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {selectedResource.icon}
                                <div>
                                    <span className="text-xs font-bold opacity-75 uppercase tracking-wide">{selectedResource.type}</span>
                                    <h3 className="font-bold text-lg">{selectedResource.title}</h3>
                                </div>
                            </div>
                            <button onClick={()=>setSelectedResource(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            {selectedResource.content.videoUrl && (
                                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={selectedResource.content.videoUrl}
                                        title={selectedResource.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {selectedResource.content.sections.map((section: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <ChevronRight size={18} className="text-blue-600"/>
                                        {section.title}
                                    </h4>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                        {section.text}
                                    </p>
                                </div>
                            ))}

                            <div className="flex gap-3">
                                <button 
                                    onClick={()=>alert('Funcionalidad de descarga próximamente')}
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                                >
                                    <Download size={18}/> Descargar {selectedResource.type}
                                </button>
                                <button 
                                    onClick={()=>alert('Funcionalidad de compartir próximamente')}
                                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                                >
                                    <Share2 size={18}/> Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


export default ResourcesView
