import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (hoisted so they're available before imports) ────────────────────

const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}))

const mockLoadAll = vi.hoisted(() => vi.fn())
const mockGetCounts = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/content', () => ({
  loadAllContentFromDB: mockLoadAll,
  getContentCountsFromDB: mockGetCounts,
}))

// FREE_STORY_SLUG = 'frog-at-the-bottom-of-the-well'
vi.mock('@/lib/stories', () => ({
  FREE_STORY_SLUG: 'frog-at-the-bottom-of-the-well',
}))

import { getStoryPackForUser } from '@/lib/db/access'
import type { StoryPageContent, StoryPackPreview } from '@/lib/types'

// ── Fixtures ───────────────────────────────────────────────────────────────

const PAID_SLUG = 'qu-yuan-and-dragon-boat-festival'
const FREE_SLUG = 'frog-at-the-bottom-of-the-well'
const OTHER_SLUG = 'mend-the-sheep-pen'
const USER_ID = 'user-abc-123'

const fullPack: StoryPageContent = {
  story: { slug: PAID_SLUG, title: { en: 'Test', simp: '测', trad: '測' } },
  vocab: { slug: PAID_SLUG, vocab: [{ en: 'word' }, { en: 'word2' }] },
  questions: { slug: PAID_SLUG, open: [{ en: 'Q1' }], beyond: [{ en: 'Q2' }] },
  activities: { slug: PAID_SLUG, activities: [{ id: 'a1' }] },
}

const preview: StoryPackPreview = { vocabCount: 2, questionCount: 2, activityCount: 1 }

// Supabase query builder chain stub
function makeQuery(result: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: result, error: null }),
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadAll.mockResolvedValue({
    storyContent: fullPack.story,
    vocab: fullPack.vocab,
    questions: fullPack.questions,
    activities: fullPack.activities,
  })
  mockGetCounts.mockResolvedValue(preview)
  // Default: all DB queries return no data
  mockFrom.mockReturnValue(makeQuery(null))
})

// ── Free story ─────────────────────────────────────────────────────────────

describe('free story (FREE_STORY_SLUG)', () => {
  it('returns full pack with source "free" — no user', async () => {
    const result = await getStoryPackForUser(null, FREE_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('free')
    expect(result.storyPack).toEqual(fullPack)
    expect(mockLoadAll).toHaveBeenCalledWith(FREE_SLUG)
  })

  it('returns full pack with source "free" — logged-in user', async () => {
    const result = await getStoryPackForUser(USER_ID, FREE_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('free')
  })
})

// ── No user ────────────────────────────────────────────────────────────────

describe('no user (logged out)', () => {
  it('returns preview with source "none" for a paid story', async () => {
    const result = await getStoryPackForUser(null, PAID_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
    expect(result.storyPack).toEqual(preview)
    expect(mockGetCounts).toHaveBeenCalledWith(PAID_SLUG)
  })

  it('does not query the database', async () => {
    await getStoryPackForUser(null, PAID_SLUG)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ── Active subscription ────────────────────────────────────────────────────

describe('active subscription', () => {
  it('returns full pack with source "subscription" for active status', async () => {
    mockFrom.mockReturnValueOnce(
      makeQuery({ status: 'active', plan_interval: 'monthly' })
    )
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('subscription')
    if (result.hasAccess) {
      expect(result.subscriptionStatus).toBe('active')
      expect(result.planInterval).toBe('monthly')
      expect(result.storyPack).toEqual(fullPack)
    }
  })

  it('returns full pack for trialing status', async () => {
    mockFrom.mockReturnValueOnce(
      makeQuery({ status: 'trialing', plan_interval: 'yearly' })
    )
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('subscription')
  })

  it('returns preview for canceled subscription with no purchase', async () => {
    // subscription query returns null (canceled doesn't match active/trialing filter)
    // purchase query returns null
    // grant query returns null
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
  })

  it('returns preview for past_due subscription', async () => {
    // past_due doesn't match the .in('status', ['active', 'trialing']) filter
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
  })
})

// ── Individual purchase ────────────────────────────────────────────────────

describe('individual story pack purchase', () => {
  beforeEach(() => {
    // sub query returns null (no active sub)
    // purchase query set per test
    mockFrom
      .mockReturnValueOnce(makeQuery(null))   // subscriptions
  })

  it('returns full pack for matching story slug', async () => {
    mockFrom.mockReturnValueOnce(makeQuery({ id: 'purchase-1' })) // purchases
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('purchase')
    expect(result.storyPack).toEqual(fullPack)
  })

  it('returns preview when purchase exists for a different slug', async () => {
    mockFrom.mockReturnValueOnce(makeQuery(null))  // purchases (wrong slug)
    mockFrom.mockReturnValueOnce(makeQuery(null))  // grants
    const result = await getStoryPackForUser(USER_ID, OTHER_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
  })
})

// ── Entitlement grants ─────────────────────────────────────────────────────

describe('entitlement grants', () => {
  beforeEach(() => {
    mockFrom
      .mockReturnValueOnce(makeQuery(null))  // subscriptions
      .mockReturnValueOnce(makeQuery(null))  // purchases
  })

  it('returns full pack for matching story_slug grant', async () => {
    mockFrom.mockReturnValueOnce(makeQuery({ id: 'grant-1' }))
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('grant')
    expect(result.storyPack).toEqual(fullPack)
  })

  it('returns full pack for global grant (story_slug = null)', async () => {
    mockFrom.mockReturnValueOnce(makeQuery({ id: 'grant-global' }))
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('grant')
  })

  it('returns preview for expired grant', async () => {
    // expired grant doesn't match the expires_at.gt filter → returns null
    mockFrom.mockReturnValueOnce(makeQuery(null))
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
  })
})

// ── No access ─────────────────────────────────────────────────────────────

describe('no access (free logged-in user)', () => {
  it('returns preview with counts when no sub, purchase, or grant', async () => {
    // all three DB queries return null (defaults from beforeEach)
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe('none')
    expect(result.storyPack).toEqual(preview)
    expect(mockGetCounts).toHaveBeenCalledWith(PAID_SLUG)
    expect(mockLoadAll).not.toHaveBeenCalled()
  })
})

// ── DB-level content tests ─────────────────────────────────────────────────
// These verify that the correct DB function is called based on access.
// The most important tests: confirm content never reaches a non-paying user.

describe('DB-level content gating', () => {
  it('free user: getContentCountsFromDB called, loadAllContentFromDB NOT called', async () => {
    await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(mockGetCounts).toHaveBeenCalledWith(PAID_SLUG)
    expect(mockLoadAll).not.toHaveBeenCalled()
  })

  it('subscribed user: loadAllContentFromDB called, getContentCountsFromDB NOT called', async () => {
    mockFrom.mockReturnValueOnce(makeQuery({ status: 'active', plan_interval: 'monthly' }))
    await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(mockLoadAll).toHaveBeenCalledWith(PAID_SLUG)
    expect(mockGetCounts).not.toHaveBeenCalled()
  })

  it('purchased user: loadAllContentFromDB called, getContentCountsFromDB NOT called', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery(null))              // no sub
      .mockReturnValueOnce(makeQuery({ id: 'p-1' }))    // purchase match
    await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(mockLoadAll).toHaveBeenCalledWith(PAID_SLUG)
    expect(mockGetCounts).not.toHaveBeenCalled()
  })

  it('storyPack is null when content not yet seeded but user has access', async () => {
    mockFrom.mockReturnValueOnce(makeQuery({ status: 'active', plan_interval: 'monthly' }))
    mockLoadAll.mockResolvedValueOnce({
      storyContent: null,
      vocab: { slug: PAID_SLUG, vocab: [] },
      questions: { slug: PAID_SLUG, open: [], beyond: [] },
      activities: { slug: PAID_SLUG, activities: [] },
    })
    const result = await getStoryPackForUser(USER_ID, PAID_SLUG)
    expect(result.hasAccess).toBe(true)
    expect(result.storyPack).toBeNull()
  })
})
