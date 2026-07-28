import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RaffleForm } from '@/components/dashboard/raffle-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ExternalLink, Users } from 'lucide-react'
import { SoldNumbersList } from '@/components/dashboard/sold-numbers-list'
import { ManualSaleModal } from '@/components/dashboard/manual-sale-modal'
import { CopyLinkButton } from '@/components/dashboard/copy-link-button'

export default async function RaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: raffle, error } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !raffle) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: soldNumbers } = await supabase
    .from('sold_numbers')
    .select('*')
    .eq('raffle_id', id)
    .order('created_at', { ascending: false })

  const totalNumbers = raffle.number_range_end - raffle.number_range_start + 1
  const soldCount = soldNumbers?.length || 0
  const progress = Math.round((soldCount / totalNumbers) * 100)
  const revenue = soldCount * raffle.price_per_number
  const publicUrl = `/${profile?.username}/${raffle.slug}`
  // Con ?ref= a tu propio id: tus ventas directas (sin pasar por un vendedor) tambien
  // quedan atribuidas a ti, para diferenciarlas de las ventas de tus vendedores.
  const fullPublicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${publicUrl}?ref=${user.id}`

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{raffle.title}</h1>
            <Badge className={statusColors[raffle.status as keyof typeof statusColors]}>
              {statusLabels[raffle.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <p className="text-muted-foreground">{raffle.prize_description}</p>
        </div>
        <div className="flex gap-2">
          <ManualSaleModal
            raffle={{
              id: raffle.id,
              title: raffle.title,
              price_per_number: raffle.price_per_number,
              currency: raffle.currency,
              number_range_start: raffle.number_range_start,
              number_range_end: raffle.number_range_end,
              min_purchase_quantity: raffle.min_purchase_quantity,
            }}
          />
          <Button variant="outline" asChild>
            <Link href={publicUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Publica
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {soldCount.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">
              de {totalNumbers.toLocaleString('es-CO')} numeros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenue.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">COP</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${raffle.price_per_number.toLocaleString('es-CO')}
            </div>
            <p className="text-xs text-muted-foreground">por numero</p>
          </CardContent>
        </Card>
      </div>

      {/* URL Copy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Enlace Publico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
              {fullPublicUrl}
            </code>
            <CopyLinkButton url={fullPublicUrl} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Editar Rifa</TabsTrigger>
          <TabsTrigger value="sold">
            <Users className="mr-2 h-4 w-4" />
            Numeros Vendidos ({soldCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-6">
          <RaffleForm raffle={raffle} userId={user.id} />
        </TabsContent>
        <TabsContent value="sold" className="mt-6">
          <SoldNumbersList numbers={soldNumbers || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
