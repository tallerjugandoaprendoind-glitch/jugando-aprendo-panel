// ============================================================================
// TYPES GLOBALES - types/index.ts
// ============================================================================

export type UserRole = 'admin' | 'padre'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  tokens: number
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Child {
  id: string
  parent_id: string
  name: string
  birth_date: string
  diagnosis?: string
  photo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  child_id: string
  appointment_date: string
  appointment_time: string
  service_type: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_at: string
}

export interface SessionRecord {
  id: string
  child_id: string
  fecha_sesion: string
  datos: {
    conducta?: string
    abc_analysis?: string
    barriers?: string
    red_flags?: string
    activity?: string
    home_task?: string
    observations?: string
  }
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export interface Anamnesis {
  id: string
  child_id: string
  data: Record<string, any>
  completed_at?: string
  created_at: string
  updated_at: string
}

export type EvaluationType = 'brief2' | 'ados2' | 'vineland3' | 'wiscv' | 'basc3'

export interface Evaluation {
  id: string
  child_id: string
  evaluation_type: EvaluationType
  data: Record<string, any>
  interpreted_report?: string
  alerts?: ClinicalAlert[]
  completed_at?: string
  created_at: string
}

export interface ClinicalAlert {
  level: 'low' | 'medium' | 'high' | 'critical'
  area: string
  message: string
  recommendation: string
  triggered_at: string
}

export interface BehaviorGoal {
  id: string
  child_id: string
  goal_description: string
  target_value: number
  current_value: number
  status: 'in_progress' | 'achieved' | 'paused'
  start_date: string
  target_date: string
  updated_at: string
}

export interface TokenTransaction {
  id: string
  child_id: string
  amount: number
  transaction_type: 'earned' | 'spent'
  reason: string
  created_at: string
}

export interface Reinforcer {
  id: string
  name: string
  description: string
  cost: number
  image_url?: string
  category: 'activity' | 'food' | 'toy' | 'privilege'
  is_active: boolean
}

export interface VideoModel {
  id: string
  title: string
  description: string
  skill_category: string
  video_url: string
  thumbnail_url?: string
  steps: string[]
  target_age_min: number
  target_age_max: number
  created_at: string
}

// Validación WISC-V
export interface WISCVScores {
  comprensionVerbal: number // 45-155
  visualEspacial: number // 45-155
  razonamientoFluido: number // 45-155
  memoriaOperacion: number // 45-155
  velocidadProcesamiento: number // 45-155
  ciTotal: number // 40-160
}

export const WISCV_RANGES = {
  indices: { min: 45, max: 155 },
  ciTotal: { min: 40, max: 160 }
}

// Tipos para el formulario de anamnesis
export interface AnamnesisSection {
  title: string
  questions: AnamnesisQuestion[]
}

export interface AnamnesisQuestion {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'number'
  placeholder?: string
  options?: string[]
  required?: boolean
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Form State Types
export interface FormState {
  isSubmitting: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}
