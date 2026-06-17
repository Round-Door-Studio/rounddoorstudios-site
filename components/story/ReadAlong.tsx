'use client';

import { useMemo } from 'react';
import {
  rubyHtml,
  bpmfSplitTokens,
  normalizeCompareTokens,
  rubyTokens,
  compareCells,
  compareCellsBpmf,
  simpCompareTokens,
  escapeHtml,
} from '@/lib/ruby';
import type { StoryLine } from '@/lib/types';

interface ReadAlongProps {
  lines: StoryLine[];
  readingMode: 'simp' | 'trad' | 'compare';
}

function isNewFormat(ln: StoryLine): boolean {
  return ln.simp !== null && typeof ln.simp === 'object';
}

function renderLine(ln: StoryLine): string {
  let simpHtml: string;
  let tradHtml: string;
  let simpTokens: string[];
  let tradTokens: string[];

  if (isNewFormat(ln)) {
    const simp = ln.simp as { text: string; pinyin: { text: string; reading: string }[] };
    const trad = ln.trad as { text: string; bpmf?: string };

    simpHtml = rubyHtml(simp.text, simp.pinyin, 'pinyin');
    simpTokens = normalizeCompareTokens(rubyTokens(simp.text, simp.pinyin, 'pinyin'));

    const bpmfStr = trad.bpmf ?? trad.text;
    tradHtml = `<span class="zh-bpmf">${escapeHtml(bpmfStr)}</span>`;
    tradTokens = normalizeCompareTokens(bpmfSplitTokens(bpmfStr).map(escapeHtml));
  } else {
    // Legacy string format
    const simpStr = ln.simp as string;
    const tradStr = ln.trad as string;
    simpHtml = simpStr;
    tradHtml = tradStr;
    simpTokens = simpCompareTokens(simpStr);
    tradTokens = normalizeCompareTokens([...tradStr].map(escapeHtml));
  }

  const count = Math.max(simpTokens.length, tradTokens.length);

  return `<div class="rd-line">
    <div class="rd-zh">
      <div class="rd-col rd-col--simp">${simpHtml}</div>
      <div class="rd-col rd-col--trad">${tradHtml}</div>
    </div>
    <div class="rd-compare">
      <div class="rd-col rd-col--simp rd-col--compare">${compareCells(simpTokens, count)}</div>
      <div class="rd-col rd-col--trad rd-col--compare">${compareCellsBpmf(tradTokens, count)}</div>
    </div>
    <div class="rd-en">${escapeHtml(ln.en)}</div>
  </div>`;
}

export function ReadAlong({ lines, readingMode }: ReadAlongProps) {
  const html = useMemo(() => lines.map(renderLine).join(''), [lines]);

  return (
    <>
      <p className="pack-parent-note">
        Read together, take turns, or listen along as you follow the podcast episode.
      </p>
      <div
        id="reading"
        className={`reading mode-${readingMode}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
