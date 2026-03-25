'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { Raffle, Profile } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'
import Link from 'next/link'
import Tilt from 'react-parallax-tilt'

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

      {/* 1. Barra superior: negocio — dark premium con grilla */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#0a0f18' }}>
        {/* Grilla de fondo con color del tema */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${theme.accentText}07 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}07 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow lateral del color del tema */}
        <div
          className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 h-28 w-40 rounded-full blur-2xl"
          style={{ backgroundColor: `${theme.accentText}20` }}
        />
        <div
          className="relative flex items-center justify-between px-4 py-3.5 sm:px-6"
          style={{ borderBottom: `1px solid ${theme.accentText}18` }}
        >
          <div className="flex min-w-0 items-center gap-3">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${theme.accentText}50` }}
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black"
                style={{ backgroundColor: `${theme.accentText}20`, color: theme.accentText, boxShadow: `0 0 0 2px ${theme.accentText}40` }}
              >
                {profile.business_name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: `${theme.accentText}70` }}>
                Organiza
              </p>
              <span className="block truncate text-sm font-black uppercase tracking-widest text-white sm:text-base">
                {profile.business_name}
              </span>
            </div>
          </div>
          <Link
            href={`/${profile.username}`}
            className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all opacity-70 hover:opacity-100"
            style={{ borderColor: `${theme.accentText}30`, color: theme.accentText, backgroundColor: `${theme.accentText}10` }}
          >
            Ver todas →
          </Link>
        </div>
      </div>

      {/* 2. Título e info — fondo transparente para que pase la grilla general */}
      <div className="relative overflow-hidden px-4 pt-12 pb-10 sm:px-6 shadow-2xl">
        {/* Glow esquina superior derecha */}
        <div
          className="pointer-events-none absolute -right-20 -top-10 z-0 h-64 w-64 rounded-full blur-[100px]"
          style={{ backgroundColor: `${theme.accentText}40` }}
        />
        {/* Glow inferior */}
        <div
          className="pointer-events-none absolute -bottom-32 left-1/2 z-0 h-64 w-full -translate-x-1/2 rounded-full blur-[120px] opacity-40"
          style={{ backgroundColor: theme.accentText }}
        />
        
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} perspective={1000} scale={1.01} transitionSpeed={2500} glareEnable={false}>
            <h1
              className="text-4xl font-black uppercase leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl break-words text-white drop-shadow-2xl"
            >
              {raffle.title}
            </h1>
            {raffle.prize_description && (
              <p className="mt-6 text-lg font-medium sm:text-xl break-words drop-shadow-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {raffle.prize_description}
              </p>
            )}
            {raffle.draw_date && (
              <div
                className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black shadow-2xl transition-transform hover:scale-105"
                style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: theme.accentText, border: `1px solid ${theme.accentText}40`, backdropFilter: 'blur(10px)' }}
              >
                <Calendar className="h-4 w-4" />
                SORTEO: {new Date(raffle.draw_date).toLocaleDateString('es-CO', {
                  year: 'numeric', month: 'long', day: 'numeric',
                }).toUpperCase()}
              </div>
            )}
          </Tilt>
        </div>
      </div>

      {/* 3. Carrusel — fondo oscuro semi-transparente */}
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${theme.accentText}10`, borderBottom: `1px solid ${theme.accentText}10` }}>
        <div className="relative mx-auto max-w-4xl px-4 py-8 flex items-center justify-center">
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1000} scale={1.03} transitionSpeed={2000} className="w-full">
            <div className="relative w-full h-[280px] sm:h-[400px] md:h-[500px]">
              {images.map((src, i) => (
                <img
                  key={i} src={src} alt={`${raffle.title} ${i + 1}`}
                  className={`absolute inset-0 block w-full h-full object-contain transition-all duration-1000 drop-shadow-2xl ${
                    i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                />
              ))}
            </div>
          </Tilt>

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: `${theme.accentText}25`, border: `1px solid ${theme.accentText}40` }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: `${theme.accentText}25`, border: `1px solid ${theme.accentText}40` }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={
                      i === current
                        ? { width: '24px', backgroundColor: theme.accentText }
                        : { width: '8px', backgroundColor: `${theme.accentText}40` }
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Barra de progreso + precio — dark premium */}
      <div
        className="relative overflow-hidden px-4 py-5 sm:px-6"
        style={{ backgroundColor: '#0d1420', borderBottom: `1px solid ${theme.accentText}18` }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-1/3"
          style={{ background: `linear-gradient(90deg, ${theme.accentText}08 0%, transparent 100%)` }}
        />
        <div className="relative mx-auto max-w-3xl flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                {soldCount.toLocaleString('es-CO')} de {totalNumbers.toLocaleString('es-CO')} vendidos
              </span>
              <span style={{ color: theme.accentText }}>{progress}% vendido</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progress, 2)}%`, background: theme.gradient, boxShadow: `0 0 10px ${theme.accentText}60` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>c/número</p>
            <p className="text-3xl font-black leading-none" style={{ color: theme.accentText }}>
              ${raffle.price_per_number.toLocaleString('es-CO')}
            </p>
            <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>{raffle.currency}</p>
          </div>
        </div>
      </div>

    </div>
  )
}
