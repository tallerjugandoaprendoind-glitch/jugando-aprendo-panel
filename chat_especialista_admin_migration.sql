-- Tabla de chat entre especialistas y administración
CREATE TABLE IF NOT EXISTS chat_especialista_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('especialista', 'terapeuta', 'jefe')),
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_especialista_admin(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_recipient ON chat_especialista_admin(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_especialista_admin(created_at);

-- RLS
ALTER TABLE chat_especialista_admin ENABLE ROW LEVEL SECURITY;

-- Especialistas solo ven sus propios mensajes
CREATE POLICY "especialistas_ven_sus_mensajes" ON chat_especialista_admin
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Solo el jefe ve todos los mensajes
CREATE POLICY "jefe_ve_todos" ON chat_especialista_admin
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'jefe'
    )
  );

-- Todos los autenticados pueden insertar sus propios mensajes
CREATE POLICY "insertar_mensajes_propios" ON chat_especialista_admin
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Solo el destinatario o el jefe puede marcar como leído
CREATE POLICY "marcar_leido" ON chat_especialista_admin
  FOR UPDATE USING (
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'jefe'
    )
  );

-- Realtime: habilitar para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE chat_especialista_admin;
