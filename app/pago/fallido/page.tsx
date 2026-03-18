import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  searchParams: Promise<{ purchase_id?: string }>
}

export default async function PagoFallidoPage({ searchParams }: Props) {
  const { purchase_id } = await searchParams

  let rafflePath: string | null = null

  if (purchase_id) {
    const supabase = createAdminClient()

    const { data: purchase } = await supabase
      .from('purchases')
      .select('raffle_id')
      .eq('id', purchase_id)
      .single()

    if (purchase) {
      const { data: raffleData } = await supabase
        .from('raffles')
        .select('slug, profiles!inner(username)')
        .eq('id', purchase.raffle_id)
        .single()

      if (raffleData) {
        const profile = raffleData.profiles as unknown as { username: string }
        rafflePath = `/${profile.username}/${raffleData.slug}`
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>

        <h1 className="mb-2 text-2xl font-black text-gray-900">Pago no completado</h1>
        <p className="mb-6 text-gray-600">
          El pago no pudo procesarse. Los números han sido liberados y puedes intentarlo de
          nuevo.
        </p>

        <div className="flex flex-col gap-3">
          {rafflePath && (
            <Link
              href={rafflePath}
              className="rounded-xl bg-red-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-red-600"
            >
              Intentar de nuevo
            </Link>
          )}
          <Link
            href="/"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
