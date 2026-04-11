import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

/** PATCH /api/vendedores/[id] — Actualiza nombre y/o estado del vendedor */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: sellerId } = await params
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verificar que el vendedor pertenezca al admin actual
    const { data: seller } = await adminClient
      .from('profiles')
      .select('id, created_by, role')
      .eq('id', sellerId)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    const isMaster  = currentProfile?.role === 'master'
    const isOwner   = seller.created_by === currentUser.id

    if (!isMaster && !isOwner) {
      return NextResponse.json({ error: 'Sin permisos para editar este vendedor' }, { status: 403 })
    }

    const body = await req.json()
    const { name, status } = body

    const updates: Record<string, string> = {}
    if (name?.trim())  updates.business_name = name.trim()
    if (status && ['active', 'inactive'].includes(status)) updates.status = status

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Sin cambios para aplicar' }, { status: 400 })
    }

    await adminClient.from('profiles').update(updates).eq('id', sellerId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API /vendedores/[id] PATCH]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** DELETE /api/vendedores/[id] — Elimina (desactiva y borra auth user) un vendedor */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: sellerId } = await params
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: seller } = await adminClient
      .from('profiles')
      .select('id, created_by, role')
      .eq('id', sellerId)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    const isMaster = currentProfile?.role === 'master'
    const isOwner  = seller.created_by === currentUser.id

    if (!isMaster && !isOwner) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este vendedor' }, { status: 403 })
    }

    // Solo se permiten eliminar vendedores, no admins ni masters
    if (seller.role !== 'vendedor') {
      return NextResponse.json({ error: 'Solo se pueden eliminar vendedores' }, { status: 400 })
    }

    // Eliminar user de auth (cascade eliminará el profile por RLS/FK)
    await adminClient.auth.admin.deleteUser(sellerId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API /vendedores/[id] DELETE]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
