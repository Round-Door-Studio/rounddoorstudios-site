'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FREE_STORY_SLUG } from '@/lib/stories';

interface LockedStoryPackProps {
  isFreeStory: boolean;
  isLoggedIn: boolean;
  storySlug: string;
  onReveal: () => void;
  vocabCount: number;
  questionCount: number;
  activityCount: number;
}

export function LockedStoryPack({
  isFreeStory,
  isLoggedIn,
  storySlug,
  onReveal,
  vocabCount,
  questionCount,
  activityCount,
}: LockedStoryPackProps) {
  const [packLoading, setPackLoading] = useState(false);
  const inFlight = useRef(false);
  const router = useRouter();

  async function handleUnlockPack() {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/story/${storySlug}`);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setPackLoading(true);
    try {
      const res = await fetch('/api/stripe/create-story-pack-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storySlug }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      } else {
        setPackLoading(false);
        inFlight.current = false;
      }
    } catch {
      setPackLoading(false);
      inFlight.current = false;
    }
  }

  return (
    <div>
      <div className="pack-nav-block">
        <p className="pack-nav-eyebrow">Our Story Pack</p>

        <div className="locked-cards">
          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">📖 Read Along</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              <p>从前有一只小青蛙，住在一口深深的井里。</p>
              <p>Once there was a little frog who lived at the bottom of a well.</p>
              <p>他每天看着头顶那一小片天空。</p>
              <p>Every day he gazed at the small patch of sky above him.</p>
            </div>
            <p className="locked-desc">Mandarin + English · 简 Simplified + 繁 Traditional · Pinyin + Zhuyin</p>
          </div>

          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">🔤 New Words</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              <p>青蛙 · qīng wā · frog</p>
              <p>井底 · jǐng dǐ · bottom of a well</p>
              <p>天空 · tiān kōng · sky</p>
            </div>
            <p className="locked-desc">{vocabCount} words · 简 Simplified + 繁 Traditional · Pinyin + Zhuyin</p>
          </div>

          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">💬 Curious Questions</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              <p>Why did the frog think his well was the whole world?</p>
              <p>Have you ever changed your mind about something big?</p>
              <p>What would you do if you discovered a bigger world outside?</p>
            </div>
            <p className="locked-desc">{questionCount} questions to spark conversation</p>
          </div>

          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">🌏 Culture Corner</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              <p>Draw your own well and the sky above</p>
              <p>Explore the idiom 井底之蛙</p>
              <p>Family discussion and craft activity</p>
            </div>
            <p className="locked-desc">Printable · {activityCount} activities</p>
          </div>
        </div>
      </div>

      <div className="locked-cta">
        <div className="locked-cta-inner">
          <div className="locked-cta-text">
            <span className="locked-members-pill">🔒 Circle Members</span>
            <h2 className="locked-cta-heading">Open the full Story Pack.</h2>
            <ul className="locked-cta-list">
              <li>Read along in Mandarin — Simplified, Traditional, or side-by-side</li>
              <li>Vocabulary with pinyin and zhuyin support</li>
              <li>Discussion prompts for curious conversations</li>
              <li>Printable cultural activities for the whole family</li>
            </ul>
            <p className="locked-cta-note">Every story is free to listen to. Story Packs help support the podcast and bring each story to life.</p>
          </div>

          <div className="locked-cta-actions">
            {isFreeStory ? (
              <button className="btn-submit locked-cta-btn" onClick={onReveal}>
                Explore the Story Pack
              </button>
            ) : (
              <>
                <Link href="/membership" className="btn-submit locked-cta-btn">
                  Join the Circle
                  <span className="locked-cta-sub">All Story Packs · $20/mo or $216/yr</span>
                </Link>
                <button
                  type="button"
                  className="locked-cta-btn-secondary"
                  onClick={handleUnlockPack}
                  disabled={packLoading}
                >
                  {packLoading ? 'Redirecting…' : 'Unlock This Story Pack'}
                  <span className="locked-cta-sub">One-time · $8</span>
                </button>
                <Link href={`/story/${FREE_STORY_SLUG}`} className="locked-try-free">
                  Explore a Sample Story Pack
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
