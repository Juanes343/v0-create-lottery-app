-- ============================================================
-- 019: Cantidad mínima de compra por rifa
-- 0 = sin mínimo. Se valida al registrar una venta manual.
-- ============================================================

ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS min_purchase_quantity INTEGER NOT NULL DEFAULT 0;
