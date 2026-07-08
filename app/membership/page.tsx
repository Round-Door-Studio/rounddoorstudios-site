'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MembershipPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isYearly = interval === 'yearly';
  const monthlyEquiv = isYearly ? '$18' : '$20';
  const billingNote = isYearly ? '$216 billed yearly' : 'Billed monthly';
  const savings = isYearly ? 'Save 10%' : null;

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-membership-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push('/login?redirectTo=/membership');
        return;
      }
      if (data.url) {
        router.push(data.url);
      }
    } catch {
      setLoading(false);
    }
  }

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
          The Round Door Circle helps families keep the story going with read-along storybooks,
          vocabulary, curious questions, and cultural activities.
        </p>
      </section>

      <section
        style={{
          maxWidth: 880, margin: '0 auto', padding: '8px 24px 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
        }}
        className="prices-grid"
      >
        {/* Free card */}
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Free</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 12px' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 46 }}>$0</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/month</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>Forever free. No card needed.</p>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20, flex: 1 }}>
            <li>All podcast episodes on Spotify, YouTube &amp; Apple</li>
            <li>New stories every week</li>
            <li>English &amp; Mandarin versions of every episode</li>
          </ul>
          <a
            href="/signup"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Create a free account
          </a>
        </div>

        {/* Circle Member card */}
        <div
          className="card"
          style={{
            padding: 28, position: 'relative',
            border: '1px solid var(--accent)',
            boxShadow: '0 14px 40px var(--shadow)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Circle Member label + toggle on same row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p className="eyebrow" style={{ margin: 0 }}>Circle Member</p>
            <div className="interval-toggle">
              <button
                type="button"
                className={`interval-btn${!isYearly ? ' is-on' : ''}`}
                onClick={() => setInterval('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`interval-btn${isYearly ? ' is-on' : ''}`}
                onClick={() => setInterval('yearly')}
              >
                Yearly
                {savings && (
                  <span className="interval-savings">{savings}</span>
                )}
              </button>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 4px' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 46 }}>{monthlyEquiv}</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>/month</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>{billingNote} · Cancel any time.</p>

          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20, flex: 1 }}>
            <li>Everything in Free</li>
            <li>Read-along storybooks with pinyin &amp; zhuyin</li>
            <li>Vocabulary cards with example sentences</li>
            <li>Curious questions for family discussion</li>
            <li>Cultural activities &amp; crafts</li>
            <li>Every Story Pack, including new releases</li>
          </ul>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Join the Circle'}
          </button>
        </div>
      </section>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, margin: '14px 0 48px' }}>
        🔒 Payments are processed securely by Stripe. Cancel any time from your account.
      </p>

      <style>{`
        @media (max-width: 640px) { .prices-grid { grid-template-columns: 1fr !important; } }

        .interval-toggle {
          display: inline-flex;
          background: var(--paper-2);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
        }
        .interval-btn {
          border: 0; background: transparent; cursor: pointer;
          font-family: var(--serif); font-size: 13px; color: var(--ink-soft);
          padding: 5px 14px; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background .15s, color .15s;
        }
        .interval-btn.is-on {
          background: var(--paper); color: var(--ink);
          box-shadow: 0 1px 3px rgba(0,0,0,0.10);
        }
        .interval-savings {
          font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
          background: var(--accent); color: #fff;
          padding: 2px 6px; border-radius: 999px;
        }
      `}</style>
    </>
  );
}
