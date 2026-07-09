import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/db/customers'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_request: NextRequest) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`portal-session:${ip}`, { max: 5, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

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
