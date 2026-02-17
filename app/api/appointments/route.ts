// ============================================================================
// API ROUTE: APPOINTMENTS - app/api/appointments/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { AppointmentSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const childId = searchParams.get('child_id')
    const date = searchParams.get('date')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', session.user.id)
      .single()

    // Query base con join a children para obtener el nombre
    let query = supabase
      .from('appointments')
      .select(`
        *,
        children:child_id (
          id,
          name,
          birth_date
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    // Si es padre, solo ver citas de sus hijos
    if (profile?.role === 'padre') {
      const { data: myChildren } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', profile.id)

      if (myChildren && myChildren.length > 0) {
        const childIds = myChildren.map(c => c.id)
        query = query.in('child_id', childIds)
      } else {
        // Si no tiene hijos, devolver array vacío
        return NextResponse.json({ data: [] })
      }
    }

    // Filtros opcionales
    if (childId) {
      query = query.eq('child_id', childId)
    }

    if (date) {
      query = query.eq('appointment_date', date)
    }

    if (startDate) {
      query = query.gte('appointment_date', startDate)
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Error al obtener citas' },
        { status: 500 }
      )
    }

    console.log(`✅ Citas cargadas: ${appointments?.length || 0}`) // Debug

    return NextResponse.json({
      data: appointments || []
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
      .select('role, tokens')
      .eq('id', session.user.id)
      .single()

    // Solo admin y padres pueden crear citas
    if (profile?.role !== 'admin' && profile?.role !== 'padre') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear citas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📥 Datos recibidos:', body) // Debug

    // Si es padre, verificar tokens
    if (profile.role === 'padre') {
      if ((profile.tokens || 0) <= 0) {
        return NextResponse.json(
          { error: 'No tienes tokens suficientes para agendar' },
          { status: 400 }
        )
      }
    }

    // Validar datos básicos
    const validation = AppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Si es sesión individual
    if (!body.is_group) {
      // Verificar que el niño exista y pertenezca al usuario (si es padre)
      const { data: child } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', body.child_id)
        .single()

      if (!child) {
        return NextResponse.json(
          { error: 'Niño no encontrado' },
          { status: 404 }
        )
      }

      if (profile.role === 'padre' && child.parent_id !== profile.id) {
        return NextResponse.json(
          { error: 'No puedes agendar citas para este niño' },
          { status: 403 }
        )
      }

      // Crear cita individual
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([{
          child_id: body.child_id,
          appointment_date: body.appointment_date,
          appointment_time: body.appointment_time,
          service_type: body.service_type,
          status: body.status || 'confirmed',
          notes: body.notes,
          is_group: false
        }])
        .select(`
          *,
          children:child_id (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error('Error creating appointment:', error)
        return NextResponse.json(
          { error: 'Error al crear cita' },
          { status: 500 }
        )
      }

      // Si es padre, descontar token
      if (profile.role === 'padre') {
        const newTokens = (profile.tokens || 0) - 1
        await supabase
          .from('profiles')
          .update({ tokens: newTokens })
          .eq('id', profile.id)
      }

      // Log de auditoría
      await supabase.from('audit_log').insert({
        user_id: session.user.id,
        action: 'CREATE_APPOINTMENT',
        resource_id: newAppointment.id,
        details: {
          child_id: body.child_id,
          appointment_date: body.appointment_date,
          appointment_time: body.appointment_time
        }
      })

      console.log('✅ Cita individual creada:', newAppointment.id) // Debug

      return NextResponse.json(
        { data: newAppointment, message: 'Cita creada exitosamente' },
        { status: 201 }
      )
    }

    // Si es sesión grupal
    if (body.is_group && body.participants && body.participants.length > 0) {
      // Crear citas para cada participante
      const appointmentsToInsert = body.participants.map((childId: string) => ({
        child_id: childId,
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time,
        service_type: body.service_type,
        status: 'confirmed',
        notes: body.notes,
        is_group: true,
        group_name: body.group_name
      }))

      const { data: groupAppointments, error } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert)
        .select()

      if (error) {
        console.error('Error creating group appointments:', error)
        return NextResponse.json(
          { error: 'Error al crear sesión grupal' },
          { status: 500 }
        )
      }

      // Log de auditoría
      await supabase.from('audit_log').insert({
        user_id: session.user.id,
        action: 'CREATE_GROUP_APPOINTMENT',
        resource_id: groupAppointments[0]?.id,
        details: {
          group_name: body.group_name,
          participants: body.participants.length,
          appointment_date: body.appointment_date,
          appointment_time: body.appointment_time
        }
      })

      console.log('✅ Sesión grupal creada:', groupAppointments.length, 'participantes') // Debug

      return NextResponse.json(
        { 
          data: groupAppointments, 
          message: `Sesión grupal creada con ${groupAppointments.length} participantes` 
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { error: 'Datos incompletos' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
