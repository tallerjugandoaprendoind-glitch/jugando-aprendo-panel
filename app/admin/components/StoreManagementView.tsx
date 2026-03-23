'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShoppingBag, Plus, Edit2, Trash2, Package, X, Save, Loader2,
  Upload, ImageIcon, CheckCircle, Clock, ToggleLeft, ToggleRight,
  AlertTriangle, Phone, ChevronDown, ChevronUp,
  XCircle, Search, BadgeCheck, TrendingUp, ShoppingCart, Boxes,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/components/ThemeContext'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string; nombre: string; descripcion: string; precio_soles: number
  stock: number; categoria: string; tipo: 'fisico' | 'digital'
  imagen_url: string | null; activo: boolean; destacado: boolean; created_at: string
}
interface OrderItem {
  id: string; product_nombre: string; product_imagen: string
  cantidad: number; precio_unitario: number; subtotal: number
}
interface Order {
  id: string; parent_name: string; parent_email: string; parent_phone: string
  total_soles: number; estado: string; notas: string; admin_notas: string
  created_at: string; store_order_items: OrderItem[]
}

const ESTADO_CFG: Record<string, any> = {
  pendiente:  { label: 'Pendiente',  icon: Clock,       bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',   dot: 'bg-amber-400',   ring: 'ring-amber-300'  },
  confirmado: { label: 'Confirmado', icon: CheckCircle, bg: 'bg-sky-50',     border: 'border-sky-200',    text: 'text-sky-700',     dot: 'bg-sky-400',     ring: 'ring-sky-300'    },
  listo:      { label: 'Listo',      icon: Package,     bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700',  dot: 'bg-violet-400',  ring: 'ring-violet-300' },
  entregado:  { label: 'Entregado',  icon: BadgeCheck,  bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700', dot: 'bg-emerald-400', ring: 'ring-emerald-300'},
  cancelado:  { label: 'Cancelado',  icon: XCircle,     bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-700',     dot: 'bg-red-400',     ring: 'ring-red-300'    },
}
const CATEGORIAS = ['material', 'guia', 'juego', 'libro', 'otro']
const ESTADOS_FLUJO = ['pendiente', 'confirmado', 'listo', 'entregado', 'cancelado']
const CAT_EMOJI: Record<string,string> = { material:'🧩', guia:'📋', juego:'🎮', libro:'📚', otro:'🎁' }
const EMPTY_FORM = {
  nombre: '', descripcion: '', precio_soles: '', stock: '',
  categoria: 'material', tipo: 'fisico' as 'fisico'|'digital', activo: true, destacado: false,
}

// ── Modal Producto ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }: { product: Product|null; onClose:()=>void; onSaved:()=>void }) {
  const toast = useToast(); const { isDark } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<any>(product ? {
    nombre: product.nombre, descripcion: product.descripcion || '',
    precio_soles: String(product.precio_soles), stock: String(product.stock),
    categoria: product.categoria, tipo: product.tipo, activo: product.activo, destacado: product.destacado,
  } : EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState<string|null>(product?.imagen_url||null)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    if (file.size > 5*1024*1024) { toast.error('Máximo 5MB'); return }
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }
  const uploadImage = async (): Promise<string|null> => {
    if (!imageFile) return product?.imagen_url||null
    const ext = imageFile.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('store-images').upload(path, imageFile, { upsert: true })
    if (error) { toast.error('Error subiendo imagen'); return null }
    return supabase.storage.from('store-images').getPublicUrl(path).data.publicUrl
  }
  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.precio_soles || Number(form.precio_soles) < 0) { toast.error('Precio inválido'); return }
    setSaving(true)
    try {
      const imagen_url = await uploadImage()
      const payload = {
        nombre: form.nombre.trim(), descripcion: form.descripcion.trim(),
        precio_soles: Number(form.precio_soles),
        stock: form.tipo === 'digital' ? 9999 : Number(form.stock),
        categoria: form.categoria, tipo: form.tipo,
        activo: form.activo, destacado: form.destacado, imagen_url,
        updated_at: new Date().toISOString(),
      }
      if (product) {
        const { error } = await supabase.from('store_products').update(payload).eq('id', product.id)
        if (error) throw error; toast.success('Producto actualizado')
      } else {
        const { error } = await supabase.from('store_products').insert(payload)
        if (error) throw error; toast.success('Producto creado')
      }
      onSaved()
    } catch (e: any) { toast.error('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const inp = `w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all border-2 ${isDark ? 'bg-[#0d1117] border-[#30363d] text-slate-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400 focus:bg-white'}`

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className={`rounded-3xl w-full max-w-2xl max-h-[94vh] overflow-y-auto shadow-2xl ${isDark ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-7 py-5 border-b flex items-center justify-between ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <ShoppingBag size={17} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{product ? `ID: ${product.id.slice(0,8)}…` : 'Completa los datos del artículo'}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-[#21262d] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={20}/></button>
        </div>

        <div className="p-7 space-y-6">
          {/* Drop zone imagen */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Imagen del producto</label>
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden group ${dragOver ? 'border-blue-400 scale-[0.99]' : isDark ? 'border-[#30363d] hover:border-blue-500' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
              style={{ minHeight: 180 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImage(f) }}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="bg-white rounded-2xl px-5 py-3 text-sm font-bold text-slate-800 flex items-center gap-2 shadow-xl"><Upload size={15}/> Cambiar imagen</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>
                    <ImageIcon size={28} className={isDark ? 'text-slate-500' : 'text-slate-300'} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Arrastrá o hacé clic para subir</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>JPG, PNG, WEBP · máx. 5MB</p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f) }} />
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm((f:any) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Kit de materiales sensoriales" className={inp} />
          </div>

          {/* Descripción */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm((f:any) => ({ ...f, descripcion: e.target.value }))}
              rows={3} placeholder="Describe el producto, materiales, beneficios…" className={inp + ' resize-none'} />
          </div>

          {/* Tipo */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              {([['fisico','📦','Físico','Se retira en el centro'],['digital','📄','Digital','PDF o archivo descargable']] as const).map(([val,emoji,lbl,desc]) => (
                <button key={val} type="button" onClick={() => setForm((f:any) => ({ ...f, tipo: val }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.tipo === val
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : isDark ? 'border-[#30363d] hover:border-[#4a5568]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <span className="text-2xl block mb-2">{emoji}</span>
                  <p className={`font-black text-sm ${form.tipo===val ? 'text-blue-700 dark:text-blue-300' : isDark ? 'text-slate-300' : 'text-slate-800'}`}>{lbl}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Precio + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Precio (S/.) *</label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>S/</span>
                <input type="number" min="0" step="0.50" value={form.precio_soles}
                  onChange={e => setForm((f:any) => ({ ...f, precio_soles: e.target.value }))}
                  placeholder="0.00" className={inp + ' pl-10'} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{form.tipo==='digital' ? 'Stock (∞)' : 'Stock *'}</label>
              <input type="number" min="0" value={form.tipo==='digital' ? '' : form.stock}
                onChange={e => setForm((f:any) => ({ ...f, stock: e.target.value }))}
                disabled={form.tipo==='digital'} placeholder={form.tipo==='digital' ? '∞ Ilimitado' : '0'}
                className={inp + (form.tipo==='digital' ? ' opacity-50 cursor-not-allowed' : '')} />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button key={cat} type="button" onClick={() => setForm((f:any) => ({ ...f, categoria: cat }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-bold capitalize transition-all ${form.categoria===cat
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : isDark ? 'border-[#30363d] text-slate-400 hover:border-[#4a5568]' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}>
                  {CAT_EMOJI[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key:'activo', label:'Visible en tienda', desc:'Los padres pueden verlo', icon:'👁️', ac:'emerald' },
              { key:'destacado', label:'Destacado', desc:'Aparece primero con ⭐', icon:'⭐', ac:'amber' },
            ].map(({ key, label, desc, icon, ac }) => {
              const on = form[key]
              return (
                <button key={key} type="button" onClick={() => setForm((f:any) => ({ ...f, [key]: !f[key] }))}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${on
                    ? ac==='emerald' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : isDark ? 'border-[#30363d]' : 'border-slate-200 bg-white'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${on ? ac==='emerald' ? 'bg-emerald-100 dark:bg-emerald-800/40' : 'bg-amber-100 dark:bg-amber-800/40' : isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>{icon}</div>
                  <div className="flex-1">
                    <p className={`text-sm font-black ${on ? ac==='emerald' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{desc}</p>
                  </div>
                  {on ? <ToggleRight size={22} className={ac==='emerald' ? 'text-emerald-500' : 'text-amber-500'}/> : <ToggleLeft size={22} className={isDark ? 'text-slate-600' : 'text-slate-300'}/>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 px-7 py-5 border-t flex gap-3 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-100'}`}>
          <button onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-[#21262d] text-slate-300 hover:bg-[#30363d]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
            {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
            {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta producto ──────────────────────────────────────────────────────────
function ProductCard({ p, onEdit, onToggle, onDelete }: { p:Product; onEdit:()=>void; onToggle:()=>void; onDelete:()=>void }) {
  const { isDark } = useTheme()
  const lowStock = p.tipo==='fisico' && p.stock<=3
  return (
    <div className={`group rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${isDark
      ? 'bg-[#161b22] border-[#21262d] hover:border-[#30363d]'
      : p.activo ? 'bg-white border-slate-200 hover:border-blue-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>

      {/* Imagen */}
      <div className="relative h-48 overflow-hidden">
        {p.imagen_url ? (
          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
        ) : (
          <div className={`flex items-center justify-center h-full ${isDark ? 'bg-[#0d1117]' : 'bg-gradient-to-br from-slate-100 to-slate-50'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${isDark ? 'bg-[#21262d]' : 'bg-white shadow-sm'}`}>
              {CAT_EMOJI[p.categoria]||'📦'}
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm ${p.tipo==='digital' ? 'bg-violet-600/90 text-white' : 'bg-slate-900/80 text-white'}`}>
            {p.tipo==='digital' ? '📄 Digital' : '📦 Físico'}
          </span>
          {p.destacado && <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-400/90 text-white">⭐ Top</span>}
        </div>
        {lowStock && (
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${p.stock===0 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
              {p.stock===0 ? '❌ Sin stock' : `⚠️ Solo ${p.stock}`}
            </span>
          </div>
        )}
        {!p.activo && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
            <span className="text-xs font-black text-white bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm">Oculto</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`font-black text-sm leading-snug flex-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{p.nombre}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${isDark ? 'bg-[#21262d] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            {CAT_EMOJI[p.categoria]} {p.categoria}
          </span>
        </div>
        <p className={`text-xs leading-relaxed line-clamp-2 mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{p.descripcion||'Sin descripción'}</p>

        <div className={`flex items-center justify-between mb-4 pb-4 border-b ${isDark ? 'border-[#21262d]' : 'border-slate-100'}`}>
          <span className={`text-2xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>S/ {Number(p.precio_soles).toFixed(2)}</span>
          <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {p.tipo==='digital' ? '∞ Stock' : `${p.stock} disponibles`}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onToggle} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${p.activo
            ? isDark ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : isDark ? 'bg-[#21262d] text-slate-500 border-[#30363d]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
            {p.activo ? <><ToggleRight size={13}/> Activo</> : <><ToggleLeft size={13}/> Inactivo</>}
          </button>
          <button onClick={onEdit} className={`px-3 py-2 rounded-xl border transition-all ${isDark ? 'bg-[#21262d] text-blue-400 border-[#30363d] hover:bg-blue-900/20' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
            <Edit2 size={13}/>
          </button>
          <button onClick={onDelete} className={`px-3 py-2 rounded-xl border transition-all ${isDark ? 'bg-[#21262d] text-red-400 border-[#30363d] hover:bg-red-900/20' : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'}`}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function StoreManagementView() {
  const toast = useToast(); const { isDark } = useTheme(); const { locale } = useI18n()
  const [tab, setTab] = useState<'productos'|'pedidos'>('productos')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product|null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string|null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string|null>(null)

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false })
    setProducts(data||[])
  }, [])
  const loadOrders = useCallback(async () => {
    const { data } = await supabase.from('store_orders').select('*, store_order_items(*)').order('created_at', { ascending: false })
    setOrders(data||[])
  }, [])

  useEffect(() => {
    const load = async () => { setLoading(true); await Promise.all([loadProducts(), loadOrders()]); setLoading(false) }
    load()
  }, [loadProducts, loadOrders])

  const toggleActivo = async (p: Product) => {
    await supabase.from('store_products').update({ activo: !p.activo }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id===p.id ? { ...x, activo: !x.activo } : x))
    toast.success(p.activo ? 'Producto ocultado' : 'Producto activado')
  }
  const deleteProduct = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    const { error } = await supabase.from('store_products').delete().eq('id', p.id)
    if (error) { toast.error('Error: '+error.message); return }
    setProducts(prev => prev.filter(x => x.id!==p.id)); toast.success('Producto eliminado')
  }
  const updateOrderEstado = async (orderId: string, estado: string) => {
    setUpdatingOrder(orderId)
    await supabase.from('store_orders').update({ estado, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id===orderId ? { ...o, estado } : o))
    toast.success(`Pedido: ${ESTADO_CFG[estado]?.label}`); setUpdatingOrder(null)
  }
  const updateAdminNota = async (orderId: string, nota: string) => {
    await supabase.from('store_orders').update({ admin_notas: nota }).eq('id', orderId)
    toast.success('Nota guardada')
  }

  const stats = {
    total: products.length, activos: products.filter(p => p.activo).length,
    stockBajo: products.filter(p => p.tipo==='fisico' && p.stock<=3 && p.activo).length,
    pendientes: orders.filter(o => o.estado==='pendiente').length,
    revenue: orders.filter(o => o.estado!=='cancelado').reduce((s,o) => s+o.total_soles, 0),
  }
  const filteredProducts = products.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) && (filterTipo==='todos'||p.tipo===filterTipo))
  const filteredOrders = orders.filter(o => filterEstado==='todos'||o.estado===filterEstado)

  const colorMap: Record<string, string> = {
    blue:'from-blue-500 to-blue-700', emerald:'from-emerald-500 to-emerald-700',
    orange:'from-orange-500 to-orange-700', amber:'from-amber-500 to-amber-700',
    violet:'from-violet-500 to-violet-700', slate:'from-slate-400 to-slate-500',
  }
  const txtMap: Record<string, string> = {
    blue:'text-blue-600 dark:text-blue-400', emerald:'text-emerald-600 dark:text-emerald-400',
    orange:'text-orange-600 dark:text-orange-400', amber:'text-amber-600 dark:text-amber-400',
    violet:'text-violet-600 dark:text-violet-400', slate:'text-slate-500',
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 size={32} className="animate-spin text-blue-600"/>
      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cargando tienda…</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className={`rounded-3xl p-6 flex items-center justify-between gap-4 flex-wrap shadow-xl ${isDark ? 'bg-gradient-to-br from-[#1a1f2e] to-[#161b22] border border-[#21262d]' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ShoppingBag size={26} className="text-white"/>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Gestión de Tienda</h2>
            <p className="text-sm text-blue-200 mt-0.5">Productos, stock y pedidos de las familias</p>
          </div>
        </div>
        <button onClick={() => { setEditProduct(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-white text-blue-700 font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm">
          <Plus size={16}/> Nuevo producto
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label:'Productos',   value:stats.total,     icon:Boxes,         color:'blue',    sub:`${stats.activos} activos` },
          { label:'Activos',     value:stats.activos,   icon:BadgeCheck,    color:'emerald', sub:'visibles para padres' },
          { label:'Stock bajo',  value:stats.stockBajo, icon:AlertTriangle, color:stats.stockBajo>0?'orange':'slate', sub:'≤3 unidades' },
          { label:'Pendientes',  value:stats.pendientes,icon:ShoppingCart,  color:stats.pendientes>0?'amber':'slate',  sub:'por atender' },
          { label:'Ingresos',    value:`S/ ${stats.revenue.toFixed(2)}`, icon:TrendingUp, color:'violet', sub:'pedidos completados' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`rounded-2xl p-4 border transition-all hover:shadow-md ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
            <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${colorMap[color]} shadow-sm`}>
              <Icon size={16} className="text-white"/>
            </div>
            <p className={`text-2xl font-black ${txtMap[color]}`}>{value}</p>
            <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</p>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className={`flex gap-1 p-1 rounded-2xl w-fit ${isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>
        {[
          { id:'productos', label:'Productos', count:products.length, icon:Boxes },
          { id:'pedidos',   label:'Pedidos',   count:orders.length,  icon:ShoppingCart, badge:stats.pendientes },
        ].map(({ id, label, count, icon: Icon, badge }: any) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===id ? 'bg-blue-600 text-white shadow-md' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15}/>
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${tab===id ? 'bg-white/20' : isDark ? 'bg-[#30363d] text-slate-400' : 'bg-white text-slate-500 shadow-sm'}`}>{count}</span>
            {badge>0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-[#21262d]"/>}
          </button>
        ))}
      </div>

      {/* TAB PRODUCTOS */}
      {tab==='productos' && (
        <div className="space-y-4">
          <div className={`flex gap-3 flex-wrap items-center p-4 rounded-2xl border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
            <div className="relative flex-1 min-w-52">
              <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto…"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border ${isDark ? 'bg-[#0d1117] border-[#30363d] text-slate-300 placeholder-slate-600 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-400 focus:bg-white'}`}/>
            </div>
            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-[#0d1117]' : 'bg-slate-100'}`}>
              {[['todos','Todos'],['fisico','📦 Físicos'],['digital','📄 Digitales']].map(([f,lbl]) => (
                <button key={f} onClick={() => setFilterTipo(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${filterTipo===f ? 'bg-blue-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  {lbl}
                </button>
              ))}
            </div>
            <p className={`text-xs font-medium ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{filteredProducts.length} resultado(s)</p>
          </div>

          {filteredProducts.length===0 ? (
            <div className={`rounded-3xl border py-24 flex flex-col items-center gap-4 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl ${isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>🛍️</div>
              <div className="text-center">
                <p className={`font-black text-lg ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No hay productos</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Creá el primer artículo de la tienda</p>
              </div>
              <button onClick={() => { setEditProduct(null); setShowModal(true) }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md shadow-blue-200 transition-all">
                <Plus size={16}/> Crear producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} p={p}
                  onEdit={() => { setEditProduct(p); setShowModal(true) }}
                  onToggle={() => toggleActivo(p)}
                  onDelete={() => deleteProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB PEDIDOS */}
      {tab==='pedidos' && (
        <div className="space-y-4">
          <div className={`flex gap-2 flex-wrap p-4 rounded-2xl border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
            {['todos',...ESTADOS_FLUJO].map(e => {
              const cfg=ESTADO_CFG[e]; const count=e==='todos'?orders.length:orders.filter(o=>o.estado===e).length; const active=filterEstado===e
              return (
                <button key={e} onClick={() => setFilterEstado(e)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${active
                    ? cfg ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm` : 'bg-blue-600 text-white border-blue-600'
                    : isDark ? 'bg-[#0d1117] text-slate-400 border-[#30363d] hover:border-[#4a5568]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>}
                  {e==='todos' ? 'Todos' : cfg?.label}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-black/10' : isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          {filteredOrders.length===0 ? (
            <div className={`rounded-3xl border py-24 flex flex-col items-center gap-4 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl">📭</div>
              <p className={`font-black text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sin pedidos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const cfg=ESTADO_CFG[order.estado]||ESTADO_CFG.pendiente; const StatusIcon=cfg.icon; const open=expandedOrder===order.id
                return (
                  <div key={order.id} className={`rounded-2xl border overflow-hidden transition-all ${open
                    ? isDark ? 'border-blue-800 bg-[#161b22] shadow-lg' : 'border-blue-200 bg-white shadow-lg shadow-blue-50'
                    : isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="p-5 flex items-center gap-4 flex-wrap cursor-pointer" onClick={() => setExpandedOrder(open?null:order.id)}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                        <StatusIcon size={18} className={cfg.text}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className={`font-black text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{order.parent_name||'Padre/Madre'}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                        </div>
                        <div className={`flex items-center gap-3 text-[11px] flex-wrap ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {order.parent_phone && <span className="flex items-center gap-1"><Phone size={10}/>{order.parent_phone}</span>}
                          <span>{new Date(order.created_at).toLocaleDateString(toBCP47(locale),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                          <span>{order.store_order_items?.length||0} artículo(s)</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>S/ {Number(order.total_soles).toFixed(2)}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>total del pedido</p>
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-100'}`}>
                        {open ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                      </div>
                    </div>

                    {open && (
                      <div className={`border-t p-5 space-y-5 ${isDark ? 'border-[#21262d] bg-[#0d1117]/40' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Artículos del pedido</p>
                          <div className="space-y-2">
                            {(order.store_order_items||[]).map(item => (
                              <div key={item.id} className={`flex items-center gap-3 rounded-xl p-3 border ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
                                <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 ${isDark ? 'bg-[#21262d]' : 'bg-slate-100'}`}>
                                  {item.product_imagen ? <img src={item.product_imagen} alt="" className="w-full h-full object-cover"/> : <Package size={18} className={`m-auto mt-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.product_nombre}</p>
                                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>x{item.cantidad} · S/ {Number(item.precio_unitario).toFixed(2)} c/u</p>
                                </div>
                                <p className={`font-black shrink-0 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S/ {Number(item.subtotal).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.notas && (
                          <div className={`rounded-xl p-4 border ${isDark ? 'bg-amber-900/10 border-amber-800/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Nota del padre</p>
                            <p className="text-sm">{order.notas}</p>
                          </div>
                        )}

                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nota interna (solo equipo)</p>
                          <textarea defaultValue={order.admin_notas||''} rows={2}
                            placeholder="Ej: Pagado en efectivo, entregado el lunes…"
                            onBlur={e => updateAdminNota(order.id, e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all resize-none border ${isDark ? 'bg-[#161b22] border-[#30363d] text-slate-300 placeholder-slate-600 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-400'}`}/>
                        </div>

                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Actualizar estado</p>
                          <div className="flex flex-wrap gap-2">
                            {ESTADOS_FLUJO.map(e => {
                              const c=ESTADO_CFG[e]; const isActive=order.estado===e
                              return (
                                <button key={e} onClick={() => updateOrderEstado(order.id,e)}
                                  disabled={isActive||updatingOrder===order.id}
                                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isActive
                                    ? `${c.bg} ${c.text} ${c.border} ring-2 ${c.ring} ring-offset-1`
                                    : isDark ? 'bg-[#161b22] text-slate-400 border-[#30363d] hover:border-[#4a5568]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                  {updatingOrder===order.id ? <Loader2 size={12} className="animate-spin"/> : <span className={`w-2 h-2 rounded-full ${c.dot}`}/>}
                                  {c.label} {isActive && '✓'}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {order.parent_phone && (
                          <a href={`https://wa.me/51${order.parent_phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Su pedido está ${ESTADO_CFG[order.estado]?.label?.toLowerCase()}. Total: S/ ${Number(order.total_soles).toFixed(2)} — Jugando Aprendo`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-md">
                            <Phone size={15}/> Contactar por WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null) }}
          onSaved={async () => { setShowModal(false); setEditProduct(null); await loadProducts() }}
        />
      )}
    </div>
  )
}
