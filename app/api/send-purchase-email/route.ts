import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { purchase_id } = await req.json()
    console.log('[send-purchase-email] Recibido purchase_id:', purchase_id)

    if (!purchase_id) {
      return NextResponse.json({ error: 'Falta purchase_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .single()

    console.log('[send-purchase-email] purchase:', purchase ? { id: purchase.id, email: purchase.buyer_email, status: purchase.status, email_sent: purchase.email_sent } : null, 'error:', purchaseError?.message)

    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada', detail: purchaseError?.message }, { status: 404 })
    }

    // No enviar si email es falso
    if (!purchase.buyer_email || purchase.buyer_email.includes('@noemail.bonorifa.com')) {
      console.log('[send-purchase-email] Skipping: no real email')
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_real_email' })
    }

    // Solo saltear si ya fue enviado Y el estado sigue completed (para evitar duplicados en refresh)
    // pero si email_sent es true desde un intento fallido, intentamos de nuevo
    if (purchase.email_sent && purchase.status === 'completed') {
      console.log('[send-purchase-email] Skipping: email_sent=true y status=completed')
      return NextResponse.json({ ok: true, skipped: true, reason: 'already_sent' })
    }

    const { data: raffleData } = await supabase
      .from('raffles')
      .select('slug, title, price_per_number, whatsapp_number, profiles!inner(username, business_name, whatsapp)')
      .eq('id', purchase.raffle_id)
      .single()

    console.log('[send-purchase-email] raffleData:', raffleData ? { title: raffleData.title, slug: raffleData.slug } : null)

    if (!raffleData) {
      return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 })
    }

    const profile = raffleData.profiles as unknown as { username: string; business_name: string; whatsapp?: string }
    const rafflePath = `/${profile.username}/${raffleData.slug}`

    // Obtener números desde sold_numbers o desde purchase.numbers
    const { data: soldNums } = await supabase
      .from('sold_numbers')
      .select('number')
      .eq('purchase_id', purchase_id)

    const numbers: number[] =
      soldNums && soldNums.length > 0
        ? soldNums.map((n: { number: number }) => n.number).sort((a, b) => a - b)
        : (purchase.numbers || []).sort((a: number, b: number) => a - b)

    console.log('[send-purchase-email] Enviando email a:', purchase.buyer_email, '| números:', numbers)

    await sendPurchaseConfirmationEmail({
      to: purchase.buyer_email,
      buyerName: purchase.buyer_name,
      raffleName: raffleData.title,
      numbers,
      totalAmount: purchase.total_amount,
      currency: purchase.currency || 'COP',
      rafflePath,
      businessName: profile.business_name || 'BonoriFa',
    })

    // Marcar como enviado
    await supabase.from('purchases').update({ email_sent: true }).eq('id', purchase_id)

    console.log(`Email enviado correctamente para purchase ${purchase_id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error enviando email de confirmación:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
