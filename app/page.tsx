import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, Users, MessageCircle, BarChart3, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BonoRifa</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/consultar">Consultar Numeros</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Iniciar Sesion</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance lg:text-6xl">
            Crea y Gestiona tus Bonos y Rifas Digitales
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            La plataforma mas completa para crear rifas online, vender numeros 
            y gestionar tus sorteos de manera profesional.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Crear mi Primera Rifa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/consultar">Consultar mis Numeros</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Todo lo que Necesitas</h2>
            <p className="mt-2 text-muted-foreground">
              Herramientas poderosas para gestionar tus rifas
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Ticket className="h-10 w-10 text-primary" />
                <CardTitle>Rifas Ilimitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Crea todas las rifas que necesites con rangos de numeros personalizados
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle>Grid de Numeros</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tus clientes pueden seleccionar los numeros que deseen de forma visual
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-primary" />
                <CardTitle>Contacto por WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tus compradores te contactan directamente por WhatsApp para coordinar el pago
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary" />
                <CardTitle>Estadisticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ve el progreso de ventas, ingresos y numeros vendidos en tiempo real
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Comienza Hoy</h2>
          <p className="mt-2 text-muted-foreground">
            Crea tu cuenta gratis y lanza tu primera rifa en minutos
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/sign-up">
              Registrarse Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <span className="font-semibold">BonoRifa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 - La plataforma para rifas digitales
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
