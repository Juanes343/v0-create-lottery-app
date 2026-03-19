import { NextRequest, NextResponse } from 'next/server'
import MercadoPagoConfig, { Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

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

      // Obtener datos de la compra para el email
      const { data: purchase } = await supabase
        .from('purchases')
        .select('buyer_name, buyer_email, buyer_phone, total_amount, currency, numbers, raffle_id')
        .eq('id', purchaseId)
        .single()

      if (purchase) {
        // Obtener datos de la rifa y perfil
        const { data: raffle } = await supabase
          .from('raffles')
          .select('title, slug, whatsapp_number, profiles!inner(username, business_name, whatsapp)')
          .eq('id', purchase.raffle_id)
          .single()

        if (raffle) {
          const profile = raffle.profiles as unknown as { username: string; business_name: string; whatsapp?: string }
          const rafflePath = `/${profile.username}/${raffle.slug}`
          const numbers: number[] = purchase.numbers || []

          // Enviar email de confirmación al comprador (si tiene email válido)
          const email = purchase.buyer_email
          const isRealEmail = email && !email.includes('@noemail.bonorifa.com')
          if (isRealEmail) {
            try {
              await sendPurchaseConfirmationEmail({
                to: email,
                buyerName: purchase.buyer_name,
                raffleName: raffle.title,
                numbers,
                totalAmount: purchase.total_amount,
                currency: purchase.currency || 'COP',
                rafflePath,
                businessName: profile.business_name,
              })
            } catch (emailErr) {
              // No fallar el webhook por problemas de email
              console.error('Error sending confirmation email:', emailErr)
            }
          }
        }
      }

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
