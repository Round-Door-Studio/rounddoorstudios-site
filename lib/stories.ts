/* ============================================================
   Story catalog — the ONE file you edit to grow the library.

   To reveal a story at launch: set  released: true.
   Until then it shows as a "coming soon" surprise card.

   Each episode has separate English + Mandarin audio versions;
   `audio` holds the per-language links (fill in when live).
   ============================================================ */

import type { Story } from './types';

// Story 1 is always free — used wherever the free/sample story needs to be referenced.
export const FREE_STORY_SLUG = 'frog-at-the-bottom-of-the-well';

export const STORIES: Story[] = [
  {
    num: 1, slug: 'frog-at-the-bottom-of-the-well', season: 1, released: true,
    title: { en: 'The Frog at the Bottom of the Well', simp: '井底之蛙', trad: '井底之蛙' },
    blurb: 'A little frog who is sure his well is the whole world — until a sea turtle who has seen the ocean comes to rest by the rim.',
    runtime: '12-15 min', pub: 'Jun 10, 2026', coverColor: '#5C8358',
    coverImage: '/img/covers/frog-at-the-bottom-of-the-well-square.png',
    coverImageLandscape: '/img/covers/frog-at-the-bottom-of-the-well-landscape.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/158DFYe9Wjx4AsCu7B9sL1?si=jcag9qvwTKyhxGousQbFKw',
        youtube: 'https://youtu.be/8s6AyIEjsfk',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000771985730',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/0oEiUDbeNTA17AClFESaBX?si=r6z8YZcJTfm8t1pLII7GOw',
        youtube: 'https://youtu.be/OJuRDrasjEk',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000772050133',
      },
    },
    hasBundle: true,
  },
  {
    num: 2, slug: 'qu-yuan-and-dragon-boat-festival', season: 1, released: true,
    title: { en: 'Qu Yuan and Dragonboat Festival', simp: '屈原与端午节', trad: '屈原與端午節' },
    blurb: 'The poet-minister whose love for his country gave us dragon boats, sticky-rice zongzi, and the fifth day of the fifth month.',
    runtime: '12-14 min', pub: 'June 17, 2026', coverColor: '#5B5C9D',
    coverImage: '/img/covers/quyuan-cover-SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/2HmO8RFQUbkfe1Wg0YD2DE?si=DPIDHwGiSUqJ1oNq95jfNw',
        youtube: 'https://www.youtube.com/watch?v=1Bw1DFfr2Bg',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000773116189',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/6okkTEsR8UEqexXgUstrqB?si=1U-5xXDhRV2fp3DSRsqpMg',
        youtube: 'https://www.youtube.com/watch?v=Oy1jkMYKA6Q',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000773116220',
      },
    },
    hasBundle: true,
  },
  {
    num: 3, slug: 'mend-the-sheep-pen', season: 1, released: true,
    title: { en: 'Never Too Late to Mend the Sheep Pen', simp: '亡羊补牢', trad: '亡羊補牢' },
    blurb: 'A stubborn king ignores a loyal minister\'s warnings, only to discover that even after a costly mistake, it may not be too late to make things right.', 
    runtime: '9-10 min', pub: 'June 24, 2026', coverColor: '#C4994F', coverImage: '/img/covers/fix-sheep-pen_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/3Kl8xl2CSOP3FDiaAW9ZYI?si=sW6JPV2RTGOmFcNL2HQGKg',
        youtube: 'https://youtu.be/LpsB91gnwRc',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000774033253',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/7cUUIc96Pi8iWtyK01i1DN?si=CWk4xCTaQE2g9GZbtMsXsA',
        youtube: 'https://youtu.be/oLUP8qtdYRA',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000774033252',
      },
    },
    hasBundle: true,
  },
  {
    num: 4, slug: 'fox-borrows-the-tigers-might', season: 1, released: true,
    title: { en: "The Fox Borrows the Tiger's Might", simp: '狐假虎威', trad: '狐假虎威' },
    blurb: 'A clever little fox convinces a powerful tiger that all the animals fear him, when in fact they\'re running from the tiger right behind. A witty tale about appearances, confidence, and borrowed power.', 
    runtime: '11-13 min', pub: 'Jul 1, 2026', coverColor: '#A8513A', coverImage: '/img/covers/fox-tiger-might_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/5bn9vdRcIShQ88Ap9r1clA?si=xsMnLdkTQ0yrjqehYSWatw',
        youtube: 'https://youtu.be/ZnAAKKJeM_k',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000775005297',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/1S8TKmrnGXXvmD4JvXNScj?si=QkOmiRPHQMm7kq6S5w51AA',
        youtube: 'https://youtu.be/jBIRRBZjn8Y',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000775005254',
      },
    },
    hasBundle: true,
  },
  {
    num: 5, slug: 'ma-liang-magic-brush-1', season: 1, released: true, part: 1, parts: 2,
    title: { en: 'Ma Liang and the Magic Brush · Part 1', simp: '神笔马良', trad: '神筆馬良' },
    blurb: 'A poor orphan who dreams of drawing receives a magical paintbrush that brings everything he paints to life. But when a greedy landlord tries to steal its power, Ma Liang must use his wits to protect the gift meant to help others.', 
    runtime: '17-19 min', pub: 'Jul 8, 2026', coverColor: '#9B4761', coverImage: '/img/covers/MaLiangBrushP1_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/6sGBhw1q7mFy809vQuh5in?si=Pf0nWn3oRP2mLxL2sFU5rw',
        youtube: 'https://youtu.be/zGr1pspH3T8',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep9-eng-ma-liang-and-the-magic-brush-part-1-%E7%A5%9E%E7%AC%94%E9%A9%AC%E8%89%AF-%E7%A5%9E%E7%AD%86%E9%A6%AC%E8%89%AF-%E7%AC%AC%E4%B8%80%E9%9B%86/id1896903747?i=1000775952618',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/0fJxsNvymsaZYRHWIAChPy?si=pBx2yOdlSgOn-BEi0wCbLA',
        youtube: 'https://youtu.be/6TVJ3xxxowg',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep10-%E4%B8%AD%E6%96%87-%E7%A5%9E%E7%AC%94%E9%A9%AC%E8%89%AF-%E7%A5%9E%E7%AD%86%E9%A6%AC%E8%89%AF-%E7%AC%AC%E4%B8%80%E9%9B%86-ma-liang-and-the-magic-brush-part-1/id1896903747?i=1000775954793',
      },
    },
    hasBundle: true,
  },
  {
    num: 6, slug: 'ma-liang-magic-brush-2', season: 1, released: true, part: 2, parts: 2,
    title: { en: 'Ma Liang and the Magic Brush · Part 2', simp: '神笔马良', trad: '神筆馬良' },
    blurb: 'When a greedy emperor demands Ma Liang use his magic paintbrush to make him richer, the brave boy refuses. Instead, he hatches a clever plan that leads the emperor on a voyage he\'ll never forget.', 
    runtime: '13-15 min', pub: 'Jul 15, 2026', coverColor: '#7B324A', coverImage: '/img/covers/MaLiangBrushP2_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/0QevLf9VZ4igoAVuZrETBm?si=1P0H6rljTDC4dHqEfsZ1hw',
        youtube: 'https://youtu.be/nl2DfEEDLtA',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000776904820',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/59lA500ODdzC2CaPG0n8Yo?si=UGfgAFMnTnuevJkZ1XVcxQ',
        youtube: 'https://youtu.be/6ITVp59SvHQ',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000776904920',
      },
    },
    hasBundle: true,
  },
  {
    num: 7, slug: 'dragon-gets-its-eyes', season: 1, released: false,
    title: { en: 'When the Dragon Gets Its Eyes', simp: '画龙点睛', trad: '畫龍點睛' },
    blurb: '', 
    runtime: '', pub: 'Jul 22, 2026', coverColor: '#436641', coverImage: '/img/covers/dragon-gets-eyes_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
  {
    num: 8, slug: 'adding-feet-on-a-snake', season: 1, released: false,
    title: { en: 'Adding Feet on a Snake', simp: '画蛇添足', trad: '畫蛇添足' },
    blurb: '', 
    runtime: '', pub: 'Jul 29, 2026', coverColor: '#5C8358', coverImage: '/img/covers/snake-feet_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
  {
    num: 9, slug: 'three-morning-four-night', season: 1, released: false,
    title: { en: 'Three in the Morning, Four at Night', simp: '朝三暮四', trad: '朝三暮四' },
    blurb: '', 
    runtime: '', pub: 'Aug 19, 2026', coverColor: '#8B7355', coverImage: '/img/covers/three-morn-four-night_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
  {
    num: 10, slug: 'cowherd-and-weaver-girl-1', season: 1, released: false, part: 1, parts: 2,
    title: { en: 'The Cowherd and Weaver Girl · Part 1', simp: '牛郎织女', trad: '牛郎織女' },
    blurb: '', 
    runtime: '', pub: 'Aug 5, 2026', coverColor: '#5B5C9D', coverImage: '/img/covers/cowherd-weavergirl-p1_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',  
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
  {
    num: 11, slug: 'cowherd-and-weaver-girl-2', season: 1, released: false, part: 2, parts: 2,
    title: { en: 'The Cowherd and Weaver Girl · Part 2', simp: '牛郎织女', trad: '牛郎織女' },
    blurb: '', 
    runtime: '', pub: 'Aug 12, 2026', coverColor: '#43447F', coverImage: '/img/covers/cowherd-weavergirl-p2_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
  {
    num: 12, slug: 'farmer-who-waited-for-the-rabbit', season: 1, released: false,
    title: { en: 'The Farmer Who Waited for the Rabbit', simp: '守株待兔', trad: '守株待兔' },
    blurb: '', 
    runtime: '', pub: 'Aug 26, 2026', coverColor: '#A8513A', coverImage: '/img/covers/farmer-rabbit_SQ.png',
    audio: {
      en: {
        spotify: '',
        youtube: '',
        apple: '',
      },
      zh: {
        spotify: '',
        youtube: '',
        apple: '',
      },
    },
    hasBundle: true,
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function getReleasedStories(): Story[] {
  return STORIES.filter((s) => s.released);
}

export function getLatestReleasedStory(): Story | undefined {
  return getReleasedStories().sort((a, b) => (b.season - a.season) || (b.num - a.num))[0];
}

export function padNum(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/* ── Podcast episode numbers ──────────────────────────────────────────────────
   Each story produces two podcast episodes:
     English → odd  (num * 2 - 1)
     Mandarin → even (num * 2)
   e.g. Story 1 → podcast ep 1 (EN) + ep 2 (ZH)
        Story 2 → podcast ep 3 (EN) + ep 4 (ZH)
   ─────────────────────────────────────────────────────────────────────────── */
export function podcastEpEn(story: Story): number {
  return story.num * 2 - 1;
}

export function podcastEpZh(story: Story): number {
  return story.num * 2;
}
