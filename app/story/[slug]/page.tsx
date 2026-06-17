import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getStoryBySlug, getReleasedStories, padNum } from '@/lib/stories';
import { loadStoryContent, loadVocab, loadQuestions, loadActivities } from '@/lib/content';
import { ListenControl } from '@/components/ListenControl';
import { StoryCover } from '@/components/StoryCover';
import { StoryPack } from '@/components/story/StoryPack';
import type { StoryPageContent } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getReleasedStories().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = getStoryBySlug(slug);
  if (!story) return {};
  return {
    title: `Round Door Studio · ${story.title.en}`,
    description: story.blurb,
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = getStoryBySlug(slug);

  if (!story) notFound();
  if (!story.released) {
    return (
      <div className="read-wrap">
        <Link className="read-back" href="/library">‹ Back to the library</Link>
        <div className="card" style={{ textAlign: 'center', padding: '48px 28px' }}>
          <div style={{ width: 72, height: 72, margin: '0 auto 18px' }}>
            <Image src="/icons/round-door.png" alt="" width={72} height={72} style={{ opacity: 0.85 }} />
          </div>
          <h1 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
            This door hasn&apos;t opened yet
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Come back at launch — or browse what&apos;s already open.
          </p>
          <div style={{ marginTop: 18 }}>
            <Link className="btn btn-primary" href="/library">Browse the library</Link>
          </div>
        </div>
      </div>
    );
  }

  // Load all content in parallel
  const [storyContent, vocab, questions, activities] = await Promise.all([
    loadStoryContent(slug),
    loadVocab(slug),
    loadQuestions(slug),
    loadActivities(slug),
  ]);

  if (!storyContent) {
    return (
      <div className="read-wrap">
        <Link className="read-back" href="/library">‹ Back to the library</Link>
        <div className="card" style={{ textAlign: 'center', padding: '48px 28px' }}>
          <h1 className="display" style={{ fontSize: 28, marginBottom: 8 }}>
            Story content is still being prepared
          </h1>
          <p className="muted" style={{ fontSize: 14 }}>Check back soon.</p>
          <div style={{ marginTop: 18 }}>
            <Link className="btn btn-primary" href="/library">Browse the library</Link>
          </div>
        </div>
      </div>
    );
  }

  const content: StoryPageContent = { story: storyContent, vocab, questions, activities };

  const released = getReleasedStories();
  const idx = released.findIndex((s) => s.slug === slug);
  const prevStory = idx > 0 ? released[idx - 1] : null;
  const nextStory = idx < released.length - 1 ? released[idx + 1] : null;

  return (
    <div className="read-wrap">
      <Link className="read-back" href="/library">‹ Back to the library</Link>

      {/* Story hero with prev/next navigation */}
      <div className="story-hero-nav">
        {prevStory ? (
          <Link
            href={`/story/${prevStory.slug}`}
            className="story-nav-arrow story-nav-arrow--l"
            aria-label={`Previous: ${prevStory.title.en}`}
            title={prevStory.title.en}
          >
            <span className="bk-chip">‹</span>
          </Link>
        ) : (
          <span className="story-nav-arrow story-nav-arrow--l story-nav-arrow--disabled" aria-hidden="true">
            <span className="bk-chip">‹</span>
          </span>
        )}
        <div className="read-hero">
        <div style={{ width: 132 }}>
          <StoryCover story={story} />
        </div>
        <div>
          <div className="read-hero-main">
            <div className="read-hero-title">
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                Story {padNum(story.num)} · Season {story.season} · {story.runtime}
              </p>
              <h1 className="display">
                <span className="only-simp zh-simp">{story.title.simp}</span>
                <span className="only-trad zh-trad">{story.title.trad}</span>
                <span className="only-en">{story.title.en}</span>
              </h1>
              <p className="read-en-title">{story.title.en}</p>
              {story.blurb && <p className="read-blurb">{story.blurb}</p>}
            </div>
            <ListenControl audio={story.audio} variant="detail" />
          </div>
        </div>
        </div>{/* end .read-hero */}
        {nextStory ? (
          <Link
            href={`/story/${nextStory.slug}`}
            className="story-nav-arrow story-nav-arrow--r"
            aria-label={`Next: ${nextStory.title.en}`}
            title={nextStory.title.en}
          >
            <span className="bk-chip">›</span>
          </Link>
        ) : (
          <span className="story-nav-arrow story-nav-arrow--r story-nav-arrow--disabled" aria-hidden="true">
            <span className="bk-chip">›</span>
          </span>
        )}
      </div>{/* end .story-hero-nav */}

      {/* Interactive story pack (client component) */}
      <StoryPack content={content} />
    </div>
  );
}
