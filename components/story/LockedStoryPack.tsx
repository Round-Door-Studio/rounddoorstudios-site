'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthModal } from '@/components/AuthModal';

interface PreviewVocab {
  simp: string;
  en: string;
  pinyin?: string;
}

interface LockedStoryPackProps {
  isFreeStory: boolean;
  onReveal: () => void;
  vocabCount: number;
  questionCount: number;
  activityCount: number;
  previewVocab: PreviewVocab[];
  previewQuestions: string[];
  previewActivities: string[];
  previewLines: { simp: string; en: string }[];
}

const FREE_STORY_SLUG = 'frog-at-the-bottom-of-the-well';

export function LockedStoryPack({
  isFreeStory,
  onReveal,
  vocabCount,
  questionCount,
  activityCount,
  previewVocab,
  previewQuestions,
  previewActivities,
  previewLines,
}: LockedStoryPackProps) {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const pathname = usePathname() ?? '/library';

  return (
    <div>
      <div className="pack-nav-block">
        <p className="pack-nav-eyebrow">Our Story Pack</p>

        <div className="locked-cards">
          {/* Read Along */}
          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">📖 Read Along</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              {previewLines.map((line, i) => (
                <p key={i} className={i % 2 === 0 ? 'zh-simp' : ''}>{line.simp || line.en}</p>
              ))}
            </div>
            <p className="locked-desc">Mandarin + English · 简 Simplified + 繁 Traditional · Pinyin + Zhuyin</p>
          </div>

          {/* New Words */}
          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">🔤 New Words</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              {previewVocab.map((w, i) => (
                <p key={i} className="zh-simp">{w.simp}{w.pinyin ? ` · ${w.pinyin}` : ''}{w.en ? ` · ${w.en}` : ''}</p>
              ))}
            </div>
            <p className="locked-desc">{vocabCount} words · 简 Simplified + 繁 Traditional · Pinyin + Zhuyin</p>
          </div>

          {/* Curious Questions */}
          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">💬 Curious Questions</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              {previewQuestions.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
            <p className="locked-desc">{questionCount} questions to spark conversation</p>
          </div>

          {/* Culture Corner */}
          <div className="locked-card">
            <div className="locked-card-head">
              <span className="locked-card-title">🌏 Culture Corner</span>
              <span className="locked-badge">🔒</span>
            </div>
            <div className="locked-preview" aria-hidden="true">
              {previewActivities.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <p className="locked-desc">Printable · {activityCount} activities</p>
          </div>
        </div>
      </div>

      <div className="locked-cta">
        <div className="locked-cta-inner">
          <div className="locked-cta-text">
            <span className="locked-members-pill">🔒 Circle Members</span>
            <h2 className="locked-cta-heading">Join the Circle and open the full Story Pack.</h2>
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
                <button
                  className="btn-submit locked-cta-btn"
                  onClick={() => { setAuthMode('signup'); setShowModal(true); }}
                >
                  Join the Circle
                </button>
                <Link href={`/story/${FREE_STORY_SLUG}`} className="locked-try-free">
                  Explore a Sample Story Pack
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowModal(false)}
          onSwitchMode={setAuthMode}
          redirectTo={pathname}
        />
      )}
    </div>
  );
}
