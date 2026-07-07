import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/db/customers'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[create-portal-session]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
