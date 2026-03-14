'use client'

import { useI18n } from '@/lib/i18n-context'
// Panel de configuración de notificaciones — Telegram (recomendado) + WhatsApp
import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, ExternalLink, Copy, Send, MessageCircle } from 'lucide-react'

export default function WhatsAppConfigView() {
  const { t } = useI18n()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [tab, setTab] = useState<'telegram' | 'whatsapp'>('telegram')

  useEffect(() => {
    fetch('/api/whatsapp').then(r => r.json()).then(d => { setStatus(d); setLoading(false) })
  }, [])

  const sendTest = async () => {
    setSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': typeof window !== 'undefined' ? (localStorage.getItem('vanty_locale') || 'es') : 'es' },
        body: JSON.stringify({
          tipo: 'custom',
          vars: { mensaje: `🧪 *Test Vanty* — ${new Date().toLocaleTimeString('es-PE')} ✅\nNotificaciones funcionando correctamente.` },
          guardar: false,
        }),
      })
      const d = await res.json()
      setTestResult({
        ok: d.sent,
        msg: d.sent
          ? '✅ Mensaje enviado correctamente'
          : '❌ No se pudo enviar. Verificá las variables de entorno en Vercel.',
      })
    } finally { setSending(false) }
  }

  const copy = (t: string) => navigator.clipboard.writeText(t)

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  const configured = status?.configured
  const channel    = status?.channel

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Bell size={20} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Notificaciones externas
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Alertas en tiempo real cuando ocurre algo importante en la plataforma
          </p>
        </div>
      </div>

      {/* Estado actual */}
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${
        configured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        {configured
          ? <CheckCircle size={18} className="text-green-600 shrink-0" />
          : <XCircle size={18} className="text-amber-600 shrink-0" />
        }
        <div className="flex-1">
          <p className={`text-sm font-bold ${configured ? 'text-green-800' : 'text-amber-800'}`}>
            Canal activo: {status?.label || 'Sin configurar'}
          </p>
          {!configured && (
            <p className="text-xs text-amber-700 mt-0.5">
              Seguí los pasos de abajo para activar Telegram (recomendado — gratis y confiable).
            </p>
          )}
        </div>
        {configured && (
          <button
            onClick={sendTest}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-green-300 text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
          >
            <Send size={12} />
            {sending ? 'Enviando...' : 'Probar'}
          </button>
        )}
      </div>

      {testResult && (
        <p className={`text-xs font-semibold px-4 py-2 rounded-lg ${
          testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>{testResult.msg}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
        {([
          { id: 'telegram',  label: '✈️ Telegram', badge: 'Recomendado' },
          { id: 'whatsapp',  label: '💬 WhatsApp',  badge: 'Meta Cloud API' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2.5 px-1 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              tab === t.id
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              t.id === 'telegram' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>{t.badge}</span>
          </button>
        ))}
      </div>

      {/* ── TELEGRAM ── */}
      {tab === 'telegram' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-bold text-green-800 mb-1">¿Por qué Telegram?</p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>{t('ui.whatsapp_free')}</li>
              <li>✅ No requiere verificar empresa ni esperar aprobaciones</li>
              <li>{t('ui.whatsapp_peruvian')}</li>
              <li>✅ Listo en 3 minutos desde el celular</li>
            </ul>
          </div>

          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ⚙️ Configuración paso a paso
            </p>

            {[
              {
                n: '1', title: 'Crear el bot',
                desc: 'En Telegram buscá @BotFather → escribí /newbot → seguí los pasos.',
                code: '/newbot',
                note: 'Te va a pedir un nombre (ej: "Vanty Jugando Aprendo") y un username (ej: vanty_ja_bot). Al final te da el TOKEN.',
              },
              {
                n: '2', title: 'Crear el grupo de alertas',
                desc: 'Creá un grupo en Telegram llamado "Vanty Alertas" y agregá el bot que creaste.',
                note: 'Podés agregar al grupo a todo el equipo del centro.',
              },
              {
                n: '3', title: 'Obtener el Chat ID',
                desc: 'Mandá cualquier mensaje en el grupo, luego abrí esta URL en el navegador:',
                code: 'https://api.telegram.org/bot<TU_TOKEN>/getUpdates',
                note: 'Buscá "chat" → "id" en la respuesta. Es un número negativo como -1001234567890.',
              },
              {
                n: '4', title: 'Configurar en Vercel',
                desc: 'Settings → Environment Variables → agregar:',
                code: 'TELEGRAM_BOT_TOKEN = 7123456789:AAFxxxxxxxx\nTELEGRAM_CHAT_ID   = -1001234567890',
                note: 'Después de guardar, hacé Redeploy en Vercel para que tome los cambios.',
              },
            ].map(step => (
              <div key={step.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-violet-600">{step.n}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                  {step.code && (
                    <div className="flex items-start gap-2 mt-1.5">
                      <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1.5 rounded font-mono flex-1 whitespace-pre leading-relaxed">
                        {step.code}
                      </code>
                      <button onClick={() => copy(step.code!)} className="p-1 hover:bg-slate-200 rounded mt-0.5 shrink-0">
                        <Copy size={11} className="text-slate-400" />
                      </button>
                    </div>
                  )}
                  {step.note && (
                    <p className="text-xs mt-1 text-violet-600 italic">{step.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WHATSAPP META ── */}
      {tab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-bold text-blue-800 mb-1">Meta WhatsApp Cloud API</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✅ 1.000 conversaciones de servicio/mes gratis</li>
              <li>✅ Notifica directamente al WhatsApp de cualquier usuario</li>
              <li>{t('ui.whatsapp_meta_warning')}</li>
              <li>⚠️ Las plantillas deben ser aprobadas por Meta</li>
            </ul>
          </div>

          <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Variables de entorno</p>
            <div className="flex items-start gap-2">
              <code className="text-xs bg-slate-100 text-slate-700 px-2 py-2 rounded font-mono flex-1 whitespace-pre leading-relaxed">
                {`META_WA_PHONE_ID = (de Meta Developer Console)\nMETA_WA_TOKEN    = (token de acceso permanente)`}
              </code>
              <button onClick={() => copy('META_WA_PHONE_ID=\nMETA_WA_TOKEN=')} className="p-1 hover:bg-slate-200 rounded mt-0.5 shrink-0">
                <Copy size={11} className="text-slate-400" />
              </button>
            </div>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              Ver guía oficial de Meta <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Triggers activos */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🔔 Qué dispara una notificación</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '📅', label: 'Cita agendada',      active: true },
            { icon: '❌', label: 'Cita cancelada',     active: true },
            { icon: '📋', label: 'Formulario subido',  active: true },
            { icon: '📊', label: 'Informe generado',   active: true },
            { icon: '⚠️', label: 'Alerta clínica IA',  active: false },
            { icon: '💬', label: 'Mensaje terapeuta',  active: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                item.active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}>{item.active ? 'Activo' : 'Pronto'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
