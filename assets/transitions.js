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
  // BELT + SUSPENDERS: if anything stalls, force body visible at multiple
  // checkpoints. Eliminates the "click pricing → blank screen" failure mode
  // where a destination page kept body at opacity 0.
  function forceVisible() { try { body.style.opacity = '1'; } catch(e){} }
  window.setTimeout(forceVisible, 60);
  window.setTimeout(forceVisible, 400);
  window.setTimeout(forceVisible, 1200);
  document.addEventListener('DOMContentLoaded', forceVisible);
  window.addEventListener('load', forceVisible);

  // SAFETY NET: if IntersectionObserver fails for any reason, force all .rv
  // elements to .vis after 800ms so the page is never stuck invisible.
  window.setTimeout(function () {
    try {
      var rvs = document.querySelectorAll('.rv:not(.vis)');
      for (var i = 0; i < rvs.length; i++) rvs[i].classList.add('vis');
    } catch (e) {}
  }, 800);

  // COOKIE CONSENT — first-visit only, minimal disclosure with localStorage memory.
  try {
    if (!window.localStorage.getItem('efficio_cookie_ack') && !document.getElementById('efficio-cookie')) {
      var ck = document.createElement('div');
      ck.id = 'efficio-cookie';
      ck.innerHTML = '<div class="ck-msg">We use cookies to measure how the site performs and improve it. See our <a href="/privacy.html">privacy policy</a>.</div><div class="ck-row"><button type="button" data-action="reject">Decline</button><button type="button" data-action="accept" class="primary">Got it</button></div>';
      body.appendChild(ck);
      window.setTimeout(function(){ ck.classList.add('in'); }, 1100);
      ck.addEventListener('click', function(e){
        var btn = e.target.closest('button[data-action]');
        if (!btn) return;
        try { window.localStorage.setItem('efficio_cookie_ack', btn.dataset.action); } catch(err){}
        ck.classList.remove('in');
        window.setTimeout(function(){ if (ck.parentNode) ck.parentNode.removeChild(ck); }, 400);
      });
    }
  } catch (e) {}

  // STICKY MOBILE CTA — auto-inject on every page that loads transitions.js.
  // Mobile-only via CSS (display:none above 720px). One tap away from booking.
  try {
    if (!document.getElementById('efficio-sticky-cta')) {
      var stickyHref = 'https://go.efficio.tech/';
      var stickyLabel = 'Get started';
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

  // Fade-out-on-click navigation removed 2026-05-15 — it caused intermittent
  // "click pricing → blank screen" failures when a destination page kept the
  // body at opacity 0. Internal links now navigate the browser-native way.

  // If a navigation is aborted (back button, ESC, failed load), pageshow restores opacity.
  window.addEventListener('pageshow', function () {
    body.style.opacity = '1';
  });

  // SITE-WIDE MOTION — magnetic CTAs + subtle 3D card tilt.
  // Fully guarded: fine-pointer only, respects reduced-motion, try/catch wrapped.
  try {
    var fine = window.matchMedia('(pointer: fine)').matches;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fine && !reduce) {
      // Magnetic CTAs
      var ctas = document.querySelectorAll('.btn-primary,.btn-outline,.btn-big,.btn-nav,.btn-cta');
      ctas.forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var mx = (e.clientX - r.left - r.width / 2) * 0.2;
          var my = (e.clientY - r.top - r.height / 2) * 0.34;
          el.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
      // Subtle 3D tilt on cards
      var cards = document.querySelectorAll('.card');
      cards.forEach(function (card) {
        var raf = null;
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(function () {
            card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
          });
        });
        card.addEventListener('mouseleave', function () {
          if (raf) cancelAnimationFrame(raf);
          card.style.transform = '';
        });
      });
    }
  } catch (e) {}
})();
