'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoryCover } from './StoryCover';
import { ListenControl } from './ListenControl';
import type { Story } from '@/lib/types';
import { padEp } from '@/lib/stories';

interface BookViewProps {
  stories: Story[];
}

function isMobile() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width:880px)').matches;
}

export function BookView({ stories }: BookViewProps) {
  const [idx, setIdx] = useState(0);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(isMobile());
    update();
    const mq = window.matchMedia('(max-width:880px)');
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const perSpread = mobile ? 1 : 2;
  const total = Math.ceil(stories.length / perSpread);
  const safeIdx = Math.max(0, Math.min(idx, total - 1));

  const vis = stories.slice(safeIdx * perSpread, safeIdx * perSpread + perSpread);

  function BookStory({ story }: { story: Story | undefined }) {
    if (!story) return <div />;
    const href = `/story/${story.slug}`;

    if (!story.released) {
      return (
        <div className="book-story is-soon">
          <div className="story-link">
            <StoryCover story={story} />
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Episode {padEp(story.ep)} · Season {story.season}
            </p>
            <h3 className="story-title muted" style={{ opacity: 0.85 }}>Coming soon</h3>
            <p className="muted only-simp zh-simp" style={{ fontSize: 16 }}>敬请期待</p>
            <p className="muted only-trad zh-trad" style={{ fontSize: 16 }}>敬請期待</p>
            <p className="muted only-en" style={{ fontStyle: 'italic', fontSize: 13 }}>
              A new story waiting behind the door.
            </p>
            <span className="tag-soon">✦ Unreleased</span>
          </div>
        </div>
      );
    }

    return (
      <div className="book-story">
        <div className="story-media story-media--book">
          <Link className="story-link" href={href}>
            <StoryCover story={story} />
          </Link>
          <ListenControl audio={story.audio} variant="library" />
        </div>
        <div>
          <Link className="story-headline" href={href}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              Episode {padEp(story.ep)} · {story.pub}
            </p>
            <h3 className="story-title">
              <span className="only-simp zh-simp">{story.title.simp}</span>
              <span className="only-trad zh-trad">{story.title.trad}</span>
              <span className="only-en">{story.title.en}</span>
            </h3>
            <p className="en-subtitle">{story.title.en}</p>
            <p className="story-desc" style={{ margin: '8px 0 10px' }}>{story.blurb}</p>
          </Link>
          <Link className="btn btn-primary btn-sm story-pack-btn" href={href}>
            Open Story Pack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="book">
      <div className="book-flair">月門 · Round Door</div>

      {/* Left page */}
      <div className="book-page book-page--l">
        <div className="book-corner">{safeIdx * perSpread + 1} / {stories.length}</div>
        <BookStory story={vis[0]} />
        <button
          className="book-arrow book-arrow--l"
          aria-label="Previous page"
          disabled={safeIdx === 0}
          onClick={() => setIdx(safeIdx - 1)}
        >
          <span className="bk-chip">‹</span>
        </button>
      </div>

      {/* Right page */}
      <div className="book-page book-page--r">
        <div className="book-corner">
          {perSpread > 1
            ? Math.min(safeIdx * perSpread + 2, stories.length)
            : safeIdx + 1}{' '}
          / {stories.length}
        </div>
        <BookStory story={vis[1]} />
        <button
          className="book-arrow book-arrow--r"
          aria-label="Next page"
          disabled={safeIdx >= total - 1}
          onClick={() => setIdx(safeIdx + 1)}
        >
          <span className="bk-chip">›</span>
        </button>
      </div>
    </div>
  );
}
