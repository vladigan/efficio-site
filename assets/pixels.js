/* ============================================================
   Efficio — conversion tracking (shared across the funnel)
   Drop-in:  <script src="/assets/pixels.js"></script>  (in <head>)

   ONE place to manage tracking. Replace the placeholder IDs below
   with real values from each ad platform. The script is gated:
   any value containing "_PLACEHOLDER", "REPLACE_ME", or "XXXX"
   stays fully dormant — no network requests, no console errors.

   ===========================================================
   PLACEHOLDER SWAP LIST  (find/replace these 7 strings once)
   ===========================================================
     META_PIXEL_ID_PLACEHOLDER          (Meta Events Manager -> 15-16 digits)
     GA4_MEASUREMENT_ID_PLACEHOLDER     (GA4 -> Data Streams -> "G-..." )    [already LIVE - see note]
     GADS_CONVERSION_ID_PLACEHOLDER     (Google Ads -> Goals -> Conversions -> "AW-...")
     GADS_CONVERSION_LABEL_PLACEHOLDER  (Google Ads -> same screen -> per-action label)
     LI_PARTNER_ID_PLACEHOLDER          (LinkedIn Campaign Manager -> Insight Tag -> partner ID)
     LI_QUALIFIER_CONVERSION_ID_PLACEHOLDER  (LinkedIn -> Conversions -> ID for qualifier-completed)
     LI_BOOKING_CONVERSION_ID_PLACEHOLDER    (LinkedIn -> Conversions -> ID for booking-completed)
   ===========================================================

   NOTE: ga4 was already LIVE on this site as "G-62FVTS6S1Z"
   before phase-2 wiring. Preserved here so existing measurement
   stays intact. If you want to swap GA4 to the placeholder gate
   too, replace the live value with GA4_MEASUREMENT_ID_PLACEHOLDER.

   Fire conversions from page code:
     window.efficioTrackQualifierStart({...})    // qualifier opened/first option click
     window.efficioTrackQualifierComplete({...}) // qualifier finished (last step)
     window.efficioTrackBooking({...})           // call booked (GHL booking widget)

   The GHL / LeadConnector booking widget auto-fires efficioTrackBooking on
   its booking-success postMessage — no per-page wiring needed. See the
   booking-success listener at the bottom of this file.

   Legacy aliases retained for backward compatibility:
     window.sendConversion()        = efficioTrackQualifierComplete
     window.efficioTrackLead()      = efficioTrackQualifierComplete
   ============================================================ */
window.EFFICIO_PIXELS = {
  ga4:             "G-62FVTS6S1Z",                        /* LIVE - keep unless intentionally swapping */
  googleAds:       "GADS_CONVERSION_ID_PLACEHOLDER",      /* "AW-1234567890"  */
  googleAdsLabel:  "GADS_CONVERSION_LABEL_PLACEHOLDER",   /* per-action label */
  metaPixel:       "META_PIXEL_ID_PLACEHOLDER",           /* 15-16 digit Meta Pixel ID */
  linkedinPartner: "LI_PARTNER_ID_PLACEHOLDER",
  linkedinConv:    "LI_QUALIFIER_CONVERSION_ID_PLACEHOLDER",  /* fired on qualifier complete */
  linkedinBookConv:"LI_BOOKING_CONVERSION_ID_PLACEHOLDER",    /* fired on booking complete  */
  tiktokPixel:     "REPLACE_ME_TIKTOK_PIXEL_ID",
  snapPixel:       "REPLACE_ME_SNAP_PIXEL_ID"
};
(function () {
  var P = window.EFFICIO_PIXELS;
  function ok(v) {
    if (!v || typeof v !== "string") return false;
    if (v.indexOf("_PLACEHOLDER") !== -1) return false;
    if (v.indexOf("REPLACE_ME")  !== -1) return false;
    if (v.indexOf("XXXX")        !== -1) return false;
    if (v === "CONVERSION_LABEL") return false;
    return true;
  }
  window._pxOk = ok;

  /* ---- pull UTM params from URL so every conversion fire is attributed ---- */
  function captureUtms() {
    var out = {}, q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return out; }
    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","eff_variant","gclid","fbclid","li_fat_id"].forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = v;
    });
    return out;
  }
  (function persistUtms(){
    var snap = captureUtms();
    if (Object.keys(snap).length === 0) return;
    try { sessionStorage.setItem("efficio_utms", JSON.stringify(snap)); } catch (e) {}
  })();
  function getUtms() {
    var fromUrl = captureUtms();
    if (Object.keys(fromUrl).length) return fromUrl;
    try { return JSON.parse(sessionStorage.getItem("efficio_utms") || "{}"); } catch (e) { return {}; }
  }
  window._pxUtms = getUtms;

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

/* ============================================================
   UNIFIED CONVERSION HELPERS — fire only to pixels that loaded
   ============================================================ */

/* === STAGE 1: qualifier STARTED (first option click on audit-quiz) === */
window.efficioTrackQualifierStart = function (meta) {
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  if (window.__efQualifierStarted) return; window.__efQualifierStarted = true;
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'qualifier_started', meta); } catch (e) {}
  try { if (window.fbq)  fbq('track', 'Lead', meta); } catch (e) {}
  try { if (window.ttq)  ttq.track('ClickButton', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'START_TRIAL', meta); } catch (e) {}
};

/* === STAGE 2: qualifier COMPLETED (last step / email captured) === */
window.efficioTrackQualifierComplete = function (meta) {
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'qualifier_completed', meta); } catch (e) {}
  try { if (window.gtag) gtag('event', 'generate_lead',       meta); } catch (e) {}
  try {
    if (window.gtag && ok(P.googleAds) && ok(P.googleAdsLabel))
      gtag('event', 'conversion', { send_to: P.googleAds + '/' + P.googleAdsLabel });
  } catch (e) {}
  try { if (window.fbq) fbq('track', 'CompleteRegistration', meta); } catch (e) {}
  try { if (window.lintrk && ok(P.linkedinConv)) lintrk('track', { conversion_id: P.linkedinConv }); } catch (e) {}
  try { if (window.ttq) ttq.track('SubmitForm', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'SIGN_UP', meta); } catch (e) {}
};

/* === STAGE 3: call BOOKED (GHL booking widget) === */
window.efficioTrackBooking = function (meta) {
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'calendly_booking_completed', meta); } catch (e) {}
  try { if (window.gtag) gtag('event', 'book_call',                  meta); } catch (e) {}
  try {
    if (window.gtag && ok(P.googleAds) && ok(P.googleAdsLabel))
      gtag('event', 'conversion', { send_to: P.googleAds + '/' + P.googleAdsLabel });
  } catch (e) {}
  try { if (window.fbq) fbq('track', 'Schedule', meta); } catch (e) {}
  try { if (window.lintrk && ok(P.linkedinBookConv)) lintrk('track', { conversion_id: P.linkedinBookConv }); } catch (e) {}
  try { if (window.ttq) ttq.track('CompleteRegistration', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'SIGN_UP', meta); } catch (e) {}
};

/* Legacy aliases — keep existing audit-quiz.html / qualify.html calls working */
window.efficioTrackLead = window.efficioTrackQualifierComplete;
window.sendConversion   = window.efficioTrackQualifierComplete;

/* GHL (LeadConnector) booking widget -> booking conversion (auto-wired everywhere pixels.js loads) */
window.EFFICIO_WORKER = window.EFFICIO_WORKER || 'https://efficio-chat.bgay3500.workers.dev';

/* Server-side booking record: a client-side pixel alone left bookings.jsonl empty
   (no producer for the post-booking daemon). On every booking we also
   POST a durable beacon to the Worker /booking endpoint. Best-effort: never blocks
   the conversion pixel. The Worker also accepts a booking webhook (GHL/LeadConnector)
   on the same endpoint for full invitee PII — this beacon is the always-on safety net. */
window.efficioRecordBooking = function (meta) {
  try {
    var s = window._auditState || {};
    var payload = {
      source: (location.pathname || 'site'),
      page: (location.pathname || 'site'),
      email: s.email || (meta && meta.email) || '',
      tier: s.tier || '',
      vertical: s.vertical || '',
      utms: (window._pxUtms ? window._pxUtms() : {}),
      ts: new Date().toISOString()
    };
    fetch(window.EFFICIO_WORKER + '/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {});
  } catch (err) {}
};

/* === Booking-success listener ============================================
   The booking calendar is now GHL / LeadConnector's embedded widget
   (api.leadconnectorhq.com/widget/booking/...), loaded via its form_embed.js.
   GHL does NOT emit Calendly's `calendly.event_scheduled` event. On a completed
   booking the widget posts a window message FROM the leadconnectorhq iframe.
   The success payload is most commonly the ARRAY form:
        ['msgsndr-booking-complete', { calendarId: '...' }]
   sent with origin https://api.leadconnectorhq.com (sometimes link.msgsndr.com).
   We match that robustly, plus a few object-shaped variants GHL has used, and
   still honour Calendly's old event as a harmless fallback.

   >>> CONFIRM ON THE LIVE PAGE: open the booking page, paste this in the console
       window.addEventListener('message',function(ev){console.log(ev.origin,ev.data)})
       then complete a test booking and verify the exact origin + payload below
       match what fires. If GHL changes the string, update GHL_BOOKING_MATCH. <<<
   ======================================================================== */
window.EFFICIO_BOOKING_ORIGIN_RE = /(^|\.)leadconnectorhq\.com$|(^|\.)msgsndr\.com$/i;

/* Returns true if a postMessage payload looks like a GHL booking success. */
function efficioIsGhlBooking(d) {
  if (!d) return false;
  // Array form: ['msgsndr-booking-complete', {calendarId}]
  if (Array.isArray(d)) {
    return typeof d[0] === 'string' && /booking-?complete|appointment[-_ ]?booked/i.test(d[0]);
  }
  // String form: 'msgsndr-booking-complete'
  if (typeof d === 'string') {
    return /booking-?complete|appointment[-_ ]?booked/i.test(d);
  }
  // Object form: {type|event|page|action: '...booked/booking complete...'}
  if (typeof d === 'object') {
    var keys = ['type', 'event', 'eventName', 'page', 'action', 'name'];
    for (var i = 0; i < keys.length; i++) {
      var v = d[keys[i]];
      if (typeof v === 'string' && /booking-?complete|appointment[-_ ]?booked|booking_completed/i.test(v)) {
        return true;
      }
    }
  }
  return false;
}

window.addEventListener('message', function (e) {
  try {
    var origin = (e && e.origin) || '';
    var d = e && e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) {} }

    // Calendly fallback (legacy; embed retired but harmless to keep)
    var isCalendly = d && d.event === 'calendly.event_scheduled';

    // GHL / LeadConnector booking success — only trust messages from the widget origin
    var isGhl = false;
    try {
      var host = origin ? new URL(origin).hostname : '';
      isGhl = window.EFFICIO_BOOKING_ORIGIN_RE.test(host) && efficioIsGhlBooking(d);
    } catch (_) {
      // If origin can't be parsed, still accept an unambiguous GHL payload shape
      isGhl = efficioIsGhlBooking(d);
    }

    if (isGhl || isCalendly) {
      window.efficioTrackBooking({ source: (location.pathname || 'site') });
      window.efficioRecordBooking({ source: (location.pathname || 'site') });
    }
  } catch (err) {}
});
