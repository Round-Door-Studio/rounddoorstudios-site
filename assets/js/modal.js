/* ── Round Door Studio · Waitlist modal ──
   Injects a single waitlist overlay into the page and exposes
   window.openModal() / closeModal(). Any button can call openModal().
   MailerLite endpoint matches the original landing page. */
(function () {
  'use strict';

  var MODAL_HTML =
    '<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle" onclick="closeOnOverlay(event)">' +
      '<div class="modal">' +
        '<button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>' +
        '<div id="formPanel">' +
          '<h2 id="modalTitle">Don\'t miss the next story</h2>' +
          '<p class="sub">New bilingual stories, story packs, and cultural activities — straight to your inbox. Drop your email and we\'ll let you know the moment the next door opens.</p>' +
          '<form id="waitlistForm" action="https://assets.mailerlite.com/jsonp/2318264/forms/186598057362589116/subscribe" method="post">' +
            '<div class="field">' +
              '<label for="ml-email">Email Address</label>' +
              '<input type="email" id="ml-email" aria-label="email" aria-required="true" name="fields[email]" placeholder="you@example.com" autocomplete="email" required />' +
            '</div>' +
            '<input type="hidden" name="ml-submit" value="1">' +
            '<input type="hidden" name="anticsrf" value="true">' +
            '<button type="submit" class="btn-submit">Keep me posted</button>' +
          '</form>' +
        '</div>' +
        '<div class="success" id="successPanel">' +
          '<div class="success-icon">&#10003;</div>' +
          '<h3>You\'re on the list!</h3>' +
          '<p>We\'ll be in touch soon.<br>Keep an eye on your inbox.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  function ensureModal() {
    if (document.getElementById('overlay')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = MODAL_HTML;
    document.body.appendChild(wrap.firstChild);

    document.getElementById('waitlistForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var form = e.target;
      try {
        await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      } catch (_) {}
      document.getElementById('formPanel').style.display = 'none';
      document.getElementById('successPanel').style.display = 'block';
    });
  }

  window.openModal = function () {
    ensureModal();
    var overlay = document.getElementById('overlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var input = document.getElementById('ml-email');
      if (input) input.focus();
    }, 60);
  };

  window.closeModal = function () {
    var overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.closeOnOverlay = function (e) {
    if (e.target === document.getElementById('overlay')) window.closeModal();
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeModal();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureModal);
  } else {
    ensureModal();
  }
})();
