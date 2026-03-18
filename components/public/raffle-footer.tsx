import Link from 'next/link'
import { Phone, LayoutList, Search, Shield, FileText } from 'lucide-react'
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
    <footer className="w-full border-t border-gray-800 bg-gray-950">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">

          {/* Marca */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={profile.business_name ?? ''}
                  className="h-9 w-9 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                  {profile.business_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-600">Organizado por</p>
                <p className="text-sm font-semibold text-white">{profile.business_name}</p>
              </div>
            </div>
            {whatsappDisplay && (
              <a
                href={whatsappLink ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                <Phone className="h-3.5 w-3.5" />
                {whatsappDisplay}
              </a>
            )}
          </div>

          {/* Navegación */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-4">Navegación</p>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${profile.username}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  Todas las rifas
                </Link>
              </li>
              <li>
                <Link
                  href="/consultar"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                  Consultar mis números
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-4">Información</p>
            <ul className="space-y-3">
              <li className="inline-flex items-center gap-2 text-sm text-gray-400">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                Compra 100% segura
              </li>
              <li className="inline-flex items-center gap-2 text-sm text-gray-400">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Términos y condiciones
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-4">
        <div className="mx-auto max-w-3xl flex flex-col items-center justify-between gap-1.5 text-center sm:flex-row">
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} {profile.business_name}. Todos los derechos reservados.
          </p>
          <Link href="/" className="text-xs text-gray-700 transition-colors hover:text-gray-400">
            Powered by BonoRifa
          </Link>
        </div>
      </div>
    </footer>
  )
}


