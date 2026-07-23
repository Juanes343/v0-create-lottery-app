-- ============================================================
-- 020: Comisión de vendedor por rifa + conexión OAuth de MercadoPago
--
-- Modelo: cuando una venta llega por el link de un vendedor conectado
-- a su propia cuenta MP, la preferencia se crea con el access_token
-- DEL VENDEDOR (él es el "collector" y recibe el pago completo en su
-- cuenta), y se usa `marketplace_fee` para que el % de comisión del
-- admin se acredite automáticamente a la cuenta dueña de la
-- Aplicación OAuth (la cuenta configurada en MERCADOPAGO_ACCESS_TOKEN).
-- ============================================================

-- % de comisión que se queda el admin quien registró al vendedor, configurable por rifa
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS vendor_commission_percent NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.raffles DROP CONSTRAINT IF EXISTS raffles_vendor_commission_percent_check;
ALTER TABLE public.raffles ADD CONSTRAINT raffles_vendor_commission_percent_check
  CHECK (vendor_commission_percent >= 0 AND vendor_commission_percent <= 100);

-- Monto de comisión calculado por venta (informativo, para reportes —
-- se llena tanto en ventas por MP con split real como en ventas manuales)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS vendor_commission_amount NUMERIC DEFAULT 0;

-- Indica si el pago se dividió automáticamente vía marketplace_fee de MP
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS mp_split_applied BOOLEAN DEFAULT false;

-- Credenciales OAuth de MercadoPago por vendedor — tabla separada (NO en profiles)
-- para que nunca se filtren en los `select('*')` de profiles usados en el dashboard.
CREATE TABLE IF NOT EXISTS public.seller_mp_accounts (
  seller_id      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mp_user_id     TEXT NOT NULL,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  public_key     TEXT,
  live_mode      BOOLEAN DEFAULT false,
  expires_at     TIMESTAMPTZ NOT NULL,
  connected_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seller_mp_accounts ENABLE ROW LEVEL SECURITY;
-- Sin policies para anon/authenticated a propósito: solo el service_role
-- (usado desde rutas de API server-side) puede leer/escribir esta tabla.

CREATE INDEX IF NOT EXISTS idx_seller_mp_accounts_seller_id ON public.seller_mp_accounts(seller_id);
