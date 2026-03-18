-- Política que permite al webhook (sin auth) actualizar sold_numbers
-- Esto es necesario porque el webhook de Mercado Pago corre sin usuario autenticado
DROP POLICY IF EXISTS "System can update sold numbers status" ON public.sold_numbers;
CREATE POLICY "System can update sold numbers status"
  ON public.sold_numbers FOR UPDATE
  USING (true);

-- Política que permite eliminar sold_numbers pending (cuando pago falla)
DROP POLICY IF EXISTS "System can delete pending sold numbers" ON public.sold_numbers;
CREATE POLICY "System can delete pending sold numbers"
  ON public.sold_numbers FOR DELETE
  USING (status = 'pending');
