-- ============================================================
-- 015: Tabla de asignaciones vendedor ↔ rifa/bono
-- Permite que un admin asigne un vendedor a una o más rifas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seller_raffle_assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raffle_id   UUID        NOT NULL REFERENCES public.raffles(id)  ON DELETE CASCADE,
  assigned_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, raffle_id)
);

-- Row-Level Security
ALTER TABLE public.seller_raffle_assignments ENABLE ROW LEVEL SECURITY;

-- El admin ve las asignaciones de sus propios vendedores
-- El vendedor ve sus propias asignaciones
CREATE POLICY "Ver asignaciones propias o de mis vendedores"
  ON public.seller_raffle_assignments FOR SELECT
  USING (
    seller_id = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = seller_id AND p.created_by = auth.uid()
    )
  );

-- Solo el admin puede crear asignaciones de sus vendedores
CREATE POLICY "Admin crea asignaciones de sus vendedores"
  ON public.seller_raffle_assignments FOR INSERT
  WITH CHECK (
    assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = seller_id AND p.created_by = auth.uid()
    )
  );

-- Solo el admin puede eliminar asignaciones
CREATE POLICY "Admin elimina asignaciones de sus vendedores"
  ON public.seller_raffle_assignments FOR DELETE
  USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = seller_id AND p.created_by = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_sra_seller_id ON public.seller_raffle_assignments(seller_id);
CREATE INDEX IF NOT EXISTS idx_sra_raffle_id ON public.seller_raffle_assignments(raffle_id);
CREATE INDEX IF NOT EXISTS idx_sra_assigned_by ON public.seller_raffle_assignments(assigned_by);
