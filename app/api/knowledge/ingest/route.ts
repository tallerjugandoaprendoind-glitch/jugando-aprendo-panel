// app/api/knowledge/ingest/route.ts
// Maneja: texto directo | archivo (Supabase Storage) | URL externa

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument } from '@/lib/knowledge-base'

// ── GET: listar documentos ────────────────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('knowledge_documents')
    .select('id, titulo, tipo, descripcion, procesado, total_chunks, created_at, source_url')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE: eliminar documento ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  await supabaseAdmin.from('knowledge_chunks').delete().eq('document_id', id)
  await supabaseAdmin.from('knowledge_documents').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}

// ── POST: ingestar documento ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, tipo, descripcion, texto, storageUrl, fileName, sourceUrl } = body

    if (!titulo) return NextResponse.json({ error: 'título requerido' }, { status: 400 })

    // 1. Crear el registro en la DB
    const { data: doc, error: dbError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        titulo,
        tipo: tipo || 'libro',
        descripcion: descripcion || '',
        procesado: false,
        source_url: sourceUrl || null,
      })
      .select()
      .single()

    if (dbError) throw new Error(dbError.message)
    const docId = doc.id

    // 2. Extraer el texto según la fuente
    let fullText = ''

    // ── Fuente: texto directo ──────────────────────────────────────────────
    if (texto) {
      fullText = texto

    // ── Fuente: archivo en Supabase Storage ───────────────────────────────
    } else if (storageUrl) {
      fullText = await extractTextFromStorageUrl(storageUrl, fileName || '')

    // ── Fuente: URL externa ────────────────────────────────────────────────
    } else if (sourceUrl) {
      fullText = await extractTextFromUrl(sourceUrl)

    } else {
      return NextResponse.json({ error: 'Se requiere texto, storageUrl o sourceUrl' }, { status: 400 })
    }

    if (!fullText || fullText.trim().length < 50) {
      await supabaseAdmin.from('knowledge_documents').delete().eq('id', docId)
      return NextResponse.json({ error: 'No se pudo extraer texto suficiente del documento' }, { status: 422 })
    }

    // 3. Indexar en background — respondemos inmediatamente al cliente
    indexDocument(docId, fullText, { titulo, tipo, fuente: sourceUrl || fileName || 'texto' })
      .catch(e => console.error(`[ingest] Error indexando ${docId}:`, e))

    return NextResponse.json({ ok: true, docId, chars: fullText.length })

  } catch (e: any) {
    console.error('[ingest] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── Extraer texto desde Supabase Storage (PDF o TXT) ─────────────────────────
async function extractTextFromStorageUrl(url: string, fileName: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo descargar el archivo: ${res.status}`)

  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    const buffer = await res.arrayBuffer()
    return await extractTextFromPdfBuffer(buffer)
  }

  // TXT, MD — texto plano
  return await res.text()
}

// ── Extraer texto desde URL externa ──────────────────────────────────────────
async function extractTextFromUrl(url: string): Promise<string> {
  // Normalizar URLs de Google Drive
  url = normalizeUrl(url)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
    },
  })

  if (!res.ok) throw new Error(`No se pudo acceder a la URL (${res.status}). Verificá que sea pública.`)

  const contentType = res.headers.get('content-type') || ''

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (contentType.includes('pdf') || url.toLowerCase().includes('.pdf')) {
    const buffer = await res.arrayBuffer()
    return await extractTextFromPdfBuffer(buffer)
  }

  // ── HTML (página web) ────────────────────────────────────────────────────
  if (contentType.includes('html')) {
    const html = await res.text()
    return extractTextFromHtml(html)
  }

  // ── Texto plano ──────────────────────────────────────────────────────────
  return await res.text()
}

// ── Normalizar URLs especiales ────────────────────────────────────────────────
function normalizeUrl(url: string): string {
  // Google Drive: /file/d/ID/view → /uc?export=download&id=ID
  const gdrive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (gdrive) {
    return `https://drive.google.com/uc?export=download&id=${gdrive[1]}`
  }

  // Google Drive compartido directo
  const gdriveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (gdriveOpen) {
    return `https://drive.google.com/uc?export=download&id=${gdriveOpen[1]}`
  }

  // Dropbox: ?dl=0 → ?dl=1
  if (url.includes('dropbox.com')) {
    return url.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
  }

  return url
}

// ── Extraer texto de PDF ──────────────────────────────────────────────────────
async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    // Usamos pdf-parse (debe estar instalado: npm install pdf-parse)
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(Buffer.from(buffer))
    return data.text || ''
  } catch (e) {
    console.warn('[ingest] pdf-parse falló, extrayendo texto básico:', e)
    // Fallback: extraer texto visible del PDF manualmente
    return extractPdfTextFallback(buffer)
  }
}

// ── Fallback: extracción básica de texto de PDF sin librería ─────────────────
function extractPdfTextFallback(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const raw = new TextDecoder('latin1').decode(bytes)
  const chunks: string[] = []

  // Buscar streams de texto BT...ET en el PDF
  const regex = /BT([\s\S]*?)ET/g
  let match
  while ((match = regex.exec(raw)) !== null) {
    const block = match[1]
    // Extraer contenido de paréntesis: (texto)
    const textRegex = /\(([^)]+)\)/g
    let t
    while ((t = textRegex.exec(block)) !== null) {
      const clean = t[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\/g, '')
      if (clean.trim()) chunks.push(clean)
    }
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

// ── Extraer texto limpio de HTML ──────────────────────────────────────────────
function extractTextFromHtml(html: string): string {
  // Remover scripts, styles, nav, footer
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    // Convertir tags de bloque en saltos de línea
    .replace(/<\/?(p|div|h[1-6]|li|br|tr)[^>]*>/gi, '\n')
    // Remover todos los tags restantes
    .replace(/<[^>]+>/g, '')
    // Decodificar entidades HTML básicas
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    // Limpiar espacios múltiples
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim()

  return text
}