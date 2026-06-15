'use client';

import { useState } from 'react';
import type { AudioLinks } from '@/lib/types';

interface ListenControlProps {
  audio?: { en: AudioLinks; zh: AudioLinks };
  variant?: 'library' | 'detail';
}

const PLATFORMS = [
  { key: 'spotify' as const, label: 'Spotify', color: '#1DB954' },
  { key: 'youtube' as const, label: 'YouTube', color: '#FF4136' },
  { key: 'apple' as const, label: 'Apple Podcasts', color: '#A6A6A6' },
];

export function ListenControl({ audio, variant = 'library' }: ListenControlProps) {
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [fading, setFading] = useState(false);

  const isDetail = variant === 'detail';
  const cls = `read-listen${isDetail ? ' listen-control--detail' : ' listen-control--library'}`;

  function switchLang(next: 'en' | 'zh') {
    if (next === lang) return;
    if (isDetail) {
      setFading(true);
      setTimeout(() => { setLang(next); setFading(false); }, 120);
    } else {
      setLang(next);
    }
  }

  const links = audio?.[lang] ?? { spotify: '#', youtube: '#', apple: '#' };

  return (
    <div className={cls} data-active-lang={lang}>
      <div className="listen-head">
        <span className="listen-label">Listen</span>
        <div className="listen-langs" role="tablist" aria-label="Audio language">
          {(['en', 'zh'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={`listen-lang${lang === l ? ' is-on' : ''}`}
              role="tab"
              aria-selected={lang === l}
              onClick={() => switchLang(l)}
            >
              {l === 'en' ? 'English' : '中文'}
            </button>
          ))}
        </div>
      </div>

      {isDetail ? (
        <div className={`listen-sets listen-sets--detail${fading ? ' is-fading' : ''}`}>
          <div className="pills">
            {PLATFORMS.map(({ key, label, color }) => (
              <a
                key={key}
                className="pill"
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="dot" style={{ background: color }} />
                {label}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="listen-sets">
          {(['en', 'zh'] as const).map((l) => (
            <div key={l} className="listen-set" data-lang={l} hidden={l !== lang}>
              <div className="pills">
                {PLATFORMS.map(({ key, label, color }) => (
                  <a
                    key={key}
                    className="pill"
                    href={audio?.[l]?.[key] ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="dot" style={{ background: color }} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
