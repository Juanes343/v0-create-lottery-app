-- Política que permite al webhook (sin auth) actualizar sold_numbers
-- Esto es necesario porque el webhook de Mercado Pago corre sin usuario autenticado
CREATE POLICY IF NOT EXISTS "System can update sold numbers status"
  ON public.sold_numbers FOR UPDATE
  USING (true);

-- Política que permite eliminar sold_numbers pending (cuando pago falla)
CREATE POLICY IF NOT EXISTS "System can delete pending sold numbers"
  ON public.sold_numbers FOR DELETE
  USING (status = 'pending');
