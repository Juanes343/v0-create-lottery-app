import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

async function getAuthorizedAdmin(sellerId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: 'No autenticado', status: 401 }

  const adminClient = createAdminClient()

  const { data: seller } = await adminClient
    .from('profiles')
    .select('id, created_by, role')
    .eq('id', sellerId)
    .single()

  if (!seller) return { error: 'Vendedor no encontrado', status: 404 }

  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  const isMaster = currentProfile?.role === 'master'
  const isOwner  = seller.created_by === currentUser.id

  if (!isMaster && !isOwner) return { error: 'Sin permisos', status: 403 }

  return { currentUser, adminClient, seller }
}

/** POST /api/vendedores/[id]/raffles — Asigna una rifa al vendedor */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: sellerId } = await params
    const result = await getAuthorizedAdmin(sellerId)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { currentUser, adminClient } = result

    const body = await req.json()
    const { raffle_id } = body
    if (!raffle_id) {
      return NextResponse.json({ error: 'raffle_id es obligatorio' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('seller_raffle_assignments')
      .insert({ seller_id: sellerId, raffle_id, assigned_by: currentUser.id })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya está asignada esta rifa' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API /vendedores/[id]/raffles POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** DELETE /api/vendedores/[id]/raffles — Desasigna una rifa del vendedor */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: sellerId } = await params
    const result = await getAuthorizedAdmin(sellerId)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const { adminClient } = result

    const body = await req.json()
    const { raffle_id } = body
    if (!raffle_id) {
      return NextResponse.json({ error: 'raffle_id es obligatorio' }, { status: 400 })
    }

    await adminClient
      .from('seller_raffle_assignments')
      .delete()
      .eq('seller_id', sellerId)
      .eq('raffle_id', raffle_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API /vendedores/[id]/raffles DELETE]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
