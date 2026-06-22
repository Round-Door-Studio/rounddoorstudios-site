import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { STORIES } from '../lib/stories'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Seeding stories...\n')

  // ── 1. stories table ──────────────────────────────────────────
  for (const s of STORIES) {
    const { error } = await supabase.from('stories').upsert({
      num:                    s.num,
      slug:                   s.slug,
      season:                 s.season,
      released:               s.released,
      part:                   s.part ?? null,
      parts:                  s.parts ?? null,
      title_en:               s.title.en,
      title_simp:             s.title.simp,
      title_trad:             s.title.trad,
      blurb:                  s.blurb ?? null,
      runtime:                s.runtime ?? null,
      pub:                    s.pub ?? null,
      cover_color:            s.coverColor ?? null,
      cover_image:            s.coverImage ?? null,
      cover_image_landscape:  s.coverImageLandscape ?? null,
      audio:                  s.audio ?? null,
      has_bundle:             s.hasBundle ?? false,
    }, { onConflict: 'slug' })

    if (error) {
      console.error(`  ✗ stories: ${s.slug}`, error.message)
    } else {
      console.log(`  ✓ stories: ${s.slug}`)
    }
  }

  // ── 2. story_content table ────────────────────────────────────
  console.log('\nSeeding story content...\n')

  for (const s of STORIES) {
    const dir = join(process.cwd(), 'content', s.slug)

    const storyPath     = join(dir, 'story.json')
    const vocabPath     = join(dir, 'vocab.json')
    const questionsPath = join(dir, 'questions.json')
    const activitiesPath = join(dir, 'activities.json')

    if (!existsSync(storyPath)) {
      console.log(`  – story_content: ${s.slug} (no content files, skipping)`)
      continue
    }

    const storyJson     = JSON.parse(readFileSync(storyPath, 'utf-8'))
    const vocabJson     = existsSync(vocabPath)     ? JSON.parse(readFileSync(vocabPath, 'utf-8'))     : null
    const questionsJson = existsSync(questionsPath) ? JSON.parse(readFileSync(questionsPath, 'utf-8')) : null
    const activitiesJson = existsSync(activitiesPath) ? JSON.parse(readFileSync(activitiesPath, 'utf-8')) : null

    const { error } = await supabase.from('story_content').upsert({
      slug:       s.slug,
      read_along: storyJson.readAlong ?? null,
      vocab:      vocabJson?.vocab ?? null,
      questions:  questionsJson
        ? { open: questionsJson.open, beyond: questionsJson.beyond }
        : null,
      activities: activitiesJson?.activities ?? null,
    }, { onConflict: 'slug' })

    if (error) {
      console.error(`  ✗ story_content: ${s.slug}`, error.message)
    } else {
      console.log(`  ✓ story_content: ${s.slug}`)
    }
  }

  console.log('\nDone.')
}

seed().catch(console.error)
