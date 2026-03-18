'use client'

import type { NumberPackage } from '@/lib/types'
import { Check } from 'lucide-react'

interface PackageSelectorProps {
  packages: NumberPackage[]
  pricePerNumber: number
  currency: string
}

export function PackageSelector({ packages, pricePerNumber, currency }: PackageSelectorProps) {
  const sorted = [...packages].sort((a, b) => a.quantity - b.quantity)
  const mostPopular = sorted.reduce(
    (best, p) => (p.discount_percent > best.discount_percent ? p : best),
    sorted[0]
  )

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Paquetes disponibles</h2>
        <p className="mt-1 text-sm text-gray-500">
          Compra más números y aumenta tus posibilidades
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((pkg) => {
          const originalPrice = pkg.quantity * pricePerNumber
          const discountedPrice = Math.round(originalPrice * (1 - pkg.discount_percent / 100))
          const savings = originalPrice - discountedPrice
          const isRecommended = pkg.id === mostPopular?.id && pkg.discount_percent > 0

          return (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-xl border bg-white p-6 transition-all ${
                isRecommended
                  ? 'border-gray-900 shadow-sm ring-1 ring-gray-900/5'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white">
                    <Check className="h-3 w-3" />
                    Recomendado
                  </span>
                </div>
              )}

              <div className="mb-3 mt-1">
                <p className="text-4xl font-bold text-gray-900">×{pkg.quantity}</p>
                <p className="text-sm text-gray-400">números</p>
              </div>

              {pkg.discount_percent > 0 && (
                <span className="mb-4 inline-flex w-fit items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {pkg.discount_percent}% de descuento
                </span>
              )}

              <div className="mt-auto pt-4 border-t border-gray-100">
                {pkg.discount_percent > 0 && (
                  <p className="text-xs text-gray-400 line-through mb-0.5">
                    ${originalPrice.toLocaleString('es-CO')} {currency}
                  </p>
                )}
                <p className="text-2xl font-bold text-gray-900">
                  ${discountedPrice.toLocaleString('es-CO')}
                  <span className="ml-1 text-sm font-normal text-gray-400">{currency}</span>
                </p>
                {savings > 0 && (
                  <p className="mt-0.5 text-xs text-emerald-600 font-medium">
                    Ahorras ${savings.toLocaleString('es-CO')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-5 text-center text-xs text-gray-400">
        Selecciona tus números en la grilla y coordina el pago por WhatsApp
      </p>
    </section>
  )
}


