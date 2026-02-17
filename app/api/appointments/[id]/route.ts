// ============================================================================
// API ROUTE: APPOINTMENT BY ID - app/api/appointments/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface RouteParams {
  params: {
    id: string
  }
}

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
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    // Obtener la cita
    const { data: appointment } = await supabase
      .from('appointments')
      .select('child_id, children!inner(parent_id)')
      .eq('id', params.id)
      .single()

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    // @ts-ignore
    const parentId = appointment.children?.parent_id

    if (profile?.role === 'padre' && parentId !== profile.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar esta cita' },
        { status: 403 }
      )
    }

    // Eliminar cita
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting appointment:', error)
      return NextResponse.json(
        { error: 'Error al eliminar cita' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'DELETE_APPOINTMENT',
      resource_id: params.id
    })

    return NextResponse.json({
      message: 'Cita eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()

    // Actualizar cita
    const { data: updatedAppointment, error } = await supabase
      .from('appointments')
      .update({
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time,
        service_type: body.service_type,
        status: body.status,
        notes: body.notes
      })
      .eq('id', params.id)
      .select(`
        *,
        children:child_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json(
        { error: 'Error al actualizar cita' },
        { status: 500 }
      )
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'UPDATE_APPOINTMENT',
      resource_id: params.id,
      details: body
    })

    return NextResponse.json({
      data: updatedAppointment,
      message: 'Cita actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
