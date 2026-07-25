-- ============================================================
-- 021: Carteras (wallets) de Rapyd por vendedor + comision automatica
--
-- Modelo: cada vendedor tiene una "cartera personal" en Rapyd creada por la
-- plataforma (sin login/OAuth del vendedor). Cuando se confirma un pago via
-- Rapyd, se transfiere automaticamente su % de comision desde la cartera de
-- la plataforma hacia la cartera del vendedor. El vendedor retira esa plata
-- a su cuenta bancaria real cuando quiera, via Payout.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seller_rapyd_wallets (
  seller_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  ewallet_id      TEXT NOT NULL,
  -- Datos bancarios opcionales, se completan cuando el vendedor quiere retirar
  bank_name       TEXT,
  account_number  TEXT,
  account_type    TEXT, -- 'ahorros' | 'corriente'
  beneficiary_name TEXT,
  identification_number TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seller_rapyd_wallets ENABLE ROW LEVEL SECURITY;
-- Sin policies para anon/authenticated a proposito: solo el service_role
-- (usado desde rutas de API server-side) puede leer/escribir esta tabla.

CREATE INDEX IF NOT EXISTS idx_seller_rapyd_wallets_seller_id ON public.seller_rapyd_wallets(seller_id);

-- Registro de la transferencia interna de comision por venta (idempotencia)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS rapyd_transfer_id TEXT;
