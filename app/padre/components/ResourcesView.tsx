'use client'

import { useState, useEffect } from 'react'
import {
  Book, Video, FileText, Link as LinkIcon, Image as ImageIcon, Music,
  ExternalLink, Download, X, Loader2, RefreshCw, Sparkles, Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  video:    { icon: Video,       color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    label: 'Video' },
  pdf:      { icon: FileText,    color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   label: 'PDF / Doc' },
  link:     { icon: LinkIcon,    color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200', label: 'Enlace web' },
  image:    { icon: ImageIcon,   color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200',label: 'Imagen' },
  document: { icon: Book,        color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  label: 'Material' },
  audio:    { icon: Music,       color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200', label: 'Audio' },
}

interface Resource {
  id: string
  title: string
  description: string
  resource_type: string
  url: string
  is_global: boolean
  parent_id: string | null
  tags: string[]
  created_at: string
}

interface Props {
  profile: any
}

export default function ResourcesView({ profile }: Props) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Resource | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      // Get children IDs for this parent
      const { data: myChildren } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', profile.id)
      
      const childIds = (myChildren || []).map((c: any) => c.id)
      
      // Load global + parent-targeted + child-targeted resources
      let orClause = `is_global.eq.true,parent_id.eq.${profile.id}`
      if (childIds.length > 0) {
        childIds.forEach((cid: string) => {
          orClause += `,child_id.eq.${cid}`
        })
      }
      
      const { data, error } = await supabase
        .from('parent_resources')
        .select('*')
        .or(orClause)
        .order('created_at', { ascending: false })
      if (!error) setResources(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profile?.id])

  const filtered = resources.filter(r => {
    const matchType = filterType === 'all' || r.resource_type === filterType
    const matchSearch = !searchTerm || 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchType && matchSearch
  })

  const isYouTube = (url: string) => url?.includes('youtube.com') || url?.includes('youtu.be')
  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    return url
  }

  const typeEntries = Object.entries(TYPE_CONFIG)

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl shadow-violet-200">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Book size={16} className="opacity-80"/>
            <span className="text-violet-200 text-xs font-black uppercase tracking-wider">Materiales</span>
          </div>
          <h1 className="text-2xl font-black mb-1">Biblioteca de Recursos</h1>
          <p className="text-violet-200 text-sm">Material educativo compartido por el equipo terapéutico</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
              <p className="text-xl font-black">{resources.length}</p>
              <p className="text-[10px] text-violet-200 font-bold uppercase">Disponibles</p>
            </div>
            <div className="bg-white/15 rounded-2xl px-4 py-2 text-center">
              <p className="text-xl font-black">{resources.filter(r => !r.is_global).length}</p>
              <p className="text-[10px] text-violet-200 font-bold uppercase">Para ti</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Buscar materiales..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-violet-400 transition-all shadow-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterType('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all ${filterType === 'all' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
            Todos
          </button>
          {typeEntries.map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterType(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 ${filterType === key ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
              <cfg.icon size={12}/> {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-600 transition-all">
          <RefreshCw size={13}/> Actualizar
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"/>
          <p className="text-slate-400 text-sm font-medium">Cargando recursos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Book size={28} className="text-violet-300"/>
          </div>
          <h3 className="font-bold text-slate-700 mb-1">
            {resources.length === 0 ? 'Sin recursos por ahora' : 'No se encontraron resultados'}
          </h3>
          <p className="text-slate-400 text-sm">
            {resources.length === 0 
              ? 'El equipo terapéutico compartirá materiales pronto'
              : 'Prueba con otro término de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(resource => {
            const cfg = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.document
            const Icon = cfg.icon
            const isPersonal = !resource.is_global
            return (
              <div
                key={resource.id}
                onClick={() => setSelected(resource)}
                className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5 ${isPersonal ? 'border-violet-200 hover:border-violet-400' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 ${cfg.bg} ${cfg.border} border-2 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon size={22} className={cfg.color}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-black text-slate-800 text-sm truncate">{resource.title}</p>
                      {isPersonal && (
                        <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[9px] font-black border border-violet-200 flex items-center gap-0.5 shrink-0">
                          <Bell size={8}/> Para ti
                        </span>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                      {resource.tags?.slice(0,2).map(t => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-200">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0"/>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resource Modal */}
      {selected && (() => {
        const cfg = TYPE_CONFIG[selected.resource_type] || TYPE_CONFIG.document
        const Icon = cfg.icon
        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal header */}
              <div className={`bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white flex items-start justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Icon size={20}/>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{cfg.label}</p>
                    <h3 className="font-black text-lg leading-tight">{selected.title}</h3>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all shrink-0">
                  <X size={18}/>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Description */}
                {selected.description && (
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    {selected.description}
                  </p>
                )}

                {/* Tags */}
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map(t => (
                      <span key={t} className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-full border border-violet-200">{t}</span>
                    ))}
                  </div>
                )}

                {/* Embed if YouTube */}
                {selected.resource_type === 'video' && isYouTube(selected.url) && (
                  <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden">
                    <iframe
                      width="100%" height="100%"
                      src={getEmbedUrl(selected.url)}
                      title={selected.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16}/> Abrir {cfg.label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
