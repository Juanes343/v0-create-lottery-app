import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSellerWallet } from '@/lib/payments/rapyd'

/**
 * POST /api/rapyd/wallet/create
 * Crea la cartera de Rapyd de un vendedor. Solo el admin dueño del vendedor puede hacerlo.
 * body: { sellerId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { sellerId } = await req.json()
    if (!sellerId) {
      return NextResponse.json({ error: 'Falta sellerId' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verificar que el usuario actual es admin/master y dueño del vendedor
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'master'].includes(currentProfile.role ?? '')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { data: seller } = await adminClient
      .from('profiles')
      .select('id, business_name, created_by, role')
      .eq('id', sellerId)
      .eq('role', 'vendedor')
      .single()

    if (!seller || (currentProfile.role !== 'master' && seller.created_by !== user.id)) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    // Si ya tiene cartera, no crear otra
    const { data: existing } = await adminClient
      .from('seller_rapyd_wallets')
      .select('ewallet_id')
      .eq('seller_id', sellerId)
      .single()

    if (existing?.ewallet_id) {
      return NextResponse.json({ success: true, ewalletId: existing.ewallet_id, alreadyExisted: true })
    }

    const nameParts = (seller.business_name || 'Vendedor').trim().split(/\s+/)
    const firstName = nameParts[0] || 'Vendedor'
    const lastName = nameParts.slice(1).join(' ') || 'BonoRifa'

    const ewalletId = await createSellerWallet({ sellerId, firstName, lastName })

    const { error: insertError } = await adminClient
      .from('seller_rapyd_wallets')
      .insert({ seller_id: sellerId, ewallet_id: ewalletId })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ewalletId })
  } catch (err) {
    console.error('[rapyd wallet create] error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 })
  }
}
