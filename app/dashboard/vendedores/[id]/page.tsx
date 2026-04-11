import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { SellerForm } from '@/components/dashboard/seller-form'
import { ArrowLeft, UserCog } from 'lucide-react'
import Link from 'next/link'
import type { Raffle, SellerWithAssignments } from '@/lib/types'

interface Props { params: Promise<{ id: string }> }

export default async function EditarVendedorPage({ params }: Props) {
  const { id: sellerId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'master'].includes(profile.role ?? 'admin')) {
    notFound()
  }

  // Cargar datos del vendedor — solo si pertenece al admin actual (o es master)
  const queryProfiles = supabase
    .from('profiles')
    .select('*')
    .eq('id', sellerId)
    .eq('role', 'vendedor')

  if (profile.role !== 'master') {
    queryProfiles.eq('created_by', user.id)
  }

  const { data: seller, error: sellerError } = await queryProfiles.single()

  if (sellerError || !seller) {
    notFound()
  }

  // Obtener el email real del vendedor desde auth.users via admin client
  const adminClientInPage = createAdminClient()
  const { data: { user: vendorAuthUser } } = await adminClientInPage.auth.admin.getUserById(sellerId)
  const vendorEmail = vendorAuthUser?.email ?? ''

  // Cargar asignaciones actuales del vendedor
  const { data: assignments } = await supabase
    .from('seller_raffle_assignments')
    .select('id, seller_id, raffle_id, assigned_by, created_at, raffles(id, title, slug, status)')
    .eq('seller_id', sellerId)

  // Cargar todas las rifas del admin
  const { data: raffles } = await supabase
    .from('raffles')
    .select('id, title, slug, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const sellerWithAssignments: SellerWithAssignments = {
    ...seller,
    role: seller.role ?? 'vendedor',
    status: seller.status ?? 'active',
    assigned_raffles: (assignments ?? []).map((a: {
      id: string
      seller_id: string
      raffle_id: string
      assigned_by?: string
      created_at: string
      raffles?: { id: string; title: string; slug: string; status: string } | null
    }) => ({
      id: a.id,
      seller_id: a.seller_id,
      raffle_id: a.raffle_id,
      assigned_by: a.assigned_by,
      created_at: a.created_at,
      raffle: a.raffles ?? undefined,
    })),
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/vendedores"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--dash-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a vendedores
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
            style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)' }}
          >
            {seller.business_name?.charAt(0)?.toUpperCase() ?? 'V'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5" style={{ color: '#22d3ee' }} />
              <h1 className="text-2xl font-black" style={{ color: 'var(--dash-text)' }}>
                {seller.business_name ?? 'Vendedor'}
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
              Editar datos, estado y rifas asignadas
            </p>
          </div>
        </div>
      </div>

      <SellerForm
        mode="edit"
        seller={sellerWithAssignments}
        sellerEmail={vendorEmail}
        availableRaffles={(raffles ?? []) as Pick<Raffle, 'id' | 'title' | 'slug' | 'status'>[]}
      />
    </div>
  )
}
