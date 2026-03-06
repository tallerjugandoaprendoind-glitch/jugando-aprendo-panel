// app/api/knowledge/ingest/route.ts
// ARQUITECTURA: El frontend sube el PDF directo a Supabase Storage
// Este endpoint recibe solo la URL (no el archivo) y extrae el texto con Gemini
// Esto evita el límite de 4.5MB de Vercel para request bodies

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument } from '@/lib/knowledge-base'
import { GoogleGenAI } from '@google/genai'

// Aumentado a 500MB — el archivo llega desde Supabase Storage (no desde Vercel body)
const MAX_CHUNK_B64 = 4_000_000 // ~3MB binario por segmento (Gemini admite hasta ~20MB por llamada)
const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500MB

// FIX: nombre correcto del bucket — ajusta si tu bucket tiene otro nombre
const STORAGE_BUCKET = process.env.KNOWLEDGE_BUCKET_NAME || 'knowledge-base'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, tipo = 'libro', descripcion = '', texto, storageUrl, fileName } = body

    if (!titulo) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    let textoParaIndexar = ''

    if (texto) {
      textoParaIndexar = texto

    } else if (storageUrl) {
      try {
        // FIX: pasar el Authorization header si la URL es privada de Supabase
        const fileRes = await fetch(storageUrl, {
          headers: {
            // Si la URL es un signed URL ya lleva el token; si es pública no necesita auth
            // Para URLs privadas sin firma, usar el service role key
            ...(storageUrl.includes('/storage/v1/object/') && !storageUrl.includes('token=')
              ? { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
              : {})
          }
        })

        if (!fileRes.ok) {
          const errText = await fileRes.text().catch(() => fileRes.statusText)
          console.error('Error descargando archivo:', fileRes.status, errText)

          // FIX: mensaje de error más descriptivo para "Bucket not found"
          if (fileRes.status === 400 || errText.includes('Bucket not found') || errText.includes('bucket')) {
            return NextResponse.json({
              error: `Bucket de almacenamiento no encontrado. Verifica que el bucket "${STORAGE_BUCKET}" existe en Supabase Storage y que la variable KNOWLEDGE_BUCKET_NAME está configurada correctamente.`,
            }, { status: 422 })
          }

          throw new Error(`No se pudo descargar el archivo: ${fileRes.status} - ${errText}`)
        }

        // FIX: verificar tamaño antes de procesar
        const contentLength = fileRes.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > MAX_FILE_BYTES) {
          return NextResponse.json({
            error: `El archivo es demasiado grande (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). El máximo permitido es 500MB.`,
          }, { status: 413 })
        }

        const arrayBuffer = await fileRes.arrayBuffer()

        // FIX: verificar tamaño real del buffer
        if (arrayBuffer.byteLength > MAX_FILE_BYTES) {
          return NextResponse.json({
            error: `El archivo excede el límite de 500MB (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB).`,
          }, { status: 413 })
        }

        const fullBase64 = Buffer.from(arrayBuffer).toString('base64')

        const apiKey = process.env.GEMINI_API_KEY!
        const ai = new GoogleGenAI({ apiKey })
        const partes: string[] = []

        if (fullBase64.length <= MAX_CHUNK_B64) {
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'application/pdf', data: fullBase64 } },
                { text: 'Extrae TODO el texto de este documento manteniendo la estructura. No resumas, transcribe el contenido completo incluyendo títulos, párrafos y listas.' }
              ]
            }],
            config: { temperature: 0, maxOutputTokens: 8192 },
          })
          partes.push(response.text || '')

        } else {
          const totalPartes = Math.ceil(fullBase64.length / MAX_CHUNK_B64)
          console.log(`PDF grande: ${totalPartes} segmentos (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB)`)

          for (let p = 0; p < totalPartes; p++) {
            const segmento = fullBase64.slice(p * MAX_CHUNK_B64, (p + 1) * MAX_CHUNK_B64)
            try {
              const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: 'application/pdf', data: segmento } },
                    { text: `Extrae TODO el texto de esta sección (parte ${p + 1} de ${totalPartes}). No resumas, transcribe el contenido completo.` }
                  ]
                }],
                config: { temperature: 0, maxOutputTokens: 8192 },
              })
              partes.push(response.text || '')
              console.log(`Segmento ${p + 1}/${totalPartes} extraído`)
            } catch (partErr: any) {
              console.warn(`Segmento ${p + 1} falló:`, partErr.message)
            }
            // FIX: delay reducido a 500ms para indexar más rápido
            if (p < totalPartes - 1) await new Promise(r => setTimeout(r, 500))
          }
        }

        textoParaIndexar = partes.filter(Boolean).join('\n\n')
        console.log(`Texto extraído: ${textoParaIndexar.length} caracteres`)

      } catch (pdfError: any) {
        console.error('Error extrayendo PDF:', pdfError.message)
        return NextResponse.json({
          error: `No se pudo extraer el texto del PDF: ${pdfError.message}. Intenta pegar el texto directamente.`,
        }, { status: 422 })
      }
    } else {
      return NextResponse.json({ error: 'Se requiere texto o archivo PDF' }, { status: 400 })
    }

    if (!textoParaIndexar || textoParaIndexar.length < 50) {
      return NextResponse.json({
        error: 'No se pudo extraer suficiente texto del documento',
      }, { status: 422 })
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({ titulo, tipo, descripcion, procesado: false })
      .select()
      .single()

    if (docError) throw docError

    // FIX: indexar en background sin encadenar .catch sobre PromiseLike<void>
    const docId = (doc as any).id
    ;(async () => {
      try {
        const result = await indexDocument(docId, textoParaIndexar, { titulo, tipo })
        console.log(`Indexado "${titulo}": ${result.chunks} chunks`)
        try {
          await supabaseAdmin
            .from('knowledge_documents')
            .update({ procesado: true, total_chunks: result.chunks })
            .eq('id', docId)
        } catch (updateErr) {
          console.error('Error actualizando estado:', updateErr)
        }
      } catch (err) {
        console.error(`Error indexando "${titulo}":`, err)
      }
    })()

    return NextResponse.json({
      success: true,
      document_id: (doc as any).id,
      titulo,
      texto_chars: textoParaIndexar.length,
      mensaje: `Documento recibido (${Math.round(textoParaIndexar.length / 1000)}K chars). El indexado comenzó en background.`,
    })
  } catch (e: any) {
    console.error('Error en ingest:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, titulo, tipo, descripcion, procesado, total_chunks, created_at')
      .order('created_at', { ascending: false })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await supabaseAdmin.from('knowledge_chunks').delete().eq('document_id', id)
    await supabaseAdmin.from('knowledge_documents').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
