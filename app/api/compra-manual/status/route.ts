import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/compra-manual/status?raffleId=xxx
// Devuelve todos los números tomados de una rifa con su estado (paid | reserved | partial | pending)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raffleId = searchParams.get('raffleId')

  if (!raffleId) {
    return NextResponse.json({ numbers: [] })
  }

  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('sold_numbers')
    .select('number, status')
    .eq('raffle_id', raffleId)

  return NextResponse.json({ numbers: data ?? [] })
}
