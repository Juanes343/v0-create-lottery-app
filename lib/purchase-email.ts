import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export type PurchaseEmailResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: 'no_real_email' | 'not_completed' | 'already_sent' }
  | { ok: false; error: string }

/**
 * Envia el correo de confirmacion de una compra. Lo llaman el webhook de la pasarela
 * (al confirmarse el pago) y la pagina /pago/exitoso como respaldo — el que llegue primero
 * "reclama" el envio marcando email_sent=true de forma atomica, asi nunca se envia doble.
 *
 * force=true (reenvio desde "Consultar numeros") envia siempre, sin reclamar.
 */
export async function sendPurchaseEmail(purchaseId: string, { force = false } = {}): Promise<PurchaseEmailResult> {
  const supabase = createAdminClient()

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', purchaseId)
    .single()

  if (!purchase) {
    return { ok: false, error: `Compra no encontrada: ${purchaseError?.message ?? purchaseId}` }
  }

  if (!purchase.buyer_email || purchase.buyer_email.includes('@noemail.bonorifa.com')) {
    return { ok: true, skipped: true, reason: 'no_real_email' }
  }

  if (!force) {
    // Solo se confirma por correo un pago ya aprobado por la pasarela
    if (purchase.status !== 'completed') {
      return { ok: true, skipped: true, reason: 'not_completed' }
    }

    const { data: claimed } = await supabase
      .from('purchases')
      .update({ email_sent: true })
      .eq('id', purchaseId)
      .or('email_sent.is.null,email_sent.eq.false')
      .select('id')

    if (!claimed || claimed.length === 0) {
      return { ok: true, skipped: true, reason: 'already_sent' }
    }
  }

  try {
    const { data: raffle } = await supabase
      .from('raffles')
      .select('slug, title, user_id')
      .eq('id', purchase.raffle_id)
      .single()

    if (!raffle) throw new Error('Rifa no encontrada')

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, business_name')
      .eq('id', raffle.user_id)
      .single()

    const profile = profileData ?? { username: 'demo', business_name: 'BonoriFa' }

    const { data: soldNums } = await supabase
      .from('sold_numbers')
      .select('number')
      .eq('purchase_id', purchaseId)

    const numbers: number[] =
      soldNums && soldNums.length > 0
        ? soldNums.map((n: { number: number }) => n.number).sort((a, b) => a - b)
        : (purchase.numbers || []).sort((a: number, b: number) => a - b)

    await sendPurchaseConfirmationEmail({
      to: purchase.buyer_email,
      buyerName: purchase.buyer_name,
      raffleName: raffle.title,
      numbers,
      totalAmount: purchase.total_amount,
      currency: purchase.currency || 'COP',
      rafflePath: `/${profile.username}/${raffle.slug}`,
      businessName: profile.business_name || 'BonoriFa',
    })

    if (force) {
      await supabase.from('purchases').update({ email_sent: true }).eq('id', purchaseId)
    }

    console.log(`[purchase-email] Enviado a ${purchase.buyer_email} (purchase ${purchaseId})`)
    return { ok: true }
  } catch (err) {
    // Liberar el reclamo para que un reintento (pagina exitoso, webhook repetido) pueda enviarlo
    if (!force) {
      await supabase.from('purchases').update({ email_sent: false }).eq('id', purchaseId)
    }
    console.error(`[purchase-email] Error enviando (purchase ${purchaseId}):`, err)
    return { ok: false, error: String(err) }
  }
}
