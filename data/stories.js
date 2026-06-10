/* ============================================================
   Story catalog — the ONE file you edit to grow the library.

   To reveal a story at launch: set  released: true.
   Until then it shows as a "coming soon" surprise card.

   Each episode has separate English + Mandarin audio versions;
   `audio` holds the per-language links (fill in when live).
   In the Next.js build this is generated from each story's
   content/stories/<slug>/meta.json — same shape.
   ============================================================ */

window.RDS_STORIES = [
  {
    ep: 1, slug: 'frog-at-the-bottom-of-the-well', season: 1, released: true,
    title: { en: 'The Frog at the Bottom of the Well', simp: '井底之蛙', trad: '井底之蛙' },
    blurb: 'A little frog who is sure his well is the whole world — until a sea turtle who has seen the ocean comes to rest by the rim.',
    runtime: '12-15 min', pub: 'Jun 10, 2026', coverColor: '#5C8358',
    coverImage: 'assets/img/covers/frog-at-the-bottom-of-the-well-square.png',
    coverImageLandscape: 'assets/img/covers/frog-at-the-bottom-of-the-well-landscape.png',
    audio: { en: { spotify: 'https://open.spotify.com/episode/158DFYe9Wjx4AsCu7B9sL1?si=jcag9qvwTKyhxGousQbFKw', 
                   youtube: 'https://youtu.be/8s6AyIEjsfk', 
                   apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000771985730' }, 
             zh: { spotify: 'https://open.spotify.com/episode/0oEiUDbeNTA17AClFESaBX?si=r6z8YZcJTfm8t1pLII7GOw',
                   youtube: 'https://youtu.be/OJuRDrasjEk',
                   apple: 'https://podcasts.apple.com/us/podcast/the-round-door/id1896903747?i=1000772050133' } },
    hasBundle: true,
  },
  {
    ep: 2, slug: 'qu-yuan-and-dragon-boat-festival', season: 1, released: false,
    title: { en: 'Qu Yuan and the Dragon Boat Festival', simp: '屈原与端午节', trad: '屈原與端午節' },
    blurb: 'The poet-minister whose love for his country gave us dragon boats, sticky-rice zongzi, and the fifth day of the fifth month.',
    runtime: '16 min', pub: 'June 17, 2026', coverColor: '#5B5C9D',
    audio: { en: { spotify: '#', youtube: '#', apple: '#' }, zh: { spotify: '#', youtube: '#', apple: '#' } },
    hasBundle: true,
  },
  {
    ep: 3, slug: 'mend-the-sheep-pen', season: 1, released: false,
    title: { en: 'Never Too Late to Mend the Sheep Pen', simp: '亡羊补牢', trad: '亡羊補牢' },
    coverColor: '#C4994F', hasBundle: true,
  },
  {
    ep: 4, slug: 'fox-borrows-the-tigers-might', season: 1, released: false,
    title: { en: "The Fox Borrows the Tiger's Might", simp: '狐假虎威', trad: '狐假虎威' },
    coverColor: '#A8513A', hasBundle: true,
  },
  {
    ep: 5, slug: 'ma-liang-magic-brush-1', season: 1, released: false, part: 1, parts: 2,
    title: { en: 'Ma Liang and the Magic Brush · Part 1', simp: '神笔马良', trad: '神筆馬良' },
    coverColor: '#9B4761', hasBundle: true,
  },
  {
    ep: 6, slug: 'ma-liang-magic-brush-2', season: 1, released: false, part: 2, parts: 2,
    title: { en: 'Ma Liang and the Magic Brush · Part 2', simp: '神笔马良', trad: '神筆馬良' },
    coverColor: '#7B324A', hasBundle: true,
  },
  {
    ep: 7, slug: 'dragon-gets-its-eyes', season: 1, released: false,
    title: { en: 'When the Dragon Gets Its Eyes', simp: '画龙点睛', trad: '畫龍點睛' },
    coverColor: '#436641', hasBundle: true,
  },
  {
    ep: 8, slug: 'adding-legs-to-a-snake', season: 1, released: false,
    title: { en: 'Adding Legs to a Snake', simp: '画蛇添足', trad: '畫蛇添足' },
    coverColor: '#5C8358', hasBundle: true,
  },
  {
    ep: 9, slug: 'weaver-girl-and-cowherd-1', season: 1, released: false, part: 1, parts: 2,
    title: { en: 'The Weaver Girl and the Cowherd · Part 1', simp: '牛郎织女', trad: '牛郎織女' },
    coverColor: '#5B5C9D', hasBundle: true,
  },
  {
    ep: 10, slug: 'weaver-girl-and-cowherd-2', season: 1, released: false, part: 2, parts: 2,
    title: { en: 'The Weaver Girl and the Cowherd · Part 2', simp: '牛郎织女', trad: '牛郎織女' },
    coverColor: '#43447F', hasBundle: true,
  },
  {
    ep: 11, slug: 'three-morning-four-evening', season: 1, released: false,
    title: { en: 'Three in the Morning, Four in the Evening', simp: '朝三暮四', trad: '朝三暮四' },
    coverColor: '#8B7355', hasBundle: true,
  },
  {
    ep: 12, slug: 'farmer-who-waited-for-the-rabbit', season: 1, released: false,
    title: { en: 'The Farmer Who Waited for the Rabbit', simp: '守株待兔', trad: '守株待兔' },
    coverColor: '#A8513A', hasBundle: true,
  },
];
