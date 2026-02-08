// ============================================================================
// ARCHIVO: middleware.ts (VERSIÓN CORREGIDA)
// ============================================================================
// UBICACIÓN: Raíz del proyecto (mismo nivel que app/)
// COMPATIBLE CON: Next.js 13+ App Router + @supabase/supabase-js
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // Obtener sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isPadreRoute = request.nextUrl.pathname.startsWith('/padre')
  const isProtectedRoute = isAdminRoute || isPadreRoute

  // Si NO hay usuario y está intentando acceder a ruta protegida → Login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay usuario, verificar rol
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Admin intentando acceder a admin → OK
    // Padre intentando acceder a padre → OK
    // Admin intentando acceder a padre → Redirigir a admin
    // Padre intentando acceder a admin → Redirigir a padre
    
    if (isAdminRoute && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/padre', request.url))
    }

    if (isPadreRoute && profile?.role !== 'padre') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/padre/:path*'
  ]
}