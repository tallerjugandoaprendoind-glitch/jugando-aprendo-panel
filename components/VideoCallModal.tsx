'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Video, PhoneOff, Loader2, Wifi } from 'lucide-react'

interface VideoCallModalProps {
  roomUrl: string
  sessionId: string
  participantName: string
  onClose: () => void
}

export default function VideoCallModal({ roomUrl, sessionId, participantName, onClose }: VideoCallModalProps) {
  const startTimeRef = useRef<number>(Date.now())
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)

  // Contador de duración
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Detectar carga del iframe
  useEffect(() => {
    const timer = setTimeout(() => setStatus('connected'), 3000)
    return () => clearTimeout(timer)
  }, [])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleEnd = useCallback(async () => {
    setSaving(true)
    try {
      const durationMinutes = (Date.now() - startTimeRef.current) / 1000 / 60
      await fetch('/api/video-call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, duration_minutes: durationMinutes }),
      })
    } catch (e) {
      console.error('Error guardando duración:', e)
    } finally {
      setSaving(false)
      onClose()
    }
  }, [sessionId, onClose])

  // Jitsi Meet URL: pasar nombre del participante por fragmento (no se envía al servidor)
  const callUrl = `${roomUrl}#userInfo.displayName="${encodeURIComponent(participantName)}"&config.defaultLanguage="es"&config.prejoinPageEnabled=false`

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            JA
          </div>
          <div>
            <p className="text-white font-bold text-sm">Jugando Aprendo · Videollamada</p>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {participantName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-mono font-bold text-sm">{formatDuration(duration)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: status === 'connected' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
              border: `1px solid ${status === 'connected' ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`
            }}>
            {status === 'connecting'
              ? <Loader2 size={12} className="animate-spin text-yellow-400" />
              : <Wifi size={12} className="text-green-400" />
            }
            <span className="text-xs font-bold" style={{ color: status === 'connected' ? '#4ade80' : '#fbbf24' }}>
              {status === 'connecting' ? 'Conectando...' : 'En línea'}
            </span>
          </div>

          <button onClick={onClose}
            className="p-2 rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            title="Minimizar">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Video iframe ── */}
      <div className="flex-1 relative">
        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
            style={{ background: '#0a0a0f' }}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Video size={32} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">Iniciando videollamada...</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Permitir acceso a cámara y micrófono cuando el navegador lo solicite
              </p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500"
                  style={{ animation: `bounce 1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <iframe
          src={callUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          className="w-full h-full border-0"
          style={{ display: status === 'connecting' ? 'none' : 'block' }}
          onLoad={() => setStatus('connected')}
          title="Videollamada Jugando Aprendo"
        />
      </div>

      {/* ── Barra inferior con botón colgar ── */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-4"
        style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        <p className="text-xs mr-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Los controles de cámara y micrófono están dentro de la llamada
        </p>

        <button
          onClick={handleEnd}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
          {saving
            ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
            : <><PhoneOff size={18} /> Finalizar llamada</>
          }
        </button>
      </div>
    </div>
  )
}
