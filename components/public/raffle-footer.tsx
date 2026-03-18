import Link from 'next/link'
import { Phone, LayoutList, Search } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface RaffleFooterProps {
  profile: Profile
}

export function RaffleFooter({ profile }: RaffleFooterProps) {
  const whatsappClean = profile.whatsapp?.replace(/\D/g, '')
  const whatsappDisplay = whatsappClean
    ? `+${whatsappClean.startsWith('57') ? whatsappClean : '57' + whatsappClean}`
    : null
  const whatsappLink = whatsappClean
    ? `https://wa.me/${whatsappClean.startsWith('57') ? whatsappClean : '57' + whatsappClean}`
    : null

  return (
    <footer className="w-full">
      {/* Bloque principal */}
      <div className="bg-[#1b2838] px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Logo + nombre */}
          <div className="mb-8 flex items-center gap-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.business_name ?? ''}
                className="h-14 w-14 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white">
                {profile.business_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Organiza</p>
              <p className="text-xl font-black uppercase tracking-wide text-white">
                {profile.business_name}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            {whatsappDisplay && (
              <a
                href={whatsappLink ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-green-500 active:scale-95"
              >
                <Phone className="h-4 w-4" />
                {whatsappDisplay}
              </a>
            )}
            <Link
              href={`/${profile.username}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
            >
              <LayoutList className="h-4 w-4" />
              Ver todas las rifas
            </Link>
            <Link
              href="/consultar"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
            >
              <Search className="h-4 w-4" />
              Consultar mis números
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#111c28] px-6 py-3 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {profile.business_name} — Todos los derechos reservados
      </div>
    </footer>
  )
}

