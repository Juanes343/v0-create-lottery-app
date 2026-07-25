import MercadoPagoConfig, { Preference } from 'mercadopago'
import type { CreateCheckoutInput, CreateCheckoutResult } from './types'

const platformClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function createMercadoPagoCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://v0-create-lottery-app.vercel.app'

  // Si hay split de comisión: la preferencia se crea con el token DEL VENDEDOR
  // (él es el "collector" y recibe el pago completo); marketplace_fee acredita tu % a tu cuenta.
  const preferenceClient = input.sellerAccessToken
    ? new MercadoPagoConfig({ accessToken: input.sellerAccessToken })
    : platformClient

  const preference = new Preference(preferenceClient)
  const prefResult = await preference.create({
    body: {
      items: [
        {
          id: input.purchaseId,
          title: `${input.numberCount} número(s) — ${input.raffleTitle}`,
          quantity: 1,
          unit_price: input.totalAmount,
          currency_id: 'COP',
        },
      ],
      payer: {
        name: input.buyerName,
        phone: { number: input.buyerPhone.replace(/\D/g, '') },
        ...(input.buyerEmail?.trim() ? { email: input.buyerEmail.trim() } : {}),
      },
      back_urls: {
        success: `${siteUrl}/pago/exitoso?purchase_id=${input.purchaseId}`,
        failure: `${siteUrl}/pago/fallido?purchase_id=${input.purchaseId}`,
        pending: `${siteUrl}/pago/pendiente?purchase_id=${input.purchaseId}`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/mp/webhook`,
      external_reference: input.purchaseId,
      ...(input.sellerAccessToken && input.commissionAmount
        ? { marketplace_fee: input.commissionAmount }
        : {}),
    },
  })

  return {
    checkoutUrl: prefResult.sandbox_init_point ?? prefResult.init_point ?? '',
    providerReference: prefResult.id ?? '',
  }
}
