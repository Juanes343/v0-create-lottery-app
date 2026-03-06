'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NumberGridProps {
  raffleId: string
  rangeStart: number
  rangeEnd: number
  soldNumbers: Set<number>
  pricePerNumber: number
  currency: string
}

const NUMBERS_PER_PAGE = 500

export function NumberGrid({
  raffleId,
  rangeStart,
  rangeEnd,
  soldNumbers,
  pricePerNumber,
  currency,
}: NumberGridProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

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

  const getNumberStatus = (num: number) => {
    if (soldNumbers.has(num)) return 'sold'
    if (selectedNumbers.has(num)) return 'selected'
    return 'available'
  }

  return (
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
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-accent bg-accent/20" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary" />
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-destructive/30" />
            <span>Vendido</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-10">
          {filteredNumbers.map((num) => {
            const status = getNumberStatus(num)
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={status === 'sold'}
                className={cn(
                  'aspect-square rounded-lg border-2 text-xs font-medium transition-all sm:text-sm',
                  status === 'available' && 'border-accent bg-accent/10 hover:bg-accent/20 text-foreground',
                  status === 'selected' && 'border-primary bg-primary text-primary-foreground',
                  status === 'sold' && 'border-destructive/30 bg-destructive/10 text-destructive/50 cursor-not-allowed'
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

      {/* Cart Sidebar */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Tu Seleccion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNumbers.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Selecciona numeros para comprar
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {Array.from(selectedNumbers)
                    .sort((a, b) => a - b)
                    .map((num) => (
                      <Badge
                        key={num}
                        variant="secondary"
                        className="gap-1 font-mono"
                      >
                        {num.toString().padStart(numberDigits, '0')}
                        <button
                          onClick={() => removeNumber(num)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cantidad:</span>
                    <span className="font-medium">{selectedNumbers.size} numeros</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Precio unitario:</span>
                    <span>${pricePerNumber.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      ${total.toLocaleString('es-CO')} {currency}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link
                      href={`/checkout/${raffleId}?numbers=${Array.from(selectedNumbers).join(',')}`}
                    >
                      Continuar al Pago
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={clearSelection} className="w-full">
                    Limpiar Seleccion
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
