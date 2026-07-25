import type { PaymentProviderName } from './types'

/**
 * Interruptor global de pasarela de pago.
 * PAYMENT_PROVIDER=mercadopago (default) | rapyd
 */
export function getActiveProvider(): PaymentProviderName {
  const value = process.env.PAYMENT_PROVIDER?.trim().toLowerCase()
  return value === 'rapyd' ? 'rapyd' : 'mercadopago'
}

export * from './types'
