'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ShoppingCart, X, ChevronLeft, ChevronRight, Sparkles, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
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
}: NumberGridProps) {
  const router = useRouter()
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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 shadow-lg">
        <div className="flex flex-col items-center gap-5 px-8 py-14 text-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-200">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow">
              {availableCount}
            </div>
          </div>
          <div>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-bold text-violet-600">{availableCount.toLocaleString('es-CO')} números disponibles</span>
              {' '}·{' '}
              <span className="font-bold text-gray-700">${pricePerNumber.toLocaleString('es-CO')} {currency}</span> cada uno
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowGrid(true)}
            className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-10 py-6 text-base font-black text-white shadow-xl shadow-violet-200 transition-all hover:from-violet-500 hover:to-purple-500 hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-5 w-5" />
            Seleccionar Número
          </Button>
          <p className="text-xs text-gray-400">Elige tus favoritos y coordínate por WhatsApp</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Number Grid */}
      <div className="space-y-4">
        {/* Search and Pagination */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar numero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
            <div className="h-3 w-3 rounded border-2 border-emerald-500 bg-emerald-100" />
            Disponible
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 font-medium text-violet-700">
            <div className="h-3 w-3 rounded bg-violet-600" />
            Seleccionado
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-400">
            <div className="h-3 w-3 rounded bg-rose-300" />
            Vendido
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
          {filteredNumbers.map((num) => {
            const status = getNumberStatus(num)
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={status === 'sold'}
                className={cn(
                  'aspect-square rounded-lg border-2 text-xs font-bold transition-all duration-150 sm:text-sm',
                  status === 'available' && 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 hover:scale-110 active:scale-95',
                  status === 'selected' && 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200 scale-105',
                  status === 'sold' && 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
                )}
              >
                {num.toString().padStart(numberDigits, '0')}
              </button>
            )
          })}
        </div>

        {filteredNumbers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No se encontraron numeros
          </div>
        )}
      </div>

      {/* Cart Sidebar — solo desktop */}
      <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-white" />
              <h3 className="font-black text-white">Tu Selección</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {selectedNumbers.size === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <ShoppingCart className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Selecciona números<br/>para comprar</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                  {Array.from(selectedNumbers)
                    .sort((a, b) => a - b)
                    .map((num) => (
                      <button
                        key={num}
                        onClick={() => removeNumber(num)}
                        className="group flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700 transition-colors hover:bg-rose-100 hover:text-rose-600"
                      >
                        {num.toString().padStart(numberDigits, '0')}
                        <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                </div>

                <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Números:</span>
                    <span className="font-semibold text-gray-700">{selectedNumbers.size}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Precio c/u:</span>
                    <span className="font-semibold text-gray-700">${pricePerNumber.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-black">
                    <span>Total:</span>
                    <span className="text-violet-600">${total.toLocaleString('es-CO')} {currency}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-5 font-black text-white shadow-lg shadow-violet-200 hover:from-violet-500 hover:to-purple-500"
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    Continuar al Pago
                  </Button>
                  <Button variant="outline" onClick={clearSelection} className="w-full rounded-xl text-xs">
                    Limpiar selección
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>

    {/* Barra flotante móvil */}
    {selectedNumbers.size > 0 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-violet-500/30 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 shadow-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-tight">
              {selectedNumbers.size} número{selectedNumbers.size !== 1 ? 's' : ''} seleccionado{selectedNumbers.size !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold text-violet-200">
              Total: ${total.toLocaleString('es-CO')} {currency}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-9 px-3 text-white/70 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setIsCheckoutOpen(true)} className="h-9 gap-1.5 rounded-xl bg-white font-black text-violet-700 hover:bg-violet-50">
              <ShoppingCart className="h-4 w-4" />
              Pagar
            </Button>
          </div>
        </div>
      </div>
    )}

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
