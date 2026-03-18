-- Agrega purchase_id a sold_numbers si no existe
ALTER TABLE public.sold_numbers
  ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sold_numbers_purchase_id ON public.sold_numbers(purchase_id);
