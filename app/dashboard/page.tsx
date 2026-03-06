import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Ticket, Users, DollarSign, TrendingUp } from 'lucide-react'
import type { Raffle } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user?.id)
    .single()

  // Get stats for each raffle
  const rafflesWithStats = await Promise.all(
    (raffles || []).map(async (raffle: Raffle) => {
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

  const totalRaffles = raffles?.length || 0
  const activeRaffles = raffles?.filter((r: Raffle) => r.status === 'active').length || 0
  const totalSold = rafflesWithStats.reduce((acc, r) => acc + r.sold_count, 0)
  const totalRevenue = rafflesWithStats.reduce(
    (acc, r) => acc + r.sold_count * r.price_per_number,
    0
  )

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-accent text-accent-foreground',
    completed: 'bg-primary text-primary-foreground',
    cancelled: 'bg-destructive text-destructive-foreground',
  }

  const statusLabels = {
    draft: 'Borrador',
    active: 'Activa',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestiona tus rifas y ve tus estadisticas
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/raffles/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Rifa
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rifas</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRaffles}</div>
            <p className="text-xs text-muted-foreground">
              {activeRaffles} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Numeros Vendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSold}</div>
            <p className="text-xs text-muted-foreground">
              En todas las rifas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">COP</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tu URL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium truncate">
              /{profile?.username || 'tu-username'}
            </p>
            <p className="text-xs text-muted-foreground">Comparte con clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Raffles List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Mis Rifas</h2>
        {rafflesWithStats.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No tienes rifas todavia</h3>
              <p className="mb-4 text-sm text-muted-foreground text-center">
                Crea tu primera rifa y empieza a vender numeros
              </p>
              <Button asChild>
                <Link href="/dashboard/raffles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Rifa
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rafflesWithStats.map((raffle) => (
              <Link key={raffle.id} href={`/dashboard/raffles/${raffle.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">
                        {raffle.title}
                      </CardTitle>
                      <Badge className={statusColors[raffle.status as keyof typeof statusColors]}>
                        {statusLabels[raffle.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {raffle.prize_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vendidos</span>
                        <span className="font-medium">
                          {raffle.sold_count} / {raffle.total_numbers}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${raffle.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio</span>
                        <span className="font-medium">
                          ${raffle.price_per_number.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
