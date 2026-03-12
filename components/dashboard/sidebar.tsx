'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Ticket,
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import type { Profile } from '@/lib/types'

interface DashboardSidebarProps {
  profile: Profile | null
  userEmail: string
}

const navigation = [
  { name: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true },
  { name: 'Nueva Rifa',   href: '/dashboard/raffles/new',  icon: Plus,            exact: false },
  { name: 'Configuración',href: '/dashboard/settings',     icon: Settings,        exact: false },
]

export function DashboardSidebar({ profile, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = (profile?.business_name ?? userEmail)
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-inner">
          <Ticket className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">BonoRifa</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-violet-300/70">
          Menú principal
        </p>
        {navigation.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-violet-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-violet-300 group-hover:text-white')} />
                {item.name}
              </div>
              {isActive && <ChevronRight className="h-4 w-4 text-white/60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-sm font-bold text-white shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {profile?.business_name || 'Mi Negocio'}
            </p>
            <p className="truncate text-xs text-violet-300">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 bg-violet-600 text-white shadow-lg hover:bg-violet-700 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-violet-700 via-violet-800 to-purple-900 shadow-2xl transition-transform duration-300',
          'lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
