import { FREE_STORY_SLUG } from '@/lib/stories'
import { createServiceClient } from '@/lib/supabase/service'
import { loadAllContentFromDB, getContentCountsFromDB } from '@/lib/db/content'
import type { StoryPageContent, StoryPackResult } from '@/lib/types'

/**
 * Single entry point for all story pack access checks.
 *
 * Returns the full StoryPageContent when access is granted,
 * or a StoryPackPreview (counts only) when it is not.
 *
 * Access rules (checked in order):
 *   1. FREE_STORY_SLUG — always accessible, no auth required
 *   2. Active subscription (status: active | trialing)
 *   3. Individual story pack purchase for this slug
 *   4. Valid entitlement grant (per-story or global, not expired)
 *   5. No access → preview
 */
export async function getStoryPackForUser(
  userId: string | null,
  storySlug: string
): Promise<StoryPackResult> {
  // Rule 1: story 1 is always free
  if (storySlug === FREE_STORY_SLUG) {
    const storyPack = await loadFullPack(storySlug)
    return { hasAccess: true, source: 'free', storyPack }
  }

  // No user — return preview immediately
  if (!userId) {
    const storyPack = await getContentCountsFromDB(storySlug)
    return { hasAccess: false, source: 'none', storyPack }
  }

  const supabase = createServiceClient()

  // Rule 2: active subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, plan_interval')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (sub) {
    const storyPack = await loadFullPack(storySlug)
    return {
      hasAccess: true,
      source: 'subscription',
      storyPack,
      subscriptionStatus: sub.status as string,
      planInterval: (sub.plan_interval as string | null) ?? undefined,
    }
  }

  // Rule 3: individual story pack purchase
  const { data: purchase } = await supabase
    .from('story_pack_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('story_slug', storySlug)
    .maybeSingle()

  if (purchase) {
    const storyPack = await loadFullPack(storySlug)
    return { hasAccess: true, source: 'purchase', storyPack }
  }

  // Rule 4: entitlement grant (per-story or global, not expired)
  const now = new Date().toISOString()
  const { data: grant } = await supabase
    .from('entitlement_grants')
    .select('id')
    .eq('user_id', userId)
    .or(`story_slug.eq.${storySlug},story_slug.is.null`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle()

  if (grant) {
    const storyPack = await loadFullPack(storySlug)
    return { hasAccess: true, source: 'grant', storyPack }
  }

  // No access
  const storyPack = await getContentCountsFromDB(storySlug)
  return { hasAccess: false, source: 'none', storyPack }
}

async function loadFullPack(storySlug: string): Promise<StoryPageContent | null> {
  const { storyContent, vocab, questions, activities } = await loadAllContentFromDB(storySlug)
  if (!storyContent) return null
  return { story: storyContent, vocab, questions, activities }
}
