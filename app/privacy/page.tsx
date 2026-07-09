import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Round Door Studio · Privacy Policy',
  description: 'How Round Door Studio collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 80px' }}>
      <p className="eyebrow" style={{ marginBottom: 14 }}>Legal</p>
      <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>
        Last updated: June 22, 2026
      </p>

      <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-soft)' }}>
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Who we are
        </h2>
        <p>
          Round Door Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) creates bilingual Mandarin and English
          audio stories for children. Our website is rounddoorstudio.com.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          What we collect
        </h2>
        <p>When you create an account, we collect:</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 6 }}><strong>Name</strong> — so we can greet you personally</li>
          <li style={{ marginBottom: 6 }}><strong>Email address</strong> — to manage your account and send you updates you&apos;ve opted into</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          If you sign in with Google, we receive your name, email address, and profile picture
          from Google as part of the authentication process. We do not store your profile picture.
        </p>
        <p style={{ marginTop: 16 }}>
          We also use Google Analytics (via Google Tag Manager) to understand how visitors use
          our site — pages visited, time on site, and general location. This data is aggregated
          and not linked to your account.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          How we use your information
        </h2>
        <ul style={{ paddingLeft: 24 }}>
          <li style={{ marginBottom: 6 }}>To provide access to our stories and content</li>
          <li style={{ marginBottom: 6 }}>To communicate with you about your account</li>
          <li style={{ marginBottom: 6 }}>To improve our website and content</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          We do not sell your personal information. We do not share it with third parties
          except as necessary to operate the service (authentication and analytics as described above).
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Data storage
        </h2>
        <p>
          Your account data is stored securely via Supabase, which uses industry-standard
          encryption at rest and in transit. We retain your data for as long as your account
          is active. You can request deletion at any time by contacting us.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Cookies
        </h2>
        <p>
          We use cookies to keep you logged in and to collect anonymous analytics data.
          You can disable cookies in your browser settings, though this may affect your
          ability to sign in.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Children&apos;s privacy
        </h2>
        <p>
          Our content is designed for children, but accounts are intended to be created by
          parents or guardians. We do not knowingly collect personal information from children
          under 13. If you believe a child has provided us with personal information, please
          contact us and we will delete it.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Your rights
        </h2>
        <p>You have the right to:</p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li style={{ marginBottom: 6 }}>Access the personal data we hold about you</li>
          <li style={{ marginBottom: 6 }}>Request correction or deletion of your data</li>
          <li style={{ marginBottom: 6 }}>Withdraw consent at any time</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          To exercise any of these rights, email us at{' '}
          <a href="mailto:therounddoorpodcast@gmail.com" style={{ color: 'var(--accent)' }}>
            therounddoorpodcast@gmail.com
          </a>.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Changes to this policy
        </h2>
        <p>
          We may update this policy from time to time. We&apos;ll note the date of the last update
          at the top of this page. Continued use of the site after changes constitutes acceptance.
        </p>

        <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, marginTop: 40 }}>
          Contact
        </h2>
        <p>
          Questions about this policy? Reach us at{' '}
          <a href="mailto:therounddoorpodcast@gmail.com" style={{ color: 'var(--accent)' }}>
            therounddoorpodcast@gmail.com
          </a>.
        </p>
      </div>
    </section>
  );
}
