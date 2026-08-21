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
    num: 7, slug: 'dragon-gets-its-eyes', season: 1, released: true,
    title: { en: 'When the Dragon Gets Its Eyes', simp: '画龙点睛', trad: '畫龍點睛' },
    blurb: 'When a famous painter leaves his dragons unfinished, a curious crowd insists he add the final touch—unaware of the magic it might unleash.', 
    runtime: '13-15 min', pub: 'Jul 22, 2026', coverColor: '#436641', coverImage: '/img/covers/dragon-gets-eyes_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/0rkWB6K1F2hsDTXmJi2b7l?si=PwJBqCg-SXieQ8tECG_ZMw',
        youtube: 'https://youtu.be/IH0p_ItqaMQ',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000777875789',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/1PM7hFHrne8gVtiXU5b9iS?si=UxkfltoJQX255SUj_1hpqw',
        youtube: 'https://youtu.be/qkaDf88g93M',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000777876362',
      },
    },
    hasBundle: true,
  },
  {
    num: 8, slug: 'adding-feet-on-a-snake', season: 1, released: true,
    title: { en: 'Adding Feet on a Snake', simp: '画蛇添足', trad: '畫蛇添足' },
    blurb: 'A talented artist wins a jug of wine by drawing the fastest snake—but one unnecessary finishing touch costs him everything.', 
    runtime: '12-15 min', pub: 'Jul 29, 2026', coverColor: '#5C8358', coverImage: '/img/covers/snake-feet_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/55079XhjThmohQTxt2pXyR?si=frGk_LiYTdGuer0sHnTjOA',
        youtube: 'https://youtu.be/TYtNcr9u-70',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000778896702',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/3QmRRoga0idxRllwWlCcqi?si=j5Vlfd6WTI-ghMCmTnEsRw',
        youtube: 'https://youtu.be/BXDCVPfBMoA',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000778897803',
      },
    },
    hasBundle: true,
  },
  {
    num: 9, slug: 'three-morning-four-night', season: 1, released: true,
    title: { en: 'Three in the Morning, Four at Night', simp: '朝三暮四', trad: '朝三暮四' },
    blurb: 'Three acorns in the morning and four at night—or four in the morning and three at night? A troop of monkeys learns that the way something is presented isn\'t always the whole story.', 
    runtime: '10-11 min', pub: 'Aug 5, 2026', coverColor: '#8B7355', coverImage: '/img/covers/three-morn-four-night_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/06nqbx6EqVBWnSVSHOfITY?si=9c13a7ee33954fc7',
        youtube: 'https://youtu.be/Q9C0Mo7j31A',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000780100332',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/28fU1wi6c8EDMeLRUmhUxE?si=afa01df201e4420b',
        youtube: 'https://youtu.be/WRIEGDfJJqE',
        apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000780100171',
      },
    },
    hasBundle: true,
  },
  {
    num: 10, slug: 'cowherd-and-weaver-girl-1', season: 1, released: true, part: 1, parts: 2,
    title: { en: 'The Cowherd and Weaver Girl · Part 1', simp: '牛郎织女 第一集', trad: '牛郎織女 第一集' },
    blurb: 'When a faithful old ox reveals a magical secret, a lonely cowherd meets the Weaver Girl—and a love story unlike any other begins.', 
    runtime: '9-10 min', pub: 'Aug 12, 2026', coverColor: '#5B5C9D', coverImage: '/img/covers/cowherd-weavergirl-p1_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/406YHN8Hqw3hQj5u28lPcH?si=RIqJitr5RMehPGXKiwm0pA',
        youtube: 'https://youtu.be/Pj1opEm47WE',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep19-eng-the-cowherd-and-the-weaver-girl-part-1-%E7%89%9B%E9%83%8E%E7%BB%87%E5%A5%B3-%E7%89%9B%E9%83%8E%E7%B9%94%E5%A5%B3/id1896903747?i=1000782954915',  
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/0S5GplDRydRHRYYCXbEJQK?si=_bnpql2tQEKQCAD1kVHX6g',
        youtube: 'https://youtu.be/B_Ek7iI2xAA',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep20-%E4%B8%AD%E6%96%87-%E7%89%9B%E9%83%8E%E7%BB%87%E5%A5%B3-%E7%AC%AC%E4%B8%80%E9%9B%86-%E7%9B%B8%E9%81%87-the-cowherd-and-the-weaver-girl-part-1/id1896903747?i=1000782956876',
      },
    },
    hasBundle: true,
  },
  {
    num: 11, slug: 'cowherd-and-weaver-girl-2', season: 1, released: true, part: 2, parts: 2,
    title: { en: 'The Cowherd and Weaver Girl · Part 2', simp: '牛郎织女 第二集', trad: '牛郎織女 第二集' },
    blurb: 'When the Cowherd races into the heavens to find the Weaver Girl, a river of stars and a bridge of magpies become symbols of a love that endures across the sky.', 
    runtime: '9 min', pub: 'Aug 19, 2026', coverColor: '#43447F', coverImage: '/img/covers/cowherd-weavergirl-p2_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/0PFt6eKpEnz4bEVpuupson?si=IEFzJ_WiRvmZ5ZiAxbdIjQ',
        youtube: 'https://youtu.be/HMhoHpncKeU',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep21-eng-the-cowherd-and-the-weaver-girl-part-2-%E7%89%9B%E9%83%8E%E7%BB%87%E5%A5%B3-%E7%89%9B%E9%83%8E%E7%B9%94%E5%A5%B3/id1896903747?i=1000784340800',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/6nIjy8Y3FVzvqGBm1WiiHh?si=M4nN2ew5QZSfH6_7QeQTUg',
        youtube: 'https://youtu.be/1hphCC5C5KU',
        apple: 'https://podcasts.apple.com/us/podcast/s1-ep22-%E4%B8%AD%E6%96%87-%E7%89%9B%E9%83%8E%E7%BB%87%E5%A5%B3-%E7%AC%AC%E4%BA%8C%E9%9B%86-%E9%B9%8A%E6%A1%A5%E7%9B%B8%E4%BC%9A-the-cowherd-and-the-weaver-girl-part-2/id1896903747?i=1000784342562',
      },
    },
    hasBundle: true,
  },
  {
    num: 12, slug: 'farmer-who-waited-for-the-rabbit', season: 1, released: false,
    title: { en: 'The Farmer Who Waited for the Rabbit', simp: '守株待兔', trad: '守株待兔' },
    blurb: 'A hardworking farmer gets lucky when a rabbit runs into a tree stump—but waiting for the next one may cost him everything.', 
    runtime: '13-14 min', pub: 'Aug 26, 2026', coverColor: '#A8513A', coverImage: '/img/covers/farmer-rabbit_SQ.png',
    audio: {
      en: {
        spotify: 'https://open.spotify.com/episode/1vOpNWacCxIUvddnUnxJS9?si=P4AVksiUT7ul2nzlBfskNQ',
        youtube: 'https://youtu.be/L3ruaj3kit4',
        apple: '',
      },
      zh: {
        spotify: 'https://open.spotify.com/episode/5LKwGy39eSm2j5GFFplB1D?si=z5d4afDiRCSvrNFih5R3WA',
        youtube: 'https://youtu.be/eYODzDhIz48',
        apple: '',
      },
    },
    hasBundle: true,
  },

  /* ── Season 2 ── */
  {
    num: 13, slug: 'hou-yi-shoots-nine-suns', season: 2, released: false, part: 1, parts: 2,
    title: { en: "Legend of the Mid-Autumn Festival P1: Hou Yi Shoots Nine Suns", simp: '中秋节传说 P1：后羿射日', trad: '中秋節傳說 P1：后羿射日' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-1.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 14, slug: 'changer-flies-to-the-moon', season: 2, released: false, part: 2, parts: 2,
    title: { en: "Legend of the Mid-Autumn Festival P2: Chang'er Flies to the Moon", simp: '中秋节传说 P2：嫦娥奔月', trad: '中秋節傳說 P2：嫦娥奔月' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-2.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 15, slug: 'marriage-of-the-mouses-daughter', season: 2, released: false,
    title: { en: "The Marriage of the Mouse's Daughter", simp: '老鼠嫁女儿', trad: '老鼠嫁女兒' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-3.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 16, slug: 'stealing-a-bell-with-covered-ears', season: 2, released: false,
    title: { en: 'Stealing a Bell with Covered Ears', simp: '掩耳盗铃', trad: '掩耳盜鈴' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-4.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 17, slug: 'bed-of-a-hundred-birds', season: 2, released: false,
    title: { en: 'The Bed of a Hundred Birds', simp: '百鸟床', trad: '百鳥床' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-5.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 18, slug: 'blind-men-and-the-elephant', season: 2, released: false,
    title: { en: 'The Blind Men and the Elephant', simp: '盲人摸象', trad: '盲人摸象' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-6.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 19, slug: 'auntie-tiger', season: 2, released: false,
    title: { en: 'Auntie Tiger', simp: '虎姑婆', trad: '虎姑婆' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-7.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 20, slug: 'legend-of-lady-meng-jiangnu', season: 2, released: false,
    title: { en: 'Legend of Lady Meng Jiangnu', simp: '孟姜女传说', trad: '孟姜女傳說' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-8.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 21, slug: 'ah-qiao-and-the-silkworms', season: 2, released: false,
    title: { en: 'Ah Qiao and the Silkworms', simp: '阿巧养蚕', trad: '阿巧養蠶' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-9.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 22, slug: 'silkworm-goddess', season: 2, released: false,
    title: { en: 'The Silkworm Goddess', simp: '蚕花娘娘', trad: '蠶花娘娘' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-10.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 23, slug: 'nuwa-creates-people', season: 2, released: false, part: 1, parts: 2,
    title: { en: 'The Story of Nüwa P1: Nüwa Creates People', simp: '女娲故事 P1：女娲造人', trad: '女媧故事 P1：女媧造人' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-11.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
    },
    hasBundle: true,
  },
  {
    num: 24, slug: 'nuwa-mends-the-sky', season: 2, released: false, part: 2, parts: 2,
    title: { en: 'The Story of Nüwa P2: Nüwa Mends the Sky', simp: '女娲故事 P2：女娲补天', trad: '女媧故事 P2：女媧補天' },
    blurb: '', runtime: '', pub: '', coverColor: '', coverImage: '/img/covers/story-covers-s2_SQ-12.png',
    audio: {
      en: { spotify: '', youtube: '', apple: '' },
      zh: { spotify: '', youtube: '', apple: '' },
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
