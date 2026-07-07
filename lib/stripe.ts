import Stripe from 'stripe'

let _stripe: Stripe | undefined

// Lazy singleton — defers construction to request time so STRIPE_SECRET_KEY
// doesn't need to be present at build time.
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    }
    return Reflect.get(_stripe, prop, _stripe)
  },
})
