// UBICACIÓN: lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 1. Cargamos las variables PÚBLICAS (las únicas que el navegador puede ver)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 2. Verificación de seguridad para que no explote si faltan
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Error: Faltan las variables de entorno de Supabase (URL o ANON KEY)')
}

// 3. Exportamos SOLAMENTE el cliente público
export const supabase = createClient(supabaseUrl, supabaseKey)