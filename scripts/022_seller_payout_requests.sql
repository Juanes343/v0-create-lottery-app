-- ============================================================
-- 022: Solicitudes de retiro manual de comision de vendedores
--
-- El API de Payouts de Rapyd para Colombia solo soporta remesas
-- internacionales (sender_currency en USD/EUR/GBP/etc, nunca COP),
-- no retiros domesticos COP->COP desde una cartera. Por eso el retiro
-- a banco de los vendedores se procesa manualmente: el vendedor solicita
-- el retiro desde la app, el admin le transfiere por fuera de Rapyd
-- (Nequi/transferencia normal) y luego marca la solicitud como pagada.
-- El saldo de la cartera de Rapyd sigue siendo el registro de cuanto se
-- ha acumulado en comision; el saldo disponible para retirar se calcula
-- restando las solicitudes ya pagadas (y las pendientes, para no permitir
-- solicitar el mismo dinero dos veces).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seller_payout_requests (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount                 NUMERIC NOT NULL,
  bank_name              TEXT,
  account_number         TEXT NOT NULL,
  account_type           TEXT,
  beneficiary_name       TEXT NOT NULL,
  identification_number  TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  requested_at           TIMESTAMPTZ DEFAULT NOW(),
  paid_at                TIMESTAMPTZ
);

ALTER TABLE public.seller_payout_requests ENABLE ROW LEVEL SECURITY;
-- Sin policies a proposito: solo el service_role (rutas de API server-side) accede.

CREATE INDEX IF NOT EXISTS idx_seller_payout_requests_seller_id ON public.seller_payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payout_requests_status ON public.seller_payout_requests(status);
