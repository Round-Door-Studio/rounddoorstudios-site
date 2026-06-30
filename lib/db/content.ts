import { createServiceClient } from '@/lib/supabase/service'
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
  const { data } = await supabase
    .from('story_content')
    .select('read_along, vocab, questions, activities')
    .eq('slug', slug)
    .single()

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
  const { data } = await supabase
    .from('story_content')
    .select('vocab, questions, activities')
    .eq('slug', slug)
    .single()

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
