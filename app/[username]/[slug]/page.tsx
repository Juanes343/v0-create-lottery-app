import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RaffleHero } from '@/components/public/raffle-hero'
import { NumberGrid } from '@/components/public/number-grid'
import { PackageSelector } from '@/components/public/package-selector'
import { RaffleFooter } from '@/components/public/raffle-footer'
import type { Metadata } from 'next'

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
    <div className="min-h-screen bg-background">
      <RaffleHero
        raffle={raffle}
        profile={profile}
        soldCount={soldCount}
        totalNumbers={totalNumbers}
        progress={progress}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-center">Selecciona tus Numeros</h2>
          <p className="text-center text-muted-foreground">
            Haz clic en los numeros disponibles para seleccionarlos
          </p>
        </div>

        <NumberGrid
          raffleId={raffle.id}
          rangeStart={raffle.number_range_start}
          rangeEnd={raffle.number_range_end}
          soldNumbers={soldNumbersSet}
          pricePerNumber={raffle.price_per_number}
          currency={raffle.currency}
        />

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
