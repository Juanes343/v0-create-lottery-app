import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { purchase_id } = await req.json()

    if (!purchase_id) {
      return NextResponse.json({ error: 'Falta purchase_id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .single()

    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    // No reenviar si ya fue enviado
    if (purchase.email_sent) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'already_sent' })
    }

    // No enviar si email es falso
    if (!purchase.buyer_email || purchase.buyer_email.includes('@noemail.bonorifa.com')) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_real_email' })
    }

    const { data: raffleData } = await supabase
      .from('raffles')
      .select('slug, title, price_per_number, whatsapp_number, profiles!inner(username, business_name, whatsapp)')
      .eq('id', purchase.raffle_id)
      .single()

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
