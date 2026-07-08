import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/db/customers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { interval } = body

    if (interval !== 'monthly' && interval !== 'yearly') {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
    }

    const priceId = interval === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY!
      : process.env.STRIPE_PRICE_YEARLY!

    const stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/account?checkout=success&type=membership&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/membership?checkout=canceled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[create-membership-checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
