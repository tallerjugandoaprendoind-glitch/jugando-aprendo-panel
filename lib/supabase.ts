// UBICACIÓN: lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

// Use proxy URL in browser to avoid network blocks in public WiFi
// The proxy routes through our own Vercel domain instead of *.supabase.co
function getSupabaseUrl() {
  if (typeof window !== 'undefined') {
    // In browser: use proxy through our own domain
    return `${window.location.origin}/api/sb`
  }
  // On server: connect directly
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: async (url: RequestInfo | URL, options?: RequestInit) => {
        // Rewrite Supabase URLs to go through our proxy
        if (typeof window !== 'undefined' && typeof url === 'string') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          if (url.startsWith(supabaseUrl)) {
            url = url.replace(supabaseUrl, `${window.location.origin}/api/sb`)
          }
        }
        return fetch(url, options)
      }
    }
  }
)