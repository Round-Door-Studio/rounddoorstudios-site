'use client';

import { useEffect, useRef, useState } from 'react';
import { MAILERLITE_FORM_URL } from '@/lib/config';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

export function Modal({ open, onClose }: ModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => emailRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
    } catch { /* no-cors swallows the response */ }
    setSubmitted(true);
  }

  if (!open) return null;

  return (
    <div
      className="overlay open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>

        {submitted ? (
          <div className="success" style={{ display: 'block' }}>
            <div className="success-icon">✓</div>
            <h3>You&apos;re on the list!</h3>
            <p>We&apos;ll be in touch soon.<br />Keep an eye on your inbox.</p>
          </div>
        ) : (
          <div id="formPanel">
            <h2 id="modalTitle">Don&apos;t miss the next story</h2>
            <p className="sub">
              New bilingual stories, story packs, and cultural activities — straight to your inbox.
              Drop your email and we&apos;ll let you know the moment the next door opens.
            </p>
            <form
              action={MAILERLITE_FORM_URL}
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
  );
}

/* Convenience hook for pages that need a modal trigger */
export function useModal() {
  const [open, setOpen] = useState(false);
  return { open, openModal: () => setOpen(true), closeModal: () => setOpen(false) };
}
