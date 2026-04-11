import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SellerForm } from '@/components/dashboard/seller-form'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import type { Raffle } from '@/lib/types'

export default async function NuevoVendedorPage() {
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

  // Cargar las rifas del admin para asignarlas al nuevo vendedor
  const { data: raffles } = await supabase
    .from('raffles')
    .select('id, title, slug, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)' }}
          >
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--dash-text)' }}>
              Nuevo vendedor
            </h1>
            <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
              Crea un usuario vendedor y asígnalo a tus rifas
            </p>
          </div>
        </div>
      </div>

      <SellerForm
        mode="create"
        availableRaffles={(raffles ?? []) as Pick<Raffle, 'id' | 'title' | 'slug' | 'status'>[]}
      />
    </div>
  )
}
