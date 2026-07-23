import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Verificar sesión del vendedor/admin
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verificar que el usuario es vendedor, admin o master
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!profile || !['vendedor', 'admin', 'master'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await req.json()
    const {
      raffleId,
      buyerName,
      buyerPhone,
      buyerEmail,
      numbers,
      paymentMethod,
      saleStatus = 'vendido', // 'vendido' | 'separado' | 'abonado'
      amountPaid,
    } = body

    // Validaciones básicas
    if (!raffleId || !buyerName?.trim() || !buyerPhone?.trim()) {
      return NextResponse.json({ error: 'Nombre y teléfono son obligatorios' }, { status: 400 })
    }
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json({ error: 'Debes ingresar al menos un número' }, { status: 400 })
    }

    const validMethods = ['efectivo', 'transferencia', 'nequi', 'daviplata', 'otro']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pago no válido' }, { status: 400 })
    }

    const validSaleStatuses = ['vendido', 'separado', 'abonado']
    if (!validSaleStatuses.includes(saleStatus)) {
      return NextResponse.json({ error: 'Estado de venta no válido' }, { status: 400 })
    }

    // Mapear estado en español (UI) a valores internos de la BD
    const saleStatusMap: Record<string, string> = {
      vendido: 'completed',
      separado: 'reserved',
      abonado: 'partial',
    }
    const dbSaleStatus = saleStatusMap[saleStatus]

    // Obtener la rifa
    const { data: raffle, error: raffleError } = await adminClient
      .from('raffles')
      .select('id, title, price_per_number, currency, status, number_range_start, number_range_end, min_purchase_quantity')
      .eq('id', raffleId)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 })
    }

    // Validar cantidad mínima de compra configurada en la rifa
    const minQty = raffle.min_purchase_quantity ?? 0
    if (minQty > 0 && numbers.length < minQty) {
      return NextResponse.json(
        { error: `Esta rifa exige un mínimo de ${minQty} número${minQty !== 1 ? 's' : ''} por venta` },
        { status: 400 }
      )
    }

    // Validar que los números estén en rango
    const invalidRange = numbers.filter(
      (n: number) => !Number.isInteger(n) || n < raffle.number_range_start || n > raffle.number_range_end
    )
    if (invalidRange.length > 0) {
      return NextResponse.json(
        { error: `Números fuera de rango (${raffle.number_range_start}-${raffle.number_range_end}): ${invalidRange.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar que no estén ya tomados (vendidos, separados o abonados — cualquier fila existente bloquea)
    const { data: taken } = await adminClient
      .from('sold_numbers')
      .select('number')
      .eq('raffle_id', raffleId)
      .in('number', numbers)

    if (taken && taken.length > 0) {
      return NextResponse.json(
        {
          error: 'Algunos números ya están vendidos, separados o abonados',
          takenNumbers: taken.map((n: { number: number }) => n.number),
        },
        { status: 409 }
      )
    }

    const totalAmount = raffle.price_per_number * numbers.length
    const safeEmail = buyerEmail?.trim() || `${buyerPhone.replace(/\D/g, '')}@noemail.bonorifa.com`

    // Validar abono cuando el estado es "abonado"
    let parsedAmountPaid: number | undefined
    if (saleStatus === 'abonado') {
      parsedAmountPaid = Number(amountPaid)
      if (!Number.isFinite(parsedAmountPaid) || parsedAmountPaid <= 0 || parsedAmountPaid >= totalAmount) {
        return NextResponse.json(
          { error: `El abono debe ser mayor a 0 y menor al total ($${totalAmount.toLocaleString('es-CO')})` },
          { status: 400 }
        )
      }
    }

    // Usar función Postgres SECURITY DEFINER para insertar todo en una transacción
    // Esto bypasea cualquier problema de constraint/RLS desde el cliente JS
    const { data: purchaseId, error: rpcError } = await adminClient.rpc('create_manual_purchase', {
      p_raffle_id:      raffleId,
      p_buyer_name:     buyerName.trim(),
      p_buyer_phone:    buyerPhone.trim(),
      p_buyer_email:    safeEmail,
      p_numbers:        numbers,
      p_total_amount:   totalAmount,
      p_payment_method: paymentMethod,
      p_seller_id:      user.id,
      p_currency:       raffle.currency ?? 'COP',
      p_sale_status:    dbSaleStatus,
      p_amount_paid:    saleStatus === 'abonado' ? parsedAmountPaid : null,
    })

    if (rpcError || !purchaseId) {
      console.error('Error en create_manual_purchase RPC:', rpcError)
      return NextResponse.json(
        { error: 'Error al registrar la venta', detail: rpcError?.message, hint: rpcError?.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, purchaseId })
  } catch (err) {
    console.error('Error en compra manual:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
