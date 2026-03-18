import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con service_role key — bypasea RLS.
 * Usar SOLO en rutas de API de servidor (webhooks, cron jobs).
 * NUNCA exponer en el cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
