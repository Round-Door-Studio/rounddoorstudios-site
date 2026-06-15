'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ScriptToggle } from './ScriptToggle';

export function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <header className="nav">
      <Link className="nav-brand" href="/">
        <Image src="/icons/round-door.png" alt="Round Door Studio" width={34} height={34} />
        <b>Round Door <span>Studio</span></b>
      </Link>
      <nav className="nav-links">
        <Link href="/library" className={isActive('/library') ? 'is-on' : ''}>
          Library
        </Link>
        <Link href="/about" className={isActive('/about') ? 'is-on' : ''}>
          About
        </Link>
      </nav>
      <div className="nav-cta">
        <ScriptToggle />
      </div>
    </header>
  );
}
