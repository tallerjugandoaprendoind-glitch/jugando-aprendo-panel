-- ================================================================
-- FIX RLS: Acceso de padres a objetivos_cp y sesiones_datos_aba
-- Ejecutar en Supabase SQL Editor
--
-- PROBLEMA: El cliente Supabase del portal de padres (anon key) no
-- tenía permisos SELECT en estas tablas, por lo que retornaban vacío
-- aunque los datos existieran. El portal mostraba "0 objetivos" y
-- sesiones inconsistentes.
-- ================================================================

-- ── 1. OBJETIVOS_CP ──────────────────────────────────────────────
-- Política: un padre puede ver los objetivos de los programas
-- de sus propios hijos.

DO $$
BEGIN
  -- Habilitar RLS si no está habilitado
  ALTER TABLE IF EXISTS public.objetivos_cp ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP POLICY IF EXISTS "padres pueden ver objetivos de sus hijos" ON public.objetivos_cp;

CREATE POLICY "padres pueden ver objetivos de sus hijos"
  ON public.objetivos_cp
  FOR SELECT
  USING (
    programa_id IN (
      SELECT pa.id
      FROM public.programas_aba pa
      INNER JOIN public.children c ON c.id = pa.child_id
      WHERE c.parent_id = auth.uid()
    )
  );

-- Especialistas y jefes también pueden ver todo
DROP POLICY IF EXISTS "staff puede ver todos los objetivos" ON public.objetivos_cp;

CREATE POLICY "staff puede ver todos los objetivos"
  ON public.objetivos_cp
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'jefe', 'especialista', 'secretaria')
    )
  );

-- ── 2. SESIONES_DATOS_ABA ────────────────────────────────────────
-- Política: un padre puede ver las sesiones de los programas
-- de sus propios hijos.

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.sesiones_datos_aba ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP POLICY IF EXISTS "padres pueden ver sesiones de sus hijos" ON public.sesiones_datos_aba;

CREATE POLICY "padres pueden ver sesiones de sus hijos"
  ON public.sesiones_datos_aba
  FOR SELECT
  USING (
    programa_id IN (
      SELECT pa.id
      FROM public.programas_aba pa
      INNER JOIN public.children c ON c.id = pa.child_id
      WHERE c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff puede ver todas las sesiones aba" ON public.sesiones_datos_aba;

CREATE POLICY "staff puede ver todas las sesiones aba"
  ON public.sesiones_datos_aba
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'jefe', 'especialista', 'secretaria')
    )
  );

-- ── 3. PROGRAMAS_ABA ─────────────────────────────────────────────
-- Aseguramos que los padres también puedan leer programas_aba
-- (necesario para el JOIN en las políticas de arriba).

DO $$
BEGIN
  ALTER TABLE IF EXISTS public.programas_aba ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DROP POLICY IF EXISTS "padres pueden ver programas de sus hijos" ON public.programas_aba;

CREATE POLICY "padres pueden ver programas de sus hijos"
  ON public.programas_aba
  FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM public.children
      WHERE parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff puede ver todos los programas" ON public.programas_aba;

CREATE POLICY "staff puede ver todos los programas"
  ON public.programas_aba
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'jefe', 'especialista', 'secretaria')
    )
  );

-- ── FIN MIGRACIÓN ────────────────────────────────────────────────
