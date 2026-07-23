import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/mp/oauth/callback
 * Recibe el "code" de Mercado Pago, lo cambia por tokens y los guarda
 * asociados al vendedor autenticado que inició la conexión.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  // Debe coincidir exactamente con el redirect_uri enviado en /connect (mismo origen real)
  const siteUrl = new URL(req.url).origin

  const failRedirect = (reason: string) =>
    NextResponse.redirect(`${siteUrl}/dashboard?mp_error=${encodeURIComponent(reason)}`)

  if (!code || !state) {
    return failRedirect('faltan_parametros')
  }

  const savedState = req.cookies.get('mp_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return failRedirect('estado_invalido')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const clientId = process.env.MERCADOPAGO_CLIENT_ID
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return failRedirect('oauth_no_configurado')
  }

  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${siteUrl}/api/mp/oauth/callback`,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[mp-oauth-callback] Error al intercambiar code:', await tokenRes.text())
      return failRedirect('token_invalido')
    }

    const tokenData = await tokenRes.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 15552000) * 1000).toISOString()

    const adminClient = createAdminClient()
    const { error: upsertError } = await adminClient
      .from('seller_mp_accounts')
      .upsert({
        seller_id: user.id,
        mp_user_id: String(tokenData.user_id ?? ''),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        public_key: tokenData.public_key ?? null,
        live_mode: tokenData.live_mode ?? false,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'seller_id' })

    if (upsertError) {
      console.error('[mp-oauth-callback] Error guardando cuenta:', upsertError.message)
      return failRedirect('error_guardando')
    }

    const res = NextResponse.redirect(`${siteUrl}/dashboard?mp_connected=1`)
    res.cookies.delete('mp_oauth_state')
    return res
  } catch (err) {
    console.error('[mp-oauth-callback] Error inesperado:', err)
    return failRedirect('error_interno')
  }
}
