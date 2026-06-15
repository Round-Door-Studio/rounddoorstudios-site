import { StoryCard } from './StoryCard';
import type { Story } from '@/lib/types';

interface GridViewProps {
  stories: Story[];
}

export function GridView({ stories }: GridViewProps) {
  return (
    <div className="grid">
      {stories.map((story) => (
        <StoryCard key={story.slug} story={story} />
      ))}
    </div>
  );
}
