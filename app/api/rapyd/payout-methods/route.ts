import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listColombiaPayoutMethods } from '@/lib/payments/rapyd'

/** GET /api/rapyd/payout-methods — lista de bancos/tipos de payout disponibles para Colombia */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const methods = await listColombiaPayoutMethods()
    return NextResponse.json({ methods })
  } catch (err) {
    console.error('[rapyd payout-methods] error:', err)
    return NextResponse.json({ error: 'Error al consultar métodos de payout' }, { status: 500 })
  }
}
