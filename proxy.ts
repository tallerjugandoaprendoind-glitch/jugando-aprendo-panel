// ============================================================================
// middleware.ts — Manejo de roles: jefe | admin | especialista | padre
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roles que tienen acceso al panel /admin (jefes)
const JEFE_ROLES = ['admin', 'jefe']
// Roles que van al portal /especialista
const ESPECIALISTA_ROLES = ['especialista']
// Roles que van al portal /padre
const PADRE_ROLES = ['padre']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute        = request.nextUrl.pathname.startsWith('/admin')
  const isPadreRoute        = request.nextUrl.pathname.startsWith('/padre')
  const isEspecialistaRoute = request.nextUrl.pathname.startsWith('/especialista')
  const isProtectedRoute    = isAdminRoute || isPadreRoute || isEspecialistaRoute

  // Sin sesión → Login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión → Verificar rol y redirigir según corresponda
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || ''

    // Proteger /admin: solo jefes/admins
    if (isAdminRoute) {
      if (PADRE_ROLES.includes(role))        return NextResponse.redirect(new URL('/padre', request.url))
      if (ESPECIALISTA_ROLES.includes(role)) return NextResponse.redirect(new URL('/especialista', request.url))
    }

    // Proteger /especialista: solo especialistas
    if (isEspecialistaRoute) {
      if (PADRE_ROLES.includes(role)) return NextResponse.redirect(new URL('/padre', request.url))
      if (JEFE_ROLES.includes(role))  return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Proteger /padre: solo padres
    if (isPadreRoute) {
      if (JEFE_ROLES.includes(role))         return NextResponse.redirect(new URL('/admin', request.url))
      if (ESPECIALISTA_ROLES.includes(role)) return NextResponse.redirect(new URL('/especialista', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|login).*)'],
}
