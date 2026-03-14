import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'es'
  const validLocales = ['es', 'en', 'pt', 'fr', 'de', 'it']
  const safeLocale = validLocales.includes(locale) ? locale : 'es'
  
  try {
    const messages = await import(`../../../../messages/${safeLocale}.json`)
    return NextResponse.json(messages.default, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })
  } catch {
    return NextResponse.json({}, { status: 404 })
  }
}
