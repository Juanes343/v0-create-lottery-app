import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWalletBalance } from '@/lib/payments/rapyd'

/**
 * POST /api/rapyd/wallet/payout
 *
 * El API de Payouts de Rapyd para Colombia solo soporta remesas internacionales
 * (sender_currency en USD/EUR/GBP/etc, nunca COP) — no un retiro domestico
 * COP->COP desde una cartera. Por eso este endpoint no mueve dinero via Rapyd:
 * registra que el admin va a transferir (o ya transfirio) ese monto por fuera
 * de la plataforma, y descuenta el disponible para futuras solicitudes.
 *
 * body: { sellerId, amount, beneficiaryName, bankName, accountNumber, accountType, identificationNumber }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { sellerId, amount, beneficiaryName, bankName, accountNumber, accountType, identificationNumber } = body

    if (!sellerId || !amount || amount <= 0 || !beneficiaryName?.trim() || !accountNumber?.trim()) {
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

    const [balance, { data: paidOut }] = await Promise.all([
      getWalletBalance(wallet.ewallet_id),
      adminClient
        .from('seller_payout_requests')
        .select('amount')
        .eq('seller_id', sellerId)
        .eq('status', 'paid'),
    ])

    const totalPaidOut = (paidOut ?? []).reduce((acc: number, r: { amount: number }) => acc + Number(r.amount), 0)
    const available = balance - totalPaidOut

    if (amount > available) {
      return NextResponse.json({ error: `Saldo disponible insuficiente ($${available.toLocaleString('es-CO')} COP)` }, { status: 400 })
    }

    const { error: insertError } = await adminClient
      .from('seller_payout_requests')
      .insert({
        seller_id: sellerId,
        amount,
        bank_name: bankName || null,
        account_number: accountNumber.trim(),
        account_type: accountType || null,
        beneficiary_name: beneficiaryName.trim(),
        identification_number: identificationNumber || null,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Guardar los datos bancarios para la próxima vez
    await adminClient
      .from('seller_rapyd_wallets')
      .update({
        bank_name: bankName || null,
        account_number: accountNumber.trim(),
        account_type: accountType || null,
        beneficiary_name: beneficiaryName.trim(),
        identification_number: identificationNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[rapyd wallet payout] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
