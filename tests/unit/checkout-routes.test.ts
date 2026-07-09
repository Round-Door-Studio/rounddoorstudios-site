import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────

// Provide a fake request scope so next/headers doesn't throw outside Next.js.
vi.mock('next/headers', () => ({
  headers: vi.fn(() =>
    Promise.resolve(new Headers({ 'x-forwarded-for': '127.0.0.1' }))
  ),
}))

// Rate-limit passes through by default; individual tests override to test 429.
const mockRateLimit = vi.hoisted(() => vi.fn(() => ({ success: true })))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mockRateLimit }))

const mockGetUser = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser } })
  ),
}))

const mockServiceFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}))

const mockGetOrCreate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/customers', () => ({
  getOrCreateStripeCustomer: mockGetOrCreate,
}))

const mockSessionsCreate = vi.hoisted(() => vi.fn())
const mockPortalCreate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: mockSessionsCreate } },
    billingPortal: { sessions: { create: mockPortalCreate } },
  },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { POST as membershipCheckout } from '@/app/api/stripe/create-membership-checkout/route'
import { POST as storyPackCheckout } from '@/app/api/stripe/create-story-pack-checkout/route'
import { POST as portalSession } from '@/app/api/stripe/create-portal-session/route'
import { NextRequest } from 'next/server'

// ── Helpers ────────────────────────────────────────────────────────────────

const USER = { id: 'user-123', email: 'test@example.com' }

function makeRequest(body: unknown, url = 'http://localhost/api/stripe/test') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeProductQuery(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://rounddoorstudio.com'
  process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_test'
  process.env.STRIPE_PRICE_YEARLY = 'price_yearly_test'

  mockGetUser.mockResolvedValue({ data: { user: USER } })
  mockGetOrCreate.mockResolvedValue('cus_test123')
  mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' })
  mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/test' })
})

// ── create-membership-checkout ─────────────────────────────────────────────

describe('POST /api/stripe/create-membership-checkout', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await membershipCheckout(makeRequest({ interval: 'monthly' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 for invalid interval', async () => {
    const res = await membershipCheckout(makeRequest({ interval: 'weekly' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid interval')
  })

  it('returns 400 when interval is missing', async () => {
    const res = await membershipCheckout(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('creates checkout session for monthly interval', async () => {
    const res = await membershipCheckout(makeRequest({ interval: 'monthly' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://checkout.stripe.com/test')
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test123',
        mode: 'subscription',
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
      })
    )
  })

  it('creates checkout session for yearly interval', async () => {
    const res = await membershipCheckout(makeRequest({ interval: 'yearly' }))
    expect(res.status).toBe(200)
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_yearly_test', quantity: 1 }],
      })
    )
  })

  it('calls getOrCreateStripeCustomer with user id and email', async () => {
    await membershipCheckout(makeRequest({ interval: 'monthly' }))
    expect(mockGetOrCreate).toHaveBeenCalledWith(USER.id, USER.email)
  })

  it('returns 500 on unexpected error', async () => {
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe down'))
    const res = await membershipCheckout(makeRequest({ interval: 'monthly' }))
    expect(res.status).toBe(500)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ success: false, retryAfter: 42 })
    const res = await membershipCheckout(makeRequest({ interval: 'monthly' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
  })
})

// ── create-story-pack-checkout ─────────────────────────────────────────────

describe('POST /api/stripe/create-story-pack-checkout', () => {
  beforeEach(() => {
    mockServiceFrom.mockReturnValue(
      makeProductQuery({ stripe_price_id: 'price_pack_test' })
    )
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await storyPackCheckout(makeRequest({ storySlug: 'fox-borrows-tiger' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when storySlug is missing', async () => {
    const res = await storyPackCheckout(makeRequest({}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing storySlug')
  })

  it('returns 400 when product is not found', async () => {
    mockServiceFrom.mockReturnValueOnce(makeProductQuery(null))
    const res = await storyPackCheckout(makeRequest({ storySlug: 'unknown-story' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Product not found')
  })

  it('creates one-time payment checkout session', async () => {
    const res = await storyPackCheckout(makeRequest({ storySlug: 'fox-borrows-tiger' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://checkout.stripe.com/test')
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test123',
        mode: 'payment',
        line_items: [{ price: 'price_pack_test', quantity: 1 }],
        metadata: {
          user_id: USER.id,
          story_slug: 'fox-borrows-tiger',
          product_type: 'story_pack',
        },
      })
    )
  })

  it('includes correct success/cancel URLs', async () => {
    await storyPackCheckout(makeRequest({ storySlug: 'fox-borrows-tiger' }))
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('/account?checkout=success'),
        cancel_url: expect.stringContaining('/stories/fox-borrows-tiger'),
      })
    )
  })

  it('returns 500 on unexpected error', async () => {
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe down'))
    const res = await storyPackCheckout(makeRequest({ storySlug: 'fox-borrows-tiger' }))
    expect(res.status).toBe(500)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ success: false, retryAfter: 30 })
    const res = await storyPackCheckout(makeRequest({ storySlug: 'fox-borrows-tiger' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
  })
})

// ── create-portal-session ──────────────────────────────────────────────────

describe('POST /api/stripe/create-portal-session', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await portalSession(new NextRequest('http://localhost/api/stripe/portal', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('creates a billing portal session', async () => {
    const res = await portalSession(new NextRequest('http://localhost/api/stripe/portal', { method: 'POST' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://billing.stripe.com/test')
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_test123',
      return_url: 'https://rounddoorstudio.com/account',
    })
  })

  it('calls getOrCreateStripeCustomer with user id and email', async () => {
    await portalSession(new NextRequest('http://localhost/api/stripe/portal', { method: 'POST' }))
    expect(mockGetOrCreate).toHaveBeenCalledWith(USER.id, USER.email)
  })

  it('returns 500 on unexpected error', async () => {
    mockPortalCreate.mockRejectedValueOnce(new Error('Stripe down'))
    const res = await portalSession(new NextRequest('http://localhost/api/stripe/portal', { method: 'POST' }))
    expect(res.status).toBe(500)
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValueOnce({ success: false, retryAfter: 55 })
    const res = await portalSession(new NextRequest('http://localhost/api/stripe/portal', { method: 'POST' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('55')
  })
})
