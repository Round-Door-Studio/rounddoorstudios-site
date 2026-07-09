import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockConstructEvent = vi.hoisted(() => vi.fn())
const mockSubRetrieve = vi.hoisted(() => vi.fn())

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubRetrieve },
  },
}))

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}))

// ── Imports ────────────────────────────────────────────────────────────────

import { POST } from '@/app/api/stripe/webhook/route'
import { NextRequest } from 'next/server'

// ── Fixtures ───────────────────────────────────────────────────────────────

const EVENT_ID = 'evt_test_123'
const STRIPE_CUSTOMER_ID = 'cus_test_abc'
const SUBSCRIPTION_ID = 'sub_test_xyz'
const USER_ID = 'user-uuid-001'

function makeStripeSubscription(overrides: object = {}): object {
  return {
    id: SUBSCRIPTION_ID,
    customer: STRIPE_CUSTOMER_ID,
    status: 'active',
    cancel_at_period_end: false,
    cancel_at: null,
    items: {
      data: [
        {
          plan: { interval: 'month' },
          price: { id: 'price_monthly_test' },
          current_period_start: 1700000000,
          current_period_end: 1702678400,
        },
      ],
    },
    ...overrides,
  }
}

function makeEvent(type: string, data: object, id = EVENT_ID): object {
  return { id, type, data: { object: data } }
}

function makeWebhookRequest(body = '{}') {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'sig_test',
    },
  })
}

// ── Chain factory ──────────────────────────────────────────────────────────
// Supports:
//   select().eq().maybeSingle()        — subscription/customer/purchase lookups
//   upsert().select()                  — idempotency (atomic ON CONFLICT DO NOTHING)
//   update().eq()                      — subscription status updates
//   insert()                           — new subscription row inserts
//
// upsertRows: what upsert().select() resolves to.
//   [{ id }] = new event (was inserted, proceed)
//   []       = duplicate (DO NOTHING fired, skip)

function makeChain(selectResult: unknown = null, upsertRows: unknown[] = [{ id: EVENT_ID }]) {
  const updateChain = {
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  const upsertSelectChain = {
    select: vi.fn().mockResolvedValue({ data: upsertRows, error: null }),
  }
  return {
    // select().eq().maybeSingle() path
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: selectResult, error: null }),
    // upsert().select() path (idempotency + story_pack_purchases)
    upsert: vi.fn().mockReturnValue(upsertSelectChain),
    _upsertSelectChain: upsertSelectChain,
    // update().eq() path
    update: vi.fn().mockReturnValue(updateChain),
    _updateChain: updateChain,
    // insert() path (new subscription rows)
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

  // Default: constructEvent returns a no-op event
  mockConstructEvent.mockReturnValue(makeEvent('unknown.event', {}))
  mockSubRetrieve.mockResolvedValue(makeStripeSubscription())

  // Default: all from() calls return a safe chain (upsert = new event, proceed)
  mockFrom.mockReturnValue(makeChain(null))
})

// ── Signature verification ─────────────────────────────────────────────────

describe('signature verification', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing stripe-signature')
  })

  it('returns 400 when stripe.webhooks.constructEvent throws', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('passes raw body and sig header to constructEvent', async () => {
    const res = await POST(makeWebhookRequest('rawbodycontent'))
    expect(res.status).toBe(200)
    expect(mockConstructEvent).toHaveBeenCalledWith(
      'rawbodycontent',
      'sig_test',
      'whsec_test'
    )
  })
})

// ── Idempotency ────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('returns 200 without further processing when event.id already exists', async () => {
    // upsert DO NOTHING fired — returns empty rows, meaning duplicate
    mockFrom.mockReturnValueOnce(makeChain(null, []))

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    // Only one from() call (the upsert), no handler calls
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('upserts event.id into stripe_events atomically before processing', async () => {
    const eventsChain = makeChain(null, [{ id: EVENT_ID }]) // new event — proceed
    mockFrom.mockReturnValueOnce(eventsChain)

    await POST(makeWebhookRequest())

    expect(eventsChain.upsert).toHaveBeenCalledWith(
      { id: EVENT_ID, type: 'unknown.event' },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    expect(eventsChain._upsertSelectChain.select).toHaveBeenCalledWith('id')
  })
})

// ── checkout.session.completed (subscription) ──────────────────────────────

describe('checkout.session.completed — subscription mode', () => {
  function setupSubscriptionCheckout() {
    const session = {
      id: 'cs_test_sub',
      mode: 'subscription',
      subscription: SUBSCRIPTION_ID,
      customer: STRIPE_CUSTOMER_ID,
    }
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

    const eventsUpsert = makeChain(null)    // atomic idempotency upsert
    const customerLookup = makeChain({ user_id: USER_ID })
    const subCheck = makeChain(null)        // no existing sub row
    const subInsert = makeChain(null)

    mockFrom
      .mockReturnValueOnce(eventsUpsert)
      .mockReturnValueOnce(customerLookup)
      .mockReturnValueOnce(subCheck)
      .mockReturnValueOnce(subInsert)

    return { subInsert, customerLookup }
  }

  it('retrieves the subscription from Stripe', async () => {
    setupSubscriptionCheckout()
    await POST(makeWebhookRequest())
    expect(mockSubRetrieve).toHaveBeenCalledWith(SUBSCRIPTION_ID)
  })

  it('inserts a new subscriptions row when none exists', async () => {
    const { subInsert } = setupSubscriptionCheckout()
    await POST(makeWebhookRequest())
    expect(subInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        stripe_subscription_id: SUBSCRIPTION_ID,
        status: 'active',
        plan_interval: 'monthly',
      })
    )
  })

  it('updates existing subscriptions row when one exists', async () => {
    const session = {
      id: 'cs_test_sub',
      mode: 'subscription',
      subscription: SUBSCRIPTION_ID,
      customer: STRIPE_CUSTOMER_ID,
    }
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

    const subUpdateChain = makeChain(null)
    mockFrom
      .mockReturnValueOnce(makeChain(null))                      // events upsert
      .mockReturnValueOnce(makeChain({ user_id: USER_ID }))     // customer lookup
      .mockReturnValueOnce(makeChain({ id: 'existing-row-id' })) // sub check — found
      .mockReturnValueOnce(subUpdateChain)                       // sub update

    await POST(makeWebhookRequest())
    expect(subUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', user_id: USER_ID })
    )
    expect(subUpdateChain._updateChain.eq).toHaveBeenCalledWith('id', 'existing-row-id')
  })

  it('normalizes yearly interval correctly', async () => {
    mockSubRetrieve.mockResolvedValueOnce(
      makeStripeSubscription({ items: { data: [{ plan: { interval: 'year' }, price: { id: 'price_yearly_test' } }] } })
    )
    const { subInsert } = setupSubscriptionCheckout()
    await POST(makeWebhookRequest())
    expect(subInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ plan_interval: 'yearly' })
    )
  })

  it('logs and skips if no stripe_customers row found', async () => {
    const session = { id: 'cs_test', mode: 'subscription', subscription: SUBSCRIPTION_ID, customer: STRIPE_CUSTOMER_ID }
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

    mockFrom
      .mockReturnValueOnce(makeChain(null))  // events upsert
      .mockReturnValueOnce(makeChain(null))  // customer lookup → not found

    const res = await POST(makeWebhookRequest())
    // Should still return 200 (not 500)
    expect(res.status).toBe(200)
  })
})

// ── checkout.session.completed (story pack) ────────────────────────────────

describe('checkout.session.completed — story pack mode', () => {
  const session = {
    id: 'cs_test_pack',
    mode: 'payment',
    customer: STRIPE_CUSTOMER_ID,
    payment_intent: 'pi_test_123',
    amount_total: 800,
    currency: 'usd',
    metadata: {
      user_id: USER_ID,
      story_slug: 'fox-borrows-the-tigers-might',
      product_type: 'story_pack',
    },
  }

  beforeEach(() => {
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))
  })

  it('upserts story_pack_purchases with correct fields', async () => {
    const purchasesChain = makeChain(null)
    mockFrom
      .mockReturnValueOnce(makeChain(null))  // events upsert
      .mockReturnValueOnce(purchasesChain)   // story_pack_purchases upsert

    await POST(makeWebhookRequest())

    expect(purchasesChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        story_slug: 'fox-borrows-the-tigers-might',
        stripe_checkout_session_id: 'cs_test_pack',
        stripe_payment_intent_id: 'pi_test_123',
        amount_total: 800,
        currency: 'usd',
      }),
      expect.objectContaining({ onConflict: 'user_id,story_slug' })
    )
  })

  it('does not call stripe.subscriptions.retrieve for payment mode', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain(null))  // events upsert
      .mockReturnValueOnce(makeChain(null))  // purchases upsert

    await POST(makeWebhookRequest())
    expect(mockSubRetrieve).not.toHaveBeenCalled()
  })

  it('returns 200 and skips gracefully when metadata is incomplete', async () => {
    const badSession = { ...session, metadata: { product_type: 'story_pack' } }
    mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', badSession))

    mockFrom.mockReturnValueOnce(makeChain(null))  // events upsert only

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
  })
})

// ── customer.subscription.created / updated ────────────────────────────────

describe('customer.subscription.created / updated', () => {
  for (const eventType of ['customer.subscription.created', 'customer.subscription.updated']) {
    it(`${eventType}: upserts subscription row`, async () => {
      const sub = makeStripeSubscription()
      mockConstructEvent.mockReturnValue(makeEvent(eventType, sub))

      const subInsertChain = makeChain(null)
      mockFrom
        .mockReturnValueOnce(makeChain(null))              // events upsert
        .mockReturnValueOnce(makeChain({ user_id: USER_ID })) // customer lookup
        .mockReturnValueOnce(makeChain(null))              // sub check — not found
        .mockReturnValueOnce(subInsertChain)               // sub insert

      const res = await POST(makeWebhookRequest())
      expect(res.status).toBe(200)
      expect(subInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: USER_ID, status: 'active' })
      )
    })
  }

  it('customer.subscription.updated: writes cancel_at as ISO string when set', async () => {
    const CANCEL_AT_UNIX = 1815033483
    const sub = makeStripeSubscription({ cancel_at: CANCEL_AT_UNIX })
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', sub))

    const subInsertChain = makeChain(null)
    mockFrom
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(makeChain({ user_id: USER_ID }))
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(subInsertChain)

    await POST(makeWebhookRequest())
    expect(subInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cancel_at: new Date(CANCEL_AT_UNIX * 1000).toISOString(),
      })
    )
  })

  it('customer.subscription.updated: writes cancel_at as null when not set', async () => {
    const sub = makeStripeSubscription({ cancel_at: null })
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', sub))

    const subInsertChain = makeChain(null)
    mockFrom
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(makeChain({ user_id: USER_ID }))
      .mockReturnValueOnce(makeChain(null))
      .mockReturnValueOnce(subInsertChain)

    await POST(makeWebhookRequest())
    expect(subInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ cancel_at: null })
    )
  })
})

// ── customer.subscription.deleted ─────────────────────────────────────────

describe('customer.subscription.deleted', () => {
  it('sets status to canceled without deleting the row', async () => {
    const sub = makeStripeSubscription({ status: 'canceled' })
    mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', sub))

    const subUpdateChain = makeChain(null)
    mockFrom
      .mockReturnValueOnce(makeChain(null))  // events upsert
      .mockReturnValueOnce(subUpdateChain)   // subscriptions update

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(subUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'canceled' })
    )
    expect(subUpdateChain._updateChain.eq).toHaveBeenCalledWith(
      'stripe_subscription_id',
      SUBSCRIPTION_ID
    )
  })
})

// ── invoice events ─────────────────────────────────────────────────────────

describe('invoice.payment_failed / invoice.payment_succeeded', () => {
  for (const eventType of ['invoice.payment_failed', 'invoice.payment_succeeded']) {
    it(`${eventType}: retrieves subscription and upserts`, async () => {
      const invoice = {
        parent: { subscription_details: { subscription: SUBSCRIPTION_ID } },
      }
      mockConstructEvent.mockReturnValue(makeEvent(eventType, invoice))

      const subInsertChain = makeChain(null)
      mockFrom
        .mockReturnValueOnce(makeChain(null))
        .mockReturnValueOnce(makeChain({ user_id: USER_ID }))
        .mockReturnValueOnce(makeChain(null))
        .mockReturnValueOnce(subInsertChain)

      const res = await POST(makeWebhookRequest())
      expect(res.status).toBe(200)
      expect(mockSubRetrieve).toHaveBeenCalledWith(SUBSCRIPTION_ID)
      expect(subInsertChain.insert).toHaveBeenCalled()
    })
  }

  it('skips gracefully when invoice has no subscription', async () => {
    const invoice = { parent: null }
    mockConstructEvent.mockReturnValue(makeEvent('invoice.payment_failed', invoice))

    mockFrom.mockReturnValueOnce(makeChain(null))  // events upsert only

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(mockSubRetrieve).not.toHaveBeenCalled()
  })
})

// ── Unknown event types ────────────────────────────────────────────────────

describe('unknown event types', () => {
  it('returns 200 without erroring', async () => {
    mockConstructEvent.mockReturnValue(makeEvent('payment_intent.created', {}))

    mockFrom.mockReturnValueOnce(makeChain(null))  // events upsert only

    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
  })
})
