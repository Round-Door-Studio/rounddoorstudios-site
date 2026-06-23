import type { Metadata } from 'next';
import { HomeClient } from '@/components/HomeClient';
import { getLatestReleasedStoryFromDB } from '@/lib/db/stories';

export const metadata: Metadata = {
  title: 'Round Door Studio · Bilingual stories for kids',
  description:
    'Mandarin and English stories for bilingual families — with printable story packs, vocabulary, discussion prompts, and cultural activities.',
};

export default async function HomePage() {
  const featured = await getLatestReleasedStoryFromDB();

  return <HomeClient featured={featured} />;
}
