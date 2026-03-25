'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  compact?: boolean
  variant?: 'sidebar' | 'auth'
  className?: string
}

export function ThemeToggle({ compact = false, variant = 'sidebar', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const isDark = theme === 'dark'

  if (compact) {
    const prefix = variant === 'auth' ? '--auth-toggle' : '--sb-toggle'
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: `1px solid var(${prefix}-border)`,
          backgroundColor: `var(${prefix}-bg)`,
          cursor: 'pointer',
          transition: 'all 0.15s',
          color: `var(${prefix}-color)`,
        }}
      >
        {isDark
          ? <Sun style={{ width: '16px', height: '16px' }} />
          : <Moon style={{ width: '16px', height: '16px' }} />}
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        borderRadius: '12px',
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: 'transparent',
        color: 'var(--sb-muted)',
      }}
    >
      {isDark
        ? <><Sun style={{ width: '16px', height: '16px', flexShrink: 0 }} /> Modo Claro</>
        : <><Moon style={{ width: '16px', height: '16px', flexShrink: 0 }} /> Modo Oscuro</>}
    </button>
  )
}
