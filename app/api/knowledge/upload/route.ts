// app/api/knowledge/upload/route.ts
// Sube archivos al Storage usando service role key (bypassa RLS del bucket)
// El frontend manda el archivo como FormData — este endpoint devuelve la signed URL

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = process.env.KNOWLEDGE_BUCKET_NAME || 'knowledge-base'
const MAX_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: `Archivo demasiado grande (${Math.round(file.size / 1024 / 1024)}MB). Máximo: 500MB.`
      }, { status: 413 })
    }

    const safeName = `knowledge/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload con service role key — bypassa RLS completamente
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Error al subir: ${uploadError.message}` }, { status: 500 })
    }

    // Generar signed URL válida por 2 horas
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(safeName, 7200)

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'No se pudo generar la URL del archivo' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      storageUrl: signedData.signedUrl,
      fileName: file.name,
      path: safeName,
    })
  } catch (e: any) {
    console.error('Error en upload:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Aumentar límite del body para archivos grandes
export const config = {
  api: { bodyParser: false },
}
