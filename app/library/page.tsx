'use client';

import { useState } from 'react';
import { BookView } from '@/components/BookView';
import { GridView } from '@/components/GridView';
import { Modal, useModal } from '@/components/Modal';
import { STORIES } from '@/lib/stories';

type ViewMode = 'book' | 'grid';

export default function LibraryPage() {
  const [view, setView] = useState<ViewMode>('book');
  const { open, openModal, closeModal } = useModal();

  function handleViewChange(v: ViewMode) {
    setView(v);
    localStorage.setItem('rds-view', v);
  }

  return (
    <>
      {/* ── Library ── */}
      <section className="section" id="library">
        <div className="section-head">
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>The Story Library</p>
            <h2>Open the book — start anywhere.</h2>
          </div>
          <div className="toggle" id="viewToggle">
            <button
              className={view === 'book' ? 'is-on' : ''}
              onClick={() => handleViewChange('book')}
            >
              📖 Book
            </button>
            <button
              className={view === 'grid' ? 'is-on' : ''}
              onClick={() => handleViewChange('grid')}
            >
              ▦ Grid
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <GridView stories={STORIES} />
        ) : (
          <BookView stories={STORIES} />
        )}
      </section>

      {/* ── Library CTA ── */}
      <section className="library-cta" aria-labelledby="libraryCtaTitle">
        <div className="library-cta-in">
          <h2 id="libraryCtaTitle">🚪 A New Story is Always On Its Way.</h2>
          <p>Get future story packs, family activities, and new episodes delivered to your inbox.</p>
          <button type="button" className="btn btn-primary" onClick={openModal}>
            Get New Stories
          </button>
        </div>
      </section>

      <Modal open={open} onClose={closeModal} />
    </>
  );
}
