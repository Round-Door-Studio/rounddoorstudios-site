import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-in">
        <div className="footer-brand">
          <Image src="/icons/round-door.png" alt="Round Door Studio" width={30} height={30} />
          <span className="footer-legal">© 2026 Round Door Studio · 月門故事</span>
          <Link href="/privacy" className="footer-legal-link">Privacy</Link>
          <Link href="/terms" className="footer-legal-link">Terms</Link>
        </div>
        <div className="footer-soc">
          <a
            className="soc"
            href="https://instagram.com/therounddoorpodcast"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://cdn.simpleicons.org/instagram/9B4761" width={18} height={18} alt="Instagram" />
          </a>
          <a
            className="soc"
            href="https://tiktok.com/@therounddoorpodcast"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://cdn.simpleicons.org/tiktok/9B4761" width={18} height={18} alt="TikTok" />
          </a>
        </div>
      </div>
    </footer>
  );
}
