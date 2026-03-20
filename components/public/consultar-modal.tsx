'use client'

import { useState } from 'react'
import { Search, Loader2, X, Ticket, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PurchaseResult {
  id: string
  numbers: number[]
  total_amount: number
  currency: string
  created_at: string
  raffle_id: string
  raffle_title: string
  raffle_slug: string
  profile_username: string
}

interface ConsultarModalProps {
  triggerClassName?: string
  triggerLabel?: string
  triggerIcon?: React.ReactNode
  triggerStyle?: React.CSSProperties
}

export function ConsultarModal({
  triggerClassName,
  triggerLabel = 'Consultar mis números',
  triggerIcon,
  triggerStyle,
}: ConsultarModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PurchaseResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResults(null)

    if (!email && !phone) {
      setError('Ingresa tu correo electrónico o teléfono')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Buscar compras completadas por email o teléfono
      let query = supabase
        .from('purchases')
        .select('id, numbers, total_amount, currency, created_at, raffle_id, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (email) {
        query = query.eq('buyer_email', email.toLowerCase().trim())
      } else {
        query = query.eq('buyer_phone', phone.trim())
      }

      const { data: purchases, error: purchasesError } = await query

      if (purchasesError) throw purchasesError

      if (!purchases || purchases.length === 0) {
        setResults([])
        return
      }

      // Obtener IDs únicos de rifas
      const raffleIds = [...new Set(purchases.map((p) => p.raffle_id))]

      const { data: raffles } = await supabase
        .from('raffles')
        .select('id, title, slug, user_id')
        .in('id', raffleIds)

      const userIds = [...new Set((raffles || []).map((r) => r.user_id))]

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const raffleMap = new Map((raffles || []).map((r) => [r.id, r]))
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

      const enriched: PurchaseResult[] = purchases.map((p) => {
        const raffle = raffleMap.get(p.raffle_id)
        const profile = raffle ? profileMap.get(raffle.user_id) : null
        return {
          id: p.id,
          numbers: Array.isArray(p.numbers) ? p.numbers.sort((a: number, b: number) => a - b) : [],
          total_amount: p.total_amount,
          currency: p.currency || 'COP',
          created_at: p.created_at,
          raffle_id: p.raffle_id,
          raffle_title: raffle?.title ?? 'Rifa',
          raffle_slug: raffle?.slug ?? '',
          profile_username: profile?.username ?? '',
        }
      })

      setResults(enriched)
    } catch (err) {
      console.error('Consultar error:', err)
      setError('Error al buscar. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!results || results.length === 0) return
    setSendingEmail(true)
    setEmailError(null)

    try {
      // Enviar email de confirmación para cada compra
      const promises = results.map((p) =>
        fetch('/api/send-purchase-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchase_id: p.id, force: true }),
        }).then((r) => r.json())
      )
      await Promise.all(promises)
      setEmailSent(true)
    } catch {
      setEmailError('Error al enviar el correo. Intenta de nuevo.')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setEmail('')
    setPhone('')
    setResults(null)
    setError(null)
    setEmailSent(false)
    setEmailError(null)
  }

  const numberDigits = (nums: number[]) =>
    nums.length > 0 ? Math.max(...nums).toString().length : 3

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
        style={triggerStyle}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Consultar mis números</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {/* Formulario */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-email" className="text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (e.target.value) setPhone('') }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs uppercase text-gray-400">O</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-phone" className="text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (e.target.value) setEmail('') }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
                  ) : (
                    <><Search className="h-4 w-4" /> Buscar mis números</>
                  )}
                </button>
              </form>

              {/* Resultados */}
              {results !== null && (
                <div className="mt-6 space-y-3">
                  {results.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 py-10 text-center text-sm text-gray-500">
                      No encontramos compras con esos datos.<br />Verifica que el correo o teléfono sea correcto.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-700">
                        {results.length} compra{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}
                      </p>
                      {results.map((purchase) => {
                        const digits = numberDigits(purchase.numbers)
                        const fmt = (n: number) => n.toString().padStart(digits, '0')
                        const raffleUrl = purchase.profile_username && purchase.raffle_slug
                          ? `/${purchase.profile_username}/${purchase.raffle_slug}`
                          : null
                        return (
                          <div key={purchase.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-3 flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">{purchase.raffle_title}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(purchase.created_at).toLocaleDateString('es-CO', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                  })}
                                </p>
                              </div>
                              {raffleUrl && (
                                <a
                                  href={raffleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-emerald-600 hover:underline"
                                >
                                  Ver rifa →
                                </a>
                              )}
                            </div>
                            <div className="mb-3">
                              <p className="mb-1.5 text-xs text-gray-500">Tus números:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {purchase.numbers.map((n) => (
                                  <span
                                    key={n}
                                    className="rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-xs font-bold text-white"
                                  >
                                    {fmt(n)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-right text-xs text-gray-500">
                              Total:{' '}
                              <span className="font-semibold text-gray-800">
                                ${purchase.total_amount.toLocaleString('es-CO')} {purchase.currency}
                              </span>
                            </p>
                          </div>
                        )
                      })}

                      {/* Botón enviar al correo */}
                      {email && (
                        <div className="mt-4">
                          {emailSent ? (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                              <CheckCircle className="h-4 w-4" />
                              Enviamos tus números a <span className="font-semibold">{email}</span>
                            </div>
                          ) : (
                            <>
                              {emailError && (
                                <div className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                  {emailError}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                              >
                                {sendingEmail ? (
                                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                                ) : (
                                  <><Mail className="h-4 w-4" /> Enviar a mi correo</>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
