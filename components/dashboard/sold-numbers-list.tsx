'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, User } from 'lucide-react'
import { useState } from 'react'
import type { SoldNumber } from '@/lib/types'

interface SoldNumbersListProps {
  numbers: SoldNumber[]
}

export function SoldNumbersList({ numbers }: SoldNumbersListProps) {
  const [search, setSearch] = useState('')

  const filteredNumbers = numbers.filter(
    (n) =>
      n.number.toString().includes(search) ||
      n.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      n.buyer_email.toLowerCase().includes(search.toLowerCase())
  )

  if (numbers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Sin ventas todavia</h3>
          <p className="text-sm text-muted-foreground text-center">
            Los numeros vendidos apareceran aqui
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por numero, nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
          <div>Numero</div>
          <div>Comprador</div>
          <div>Email</div>
          <div>Fecha</div>
        </div>
        <div className="divide-y">
          {filteredNumbers.map((number) => (
            <div key={number.id} className="grid grid-cols-4 gap-4 px-4 py-3 text-sm">
              <div>
                <Badge variant="outline" className="font-mono">
                  {number.number.toString().padStart(5, '0')}
                </Badge>
              </div>
              <div className="truncate">{number.buyer_name}</div>
              <div className="truncate text-muted-foreground">
                {number.buyer_email}
              </div>
              <div className="text-muted-foreground">
                {new Date(number.created_at).toLocaleDateString('es-CO')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Mostrando {filteredNumbers.length} de {numbers.length} numeros
      </p>
    </div>
  )
}
