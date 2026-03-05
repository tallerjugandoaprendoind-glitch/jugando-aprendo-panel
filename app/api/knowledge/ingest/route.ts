// app/api/knowledge/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { indexDocument } from '@/lib/knowledge-base'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const titulo = formData.get('titulo') as string
    const tipo = formData.get('tipo') as string || 'libro'
    const descripcion = formData.get('descripcion') as string || ''
    const textoDirecto = formData.get('texto') as string | null

    if (!titulo) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    let textoParaIndexar = ''

    if (textoDirecto) {
      textoParaIndexar = textoDirecto
    } else if (file) {
      // Subir archivo a Supabase Storage
      const fileBuffer = await file.arrayBuffer()
      const fileName = `knowledge/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documentos')
        .upload(fileName, fileBuffer, { contentType: file.type })

      if (uploadError) {
        console.warn('Storage upload failed, using Gemini direct:', uploadError.message)
      }

      // Extraer texto con Gemini (si es PDF)
      if (file.type === 'application/pdf') {
        try {
          const apiKey = process.env.GEMINI_API_KEY!
          const ai = new GoogleGenAI({ apiKey })
          const base64 = Buffer.from(fileBuffer).toString('base64')

          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64.slice(0, 4000000), // máx 4MB base64
                  }
                },
                {
                  text: 'Extrae TODO el texto de este documento manteniendo la estructura. No resumas, transcribe el contenido completo incluyendo títulos, párrafos y listas.'
                }
              ]
            }],
            config: { temperature: 0, maxOutputTokens: 8000 },
          })

          textoParaIndexar = response.text || ''
        } catch (pdfError: any) {
          console.error('Error extrayendo PDF:', pdfError.message)
          return NextResponse.json({
            error: 'No se pudo extraer el texto del PDF. Intenta con un archivo más pequeño o pega el texto directamente.',
          }, { status: 422 })
        }
      } else {
        // Texto plano o markdown
        textoParaIndexar = new TextDecoder().decode(fileBuffer)
      }
    }

    if (!textoParaIndexar || textoParaIndexar.length < 100) {
      return NextResponse.json({
        error: 'No se pudo extraer suficiente texto del documento (mínimo 100 caracteres)',
      }, { status: 422 })
    }

    // Crear registro del documento
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({ titulo, tipo, descripcion, procesado: false })
      .select()
      .single()

    if (docError) throw docError

    // Indexar en background (no bloquear la respuesta)
    indexDocument((doc as any).id, textoParaIndexar, { titulo, tipo })
      .then(result => {
        console.log(`✅ Indexado "${titulo}": ${result.chunks} chunks`)
      })
      .catch(err => {
        console.error(`❌ Error indexando "${titulo}":`, err)
      })

    return NextResponse.json({
      success: true,
      document_id: (doc as any).id,
      titulo,
      texto_chars: textoParaIndexar.length,
      mensaje: 'Documento recibido. El indexado comenzó en background (~2-5 minutos para libros largos).',
    })
  } catch (e: any) {
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
    // Eliminar chunks primero (cascade)
    await supabaseAdmin.from('knowledge_chunks').delete().eq('document_id', id)
    await supabaseAdmin.from('knowledge_documents').delete().eq('id', id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
