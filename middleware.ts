// ============================================================================
// middleware.ts — Manejo de roles: jefe | especialista | padre
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roles que tienen acceso al panel /admin
const ADMIN_ROLES = ['admin', 'jefe', 'especialista']
// Roles que van al portal /padre
const PADRE_ROLES = ['padre']

export async function middleware(request: NextRequest) {
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

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isPadreRoute = request.nextUrl.pathname.startsWith('/padre')
  const isProtectedRoute = isAdminRoute || isPadreRoute

  // Sin sesión → Login
  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión → Verificar rol
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || ''

    // Si intenta entrar a /admin pero es padre → redirigir a /padre
    if (isAdminRoute && PADRE_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/padre', request.url))
    }

    // Si intenta entrar a /padre pero es jefe/especialista → redirigir a /admin
    if (isPadreRoute && ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|login).*)'],
}
