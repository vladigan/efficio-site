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
 * The same Accept also gates the GoHighLevel chat widget (script[data-consent-chat]).
 * The GoHighLevel booking calendar (iframe[data-consent-src]) loads on its own
 * after Accept; without Accept the visitor can still load it (and only it) with
 * one explicit "Show available times" click, which does NOT grant consent and
 * never loads Google, Meta or LinkedIn tags on this site.
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
      /* Decline and Accept get the same visual weight */
      '#efficio-cookie button[data-action]{color:#fff;border:1px solid rgba(124,77,255,.6);' +
      'background:linear-gradient(180deg,#8a66ff,#5e2ee0);box-shadow:0 8px 20px -10px rgba(124,77,255,.85),inset 0 1px 0 rgba(255,255,255,.22)}' +
      '#efficio-cookie button[data-action]:hover{filter:brightness(1.07)}' +
      '#efficio-cookie button:active{transform:scale(.97)}' +
      '#efficio-cookie button:focus-visible{outline:2px solid #b9a3ff;outline-offset:2px}' +
      '@media(max-width:520px){#efficio-cookie{left:12px;bottom:12px;width:calc(100vw - 24px);gap:8px;padding:12px 14px}' +
      '#efficio-cookie .ck-row{flex-wrap:nowrap}#efficio-cookie button{flex:1 1 0;min-width:0}' +
      /* on a page with a booking calendar, keep the phone banner off the booking card */
      '#efficio-cookie.ck-top{top:12px;bottom:auto}}' +
      /* desktop: bottom-right, above the chat buttons, clear of the left-hand hero CTA */
      '@media(min-width:521px){#efficio-cookie{left:auto;right:18px;bottom:96px}}' +
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
    if (document.querySelector('iframe[data-consent-src]')) ck.className = 'ck-top';
    ck.setAttribute('role', 'region');
    ck.setAttribute('aria-label', 'Cookie settings');
    ck.innerHTML =
      '<p class="ck-msg"><b>Cookies:</b> we use analytics and ad cookies to measure visits. ' +
      '<a href="/privacy.html#cookies">Details</a></p>' +
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
    clearChatStorage();
    if (was === 'granted' && (window.__efficioTagsLoaded || embedsLoaded)) {
      window.setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 150);
    }
  }

  /* ---- consent-gated embeds ----
     The GoHighLevel booking calendar sets its own cookies and loads Meta's
     tracking script inside its own iframe, so it never loads silently:
       <iframe data-consent-src="https://api.leadconnectorhq.com/widget/booking/..."
               data-consent-ghl [data-consent-lazy] ...></iframe>
     After Accept it loads on its own (plus GHL's form_embed.js resizer).
     Otherwise a placeholder says who hosts it and offers a "Show available
     times" button. That click loads ONLY the iframe: it does not grant
     consent, and loads no Google/Meta/LinkedIn tag or GHL script on this page.
     data-consent-lazy = don't load until the page calls
     EfficioConsent.showEmbed(iframe) (e.g. after a form step). */
  var embedsLoaded = false, ghlScript = false;
  function embedStyles() {
    if (document.getElementById('efficio-embed-css')) return;
    var st = document.createElement('style');
    st.id = 'efficio-embed-css';
    st.textContent =
      '.ck-embed{max-width:560px;margin:0 auto;padding:26px 20px;border-radius:14px;background:#fff;color:#1b1b29;' +
      'text-align:center;font-size:14px;line-height:1.55;border:1px solid rgba(0,0,0,.12)}' +
      '.ck-embed h2{margin:0 0 8px;font-size:18px;font-weight:800;color:#1b1b29;letter-spacing:-.01em}' +
      '.ck-embed p{margin:0 0 14px;color:#1b1b29}' +
      '.ck-embed p a{color:#4a22c4;font-weight:600;text-decoration:underline}' +
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
      '<h2>Pick a time</h2>' +
      '<p>The scheduler is hosted by HighLevel and sets its own cookies, which may include advertising cookies. ' +
      '<a href="/privacy.html#cookies">Details</a></p>' +
      '<button type="button">Show available times</button>' +
      '<span class="ck-alt">Or email <a href="mailto:brady@efficio.tech?subject=Book%20a%20call">brady@efficio.tech</a> and we&rsquo;ll find a time.</span>';
    ph.querySelector('button').addEventListener('click', function () {
      /* explicit request for the calendar only: no consent change, no tags */
      loadEmbed(fr, { calendarOnly: true });
      try { fr.focus(); } catch (e) {}
    });
    fr.parentNode.insertBefore(ph, fr);
    return ph;
  }
  function loadEmbed(fr, opts) {
    var calendarOnly = !!(opts && opts.calendarOnly);
    if (!fr.getAttribute('src')) {
      /* without GHL's resizer script the iframe keeps its CSS height, so let it scroll */
      if (calendarOnly) {
        fr.setAttribute('scrolling', 'auto');
        try { if (window.matchMedia('(min-width: 561px)').matches) fr.style.height = '900px'; } catch (e) {}
      }
      fr.setAttribute('src', fr.getAttribute('data-consent-src'));
      embedsLoaded = true;
    }
    if (!calendarOnly) {
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

  /* ---- consent-gated GoHighLevel chat widget ----
     The GHL chat loader writes visitor and attribution identifiers to this
     site's localStorage and pulls GoHighLevel's scripts, so it is gated too.
     Pages carry an inert tag instead of the real loader:
       <script type="text/plain" data-consent-chat
               data-src="https://widgets.leadconnectorhq.com/loader.js"
               data-resources-url="..." data-widget-id="..."></script>
     Until the visitor accepts, a small "Chat (requires cookies)" button stands
     in for the bubble; clicking it explains why and offers Accept or email. */
  var chatLoaded = false, chatWanted = false;
  /* keys the GHL loader/widget write (seen 2026-09-24), plus LinkedIn's li_adsId */
  var CHAT_STORAGE = /^(lastExternalReferrer|v\d+_(contact_session|first_session_event|history|session_history)_|li_adsId$)|lead-conn?ec?ter|leadconnector|msgsndr/i;
  function clearChatStorage() {
    try {
      var ls = window.localStorage, kill = [];
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && CHAT_STORAGE.test(k)) kill.push(k); }
      kill.forEach(function (k) { ls.removeItem(k); });
    } catch (e) {}
  }
  function chatTags() { return document.querySelectorAll('script[data-consent-chat]'); }
  function chatStyles() {
    if (document.getElementById('efficio-chatgate-css')) return;
    var st = document.createElement('style');
    st.id = 'efficio-chatgate-css';
    st.textContent =
      '#efficio-chatgate{position:fixed;right:18px;bottom:18px;z-index:120;' +
      "font-family:'Plus Jakarta Sans',-apple-system,Inter,system-ui,sans-serif}" +
      '#efficio-chatgate .cg-btn{cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:#fff;' +
      'display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:999px;' +
      'border:1px solid rgba(124,77,255,.6);background:linear-gradient(180deg,#8a66ff,#5e2ee0);' +
      'box-shadow:0 10px 26px -12px rgba(124,77,255,.9)}' +
      '#efficio-chatgate .cg-btn svg{width:16px;height:16px;flex:none}' +
      '#efficio-chatgate button:focus-visible{outline:2px solid #b9a3ff;outline-offset:2px}' +
      '#efficio-chatgate .cg-pop{position:absolute;right:0;bottom:56px;width:min(320px,calc(100vw - 24px));' +
      'padding:16px;border-radius:14px;background:rgba(13,13,23,.97);border:1px solid rgba(255,255,255,.13);' +
      'box-shadow:0 24px 60px -22px rgba(0,0,0,.85);color:#c9c7da;font-size:13px;line-height:1.5}' +
      '#efficio-chatgate .cg-pop[hidden]{display:none}' +
      '#efficio-chatgate .cg-pop p{margin:0 0 12px}' +
      '#efficio-chatgate .cg-pop a{color:#b9a3ff;font-weight:600;text-decoration:underline}' +
      '#efficio-chatgate .cg-pop button{cursor:pointer;font:inherit;font-size:13px;font-weight:700;color:#fff;width:100%;' +
      'min-height:44px;border-radius:999px;border:1px solid rgba(124,77,255,.6);background:linear-gradient(180deg,#8a66ff,#5e2ee0)}' +
      '@media(max-width:520px){#efficio-chatgate{right:12px;bottom:12px}}';
    document.head.appendChild(st);
  }
  function removeChatGate() {
    var g = document.getElementById('efficio-chatgate');
    if (g && g.parentNode) g.parentNode.removeChild(g);
  }
  function showChatGate() {
    if (document.getElementById('efficio-chatgate')) return;
    chatStyles();
    var g = document.createElement('div');
    g.id = 'efficio-chatgate';
    g.innerHTML =
      '<div class="cg-pop" id="efficio-chatgate-pop" role="dialog" aria-label="Chat needs cookies" hidden>' +
        '<p>Our chat is run by GoHighLevel. It loads their scripts and stores visitor and attribution identifiers ' +
        'in your browser, so it only loads after you accept cookies. <a href="/privacy.html#cookies">Privacy policy</a></p>' +
        '<button type="button" data-cg="accept">Accept cookies and open chat</button>' +
        '<p style="margin:10px 0 0">Or email <a href="mailto:brady@efficio.tech">brady@efficio.tech</a>.</p>' +
      '</div>' +
      '<button type="button" class="cg-btn" aria-expanded="false" aria-controls="efficio-chatgate-pop">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
        'Chat (requires cookies)</button>';
    document.body.appendChild(g);
    var btn = g.querySelector('.cg-btn'), pop = g.querySelector('.cg-pop');
    btn.addEventListener('click', function () {
      var opening = pop.hasAttribute('hidden');
      if (opening) pop.removeAttribute('hidden'); else pop.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) { try { pop.querySelector('button').focus(); } catch (e) {} }
    });
    pop.querySelector('[data-cg="accept"]').addEventListener('click', function () {
      var b = document.getElementById('efficio-cookie');
      chatWanted = true;
      grant();
      if (b) close(b);
    });
  }
  function openChatWhenReady(tries) {
    try {
      var w = window.leadConnector && window.leadConnector.chatWidget;
      if (w && typeof w.openWidget === 'function') { w.openWidget(); return; }
    } catch (e) {}
    if (tries > 0) window.setTimeout(function () { openChatWhenReady(tries - 1); }, 500);
  }
  function loadChat() {
    var tags = chatTags();
    if (!tags.length) return;
    removeChatGate();
    if (!chatLoaded) {
      chatLoaded = true;
      embedsLoaded = true;
      for (var i = 0; i < tags.length; i++) {
        var t = tags[i], s = document.createElement('script');
        for (var j = 0; j < t.attributes.length; j++) {
          var a = t.attributes[j];
          if (a.name === 'type' || a.name === 'data-src' || a.name === 'data-consent-chat') continue;
          s.setAttribute(a.name, a.value);
        }
        s.src = t.getAttribute('data-src');
        t.parentNode.insertBefore(s, t.nextSibling);
      }
    }
    if (chatWanted) openChatWhenReady(20);
  }
  function syncChat() {
    if (!chatTags().length) return;
    if (get() === 'granted') loadChat(); else if (!chatLoaded) showChatGate();
  }
  window.addEventListener('efficio:consent', function (e) { if (e.detail === 'granted') loadChat(); });

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
    if (get() === 'denied') clearChatStorage();
    syncEmbeds();
    syncChat();
    if (!get()) show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
