import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe'

/**
 * Returns the Stripe customer ID for a user, creating one if it doesn't exist.
 * Writes to stripe_customers via service role.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.stripe_customer_id) {
    const storedId = existing.stripe_customer_id as string
    // The stored ID can go stale — e.g. it was created under different Stripe
    // keys (test vs live mode), or the customer was deleted in the Stripe
    // dashboard. Verify it still resolves before reusing it; an unverified
    // stale ID would otherwise surface deep inside checkout session creation
    // as a raw "No such customer" error that the checkout routes can only
    // report as a generic failure.
    if (await stripeCustomerExists(storedId)) {
      return storedId
    }
    console.warn('[db/customers] stale stripe_customer_id for user', userId, '— recreating')
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('stripe_customers')
    .upsert({ user_id: userId, stripe_customer_id: customer.id }, { onConflict: 'user_id' })

  return customer.id
}

async function stripeCustomerExists(customerId: string): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return !customer.deleted
  } catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      return false
    }
    throw err
  }
}
