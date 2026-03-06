'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
import type { Raffle, Profile } from '@/lib/types'
import Link from 'next/link'

interface RaffleHeroProps {
  raffle: Raffle
  profile: Profile
  soldCount: number
  totalNumbers: number
  progress: number
}

export function RaffleHero({
  raffle,
  profile,
  soldCount,
  totalNumbers,
  progress,
}: RaffleHeroProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const images = raffle.images.length > 0 ? raffle.images : ['/placeholder.svg']

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const statusColors = {
    active: 'bg-accent text-accent-foreground',
    completed: 'bg-primary text-primary-foreground',
    cancelled: 'bg-destructive text-destructive-foreground',
    draft: 'bg-muted text-muted-foreground',
  }

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        {/* Business Name */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <span className="font-semibold">{profile.business_name}</span>
          </div>
          <Link href={`/${profile.username}`}>
            <Button variant="outline" size="sm">
              Ver Todas las Rifas
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Carousel */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <img
              src={images[currentImage]}
              alt={raffle.title}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        index === currentImage ? 'bg-primary' : 'bg-background/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <Badge className={`${statusColors[raffle.status]} mb-4 w-fit`}>
              {raffle.status === 'active' ? 'En Venta' : raffle.status}
            </Badge>

            <h1 className="mb-2 text-3xl font-bold lg:text-4xl">{raffle.title}</h1>

            <div className="mb-4 flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              <span>{raffle.prize_description}</span>
            </div>

            {raffle.draw_date && (
              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>
                  Sorteo: {new Date(raffle.draw_date).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Progress */}
            <div className="rounded-xl bg-muted p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Progreso de Venta</span>
                <span className="font-bold text-primary">{progress}%</span>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{soldCount.toLocaleString('es-CO')} vendidos</span>
                <span>{totalNumbers.toLocaleString('es-CO')} total</span>
              </div>
            </div>

            {/* Price */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Precio por numero</p>
              <p className="text-3xl font-bold text-primary">
                ${raffle.price_per_number.toLocaleString('es-CO')}
                <span className="text-lg font-normal text-muted-foreground"> {raffle.currency}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
