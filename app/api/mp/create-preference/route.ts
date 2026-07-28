import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSellerMpAccessToken } from '@/lib/mp-seller'
import { getActiveProvider } from '@/lib/payments'
import { createMercadoPagoCheckout } from '@/lib/payments/mercadopago'
import { createRapydCheckout, createSellerWallet } from '@/lib/payments/rapyd'
import { getPlatformCommissionPercent } from '@/lib/platform-settings'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { raffleId, selectedNumbers, buyerName, buyerPhone, buyerEmail, sellerRef } = body

    // Validar campos obligatorios
    if (
      !raffleId ||
      !Array.isArray(selectedNumbers) ||
      selectedNumbers.length === 0 ||
      !buyerName?.trim() ||
      !buyerPhone?.trim()
    ) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const provider = getActiveProvider()

    // Obtener la rifa del servidor (nunca confiar en el precio del cliente)
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, user_id, title, price_per_number, currency, status, min_purchase_quantity, vendor_commission_percent')
      .eq('id', raffleId)
      .single()

    if (raffleError || !raffle || raffle.status !== 'active') {
      return NextResponse.json({ error: 'Rifa no disponible' }, { status: 404 })
    }

    // Validar cantidad mínima de compra configurada en la rifa
    const minQty = raffle.min_purchase_quantity ?? 0
    if (minQty > 0 && selectedNumbers.length < minQty) {
      return NextResponse.json(
        { error: `Esta rifa exige un mínimo de ${minQty} número${minQty !== 1 ? 's' : ''} por compra` },
        { status: 400 }
      )
    }

    // Verificar que los números no estén ya tomados (solo pagados, no pending huérfanos)
    const { data: existingNumbers } = await supabase
      .from('sold_numbers')
      .select('number')
      .eq('raffle_id', raffleId)
      .in('number', selectedNumbers)
      .eq('status', 'paid')  // solo bloqueamos si ya están PAGADOS

    if (existingNumbers && existingNumbers.length > 0) {
      return NextResponse.json(
        {
          error: 'Algunos números ya no están disponibles',
          takenNumbers: existingNumbers.map((n: { number: number }) => n.number),
        },
        { status: 409 },
      )
    }

    // Limpiar posibles registros pending huérfanos de intentos anteriores para estos números
    await supabase
      .from('sold_numbers')
      .delete()
      .eq('raffle_id', raffleId)
      .in('number', selectedNumbers)
      .eq('status', 'pending')

    const totalAmount = raffle.price_per_number * selectedNumbers.length
    const safeEmail = buyerEmail?.trim() || `${buyerPhone.replace(/\D/g, '')}@noemail.bonorifa.com`

    // Validar que el sellerRef sea un UUID válido (evitar injection)
    let resolvedSellerId: string | null = null
    // El dueño de la rifa compartiendo su propio link (?ref=su-propio-id) — venta directa,
    // se registra para estadísticas pero no genera comisión (no es un vendedor externo).
    const isOwnerSelfRef = sellerRef === raffle.user_id
    if (isOwnerSelfRef) {
      resolvedSellerId = raffle.user_id
    } else if (sellerRef && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerRef)) {
      // Verificar que el vendedor existe y está activo
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id, status, role')
        .eq('id', sellerRef)
        .eq('role', 'vendedor')
        .eq('status', 'active')
        .single()
      if (sellerProfile) resolvedSellerId = sellerProfile.id
    }

    // Split automático de comisión: solo soportado con Mercado Pago (vendedor conectado via OAuth).
    // Con Rapyd, la comisión queda registrada como tracking interno únicamente (fase 1).
    // No aplica en ventas directas del propio dueño de la rifa (isOwnerSelfRef).
    const commissionPercent = raffle.vendor_commission_percent ?? 0
    const sellerMpToken = provider === 'mercadopago' && resolvedSellerId && !isOwnerSelfRef && commissionPercent > 0
      ? await getSellerMpAccessToken(resolvedSellerId)
      : null
    const willSplit = !!sellerMpToken
    const commissionAmount = willSplit
      ? Math.round(totalAmount * commissionPercent / 100)
      : (resolvedSellerId && !isOwnerSelfRef && commissionPercent > 0 ? Math.round(totalAmount * commissionPercent / 100) : 0)

    // Comision de plataforma (SaaS): solo aplica cuando el dueno de la rifa es un
    // organizador externo (no el master/BonoRifa mismo), y solo con Rapyd — con Rapyd
    // el cobro cae en la cartera propia del organizador, de ahi sale la comision.
    let destinationEwallet: string | undefined
    let platformCommissionAmount = 0
    if (provider === 'rapyd') {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('role, business_name')
        .eq('id', raffle.user_id)
        .single()

      if (ownerProfile && ownerProfile.role !== 'master') {
        const { data: ownerWallet } = await supabase
          .from('seller_rapyd_wallets')
          .select('ewallet_id')
          .eq('seller_id', raffle.user_id)
          .single()

        if (ownerWallet?.ewallet_id) {
          destinationEwallet = ownerWallet.ewallet_id
        } else {
          // Primera venta con Rapyd de este organizador: crearle su cartera al vuelo
          const nameParts = (ownerProfile.business_name || 'Organizador').trim().split(/\s+/)
          const ewalletId = await createSellerWallet({
            sellerId: raffle.user_id,
            firstName: nameParts[0] || 'Organizador',
            lastName: nameParts.slice(1).join(' ') || 'BonoRifa',
          })
          await supabase.from('seller_rapyd_wallets').insert({ seller_id: raffle.user_id, ewallet_id: ewalletId })
          destinationEwallet = ewalletId
        }

        const platformPercent = await getPlatformCommissionPercent()
        platformCommissionAmount = Math.round(totalAmount * platformPercent / 100)
      }
    }

    // Crear registro de compra en estado pendiente
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        raffle_id: raffleId,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_email: safeEmail,
        total_amount: totalAmount,
        numbers: selectedNumbers,
        status: 'pending',
        payment_method: provider,
        vendor_commission_amount: commissionAmount,
        platform_commission_amount: platformCommissionAmount,
        mp_split_applied: willSplit,
        ...(resolvedSellerId ? { seller_id: resolvedSellerId } : {}),
      })
      .select()
      .single()

    if (purchaseError || !purchase) {
      console.error('Error creating purchase:', purchaseError?.message, purchaseError?.details)
      return NextResponse.json({ error: 'Error al crear compra', detail: purchaseError?.message }, { status: 500 })
    }

    // Reservar los números como pending, vinculados al purchase_id para que la página exitoso los encuentre
    const { error: numbersError } = await supabase.from('sold_numbers').insert(
      selectedNumbers.map((num: number) => ({
        raffle_id: raffleId,
        number: num,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_email: safeEmail,
        status: 'pending',
        purchase_id: purchase.id,
      })),
    )

    if (numbersError) {
      // Revertir la compra si falló la reserva de números
      await supabase.from('purchases').delete().eq('id', purchase.id)
      console.error('Error reserving numbers:', numbersError?.message, numbersError?.details)
      return NextResponse.json({ error: 'Error al reservar números', detail: numbersError?.message }, { status: 500 })
    }

    const checkoutInput = {
      purchaseId: purchase.id,
      raffleTitle: raffle.title,
      totalAmount,
      currency: raffle.currency ?? 'COP',
      numberCount: selectedNumbers.length,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail?.trim() || undefined,
      ...(willSplit ? { sellerAccessToken: sellerMpToken!, commissionAmount } : {}),
      ...(destinationEwallet ? { destinationEwallet } : {}),
    }

    const checkoutResult = provider === 'rapyd'
      ? await createRapydCheckout(checkoutInput)
      : await createMercadoPagoCheckout(checkoutInput)

    // Guardar la referencia del proveedor en la compra
    await supabase
      .from('purchases')
      .update({ payment_reference: checkoutResult.providerReference })
      .eq('id', purchase.id)

    return NextResponse.json({
      preferenceId: checkoutResult.providerReference,
      checkoutUrl: checkoutResult.checkoutUrl,
      purchaseId: purchase.id,
    })
  } catch (err) {
    console.error('create-preference error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
