'use client'

import { useI18n } from '@/lib/i18n-context'
// Buscador de diagnósticos CIE-11 / DSM-5 integrado en el cerebro de ARIA
// Aparece en la vista de Cerebro IA

import { useState } from 'react'
import { Search, X, Copy, Check } from 'lucide-react'

const DIAGNOSTICOS = [
  // Neurodesarrollo (más relevantes para Jugando Aprendo)
  { cie11: '6A02', dsm5: '299.00', nombre: 'Trastorno del Espectro Autista (TEA)',           area: 'Neurodesarrollo', desc: 'Déficits persistentes en comunicación e interacción social, patrones restrictivos y repetitivos de comportamiento.' },
  { cie11: '6A02.0', dsm5: '299.00', nombre: 'TEA sin discapacidad intelectual',            area: 'Neurodesarrollo', desc: 'Sin discapacidad intelectual acompañante ni trastorno del lenguaje funcional.' },
  { cie11: '6A02.1', dsm5: '299.00', nombre: 'TEA con discapacidad intelectual',            area: 'Neurodesarrollo', desc: 'Con discapacidad intelectual acompañante.' },
  { cie11: '6A05',   dsm5: '314.01', nombre: 'TDAH — Presentación combinada',               area: 'Neurodesarrollo', desc: 'Inatención + hiperactividad/impulsividad durante ≥6 meses.' },
  { cie11: '6A05.0', dsm5: '314.00', nombre: 'TDAH — Predominio inatento',                  area: 'Neurodesarrollo', desc: 'Patrón persistente de inatención sin hiperactividad significativa.' },
  { cie11: '6A05.1', dsm5: '314.01', nombre: 'TDAH — Predominio hiperactivo/impulsivo',     area: 'Neurodesarrollo', desc: 'Hiperactividad e impulsividad sin patrón de inatención significativa.' },
  { cie11: '6A00',   dsm5: '319',    nombre: 'Discapacidad Intelectual (DI)',                area: 'Neurodesarrollo', desc: 'Déficits en funcionamiento intelectual y conducta adaptativa.' },
  { cie11: '6A00.0', dsm5: '319',    nombre: 'DI leve',                                     area: 'Neurodesarrollo', desc: 'CI aprox. 50-69. Habilidades académicas con apoyo.' },
  { cie11: '6A00.1', dsm5: '319',    nombre: 'DI moderada',                                 area: 'Neurodesarrollo', desc: 'CI aprox. 35-49. Requiere apoyo sustancial.' },
  { cie11: '6A00.2', dsm5: '319',    nombre: 'DI grave',                                    area: 'Neurodesarrollo', desc: 'CI aprox. 20-34. Requiere apoyo extenso.' },
  { cie11: '6A01',   dsm5: '315.39', nombre: 'Trastorno del Desarrollo del Lenguaje',       area: 'Neurodesarrollo', desc: 'Dificultades persistentes en la adquisición y uso del lenguaje.' },
  { cie11: '6A01.0', dsm5: '315.32', nombre: 'Trastorno del lenguaje mixto receptivo-expresivo', area: 'Neurodesarrollo', desc: 'Comprensión y expresión del lenguaje afectadas.' },
  { cie11: '6A06',   dsm5: '307.3',  nombre: 'Trastorno de Movimientos Estereotipados',     area: 'Neurodesarrollo', desc: 'Movimientos repetitivos y aparentemente impulsados que interfieren el funcionamiento.' },
  { cie11: '8A05.00',dsm5: '307.20', nombre: 'Trastorno de Tics Provisional',               area: 'Neurodesarrollo', desc: 'Tics motores o vocales simples o múltiples durante <12 meses.' },
  { cie11: '8A05.01',dsm5: '307.22', nombre: 'Trastorno de Tics Motor Crónico',             area: 'Neurodesarrollo', desc: 'Tics motores múltiples, >12 meses.' },
  { cie11: '8A05.02',dsm5: '307.23', nombre: 'Síndrome de Tourette',                        area: 'Neurodesarrollo', desc: 'Tics motores múltiples + al menos 1 tic vocal.' },
  // Ansiedad y emocional
  { cie11: '6B00',   dsm5: '300.02', nombre: 'Trastorno de Ansiedad Generalizada (TAG)',    area: 'Ansiedad', desc: 'Ansiedad y preocupación excesivas, difíciles de controlar, sobre múltiples eventos.' },
  { cie11: '6B01',   dsm5: '300.23', nombre: 'Trastorno de Ansiedad Social (Fobia Social)', area: 'Ansiedad', desc: 'Miedo intenso a situaciones sociales de evaluación por otros.' },
  { cie11: '6B03',   dsm5: '309.21', nombre: 'Trastorno de Ansiedad por Separación',        area: 'Ansiedad', desc: 'Miedo o ansiedad excesivos ante la separación de figuras de apego.' },
  { cie11: '6B04',   dsm5: '300.29', nombre: 'Fobia Específica',                            area: 'Ansiedad', desc: 'Miedo o ansiedad intensos ante un objeto o situación específica.' },
  // TOC y relacionados
  { cie11: '6B20',   dsm5: '300.3',  nombre: 'TOC — Trastorno Obsesivo Compulsivo',         area: 'TOC', desc: 'Obsesiones y/o compulsiones que consumen tiempo y causan malestar significativo.' },
  // Apego y estrés
  { cie11: '6B44',   dsm5: '313.89', nombre: 'Trastorno de Apego Reactivo',                 area: 'Trauma', desc: 'Patrón de comportamiento inhibido, emocionalmente retraído ante cuidadores.' },
  { cie11: '6B43',   dsm5: '313.89', nombre: 'Trastorno de Relación Social Desinhibida',   area: 'Trauma', desc: 'Comportamiento de acercamiento excesivo a extraños.' },
  // Neurológico
  { cie11: '8A60',   dsm5: '345.x',  nombre: 'Epilepsia (Trastornos Epilépticos)',          area: 'Neurológico', desc: 'Predisposición del cerebro a generar crisis epilépticas de forma recurrente.' },
  // Comunicación
  { cie11: '6A80',   dsm5: '315.35', nombre: 'Tartamudeo (Disfluencia del habla infantil)', area: 'Comunicación', desc: 'Alteraciones de la fluidez normal del habla con sonidos/sílabas repetidos.' },
]

const getAreas = (isEN: boolean) => isEN
  ? ['All', 'Neurodevelopment', 'Anxiety', 'OCD', 'Trauma', 'Neurological', 'Communication']
  : ['Todos', 'Neurodesarrollo', 'Ansiedad', 'TOC', 'Trauma', 'Neurológico', 'Comunicación']
// Map EN area back to ES for filtering (data uses ES keys)
const areaEnToEs: Record<string, string> = {
  'All': 'Todos', 'Neurodevelopment': 'Neurodesarrollo', 'Anxiety': 'Ansiedad',
  'OCD': 'TOC', 'Trauma': 'Trauma', 'Neurological': 'Neurológico', 'Communication': 'Comunicación'
}

export default function DiagnosticoBuscador() {
  const { t, locale } = useI18n()
  const isEN = locale === 'en'
  const AREAS = getAreas(isEN)
  const [initialArea] = [isEN ? 'All' : 'Todos']
  const [q, setQ]           = useState('')
  const [area, setArea]     = useState<string>('')
  const [copied, setCopied] = useState<string | null>(null)

  const filtrado = DIAGNOSTICOS.filter(d => {
    const match = q.length < 2 || [d.nombre, d.cie11, d.dsm5, d.desc].some(f =>
      f.toLowerCase().includes(q.toLowerCase())
    )
    const esArea = areaEnToEs[area] || area
    const areaMatch = !area || esArea === 'Todos' || d.area === esArea
    return match && areaMatch
  })

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            {...{placeholder: t('ui.search_diagnosis')}}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-medium border-2 outline-none focus:border-violet-400"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtro por área */}
      <div className="flex flex-wrap gap-1.5">
        {AREAS.map(a => (
          <button key={a} onClick={() => setArea(a)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
              area === a
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-slate-200 text-slate-500 hover:border-violet-300'
            }`}
            style={area !== a ? { background: 'var(--card)' } : {}}>
            {a}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {filtrado.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No se encontraron diagnósticos para "{q}"
          </p>
        )}
        {filtrado.map(d => (
          <div key={d.cie11} className="rounded-xl p-3 border transition-all hover:shadow-sm"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {d.nombre}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{d.desc}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => copiar(`${d.nombre} | CIE-11: ${d.cie11} | DSM-5: ${d.dsm5}`, d.cie11)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:bg-violet-50"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
                  title={t('ui.copy_for_aria')}>
                  {copied === d.cie11 ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-100 text-violet-700">
                CIE-11: {d.cie11}
              </span>
              {d.dsm5 !== 'N/A' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-700">
                  DSM-5: {d.dsm5}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                {d.area}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        {filtrado.length} de {DIAGNOSTICOS.length} diagnósticos · CIE-11 (OMS, 2022) + DSM-5-TR (APA, 2022)
      </p>
    </div>
  )
}
