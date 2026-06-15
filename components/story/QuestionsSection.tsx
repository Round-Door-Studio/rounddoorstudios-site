import { rubyHtml, escapeHtml } from '@/lib/ruby';
import type { Question, QuestionsContent } from '@/lib/types';

function QuestionCard({ question, index }: { question: Question; index: number }) {
  let zhHtml = '';
  if (question.simp && question.trad) {
    const simpHtml = rubyHtml(question.simp.text, question.simp.pinyin ?? '', 'pinyin');
    const tradHtml = escapeHtml(question.trad.bpmf ?? question.trad.text ?? '');
    zhHtml = `<p class="pack-q-zh">
      <span class="only-simp zh-simp">${simpHtml}</span>
      <span class="only-trad zh-bpmf">${tradHtml}</span>
    </p>`;
  }

  return (
    <article className="pack-q-card">
      <span className="pack-q-num">{index + 1}</span>
      <div className="pack-q-body">
        {zhHtml && <div dangerouslySetInnerHTML={{ __html: zhHtml }} />}
        <p className="pack-q-text">{question.en}</p>
      </div>
    </article>
  );
}

function QuestionGroup({ title, questions }: { title: string; questions: Question[] }) {
  if (!questions.length) return null;
  return (
    <div className="pack-tier">
      <h3 className="pack-tier-label">{title}</h3>
      <div className="pack-q-grid">
        {questions.map((q, i) => <QuestionCard key={i} question={q} index={i} />)}
      </div>
    </div>
  );
}

export function QuestionsSection({ questions }: { questions: QuestionsContent }) {
  const { open, beyond } = questions;

  if (!open.length && !beyond.length) {
    return (
      <div className="pack-empty card">
        <p className="muted">Curious questions for this story pack are on their way.</p>
      </div>
    );
  }

  return (
    <>
      <p className="pack-parent-note">
        Follow your child&apos;s curiosity. Choose the questions that fit today.
      </p>
      <QuestionGroup title="Open the Door" questions={open} />
      <QuestionGroup title="Go Beyond" questions={beyond} />
    </>
  );
}
