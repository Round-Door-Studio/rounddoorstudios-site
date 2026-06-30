import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Round Door Studio · Terms of Service',
  description: 'Terms and conditions for using Round Door Studio.',
};

export default function TermsPage() {
  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 80px' }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Legal</p>
      <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 8 }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>
        Last updated: June 22, 2026
      </p>

      <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-soft)' }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Acceptance of terms
        </h2>
        <p>
          By accessing or using rounddoorstudio.com, you agree to be bound by these Terms of
          Service. If you do not agree, please do not use the site.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          What we offer
        </h2>
        <p>
          Round Door Studio provides bilingual Mandarin and English audio stories, vocabulary,
          discussion prompts, and cultural activities designed for families raising bilingual children.
          Some content requires a free account to access.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Your account
        </h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials
          and for all activity under your account. You must provide accurate information when
          creating an account. Accounts are for personal, non-commercial use only.
        </p>
        <p style={{ marginTop: 16 }}>
          You must be 13 years of age or older to create an account. Parents and guardians
          may create accounts on behalf of their children.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Intellectual property
        </h2>
        <p>
          All content on this site — including stories, audio, illustrations, text, and design —
          is owned by Round Door Studio and protected by copyright. You may not reproduce,
          distribute, or create derivative works from our content without written permission.
        </p>
        <p style={{ marginTop: 16 }}>
          Printable story packs, where provided, are licensed for personal and classroom use only.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Acceptable use
        </h2>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 6 }}>Use the site for any unlawful purpose</li>
          <li style={{ marginBottom: 6 }}>Attempt to gain unauthorized access to any part of the site</li>
          <li style={{ marginBottom: 6 }}>Share, resell, or redistribute our content without permission</li>
          <li style={{ marginBottom: 6 }}>Use automated tools to scrape or download content</li>
        </ul>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Disclaimer
        </h2>
        <p>
          Our content is provided for educational and entertainment purposes. We make no
          guarantees about language learning outcomes. The site is provided &ldquo;as is&rdquo; without
          warranties of any kind.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Limitation of liability
        </h2>
        <p>
          Round Door Studio shall not be liable for any indirect, incidental, or consequential
          damages arising from your use of the site or its content.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Changes to these terms
        </h2>
        <p>
          We may update these terms from time to time. We&apos;ll note the date of the last update
          at the top of this page. Continued use of the site after changes constitutes acceptance.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Contact
        </h2>
        <p>
          Questions about these terms? Reach us at{' '}
          <a href="mailto:hello@rounddoorstudio.com" style={{ color: 'var(--accent)' }}>
            hello@rounddoorstudio.com
          </a>.
        </p>
      </div>
    </section>
  );
}
