'use client'

import type { NumberPackage } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'
import { Zap, Star } from 'lucide-react'
import Tilt from 'react-parallax-tilt'

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

  // Variantes de color intercaladas usando la misma paleta del tema
  const cardVariants = [
    {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      shadow: '0 4px 16px rgba(0,0,0,0.5)',
      btnBg: 'rgba(255,255,255,0.08)',
      btnColor: 'rgba(255,255,255,0.75)',
    },
    {
      bg: `${theme.accentText}12`,
      border: `${theme.accentText}35`,
      shadow: `0 6px 24px ${theme.accentText}20`,
      btnBg: `${theme.accentText}25`,
      btnColor: theme.accentText,
    },
    {
      bg: 'rgba(255,255,255,0.03)',
      border: `${theme.accentText}20`,
      shadow: `0 4px 16px rgba(0,0,0,0.4)`,
      btnBg: `${theme.accentText}15`,
      btnColor: theme.accentText,
    },
  ]

  return (
    <section className="relative mt-10 overflow-hidden rounded-2xl shadow-xl" style={{ backgroundColor: '#080d14', border: `1px solid ${theme.accentText}15` }}>
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-5 text-center" style={{ backgroundColor: '#0a0f18', borderBottom: `1px solid ${theme.accentText}15` }}>
        {/* Grilla del tema */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${theme.accentText}07 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}07 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow central */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ backgroundColor: `${theme.accentText}10` }} />
        <div className="relative">
          <div className="mb-1 flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" style={{ color: theme.accentText }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accentText }}>Mejor valor</p>
            <Zap className="h-4 w-4" style={{ color: theme.accentText }} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Adquíérelos</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Más números = más posibilidades de ganar</p>
        </div>
      </div>

      {/* Cards */}
      <div
        className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3"
        style={{ backgroundColor: '#080d14' }}
      >
        {sorted.map((pkg, idx) => {
          const originalPrice = pkg.quantity * pricePerNumber
          const discountedPrice = Math.round(originalPrice * (1 - pkg.discount_percent / 100))
          const savings = originalPrice - discountedPrice
          const isPopular = pkg.id === mostPopular?.id && pkg.discount_percent > 0
          const variant = cardVariants[idx % cardVariants.length]

          return (
            <Tilt key={pkg.id} tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="h-full">
              <div
                className="relative flex h-full flex-col items-center justify-between rounded-2xl px-6 py-8 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  backgroundColor: isPopular ? `${theme.progressColor}30` : variant.bg,
                  border: isPopular ? `2px solid ${theme.accentText}80` : `2px solid ${variant.border}`,
                  boxShadow: isPopular ? `0 8px 32px ${theme.accentText}35` : variant.shadow,
                }}
              >
                <div className="flex flex-col items-center w-full">
                  {isPopular && (
                    <div className="absolute -top-[2px] left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 rounded-b-lg px-3 py-1" style={{ backgroundColor: theme.accentText }}>
                        <Star className="h-3 w-3" style={{ color: theme.topBar, fill: theme.topBar }} />
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.topBar }}>Más popular</span>
                      </div>
                    </div>
                  )}

                  {/* Cantidad */}
                  <div className="mt-2 text-center">
                    <span className="text-7xl font-black leading-none text-white drop-shadow-md">x{pkg.quantity}</span>
                  </div>

                  {/* Descuento */}
                  {pkg.discount_percent > 0 ? (
                    <span className="mt-4 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      {pkg.discount_percent}% OFF
                    </span>
                  ) : (
                    <span className="mt-4 inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider border border-white/10" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Precio regular
                    </span>
                  )}

                  {/* Precio */}
                  <div className="mt-5 space-y-1 w-full overflow-hidden">
                    {pkg.discount_percent > 0 && (
                      <p className="text-sm line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        ${originalPrice.toLocaleString('es-CO')}
                      </p>
                    )}
                    <p className="text-4xl sm:text-5xl font-black leading-none truncate drop-shadow-lg" style={{ color: theme.accentText }}>
                      ${discountedPrice.toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{currency}</p>
                  </div>

                  {savings > 0 && (
                    <div className="mt-3 w-full rounded-lg bg-emerald-500/10 px-4 py-2 border border-emerald-500/20">
                      <p className="text-xs font-bold text-emerald-400">Ahorras ${savings.toLocaleString('es-CO')}</p>
                    </div>
                  )}
                </div>

                <button
                  className="mt-6 w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-95 hover:opacity-90 shadow-lg"
                  style={isPopular
                    ? { backgroundColor: theme.accentText, color: theme.topBar, boxShadow: `0 4px 20px ${theme.accentText}40` }
                    : { backgroundColor: variant.btnBg, color: variant.btnColor }
                  }
                >
                  Comprar Paquete
                </button>
              </div>
            </Tilt>
          )
        })}
      </div>
    </section>
  )
}


