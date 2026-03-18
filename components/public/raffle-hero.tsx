'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { Raffle, Profile } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'
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
  const [current, setCurrent] = useState(0)
  const images = raffle.images.length > 0 ? raffle.images : ['/placeholder.svg']
  const theme = getRaffleTheme(raffle.theme)

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setCurrent((c) => (c + 1) % images.length), 3500)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <div className="w-full">

      {/* 1. Barra de marca */}
      <div
        className="flex items-center justify-between px-5 py-3 sm:px-8"
        style={{ backgroundColor: theme.topBar, color: theme.topBarText }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.business_name}
              className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${theme.topBarText}20`, color: theme.topBarText }}
            >
              {profile.business_name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-semibold" style={{ color: theme.topBarText }}>
            {profile.business_name}
          </span>
        </div>
        <Link href={`/${profile.username}`}
          className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-opacity opacity-60 hover:opacity-100"
          style={{ color: theme.topBarText }}
        >
          Ver todas →
        </Link>
      </div>

      {/* 2. Título e info */}
      <div className="px-5 pt-7 pb-5 sm:px-8" style={{ backgroundColor: theme.titleBg }}>
        <div className="mx-auto max-w-3xl">
          <h1
            className="text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl"
            style={{ color: theme.titleText }}
          >
            {raffle.title}
          </h1>
          {raffle.prize_description && (
            <p className="mt-2 text-sm sm:text-base leading-relaxed" style={{ color: theme.accentText }}>
              {raffle.prize_description}
            </p>
          )}
          {raffle.draw_date && (
            <div
              className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: `${theme.titleText}12`, color: `${theme.titleText}bb` }}
            >
              <Calendar className="h-3.5 w-3.5" />
              Sorteo: {new Date(raffle.draw_date).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Carrusel */}
      <div className="relative w-full overflow-hidden bg-gray-100">
        <div className="relative mx-auto max-w-3xl flex items-center justify-center">
          {images.map((src, i) => (
            <img
              key={i} src={src} alt={`${raffle.title} ${i + 1}`}
              className={`block w-full object-cover transition-opacity duration-700 h-[260px] sm:h-[360px] md:h-[420px] ${
                i === current ? 'opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
              }`}
            />
          ))}

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-gray-700 shadow-md transition-all hover:bg-white hover:shadow-lg active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-gray-700 shadow-md transition-all hover:bg-white hover:shadow-lg active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? 'w-5 bg-gray-800' : 'w-1.5 bg-gray-400/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Progreso + precio */}
      <div className="border-b bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-3xl flex items-center gap-6">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-gray-400">
                {soldCount.toLocaleString('es-CO')} / {totalNumbers.toLocaleString('es-CO')} vendidos
              </span>
              <span className="font-semibold" style={{ color: theme.progressColor }}>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progress, 1)}%`, backgroundColor: theme.progressColor }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right border-l border-gray-100 pl-6">
            <p className="text-[11px] text-gray-400 mb-0.5">Precio por número</p>
            <p className="text-xl font-bold leading-none" style={{ color: theme.priceColor }}>
              ${raffle.price_per_number.toLocaleString('es-CO')}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{raffle.currency}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
