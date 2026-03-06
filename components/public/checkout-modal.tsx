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
import { MessageCircle, Copy, Check, User, Phone, Mail } from 'lucide-react'

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
    const cleanNumber = whatsappNumber?.replace(/\D/g, '') || ''
    const url = `https://wa.me/${cleanNumber}?text=${generateWhatsAppMessage()}`
    window.open(url, '_blank')
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

          {/* WhatsApp Button */}
          {whatsappNumber ? (
            <Button
              onClick={handleWhatsAppClick}
              disabled={!isFormValid}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contactar por WhatsApp
            </Button>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              El organizador no ha configurado WhatsApp. Contactalo directamente.
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Al contactar, el organizador verificara disponibilidad y te indicara como realizar el
            pago
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
