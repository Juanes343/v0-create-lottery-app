'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, UserPlus, Save, Eye, EyeOff,
  CheckSquare, Square, Ticket, ShieldCheck, ShieldOff,
} from 'lucide-react'
import type { Raffle, SellerWithAssignments } from '@/lib/types'

interface SellerFormProps {
  mode: 'create' | 'edit'
  seller?: SellerWithAssignments
  sellerEmail?: string
  availableRaffles: Pick<Raffle, 'id' | 'title' | 'slug' | 'status'>[]
}

export function SellerForm({ mode, seller, sellerEmail, availableRaffles }: SellerFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  // Fields
  const [name, setName]       = useState(seller?.business_name ?? '')
  const [email, setEmail]     = useState(sellerEmail ?? seller?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus]   = useState<'active' | 'inactive'>(seller?.status ?? 'active')

  // Raffle assignments
  const assignedIds = seller?.assigned_raffles.map(a => a.raffle_id) ?? []
  const [selected, setSelected] = useState<string[]>(assignedIds)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const toggleRaffle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])

  // ------------------------------------------------------------------ create
  const handleCreate = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/vendedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, assignedRaffleIds: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear vendedor')
      router.push('/dashboard/vendedores')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // ------------------------------------------------------------------ edit
  const handleEdit = async () => {
    if (!seller) return
    setError(null)
    setLoading(true)
    try {
      // 1. Update name / status
      const resProfile = await fetch(`/api/vendedores/${seller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status }),
      })
      if (!resProfile.ok) {
        const d = await resProfile.json()
        throw new Error(d.error ?? 'Error al actualizar')
      }

      // 2. Sync raffle assignments
      const toAdd    = selected.filter(id => !assignedIds.includes(id))
      const toRemove = assignedIds.filter(id => !selected.includes(id))

      await Promise.all([
        ...toAdd.map(raffle_id =>
          fetch(`/api/vendedores/${seller.id}/raffles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raffle_id }),
          })
        ),
        ...toRemove.map(raffle_id =>
          fetch(`/api/vendedores/${seller.id}/raffles`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raffle_id }),
          })
        ),
      ])

      router.push('/dashboard/vendedores')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) handleEdit()
    else handleCreate()
  }

  const cardStyle = {
    background: 'var(--dash-card)',
    border: '1px solid var(--dash-border)',
    borderRadius: '1rem',
    boxShadow: 'var(--dash-shadow)',
  }

  const labelStyle = { color: 'var(--dash-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }
  const inputStyle = { background: 'var(--dash-card)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---- Datos del vendedor ---- */}
      <div className="p-6 space-y-5" style={cardStyle}>
        <h3 className="text-base font-semibold" style={{ color: 'var(--dash-text)' }}>
          Datos del vendedor
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label style={labelStyle}>Nombre / Negocio *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <Label style={labelStyle}>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vendedor@email.com"
              required
              disabled={isEdit}
              style={{ ...inputStyle, opacity: isEdit ? 0.6 : 1 }}
            />
          </div>

          {!isEdit && (
            <div className="space-y-2 sm:col-span-2">
              <Label style={labelStyle}>Contraseña temporal *</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  required={!isEdit}
                  minLength={6}
                  style={inputStyle}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--dash-muted)' }}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Estado (solo en edición) ---- */}
      {isEdit && (
        <div className="p-6" style={cardStyle}>
          <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--dash-text)' }}>
            Estado del vendedor
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={status === 'active'
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: 'rgba(52,211,153,1)' }
                : { background: 'var(--dash-card)', border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Activo
            </button>
            <button
              type="button"
              onClick={() => setStatus('inactive')}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={status === 'inactive'
                ? { background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: 'rgba(248,113,113,1)' }
                : { background: 'var(--dash-card)', border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }
              }
            >
              <ShieldOff className="h-4 w-4" />
              Inactivo
            </button>
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--dash-muted)' }}>
            Los vendedores inactivos no pueden iniciar sesión.
          </p>
        </div>
      )}

      {/* ---- Asignación de rifas ---- */}
      <div className="p-6" style={cardStyle}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--dash-text)' }}>
            Rifas / Bonos asignados
          </h3>
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: 'rgba(34,211,238,0.4)', color: '#22d3ee' }}
          >
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {availableRaffles.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
            No tienes rifas activas. Crea una primero.
          </p>
        ) : (
          <div className="space-y-2">
            {availableRaffles.map(raffle => {
              const checked = selected.includes(raffle.id)
              const statusColors: Record<string, string> = {
                active:    'rgba(52,211,153,1)',
                draft:     'rgba(148,163,184,1)',
                completed: 'rgba(34,211,238,1)',
                cancelled: 'rgba(248,113,113,1)',
              }
              const statusLabels: Record<string, string> = {
                active: 'Activa', draft: 'Borrador', completed: 'Completada', cancelled: 'Cancelada',
              }
              return (
                <button
                  key={raffle.id}
                  type="button"
                  onClick={() => toggleRaffle(raffle.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                  style={checked
                    ? { background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)' }
                    : { background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }
                  }
                >
                  {checked
                    ? <CheckSquare className="h-4 w-4 shrink-0" style={{ color: '#22d3ee' }} />
                    : <Square className="h-4 w-4 shrink-0" style={{ color: 'var(--dash-muted)' }} />
                  }
                  <Ticket className="h-4 w-4 shrink-0" style={{ color: 'var(--dash-muted)' }} />
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--dash-text)' }}>
                    {raffle.title}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: statusColors[raffle.status] ?? 'var(--dash-muted)' }}>
                    {statusLabels[raffle.status] ?? raffle.status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator style={{ background: 'var(--dash-border)' }} />

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'rgba(248,113,113,1)' }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)', color: '#fff', border: 'none' }}
        >
          {loading
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : isEdit
              ? <Save className="mr-2 h-4 w-4" />
              : <UserPlus className="mr-2 h-4 w-4" />
          }
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear vendedor'}
        </Button>
      </div>
    </form>
  )
}
