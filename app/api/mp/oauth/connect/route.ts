import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/mp/oauth/connect
 * Inicia el flujo OAuth para que un vendedor conecte su propia cuenta de Mercado Pago.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Mercado Pago OAuth no está configurado (falta MERCADOPAGO_CLIENT_ID)' }, { status: 500 })
  }

  // Usar el origen real de la petición (localhost en dev, el dominio real en producción)
  // para que siempre coincida con la URL de redirección registrada en Mercado Pago.
  const siteUrl = new URL(req.url).origin
  const state = randomBytes(16).toString('hex')

  const authorizeUrl = new URL('https://auth.mercadopago.com/authorization')
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('platform_id', 'mp')
  authorizeUrl.searchParams.set('redirect_uri', `${siteUrl}/api/mp/oauth/callback`)
  authorizeUrl.searchParams.set('state', state)

  const res = NextResponse.redirect(authorizeUrl.toString())
  res.cookies.set('mp_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutos
    path: '/',
  })
  return res
}
