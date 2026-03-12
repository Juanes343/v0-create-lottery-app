import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar profile={profile} userEmail={user.email || ''} />
      <main className="flex-1 bg-muted/30 p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
