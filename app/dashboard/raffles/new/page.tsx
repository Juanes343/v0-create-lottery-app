import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RaffleForm } from '@/components/dashboard/raffle-form'

export default async function NewRafflePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Rifa</h1>
        <p className="text-muted-foreground">
          Crea una nueva rifa y configura los numeros
        </p>
      </div>

      <RaffleForm userId={user.id} />
    </div>
  )
}
