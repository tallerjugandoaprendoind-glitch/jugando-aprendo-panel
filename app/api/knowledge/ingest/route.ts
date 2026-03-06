// app/api/knowledge/ingest/route.ts
// Maneja: texto directo | archivo (Supabase Storage) | URL externa
// FIX: el indexado ahora es SINCRÓNICO — no fire-and-forget
// Para libros grandes (>200KB texto) delega a /api/knowledge/index

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument } from '@/lib/knowledge-base'

const LARGE_TEXT_THRESHOLD = 200_000 // ~200KB de texto = libro grande

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

    if (texto) {
      fullText = texto
    } else if (storageUrl) {
      fullText = await extractTextFromStorageUrl(storageUrl, fileName || '')
    } else if (sourceUrl) {
      fullText = await extractTextFromUrl(sourceUrl)
    } else {
      return NextResponse.json({ error: 'Se requiere texto, storageUrl o sourceUrl' }, { status: 400 })
    }

    if (!fullText || fullText.trim().length < 50) {
      await supabaseAdmin.from('knowledge_documents').delete().eq('id', docId)
      return NextResponse.json({ error: 'No se pudo extraer texto suficiente del documento' }, { status: 422 })
    }

    // 3. Guardar el texto extraído en la DB para indexado posterior
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ texto_extraido: fullText.slice(0, 500_000) }) // máx 500KB
      .eq('id', docId)

    // 4. Para textos pequeños: indexar sincrónicamente ahora mismo
    //    Para textos grandes: responder rápido y el cliente llama /api/knowledge/index
    if (fullText.length <= LARGE_TEXT_THRESHOLD) {
      const result = await indexDocument(docId, fullText, { titulo, tipo, fuente: sourceUrl || fileName || 'texto' })
      if (!result.success) {
        console.error(`[ingest] Error indexando ${docId}:`, result.error)
      }
      return NextResponse.json({ ok: true, docId, chars: fullText.length, indexed: result.success, chunks: result.chunks })
    }

    // Texto grande: responder inmediatamente, el cliente dispara el indexado
    return NextResponse.json({ ok: true, docId, chars: fullText.length, indexed: false, needsIndex: true })

  } catch (e: any) {
    console.error('[ingest] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── Extraer texto desde Supabase Storage ─────────────────────────────────────
async function extractTextFromStorageUrl(url: string, fileName: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo descargar el archivo: ${res.status}`)
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    const buffer = await res.arrayBuffer()
    return await extractTextFromPdfBuffer(buffer)
  }
  return await res.text()
}

// ── Extraer texto desde URL externa ──────────────────────────────────────────
async function extractTextFromUrl(url: string): Promise<string> {
  url = normalizeUrl(url)
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)' } })
  if (!res.ok) throw new Error(`No se pudo acceder a la URL (${res.status}). Verificá que sea pública.`)
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('pdf') || url.toLowerCase().includes('.pdf')) {
    const buffer = await res.arrayBuffer()
    return await extractTextFromPdfBuffer(buffer)
  }
  if (contentType.includes('html')) {
    return extractTextFromHtml(await res.text())
  }
  return await res.text()
}

function normalizeUrl(url: string): string {
  const gdrive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (gdrive) return `https://drive.google.com/uc?export=download&id=${gdrive[1]}`
  const gdriveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (gdriveOpen) return `https://drive.google.com/uc?export=download&id=${gdriveOpen[1]}`
  if (url.includes('dropbox.com')) return url.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
  return url
}

async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse')
    const data = await pdfParse(Buffer.from(buffer))
    return data.text || ''
  } catch (e) {
    console.warn('[ingest] pdf-parse falló, usando fallback:', e)
    return extractPdfTextFallback(buffer)
  }
}

function extractPdfTextFallback(buffer: ArrayBuffer): string {
  const raw = new TextDecoder('latin1').decode(new Uint8Array(buffer))
  const chunks: string[] = []
  const regex = /BT([\s\S]*?)ET/g
  let match
  while ((match = regex.exec(raw)) !== null) {
    const textRegex = /\(([^)]+)\)/g
    let t
    while ((t = textRegex.exec(match[1])) !== null) {
      const clean = t[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\/g, '')
      if (clean.trim()) chunks.push(clean)
    }
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<\/?(p|div|h[1-6]|li|br|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim()
}
