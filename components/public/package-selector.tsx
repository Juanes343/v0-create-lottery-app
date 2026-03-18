'use client'

import type { NumberPackage } from '@/lib/types'
import { Zap, Star } from 'lucide-react'

interface PackageSelectorProps {
  packages: NumberPackage[]
  pricePerNumber: number
  currency: string
}

export function PackageSelector({ packages, pricePerNumber, currency }: PackageSelectorProps) {
  const sorted = [...packages].sort((a, b) => a.quantity - b.quantity)
  const mostPopular = sorted.reduce((best, p) => p.discount_percent > best.discount_percent ? p : best, sorted[0])

  return (
    <section className="mt-10 overflow-hidden rounded-2xl shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-6 py-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Mejor valor</p>
          <Zap className="h-4 w-4 text-yellow-400" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Adquiérelos</h2>
        <p className="mt-1 text-sm text-gray-400">Más números = más posibilidades de ganar</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 divide-y divide-gray-700 bg-gray-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 lg:divide-x">
        {sorted.map((pkg, idx) => {
          const originalPrice = pkg.quantity * pricePerNumber
          const discountedPrice = Math.round(originalPrice * (1 - pkg.discount_percent / 100))
          const savings = originalPrice - discountedPrice
          const isPopular = pkg.id === mostPopular?.id && pkg.discount_percent > 0
          const gradients = [
            'from-slate-800 to-slate-900',
            'from-gray-800 to-gray-900',
            'from-zinc-800 to-zinc-900',
          ]

          return (
            <div
              key={pkg.id}
              className={`relative flex flex-col items-center bg-gradient-to-b ${
                isPopular ? 'from-gray-700 to-gray-900 ring-2 ring-inset ring-yellow-400/40' : gradients[idx % 3]
              } px-6 py-8 text-center transition-transform hover:-translate-y-0.5`}
            >
              {isPopular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-b-lg bg-yellow-400 px-3 py-0.5">
                    <Star className="h-3 w-3 fill-gray-900 text-gray-900" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">Más popular</span>
                  </div>
                </div>
              )}

              {/* Cantidad */}
              <div className="mt-2">
                <span className="text-7xl font-black leading-none text-white">x{pkg.quantity}</span>
              </div>

              {/* Descuento */}
              {pkg.discount_percent > 0 ? (
                <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                  {pkg.discount_percent}% OFF
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center rounded-full bg-gray-700 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Precio regular
                </span>
              )}

              {/* Precio */}
              <div className="mt-5 space-y-1 w-full overflow-hidden">
                {pkg.discount_percent > 0 && (
                  <p className="text-sm text-gray-500 line-through">
                    ${originalPrice.toLocaleString('es-CO')}
                  </p>
                )}
                <p className="text-4xl sm:text-5xl font-black leading-none text-yellow-400 truncate">
                  ${discountedPrice.toLocaleString('es-CO')}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{currency}</p>
              </div>

              {savings > 0 && (
                <div className="mt-3 rounded-lg bg-emerald-500/10 px-4 py-1.5">
                  <p className="text-xs font-bold text-emerald-400">Ahorras ${savings.toLocaleString('es-CO')}</p>
                </div>
              )}

              <button className={`mt-6 w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-95 ${
                isPopular
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-lg shadow-yellow-400/20'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}>
                Comprar Paquete
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}


