-- ============================================================
-- 018: Estados de venta manual — Vendido / Separado / Abonado
-- Permite a vendedor y admin marcar números como:
--   - vendido  -> pagado en su totalidad
--   - separado -> apartado para un cliente, sin pago
--   - abonado  -> pago parcial (abono) registrado
-- ============================================================

-- purchases: nuevo campo para trackear cuánto se ha pagado
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Ampliar estados válidos de purchases
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_status_check;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_status_check
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'reserved', 'partial'));

-- Ampliar estados válidos de sold_numbers
ALTER TABLE public.sold_numbers DROP CONSTRAINT IF EXISTS sold_numbers_status_check;
ALTER TABLE public.sold_numbers ADD CONSTRAINT sold_numbers_status_check
  CHECK (status IN ('pending', 'paid', 'cancelled', 'reserved', 'partial'));

-- Eliminar la firma anterior (9 args) para evitar ambigüedad de sobrecarga
-- con la nueva firma (11 args) al llamarla con los primeros 9 parámetros
DROP FUNCTION IF EXISTS create_manual_purchase(UUID, TEXT, TEXT, TEXT, INTEGER[], NUMERIC, TEXT, UUID, TEXT);

-- Reemplazar create_manual_purchase para soportar el estado de venta y el abono
CREATE OR REPLACE FUNCTION create_manual_purchase(
  p_raffle_id       UUID,
  p_buyer_name      TEXT,
  p_buyer_phone     TEXT,
  p_buyer_email     TEXT,
  p_numbers         INTEGER[],
  p_total_amount    NUMERIC,
  p_payment_method  TEXT,
  p_seller_id       UUID,
  p_currency        TEXT DEFAULT 'COP',
  p_sale_status     TEXT DEFAULT 'completed', -- 'completed' | 'reserved' | 'partial'
  p_amount_paid     NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
  v_number_status TEXT;
  v_amount_paid NUMERIC;
BEGIN
  v_number_status := CASE p_sale_status
    WHEN 'completed' THEN 'paid'
    WHEN 'reserved'  THEN 'reserved'
    WHEN 'partial'   THEN 'partial'
    ELSE 'paid'
  END;

  v_amount_paid := COALESCE(
    p_amount_paid,
    CASE WHEN p_sale_status = 'completed' THEN p_total_amount ELSE 0 END
  );

  -- Eliminar pending huerfanos de esos numeros para esta rifa
  DELETE FROM sold_numbers
  WHERE raffle_id = p_raffle_id
    AND "number" = ANY(p_numbers)
    AND status = 'pending';

  -- Insertar la compra con el estado correspondiente
  INSERT INTO purchases (
    raffle_id, buyer_name, buyer_phone, buyer_email,
    numbers, total_amount, status, payment_method,
    seller_id, currency, amount_paid
  )
  VALUES (
    p_raffle_id, p_buyer_name, p_buyer_phone, p_buyer_email,
    p_numbers, p_total_amount, p_sale_status, p_payment_method,
    p_seller_id, p_currency, v_amount_paid
  )
  RETURNING id INTO v_purchase_id;

  -- Insertar numeros con el estado correspondiente
  INSERT INTO sold_numbers (raffle_id, "number", buyer_name, buyer_phone, buyer_email, status, purchase_id)
  SELECT
    p_raffle_id,
    unnest(p_numbers),
    p_buyer_name,
    p_buyer_phone,
    p_buyer_email,
    v_number_status,
    v_purchase_id;

  RETURN v_purchase_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_manual_purchase(UUID, TEXT, TEXT, TEXT, INTEGER[], NUMERIC, TEXT, UUID, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION create_manual_purchase(UUID, TEXT, TEXT, TEXT, INTEGER[], NUMERIC, TEXT, UUID, TEXT, TEXT, NUMERIC) TO service_role;
