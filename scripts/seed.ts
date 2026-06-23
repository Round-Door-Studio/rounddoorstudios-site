import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { STORIES } from '../lib/stories'

config({ path: '.env.local' })

const DRY_RUN = !process.argv.includes('--write')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function display(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function diff(label: string, current: Record<string, unknown>, next: Record<string, unknown>) {
  const changes: string[] = []
  for (const key of Object.keys(next)) {
    const a = display(current[key] ?? null)
    const b = display(next[key] ?? null)
    if (a !== b) changes.push(`    ${key}: ${a} → ${b}`)
  }
  if (changes.length) {
    console.log(`  ~ ${label}`)
    changes.forEach((c) => console.log(c))
  } else {
    console.log(`  · ${label} (no changes)`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  if (DRY_RUN) {
    console.log('DRY RUN — no writes will be made. Pass --write to apply.\n')
  }

  // ── 1. stories table ──────────────────────────────────────────
  console.log('Stories\n')

  const { data: currentStories } = await supabase.from('stories').select('*')
  const currentBySlug = Object.fromEntries((currentStories ?? []).map((r) => [r.slug, r]))

  for (const s of STORIES) {
    const next = {
      num:                   s.num,
      slug:                  s.slug,
      season:                s.season,
      released:              s.released,
      part:                  s.part ?? null,
      parts:                 s.parts ?? null,
      title_en:              s.title.en,
      title_simp:            s.title.simp,
      title_trad:            s.title.trad,
      blurb:                 s.blurb ?? null,
      runtime:               s.runtime ?? null,
      pub:                   s.pub ?? null,
      cover_color:           s.coverColor ?? null,
      cover_image:           s.coverImage ?? null,
      cover_image_landscape: s.coverImageLandscape ?? null,
      audio:                 s.audio ?? null,
      has_bundle:            s.hasBundle ?? false,
    }

    if (DRY_RUN) {
      const current = currentBySlug[s.slug] ?? {}
      diff(s.slug, current as Record<string, unknown>, next as Record<string, unknown>)
    } else {
      const { error } = await supabase.from('stories').upsert(next, { onConflict: 'slug' })
      if (error) console.error(`  ✗ ${s.slug}`, error.message)
      else console.log(`  ✓ ${s.slug}`)
    }
  }

  // ── 2. story_content table ────────────────────────────────────
  console.log('\nStory content\n')

  const { data: currentContent } = await supabase.from('story_content').select('slug, read_along, vocab, questions, activities')
  const currentContentBySlug = Object.fromEntries((currentContent ?? []).map((r) => [r.slug, r]))

  for (const s of STORIES) {
    const dir = join(process.cwd(), 'content', s.slug)
    const storyPath      = join(dir, 'story.json')
    const vocabPath      = join(dir, 'vocab.json')
    const questionsPath  = join(dir, 'questions.json')
    const activitiesPath = join(dir, 'activities.json')

    if (!existsSync(storyPath)) {
      console.log(`  – ${s.slug} (no content files, skipping)`)
      continue
    }

    const storyJson      = JSON.parse(readFileSync(storyPath, 'utf-8'))
    const vocabJson      = existsSync(vocabPath)      ? JSON.parse(readFileSync(vocabPath, 'utf-8'))      : null
    const questionsJson  = existsSync(questionsPath)  ? JSON.parse(readFileSync(questionsPath, 'utf-8'))  : null
    const activitiesJson = existsSync(activitiesPath) ? JSON.parse(readFileSync(activitiesPath, 'utf-8')) : null

    const next = {
      slug:       s.slug,
      read_along: storyJson.readAlong ?? null,
      vocab:      vocabJson ?? null,
      questions:  questionsJson ? { open: questionsJson.open, beyond: questionsJson.beyond } : null,
      activities: activitiesJson ?? null,
    }

    if (DRY_RUN) {
      const current = currentContentBySlug[s.slug] ?? {}
      diff(s.slug, current as Record<string, unknown>, next as Record<string, unknown>)
    } else {
      const { error } = await supabase.from('story_content').upsert(next, { onConflict: 'slug' })
      if (error) console.error(`  ✗ ${s.slug}`, error.message)
      else console.log(`  ✓ ${s.slug}`)
    }
  }

  console.log(DRY_RUN ? '\nDry run complete. Run with --write to apply.' : '\nDone.')
}

seed().catch(console.error)
