import type { Metadata } from 'next';
import { HomeClient } from '@/components/HomeClient';
import { getLatestReleasedStoryCached } from '@/lib/db/stories';

export const metadata: Metadata = {
  title: 'Round Door Studio · Bilingual stories for curious minds',
  description:
    'Mandarin and English stories for bilingual families, learners, and curious minds — with printable story packs, vocabulary, discussion prompts, and cultural activities.',
};

export default async function HomePage() {
  const featured = await getLatestReleasedStoryCached();

  return <HomeClient featured={featured} />;
}
