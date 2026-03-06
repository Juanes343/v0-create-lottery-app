'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X, ImageIcon, MessageCircle } from 'lucide-react'
import type { Raffle } from '@/lib/types'

interface RaffleFormProps {
  raffle?: Raffle
  userId: string
}

export function RaffleForm({ raffle, userId }: RaffleFormProps) {
  const router = useRouter()
  const isEditing = !!raffle

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(raffle?.title || '')
  const [slug, setSlug] = useState(raffle?.slug || '')
  const [description, setDescription] = useState(raffle?.description || '')
  const [prizeDescription, setPrizeDescription] = useState(raffle?.prize_description || '')
  const [images, setImages] = useState<string[]>(raffle?.images || [])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [numberRangeStart, setNumberRangeStart] = useState(raffle?.number_range_start || 0)
  const [numberRangeEnd, setNumberRangeEnd] = useState(raffle?.number_range_end || 99999)
  const [pricePerNumber, setPricePerNumber] = useState(raffle?.price_per_number || 2000)
  const [currency] = useState(raffle?.currency || 'COP')
  const [status, setStatus] = useState(raffle?.status || 'draft')
  const [drawDate, setDrawDate] = useState(raffle?.draw_date || '')
  const [whatsappNumber, setWhatsappNumber] = useState(raffle?.whatsapp_number || '')
  const [paymentInstructions, setPaymentInstructions] = useState(raffle?.payment_instructions || '')

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!isEditing) {
      setSlug(generateSlug(value))
    }
  }

  const addImage = () => {
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl])
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const raffleData = {
      user_id: userId,
      slug,
      title,
      description,
      prize_description: prizeDescription,
      images,
      number_range_start: numberRangeStart,
      number_range_end: numberRangeEnd,
      price_per_number: pricePerNumber,
      currency,
      status,
      draw_date: drawDate || null,
      whatsapp_number: whatsappNumber || null,
      payment_instructions: paymentInstructions || null,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('raffles')
          .update(raffleData)
          .eq('id', raffle.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('raffles')
          .insert(raffleData)

        if (error) throw error
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrio un error')
    } finally {
      setIsLoading(false)
    }
  }

  const totalNumbers = numberRangeEnd - numberRangeStart + 1
  const potentialRevenue = totalNumbers * pricePerNumber

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion Basica</CardTitle>
            <CardDescription>
              Datos principales de tu rifa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo de la Rifa</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej: Moto Yamaha MT-09"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL (slug)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="moto-yamaha-mt09"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tu rifa estara en: /tu-username/{slug}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripcion adicional de la rifa..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize">Descripcion del Premio</Label>
              <Textarea
                id="prize"
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
                placeholder="Ej: Moto Yamaha MT-09 2024, color azul..."
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draw-date">Fecha del Sorteo (opcional)</Label>
              <Input
                id="draw-date"
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(value: 'draft' | 'active' | 'completed' | 'cancelled') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Numbers & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Numeros y Precios</CardTitle>
            <CardDescription>
              Configura el rango de numeros y precio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="range-start">Numero Inicial</Label>
                <Input
                  id="range-start"
                  type="number"
                  min={0}
                  value={numberRangeStart}
                  onChange={(e) => setNumberRangeStart(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-end">Numero Final</Label>
                <Input
                  id="range-end"
                  type="number"
                  min={numberRangeStart + 1}
                  value={numberRangeEnd}
                  onChange={(e) => setNumberRangeEnd(parseInt(e.target.value) || 99999)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio por Numero (COP)</Label>
              <Input
                id="price"
                type="number"
                min={100}
                step={100}
                value={pricePerNumber}
                onChange={(e) => setPricePerNumber(parseInt(e.target.value) || 2000)}
                required
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total de numeros:</span>
                <span className="font-medium">{totalNumbers.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ingreso potencial:</span>
                <span className="font-medium text-accent">
                  ${potentialRevenue.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Contacto y Pagos
            </CardTitle>
            <CardDescription>
              Configura como los compradores te contactaran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Numero de WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="573001234567"
              />
              <p className="text-xs text-muted-foreground">
                Incluye el codigo de pais sin el signo +. Ej: 573001234567
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-instructions">Instrucciones de Pago</Label>
              <Textarea
                id="payment-instructions"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Ej: Puedes pagar por Nequi al 300-123-4567 o transferencia Bancolombia cuenta 123-456789-00"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Estas instrucciones se mostraran al comprador antes de contactarte
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Imagenes</CardTitle>
          <CardDescription>
            Agrega URLs de imagenes para tu rifa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
            <Button type="button" onClick={addImage} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((url, index) => (
                <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No hay imagenes agregadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar Cambios' : 'Crear Rifa'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
