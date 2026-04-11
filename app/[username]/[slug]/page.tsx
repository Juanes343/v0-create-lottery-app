import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { RaffleHero } from '@/components/public/raffle-hero'
import { NumberGrid } from '@/components/public/number-grid'
import { PackageSelector } from '@/components/public/package-selector'
import { RaffleFooter } from '@/components/public/raffle-footer'
import { SellerRefCapture } from '@/components/public/seller-ref-capture'
import { getRaffleTheme } from '@/lib/themes'
import type { Metadata } from 'next'
import type { AdditionalPrize } from '@/lib/types'
import { TiltWrapper } from '@/components/ui/tilt-wrapper'

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
  const theme = getRaffleTheme(raffle.theme)

  return (
    <div className="min-h-screen overflow-x-hidden w-full text-zinc-200" style={{ backgroundColor: '#030712' }}>
      {/* Patrón general de página (Grilla tipo Login) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(${theme.accentText}30 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}30 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Capturar ?ref= del vendedor para tracking */}
        <Suspense fallback={null}>
          <SellerRefCapture />
        </Suspense>

        {/* Header app — dark premium con glow del tema */}
        <header
          className="relative w-full overflow-hidden px-4 py-3 text-center"
          style={{ backgroundColor: '#080d14', borderBottom: `1px solid ${theme.accentText}15` }}
        >
          {/* Grilla de fondo */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${theme.accentText}0a 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}0a 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Glow central */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-24 w-72 -translate-x-1/2"
            style={{ background: `radial-gradient(ellipse at top, ${theme.accentText}25 0%, transparent 70%)` }}
          />
          <Link href="/" className="relative z-10 inline-block">
            <span className="text-xl font-black uppercase tracking-widest text-white">
              Bono<span style={{ color: theme.accentText }}>Rifa</span>
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

        <main className="mx-auto flex-1 w-full max-w-5xl px-4 py-8 pb-12">

          {/* Premios adicionales */}
          {raffle.additional_prizes && (raffle.additional_prizes as AdditionalPrize[]).length > 0 && (
            <div className="mb-10 overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: '#080d14', border: `1px solid ${theme.accentText}15` }}>
              <div className="relative px-6 py-5 text-center" style={{ backgroundColor: '#0a0f18', borderBottom: `1px solid ${theme.accentText}15` }}>
                <div
                  className="pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2"
                  style={{ background: `radial-gradient(ellipse at top, ${theme.accentText}15 0%, transparent 60%)` }}
                />
                <div className="relative">
                  {raffle.prizes_title && (
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accentText }}>{raffle.prizes_title}</p>
                  )}
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-sm">🏆 Premios</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4" style={{ backgroundColor: 'transparent' }}>
                {(raffle.additional_prizes as AdditionalPrize[]).map((prize) => (
                  <TiltWrapper key={prize.position} tiltMaxAngleX={8} tiltMaxAngleY={8} transitionSpeed={2000} className="h-full">
                    <div className="group relative flex h-full flex-col items-center p-6 text-center transition-all rounded-2xl shadow-xl shadow-black/50" style={{ backgroundColor: '#0a0f18', border: `1px solid ${theme.accentText}30` }}>
                      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle at center, ${theme.accentText}15 0%, transparent 80%)` }} />
                      <div className="relative z-10 flex flex-col items-center w-full">
                        <div className="mb-4 h-36 w-full overflow-hidden rounded-xl shadow-lg" style={{ border: `1px solid ${theme.accentText}40`, backgroundColor: '#050a10' }}>
                          {prize.image_url ? (
                            <img src={prize.image_url} alt={prize.description} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-5xl" style={{ color: theme.accentText }}>🎁</div>
                          )}
                        </div>
                        <h3 className="mt-2 text-lg font-black text-white">{prize.description}</h3>
                      </div>
                    </div>
                  </TiltWrapper>
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
            themeId={raffle.theme}
          />
        </div>

        {/* Paquetes */}
        {packages && packages.length > 0 && (
          <PackageSelector
            packages={packages}
            pricePerNumber={raffle.price_per_number}
            currency={raffle.currency}
            themeId={raffle.theme}
          />
        )}
      </main>

      <RaffleFooter profile={profile} themeId={raffle.theme} />
      </div>
    </div>
  )
}
