import { rubyHtml, rubyHtmlHighlight, bpmfHtmlHighlight, escapeHtml } from '@/lib/ruby';
import type { VocabWord } from '@/lib/types';

interface VocabSectionProps {
  vocab: VocabWord[];
}

function VocabCard({ word }: { word: VocabWord }) {
  const simpText = typeof word.simp === 'object' ? word.simp?.text : (word.simp ?? '');
  const tradEntry = typeof word.trad === 'object' ? word.trad : undefined;
  const tradText = tradEntry?.bpmf ?? tradEntry?.text ?? (typeof word.trad === 'string' ? word.trad : '');

  const pinyinDisplay = Array.isArray(
    typeof word.simp === 'object' ? word.simp?.pinyin : undefined,
  )
    ? (typeof word.simp === 'object' ? word.simp!.pinyin! : []).map((p) => p.reading).filter(Boolean).join(' ')
    : (word.pinyin ?? '');

  const ex = word.example;
  let exHtml = '';

  if (ex) {
    let exSimpHtml = '';
    let exTradHtml = '';

    if (ex.simp?.text) {
      exSimpHtml = rubyHtmlHighlight(ex.simp.text, ex.simp.pinyin ?? '', 'pinyin', simpText ?? '');
    } else if (typeof ex.simp === 'string') {
      exSimpHtml = escapeHtml(ex.simp);
    }

    if (ex.trad?.bpmf || ex.trad?.text) {
      const bpmfSrc = ex.trad.bpmf ?? ex.trad.text ?? '';
      exTradHtml = `<span class="zh-bpmf">${bpmfHtmlHighlight(bpmfSrc, tradText)}</span>`;
    } else if (typeof ex.trad === 'string') {
      exTradHtml = escapeHtml(ex.trad);
    }

    exHtml = `<p class="pack-vocab-ex">
      <span class="only-simp zh-simp">${exSimpHtml}</span>
      <span class="only-trad">${exTradHtml}</span>
      <span class="pack-vocab-ex-en">${escapeHtml(ex.en)}</span>
    </p>`;
  }

  const simpPinyin = typeof word.simp === 'object' ? word.simp?.pinyin ?? '' : '';

  return (
    <article className="pack-vocab-card">
      <div className="pack-vocab-head">
        <span
          className="pack-vocab-char only-simp zh-simp"
          dangerouslySetInnerHTML={{ __html: escapeHtml(simpText) }}
        />
        <span
          className="pack-vocab-char only-trad zh-bpmf"
          dangerouslySetInnerHTML={{ __html: escapeHtml(tradText) }}
        />
        <div className="pack-vocab-meta">
          <div className="pack-vocab-pinyin">{pinyinDisplay}</div>
          <div className="pack-vocab-en">{word.en}</div>
        </div>
      </div>
      {exHtml && <div dangerouslySetInnerHTML={{ __html: exHtml }} />}
    </article>
  );
}

function VocabGroup({ title, items }: { title: string; items: VocabWord[] }) {
  if (!items.length) return null;
  return (
    <div className="pack-tier">
      <h3 className="pack-tier-label">{title}</h3>
      <div className="pack-vocab-grid">
        {items.map((w, i) => <VocabCard key={i} word={w} />)}
      </div>
    </div>
  );
}

export function VocabSection({ vocab }: VocabSectionProps) {
  if (!vocab.length) {
    return (
      <div className="pack-empty card">
        <p className="muted">New words for this story pack are on their way.</p>
      </div>
    );
  }

  const door = vocab.filter((w) => w.tier === 'door');
  const beyond = vocab.filter((w) => w.tier === 'beyond');
  const hasTiers = door.length > 0 || beyond.length > 0;

  let doorItems = door;
  let beyondItems = beyond;
  if (!hasTiers) {
    const mid = Math.ceil(vocab.length / 2);
    doorItems = vocab.slice(0, mid);
    beyondItems = vocab.slice(mid);
  }

  return (
    <>
      <p className="pack-parent-note">Try a few words at a time and use them in everyday conversation.</p>
      <VocabGroup title="Open the Door" items={doorItems} />
      <VocabGroup title="Go Beyond" items={beyondItems} />
    </>
  );
}
