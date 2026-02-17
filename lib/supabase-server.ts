// ============================================================================
// SUPABASE SERVER CLIENT - lib/supabase-server.ts
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper para verificar sesión en Server Components
export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
}

// Helper para obtener perfil del usuario autenticado
export async function getProfile() {
  const session = await getSession()
  if (!session) return null
  
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

// Helper para verificar si el usuario es admin
export async function isAdmin() {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

// Helper para verificar si el usuario es padre
export async function isParent() {
  const profile = await getProfile()
  return profile?.role === 'padre'
}
