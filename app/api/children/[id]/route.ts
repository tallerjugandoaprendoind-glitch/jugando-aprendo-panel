// ============================================================================
// API ROUTE: CHILD BY ID - app/api/children/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { ChildSchema } from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Obtener un niño específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    // Query para obtener el niño
    let query = supabase
      .from('children')
      .select('*')
      .eq('id', params.id)

    // Si es padre, verificar que sea su hijo
    if (profile?.role === 'padre') {
      query = query.eq('parent_id', profile.id)
    }

    const { data: child, error } = await query.single()

    if (error || !child) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: child })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un niño
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    // Verificar permisos
    const { data: existingChild } = await supabase
      .from('children')
      .select('parent_id')
      .eq('id', params.id)
      .single()

    if (!existingChild) {
      return NextResponse.json(
        { error: 'Niño no encontrado' },
        { status: 404 }
      )
    }

    // Solo el padre dueño o admin pueden actualizar
    if (profile?.role === 'padre' && existingChild.parent_id !== profile.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este niño' },
        { status: 403 }
      )
    }

    // Validar datos
    const body = await request.json()
    const validation = ChildSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Actualizar
    const { data: updatedChild, error } = await supabase
      .from('children')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Error al actualizar niño' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'UPDATE_CHILD',
      resource_id: params.id,
      details: validation.data
    })

    return NextResponse.json({
      data: updatedChild,
      message: 'Niño actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar (desactivar) un niño
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    // Solo admin puede eliminar
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar niños' },
        { status: 403 }
      )
    }

    // Soft delete (desactivar)
    const { error } = await supabase
      .from('children')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: 'Error al eliminar niño' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'DELETE_CHILD',
      resource_id: params.id
    })

    return NextResponse.json({
      message: 'Niño eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
