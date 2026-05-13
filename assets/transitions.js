/**
 * Efficio — seamless page transitions
 * Drop-in: <script src="/assets/transitions.js" defer></script>
 *
 * Behavior:
 *   - On load: body fades in (250ms)
 *   - On same-origin link click (excluding #anchors, target=_blank, download): fade out then navigate
 *   - On pageshow (back/forward cache): always show body
 *
 * Pure stdlib JS. No deps. <1KB.
 */
(function () {
  'use strict';
  var FADE_OUT_MS = 220;
  var FADE_IN_MS = 320;

  // initial fade-in (body starts at opacity 0 via inline style or CSS)
  var body = document.body;
  if (!body) return;
  body.style.transition = 'opacity ' + FADE_IN_MS + 'ms ease';
  requestAnimationFrame(function () {
    body.style.opacity = '1';
  });

  // back/forward cache safety
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      body.style.opacity = '1';
    }
  });

  // intercept internal links
  function isInternal(a) {
    if (!a || !a.href) return false;
    if (a.target === '_blank') return false;
    if (a.hasAttribute('download')) return false;
    if (a.getAttribute('href').indexOf('#') === 0) return false;  // pure anchor
    if (a.getAttribute('href').indexOf('mailto:') === 0) return false;
    if (a.getAttribute('href').indexOf('tel:') === 0) return false;
    try {
      var u = new URL(a.href);
      if (u.host !== window.location.host) return false;
      // Same-page anchor with full URL — skip
      if (u.pathname === window.location.pathname && u.hash) return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  document.addEventListener('click', function (e) {
    // bubble up through ancestors looking for anchor
    var t = e.target;
    while (t && t !== document) {
      if (t.tagName === 'A') break;
      t = t.parentNode;
    }
    if (!t || t.tagName !== 'A') return;
    if (!isInternal(t)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;  // modifier = let browser handle
    if (e.button !== 0) return;  // non-left-click

    e.preventDefault();
    var href = t.href;
    body.style.transition = 'opacity ' + FADE_OUT_MS + 'ms ease';
    body.style.opacity = '0';
    window.setTimeout(function () {
      window.location.href = href;
    }, FADE_OUT_MS);
  });
})();
