import type { Metadata } from 'next';
import { LibraryClient } from '@/components/LibraryClient';
import { getAllStoriesCached } from '@/lib/db/stories';

export const metadata: Metadata = {
  title: 'Round Door Studio · Story Library',
  description: 'Browse all bilingual Mandarin and English stories for curious minds.',
};

export default async function LibraryPage() {
  const stories = await getAllStoriesCached();

  return <LibraryClient stories={stories} />;
}
