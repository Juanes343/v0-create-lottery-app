-- ============================================================
-- 014: Agregar rol, estado y creador a la tabla profiles
-- Roles: master | admin | vendedor | cliente
-- ============================================================

-- Columna de rol (admin = dueño de rifas, vendedor = asignado por admin)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin'
    CHECK (role IN ('master', 'admin', 'vendedor', 'cliente'));

-- Columna de estado para activar/inactivar usuarios
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- Quién creó este vendedor (FK hacia la misma tabla profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status     ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);

-- ============================================================
-- Actualizar el trigger handle_new_user para respetar el rol
-- que se pase en user_metadata (útil al crear vendedores vía API)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username  TEXT;
  final_username TEXT;
  counter        INTEGER := 0;
BEGIN
  -- Generar username desde el email (parte antes del @)
  base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9]', '', 'g');

  -- Mínimo 3 caracteres
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || '000';
  END IF;

  final_username := base_username;

  -- Garantizar unicidad
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, business_name, role, status)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'admin'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
