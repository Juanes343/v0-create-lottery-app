import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          {profile.logo_url && (
            <img
              src={profile.logo_url}
              alt={profile.business_name}
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
            />
          )}
          <h1 className="text-3xl font-bold">{profile.business_name}</h1>
          <p className="mt-2 text-muted-foreground">
            Rifas activas disponibles
          </p>
        </div>
      </header>

      {/* Raffles Grid */}
      <main className="container mx-auto px-4 py-8">
        {rafflesWithStats.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No hay rifas activas</h3>
              <p className="text-sm text-muted-foreground text-center">
                Este usuario no tiene rifas activas en este momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rafflesWithStats.map((raffle) => (
              <Link key={raffle.id} href={`/${username}/${raffle.slug}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                  {raffle.images[0] && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={raffle.images[0]}
                        alt={raffle.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1">{raffle.title}</CardTitle>
                      <Badge className="bg-accent text-accent-foreground shrink-0">
                        Activa
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      <span className="line-clamp-1">{raffle.prize_description}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{raffle.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${raffle.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {raffle.sold_count} / {raffle.total_numbers} vendidos
                      </span>
                      <span className="font-bold text-primary">
                        ${raffle.price_per_number.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by BonoRifa
        </div>
      </footer>
    </div>
  )
}
