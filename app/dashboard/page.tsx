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
    draft:     { label: 'Borrador',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    active:    { label: 'Activa',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    completed: { label: 'Completada', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    cancelled: { label: 'Cancelada',  cls: 'bg-red-100 text-red-600 border-red-200' },
  }

  const stats = [
    {
      label: 'Total Rifas',
      value: totalRaffles,
      sub: `${activeRaffles} activas`,
      icon: Ticket,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      iconBg: 'bg-violet-500',
      textColor: 'text-violet-700',
    },
    {
      label: 'Números Vendidos',
      value: totalSold,
      sub: 'En todas las rifas',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString('es-CO')}`,
      sub: 'COP',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Tu Enlace',
      value: `/${profile?.username ?? '—'}`,
      sub: 'Comparte con clientes',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-700',
    },
  ]

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Panel de Control</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            ¡Hola, {profile?.business_name ?? 'Bienvenido'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus rifas y consulta tus estadísticas en tiempo real
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 gap-2"
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
            className={`relative overflow-hidden rounded-2xl border ${s.bg} p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  {s.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 truncate">{s.value}</p>
                <p className={`text-xs font-medium mt-1 ${s.textColor}`}>{s.sub}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg} text-white shadow-md`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/raffles/new"
          className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5 hover:border-violet-400 hover:bg-violet-50 transition-all"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-md group-hover:bg-violet-600 transition-colors">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Crear Rifa</p>
            <p className="text-sm text-gray-500">Nueva rifa desde cero</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
        </Link>

        {profile?.username && (
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md group-hover:bg-blue-600 transition-colors">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ver mi Tienda</p>
              <p className="text-sm text-gray-500">/{profile.username}</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        )}

        <div className="group flex items-center gap-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Compartir Enlace</p>
            <p className="text-sm text-gray-500 truncate">
              bonorifa.com/{profile?.username ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Mis Rifas */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Mis Rifas</h2>
          {rafflesWithStats.length > 0 && (
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              {rafflesWithStats.length} total
            </span>
          )}
        </div>

        {rafflesWithStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <Ticket className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No tienes rifas todavía</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Crea tu primera rifa, personaliza los premios y empieza a vender números hoy.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200"
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
                  className="group relative flex flex-col rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div
                    className={`h-1.5 w-full ${
                      raffle.status === 'active'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : raffle.status === 'completed'
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                        : 'bg-gradient-to-r from-gray-200 to-gray-300'
                    }`}
                  />

                  <div className="flex flex-col flex-1 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                          {raffle.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          🏆 {raffle.prize_description}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-auto space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progreso de venta</span>
                        <span className="font-semibold text-gray-700">{raffle.progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            raffle.status === 'active'
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                          }`}
                          style={{ width: `${raffle.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          {raffle.sold_count} / {raffle.total_numbers} números
                        </span>
                        <span className="font-bold text-gray-700">
                          ${raffle.price_per_number.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/raffles/${raffle.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Gestionar
                      </Link>
                      {profile?.username && (
                        <Link
                          href={`/${profile.username}/${raffle.slug}`}
                          target="_blank"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
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
