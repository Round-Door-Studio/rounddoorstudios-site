'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ScriptToggle } from './ScriptToggle';
import { AuthModal } from './AuthModal';
import { signOut } from '@/app/auth/actions';

interface NavProps {
  userEmail?: string | null;
  userName?: string | null;
}

export function Nav({ userEmail, userName }: NavProps) {
  const pathname = usePathname();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);

  if (pathname === '/signup' || pathname === '/login') return null;

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const displayName = userName || userEmail?.split('@')[0] || 'there'
  const redirectTo = pathname ?? '/';

  return (
    <>
      <header className="nav">
        <Link className="nav-brand" href="/">
          <Image src="/icons/round-door.png" alt="Round Door Studio" width={34} height={34} />
          <b>Round Door Studio</b>
        </Link>
        <nav className="nav-links">
          <Link href="/library" className={isActive('/library') ? 'is-on' : ''}>
            Library
          </Link>
          <Link href="/membership" className={isActive('/membership') ? 'is-on' : ''}>
            Membership
          </Link>
          <Link href="/about" className={isActive('/about') ? 'is-on' : ''}>
            About
          </Link>
        </nav>
        <div className="nav-cta">
          <ScriptToggle />
          {userEmail ? (
            <>
              <Link className="nav-welcome" href="/account">Welcome back, {displayName}</Link>
              <form action={signOut}>
                <input type="hidden" name="redirectTo" value={pathname ?? '/'} />
                <button type="submit" className="btn-nav btn-nav-ghost">Logout</button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-nav btn-nav-ghost"
                onClick={() => setAuthMode('signin')}
              >
                Login
              </button>
              <button
                type="button"
                className="btn-nav btn-nav-primary"
                onClick={() => setAuthMode('signup')}
              >
                Join the Circle
              </button>
            </>
          )}
        </div>
      </header>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
          redirectTo={redirectTo}
        />
      )}
    </>
  );
}
