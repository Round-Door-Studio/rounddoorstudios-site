import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
    const { storySlug } = body

    if (!storySlug || typeof storySlug !== 'string') {
      return NextResponse.json({ error: 'Missing storySlug' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: product } = await serviceClient
      .from('products')
      .select('stripe_price_id')
      .eq('story_slug', storySlug)
      .eq('active', true)
      .eq('product_type', 'story_pack')
      .maybeSingle()

    if (!product?.stripe_price_id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 })
    }

    const stripeCustomerId = await getOrCreateStripeCustomer(user.id, user.email!)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      metadata: {
        user_id: user.id,
        story_slug: storySlug,
        product_type: 'story_pack',
      },
      success_url: `${siteUrl}/account?checkout=success&type=story_pack&slug=${storySlug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/stories/${storySlug}?checkout=canceled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[create-story-pack-checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
