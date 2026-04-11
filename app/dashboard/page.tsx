import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Plus, Ticket, Users, DollarSign, TrendingUp,
  Eye, Pencil, ArrowRight, Share2, Sparkles,
  ShoppingCart, Hash,
} from 'lucide-react'
import type { Raffle } from '@/lib/types'
import { CopyLinkButton } from '@/components/dashboard/copy-link-button'
import { VendorRaffleCard } from '@/components/dashboard/vendor-raffle-card'

interface Purchase {
  id: string
  raffle_id: string
  buyer_name: string
  buyer_phone?: string
  buyer_email: string
  total_amount: number
  status: string
  payment_method?: string
  currency?: string
  created_at: string
  numbers?: number[]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, business_name, role')
    .eq('id', user?.id)
    .single()

  const isVendedor = profile?.role === 'vendedor'

  type RaffleWithOwner = Raffle & { ownerUsername?: string }
  let raffles: RaffleWithOwner[] = []
  let vendorPurchases: (Purchase & { raffle_title?: string; sold_numbers?: number[] })[] = []

  const adminClient = createAdminClient()

  if (isVendedor) {
    const { data: assignments } = await adminClient
      .from('seller_raffle_assignments')
      .select('raffle_id')
      .eq('seller_id', user?.id)

    const raffleIds = (assignments ?? []).map((a: { raffle_id: string }) => a.raffle_id)

    if (raffleIds.length > 0) {
      const { data: raffleData } = await adminClient
        .from('raffles')
        .select('*')
        .in('id', raffleIds)
        .order('created_at', { ascending: false })

      const ownerIds = [...new Set((raffleData ?? []).map((r: Raffle) => r.user_id))]
      const { data: owners } = await adminClient
        .from('profiles')
        .select('id, username')
        .in('id', ownerIds)

      const ownerMap: Record<string, string> = Object.fromEntries(
        (owners ?? []).map((o: { id: string; username: string }) => [o.id, o.username])
      )

      raffles = (raffleData ?? []).map((r: Raffle) => ({
        ...r,
        ownerUsername: ownerMap[r.user_id] ?? '',
      }))
    }

    // Compras registradas a través del link de este vendedor
    const { data: rawPurchases } = await adminClient
      .from('purchases')
      .select('id, raffle_id, buyer_name, buyer_phone, buyer_email, total_amount, status, payment_method, currency, created_at')
      .eq('seller_id', user?.id)
      .order('created_at', { ascending: false })

    if (rawPurchases && rawPurchases.length > 0) {
      const purchaseIds = rawPurchases.map((p: Purchase) => p.id)

      // Números vendidos por compra
      const { data: soldRows } = await adminClient
        .from('sold_numbers')
        .select('purchase_id, number')
        .in('purchase_id', purchaseIds)
        .eq('status', 'paid')

      // Mapa purchaseId -> numbers[]
      const numbersMap: Record<string, number[]> = {}
      for (const row of (soldRows ?? [])) {
        if (!numbersMap[row.purchase_id]) numbersMap[row.purchase_id] = []
        numbersMap[row.purchase_id].push(row.number)
      }

      // Mapa raffleId -> title
      const raffleIds2 = [...new Set(rawPurchases.map((p: Purchase) => p.raffle_id))]
      const { data: raffleNames } = await adminClient
        .from('raffles')
        .select('id, title')
        .in('id', raffleIds2)

      const raffleNameMap: Record<string, string> = Object.fromEntries(
        (raffleNames ?? []).map((r: { id: string; title: string }) => [r.id, r.title])
      )

      vendorPurchases = rawPurchases.map((p: Purchase) => ({
        ...p,
        raffle_title: raffleNameMap[p.raffle_id] ?? '—',
        sold_numbers: (numbersMap[p.id] ?? []).sort((a: number, b: number) => a - b),
      }))
    }
  } else {
    const { data } = await supabase
      .from('raffles')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    raffles = (data ?? []).map((r: Raffle) => ({
      ...r,
      ownerUsername: profile?.username ?? '',
    }))
  }

  const rafflesWithStats = await Promise.all(
    raffles.map(async (raffle) => {
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

  const totalRaffles  = rafflesWithStats.length
  const activeRaffles = rafflesWithStats.filter((r) => r.status === 'active').length
  const totalSold     = vendorPurchases.reduce((acc, p) => acc + (p.sold_numbers?.length ?? 0), 0) || rafflesWithStats.reduce((acc, r) => acc + r.sold_count, 0)
  const totalRevenue  = rafflesWithStats.reduce((acc, r) => acc + r.sold_count * r.price_per_number, 0)

  const completedSales = vendorPurchases.filter(p => p.status === 'completed').length
  const totalVendorAmount = vendorPurchases
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + p.total_amount, 0)

  const statusConfig = {
    draft:     { label: 'Borrador',   color: 'rgba(148,163,184,1)', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)'  },
    active:    { label: 'Activa',     color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'  },
    completed: { label: 'Completada', color: 'rgba(34,211,238,1)',  bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.2)'   },
    cancelled: { label: 'Cancelada',  color: 'rgba(248,113,113,1)', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)'  },
  }

  const purchaseStatusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    completed: { label: 'Pagado',    color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',  icon: 'check'  },
    pending:   { label: 'Pendiente', color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',  icon: 'clock'  },
    failed:    { label: 'Fallido',   color: 'rgba(248,113,113,1)', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  icon: 'x'      },
  }

  const statsAdmin = [
    { label: 'Total Rifas',      value: totalRaffles,                               sub: `${activeRaffles} activas`, icon: Ticket,     accent: 'rgba(139,92,246,1)', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
    { label: 'Numeros Vendidos', value: totalSold,                                  sub: 'En todas las rifas',       icon: Users,      accent: 'rgba(34,211,238,1)', glow: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.2)'  },
    { label: 'Ingresos Totales', value: `$${totalRevenue.toLocaleString('es-CO')}`, sub: 'COP',                      icon: DollarSign, accent: 'rgba(52,211,153,1)', glow: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
    { label: 'Tu Enlace',        value: `/${profile?.username ?? '-'}`,             sub: 'Comparte con clientes',    icon: TrendingUp, accent: 'rgba(251,146,60,1)', glow: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)'  },
  ]

  const statsVendedor = [
    { label: 'Rifas Asignadas',  value: totalRaffles,    sub: `${activeRaffles} activas`,                               icon: Ticket,      accent: 'rgba(139,92,246,1)', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
    { label: 'Nums Vendidos',    value: totalSold,        sub: 'Via tu enlace',                                          icon: Hash,        accent: 'rgba(34,211,238,1)', glow: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.2)'  },
    { label: 'Ventas Cerradas',  value: completedSales,   sub: `${vendorPurchases.length} totales`,                      icon: ShoppingCart,accent: 'rgba(52,211,153,1)', glow: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
    { label: 'Total Recaudado',  value: `$${totalVendorAmount.toLocaleString('es-CO')}`, sub: 'COP confirmado',          icon: DollarSign,  accent: 'rgba(251,146,60,1)', glow: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)'  },
  ]

  const stats = isVendedor ? statsVendedor : statsAdmin

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5" style={{ color: '#22d3ee' }} />
            <span className="text-sm font-medium" style={{ color: '#22d3ee' }}>
              {isVendedor ? 'Panel Vendedor' : 'Panel de Control'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--dash-text)' }}>
            Hola, {profile?.business_name ?? 'Bienvenido'}!
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dash-muted)' }}>
            {isVendedor ? 'Aqui puedes ver tus rifas asignadas y el historial de ventas' : 'Gestiona tus rifas y consulta tus estadisticas en tiempo real'}
          </p>
        </div>
        {!isVendedor && (
          <Button asChild size="lg" className="gap-2 font-bold uppercase tracking-wide text-white border-0" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 0 24px rgba(34,211,238,0.3)' }}>
            <Link href="/dashboard/raffles/new">
              <Plus className="h-5 w-5" />
              Nueva Rifa
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl p-5" style={{ backgroundColor: 'var(--dash-card)', border: `1px solid ${s.border}`, boxShadow: 'var(--dash-shadow)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>{s.label}</p>
                <p className="text-2xl font-bold truncate" style={{ color: 'var(--dash-text)' }}>{s.value}</p>
                <p className="text-xs font-medium mt-1" style={{ color: s.accent }}>{s.sub}</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.glow, border: `1px solid ${s.border}` }}>
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}50, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Acciones rapidas - solo admin/master */}
      {!isVendedor && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/dashboard/raffles/new" className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: 'var(--dash-shadow)' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Crear Rifa</p>
              <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Nueva rifa desde cero</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5" style={{ color: 'rgba(139,92,246,0.6)' }} />
          </Link>
          {profile?.username && (
            <Link href={`/${profile.username}`} target="_blank" className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid rgba(34,211,238,0.2)', boxShadow: 'var(--dash-shadow)' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)', boxShadow: '0 0 20px rgba(34,211,238,0.35)' }}>
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Ver mi Tienda</p>
                <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>/{profile.username}</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5" style={{ color: 'rgba(34,211,238,0.6)' }} />
            </Link>
          )}
          <div className="flex items-center gap-4 rounded-2xl p-5" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid rgba(52,211,153,0.2)', boxShadow: 'var(--dash-shadow)' }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 20px rgba(52,211,153,0.35)' }}>
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Compartir Enlace</p>
              <p className="text-sm truncate" style={{ color: 'var(--dash-muted)' }}>bonorifa.com/{profile?.username ?? '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Rifas */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>
            {isVendedor ? 'Mis Rifas Asignadas' : 'Mis Rifas'}
          </h2>
          {rafflesWithStats.length > 0 && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(167,139,250,1)' }}>
              {rafflesWithStats.length} total
            </span>
          )}
        </div>

        {rafflesWithStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Ticket className="h-8 w-8" style={{ color: 'rgba(167,139,250,1)' }} />
            </div>
            {isVendedor ? (
              <>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dash-text)' }}>Sin rifas asignadas</h3>
                <p className="text-sm max-w-xs" style={{ color: 'var(--dash-muted)' }}>El administrador aun no te ha asignado ninguna rifa o bono.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dash-text)' }}>No tienes rifas todavia</h3>
                <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--dash-muted)' }}>Crea tu primera rifa, personaliza los premios y empieza a vender numeros hoy.</p>
                <Button asChild className="font-bold uppercase tracking-wide text-white border-0" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 0 24px rgba(34,211,238,0.25)' }}>
                  <Link href="/dashboard/raffles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Rifa
                  </Link>
                </Button>
              </>
            )}
          </div>
        ) : isVendedor ? (
          <div className="space-y-4">
            {rafflesWithStats.map((raffle) => {
              const publicUrl = raffle.ownerUsername ? `/${raffle.ownerUsername}/${raffle.slug}` : ''
              const refParam = user?.id ? `?ref=${user.id}` : ''
              const fullPublicUrl = publicUrl
                ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${publicUrl}${refParam}`
                : ''
              return (
                <VendorRaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  purchases={vendorPurchases.filter((p) => p.raffle_id === raffle.id)}
                  publicUrl={publicUrl}
                  fullPublicUrl={fullPublicUrl}
                />
              )
            })}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rafflesWithStats.map((raffle) => {
              const cfg = statusConfig[raffle.status as keyof typeof statusConfig] ?? statusConfig.draft
              const publicUrl = raffle.ownerUsername ? `/${raffle.ownerUsername}/${raffle.slug}` : null
              const fullPublicUrl = publicUrl
                ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${publicUrl}`
                : null
              return (
                <div key={raffle.id} className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}>
                  <div className="h-0.5 w-full" style={{ background: raffle.status === 'active' ? 'linear-gradient(90deg, #34d399, #22d3ee)' : raffle.status === 'completed' ? 'linear-gradient(90deg, #22d3ee, #6366f1)' : 'rgba(255,255,255,0.1)' }} />
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1" style={{ color: 'var(--dash-text)' }}>{raffle.title}</h3>
                        <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--dash-muted)' }}>{raffle.prize_description}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                    </div>
                    <div className="mt-auto space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs" style={{ color: 'var(--dash-muted)' }}>
                        <span>Progreso de venta</span>
                        <span className="font-semibold" style={{ color: 'var(--dash-text)' }}>{raffle.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--dash-border)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${raffle.progress}%`, background: raffle.status === 'active' ? 'linear-gradient(90deg, #34d399, #22d3ee)' : 'linear-gradient(90deg, #22d3ee, #6366f1)' }} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--dash-muted)' }}>{raffle.sold_count} / {raffle.total_numbers} numeros</span>
                        <span className="font-bold" style={{ color: '#22d3ee' }}>${raffle.price_per_number.toLocaleString('es-CO')} COP</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/raffles/${raffle.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 12px rgba(139,92,246,0.3)' }}>
                        <Pencil className="h-3.5 w-3.5" />
                        Gestionar
                      </Link>
                      {publicUrl && (
                        <Link href={publicUrl} target="_blank" className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all" style={{ backgroundColor: 'var(--dash-border)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                      )}
                      {fullPublicUrl && <CopyLinkButton url={fullPublicUrl} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Seccion de Ventas movida a VendorRaffleCard */}
      {false && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" style={{ color: '#34d399' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>Mis Ventas</h2>
            </div>
            {vendorPurchases.length > 0 && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)', color: 'rgba(52,211,153,1)' }}>
                {vendorPurchases.length} compras
              </span>
            )}
          </div>

          {vendorPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl py-12 text-center" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <ShoppingCart className="h-7 w-7" style={{ color: 'rgba(52,211,153,0.7)' }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: 'var(--dash-text)' }}>Sin ventas aun</h3>
              <p className="text-sm max-w-xs" style={{ color: 'var(--dash-muted)' }}>Cuando alguien compre a traves de tu enlace, apareceran aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorPurchases.map((purchase) => {
                const pCfg = purchaseStatusConfig[purchase.status] ?? purchaseStatusConfig.pending
                const numberDigits = 5
                return (
                  <div key={purchase.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}>
                    {/* Header de la compra */}
                    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--dash-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #0891b2, #6366f1)' }}>
                          {purchase.buyer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>{purchase.buyer_name}</p>
                          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>{purchase.raffle_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm" style={{ color: '#22d3ee' }}>
                          ${purchase.total_amount.toLocaleString('es-CO')} COP
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1" style={{ color: pCfg.color, backgroundColor: pCfg.bg, border: `1px solid ${pCfg.border}` }}>
                          {pCfg.icon === 'check' && <CheckCircle2 className="h-3 w-3" />}
                          {pCfg.icon === 'clock' && <Clock className="h-3 w-3" />}
                          {pCfg.icon === 'x' && <XCircle className="h-3 w-3" />}
                          {pCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Detalles del comprador + numeros */}
                    <div className="px-5 py-4 grid gap-4 sm:grid-cols-2">
                      {/* Info del comprador */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>Comprador</p>
                        {purchase.buyer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--dash-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--dash-text)' }}>{purchase.buyer_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--dash-muted)' }} />
                          <span className="text-sm truncate" style={{ color: 'var(--dash-text)' }}>{purchase.buyer_email.includes('@noemail.') ? '— sin email' : purchase.buyer_email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--dash-muted)' }} />
                          <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>{formatDate(purchase.created_at)}</span>
                        </div>
                      </div>

                      {/* Numeros asignados */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>
                          Numeros ({purchase.sold_numbers?.length ?? 0})
                        </p>
                        {purchase.sold_numbers && purchase.sold_numbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {purchase.sold_numbers.slice(0, 20).map((num) => (
                              <span key={num} className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
                                {num.toString().padStart(numberDigits, '0')}
                              </span>
                            ))}
                            {(purchase.sold_numbers?.length ?? 0) > 20 && (
                              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(167,139,250,1)' }}>
                                +{(purchase.sold_numbers?.length ?? 0) - 20} mas
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>Pago pendiente de confirmacion</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}