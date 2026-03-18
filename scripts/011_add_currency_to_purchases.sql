-- Agrega columna currency a purchases (no estaba en la creación original)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'COP';
