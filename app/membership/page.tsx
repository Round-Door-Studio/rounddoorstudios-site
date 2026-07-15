'use client';

import { Modal, useModal } from '@/components/Modal';

// Note: metadata export doesn't work in 'use client' — move to a layout
// if this page needs to be a Server Component.
// export const metadata: Metadata = { ... };

export default function MembershipPage() {
  const { open, openModal, closeModal } = useModal();

  return (
    <>
      <section
        style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '60px 24px 28px' }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>The stories stay free · 故事永远免费</p>
        <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', marginBottom: 14 }}>
          Join the Round Door Circle.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2.1vw, 18px)', lineHeight: 1.65, color: 'var(--ink-soft)' }}>
          Every story is free on Spotify, YouTube, and Apple Podcasts — forever.
          The Round Door Circle helps families keep the story going with printable story packs,
          read-along storybooks, vocabulary, curious questions, and cultural activities.
        </p>
      </section>

      <section
        style={{
          maxWidth: 880, margin: '0 auto', padding: '8px 24px 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
        }}
        className="prices-grid"
      >
        <div className="card" style={{ padding: 28, position: 'relative' }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Free</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 12px' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 46 }}>$0</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/month</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>Forever free. No card needed.</p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: 'var(--ink-soft)' }}>
            <li>All episodes on Spotify, YouTube &amp; Apple</li>
            <li>New stories every week</li>
            <li>English &amp; Mandarin versions of every episode</li>
          </ul>
        </div>

        <div
          className="card"
          style={{
            padding: 28, position: 'relative',
            border: '1px solid var(--accent)',
            boxShadow: '0 14px 40px var(--shadow)',
          }}
        >
          <span
            style={{
              position: 'absolute', top: -10, right: 18,
              background: 'var(--accent)', color: '#fff',
              padding: '4px 10px', borderRadius: 999,
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            Coming soon
          </span>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Circle Member</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 12px' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 46 }}>$5</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/month</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>Cancel any time.</p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: 'var(--ink-soft)' }}>
            <li>Everything in Free</li>
            <li>Printable story packs for every episode</li>
            <li>Read-along storybooks with pinyin &amp; zhuyin</li>
            <li>Vocabulary cards with example sentences</li>
            <li>Curious questions for family discussion</li>
            <li>Cultural activities &amp; crafts</li>
          </ul>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={openModal}>
              Get notified at launch
            </button>
          </div>
        </div>
      </section>

      <p
        style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, margin: '14px 0 48px' }}
      >
        🔒 Paid membership coming soon. Join the waitlist to be first to know.
      </p>

      <style>{`
        @media (max-width: 640px) { .prices-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Modal open={open} onClose={closeModal} />
    </>
  );
}
