import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRapydWebhookSignature } from '@/lib/payments/rapyd'

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
