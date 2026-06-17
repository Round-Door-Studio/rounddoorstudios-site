import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Round Door Studio · About',
  description: 'Two Asian American moms bringing Chinese folklore to life for the modern bilingual family.',
};

export default function AboutPage() {
  return (
    <>
      <section
        style={{
          maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '64px 24px 32px',
        }}
      >
        <div style={{ width: 76, margin: '0 auto 22px' }}>
          <Image src="/icons/round-door.png" alt="" width={76} height={76} />
        </div>
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Our story ·{' '}
          <span className="only-simp zh-simp">我们的故事</span>
          <span className="only-trad zh-trad">我們的故事</span>
        </p>
        <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', marginBottom: 16 }}>
          Heritage shouldn&apos;t feel like homework.
        </h1>
        <p style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', lineHeight: 1.65, color: 'var(--ink-soft)' }}>
          We bring Chinese folklore, fables, and culture to life through audio stories designed for
          children growing up between two worlds. It should feel like an adventure worth sharing.
        </p>
      </section>

      <section
        style={{
          maxWidth: 880, margin: '0 auto', padding: '24px 24px 40px',
          display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, alignItems: 'center',
        }}
        className="founders-grid"
      >
        <div
          style={{
            width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid var(--paper)', boxShadow: '0 10px 30px var(--shadow)', flexShrink: 0,
            position: 'relative',
          }}
        >
          <Image
            src="/img/founders.jpg"
            alt="Lanssie and Catherine, founders of Round Door Studio"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
          />
        </div>
        <div>
          <h2
            style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 400, marginBottom: 4 }}
          >
            About us
          </h2>
          <p
            style={{
              fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 14,
            }}
          >
            <span className="only-simp zh-simp" style={{ fontSize: '1.3em' }}>嘿!</span>
            <span className="only-trad zh-trad" style={{ fontSize: '1.3em' }}>嘿!</span>
            <span className="only-en">Hi!</span>
            {' '}We&apos;re Catherine &amp; Lanssie
          </p>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, fontSize: 15 }}>
            Two Asian American moms (with Chinese and Taiwanese roots) asking the same question: how
            do we raise kids who feel at home in their heritage and their American life? Round Door
            Studio is our answer. Stories for every family that wants their kids to grow up knowing
            the myths, the culture, and the language that makes them who they are.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: 760, margin: '0 auto', padding: '8px 24px 72px', textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48, height: 2, background: 'var(--accent)', margin: '0 auto 22px',
            borderRadius: 2,
          }}
        />
        <h3
          style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 400, marginBottom: 12 }}
        >
          Why a round door?
        </h3>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, fontSize: 15 }}>
          The round door in our logo is inspired by the moon gates found in classical Chinese
          gardens. But to us, it&apos;s also a portal—a doorway into stories, adventures, language,
          and culture. Every time a child presses play, we hope they&apos;re stepping through that
          door into a new world.
        </p>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .founders-grid { grid-template-columns: 1fr !important; justify-items: center; text-align: center; gap: 24px !important; }
        }
      `}</style>
    </>
  );
}
