'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket } from 'lucide-react'
import type { NumberPackage } from '@/lib/types'

interface PackageSelectorProps {
  packages: NumberPackage[]
  pricePerNumber: number
  currency: string
}

export function PackageSelector({
  packages,
  pricePerNumber,
  currency,
}: PackageSelectorProps) {
  return (
    <section className="mt-12">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">Paquetes Disponibles</h2>
        <p className="text-muted-foreground">
          Compra paquetes de numeros con descuento
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const originalPrice = pkg.quantity * pricePerNumber
          const discountedPrice = originalPrice * (1 - pkg.discount_percentage / 100)
          const savings = originalPrice - discountedPrice

          return (
            <Card
              key={pkg.id}
              className="relative overflow-hidden transition-shadow hover:shadow-lg"
            >
              {pkg.discount_percentage > 0 && (
                <Badge className="absolute right-2 top-2 bg-accent text-accent-foreground">
                  -{pkg.discount_percentage}%
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  {pkg.quantity} Numeros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  {pkg.discount_percentage > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      ${originalPrice.toLocaleString('es-CO')} {currency}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-primary">
                    ${discountedPrice.toLocaleString('es-CO')}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      {currency}
                    </span>
                  </p>
                  {savings > 0 && (
                    <p className="text-sm text-accent">
                      Ahorras ${savings.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
                <Button className="w-full">
                  Comprar Paquete
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
