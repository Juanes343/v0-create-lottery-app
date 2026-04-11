import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/compra-manual/check?raffleId=xxx&numbers=1,2,3
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raffleId = searchParams.get('raffleId')
  const numbersParam = searchParams.get('numbers')

  if (!raffleId || !numbersParam) {
    return NextResponse.json({ takenNumbers: [] })
  }

  const numbers = numbersParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))

  if (numbers.length === 0) {
    return NextResponse.json({ takenNumbers: [] })
  }

  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('sold_numbers')
    .select('number')
    .eq('raffle_id', raffleId)
    .in('number', numbers)
    .eq('status', 'paid')

  const takenNumbers = (data ?? []).map((row: { number: number }) => row.number)

  return NextResponse.json({ takenNumbers })
}
