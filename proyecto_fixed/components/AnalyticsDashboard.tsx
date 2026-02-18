'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, Activity, Users, Calendar, Target, 
  Award, BarChart3, Brain, Heart, Zap, Clock, CheckCircle2,
  AlertCircle, X, RefreshCw, Download
} from 'lucide-react'

// ==============================================================================
// INTERFACES
// ==============================================================================
interface AnalyticsDashboardProps {
  childId?: string;
  childName?: string;
  onClose?: () => void;
}

interface KPIData {
  totalSessions: number;
  sessionsGrowth: number;
  avgProgress: number;
  progressGrowth: number;
  goalsAchieved: number;
  totalGoals: number;
  attendanceRate: number;
  attendanceGrowth: number;
}

interface ChartDataPoint {
  date: string;
  progress: number;
  attention?: number;
  behavior?: number;
}

interface Trend {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  confidence: number;
}

// ==============================================================================
// COMPONENTE PRINCIPAL
// ==============================================================================
export default function AnalyticsDashboard({ childId, childName, onClose }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [developmentAreas, setDevelopmentAreas] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [childId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId })
      });

      if (!response.ok) throw new Error('Error cargando analytics');

      const data = await response.json();
      
      setKpiData({
        totalSessions: data.totalSessions || 0,
        sessionsGrowth: data.sessionsGrowth || 0,
        avgProgress: data.avgProgress || 0,
        progressGrowth: data.progressGrowth || 0,
        goalsAchieved: data.goalsAchieved || 0,
        totalGoals: data.totalGoals || 0,
        attendanceRate: data.attendanceRate || 0,
        attendanceGrowth: data.attendanceGrowth || 0
      });

      setChartData(data.progressOverTime || []);
      setTrends(data.trends || []);
      setDevelopmentAreas(data.developmentAreas || []);

    } catch (error) {
      console.error('Error cargando analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-lg font-bold text-gray-800">Analizando datos...</p>
            <p className="text-sm text-gray-500">Generando insights con IA</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full my-8">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-3xl p-8 text-white relative">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Dashboard de Analytics</h2>
                {childName && (
                  <p className="text-blue-100 text-lg font-medium mt-1">{childName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="opacity-90">
                Último análisis: {new Date().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="p-8 space-y-6">
            
            {/* KPIs */}
            {kpiData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Sesiones Totales"
                  value={kpiData.totalSessions}
                  change={kpiData.sessionsGrowth}
                  icon={<Calendar className="w-6 h-6" />}
                  color="blue"
                />
                <KPICard
                  title="Progreso Promedio"
                  value={`${kpiData.avgProgress}%`}
                  change={kpiData.progressGrowth}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="green"
                />
                <KPICard
                  title="Objetivos Logrados"
                  value={`${kpiData.goalsAchieved}/${kpiData.totalGoals}`}
                  change={20}
                  icon={<Target className="w-6 h-6" />}
                  color="purple"
                />
                <KPICard
                  title="Asistencia"
                  value={`${kpiData.attendanceRate}%`}
                  change={kpiData.attendanceGrowth}
                  icon={<CheckCircle2 className="w-6 h-6" />}
                  color="yellow"
                />
              </div>
            )}

            {/* GRÁFICO DE PROGRESO */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-800">Evolución del Progreso</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity className="w-4 h-4" />
                    <span>Últimas {chartData.length} sesiones</span>
                  </div>
                </div>
                
                <SimpleLineChart data={chartData} />
              </div>
            )}

            {/* ÁREAS DE DESARROLLO */}
            {developmentAreas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
                <h3 className="text-xl font-black text-gray-800 mb-6">Áreas de Desarrollo</h3>
                
                <div className="space-y-4">
                  {developmentAreas.map((area, idx) => (
                    <DevelopmentAreaBar
                      key={idx}
                      area={area.area}
                      score={area.score}
                      maxScore={100}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TENDENCIAS IDENTIFICADAS */}
            {trends.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-black text-gray-800">Insights con IA</h3>
                </div>

                <div className="space-y-3">
                  {trends.map((trend, idx) => (
                    <TrendCard key={idx} trend={trend} />
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={loadAnalytics}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Actualizar
              </button>
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// COMPONENTES AUXILIARES
// ==============================================================================

// KPI CARD
function KPICard({ title, value, change, icon, color }: any) {
  const isPositive = change >= 0;
  
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className={`
          flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full
          ${isPositive ? 'bg-white/20' : 'bg-black/20'}
        `}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-sm opacity-90 font-medium mb-1">{title}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

// GRÁFICO DE LÍNEA SIMPLE (CSS puro)
function SimpleLineChart({ data }: { data: ChartDataPoint[] }) {
  const maxValue = Math.max(...data.map(d => d.progress));
  const minValue = Math.min(...data.map(d => d.progress));
  const range = maxValue - minValue || 1;

  return (
    <div className="space-y-4">
      <div className="relative h-64 bg-gradient-to-b from-blue-50 to-white rounded-xl p-4 border-2 border-blue-100">
        {/* Grid horizontal */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[100, 75, 50, 25, 0].map(val => (
            <div key={val} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium w-8">{val}%</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Línea de progreso */}
        <svg className="absolute inset-0 w-full h-full" style={{ padding: '16px' }}>
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.progress - minValue) / range) * 100;
              return `${x}%,${y}%`;
            }).join(' ')}
          />
          
          {/* Puntos */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.progress - minValue) / range) * 100;
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all cursor-pointer"
              />
            );
          })}
        </svg>
      </div>

      {/* Etiquetas de fechas */}
      <div className="flex justify-between px-4">
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
            return (
              <span key={i} className="text-xs text-gray-500 font-medium">
                {d.date}
              </span>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// BARRA DE ÁREA DE DESARROLLO
function DevelopmentAreaBar({ area, score, maxScore }: any) {
  const percentage = (score / maxScore) * 100;
  
  const getColor = (pct: number) => {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    if (pct >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700">{area}</span>
        <span className="text-sm font-black text-gray-900">{score}/{maxScore}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(percentage)} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// TARJETA DE TENDENCIA
function TrendCard({ trend }: { trend: Trend }) {
  const iconMap = {
    positive: { Icon: TrendingUp, bg: 'bg-green-100', text: 'text-green-600' },
    negative: { Icon: TrendingDown, bg: 'bg-red-100', text: 'text-red-600' },
    neutral: { Icon: Activity, bg: 'bg-gray-100', text: 'text-gray-600' }
  };

  const { Icon, bg, text } = iconMap[trend.type];

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all">
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 mb-1">{trend.title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{trend.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">Confianza</p>
          <p className="text-lg font-black text-gray-900">{trend.confidence}%</p>
        </div>
      </div>
    </div>
  );
}