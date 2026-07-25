export type PaymentProviderName = 'mercadopago' | 'rapyd'

export interface CreateCheckoutInput {
  purchaseId: string
  raffleTitle: string
  totalAmount: number
  currency: string
  numberCount: number
  buyerName: string
  buyerPhone: string
  buyerEmail?: string
  /** access_token del vendedor conectado — solo aplica a Mercado Pago */
  sellerAccessToken?: string
  /** monto de comision del vendedor a repartir via marketplace_fee — solo Mercado Pago */
  commissionAmount?: number
}

export interface CreateCheckoutResult {
  checkoutUrl: string
  providerReference: string
}
