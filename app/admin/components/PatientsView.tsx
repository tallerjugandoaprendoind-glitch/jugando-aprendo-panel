'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Baby, BarChart3, Brain, Calendar, Check, ChevronRight,
  ClipboardList, Edit, Loader2, Plus, Save, Search, Sparkles,
  Stethoscope, User, Users, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { calcularEdad } from '../utils/helpers'
import ProgramasABAView from './ProgramasABAView'
import ARIAAgentChat from './ARIAAgentChat'
import EvaluacionesUnificadas from './EvaluacionesUnificadas'
import AIReportView from './AIReportView'

// ── Color badge por diagnóstico ────────────────────────────────────────────
const DX_MAP: Record<string, string> = {
  'TEA':     'bg-purple-100 text-purple-700 border-purple-200',
  'TDAH':    'bg-blue-100   text-blue-700   border-blue-200',
  'Retraso': 'bg-amber-100  text-amber-700  border-amber-200',
}
const dxColor = (dx: string) => {
  const k = Object.keys(DX_MAP).find(k => dx?.includes(k))
  return k ? DX_MAP[k] : 'bg-slate-100 text-slate-600 border-slate-200'
}

// ── Avatar coloreado por inicial ───────────────────────────────────────────
const PALETTES = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm'|'md'|'lg' }) {
  const pal = PALETTES[name.charCodeAt(0) % PALETTES.length]
  const sz  = { sm: 'w-9 h-9 text-base', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl' }[size]
  return (
    <div className={`bg-gradient-to-br ${pal} ${sz} rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0 shadow-sm`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── InfoPill ──────────────────────────────────────────────────────────────
function InfoPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl space-y-1" style={{ background: 'var(--muted-bg)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-blue-500">{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
    </div>
  )
}

// ── Tab Info del paciente ──────────────────────────────────────────────────
function PatientInfoTab({ nino, onSaved }: { nino: any; onSaved: () => void }) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    name: nino.name, birth_date: nino.birth_date || '',
    diagnosis: nino.diagnosis || '', age: nino.age || '',
  })

  useEffect(() => {
    setForm({ name: nino.name, birth_date: nino.birth_date || '', diagnosis: nino.diagnosis || '', age: nino.age || '' })
    setEditing(false)
  }, [nino.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const edad = form.birth_date ? calcularEdad(form.birth_date) : (parseInt(String(form.age)) || null)
      const { error } = await supabase.from('children').update({
        name: form.name.trim(), birth_date: form.birth_date || null,
        diagnosis: form.diagnosis.trim() || null, age: edad,
      }).eq('id', nino.id)
      if (error) throw error
      toast.success(t('common.exitoGuardado'))
      setEditing(false); onSaved()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-4 md:p-6 max-w-lg space-y-4">
      {/* Avatar + nombre */}
      <div className="flex items-start gap-4">
        <Avatar name={nino.name} size="lg"/>
        <div className="flex-1 min-w-0">
          {editing
            ? <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                className="w-full text-xl font-black border-b-2 border-blue-400 bg-transparent outline-none pb-1"
                style={{ color: 'var(--text-primary)' }}/>
            : <h2 className="text-xl font-black truncate" style={{ color: 'var(--text-primary)' }}>{nino.name}</h2>
          }
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {editing
              ? <input value={form.diagnosis} onChange={e => setForm(f=>({...f,diagnosis:e.target.value}))}
                  placeholder={t('pacientes.diagnostico')}
                  className="text-sm border rounded-lg px-2 py-1 outline-none"
                  style={{ borderColor:'var(--card-border)', color:'var(--text-primary)', background:'var(--card)' }}/>
              : <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${dxColor(nino.diagnosis)}`}>
                  {nino.diagnosis || t('pacientes.sinDiagnostico')}
                </span>
            }
            {nino.age && <span className="text-xs" style={{ color:'var(--text-muted)' }}>{nino.age} {t('common.anos')}</span>}
          </div>
        </div>
        {/* Botón editar / guardar */}
        {editing
          ? <div className="flex gap-2 flex-shrink-0">
              <button onClick={()=>setEditing(false)} className="p-2 rounded-xl border" style={{ borderColor:'var(--card-border)' }}>
                <X size={15} style={{ color:'var(--text-muted)' }}/>
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
                {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                {t('common.guardar')}
              </button>
            </div>
          : <button onClick={()=>setEditing(true)} className="p-2 rounded-xl border flex-shrink-0"
              style={{ borderColor:'var(--card-border)' }}>
              <Edit size={15} style={{ color:'var(--text-muted)' }}/>
            </button>
        }
      </div>

      {/* Grid de datos */}
      {!editing
        ? <div className="grid grid-cols-2 gap-2">
            <InfoPill label={t('pacientes.fechaNacimiento')}
              value={nino.birth_date ? new Date(nino.birth_date).toLocaleDateString(toBCP47(locale)) : '—'}
              icon={<Calendar size={13}/>}/>
            <InfoPill label={t('common.edad')}
              value={nino.age ? `${nino.age} ${t('common.anos')}` : '—'}
              icon={<Baby size={13}/>}/>
            <InfoPill label={t('pacientes.diagnostico')} value={nino.diagnosis||'—'} icon={<Stethoscope size={13}/>}/>
            <InfoPill label="ID" value={nino.id?.slice(0,8)+'...'} icon={<User size={13}/>}/>
          </div>
        : <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color:'var(--text-muted)' }}>
                {t('pacientes.fechaNacimiento')}
              </label>
              <input type="date" value={form.birth_date}
                onChange={e=>setForm(f=>({...f,birth_date:e.target.value}))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor:'var(--card-border)', color:'var(--text-primary)', background:'var(--muted-bg)' }}/>
            </div>
          </div>
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — Layout adaptativo móvil / desktop
// ═══════════════════════════════════════════════════════════════════════════
export default function PatientsView() {
  const { t } = useI18n()
  const toast  = useToast()

  const [pacientes, setPacientes] = useState<any[]>([])
  const [filtrados, setFiltrados] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // En móvil: 'list' | 'detail'. En desktop ambos visibles.
  const [mobileView, setMobileView] = useState<'list'|'detail'>('list')
  const [selected, setSelected] = useState<any>(null)
  const [tab, setTab] = useState<'info'|'programas'|'evaluaciones'|'aria'|'historial'>('info')

  // Nuevo paciente
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name:'', birth_date:'', diagnosis:'' })
  const [saving, setSaving] = useState(false)

  // ── Cargar ────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('children').select('*').order('name', { ascending: true })
    if (data) { setPacientes(data); setFiltrados(data) }
    setIsLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Filtrar ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFiltrados(pacientes); return }
    const q = search.toLowerCase()
    setFiltrados(pacientes.filter(p => p.name?.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q)))
  }, [search, pacientes])

  // ── Seleccionar paciente ──────────────────────────────────────────────────
  const selectPatient = (p: any) => {
    setSelected(p); setTab('info')
    setMobileView('detail')   // en móvil ir a la ficha
  }

  // ── Volver a la lista (solo móvil) ────────────────────────────────────────
  const goBack = () => { setMobileView('list'); setSelected(null) }

  // ── Crear nuevo ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error(t('pacientes.nombreRequerido')); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('children').insert({
        name: newForm.name.trim(),
        birth_date: newForm.birth_date || null,
        diagnosis: newForm.diagnosis.trim() || null,
      }).select().single()
      if (error) throw error
      toast.success(t('pacientes.creado'))
      setNewForm({ name:'', birth_date:'', diagnosis:'' })
      setShowNew(false)
      await cargar()
      if (data) selectPatient(data)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id:'info',         icon:<User size={14}/>,          label: t('pacientes.informacion') },
    { id:'programas',    icon:<BarChart3 size={14}/>,     label: t('nav.programas') },
    { id:'evaluaciones', icon:<ClipboardList size={14}/>, label: t('nav.evaluaciones') },
    { id:'aria',         icon:<Sparkles size={14}/>,      label: 'ARIA' },
    { id:'historial',    icon:<Brain size={14}/>,         label: 'Historial & IA' },
  ] as const

  // ── PANEL LISTA ───────────────────────────────────────────────────────────
  const ListPanel = (
    <div
      className={`
        flex flex-col bg-white dark:bg-slate-900 overflow-hidden
        /* móvil: ocupa todo si no hay detalle */
        ${mobileView === 'detail' ? 'hidden' : 'flex'}
        /* desktop: columna fija al lado */
        md:flex md:w-64 xl:w-72 md:flex-shrink-0 md:border-r
        h-full
      `}
      style={{ borderColor:'var(--card-border)', background:'var(--card)' }}
    >
      {/* Header */}
      <div className="p-3 border-b space-y-2 flex-shrink-0" style={{ borderColor:'var(--card-border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
            {t('nav.pacientes')} · <span className="font-normal">{filtrados.length}</span>
          </h2>
          <button onClick={()=>setShowNew(true)}
            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all shadow-sm">
            <Plus size={14} className="text-white"/>
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color:'var(--text-muted)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t('ui.search_patient')}
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none border"
            style={{ background:'var(--muted-bg)', borderColor:'var(--card-border)', color:'var(--text-primary)' }}/>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading
          ? <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color:'var(--text-muted)' }}/></div>
          : filtrados.length === 0
            ? <div className="py-12 text-center">
                <Users className="mx-auto mb-2" size={32} style={{ color:'var(--text-muted)', opacity:0.3 }}/>
                <p className="text-xs font-bold" style={{ color:'var(--text-muted)' }}>
                  {search ? t('ui.sinResultados') : t('pacientes.sinPacientes')}
                </p>
              </div>
            : filtrados.map(p => (
                <button key={p.id} onClick={()=>selectPatient(p)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all border
                    ${selected?.id===p.id
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <Avatar name={p.name} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color:'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-[11px] truncate" style={{ color:'var(--text-muted)' }}>
                      {p.diagnosis || t('pacientes.sinDiagnostico')} · {p.age || '?'}{t('common.anos')}
                    </p>
                  </div>
                  {selected?.id===p.id
                    ? <Check size={13} className="text-blue-500 flex-shrink-0"/>
                    : <ChevronRight size={13} className="flex-shrink-0 opacity-30"/>}
                </button>
              ))
        }
      </div>
    </div>
  )

  // ── PANEL DETALLE ─────────────────────────────────────────────────────────
  const DetailPanel = (
    <div
      className={`
        flex-1 flex flex-col overflow-hidden
        ${mobileView === 'list' ? 'hidden' : 'flex'}
        md:flex
      `}
    >
      {selected ? (
        <>
          {/* Header paciente */}
          <div className="flex-shrink-0 border-b" style={{ borderColor:'var(--card-border)', background:'var(--card)' }}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              {/* Botón volver — solo móvil */}
              <button onClick={goBack}
                className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 transition-all flex-shrink-0">
                <ArrowLeft size={18} style={{ color:'var(--text-primary)' }}/>
              </button>
              <Avatar name={selected.name} size="md"/>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black truncate leading-tight" style={{ color:'var(--text-primary)' }}>
                  {selected.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dxColor(selected.diagnosis)}`}>
                    {selected.diagnosis || t('pacientes.sinDiagnostico')}
                  </span>
                  {selected.age &&
                    <span className="text-xs" style={{ color:'var(--text-muted)' }}>
                      {selected.age} {t('common.anos')}
                    </span>}
                </div>
              </div>
            </div>

            {/* Tabs — auto-ajuste por ancho disponible */}
            <div className="flex border-b" style={{ borderColor: 'var(--card-border)' }}>
              {TABS.map(tb => (
                <button key={tb.id} onClick={()=>setTab(tb.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] sm:text-xs font-bold border-b-2 transition-all min-w-0
                    ${tab===tb.id ? 'border-blue-500 text-blue-600' : 'border-transparent'}`}
                  style={{ color: tab===tb.id ? undefined : 'var(--text-muted)' }}
                  title={tb.label}>
                  <span className="flex-shrink-0">{tb.icon}</span>
                  <span className="truncate w-full text-center px-0.5">{
                    tb.id === 'info'         ? 'Info' :
                    tb.id === 'programas'    ? 'ABA' :
                    tb.id === 'evaluaciones' ? 'Eval.' :
                    tb.id === 'aria'         ? 'ARIA' :
                    'Hist.'
                  }</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenido tab */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {tab==='info' &&
              <PatientInfoTab nino={selected} onSaved={async()=>{
                await cargar()
                const upd = pacientes.find(p=>p.id===selected.id)
                if (upd) setSelected(upd)
              }}/>}
            {tab==='programas' && <div className="h-full"><ProgramasABAView childId={selected.id} childName={selected.name}/></div>}
            {tab==='evaluaciones' && <div className="h-full"><EvaluacionesUnificadas initialChildId={selected.id} initialChildName={selected.name}/></div>}
            {tab==='aria' && <div className="h-full"><ARIAAgentChat userId={selected.id} childId={selected.id} childName={selected.name} contexto="paciente"/></div>}
            {tab==='historial' && <div className="p-4"><AIReportView initialChildId={selected.id} /></div>}
          </div>
        </>
      ) : (
        /* Empty state — solo visible en desktop */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Users size={36} className="text-blue-400"/>
          </div>
          <div className="text-center">
            <h3 className="font-black text-lg mb-1" style={{ color:'var(--text-primary)' }}>{t('pacientes.seleccionaUno')}</h3>
            <p className="text-sm max-w-xs" style={{ color:'var(--text-muted)' }}>{t('pacientes.seleccionaDesc')}</p>
          </div>
          <button onClick={()=>setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm">
            <Plus size={15}/> {t('pacientes.nuevo')}
          </button>
        </div>
      )}
    </div>
  )

  // ── MODAL nuevo paciente ──────────────────────────────────────────────────
  const NewModal = showNew && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl p-5 space-y-4"
        style={{ background:'var(--card)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black" style={{ color:'var(--text-primary)' }}>{t('pacientes.nuevo')}</h3>
          <button onClick={()=>setShowNew(false)} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={16} style={{ color:'var(--text-muted)' }}/>
          </button>
        </div>
        <div className="space-y-3">
          {[
            { key:'name',       label:t('common.nombre'),            type:'text', placeholder:'Ej: María García', req:true },
            { key:'birth_date', label:t('pacientes.fechaNacimiento'), type:'date', placeholder:'',                req:false },
            { key:'diagnosis',  label:t('pacientes.diagnostico'),    type:'text', placeholder:'Ej: TEA Nivel 2',  req:false },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color:'var(--text-muted)' }}>
                {f.label}{f.req && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <input type={f.type} placeholder={f.placeholder}
                value={(newForm as any)[f.key]}
                onChange={e=>setNewForm(fm=>({...fm,[f.key]:e.target.value}))}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                style={{ background:'var(--muted-bg)', borderColor:'var(--card-border)', color:'var(--text-primary)' }}/>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={()=>setShowNew(false)}
            className="flex-1 py-3 rounded-xl font-bold text-sm border"
            style={{ borderColor:'var(--card-border)', color:'var(--text-muted)' }}>
            {t('common.cancelar')}
          </button>
          <button onClick={handleCreate} disabled={saving||!newForm.name.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
            {t('pacientes.crear')}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ background:'var(--bg)' }}>
      {ListPanel}
      {DetailPanel}
      {NewModal}
    </div>
  )
}
