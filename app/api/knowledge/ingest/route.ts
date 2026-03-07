// app/api/knowledge/ingest/route.ts — FIXED v2
// Cambios:
// 1. PDFs: usa Gemini Vision (lee texto + imágenes + PDFs escaneados)
// 2. URLs: scraping mejorado + opción de leer con Gemini si el HTML es escaso
// 3. Errores: devuelve mensaje exacto, no silencioso
// 4. Re-indexado: si total_chunks=0, permite reintentar

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument, extractTextFromPdfWithGemini, extractTextFromHtml } from '@/lib/knowledge-base'

const LARGE_TEXT_THRESHOLD = 200_000

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

// ── PATCH: reintentar indexado de un documento ya existente ──────────────────
export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  
  const { data: doc } = await supabaseAdmin
    .from('knowledge_documents')
    .select('*').eq('id', id).single()
  
  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  if (!doc.texto_extraido) return NextResponse.json({ error: 'Sin texto extraído para re-indexar' }, { status: 422 })
  
  // Limpiar chunks anteriores
  await supabaseAdmin.from('knowledge_chunks').delete().eq('document_id', id)
  await supabaseAdmin.from('knowledge_documents').update({ procesado: false, total_chunks: 0 }).eq('id', id)
  
  const result = await indexDocument(id, doc.texto_extraido, { titulo: doc.titulo, tipo: doc.tipo })
  return NextResponse.json({ ok: result.success, chunks: result.chunks, error: result.error })
}

// ── POST: ingestar documento ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, tipo, descripcion, texto, storageUrl, fileName, sourceUrl } = body

    if (!titulo) return NextResponse.json({ error: 'título requerido' }, { status: 400 })

    // 1. Crear registro
    const { data: doc, error: dbError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        titulo,
        tipo: tipo || 'libro',
        descripcion: descripcion || '',
        procesado: false,
        source_url: sourceUrl || null,
      })
      .select().single()

    if (dbError) throw new Error(dbError.message)
    const docId = doc.id

    // 2. Extraer texto
    let fullText = ''
    let extractionMethod = 'unknown'

    try {
      if (texto) {
        fullText = texto
        extractionMethod = 'texto_directo'
      } else if (storageUrl) {
        const { text, method } = await extractFromStorageUrl(storageUrl, fileName || '')
        fullText = text
        extractionMethod = method
      } else if (sourceUrl) {
        const { text, method } = await extractFromUrl(sourceUrl)
        fullText = text
        extractionMethod = method
      } else {
        await supabaseAdmin.from('knowledge_documents').delete().eq('id', docId)
        return NextResponse.json({ error: 'Se requiere texto, storageUrl o sourceUrl' }, { status: 400 })
      }
    } catch (extractErr: any) {
      await supabaseAdmin.from('knowledge_documents').delete().eq('id', docId)
      return NextResponse.json({ 
        error: `Error extrayendo contenido: ${extractErr.message}`,
        hint: 'Verifica que el archivo sea accesible y no esté protegido'
      }, { status: 422 })
    }

    // 3. Validar texto extraído
    const cleanText = fullText.trim()
    if (cleanText.length < 50) {
      await supabaseAdmin.from('knowledge_documents').delete().eq('id', docId)
      return NextResponse.json({
        error: `Texto extraído insuficiente (${cleanText.length} chars). ` +
          (extractionMethod.includes('fallback') 
            ? 'El PDF puede ser escaneado sin capa de texto — prueba subir como imagen o pegar el texto manualmente.'
            : 'El documento puede estar vacío o protegido.')
      }, { status: 422 })
    }

    // 4. Guardar texto extraído
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ texto_extraido: cleanText.slice(0, 500_000), descripcion: descripcion || `Extraído via ${extractionMethod}` })
      .eq('id', docId)

    // 5. Indexar
    if (cleanText.length <= LARGE_TEXT_THRESHOLD) {
      const result = await indexDocument(docId, cleanText, { titulo, tipo, fuente: sourceUrl || fileName || 'texto' })
      
      if (!result.success) {
        // No borrar — el texto ya está guardado, puede reintentarse
        return NextResponse.json({ 
          ok: false, docId, chars: cleanText.length, indexed: false, chunks: 0,
          error: result.error,
          hint: 'El texto fue guardado pero el indexado falló. Verifica GEMINI_API_KEY o reintenta más tarde.'
        })
      }
      
      return NextResponse.json({ 
        ok: true, docId, chars: cleanText.length, indexed: true, 
        chunks: result.chunks, method: extractionMethod 
      })
    }

    // Texto grande: responder y el cliente dispara /api/knowledge/index
    return NextResponse.json({ 
      ok: true, docId, chars: cleanText.length, indexed: false, 
      needsIndex: true, method: extractionMethod 
    })

  } catch (e: any) {
    console.error('[ingest] Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── Extraer desde Supabase Storage ───────────────────────────────────────────
async function extractFromStorageUrl(url: string, fileName: string): Promise<{ text: string; method: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`No se pudo descargar: HTTP ${res.status}`)
  
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (ext === 'pdf' || url.includes('.pdf')) {
    const buffer = await res.arrayBuffer()
    // Intentar con Gemini Vision primero (lee imágenes + texto escaneado)
    const geminiText = await extractTextFromPdfWithGemini(buffer)
    if (geminiText.length > 200) return { text: geminiText, method: 'gemini_vision_pdf' }
    // Si Gemini falla, avisar claramente
    throw new Error('Gemini no pudo leer el PDF. Verifica que GEMINI_API_KEY esté activa con la API de Gemini 1.5.')
  }
  
  if (['txt', 'md', 'csv'].includes(ext)) {
    return { text: await res.text(), method: 'texto_plano' }
  }
  
  // HTML u otros
  const content = await res.text()
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('html')) {
    return { text: extractTextFromHtml(content), method: 'html_scraping' }
  }
  return { text: content, method: 'raw_text' }
}

// ── Extraer desde URL externa ─────────────────────────────────────────────────
async function extractFromUrl(rawUrl: string): Promise<{ text: string; method: string }> {
  const url = normalizeUrl(rawUrl)
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/pdf,text/plain,*/*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(30000),
  })
  
  if (!res.ok) throw new Error(`URL no accesible (HTTP ${res.status}). La página puede requerir login.`)
  
  const contentType = res.headers.get('content-type') || ''
  
  // PDF
  if (contentType.includes('pdf') || url.toLowerCase().includes('.pdf')) {
    const buffer = await res.arrayBuffer()
    const geminiText = await extractTextFromPdfWithGemini(buffer)
    if (geminiText.length > 200) return { text: geminiText, method: 'gemini_vision_pdf_url' }
    throw new Error('No se pudo extraer texto del PDF en esa URL')
  }
  
  // HTML: extraer texto + si el resultado es escaso usar Gemini para leer la página
  if (contentType.includes('html')) {
    const html = await res.text()
    const extracted = extractTextFromHtml(html)
    
    // Si el texto extraído es muy escaso (sitio con JS dinámico), intentar con Gemini
    if (extracted.length < 500 && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
        const r = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Extrae todo el texto útil y legible de este HTML. Solo texto, sin código:\n\n${html.slice(0, 30000)}` }]
          }]
        })
        const geminiExtracted = r.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (geminiExtracted.length > extracted.length) {
          return { text: geminiExtracted, method: 'gemini_html_extraction' }
        }
      } catch { /* usar lo que ya tenemos */ }
    }
    
    return { text: extracted, method: 'html_scraping' }
  }
  
  return { text: await res.text(), method: 'raw_url' }
}

function normalizeUrl(url: string): string {
  // Google Drive
  const gdrive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (gdrive) return `https://drive.google.com/uc?export=download&id=${gdrive[1]}`
  const gdriveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (gdriveOpen) return `https://drive.google.com/uc?export=download&id=${gdriveOpen[1]}`
  // Dropbox
  if (url.includes('dropbox.com')) return url.replace('?dl=0', '?dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com')
  // Archive.org
  if (url.includes('archive.org/details/')) {
    const id = url.split('/details/')[1]?.split('/')[0]
    if (id) return `https://archive.org/download/${id}/${id}_djvu.txt`
  }
  return url
}
