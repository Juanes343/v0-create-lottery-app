'use client'

import type { NumberPackage } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'
import { Zap, Star } from 'lucide-react'

interface PackageSelectorProps {
  packages: NumberPackage[]
  pricePerNumber: number
  currency: string
  themeId?: string
}

export function PackageSelector({ packages, pricePerNumber, currency, themeId }: PackageSelectorProps) {
  const sorted = [...packages].sort((a, b) => a.quantity - b.quantity)
  const mostPopular = sorted.reduce((best, p) => p.discount_percent > best.discount_percent ? p : best, sorted[0])
  const theme = getRaffleTheme(themeId)

  return (
    <section className="mt-10 overflow-hidden rounded-2xl shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 text-center" style={{ backgroundColor: theme.topBar }}>
        <div className="mb-1 flex items-center justify-center gap-2">
          <Zap className="h-4 w-4" style={{ color: theme.accentText }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accentText }}>Mejor valor</p>
          <Zap className="h-4 w-4" style={{ color: theme.accentText }} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl" style={{ color: theme.topBarText }}>Adquíérelos</h2>
        <p className="mt-1 text-sm" style={{ color: `${theme.topBarText}99` }}>Más números = más posibilidades de ganar</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 lg:divide-x" style={{ backgroundColor: theme.topBar }}>
        {sorted.map((pkg, idx) => {
          const originalPrice = pkg.quantity * pricePerNumber
          const discountedPrice = Math.round(originalPrice * (1 - pkg.discount_percent / 100))
          const savings = originalPrice - discountedPrice
          const isPopular = pkg.id === mostPopular?.id && pkg.discount_percent > 0

          return (
            <div
              key={pkg.id}
              className="relative flex flex-col items-center px-6 py-8 text-center transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: isPopular ? `${theme.progressColor}22` : `${theme.topBar}`,
                boxShadow: isPopular ? `inset 0 0 0 2px ${theme.accentText}50` : 'none',
              }}
            >
              {isPopular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-b-lg px-3 py-0.5" style={{ backgroundColor: theme.accentText }}>
                    <Star className="h-3 w-3" style={{ color: theme.topBar, fill: theme.topBar }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.topBar }}>Más popular</span>
                  </div>
                </div>
              )}

              {/* Cantidad */}
              <div className="mt-2">
                <span className="text-7xl font-black leading-none" style={{ color: theme.topBarText }}>x{pkg.quantity}</span>
              </div>

              {/* Descuento */}
              {pkg.discount_percent > 0 ? (
                <span className="mt-2 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                  {pkg.discount_percent}% OFF
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider" style={{ color: `${theme.topBarText}80` }}>
                  Precio regular
                </span>
              )}

              {/* Precio */}
              <div className="mt-5 space-y-1 w-full overflow-hidden">
                {pkg.discount_percent > 0 && (
                  <p className="text-sm line-through" style={{ color: `${theme.topBarText}50` }}>
                    ${originalPrice.toLocaleString('es-CO')}
                  </p>
                )}
                <p className="text-4xl sm:text-5xl font-black leading-none truncate" style={{ color: theme.accentText }}>
                  ${discountedPrice.toLocaleString('es-CO')}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: `${theme.topBarText}60` }}>{currency}</p>
              </div>

              {savings > 0 && (
                <div className="mt-3 rounded-lg bg-emerald-500/10 px-4 py-1.5">
                  <p className="text-xs font-bold text-emerald-400">Ahorras ${savings.toLocaleString('es-CO')}</p>
                </div>
              )}

              <button
                className="mt-6 w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-95 hover:opacity-90"
                style={isPopular
                  ? { backgroundColor: theme.accentText, color: theme.topBar }
                  : { backgroundColor: 'rgba(255,255,255,0.12)', color: theme.topBarText }
                }
              >
                Comprar Paquete
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}


