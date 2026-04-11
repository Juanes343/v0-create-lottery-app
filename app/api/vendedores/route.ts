import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** POST /api/vendedores — Crea un vendedor y lo asocia al admin actual */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verificar rol del usuario actual
    const { data: currentProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!currentProfile || !['admin', 'master'].includes(currentProfile.role ?? 'admin')) {
      return NextResponse.json({ error: 'Sin permisos para crear vendedores' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, name, assignedRaffleIds = [] } = body

    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      return NextResponse.json({ error: 'email, password y name son obligatorios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener mínimo 6 caracteres' }, { status: 400 })
    }

    // Crear usuario en auth.users (confirmar email automáticamente)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        business_name: name.trim(),
        role: 'vendedor',
      },
    })

    if (createError) {
      if (createError.message.toLowerCase().includes('already been registered') ||
          createError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const sellerId = newUser.user.id

    // Upsert del perfil para garantizar role y created_by correctos
    // (el trigger handle_new_user puede tardar un instante, upsert es seguro)
    const baseUsername = email.trim().toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '') || 'vendedor'
    const suffix = Math.floor(Math.random() * 90000) + 10000
    const username = `${baseUsername}${suffix}`

    await adminClient
      .from('profiles')
      .upsert(
        {
          id: sellerId,
          username,
          business_name: name.trim(),
          role: 'vendedor',
          status: 'active',
          created_by: currentUser.id,
        },
        { onConflict: 'id' }
      )

    // Asignar rifas al vendedor
    if (assignedRaffleIds.length > 0) {
      const assignments = assignedRaffleIds.map((raffleId: string) => ({
        seller_id: sellerId,
        raffle_id: raffleId,
        assigned_by: currentUser.id,
      }))
      await adminClient.from('seller_raffle_assignments').insert(assignments)
    }

    return NextResponse.json({ success: true, userId: sellerId })
  } catch (err) {
    console.error('[API /vendedores POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
