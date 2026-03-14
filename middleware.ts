import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js|googleddacd36c210c1f1b.html).*)'
  ]
}
