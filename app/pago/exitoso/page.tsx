import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

interface Props {
  searchParams: Promise<{ purchase_id?: string; payment_id?: string }>
}

export default async function PagoExitosoPage({ searchParams }: Props) {
  const { purchase_id } = await searchParams

  let rafflePath: string | null = null
  let buyerName: string | null = null
  let numbers: number[] = []

  if (purchase_id) {
    const supabase = createAdminClient()

    const { data: purchase } = await supabase
      .from('purchases')
      .select('buyer_name, raffle_id')
      .eq('id', purchase_id)
      .single()

    if (purchase) {
      buyerName = purchase.buyer_name

      const { data: raffleData } = await supabase
        .from('raffles')
        .select('slug, profiles!inner(username)')
        .eq('id', purchase.raffle_id)
        .single()

      if (raffleData) {
        const profile = raffleData.profiles as unknown as { username: string }
        rafflePath = `/${profile.username}/${raffleData.slug}`
      }

      const { data: soldNums } = await supabase
        .from('sold_numbers')
        .select('number')
        .eq('purchase_id', purchase_id)

      numbers = soldNums?.map((n: { number: number }) => n.number).sort((a, b) => a - b) ?? []
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>

        <h1 className="mb-2 text-2xl font-black text-gray-900">¡Pago exitoso!</h1>
        {buyerName && (
          <p className="mb-4 text-gray-600">
            Gracias, <span className="font-semibold">{buyerName}</span>. Tu compra fue confirmada.
          </p>
        )}

        {numbers.length > 0 && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
              Tus números
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {numbers.map((n) => (
                <span
                  key={n}
                  className="rounded-lg bg-emerald-600 px-3 py-1 font-mono text-sm font-bold text-white"
                >
                  {n.toString().padStart(5, '0')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {rafflePath && (
            <Link
              href={rafflePath}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-emerald-700"
            >
              Volver a la rifa
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
