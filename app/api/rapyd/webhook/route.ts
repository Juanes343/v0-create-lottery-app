import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRapydWebhookSignature, transferBetweenWallets } from '@/lib/payments/rapyd'
import { sendPurchaseEmail } from '@/lib/purchase-email'

/**
 * Webhook de Rapyd. IMPORTANTE: usa el body crudo (texto) para verificar la firma —
 * si se parsea a JSON antes, la firma no coincide.
 * https://docs.rapyd.net/en/webhook-authentication.html
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const salt = req.headers.get('salt')
    const timestamp = req.headers.get('timestamp')
    const signature = req.headers.get('signature')

    // IMPORTANTE: para webhooks, Rapyd firma con la URL COMPLETA registrada en su
    // dashboard (protocolo + dominio + path), no solo el path relativo — a diferencia
    // de la firma de peticiones salientes a su API. Usar la URL fija, no reconstruirla
    // desde el request (evita problemas de protocolo detrás de proxies).
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-create-lottery-app.vercel.app'
    const urlPath = `${siteUrl}/api/rapyd/webhook`

    if (!salt || !timestamp || !signature) {
      return NextResponse.json({ error: 'Faltan headers de firma' }, { status: 400 })
    }

    const isValid = verifyRapydWebhookSignature({ urlPath, salt, timestamp, signature, rawBody })
    if (!isValid) {
      console.error('[rapyd-webhook] Firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const type = event.type as string | undefined
    const data = event.data ?? {}
    const purchaseId = data.merchant_reference_id as string | undefined

    if (!purchaseId) {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    if (type === 'PAYMENT_COMPLETED' || data.status === 'CLO') {
      await supabase
        .from('purchases')
        .update({ status: 'completed', payment_reference: data.id ?? purchaseId })
        .eq('id', purchaseId)

      await supabase
        .from('sold_numbers')
        .update({ status: 'paid' })
        .eq('purchase_id', purchaseId)

      // Correo de confirmacion despues de responder, para no demorar el webhook
      after(() => sendPurchaseEmail(purchaseId))

      // Transferir automáticamente la comisión de plataforma y la del vendedor
      const { data: purchase } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single()

      if (purchase) {
        const { data: raffle } = await supabase
          .from('raffles')
          .select('user_id')
          .eq('id', purchase.raffle_id)
          .single()

        const { data: ownerProfile } = raffle
          ? await supabase.from('profiles').select('role').eq('id', raffle.user_id).single()
          : { data: null }

        const platformWallet = process.env.RAPYD_PLATFORM_EWALLET_ID
        // Rifas del master (BonoRifa) cobran directo en la cartera de la plataforma, como
        // hasta ahora. Rifas de organizadores externos cobran en la cartera propia del
        // organizador, y de ahi salen ambas transferencias (plataforma + vendedor).
        let sourceWallet = platformWallet
        if (ownerProfile?.role !== 'master' && raffle?.user_id) {
          const { data: ownerWallet } = await supabase
            .from('seller_rapyd_wallets')
            .select('ewallet_id')
            .eq('seller_id', raffle.user_id)
            .single()
          sourceWallet = ownerWallet?.ewallet_id
        }

        if (sourceWallet) {
          // 1) Comision de plataforma (solo organizadores externos)
          if (purchase.platform_commission_amount > 0 && !purchase.platform_transfer_id && platformWallet) {
            try {
              const transferId = await transferBetweenWallets({
                sourceEwallet: sourceWallet,
                destinationEwallet: platformWallet,
                amount: purchase.platform_commission_amount,
              })
              await supabase.from('purchases').update({ platform_transfer_id: transferId }).eq('id', purchaseId)
            } catch (err) {
              console.error('[rapyd-webhook] Error transfiriendo comisión de plataforma:', err)
            }
          }

          // 2) Comision del vendedor
          if (purchase.seller_id && purchase.vendor_commission_amount > 0 && !purchase.rapyd_transfer_id) {
            const { data: sellerWallet } = await supabase
              .from('seller_rapyd_wallets')
              .select('ewallet_id')
              .eq('seller_id', purchase.seller_id)
              .single()

            if (sellerWallet?.ewallet_id) {
              try {
                const transferId = await transferBetweenWallets({
                  sourceEwallet: sourceWallet,
                  destinationEwallet: sellerWallet.ewallet_id,
                  amount: purchase.vendor_commission_amount,
                })
                await supabase.from('purchases').update({ rapyd_transfer_id: transferId }).eq('id', purchaseId)
              } catch (err) {
                console.error('[rapyd-webhook] Error transfiriendo comisión de vendedor:', err)
              }
            }
          }

          // 3) Comision por referido (vendedor que refirio al vendedor de la venta)
          if (purchase.referrer_id && purchase.referral_commission_amount > 0 && !purchase.referral_transfer_id) {
            const { data: referrerWallet } = await supabase
              .from('seller_rapyd_wallets')
              .select('ewallet_id')
              .eq('seller_id', purchase.referrer_id)
              .single()

            if (referrerWallet?.ewallet_id) {
              try {
                const transferId = await transferBetweenWallets({
                  sourceEwallet: sourceWallet,
                  destinationEwallet: referrerWallet.ewallet_id,
                  amount: purchase.referral_commission_amount,
                })
                await supabase.from('purchases').update({ referral_transfer_id: transferId }).eq('id', purchaseId)
              } catch (err) {
                console.error('[rapyd-webhook] Error transfiriendo comisión por referido:', err)
              }
            } else {
              console.warn('[rapyd-webhook] El vendedor que refirió no tiene cartera Rapyd:', purchase.referrer_id)
            }
          }
        }
      }
    } else if (type === 'PAYMENT_FAILED' || type === 'PAYMENT_EXPIRED' || data.status === 'ERR') {
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId)

      await supabase
        .from('sold_numbers')
        .delete()
        .eq('purchase_id', purchaseId)
        .eq('status', 'pending')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[rapyd-webhook] error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
