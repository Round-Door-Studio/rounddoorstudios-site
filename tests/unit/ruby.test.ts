import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  rubyHtml,
  rubyHtmlHighlight,
  bpmfSplitTokens,
  normalizeCompareTokens,
  compareCells,
} from '@/lib/ruby';

describe('escapeHtml', () => {
  it('escapes all dangerous characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe("it&#39;s");
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('handles non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('rubyHtml with array pinyin', () => {
  const pinyin = [
    { text: '井', reading: 'jǐng' },
    { text: '底', reading: 'dǐ' },
    { text: '之', reading: 'zhī' },
    { text: '蛙', reading: 'wā' },
  ];

  it('wraps CJK characters in <ruby> tags', () => {
    const html = rubyHtml('井底之蛙', pinyin);
    expect(html).toContain('<ruby>井<rt>jǐng</rt></ruby>');
    expect(html).toContain('<ruby>蛙<rt>wā</rt></ruby>');
  });

  it('passes through non-CJK characters unmodified', () => {
    const pinyin2 = [
      { text: '好', reading: 'hǎo' },
      { text: '！', reading: '' },
    ];
    const html = rubyHtml('好！', pinyin2);
    expect(html).toContain('<ruby>好<rt>hǎo</rt></ruby>');
    expect(html).toContain('！');
  });
});

describe('rubyHtmlHighlight', () => {
  const pinyin = [
    { text: '蛙', reading: 'wā' },
    { text: '跳', reading: 'tiào' },
  ];

  it('wraps the highlight word in <strong class="vocab-hl">', () => {
    const html = rubyHtmlHighlight('蛙跳', pinyin, 'pinyin', '蛙');
    expect(html).toContain('<strong class="vocab-hl">');
    expect(html).toContain('wā');
  });

  it('returns normal ruby html when word not found', () => {
    const html = rubyHtmlHighlight('蛙跳', pinyin, 'pinyin', '龙');
    expect(html).not.toContain('<strong');
  });
});

describe('bpmfSplitTokens', () => {
  it('keeps variation selectors attached to their base character', () => {
    // Variation selector U+E0100 (supplementary plane) after a character
    const vs = String.fromCodePoint(0xe0100);
    const str = `蛙${vs}跳`;
    const tokens = bpmfSplitTokens(str);
    expect(tokens[0]).toBe(`蛙${vs}`);
    expect(tokens[1]).toBe('跳');
  });

  it('handles empty string', () => {
    expect(bpmfSplitTokens('')).toEqual([]);
  });
});

describe('normalizeCompareTokens', () => {
  it('merges trailing punctuation into the previous token', () => {
    const tokens = ['蛙', '。'];
    const result = normalizeCompareTokens(tokens);
    expect(result).toEqual(['蛙。']);
  });

  it('skips whitespace tokens', () => {
    const tokens = ['蛙', ' ', '跳'];
    const result = normalizeCompareTokens(tokens);
    expect(result).toEqual(['蛙', '跳']);
  });

  it('prepends opening punctuation to the next token', () => {
    const tokens = ['「', '蛙', '」'];
    const result = normalizeCompareTokens(tokens);
    expect(result[0]).toBe('「蛙」');
  });
});

describe('compareCells', () => {
  it('generates the correct number of cells', () => {
    const tokens = ['蛙', '跳'];
    const html = compareCells(tokens, 2);
    expect((html.match(/<span/g) ?? []).length).toBe(2);
  });

  it('fills missing cells with empty strings', () => {
    const html = compareCells(['蛙'], 3);
    expect(html).toContain('<span class="rd-cmp-cell"></span>');
  });
});
