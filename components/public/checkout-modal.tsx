'use client'

import { useState, useEffect } from 'react'
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
import { MessageCircle, Copy, Check, User, Phone, Mail, CreditCard, Loader2, AlertCircle, ArrowLeft, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import { usePaymentStatus } from '@/hooks/use-payment-status'

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
  onSuccess,
}: CheckoutModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [mpLoading, setMpLoading] = useState(false)
  const [mpError, setMpError] = useState<string | null>(null)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  // Congela los números mostrados al pasar a pagar, para que no se vacíen si el padre
  // limpia la selección apenas se confirma el pago (mientras el modal sigue abierto).
  const [numbersSnapshot, setNumbersSnapshot] = useState<number[] | null>(null)
  const step = preferenceId ? 'payment' : 'form'

  const paymentStatus = usePaymentStatus(step === 'payment' ? purchaseId : null)

  const displayNumbers = numbersSnapshot ?? selectedNumbers
  const total = displayNumbers.length * pricePerNumber
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

  const handleContinuarPago = async () => {
    if (!name.trim() || !phone.trim()) return
    setMpLoading(true)
    setMpError(null)
    try {
      // Leer el seller_ref capturado al entrar por el link del vendedor
      const sellerRef = typeof window !== 'undefined'
        ? sessionStorage.getItem('seller_ref') ?? undefined
        : undefined

      const res = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId,
          selectedNumbers,
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
          buyerEmail: email.trim() || undefined,
          sellerRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data.takenNumbers) {
          setMpError(`Los números ${data.takenNumbers.join(', ')} ya no están disponibles. Selecciona otros.`)
        } else {
          setMpError(data.detail || data.error || 'Error al iniciar el pago')
        }
        return
      }
      setPreferenceId(data.preferenceId)
      setCheckoutUrl(data.checkoutUrl)
      setPurchaseId(data.purchaseId)
      setNumbersSnapshot([...selectedNumbers])
    } catch {
      setMpError('Error de conexión. Intenta de nuevo.')
    } finally {
      setMpLoading(false)
    }
  }

  // Cuando el polling detecta que el pago se confirmó, avisar al padre (refresca la grilla)
  useEffect(() => {
    if (paymentStatus === 'completed') {
      onSuccess?.()
    }
  }, [paymentStatus, onSuccess])

  const handleVolver = () => {
    setPreferenceId(null)
    setCheckoutUrl(null)
    setPurchaseId(null)
    setNumbersSnapshot(null)
    setMpError(null)
  }

  const copyNumbers = () => {
    const numbersText = displayNumbers.map(formatNumber).join(', ')
    navigator.clipboard.writeText(numbersText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isFormValid = name.trim() && phone.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'payment' && (
              <button onClick={handleVolver} className="rounded p-1 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {step === 'form' ? 'Reservar Números' : 'Selecciona cómo pagar'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Completa tus datos para reservar los números seleccionados'
              : `Total a pagar: ${formatPrice(total)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen siempre visible */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Números seleccionados</span>
                <Button variant="ghost" size="sm" onClick={copyNumbers}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {displayNumbers.slice(0, 10).map((num) => (
                  <Badge key={num} variant="secondary" className="font-mono">
                    {formatNumber(num)}
                  </Badge>
                ))}
                {displayNumbers.length > 10 && (
                  <Badge variant="outline">+{displayNumbers.length - 10} más</Badge>
                )}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {displayNumbers.length} números × {formatPrice(pricePerNumber)}
                </span>
                <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* PASO 1: Formulario */}
          {step === 'form' && (
            <>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono / WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email (opcional, para recibir confirmación)
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

              {mpError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{mpError}</span>
                </div>
              )}

              <Button
                onClick={handleContinuarPago}
                disabled={!isFormValid || mpLoading}
                className="w-full bg-[#009ee3] hover:bg-[#0082c0] text-white font-black"
                size="lg"
              >
                {mpLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                {mpLoading ? 'Procesando...' : 'Continuar al pago'}
              </Button>

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
            </>
          )}

          {/* PASO 2: Ir a pagar */}
          {step === 'payment' && preferenceId && checkoutUrl && (
            <>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-sm font-semibold text-gray-700">Comprador</p>
                <p className="text-sm text-gray-500">{name} · {phone}{email ? ` · ${email}` : ''}</p>
              </div>

              {paymentStatus === 'completed' ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  <p className="font-black text-emerald-800">¡Pago confirmado!</p>
                  <p className="text-sm text-emerald-700">Tus números ya están asegurados.</p>
                  <Button onClick={onClose} className="mt-1 bg-emerald-600 hover:bg-emerald-700">
                    Listo
                  </Button>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                  <p className="font-black text-red-800">El pago no se pudo completar</p>
                  <Button onClick={handleVolver} variant="outline" className="mt-1">
                    Intentar de nuevo
                  </Button>
                </div>
              ) : (
                <>
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#009ee3] px-6 py-4 text-base font-black text-white hover:bg-[#0082c0] transition-colors"
                  >
                    <CreditCard className="h-5 w-5" />
                    Ir a pagar
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Esperando confirmación del pago...
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Se abrirá la pasarela de pago en una nueva pestaña. Al completar el pago tus números quedan confirmados automáticamente aquí.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
