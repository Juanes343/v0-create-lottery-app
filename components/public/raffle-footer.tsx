import { Button } from '@/components/ui/button'
import { Phone, Ticket } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

interface RaffleFooterProps {
  profile: Profile
}

export function RaffleFooter({ profile }: RaffleFooterProps) {
  const whatsappLink = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <footer className="border-t bg-card py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="font-semibold">{profile.business_name}</span>
          </div>

          <div className="flex items-center gap-4">
            {whatsappLink && (
              <Button variant="outline" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" />
                  Contactar por WhatsApp
                </a>
              </Button>
            )}
            <Button variant="ghost" asChild>
              <Link href={`/lookup`}>
                Consultar mis Numeros
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Powered by BonoRifa</p>
        </div>
      </div>
    </footer>
  )
}
