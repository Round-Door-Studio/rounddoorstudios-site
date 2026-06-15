import Link from 'next/link';
import { StoryCover } from './StoryCover';
import type { Story } from '@/lib/types';
import { padEp } from '@/lib/stories';

interface FeaturedStoryProps {
  story: Story;
}

export function FeaturedStory({ story }: FeaturedStoryProps) {
  const href = `/story/${story.slug}`;

  return (
    <article className="featured">
      <Link className="featured-cover" href={href} aria-label={story.title.en}>
        <StoryCover story={story} />
      </Link>
      <div className="featured-body">
        <p className="eyebrow">Episode {padEp(story.ep)} · Season {story.season}</p>
        <h3 className="featured-zh">
          <span className="only-simp zh-simp">{story.title.simp}</span>
          <span className="only-trad zh-trad">{story.title.trad}</span>
        </h3>
        <p className="featured-en">{story.title.en}</p>
        <p className="featured-teaser">{story.blurb}</p>
        <div className="featured-meta">
          <span><b>{story.runtime ?? 'New'}</b> listen</span>
        </div>
        <div className="featured-cta">
          <Link className="btn btn-primary" href={href}>Listen Now</Link>
        </div>
      </div>
    </article>
  );
}
