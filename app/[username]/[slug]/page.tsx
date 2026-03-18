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
      <header className="w-full bg-[#0f1c2e] px-4 py-3 text-center">
        <Link href="/">
          <span className="text-lg font-black uppercase tracking-widest text-white">
            Bono<span className="text-cyan-400">Rifa</span>
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

      <main className="mx-auto max-w-3xl px-4 py-8 pb-28 lg:pb-12">

        {/* Premios adicionales — encima de paquetes */}
        {raffle.additional_prizes && (raffle.additional_prizes as AdditionalPrize[]).length > 0 && (
          <div className="mb-10 overflow-hidden rounded-2xl shadow-xl">
            <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-6 py-5 text-center">
              {raffle.prizes_title && (
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">{raffle.prizes_title}</p>
              )}
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">🏆 Premios</h2>
            </div>
            <div className="grid gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
              {(raffle.additional_prizes as AdditionalPrize[]).map((prize) => (
                <div key={prize.position} className="group overflow-hidden bg-white transition-all hover:shadow-md">
                  {prize.image_url && (
                    <div className="h-48 w-full overflow-hidden bg-gray-100">
                      <img src={prize.image_url} alt={prize.description}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="border-t-2 border-yellow-400 p-4">
                    <p className="text-sm font-bold text-gray-900">{prize.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selección de números */}
        <div>
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
