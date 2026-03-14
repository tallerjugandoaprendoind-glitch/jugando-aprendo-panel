'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, ChevronRight, Baby, Loader2, Eye, FileText, Activity,
  AlertCircle, X, Brain, Heart, Home, ClipboardList, BarChart3,
  Calendar, User, Phone, Mail, ChevronDown, ChevronUp,
  BookOpen, CheckCircle2, Download, Sparkles, Stethoscope, Target, MessageSquare,
  TrendingUp, Lightbulb, Shield, Star, Zap, ArrowRight, RefreshCw, Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

function calcularEdad(fecha: string) {
  if (!fecha) return 'N/D'
  const hoy = new Date(), nac = new Date(fecha)
  const anos = hoy.getFullYear() - nac.getFullYear()
  return `${hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate()) ? anos - 1 : anos} años`
}

function formatDate(d: string) {
  if (!d) return '—'
  try { const loc = typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es'; return new Date(d).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const AVATAR_COLORS = [
  'from-cyan-500 to-purple-600', 'from-emerald-500 to-cyan-500',
  'from-amber-500 to-red-500', 'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500', 'from-emerald-500 to-amber-500',
]

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  'Sesión ABA':          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: Target },
  'Anamnesis':           { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  icon: ClipboardList },
  'Visita Domiciliaria': { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: Home },
  'BRIEF-2':             { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  icon: Brain },
  'ADOS-2':              { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    icon: Stethoscope },
  'Vineland-3':          { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  'WISC-V':              { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  icon: BarChart3 },
  'BASC-3':              { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    icon: Heart },
  'Formulario padre':    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: MessageSquare },
  'default':             { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   icon: FileText },
}
function getTypeCfg(type: string) { return TYPE_CONFIG[type] || TYPE_CONFIG['default'] }


function Field({ label, value }: { label: string; value: any }) {
  const { t, locale } = useI18n()

  if (value === null || value === undefined || value === '') return null
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  if (!display || display === 'undefined' || display === 'null') return null
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{display}</p>
    </div>
  )
}

function Bloque({ title, icon: Icon, color, children }: any) {
  const { t } = useI18n()

  const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children
  if (!hasChildren) return null
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 ${color || 'bg-slate-50'} border-b border-slate-100`}>
        {Icon && <Icon size={13} className="text-slate-600" />}
        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function AIBlock({ analysis }: { analysis: any }) {
  const { t } = useI18n()

  if (!analysis) return null
  const fields = [
    { k: 'analisis_clinico', l: 'Análisis Clínico' },
    { k: 'analisis_ia', l: 'Análisis IA' },
    { k: 'analisis_vineland_ia', l: 'Análisis Adaptativo' },
    { k: 'analisis_diagnostico_ia', l: 'Análisis Diagnóstico' },
    { k: 'analisis_basc_ia', l: 'Análisis Conductual' },
    { k: 'perfil_cognitivo_ia', l: 'Perfil Cognitivo' },
    { k: 'nivel_alerta', l: 'Nivel de Alerta' },
    { k: 'nivel_severidad', l: 'Nivel de Severidad' },
    { k: 'indicadores_clave', l: 'Indicadores Clave' },
    { k: 'areas_fortaleza', l: 'Áreas de Fortaleza' },
    { k: 'areas_trabajo', l: 'Áreas a Trabajar' },
    { k: 'areas_prioridad', l: 'Áreas Prioritarias' },
    { k: 'recomendaciones', l: 'Recomendaciones' },
    { k: 'recomendaciones_ia', l: 'Recomendaciones Terapéuticas' },
    { k: 'recomendaciones_intervencion', l: 'Plan de Intervención' },
    { k: 'implicaciones_educativas', l: 'Implicaciones Educativas' },
    { k: 'plan_intervencion_conductual', l: 'Plan Conductual' },
    { k: 'fortalezas_conductuales', l: 'Fortalezas Conductuales' },
    { k: 'areas_preocupacion', l: 'Áreas de Preocupación' },
    { k: 'mensaje_padres', l: 'Mensaje a Padres' },
    { k: 'informe_padres', l: 'Informe a Padres' },
  ]
  const visible = fields.filter(({ k }) => analysis[k])
  if (!visible.length) return null
  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100">
        <Sparkles size={13} className="text-violet-600" />
        <p className="text-xs font-black text-violet-700 uppercase tracking-widest">Análisis de IA</p>
      </div>
      <div className="p-4 space-y-3">
        {visible.map(({ k, l }) => {
          const val = analysis[k]
          const txt = Array.isArray(val) ? `• ${val.join('\n• ')}` : String(val)
          return (
            <div key={k}>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">{l}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{txt}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WordBtn({ report }: { report: any }) {
  const { t } = useI18n()

  const dl = () => {
    const blob = new Blob([Uint8Array.from(atob(report.file_data), c => c.charCodeAt(0))],
      { type: report.mime_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: report.nombre_archivo || 'reporte.docx' })
    a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <button onClick={dl} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
      <Download size={13} /> {t('pacientes.descargarReporte')}
    </button>
  )
}

function ABADetail({ r }: { r: any }) {
  const { t } = useI18n()

  const d = r.datos || r
  return (
    <div className="space-y-3">
      <Bloque title={t('ui.session')} icon={Calendar} color="bg-blue-50">
        <Field label="Objetivo principal" value={d.objetivo_principal} />
        <Field label={t("pacientes.tipoSesion")} value={d.tipo_sesion} />
        <Field label="Duración" value={d.duracion_minutos ? `${d.duracion_minutos} min` : null} />
      </Bloque>
      <Bloque title={t('ui.abc_record')} icon={Activity} color="bg-blue-50">
        <Field label="Antecedente (A)" value={d.antecedente} />
        <Field label="Conducta (B)" value={d.conducta} />
        <Field label="Consecuencia (C)" value={d.consecuencia} />
        <Field label="Función estimada" value={d.funcion_estimada} />
      </Bloque>
      <Bloque title={t('ui.performance')} icon={BarChart3} color="bg-blue-50">
        <Field label="Atención" value={d.nivel_atencion} />
        <Field label="Respuesta a instrucciones" value={d.respuesta_instrucciones} />
        <Field label="Tolerancia frustración" value={d.tolerancia_frustracion} />
        <Field label="Interacción social" value={d.interaccion_social} />
        <Field label="Nivel de logro" value={d.nivel_logro_objetivos} />
      </Bloque>
      <Bloque title={t('ui.observations')} icon={ClipboardList} color="bg-blue-50">
        <div className="col-span-2"><Field label="Clínicas" value={d.observaciones_clinicas} /></div>
        <Field label="Tarea para casa" value={d.tarea_casa} />
        <div className="col-span-2"><Field label={t("pacientes.mensajeFamilia")} value={d.mensaje_familia} /></div>
      </Bloque>
      <AIBlock analysis={r.ai_analysis} />
    </div>
  )
}

function AnamnesisDetail({ r }: { r: any }) {
  const { t } = useI18n()

  const d = r.datos || r
  return (
    <div className="space-y-3">
      <Bloque title={t('ui.general_data')} icon={User} color="bg-violet-50">
        <Field label="Informante" value={d.informante} />
        <Field label="Parentesco" value={d.parentesco} />
        <Field label="Vive con" value={d.vive_con} />
        <Field label="Escolaridad" value={d.escolaridad} />
      </Bloque>
      <Bloque title={t('ui.reason_consult')} icon={AlertCircle} color="bg-violet-50">
        <div className="col-span-2"><Field label="Motivo principal" value={d.motivo_principal} /></div>
        <Field label="Derivado por" value={d.derivado_por} />
        <div className="col-span-2"><Field label="Expectativas" value={d.expectativas} /></div>
      </Bloque>
      <Bloque title={t('ui.prenatal_history')} icon={Heart} color="bg-violet-50">
        <Field label="Tipo de embarazo" value={d.tipo_embarazo} />
        <Field label="Tipo de parto" value={d.tipo_parto} />
        <Field label="Complicaciones" value={d.complicaciones_emb} />
        <Field label="Incubadora" value={d.incubadora} />
      </Bloque>
      <Bloque title={t('ui.language_dev')} icon={MessageSquare} color="bg-violet-50">
        <Field label="Primeras palabras" value={d.primeras_palabras} />
        <Field label="Frases" value={d.frases} />
        <Field label="Comprensión" value={d.comprension} />
        <Field label="Intención comunicativa" value={d.intencion_comunicativa} />
      </Bloque>
      <Bloque title="Conducta y socialización" icon={Brain} color="bg-violet-50">
        <Field label="Contacto visual" value={d.contacto_visual} />
        <Field label="Tipo de juego" value={d.juego} />
        <Field label="Rabietas" value={d.rabietas} />
        <Field label="Relación con pares" value={d.pares} />
      </Bloque>
      <AIBlock analysis={r.ai_analysis} />
    </div>
  )
}

function EntornoDetail({ r }: { r: any }) {
  const { t } = useI18n()
  const d = r.datos || r
  return (
    <div className="space-y-3">
      <Bloque title="Visita" icon={Home} color="bg-amber-50">
        <Field label="Personas presentes" value={d.personas_presentes} />
        <Field label="Tipo de vivienda" value={d.tipo_vivienda} />
        <div className="col-span-2"><Field label="Comportamiento observado" value={d.comportamiento_observado} /></div>
        <div className="col-span-2"><Field label="Diferencias con consultorio" value={d.diferencias_consultorio} /></div>
      </Bloque>
      <Bloque title="Análisis del entorno" icon={ClipboardList} color="bg-amber-50">
        <div className="col-span-2"><Field label="Impresión general" value={d.impresion_general} /></div>
        <div className="col-span-2"><Field label="Barreras identificadas" value={d.barreras_identificadas} /></div>
      </Bloque>
      <Bloque title="Recomendaciones para el hogar" icon={Home} color="bg-green-50">
        <div className="col-span-2"><Field label="Mensaje a padres" value={d.mensaje_padres_entorno} /></div>
        <div className="col-span-2"><Field label={t("especialista.activCasa")} value={d.actividades_casa || d.actividades_sugeridas} /></div>
        <Field label="Espacio físico" value={d.recomendaciones_espacio} />
        <Field label="Rutinas" value={d.recomendaciones_rutinas} />
      </Bloque>
      <AIBlock analysis={r.ai_analysis} />
    </div>
  )
}

function EvalDetail({ r, tipo }: { r: any; tipo: string }) {
  const d = r.respuestas || r.responses || r.datos || r
  const metricMap: Record<string, { l: string; k: string }[]> = {
    'BRIEF-2': [
      { k: 'inhibicion', l: 'Inhibición' }, { k: 'flexibilidad', l: 'Flexibilidad' },
      { k: 'emocional', l: 'Control Emocional' }, { k: 'memoria', l: 'Memoria de Trabajo' },
      { k: 'planificacion', l: 'Planificación' }, { k: 'total_brief', l: 'Total BRIEF-2' },
      { k: 'nivel_riesgo', l: 'Nivel de Riesgo' },
    ],
    'ADOS-2': [
      { k: 'comunicacion', l: 'Comunicación' }, { k: 'interaccion', l: 'Interacción Social' },
      { k: 'juego', l: 'Juego' }, { k: 'conductas_repetitivas', l: 'Conductas Repetitivas' },
      { k: 'puntuacion_total', l: 'Afecto Social Total' }, { k: 'nivel_severidad', l: 'Severidad' },
    ],
    'Vineland-3': [
      { k: 'puntuacion_comunicacion', l: 'Comunicación' }, { k: 'puntuacion_socializacion', l: 'Socialización' },
      { k: 'puntuacion_vida_diaria', l: 'Vida Diaria' }, { k: 'indice_conducta_adaptativa', l: 'Índice Global' },
    ],
    'WISC-V': [
      { k: 'icv_total', l: 'ICV' }, { k: 'icv_percentil', l: 'Percentil ICV' },
      { k: 'ive_total', l: 'IVE' }, { k: 'ive_percentil', l: 'Percentil IVE' },
      { k: 'irf_total', l: 'IRF' }, { k: 'irf_percentil', l: 'Percentil IRF' },
      { k: 'imt_total', l: 'IMT' }, { k: 'imt_percentil', l: 'Percentil IMT' },
      { k: 'ivp_total', l: 'IVP' }, { k: 'ivp_percentil', l: 'Percentil IVP' },
      { k: 'ci_total', l: 'CI Total' }, { k: 'ci_percentil', l: 'Percentil CI' },
      { k: 'clasificacion_ci', l: 'Clasificación' },
    ],
    'BASC-3': [
      { k: 'indice_sintomas_conductuales', l: 'Índice de Síntomas' },
      { k: 'perfil_riesgo', l: 'Perfil de Riesgo' },
    ],
  }
  const metrics = metricMap[tipo] || []
  const hasMetrics = metrics.some(({ k }) => d[k] !== undefined && d[k] !== null && d[k] !== '')
  return (
    <div className="space-y-3">
      {hasMetrics && (
        <Bloque title={`Puntuaciones ${tipo}`} icon={BarChart3}>
          {metrics.map(({ k, l }) => <Field key={k} label={l} value={d[k] ?? r[k]} />)}
        </Bloque>
      )}
      <AIBlock analysis={r.ai_analysis || (typeof r === 'object' ? r : null)} />
    </div>
  )
}

function GenericDetail({ r }: { r: any }) {
  const { t } = useI18n()
  const d = r.responses || r.datos || r
  const skip = new Set(['id','child_id','created_at','updated_at','ai_analysis','responses','datos','form_type','form_title'])
  const entries = Object.entries(d || {}).filter(([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== '')
  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <Bloque title={t("pacientes.respuestasFormulario")} icon={FileText}>
          {entries.map(([k, v]) => (
            <Field key={k} label={k.replace(/_/g, ' ')}
              value={Array.isArray(v) ? (v as any[]).join(', ') : String(v)} />
          ))}
        </Bloque>
      )}
      <AIBlock analysis={r.ai_analysis} />
    </div>
  )
}

function RecordCard({ item }: { item: any }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const cfg = getTypeCfg(item._type || 'default')
  const Icon = cfg.icon
  const hasFull = !!item._fullData

  const renderDetail = () => {
    if (item._type === 'Sesión ABA' || item._type === 'ABA Session') return <ABADetail r={item._fullData} />
    if (item._type === 'Anamnesis') return <AnamnesisDetail r={item._fullData} />
    if (item._type === 'Visita Domiciliaria') return <EntornoDetail r={item._fullData} />
    if (['BRIEF-2','ADOS-2','Vineland-3','WISC-V','BASC-3'].includes(item._type)) return <EvalDetail r={item._fullData} tipo={item._type} />
    return <GenericDetail r={item._fullData} />
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${open ? 'border-slate-300 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
      <button onClick={() => hasFull && setOpen(o => !o)}
        className={`w-full flex items-start gap-4 p-4 text-left transition-colors ${hasFull ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default'}`}>
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon size={15} className={cfg.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {item._type || 'Registro'}
            </span>
            <span className="text-xs text-slate-400">{formatDate(item._date)}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{item._content || '—'}</p>
        </div>
        {hasFull && (open
          ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0 mt-1" />
          : <ChevronDown size={16} className="text-slate-400 flex-shrink-0 mt-1" />)}
      </button>
      {open && item._fullData && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-4">
          {renderDetail()}
          {item._wordReport && <WordBtn report={item._wordReport} />}
        </div>
      )}
    </div>
  )
}

// ── AI Summary Tab ─────────────────────────────────────────────────────────────
function ResumenIA({ records, paciente }: { records: any[]; paciente: any }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState('')
  const toast = useToast()

  const generarResumen = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await fetch('/api/patient-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          childName: paciente.name,
          childAge: calcularEdad(paciente.birth_date),
          diagnosis: paciente.diagnosis,
          records: records.map(r => ({
            _type: r._type,
            _date: r._date,
            datos: r._fullData?.datos || null,
            ai_analysis: r._fullData?.ai_analysis || null,
          }))
        })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      setSummary(data.summary)
    } catch (e: any) {
      setError(e.message || 'Error generando resumen')
      toast.error('Error: ' + (e.message || 'Error generando resumen'))
    } finally {
      setLoading(false)
    }
  }

  const nivelColor: Record<string, string> = {
    excelente: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    bueno: 'text-blue-600 bg-blue-50 border-blue-200',
    moderado: 'text-amber-600 bg-amber-50 border-amber-200',
    requiere_atencion: 'text-rose-600 bg-rose-50 border-rose-200',
  }

  const prioridadColor: Record<string, string> = {
    alta: 'bg-rose-100 text-rose-700 border-rose-200',
    media: 'bg-amber-100 text-amber-700 border-amber-200',
    baja: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  const catColor: Record<string, string> = {
    'ABA/Conductual': 'bg-blue-100 text-blue-700',
    'Cognitiva': 'bg-purple-100 text-purple-700',
    'Social': 'bg-teal-100 text-teal-700',
    'Comunicación': 'bg-indigo-100 text-indigo-700',
    'Familia': 'bg-orange-100 text-orange-700',
    'Escolar': 'bg-emerald-100 text-emerald-700',
  }

  if (!summary && !loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles size={28} className="text-white" />
        </div>
        <h3 className="font-black text-slate-800 text-lg mb-2">Resumen Clínico con IA</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
          Genera un análisis completo del paciente con perfil clínico, áreas prioritarias, plan de tratamiento personalizado y estrategias para el hogar.
        </p>
        {records.length === 0 ? (
          <p className="text-sm text-slate-400 italic">{t('pacientes.sinRegistros').split('para')[0]} resumen.</p>
        ) : (
          <button onClick={generarResumen}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
            <Sparkles size={16} /> Generar resumen con IA
          </button>
        )}
        {error && <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 p-12 text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Loader2 size={24} className="text-white animate-spin" />
        </div>
        <h3 className="font-black text-slate-700 text-base mb-1">Analizando expediente completo...</h3>
        <p className="text-sm text-slate-400">La IA está procesando toda la información del paciente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <p className="font-black text-slate-800 text-sm">Resumen Clínico IA</p>
        </div>
        <button onClick={generarResumen}
          className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">
          <RefreshCw size={11} /> Regenerar
        </button>
      </div>

      {summary.nivel_progreso_general && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${nivelColor[summary.nivel_progreso_general] || nivelColor.moderado}`}>
          <TrendingUp size={12} />
          Progreso general: {summary.nivel_progreso_general.replace('_', ' ')}
        </div>
      )}

      {summary.resumen_ejecutivo && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FileText size={10} /> Resumen ejecutivo
          </p>
          <p className="text-sm leading-relaxed text-white/90">{summary.resumen_ejecutivo}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.perfil_fortalezas?.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Star size={10} /> Fortalezas
            </p>
            <div className="space-y-2">
              {summary.perfil_fortalezas.map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800 leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {summary.perfil_desafios?.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertCircle size={10} /> Desafíos
            </p>
            <div className="space-y-2">
              {summary.perfil_desafios.map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-800 leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {summary.areas_prioridad?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
            <Target size={13} className="text-slate-600" />
            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Áreas Prioritarias de Intervención</p>
          </div>
          <div className="p-4 space-y-3">
            {summary.areas_prioridad.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${prioridadColor[a.nivel] || prioridadColor.media}`}>
                  {a.nivel}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{a.area}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.recomendaciones_terapeuticas?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 border-b border-violet-100">
            <Lightbulb size={13} className="text-violet-600" />
            <p className="text-xs font-black text-violet-700 uppercase tracking-widest">Plan de Tratamiento</p>
          </div>
          <div className="p-4 space-y-3">
            {summary.recomendaciones_terapeuticas.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5 ${catColor[r.categoria] || 'bg-slate-200 text-slate-600'}`}>
                  {r.categoria}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">{r.accion}</p>
                  {r.frecuencia && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {r.frecuencia}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.estrategias_casa?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Home size={10} /> Estrategias para los Padres en Casa
          </p>
          <div className="space-y-2">
            {summary.estrategias_casa.map((e: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <ArrowRight size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900 leading-relaxed">{e}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.objetivos_proximas_sesiones?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Zap size={10} /> Objetivos para Próximas Sesiones
          </p>
          <div className="space-y-2">
            {summary.objetivos_proximas_sesiones.map((o: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-blue-700">{i + 1}</span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">{o}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.mensaje_equipo && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Shield size={10} /> Mensaje al Equipo Terapéutico
          </p>
          <p className="text-sm text-indigo-900 leading-relaxed italic">"{summary.mensaje_equipo}"</p>
        </div>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MisPacientes() {
  const toast = useToast()
  const { t } = useI18n()
  const [ninos, setNinos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [registros, setRegistros] = useState<any[]>([])
  const [wordReports, setWordReports] = useState<any[]>([])
  const [loadingRegistros, setLoadingRegistros] = useState(false)
  const [activeTab, setActiveTab] = useState<'resumen'|'historial'|'evaluaciones'|'reportes'>('resumen')
  const [filterType, setFilterType] = useState('all')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('children')
        .select('*, profiles!children_parent_id_fkey(full_name, email, phone)')
        .eq('is_active', true).order('name')
      setNinos(data || [])
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  const verPaciente = async (nino: any) => {
    setSeleccionado(nino)
    setRegistros([])
    setWordReports([])
    setActiveTab('resumen')
    setFilterType('all')
    setLoadingRegistros(true)
    try {
      const [abaR, formR, anamR, entornoR, brief2R, ados2R, vinR, wiscR, basc3R, wordR, pformR] = await Promise.all([
        supabase.from('registro_aba').select('*').eq('child_id', nino.id).order('fecha_sesion', { ascending: false }).limit(30),
        supabase.from('form_responses').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('anamnesis_completa').select('*').eq('child_id', nino.id).order('fecha_creacion', { ascending: false }).limit(1),
        supabase.from('registro_entorno_hogar').select('*').eq('child_id', nino.id).order('fecha_visita', { ascending: false }).limit(10),
        supabase.from('evaluacion_brief2').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('evaluacion_ados2').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('evaluacion_vineland3').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('evaluacion_wiscv').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('evaluacion_basc3').select('*').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('reportes_generados').select('id,titulo,tipo_reporte,nombre_archivo,file_data,mime_type,created_at').eq('child_id', nino.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('parent_forms').select('*').eq('child_id', nino.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(20),
      ])

      setWordReports(wordR.data || [])
      const words = wordR.data || []
      const findWord = (key: string) => words.find((w: any) => w.tipo_reporte === key || w.titulo?.toLowerCase().includes(key.toLowerCase())) || null
      const fromForm = (type: string) => (formR.data || []).find((r: any) => r.form_type === type) || null

      const combined: any[] = []

      ;(anamR.data || []).forEach((r: any) => combined.push({
        id: r.id, _type: 'Anamnesis', _date: r.fecha_creacion?.split('T')[0],
        _content: r.datos?.motivo_principal || 'Historia clínica inicial',
        _fullData: r, _wordReport: findWord('anamnesis'),
      }))

      ;(abaR.data || []).forEach((r: any) => combined.push({
        id: r.id, _type: 'Sesión ABA', _date: r.fecha_sesion,
        _content: r.datos?.objetivo_principal || r.datos?.conducta || 'Sesión ABA',
        _fullData: r, _wordReport: null,
      }))

      ;(entornoR.data || []).forEach((r: any) => combined.push({
        id: r.id, _type: 'Visita Domiciliaria', _date: r.fecha_visita?.split('T')[0],
        _content: r.datos?.impresion_general || 'Visita al hogar',
        _fullData: r, _wordReport: findWord('entorno_hogar'),
      }))

      const profEvals = [
        { r: brief2R.data || fromForm('brief2'), tipo: 'BRIEF-2', key: 'brief2' },
        { r: ados2R.data || fromForm('ados2'), tipo: 'ADOS-2', key: 'ados2' },
        { r: vinR.data || fromForm('vineland3'), tipo: 'Vineland-3', key: 'vineland3' },
        { r: wiscR.data || fromForm('wiscv'), tipo: 'WISC-V', key: 'wiscv' },
        { r: basc3R.data || fromForm('basc3'), tipo: 'BASC-3', key: 'basc3' },
      ]
      profEvals.forEach(({ r, tipo, key }) => {
        if (!r) return
        const d = r.respuestas || r.responses || r.datos || r
        const snippets: Record<string, string> = {
          'BRIEF-2': `Riesgo: ${d.nivel_riesgo || '—'}`,
          'ADOS-2': `Severidad: ${d.nivel_severidad || d.severidad || '—'}`,
          'Vineland-3': `Índice adaptativo: ${d.indice_conducta_adaptativa || '—'}`,
          'WISC-V': `CI Total: ${d.ci_total || '—'}`,
          'BASC-3': `Perfil: ${d.perfil_riesgo || '—'}`,
        }
        combined.push({
          id: r.id || key, _type: tipo, _date: r.created_at?.split('T')[0] || r.fecha_evaluacion,
          _content: snippets[tipo] || `Evaluación ${tipo} completada`,
          _fullData: r, _wordReport: findWord(key),
        })
      })

      const skipTypes = new Set(['brief2','ados2','vineland3','wiscv','basc3'])
      ;(formR.data || []).filter((r: any) => !skipTypes.has(r.form_type)).forEach((r: any) => combined.push({
        id: r.id, _type: r.form_title || r.form_type || 'Formulario',
        _date: r.created_at?.split('T')[0],
        _content: r.ai_analysis?.analisis_clinico?.slice?.(0, 120) || `Formulario ${r.form_title || r.form_type}`,
        _fullData: r, _wordReport: findWord(r.form_type || ''),
      }))

      ;(pformR.data || []).forEach((r: any) => combined.push({
        id: r.id, _type: 'Formulario padre', _date: r.completed_at?.split('T')[0],
        _content: r.form_title || 'Formulario completado por padre',
        _fullData: r, _wordReport: null,
      }))

      combined.sort((a, b) => (b._date || '').localeCompare(a._date || ''))
      setRegistros(combined)
    } catch (e: any) {
      toast.error('Error cargando expediente: ' + e.message)
    } finally { setLoadingRegistros(false) }
  }

  useEffect(() => { cargar() }, [cargar])

  const filtrados = ninos.filter(n =>
    n.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.diagnosis?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (seleccionado) {
    const colorClass = AVATAR_COLORS[seleccionado.name?.charCodeAt(0) % AVATAR_COLORS.length]
    const typeCounts: Record<string, number> = {}
    registros.forEach(r => { typeCounts[r._type] = (typeCounts[r._type] || 0) + 1 })
    const evalItems = registros.filter(r => ['BRIEF-2','ADOS-2','Vineland-3','WISC-V','BASC-3'].includes(r._type))
    const uniqueTypes = [...new Set(registros.map(r => r._type))]
    const filtered = filterType === 'all' ? registros : registros.filter(r => r._type === filterType)

    const tabs = [
      { id: 'resumen', label: 'Resumen IA', icon: Sparkles, count: null },
      { id: 'historial', label: 'Historial', icon: Activity, count: registros.length },
      { id: 'evaluaciones', label: t('nav.evaluaciones'), icon: Brain, count: evalItems.length },
      { id: 'reportes', label: t('nav.reportes'), icon: Download, count: wordReports.length },
    ]

    return (
      <div className="space-y-5 pb-24 md:pb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSeleccionado(null); setRegistros([]) }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
            <ChevronRight size={18} className="rotate-180 text-slate-600" />
          </button>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expediente clínico · Solo lectura</p>
            <h2 className="text-xl font-black text-slate-800">{seleccionado.name}</h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0`}>
              {seleccionado.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl mb-1">{seleccionado.name}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-bold text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                  <Baby size={11} className="inline mr-1" />{calcularEdad(seleccionado.birth_date)}
                </span>
                {seleccionado.diagnosis && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-900/40 px-2.5 py-1 rounded-full">
                    <Stethoscope size={11} className="inline mr-1" />{seleccionado.diagnosis}
                  </span>
                )}
                <span className="text-xs font-bold text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                  {registros.length} registros
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {seleccionado.profiles?.full_name && <span className="text-xs text-white/60 flex items-center gap-1"><User size={10} />{seleccionado.profiles.full_name}</span>}
                {seleccionado.profiles?.email && <span className="text-xs text-white/60 flex items-center gap-1"><Mail size={10} />{seleccionado.profiles.email}</span>}
                {seleccionado.profiles?.phone && <span className="text-xs text-white/60 flex items-center gap-1"><Phone size={10} />{seleccionado.profiles.phone}</span>}
                {seleccionado.birth_date && <span className="text-xs text-white/60 flex items-center gap-1"><Calendar size={10} />{formatDate(seleccionado.birth_date)}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${activeTab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              {count !== null && (count as number) > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {loadingRegistros ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-400">Cargando expediente completo...</p>
          </div>
        ) : (
          <>
            {activeTab === 'resumen' && <ResumenIA records={registros} paciente={seleccionado} />}

            {activeTab === 'historial' && (
              <div className="space-y-3">
                {uniqueTypes.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilterType('all')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterType === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>
                      Todos ({registros.length})
                    </button>
                    {uniqueTypes.map(t => {
                      const cfg = getTypeCfg(t)
                      return (
                        <button key={t} onClick={() => setFilterType(t)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${filterType === t ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-white text-slate-600 border-slate-200'}`}>
                          {t} ({typeCounts[t] || 0})
                        </button>
                      )
                    })}
                  </div>
                )}
                {filtered.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
                    <FileText size={22} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">Sin registros</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((item, idx) => <RecordCard key={`${item.id}-${idx}`} item={item} />)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evaluaciones' && (
              <div className="space-y-3">
                {['BRIEF-2','ADOS-2','Vineland-3','WISC-V','BASC-3'].map(tipo => {
                  const item = registros.find(r => r._type === tipo)
                  const cfg = getTypeCfg(tipo)
                  const Icon = cfg.icon
                  return (
                    <div key={tipo} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${item ? cfg.border : 'border-slate-100'}`}>
                      <div className={`flex items-center gap-3 px-5 py-4 ${item ? cfg.bg : 'bg-slate-50'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item ? `${cfg.bg} ${cfg.border}` : 'bg-slate-100 border-slate-200'}`}>
                          <Icon size={16} className={item ? cfg.text : 'text-slate-400'} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-sm ${item ? 'text-slate-800' : 'text-slate-400'}`}>{tipo}</p>
                          {item && <p className="text-xs text-slate-500 mt-0.5">{item._content}</p>}
                        </div>
                        {item
                          ? <CheckCircle2 size={18} className="text-emerald-500" />
                          : <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-bold">{t('common.pendiente')}</span>}
                      </div>
                      {item && (
                        <div className="px-5 py-4 space-y-3">
                          <EvalDetail r={item._fullData} tipo={tipo} />
                          {item._wordReport && <WordBtn report={item._wordReport} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'reportes' && (
              <div className="space-y-2">
                {wordReports.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
                    <FileText size={22} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-semibold">No hay reportes generados</p>
                  </div>
                ) : wordReports.map((r: any) => {
                  const cfg = getTypeCfg(r.tipo_reporte)
                  const Icon = cfg.icon
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm hover:border-blue-200 transition-all">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} className={cfg.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{r.titulo || r.nombre_archivo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.created_at)}</p>
                      </div>
                      <button onClick={() => {
                        const blob = new Blob([Uint8Array.from(atob(r.file_data), c => c.charCodeAt(0))], { type: r.mime_type })
                        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: r.nombre_archivo || 'reporte.docx' })
                        a.click(); URL.revokeObjectURL(a.href)
                      }} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 flex-shrink-0">
                        <Download size={13} /> Descargar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">{t('nav.mispacientes')}</h2>
          <p className="text-sm text-slate-500 mt-1">Expedientes clínicos completos · Solo lectura</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex-shrink-0">
          <AlertCircle size={11} /> Consulta
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 flex items-center gap-3 px-4 py-3 shadow-sm">
        <Search size={15} className="text-slate-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o diagnóstico..."
          className="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-400" />
        {busqueda && <button onClick={() => setBusqueda('')}><X size={14} className="text-slate-400 hover:text-slate-600" /></button>}
      </div>

      {!loading && (
        <p className="text-xs text-slate-500 font-semibold px-1">
          <span className="font-black text-slate-800">{filtrados.length}</span> paciente{filtrados.length !== 1 ? 's' : ''}
          {busqueda && <span className="text-slate-400"> · "{busqueda}"</span>}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid gap-2">
          {filtrados.map((n, idx) => (
            <div key={n.id} onClick={() => verPaciente(n)}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group shadow-sm">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow`}>
                {n.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800">{n.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{calcularEdad(n.birth_date)} · {n.diagnosis || 'Sin diagnóstico'}</p>
                <p className="text-xs text-slate-400 truncate">{n.profiles?.full_name || 'Sin tutor'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-1 rounded-lg">
                  <Sparkles size={10} /> IA
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <BookOpen size={13} /> Expediente
                </div>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Baby size={22} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-semibold">{t('common.sinResultados')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
