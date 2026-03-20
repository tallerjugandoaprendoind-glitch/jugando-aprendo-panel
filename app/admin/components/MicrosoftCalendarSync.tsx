'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Check, Loader2, RefreshCw, Unlink, CalendarDays } from 'lucide-react'

export default function MicrosoftCalendarSync() {
  const toast = useToast()
  const [status, setStatus] = useState<'loading'|'connected'|'disconnected'>('loading')
  const [msEmail, setMsEmail] = useState<string|null>(null)
  const [userId, setUserId] = useState<string|null>(null)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const res  = await fetch(`/api/microsoft-calendar?action=status&userId=${session.user.id}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
      setMsEmail(data.email)
    } catch { setStatus('disconnected') }
  }

  useEffect(() => {
    checkStatus()
    const params = new URLSearchParams(window.location.search)
    const mscal = params.get('mscal')
    if (mscal === 'connected') {
      toast.success('✅ Microsoft Calendar conectado')
      checkStatus()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (mscal === 'error') {
      toast.error('Error al conectar Microsoft Calendar')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = async () => {
    if (!userId) return
    setConnecting(true)
    try {
      const res  = await fetch(`/api/microsoft-calendar?action=auth-url&userId=${userId}`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Error iniciando conexión con Microsoft')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!userId || !confirm('¿Desconectar Microsoft Calendar?')) return
    await fetch(`/api/microsoft-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected'); setMsEmail(null)
    toast.success('Microsoft Calendar desconectado')
  }

  const handleSync = async () => {
    if (!userId) return
    setSyncing(true)
    try {
      const res  = await fetch('/api/microsoft-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-all', userId }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`✅ ${data.synced} cita${data.synced !== 1 ? 's' : ''} sincronizada${data.synced !== 1 ? 's' : ''} con Outlook`)
      } else {
        toast.error(data.error || 'Error al sincronizar')
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'loading') return null

  if (status === 'disconnected') {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-all disabled:opacity-50"
      >
        {connecting
          ? <Loader2 size={15} className="animate-spin text-blue-600" />
          : <svg width="16" height="16" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
        }
        {connecting ? 'Conectando...' : 'Conectar Outlook Calendar'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
        <Check size={12} />
        <span className="hidden sm:inline">Outlook</span>
        {msEmail && <span className="text-blue-500 font-normal hidden md:inline">· {msEmail}</span>}
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
      >
        {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
      </button>
      <button
        onClick={handleDisconnect}
        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
      >
        <Unlink size={13} />
      </button>
    </div>
  )
}
