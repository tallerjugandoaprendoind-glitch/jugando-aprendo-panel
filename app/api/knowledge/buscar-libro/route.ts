// app/api/knowledge/buscar-libro/route.ts
// Busca libros en Archive.org y Open Library por título
// Devuelve resultados con URL de descarga directa lista para indexar

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  if (!query) return NextResponse.json({ error: 'query requerido' }, { status: 400 })

  try {
    const resultados = await Promise.allSettled([
      buscarArchiveOrg(query),
      buscarOpenLibrary(query),
    ])

    const libros: any[] = []

    for (const r of resultados) {
      if (r.status === 'fulfilled') libros.push(...r.value)
    }

    // Deduplicar por título similar y ordenar por relevancia
    const unicos = libros
      .filter((v, i, a) => a.findIndex(x => x.titulo.toLowerCase().slice(0, 30) === v.titulo.toLowerCase().slice(0, 30)) === i)
      .slice(0, 8)

    return NextResponse.json({ resultados: unicos })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ── Archive.org ───────────────────────────────────────────────────────────────
async function buscarArchiveOrg(query: string): Promise<any[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,format,downloads,language&rows=6&output=json&mediatype=texts`

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []

  const data = await res.json()
  const docs = data?.response?.docs || []

  const libros = await Promise.all(
    docs.map(async (doc: any) => {
      // Obtener formatos disponibles para este item
      const downloadUrl = await getArchiveDownloadUrl(doc.identifier)
      if (!downloadUrl) return null

      return {
        id: `archive_${doc.identifier}`,
        titulo: doc.title || doc.identifier,
        autor: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Desconocido'),
        fuente: 'Archive.org',
        descargas: doc.downloads || 0,
        url: downloadUrl,
        urlVista: `https://archive.org/details/${doc.identifier}`,
        idioma: doc.language || 'en',
        formato: 'PDF',
      }
    })
  )

  return libros.filter(Boolean)
}

async function getArchiveDownloadUrl(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://archive.org/metadata/${identifier}/files`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const files: any[] = data?.result || []

    // Prioridad: PDF > TXT
    const pdf = files.find(f => f.name?.toLowerCase().endsWith('.pdf') && !f.name?.includes('_text'))
    const txt = files.find(f => f.name?.toLowerCase().endsWith('_djvu.txt') || f.name?.toLowerCase().endsWith('.txt'))

    const file = pdf || txt
    if (!file) return null

    return `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`
  } catch {
    return null
  }
}

// ── Open Library ──────────────────────────────────────────────────────────────
async function buscarOpenLibrary(query: string): Promise<any[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,ia,language,edition_count`

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []

  const data = await res.json()
  const docs = data?.docs || []

  return docs
    .filter((doc: any) => doc.ia && doc.ia.length > 0) // solo los que tienen en Archive.org
    .map((doc: any) => ({
      id: `ol_${doc.key}`,
      titulo: doc.title,
      autor: doc.author_name?.[0] || 'Desconocido',
      fuente: 'Open Library',
      descargas: doc.edition_count || 0,
      url: `https://archive.org/download/${doc.ia[0]}/${doc.ia[0]}.pdf`,
      urlVista: `https://openlibrary.org${doc.key}`,
      idioma: doc.language?.[0] || 'en',
      formato: 'PDF',
    }))
}
