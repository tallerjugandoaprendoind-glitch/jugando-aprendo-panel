'use client'
/**
 * i18n-context.tsx
 * Compatibility shim — wraps next-intl so all existing useI18n() calls
 * continue working unchanged. The locale is now URL-based (/es/... or /en/...).
 */
import { useLocale, useMessages } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createTranslator, type Locale } from './i18n'
import type { ReactNode } from 'react'

export type T = (key: string, vars?: Record<string, string>) => string

export function useI18n() {
  const locale = useLocale() as Locale
  const messages = useMessages() as Record<string, any>
  const router = useRouter()
  const pathname = usePathname()

  const t = createTranslator(messages)

  const changeLocale = (newLocale: Locale) => {
    // Swap the locale segment in the URL: /es/admin → /en/admin
    const segments = pathname.split('/')
    if (segments[1] === 'es' || segments[1] === 'en') {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    // Also save to localStorage so API calls can read it
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanty_locale', newLocale)
    }
    router.push(segments.join('/') || '/')
  }

  return { t, locale, changeLocale }
}

// I18nProvider is now a no-op — NextIntlClientProvider in [locale]/layout.tsx
// handles everything. Kept for backward compatibility.
export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
