import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true })
  }

  await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(supabase, event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded':
        await handleInvoiceEvent(supabase, event.data.object as Stripe.Invoice)
        break
    }
  } catch (err) {
    console.error(`[webhook] error handling ${event.type}`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  if (session.mode === 'subscription') {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    await handleSubscriptionUpsert(supabase, sub)
  } else if (
    session.mode === 'payment' &&
    session.metadata?.product_type === 'story_pack'
  ) {
    const { user_id, story_slug } = session.metadata
    if (!user_id || !story_slug) {
      console.error('[webhook] checkout.session.completed missing metadata', session.metadata)
      return
    }
    await supabase
      .from('story_pack_purchases')
      .upsert(
        {
          user_id,
          story_slug,
          stripe_customer_id: session.customer as string | null,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string | null,
          amount_total: session.amount_total,
          currency: session.currency,
        },
        { onConflict: 'user_id,story_slug' }
      )
  }
}

async function handleSubscriptionUpsert(
  supabase: SupabaseClient,
  sub: Stripe.Subscription
) {
  const stripeCustomerId = sub.customer as string

  const { data: customerRow } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (!customerRow?.user_id) {
    console.error('[webhook] no stripe_customers row for', stripeCustomerId)
    return
  }

  const interval = sub.items.data[0]?.plan?.interval
  const planInterval =
    interval === 'month' ? 'monthly' : interval === 'year' ? 'yearly' : null

  const item = sub.items.data[0]
  const payload = {
    user_id: customerRow.user_id,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan_interval: planInterval,
    price_id: item?.price?.id ?? null,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    cancel_at: sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle()

  if (existingSub) {
    await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', existingSub.id)
  } else {
    await supabase
      .from('subscriptions')
      .insert(payload)
  }
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  sub: Stripe.Subscription
) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id)
}

async function handleInvoiceEvent(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription
  if (!subscriptionId) return
  const sub = await stripe.subscriptions.retrieve(
    typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
  )
  await handleSubscriptionUpsert(supabase, sub)
}
