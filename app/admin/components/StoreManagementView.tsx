'use client'

import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShoppingBag, Plus, Edit2, Trash2, Package, X, Save, Loader2,
  Upload, ImageIcon, Tag, Archive, CheckCircle, Clock, Truck,
  XCircle, ChevronDown, ChevronUp, Search, Filter, ToggleLeft,
  ToggleRight, Star, FileText, File, AlertTriangle, RefreshCw, Eye,
  Phone, Mail, DollarSign, BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Product {
  id: string
  nombre: string
  descripcion: string
  precio_soles: number
  stock: number
  categoria: string
  tipo: 'fisico' | 'digital'
  imagen_url: string | null
  activo: boolean
  destacado: boolean
  created_at: string
}

interface Order {
  id: string
  parent_name: string
  parent_email: string
  parent_phone: string
  total_soles: number
  estado: string
  notas: string
  admin_notas: string
  created_at: string
  store_order_items: OrderItem[]
}

interface OrderItem {
  id: string
  product_nombre: string
  product_imagen: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

// ── Configuración de estados ──────────────────────────────────────────────────
const ESTADO_CFG: Record<string, any> = {
  pendiente:  { label: 'Pendiente',  icon: Clock,       bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',   dot: 'bg-amber-400'  },
  confirmado: { label: 'Confirmado', icon: CheckCircle, bg: 'bg-blue-50',    border: 'border-blue-200',   text: 'text-blue-700',    dot: 'bg-blue-400'   },
  listo:      { label: 'Listo',      icon: Package,     bg: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700',  dot: 'bg-violet-400' },
  entregado:  { label: 'Entregado',  icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700', dot: 'bg-emerald-400'},
  cancelado:  { label: 'Cancelado',  icon: XCircle,     bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-700',     dot: 'bg-red-400'    },
}

const CATEGORIAS = ['material', 'guia', 'juego', 'libro', 'otro']
const ESTADOS_FLUJO = ['pendiente', 'confirmado', 'listo', 'entregado', 'cancelado']

// ── Formulario vacío ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nombre: '', descripcion: '', precio_soles: '', stock: '',
  categoria: 'material', tipo: 'fisico' as 'fisico' | 'digital',
  activo: true, destacado: false,
}

// ── Componente Modal Producto ─────────────────────────────────────────────────
function ProductModal({
  product, onClose, onSaved
}: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()
  const [form, setForm] = useState<any>(product ? {
    nombre: product.nombre, descripcion: product.descripcion || '',
    precio_soles: String(product.precio_soles), stock: String(product.stock),
    categoria: product.categoria, tipo: product.tipo,
    activo: product.activo, destacado: product.destacado,
  } : EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imagen_url || null)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes (JPG, PNG, WEBP)'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return product?.imagen_url || null
    const ext = imageFile.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('store-images').upload(path, imageFile, { upsert: true })
    if (error) { toast.error('Error subiendo imagen: ' + error.message); return null }
    const { data } = supabase.storage.from('store-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.precio_soles || Number(form.precio_soles) < 0) { toast.error('Precio inválido'); return }
    if (form.tipo === 'fisico' && (form.stock === '' || Number(form.stock) < 0)) { toast.error('Stock inválido'); return }

    setSaving(true)
    try {
      const imagen_url = await uploadImage()
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio_soles: Number(form.precio_soles),
        stock: form.tipo === 'digital' ? 9999 : Number(form.stock),
        categoria: form.categoria,
        tipo: form.tipo,
        activo: form.activo,
        destacado: form.destacado,
        imagen_url,
        updated_at: new Date().toISOString(),
      }
      if (product) {
        const { error } = await supabase.from('store_products').update(payload).eq('id', product.id)
        if (error) throw error
        toast.success('Producto actualizado ✅')
      } else {
        const { error } = await supabase.from('store_products').insert(payload)
        if (error) throw error
        toast.success('Producto creado ✅')
      }
      onSaved()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" style={{ background: "var(--card)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 px-7 py-5 border-b flex items-center justify-between z-10" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
          <div>
            <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product ? `ID: ${product.id.slice(0, 8)}...` : 'Completa la información del artículo'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-7 space-y-6">
          {/* Imagen */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{t('ui.product_image')}</label>
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
              style={{ minHeight: 180 }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImage(f) }}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Upload size={16} /> Cambiar imagen
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <ImageIcon size={26} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">{t('ui.drag_image')}</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — máximo 5MB</p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f) }} />
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre *</label>
            <input
              value={form.nombre} onChange={e => setForm((f: any) => ({ ...f, nombre: e.target.value }))}
              {...{placeholder: t('ui.product_name')}}
              className="w-full px-4 py-3 rounded-xl font-semibold outline-none focus:border-blue-400 transition-all" style={{ background: "var(--input-bg)", border: "2px solid var(--input-border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{t('common.descripcion')}</label>
            <textarea
              value={form.descripcion} onChange={e => setForm((f: any) => ({ ...f, descripcion: e.target.value }))}
              rows={3} placeholder={t('ui.describe_product')}
              className="w-full px-4 py-3 rounded-xl font-semibold outline-none focus:border-blue-400 transition-all" style={{ background: "var(--input-bg)", border: "2px solid var(--input-border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de producto *</label>
            <div className="grid grid-cols-2 gap-3">
              {([['fisico', '📦', 'Físico', 'Se retira en el centro'], ['digital', '📄', 'Digital', 'PDF o archivo descargable']] as const).map(([val, emoji, lbl, desc]) => (
                <button key={val} type="button" onClick={() => setForm((f: any) => ({ ...f, tipo: val }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.tipo === val ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="font-black text-sm text-slate-800">{lbl}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Precio + Stock + Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Precio (S/.) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">S/</span>
                <input
                  type="number" min="0" step="0.50" value={form.precio_soles}
                  onChange={e => setForm((f: any) => ({ ...f, precio_soles: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl font-black text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                {form.tipo === 'digital' ? 'Stock (auto: ilimitado)' : 'Stock disponible *'}
              </label>
              <input
                type="number" min="0" value={form.tipo === 'digital' ? '∞' : form.stock}
                onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))}
                disabled={form.tipo === 'digital'}
                className="w-full px-4 py-3 rounded-xl font-semibold outline-none focus:border-blue-400 transition-all" style={{ background: "var(--input-bg)", border: "2px solid var(--input-border)", color: "var(--text-primary)" }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button key={cat} type="button" onClick={() => setForm((f: any) => ({ ...f, categoria: cat }))}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-bold capitalize transition-all ${form.categoria === cat ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'activo', label: 'Visible en tienda', desc: 'Los padres pueden verlo', color: 'text-emerald-600' },
              { key: 'destacado', label: 'Producto destacado', desc: 'Aparece primero con ⭐', color: 'text-amber-600' },
            ].map(({ key, label, desc, color }) => (
              <button key={key} type="button" onClick={() => setForm((f: any) => ({ ...f, [key]: !f[key] }))}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${form[key] ? `border-current bg-opacity-5 ${color}` : 'border-slate-200 text-slate-400'}`}>
                {form[key] ? <ToggleRight size={22} className={color} /> : <ToggleLeft size={22} className="text-slate-300" />}
                <div>
                  <p className={`text-sm font-bold ${form[key] ? color : 'text-slate-500'}`}>{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 px-7 py-5 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function StoreManagementView() {
  const toast = useToast()
  const { t } = useI18n()
  const [tab, setTab] = useState<'productos' | 'pedidos'>('productos')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }, [])

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadProducts(), loadOrders()])
      setLoading(false)
    }
    load()
  }, [loadProducts, loadOrders])

  const toggleActivo = async (p: Product) => {
    await supabase.from('store_products').update({ activo: !p.activo }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x))
    toast.success(p.activo ? 'Producto ocultado' : 'Producto activado')
  }

  const deleteProduct = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('store_products').delete().eq('id', p.id)
    if (error) { toast.error('Error: ' + error.message); return }
    setProducts(prev => prev.filter(x => x.id !== p.id))
    toast.success('Producto eliminado')
  }

  const updateOrderEstado = async (orderId: string, estado: string) => {
    setUpdatingOrder(orderId)
    await supabase.from('store_orders').update({ estado, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado } : o))
    toast.success(`Pedido marcado como: ${ESTADO_CFG[estado]?.label}`)
    setUpdatingOrder(null)
  }

  const updateAdminNota = async (orderId: string, nota: string) => {
    await supabase.from('store_orders').update({ admin_notas: nota }).eq('id', orderId)
    toast.success('Nota guardada')
  }

  // Stats rápidas
  const stats = {
    totalProductos: products.length,
    activos: products.filter(p => p.activo).length,
    stockBajo: products.filter(p => p.tipo === 'fisico' && p.stock <= 3 && p.activo).length,
    pedidosPendientes: orders.filter(o => o.estado === 'pendiente').length,
    totalVendido: orders.filter(o => o.estado !== 'cancelado').reduce((s, o) => s + o.total_soles, 0),
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo
    return matchSearch && matchTipo
  })

  const filteredOrders = orders.filter(o =>
    filterEstado === 'todos' || o.estado === filterEstado
  )

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
            <ShoppingBag className="text-blue-600" size={28} /> Tienda
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Gestiona productos, stock y pedidos de los padres</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95 dark:shadow-none">
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Productos', value: stats.totalProductos, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Activos', value: stats.activos, icon: ToggleRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Stock bajo (≤3)', value: stats.stockBajo, icon: AlertTriangle, color: stats.stockBajo > 0 ? 'text-red-600' : 'text-slate-400', bg: stats.stockBajo > 0 ? 'bg-red-50' : 'bg-slate-50' },
          { label: 'Pedidos pendientes', value: stats.pedidosPendientes, icon: Clock, color: stats.pedidosPendientes > 0 ? 'text-amber-600' : 'text-slate-400', bg: stats.pedidosPendientes > 0 ? 'bg-amber-50' : 'bg-slate-50' },
          { label: 'Total vendido', value: `S/ ${stats.totalVendido.toFixed(2)}`, icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
            <Icon size={18} className={`${color} mb-2`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'productos', label: 'Productos', count: products.length },
          { id: 'pedidos', label: 'Pedidos', count: orders.length, badge: stats.pedidosPendientes },
        ].map(({ id, label, count, badge }: any) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all -mb-px ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${tab === id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
            {badge > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </button>
        ))}
      </div>

      {/* ── TAB PRODUCTOS ── */}
      {tab === 'productos' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('ui.search_product')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            {['todos', 'fisico', 'digital'].map(f => (
              <button key={f} onClick={() => setFilterTipo(f)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-bold capitalize transition-all ${filterTipo === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-blue-300'}`}>
                {f === 'todos' ? 'Todos' : f === 'fisico' ? '📦 Físicos' : '📄 Digitales'}
              </button>
            ))}
          </div>

          {/* Grid productos */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-20 text-center">
              <Package size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">{t('ui.no_products')}</p>
              <button onClick={() => { setEditProduct(null); setShowModal(true) }}
                className="mt-4 text-sm font-bold text-blue-600 hover:underline">
                + Crear el primero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <div key={p.id} className={`bg-white dark:bg-slate-800 rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md ${p.activo ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                  {/* Imagen */}
                  <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-50">
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon size={32} className="text-slate-300" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${p.tipo === 'digital' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-white'}`}>
                        {p.tipo === 'digital' ? '📄 Digital' : '📦 Físico'}
                      </span>
                      {p.destacado && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-400 text-white">⭐ Destacado</span>}
                    </div>
                    {/* Stock alerta */}
                    {p.tipo === 'fisico' && p.stock <= 3 && (
                      <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                        {p.stock === 0 ? 'Sin stock' : `Solo ${p.stock} ud.`}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-black text-slate-800 text-base leading-tight mb-1">{p.nombre}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{p.descripcion || 'Sin descripción'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-black text-blue-600">S/ {Number(p.precio_soles).toFixed(2)}</span>
                      <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2.5 py-1 rounded-full">{p.categoria}</span>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button onClick={() => toggleActivo(p)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${p.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                        {p.activo ? <><ToggleRight size={14} /> {t('common.activo')}</> : <><ToggleLeft size={14} /> {t('common.inactivo')}</>}
                      </button>
                      <button onClick={() => { setEditProduct(p); setShowModal(true) }}
                        className="px-3 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteProduct(p)}
                        className="px-3 py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB PEDIDOS ── */}
      {tab === 'pedidos' && (
        <div className="space-y-4">
          {/* Filtro por estado */}
          <div className="flex gap-2 flex-wrap">
            {['todos', ...ESTADOS_FLUJO].map(e => {
              const cfg = ESTADO_CFG[e]
              const count = e === 'todos' ? orders.length : orders.filter(o => o.estado === e).length
              return (
                <button key={e} onClick={() => setFilterEstado(e)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${filterEstado === e
                    ? (cfg ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-blue-600 text-white border-blue-600')
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                  {e === 'todos' ? 'Todos' : cfg?.label}
                  <span className="opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-20 text-center">
              <ShoppingBag size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">Sin pedidos{filterEstado !== 'todos' ? ` "${ESTADO_CFG[filterEstado]?.label}"` : ''}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const cfg = ESTADO_CFG[order.estado] || ESTADO_CFG.pendiente
                const StatusIcon = cfg.icon
                const open = expandedOrder === order.id

                return (
                  <div key={order.id} className={`bg-white dark:bg-slate-800 rounded-2xl border-2 overflow-hidden transition-all ${open ? 'border-blue-200 shadow-md' : 'border-slate-200'}`}>
                    {/* Fila principal */}
                    <div className="p-5 flex items-center gap-4 flex-wrap">
                      {/* Estado dot */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                        <StatusIcon size={18} className={cfg.text} />
                      </div>

                      {/* Info cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-black text-slate-800">{order.parent_name || 'Padre/Madre'}</p>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          {order.parent_phone && <span className="flex items-center gap-1"><Phone size={10} />{order.parent_phone}</span>}
                          <span>{new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{order.store_order_items?.length || 0} artículo(s)</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-blue-600">S/ {Number(order.total_soles).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{t('ui.order_total')}</p>
                      </div>

                      {/* Expand */}
                      <button onClick={() => setExpandedOrder(open ? null : order.id)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all shrink-0">
                        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      </button>
                    </div>

                    {/* Detalle expandido */}
                    {open && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        {/* Items */}
                        <div className="p-5 space-y-3">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Artículos del pedido</p>
                          {(order.store_order_items || []).map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-100 dark:border-slate-600">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {item.product_imagen
                                  ? <img src={item.product_imagen} alt="" className="w-full h-full object-cover" />
                                  : <Package size={20} className="text-slate-300 m-auto mt-2.5" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate">{item.product_nombre}</p>
                                <p className="text-xs text-slate-400">x{item.cantidad} · S/ {Number(item.precio_unitario).toFixed(2)} c/u</p>
                              </div>
                              <p className="font-black text-slate-700 shrink-0">S/ {Number(item.subtotal).toFixed(2)}</p>
                            </div>
                          ))}

                          {/* Notas del padre */}
                          {order.notas && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <p className="text-xs font-black text-amber-600 mb-1">Nota del padre/madre:</p>
                              <p className="text-sm text-amber-800">{order.notas}</p>
                            </div>
                          )}

                          {/* Nota admin */}
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nota interna (solo admin)</p>
                            <textarea
                              defaultValue={order.admin_notas || ''}
                              rows={2}
                              placeholder={t('ui.paid_in_cash')}
                              onBlur={e => updateAdminNota(order.id, e.target.value)}
                              className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all resize-none"
                            />
                          </div>

                          {/* Cambiar estado */}
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Actualizar estado</p>
                            <div className="flex flex-wrap gap-2">
                              {ESTADOS_FLUJO.map(e => {
                                const c = ESTADO_CFG[e]
                                const isActive = order.estado === e
                                return (
                                  <button key={e} onClick={() => updateOrderEstado(order.id, e)}
                                    disabled={isActive || updatingOrder === order.id}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:cursor-not-allowed ${isActive
                                      ? `${c.bg} ${c.text} ${c.border} ring-2 ring-offset-1 ring-current`
                                      : `bg-white text-slate-500 border-slate-200 hover:${c.bg} hover:${c.text}`
                                    }`}>
                                    {updatingOrder === order.id ? <Loader2 size={12} className="animate-spin" /> : <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
                                    {c.label}
                                    {isActive && ' ✓'}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* WhatsApp quick contact */}
                          {order.parent_phone && (
                            <a
                              href={`https://wa.me/51${order.parent_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Su pedido de Jugando Aprendo está ${ESTADO_CFG[order.estado]?.label?.toLowerCase()}. Total: S/ ${Number(order.total_soles).toFixed(2)}`)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-all"
                            >
                              <Phone size={16} /> Contactar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal producto */}
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
