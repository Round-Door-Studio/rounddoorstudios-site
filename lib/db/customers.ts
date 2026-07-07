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
    return existing.stripe_customer_id as string
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('stripe_customers')
    .insert({ user_id: userId, stripe_customer_id: customer.id })

  return customer.id
}
