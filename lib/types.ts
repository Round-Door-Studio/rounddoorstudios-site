/* ============================================================
   Shared TypeScript types for Round Door Studio.
   These match the JSON schemas in data/stories.js and
   content/<slug>/*.json.
   ============================================================ */

export type Script = 'simp' | 'trad';

/* ── Story catalog ── */
export interface AudioLinks {
  spotify: string;
  youtube: string;
  apple: string;
}

export interface Story {
  ep: number;
  slug: string;
  season: number;
  released: boolean;
  part?: number;
  parts?: number;
  title: {
    en: string;
    simp: string;
    trad: string;
  };
  blurb?: string;
  runtime?: string;
  pub?: string;
  coverColor?: string;
  coverImage?: string;
  coverImageLandscape?: string;
  audio?: {
    en: AudioLinks;
    zh: AudioLinks;
  };
  hasBundle?: boolean;
}

/* ── Story content (story.json) ── */
export interface PinyinEntry {
  text: string;
  reading: string;
}

export interface SimpLineData {
  text: string;
  pinyin: PinyinEntry[];
}

export interface TradLineData {
  text: string;
  bpmf?: string;
}

export interface StoryLine {
  id: string;
  simp: SimpLineData | string;
  trad: TradLineData | string;
  en: string;
}

export interface StoryContent {
  slug: string;
  title: { en: string; simp: string; trad: string };
  readAlong?: { lines: StoryLine[] };
  lines?: StoryLine[];
}

/* ── Vocabulary (vocab.json) ── */
export interface VocabExample {
  simp?: { text: string; pinyin?: PinyinEntry[] };
  trad?: { text: string; bpmf?: string };
  en?: string;
}

export interface VocabWord {
  tier?: 'door' | 'beyond';
  simp?: { text: string; pinyin?: PinyinEntry[] } | string;
  trad?: { text: string; bpmf?: string } | string;
  pinyin?: string;
  zhuyin?: string;
  en?: string;
  example?: VocabExample;
}

export interface VocabContent {
  slug: string;
  vocab: VocabWord[];
}

/* ── Questions (questions.json) ── */
export interface Question {
  simp?: { text: string; pinyin?: PinyinEntry[] };
  trad?: { text?: string; bpmf?: string };
  en: string;
}

export interface QuestionsContent {
  slug: string;
  open: Question[];
  beyond: Question[];
}

/* ── Activities (activities.json) ── */
export interface I18nText {
  text: string;
  pinyin?: PinyinEntry[];
}

export interface I18nEntry {
  en?: string;
  simp?: I18nText;
  trad?: { text: string; bpmf?: string };
}

export interface Activity {
  id: string;
  title?: string | { en: string; simp?: I18nText; trad?: { text: string; bpmf?: string } };
  desc?: string | { en: string; simp?: I18nText; trad?: { text: string; bpmf?: string } };
  time?: string | { en: string; simp?: I18nText; trad?: { text: string; bpmf?: string } };
  accent?: string;
  materials?: (string | I18nEntry)[];
  steps?: (string | I18nEntry)[];
}

export interface ActivitiesContent {
  slug: string;
  activities: Activity[];
}

/* ── Aggregated content for a story page ── */
export interface StoryPageContent {
  story: StoryContent;
  vocab: VocabContent;
  questions: QuestionsContent;
  activities: ActivitiesContent;
}
