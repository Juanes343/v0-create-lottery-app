'use client'

import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, Ticket, Trophy, Users, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocurrió un error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: 'var(--auth-bg)' }}
    >
      {/* Theme toggle top-right */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle compact variant="auth" />
      </div>
      {/* Grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow top-left */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
        }}
      />
      {/* Radial glow bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full flex-col md:flex-row">

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-between px-10 py-12 md:px-16 md:py-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0e7490 0%, #6366f1 100%)' }}
            >
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-widest text-white">
                Bono<span style={{ color: '#22d3ee' }}>Rifa</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Panel del Organizador
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-12 md:mt-0">
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--auth-text)' }}>
              Tus rifas,{' '}
              <span style={{ color: '#22d3ee' }}>organizadas</span>{' '}
              en un solo lugar
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: 'var(--auth-muted)' }}>
              Crea rifas digitales, vende bonos y cobra automáticamente desde cualquier dispositivo.
            </p>

            {/* Features */}
            <ul className="mt-10 space-y-5">
              {[
                { icon: Ticket, label: 'Crea y publica', desc: 'rifas con URL propia' },
                { icon: Users, label: 'Vende bonos', desc: 'a tus clientes fácilmente' },
                { icon: Zap, label: 'Cobra automático', desc: 'con MercadoPago integrado' },
                { icon: Trophy, label: 'Gestiona premios', desc: 'y sorteos desde el dashboard' },
              ].map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-center gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: '#22d3ee' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--auth-text)' }}>
                    <span className="font-bold">{label}</span>{' '}
                    <span style={{ color: 'var(--auth-muted)' }}>{desc}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom decorative ticket */}
          <div className="mt-12 hidden md:flex items-center gap-3">
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-3"
              style={{
                border: '1px solid rgba(34,211,238,0.15)',
                backgroundColor: 'rgba(34,211,238,0.05)',
              }}
            >
              <span className="text-3xl">🎟️</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">BonoRifa</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Tu plataforma de rifas digitales</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — formulario ────────────────────── */}
        <div className="flex w-full items-center justify-center px-6 py-12 md:w-[480px] md:px-14 md:py-16 lg:w-[520px]">
          <div
            className="w-full max-w-sm rounded-2xl p-8"
            style={{
              backgroundColor: 'var(--auth-card)',
              border: '1px solid var(--auth-border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Card header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black" style={{ color: 'var(--auth-text)' }}>Iniciar sesión</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--auth-muted)' }}>
                Acceso seguro al{' '}
                <Link href="/" className="underline underline-offset-2" style={{ color: '#22d3ee' }}>
                  panel del organizador
                </Link>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--auth-muted)' }}>
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--auth-muted)' }}>
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: isLoading
                    ? 'rgba(34,211,238,0.4)'
                    : 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
                  boxShadow: isLoading ? 'none' : '0 0 24px rgba(34,211,238,0.3)',
                }}
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              {/* Links */}
              <div className="space-y-2 pt-1 text-center">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  ¿Olvidaste tu contraseña?
                </p>
                <Link
                  href="/auth/sign-up"
                  className="block rounded-xl border py-2.5 text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#22d3ee' }}
                >
                  Crear cuenta nueva
                </Link>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'rgba(34,211,238,0.5)' }} />
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Tus datos están protegidos
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
