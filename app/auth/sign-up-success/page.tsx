import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Ticket, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Ticket className="h-8 w-8" />
            <span className="text-2xl font-bold">BonoRifa</span>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Registro Exitoso</CardTitle>
              <CardDescription>
                Revisa tu correo electronico para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Te hemos enviado un enlace de confirmacion a tu correo electronico. 
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
              </p>
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  Volver al inicio de sesion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
