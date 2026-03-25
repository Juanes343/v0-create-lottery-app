import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Ticket, Users, DollarSign, TrendingUp,
  Eye, Pencil, ArrowRight, Share2, Sparkles,
} from 'lucide-react'
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
    .select('username, business_name')
    .eq('id', user?.id)
    .single()

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

  const statusConfig = {
    draft:     { label: 'Borrador',   color: 'rgba(148,163,184,1)', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)' },
    active:    { label: 'Activa',     color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)' },
    completed: { label: 'Completada', color: 'rgba(34,211,238,1)',  bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.2)' },
    cancelled: { label: 'Cancelada',  color: 'rgba(248,113,113,1)', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)' },
  }

  const stats = [
    {
      label: 'Total Rifas',
      value: totalRaffles,
      sub: `${activeRaffles} activas`,
      icon: Ticket,
      accent: 'rgba(139,92,246,1)',
      glow: 'rgba(139,92,246,0.12)',
      border: 'rgba(139,92,246,0.25)',
    },
    {
      label: 'Números Vendidos',
      value: totalSold,
      sub: 'En todas las rifas',
      icon: Users,
      accent: 'rgba(34,211,238,1)',
      glow: 'rgba(34,211,238,0.1)',
      border: 'rgba(34,211,238,0.2)',
    },
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString('es-CO')}`,
      sub: 'COP',
      icon: DollarSign,
      accent: 'rgba(52,211,153,1)',
      glow: 'rgba(52,211,153,0.1)',
      border: 'rgba(52,211,153,0.2)',
    },
    {
      label: 'Tu Enlace',
      value: `/${profile?.username ?? '—'}`,
      sub: 'Comparte con clientes',
      icon: TrendingUp,
      accent: 'rgba(251,146,60,1)',
      glow: 'rgba(251,146,60,0.1)',
      border: 'rgba(251,146,60,0.2)',
    },
  ]

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5" style={{ color: '#22d3ee' }} />
            <span className="text-sm font-medium" style={{ color: '#22d3ee' }}>Panel de Control</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--dash-text)' }}>
            ¡Hola, {profile?.business_name ?? 'Bienvenido'}! 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dash-muted)' }}>
            Gestiona tus rifas y consulta tus estadísticas en tiempo real
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="gap-2 font-bold uppercase tracking-wide text-white border-0"
          style={{
            background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
            boxShadow: '0 0 24px rgba(34,211,238,0.3)',
          }}
        >
          <Link href="/dashboard/raffles/new">
            <Plus className="h-5 w-5" />
            Nueva Rifa
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              backgroundColor: 'var(--dash-card)',
              border: `1px solid ${s.border}`,
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>
                  {s.label}
                </p>
                <p className="text-2xl font-bold truncate" style={{ color: 'var(--dash-text)' }}>{s.value}</p>
                <p className="text-xs font-medium mt-1" style={{ color: s.accent }}>{s.sub}</p>
              </div>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.glow, border: `1px solid ${s.border}` }}
              >
                <s.icon className="h-5 w-5" style={{ color: s.accent }} />
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}50, transparent)` }}
            />
          </div>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/raffles/new"
          className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--dash-card)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
          >
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Crear Rifa</p>
            <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>Nueva rifa desde cero</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5" style={{ color: 'rgba(139,92,246,0.6)' }} />
        </Link>

        {profile?.username && (
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="group flex items-center gap-4 rounded-2xl p-5 transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--dash-card)',
              border: '1px solid rgba(34,211,238,0.2)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)', boxShadow: '0 0 20px rgba(34,211,238,0.35)' }}
            >
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Ver mi Tienda</p>
              <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>/{profile.username}</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5" style={{ color: 'rgba(34,211,238,0.6)' }} />
          </Link>
        )}

        <div
          className="flex items-center gap-4 rounded-2xl p-5"
          style={{
            backgroundColor: 'var(--dash-card)',
            border: '1px solid rgba(52,211,153,0.2)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 20px rgba(52,211,153,0.35)' }}
          >
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Compartir Enlace</p>
            <p className="text-sm truncate" style={{ color: 'var(--dash-muted)' }}>
              bonorifa.com/{profile?.username ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Mis Rifas */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>Mis Rifas</h2>
          {rafflesWithStats.length > 0 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(167,139,250,1)' }}
            >
              {rafflesWithStats.length} total
            </span>
          )}
        </div>

        {rafflesWithStats.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
            style={{
              backgroundColor: 'var(--dash-card)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <Ticket className="h-8 w-8" style={{ color: 'rgba(167,139,250,1)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--dash-text)' }}>No tienes rifas todavía</h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--dash-muted)' }}>
              Crea tu primera rifa, personaliza los premios y empieza a vender números hoy.
            </p>
            <Button
              asChild
              className="font-bold uppercase tracking-wide text-white border-0"
              style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
                boxShadow: '0 0 24px rgba(34,211,238,0.25)',
              }}
            >
              <Link href="/dashboard/raffles/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Rifa
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rafflesWithStats.map((raffle) => {
              const cfg = statusConfig[raffle.status as keyof typeof statusConfig] ?? statusConfig.draft
              return (
                <div
                  key={raffle.id}
                  className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--dash-card)',
                    border: '1px solid var(--dash-border)',
                    boxShadow: 'var(--dash-shadow)',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="h-0.5 w-full"
                    style={{
                      background:
                        raffle.status === 'active'
                          ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                          : raffle.status === 'completed'
                          ? 'linear-gradient(90deg, #22d3ee, #6366f1)'
                          : 'rgba(255,255,255,0.1)',
                    }}
                  />

                  <div className="flex flex-col flex-1 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1" style={{ color: 'var(--dash-text)' }}>
                          {raffle.title}
                        </h3>
                        <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--dash-muted)' }}>
                          🏆 {raffle.prize_description}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-auto space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs" style={{ color: 'var(--dash-muted)' }}>
                        <span>Progreso de venta</span>
                        <span className="font-semibold text-white">{raffle.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--dash-border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${raffle.progress}%`,
                            background:
                              raffle.status === 'active'
                                ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                                : 'linear-gradient(90deg, #22d3ee, #6366f1)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--dash-muted)' }}>
                          {raffle.sold_count} / {raffle.total_numbers} números
                        </span>
                        <span className="font-bold" style={{ color: '#22d3ee' }}>
                          ${raffle.price_per_number.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/raffles/${raffle.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                          boxShadow: '0 0 12px rgba(139,92,246,0.3)',
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Gestionar
                      </Link>
                      {profile?.username && (
                        <Link
                          href={`/${profile.username}/${raffle.slug}`}
                          target="_blank"
                          className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
                          style={{
                            backgroundColor: 'var(--dash-border)',
                            border: '1px solid var(--dash-border)',
                            color: 'var(--dash-text)',
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
