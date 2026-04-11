'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Captura el parámetro ?ref= de la URL y lo guarda en sessionStorage.
 * Debe montarse en la página pública de la rifa.
 * El valor persiste durante toda la sesión del navegador.
 */
export function SellerRefCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      sessionStorage.setItem('seller_ref', ref)
    }
  }, [searchParams])

  return null
}
