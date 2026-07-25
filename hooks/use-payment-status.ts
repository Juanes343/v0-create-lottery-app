import { useEffect, useRef, useState } from 'react'

type PollStatus = 'idle' | 'waiting' | 'completed' | 'failed'

interface UsePaymentStatusOptions {
  /** cada cuanto consultar, en ms */
  intervalMs?: number
  /** despues de cuantos intentos rendirse (evita pollear para siempre) */
  maxAttempts?: number
}

/**
 * Consulta /api/payments/status mientras el comprador paga en otra pestaña,
 * para detectar automaticamente cuando el webhook confirma (o falla) el pago.
 */
export function usePaymentStatus(
  purchaseId: string | null,
  { intervalMs = 3000, maxAttempts = 100 }: UsePaymentStatusOptions = {},
) {
  const [status, setStatus] = useState<PollStatus>('idle')
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (!purchaseId) return

    let cancelled = false
    attemptsRef.current = 0
    setStatus('waiting')

    const tick = async () => {
      if (cancelled) return
      attemptsRef.current += 1

      try {
        const res = await fetch(`/api/payments/status?purchase_id=${purchaseId}`)
        const data = await res.json()

        if (cancelled) return

        if (data.status === 'completed') {
          setStatus('completed')
          return
        }
        if (data.status === 'failed') {
          setStatus('failed')
          return
        }
      } catch {
        // silencioso, se reintenta en el siguiente tick
      }

      if (attemptsRef.current >= maxAttempts) {
        return // se queda en 'waiting' — el usuario puede refrescar manualmente
      }
      timeoutId = setTimeout(tick, intervalMs)
    }

    let timeoutId = setTimeout(tick, intervalMs)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [purchaseId, intervalMs, maxAttempts])

  return status
}
