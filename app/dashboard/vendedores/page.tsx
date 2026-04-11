import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserPlus, ShieldCheck, ShieldOff,
  Ticket, MoreVertical, ArrowRight,
} from 'lucide-react'
import type { Raffle } from '@/lib/types'
import { SellerActions } from '@/components/dashboard/seller-actions'

export default async function VendedoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Solo admin y master pueden gestionar vendedores
  if (!profile || !['admin', 'master'].includes(profile.role ?? 'admin')) {
    notFound()
  }

  // Obtener todos los vendedores creados por este admin
  const { data: sellers } = await supabase
    .from('profiles')
    .select('*')
    .eq('created_by', user.id)
    .eq('role', 'vendedor')
    .order('created_at', { ascending: false })

  // Obtener asignaciones de rifas para esos vendedores
  const sellerIds = (sellers ?? []).map((s: { id: string }) => s.id)
  const { data: assignments } = sellerIds.length > 0
    ? await supabase
        .from('seller_raffle_assignments')
        .select('seller_id, raffle_id, raffles(id, title, status)')
        .in('seller_id', sellerIds)
    : { data: [] }

  // Estadísticas rápidas
  const total    = sellers?.length ?? 0
  const active   = sellers?.filter((s: { status: string }) => s.status === 'active').length ?? 0
  const inactive = total - active

  const stats = [
    { label: 'Total vendedores', value: total,    icon: Users,       accent: 'rgba(139,92,246,1)', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
    { label: 'Activos',          value: active,   icon: ShieldCheck, accent: 'rgba(52,211,153,1)', glow: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
    { label: 'Inactivos',        value: inactive, icon: ShieldOff,   accent: 'rgba(248,113,113,1)',glow: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#22d3ee' }}>
            <Users className="h-3.5 w-3.5" />
            Gestión de vendedores
          </p>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--dash-text)' }}>
            Mis Vendedores
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--dash-muted)' }}>
            Crea y administra los vendedores de tus rifas y bonos
          </p>
        </div>
        <Link href="/dashboard/vendedores/nuevo">
          <Button style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)', color:'#fff', border:'none' }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo vendedor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-5"
            style={{ background: s.glow, border: `1px solid ${s.border}` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--dash-muted)' }}>
                {s.label}
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: s.glow, border: `1px solid ${s.border}` }}>
                <s.icon className="h-4 w-4" style={{ color: s.accent }} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-black" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de vendedores */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--dash-text)' }}>
            Lista de vendedores
          </h2>
          <Badge variant="outline" style={{ borderColor: 'rgba(34,211,238,0.4)', color: '#22d3ee' }}>
            {total} total
          </Badge>
        </div>

        {total === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
            style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }}
          >
            <Users className="mb-3 h-10 w-10" style={{ color: 'var(--dash-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--dash-muted)' }}>
              Aún no tienes vendedores
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--dash-muted)', opacity: 0.7 }}>
              Crea uno para empezar a asignar rifas
            </p>
            <Link href="/dashboard/vendedores/nuevo" className="mt-4">
              <Button size="sm" style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)', color:'#fff', border:'none' }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear vendedor
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(sellers ?? []).map((seller: { id: string; business_name: string; status: string; created_at: string }) => {
              const sellerAssignments = (assignments ?? []).filter(
                (a: { seller_id: string }) => a.seller_id === seller.id
              )
              const isActive = seller.status === 'active'

              return (
                <div
                  key={seller.id}
                  className="group rounded-2xl p-4 transition-all"
                  style={{
                    background: 'var(--dash-card)',
                    border: '1px solid var(--dash-border)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: isActive ? 'linear-gradient(135deg,#0891b2,#6366f1)' : 'rgba(100,116,139,0.4)' }}
                    >
                      {seller.business_name?.charAt(0)?.toUpperCase() ?? 'V'}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold truncate" style={{ color: 'var(--dash-text)' }}>
                          {seller.business_name ?? 'Sin nombre'}
                        </p>
                        <Badge
                          variant="outline"
                          style={isActive
                            ? { borderColor:'rgba(52,211,153,0.4)', color:'rgba(52,211,153,1)', background:'rgba(52,211,153,0.08)' }
                            : { borderColor:'rgba(248,113,113,0.4)', color:'rgba(248,113,113,1)', background:'rgba(248,113,113,0.08)' }
                          }
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{ borderColor:'rgba(139,92,246,0.3)', color:'rgba(139,92,246,1)', background:'rgba(139,92,246,0.08)' }}
                        >
                          Vendedor
                        </Badge>
                      </div>

                      {/* Rifas asignadas */}
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {sellerAssignments.length === 0 ? (
                          <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                            Sin rifas asignadas
                          </span>
                        ) : (
                          sellerAssignments.slice(0, 3).map((a: { raffle_id: string; raffles?: { title: string } | null }) => (
                            <span
                              key={a.raffle_id}
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                              style={{ background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', color:'#22d3ee' }}
                            >
                              <Ticket className="h-3 w-3" />
                              {(a.raffles as { title: string } | null)?.title ?? 'Rifa'}
                            </span>
                          ))
                        )}
                        {sellerAssignments.length > 3 && (
                          <span className="rounded-full px-2 py-0.5 text-xs" style={{ background:'rgba(34,211,238,0.08)', color:'#22d3ee' }}>
                            +{sellerAssignments.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/vendedores/${seller.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          style={{ border:'1px solid var(--dash-border)', color:'var(--dash-muted)' }}
                        >
                          Editar
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <SellerActions sellerId={seller.id} sellerName={seller.business_name} currentStatus={seller.status as 'active' | 'inactive'} />
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
