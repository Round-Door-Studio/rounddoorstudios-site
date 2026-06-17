/* ============================================================
   Ruby annotation & compare-view utilities.
   All output is generated from trusted internal JSON — safe to
   use with dangerouslySetInnerHTML in React components.
   ============================================================ */

import type { PinyinEntry } from './types';

/* Regex matching CJK unified ideographs */
const HAN_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

/* Punctuation that merges into the previous compare cell (行末禁則) */
const TRAILING_PUNCT = /^[，。、？！：；,.!?;:）」』》〉】〕〗〙〛"']+$/;
/* Punctuation that prefixes the next cell (行首禁則) */
const OPENING_PUNCT = /^[「『（(《〈【〔〖〘〚"']+$/;

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    };
    return map[ch] ?? ch;
  });
}

/* ── Ruby token generators ─────────────────────────────────── */

/**
 * Build an array of HTML strings where each CJK character gets
 * wrapped in <ruby>…<rt>…</rt></ruby>. Non-CJK chars are escaped.
 */
export function rubyTokens(
  text: string,
  syllables: PinyinEntry[] | string,
  kind: 'pinyin' | 'zhuyin' = 'pinyin',
): string[] {
  const tokens: string[] = [];

  if (Array.isArray(syllables)) {
    // New format: indexed 1:1 with text chars
    let si = 0;
    for (const ch of text) {
      const reading = syllables[si]?.reading ?? '';
      si++;
      if (HAN_RE.test(ch)) {
        tokens.push(`<ruby>${escapeHtml(ch)}<rt>${escapeHtml(reading)}</rt></ruby>`);
      } else {
        tokens.push(escapeHtml(ch));
      }
    }
    return tokens;
  }

  // Legacy format: space-separated syllable string
  const syl = syllablesOf(syllables, kind);
  let si = 0;
  for (const ch of text) {
    if (HAN_RE.test(ch)) {
      tokens.push(`<ruby>${escapeHtml(ch)}<rt>${escapeHtml(syl[si++] ?? '')}</rt></ruby>`);
    } else {
      tokens.push(escapeHtml(ch));
    }
  }
  return tokens;
}

export function rubyHtml(
  text: string,
  syllables: PinyinEntry[] | string,
  kind: 'pinyin' | 'zhuyin' = 'pinyin',
): string {
  return rubyTokens(text, syllables, kind).join('');
}

/* Wrap the first occurrence of highlightWord in <strong class="vocab-hl"> */
export function rubyHtmlHighlight(
  text: string,
  syllables: PinyinEntry[] | string,
  kind: 'pinyin' | 'zhuyin' = 'pinyin',
  highlightWord: string,
): string {
  const tokens = rubyTokens(text, syllables, kind);
  if (!highlightWord) return tokens.join('');

  const chars = [...text];
  const hlChars = [...highlightWord];
  let startIdx = -1;

  outer: for (let i = 0; i <= chars.length - hlChars.length; i++) {
    for (let j = 0; j < hlChars.length; j++) {
      if (chars[i + j] !== hlChars[j]) continue outer;
    }
    startIdx = i;
    break;
  }

  if (startIdx === -1) return tokens.join('');
  const endIdx = startIdx + hlChars.length;
  return (
    tokens.slice(0, startIdx).join('') +
    `<strong class="vocab-hl">${tokens.slice(startIdx, endIdx).join('')}</strong>` +
    tokens.slice(endIdx).join('')
  );
}

/* ── Bpmf (Traditional + Variation Selectors) ──────────────── */

/**
 * Split a bpmf string keeping each variation selector attached to
 * its base character (so the Bpmf Huninn font renders the right glyph).
 */
export function bpmfSplitTokens(str: string): string[] {
  const tokens: string[] = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0) ?? 0;
    const isVS = (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
    if (isVS && tokens.length) {
      tokens[tokens.length - 1] += ch;
    } else {
      tokens.push(ch);
    }
  }
  return tokens;
}

export function bpmfHtmlHighlight(bpmfStr: string, tradWord: string): string {
  const tokens = bpmfSplitTokens(bpmfStr);
  if (!tradWord) return tokens.map(escapeHtml).join('');

  const hlChars = [...tradWord];
  function base(tok: string): string {
    return [...tok].filter((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      return !((cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef));
    }).join('');
  }

  let startIdx = -1;
  outer: for (let i = 0; i <= tokens.length - hlChars.length; i++) {
    for (let j = 0; j < hlChars.length; j++) {
      if (base(tokens[i + j]) !== hlChars[j]) continue outer;
    }
    startIdx = i;
    break;
  }

  if (startIdx === -1) return tokens.map(escapeHtml).join('');
  const endIdx = startIdx + hlChars.length;
  return (
    tokens.slice(0, startIdx).map(escapeHtml).join('') +
    `<strong class="vocab-hl">${tokens.slice(startIdx, endIdx).map(escapeHtml).join('')}</strong>` +
    tokens.slice(endIdx).map(escapeHtml).join('')
  );
}

/* ── Compare-view token normalisation ──────────────────────── */

/**
 * Merge opening punctuation into the following cell and trailing
 * punctuation into the preceding cell so line-start/end rules hold.
 */
export function normalizeCompareTokens(tokens: string[]): string[] {
  const out: string[] = [];
  let prefix = '';
  for (const token of tokens) {
    if (/^\s+$/.test(token)) continue;
    if (OPENING_PUNCT.test(token)) { prefix += token; continue; }
    if (TRAILING_PUNCT.test(token)) {
      if (out.length) out[out.length - 1] += token;
      else prefix += token;
      continue;
    }
    out.push(prefix + token);
    prefix = '';
  }
  if (prefix) {
    if (out.length) out[out.length - 1] += prefix;
    else out.push(prefix);
  }
  return out;
}

/**
 * Extract compare tokens from simp ruby HTML (handles existing <ruby> blocks).
 */
export function simpCompareTokens(html: string): string[] {
  const tokens: string[] = [];
  const re = /<ruby>[\s\S]*?<\/ruby>|[\s\S]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const tok = match[0];
    tokens.push(tok.startsWith('<ruby>') ? tok : escapeHtml(tok));
  }
  return normalizeCompareTokens(tokens);
}

export function compareCells(tokens: string[], count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `<span class="rd-cmp-cell">${tokens[i] ?? ''}</span>`;
  }
  return out;
}

export function compareCellsBpmf(tokens: string[], count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `<span class="rd-cmp-cell zh-bpmf">${tokens[i] ?? ''}</span>`;
  }
  return out;
}

/* ── Helpers ────────────────────────────────────────────────── */

function syllablesOf(str: string, kind: 'pinyin' | 'zhuyin'): string[] {
  if (kind === 'zhuyin') {
    return str.match(/[\u3105-\u312F\u31A0-\u31BF\u02C7\u02CA\u02CB\u02D9]+/g) ?? [];
  }
  return str.match(/[A-Za-z\u00C0-\u024F]+/g) ?? [];
}
