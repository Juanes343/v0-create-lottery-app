'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Ticket } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [username, setUsername] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

      const { error } = await supabase.auth.signUp({
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
      router.push('/auth/sign-up-success')
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
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Ticket className="h-8 w-8" />
            <span className="text-2xl font-bold">BonoRifa</span>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
              <CardDescription>
                Registrate para crear tus rifas digitales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="mi_negocio"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tu URL sera: bonorifa.com/{username}/tu-rifa
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="business-name">Nombre del Negocio</Label>
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Mi Negocio"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contrasena</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repetir Contrasena</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Ya tienes una cuenta?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary underline underline-offset-4"
                  >
                    Iniciar Sesion
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
