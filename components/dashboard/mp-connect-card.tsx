'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2, Loader2, Unlink } from 'lucide-react'

const MP_ERROR_LABELS: Record<string, string> = {
  faltan_parametros: 'Faltaron parámetros en la respuesta de Mercado Pago',
  estado_invalido: 'La sesión de conexión expiró o no es válida, intenta de nuevo',
  oauth_no_configurado: 'La conexión con Mercado Pago no está configurada aún',
  token_invalido: 'Mercado Pago rechazó la conexión, intenta de nuevo',
  error_guardando: 'Error guardando la conexión, intenta de nuevo',
  error_interno: 'Error inesperado, intenta de nuevo',
}

export function MpConnectCard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (searchParams.get('mp_connected')) {
      setBanner({ type: 'success', text: '¡Cuenta de Mercado Pago conectada correctamente!' })
      router.replace('/dashboard')
    } else if (searchParams.get('mp_error')) {
      const code = searchParams.get('mp_error') ?? ''
      setBanner({ type: 'error', text: MP_ERROR_LABELS[code] ?? 'No se pudo conectar con Mercado Pago' })
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  useEffect(() => {
    fetch('/api/mp/oauth/status')
      .then(res => res.json())
      .then(data => setConnected(!!data.connected))
      .finally(() => setLoading(false))
  }, [])

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? Las ventas dejarán de pagarte directo a ti hasta que la reconectes.')) return
    setDisconnecting(true)
    await fetch('/api/mp/oauth/disconnect', { method: 'POST' })
    setConnected(false)
    setDisconnecting(false)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: 'var(--dash-card)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
    >
      {banner && (
        <div
          className="mb-4 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={banner.type === 'success'
            ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgba(52,211,153,1)' }
            : { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'rgba(248,113,113,1)' }
          }
        >
          {banner.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#009ee3' }}
          >
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--dash-text)' }}>Tu cuenta de Mercado Pago</p>
            <p className="text-sm" style={{ color: 'var(--dash-muted)' }}>
              {loading
                ? 'Verificando conexión...'
                : connected
                  ? 'Conectada — recibes tus ventas directo en tu cuenta'
                  : 'Conéctala para recibir tus ventas por transferencia directamente'}
            </p>
          </div>
        </div>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--dash-muted)' }} />
        ) : connected ? (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgba(52,211,153,1)' }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conectada
            </span>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }}
            >
              <Unlink className="h-3.5 w-3.5" />
              Desconectar
            </button>
          </div>
        ) : (
          <a
            href="/api/mp/oauth/connect"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all"
            style={{ background: '#009ee3' }}
          >
            Conectar Mercado Pago
          </a>
        )}
      </div>
    </div>
  )
}
