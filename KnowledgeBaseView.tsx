'use client'
import { useI18n } from '@/lib/i18n-context'
import { useState, useEffect, useRef } from 'react'
import { supabase as supabasePublic } from '@/lib/supabase'
import {
  Upload, Trash2, CheckCircle2, Clock, Loader2,
  FileText, Plus, X, Brain, Save, Search,
  Sparkles, Cpu, BookMarked, RefreshCw,
} from 'lucide-react'
import { useToast } from '@/components/Toast'

type InputMode = 'archivo' | 'url' | 'texto' | 'buscar'
type Tab = 'aprender' | 'biblioteca'

export default function KnowledgeBaseView() {
  const toast = useToast()
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('aprender')
  const [documentos, setDocumentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [keywords, setKeywords] = useState('')
  const [modo, setModo] = useState<'completo' | 'rapido'>('completo')
  const [aprendiendo, setAprendiendo] = useState(false)
  const [logAprender, setLogAprender] = useState<string[]>([])
  const [resultadoAprender, setResultadoAprender] = useState<any>(null)
  const [urlAprender, setUrlAprender] = useState('')
  const [modoFuente, setModoFuente] = useState<'keywords' | 'url'>('keywords')

  const temasSugeridos = [
    'Reforzamiento positivo ABA',
    'Comunicación aumentativa AAC TEA',
    'Análisis funcional de conducta',
    'Habilidades sociales autismo',
    'Control de impulsos TDAH',
    'Moldeamiento shaping ABA',
    'Entrenamiento de habilidades diarias',
    'Regulación emocional niños',
    'Terapia de juego ABA',
    'Lenguaje verbal comportamental',
    'Reducción de conductas repetitivas',
    'Integración sensorial TEA',
  ]

  const [inputMode, setInputMode] = useState<InputMode>('archivo')
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ titulo: '', tipo: 'libro', descripcion: '', texto: '', url: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([])
  const [libroSeleccionado, setLibroSeleccionado] = useState<any>(null)

  const loadDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge/ingest')
      const json = await res.json()
      setDocumentos(json.data || [])
    } catch { toast.error('Error cargando documentos') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadDocs() }, [])

  const handleAprender = async () => {
    if (!keywords.trim()) { toast.error('Escribe palabras clave'); return }
    setAprendiendo(true)
    setLogAprender([`🚀 Iniciando aprendizaje: "${keywords}"...`])
    setResultadoAprender(null)
    try {
      const res = await fetch('/api/knowledge/aprender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.trim(), modo }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setLogAprender(json.log || [])
      setResultadoAprender(json)
      toast.success(`✅ ${json.totalChunks} fragmentos aprendidos`)
      await loadDocs()
    } catch (e: any) {
      toast.error(e.message)
      setLogAprender(prev => [...prev, `❌ Error: ${e.message}`])
    } finally { setAprendiendo(false) }
  }

  const handleRetry = async (id: string) => {
    try {
      const res = await fetch('/api/knowledge/ingest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.ok) { toast.success(`✅ Re-indexado: ${json.chunks} fragmentos`); await loadDocs() }
      else toast.error(json.error || 'Error al re-indexar')
    } catch (e: any) { toast.error(e.message) }
  }

  const handleAprenderUrl = async () => {
    if (!urlAprender.trim()) { toast.error('Ingresa una URL'); return }
    setAprendiendo(true)
    setLogAprender([`🌐 Leyendo URL: "${urlAprender}"...`])
    setResultadoAprender(null)
    try {
      let hostname = urlAprender
      try { hostname = new URL(urlAprender).hostname } catch { /* keep raw */ }
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Página web: ${hostname}`,
          tipo: 'articulo',
          sourceUrl: urlAprender,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error leyendo la URL')
      setLogAprender([
        `✅ URL leída: ${json.chars?.toLocaleString() || 0} caracteres`,
        `✅ Método: ${json.method || 'scraping'}`,
        `✅ Indexados: ${json.chunks || 0} fragmentos`,
        `🎉 La IA ya aprendió el contenido de esa página`,
      ])
      setResultadoAprender({ keywords: urlAprender, terminos: [urlAprender], fuentes: 1, documentos: 1, totalChunks: json.chunks || 0 })
      toast.success(`✅ ${json.chunks} fragmentos aprendidos de la URL`)
      await loadDocs()
    } catch (e: any) {
      toast.error(e.message)
      setLogAprender(prev => [...prev, `❌ ${e.message}`])
    } finally { setAprendiendo(false) }
  }

  const buscarLibros = async () => {
    if (!busqueda.trim()) return
    setBuscando(true); setResultadosBusqueda([]); setLibroSeleccionado(null)
    try {
      const res = await fetch(`/api/knowledge/buscar-libro?q=${encodeURIComponent(busqueda)}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResultadosBusqueda(json.resultados || [])
      if (!json.resultados?.length) toast.error('Sin resultados. Prueba otro título.')
    } catch (e: any) { toast.error(e.message) }
    finally { setBuscando(false) }
  }

  const handleUpload = async () => {
    if (!form.titulo) { toast.error('El título es requerido'); return }
    if (inputMode === 'archivo' && !selectedFile) { toast.error('Selecciona un archivo'); return }
    if (inputMode === 'url' && !form.url.trim()) { toast.error('Ingresa una URL válida'); return }
    if (inputMode === 'texto' && !form.texto.trim()) { toast.error('Pega el contenido'); return }
    if (inputMode === 'buscar' && !libroSeleccionado) { toast.error('Selecciona un libro'); return }
    setUploading(true)
    try {
      const body: Record<string, any> = { titulo: form.titulo, tipo: form.tipo, descripcion: form.descripcion }
      if (inputMode === 'archivo' && selectedFile) {
        setUploadProgress('Subiendo archivo...')
        const safeName = `${Date.now()}-${selectedFile.name.replace(/[^a-z0-9._-]/gi, '_')}`
        const { data: up, error: upErr } = await supabasePublic.storage
          .from('knowledge-base').upload(safeName, selectedFile, { upsert: false })
        if (upErr) throw new Error(`Upload error: ${upErr.message}`)
        const { data: signed } = await supabasePublic.storage
          .from('knowledge-base').createSignedUrl(up.path, 60 * 60 * 24 * 7)
        body.storageUrl = signed?.signedUrl
        body.fileName = selectedFile.name
      } else if (inputMode === 'url') {
        body.sourceUrl = form.url.trim()
      } else if (inputMode === 'texto') {
        body.texto = form.texto
      } else if (inputMode === 'buscar' && libroSeleccionado) {
        body.sourceUrl = libroSeleccionado.url
        if (!form.titulo) body.titulo = libroSeleccionado.titulo
      }
      setUploadProgress('Procesando e indexando...')
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      toast.success(`✅ ${json.chunks || 0} fragmentos indexados`)
      setShowForm(false)
      setForm({ titulo: '', tipo: 'libro', descripcion: '', texto: '', url: '' })
      setSelectedFile(null); setLibroSeleccionado(null)
      await loadDocs()
    } catch (e: any) { toast.error(e.message) }
    finally { setUploading(false); setUploadProgress('') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return
    await fetch('/api/knowledge/ingest', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Documento eliminado')
    await loadDocs()
  }

  const docsAuto = documentos.filter(d => d.source_url?.startsWith('auto:'))
  const docsManual = documentos.filter(d => !d.source_url?.startsWith('auto:'))
  const totalChunks = documentos.reduce((a, d) => a + (d.total_chunks || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 rounded-2xl p-3">
            <Brain size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-black">Cerebro IA</h2>
            <p className="text-violet-200 text-sm mt-1">{t('ui.baseConocimiento')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{documentos.length}</p>
            <p className="text-violet-200 text-xs mt-0.5">Documentos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{totalChunks.toLocaleString()}</p>
            <p className="text-violet-200 text-xs mt-0.5">Fragmentos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{docsAuto.length}</p>
            <p className="text-violet-200 text-xs mt-0.5">Auto-aprendidos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 border border-slate-100 shadow-sm gap-1">
        <button onClick={() => setTab('aprender')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${tab === 'aprender' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <Sparkles size={15} /> Aprender de Internet
        </button>
        <button onClick={() => setTab('biblioteca')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${tab === 'biblioteca' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
          <BookMarked size={15} /> Biblioteca ({documentos.length})
        </button>
      </div>

      {/* ══ TAB: APRENDER ══ */}
      {tab === 'aprender' && (
        <div className="space-y-4">

          {/* Cómo funciona */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={16} className="text-violet-600" />
              <span className="font-bold text-violet-800 text-sm">{t('ui.comoFuncAuto')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: '🔍', t: 'Expande palabras clave', d: 'La IA genera 8-12 términos técnicos relacionados' },
                { icon: '🌐', t: 'Busca en internet', d: 'Wikipedia ES/EN + artículos PubMed científicos' },
                { icon: '🤖', t: 'Sintetiza con IA', d: 'Genera resumen clínico estructurado para ABA' },
                { icon: '🧠', t: 'Indexa en el Cerebro', d: 'ARIA y todos los agentes ya saben ese tema' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-violet-100">
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className="text-xs font-bold text-violet-700">{s.t}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Input box */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">

            {/* Selector keywords vs URL */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button onClick={() => setModoFuente('keywords')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${modoFuente === 'keywords' ? 'bg-white shadow text-violet-700' : 'text-slate-500'}`}>
                🔍 Palabras clave
              </button>
              <button onClick={() => setModoFuente('url')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${modoFuente === 'url' ? 'bg-white shadow text-violet-700' : 'text-slate-500'}`}>
                🌐 URL de página web
              </button>
            </div>

            {/* Keywords section */}
            {modoFuente === 'keywords' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  ¿Qué tema quieres que aprenda la IA?
                </label>
                <textarea
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="{t('ui.ejemplosRefuerzo')}"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                  rows={3}
                  disabled={aprendiendo}
                />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Temas sugeridos:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {temasSugeridos.map(tema => (
                      <button key={tema} onClick={() => setKeywords(tema)} disabled={aprendiendo}
                        className="text-[11px] bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200 hover:border-violet-200 px-2.5 py-1 rounded-full transition">
                        {tema}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['completo', 'rapido'] as const).map(m => (
                    <button key={m} onClick={() => setModo(m)}
                      className={`flex-1 p-3 rounded-xl border text-left transition ${modo === m ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-500 hover:border-violet-200'}`}>
                      <p className="text-xs font-bold">{m === 'completo' ? '🔬 Completo' : '⚡ Rápido'}</p>
                      <p className={`text-[10px] mt-0.5 ${modo === m ? 'text-violet-200' : 'text-slate-400'}`}>
                        {m === 'completo' ? 'Más fuentes, más fragmentos, más rico' : 'Solo síntesis IA, más veloz'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* URL section */}
            {modoFuente === 'url' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  URL de página web a aprender
                </label>
                <input
                  value={urlAprender}
                  onChange={e => setUrlAprender(e.target.value)}
                  placeholder="https://ejemplo.com/articulo-sobre-aba"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  disabled={aprendiendo}
                />
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-bold mb-1">{t('ui.queTipoURLs')}</p>
                  <p className="text-[11px] text-blue-600">{t('ui.urlsPublicas')}</p>
                  <p className="text-[11px] text-blue-600">{t('ui.urlsOrg')}</p>
                  <p className="text-[11px] text-slate-400">{t('ui.urlsNoFuncionan')}</p>
                </div>
              </div>
            )}

            {/* Botón aprender */}
            <button
              onClick={modoFuente === 'url' ? handleAprenderUrl : handleAprender}
              disabled={aprendiendo || (modoFuente === 'keywords' ? !keywords.trim() : !urlAprender.trim())}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-black flex items-center justify-center gap-2 text-sm transition shadow-md">
              {aprendiendo
                ? <><Loader2 size={16} className="animate-spin" /> Aprendiendo desde internet...</>
                : <><Sparkles size={16} /> Aprender ahora</>}
            </button>
          </div>

          {/* Log */}
          {logAprender.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs space-y-1.5">
              <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-2">{t('ui.progresoTiempoReal')}</p>
              {logAprender.map((line, i) => (
                <p key={i} className={
                  line.startsWith('✅') ? 'text-emerald-400' :
                  line.startsWith('❌') ? 'text-red-400' :
                  line.startsWith('⚠️') ? 'text-amber-400' :
                  line.startsWith('🎉') ? 'text-violet-300 font-bold' :
                  'text-slate-300'
                }>{line}</p>
              ))}
              {aprendiendo && <p className="text-violet-400 animate-pulse">⟳ Procesando...</p>}
            </div>
          )}

          {/* Resultado */}
          {resultadoAprender && !aprendiendo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <span className="font-black text-emerald-800">{t('ui.aprendizajeComp')}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { v: resultadoAprender.fuentes, l: 'Fuentes' },
                  { v: resultadoAprender.documentos, l: 'Documentos' },
                  { v: resultadoAprender.totalChunks, l: 'Fragmentos' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-center border border-emerald-100">
                    <p className="text-xl font-black text-emerald-700">{s.v}</p>
                    <p className="text-[11px] text-slate-500">{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-emerald-700 bg-white rounded-xl px-3 py-2.5 border border-emerald-100">
                🤖 ARIA ya conoce sobre <strong>"{resultadoAprender.keywords}"</strong>. Prueba preguntarle ahora.
              </p>
              {resultadoAprender.terminos?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-emerald-700 mb-1.5">{t('ui.terminosAprendidos')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resultadoAprender.terminos.map((t: string, i: number) => (
                      <span key={i} className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Temas ya aprendidos */}
          {docsAuto.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                Temas ya aprendidos por la IA ({docsAuto.length})
              </p>
              <div className="space-y-2">
                {docsAuto.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">🧠</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{doc.titulo.replace('[IA] ', '')}</p>
                        <p className="text-[10px] text-slate-400">{doc.total_chunks || 0} fragmentos · {new Date(doc.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {doc.procesado ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-400" />}
                      <button onClick={() => handleDelete(doc.id)} className="p-1 text-slate-300 hover:text-red-400 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: BIBLIOTECA ══ */}
      {tab === 'biblioteca' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(v => !v)}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-sm transition">
            {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> {t('ui.agregarDocManual')}</>}
          </button>

          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <p className="font-bold text-slate-700 text-sm">Agregar documento</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['archivo', 'url', 'texto', 'buscar'] as const).map(m => {
                  const icons: Record<string, string> = { archivo: '📎', url: '🔗', texto: '📝', buscar: '🔍' }
                  const labels: Record<string, string> = { archivo: 'Archivo PDF/TXT', url: 'URL', texto: 'Pegar texto', buscar: 'Buscar libro' }
                  return (
                    <button key={m} onClick={() => { setInputMode(m); setLibroSeleccionado(null) }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${inputMode === m ? 'bg-violet-100 border-violet-300 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-200'}`}>
                      <span className="text-lg block mb-0.5">{icons[m]}</span>{labels[m]}
                    </button>
                  )
                })}
              </div>

              <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="{t('ui.tituloDoc')}"
                value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />

              <div className="flex gap-2">
                {['libro', 'articulo', 'guia', 'protocolo'].map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, tipo: t }))}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-bold transition capitalize ${form.tipo === t ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-500'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {inputMode === 'archivo' && (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition">
                  <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                  {selectedFile
                    ? <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                    : <p className="text-sm text-slate-400">Click para seleccionar PDF o TXT</p>}
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.txt,.doc,.docx"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setSelectedFile(f); if (!form.titulo) setForm(p => ({ ...p, titulo: f.name.replace(/\.[^.]+$/, '') })) }
                    }} />
                </div>
              )}

              {inputMode === 'url' && (
                <input className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="https://drive.google.com/..."
                  value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
              )}

              {inputMode === 'texto' && (
                <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                  placeholder="{t('ui.pegaContenido')}"
                  rows={6} value={form.texto} onChange={e => setForm(p => ({ ...p, texto: e.target.value }))} />
              )}

              {inputMode === 'buscar' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                      placeholder="{t('ui.buscarArchive')}" value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarLibros()} />
                    <button onClick={buscarLibros} disabled={buscando}
                      className="px-4 bg-violet-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                      {buscando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {resultadosBusqueda.map(libro => (
                      <div key={libro.id}
                        onClick={() => { setLibroSeleccionado(libro); setForm(p => ({ ...p, titulo: libro.titulo })) }}
                        className={`p-3 rounded-xl border cursor-pointer transition ${libroSeleccionado?.id === libro.id ? 'bg-violet-50 border-violet-300' : 'border-slate-200 hover:border-violet-200'}`}>
                        <p className="font-semibold text-slate-800 text-xs truncate">{libro.titulo}</p>
                        <p className="text-[10px] text-slate-500">{libro.autor} · {libro.fuente} · {libro.formato}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                placeholder="{t('ui.descripcionOpcional')}" rows={2}
                value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />

              <button onClick={handleUpload} disabled={uploading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" /> {uploadProgress || 'Procesando...'}</>
                  : <><Save size={14} /> Indexar en el Cerebro</>}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
          ) : documentos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <Brain size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">{t('ui.baseVacia')}</p>
              <p className="text-slate-400 text-sm mt-1">{t('ui.usarAprender')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docsManual.length > 0 && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                  Subidos manualmente ({docsManual.length})
                </p>
              )}
              {docsManual.map(doc => (
                <DocCard key={doc.id} doc={doc} onDelete={handleDelete} onRetry={handleRetry} />
              ))}
              {docsAuto.length > 0 && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1 pt-2">
                  Auto-aprendidos ({docsAuto.length})
                </p>
              )}
              {docsAuto.map(doc => (
                <DocCard key={doc.id} doc={doc} onDelete={handleDelete} onRetry={handleRetry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, onDelete, onRetry }: {
  doc: any
  onDelete: (id: string) => void
  onRetry?: (id: string) => void
}) {
  const isAuto = doc.source_url?.startsWith('auto:')
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center justify-between gap-3 hover:border-slate-200 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAuto ? 'bg-violet-100' : 'bg-slate-100'}`}>
          {isAuto
            ? <Sparkles size={16} className="text-violet-600" />
            : <FileText size={16} className="text-slate-500" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{doc.titulo.replace('[IA] ', '')}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${isAuto ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
              {isAuto ? 'auto' : doc.tipo}
            </span>
            <span className="text-[10px] text-slate-400">{doc.total_chunks || 0} fragmentos</span>
            <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.procesado && doc.total_chunks > 0 ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <CheckCircle2 size={12} />Listo
          </span>
        ) : doc.procesado && doc.total_chunks === 0 ? (
          <button onClick={() => onRetry?.(doc.id)}
            className="flex items-center gap-1 text-[10px] text-red-500 font-bold hover:underline">
            <RefreshCw size={11} />Re-indexar
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
            <Clock size={12} />Pendiente
          </span>
        )}
        <button onClick={() => onDelete(doc.id)}
          className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
