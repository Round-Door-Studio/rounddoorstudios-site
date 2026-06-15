/* ============================================================
   Server-side content loading.
   These functions use Node.js `fs` and run only in
   Server Components / generateStaticParams.
   ============================================================ */

import { promises as fs } from 'fs';
import path from 'path';
import type { StoryContent, VocabContent, QuestionsContent, ActivitiesContent } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadStoryContent(slug: string): Promise<StoryContent | null> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, slug, 'story.json'), 'utf-8');
    return JSON.parse(raw) as StoryContent;
  } catch {
    return null;
  }
}

export async function loadVocab(slug: string): Promise<VocabContent> {
  return readJson<VocabContent>(path.join(CONTENT_DIR, slug, 'vocab.json'), { slug, vocab: [] });
}

export async function loadQuestions(slug: string): Promise<QuestionsContent> {
  return readJson<QuestionsContent>(path.join(CONTENT_DIR, slug, 'questions.json'), { slug, open: [], beyond: [] });
}

export async function loadActivities(slug: string): Promise<ActivitiesContent> {
  return readJson<ActivitiesContent>(path.join(CONTENT_DIR, slug, 'activities.json'), { slug, activities: [] });
}

export async function getAvailableContentSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
