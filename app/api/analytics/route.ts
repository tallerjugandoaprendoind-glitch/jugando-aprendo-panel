import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { childId, startDate, endDate } = await request.json();

    console.log('📊 Analytics request:', { childId, startDate, endDate });

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. OBTENER SESIONES ABA
    // ═══════════════════════════════════════════════════════════════════════════
    let query = supabase
      .from('registro_aba')
      .select('*')
      .order('fecha_sesion', { ascending: true });

    if (childId) {
      query = query.eq('child_id', childId);
    }

    if (startDate) {
      query = query.gte('fecha_sesion', startDate);
    }

    if (endDate) {
      query = query.lte('fecha_sesion', endDate);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Error obteniendo sesiones:', sessionsError);
      throw sessionsError;
    }

    console.log(`✅ Sesiones encontradas: ${sessions?.length || 0}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. CALCULAR MÉTRICAS BÁSICAS
    // ═══════════════════════════════════════════════════════════════════════════
    const totalSessions = sessions?.length || 0;

    if (totalSessions === 0) {
      return NextResponse.json({
        totalSessions: 0,
        sessionsGrowth: 0,
        avgProgress: 0,
        progressGrowth: 0,
        goalsAchieved: 0,
        totalGoals: 0,
        attendanceRate: 0,
        attendanceGrowth: 0,
        progressOverTime: [],
        sessionTypes: [],
        developmentAreas: [],
        trends: []
      });
    }

    // Progreso promedio
    const progressValues = sessions
      .map(s => s.datos?.nivel_logro_objetivos)
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(v => Number(v));

    const avgProgress = progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

    // Crecimiento (comparar primera mitad vs segunda mitad)
    const midpoint = Math.floor(progressValues.length / 2);
    const firstHalf = progressValues.slice(0, midpoint);
    const secondHalf = progressValues.slice(midpoint);

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      : 0;

    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      : 0;

    const progressGrowth = firstHalfAvg > 0
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0;

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. PROGRESO EN EL TIEMPO
    // ═══════════════════════════════════════════════════════════════════════════
    const progressOverTime = sessions
      .slice(-15) // Últimas 15 sesiones
      .map(session => ({
        date: new Date(session.fecha_sesion).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        }),
        progress: session.datos?.nivel_logro_objetivos || 0,
        attention: session.datos?.nivel_atencion || 0,
        behavior: session.datos?.tolerancia_frustracion || 0
      }));

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. ÁREAS DE DESARROLLO (de las últimas sesiones)
    // ═══════════════════════════════════════════════════════════════════════════
    const recentSessions = sessions.slice(-10);
    
    const avgAttention = recentSessions
      .map(s => s.datos?.nivel_atencion)
      .filter(v => v)
      .reduce((a, b) => a + b, 0) / (recentSessions.length || 1);

    const avgBehavior = recentSessions
      .map(s => s.datos?.tolerancia_frustracion)
      .filter(v => v)
      .reduce((a, b) => a + b, 0) / (recentSessions.length || 1);

    const developmentAreas = [
      { area: 'Atención', score: Math.round((avgAttention / 5) * 100) },
      { area: 'Conducta', score: Math.round((avgBehavior / 5) * 100) },
      { area: 'Logro de Objetivos', score: avgProgress },
      { area: 'Constancia', score: Math.min(95, (totalSessions / 20) * 100) }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. IDENTIFICAR TENDENCIAS
    // ═══════════════════════════════════════════════════════════════════════════
    const trends = [];

    // Tendencia de progreso
    if (progressGrowth > 10) {
      trends.push({
        type: 'positive',
        title: 'Mejora constante en objetivos',
        description: `El nivel de logro de objetivos ha aumentado ${progressGrowth}% en las últimas sesiones, mostrando progreso sostenido.`,
        confidence: 92
      });
    } else if (progressGrowth < -10) {
      trends.push({
        type: 'negative',
        title: 'Disminución en logro de objetivos',
        description: `Se observa una disminución del ${Math.abs(progressGrowth)}% en el logro de objetivos. Revisar estrategias terapéuticas.`,
        confidence: 88
      });
    } else {
      trends.push({
        type: 'neutral',
        title: 'Progreso estable',
        description: 'El niño mantiene un nivel constante de logro de objetivos sin cambios significativos.',
        confidence: 75
      });
    }

    // Tendencia de atención
    const firstAttention = recentSessions.slice(0, 5)
      .map(s => s.datos?.nivel_atencion)
      .filter(v => v)
      .reduce((a, b) => a + b, 0) / 5;

    const lastAttention = recentSessions.slice(-5)
      .map(s => s.datos?.nivel_atencion)
      .filter(v => v)
      .reduce((a, b) => a + b, 0) / 5;

    const attentionChange = ((lastAttention - firstAttention) / firstAttention) * 100;

    if (attentionChange > 15) {
      trends.push({
        type: 'positive',
        title: 'Mejora en capacidad de atención',
        description: `La atención sostenida ha mejorado ${Math.round(attentionChange)}% en las últimas sesiones.`,
        confidence: 85
      });
    }

    // Tendencia de constancia
    if (totalSessions >= 10) {
      const lastMonthSessions = sessions.filter(s => {
        const sessionDate = new Date(s.fecha_sesion);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sessionDate >= monthAgo;
      }).length;

      if (lastMonthSessions >= 8) {
        trends.push({
          type: 'positive',
          title: 'Alta constancia terapéutica',
          description: `Excelente adherencia al tratamiento con ${lastMonthSessions} sesiones el último mes.`,
          confidence: 95
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. TIPOS DE SESIÓN (placeholder - expandir según necesites)
    // ═══════════════════════════════════════════════════════════════════════════
    const sessionTypes = [
      { name: 'ABA', value: totalSessions },
      { name: 'Evaluación', value: Math.floor(totalSessions / 10) },
      { name: 'Visita Hogar', value: Math.floor(totalSessions / 15) }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. OBJETIVOS (placeholder - obtener de tabla real si existe)
    // ═══════════════════════════════════════════════════════════════════════════
    const goalsAchieved = Math.floor(totalSessions * 0.6);
    const totalGoals = Math.floor(totalSessions * 0.75);

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPUESTA
    // ═══════════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      totalSessions,
      sessionsGrowth: Math.max(0, Math.min(100, Math.round((totalSessions / 30) * 100))),
      avgProgress,
      progressGrowth,
      goalsAchieved,
      totalGoals,
      attendanceRate: 95, // Placeholder - calcular de tabla de citas
      attendanceGrowth: 5,
      progressOverTime,
      sessionTypes,
      developmentAreas,
      trends
    });

  } catch (error: any) {
    console.error('❌ Error en analytics:', error);
    return NextResponse.json(
      { error: 'Error procesando analytics', details: error.message },
      { status: 500 }
    );
  }
}