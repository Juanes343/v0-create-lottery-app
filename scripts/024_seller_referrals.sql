-- ============================================================
-- 024: Referidos de vendedores + comision por referido
--
-- Modelo: un vendedor puede haber sido "referido por" otro vendedor del mismo
-- admin (lo asigna el admin). Cuando el referido vende por su link, ademas de
-- su comision normal, el vendedor que lo refirio gana un % de la venta,
-- configurable por rifa. Un solo nivel: si R (referido de V) refiere a S, las
-- ventas de S comisionan a R, nunca a V.
-- ============================================================

-- Quien refirio a este vendedor
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_not_self;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referred_by_not_self
  CHECK (referred_by IS NULL OR referred_by <> id);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- % de la venta que gana el vendedor que refirio, configurable por rifa
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS referral_commission_percent NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.raffles DROP CONSTRAINT IF EXISTS raffles_referral_commission_percent_check;
ALTER TABLE public.raffles ADD CONSTRAINT raffles_referral_commission_percent_check
  CHECK (referral_commission_percent >= 0 AND referral_commission_percent <= 100);

-- Por compra: quien gana la comision de referido, cuanto, y la transferencia Rapyd (idempotencia)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_commission_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_transfer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_purchases_referrer_id ON public.purchases(referrer_id);
