'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  Heart, Users, MapPin, CheckCircle, ArrowRight, HelpCircle, 
  Brain, Calendar, Sparkles, LineChart, MessageSquareHeart,
  Star, Award, Clock, Phone, Mail, Instagram, Facebook, ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  // Scroll suave a secciones
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-blue-100 overflow-x-hidden">
        
        {/* Botón WhatsApp */}
        <a 
          href="https://wa.me/51924807183" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:bg-green-600 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
          style={{ animation: 'bounce-gentle 3s ease-in-out infinite' }}
        >
          <Phone className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full" />
        </a>

        {/* Navegación */}
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
        }`}>
          <div className="flex justify-between items-center p-4 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12">
                 <Image 
                   src="/images/logo.png?v=2" 
                   alt="Logo Jugando Aprendo" 
                   fill
                   className="object-contain"
                   priority
                   unoptimized
                 />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
                  Jugando Aprendo
                </span>
                <span className="text-xs text-gray-500 font-medium hidden sm:block">Centro de Desarrollo Infantil</span>
              </div>
            </div>

            <div className="hidden md:flex gap-6 text-sm font-semibold">
              <a href="#ia-innovacion" className="text-gray-600 hover:text-blue-600 transition">
                Innovación IA
              </a>
              <a href="#servicios" className="text-gray-600 hover:text-blue-600 transition">Servicios</a>
              <a href="#nosotros" className="text-gray-600 hover:text-blue-600 transition">Nosotros</a>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition">Preguntas</a>
            </div>

            <div className="flex gap-3">
              <Link href="/login" className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition">
                Ingresar
              </Link>
              <Link href="/login?mode=signup" className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-md hover:shadow-lg">
                Registrarse
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-16 px-6 bg-gradient-to-b from-blue-50/50 to-white">
          {/* Elementos decorativos sutiles */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/20 rounded-full filter blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }} />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-200/20 rounded-full filter blur-3xl" style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }} />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider">
                <Heart size={14} className="fill-current" /> Terapia + Tecnología + Amor
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Impulsando el potencial de{' '}
                <span className="text-blue-600">mentes brillantes</span>.
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Centro especializado en neurodivergencia en Pisco. Combinamos la evidencia científica ABA con el corazón de nuestra familia y la innovación de la Inteligencia Artificial.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login?mode=signup" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Empezar Ahora <ArrowRight size={18} />
                </Link>

                <button 
                  onClick={() => scrollToSection('ia-innovacion')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-bold hover:bg-purple-50 hover:border-purple-300 transition"
                >
                  <Sparkles size={18} /> Ver Innovación IA
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                  <span className="font-semibold text-sm">Metodología ABA</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Star className="text-blue-600 fill-blue-600" size={20} />
                  </div>
                  <span className="font-semibold text-sm">+50 Familias</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Award className="text-purple-600" size={20} />
                  </div>
                  <span className="font-semibold text-sm">Certificados</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-3xl filter blur-2xl" />
              
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-105 rotate-2 hover:rotate-0 transition-all duration-500">
                 <Image
                   src="/images/hero-image.jpg?v=2" 
                   alt="Niños aprendiendo en terapia"
                   fill
                   className="object-cover"
                   priority
                   unoptimized
                 />
                 
                 <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur py-3 px-5 rounded-xl text-sm font-bold text-blue-900 shadow-lg flex items-center gap-2">
                   <CheckCircle size={18} className="text-green-500" /> 
                   Metodología ABA
                 </div>

                 <div className="absolute top-6 left-6 bg-blue-600 text-white py-2 px-4 rounded-xl shadow-lg">
                   <div className="text-2xl font-bold">100%</div>
                   <div className="text-xs font-semibold">Personalizado</div>
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sección IA */}
        <section id="ia-innovacion" className="py-24 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 text-sm font-bold mb-6">
                <Sparkles size={16} /> Tecnología al servicio del desarrollo
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Tu copiloto inteligente: <span className="text-blue-400">IA con datos reales</span>
              </h2>
              
              <p className="text-xl text-blue-100/90 max-w-3xl mx-auto leading-relaxed">
                No estás solo entre sesiones. Nuestra plataforma utiliza Inteligencia Artificial que aprende exclusivamente de los registros clínicos diarios de tu hijo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <LineChart className="text-blue-300" size={28} />
                </div>
                <h4 className="font-bold text-xl mb-3">Seguimiento Preciso</h4>
                <p className="text-blue-100/70">La IA analiza tendencias en la conducta y el aprendizaje sesión tras sesión.</p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300">
                <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquareHeart className="text-purple-300" size={28} />
                </div>
                <h4 className="font-bold text-xl mb-3">Apoyo para Padres</h4>
                <p className="text-blue-100/70">Recibe resúmenes fáciles de entender y recomendaciones personalizadas para casa.</p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-green-400/50 transition-all duration-300">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Brain className="text-green-300" size={28} />
                </div>
                <h4 className="font-bold text-xl mb-3">Progreso Visible</h4>
                <p className="text-blue-100/70">Gráficos interactivos que muestran la evolución de tu hijo en tiempo real.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nosotros */}
        <section id="nosotros" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Más que un centro, una familia
            </h2>

            <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto">
              En <strong className="text-blue-600">Jugando Aprendo</strong>, entendemos que cada niño es un universo único. 
              Nuestro enfoque combina la rigurosidad del análisis conductual (ABA) con la calidez humana que tu familia merece.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-blue-600 mb-2">+50</div>
                <div className="text-sm text-gray-700 font-semibold">Familias Felices</div>
              </div>

              <div className="p-6 rounded-2xl bg-pink-50 border border-pink-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-pink-600 mb-2">100%</div>
                <div className="text-sm text-gray-700 font-semibold">Personalizado</div>
              </div>

              <div className="p-6 rounded-2xl bg-green-50 border border-green-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-green-600 mb-2">ABA</div>
                <div className="text-sm text-gray-700 font-semibold">Metodología</div>
              </div>

              <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100 hover:shadow-lg transition-shadow">
                <div className="text-4xl font-bold text-purple-600 mb-2">Pisco</div>
                <div className="text-sm text-gray-700 font-semibold">Sede Central</div>
              </div>
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
              <p className="text-lg text-gray-600">Soluciones integrales para el desarrollo</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Servicio 1 */}
              <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">Terapia ABA</h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Intervención basada en evidencia para mejorar habilidades sociales, comunicación y aprendizaje.
                </p>

                <button 
                  onClick={() => scrollToSection('faq')}
                  className="flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
                >
                  Conocer más <ArrowRight size={18} />
                </button>
              </div>

              {/* Servicio 2 - Destacado */}
              <div className="group bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-white relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                  Popular
                </div>

                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/30 group-hover:scale-110 transition-transform">
                  <Users size={28} className="text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">Habilidades Sociales</h3>
                
                <p className="text-blue-50 mb-6 leading-relaxed">
                  Talleres grupales donde los niños aprenden a interactuar en un entorno seguro y estimulante.
                </p>

                <button 
                  onClick={() => scrollToSection('faq')}
                  className="flex items-center gap-2 font-semibold hover:gap-3 transition-all"
                >
                  Conocer más <ArrowRight size={18} />
                </button>
              </div>

              {/* Servicio 3 */}
              <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">Escuela para Padres</h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Capacitación constante para que las familias sean parte activa del progreso de sus hijos.
                </p>

                <button 
                  onClick={() => scrollToSection('faq')}
                  className="flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all"
                >
                  Conocer más <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
              <p className="text-lg text-gray-600">Resolvemos tus dudas más comunes</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "¿A qué edad pueden empezar las terapias?",
                  a: "Atendemos niños desde los 1 año en adelante. La intervención temprana es clave para obtener mejores resultados. Nuestro equipo especializado adapta las sesiones según la edad y necesidades específicas de cada niño."
                },
                {
                  q: "¿Cómo puedo conocer el progreso de mi hijo?",
                  a: "Utilizamos una aplicación web exclusiva donde podrás ver reportes diarios, gráficos de avance y observaciones detalladas de cada sesión. Además, nuestra IA genera resúmenes semanales personalizados con insights y recomendaciones."
                },
                {
                  q: "¿Qué metodología utilizan?",
                  a: "Trabajamos con la metodología ABA (Applied Behavior Analysis), reconocida mundialmente como el enfoque más efectivo basado en evidencia científica para el tratamiento de la neurodivergencia."
                },
                {
                  q: "¿Qué es la terapia ABA y por qué la usamos?",
                  a: "Es el Análisis Conductual Aplicado, un método con respaldo científico que ayuda a mejorar conductas y facilitar el aprendizaje. En nuestra App, registramos cada pequeño avance bajo este modelo para medir el progreso real de tu hijo y adaptar sus objetivos semana a semana."
                }
              ].map((faq, i) => (
                <div 
                  key={i}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all bg-white cursor-pointer"
                  onClick={() => toggleAccordion(i)}
                >
                  <div className="flex items-center justify-between p-6">
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-3">
                      <HelpCircle size={20} className="text-blue-500"/>
                      {faq.q}
                    </h4>
                    <ChevronDown 
                      className={`text-gray-400 transition-transform duration-300 ${activeAccordion === i ? 'rotate-180' : ''}`} 
                      size={24} 
                    />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === i ? 'max-h-96' : 'max-h-0'}`}>
                    <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h3 className="text-2xl font-bold mb-3">¿Aún tienes dudas?</h3>
              <p className="text-lg mb-6 text-blue-50">Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus preguntas.</p>
              <a 
                href="https://wa.me/51924807183" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
              >
                <Phone size={20} />
                Hablar con un especialista
              </a>
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section id="ubicacion" className="relative h-[500px] bg-gray-100">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.4229091779425!2d-76.0288421240214!3d-13.692817174731204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91104331c0093305%3A0x21adbeb7d8eb168d!2sC.%20Victor%20Raul%20Haya%20de%20la%20Torre%2C%2011641!5e0!3m2!1ses-419!2spe!4v1770256602309!5m2!1ses-419!2spe"
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            className="absolute inset-0 grayscale-[20%]"
          ></iframe>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-20 lg:translate-x-0 bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-6">
            <h3 className="font-bold text-2xl text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="text-red-500"/> Visítanos
            </h3>
            <p className="text-gray-600 mb-6">
              Estamos en Independencia, Pisco. Un ambiente seguro y adaptado para el desarrollo de tus hijos.
            </p>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                <span><strong>Lun - Vie:</strong> 8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-green-600" />
                <span>+51 924 807 183</span>
              </div>
            </div>
            
            <a 
              href="https://maps.app.goo.gl/fv9HhtWj5R45a5paA"
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
            >
              <MapPin size={20} />
              Ver en Google Maps
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10">
                  <Image src="/images/logo.png?v=2" alt="Logo" fill className="object-contain" unoptimized />
                </div>
                <span className="text-white font-bold text-lg">Jugando Aprendo</span>
              </div>
              <p className="text-sm mb-4">Centro especializado en terapia y desarrollo infantil potenciado por IA.</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                  <Instagram size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#ia-innovacion" className="hover:text-white transition">Innovación IA</a></li>
                <li><a href="#servicios" className="hover:text-white transition">Servicios</a></li>
                <li><a href="#nosotros" className="hover:text-white transition">Nosotros</a></li>
                <li><a href="#faq" className="hover:text-white transition">Preguntas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="text-sm mb-2">Independencia, Pisco</p>
              <p className="text-sm mb-2">Ica - Perú</p>
              <p className="text-sm">tallerjugandoaprendoind@gmail.com</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Horarios</h4>
              <p className="text-sm mb-2">Lun - Vie: 8AM - 6PM</p>
              <p className="text-sm text-gray-500">Sabado: Cerrado</p>
              <p className="text-sm text-gray-500">Domingo: Cerrado</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            © 2024 Jugando Aprendo. Todos los derechos reservados.
          </div>
        </footer>

      </div>
    </>
  );
}
