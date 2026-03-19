'use client'

import { useEffect } from 'react'

export default function EmailTrigger({ purchaseId }: { purchaseId: string }) {
  useEffect(() => {
    // Disparar el envío del email desde el cliente, en un API route propio
    // para evitar que el streaming del Server Component corte la ejecución SMTP
    fetch('/api/send-purchase-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId }),
    })
      .then((r) => r.json())
      .then((data) => {
        console.log('[EmailTrigger] Respuesta del servidor:', data)
      })
      .catch((err) => console.error('[EmailTrigger] Error al disparar email:', err))
  }, [purchaseId])

  return null
}
