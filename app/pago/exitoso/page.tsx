import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import EmailTrigger from '@/components/public/email-trigger'

interface Props {
  searchParams: Promise<{ purchase_id?: string; payment_id?: string }>
}

export default async function PagoExitosoPage({ searchParams }: Props) {
  const { purchase_id } = await searchParams

  let rafflePath: string | null = null
  let buyerName: string | null = null
  let buyerEmail: string | null = null
  let numbers: number[] = []
  let whatsappNumber: string | null = null
  let raffleName: string | null = null
  let currency = 'COP'
  let pricePerNumber = 0
  let totalAmount = 0

  if (purchase_id) {
    const supabase = createAdminClient()

    // Usar select('*') para evitar errores si alguna columna opcional no existe todavía en la DB
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .single()

    if (purchase) {
      buyerName = purchase.buyer_name
      buyerEmail = purchase.buyer_email?.includes('@noemail.bonorifa.com') ? null : purchase.buyer_email
      totalAmount = purchase.total_amount
      currency = purchase.currency || 'COP'

      const { data: raffleData } = await supabase
        .from('raffles')
        .select('slug, title, price_per_number, whatsapp_number, profiles!inner(username, business_name, whatsapp)')
        .eq('id', purchase.raffle_id)
        .single()

      if (raffleData) {
        const profile = raffleData.profiles as unknown as { username: string; business_name: string; whatsapp?: string }
        rafflePath = `/${profile.username}/${raffleData.slug}`
        raffleName = raffleData.title
        pricePerNumber = raffleData.price_per_number
        whatsappNumber = raffleData.whatsapp_number || profile.whatsapp || null
      }

      // Obtener números desde sold_numbers si existen, o desde purchase.numbers
      const { data: soldNums } = await supabase
        .from('sold_numbers')
        .select('number')
        .eq('purchase_id', purchase_id)

      numbers = soldNums && soldNums.length > 0
        ? soldNums.map((n: { number: number }) => n.number).sort((a, b) => a - b)
        : (purchase.numbers || []).sort((a: number, b: number) => a - b)
    }
  }

  const numberDigits = numbers.length > 0 ? Math.max(...numbers).toString().length : 5
  const formatNum = (n: number) => n.toString().padStart(numberDigits, '0')

  // Generar mensaje de WhatsApp para el organizador
  const whatsappMsg = whatsappNumber && buyerName && numbers.length > 0
    ? encodeURIComponent(
        `Hola! Acabo de realizar el pago para la rifa "${raffleName}".\n\n` +
        `Números: ${numbers.map(formatNum).join(', ')}\n` +
        `Cantidad: ${numbers.length}\n` +
        `Total: $${totalAmount.toLocaleString('es-CO')} ${currency}\n\n` +
        `Nombre: ${buyerName}\n` +
        `Comprobante: Pago realizado por Mercado Pago ✅`
      )
    : null

  const cleanWhatsapp = whatsappNumber?.replace(/\D/g, '') || ''
  const waLink = whatsappMsg ? `https://wa.me/${cleanWhatsapp.startsWith('57') ? cleanWhatsapp : `57${cleanWhatsapp}`}?text=${whatsappMsg}` : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 text-center">
      {/* Disparar envío de email desde cliente para evitar cortes de streaming */}
      {purchase_id && <EmailTrigger purchaseId={purchase_id} />}

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-12 w-12 text-emerald-600" />
        </div>

        <h1 className="mb-2 text-2xl font-black text-gray-900">¡Pago exitoso!</h1>
        {buyerName && (
          <p className="mb-4 text-gray-600">
            Gracias, <span className="font-semibold">{buyerName}</span>. Tu compra fue confirmada.
          </p>
        )}

        {numbers.length > 0 && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
              Tus números
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {numbers.map((n) => (
                <span
                  key={n}
                  className="rounded-lg bg-emerald-600 px-3 py-1 font-mono text-sm font-bold text-white"
                >
                  {formatNum(n)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Aviso email si el comprador dio email */}
        {buyerEmail && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            📧 Te enviamos un correo de confirmación a <span className="font-semibold">{buyerEmail}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Botón WhatsApp al organizador */}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-green-600"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar comprobante por WhatsApp
            </a>
          )}

          {rafflePath && (
            <Link
              href={rafflePath}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-emerald-700"
            >
              Volver a la rifa
            </Link>
          )}
          <Link
            href="/"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
