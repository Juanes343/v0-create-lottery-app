import { NextRequest, NextResponse } from 'next/server'
import MercadoPagoConfig, { Preference } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSellerMpAccessToken } from '@/lib/mp-seller'

const platformClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

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

    // Obtener la rifa del servidor (nunca confiar en el precio del cliente)
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('id, title, price_per_number, currency, status, min_purchase_quantity, vendor_commission_percent')
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
    if (sellerRef && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerRef)) {
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

    // Si el vendedor tiene su propia cuenta MP conectada y la rifa tiene comisión
    // configurada, la venta se divide: el vendedor cobra directo y el % queda
    // acreditado automáticamente a la cuenta dueña de la Aplicación (marketplace_fee).
    const commissionPercent = raffle.vendor_commission_percent ?? 0
    const sellerMpToken = resolvedSellerId && commissionPercent > 0
      ? await getSellerMpAccessToken(resolvedSellerId)
      : null
    const willSplit = !!sellerMpToken
    const commissionAmount = willSplit ? Math.round(totalAmount * commissionPercent / 100) : 0

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
        payment_method: 'mercadopago',
        vendor_commission_amount: commissionAmount,
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

    // Crear preferencia de pago en Mercado Pago
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-create-lottery-app.vercel.app'

    // Si hay split: la preferencia se crea con el token DEL VENDEDOR (él es el "collector"
    // y recibe el pago completo en su cuenta); marketplace_fee acredita tu % automáticamente.
    const preferenceClient = willSplit
      ? new MercadoPagoConfig({ accessToken: sellerMpToken! })
      : platformClient

    const preference = new Preference(preferenceClient)
    const prefResult = await preference.create({
      body: {
        items: [
          {
            id: purchase.id,
            title: `${selectedNumbers.length} número(s) — ${raffle.title}`,
            quantity: 1,
            unit_price: totalAmount,
            currency_id: 'COP',
          },
        ],
        payer: {
          name: buyerName.trim(),
          phone: { number: buyerPhone.replace(/\D/g, '') },
          ...(buyerEmail?.trim() ? { email: buyerEmail.trim() } : {}),
        },
        back_urls: {
          success: `${siteUrl}/pago/exitoso?purchase_id=${purchase.id}`,
          failure: `${siteUrl}/pago/fallido?purchase_id=${purchase.id}`,
          pending: `${siteUrl}/pago/pendiente?purchase_id=${purchase.id}`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/mp/webhook`,
        external_reference: purchase.id,
        ...(willSplit ? { marketplace_fee: commissionAmount } : {}),
      },
    })

    // Guardar el preference_id en la compra
    await supabase
      .from('purchases')
      .update({ payment_reference: prefResult.id })
      .eq('id', purchase.id)

    return NextResponse.json({
      preferenceId: prefResult.id,
      // sandbox_init_point para pruebas, init_point para producción
      checkoutUrl: prefResult.sandbox_init_point ?? prefResult.init_point,
    })
  } catch (err) {
    console.error('MP create-preference error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
