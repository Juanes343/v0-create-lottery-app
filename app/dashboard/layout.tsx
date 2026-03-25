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
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--dash-bg)' }}>
      <DashboardSidebar profile={profile} userEmail={user.email || ''} />
      <main className="relative flex-1 overflow-hidden p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              `linear-gradient(var(--dash-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--dash-grid-line) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Radial glows */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
