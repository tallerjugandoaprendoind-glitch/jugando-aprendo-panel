'use client'

import { useI18n } from '@/lib/i18n-context'
import { toBCP47 } from '@/lib/i18n'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, ShoppingCart, Plus, Minus, X, Package, Star,
  CheckCircle, Clock, Truck, XCircle, ChevronRight, Loader2,
  Phone, Filter, Search, ImageIcon, ArrowLeft, FileText, Tag
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  nombre: string
  descripcion: string
  precio_soles: number
  stock: number
  categoria: string
  tipo: 'fisico' | 'digital'
  imagen_url: string | null
  destacado: boolean
}

interface CartItem { product: Product; cantidad: number }

interface Order {
  id: string
  total_soles: number
  estado: string
  notas: string
  created_at: string
  store_order_items: any[]
}

const ESTADO_CFG: Record<string, any> = {
  pendiente:  { label: 'Pendiente de confirmación', icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  confirmado: { label: 'Confirmado',                icon: CheckCircle, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  listo:      { label: '¡Listo para recoger!',      icon: Package,     color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200'},
  entregado:  { label: 'Entregado',                 icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'},
  cancelado:  { label: 'Cancelado',                 icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'   },
}

// ── Carrito flotante ──────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdate, onCheckout }: any) {
  const total = cart.reduce((s: number, i: CartItem) => s + i.product.precio_soles * i.cantidad, 0)
  const { t, locale } = useI18n()
  const [nota, setNota] = useState('')
  const [placing, setPlacing] = useState(false)
  const [done, setDone] = useState(false)

  const handleCheckout = async () => {
    setPlacing(true)
    const ok = await onCheckout(nota)
    if (ok) setDone(true)
    setPlacing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" /> Mi carrito
            {cart.length > 0 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{cart.length}</span>}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
              <CheckCircle size={40} className="text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{t('tienda.pedidoEnviado')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tu pedido fue registrado. Nos pondremos en contacto contigo para confirmar el pago y la entrega.
            </p>
            <a href="https://wa.me/51924807183" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all">
              <Phone size={16} /> Coordinar por WhatsApp
            </a>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingCart size={36} className="text-slate-300" />
            </div>
            <p className="font-bold text-slate-500 mb-1">{t('ui.cart_empty')}</p>
            <p className="text-sm text-slate-400">{t('ui.add_items')}</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(({ product: p, cantidad }: CartItem) => (
                <div key={p.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                      : <Package size={20} className="text-slate-300 m-auto mt-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 leading-tight truncate">{p.nombre}</p>
                    <p className="text-xs text-blue-600 font-black mt-0.5">S/ {(p.precio_soles * cantidad).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => onUpdate(p.id, cantidad - 1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all">
                      <Minus size={12} className="text-slate-500" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-slate-800">{cantidad}</span>
                    <button onClick={() => onUpdate(p.id, cantidad + 1)}
                      disabled={p.tipo === 'fisico' && cantidad >= p.stock}
                      className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-30">
                      <Plus size={12} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Nota */}
              <div className="pt-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('familias.notaCentro')}</label>
                <textarea
                  value={nota} onChange={e => setNota(e.target.value)}
                  rows={2} placeholder={t("tienda.pedidoGuardar")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Info pago */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-black text-blue-700 mb-1">{t('tienda.comoPaga')}</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  El pago se realiza al recoger el pedido en el centro (efectivo o yape). Para artículos digitales te enviaremos el archivo por WhatsApp tras confirmar el pago.
                </p>
              </div>
            </div>

            {/* Footer con total y botón */}
            <div className="border-t border-slate-100 p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">{t('ui.total_to_pay')}</span>
                <span className="text-2xl font-black text-blue-600">S/ {total.toFixed(2)}</span>
              </div>
              <button onClick={handleCheckout} disabled={placing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                {placing ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                {placing ? 'Enviando pedido...' : 'Confirmar pedido'}
              </button>
              <p className="text-center text-xs text-slate-400">
                Al confirmar, el centro recibirá tu pedido y te contactará
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Vista principal de la tienda ──────────────────────────────────────────────
export default function StoreView({ profile }: { profile: any }) {
  const { t, locale } = useI18n()
  const [view, setView] = useState<'catalogo' | 'mis-pedidos'>('catalogo')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterCat, setFilterCat] = useState('todos')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from('store_products')
      .select('*')
      .eq('activo', true)
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }, [])

  const loadOrders = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*)')
      .eq('parent_id', profile.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }, [profile?.id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadProducts(), loadOrders()])
      setLoading(false)
    }
    load()
  }, [loadProducts, loadOrders])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) return prev.map(i => i.product.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { product, cantidad: 1 }]
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  const updateCart = (productId: string, cantidad: number) => {
    if (cantidad <= 0) setCart(prev => prev.filter(i => i.product.id !== productId))
    else setCart(prev => prev.map(i => i.product.id === productId ? { ...i, cantidad } : i))
  }

  const checkout = async (nota: string) => {
    if (!profile?.id) return false
    const total = cart.reduce((s, i) => s + i.product.precio_soles * i.cantidad, 0)
    try {
      const { data: order, error } = await supabase.from('store_orders').insert({
        parent_id: profile.id,
        parent_name: profile.full_name || '',
        parent_email: profile.email || '',
        parent_phone: profile.phone || '',
        total_soles: total,
        estado: 'pendiente',
        notas: nota,
      }).select().single()
      if (error) throw error

      const items = cart.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        product_nombre: i.product.nombre,
        product_imagen: i.product.imagen_url || '',
        cantidad: i.cantidad,
        precio_unitario: i.product.precio_soles,
      }))
      await supabase.from('store_order_items').insert(items)

      // Reducir stock de productos físicos
      for (const item of cart) {
        if (item.product.tipo === 'fisico') {
          await supabase.from('store_products').update({ stock: item.product.stock - item.cantidad }).eq('id', item.product.id)
        }
      }

      setCart([])
      await loadOrders()
      return true
    } catch (e) { return false }
  }

  const categorias = ['todos', ...new Set(products.map(p => p.categoria))]
  const cartCount = cart.reduce((s, i) => s + i.cantidad, 0)

  const filtered = products.filter(p => {
    const ms = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.descripcion?.toLowerCase().includes(search.toLowerCase())
    const mt = filterTipo === 'todos' || p.tipo === filterTipo
    const mc = filterCat === 'todos' || p.categoria === filterCat
    return ms && mt && mc
  })

  const destacados = filtered.filter(p => p.destacado)
  const resto = filtered.filter(p => !p.destacado)

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="space-y-5 pb-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingBag size={24} className="text-blue-600" /> Tienda
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{t('familias.materialesTerapeuticos')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView(v => v === 'catalogo' ? 'mis-pedidos' : 'catalogo')}
            className={`text-sm font-bold px-4 py-2.5 rounded-xl border transition-all ${view === 'mis-pedidos' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
            {view === 'catalogo' ? `Mis pedidos (${orders.length})` : '← Tienda'}
          </button>
          {view === 'catalogo' && (
            <button onClick={() => setShowCart(true)} className="relative p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-200">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── CATÁLOGO ── */}
      {view === 'catalogo' && (
        <>
          {/* Búsqueda y filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} {...{placeholder: t('ui.search_material')}}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'fisico', 'digital'].map(f => (
                <button key={f} onClick={() => setFilterTipo(f)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${filterTipo === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                  {f === 'todos' ? 'Todo' : f === 'fisico' ? '📦 Físicos' : '📄 Digitales'}
                </button>
              ))}
              <div className="w-px bg-slate-200 self-stretch mx-1" />
              {categorias.map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${filterCat === c ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {c === 'todos' ? 'Categorías' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Destacados */}
          {destacados.length > 0 && search === '' && filterTipo === 'todos' && filterCat === 'todos' && (
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Star size={12} className="text-amber-400 fill-amber-400" /> Destacados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destacados.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={setSelectedProduct} justAdded={addedId === p.id} inCart={cart.find(i => i.product.id === p.id)?.cantidad || 0} featured />
                ))}
              </div>
            </div>
          )}

          {/* Todos los productos */}
          {resto.length > 0 || (filtered.length > 0 && destacados.length === 0) ? (
            <div>
              {destacados.length > 0 && search === '' && filterTipo === 'todos' && filterCat === 'todos' && (
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('ui.all_items')}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(destacados.length > 0 && search === '' && filterTipo === 'todos' && filterCat === 'todos' ? resto : filtered).map(p => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onDetail={setSelectedProduct} justAdded={addedId === p.id} inCart={cart.find(i => i.product.id === p.id)?.cantidad || 0} />
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
              <ShoppingBag size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-400">{t('ui.no_items_found')}</p>
              <button onClick={() => { setSearch(''); setFilterTipo('todos'); setFilterCat('todos') }}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : null}

          {/* Info tienda */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 flex gap-4 items-start">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Package size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-blue-800 text-sm mb-1">{t('tienda.comoFuncTienda')}</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                {t('ui.physical_items_note')}
                Los <strong>{t('ui.digitales')}</strong> te los enviamos por WhatsApp tras confirmar el pago.
                ¿Dudas? Escríbenos al <a href="https://wa.me/51924807183" className="underline font-bold">+51 924 807 183</a>.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── MIS PEDIDOS ── */}
      {view === 'mis-pedidos' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
              <ShoppingBag size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-500 mb-1">{t('tienda.sinPedidos')}</p>
              <p className="text-sm text-slate-400 mb-4">{t('tienda.exploraCompra')}</p>
              <button onClick={() => setView('catalogo')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all">
                Ir a la tienda →
              </button>
            </div>
          ) : orders.map(order => {
            const cfg = ESTADO_CFG[order.estado] || ESTADO_CFG.pendiente
            const StatusIcon = cfg.icon
            return (
              <div key={order.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${cfg.border}`}>
                <div className={`${cfg.bg} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon size={15} className={cfg.color} />
                    <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {(order.store_order_items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        {item.product_imagen
                          ? <img src={item.product_imagen} alt="" className="w-full h-full object-cover" />
                          : <Package size={18} className="text-slate-300 m-auto mt-3" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-800">{item.product_nombre}</p>
                        <p className="text-xs text-slate-400">x{item.cantidad} · S/ {Number(item.precio_unitario).toFixed(2)} c/u</p>
                      </div>
                      <p className="font-black text-slate-700">S/ {Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Total pagado</span>
                    <span className="text-xl font-black text-blue-600">S/ {Number(order.total_soles).toFixed(2)}</span>
                  </div>
                  {order.notas && (
                    <p className="text-xs text-slate-400 italic">Tu nota: "{order.notas}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Carrito */}
      {showCart && (
        <CartDrawer cart={cart} onClose={() => setShowCart(false)} onUpdate={updateCart} onCheckout={checkout} />
      )}

      {/* Detalle producto */}
      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} inCart={cart.find(i => i.product.id === selectedProduct.id)?.cantidad || 0} justAdded={addedId === selectedProduct.id} />
      )}
    </div>
  )
}

// ── Tarjeta de producto ───────────────────────────────────────────────────────
function ProductCard({ product: p, onAdd, onDetail, justAdded, inCart, featured }: any) {
  const { t } = useI18n()
  const sinStock = p.tipo === 'fisico' && p.stock === 0
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${featured ? 'border-amber-200' : 'border-slate-200'}`}>
      {/* Imagen */}
      <div className="relative h-44 bg-gradient-to-br from-slate-50 to-slate-100" onClick={() => onDetail(p)}>
        {p.imagen_url
          ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
          : <div className="flex items-center justify-center h-full"><ImageIcon size={28} className="text-slate-300" /></div>
        }
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white ${p.tipo === 'digital' ? 'bg-violet-600' : 'bg-slate-700'}`}>
            {p.tipo === 'digital' ? '📄' : '📦'}
          </span>
          {featured && <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400 text-white">⭐</span>}
        </div>
        {sinStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">Sin stock</span>
          </div>
        )}
        {p.tipo === 'fisico' && p.stock > 0 && p.stock <= 3 && (
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Solo {p.stock}</div>
        )}
      </div>

      <div className="p-4">
        <p className="font-black text-slate-800 text-sm leading-tight mb-1 line-clamp-2" onClick={() => onDetail(p)}>{p.nombre}</p>
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{p.descripcion}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-black text-blue-600">S/ {Number(p.precio_soles).toFixed(2)}</span>
          <button onClick={() => !sinStock && onAdd(p)} disabled={sinStock}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${justAdded ? 'bg-emerald-600 text-white scale-95' : sinStock ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'}`}>
            {justAdded ? <><CheckCircle size={13} /> {t('ui.added_short')}</> : <><ShoppingCart size={13} /> {inCart > 0 ? `${t('ui.in_cart')} (${inCart})` : t('common.agregar')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detalle de producto (modal) ───────────────────────────────────────────────
function ProductDetail({ product: p, onClose, onAdd, inCart, justAdded }: any) {
  const { t } = useI18n()
  const sinStock = p.tipo === 'fisico' && p.stock === 0
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Imagen */}
        <div className="relative h-56 bg-slate-100 shrink-0">
          {p.imagen_url
            ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center h-full"><ImageIcon size={40} className="text-slate-300" /></div>
          }
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <X size={18} className="text-slate-600" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-xs font-black px-3 py-1 rounded-full text-white ${p.tipo === 'digital' ? 'bg-violet-600' : 'bg-slate-700'}`}>
              {p.tipo === 'digital' ? '📄 Digital' : '📦 Físico'}
            </span>
            {p.destacado && <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-400 text-white">⭐ Destacado</span>}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-xl font-black text-slate-800 leading-tight flex-1">{p.nombre}</h3>
            <span className="text-2xl font-black text-blue-600 shrink-0">S/ {Number(p.precio_soles).toFixed(2)}</span>
          </div>

          <div className="flex gap-2 mb-4">
            <span className="text-xs font-bold capitalize bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{p.categoria}</span>
            {p.tipo === 'fisico' && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.stock > 3 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
              {p.stock === 0 ? 'Sin stock' : `${p.stock} disponibles`}
            </span>}
            {p.tipo === 'digital' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">Descarga inmediata</span>}
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">{p.descripcion || 'Sin descripción disponible.'}</p>

          {p.tipo === 'digital' && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-black text-violet-700 mb-1">{t('tienda.articuloDigital')}</p>
              <p className="text-xs text-violet-600">Al confirmar tu pedido y pagar, recibirás el archivo por WhatsApp en menos de 24 horas.</p>
            </div>
          )}

          <button onClick={() => !sinStock && onAdd(p)} disabled={sinStock}
            className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${justAdded ? 'bg-emerald-600 text-white' : sinStock ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}>
            {justAdded ? <><CheckCircle size={18} /> {t('ui.added_to_cart')}</> : sinStock ? t('ui.out_of_stock') : <><ShoppingCart size={18} /> {inCart > 0 ? `${t('ui.add_another')} (${inCart} ${t('ui.in_cart_count')})` : t('ui.add_to_cart')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
