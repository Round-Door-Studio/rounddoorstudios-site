import Link from 'next/link';
import { StoryCover } from './StoryCover';
import { ListenControl } from './ListenControl';
import type { Story } from '@/lib/types';
import { padNum } from '@/lib/stories';

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const href = `/story/${story.slug}`;

  if (!story.released) {
    return (
      <article className="story-card is-soon" data-slug={story.slug}>
        <div className="story-link">
          <StoryCover story={story} />
        </div>
        <div className="story-meta">
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Story {padNum(story.num)} · Season {story.season}
          </p>
          <h3 className="story-title muted" style={{ opacity: 0.85 }}>Coming soon</h3>
          <p className="muted only-simp zh-simp" style={{ fontSize: 16 }}>敬请期待</p>
          <p className="muted only-trad zh-trad" style={{ fontSize: 16 }}>敬請期待</p>
          <p className="muted only-en" style={{ fontStyle: 'italic', fontSize: 13 }}>
            A new story waiting behind the door.
          </p>
          <span className="tag-soon">✦ Unreleased</span>
        </div>
      </article>
    );
  }

  return (
    <article className="story-card" data-slug={story.slug}>
      <div className="story-media">
        <Link className="story-link" href={href}>
          <StoryCover story={story} />
        </Link>
        <ListenControl audio={story.audio} variant="library" />
      </div>
      <div className="story-meta">
        <Link className="story-headline" href={href}>
          <p className="eyebrow" style={{ fontSize: 10 }}>
            Story {padNum(story.num)} · {story.runtime}
          </p>
          <h3 className="story-title">
            <span className="only-simp zh-simp">{story.title.simp}</span>
            <span className="only-trad zh-trad">{story.title.trad}</span>
            <span className="only-en">{story.title.en}</span>
          </h3>
          <p className="en-subtitle">{story.title.en}</p>
          <p className="story-desc">{story.blurb}</p>
        </Link>
        <Link className="btn btn-primary btn-sm story-pack-btn" href={href}>
          Open Story Pack
        </Link>
      </div>
    </article>
  );
}
