// UBICACIÓN: lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

// Función para crear el cliente en el navegador
// Usamos createBrowserClient para que maneje las cookies automáticamente
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)