'use client';

import { useScript } from '@/context/ScriptContext';
import type { Script } from '@/lib/types';

export function ScriptToggle() {
  const { script, setScript } = useScript();

  return (
    <div className="script-toggle" aria-label="Choose script">
      <button data-s="simp" className={script === 'simp' ? 'is-on' : ''} onClick={() => setScript('simp' as Script)}>
        简 <span className="lbl">Simplified</span>
      </button>
      <span className="sep">·</span>
      <button data-s="trad" className={script === 'trad' ? 'is-on' : ''} onClick={() => setScript('trad' as Script)}>
        繁 <span className="lbl">Traditional</span>
      </button>
    </div>
  );
}
