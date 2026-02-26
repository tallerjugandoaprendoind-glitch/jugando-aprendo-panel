-- ══════════════════════════════════════════════════════════════
--  MIGRACIÓN: Sistema de Videollamadas - Jugando Aprendo
--  Ejecutar en: Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Agregar columna "modalidad" a la tabla appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'presencial'
    CHECK (modalidad IN ('presencial', 'virtual'));

-- 2. Crear tabla video_sessions
CREATE TABLE IF NOT EXISTS video_sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  child_id         UUID REFERENCES children(id) ON DELETE SET NULL,
  room_name        TEXT NOT NULL,
  room_url         TEXT NOT NULL,
  initiated_by     TEXT NOT NULL DEFAULT 'admin',   -- 'admin' | 'especialista'
  status           TEXT NOT NULL DEFAULT 'waiting'  -- 'waiting' | 'active' | 'ended'
    CHECK (status IN ('waiting','active','ended')),
  duration_minutes NUMERIC DEFAULT 0,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_video_sessions_started_at
  ON video_sessions (started_at);

CREATE INDEX IF NOT EXISTS idx_video_sessions_appointment
  ON video_sessions (appointment_id);

CREATE INDEX IF NOT EXISTS idx_video_sessions_status
  ON video_sessions (status);

-- 4. RLS (Row Level Security)
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede crear/editar (llamadas desde el servidor)
CREATE POLICY "service_role_all" ON video_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Admins y especialistas pueden leer todas las sesiones
CREATE POLICY "admin_read" ON video_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','jefe','especialista')
    )
  );

-- ══════════════════════════════════════════════════════════════
--  Verificar
-- ══════════════════════════════════════════════════════════════
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'appointments' AND column_name = 'modalidad';

SELECT COUNT(*) as total_sessions FROM video_sessions;
