// ============================================================================
// MIDDLEWARE MEJORADO - middleware.ts
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rate limiting simple (en producción usar @upstash/ratelimit)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  // 1. Rate limiting básico
  // CORRECCIÓN AQUÍ: Usamos (request as any) para evitar el error de TypeScript
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intenta más tarde.' },
      { status: 429 }
    )
  }

  // 2. Crear respuesta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 3. Configurar cliente de Supabase
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

  // 4. Obtener sesión del usuario
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  // 5. Verificar si la sesión es válida y no expirada
  if (sessionError) {
    console.error('Session error:', sessionError)
    // Limpiar cookies corruptas
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
  }

  // 6. Definir rutas protegidas
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isPadreRoute = pathname.startsWith('/padre')
  const isProtectedRoute = isAdminRoute || isPadreRoute

  // 7. CASO 1: No hay usuario y quiere entrar a zona privada -> LOGIN
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 8. CASO 2: Hay usuario -> Verificar Rol y Estado
  if (session && isProtectedRoute) {
    try {
      // Obtener perfil con verificación de estado activo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active, email')
        .eq('id', session.user.id)
        .single()

      // Si no existe perfil, redirigir a login
      if (profileError || !profile) {
        console.error('Profile error:', profileError)
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Verificar que el usuario esté activo
      if (!profile.is_active) {
        await supabase.auth.signOut()
        const blockedUrl = new URL('/login', request.url)
        blockedUrl.searchParams.set('error', 'account_disabled')
        return NextResponse.redirect(blockedUrl)
      }

      // Verificar roles específicos
      if (isAdminRoute && profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/padre', request.url))
      }

      if (isPadreRoute && profile.role !== 'padre') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Log de acceso para auditoría (opcional)
      if (process.env.ENABLE_AUDIT_LOG === 'true') {
        await supabase.from('audit_log').insert({
          user_id: session.user.id,
          action: 'PAGE_ACCESS',
          resource_id: pathname,
          details: { 
            ip, 
            user_agent: request.headers.get('user-agent') 
          }
        })
      }

    } catch (error) {
      console.error('Middleware error:', error)
      // En caso de error, permitir continuar pero registrar
      // (evita bloquear a usuarios legítimos por errores de BD)
    }
  }

  // 9. Headers de seguridad adicionales
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP básico (ajustar según necesidades)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - api (rutas API - tienen su propia autenticación)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - images (imágenes públicas)
     * - favicon.ico, sitemap.xml, robots.txt
     * - login (página de entrada)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt|login).*)',
  ],
}
