'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface CheckoutData {
  raffleId: string
  numbers: number[]
  buyerEmail: string
  buyerName: string
  buyerPhone: string
  pricePerNumber: number
  raffleName: string
  currency: string
}

export async function startRaffleCheckoutSession(data: CheckoutData) {
  const supabase = await createClient()
  
  // Verify the numbers are still available
  const { data: existingSold } = await supabase
    .from('sold_numbers')
    .select('number')
    .eq('raffle_id', data.raffleId)
    .in('number', data.numbers)
  
  if (existingSold && existingSold.length > 0) {
    const soldNumbers = existingSold.map(s => s.number).join(', ')
    throw new Error(`Los números ${soldNumbers} ya han sido vendidos`)
  }

  const totalAmount = data.numbers.length * data.pricePerNumber

  // Create Checkout Session with embedded mode
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer_email: data.buyerEmail,
    line_items: [
      {
        price_data: {
          currency: data.currency.toLowerCase(),
          product_data: {
            name: `${data.raffleName} - ${data.numbers.length} número(s)`,
            description: `Números: ${data.numbers.join(', ')}`,
          },
          unit_amount: Math.round(totalAmount * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      raffleId: data.raffleId,
      numbers: JSON.stringify(data.numbers),
      buyerEmail: data.buyerEmail,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
    },
  })

  return session.client_secret
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  
  return {
    status: session.status,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_email,
  }
}
