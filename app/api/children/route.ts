// ============================================================================
// API ROUTE: CHILDREN - app/api/children/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ChildSchema } from '@/lib/validations'
import { z } from 'zod'

// GET - Obtener lista de niños
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Parsear query params para paginación
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''

    // Calcular rango
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Query según rol
    let query = supabase
      .from('children')
      .select('*', { count: 'exact' })

    // Si es padre, solo ver sus hijos
    if (profile.role === 'padre') {
      query = query.eq('parent_id', profile.id)
    }

    // Aplicar búsqueda si existe
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: children, error, count } = await query

    if (error) {
      console.error('Error fetching children:', error)
      return NextResponse.json(
        { error: 'Error al obtener niños' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: children,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo niño
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    // Solo padres y admins pueden crear niños
    if (profile.role !== 'padre' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear niños' },
        { status: 403 }
      )
    }

    // Parsear y validar datos
    const body = await request.json()
    const validation = ChildSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validation.error.flatten()
        },
        { status: 400 }
      )
    }

    // Determinar parent_id
    let parentId = profile.id
    if (profile.role === 'admin' && body.parent_id) {
      parentId = body.parent_id
    }

    // Crear niño
    const { data: newChild, error } = await supabase
      .from('children')
      .insert([{
        ...validation.data,
        parent_id: parentId,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating child:', error)
      return NextResponse.json(
        { error: 'Error al crear niño' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'CREATE_CHILD',
      resource_id: newChild.id,
      details: { child_name: newChild.name }
    })

    return NextResponse.json(
      { data: newChild, message: 'Niño creado exitosamente' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
