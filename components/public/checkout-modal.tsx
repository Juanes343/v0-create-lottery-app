'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Copy, Check, User, Phone, Mail, CreditCard, Loader2, AlertCircle } from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  raffleId: string
  raffleName: string
  selectedNumbers: number[]
  pricePerNumber: number
  currency: string
  whatsappNumber?: string
  paymentInstructions?: string
  onSuccess?: () => void
}

export function CheckoutModal({
  isOpen,
  onClose,
  raffleId,
  raffleName,
  selectedNumbers,
  pricePerNumber,
  currency,
  whatsappNumber,
  paymentInstructions,
}: CheckoutModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [mpLoading, setMpLoading] = useState(false)
  const [mpError, setMpError] = useState<string | null>(null)

  const total = selectedNumbers.length * pricePerNumber
  const numberDigits = 5

  const formatNumber = (num: number) => num.toString().padStart(numberDigits, '0')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const generateWhatsAppMessage = () => {
    const numbersText = selectedNumbers.map(formatNumber).join(', ')
    const message = `Hola! Quiero comprar los siguientes numeros de la rifa "${raffleName}":

Numeros: ${numbersText}
Cantidad: ${selectedNumbers.length} numeros
Total: ${formatPrice(total)}

Mis datos:
Nombre: ${name}
Telefono: ${phone}
${email ? `Email: ${email}` : ''}

Por favor confirmar disponibilidad y metodo de pago.`

    return encodeURIComponent(message)
  }

  const handleWhatsAppClick = () => {
    if (!name || !phone) {
      alert('Por favor completa tu nombre y telefono')
      return
    }
    const digits = whatsappNumber?.replace(/\D/g, '') || ''
    const cleanNumber = digits.startsWith('57') ? digits : `57${digits}`
    const url = `https://wa.me/${cleanNumber}?text=${generateWhatsAppMessage()}`
    window.open(url, '_blank')
  }

  const handleMercadoPago = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Por favor completa tu nombre y teléfono')
      return
    }
    setMpLoading(true)
    setMpError(null)
    try {
      const res = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId,
          selectedNumbers,
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
          buyerEmail: email.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.takenNumbers) {
          setMpError(`Los números ${data.takenNumbers.join(', ')} ya no están disponibles. Por favor selecciona otros.`)
        } else {
          setMpError(data.error || 'Error al iniciar el pago')
        }
        return
      }
      // Redirigir a Mercado Pago
      window.location.href = data.checkoutUrl
    } catch {
      setMpError('Error de conexión. Intenta de nuevo.')
    } finally {
      setMpLoading(false)
    }
  }

  const copyNumbers = () => {
    const numbersText = selectedNumbers.map(formatNumber).join(', ')
    navigator.clipboard.writeText(numbersText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isFormValid = name.trim() && phone.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar Numeros</DialogTitle>
          <DialogDescription>
            Completa tus datos para reservar los numeros seleccionados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Numbers Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Numeros seleccionados</span>
                <Button variant="ghost" size="sm" onClick={copyNumbers}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedNumbers.slice(0, 10).map((num) => (
                  <Badge key={num} variant="secondary" className="font-mono">
                    {formatNumber(num)}
                  </Badge>
                ))}
                {selectedNumbers.length > 10 && (
                  <Badge variant="outline">+{selectedNumbers.length - 10} mas</Badge>
                )}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {selectedNumbers.length} numeros x {formatPrice(pricePerNumber)}
                </span>
                <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre completo *
              </Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefono / WhatsApp *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email (opcional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Instructions */}
          {paymentInstructions && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Instrucciones de pago</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {paymentInstructions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error MP */}
          {mpError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{mpError}</span>
            </div>
          )}

          {/* Botón Mercado Pago */}
          <Button
            onClick={handleMercadoPago}
            disabled={!isFormValid || mpLoading}
            className="w-full bg-[#009ee3] hover:bg-[#0082c0] text-white font-black"
            size="lg"
          >
            {mpLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            {mpLoading ? 'Procesando...' : 'Pagar con Mercado Pago'}
          </Button>

          {/* Botón WhatsApp (secundario) */}
          {whatsappNumber && (
            <Button
              onClick={handleWhatsAppClick}
              disabled={!isFormValid}
              variant="outline"
              className="w-full border-green-600 text-green-700 hover:bg-green-50"
              size="lg"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Coordinar por WhatsApp
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Pago procesado de forma segura por Mercado Pago
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
