import { createClient } from '@supabase/supabase-js'

// Cliente público (con RLS habilitado)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente admin (bypass RLS) - SOLO para operaciones administrativas
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Esta key está en Settings > API
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)