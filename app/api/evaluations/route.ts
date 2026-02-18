// ============================================================================
// API ROUTE: EVALUATIONS - app/api/evaluations/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { 
  WISCVSchema, 
  BRIEF2Schema
} from '@/lib/validations'
import { ClinicalAlertSystem } from '@/lib/clinical-alerts'
import type { EvaluationType } from '@/types'

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

    // Solo admin puede crear evaluaciones
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear evaluaciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validación básica
    if (!body.child_id || !body.evaluation_type || !body.data) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: child_id, evaluation_type, data' },
        { status: 400 }
      )
    }

    // Validación específica por tipo de evaluación
    let validationResult
    switch (body.evaluation_type) {
      case 'wiscv':
        validationResult = WISCVSchema.safeParse(body.data)
        break
      case 'brief2':
        validationResult = BRIEF2Schema.safeParse(body.data)
        break
      // Agregar otros esquemas según necesidad
      default:
        validationResult = { success: true, data: body.data, error: undefined }
    }

    if (validationResult && !validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de evaluación inválidos',
          // CORRECCIÓN AQUÍ: Agregado el ?.
          details: validationResult.error?.flatten() 
        },
        { status: 400 }
      )
    }

    // Generar alertas clínicas automáticas
    const alerts = ClinicalAlertSystem.generateAlerts(
      body.evaluation_type,
      body.data
    )

    const prioritizedAlerts = ClinicalAlertSystem.prioritizeAlerts(alerts)
    const executiveSummary = ClinicalAlertSystem.generateExecutiveSummary(prioritizedAlerts)

    // Insertar evaluación en la tabla correspondiente
    const tableName = `evaluacion_${body.evaluation_type}`
    
    const { data: newEvaluation, error: insertError } = await supabase
      .from(tableName)
      .insert([{
        child_id: body.child_id,
        ...body.data,
        alerts: prioritizedAlerts,
        executive_summary: executiveSummary,
        created_by: session.user.id,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting evaluation:', insertError)
      return NextResponse.json(
        { error: 'Error al guardar evaluación' },
        { status: 500 }
      )
    }

    // Si hay alertas críticas, crear notificación automática
    const criticalAlerts = prioritizedAlerts.filter(a => a.level === 'critical')
    if (criticalAlerts.length > 0) {
      // Obtener parent_id del niño
      const { data: child } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', body.child_id)
        .single()

      if (child?.parent_id) {
        await supabase.from('notifications').insert({
          user_id: child.parent_id,
          title: '⚠️ Alerta Clínica Importante',
          message: `Se detectaron ${criticalAlerts.length} alertas críticas en la evaluación reciente. Por favor, consulte con su terapeuta.`,
          type: 'warning',
          is_read: false
        })
      }
    }

    // Log de auditoría
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'CREATE_EVALUATION',
      resource_id: newEvaluation.id,
      details: {
        child_id: body.child_id,
        evaluation_type: body.evaluation_type,
        alerts_count: prioritizedAlerts.length
      }
    })

    return NextResponse.json({
      data: newEvaluation,
      alerts: prioritizedAlerts,
      executive_summary: executiveSummary,
      message: 'Evaluación creada exitosamente con análisis de alertas'
    }, { status: 201 })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const childId = searchParams.get('child_id')
    const evaluationType = searchParams.get('evaluation_type') as EvaluationType | null

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

    // Verificar permisos
    if (profile?.role === 'padre' && child.parent_id !== profile.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Si se especifica tipo, obtener de esa tabla
    if (evaluationType) {
      const tableName = `evaluacion_${evaluationType}`
      const { data: evaluations, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('child_id', childId)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching evaluations:', error)
        return NextResponse.json(
          { error: 'Error al obtener evaluaciones' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data: evaluations })
    }

    // Si no, obtener resumen de todas las evaluaciones
    const evaluationTypes: EvaluationType[] = ['brief2', 'ados2', 'vineland3', 'wiscv', 'basc3']
    const allEvaluations: any[] = []

    for (const type of evaluationTypes) {
      const tableName = `evaluacion_${type}`
      const { data } = await supabase
        .from(tableName)
        .select('id, completed_at, alerts')
        .eq('child_id', childId)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        allEvaluations.push({
          evaluation_type: type,
          ...data[0]
        })
      }
    }

    return NextResponse.json({ data: allEvaluations })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
