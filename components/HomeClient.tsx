'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FeaturedStory } from '@/components/FeaturedStory';
import { Modal, useModal } from '@/components/Modal';
import type { Story } from '@/lib/types';

interface HomeClientProps {
  featured: Story | null;
}

export function HomeClient({ featured }: HomeClientProps) {
  const { open, openModal, closeModal } = useModal();

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-door" title="Open the door">
          <Image src="/icons/round-door.png" alt="" width={168} height={168} priority />
        </div>
        <div className="hero-copy">
          <p className="eyebrow" style={{ marginBottom: 14 }}>Round Door Studio · 月門故事</p>
          <h1 className="display">Mandarin and English stories for the modern bilingual family</h1>
          <p className="hero-sub">
            The same story, told in both languages. Read along, learn new words, spark conversations,
            and explore culture together.
          </p>
          <p className="hero-zh">
            <span className="only-simp zh-simp">为双语家庭而生的故事</span>
            <span className="only-trad zh-trad">為雙語家庭而生的故事</span>
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/library">Browse Stories</Link>
            <button type="button" className="btn btn-ghost" onClick={openModal}>
              Don&apos;t Miss the Next Story
            </button>
          </div>
        </div>
      </section>

      {/* ── Featured Story ── */}
      {featured && (
        <section className="section" id="featured">
          <div className="featured-head">
            <div>
              <p className="eyebrow" style={{ marginBottom: 6 }}>Featured Story</p>
              <h2>Start with this one.</h2>
            </div>
            <Link className="featured-all" href="/library">Browse all stories ›</Link>
          </div>
          <FeaturedStory story={featured} />
        </section>
      )}

      {/* ── Member teaser ── */}
      <section className="teaser">
        <div className="teaser-in">
          <div>
            <p className="eyebrow">For families who want more</p>
            <h2 className="display">Keep the door open.</h2>
            <p>
              Every story begins with a free podcast episode. Explore printable storybooks,
              vocabulary cards, discussion prompts, and cultural activities inspired by each story.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={openModal}>
                Don&apos;t Miss the Next Story
              </button>
              <Link className="btn btn-ghost" href="/story/frog-at-the-bottom-of-the-well">
                Peek inside a sample story pack
              </Link>
            </div>
          </div>
          <div className="teaser-cards">
            <div className="teaser-card">
              <div className="k">Discussion</div>
              <p className="desc">
                Open-ended questions to talk through the story together — what happened, why it
                matters, and the ideas underneath.
              </p>
              <div className="lines" />
            </div>
            <div className="teaser-card">
              <div className="k">Vocabulary</div>
              <p className="desc">
                Key words and phrases from the story in Chinese and English, with pinyin and zhuyin
                to learn side by side.
              </p>
              <div className="lines" />
            </div>
            <div className="teaser-card">
              <div className="k">Cultural Activities</div>
              <p className="desc">
                Hands-on crafts, recipes, and traditions that bring the story&apos;s culture to
                life at home.
              </p>
              <div className="lines" />
            </div>
          </div>
        </div>
      </section>

      <Modal open={open} onClose={closeModal} />
    </>
  );
}
