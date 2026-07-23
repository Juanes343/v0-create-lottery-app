import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** GET /api/mp/oauth/status — ¿el vendedor autenticado tiene su cuenta MP conectada? */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('seller_mp_accounts')
    .select('mp_user_id, connected_at, live_mode')
    .eq('seller_id', user.id)
    .single()

  return NextResponse.json({
    connected: !!data,
    mpUserId: data?.mp_user_id ?? null,
    connectedAt: data?.connected_at ?? null,
    liveMode: data?.live_mode ?? false,
  })
}
