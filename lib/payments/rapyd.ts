import { createHmac, randomBytes } from 'crypto'
import type { CreateCheckoutInput, CreateCheckoutResult } from './types'

const RAPYD_BASE_URL = process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net'

type RapydSignedHeaders = Record<string, string>

/**
 * Firma de peticiones de Rapyd:
 * signature = base64( hex( hmac_sha256(secret_key, method + url_path + salt + timestamp + access_key + secret_key + body) ) )
 * https://docs.rapyd.net/en/request-signatures.html
 */
function signRequest(method: 'get' | 'post', urlPath: string, bodyString: string): RapydSignedHeaders {
  const accessKey = process.env.RAPYD_ACCESS_KEY!
  const secretKey = process.env.RAPYD_SECRET_KEY!
  const salt = randomBytes(12).toString('hex')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const toSign = method + urlPath + salt + timestamp + accessKey + secretKey + bodyString
  const hashHex = createHmac('sha256', secretKey).update(toSign).digest('hex')
  const signature = Buffer.from(hashHex).toString('base64')

  return {
    access_key: accessKey,
    salt,
    timestamp,
    signature,
    'Content-Type': 'application/json',
  }
}

async function rapydRequest<T = Record<string, unknown>>(
  method: 'get' | 'post',
  urlPath: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const bodyString = body ? JSON.stringify(body) : ''
  const headers = signRequest(method, urlPath, bodyString)

  const res = await fetch(`${RAPYD_BASE_URL}${urlPath}`, {
    method: method.toUpperCase(),
    headers,
    body: bodyString || undefined,
  })

  const json = await res.json()

  if (json?.status?.status !== 'SUCCESS') {
    throw new Error(json?.status?.message || `Rapyd request failed (${res.status})`)
  }

  return json.data as T
}

export async function createRapydCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-create-lottery-app.vercel.app'
  // Por defecto cae en la cartera de la plataforma (BonoRifa); si la rifa es de un
  // organizador externo, quien llama pasa su propia cartera como destino.
  const destinationEwallet = input.destinationEwallet || process.env.RAPYD_PLATFORM_EWALLET_ID

  const data = await rapydRequest<{ id: string; redirect_url: string }>('post', '/v1/checkout', {
    amount: input.totalAmount,
    country: 'CO',
    currency: input.currency || 'COP',
    merchant_reference_id: input.purchaseId,
    complete_checkout_url: `${siteUrl}/pago/exitoso?purchase_id=${input.purchaseId}`,
    cancel_checkout_url: `${siteUrl}/pago/fallido?purchase_id=${input.purchaseId}`,
    required_customer_fields: ['name', 'phone_number'],
    // Sin esto, el dinero cobrado cae al saldo general de la cuenta comerciante en vez
    // de a una cartera especifica, y las transferencias de comision fallan por fondos
    // insuficientes en la cartera de origen.
    ...(destinationEwallet ? { ewallet: destinationEwallet } : {}),
  })

  return {
    checkoutUrl: data.redirect_url,
    providerReference: data.id,
  }
}

/**
 * Verificación de firma de webhooks de Rapyd:
 * signature = base64( hex( hmac_sha256(secret_key, url_path + salt + timestamp + access_key + secret_key + raw_body) ) )
 * https://docs.rapyd.net/en/webhook-authentication.html
 *
 * IMPORTANTE (confirmado con un webhook real que fallaba con 401 "Firma inválida"):
 * a diferencia de la firma de peticiones salientes (donde url_path es solo la ruta,
 * ej. "/v1/checkout"), para verificar webhooks Rapyd firma con la URL COMPLETA
 * (protocolo + dominio + path) tal como quedó registrada en su dashboard. Usar el body
 * crudo sin re-serializar.
 */
interface RapydWallet {
  id: string
}

/**
 * Crea una "cartera personal" de Rapyd para un vendedor — sin login ni OAuth de su parte,
 * la plataforma la crea con solo su nombre. https://docs.rapyd.net/en/create-wallet.html
 */
export async function createSellerWallet(input: {
  sellerId: string
  firstName: string
  lastName: string
}): Promise<string> {
  const data = await rapydRequest<RapydWallet>('post', '/v1/ewallets', {
    first_name: input.firstName,
    last_name: input.lastName,
    ewallet_reference_id: input.sellerId,
    type: 'person',
    contact: {
      first_name: input.firstName,
      last_name: input.lastName,
      contact_type: 'personal',
      country: 'CO',
    },
  })
  return data.id
}

export async function getWalletBalance(ewalletId: string): Promise<number> {
  const data = await rapydRequest<{ accounts: { currency: string; balance: number }[] }>(
    'get',
    `/v1/ewallets/${ewalletId}`,
  )
  const copAccount = data.accounts?.find((a) => a.currency === 'COP')
  return copAccount?.balance ?? 0
}

/**
 * Transfiere fondos entre dos carteras propias (plataforma, organizador, vendedor) y
 * acepta la transferencia automaticamente — la plataforma controla ambas carteras via
 * API, no requiere accion de nadie mas.
 * https://docs.rapyd.net/en/transfer-funds-between-wallets.html
 */
export async function transferBetweenWallets(input: {
  sourceEwallet: string
  destinationEwallet: string
  amount: number
  currency?: string
}): Promise<string> {
  const transfer = await rapydRequest<{ id: string; status: string }>('post', '/v1/ewallets/transfer', {
    source_ewallet: input.sourceEwallet,
    destination_ewallet: input.destinationEwallet,
    amount: input.amount,
    currency: input.currency || 'COP',
  })

  await rapydRequest('post', '/v1/ewallets/transfer/response', {
    id: transfer.id,
    status: 'accept',
  })

  return transfer.id
}

export function verifyRapydWebhookSignature(params: {
  urlPath: string
  salt: string
  timestamp: string
  signature: string
  rawBody: string
}): boolean {
  const accessKey = process.env.RAPYD_ACCESS_KEY!
  const secretKey = process.env.RAPYD_SECRET_KEY!

  const toSign = params.urlPath + params.salt + params.timestamp + accessKey + secretKey + params.rawBody
  const hashHex = createHmac('sha256', secretKey).update(toSign).digest('hex')
  const expected = Buffer.from(hashHex).toString('base64')

  return expected === params.signature
}
