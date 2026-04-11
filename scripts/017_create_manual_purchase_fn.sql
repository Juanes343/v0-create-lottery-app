-- Corregir el constraint de sold_numbers para asegurar que 'paid' esté incluido
-- (en algunas instancias el constraint fue creado sin este valor)
ALTER TABLE public.sold_numbers DROP CONSTRAINT IF EXISTS sold_numbers_status_check;
ALTER TABLE public.sold_numbers ADD CONSTRAINT sold_numbers_status_check
  CHECK (status IN ('pending', 'paid', 'cancelled'));

-- Función para registrar ventas manuales de vendedores
-- SECURITY DEFINER: corre con permisos del dueño (bypasea RLS y cualquier issue de constraint desde el cliente JS)
CREATE OR REPLACE FUNCTION create_manual_purchase(
  p_raffle_id       UUID,
  p_buyer_name      TEXT,
  p_buyer_phone     TEXT,
  p_buyer_email     TEXT,
  p_numbers         INTEGER[],
  p_total_amount    NUMERIC,
  p_payment_method  TEXT,
  p_seller_id       UUID,
  p_currency        TEXT DEFAULT 'COP'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  -- Eliminar pending huerfanos de esos numeros para esta rifa
  DELETE FROM sold_numbers
  WHERE raffle_id = p_raffle_id
    AND "number" = ANY(p_numbers)
    AND status = 'pending';

  -- Insertar la compra como completada
  INSERT INTO purchases (
    raffle_id, buyer_name, buyer_phone, buyer_email,
    numbers, total_amount, status, payment_method,
    seller_id, currency
  )
  VALUES (
    p_raffle_id, p_buyer_name, p_buyer_phone, p_buyer_email,
    p_numbers, p_total_amount, 'completed', p_payment_method,
    p_seller_id, p_currency
  )
  RETURNING id INTO v_purchase_id;

  -- Insertar numeros directamente como paid
  INSERT INTO sold_numbers (raffle_id, "number", buyer_name, buyer_phone, buyer_email, status, purchase_id)
  SELECT
    p_raffle_id,
    unnest(p_numbers),
    p_buyer_name,
    p_buyer_phone,
    p_buyer_email,
    'paid',
    v_purchase_id;

  RETURN v_purchase_id;
END;
$$;

-- Permitir que cualquier usuario autenticado llame a la función
GRANT EXECUTE ON FUNCTION create_manual_purchase(UUID, TEXT, TEXT, TEXT, INTEGER[], NUMERIC, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_manual_purchase(UUID, TEXT, TEXT, TEXT, INTEGER[], NUMERIC, TEXT, UUID, TEXT) TO service_role;
