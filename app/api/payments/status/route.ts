import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/payments/status?purchase_id=xxx
 * Usado por el frontend para hacer polling mientras el comprador paga en otra pestaña.
 */
export async function GET(req: NextRequest) {
  const purchaseId = req.nextUrl.searchParams.get('purchase_id')
  if (!purchaseId) {
    return NextResponse.json({ error: 'Falta purchase_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('status')
    .eq('id', purchaseId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ status: data.status })
}
