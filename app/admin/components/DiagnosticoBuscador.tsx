'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, X, Loader2, Copy, Check, ChevronDown, ChevronUp,
  AlertCircle, BookOpen, ExternalLink, Zap, Star, Tag, RefreshCw, Wifi, WifiOff
} from 'lucide-react'

// ── Base local de salud mental (fallback cuando la API no está configurada) ──
const LOCAL_DB = [
  { code:'6A02',   title:'Trastorno del Espectro Autista (TEA)',                        chapter:'Neurodesarrollo', definition:'Déficits persistentes en comunicación e interacción social con patrones restrictivos y repetitivos de comportamiento.', dsm5:'299.00 / F84.0' },
  { code:'6A02.0', title:'TEA Nivel 1 — Requiere apoyo',                               chapter:'Neurodesarrollo', definition:'Sin discapacidad intelectual ni trastorno del lenguaje funcional. Requiere apoyo.', dsm5:'299.00 / F84.0' },
  { code:'6A02.1', title:'TEA Nivel 2 — Requiere apoyo sustancial',                    chapter:'Neurodesarrollo', definition:'Con o sin discapacidad intelectual. Requiere apoyo sustancial.', dsm5:'299.00 / F84.0' },
  { code:'6A02.2', title:'TEA Nivel 3 — Requiere apoyo muy sustancial',                chapter:'Neurodesarrollo', definition:'Requiere apoyo muy sustancial. Comunicación verbal mínima o nula.', dsm5:'299.00 / F84.0' },
  { code:'6A05',   title:'TDAH — Trastorno por Déficit de Atención e Hiperactividad',  chapter:'Neurodesarrollo', definition:'Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere con el funcionamiento.', dsm5:'314.01 / F90' },
  { code:'6A05.0', title:'TDAH — Presentación predominantemente inatenta',             chapter:'Neurodesarrollo', definition:'Inatención prominente sin hiperactividad significativa.', dsm5:'314.00 / F90.0' },
  { code:'6A05.1', title:'TDAH — Presentación hiperactiva/impulsiva',                 chapter:'Neurodesarrollo', definition:'Hiperactividad e impulsividad predominantes.', dsm5:'314.01 / F90.1' },
  { code:'6A05.2', title:'TDAH — Presentación combinada',                             chapter:'Neurodesarrollo', definition:'Inatención y hiperactividad-impulsividad ambas presentes.', dsm5:'314.01 / F90.2' },
  { code:'6A00',   title:'Discapacidad Intelectual (DI)',                              chapter:'Neurodesarrollo', definition:'Déficits en funcionamiento intelectual y conducta adaptativa.', dsm5:'319 / F70-F79' },
  { code:'6A00.0', title:'Discapacidad Intelectual Leve',                             chapter:'Neurodesarrollo', definition:'CI aprox. 50-69. Puede vivir semi-independientemente.', dsm5:'317 / F70' },
  { code:'6A00.1', title:'Discapacidad Intelectual Moderada',                         chapter:'Neurodesarrollo', definition:'CI aprox. 35-49. Requiere apoyo sustancial.', dsm5:'318.0 / F71' },
  { code:'6A00.2', title:'Discapacidad Intelectual Grave',                            chapter:'Neurodesarrollo', definition:'CI aprox. 20-34. Requiere apoyo extenso.', dsm5:'318.1 / F72' },
  { code:'6A00.3', title:'Discapacidad Intelectual Profunda',                         chapter:'Neurodesarrollo', definition:'CI <20. Dependencia total.', dsm5:'318.2 / F73' },
  { code:'6A01',   title:'Trastorno del Desarrollo del Lenguaje (TDL)',               chapter:'Neurodesarrollo', definition:'Dificultades persistentes en adquisición y uso del lenguaje.', dsm5:'315.39 / F80' },
  { code:'6A01.2', title:'Trastorno Fonológico — Dislalia',                           chapter:'Neurodesarrollo', definition:'Dificultades en producción fonológica que interfieren la comunicación.', dsm5:'315.39 / F80.0' },
  { code:'6A04',   title:'Trastorno del Desarrollo de la Coordinación (Dispraxia)',   chapter:'Neurodesarrollo', definition:'Habilidades motoras coordinadas por debajo de lo esperado.', dsm5:'315.4 / F82' },
  { code:'6A06',   title:'Trastorno de Movimientos Estereotipados',                   chapter:'Neurodesarrollo', definition:'Movimientos repetitivos sin propósito que interfieren el funcionamiento.', dsm5:'307.3 / F98.4' },
  { code:'6A0Y',   title:'Trastorno Específico del Aprendizaje — Dislexia',          chapter:'Neurodesarrollo', definition:'Dificultades en exactitud, velocidad o comprensión lectora.', dsm5:'315.00 / F81.0' },
  { code:'6A0Z',   title:'Trastorno Específico del Aprendizaje — Discalculia',       chapter:'Neurodesarrollo', definition:'Dificultades en procesamiento numérico y cálculo.', dsm5:'315.1 / F81.2' },
  { code:'6A0X',   title:'Trastorno Específico del Aprendizaje — Disgrafía',         chapter:'Neurodesarrollo', definition:'Dificultades en escritura y ortografía.', dsm5:'315.2 / F81.8' },
  { code:'8A05.02',title:'Síndrome de Tourette',                                      chapter:'Tics', definition:'Múltiples tics motores y al menos un tic vocal.', dsm5:'307.23 / F95.2' },
  { code:'8A05.00',title:'Trastorno de Tics Provisional',                             chapter:'Tics', definition:'Tics motores y/o vocales menos de 12 meses.', dsm5:'307.21 / F95.0' },
  { code:'6B00',   title:'Trastorno de Ansiedad Generalizada (TAG)',                  chapter:'Ansiedad', definition:'Ansiedad y preocupación excesivas durante ≥6 meses.', dsm5:'300.02 / F41.1' },
  { code:'6B01',   title:'Trastorno de Ansiedad Social (Fobia Social)',               chapter:'Ansiedad', definition:'Miedo o ansiedad intensos ante situaciones sociales.', dsm5:'300.23 / F40.1' },
  { code:'6B02',   title:'Trastorno de Pánico',                                      chapter:'Ansiedad', definition:'Ataques de pánico recurrentes inesperados.', dsm5:'300.01 / F41.0' },
  { code:'6B03',   title:'Trastorno de Ansiedad por Separación',                     chapter:'Ansiedad', definition:'Miedo excesivo ante la separación de figuras de apego.', dsm5:'309.21 / F93.0' },
  { code:'6B04',   title:'Fobia Específica',                                         chapter:'Ansiedad', definition:'Miedo desproporcionado ante objeto o situación específica.', dsm5:'300.29 / F40.2' },
  { code:'6B0Y',   title:'Mutismo Selectivo',                                        chapter:'Ansiedad', definition:'Incapacidad de hablar en contextos específicos.', dsm5:'313.23 / F94.0' },
  { code:'6B20',   title:'Trastorno Obsesivo Compulsivo (TOC)',                       chapter:'TOC', definition:'Obsesiones y/o compulsiones que consumen tiempo.', dsm5:'300.3 / F42' },
  { code:'6B25',   title:'Tricotilomanía — Arrancarse el Cabello',                   chapter:'TOC', definition:'Arrancarse el cabello con pérdida capilar.', dsm5:'312.39 / F63.3' },
  { code:'6B24',   title:'Trastorno de Excoriación — Skin Picking',                  chapter:'TOC', definition:'Rascar o arrancar la piel repetidamente.', dsm5:'698.4 / L98.1' },
  { code:'6B22',   title:'Trastorno de Acumulación — Hoarding',                      chapter:'TOC', definition:'Dificultad persistente para deshacerse de posesiones.', dsm5:'300.3 / F42.3' },
  { code:'6B40',   title:'TEPT — Trastorno de Estrés Postraumático',                 chapter:'Trauma', definition:'Síntomas de reexperimentación, evitación e hiperactivación tras trauma.', dsm5:'309.81 / F43.1' },
  { code:'6B41',   title:'Trastorno de Estrés Agudo',                                chapter:'Trauma', definition:'Síntomas de TEPT durante 3-30 días tras trauma.', dsm5:'308.3 / F43.0' },
  { code:'6B43.1', title:'Trastorno de Adaptación',                                  chapter:'Trauma', definition:'Síntomas en respuesta a un estresor identificable.', dsm5:'309.0 / F43.2' },
  { code:'6A70',   title:'Trastorno Depresivo Mayor (TDM)',                           chapter:'Estado de Ánimo', definition:'Episodios depresivos sin historia de manía.', dsm5:'296.xx / F32-F33' },
  { code:'6A71',   title:'Trastorno Depresivo Persistente — Distimia',               chapter:'Estado de Ánimo', definition:'Estado de ánimo depresivo crónico ≥2 años.', dsm5:'300.4 / F34.1' },
  { code:'6A72',   title:'TDDEA — Desregulación Disruptiva del Estado de Ánimo',     chapter:'Estado de Ánimo', definition:'Irritabilidad severa y explosiones ≥3/semana.', dsm5:'296.99 / F34.8' },
  { code:'6A80',   title:'Trastorno Bipolar I',                                      chapter:'Estado de Ánimo', definition:'Al menos un episodio maníaco completo.', dsm5:'296.40 / F31.x' },
  { code:'6A81',   title:'Trastorno Bipolar II',                                     chapter:'Estado de Ánimo', definition:'Episodios hipomaníacos y depresivos. Sin manía.', dsm5:'296.89 / F31.8' },
  { code:'6B80',   title:'Anorexia Nerviosa',                                        chapter:'Alimentación', definition:'Restricción de ingesta con miedo intenso a ganar peso.', dsm5:'307.1 / F50.0' },
  { code:'6B81',   title:'Bulimia Nerviosa',                                         chapter:'Alimentación', definition:'Episodios de atracones y conductas compensatorias.', dsm5:'307.51 / F50.2' },
  { code:'6B82',   title:'Trastorno por Atracón (BED)',                              chapter:'Alimentación', definition:'Atracones recurrentes sin conductas compensatorias.', dsm5:'307.51 / F50.8' },
  { code:'6B83',   title:'ARFID — Evitación/Restricción de Ingesta',                chapter:'Alimentación', definition:'Evitación por características sensoriales o miedo.', dsm5:'307.59 / F50.8' },
  { code:'6B84',   title:'Pica',                                                     chapter:'Alimentación', definition:'Ingestión de sustancias no nutritivas ≥1 mes.', dsm5:'307.52 / F98.3' },
  { code:'7A00',   title:'Insomnio Crónico',                                         chapter:'Sueño', definition:'Dificultad para dormir ≥3 noches/semana durante ≥3 meses.', dsm5:'307.42 / F51.01' },
  { code:'7B00',   title:'Sonambulismo',                                             chapter:'Sueño', definition:'Levantarse y deambular durante el sueño profundo (NREM).', dsm5:'307.46 / F51.3' },
  { code:'7B01',   title:'Terrores Nocturnos',                                       chapter:'Sueño', definition:'Despertar abrupto con terror intenso sin recuerdo.', dsm5:'307.46 / F51.4' },
  { code:'6C00',   title:'Enuresis',                                                 chapter:'Eliminación', definition:'Evacuación de orina en cama o ropa. Edad ≥5 años.', dsm5:'307.6 / F98.0' },
  { code:'6C01',   title:'Encopresis',                                               chapter:'Eliminación', definition:'Evacuación fecal en lugares inapropiados. Edad ≥4 años.', dsm5:'307.7 / F98.1' },
  { code:'6C90',   title:'Trastorno Negativista Desafiante (TND)',                   chapter:'Disruptivo', definition:'Humor irritable, conducta argumentativa y/o vengativa.', dsm5:'313.81 / F91.3' },
  { code:'6C91',   title:'Trastorno de Conducta (TC)',                               chapter:'Disruptivo', definition:'Conducta que viola derechos de otros o normas sociales.', dsm5:'312.81 / F91.x' },
  { code:'6C92',   title:'Trastorno Explosivo Intermitente (TEI)',                   chapter:'Disruptivo', definition:'Arrebatos recurrentes de agresividad desproporcionada.', dsm5:'312.34 / F63.81' },
  { code:'6A20',   title:'Esquizofrenia',                                            chapter:'Psicosis', definition:'Síntomas psicóticos con deterioro funcional ≥6 meses.', dsm5:'295.90 / F20' },
  { code:'6A23',   title:'Trastorno Delirante',                                      chapter:'Psicosis', definition:'Delirios ≥1 mes sin otros síntomas psicóticos prominentes.', dsm5:'297.1 / F22' },
  { code:'6D10',   title:'Trastorno Límite de la Personalidad (TLP)',                chapter:'Personalidad', definition:'Inestabilidad en relaciones, autoimagen, afectos e impulsividad.', dsm5:'301.83 / F60.3' },
  { code:'6D11.0', title:'Trastorno Paranoide de la Personalidad',                  chapter:'Personalidad', definition:'Desconfianza y suspicacia generalizadas.', dsm5:'301.0 / F60.0' },
  { code:'6D11.5', title:'Trastorno Narcisista de la Personalidad',                 chapter:'Personalidad', definition:'Grandiosidad, necesidad de admiración y falta de empatía.', dsm5:'301.81 / F60.81' },
  { code:'8A60',   title:'Epilepsia',                                               chapter:'Neurológico', definition:'≥2 crisis epilépticas no provocadas.', dsm5:'345.x / G40' },
  { code:'8A60.0', title:'Epilepsia de Ausencias Infantiles',                       chapter:'Neurológico', definition:'Miradas fijas breves, inicio 4-10 años. EEG: punta-onda 3Hz.', dsm5:'345.3 / G40.3' },
  { code:'6B60',   title:'Trastorno de Identidad Disociativo (TID)',                chapter:'Disociativo', definition:'≥2 estados de personalidad distintos con amnesia.', dsm5:'300.14 / F44.81' },
  { code:'6B62',   title:'Trastorno de Despersonalización/Desrealización',          chapter:'Disociativo', definition:'Sentirse separado de los propios pensamientos o cuerpo.', dsm5:'300.6 / F48.1' },
  { code:'6C20',   title:'Trastorno de Síntomas Somáticos (TSS)',                   chapter:'Somático', definition:'Síntomas somáticos angustiantes con pensamientos excesivos.', dsm5:'300.82 / F45.1' },
]

type Result = {
  id?:        string
  code:       string
  title:      string
  definition: string
  chapter?:   string
  dsm5?:      string
  isLeaf?:    boolean
  fromApi?:   boolean
}

interface Props {
  onAsignar?:   (r: Result) => void
  showAsignar?: boolean
}

const CHIPS = ['TEA','TDAH','Autismo','Ansiedad','TOC','Dislexia','TEPT','Depresión','Enuresis','TND','ARFID','Bipolar','TLP','Dispraxia','Tics','Mutismo','Epilepsia']

export default function DiagnosticoBuscador({ onAsignar, showAsignar = false }: Props) {
  const [q, setQ]                   = useState('')
  const [results, setResults]       = useState<Result[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [apiAvail, setApiAvail]     = useState<boolean | null>(null)  // null=unknown
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [details, setDetails]       = useState<Record<string, any>>({})
  const [detailLoading, setDLoad]   = useState<string | null>(null)
  const [copied, setCopied]         = useState<string | null>(null)
  const [history, setHistory]       = useState<string[]>([])
  const inputRef                    = useRef<HTMLInputElement>(null)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Verificar disponibilidad de la API al montar ─────────────────────────
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res  = await fetch('/api/cie11?action=search&q=test')
        const data = await res.json()
        setApiAvail(!data.fallback)
      } catch {
        setApiAvail(false)
      }
    }
    checkApi()
  }, [])

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  const search = useCallback(async (query: string) => {
    const q2 = query.trim()
    if (q2.length < 2) { setResults([]); return }

    setLoading(true)
    setError(null)
    setExpanded(null)

    try {
      const res  = await fetch(`/api/cie11?action=search&q=${encodeURIComponent(q2)}`)
      const data = await res.json()

      if (data.fallback) {
        // API no disponible → usar base local
        setApiAvail(false)
        const lq = q2.toLowerCase()
        const local = LOCAL_DB
          .filter(d => d.code.toLowerCase().includes(lq) || d.title.toLowerCase().includes(lq) || d.definition.toLowerCase().includes(lq) || d.chapter?.toLowerCase().includes(lq))
          .map(d => ({ ...d, fromApi: false }))
        setResults(local)
      } else {
        setApiAvail(true)
        setResults((data.results || []).map((r: any) => ({ ...r, fromApi: true })))
        // Guardar en historial
        if (!history.includes(q2)) setHistory(h => [q2, ...h].slice(0, 8))
      }
    } catch {
      setApiAvail(false)
      const lq = q2.toLowerCase()
      const local = LOCAL_DB
        .filter(d => d.code.toLowerCase().includes(lq) || d.title.toLowerCase().includes(lq) || d.definition.toLowerCase().includes(lq))
        .map(d => ({ ...d, fromApi: false }))
      setResults(local)
    } finally {
      setLoading(false)
    }
  }, [history])

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults([]); setError(null); return }
    debounceRef.current = setTimeout(() => search(q), 380)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, search])

  // ── Detalle de un resultado (solo API) ───────────────────────────────────
  const loadDetail = async (r: Result) => {
    if (expanded === r.code) { setExpanded(null); return }
    setExpanded(r.code)
    // Si ya tenemos el detalle, no lo pedimos de nuevo
    if (details[r.code]) return
    if (!r.fromApi || !r.id) return
    setDLoad(r.code)
    try {
      const res  = await fetch(`/api/cie11?action=detail&code=${encodeURIComponent(r.id!)}`)
      const data = await res.json()
      if (!data.fallback) setDetails(prev => ({ ...prev, [r.code]: data }))
    } catch { /* silencioso */ } finally {
      setDLoad(null)
    }
  }

  const toggleLocal = (code: string) => {
    setExpanded(v => v === code ? null : code)
  }

  const copiar = (r: Result) => {
    const txt = `${r.title}\nCIE-11: ${r.code}${r.dsm5 ? ` | DSM-5/ICD-10: ${r.dsm5}` : ''}`
    navigator.clipboard.writeText(txt)
    setCopied(r.code)
    setTimeout(() => setCopied(null), 1800)
  }

  const copiarCodigo = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(`code-${code}`)
    setTimeout(() => setCopied(null), 1500)
  }

  const clear = () => { setQ(''); setResults([]); setExpanded(null); inputRef.current?.focus() }

  return (
    <div className="space-y-4">

      {/* ── ESTADO API ── */}
      {apiAvail === false && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <WifiOff size={13}/>
          <span>API OMS no configurada — usando base local ({LOCAL_DB.length} diagnósticos de salud mental). Para acceso completo a CIE-11, configura <code className="bg-amber-100 px-1 rounded">WHO_ICD_CLIENT_ID</code> y <code className="bg-amber-100 px-1 rounded">WHO_ICD_CLIENT_SECRET</code> en Vercel.</span>
        </div>
      )}
      {apiAvail === true && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Wifi size={13}/>
          <span>Conectado a API oficial OMS — CIE-11 completo (+17.000 diagnósticos)</span>
        </div>
      )}

      {/* ── BUSCADOR PRINCIPAL ── */}
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={apiAvail === true
            ? 'Buscar en CIE-11 completo — nombre, código, sinónimo, síntoma...'
            : 'Buscar diagnóstico — código CIE-11, nombre, sinónimo (ej: 6A02, TDAH, autismo)...'}
          className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm font-medium border-2 outline-none focus:border-violet-500 transition-colors shadow-sm"
          style={{ background:'var(--input-bg)', borderColor:'var(--input-border)', color:'var(--text-primary)' }}
          autoComplete="off"
        />
        {loading
          ? <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-violet-500"/>
          : q && <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><X size={15}/></button>
        }
      </div>

      {/* ── CHIPS ── */}
      {q.length === 0 && (
        <div className="space-y-2">
          {/* Historial */}
          {history.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Recientes:</span>
              {history.map(h => (
                <button key={h} onClick={() => setQ(h)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-50 border-slate-200 text-slate-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all">
                  🕐 {h}
                </button>
              ))}
            </div>
          )}
          {/* Búsquedas rápidas */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Rápido:</span>
            {CHIPS.map(c => (
              <button key={c} onClick={() => setQ(c)}
                className="px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
                style={{ background:'var(--card)', borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTADOR ── */}
      {q.length >= 2 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold" style={{ color:'var(--text-muted)' }}>
            {results.length === 0
              ? `Sin resultados para "${q}"`
              : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}" ${apiAvail ? '· API OMS' : '· base local'}`}
          </p>
          {results.length === 0 && (
            <button onClick={clear} className="text-xs text-violet-600 hover:underline">Limpiar</button>
          )}
        </div>
      )}

      {/* ── RESULTADOS ── */}
      <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1 scroll-smooth">

        {/* Sin resultados */}
        {!loading && q.length >= 2 && results.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle size={36} className="mx-auto mb-3 text-slate-200"/>
            <p className="text-sm font-semibold mb-1" style={{ color:'var(--text-muted)' }}>Sin resultados para "{q}"</p>
            <p className="text-xs mb-4" style={{ color:'var(--text-muted)' }}>
              Intentá con el código CIE-11 (ej: 6A02), un sinónimo o parte del nombre
            </p>
            <button onClick={clear}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              Nueva búsqueda
            </button>
          </div>
        )}

        {/* Esqueleto de carga */}
        {loading && [1,2,3].map(i => (
          <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ background:'var(--card)', borderColor:'var(--card-border)' }}>
            <div className="h-4 rounded bg-slate-200 w-2/3 mb-2"/>
            <div className="h-3 rounded bg-slate-100 w-1/3 mb-3"/>
            <div className="h-3 rounded bg-slate-100 w-full"/>
          </div>
        ))}

        {/* Lista resultados */}
        {!loading && results.map(r => {
          const isExp = expanded === r.code
          return (
            <div key={r.code} className="rounded-xl border transition-all hover:shadow-md"
              style={{ background:'var(--card)', borderColor: isExp ? 'var(--accent, #7c3aed)' : 'var(--card-border)' }}>

              {/* Cabecera */}
              <div className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug mb-2" style={{ color:'var(--text-primary)' }}>
                      {r.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Código CIE-11 clickeable */}
                      <button onClick={() => copiarCodigo(r.code)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                        title="Copiar código CIE-11">
                        {copied === `code-${r.code}` ? <Check size={9}/> : <Copy size={9}/>}
                        CIE-11: {r.code}
                      </button>
                      {/* DSM-5 / ICD-10 si existe (base local) */}
                      {r.dsm5 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-700">
                          DSM-5/ICD-10: {r.dsm5}
                        </span>
                      )}
                      {/* Área / capítulo */}
                      {r.chapter && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {r.chapter}
                        </span>
                      )}
                    </div>
                    {/* Definición breve */}
                    {!isExp && r.definition && (
                      <p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color:'var(--text-muted)' }}>
                        {r.definition}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => copiar(r)}
                      className="p-1.5 rounded-lg border transition-all hover:bg-violet-50 hover:border-violet-300"
                      style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}
                      title="Copiar para ARIA">
                      {copied === r.code ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
                    </button>
                    <button onClick={() => r.fromApi ? loadDetail(r) : toggleLocal(r.code)}
                      className="p-1.5 rounded-lg border transition-all hover:bg-slate-100"
                      style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                      {detailLoading === r.code
                        ? <Loader2 size={12} className="animate-spin text-violet-500"/>
                        : isExp ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalle expandido */}
              {isExp && (() => {
                const d = details[r.code]
                const isLoading = detailLoading === r.code
                return (
                  <div className="border-t px-3.5 pb-3.5 space-y-3" style={{ borderColor:'var(--card-border)' }}>

                    {isLoading && (
                      <div className="pt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 size={13} className="animate-spin text-violet-500"/>
                        Cargando detalle desde API OMS...
                      </div>
                    )}

                    {/* Código completo y capítulo */}
                    {!isLoading && (
                      <div className="pt-3 flex flex-wrap gap-2">
                        <div className="px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
                          <p className="text-[9px] font-black uppercase text-violet-400 mb-0.5">Código CIE-11</p>
                          <p className="text-sm font-black text-violet-700">{r.code}</p>
                        </div>
                        {r.chapter && (
                          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Capítulo</p>
                            <p className="text-sm font-black text-slate-600">{r.chapter}</p>
                          </div>
                        )}
                        {r.dsm5 && (
                          <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                            <p className="text-[9px] font-black uppercase text-blue-400 mb-0.5">DSM-5 / ICD-10</p>
                            <p className="text-sm font-black text-blue-700">{r.dsm5}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Definición */}
                    {!isLoading && (d?.definition || r.definition) && (
                      <div className="p-3 rounded-xl" style={{ background:'var(--muted-bg)' }}>
                        <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                          <BookOpen size={10}/> Definición clínica (OMS)
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>
                          {d?.definition || r.definition}
                        </p>
                      </div>
                    )}

                    {/* Sin definición disponible */}
                    {!isLoading && !d?.definition && !r.definition && d !== undefined && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs text-amber-700">
                          La OMS no tiene definición textual para este código. Consultá la entrada completa en el navegador oficial.
                        </p>
                      </div>
                    )}

                    {/* Inclusiones */}
                    {d?.inclusions?.length > 0 && (
                      <div className="p-2.5 rounded-xl" style={{ background:'var(--muted-bg)' }}>
                        <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color:'var(--text-muted)' }}>
                          <Tag size={10}/> Términos incluidos / sinónimos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {d.inclusions.map((inc: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-violet-50 text-violet-600 border border-violet-100">{inc}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas de codificación */}
                    {d?.notes && (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-[10px] font-black uppercase tracking-wide mb-1 text-blue-700">📋 Nota de codificación</p>
                        <p className="text-xs text-blue-800">{d.notes}</p>
                      </div>
                    )}

                    {/* Exclusiones */}
                    {d?.exclusions?.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
                        <p className="text-[10px] font-black uppercase tracking-wide mb-1.5 text-red-700">⚠ Excluye (diagnósticos alternativos)</p>
                        <div className="flex flex-wrap gap-1">
                          {d.exclusions.map((exc: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 border border-red-200">{exc}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => copiar(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors">
                        {copied === r.code ? <Check size={11}/> : <Copy size={11}/>}
                        {copied === r.code ? 'Copiado ✓' : 'Copiar para ARIA'}
                      </button>

                      {showAsignar && onAsignar && (
                        <button onClick={() => onAsignar(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                          <Star size={11}/> Asignar al paciente
                        </button>
                      )}

                      <a href={`https://icd.who.int/browse/2024-01/mms/es#${r.code}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:bg-slate-50"
                        style={{ borderColor:'var(--card-border)', color:'var(--text-secondary)' }}>
                        <ExternalLink size={11}/> Ver en OMS CIE-11
                      </a>
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* PIE */}
      {results.length > 0 && (
        <p className="text-[10px] text-center" style={{ color:'var(--text-muted)' }}>
          {apiAvail
            ? 'Fuente: API oficial OMS — CIE-11 2024 · Clasificación Internacional de Enfermedades'
            : `Base local: ${LOCAL_DB.length} diagnósticos de salud mental · CIE-11 + DSM-5-TR + ICD-10`}
        </p>
      )}
    </div>
  )
}
