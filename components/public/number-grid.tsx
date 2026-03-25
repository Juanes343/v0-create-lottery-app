'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ShoppingCart, X, ChevronLeft, ChevronRight, Sparkles, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRaffleTheme } from '@/lib/themes'
import { CheckoutModal } from './checkout-modal'

interface NumberGridProps {
  raffleId: string
  raffleName: string
  rangeStart: number
  rangeEnd: number
  soldNumbers: Set<number>
  pricePerNumber: number
  currency: string
  whatsappNumber?: string
  paymentInstructions?: string
  themeId?: string
}

const NUMBERS_PER_PAGE = 500

export function NumberGrid({
  raffleId,
  raffleName,
  rangeStart,
  rangeEnd,
  soldNumbers,
  pricePerNumber,
  currency,
  whatsappNumber,
  paymentInstructions,
  themeId,
}: NumberGridProps) {
  const router = useRouter()
  const theme = getRaffleTheme(themeId)
  const [showGrid, setShowGrid] = useState(false)
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const totalNumbers = rangeEnd - rangeStart + 1
  const totalPages = Math.ceil(totalNumbers / NUMBERS_PER_PAGE)

  const numbers = useMemo(() => {
    const start = rangeStart + currentPage * NUMBERS_PER_PAGE
    const end = Math.min(start + NUMBERS_PER_PAGE - 1, rangeEnd)
    const arr: number[] = []
    for (let i = start; i <= end; i++) {
      arr.push(i)
    }
    return arr
  }, [rangeStart, rangeEnd, currentPage])

  const filteredNumbers = useMemo(() => {
    if (!search) return numbers
    return numbers.filter((n) => n.toString().includes(search))
  }, [numbers, search])

  const toggleNumber = (num: number) => {
    if (soldNumbers.has(num)) return
    
    const newSelected = new Set(selectedNumbers)
    if (newSelected.has(num)) {
      newSelected.delete(num)
    } else {
      newSelected.add(num)
    }
    setSelectedNumbers(newSelected)
  }

  const clearSelection = () => {
    setSelectedNumbers(new Set())
  }

  const removeNumber = (num: number) => {
    const newSelected = new Set(selectedNumbers)
    newSelected.delete(num)
    setSelectedNumbers(newSelected)
  }

  const total = selectedNumbers.size * pricePerNumber
  const numberDigits = rangeEnd.toString().length

  const handleCheckoutSuccess = useCallback(() => {
    setSelectedNumbers(new Set())
    router.refresh()
  }, [router])

  const getNumberStatus = (num: number) => {
    if (soldNumbers.has(num)) return 'sold'
    if (selectedNumbers.has(num)) return 'selected'
    return 'available'
  }

  const soldCount = soldNumbers.size
  const availableCount = totalNumbers - soldCount

  if (!showGrid) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ backgroundColor: '#0a0f18', border: `1px solid ${theme.accentText}25` }}
      >
        {/* Grilla de fondo */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${theme.accentText}06 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}06 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow central */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.accentText}12` }}
        />
        <div className="relative flex flex-col items-center gap-6 px-8 py-14 text-center">
          {/* Ícono con glow del tema */}
          <div className="relative">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{
                background: theme.gradient,
                boxShadow: `0 0 32px ${theme.accentText}60, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg"
              style={{ backgroundColor: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
            >
              {availableCount > 999 ? '∞' : availableCount}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1">
            <p className="text-2xl font-black text-white">
              {availableCount.toLocaleString('es-CO')}
              <span className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}> números disponibles</span>
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="font-bold" style={{ color: theme.accentText }}>${pricePerNumber.toLocaleString('es-CO')} {currency}</span> por número
            </p>
          </div>

          {/* Botón principal */}
          <button
            onClick={() => setShowGrid(true)}
            className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-base font-black text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: theme.gradient,
              boxShadow: `0 8px 30px ${theme.accentText}50`,
            }}
          >
            <Sparkles className="h-5 w-5" />
            Seleccionar Número
          </button>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Elige tus favoritos y coordínate por WhatsApp</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-5">
      {/* Number Grid */}
      <div className="space-y-4">

        {/* Stats bar — dark cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Disponibles', value: availableCount.toLocaleString('es-CO'), color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
            { label: 'Vendidos',    value: soldCount.toLocaleString('es-CO'),      color: '#f87171', glow: 'rgba(248,113,113,0.3)' },
            { label: 'Elegidos',   value: selectedNumbers.size.toString(),         color: theme.accentText, glow: `${theme.accentText}50` },
          ].map(({ label, value, color, glow }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: '#0a0f18', border: `1px solid ${color}25` }}
            >
              <div className="pointer-events-none absolute left-1/2 top-0 h-10 w-16 -translate-x-1/2 blur-xl" style={{ backgroundColor: glow }} />
              <p className="relative text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              <p className="relative mt-0.5 text-xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search and Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: `${theme.accentText}70` }} />
            <Input
              placeholder="Buscar numero..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0) }}
              className="pl-10 rounded-xl text-white placeholder:text-white/25 focus-visible:ring-0"
              style={{ backgroundColor: '#0a0f18', border: `1px solid ${theme.accentText}25` }}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[60px] text-center text-sm font-semibold text-gray-600">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-500 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-sm border-2 border-gray-300 bg-white" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold shadow-sm"
            style={{ borderColor: `${theme.progressColor}40`, backgroundColor: `${theme.progressColor}12`, color: theme.progressColor }}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: theme.progressColor }} />
            Seleccionado
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 font-semibold text-rose-400 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-300" />
            Vendido
          </span>
        </div>

        {/* Grid — dark premium */}
        <div
          className="rounded-2xl p-3"
          style={{ backgroundColor: '#0a0f18', border: `1px solid ${theme.accentText}18` }}
        >
          <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 md:grid-cols-12">
            {filteredNumbers.map((num) => {
              const status = getNumberStatus(num)
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={status === 'sold'}
                  title={status === 'sold' ? 'Número vendido' : `Número ${num.toString().padStart(numberDigits, '0')}`}
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-100 sm:text-xs',
                    status === 'available' && 'active:scale-95',
                    status === 'selected' && 'scale-105 text-white active:scale-95',
                    status === 'sold' && 'cursor-not-allowed line-through'
                  )}
                  style={
                    status === 'available'
                      ? { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                      : status === 'selected'
                      ? { backgroundColor: theme.accentText, border: `2px solid ${theme.accentText}`, boxShadow: `0 0 10px ${theme.accentText}60`, color: '#fff' }
                      : { backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)', color: 'rgba(248,113,113,0.35)' }
                  }
                >
                  {num.toString().padStart(numberDigits, '0')}
                  {status === 'sold' && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg pointer-events-none">
                      <span className="h-px w-4/5 rotate-[-30deg] opacity-40" style={{ backgroundColor: '#f87171' }} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {filteredNumbers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron números
            </div>
          )}
        </div>
      </div>

{/* Carrito — dark premium */}
      {selectedNumbers.size > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ backgroundColor: '#0a0f18', border: `1px solid ${theme.accentText}30`, boxShadow: `0 8px 40px ${theme.accentText}20` }}
        >
          {/* Grilla sutil */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${theme.accentText}06 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}06 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Header */}
          <div
            className="relative flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: `1px solid ${theme.accentText}20`, background: `linear-gradient(90deg, ${theme.accentText}15 0%, transparent 60%)` }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: theme.accentText }} />
            <h3 className="font-black text-white">Tu Selección</h3>
            <span
              className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-black"
              style={{ backgroundColor: `${theme.accentText}20`, color: theme.accentText, border: `1px solid ${theme.accentText}30` }}
            >
              {selectedNumbers.size} núm.
            </span>
          </div>

          <div className="relative p-5">
            {/* Chips de números */}
            <div className="mb-4 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {Array.from(selectedNumbers)
                .sort((a, b) => a - b)
                .map((num) => (
                  <button
                    key={num}
                    onClick={() => removeNumber(num)}
                    className="group flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-95"
                    style={{ backgroundColor: `${theme.accentText}18`, color: theme.accentText, border: `1px solid ${theme.accentText}30` }}
                  >
                    {num.toString().padStart(numberDigits, '0')}
                    <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
            </div>

            {/* Resumen + botones */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div
                className="flex gap-6 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {[
                  { label: 'Números',  value: selectedNumbers.size.toString() },
                  { label: 'Precio c/u', value: `$${pricePerNumber.toLocaleString('es-CO')}` },
                  { label: 'Total',    value: `$${total.toLocaleString('es-CO')} ${currency}`, accent: true },
                ].map(({ label, value, accent }) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                    <p className="text-lg font-black" style={{ color: accent ? theme.accentText : 'rgba(255,255,255,0.85)' }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={clearSelection}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Limpiar
                </button>
                <button
                  className="rounded-xl px-8 py-2.5 font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: theme.gradient, boxShadow: `0 4px 20px ${theme.accentText}50` }}
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Continuar al Pago →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

    <CheckoutModal
      isOpen={isCheckoutOpen}
      onClose={() => setIsCheckoutOpen(false)}
      raffleId={raffleId}
      raffleName={raffleName}
      selectedNumbers={Array.from(selectedNumbers).sort((a, b) => a - b)}
      pricePerNumber={pricePerNumber}
      currency={currency}
      whatsappNumber={whatsappNumber}
      paymentInstructions={paymentInstructions}
      onSuccess={handleCheckoutSuccess}
    />
    </>
  )
}
