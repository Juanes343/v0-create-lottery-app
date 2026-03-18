import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RaffleHero } from '@/components/public/raffle-hero'
import { NumberGrid } from '@/components/public/number-grid'
import { PackageSelector } from '@/components/public/package-selector'
import { RaffleFooter } from '@/components/public/raffle-footer'
import type { Metadata } from 'next'
import type { AdditionalPrize } from '@/lib/types'

interface Props {
  params: Promise<{ username: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, business_name')
    .eq('username', username)
    .single()

  if (!profile) {
    return { title: 'Rifa no encontrada' }
  }

  const { data: raffle } = await supabase
    .from('raffles')
    .select('title, prize_description')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single()

  if (!raffle) {
    return { title: 'Rifa no encontrada' }
  }

  return {
    title: `${raffle.title} | ${profile.business_name}`,
    description: raffle.prize_description,
  }
}

export default async function PublicRafflePage({ params }: Props) {
  const { username, slug } = await params
  const supabase = await createClient()

  // Get profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  // Get raffle by slug and user_id
  const { data: raffle } = await supabase
    .from('raffles')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .single()

  if (!raffle || raffle.status === 'draft') {
    notFound()
  }

  // Get sold numbers
  const { data: soldNumbers } = await supabase
    .from('sold_numbers')
    .select('number')
    .eq('raffle_id', raffle.id)

  const soldNumbersSet = new Set(soldNumbers?.map((n) => n.number) || [])

  // Get packages
  const { data: packages } = await supabase
    .from('number_packages')
    .select('*')
    .eq('raffle_id', raffle.id)
    .eq('is_active', true)
    .order('quantity', { ascending: true })

  const totalNumbers = raffle.number_range_end - raffle.number_range_start + 1
  const soldCount = soldNumbersSet.size
  const progress = Math.round((soldCount / totalNumbers) * 100)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-[100vw]">

      {/* Header app */}
      <header className="w-full border-b border-white/5 bg-gray-950 px-4 py-3 text-center">
        <Link href="/">
          <span className="text-base font-bold text-white">
            Bono<span className="text-blue-400">Rifa</span>
          </span>
        </Link>
      </header>

      <RaffleHero
        raffle={raffle}
        profile={profile}
        soldCount={soldCount}
        totalNumbers={totalNumbers}
        progress={progress}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 pb-28 lg:pb-14">

        {/* Premios adicionales */}
        {raffle.additional_prizes && (raffle.additional_prizes as AdditionalPrize[]).length > 0 && (
          <div className="mb-12">
            <div className="mb-5">
              {raffle.prizes_title && (
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{raffle.prizes_title}</p>
              )}
              <h2 className="text-xl font-bold text-gray-900">Premios</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(raffle.additional_prizes as AdditionalPrize[]).map((prize) => (
                <div key={prize.position} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  {prize.image_url && (
                    <div className="h-44 w-full overflow-hidden bg-gray-100">
                      <img src={prize.image_url} alt={prize.description}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className={`p-4 ${!prize.image_url ? 'flex items-center gap-3' : ''}`}>
                    {!prize.image_url && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                        {prize.position}º
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{prize.position}º lugar</p>
                      <p className="text-sm font-semibold text-gray-900">{prize.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selección de números */}
        <div>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">Elige tu número</h2>
            <p className="mt-1 text-sm text-gray-500">Selecciona los números que quieres y coordínate por WhatsApp</p>
          </div>
          <NumberGrid
            raffleId={raffle.id}
            raffleName={raffle.title}
            rangeStart={raffle.number_range_start}
            rangeEnd={raffle.number_range_end}
            soldNumbers={soldNumbersSet}
            pricePerNumber={raffle.price_per_number}
            currency={raffle.currency}
            whatsappNumber={raffle.whatsapp_number}
            paymentInstructions={raffle.payment_instructions}
          />
        </div>

        {/* Paquetes */}
        {packages && packages.length > 0 && (
          <PackageSelector
            packages={packages}
            pricePerNumber={raffle.price_per_number}
            currency={raffle.currency}
          />
        )}
      </main>

      <RaffleFooter profile={profile} />
    </div>
  )
}
