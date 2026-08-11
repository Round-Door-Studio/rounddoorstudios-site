import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/lib/db/customers'
import { rateLimit } from '@/lib/rate-limit'
import { getStoryBySlug, FREE_STORY_SLUG } from '@/lib/stories'

export async function POST(request: NextRequest) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = await rateLimit(`story-pack-checkout:${ip}`, { max: 5, windowMs: 60_000 })
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

    const body = await request.json()
    const { storySlug } = body

    if (!storySlug || typeof storySlug !== 'string') {
      return NextResponse.json({ error: 'Missing storySlug' }, { status: 400 })
    }

    // Every story pack is the same price, so there's one shared Stripe Price
    // for all of them (STRIPE_PRICE_STORY_PACK) instead of a per-story
    // product/price that has to be created by hand each time a new story
    // ships. This check just confirms storySlug is a real, released,
    // purchasable story — the free story has no pack to buy.
    const story = getStoryBySlug(storySlug)
    if (!story || !story.released || storySlug === FREE_STORY_SLUG) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 })
    }

    const priceId = process.env.STRIPE_PRICE_STORY_PACK!

    const stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        story_slug: storySlug,
        product_type: 'story_pack',
      },
      success_url: `${siteUrl}/account?checkout=success&type=story_pack&slug=${storySlug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/story/${storySlug}?checkout=canceled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[create-story-pack-checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
