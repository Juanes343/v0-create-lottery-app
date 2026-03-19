-- Agregar columna email_sent a purchases para evitar reenvíos
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
