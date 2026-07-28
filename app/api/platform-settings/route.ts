import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlatformCommissionPercent, setPlatformCommissionPercent } from '@/lib/platform-settings'

async function requireMaster() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'master' ? user : null
}

/** GET /api/platform-settings — el % de comision de plataforma (solo master) */
export async function GET() {
  const user = await requireMaster()
  if (!user) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const commissionPercent = await getPlatformCommissionPercent()
  return NextResponse.json({ commissionPercent })
}

/** PATCH /api/platform-settings — body: { commissionPercent: number } (solo master) */
export async function PATCH(req: NextRequest) {
  const user = await requireMaster()
  if (!user) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { commissionPercent } = await req.json()
  if (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
    return NextResponse.json({ error: 'Porcentaje inválido' }, { status: 400 })
  }

  await setPlatformCommissionPercent(commissionPercent)
  return NextResponse.json({ success: true })
}
