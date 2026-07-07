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

function sortedStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
    }
    return v
  })
}

function display(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return sortedStringify(value)
  return String(value)
}

/** Returns changed field names, or empty array if nothing changed. */
function changedFields(current: Record<string, unknown>, next: Record<string, unknown>): string[] {
  return Object.keys(next).filter((key) => {
    const a = display(current[key] ?? null)
    const b = display(next[key] ?? null)
    return a !== b
  })
}

/** Returns which content files differ from what's in the DB. */
function changedContentFiles(
  current: Record<string, unknown>,
  next: { read_along: unknown; vocab: unknown; questions: unknown; activities: unknown },
  isNew: boolean,
): string[] {
  const files: string[] = []
  const check = (label: string, dbKey: keyof typeof next) => {
    const a = display(current[dbKey] ?? null)
    const b = display(next[dbKey] ?? null)
    if (a !== b) files.push(isNew ? `${label} (new)` : label)
  }
  check('story.json', 'read_along')
  check('vocab.json', 'vocab')
  check('questions.json', 'questions')
  check('activities.json', 'activities')
  return files
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  if (DRY_RUN) {
    console.log('DRY RUN — no writes will be made. Run with --write to apply.\n')
  }

  // ── 1. stories table ──────────────────────────────────────────
  console.log('Stories\n')

  const { data: currentStories } = await supabase.from('stories').select('*')
  const currentBySlug = Object.fromEntries((currentStories ?? []).map((r) => [r.slug, r]))

  let storiesChanged = 0

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

    const current = currentBySlug[s.slug] ?? {}
    const isNew = !currentBySlug[s.slug]
    const fields = changedFields(current as Record<string, unknown>, next as Record<string, unknown>)

    if (DRY_RUN) {
      if (fields.length) {
        storiesChanged++
        const tag = isNew ? '+ (new)' : `~ ${fields.join(', ')}`
        console.log(`  ${isNew ? '+' : '~'} ${s.slug}  ${tag.startsWith('+') ? '(new)' : `(${fields.join(', ')})`}`)
      }
    } else {
      const { error } = await supabase.from('stories').upsert(next, { onConflict: 'slug' })
      if (error) {
        console.error(`  ✗ ${s.slug}`, error.message)
      } else {
        if (fields.length) {
          const tag = isNew ? '(new)' : `(${fields.join(', ')})`
          console.log(`  ✓ ${s.slug}  ${tag}`)
        } else {
          console.log(`  · ${s.slug}  (no changes)`)
        }
      }
    }
  }

  if (DRY_RUN) {
    console.log(
      storiesChanged
        ? `\n  ${storiesChanged} of ${STORIES.length} stories have changes`
        : `\n  All ${STORIES.length} stories up to date`,
    )
  }

  // ── 2. story_content table ────────────────────────────────────
  console.log('\nStory content\n')

  const { data: currentContent } = await supabase
    .from('story_content')
    .select('slug, read_along, vocab, questions, activities')
  const currentContentBySlug = Object.fromEntries((currentContent ?? []).map((r) => [r.slug, r]))

  let contentChanged = 0

  for (const s of STORIES) {
    const dir = join(process.cwd(), 'content', s.slug)
    const storyPath      = join(dir, 'story.json')
    const vocabPath      = join(dir, 'vocab.json')
    const questionsPath  = join(dir, 'questions.json')
    const activitiesPath = join(dir, 'activities.json')

    if (!existsSync(storyPath)) {
      console.log(`  – ${s.slug}  (no content files, skipping)`)
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

    const current = currentContentBySlug[s.slug] ?? {}
    const isNew = !currentContentBySlug[s.slug]
    const files = changedContentFiles(current as Record<string, unknown>, next, isNew)

    if (DRY_RUN) {
      if (files.length) {
        contentChanged++
        console.log(`  ~ ${s.slug}`)
        files.forEach((f) => console.log(`      ${f}`))
      }
    } else {
      const { error } = await supabase.from('story_content').upsert(next, { onConflict: 'slug' })
      if (error) {
        console.error(`  ✗ ${s.slug}`, error.message)
      } else {
        if (files.length) {
          console.log(`  ✓ ${s.slug}  (${files.join(', ')})`)
        } else {
          console.log(`  · ${s.slug}  (no changes)`)
        }
      }
    }
  }

  if (DRY_RUN) {
    console.log(
      contentChanged
        ? `\n  ${contentChanged} stories have content changes`
        : `\n  All content up to date`,
    )
  }

  console.log(DRY_RUN ? '\nDry run complete. Run with --write to apply.' : '\nDone.')
}

seed().catch(console.error)
