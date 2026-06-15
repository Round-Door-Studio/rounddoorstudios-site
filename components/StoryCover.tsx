import Image from 'next/image';
import type { Story } from '@/lib/types';

interface StoryCoverProps {
  story: Story;
}

export function StoryCover({ story }: StoryCoverProps) {
  const color = story.coverColor ?? '#9B4761';

  if (!story.released) {
    return (
      <div className="cover cover--soon">
        <div className="stripes" />
        <div
          className="grad"
          style={{ background: `linear-gradient(155deg,${color}EE 0%,${color}66 60%,transparent 100%)` }}
        />
        <div className="soon-badge">Coming soon</div>
      </div>
    );
  }

  if (story.coverImage) {
    return (
      <div className="cover cover--image">
        <Image
          src={story.coverImage}
          alt={`${story.title.en} cover art`}
          fill
          sizes="(max-width: 560px) 108px, (max-width: 880px) 132px, 340px"
          style={{ objectFit: 'cover' }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="cover">
      <div className="stripes" />
      <div
        className="grad"
        style={{ background: `linear-gradient(155deg,${color}EE 0%,${color}66 60%,transparent 100%)` }}
      />
      <div className="c-zh only-simp zh-simp">{story.title.simp}</div>
      <div className="c-zh only-trad zh-trad">{story.title.trad}</div>
      <div className="c-title">{story.title.en}</div>
    </div>
  );
}
