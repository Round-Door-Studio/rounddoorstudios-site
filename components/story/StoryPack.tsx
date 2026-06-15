'use client';

import { useState, useEffect } from 'react';
import { useScript } from '@/context/ScriptContext';
import { ReadAlong } from './ReadAlong';
import { VocabSection } from './VocabSection';
import { QuestionsSection } from './QuestionsSection';
import { ActivitiesSection } from './ActivitiesSection';
import type { StoryPageContent } from '@/lib/types';

type TabId = 'read' | 'words' | 'questions' | 'explore';
type ReadingMode = 'simp' | 'trad' | 'compare';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'read', icon: '📖', label: 'Read Along' },
  { id: 'words', icon: '🔤', label: 'New Words' },
  { id: 'questions', icon: '💬', label: 'Curious Questions' },
  { id: 'explore', icon: '🌏', label: 'Culture Corner' },
];

interface StoryPackProps {
  content: StoryPageContent;
}

export function StoryPack({ content }: StoryPackProps) {
  const { script, setScript } = useScript();
  const [activeTab, setActiveTab] = useState<TabId>('read');
  const [readingMode, setReadingMode] = useState<ReadingMode>('simp');
  const [showEnglish, setShowEnglish] = useState(true);

  // Sync reading mode with the global script toggle
  useEffect(() => {
    if (readingMode !== 'compare') {
      setReadingMode(script as ReadingMode);
    }
  }, [script]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleModeChange(mode: ReadingMode) {
    setReadingMode(mode);
    if (mode === 'simp' || mode === 'trad') {
      setScript(mode);
    }
  }

  function handlePrint() {
    window.print();
  }

  const lines = content.story.readAlong?.lines ?? content.story.lines ?? [];

  return (
    <div>
      {/* Story Pack navigation cards */}
      <div className="pack-nav-block">
        <p className="pack-nav-eyebrow">Our Story Pack</p>
        <div className="pack-cards" role="tablist" aria-label="Inside this Story Pack">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pack-card${activeTab === tab.id ? ' is-on' : ''}`}
              role="tab"
              id={`pack-tab-${tab.id}`}
              data-tab={tab.id}
              aria-selected={activeTab === tab.id}
              aria-controls={`pack-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="pack-card-icon">{tab.icon}</span>
              <span className="pack-card-text">
                <span className="pack-card-label">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Read controls (sticky, visible on read tab) */}
      <div
        className="read-controls"
        id="read-controls"
        data-active-tab={activeTab}
      >
        <div className="rc-group">
          <span className="rc-label">Reading View</span>
          <div className="rc-seg" role="tablist" aria-label="Reading view">
            {(['simp', 'trad', 'compare'] as ReadingMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rc-mode${readingMode === mode ? ' is-on' : ''}${mode === 'compare' ? ' rc-compare' : ''}`}
                data-mode={mode}
                role="tab"
                aria-selected={readingMode === mode}
                onClick={() => handleModeChange(mode)}
              >
                {mode === 'simp' ? '简 Simplified' : mode === 'trad' ? '繁 Traditional' : '简 + 繁 Compare'}
              </button>
            ))}
          </div>
        </div>
        <label className="rc-toggle">
          <input
            type="checkbox"
            id="c-en"
            checked={showEnglish}
            onChange={(e) => setShowEnglish(e.target.checked)}
          />
          Show English
        </label>
        <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
          ⤓ Print / PDF
        </button>
      </div>

      {/* Tab panels */}
      <div className="pack-panels" data-print-tab={activeTab}>
        <div
          className="pack-panel"
          role="tabpanel"
          id="pack-panel-read"
          aria-labelledby="pack-tab-read"
          hidden={activeTab !== 'read'}
        >
          <ReadAlong lines={lines} readingMode={readingMode} showEnglish={showEnglish} />
        </div>

        <div
          className="pack-panel"
          role="tabpanel"
          id="pack-panel-words"
          aria-labelledby="pack-tab-words"
          hidden={activeTab !== 'words'}
        >
          <VocabSection vocab={content.vocab.vocab} />
        </div>

        <div
          className="pack-panel"
          role="tabpanel"
          id="pack-panel-questions"
          aria-labelledby="pack-tab-questions"
          hidden={activeTab !== 'questions'}
        >
          <QuestionsSection questions={content.questions} />
        </div>

        <div
          className="pack-panel"
          role="tabpanel"
          id="pack-panel-explore"
          aria-labelledby="pack-tab-explore"
          hidden={activeTab !== 'explore'}
        >
          <ActivitiesSection activities={content.activities} />
        </div>
      </div>
    </div>
  );
}
