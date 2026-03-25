'use client'

import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [username, setUsername] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Las contrasenas no coinciden')
      setIsLoading(false)
      return
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('El username solo puede contener letras minusculas, numeros y guiones bajos')
      setIsLoading(false)
      return
    }

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        setError('Este username ya esta en uso')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            username,
            business_name: businessName,
          },
        },
      })
      
      if (error) throw error
      
      // If user was created and session exists (email confirmation disabled in Supabase)
      // or if user identity was created, try to sign in directly
      if (data.user && !data.session) {
        // Email confirmation is required, show success page
        router.push('/auth/sign-up-success')
      } else if (data.session) {
        // User is already signed in, go to dashboard
        router.push('/dashboard')
      } else {
        // Fallback - try to sign in directly
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          // If sign in fails, it means email confirmation is needed
          router.push('/auth/sign-up-success')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrio un error'
      
      // Translate common Supabase errors to Spanish
      if (errorMessage.includes('email rate limit exceeded')) {
        setError('Demasiados intentos de registro. Por favor espera unos minutos antes de intentar de nuevo.')
      } else if (errorMessage.includes('User already registered')) {
        setError('Este email ya esta registrado. Intenta iniciar sesion.')
      } else if (errorMessage.includes('Password should be at least')) {
        setError('La contrasena debe tener al menos 6 caracteres.')
      } else if (errorMessage.includes('Invalid email')) {
        setError('El email ingresado no es valido.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6"
      style={{ backgroundColor: '#080d14' }}
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow top */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #0e7490 0%, #6366f1 100%)', boxShadow: '0 0 30px rgba(34,211,238,0.25)' }}
          >
            <span className="text-2xl">🎟️</span>
          </div>
          <p className="text-xl font-black uppercase tracking-widest text-white">
            Bono<span style={{ color: '#22d3ee' }}>Rifa</span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Crea tu cuenta de organizador
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#0f1623',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-white">Crear cuenta</h2>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Regístrate para crear tus rifas digitales
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">

            {/* Username + Negocio — 2 cols */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="mi_negocio"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="text-white placeholder:text-white/25 focus-visible:ring-cyan-500"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  bonorifa.com/<span style={{ color: '#22d3ee' }}>{username || 'tu-nombre'}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="business-name" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nombre del Negocio
                </Label>
                <Input
                  id="business-name"
                  type="text"
                  placeholder="Mi Negocio"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-white placeholder:text-white/25 focus-visible:ring-cyan-500"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {/* Contraseña + Repetir — 2 cols */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repeat-password" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Repetir
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <Input
                    id="repeat-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="pl-10 text-white placeholder:text-white/25 focus-visible:ring-cyan-500"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p>{error}</p>
                {error.includes('intentos') && (
                  <p className="mt-1 text-xs opacity-70">
                    Tip: Prueba con un email diferente o espera 1-2 minutos.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full overflow-hidden rounded-xl py-3 text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: isLoading
                  ? 'rgba(34,211,238,0.4)'
                  : 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
                boxShadow: isLoading ? 'none' : '0 0 24px rgba(34,211,238,0.3)',
              }}
            >
              {isLoading ? 'Creando cuenta...' : 'Registrarse →'}
            </button>

            {/* Link login */}
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="font-semibold underline underline-offset-2" style={{ color: '#22d3ee' }}>
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
