import { createClient } from '@supabase/supabase-js'
import type { Story } from '@/lib/types'

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

  if (error || !data) return null
  return mapRow(data as Record<string, unknown>)
}
