'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X, ImageIcon, MessageCircle, Trophy, Pencil, Check, Palette } from 'lucide-react'
import type { Raffle, AdditionalPrize } from '@/lib/types'
import { RAFFLE_THEMES } from '@/lib/themes'

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
  const [additionalPrizes, setAdditionalPrizes] = useState<AdditionalPrize[]>(
    raffle?.additional_prizes || []
  )
  const [prizesTitle, setPrizesTitle] = useState(raffle?.prizes_title || '')
  const [theme, setTheme] = useState(raffle?.theme || 'default')
  const [newPrizeDescription, setNewPrizeDescription] = useState('')
  const [newPrizeImageUrl, setNewPrizeImageUrl] = useState('')
  const [editingPrizeIndex, setEditingPrizeIndex] = useState<number | null>(null)
  const [editPrizeDescription, setEditPrizeDescription] = useState('')
  const [editPrizeImageUrl, setEditPrizeImageUrl] = useState('')

  // Paquetes
  interface PkgInput { quantity: number; discount: number }
  const [packages, setPackages] = useState<PkgInput[]>([])
  const [newPkgQty, setNewPkgQty] = useState('')
  const [newPkgDiscount, setNewPkgDiscount] = useState('0')

  useEffect(() => {
    if (!raffle?.id) return
    const supabase = createClient()
    supabase
      .from('number_packages')
      .select('quantity, discount_percent')
      .eq('raffle_id', raffle.id)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setPackages(data.map((p) => ({ quantity: p.quantity, discount: p.discount_percent })))
      })
  }, [raffle?.id])

  const addPackage = () => {
    const qty = parseInt(newPkgQty)
    const disc = parseInt(newPkgDiscount) || 0
    if (!qty || qty < 1) return
    if (packages.some((p) => p.quantity === qty)) return
    setPackages([...packages, { quantity: qty, discount: disc }].sort((a, b) => a.quantity - b.quantity))
    setNewPkgQty('')
    setNewPkgDiscount('0')
  }

  const removePackage = (qty: number) => {
    setPackages(packages.filter((p) => p.quantity !== qty))
  }

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

  const addAdditionalPrize = () => {
    if (newPrizeDescription.trim()) {
      setAdditionalPrizes([
        ...additionalPrizes,
        {
          position: additionalPrizes.length + 2,
          description: newPrizeDescription.trim(),
          image_url: newPrizeImageUrl.trim() || undefined,
        },
      ])
      setNewPrizeDescription('')
      setNewPrizeImageUrl('')
    }
  }

  const removeAdditionalPrize = (index: number) => {
    const updated = additionalPrizes
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i + 2 }))
    setAdditionalPrizes(updated)
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
      additional_prizes: additionalPrizes.length > 0 ? additionalPrizes : null,
      prizes_title: prizesTitle.trim() || null,
      theme: theme || 'default',
    }

    try {
      let raffleId: string

      if (isEditing) {
        const { error } = await supabase
          .from('raffles')
          .update(raffleData)
          .eq('id', raffle.id)
        if (error) throw error
        raffleId = raffle.id
      } else {
        const { data: newRaffle, error } = await supabase
          .from('raffles')
          .insert(raffleData)
          .select('id')
          .single()
        if (error) throw error
        raffleId = newRaffle.id
      }

      // Sincronizar paquetes
      await supabase.from('number_packages').delete().eq('raffle_id', raffleId)
      if (packages.length > 0) {
        const { error: pkgError } = await supabase.from('number_packages').insert(
          packages.map((p) => ({
            raffle_id: raffleId,
            quantity: p.quantity,
            discount_percent: p.discount,
            is_active: true,
          }))
        )
        if (pkgError) throw pkgError
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

      {/* Tema y Estilo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema y Estilo
          </CardTitle>
          <CardDescription>
            Elige la paleta de colores para la página pública de tu rifa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Panel de fondo para que las tarjetas resalten */}
          <div className="rounded-2xl bg-zinc-950 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {RAFFLE_THEMES.map((t) => {
                const isSelected = theme === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    style={{
                      background: t.gradient,
                      boxShadow: isSelected
                        ? `0 0 0 2px #18181b, 0 0 0 4px ${t.preview[0]}, 0 16px 40px -8px ${t.preview[0]}99`
                        : `0 4px 18px -4px ${t.preview[0]}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      transform: isSelected ? 'translateY(-5px) scale(1.04)' : undefined,
                      transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease',
                    }}
                    className="group relative overflow-hidden rounded-2xl text-left hover:scale-[1.04] hover:-translate-y-1"
                  >
                    {/* Brillo superior (simula glossy/3D) */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)',
                      }}
                    />
                    {/* Sombra interna inferior (profundidad) */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      style={{
                        boxShadow: 'inset 0 -3px 10px rgba(0,0,0,0.35)',
                      }}
                    />

                    <div className="relative flex h-[88px] flex-col justify-between p-3">
                      {/* Nombre + check */}
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className="text-[10px] font-black uppercase leading-tight tracking-wider drop-shadow"
                          style={{ color: t.topBarText }}
                        >
                          {t.name}
                        </span>
                        {isSelected && (
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-md"
                            style={{ backgroundColor: t.topBarText, color: t.topBar }}
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Bandas de color */}
                      <div className="flex h-2 overflow-hidden rounded-full gap-px">
                        {t.preview.map((color, i) => (
                          <span
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: color, opacity: 0.9 }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vista previa del tema seleccionado — tarjeta 3D flotante */}
          {(() => {
            const selected = RAFFLE_THEMES.find((t) => t.id === theme)!
            return (
              <div className="mt-5 flex justify-center">
                <div
                  style={{
                    perspective: '900px',
                    width: '100%',
                    maxWidth: '480px',
                  }}
                >
                  <div
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: 'rotateX(4deg) rotateY(-2deg)',
                      boxShadow: `0 24px 60px -12px ${selected.preview[0]}66, 0 8px 20px -4px rgba(0,0,0,0.3)`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(.34,1.56,.64,1)',
                    }}
                  >
                    {/* Barra superior */}
                    <div
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ backgroundColor: selected.topBar, color: selected.topBarText }}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Tu Negocio</span>
                      <span className="text-xs opacity-50">Ver todas →</span>
                    </div>

                    {/* Gradiente decorativo sobre el título */}
                    <div style={{ background: selected.gradient, padding: '1px 0 0' }} />

                    {/* Sección título */}
                    <div className="px-4 py-3" style={{ backgroundColor: selected.titleBg }}>
                      <p className="text-base font-black uppercase" style={{ color: selected.titleText }}>
                        Nombre del Bono
                      </p>
                      <p className="text-xs font-medium" style={{ color: selected.accentText }}>
                        🏆 Premio increíble
                      </p>
                    </div>

                    {/* Progreso + precio */}
                    <div className="px-4 py-3" style={{ backgroundColor: selected.surface }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-400 font-semibold">340 / 1000 vendidos</span>
                        <span className="text-[10px] font-bold" style={{ color: selected.progressColor }}>34%</span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: selected.borderSubtle }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: '34%',
                            background: selected.gradient,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-lg font-black leading-none" style={{ color: selected.priceColor }}>
                        $30.000 <span className="text-[10px] font-semibold opacity-50">COP / número</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

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
              <Label htmlFor="status">Estado de la Rifa</Label>
              <Select value={status} onValueChange={(value: 'draft' | 'active' | 'completed' | 'cancelled') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador (no visible)</SelectItem>
                  <SelectItem value="active">Activa (visible al publico)</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {status === 'draft' && 'La rifa no sera visible hasta que la actives.'}
                {status === 'active' && 'La rifa sera visible en el enlace publico.'}
                {status === 'completed' && 'La rifa ha finalizado.'}
                {status === 'cancelled' && 'La rifa ha sido cancelada.'}
              </p>
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

      {/* Paquetes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            Paquetes de Números
          </CardTitle>
          <CardDescription>
            Ofrece paquetes con descuento para incentivar compras de mayor cantidad (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Nuevo Paquete</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad de números *</Label>
                <Input
                  type="number" min="2" placeholder="Ej: 10"
                  value={newPkgQty}
                  onChange={(e) => setNewPkgQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPackage())}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descuento % (0 = sin descuento)</Label>
                <Input
                  type="number" min="0" max="90" placeholder="Ej: 10"
                  value={newPkgDiscount}
                  onChange={(e) => setNewPkgDiscount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPackage())}
                />
              </div>
            </div>
            {newPkgQty && (
              <div className="rounded-lg bg-blue-100 px-3 py-2 text-xs text-blue-800">
                <strong>Vista previa:</strong>{' '}
                x{newPkgQty} números →{' '}
                ${(parseInt(newPkgQty) * pricePerNumber * (1 - (parseInt(newPkgDiscount) || 0) / 100)).toLocaleString('es-CO')} COP
                {parseInt(newPkgDiscount) > 0 && ` (${newPkgDiscount}% off)`}
              </div>
            )}
            <Button
              type="button" onClick={addPackage}
              disabled={!newPkgQty || parseInt(newPkgQty) < 2}
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Agregar Paquete
            </Button>
          </div>

          {packages.length > 0 ? (
            <div className="space-y-2">
              {packages.map((pkg) => {
                const total = Math.round(pkg.quantity * pricePerNumber * (1 - pkg.discount / 100))
                return (
                  <div key={pkg.quantity} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-black text-blue-700">
                        x{pkg.quantity}
                      </div>
                      <div>
                        <p className="text-sm font-bold">${total.toLocaleString('es-CO')} COP</p>
                        <p className="text-xs text-muted-foreground">
                          {pkg.quantity} números{pkg.discount > 0 ? ` · ${pkg.discount}% descuento` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button" onClick={() => removePackage(pkg.quantity)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Sin paquetes. Los compradores podrán elegir números individualmente.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional Prizes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Premios Adicionales
          </CardTitle>
          <CardDescription>
            Agrega premios para el 2do, 3er lugar o los que desees (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prizes-title">Título de la sección de premios</Label>
            <Input
              id="prizes-title"
              value={prizesTitle}
              onChange={(e) => setPrizesTitle(e.target.value)}
              placeholder="Ej: Lo que puedes ganar, Grandes Premios, Gana esto..."
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece encima de las fotos de premios en la página pública
            </p>
          </div>

          {/* Formulario para agregar premio */}
          <div className="rounded-xl border border-dashed border-yellow-300 bg-yellow-50/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
              Nuevo Premio — {additionalPrizes.length + 2}° Lugar
            </p>
            <div className="space-y-2">
              <Label>Descripción del Premio *</Label>
              <Input
                placeholder="Ej: Casco Shoei GT-Air, Audífonos Sony..."
                value={newPrizeDescription}
                onChange={(e) => setNewPrizeDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAdditionalPrize())}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                URL de imagen (opcional)
              </Label>
              <Input
                placeholder="https://ejemplo.com/imagen-premio.jpg"
                value={newPrizeImageUrl}
                onChange={(e) => setNewPrizeImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAdditionalPrize())}
              />
              {newPrizeImageUrl && (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                  <img
                    src={newPrizeImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={addAdditionalPrize}
              disabled={!newPrizeDescription.trim()}
              className="w-full gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
            >
              <Plus className="h-4 w-4" />
              Agregar Premio
            </Button>
          </div>

          {/* Lista de premios agregados */}
          {additionalPrizes.length > 0 ? (
            <div className="space-y-3">
              {additionalPrizes.map((prize, index) => (
                <div key={index} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  {editingPrizeIndex === index ? (
                    /* Modo edición */
                    <div className="p-4 space-y-3 bg-yellow-50/50 border-l-4 border-yellow-400">
                      <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                        Editando — {prize.position}° Lugar
                      </p>
                      <div className="space-y-2">
                        <Label>Descripción *</Label>
                        <Input
                          value={editPrizeDescription}
                          onChange={(e) => setEditPrizeDescription(e.target.value)}
                          placeholder="Descripción del premio"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          URL de imagen (opcional)
                        </Label>
                        <Input
                          value={editPrizeImageUrl}
                          onChange={(e) => setEditPrizeImageUrl(e.target.value)}
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        {editPrizeImageUrl && (
                          <div className="h-20 w-20 overflow-hidden rounded-lg border">
                            <img src={editPrizeImageUrl} alt="preview"
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if (!editPrizeDescription.trim()) return
                            const updated = [...additionalPrizes]
                            updated[index] = {
                              ...updated[index],
                              description: editPrizeDescription.trim(),
                              image_url: editPrizeImageUrl.trim() || undefined,
                            }
                            setAdditionalPrizes(updated)
                            setEditingPrizeIndex(null)
                          }}
                          disabled={!editPrizeDescription.trim()}
                          className="flex-1 gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
                          size="sm"
                        >
                          <Check className="h-4 w-4" /> Guardar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPrizeIndex(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo lectura */
                    <div className="flex items-center gap-3 px-4 py-3">
                      {prize.image_url ? (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          <img src={prize.image_url} alt={prize.description}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-yellow-100">
                          <span className="text-lg font-bold text-yellow-700">{prize.position}°</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground">{prize.position}° Lugar</p>
                        <p className="font-medium text-sm truncate">{prize.description}</p>
                        {prize.image_url && (
                          <p className="text-xs text-muted-foreground mt-0.5">📷 Con imagen</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPrizeIndex(index)
                          setEditPrizeDescription(prize.description)
                          setEditPrizeImageUrl(prize.image_url || '')
                        }}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAdditionalPrize(index)}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay premios adicionales. El 1er lugar siempre es el premio principal.
            </p>
          )}
        </CardContent>
      </Card>

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
