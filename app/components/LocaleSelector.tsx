'use client'
import { useI18n } from '@/lib/i18n-context'

export default function LocaleSelector({ compact = false }: { compact?: boolean }) {
  const { locale, changeLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
      <button
        onClick={() => changeLocale('es')}
        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${locale === 'es' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >
        🇪🇸 ES
      </button>
      <button
        onClick={() => changeLocale('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${locale === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >
        🇺🇸 EN
      </button>
    </div>
  )
}
