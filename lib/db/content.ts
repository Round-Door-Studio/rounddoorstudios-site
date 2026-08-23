import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { STORY_CACHE_TTL_SECONDS } from '@/lib/db/stories'
import type { StoryContent, VocabContent, QuestionsContent, ActivitiesContent } from '@/lib/types'

/**
 * Load all story content in one query — for authenticated users.
 */
export async function loadAllContentFromDB(slug: string): Promise<{
  storyContent: StoryContent | null
  vocab: VocabContent
  questions: QuestionsContent
  activities: ActivitiesContent
}> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('story_content')
    .select('read_along, vocab, questions, activities')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('[db/content] loadAllContentFromDB failed for slug:', slug, error.message)
  }

  return {
    storyContent: (data?.read_along as StoryContent) ?? null,
    vocab: (data?.vocab as VocabContent) ?? { slug, vocab: [] },
    questions: (data?.questions as QuestionsContent) ?? { slug, open: [], beyond: [] },
    activities: (data?.activities as ActivitiesContent) ?? { slug, activities: [] },
  }
}

/**
 * Get content counts only — used for the locked preview cards.
 * Uses service role to bypass RLS (anon cannot read story_content).
 * Only counts are extracted — the full content is never passed to the client.
 */
export async function getContentCountsFromDB(slug: string): Promise<{
  vocabCount: number
  questionCount: number
  activityCount: number
}> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('story_content')
    .select('vocab, questions, activities')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('[db/content] getContentCountsFromDB failed for slug:', slug, error.message)
  }
  if (!data) return { vocabCount: 0, questionCount: 0, activityCount: 0 }

  const vocab = data.vocab as { vocab: unknown[] } | null
  const questions = data.questions as { open: unknown[]; beyond: unknown[] } | null
  const activities = data.activities as { activities: unknown[] } | null

  return {
    vocabCount: vocab?.vocab?.length ?? 0,
    questionCount: (questions?.open?.length ?? 0) + (questions?.beyond?.length ?? 0),
    activityCount: activities?.activities?.length ?? 0,
  }
}

// ── Cached reads ──────────────────────────────────────────────────────────────
// Content is the same for every viewer (access-level checks happen separately
// in lib/db/access.ts, which stays uncached) — safe to share across requests
// for STORY_CACHE_TTL_SECONDS.

export const loadAllContentCached = unstable_cache(
  loadAllContentFromDB,
  ['story-content-full'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['story-content'] },
)

export const getContentCountsCached = unstable_cache(
  getContentCountsFromDB,
  ['story-content-counts'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['story-content'] },
)
