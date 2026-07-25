'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClipboardList, Loader2, Plus, X, CheckCircle2, BookmarkCheck, HandCoins, CreditCard, ExternalLink, XCircle } from 'lucide-react'
import { NumberPickerGrid, type TakenStatus } from '@/components/dashboard/number-picker-grid'
import { usePaymentStatus } from '@/hooks/use-payment-status'

interface RaffleInfo {
  id: string
  title: string
  price_per_number: number
  currency?: string
  number_range_start: number
  number_range_end: number
  min_purchase_quantity?: number
}

interface ManualSaleModalProps {
  raffle: RaffleInfo
  /** id del vendedor a atribuir la venta cuando se paga por Mercado Pago (opcional) */
  sellerId?: string
}

const PAYMENT_METHODS = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'transferencia',label: 'Transferencia' },
]

const SALE_STATUSES = [
  { value: 'vendido',  label: 'Vendido',  hint: 'Pagado por completo',    icon: CheckCircle2,  color: 'rgba(52,211,153,1)',  bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.4)'  },
  { value: 'separado', label: 'Separado', hint: 'Apartado, sin pago aún', icon: BookmarkCheck, color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.4)'  },
  { value: 'abonado',  label: 'Abonado',  hint: 'Pago parcial (abono)',   icon: HandCoins,     color: 'rgba(167,139,250,1)', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)' },
] as const

export function ManualSaleModal({ raffle, sellerId }: ManualSaleModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [buyerName,    setBuyerName]    = useState('')
  const [buyerPhone,   setBuyerPhone]   = useState('')
  const [buyerEmail,   setBuyerEmail]   = useState('')
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [quickAdd,     setQuickAdd]     = useState('')
  const [paymentMethod,setPaymentMethod]= useState('efectivo')
  const [saleStatus,   setSaleStatus]   = useState<'vendido' | 'separado' | 'abonado'>('vendido')
  const [amountPaid,   setAmountPaid]   = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState(false)
  const [taken,        setTaken]        = useState<Record<number, TakenStatus>>({})
  const [loadingTaken, setLoadingTaken] = useState(false)
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null)
  const [transferPurchaseId, setTransferPurchaseId] = useState<string | null>(null)
  const transferStatus = usePaymentStatus(mpCheckoutUrl ? transferPurchaseId : null)

  // Cuando el polling detecta que la transferencia se confirmó, refrescar la vista
  useEffect(() => {
    if (transferStatus === 'completed') {
      router.refresh()
    }
  }, [transferStatus, router])

  // Cargar el mapa de números tomados al abrir el modal
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingTaken(true)
    fetch(`/api/compra-manual/status?raffleId=${raffle.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const map: Record<number, TakenStatus> = {}
        for (const row of (data.numbers ?? []) as { number: number; status: TakenStatus }[]) {
          map[row.number] = row.status
        }
        setTaken(map)
      })
      .finally(() => { if (!cancelled) setLoadingTaken(false) })
    return () => { cancelled = true }
  }, [open, raffle.id])

  const total = selectedNumbers.length * raffle.price_per_number

  // Agregar números escritos manualmente a la selección (filtrando rango y tomados)
  const handleQuickAdd = useCallback(() => {
    const nums = quickAdd
      .split(/[\s,;]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= raffle.number_range_start && n <= raffle.number_range_end && !taken[n])
    if (nums.length > 0) {
      setSelectedNumbers((prev) => [...new Set([...prev, ...nums])])
    }
    setQuickAdd('')
  }, [quickAdd, raffle.number_range_start, raffle.number_range_end, taken])

  const removeNumber = (num: number) => setSelectedNumbers((prev) => prev.filter((n) => n !== num))

  const isTransferencia = paymentMethod === 'transferencia'

  const parsedAmountPaid = parseFloat(amountPaid)
  const abonoValid = isTransferencia || saleStatus !== 'abonado' || (
    !isNaN(parsedAmountPaid) && parsedAmountPaid > 0 && parsedAmountPaid < total
  )

  const minQty = raffle.min_purchase_quantity ?? 0
  const meetsMinimum = selectedNumbers.length === 0 || selectedNumbers.length >= minQty

  const canSubmit =
    buyerName.trim() &&
    buyerPhone.trim() &&
    selectedNumbers.length > 0 &&
    meetsMinimum &&
    abonoValid &&
    !loading &&
    !loadingTaken

  function handleClose() {
    if (loading) return
    setOpen(false)
    if (success || mpCheckoutUrl) {
      setBuyerName('')
      setBuyerPhone('')
      setBuyerEmail('')
      setSelectedNumbers([])
      setQuickAdd('')
      setPaymentMethod('efectivo')
      setSaleStatus('vendido')
      setAmountPaid('')
      setError(null)
      setSuccess(false)
      setMpCheckoutUrl(null)
      setTransferPurchaseId(null)
      if (mpCheckoutUrl) router.refresh()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    // Transferencia -> generar link de pago de Mercado Pago (igual que en la tienda pública)
    if (isTransferencia) {
      const res = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId: raffle.id,
          selectedNumbers,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim() || undefined,
          sellerRef: sellerId,
        }),
      })
      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        if (data.takenNumbers?.length) {
          setError(`Números ya no disponibles: ${data.takenNumbers.join(', ')}`)
        } else {
          setError(data.error ?? 'Error al generar el link de pago')
        }
        return
      }

      setMpCheckoutUrl(data.checkoutUrl)
      setTransferPurchaseId(data.purchaseId)
      return
    }

    const res = await fetch('/api/compra-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raffleId: raffle.id,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        numbers: selectedNumbers,
        paymentMethod,
        saleStatus,
        amountPaid: saleStatus === 'abonado' ? parsedAmountPaid : undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (data.takenNumbers?.length) {
        setError(`Números ya no disponibles: ${data.takenNumbers.join(', ')}`)
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
        Registrar Boleta
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

          {mpCheckoutUrl ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {transferStatus === 'completed' ? (
                <>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 24px rgba(52,211,153,0.4)' }}
                  >
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>¡Pago confirmado!</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--dash-muted)' }}>
                      Los números ya quedaron marcados como vendidos.
                    </p>
                  </div>
                </>
              ) : transferStatus === 'failed' ? (
                <>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(248,113,113,1)', boxShadow: '0 0 24px rgba(248,113,113,0.4)' }}
                  >
                    <XCircle className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>El pago no se pudo completar</p>
                </>
              ) : (
                <>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: '#009ee3', boxShadow: '0 0 24px rgba(0,158,227,0.4)' }}
                  >
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>Números reservados</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--dash-muted)' }}>
                      {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''} para {buyerName}. Comparte este link para que complete el pago.
                    </p>
                  </div>
                  <a
                    href={mpCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009ee3] px-6 py-3 text-sm font-black text-white transition-colors hover:bg-[#0082c0]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Ir a pagar
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--dash-muted)' }}>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Esperando confirmación del pago...
                  </div>
                  <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                    Los números quedan reservados y se confirmarán automáticamente cuando se complete el pago.
                  </p>
                </>
              )}
              <button
                onClick={handleClose}
                className="mt-1 rounded-xl px-6 py-2 text-sm font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
              >
                Cerrar
              </button>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 24px rgba(52,211,153,0.4)' }}
              >
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <p className="font-bold text-lg" style={{ color: 'var(--dash-text)' }}>Venta registrada</p>
              <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
                {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''} asignado{selectedNumbers.length !== 1 ? 's' : ''} a {buyerName}
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
                {isTransferencia && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--dash-muted)' }}>
                    Se generará un link de pago para que el comprador complete la transacción. Los números quedan reservados mientras tanto.
                  </p>
                )}
              </div>

              {/* Estado de la venta (solo para pagos en efectivo) */}
              {!isTransferencia && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--dash-muted)' }}>
                    Estado de la venta
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SALE_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSaleStatus(s.value)}
                        className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition-all"
                        style={{
                          backgroundColor: saleStatus === s.value ? s.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${saleStatus === s.value ? s.border : 'var(--dash-border)'}`,
                        }}
                      >
                        <s.icon className="h-4 w-4" style={{ color: saleStatus === s.value ? s.color : 'var(--dash-muted)' }} />
                        <span className="text-xs font-bold" style={{ color: saleStatus === s.value ? s.color : 'var(--dash-text)' }}>
                          {s.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--dash-muted)' }}>{s.hint}</span>
                      </button>
                    ))}
                  </div>

                  {saleStatus === 'abonado' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-muted)' }}>
                        Monto abonado <span style={{ color: 'rgba(248,113,113,1)' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={total > 0 ? total - 1 : undefined}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder={`Menor a $${total.toLocaleString('es-CO')}`}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${!abonoValid && amountPaid ? 'rgba(248,113,113,0.6)' : 'var(--dash-border)'}`,
                          color: 'var(--dash-text)',
                        }}
                      />
                      {!abonoValid && amountPaid && (
                        <p className="mt-1 text-xs" style={{ color: 'rgba(248,113,113,1)' }}>
                          Debe ser mayor a 0 y menor al total
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Números */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--dash-muted)' }}>
                  Números <span style={{ color: 'rgba(248,113,113,1)' }}>*</span>
                  {minQty > 0 && (
                    <span className="ml-1 font-normal normal-case" style={{ color: 'var(--dash-muted)' }}>
                      (mínimo {minQty} por venta)
                    </span>
                  )}
                </label>

                {/* Quick add */}
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={quickAdd}
                    onChange={(e) => setQuickAdd(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd() } }}
                    placeholder="Escribe y presiona Enter: 45, 102, 789"
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(167,139,250,1)' }}
                  >
                    Agregar
                  </button>
                </div>

                {/* Selector visual en grid */}
                <NumberPickerGrid
                  rangeStart={raffle.number_range_start}
                  rangeEnd={raffle.number_range_end}
                  selected={selectedNumbers}
                  onChange={setSelectedNumbers}
                  taken={taken}
                  loading={loadingTaken}
                />

                {/* Resumen de seleccionados */}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs" style={{ color: selectedNumbers.length > 0 ? (meetsMinimum ? 'rgba(52,211,153,1)' : 'rgba(248,113,113,1)') : 'var(--dash-muted)' }}>
                    {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''} elegido{selectedNumbers.length !== 1 ? 's' : ''}
                    {selectedNumbers.length > 0 && !meetsMinimum && ` — faltan ${minQty - selectedNumbers.length}`}
                  </p>
                  {selectedNumbers.length > 0 && (
                    <p className="text-xs font-bold" style={{ color: '#22d3ee' }}>
                      Total: ${total.toLocaleString('es-CO')} COP
                    </p>
                  )}
                </div>

                {selectedNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
                    {[...selectedNumbers].sort((a, b) => a - b).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => removeNumber(n)}
                        className="group inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold transition-all"
                        style={{ backgroundColor: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
                      >
                        {n.toString().padStart(5, '0')}
                        <X className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
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
                    background: isTransferencia ? '#009ee3' : 'linear-gradient(135deg, #7c3aed, #6366f1)',
                    boxShadow: canSubmit ? (isTransferencia ? '0 0 16px rgba(0,158,227,0.4)' : '0 0 16px rgba(139,92,246,0.4)') : 'none',
                  }}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {isTransferencia ? 'Generando link...' : 'Registrando...'}</>
                  ) : isTransferencia ? (
                    <><CreditCard className="h-4 w-4" /> Generar Link de Pago</>
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
