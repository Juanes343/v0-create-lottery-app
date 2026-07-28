import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWalletBalance } from '@/lib/payments/rapyd'

/** GET /api/rapyd/wallet/balance?sellerId=xxx */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const sellerId = req.nextUrl.searchParams.get('sellerId')
  if (!sellerId) {
    return NextResponse.json({ error: 'Falta sellerId' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data: wallet } = await adminClient
    .from('seller_rapyd_wallets')
    .select('*')
    .eq('seller_id', sellerId)
    .single()

  if (!wallet) {
    return NextResponse.json({ hasWallet: false })
  }

  let balance = 0
  try {
    balance = await getWalletBalance(wallet.ewallet_id)
  } catch (err) {
    console.error('[rapyd wallet balance] error:', err)
  }

  const { data: payouts } = await adminClient
    .from('seller_payout_requests')
    .select('id, amount, bank_name, account_number, beneficiary_name, status, paid_at, requested_at')
    .eq('seller_id', sellerId)
    .order('requested_at', { ascending: false })

  const totalPaidOut = (payouts ?? [])
    .filter((p: { status: string }) => p.status === 'paid')
    .reduce((acc: number, p: { amount: number }) => acc + Number(p.amount), 0)

  return NextResponse.json({
    hasWallet: true,
    ewalletId: wallet.ewallet_id,
    balance,
    available: balance - totalPaidOut,
    hasBankInfo: !!(wallet.bank_name && wallet.account_number),
    bankName: wallet.bank_name,
    accountNumber: wallet.account_number,
    payouts: payouts ?? [],
  })
}
