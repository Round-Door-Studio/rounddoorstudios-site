import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import type { Story } from '@/lib/types'

// Story catalog rarely changes (an editorial edit + `npm run seed:write`),
// so pages should read through these cached wrappers instead of the
// `*FromDB` functions directly. Kept separate from the raw functions below
// so the existing unit tests (which exercise fresh DB reads per call) are
// unaffected. See STORY_CACHE_TTL_SECONDS for the staleness window.
export const STORY_CACHE_TTL_SECONDS = 300

// Cookie-free anon client — only reads released stories (RLS restricted)
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Service role client — reads all stories including unreleased
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function mapRow(row: Record<string, unknown>): Story {
  return {
    num: row.num as number,
    slug: row.slug as string,
    season: row.season as number,
    released: row.released as boolean,
    part: row.part as number | undefined ?? undefined,
    parts: row.parts as number | undefined ?? undefined,
    title: {
      en: row.title_en as string,
      simp: row.title_simp as string,
      trad: row.title_trad as string,
    },
    blurb: row.blurb as string | undefined ?? undefined,
    runtime: row.runtime as string | undefined ?? undefined,
    pub: row.pub as string | undefined ?? undefined,
    coverColor: row.cover_color as string | undefined ?? undefined,
    coverImage: row.cover_image as string | undefined ?? undefined,
    coverImageLandscape: row.cover_image_landscape as string | undefined ?? undefined,
    audio: row.audio as Story['audio'] ?? undefined,
    hasBundle: row.has_bundle as boolean | undefined ?? undefined,
  }
}

export async function getReleasedStoriesFromDB(): Promise<Story[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('released', true)
    .order('num', { ascending: true })

  if (error) console.error('[db/stories] getReleasedStoriesFromDB failed:', error.message)
  if (error || !data) return []
  return data.map(mapRow)
}

// Includes unreleased stories so the story page can show "coming soon"
export async function getStoryBySlugFromDB(slug: string): Promise<Story | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — expected for unknown slugs, not an error
    console.error('[db/stories] getStoryBySlugFromDB failed for slug:', slug, error.message)
  }
  if (error || !data) return null
  return mapRow(data as Record<string, unknown>)
}

// All stories including unreleased — for library display (coming soon cards)
export async function getAllStoriesFromDB(): Promise<Story[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('num', { ascending: true })

  if (error) console.error('[db/stories] getAllStoriesFromDB failed:', error.message)
  if (error || !data) return []
  return data.map(mapRow)
}

export async function getLatestReleasedStoryFromDB(): Promise<Story | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('released', true)
    .order('num', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[db/stories] getLatestReleasedStoryFromDB failed:', error.message)
  }
  if (error || !data) return null
  return mapRow(data as Record<string, unknown>)
}

// ── Cached reads ──────────────────────────────────────────────────────────────
// Use these from pages/components. Public, non-user-specific catalog data —
// safe to share across all viewers for STORY_CACHE_TTL_SECONDS.

export const getReleasedStoriesCached = unstable_cache(
  getReleasedStoriesFromDB,
  ['stories-released'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['stories'] },
)

export const getStoryBySlugCached = unstable_cache(
  getStoryBySlugFromDB,
  ['stories-by-slug'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['stories'] },
)

export const getAllStoriesCached = unstable_cache(
  getAllStoriesFromDB,
  ['stories-all'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['stories'] },
)

export const getLatestReleasedStoryCached = unstable_cache(
  getLatestReleasedStoryFromDB,
  ['stories-latest-released'],
  { revalidate: STORY_CACHE_TTL_SECONDS, tags: ['stories'] },
)
