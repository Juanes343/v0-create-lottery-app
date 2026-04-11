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
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { Profile, UserRole } from '@/lib/types'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface DashboardSidebarProps {
  profile: Profile | null
  userEmail: string
}

// Navegación base visible para todos
const baseNavigation = [
  { name: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard, exact: true,  roles: ['master','admin','vendedor','cliente'] },
  { name: 'Nueva Rifa',   href: '/dashboard/raffles/new',  icon: Plus,            exact: false, roles: ['master','admin'] },
  { name: 'Vendedores',   href: '/dashboard/vendedores',   icon: Users,           exact: false, roles: ['master','admin'] },
  { name: 'Configuración',href: '/dashboard/settings',     icon: Settings,        exact: false, roles: ['master','admin'] },
]

export function DashboardSidebar({ profile, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role: UserRole = profile?.role ?? 'admin'
  const navigation = baseNavigation.filter(item => item.roles.includes(role))

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
      <div className="flex h-16 items-center gap-3 px-5" style={{ borderBottom: '1px solid var(--sb-border)' }}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #0e7490 0%, #6366f1 100%)' }}
        >
          <Ticket className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xl font-black uppercase tracking-widest" style={{ color: 'var(--sb-text)' }}>
            Bono<span style={{ color: '#22d3ee' }}>Rifa</span>
          </p>
        </div>
        {/* Theme toggle compacto en el header */}
        <ThemeToggle compact />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sb-label)' }}>
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
              className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={isActive
                ? { backgroundColor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.18)', color: 'var(--sb-text)' }
                : { color: 'var(--sb-muted)' }
              }
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className="h-5 w-5"
                  style={{ color: isActive ? '#22d3ee' : 'var(--sb-muted)' }}
                />
                {item.name}
              </div>
              {isActive && <ChevronRight className="h-4 w-4" style={{ color: 'rgba(34,211,238,0.6)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--sb-border)' }}>
        <div
          className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: 'var(--sb-card-bg)', border: '1px solid var(--sb-card-border)' }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
            style={{ background: 'linear-gradient(135deg, #0891b2, #6366f1)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--sb-text)' }}>
              {profile?.business_name || 'Mi Negocio'}
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--sb-muted)' }}>{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/20"
          style={{ color: 'var(--sb-muted)' }}
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
        className="fixed left-4 top-4 z-50 text-white shadow-lg lg:hidden"
        style={{ backgroundColor: '#0891b2' }}
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
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col shadow-2xl transition-transform duration-300',
          'lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ backgroundColor: 'var(--sb-bg)', borderRight: '1px solid var(--sb-border)' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
