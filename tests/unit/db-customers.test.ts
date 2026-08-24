import { describe, it, expect, vi, beforeEach } from 'vitest'
import Stripe from 'stripe'

// ── Mock: @/lib/supabase/service ────────────────────────────────────────────

let existingRow: { stripe_customer_id: string } | null = null
const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null })

const queryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(() => Promise.resolve({ data: existingRow, error: null })),
  upsert: (...args: unknown[]) => upsertMock(...args),
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: vi.fn(() => queryBuilder) })),
}))

// ── Mock: @/lib/stripe ───────────────────────────────────────────────────────

const mockRetrieve = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      retrieve: (...args: unknown[]) => mockRetrieve(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

import { getOrCreateStripeCustomer } from '@/lib/db/customers'

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  queryBuilder.select.mockReturnThis()
  queryBuilder.eq.mockReturnThis()
  existingRow = null
  upsertMock.mockResolvedValue({ data: null, error: null })
})

function stripeResourceMissingError(customerId: string) {
  // Mirrors the shape Stripe's SDK actually throws for a nonexistent customer.
  return new Stripe.errors.StripeInvalidRequestError({
    type: 'invalid_request_error',
    code: 'resource_missing',
    param: 'customer',
    message: `No such customer: '${customerId}'`,
  })
}

describe('getOrCreateStripeCustomer', () => {
  it('reuses the stored ID when it still resolves in the current Stripe mode', async () => {
    existingRow = { stripe_customer_id: 'cus_valid123' }
    mockRetrieve.mockResolvedValue({ id: 'cus_valid123', deleted: false })

    const id = await getOrCreateStripeCustomer('user-1', 'a@b.com')

    expect(id).toBe('cus_valid123')
    expect(mockRetrieve).toHaveBeenCalledWith('cus_valid123')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a new customer when no row exists yet', async () => {
    existingRow = null
    mockCreate.mockResolvedValue({ id: 'cus_new456' })

    const id = await getOrCreateStripeCustomer('user-2', 'new@b.com')

    expect(id).toBe('cus_new456')
    expect(mockRetrieve).not.toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalledWith({
      email: 'new@b.com',
      metadata: { supabase_user_id: 'user-2' },
    })
    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'user-2', stripe_customer_id: 'cus_new456' },
      { onConflict: 'user_id' },
    )
  })

  // ── The actual regression: stale test-mode / deleted customer IDs ──────────

  it('recreates the customer when the stored ID no longer resolves (resource_missing)', async () => {
    existingRow = { stripe_customer_id: 'cus_stale789' }
    mockRetrieve.mockRejectedValue(stripeResourceMissingError('cus_stale789'))
    mockCreate.mockResolvedValue({ id: 'cus_fresh999' })

    const id = await getOrCreateStripeCustomer('user-3', 'stale@b.com')

    expect(id).toBe('cus_fresh999')
    expect(mockCreate).toHaveBeenCalledWith({
      email: 'stale@b.com',
      metadata: { supabase_user_id: 'user-3' },
    })
    // Must upsert (not insert) since a row for this user already exists.
    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'user-3', stripe_customer_id: 'cus_fresh999' },
      { onConflict: 'user_id' },
    )
  })

  it('recreates the customer when Stripe returns it marked deleted', async () => {
    existingRow = { stripe_customer_id: 'cus_deleted111' }
    mockRetrieve.mockResolvedValue({ id: 'cus_deleted111', deleted: true })
    mockCreate.mockResolvedValue({ id: 'cus_fresh222' })

    const id = await getOrCreateStripeCustomer('user-4', 'deleted@b.com')

    expect(id).toBe('cus_fresh222')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('does not swallow unrelated Stripe errors from the validity check', async () => {
    existingRow = { stripe_customer_id: 'cus_whatever' }
    mockRetrieve.mockRejectedValue(new Error('network timeout'))

    await expect(getOrCreateStripeCustomer('user-5', 'x@b.com')).rejects.toThrow('network timeout')
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
