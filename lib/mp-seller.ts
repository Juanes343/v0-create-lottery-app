import { createAdminClient } from '@/lib/supabase/admin'

const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'

interface SellerMpAccount {
  seller_id: string
  mp_user_id: string
  access_token: string
  refresh_token: string
  public_key: string | null
  expires_at: string
}

async function refreshSellerToken(account: SellerMpAccount): Promise<string | null> {
  const res = await fetch(MP_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_CLIENT_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  })

  if (!res.ok) {
    console.error('[mp-seller] Error refrescando token:', await res.text())
    return null
  }

  const data = await res.json()
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 15552000) * 1000).toISOString()

  const adminClient = createAdminClient()
  await adminClient
    .from('seller_mp_accounts')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('seller_id', account.seller_id)

  return data.access_token
}

/**
 * Devuelve el access_token vigente de MercadoPago del vendedor, refrescándolo
 * si está por vencer. Devuelve null si el vendedor no ha conectado su cuenta.
 */
export async function getSellerMpAccessToken(sellerId: string): Promise<string | null> {
  const adminClient = createAdminClient()
  const { data: account } = await adminClient
    .from('seller_mp_accounts')
    .select('*')
    .eq('seller_id', sellerId)
    .single()

  if (!account) return null

  const expiresAt = new Date(account.expires_at).getTime()
  const isExpiringSoon = expiresAt - Date.now() < 24 * 60 * 60 * 1000 // < 1 día

  if (isExpiringSoon) {
    return (await refreshSellerToken(account)) ?? account.access_token
  }

  return account.access_token
}

export async function isSellerMpConnected(sellerId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('seller_mp_accounts')
    .select('seller_id')
    .eq('seller_id', sellerId)
    .single()
  return !!data
}
