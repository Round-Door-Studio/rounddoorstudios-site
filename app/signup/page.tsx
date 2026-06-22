'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
    } catch { /* no-cors swallows the response */ }
    setSubmitted(true);
  }

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link href="/" className="nav-brand">
          <Image src="/icons/round-door.png" alt="Round Door Studio" width={34} height={34} />
          <b>Round Door Studio</b>
        </Link>
      </header>

      <div className="signup-body">
        <div className="signup-wrap">
          {submitted ? (
            <div className="signup-success">
              <div className="success-icon">✓</div>
              <h2>You&apos;re on the list!</h2>
              <p>
                We&apos;ll be in touch soon. Keep an eye on your inbox.
                <br />You can close this tab now.
              </p>
            </div>
          ) : (
            <div className="modal">
              <p className="eyebrow">Join the community</p>
              <h2>Be the first through the door</h2>
              <p className="sub">
                Round Door Studio makes bilingual Mandarin–English stories for curious kids and
                the families who raise them. New stories, story packs, and cultural activities —
                drop your email and we&apos;ll let you know the moment the next door opens.
              </p>
              <form
                action="https://assets.mailerlite.com/jsonp/2318264/forms/186598057362589116/subscribe"
                method="post"
                onSubmit={handleSubmit}
              >
                <div className="field">
                  <label htmlFor="ml-email">Email Address</label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="ml-email"
                    aria-label="email"
                    aria-required="true"
                    name="fields[email]"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <input type="hidden" name="ml-submit" value="1" />
                <input type="hidden" name="anticsrf" value="true" />
                <button type="submit" className="btn-submit">Keep me posted</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
