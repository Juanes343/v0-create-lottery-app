'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
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
  const [current, setCurrent] = useState(0)
  const images = raffle.images.length > 0 ? raffle.images : ['/placeholder.svg']

  // Auto-play
  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setCurrent((c) => (c + 1) % images.length), 3500)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <div className="w-full">

      {/* 1. Barra superior: negocio */}
      <div className="flex items-center justify-between bg-gray-950 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.business_name}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white">
              {profile.business_name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-black uppercase tracking-widest text-white sm:text-base">
            {profile.business_name}
          </span>
        </div>
        <Link href={`/${profile.username}`}
          className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-gray-300 transition-all hover:border-white/40 hover:text-white">
          Ver todas →
        </Link>
      </div>

      {/* 2. Título e info */}
      <div className="bg-white px-4 pt-6 pb-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
            {raffle.title}
          </h1>
          {raffle.prize_description && (
            <p className="mt-2 text-base font-medium text-cyan-600 sm:text-lg">{raffle.prize_description}</p>
          )}
          {raffle.draw_date && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Sorteo: {new Date(raffle.draw_date).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Carrusel — imagen completa visible */}
      <div className="relative w-full bg-gray-50">
        <div className="relative mx-auto max-w-3xl">
          {images.map((src, i) => (
            <img
              key={i} src={src} alt={`${raffle.title} ${i + 1}`}
              className={`block w-full object-contain transition-opacity duration-700 ${
                i === current ? 'opacity-100' : 'absolute inset-0 opacity-0'
              }`}
              style={{ maxHeight: '420px' }}
            />
          ))}

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'w-6 bg-gray-800' : 'w-2 bg-gray-400/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Barra de progreso + precio */}
      <div className="border-b bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span className="text-gray-500">{soldCount.toLocaleString('es-CO')} de {totalNumbers.toLocaleString('es-CO')} vendidos</span>
              <span className="text-emerald-600">{progress}% vendido</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">c/número</p>
            <p className="text-3xl font-black leading-none text-emerald-600">
              ${raffle.price_per_number.toLocaleString('es-CO')}
            </p>
            <p className="text-[10px] font-bold text-gray-400">{raffle.currency}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
