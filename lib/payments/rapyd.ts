import { createHmac, randomBytes } from 'crypto'
import type { CreateCheckoutInput, CreateCheckoutResult } from './types'

const RAPYD_BASE_URL = process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net'

interface RapydSignedHeaders {
  access_key: string
  salt: string
  timestamp: string
  signature: string
  'Content-Type': string
}

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

  const data = await rapydRequest<{ id: string; redirect_url: string }>('post', '/v1/checkout', {
    amount: input.totalAmount,
    country: 'CO',
    currency: input.currency || 'COP',
    merchant_reference_id: input.purchaseId,
    complete_checkout_url: `${siteUrl}/pago/exitoso?purchase_id=${input.purchaseId}`,
    cancel_checkout_url: `${siteUrl}/pago/fallido?purchase_id=${input.purchaseId}`,
    required_customer_fields: ['name', 'phone_number'],
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
 * IMPORTANTE: usar el body crudo tal cual llega (sin re-serializar), y verificar en un
 * webhook real de prueba antes de confiar en producción — el url_path exacto que Rapyd
 * usa para firmar (con o sin query string) no está 100% documentado.
 */
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
