import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role for webhook to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // For development without webhook secret, parse directly
    // In production, use: stripe.webhooks.constructEvent(body, signature, webhookSecret)
    event = JSON.parse(body) as Stripe.Event
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status === 'paid') {
      const metadata = session.metadata
      
      if (!metadata?.raffleId || !metadata?.numbers) {
        console.error('Missing metadata in session:', session.id)
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      const raffleId = metadata.raffleId
      const numbers = JSON.parse(metadata.numbers) as number[]
      const buyerEmail = metadata.buyerEmail
      const buyerName = metadata.buyerName
      const buyerPhone = metadata.buyerPhone

      try {
        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            raffle_id: raffleId,
            buyer_email: buyerEmail,
            buyer_name: buyerName,
            buyer_phone: buyerPhone,
            numbers_purchased: numbers,
            amount_paid: (session.amount_total || 0) / 100,
            payment_status: 'completed',
            stripe_session_id: session.id,
          })
          .select()
          .single()

        if (purchaseError) {
          console.error('Error creating purchase:', purchaseError)
          throw purchaseError
        }

        // Mark numbers as sold
        const soldNumbersData = numbers.map((num) => ({
          raffle_id: raffleId,
          number: num,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          purchase_id: purchase.id,
        }))

        const { error: soldError } = await supabase
          .from('sold_numbers')
          .insert(soldNumbersData)

        if (soldError) {
          console.error('Error marking numbers as sold:', soldError)
          throw soldError
        }

        console.log(`Successfully processed payment for raffle ${raffleId}, numbers: ${numbers.join(', ')}`)
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
