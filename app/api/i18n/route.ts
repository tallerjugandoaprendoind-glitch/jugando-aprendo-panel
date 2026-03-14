import { NextRequest, NextResponse } from 'next/server'
import ES from '../../../../messages/es.json'
import EN from '../../../../messages/en.json'
import PT from '../../../../messages/pt.json'
import FR from '../../../../messages/fr.json'
import DE from '../../../../messages/de.json'
import IT from '../../../../messages/it.json'

const MESSAGES: Record<string, any> = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT }

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'es'
  const validLocales = ['es', 'en', 'pt', 'fr', 'de', 'it']
  const safeLocale = validLocales.includes(locale) ? locale : 'es'
  
  const messages = MESSAGES[safeLocale] || MESSAGES['es']
  return NextResponse.json(messages, {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  })
}
