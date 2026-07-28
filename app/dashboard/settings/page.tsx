import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { PlatformCommissionCard } from '@/components/dashboard/platform-commission-card'
import { RapydWalletCard } from '@/components/dashboard/rapyd-wallet-card'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const isMaster = profile?.role === 'master'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5" style={{ color: '#22d3ee' }} />
          <span className="text-sm font-medium" style={{ color: '#22d3ee' }}>Configuración</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--dash-text)' }}>Ajustes de la cuenta</h1>
      </div>

      {isMaster ? (
        <PlatformCommissionCard />
      ) : (
        user?.id && (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
              Configura tu cartera de Rapyd para recibir el dinero de tus ventas y retirarlo a tu banco.
            </p>
            <RapydWalletCard sellerId={user.id} />
          </div>
        )
      )}
    </div>
  )
}
