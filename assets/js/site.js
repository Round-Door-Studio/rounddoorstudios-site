/* ============================================================
   Site behavior — script toggle, library rendering, book view.
   Plain JS, no build. Mirrors what the Next.js components do.
   Two card states: released (full) and coming-soon (teaser).
   ============================================================ */
(function () {
  'use strict';

  /* ---- Script toggle (简 / 繁 ), persisted ---- */
  function initScript() {
    var saved = localStorage.getItem('rds-script') || 'simp';
    setScript(saved);
    var tog = document.getElementById('scriptToggle');
    if (!tog) return;
    tog.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { setScript(b.dataset.s); });
    });
  }
  function setScript(s) {
    document.documentElement.setAttribute('data-script', s);
    localStorage.setItem('rds-script', s);

    /* Sync header toggle */
    var tog = document.getElementById('scriptToggle');
    if (tog) tog.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.s === s);
    });

    /* Sync Reading View mode buttons (simp/trad only — leave compare alone) */
    document.querySelectorAll('.rc-mode[data-mode="simp"], .rc-mode[data-mode="trad"]').forEach(function (b) {
      var on = b.dataset.mode === s;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    /* Sync #reading mode class unless the user is in compare view */
    var reading = document.getElementById('reading');
    if (reading && !reading.classList.contains('mode-compare')) {
      reading.classList.remove('mode-simp', 'mode-trad');
      reading.classList.add('mode-' + s);
    }
  }

  function href(st) { return 'story.html?story=' + encodeURIComponent(st.slug); }

  /* ---- Shared Listen component ---- */
  function escAttr(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function platformPills(links, opts) {
    var L = links || {};
    var O = opts || {};
    var audio = O.audio || {};
    var appleLabel = O.appleLabel || 'Apple';
    function linkFor(lang, key) {
      return ((audio[lang] || {})[key]) || '#';
    }
    function dynamicAttrs(key) {
      if (!O.dynamic) return '';
      return ' data-platform="' + key + '"' +
        ' data-href-en="' + escAttr(linkFor('en', key)) + '"' +
        ' data-href-zh="' + escAttr(linkFor('zh', key)) + '"';
    }
    function p(name, color, key) {
      return '<a class="pill" href="' + escAttr(L[key] || '#') + '" target="_blank" rel="noopener"' + dynamicAttrs(key) + '>' +
        '<span class="dot" style="background:' + color + '"></span>' + name + '</a>';
    }
    return '<div class="pills">' +
      p('Spotify', '#1DB954', 'spotify') +
      p('YouTube', '#FF4136', 'youtube') +
      p(appleLabel, '#A6A6A6', 'apple') +
    '</div>';
  }

  function listenControl(st, extraClass) {
    var cls = 'read-listen' + (extraClass ? ' ' + extraClass : '');
    var isDetail = cls.indexOf('listen-control--detail') !== -1;
    var sets = isDetail
      ? '<div class="listen-sets listen-sets--detail">' + platformPills(st.audio && st.audio.en, { appleLabel: 'Apple Podcasts', audio: st.audio, dynamic: true }) + '</div>'
      : '<div class="listen-sets">' +
          '<div class="listen-set" data-lang="en">' + platformPills(st.audio && st.audio.en) + '</div>' +
          '<div class="listen-set" data-lang="zh" hidden>' + platformPills(st.audio && st.audio.zh) + '</div>' +
        '</div>';
    return '<div class="' + cls + '" data-active-lang="en">' +
      '<div class="listen-head">' +
        '<span class="listen-label">Listen</span>' +
        '<div class="listen-langs" role="tablist" aria-label="Audio language">' +
          '<button type="button" class="listen-lang is-on" data-lang="en" role="tab" aria-selected="true">English</button>' +
          '<button type="button" class="listen-lang" data-lang="zh" role="tab" aria-selected="false">中文</button>' +
        '</div>' +
      '</div>' +
      sets +
    '</div>';
  }

  function updateDetailListenLinks(control, lang) {
    control.querySelectorAll('a[data-platform]').forEach(function (link) {
      link.setAttribute('href', link.getAttribute('data-href-' + lang) || '#');
    });
  }

  function bindListen(root) {
    var scope = root || document;
    var controls = scope.querySelectorAll('.read-listen');
    controls.forEach(function (control) {
      if (control.dataset.listenBound === 'true') return;
      control.dataset.listenBound = 'true';
      var langs = control.querySelectorAll('.listen-lang');
      var sets = control.querySelectorAll('.listen-set');
      var isDetail = control.classList.contains('listen-control--detail');
      var detailRow = control.querySelector('.listen-sets--detail');
      if (isDetail) updateDetailListenLinks(control, control.dataset.activeLang || 'en');
      if (!langs.length) return;
      langs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var lang = btn.dataset.lang;
          if (control.dataset.activeLang === lang) return;
          control.dataset.activeLang = lang;
          langs.forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          if (isDetail && detailRow) {
            detailRow.classList.add('is-fading');
            window.setTimeout(function () {
              updateDetailListenLinks(control, lang);
              detailRow.classList.remove('is-fading');
            }, 120);
          } else {
            sets.forEach(function (s) { s.hidden = s.dataset.lang !== lang; });
          }
        });
      });
    });
  }

  window.RDS_LISTEN = {
    render: listenControl,
    bind: bindListen
  };

  window.RDS_SCRIPT = { set: setScript };

  /* ---- Covers ---- */
  function cover(st) {
    var c = st.coverColor || '#9B4761';
    if (!st.released) {
      /* Colored placeholder cover — title concealed (surprise), "Coming soon" overlay */
      return '' +
        '<div class="cover cover--soon">' +
          '<div class="stripes"></div>' +
          '<div class="grad" style="background:linear-gradient(155deg,' + c + 'EE 0%,' + c + '66 60%,transparent 100%)"></div>' +
          '<div class="soon-badge">Coming soon</div>' +
        '</div>';
    }
    if (st.coverImage) {
      return '' +
        '<div class="cover cover--image">' +
          '<img src="' + escAttr(st.coverImage) + '" alt="' + escAttr(st.title.en + ' cover art') + '" loading="lazy" />' +
        '</div>';
    }
    return '' +
      '<div class="cover">' +
        '<div class="stripes"></div>' +
        '<div class="grad" style="background:linear-gradient(155deg,' + c + 'EE 0%,' + c + '66 60%,transparent 100%)"></div>' +
        '<div class="c-zh only-simp zh-simp">' + st.title.simp + '</div>' +
        '<div class="c-zh only-trad zh-trad">' + st.title.trad + '</div>' +
        '<div class="c-title">' + st.title.en + '</div>' +
      '</div>';
  }

  /* ---- Title (all three scripts; CSS shows the active one) ---- */
  function titleBlock(st) {
    return '' +
      '<h3 class="story-title">' +
        '<span class="only-simp zh-simp">' + st.title.simp + '</span>' +
        '<span class="only-trad zh-trad">' + st.title.trad + '</span>' +
        '<span class="only-en">' + st.title.en + '</span>' +
      '</h3>' +
      '<p class="en-subtitle">' + st.title.en + '</p>';
  }

  /* ---- Coming-soon teaser body (title concealed) ---- */
  function soonBody(st) {
    return '' +
      '<p class="eyebrow" style="margin-bottom:8px;">Episode ' + pad(st.ep) + ' · Season ' + st.season + '</p>' +
      '<h3 class="story-title muted" style="opacity:.85;">Coming soon</h3>' +
      '<p class="muted only-simp zh-simp" style="font-size:16px;">敬请期待</p>' +
      '<p class="muted only-trad zh-trad" style="font-size:16px;">敬請期待</p>' +
      '<p class="muted only-en" style="font-style:italic;font-size:13px;">A new story waiting behind the door.</p>' +
      '<span class="tag-soon">✦ Unreleased</span>';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function latestReleasedStory(stories) {
    return (stories || []).filter(function (st) { return st.released; }).sort(function (a, b) {
      return (b.season || 0) - (a.season || 0) || (b.ep || 0) - (a.ep || 0);
    })[0];
  }

  function featuredView(st) {
    return '<article class="featured">' +
      '<a class="featured-cover" href="' + href(st) + '" aria-label="' + escAttr(st.title.en) + '">' + cover(st) + '</a>' +
      '<div class="featured-body">' +
        '<p class="eyebrow">Episode ' + pad(st.ep) + ' · Season ' + st.season + '</p>' +
        '<h3 class="featured-zh">' +
          '<span class="only-simp zh-simp">' + st.title.simp + '</span>' +
          '<span class="only-trad zh-trad">' + st.title.trad + '</span>' +
        '</h3>' +
        '<p class="featured-en">' + st.title.en + '</p>' +
        '<p class="featured-teaser">' + (st.blurb || '') + '</p>' +
        '<div class="featured-meta">' +
          '<span><b>' + (st.runtime || 'New') + '</b> listen</span>' +
          '<span class="dot-sep">·</span>' +
          '<span>Ages <b>' + (st.ageRange || 'all') + '</b></span>' +
        '</div>' +
        '<div class="featured-cta">' +
          '<a class="btn btn-primary" href="' + href(st) + '">Listen Now</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function initFeatured() {
    if (!window.RDS_STORIES) return;
    var st = latestReleasedStory(window.RDS_STORIES);
    if (!st) return;
    var mount = document.getElementById('featured-mount');
    if (mount) mount.innerHTML = featuredView(st);
    var sample = document.getElementById('sample-story-link');
    if (sample) sample.setAttribute('href', href(st));
  }

  /* ---- Grid view ---- */
  function gridView(stories) {
    return '<div class="grid">' + stories.map(function (st) {
      if (!st.released) {
        return '<article class="story-card is-soon">' +
          '<div class="story-link">' + cover(st) + '</div>' +
          '<div class="story-meta">' + soonBody(st) + '</div>' +
        '</article>';
      }
      return '<article class="story-card">' +
        '<div class="story-media">' +
          '<a class="story-link" href="' + href(st) + '">' + cover(st) + '</a>' +
          listenControl(st, 'listen-control--library') +
        '</div>' +
        '<div class="story-meta">' +
          '<a class="story-headline" href="' + href(st) + '">' +
            '<p class="eyebrow" style="font-size:10px;">Ep ' + pad(st.ep) + ' · ' + st.runtime + ' · ages ' + st.ageRange + '</p>' +
            titleBlock(st) +
            '<p class="story-desc">' + st.blurb + '</p>' +
          '</a>' +
          '<a class="btn btn-primary btn-sm story-pack-btn" href="' + href(st) + '">Open Story Pack</a>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  /* ---- Book view ---- */
  var bookIdx = 0;
  function bookView(stories, mount) {
    var perSpread = window.matchMedia('(max-width:880px)').matches ? 1 : 2;
    var total = Math.ceil(stories.length / perSpread);
    if (bookIdx > total - 1) bookIdx = total - 1;
    if (bookIdx < 0) bookIdx = 0;
    var vis = stories.slice(bookIdx * perSpread, bookIdx * perSpread + perSpread);

    function story(st) {
      if (!st) return '<div></div>';
      if (!st.released) {
        return '<div class="book-story is-soon">' +
          '<div class="story-link">' + cover(st) + '</div>' +
          '<div>' + soonBody(st) + '</div>' +
        '</div>';
      }
      return '<div class="book-story">' +
        '<div class="story-media story-media--book">' +
          '<a class="story-link" href="' + href(st) + '">' + cover(st) + '</a>' +
          listenControl(st, 'listen-control--library') +
        '</div>' +
        '<div>' +
          '<a class="story-headline" href="' + href(st) + '">' +
            '<p class="eyebrow" style="margin-bottom:6px;">Episode ' + pad(st.ep) + ' · ' + st.pub + '</p>' +
            titleBlock(st) +
            '<p class="story-desc" style="margin:8px 0 10px;">' + st.blurb + '</p>' +
          '</a>' +
          '<a class="btn btn-primary btn-sm story-pack-btn" href="' + href(st) + '">Open Story Pack</a>' +
        '</div>' +
      '</div>';
    }

    mount.innerHTML =
      '<div class="book">' +
        '<div class="book-flair">月門 · Round Door</div>' +
        '<div class="book-page book-page--l">' +
          '<div class="book-corner">' + (bookIdx * perSpread + 1) + ' / ' + stories.length + '</div>' +
          story(vis[0]) +
          '<button class="book-arrow book-arrow--l" id="bk-prev" aria-label="Previous page"><span class="bk-chip">‹</span></button>' +
        '</div>' +
        '<div class="book-page book-page--r">' +
          '<div class="book-corner">' + (perSpread > 1 ? Math.min(bookIdx * perSpread + 2, stories.length) : bookIdx + 1) + ' / ' + stories.length + '</div>' +
          story(vis[1]) +
          '<button class="book-arrow book-arrow--r" id="bk-next" aria-label="Next page"><span class="bk-chip">›</span></button>' +
        '</div>' +
      '</div>';

    var prev = document.getElementById('bk-prev');
    var next = document.getElementById('bk-next');
    if (prev) { prev.disabled = bookIdx === 0; prev.onclick = function () { if (bookIdx > 0) { bookIdx--; bookView(stories, mount); } }; }
    if (next) { next.disabled = bookIdx >= total - 1; next.onclick = function () { if (bookIdx < total - 1) { bookIdx++; bookView(stories, mount); } }; }
    bindListen(mount);
  }

  /* ---- Library mount + view toggle ---- */
  function initLibrary() {
    var mount = document.getElementById('library-mount');
    if (!mount || !window.RDS_STORIES) return;
    var stories = window.RDS_STORIES;
    var view = localStorage.getItem('rds-view') || 'book';

    function render() {
      if (view === 'grid') mount.innerHTML = gridView(stories);
      else bookView(stories, mount);
      bindListen(mount);
      var tog = document.getElementById('viewToggle');
      if (tog) tog.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-on', b.dataset.v === view);
      });
    }
    render();

    var tog = document.getElementById('viewToggle');
    if (tog) tog.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.dataset.v; localStorage.setItem('rds-view', view); bookIdx = 0; render();
      });
    });
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(function () { if (view === 'book') bookView(stories, mount); }, 150);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initScript();
    initFeatured();
    initLibrary();
  });
})();
