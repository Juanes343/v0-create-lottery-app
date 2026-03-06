'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Ticket, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PurchaseResult {
  id: string
  numbers_purchased: number[]
  amount_paid: number
  created_at: string
  raffle: {
    id: string
    title: string
    slug: string
    currency: string
    prize_image_url: string | null
    profiles: {
      username: string
    }
  }
}

export default function ConsultarPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PurchaseResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResults(null)

    if (!email && !phone) {
      setError('Ingresa tu correo electronico o telefono')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      let query = supabase
        .from('purchases')
        .select(`
          id,
          numbers_purchased,
          amount_paid,
          created_at,
          raffle:raffles (
            id,
            title,
            slug,
            currency,
            prize_image_url,
            profiles (
              username
            )
          )
        `)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })

      if (email) {
        query = query.eq('buyer_email', email.toLowerCase().trim())
      } else if (phone) {
        query = query.eq('buyer_phone', phone.trim())
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      setResults(data as PurchaseResult[] || [])
    } catch (err) {
      console.error('Search error:', err)
      setError('Error al buscar. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">BonoRifa</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Consulta tus Numeros
            </h1>
            <p className="text-muted-foreground">
              Ingresa tu correo electronico o telefono para ver todos tus numeros comprados
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo electronico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (e.target.value) setPhone('')
                    }}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefono
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (e.target.value) setEmail('')
                    }}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar mis numeros
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {results !== null && (
            <div className="space-y-4">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No encontramos compras con esos datos. Verifica que el correo o telefono sea correcto.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    Tus compras ({results.length})
                  </h2>
                  {results.map((purchase) => (
                    <Card key={purchase.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {purchase.raffle?.title || 'Rifa'}
                            </CardTitle>
                            <CardDescription>
                              Comprado el {new Date(purchase.created_at).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </CardDescription>
                          </div>
                          {purchase.raffle && (
                            <Link
                              href={`/${purchase.raffle.profiles?.username}/${purchase.raffle.slug}`}
                              className="text-sm text-primary hover:underline"
                            >
                              Ver rifa
                            </Link>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            Tus numeros:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {purchase.numbers_purchased.map((num) => (
                              <span
                                key={num}
                                className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground"
                              >
                                {String(num).padStart(5, '0')}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total pagado:</span>
                          <span className="font-semibold">
                            {purchase.raffle?.currency || 'COP'} {purchase.amount_paid.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
