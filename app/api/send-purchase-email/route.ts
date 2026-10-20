import { NextRequest, NextResponse } from 'next/server'
import { sendPurchaseEmail } from '@/lib/purchase-email'

export async function POST(req: NextRequest) {
  try {
    const { purchase_id, force } = await req.json()

    if (!purchase_id) {
      return NextResponse.json({ error: 'Falta purchase_id' }, { status: 400 })
    }

    const result = await sendPurchaseEmail(purchase_id, { force: !!force })
    console.log('[send-purchase-email]', purchase_id, result)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Error enviando email de confirmación:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
