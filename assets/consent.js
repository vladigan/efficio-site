/**
 * Efficio — cookie consent (shared, self-contained)
 * Drop-in:  <script src="/assets/consent.js" defer></script>
 *
 * Opt-in banner for analytics AND advertising tags. assets/pixels.js loads
 * nothing (no Google tag, no Meta Pixel, no LinkedIn Insight Tag) until the
 * visitor clicks Accept here. Decline, or no choice, means nothing loads.
 *
 * The choice is stored in localStorage "efficio_consent" = "granted" | "denied"
 * (every access wrapped in try/catch; if storage is blocked the choice lasts for
 * this page view only and the banner shows again next time).
 *
 * Any element with [data-cookie-settings] (the "Cookie settings" footer link)
 * reopens the banner so the visitor can change their choice. Switching from
 * Accept to Decline clears the tags' first-party cookies and reloads the page so
 * the running tags are gone.
 *
 * Public API: window.EfficioConsent.get() / .grant() / .deny() / .open()
 * Fires window event "efficio:consent" with detail "granted" | "denied".
 */
(function () {
  'use strict';
  if (window.EfficioConsent) return;                      /* never double-init */

  var KEY = 'efficio_consent';
  var LEGACY_KEY = 'efficio_cookie_ack';                  /* old notice-only banner; not consent */
  var memory = null;

  function stored() {
    try {
      var v = window.localStorage.getItem(KEY);
      return (v === 'granted' || v === 'denied') ? v : null;
    } catch (e) { return null; }
  }
  function get() { return stored() || memory; }
  function save(v) {
    memory = v;
    try {
      window.localStorage.setItem(KEY, v);
      window.localStorage.removeItem(LEGACY_KEY);
    } catch (e) {}
  }
  function announce(v) {
    var ev;
    try { ev = new CustomEvent('efficio:consent', { detail: v }); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('efficio:consent', false, false, v); }
    window.dispatchEvent(ev);
  }

  /* first-party cookies set by GA4, Google Ads, Meta Pixel and LinkedIn Insight */
  var TRACKING_COOKIE = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|li_|lidc|bcookie|bscookie|UserMatchHistory|AnalyticsSyncHistory)/;
  function clearTrackingCookies() {
    try {
      var host = window.location.hostname;
      var parts = host.split('.');
      var domains = ['', host];
      for (var i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (!name || !TRACKING_COOKIE.test(name)) return;
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      });
    } catch (e) {}
  }

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function injectStyles() {
    if (document.getElementById('efficio-cookie-css')) return;
    var st = document.createElement('style');
    st.id = 'efficio-cookie-css';
    st.textContent =
      '#efficio-cookie{position:fixed;bottom:18px;left:18px;z-index:130;width:min(440px,calc(100vw - 36px));' +
      'display:flex;flex-direction:column;gap:12px;padding:16px 18px;border-radius:16px;' +
      "font-family:'Plus Jakarta Sans',-apple-system,Inter,system-ui,sans-serif;" +
      'background:rgba(13,13,23,.94);-webkit-backdrop-filter:blur(20px) saturate(150%);backdrop-filter:blur(20px) saturate(150%);' +
      'border:1px solid rgba(255,255,255,.13);box-shadow:0 24px 60px -22px rgba(0,0,0,.85),0 0 0 1px rgba(124,77,255,.10);' +
      'opacity:0;transform:translateY(14px);transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}' +
      '#efficio-cookie.in{opacity:1;transform:none}' +
      '#efficio-cookie .ck-msg{font-size:13px;line-height:1.5;color:#c9c7da;font-weight:500;margin:0}' +
      '#efficio-cookie .ck-msg b{color:#fff;font-weight:700}' +
      '#efficio-cookie .ck-msg a{color:#b9a3ff;font-weight:600;text-decoration:underline}' +
      '#efficio-cookie .ck-now{font-size:12px;color:#a5a3b8;margin:0}' +
      '#efficio-cookie .ck-row{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap}' +
      '#efficio-cookie button{cursor:pointer;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:-.01em;' +
      'padding:9px 16px;border-radius:999px;min-height:44px;min-width:96px;transition:transform .12s ease,filter .2s ease,background .2s ease,border-color .2s ease}' +
      '#efficio-cookie button[data-action="deny"]{background:rgba(255,255,255,.06);color:#e6e4f2;border:1px solid rgba(255,255,255,.28)}' +
      '#efficio-cookie button[data-action="deny"]:hover{background:rgba(255,255,255,.12)}' +
      '#efficio-cookie button[data-action="grant"]{color:#fff;border:1px solid rgba(124,77,255,.6);' +
      'background:linear-gradient(180deg,#8a66ff,#5e2ee0);box-shadow:0 8px 20px -10px rgba(124,77,255,.85),inset 0 1px 0 rgba(255,255,255,.22)}' +
      '#efficio-cookie button[data-action="grant"]:hover{filter:brightness(1.07)}' +
      '#efficio-cookie button:active{transform:scale(.97)}' +
      '#efficio-cookie button:focus-visible{outline:2px solid #b9a3ff;outline-offset:2px}' +
      '@media(max-width:520px){#efficio-cookie{left:12px;bottom:12px;width:calc(100vw - 24px)}}' +
      (reduce ? '#efficio-cookie{transition:none}' : '');
    document.head.appendChild(st);
  }

  function close(ck) {
    ck.classList.remove('in');
    window.setTimeout(function () { if (ck.parentNode) ck.parentNode.removeChild(ck); }, reduce ? 0 : 400);
  }

  function show(opts) {
    opts = opts || {};
    var old = document.getElementById('efficio-cookie');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    injectStyles();

    var current = get();
    var ck = document.createElement('div');
    ck.id = 'efficio-cookie';
    ck.setAttribute('role', 'region');
    ck.setAttribute('aria-label', 'Cookie settings');
    ck.innerHTML =
      '<p class="ck-msg"><b>Analytics and advertising cookies.</b> If you accept, we load Google Analytics, ' +
      'the Meta Pixel and the LinkedIn Insight Tag to measure visits and whether our ads on Meta, Google and LinkedIn ' +
      'lead to booked calls. They set cookies and collect device, browsing and IP-derived data. ' +
      'If you decline, none of them load. <a href="/privacy.html#cookies">Privacy policy</a></p>' +
      (current ? '<p class="ck-now">Your current choice: ' + (current === 'granted' ? 'Accepted' : 'Declined') + '.</p>' : '') +
      '<div class="ck-row">' +
        '<button type="button" data-action="deny">Decline</button>' +
        '<button type="button" data-action="grant">Accept</button>' +
      '</div>';
    document.body.appendChild(ck);
    window.setTimeout(function () { ck.classList.add('in'); }, (reduce || opts.immediate) ? 0 : 600);
    if (opts.focus) {
      try { ck.querySelector('button[data-action="deny"]').focus(); } catch (e) {}
    }

    ck.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.getAttribute('data-action') === 'grant') grant(); else deny();
      close(ck);
    });
  }

  function grant() {
    save('granted');
    announce('granted');
  }

  function deny() {
    var was = get();
    save('denied');
    clearTrackingCookies();
    announce('denied');
    /* tags that already ran on this page can't be unloaded; reload so they're gone */
    if (was === 'granted' && (window.__efficioTagsLoaded || embedsLoaded)) {
      window.setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 150);
    }
  }

  /* ---- consent-gated embeds ----
     The GoHighLevel booking calendar loads Meta's tracking script inside its
     own iframe, so it is gated like our own tags:
       <iframe data-consent-src="https://api.leadconnectorhq.com/widget/booking/..."
               data-consent-ghl [data-consent-lazy] ...></iframe>
     Until the visitor accepts, a placeholder explains why and offers Accept or
     email. data-consent-lazy = don't load until the page calls
     EfficioConsent.showEmbed(iframe) (e.g. after a form step). */
  var embedsLoaded = false, ghlScript = false;
  function embedStyles() {
    if (document.getElementById('efficio-embed-css')) return;
    var st = document.createElement('style');
    st.id = 'efficio-embed-css';
    st.textContent =
      '.ck-embed{max-width:560px;margin:0 auto;padding:26px 20px;border-radius:14px;background:#fff;color:#1b1b29;' +
      'text-align:center;font-size:14px;line-height:1.55;border:1px solid rgba(0,0,0,.12)}' +
      '.ck-embed p{margin:0 0 14px;color:#1b1b29}' +
      '.ck-embed button{cursor:pointer;font:inherit;font-weight:700;font-size:14px;color:#fff;background:#5e2ee0;' +
      'border:0;border-radius:999px;padding:12px 20px;min-height:44px}' +
      '.ck-embed button:focus-visible{outline:2px solid #5e2ee0;outline-offset:3px}' +
      '.ck-embed .ck-alt{display:block;margin-top:12px;font-size:13px}' +
      '.ck-embed .ck-alt a{color:#4a22c4;font-weight:600}';
    document.head.appendChild(st);
  }
  function placeholderFor(fr) {
    var ph = fr.previousElementSibling;
    if (ph && ph.classList && ph.classList.contains('ck-embed')) return ph;
    embedStyles();
    ph = document.createElement('div');
    ph.className = 'ck-embed';
    ph.innerHTML =
      '<p>The booking calendar is hosted by GoHighLevel and loads Meta&rsquo;s tracking script inside it, ' +
      'so it only loads after you accept analytics and advertising cookies.</p>' +
      '<button type="button">Accept cookies and show the calendar</button>' +
      '<span class="ck-alt">Or email <a href="mailto:brady@efficio.tech?subject=Book%20a%20call">brady@efficio.tech</a> and we&rsquo;ll find a time.</span>';
    ph.querySelector('button').addEventListener('click', function () {
      var b = document.getElementById('efficio-cookie');
      grant();
      if (b) close(b);
    });
    fr.parentNode.insertBefore(ph, fr);
    return ph;
  }
  function loadEmbed(fr) {
    if (!fr.getAttribute('src')) {
      fr.setAttribute('src', fr.getAttribute('data-consent-src'));
      embedsLoaded = true;
      if (fr.hasAttribute('data-consent-ghl') && !ghlScript) {
        ghlScript = true;
        var s = document.createElement('script');
        s.src = 'https://link.msgsndr.com/js/form_embed.js'; s.async = true;
        document.body.appendChild(s);
      }
    }
    fr.style.display = '';
    var ph = fr.previousElementSibling;
    if (ph && ph.classList && ph.classList.contains('ck-embed')) ph.style.display = 'none';
  }
  function syncEmbed(fr) {
    if (fr.hasAttribute('data-consent-lazy')) return;
    if (get() === 'granted') { loadEmbed(fr); return; }
    fr.style.display = 'none';
    placeholderFor(fr).style.display = '';
  }
  function syncEmbeds() {
    var list = document.querySelectorAll('iframe[data-consent-src]');
    for (var i = 0; i < list.length; i++) syncEmbed(list[i]);
  }
  window.addEventListener('efficio:consent', function (e) { if (e.detail === 'granted') syncEmbeds(); });

  window.EfficioConsent = {
    get: get,
    grant: grant,
    deny: deny,
    open: function () { show({ immediate: true, focus: true }); },
    showEmbed: function (fr) {
      if (!fr) return;
      fr.removeAttribute('data-consent-lazy');
      syncEmbed(fr);
    }
  };

  /* "Cookie settings" links anywhere on the page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!a) return;
    e.preventDefault();
    window.EfficioConsent.open();
  });

  function init() {
    /* tags can rewrite a cookie while the page unloads, so clear again on every declined page view */
    if (get() === 'denied') clearTrackingCookies();
    syncEmbeds();
    if (!get()) show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
