'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClipboardList, Loader2, Plus, X } from 'lucide-react'

interface RaffleInfo {
  id: string
  title: string
  price_per_number: number
  currency?: string
  number_range_start: number
  number_range_end: number
}

interface ManualSaleModalProps {
  raffle: RaffleInfo
}

const PAYMENT_METHODS = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'transferencia',label: 'Transferencia' },
  { value: 'nequi',        label: 'Nequi' },
  { value: 'daviplata',    label: 'Daviplata' },
  { value: 'otro',         label: 'Otro' },
]

export function ManualSaleModal({ raffle }: ManualSaleModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [buyerName,    setBuyerName]    = useState('')
  const [buyerPhone,   setBuyerPhone]   = useState('')
  const [buyerEmail,   setBuyerEmail]   = useState('')
  const [numbersInput, setNumbersInput] = useState('')
  const [paymentMethod,setPaymentMethod]= useState('efectivo')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)
  const [takenNumbers, setTakenNumbers] = useState<number[]>([])
  const [checking,     setChecking]     = useState(false)

  // Verificar disponibilidad al salir del campo
  const checkAvailability = useCallback(async (nums: number[]) => {
    if (nums.length === 0) { setTakenNumbers([]); return }
    setChecking(true)
    try {
      const res = await fetch(
        `/api/compra-manual/check?raffleId=${raffle.id}&numbers=${nums.join(',')}`
      )
      const data = await res.json()
      setTakenNumbers(data.takenNumbers ?? [])
    } catch {
      // silencioso
    } finally {
      setChecking(false)
    }
  }, [raffle.id])

  // Parsear números del input
  const parsedNumbers: number[] = numbersInput
    .split(/[\s,;]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))

  const uniqueNumbers = [...new Set(parsedNumbers)]
  const total = uniqueNumbers.length * raffle.price_per_number

  const outOfRange = uniqueNumbers.filter(
    (n) => n < raffle.number_range_start || n > raffle.number_range_end
  )

  const canSubmit =
    buyerName.trim() &&
    buyerPhone.trim() &&
    uniqueNumbers.length > 0 &&
    outOfRange.length === 0 &&
    takenNumbers.length === 0 &&
    !loading &&
    !checking

  function handleClose() {
    if (loading) return
    setOpen(false)
    if (success) {
      setBuyerName('')
      setBuyerPhone('')
      setBuyerEmail('')
      setNumbersInput('')
      setPaymentMethod('efectivo')
      setError(null)
      setSuccess(false)
      setTakenNumbers([])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/compra-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raffleId: raffle.id,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        numbers: uniqueNumbers,
        paymentMethod,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.takenNumbers?.length) {
        setError(`Números ya vendidos: ${data.takenNumbers.join(', ')}`)
      } else {
        setError(data.error ?? 'Error al registrar la venta')
      }
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(null) }}
        className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
        style={{
          flex: 1,
          background: 'rgba(139,92,246,0.12)',
          border: '1px solid rgba(139,92,246,0.3)',
          color: 'rgba(167,139,250,1)',
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        Registrar
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-lg"
          style={{
            backgroundColor: 'var(--dash-card)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: 'var(--dash-text)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--dash-text)' }}>
              <ClipboardList className="h-5 w-5" style={{ color: 'rgba(167,139,250,1)' }} />
              Registrar Venta Manual
            </DialogTitle>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dash-muted)' }}>
              {raffle.title} · rango {raffle.number_range_start}–{raffle.number_range_end}
            </p>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 24px rgba(52,211,153,0.4)' }}
              >
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>Venta registrada</p>
              <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
                {uniqueNumbers.length} número{uniqueNumbers.length !== 1 ? 's' : ''} asignado{uniqueNumbers.length !== 1 ? 's' : ''} a {buyerName}
              </p>
              <button
                onClick={handleClose}
                className="mt-2 rounded-xl px-6 py-2 text-sm font-bold text-white border-0"
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Datos del comprador */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--dash-muted)' }}>
                  Datos del comprador
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-muted)' }}>
                      Nombre completo <span style={{ color: 'rgba(248,113,113,1)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--dash-border)',
                        color: 'var(--dash-text)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-muted)' }}>
                      Teléfono / WhatsApp <span style={{ color: 'rgba(248,113,113,1)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="Ej. 3001234567"
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--dash-border)',
                        color: 'var(--dash-text)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-muted)' }}>
                      Email <span style={{ color: 'var(--dash-muted)', fontStyle: 'italic' }}>(opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="Ej. juan@correo.com"
                      className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--dash-border)',
                        color: 'var(--dash-text)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Números */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dash-muted)' }}>
                  Números asignados <span style={{ color: 'rgba(248,113,113,1)' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={numbersInput}
                    onChange={(e) => { setNumbersInput(e.target.value); setTakenNumbers([]) }}
                    onBlur={() => {
                      const inRange = uniqueNumbers.filter(
                        (n) => n >= raffle.number_range_start && n <= raffle.number_range_end
                      )
                      if (inRange.length > 0) checkAvailability(inRange)
                    }}
                    placeholder="Ej. 45, 102, 789 (separados por coma)"
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 pr-8"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${
                        takenNumbers.length > 0 || outOfRange.length > 0
                          ? 'rgba(248,113,113,0.6)'
                          : uniqueNumbers.length > 0 && !checking
                          ? 'rgba(52,211,153,0.5)'
                          : 'var(--dash-border)'
                      }`,
                      color: 'var(--dash-text)',
                    }}
                  />
                  {checking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--dash-muted)' }} />
                    </div>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  {takenNumbers.length > 0 ? (
                    <p className="text-xs font-semibold" style={{ color: 'rgba(248,113,113,1)' }}>
                      Ya vendidos: {takenNumbers.join(', ')}
                    </p>
                  ) : outOfRange.length > 0 ? (
                    <p className="text-xs" style={{ color: 'rgba(248,113,113,1)' }}>
                      Fuera de rango: {outOfRange.join(', ')}
                    </p>
                  ) : uniqueNumbers.length > 0 ? (
                    <p className="text-xs" style={{ color: 'rgba(52,211,153,1)' }}>
                      {uniqueNumbers.length} número{uniqueNumbers.length !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <span />
                  )}
                  {uniqueNumbers.length > 0 && outOfRange.length === 0 && takenNumbers.length === 0 && (
                    <p className="text-xs font-bold" style={{ color: '#22d3ee' }}>
                      Total: ${total.toLocaleString('es-CO')} COP
                    </p>
                  )}
                </div>

                {/* Alerta números ya vendidos */}
                {takenNumbers.length > 0 && (
                  <div
                    className="flex items-start gap-2 rounded-xl px-3 py-2 mt-2"
                    style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}
                  >
                    <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'rgba(248,113,113,1)' }} />
                    <p className="text-xs" style={{ color: 'rgba(248,113,113,1)' }}>
                      Estos números ya están vendidos: <strong>{takenNumbers.join(', ')}</strong>. Quítalos del listado para continuar.
                    </p>
                  </div>
                )}

                {/* Preview de badges: disponibles */}
                {uniqueNumbers.length > 0 && outOfRange.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uniqueNumbers.slice(0, 30).map((n) => {
                      const isTaken = takenNumbers.includes(n)
                      return (
                        <span
                          key={n}
                          className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold"
                          style={{
                            backgroundColor: isTaken ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,238,0.12)',
                            border: `1px solid ${isTaken ? 'rgba(248,113,113,0.5)' : 'rgba(34,211,238,0.3)'}`,
                            color: isTaken ? 'rgba(248,113,113,1)' : '#22d3ee',
                          }}
                        >
                          {isTaken && <X className="h-2.5 w-2.5 mr-0.5" />}
                          {n.toString().padStart(5, '0')}
                        </span>
                      )
                    })}
                    {uniqueNumbers.length > 30 && (
                      <span className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                        +{uniqueNumbers.length - 30} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>
                  Método de pago
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: paymentMethod === m.value ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${paymentMethod === m.value ? 'rgba(139,92,246,0.6)' : 'var(--dash-border)'}`,
                        color: paymentMethod === m.value ? 'rgba(167,139,250,1)' : 'var(--dash-muted)',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}
                >
                  <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'rgba(248,113,113,1)' }} />
                  <p className="text-sm" style={{ color: 'rgba(248,113,113,1)' }}>{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--dash-border)',
                    color: 'var(--dash-muted)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    boxShadow: canSubmit ? '0 0 16px rgba(139,92,246,0.4)' : 'none',
                  }}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                  ) : (
                    <><ClipboardList className="h-4 w-4" /> Registrar Venta</>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
