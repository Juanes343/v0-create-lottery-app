'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { X, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { startRaffleCheckoutSession } from '@/app/actions/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  raffleId: string
  raffleName: string
  selectedNumbers: number[]
  pricePerNumber: number
  currency: string
  onSuccess: () => void
}

export function CheckoutModal({
  isOpen,
  onClose,
  raffleId,
  raffleName,
  selectedNumbers,
  pricePerNumber,
  currency,
  onSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = selectedNumbers.length * pricePerNumber

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone) {
      setError('Por favor complete todos los campos')
      return
    }
    
    setStep('payment')
  }

  const fetchClientSecret = useCallback(async () => {
    try {
      const clientSecret = await startRaffleCheckoutSession({
        raffleId,
        numbers: selectedNumbers,
        buyerEmail: buyerInfo.email,
        buyerName: buyerInfo.name,
        buyerPhone: buyerInfo.phone,
        pricePerNumber,
        raffleName,
        currency,
      })
      return clientSecret
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
      setStep('form')
      throw err
    }
  }, [raffleId, selectedNumbers, buyerInfo, pricePerNumber, raffleName, currency])

  const handleComplete = useCallback(() => {
    onSuccess()
    onClose()
  }, [onSuccess, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Finalizar Compra</h2>
            <p className="text-sm text-muted-foreground">
              {selectedNumbers.length} numero(s) seleccionado(s)
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="font-semibold mb-2">Resumen de tu compra</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                    >
                      {String(num).padStart(5, '0')}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {currency} {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Tus datos</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={buyerInfo.name}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                    placeholder="Juan Perez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={buyerInfo.email}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono / WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={buyerInfo.phone}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Continuar al pago'
                )}
              </Button>
            </form>
          ) : (
            <div className="min-h-[400px]">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  fetchClientSecret,
                  onComplete: handleComplete,
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
