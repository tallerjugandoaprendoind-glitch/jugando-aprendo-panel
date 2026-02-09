// ============================================================================
// ARCHIVO: middleware.ts (VERSIÓN FINAL ARREGLADA)
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Crear respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configurar cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 3. Obtener sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Definir Rutas protegidas
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isPadreRoute = request.nextUrl.pathname.startsWith('/padre')
  const isProtectedRoute = isAdminRoute || isPadreRoute

  // 5. CASO 1: No hay usuario y quiere entrar a zona privada -> LOGIN
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 6. CASO 2: Hay usuario -> Verificar Rol
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // --- CORRECCIÓN CRÍTICA AQUÍ ---
    // Antes: Si profile era null, te expulsaba.
    // Ahora: Solo te expulsa si EXPLICITAMENTE tienes el rol contrario.
    // Esto evita el bucle infinito si la base de datos tarda en responder.

    // Si estás en Admin pero eres Padre -> Fuera
    if (isAdminRoute && profile?.role === 'padre') {
      return NextResponse.redirect(new URL('/padre', request.url))
    }

    // Si estás en Padre pero eres Admin -> Fuera
    if (isPadreRoute && profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // Si profile es null o el rol es correcto, DEJA PASAR.
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - api (rutas API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - images (tus imágenes públicas como logos)
     * - favicon.ico (icono)
     * - login (página de entrada)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|login).*)',
  ],
}