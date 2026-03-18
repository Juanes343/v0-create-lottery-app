import Link from 'next/link'
import { Phone, LayoutList, Search } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'

interface RaffleFooterProps {
  profile: Profile
  themeId?: string
}

export function RaffleFooter({ profile, themeId }: RaffleFooterProps) {
  const whatsappClean = profile.whatsapp?.replace(/\D/g, '')
  const whatsappDisplay = whatsappClean
    ? `+${whatsappClean.startsWith('57') ? whatsappClean : '57' + whatsappClean}`
    : null
  const whatsappLink = whatsappClean
    ? `https://wa.me/${whatsappClean.startsWith('57') ? whatsappClean : '57' + whatsappClean}`
    : null
  const theme = getRaffleTheme(themeId)

  return (
    <footer className="w-full" style={{ backgroundColor: theme.topBar }}>
      {/* Bloque principal */}
      <div className="px-6 py-12">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl font-black" style={{ color: theme.topBarText }}>
                {profile.business_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: `${theme.topBarText}60` }}>Organiza</p>
              <p className="text-xl font-black uppercase tracking-wide" style={{ color: theme.topBarText }}>
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
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
              style={{ color: theme.topBarText }}
            >
              <LayoutList className="h-4 w-4" />
              Ver todas las rifas
            </Link>
            <Link
              href="/consultar"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
              style={{ color: theme.topBarText }}
            >
              <Search className="h-4 w-4" />
              Consultar mis números
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black/20 px-6 py-3 text-center text-xs" style={{ color: `${theme.topBarText}60` }}>
        © {new Date().getFullYear()} {profile.business_name} — Todos los derechos reservados
      </div>
    </footer>
  )
}

