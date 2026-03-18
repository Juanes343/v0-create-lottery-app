'use client'

import { useEffect } from 'react'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'

interface MercadoPagoWalletProps {
  preferenceId: string
}

export function MercadoPagoWallet({ preferenceId }: MercadoPagoWalletProps) {
  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, { locale: 'es-CO' })
  }, [])

  return (
    <Wallet
      initialization={{ preferenceId, redirectMode: 'modal' }}
      customization={{
        texts: { valueProp: 'smart_option' },
      }}
    />
  )
}
