// SOLO PARA PRUEBAS — eliminar antes de producción
import { NextRequest, NextResponse } from 'next/server'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  if (!to) return NextResponse.json({ error: 'Falta ?to=email' }, { status: 400 })

  try {
    await sendPurchaseConfirmationEmail({
      to,
      buyerName: 'Juan Prueba',
      raffleName: 'Rifa de prueba',
      numbers: [15, 42, 107],
      totalAmount: 30000,
      currency: 'COP',
      rafflePath: '/demo/mas-bendicion',
      businessName: 'BonoriFa Demo',
    })
    return NextResponse.json({ ok: true, message: `Email enviado a ${to}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
