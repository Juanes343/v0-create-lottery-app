import { NextRequest, NextResponse } from 'next/server'
import MercadoPagoConfig, { Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envía notificaciones de tipo "payment" y "merchant_order"
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // Verificar el pago directamente con MP (no confiar solo en el webhook)
    const paymentClient = new Payment(mpClient)
    const payment = await paymentClient.get({ id: String(paymentId) })

    const purchaseId = payment.external_reference
    if (!purchaseId) {
      return NextResponse.json({ error: 'Sin referencia externa' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (payment.status === 'approved') {
      // Marcar compra como completada
      await supabase
        .from('purchases')
        .update({
          status: 'completed',
          payment_reference: String(paymentId),
        })
        .eq('id', purchaseId)

      // Confirmar números como pagados
      await supabase
        .from('sold_numbers')
        .update({ status: 'paid' })
        .eq('purchase_id', purchaseId)

    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Marcar compra como fallida
      await supabase
        .from('purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId)

      // Liberar números reservados
      await supabase
        .from('sold_numbers')
        .delete()
        .eq('purchase_id', purchaseId)
        .eq('status', 'pending')
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('MP webhook error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true })
}
