-- ============================================================
-- 023: Comision de plataforma (SaaS) sobre ventas de organizadores externos
--
-- Modelo: cuando el dueno de la rifa es un organizador externo (role='admin',
-- no el master/dueno de BonoRifa), el pago cae en la cartera Rapyd propia de
-- ESE organizador (reusando seller_rapyd_wallets, ya generica por profile id).
-- Al confirmarse el pago se hacen dos transferencias automaticas desde su
-- cartera: la comision de plataforma hacia la cartera de BonoRifa, y la
-- comision del vendedor (si aplica) hacia la cartera del vendedor.
--
-- Cuando el dueno de la rifa es el master (BonoRifa mismo), no aplica nada de
-- esto: el checkout sigue yendo directo a RAPYD_PLATFORM_EWALLET_ID como hasta
-- ahora, sin comision de plataforma (no tiene sentido cobrarse a si mismo).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                 SMALLINT PRIMARY KEY DEFAULT 1,
  commission_percent NUMERIC NOT NULL DEFAULT 10,
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT platform_settings_single_row CHECK (id = 1)
);

INSERT INTO public.platform_settings (id, commission_percent)
VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
-- Sin policies a proposito: solo el service_role (rutas de API server-side) accede.

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS platform_commission_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_transfer_id TEXT;
