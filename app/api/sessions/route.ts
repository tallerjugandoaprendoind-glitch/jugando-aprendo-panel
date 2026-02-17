// ============================================================================
// API ROUTE: SESSIONS - app/api/sessions/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { SessionRecordSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const childId = searchParams.get('child_id')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!childId) {
      return NextResponse.json(
        { error: 'child_id es requerido' },
        { status: 400 }
      )
    }

    // Verificar permisos sobre el niño
    const { data: child } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', childId)
      .single()

    if (!child) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    // Verificar que el padre solo vea sesiones de sus hijos
    if (profile?.role === 'padre' && child.parent_id !== profile.id) {
      return NextResponse.json(
        { error: 'No autorizado para ver estas sesiones' },
        { status: 403 }
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('registro_aba')
      .select('*', { count: 'exact' })
      .eq('child_id', childId)

    // Filtros de fecha
    if (startDate) {
      query = query.gte('fecha_sesion', startDate)
    }
    if (endDate) {
      query = query.lte('fecha_sesion', endDate)
    }

    query = query
      .order('fecha_sesion', { ascending: false })
      .range(from, to)

    const { data: sessions, error, count } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Error al obtener sesiones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: sessions,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Solo admin puede crear sesiones
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden registrar sesiones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = SessionRecordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { data: newSession, error } = await supabase
      .from('registro_aba')
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json(
        { error: 'Error al crear sesión' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'CREATE_SESSION',
      resource_id: newSession.id,
      details: { child_id: validation.data.child_id }
    })

    return NextResponse.json(
      { data: newSession, message: 'Sesión registrada exitosamente' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
