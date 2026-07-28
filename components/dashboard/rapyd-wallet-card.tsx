'use client'

import { useState, useEffect } from 'react'
import { Wallet, Loader2, Banknote, ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RapydWalletCardProps {
  sellerId: string
}

interface PayoutRecord {
  id: string
  amount: number
  bank_name: string | null
  account_number: string
  beneficiary_name: string
  status: string
  paid_at: string | null
  requested_at: string
}

interface WalletStatus {
  hasWallet: boolean
  balance?: number
  available?: number
  hasBankInfo?: boolean
  payouts?: PayoutRecord[]
}

export function RapydWalletCard({ sellerId }: RapydWalletCardProps) {
  const [status, setStatus] = useState<WalletStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [bankName, setBankName] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [identificationNumber, setIdentificationNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rapyd/wallet/balance?sellerId=${sellerId}`)
      const data = await res.json()
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStatus() }, [sellerId])

  const handleCreateWallet = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/rapyd/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      })
      if (res.ok) await loadStatus()
    } finally {
      setCreating(false)
    }
  }

  const handlePayout = async () => {
    setPayoutError(null)
    setPayoutLoading(true)
    try {
      const res = await fetch('/api/rapyd/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          amount: parseFloat(amount),
          beneficiaryName,
          bankName,
          accountNumber,
          identificationNumber,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPayoutError(data.error ?? 'Error al registrar el retiro')
        return
      }
      setPayoutSuccess(true)
      await loadStatus()
    } catch {
      setPayoutError('Error de conexión')
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl p-5 text-sm" style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', color: 'var(--dash-muted)' }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando cartera Rapyd...
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#5C3BFE' }}>
            <Wallet className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>Cartera Rapyd</p>
            <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
              {status?.hasWallet
                ? `Disponible para retirar: $${(status.available ?? 0).toLocaleString('es-CO')} COP (acumulado $${(status.balance ?? 0).toLocaleString('es-CO')})`
                : 'Aún no se ha creado la cartera de este vendedor'}
            </p>
          </div>
        </div>

        {!status?.hasWallet ? (
          <Button onClick={handleCreateWallet} disabled={creating} size="sm" style={{ background: '#5C3BFE', color: '#fff', border: 'none' }}>
            {creating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Wallet className="mr-2 h-3.5 w-3.5" />}
            Crear cartera
          </Button>
        ) : (
          <Button onClick={() => setShowPayoutForm(true)} size="sm" variant="outline" style={{ border: '1px solid var(--dash-border)', color: 'var(--dash-text)' }}>
            <ArrowDownToLine className="mr-2 h-3.5 w-3.5" />
            Registrar retiro
          </Button>
        )}
      </div>

      {showPayoutForm && status?.hasWallet && (
        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--dash-border)' }}>
          {payoutSuccess ? (
            <p className="text-sm font-semibold" style={{ color: 'rgba(52,211,153,1)' }}>
              ✓ Retiro registrado. Recuerda transferirle a {beneficiaryName} por fuera de la plataforma (Nequi/transferencia bancaria) — Rapyd no soporta retiros domésticos COP en Colombia, así que este pago se hace manualmente.
            </p>
          ) : (
            <>
              <p className="text-xs" style={{ color: 'var(--dash-muted)' }}>
                Rapyd no permite retiros domésticos COP→COP a bancos colombianos (su API de payouts es solo para remesas internacionales). Registra aquí el retiro que le vas a transferir manualmente al vendedor, para llevar el control del saldo disponible.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Banco</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Bancolombia, Nequi" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Monto a retirar (COP)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej: 50000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Nombre del titular</Label>
                  <Input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Número de cuenta</Label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs" style={{ color: 'var(--dash-muted)' }}>Cédula del titular</Label>
                  <Input value={identificationNumber} onChange={(e) => setIdentificationNumber(e.target.value)} />
                </div>
              </div>
              {payoutError && (
                <p className="text-xs font-medium" style={{ color: 'rgba(248,113,113,1)' }}>{payoutError}</p>
              )}
              <Button
                onClick={handlePayout}
                disabled={payoutLoading || !amount || !beneficiaryName || !accountNumber}
                size="sm"
                style={{ background: '#5C3BFE', color: '#fff', border: 'none' }}
              >
                {payoutLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Banknote className="mr-2 h-3.5 w-3.5" />}
                Registrar retiro
              </Button>
            </>
          )}

          {(status.payouts ?? []).length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--dash-muted)' }}>Retiros anteriores</p>
              {(status.payouts ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--dash-text)' }}>{p.beneficiary_name} · {p.bank_name ?? '—'}</span>
                  <span className="font-bold" style={{ color: '#5C3BFE' }}>${Number(p.amount).toLocaleString('es-CO')} COP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
