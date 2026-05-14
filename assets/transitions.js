/**
 * Efficio — seamless page transitions
 * Drop-in: <script src="/assets/transitions.js" defer></script>
 *
 * Safe-fail design: if anything in this script errors out, pages are still
 * visible by default. .rv reveals only hide when html.js class is present
 * (set below). Body fade-in only applies after script confirms it ran.
 */
(function () {
  'use strict';
  // Mark JS-capable immediately — gates the .rv reveal pattern in CSS
  try { document.documentElement.classList.add('js'); } catch(e){}

  var FADE_OUT_MS = 220;
  var FADE_IN_MS = 320;

  // initial fade-in (set opacity 0 dynamically, then fade up — safe-fail: if this
  // script doesn't run for any reason, page is visible by default)
  var body = document.body;
  if (!body) return;
  body.style.opacity = '0';
  body.style.transition = 'opacity ' + FADE_IN_MS + 'ms ease';
  requestAnimationFrame(function () {
    body.style.opacity = '1';
  });

  // SAFETY NET: if IntersectionObserver fails for any reason, force all .rv
  // elements to .vis after 800ms so the page is never stuck invisible.
  window.setTimeout(function () {
    try {
      var rvs = document.querySelectorAll('.rv:not(.vis)');
      for (var i = 0; i < rvs.length; i++) rvs[i].classList.add('vis');
    } catch (e) {}
  }, 800);

  // STICKY MOBILE CTA — auto-inject on every page that loads transitions.js.
  // Mobile-only via CSS (display:none above 720px). One tap away from booking.
  try {
    if (!document.getElementById('efficio-sticky-cta')) {
      var stickyHref = (window.location.pathname.indexOf('/qualify') !== -1 ||
                        window.location.pathname.indexOf('/audit-quiz') !== -1 ||
                        window.location.pathname.indexOf('/vsl') !== -1 ||
                        window.location.pathname.indexOf('/thank-you') !== -1)
        ? 'https://calendly.com/brady-bngcent/efficio-strategy-call'
        : '/qualify.html';
      var stickyLabel = stickyHref.indexOf('calendly') !== -1
        ? 'Book a 15-min call'
        : 'See if you qualify';
      var sticky = document.createElement('a');
      sticky.id = 'efficio-sticky-cta';
      sticky.href = stickyHref;
      if (stickyHref.indexOf('calendly') !== -1) {
        sticky.target = '_blank';
        sticky.rel = 'noopener';
      }
      sticky.innerHTML = '<span class="label"><span class="label-dot"></span>' + stickyLabel + '</span><span class="arrow">→</span>';
      body.appendChild(sticky);
      // Slide in after 600ms so it doesn't compete with hero
      window.setTimeout(function(){ sticky.classList.add('in'); }, 600);
    }
  } catch (e) {}

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
