-- ============================================================
-- SQL PARA EJECUTAR EN SUPABASE - JUGANDO APRENDO
-- Crea las tablas necesarias para el sistema de aprobación
-- ============================================================

-- 1. TABLA: parent_message_approvals
-- Almacena mensajes generados por IA en espera de aprobación del admin
CREATE TABLE IF NOT EXISTS public.parent_message_approvals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id      UUID REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source        TEXT NOT NULL, -- 'parent_form' | 'neuroforma' | 'evaluacion' | 'session_report' | 'entorno_hogar'
  source_title  TEXT,          -- nombre del formulario/reporte
  ai_message    TEXT NOT NULL, -- mensaje original generado por IA
  edited_message TEXT,         -- mensaje editado por admin (inicia igual al ai_message)
  ai_analysis   JSONB,         -- análisis completo para referencia
  session_data  JSONB,         -- datos del formulario/sesión
  status        TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  approved_at   TIMESTAMPTZ
);

-- RLS para parent_message_approvals
ALTER TABLE public.parent_message_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todos los mensajes"
  ON public.parent_message_approvals FOR ALL
  USING (true);

-- 2. TABLA: reportes_generados (si no existe)
CREATE TABLE IF NOT EXISTS public.reportes_generados (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id    UUID REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo        TEXT NOT NULL, -- 'formulario_padres' | 'sesion_aba' | 'evaluacion' | 'entorno_hogar'
  subtipo     TEXT,
  titulo      TEXT NOT NULL,
  contenido   JSONB NOT NULL,
  form_id     UUID,
  status      TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'reviewed', 'shared')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reportes_generados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin ve todos los reportes"
  ON public.reportes_generados FOR ALL
  USING (true);

-- 3. Asegurarse de que la tabla notifications tenga columna metadata
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_parent_message_approvals_status ON public.parent_message_approvals(status);
CREATE INDEX IF NOT EXISTS idx_parent_message_approvals_parent_id ON public.parent_message_approvals(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_message_approvals_child_id ON public.parent_message_approvals(child_id);
CREATE INDEX IF NOT EXISTS idx_reportes_generados_child_id ON public.reportes_generados(child_id);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON public.appointments(parent_id);

-- 5. Asegurar que appointments tiene parent_id
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id);

