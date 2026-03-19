'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Calendar, Check, Link2, Loader2, RefreshCw, Unlink, ExternalLink } from 'lucide-react'

export default function GoogleCalendarSync() {
  const toast = useToast()
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [googleEmail, setGoogleEmail] = useState<string | null>(null)
  const [userId, setUserId]   = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const checkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const res  = await fetch(`/api/google-calendar?action=status&userId=${session.user.id}`)
      const data = await res.json()
      setStatus(data.connected ? 'connected' : 'disconnected')
      setGoogleEmail(data.email)
    } catch {
      setStatus('disconnected')
    }
  }

  useEffect(() => {
    checkStatus()
    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search)
    const gcal = params.get('gcal')
    if (gcal === 'connected') {
      toast.success('✅ Google Calendar conectado')
      checkStatus()
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (gcal === 'error') {
      toast.error('Error al conectar Google Calendar')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = async () => {
    if (!userId) return
    setConnecting(true)
    try {
      const res  = await fetch(`/api/google-calendar?action=auth-url&userId=${userId}`)
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Error iniciando conexión')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!userId || !confirm('¿Desconectar Google Calendar?')) return
    await fetch(`/api/google-calendar?action=disconnect&userId=${userId}`)
    setStatus('disconnected')
    setGoogleEmail(null)
    toast.success('Google Calendar desconectado')
  }

  const handleSyncAll = async () => {
    if (!userId) return
    setSyncing(true)
    try {
      const res  = await fetch('/api/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-all', userId }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`✅ ${data.synced} cita${data.synced !== 1 ? 's' : ''} sincronizada${data.synced !== 1 ? 's' : ''} con Google Calendar`)
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
          ? <Loader2 size={15} className="animate-spin text-blue-500" />
          : <img src="https://www.gstatic.com/images/branding/product/1x/calendar_16dp.png" alt="Google Calendar" className="w-4 h-4" />
        }
        {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Connected indicator */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
        <Check size={12} />
        <span className="hidden sm:inline">Google Calendar</span>
        {googleEmail && <span className="text-emerald-500 font-normal hidden md:inline">· {googleEmail}</span>}
      </div>

      {/* Sync all button */}
      <button
        onClick={handleSyncAll}
        disabled={syncing}
        title="Sincronizar todas las citas próximas con Google Calendar"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
      >
        {syncing
          ? <Loader2 size={13} className="animate-spin" />
          : <RefreshCw size={13} />
        }
        <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
      </button>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        title="Desconectar Google Calendar"
        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
      >
        <Unlink size={13} />
      </button>
    </div>
  )
}
