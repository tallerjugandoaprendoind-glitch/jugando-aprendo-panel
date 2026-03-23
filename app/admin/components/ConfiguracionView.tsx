'use client'

import { useState } from 'react'
import {
  Settings, Bell, Zap, Calendar, Volume2, Database, Shield,
  Globe, Palette, ChevronRight, ExternalLink, Copy, CheckCircle,
  XCircle, Send, Bot, Mic, Key, RefreshCw, Lock, Languages,
  Building2, Brain, Phone, MessageCircle, Mail, Server, Eye, EyeOff,
} from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import WhatsAppConfigView from './WhatsAppConfigView'
import GoogleCalendarSync from './GoogleCalendarSync'
import MicrosoftCalendarSync from './MicrosoftCalendarSync'

// ─────────────────────────────────────────────
// Sección genérica con título e ícono
// ─────────────────────────────────────────────
function Section({ icon: Icon, title, color, children }: {
  icon: any; title: string; color: string; children: React.ReactNode
}) {
  const { isDark } = useTheme()
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
        <h3 className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// Fila de variable de entorno
function EnvRow({ name, desc, value }: { name: string; desc: string; value?: string }) {
  const { isDark } = useTheme()
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const configured = !!value && value !== 'undefined' && value !== ''
  const copy = (txt: string) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'border-[#30363d] bg-[#0d1117]' : 'border-slate-100 bg-slate-50'}`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${configured ? 'bg-green-500' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <code className={`text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{name}</code>
        <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
      </div>
      <div className="flex items-center gap-1">
        {configured ? (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Configurado</span>
        ) : (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendiente</span>
        )}
        <button onClick={() => copy(name)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
          {copied ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tabs de la página
// ─────────────────────────────────────────────
const TABS = [
  { id: 'general',        label: 'General',         icon: Building2  },
  { id: 'notificaciones', label: 'Notificaciones',  icon: Bell       },
  { id: 'calendario',     label: 'Calendario',      icon: Calendar   },
  { id: 'ia',             label: 'IA & APIs',        icon: Brain      },
  { id: 'apariencia',     label: 'Apariencia',      icon: Palette    },
  { id: 'seguridad',      label: 'Seguridad',       icon: Shield     },
] as const

type Tab = typeof TABS[number]['id']

// ─────────────────────────────────────────────
// Vista General
// ─────────────────────────────────────────────
function TabGeneral() {
  const { isDark } = useTheme()
  const rows = [
    { name: 'CENTRO_NOMBRE',            desc: 'Nombre del centro terapéutico (aparece en mensajes y reportes)' },
    { name: 'NEXT_PUBLIC_APP_URL',      desc: 'URL pública de la aplicación (ej: https://jugandoaprendo.com)' },
    { name: 'NEXT_PUBLIC_SITE_URL',     desc: 'URL del sitio (usada en emails y callbacks OAuth)' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'URL del proyecto Supabase' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Clave anon pública de Supabase' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clave de servicio de Supabase (solo servidor, nunca al cliente)' },
  ]
  return (
    <div className="space-y-4">
      <Section icon={Building2} title="Identidad del Centro" color="bg-blue-600">
        <div className="space-y-2">
          {rows.slice(0, 3).map(r => <EnvRow key={r.name} {...r} />)}
        </div>
        <div className={`rounded-xl p-4 text-xs ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
          💡 Para cambiar el nombre del centro, actualiza la variable <code className="font-mono font-bold">CENTRO_NOMBRE</code> en tu panel de Vercel → Settings → Environment Variables. Luego hace Redeploy.
        </div>
      </Section>

      <Section icon={Database} title="Base de Datos (Supabase)" color="bg-emerald-600">
        <div className="space-y-2">
          {rows.slice(3).map(r => <EnvRow key={r.name} {...r} />)}
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Abrir Dashboard de Supabase <ExternalLink size={11} />
        </a>
      </Section>

      <Section icon={Server} title="Auditoría & Cron" color="bg-slate-600">
        <div className="space-y-2">
          <EnvRow name="AUDIT_SECRET" desc="Clave para rutas de auditoría interna" />
          <EnvRow name="CRON_SECRET" desc="Clave para proteger endpoints de cron jobs" />
          <EnvRow name="KNOWLEDGE_BUCKET_NAME" desc="Nombre del bucket de Supabase Storage para la base de conocimiento" />
        </div>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────
// Vista Calendario
// ─────────────────────────────────────────────
function TabCalendario() {
  const { isDark } = useTheme()
  return (
    <div className="space-y-4">
      <Section icon={Calendar} title="Google Calendar" color="bg-red-500">
        <GoogleCalendarSync />
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDark ? '#21262d' : '#f1f5f9' }}>
          <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Variables de entorno requeridas</p>
          <EnvRow name="GOOGLE_CALENDAR_CLIENT_ID" desc="Client ID de OAuth2 de Google Cloud Console" />
          <EnvRow name="GOOGLE_CALENDAR_CLIENT_SECRET" desc="Client Secret de OAuth2 de Google Cloud Console" />
        </div>
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline">
          Configurar en Google Cloud Console <ExternalLink size={11} />
        </a>
      </Section>

      <Section icon={Calendar} title="Microsoft / Outlook Calendar" color="bg-blue-500">
        <MicrosoftCalendarSync />
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDark ? '#21262d' : '#f1f5f9' }}>
          <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Variables de entorno requeridas</p>
          <EnvRow name="MICROSOFT_CALENDAR_CLIENT_ID" desc="Application (client) ID desde Azure App Registration" />
          <EnvRow name="MICROSOFT_CALENDAR_CLIENT_SECRET" desc="Client Secret generado en Azure" />
          <EnvRow name="MICROSOFT_TENANT_ID" desc="Tenant ID de tu organización en Azure AD" />
        </div>
        <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
          Configurar en Azure Portal <ExternalLink size={11} />
        </a>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────
// Vista IA & APIs
// ─────────────────────────────────────────────
function TabIA() {
  const { isDark } = useTheme()
  const iaRows = [
    { name: 'GROQ_API_KEY',       desc: 'API Key de Groq — motor principal de IA (generación de reportes, ARIA, análisis)', link: 'https://console.groq.com/keys', linkLabel: 'Groq Console' },
    { name: 'GEMINI_API_KEY',     desc: 'API Key de Google Gemini — modelos de visión y análisis avanzado', link: 'https://aistudio.google.com/app/apikey', linkLabel: 'Google AI Studio' },
    { name: 'HF_API_KEY',         desc: 'API Key de HuggingFace — modelos open source y embeddings', link: 'https://huggingface.co/settings/tokens', linkLabel: 'HuggingFace' },
    { name: 'WHO_ICD_CLIENT_ID',  desc: 'Client ID para la API de clasificación ICD-11 de la OMS', link: 'https://icd.who.int/icdapi', linkLabel: 'WHO ICD API' },
    { name: 'WHO_ICD_CLIENT_SECRET', desc: 'Client Secret para la API ICD-11 de la OMS', link: undefined, linkLabel: '' },
  ]
  const audioRows = [
    { name: 'ELEVENLABS_API_KEY',   desc: 'API Key de ElevenLabs — síntesis de voz para reportes en audio', link: 'https://elevenlabs.io/app/speech-synthesis', linkLabel: 'ElevenLabs' },
    { name: 'ELEVENLABS_VOICE_ID',  desc: 'ID de voz seleccionada (ej: Rachel, Antoni...)', link: 'https://elevenlabs.io/voice-library', linkLabel: 'Voice Library' },
    { name: 'ELEVENLABS_MODEL',     desc: 'Modelo a usar (ej: eleven_multilingual_v2)', link: undefined, linkLabel: '' },
  ]
  const pushRows = [
    { name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', desc: 'Clave pública VAPID para push notifications (expuesta al cliente)' },
    { name: 'VAPID_PRIVATE_KEY',            desc: 'Clave privada VAPID (solo servidor)' },
  ]
  return (
    <div className="space-y-4">
      <Section icon={Brain} title="Modelos de Inteligencia Artificial" color="bg-violet-600">
        <div className="space-y-2">
          {iaRows.map(r => (
            <div key={r.name} className="space-y-1">
              <EnvRow name={r.name} desc={r.desc} />
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  className={`ml-5 inline-flex items-center gap-1 text-[10px] font-bold hover:underline ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                  Obtener key en {r.linkLabel} <ExternalLink size={9} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Mic} title="Síntesis de Voz (ElevenLabs)" color="bg-orange-500">
        <div className="space-y-2">
          {audioRows.map(r => (
            <div key={r.name} className="space-y-1">
              <EnvRow name={r.name} desc={r.desc} />
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  className={`ml-5 inline-flex items-center gap-1 text-[10px] font-bold hover:underline ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  Ver en {r.linkLabel} <ExternalLink size={9} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Push Notifications (VAPID)" color="bg-pink-600">
        <div className="space-y-2">
          {pushRows.map(r => <EnvRow key={r.name} {...r} />)}
        </div>
        <div className={`rounded-xl p-3 text-xs ${isDark ? 'bg-pink-900/20 text-pink-300' : 'bg-pink-50 text-pink-700'}`}>
          💡 Generá las claves VAPID con: <code className="font-mono font-bold">npx web-push generate-vapid-keys</code>
        </div>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────
// Vista Apariencia
// ─────────────────────────────────────────────
function TabApariencia() {
  const { isDark, toggleTheme } = useTheme()
  const themes = [
    { id: 'light', label: 'Claro', emoji: '☀️' },
    { id: 'dark',  label: 'Oscuro', emoji: '🌙' },
  ]
  return (
    <div className="space-y-4">
      <Section icon={Palette} title="Tema de la Interfaz" color="bg-indigo-600">
        <div className="flex gap-3">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { if ((t.id === 'dark') !== isDark) toggleTheme() }}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-bold
                ${(t.id === 'dark') === isDark
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : isDark ? 'border-[#30363d] text-slate-500 hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              {t.label}
              {(t.id === 'dark') === isDark && (
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Activo</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Globe} title="Idioma del Sistema" color="bg-teal-600">
        <div className={`rounded-xl p-4 text-sm ${isDark ? 'text-slate-300 bg-teal-900/20' : 'text-teal-800 bg-teal-50'}`}>
          El idioma se cambia desde el selector <strong>ES / EN</strong> en la barra superior derecha. La selección se guarda automáticamente para cada usuario.
        </div>
        <div className="flex gap-2">
          {['🇪🇸 Español', '🇺🇸 English'].map(l => (
            <div key={l} className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold border ${isDark ? 'border-[#30363d] text-slate-400' : 'border-slate-200 text-slate-500'}`}>{l}</div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────
// Vista Seguridad
// ─────────────────────────────────────────────
function TabSeguridad() {
  const { isDark } = useTheme()
  const roles = [
    { role: 'jefe',        label: 'Jefe / Owner',     color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', perms: ['Todo el sistema', 'Usuarios', 'Config', 'Tienda', 'Agenda'] },
    { role: 'admin',       label: 'Administrador',    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',         perms: ['Pacientes', 'Agenda', 'Recursos', 'Reportes', 'Hub IA'] },
    { role: 'especialista',label: 'Especialista',     color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', perms: ['Pacientes asignados', 'Evaluaciones', 'Hub IA', 'Recursos'] },
    { role: 'terapeuta',   label: 'Terapeuta',        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',     perms: ['Pacientes asignados', 'Evaluaciones', 'Recursos'] },
  ]
  return (
    <div className="space-y-4">
      <Section icon={Shield} title="Roles y Permisos" color="bg-red-600">
        <div className="space-y-3">
          {roles.map(r => (
            <div key={r.role} className={`rounded-xl border p-4 ${isDark ? 'border-[#30363d]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.perms.map(p => (
                  <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-[#21262d] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-xs rounded-xl p-3 ${isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
          🔒 Los roles se asignan desde <strong>Configuración → Usuarios</strong>. Solo el Jefe puede cambiar roles.
        </div>
      </Section>

      <Section icon={Key} title="Gestión de Usuarios" color="bg-slate-600">
        <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          La creación, edición y desactivación de usuarios se gestiona desde la sección <strong>Usuarios</strong> en el menú lateral izquierdo.
        </div>
        <div className={`rounded-xl border p-4 space-y-2 ${isDark ? 'border-[#30363d]' : 'border-slate-100'}`}>
          <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Autenticación</p>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Supabase Auth — email + contraseña</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Sesiones seguras con JWT</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Row Level Security (RLS) en Supabase</span>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function ConfiguracionView() {
  const { isDark } = useTheme()
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div className="flex gap-6 max-w-6xl">
      {/* Sidebar de tabs */}
      <aside className={`w-48 shrink-0 rounded-2xl border p-2 h-fit sticky top-0 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
        <p className={`text-[10px] font-black uppercase tracking-widest px-3 pt-2 pb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Configuración</p>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
              ${tab === t.id
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:bg-[#21262d] hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
          >
            <t.icon size={15} className="shrink-0" />
            {t.label}
          </button>
        ))}
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {tab === 'general'        && <TabGeneral />}
        {tab === 'notificaciones' && (
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'}`}>
            <WhatsAppConfigView />
          </div>
        )}
        {tab === 'calendario'     && <TabCalendario />}
        {tab === 'ia'             && <TabIA />}
        {tab === 'apariencia'     && <TabApariencia />}
        {tab === 'seguridad'      && <TabSeguridad />}
      </div>
    </div>
  )
}
