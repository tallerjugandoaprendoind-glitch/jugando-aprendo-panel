-- ================================================================
-- FIX RLS: Acceso de padres a la tabla appointments
-- Ejecutar en Supabase SQL Editor
--
-- PROBLEMA: Los padres no podían ver sus citas en el portal porque
-- la tabla appointments no tenía política RLS que permitiera acceso
-- a padres vinculados via parent_accounts o children.parent_id
-- ================================================================

-- Habilitar RLS en appointments si no está
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

-- Política para padres: pueden ver citas de sus hijos
DROP POLICY IF EXISTS "padres pueden ver citas de sus hijos" ON public.appointments;

CREATE POLICY "padres pueden ver citas de sus hijos"
  ON public.appointments
  FOR SELECT
  USING (
    -- Vinculación directa por parent_id en la cita
    parent_id = auth.uid()
    OR
    -- Vinculación por children.parent_id
    child_id IN (
      SELECT id FROM public.children
      WHERE parent_id = auth.uid()
    )
    OR
    -- Vinculación por parent_accounts (método alternativo)
    child_id IN (
      SELECT child_id FROM public.parent_accounts
      WHERE user_id = auth.uid()
    )
  );

-- Staff puede ver todas las citas
DROP POLICY IF EXISTS "staff puede ver todas las citas" ON public.appointments;

CREATE POLICY "staff puede ver todas las citas"
  ON public.appointments
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'jefe', 'especialista', 'secretaria')
    )
  );

-- ================================================================
-- FIX: Asegurar que video_link esté en la tabla appointments
-- ================================================================
ALTER TABLE IF EXISTS public.appointments
  ADD COLUMN IF NOT EXISTS video_link TEXT;

-- ================================================================
-- FIX: Asegurar que meeting_link esté en agenda_sesiones
-- ================================================================
ALTER TABLE IF EXISTS public.agenda_sesiones
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- ── FIN MIGRACIÓN ────────────────────────────────────────────────
