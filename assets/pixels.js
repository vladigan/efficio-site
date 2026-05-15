/* ============================================================
   Efficio — conversion tracking (shared across the funnel)
   Drop-in:  <script src="/assets/pixels.js"></script>  (in <head>)

   ONE place to manage tracking. Paste real IDs into EFFICIO_PIXELS
   below. Each pixel loads ONLY when its ID is real — placeholders
   stay fully dormant: no network requests, no console errors.

   Where to get each ID:
     googleAds  — Google Ads ▸ Goals ▸ Conversions ▸ tag setup
                  ("AW-..." conversion ID + a per-action label)
     metaPixel  — Meta Events Manager ▸ Data Sources (15-16 digits)
     tiktok / snap / linkedin — only if you actually run those ads.

   Fire conversions from page code:
     window.efficioTrackLead({...})     // lead captured (audit / qualify)
     window.efficioTrackBooking({...})  // call booked
   A Calendly inline embed auto-fires efficioTrackBooking on
   `calendly.event_scheduled` — no per-page wiring needed.
   ============================================================ */
window.EFFICIO_PIXELS = {
  ga4:             "G-62FVTS6S1Z",                  /* LIVE — Google Analytics 4 */
  googleAds:       "AW-XXXXXXXXXX",                 /* Google Ads conversion ID  */
  googleAdsLabel:  "CONVERSION_LABEL",              /* Google Ads conversion label */
  metaPixel:       "REPLACE_ME_META_PIXEL_ID",      /* Meta (Facebook) Pixel ID  */
  linkedinPartner: "REPLACE_ME_LINKEDIN_PARTNER_ID",
  linkedinConv:    "REPLACE_ME_LINKEDIN_CONVERSION_ID",
  tiktokPixel:     "REPLACE_ME_TIKTOK_PIXEL_ID",
  snapPixel:       "REPLACE_ME_SNAP_PIXEL_ID"
};
(function () {
  var P = window.EFFICIO_PIXELS;
  /* a value counts as "real" only if it's set and carries no placeholder marker */
  function ok(v) {
    return !!v && v.indexOf("REPLACE_ME") === -1
      && v.indexOf("XXXX") === -1 && v !== "CONVERSION_LABEL";
  }
  window._pxOk = ok;

  /* ---- Google: GA4 + Google Ads share one gtag loader ---- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  var gId = ok(P.ga4) ? P.ga4 : (ok(P.googleAds) ? P.googleAds : null);
  if (gId) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + gId;
    document.head.appendChild(g);
    gtag("js", new Date());
    if (ok(P.ga4))       gtag("config", P.ga4);
    if (ok(P.googleAds)) gtag("config", P.googleAds);
  }

  /* ---- Meta Pixel ---- */
  if (ok(P.metaPixel)) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', P.metaPixel); fbq('track', 'PageView');
  }

  /* ---- LinkedIn Insight Tag ---- */
  if (ok(P.linkedinPartner)) {
    window._linkedin_partner_id = P.linkedinPartner;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(P.linkedinPartner);
    (function (l) {
      if (!l) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = []; }
      var s = document.getElementsByTagName("script")[0];
      var b = document.createElement("script");
      b.type = "text/javascript"; b.async = true;
      b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  }

  /* ---- TikTok Pixel ---- */
  if (ok(P.tiktokPixel)) {
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"], ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e }, ttq.load = function (e, n) { var r = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; n = d.createElement("script"); n.type = "text/javascript", n.async = !0, n.src = r + "?sdkid=" + e + "&lib=" + t; e = d.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e) };
      ttq.load(P.tiktokPixel); ttq.page();
    }(window, document, 'ttq');
  }

  /* ---- Snap Pixel ---- */
  if (ok(P.snapPixel)) {
    (function (e, t, n) {
      if (e.snaptr) return; var a = e.snaptr = function () {
        a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments)
      };
      a.queue = []; var s = 'script', r = t.createElement(s); r.async = !0; r.src = n;
      var u = t.getElementsByTagName(s)[0]; u.parentNode.insertBefore(r, u);
    })(window, document, 'https://sc-static.net/scevent.min.js');
    snaptr('init', P.snapPixel); snaptr('track', 'PAGE_VIEW');
  }
})();

/* ---- Unified conversion helpers — fire only to pixels that loaded ---- */
window.efficioTrackLead = function (meta) {
  meta = meta || {};
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'generate_lead', meta); } catch (e) {}
  try {
    if (window.gtag && ok(P.googleAds) && ok(P.googleAdsLabel))
      gtag('event', 'conversion', { send_to: P.googleAds + '/' + P.googleAdsLabel });
  } catch (e) {}
  try { if (window.fbq) fbq('track', 'Lead', meta); } catch (e) {}
  try { if (window.lintrk && ok(P.linkedinConv)) lintrk('track', { conversion_id: P.linkedinConv }); } catch (e) {}
  try { if (window.ttq) ttq.track('SubmitForm', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'SIGN_UP', meta); } catch (e) {}
};
window.efficioTrackBooking = function (meta) {
  meta = meta || {};
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'book_call', meta); } catch (e) {}
  try {
    if (window.gtag && ok(P.googleAds) && ok(P.googleAdsLabel))
      gtag('event', 'conversion', { send_to: P.googleAds + '/' + P.googleAdsLabel });
  } catch (e) {}
  try { if (window.fbq) fbq('track', 'CompleteRegistration', meta); } catch (e) {}
  try { if (window.lintrk && ok(P.linkedinConv)) lintrk('track', { conversion_id: P.linkedinConv }); } catch (e) {}
  try { if (window.ttq) ttq.track('CompleteRegistration', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'SIGN_UP', meta); } catch (e) {}
};
/* legacy alias — older quiz code calls sendConversion() */
window.sendConversion = window.efficioTrackLead;
/* Calendly inline embed -> booking conversion (works on any page that loads this) */
window.addEventListener('message', function (e) {
  try {
    var d = e && e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) {} }
    if (d && d.event === 'calendly.event_scheduled')
      window.efficioTrackBooking({ source: (location.pathname || 'site') });
  } catch (err) {}
});
