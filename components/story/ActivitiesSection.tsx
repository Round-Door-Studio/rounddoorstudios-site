'use client';

import { useState } from 'react';
import Image from 'next/image';
import { rubyHtml, escapeHtml } from '@/lib/ruby';
import type { Activity, ActivitiesContent, I18nEntry } from '@/lib/types';

function i18nTitleHtml(title: Activity['title']): { en: string; zhHtml: string } {
  if (!title) return { en: '', zhHtml: '' };
  if (typeof title === 'string') return { en: title, zhHtml: '' };

  const simp = title.simp
    ? `<span class="only-simp zh-simp">${rubyHtml(title.simp.text, title.simp.pinyin ?? '', 'pinyin')}</span>`
    : '';
  const trad = title.trad
    ? `<span class="only-trad zh-bpmf">${escapeHtml(title.trad.bpmf ?? title.trad.text ?? '')}</span>`
    : '';
  const zhHtml = simp || trad ? `<p class="pack-act-title-zh">${simp}${trad}</p>` : '';

  return { en: title.en ?? '', zhHtml };
}

function i18nDescHtml(desc: Activity['desc']): { en: string; zhHtml: string } {
  if (!desc) return { en: '', zhHtml: '' };
  if (typeof desc === 'string') return { en: desc, zhHtml: '' };

  const simp = desc.simp
    ? `<span class="only-simp zh-simp">${rubyHtml(desc.simp.text, desc.simp.pinyin ?? '', 'pinyin')}</span>`
    : '';
  const trad = desc.trad
    ? `<span class="only-trad zh-bpmf">${escapeHtml(desc.trad.bpmf ?? desc.trad.text ?? '')}</span>`
    : '';
  const zhHtml = simp || trad ? `<p class="pack-act-desc-zh">${simp}${trad}</p>` : '';

  return { en: desc.en ?? '', zhHtml };
}

function i18nListItemHtml(item: string | I18nEntry): string {
  const enText = typeof item === 'string' ? item : (item.en ?? '');
  if (typeof item === 'string') {
    return `<span class="pack-act-item-en">${escapeHtml(enText)}</span>`;
  }
  const simp = item.simp
    ? `<span class="only-simp zh-simp">${rubyHtml(item.simp.text, item.simp.pinyin ?? '', 'pinyin')}</span>`
    : '';
  const trad = item.trad
    ? `<span class="only-trad zh-bpmf">${escapeHtml(item.trad.bpmf ?? item.trad.text ?? '')}</span>`
    : '';
  const zhHtml = simp || trad ? `<span class="pack-act-item-zh">${simp}${trad}</span>` : '';
  return `${zhHtml}<span class="pack-act-item-en">${escapeHtml(enText)}</span>`;
}

function ActivityCard({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);
  const accent = activity.accent ?? '#5C8358';

  const { en: titleEn, zhHtml: titleZhHtml } = i18nTitleHtml(activity.title);
  const { en: descEn, zhHtml: descZhHtml } = i18nDescHtml(activity.desc);

  const materialsHtml = activity.materials?.length
    ? `<div class="pack-act-section">
        <p class="pack-act-section-label">You'll need</p>
        <ul class="pack-act-materials">
          ${activity.materials.map((m) => `<li>${i18nListItemHtml(m)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const stepsHtml = activity.steps?.length
    ? `<div class="pack-act-section">
        <p class="pack-act-section-label">Steps</p>
        <ol class="pack-act-steps">
          ${activity.steps.map((s) => `<li>${i18nListItemHtml(s)}</li>`).join('')}
        </ol>
      </div>`
    : '';

  return (
    <article className={`pack-act-card${open ? ' is-open' : ''}`} id={`activity-${activity.id}`}>
      <div
        className="pack-act-art"
        style={{ background: `linear-gradient(145deg,${accent}33 0%,${accent}18 55%,var(--paper) 100%)` }}
      >
        <Image src="/icons/round-door.png" alt="" width={52} height={52} className="pack-act-door" />
      </div>
      <div className="pack-act-body">
        <h3 className="pack-act-title">{titleEn}</h3>
        {titleZhHtml && <div dangerouslySetInnerHTML={{ __html: titleZhHtml }} />}
        <p className="pack-act-desc">{descEn}</p>
        {descZhHtml && <div dangerouslySetInnerHTML={{ __html: descZhHtml }} />}
        <div className="pack-act-foot">
          <span className="pack-act-time">⏱ {activity.time}</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close Activity' : 'Open Activity'}
          </button>
        </div>
        {open && (
          <div className="pack-act-detail">
            <p className="pack-act-detail-lead">Here&apos;s how to try it:</p>
            {materialsHtml && <div dangerouslySetInnerHTML={{ __html: materialsHtml }} />}
            {stepsHtml && <div dangerouslySetInnerHTML={{ __html: stepsHtml }} />}
          </div>
        )}
      </div>
    </article>
  );
}

export function ActivitiesSection({ activities }: { activities: ActivitiesContent }) {
  const list = activities.activities ?? [];

  if (!list.length) {
    return (
      <div className="pack-empty card">
        <p className="muted">Cultural activities for this story pack are on their way.</p>
      </div>
    );
  }

  return (
    <>
      <p className="pack-parent-note">Explore the traditions, places, and ideas behind the story.</p>
      <div className="pack-act-grid">
        {list.map((a) => <ActivityCard key={a.id} activity={a} />)}
      </div>
    </>
  );
}
