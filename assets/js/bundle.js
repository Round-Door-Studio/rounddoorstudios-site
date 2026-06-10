/* ============================================================
   Activity bundle page — Vocabulary (live), Worksheet, Cultural
   activity. Prose tabs render content/<slug>/<tab>.html when it
   exists; otherwise a content slot is shown. Free for now.
   ============================================================ */
(function () {
  'use strict';

  function qs(n) { return new URLSearchParams(location.search).get(n); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  var DOOR = 'assets/icons/round-door.png';

  var TABS = [
    { id: 'vocab',     label: 'Vocabulary' },
    { id: 'worksheet', label: 'Worksheet' },
    { id: 'activity',  label: 'Cultural activity' },
  ];

  function sheetHead(st, title, zh) {
    return '<div class="sheet-head">' +
      '<div>' +
        '<p class="eyebrow" style="font-size:9px;margin-bottom:4px;">Round Door Studio · Episode ' + pad(st.ep) + '</p>' +
        '<h2>' + title + '</h2>' +
        (zh ? '<p class="zh">' + zh + '</p>' : '') +
      '</div>' +
      '<img class="sheet-mark" src="' + DOOR + '" alt="" />' +
    '</div>';
  }
  function sheetFoot() {
    return '<div class="sheet-foot">rounddoorstudio.com · For one household — please don\'t redistribute.</div>';
  }

  function vocabSheet(st, vocab) {
    var cards = vocab.map(function (w) {
      return '<div class="vocab-card">' +
        '<span class="vc-char vc-simp">' + w.simp + '</span>' +
        '<span class="vc-char vc-trad">' + w.trad + '</span>' +
        '<div class="vc-body"><div class="vc-pinyin">' + w.pinyin + '</div><div class="vc-en">' + w.en + '</div></div>' +
        '<button class="vc-audio" title="Audio coming soon">♪</button>' +
      '</div>';
    }).join('');
    return '<div class="sheet">' +
      sheetHead(st, 'Vocabulary', st.title.simp) +
      '<div class="vocab-grid">' + cards + '</div>' +
      sheetFoot() +
    '</div>';
  }

  function placeholderSheet(st, label, file) {
    return '<div class="sheet">' +
      sheetHead(st, label, st.title.simp) +
      '<div class="sheet-placeholder">' +
        '<div class="door"><img src="' + DOOR + '" alt="" style="width:100%"></div>' +
        '<p style="font-family:var(--display);font-size:18px;color:var(--ink-soft);margin-bottom:8px;">' + label + ' — coming with launch</p>' +
        '<p style="font-size:13px;max-width:360px;margin:0 auto;">This sheet renders your authored content. Drop it in at<br><code>content/' + st.slug + '/' + file + '</code></p>' +
      '</div>' +
      sheetFoot() +
    '</div>';
  }

  function sidePanel(st) {
    return '<aside class="bundle-side">' +
      '<div class="card"><p class="eyebrow" style="margin-bottom:6px;">About this bundle</p>' +
        '<p style="font-size:13px;color:var(--ink-soft);line-height:1.55;">Printable pages made to pair with the audio episode (' + st.runtime + ').</p></div>' +
      '<div class="card"><p class="eyebrow" style="margin-bottom:8px;">Tips for grown-ups</p>' +
        '<ul style="list-style:none;display:grid;gap:8px;font-size:13px;color:var(--ink-soft);">' +
          '<li>1. Listen first, then open the bundle.</li>' +
          '<li>2. Recognition before perfect strokes.</li>' +
          '<li>3. Re-use the new words at dinner.</li>' +
        '</ul></div>' +
      '<div class="card"><p class="eyebrow" style="margin-bottom:8px;">The stories stay free</p>' +
        '<p style="font-size:13px;color:var(--ink-soft);line-height:1.55;">Bundles will move behind membership at launch — for now, they\'re open.</p></div>' +
    '</aside>';
  }

  function notFound(mount, msg) {
    mount.innerHTML = '<a class="read-back" href="library.html">‹ Back to the library</a>' +
      '<div class="card" style="text-align:center;padding:48px 28px;">' +
        '<div style="width:64px;margin:0 auto 16px;"><img src="' + DOOR + '" style="width:100%;opacity:.85" alt=""></div>' +
        '<h1 class="display" style="font-size:26px;margin-bottom:8px;">' + (msg || 'Bundle not found') + '</h1>' +
        '<a class="btn btn-primary" style="margin-top:14px;" href="library.html">Browse the library</a>' +
      '</div>';
  }

  function render(mount, st, vocab) {
    mount.innerHTML =
      '<a class="read-back" href="library.html">‹ Back to the library</a>' +
      '<div class="bundle-head">' +
        '<div>' +
          '<p style="margin-bottom:8px;"><span class="free-chip">★ Free for now</span></p>' +
          '<h1 class="display">' +
            '<span class="only-simp zh-simp">' + st.title.simp + '</span>' +
            '<span class="only-trad zh-trad">' + st.title.trad + '</span>' +
            '<span class="only-en">' + st.title.en + '</span>' +
            ' <span class="muted" style="font-size:.55em;">· activities</span>' +
          '</h1>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="b-print">⤓ Print this sheet</button>' +
      '</div>' +
      '<div class="tabs" id="b-tabs">' +
        TABS.map(function (t, i) { return '<button class="tab' + (i === 0 ? ' is-on' : '') + '" data-t="' + t.id + '">' + t.label + '</button>'; }).join('') +
      '</div>' +
      '<div class="sheet-grid"><div id="b-sheet"></div>' + sidePanel(st) + '</div>';

    var sheetMount = document.getElementById('b-sheet');
    function show(id) {
      if (id === 'vocab') sheetMount.innerHTML = vocabSheet(st, vocab);
      else if (id === 'worksheet') sheetMount.innerHTML = placeholderSheet(st, 'Worksheet', 'worksheet.html');
      else sheetMount.innerHTML = placeholderSheet(st, 'Cultural activity', 'activity.html');
      document.querySelectorAll('#b-tabs .tab').forEach(function (b) { b.classList.toggle('is-on', b.dataset.t === id); });
    }
    show('vocab');
    document.querySelectorAll('#b-tabs .tab').forEach(function (b) {
      b.addEventListener('click', function () { show(b.dataset.t); });
    });
    document.getElementById('b-print').addEventListener('click', function () { window.print(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('bundle-mount');
    var slug = qs('story');
    var st = (window.RDS_STORIES || []).filter(function (s) { return s.slug === slug; })[0];
    if (!st) { notFound(mount, 'Bundle not found'); return; }
    document.title = 'Round Door Studio · ' + st.title.en + ' — activities';
    fetch('content/' + slug + '/vocab.json')
      .then(function (r) { return r.ok ? r.json() : { vocab: [] }; })
      .then(function (d) { render(mount, st, d.vocab || []); })
      .catch(function () { render(mount, st, []); });
  });
})();
