import createMiddleware from 'next-intl/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const JEFE_ROLES = ['admin', 'jefe']
const ESPECIALISTA_ROLES = ['especialista']
const PADRE_ROLES = ['padre']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Strip locale prefix for route matching (/es/admin → /admin)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/'

  const isAdminRoute        = pathnameWithoutLocale.startsWith('/admin')
  const isPadreRoute        = pathnameWithoutLocale.startsWith('/padre')
  const isEspecialistaRoute = pathnameWithoutLocale.startsWith('/especialista')
  const isProtectedRoute    = isAdminRoute || isPadreRoute || isEspecialistaRoute

  // Detect current locale from URL (default: es)
  const localeMatch = pathname.match(/^\/(es|en)/)
  const locale = localeMatch ? localeMatch[1] : 'es'

  // ── Auth check for protected routes ──────────────────────────
  if (isProtectedRoute) {
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

    // No session → redirect to login (locale-aware)
    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check role and redirect if needed
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || ''

    if (isAdminRoute) {
      if (PADRE_ROLES.includes(role))        return NextResponse.redirect(new URL(`/${locale}/padre`, request.url))
      if (ESPECIALISTA_ROLES.includes(role)) return NextResponse.redirect(new URL(`/${locale}/especialista`, request.url))
    }
    if (isEspecialistaRoute) {
      if (PADRE_ROLES.includes(role)) return NextResponse.redirect(new URL(`/${locale}/padre`, request.url))
      if (JEFE_ROLES.includes(role))  return NextResponse.redirect(new URL(`/${locale}/admin`, request.url))
    }
    if (isPadreRoute) {
      if (JEFE_ROLES.includes(role))         return NextResponse.redirect(new URL(`/${locale}/admin`, request.url))
      if (ESPECIALISTA_ROLES.includes(role)) return NextResponse.redirect(new URL(`/${locale}/especialista`, request.url))
    }
  }

  // ── next-intl locale routing ──────────────────────────────────
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js|googleddacd36c210c1f1b.html).*)'
  ]
}
