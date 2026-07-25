import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createWalletPayout } from '@/lib/payments/rapyd'

/**
 * POST /api/rapyd/wallet/payout
 * Retira el saldo de la cartera de un vendedor a su cuenta bancaria.
 * body: { sellerId, amount, beneficiaryName, bankAccountNumber, payoutMethodType, identificationNumber }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { sellerId, amount, beneficiaryName, bankAccountNumber, payoutMethodType, identificationNumber } = body

    if (!sellerId || !amount || !beneficiaryName?.trim() || !bankAccountNumber?.trim() || !payoutMethodType) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'master'].includes(currentProfile.role ?? '')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { data: wallet } = await adminClient
      .from('seller_rapyd_wallets')
      .select('ewallet_id')
      .eq('seller_id', sellerId)
      .single()

    if (!wallet?.ewallet_id) {
      return NextResponse.json({ error: 'El vendedor no tiene cartera creada' }, { status: 404 })
    }

    const payout = await createWalletPayout({
      ewalletId: wallet.ewallet_id,
      amount,
      beneficiaryName: beneficiaryName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      payoutMethodType,
      identificationNumber,
    })

    // Guardar los datos bancarios para la próxima vez
    await adminClient
      .from('seller_rapyd_wallets')
      .update({
        bank_name: payoutMethodType,
        account_number: bankAccountNumber.trim(),
        beneficiary_name: beneficiaryName.trim(),
        identification_number: identificationNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)

    return NextResponse.json({ success: true, payout })
  } catch (err) {
    console.error('[rapyd wallet payout] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
