import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Ticket, Trophy } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase                      
    .from('profiles')
    .select('business_name')
    .eq('username', username)
    .single()

  if (!profile) {
    return { title: 'Usuario no encontrado' }
  }

  return {
    title: `Rifas de ${profile.business_name} | BonoRifa`,
    description: `Ve todas las rifas activas de ${profile.business_name}`,
  }
}

export default async function UserRafflesPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get sold counts for each raffle
  const rafflesWithStats = await Promise.all(
    (raffles || []).map(async (raffle) => {
      const { count } = await supabase
        .from('sold_numbers')
        .select('*', { count: 'exact', head: true })
        .eq('raffle_id', raffle.id)

      const totalNumbers = raffle.number_range_end - raffle.number_range_start + 1
      
      return {
        ...raffle,
        sold_count: count || 0,
        total_numbers: totalNumbers,
        progress: Math.round(((count || 0) / totalNumbers) * 100),
      }
    })
  )

  return (
    <div className="min-h-screen text-zinc-200" style={{ backgroundColor: '#050a10' }}>
      {/* Header */}
      <header className="relative overflow-hidden py-12 text-center" style={{ backgroundColor: '#0a0f18', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="mb-4 inline-flex items-center justify-center rounded-full p-1" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
             {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={profile.business_name}
                  className="h-20 w-20 rounded-full object-cover"
                  style={{ border: '2px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-3xl font-black text-white" style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
                  {profile.business_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500 mb-1">Organiza</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">{profile.business_name}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Rifas activas disponibles
          </p>
        </div>
      </header>

      {/* Raffles Grid */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {rafflesWithStats.length === 0 ? (
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl p-8 text-center" style={{ backgroundColor: '#0a0f18', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Ticket className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <h3 className="mb-2 text-xl font-bold text-white">No hay rifas activas</h3>
            <p className="text-sm text-zinc-400">
              Este usuario no tiene rifas activas en este momento
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rafflesWithStats.map((raffle) => (
              <Link key={raffle.id} href={`/${username}/${raffle.slug}`}>
                <div className="group relative h-full overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl" style={{ backgroundColor: '#0a0f18', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Glow on hover */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at center, rgba(6,182,212,0.05) 0%, transparent 70%)` }} />
                  
                  {raffle.images[0] ? (
                    <div className="md:h-48 h-40 w-full overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <img
                        src={raffle.images[0]}
                        alt={raffle.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 md:h-48 w-full items-center justify-center border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Ticket className="h-10 w-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-lg font-bold text-white leading-tight">{raffle.title}</h3>
                      <span className="shrink-0 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-500 border border-cyan-500/20">
                        Activa
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                      <Trophy className="h-4 w-4 shrink-0 text-cyan-500" />
                      <span className="line-clamp-1">{raffle.prize_description}</span>
                    </div>
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-500">Progreso</span>
                        <span className="text-white">{raffle.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${raffle.progress}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)', boxShadow: '0 0 10px rgba(6,182,212,0.5)' }}
                        />
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-xs text-zinc-500">
                          {raffle.sold_count} / {raffle.total_numbers} vendidos
                        </span>
                        <span className="text-sm font-black text-cyan-400">
                          ${raffle.price_per_number.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#080d14' }}>
        <div className="container mx-auto px-4 text-center text-xs font-medium uppercase tracking-widest text-zinc-600">
          Powered by Bono<span className="text-zinc-400">Rifa</span>
        </div>
      </footer>
    </div>
  )
}
