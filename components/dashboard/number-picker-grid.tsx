'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TakenStatus = 'paid' | 'reserved' | 'partial' | 'pending' | 'cancelled'

interface NumberPickerGridProps {
  rangeStart: number
  rangeEnd: number
  selected: number[]
  onChange: (numbers: number[]) => void
  taken: Record<number, TakenStatus>
  loading?: boolean
}

const NUMBERS_PER_PAGE = 500

const STATUS_STYLE: Record<TakenStatus, { bg: string; border: string; color: string }> = {
  paid:      { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', color: 'rgba(248,113,113,1)' },
  reserved:  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  color: 'rgba(251,191,36,1)'  },
  partial:   { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  color: 'rgba(167,139,250,1)' },
  pending:   { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)', color: 'rgba(148,163,184,1)' },
  cancelled: { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)', color: 'rgba(148,163,184,1)' },
}

export function NumberPickerGrid({ rangeStart, rangeEnd, selected, onChange, taken, loading = false }: NumberPickerGridProps) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  const totalNumbers = rangeEnd - rangeStart + 1
  const totalPages = Math.ceil(totalNumbers / NUMBERS_PER_PAGE)

  const pageNumbers = useMemo(() => {
    const start = rangeStart + currentPage * NUMBERS_PER_PAGE
    const end = Math.min(start + NUMBERS_PER_PAGE - 1, rangeEnd)
    const arr: number[] = []
    for (let i = start; i <= end; i++) arr.push(i)
    return arr
  }, [rangeStart, rangeEnd, currentPage])

  const filteredNumbers = useMemo(() => {
    if (!search) return pageNumbers
    return pageNumbers.filter(n => n.toString().includes(search))
  }, [pageNumbers, search])

  const numberDigits = rangeEnd.toString().length
  const selectedSet = new Set(selected)

  const toggleNumber = (num: number) => {
    if (taken[num]) return
    if (selectedSet.has(num)) {
      onChange(selected.filter(n => n !== num))
    } else {
      onChange([...selected, num])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--dash-muted)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(0) }}
            placeholder="Buscar numero..."
            className="w-full rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}
          />
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--dash-muted)' }}>
            <button type="button" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="rounded p-1 disabled:opacity-30">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {currentPage + 1} / {totalPages}
            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="rounded p-1 disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="flex items-center gap-1" style={{ color: 'var(--dash-muted)' }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--dash-border)' }} /> Disponible
        </span>
        <span className="flex items-center gap-1" style={{ color: '#22d3ee' }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#22d3ee' }} /> Elegido
        </span>
        <span className="flex items-center gap-1" style={{ color: STATUS_STYLE.paid.color }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_STYLE.paid.color }} /> Vendido
        </span>
        <span className="flex items-center gap-1" style={{ color: STATUS_STYLE.reserved.color }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_STYLE.reserved.color }} /> Separado
        </span>
        <span className="flex items-center gap-1" style={{ color: STATUS_STYLE.partial.color }}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_STYLE.partial.color }} /> Abonado
        </span>
      </div>

      {/* Grid */}
      <div
        className="max-h-64 overflow-y-auto rounded-xl p-2"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dash-border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: 'var(--dash-muted)' }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando números...
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
            {filteredNumbers.map(num => {
              const status = taken[num]
              const isSelected = selectedSet.has(num)
              const style = status
                ? STATUS_STYLE[status]
                : isSelected
                  ? { bg: '#22d3ee', border: '#22d3ee', color: '#fff' }
                  : { bg: 'rgba(255,255,255,0.05)', border: 'var(--dash-border)', color: 'var(--dash-muted)' }
              return (
                <button
                  key={num}
                  type="button"
                  disabled={!!status}
                  onClick={() => toggleNumber(num)}
                  title={status ? `Número ${status}` : `Número ${num}`}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md text-[10px] font-bold transition-all',
                    !status && 'active:scale-95',
                    !!status && 'cursor-not-allowed line-through'
                  )}
                  style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, color: style.color }}
                >
                  {num.toString().padStart(numberDigits, '0')}
                </button>
              )
            })}
            {filteredNumbers.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs" style={{ color: 'var(--dash-muted)' }}>
                No se encontraron números
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
