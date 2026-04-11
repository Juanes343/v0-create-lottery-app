-- ============================================================
-- 016: Agregar seller_id a purchases para tracking de ventas por vendedor
-- Cuando un comprador accede a través del link de un vendedor (?ref=seller_id),
-- la compra queda registrada con el seller_id correspondiente
-- ============================================================

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON public.purchases(seller_id);
