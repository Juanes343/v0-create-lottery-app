import Link from 'next/link'
import { Phone, LayoutList, Search } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { getRaffleTheme } from '@/lib/themes'
import { ConsultarModal } from '@/components/public/consultar-modal'

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
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: '#080d14' }}>
      {/* Grilla con color del tema */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${theme.accentText}06 1px, transparent 1px), linear-gradient(90deg, ${theme.accentText}06 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow superior del color del tema */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${theme.accentText}60, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -top-20 left-1/4 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.accentText}10` }}
      />

      {/* Bloque principal */}
      <div className="relative px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Logo + nombre */}
          <div className="mb-8 flex items-center gap-4">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.business_name ?? ''}
                className="h-14 w-14 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${theme.accentText}40` }}
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black"
                style={{ backgroundColor: `${theme.accentText}15`, color: theme.accentText, boxShadow: `0 0 0 2px ${theme.accentText}30` }}
              >
                {profile.business_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: `${theme.accentText}60` }}>
                Organiza
              </p>
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
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#16a34a', boxShadow: '0 0 16px rgba(22,163,74,0.4)' }}
              >
                <Phone className="h-4 w-4" />
                {whatsappDisplay}
              </a>
            )}
            <Link
              href={`/${profile.username}`}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
              style={{ borderColor: `${theme.accentText}30`, color: theme.accentText, backgroundColor: `${theme.accentText}08` }}
            >
              <LayoutList className="h-4 w-4" />
              Ver todas las rifas
            </Link>
            <ConsultarModal
              triggerClassName="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
              triggerStyle={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.04)' }}
              triggerIcon={<Search className="h-4 w-4" />}
              triggerLabel="Consultar mis números"
            />
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        className="relative px-6 py-3 text-center text-xs"
        style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, color: 'rgba(255,255,255,0.2)' }}
      >
        © {new Date().getFullYear()} {profile.business_name} — Todos los derechos reservados
      </div>
    </footer>
  )
}

