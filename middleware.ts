// ============================================================================
// ARCHIVO: middleware.ts
// ============================================================================
// UBICACIÓN: Raíz del proyecto (mismo nivel que app/)
// INSTRUCCIONES: 
// 1. Crear archivo: middleware.ts (en la RAÍZ del proyecto)
// 2. Copiar y pegar este código
// 3. Guardar
// ============================================================================

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Obtener sesión del usuario
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas que requieren autenticación
  const protectedRoutes = ['/admin', '/padre']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Si es ruta protegida y NO hay sesión → Redirigir a login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', req.url)
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si está autenticado, verificar rol
  if (session && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Si es admin pero no tiene rol admin → Bloquear
    if (req.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/padre', req.url))
    }

    // Si es padre pero no tiene rol padre → Bloquear
    if (req.nextUrl.pathname.startsWith('/padre') && profile?.role !== 'padre') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return res
}

// Configurar qué rutas ejecutan el middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/padre/:path*'
  ]
}