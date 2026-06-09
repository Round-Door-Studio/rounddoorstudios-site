/* ============================================================
   Story detail — Story Pack with Read Along, New Words,
   Curious Questions, and Explore Further tabs.
   ============================================================ */
(function () {
  'use strict';

  var PACK_TABS = [
    { id: 'read', icon: '📖', label: 'Read Along' },
    { id: 'words', icon: '🔤', label: 'New Words' },
    { id: 'questions', icon: '💬', label: 'Curious Questions' },
    { id: 'explore', icon: '🌏', label: 'Culture Corner' },
  ];

  var BADGES = [
    'Read-along story',
    'Vocabulary',
    'Conversation prompts',
    'Cultural activity',
  ];

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fetchJson(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error('missing');
      return r.json();
    });
  }

  function escAttr(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function cover(st) {
    if (st.coverImage) {
      return '<div class="cover cover--image">' +
        '<img src="' + escAttr(st.coverImage) + '" alt="' + escAttr(st.title.en + ' cover art') + '" loading="lazy" />' +
      '</div>';
    }
    var c = st.coverColor || '#9B4761';
    return '<div class="cover">' +
      '<div class="stripes"></div>' +
      '<div class="grad" style="background:linear-gradient(155deg,' + c + 'EE 0%,' + c + '66 60%,transparent 100%)"></div>' +
      '<div class="c-zh only-simp zh-simp">' + st.title.simp + '</div>' +
      '<div class="c-zh only-trad zh-trad">' + st.title.trad + '</div>' +
      '<div class="c-title">' + st.title.en + '</div>' +
    '</div>';
  }

  function notFound(mount, msg) {
    mount.innerHTML =
      '<a class="read-back" href="library.html">‹ Back to the library</a>' +
      '<div class="card" style="text-align:center;padding:48px 28px;">' +
        '<div style="width:72px;height:72px;margin:0 auto 18px;"><img src="assets/icons/round-door.png" alt="" style="width:100%;opacity:.85"></div>' +
        '<h1 class="display" style="font-size:28px;margin-bottom:8px;">' + (msg || 'This door hasn\'t opened yet') + '</h1>' +
        '<p class="muted" style="font-size:14px;">Come back at launch — or browse what\'s already open.</p>' +
        '<div style="margin-top:18px;"><a class="btn btn-primary" href="library.html">Browse the library</a></div>' +
      '</div>';
  }

  function splitTier(items, key) {
    var door = items.filter(function (x) { return x[key] === 'door'; });
    var beyond = items.filter(function (x) { return x[key] === 'beyond'; });
    if (!door.length && !beyond.length && items.length) {
      var mid = Math.ceil(items.length / 2);
      door = items.slice(0, mid);
      beyond = items.slice(mid);
    }
    return { door: door, beyond: beyond };
  }

  function vocabCard(w) {
    var ex = w.example;
    /* Support new nested format: w.simp = {text, pinyin[]}, w.trad = {text, bpmf} */
    var simpText = (w.simp && w.simp.text) || w.simp || '';
    var tradText = (w.trad && w.trad.bpmf) || (w.trad && w.trad.text) || w.trad || '';
    /* Pinyin for the headword: join readings from array, or use legacy string */
    var pinyinDisplay = '';
    if (w.simp && Array.isArray(w.simp.pinyin)) {
      pinyinDisplay = w.simp.pinyin.map(function (p) { return p.reading || ''; }).filter(Boolean).join(' ');
    } else {
      pinyinDisplay = w.pinyin || '';
    }
    var exHtml = '';
    if (ex) {
      var exSimpHtml = '';
      var exTradHtml = '';
      if (ex.simp && ex.simp.text) {
        exSimpHtml = rubyHtmlHighlight(ex.simp.text, ex.simp.pinyin, 'pinyin', simpText);
      } else {
        exSimpHtml = escapeHtml(ex.simp || '');
      }
      if (ex.trad && (ex.trad.bpmf || ex.trad.text)) {
        var bpmfSrc = ex.trad.bpmf || ex.trad.text;
        exTradHtml = '<span class="zh-bpmf">' + bpmfHtmlHighlight(bpmfSrc, tradText) + '</span>';
      } else {
        exTradHtml = escapeHtml(ex.trad || '');
      }
      exHtml = '<p class="pack-vocab-ex">' +
        '<span class="only-simp zh-simp">' + exSimpHtml + '</span>' +
        '<span class="only-trad">' + exTradHtml + '</span>' +
        '<span class="pack-vocab-ex-en">' + escapeHtml(ex.en || '') + '</span>' +
      '</p>';
    }
    return '<article class="pack-vocab-card">' +
      '<div class="pack-vocab-head">' +
        '<span class="pack-vocab-char only-simp zh-simp">' + escapeHtml(simpText) + '</span>' +
        '<span class="pack-vocab-char only-trad zh-bpmf">' + escapeHtml(tradText) + '</span>' +
        '<div class="pack-vocab-meta">' +
          '<div class="pack-vocab-pinyin">' + escapeHtml(pinyinDisplay) + '</div>' +
          '<div class="pack-vocab-en">' + escapeHtml(w.en || '') + '</div>' +
        '</div>' +
      '</div>' +
      exHtml +
    '</article>';
  }

  function vocabSection(vocab) {
    var groups = splitTier(vocab, 'tier');
    function group(title, items) {
      if (!items.length) return '';
      return '<div class="pack-tier">' +
        '<h3 class="pack-tier-label">' + title + '</h3>' +
        '<div class="pack-vocab-grid">' + items.map(vocabCard).join('') + '</div>' +
      '</div>';
    }
    if (!vocab.length) {
      return '<div class="pack-empty card"><p class="muted">New words for this story pack are on their way.</p></div>';
    }
    return '<p class="pack-parent-note">Try a few words at a time and use them in everyday conversation.</p>' +
      group('Open the Door', groups.door) + group('Go Beyond', groups.beyond);
  }

  function questionCard(q, i) {
    var zh = '';
    if (q.simp && q.trad) {
      zh = '<p class="pack-q-zh">' +
        '<span class="only-simp zh-simp">' + rubyHtml(q.simp.text, q.simp.pinyin, 'pinyin') + '</span>' +
        '<span class="only-trad zh-bpmf">' + escapeHtml(q.trad.bpmf || q.trad.text) + '</span>' +
      '</p>';
    }
    return '<article class="pack-q-card">' +
      '<span class="pack-q-num">' + (i + 1) + '</span>' +
      '<div class="pack-q-body">' +
        zh +
        '<p class="pack-q-text">' + escapeHtml(q.en) + '</p>' +
      '</div>' +
    '</article>';
  }

  function questionsSection(questions) {
    function group(title, items) {
      if (!items.length) return '';
      return '<div class="pack-tier">' +
        '<h3 class="pack-tier-label">' + title + '</h3>' +
        '<div class="pack-q-grid">' + items.map(questionCard).join('') + '</div>' +
      '</div>';
    }
    var open = questions.open || [];
    var beyond = questions.beyond || [];
    if (!open.length && !beyond.length) {
      return '<div class="pack-empty card"><p class="muted">Curious questions for this story pack are on their way.</p></div>';
    }
    return '<p class="pack-parent-note">Follow your child’s curiosity. Choose the questions that fit today.</p>' +
      group('Open the Door', open) + group('Go Beyond', beyond);
  }

  function activityCard(a) {
    var accent = a.accent || '#5C8358';
    /* Support new nested format: a.title = {en, simp:{text}, trad:{bpmf}} */
    var titleEn = (a.title && a.title.en) || a.title || '';
    var descEn = (a.desc && a.desc.en) || a.desc || '';
    var titleZh = '';
    if (a.title && a.title.simp) {
      titleZh = '<p class="pack-act-title-zh">' +
        '<span class="only-simp zh-simp">' + rubyHtml(a.title.simp.text, a.title.simp.pinyin, 'pinyin') + '</span>' +
        '<span class="only-trad zh-bpmf">' + escapeHtml((a.title.trad && (a.title.trad.bpmf || a.title.trad.text)) || '') + '</span>' +
      '</p>';
    }
    var descZh = '';
    if (a.desc && a.desc.simp) {
      descZh = '<p class="pack-act-desc-zh">' +
        '<span class="only-simp zh-simp">' + rubyHtml(a.desc.simp.text, a.desc.simp.pinyin, 'pinyin') + '</span>' +
        '<span class="only-trad zh-bpmf">' + escapeHtml((a.desc.trad && (a.desc.trad.bpmf || a.desc.trad.text)) || '') + '</span>' +
      '</p>';
    }
    return '<article class="pack-act-card" id="activity-' + a.id + '">' +
      '<div class="pack-act-art" style="background:linear-gradient(145deg,' + accent + '33 0%,' + accent + '18 55%,var(--paper) 100%);">' +
        '<img src="assets/icons/round-door.png" alt="" class="pack-act-door" />' +
      '</div>' +
      '<div class="pack-act-body">' +
        '<h3 class="pack-act-title">' + escapeHtml(titleEn) + '</h3>' +
        titleZh +
        '<p class="pack-act-desc">' + escapeHtml(descEn) + '</p>' +
        descZh +
        '<div class="pack-act-foot">' +
          '<span class="pack-act-time">⏱ ' + escapeHtml(a.time || '') + '</span>' +
          '<button type="button" class="btn btn-primary btn-sm pack-act-open" data-act="' + a.id + '">Open Activity</button>' +
        '</div>' +
        '<div class="pack-act-detail" hidden>' +
          '<p class="pack-act-detail-lead">Here\'s how to try it:</p>' +
          (a.materials && a.materials.length ? (
            '<div class="pack-act-section">' +
              '<p class="pack-act-section-label">You\'ll need</p>' +
              '<ul class="pack-act-materials">' +
              a.materials.map(function (m) {
                var enText = (typeof m === 'string') ? m : (m.en || '');
                var zhHtml = '';
                if (m.simp) {
                  zhHtml = '<span class="pack-act-item-zh">' +
                    '<span class="only-simp zh-simp">' + rubyHtml(m.simp.text, m.simp.pinyin, 'pinyin') + '</span>' +
                    '<span class="only-trad zh-bpmf">' + escapeHtml((m.trad && (m.trad.bpmf || m.trad.text)) || '') + '</span>' +
                  '</span>';
                }
                return '<li>' + zhHtml + '<span class="pack-act-item-en">' + escapeHtml(enText) + '</span></li>';
              }).join('') +
              '</ul>' +
            '</div>'
          ) : '') +
          (a.steps && a.steps.length ? (
            '<div class="pack-act-section">' +
              '<p class="pack-act-section-label">Steps</p>' +
              '<ol class="pack-act-steps">' +
              a.steps.map(function (s) {
                var enText = (typeof s === 'string') ? s : (s.en || '');
                var zhHtml = '';
                if (s.simp) {
                  zhHtml = '<span class="pack-act-item-zh">' +
                    '<span class="only-simp zh-simp">' + rubyHtml(s.simp.text, s.simp.pinyin, 'pinyin') + '</span>' +
                    '<span class="only-trad zh-bpmf">' + escapeHtml((s.trad && (s.trad.bpmf || s.trad.text)) || '') + '</span>' +
                  '</span>';
                }
                return '<li>' + zhHtml + '<span class="pack-act-item-en">' + escapeHtml(enText) + '</span></li>';
              }).join('') +
              '</ol>' +
            '</div>'
          ) : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function exploreSection(activities) {
    var list = activities.activities || activities || [];
    if (!list.length) {
      return '<div class="pack-empty card"><p class="muted">Cultural activities for this story pack are on their way.</p></div>';
    }
    return '<p class="pack-parent-note">Explore the traditions, places, and ideas behind the story.</p>' +
      '<div class="pack-act-grid">' + list.map(activityCard).join('') + '</div>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function simpCompareTokens(html) {
    var tokens = [];
    var re = /<ruby>[\s\S]*?<\/ruby>|[\s\S]/g;
    var match;
    while ((match = re.exec(html || '')) !== null) {
      var token = match[0];
      tokens.push(token.indexOf('<ruby>') === 0 ? token : escapeHtml(token));
    }
    return normalizeCompareTokens(tokens);
  }

  /* ── Exact ruby pairing (new story-script format) ───────────────
     Each line carries the line's pinyin / zhuyin as space-separated
     syllables. Because the character→reading relationship is many-to-
     many (多音字), we never guess from a font — we pair each Han
     character with its own syllable, in order, as a <ruby> annotation. */
  var HAN_RE = /[\u3400-\u9FFF\uF900-\uFAFF\u{20000}-\u{2A6DF}]/u;
  var ZHUYIN_PUNCT_RE = /[，。！？：；「」『』（）、⋯…]/g;

  function syllablesOf(str, kind) {
    if (!str) return [];
    if (kind === 'zhuyin') {
      /* runs of bopomofo + tone marks (ˊ ˇ ˋ ˙); tone 1 is unmarked */
      return str.match(/[\u3105-\u312F\u31A0-\u31BF\u02C7\u02CA\u02CB\u02D9]+/g) || [];
    }
    /* pinyin: runs of latin letters incl. tone-marked vowels */
    return str.match(/[A-Za-z\u00C0-\u024F]+/g) || [];
  }

  function rubyTokens(text, syllableStr, kind) {
    var tokens = [];
    var si = 0;
    if (Array.isArray(syllableStr)) {
      /* New format: array of {text, reading} indexed 1:1 with text chars */
      Array.from(text || '').forEach(function (ch) {
        var reading = (syllableStr[si] && syllableStr[si].reading) || '';
        si++;
        if (HAN_RE.test(ch)) {
          tokens.push('<ruby>' + escapeHtml(ch) + '<rt>' + escapeHtml(reading) + '</rt></ruby>');
        } else {
          tokens.push(escapeHtml(ch));
        }
      });
      return tokens;
    }
    /* Legacy format: space-separated syllable string */
    var syl = syllablesOf(syllableStr, kind);
    Array.from(text || '').forEach(function (ch) {
      if (HAN_RE.test(ch)) {
        tokens.push('<ruby>' + escapeHtml(ch) + '<rt>' + escapeHtml(syl[si++] || '') + '</rt></ruby>');
      } else {
        tokens.push(escapeHtml(ch));
      }
    });
    return tokens;
  }

  function rubyHtml(text, syllableStr, kind) {
    return rubyTokens(text, syllableStr, kind).join('');
  }

  /* Wrap the first occurrence of highlightWord characters in the ruby token
     array with <strong class="vocab-hl">…</strong>. */
  function rubyHtmlHighlight(text, syllableStr, kind, highlightWord) {
    var tokens = rubyTokens(text, syllableStr, kind);
    if (!highlightWord) return tokens.join('');
    var chars = Array.from(text || '');
    var hlChars = Array.from(highlightWord);
    var startIdx = -1;
    outer: for (var i = 0; i <= chars.length - hlChars.length; i++) {
      for (var j = 0; j < hlChars.length; j++) {
        if (chars[i + j] !== hlChars[j]) { continue outer; }
      }
      startIdx = i;
      break;
    }
    if (startIdx === -1) return tokens.join('');
    var endIdx = startIdx + hlChars.length;
    return tokens.slice(0, startIdx).join('') +
      '<strong class="vocab-hl">' + tokens.slice(startIdx, endIdx).join('') + '</strong>' +
      tokens.slice(endIdx).join('');
  }

  /* Same for bpmf strings — strips variation selectors before comparing. */
  function bpmfHtmlHighlight(bpmfStr, tradWord) {
    var tokens = bpmfSplitTokens(bpmfStr);
    if (!tradWord) return tokens.map(escapeHtml).join('');
    var hlChars = Array.from(tradWord);
    function base(tok) { return Array.from(tok).filter(function (ch) {
      var cp = ch.codePointAt(0);
      return !((cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF));
    }).join(''); }
    var startIdx = -1;
    outer: for (var i = 0; i <= tokens.length - hlChars.length; i++) {
      for (var j = 0; j < hlChars.length; j++) {
        if (base(tokens[i + j]) !== hlChars[j]) { continue outer; }
      }
      startIdx = i;
      break;
    }
    if (startIdx === -1) return tokens.map(escapeHtml).join('');
    var endIdx = startIdx + hlChars.length;
    return tokens.slice(0, startIdx).map(escapeHtml).join('') +
      '<strong class="vocab-hl">' + tokens.slice(startIdx, endIdx).map(escapeHtml).join('') + '</strong>' +
      tokens.slice(endIdx).map(escapeHtml).join('');
  }

  function zhuyinSyllables(str) {
    if (!str) return [];
    return str.split(/\s+/).reduce(function (out, token) {
      token.replace(ZHUYIN_PUNCT_RE, ' ').split(/\s+/).forEach(function (part) {
        if (part) out.push(part);
      });
      return out;
    }, []);
  }

  function countHan(text) {
    return Array.from(text || '').filter(function (ch) { return HAN_RE.test(ch); }).length;
  }

  /* ── Bpmf font rendering (new approach) ─────────────────────────
     The bpmf field contains traditional text with Unicode Variation
     Selectors Supplement (U+E0100–U+E01EF) that tell Bpmf Huninn
     which glyph variant (reading) to render inline — no ruby needed.
     We split the string keeping each VS attached to its base char. */
  function bpmfSplitTokens(str) {
    var tokens = [];
    Array.from(str || '').forEach(function (ch) {
      var cp = ch.codePointAt(0);
      var isVS = (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF);
      if (isVS && tokens.length) {
        tokens[tokens.length - 1] += ch;
      } else {
        tokens.push(ch);
      }
    });
    return tokens;
  }

  function compareCellsBpmf(tokens, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push('<span class="rd-cmp-cell zh-bpmf">' + (tokens[i] || '') + '</span>');
    }
    return out.join('');
  }

  function isNewFormatLine(ln) {
    return ln && ln.simp && typeof ln.simp === 'object';
  }

  function isCompareOpeningPunct(token) {
    return /^[「『（(《〈【〔〖〘〚“‘]+$/.test(token);
  }

  function isCompareTrailingPunct(token) {
    return /^[，。、？！：；,.!?;:…⋯）」』》〉】〕〗〙〛”’]+$/.test(token);
  }

  function normalizeCompareTokens(tokens) {
    var out = [];
    var prefix = '';
    tokens.forEach(function (token) {
      if (/^\s+$/.test(token)) return;
      if (isCompareOpeningPunct(token)) {
        prefix += token;
        return;
      }
      if (isCompareTrailingPunct(token)) {
        if (out.length) out[out.length - 1] += token;
        else prefix += token;
        return;
      }
      out.push(prefix + token);
      prefix = '';
    });
    if (prefix) {
      if (out.length) out[out.length - 1] += prefix;
      else out.push(prefix);
    }
    return out;
  }

  function compareCells(tokens, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push('<span class="rd-cmp-cell">' + (tokens[i] || '') + '</span>');
    }
    return out.join('');
  }

  function renderLine(ln) {
    var simpHtml, tradHtml, simpTokens, tradTokens;
    if (isNewFormatLine(ln)) {
      simpHtml = rubyHtml(ln.simp.text, ln.simp.pinyin, 'pinyin');
      simpTokens = normalizeCompareTokens(rubyTokens(ln.simp.text, ln.simp.pinyin, 'pinyin'));
      var bpmfStr = ln.trad.bpmf || ln.trad.text;
      tradHtml = '<span class="zh-bpmf">' + escapeHtml(bpmfStr) + '</span>';
      tradTokens = normalizeCompareTokens(bpmfSplitTokens(bpmfStr).map(escapeHtml));
    } else {
      /* legacy format: simp carries <ruby> pinyin HTML, trad is plain */
      simpHtml = ln.simp;
      tradHtml = ln.trad;
      simpTokens = simpCompareTokens(ln.simp);
      tradTokens = normalizeCompareTokens(Array.from(ln.trad || '').map(escapeHtml));
    }
    var count = Math.max(simpTokens.length, tradTokens.length);
    return '<div class="rd-line">' +
        '<div class="rd-zh">' +
          '<div class="rd-col rd-col--simp">' + simpHtml + '</div>' +
          '<div class="rd-col rd-col--trad">' + tradHtml + '</div>' +
        '</div>' +
        '<div class="rd-compare">' +
          '<div class="rd-col rd-col--simp rd-col--compare">' + compareCells(simpTokens, count) + '</div>' +
          '<div class="rd-col rd-col--trad rd-col--compare">' + compareCellsBpmf(tradTokens, count) + '</div>' +
        '</div>' +
        '<div class="rd-en">' + escapeHtml(ln.en) + '</div>' +
      '</div>';
  }

  function readControlsHtml() {
    var def = localStorage.getItem('rds-script') || 'simp';
    function modeBtn(mode, label, extraClass) {
      var on = mode === def;
      var cls = 'rc-mode' + (on ? ' is-on' : '') + (extraClass ? ' ' + extraClass : '');
      return '<button type="button" class="' + cls + '" data-mode="' + mode + '" role="tab" aria-selected="' + (on ? 'true' : 'false') + '">' + label + '</button>';
    }
    return '<div class="read-controls" id="read-controls" data-active-tab="read">' +
      '<div class="rc-group">' +
        '<span class="rc-label">Reading View</span>' +
        '<div class="rc-seg" role="tablist" aria-label="Reading view">' +
          modeBtn('simp', '简 Simplified') +
          modeBtn('trad', '繁 Traditional') +
          modeBtn('compare', '简 + 繁 Compare', 'rc-compare') +
        '</div>' +
      '</div>' +
      '<label class="rc-toggle"><input type="checkbox" id="c-en" checked> Show English</label>' +
      '<button class="btn btn-ghost btn-sm" id="c-print">⤓ Print / PDF</button>' +
    '</div>';
  }

  function readAlongSection(lines) {
    return '<p class="pack-parent-note">Read together, take turns, or listen along as you follow the podcast episode.</p>' +
      '<div class="reading" id="reading">' + lines + '</div>';
  }

  function render(mount, st, story, vocab, questions, activities) {
    var lines = (story.lines || []).map(renderLine).join('');

    var tabButtons = PACK_TABS.map(function (t, i) {
      return '<button type="button" class="pack-card ' + (i === 0 ? 'is-on' : '') + '" role="tab" id="pack-tab-' + t.id + '" data-tab="' + t.id + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-controls="pack-panel-' + t.id + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
          '<span class="pack-card-icon">' + t.icon + '</span>' +
          '<span class="pack-card-text">' +
            '<span class="pack-card-label">' + t.label + '</span>' +
          '</span>' +
        '</button>';
    }).join('');

    var tabPanels = PACK_TABS.map(function (t, i) {
      var body = '';
      if (t.id === 'read') body = readAlongSection(lines);
      else if (t.id === 'words') body = vocabSection(vocab);
      else if (t.id === 'questions') body = questionsSection(questions);
      else body = exploreSection(activities);
      return '<div class="pack-panel" role="tabpanel" id="pack-panel-' + t.id + '" aria-labelledby="pack-tab-' + t.id + '"' + (i ? ' hidden' : '') + '>' + body + '</div>';
    }).join('');

    mount.innerHTML =
      '<a class="read-back" href="library.html">‹ Back to the library</a>' +

      '<div class="read-hero">' +
        cover(st) +
        '<div>' +
          '<div class="read-hero-main">' +
            '<div class="read-hero-title">' +
              '<p class="eyebrow" style="margin-bottom:8px;">Episode ' + pad(st.ep) + ' · Season ' + st.season + ' · ages ' + st.ageRange + ' · ' + st.runtime + '</p>' +
              '<h1 class="display">' +
                '<span class="only-simp zh-simp">' + st.title.simp + '</span>' +
                '<span class="only-trad zh-trad">' + st.title.trad + '</span>' +
                '<span class="only-en">' + st.title.en + '</span>' +
              '</h1>' +
              '<p class="read-en-title">' + st.title.en + '</p>' +
              (st.blurb ? '<p class="read-blurb">' + escapeHtml(st.blurb) + '</p>' : '') +
            '</div>' +
            window.RDS_LISTEN.render(st, 'listen-control--detail') +
          '</div>' +
        '</div>' +
      '</div>' +

      

      '<div class="pack-nav-block">' +
        '<p class="pack-nav-eyebrow">Our Story Pack</p>' +
        '<div class="pack-cards" role="tablist" aria-label="Inside this Story Pack">' + tabButtons + '</div>' +
      '</div>' +

      readControlsHtml() +

      '<div class="pack-panels">' + tabPanels + '</div>';

    bindReadControls();
    bindPackTabs();
    bindActivityButtons();
    window.RDS_LISTEN.bind(mount);
  }

  function bindReadControls() {
    var reading = document.getElementById('reading');
    var mount = document.getElementById('read-mount');
    var def = localStorage.getItem('rds-script') || 'simp';

    /* Set the initial reading mode to match the stored script preference */
    if (reading) reading.classList.add('mode-' + def);

    /* Initialize show-en on the mount so all panels start with English visible */
    if (mount) mount.classList.add('show-en');

    var modes = document.querySelectorAll('.rc-mode');
    modes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.dataset.mode;
        modes.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (reading) {
          reading.classList.remove('mode-simp', 'mode-trad', 'mode-compare');
          reading.classList.add('mode-' + mode);
        }
        /* Sync the site-wide script toggle so all four panels respond */
        if (mode === 'simp' || mode === 'trad') {
          if (window.RDS_SCRIPT) window.RDS_SCRIPT.set(mode);
        }
      });
    });

    var en = document.getElementById('c-en');
    if (en) en.addEventListener('change', function (e) {
      if (mount) mount.classList.toggle('show-en', e.target.checked);
    });

    var printBtn = document.getElementById('c-print');
    if (printBtn) printBtn.addEventListener('click', function () {
      var activeTab = document.querySelector('.pack-card.is-on');
      if (mount) mount.dataset.printTab = activeTab ? activeTab.dataset.tab : 'read';
      window.print();
      window.addEventListener('afterprint', function cleanup() {
        window.removeEventListener('afterprint', cleanup);
        if (mount) delete mount.dataset.printTab;
      });
    });
  }

  function bindPackTabs() {
    var tabs = document.querySelectorAll('.pack-card');
    var panels = document.querySelectorAll('.pack-panel');
    var controls = document.getElementById('read-controls');

    function select(id) {
      tabs.forEach(function (btn) {
        var on = btn.dataset.tab === id;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });

      panels.forEach(function (panel) {
        panel.hidden = panel.id !== 'pack-panel-' + id;
      });

      /* Track active tab so Compare button can hide on non-read tabs */
      if (controls) controls.dataset.activeTab = id;

      /* When leaving Read Along, always sync simp/trad buttons to data-script.
         This ensures the correct button is active regardless of whether the
         user was in Compare mode or not. */
      if (id !== 'read') {
        var lastScript = document.documentElement.dataset.script || 'simp';
        document.querySelectorAll('.rc-mode').forEach(function (b) {
          var on = b.dataset.mode === lastScript;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        select(btn.dataset.tab);
      });
    });
  }

  function bindActivityButtons() {
    document.querySelectorAll('.pack-act-open').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.pack-act-card');
        var detail = card && card.querySelector('.pack-act-detail');
        if (!detail) return;
        var open = detail.hidden;
        detail.hidden = !open;
        btn.textContent = open ? 'Close Activity' : 'Open Activity';
        card.classList.toggle('is-open', open);
        if (open) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('read-mount');
    var slug = qs('story');
    var st = (window.RDS_STORIES || []).filter(function (s) { return s.slug === slug; })[0];
    if (!st) { notFound(mount, 'Story not found'); return; }
    if (!st.released) { notFound(mount, 'This door hasn\'t opened yet'); return; }

    document.title = 'Round Door Studio · ' + st.title.en;
    var base = 'content/' + slug + '/';

    Promise.all([
      fetchJson(base + 'story.json'),
      fetchJson(base + 'vocab.json').catch(function () { return { vocab: [] }; }),
      fetchJson(base + 'questions.json').catch(function () { return { open: [], beyond: [] }; }),
      fetchJson(base + 'activities.json').catch(function () { return { activities: [] }; }),
    ])
      .then(function (res) {
        var storyData = res[0] || {};
        var storyLines = (storyData.readAlong && storyData.readAlong.lines) || storyData.lines || [];
        render(mount, st, { lines: storyLines }, res[1].vocab || [], res[2], res[3]);
      })
      .catch(function () { notFound(mount, 'Story content is still being prepared'); });
  });
})();
