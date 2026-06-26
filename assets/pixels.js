/* ============================================================
   Efficio — conversion tracking (shared across the funnel)
   Drop-in:  <script src="/assets/pixels.js"></script>  (in <head>)

   ONE place to manage tracking. The whole script is GATED: any ID
   left empty — or still holding a "_PLACEHOLDER" / "REPLACE_ME" /
   "XXXX" value — stays fully dormant. No network requests, no fbq,
   no gtag config, no console errors. Fill an ID in and only that
   platform activates. Safe to ship with everything blank.

   ============================================================
   META PIXEL — THE ONE SPOT TO PASTE BRADY'S ID
   ============================================================
   Create the Pixel in Meta Events Manager, copy the 15-16 digit ID,
   and drop it into META_PIXEL_ID below. That single edit activates:
     • PageView   — every page load, site-wide
     • Lead       — find-your-tier quiz reaches a tier result
     • Schedule   — booking confirmed (thank-you.html / GHL widget)
   Leave it "" and the Meta Pixel never loads or fires.
   ============================================================ */

// Paste your Meta Pixel ID here (from Meta Events Manager) to activate tracking.
var META_PIXEL_ID = "2869849396696487";

/* ===========================================================
   OTHER AD PLATFORMS — placeholder swap list (find/replace once)
   ===========================================================
     GA4_MEASUREMENT_ID                 (already LIVE as "G-62FVTS6S1Z" — see note)
     GADS_CONVERSION_ID_PLACEHOLDER     (Google Ads -> Goals -> Conversions -> "AW-...")
     GADS_CONVERSION_LABEL_PLACEHOLDER  (Google Ads -> same screen -> per-action label)
     LI_PARTNER_ID_PLACEHOLDER          (LinkedIn Campaign Manager -> Insight Tag -> partner ID)
     LI_QUALIFIER_CONVERSION_ID_PLACEHOLDER  (LinkedIn -> Conversions -> qualifier-completed)
     LI_BOOKING_CONVERSION_ID_PLACEHOLDER    (LinkedIn -> Conversions -> booking-completed)

   NOTE: ga4 was already LIVE on this site as "G-62FVTS6S1Z" before
   phase-2 wiring. Preserved here so existing measurement stays intact.

   Fire conversions from page code (all no-ops until the ID is set):
     window.efficioTrackQuizLead({...})    // find-your-tier result -> Meta "Lead"
     window.efficioTrackBooking({...})     // booking confirmed      -> Meta "Schedule"
   A page-load Meta "PageView" fires automatically once META_PIXEL_ID is set.

   Legacy aliases retained for backward compatibility:
     window.sendConversion()        = efficioTrackQualifierComplete
     window.efficioTrackLead()      = efficioTrackQualifierComplete
   ============================================================ */
window.EFFICIO_PIXELS = {
  ga4:             "G-62FVTS6S1Z",                        /* LIVE - keep unless intentionally swapping */
  googleAds:       "GADS_CONVERSION_ID_PLACEHOLDER",      /* "AW-1234567890"  */
  googleAdsLabel:  "GADS_CONVERSION_LABEL_PLACEHOLDER",   /* per-action label */
  metaPixel:       META_PIXEL_ID,                         /* <-- set META_PIXEL_ID above; "" = dormant */
  linkedinPartner: "LI_PARTNER_ID_PLACEHOLDER",
  linkedinConv:    "LI_QUALIFIER_CONVERSION_ID_PLACEHOLDER",  /* fired on qualifier complete */
  linkedinBookConv:"LI_BOOKING_CONVERSION_ID_PLACEHOLDER",    /* fired on booking            */
  tiktokPixel:     "REPLACE_ME_TIKTOK_PIXEL_ID",
  snapPixel:       "REPLACE_ME_SNAP_PIXEL_ID"
};
(function () {
  var P = window.EFFICIO_PIXELS;
  function ok(v) {
    if (!v || typeof v !== "string") return false;          /* "" / undefined -> dormant */
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

  /* ---- Meta Pixel ---- gated by META_PIXEL_ID; "" -> never loads, fires PageView when set */
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
   (every call is wrapped in try/catch and guarded by window.<sdk>,
    so all of these are no-ops while META_PIXEL_ID and the other
    IDs are blank — nothing throws, nothing fires.)

   FUTURE — server-side Conversions API (CAPI) — NOT built this pass.
   Because every conversion funnels through these helpers, a server
   relay can be bolted on in ONE place later: POST { event, event_id,
   ...params } to the Cloudflare Worker `efficio-chat`, which would
   call Meta's Graph API with the CAPI access token and dedupe against
   the browser pixel via a shared event_id. Client pixel only for now.
   ============================================================ */

/* === find-your-tier QUIZ RESULT — a recommended tier is on screen ===
   This is the funnel's lead-capture moment. Fires Meta standard "Lead"
   (the event the quiz should optimize toward) plus the matching lead
   signal on every other live platform. Once-guarded so a quiz retake in
   the same session does not double-count. No PII in params — only the
   non-identifying tier key (e.g. "team"). */
window.efficioTrackQuizLead = function (meta) {
  if (window.__efQuizLead) return; window.__efQuizLead = true;
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.fbq)  fbq('track', 'Lead', meta); } catch (e) {}                  /* <-- Meta standard Lead */
  try { if (window.gtag) gtag('event', 'generate_lead',      meta); } catch (e) {}
  try { if (window.gtag) gtag('event', 'qualifier_completed', meta); } catch (e) {}
  try {
    if (window.gtag && ok(P.googleAds) && ok(P.googleAdsLabel))
      gtag('event', 'conversion', { send_to: P.googleAds + '/' + P.googleAdsLabel });
  } catch (e) {}
  try { if (window.lintrk && ok(P.linkedinConv)) lintrk('track', { conversion_id: P.linkedinConv }); } catch (e) {}
  try { if (window.ttq) ttq.track('SubmitForm', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'SIGN_UP', meta); } catch (e) {}
};

/* === STAGE 1 (optional, not currently wired): qualifier STARTED ===
   NOTE: Meta "Lead" intentionally does NOT fire here. On this funnel a
   Lead = a completed quiz result (see efficioTrackQuizLead above), so
   Meta stays out of the "started" stage to avoid double-counting. Other
   platforms keep their top-of-funnel signal. */
window.efficioTrackQualifierStart = function (meta) {
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  if (window.__efQualifierStarted) return; window.__efQualifierStarted = true;
  var P = window.EFFICIO_PIXELS, ok = window._pxOk || function () { return false; };
  try { if (window.gtag) gtag('event', 'qualifier_started', meta); } catch (e) {}
  try { if (window.ttq)  ttq.track('ClickButton', meta); } catch (e) {}
  try { if (window.snaptr) snaptr('track', 'START_TRIAL', meta); } catch (e) {}
};

/* === STAGE 2: qualifier COMPLETED (e.g. onboarding form submitted) ===
   Kept on Meta "CompleteRegistration" for the post-booking onboarding
   form (onboarding.html). The public fit-quiz uses efficioTrackQuizLead
   above; this stays as-is so existing onboarding tracking is unchanged. */
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

/* === Booking CONFIRMED — Meta "Schedule" ===
   Fires on the post-booking redirect (thank-you.html) and, best-effort,
   on a GHL widget "booked" postMessage. Deduped via __efBooked so the two
   paths can never double-count within a page. */
window.efficioTrackBooking = function (meta) {
  if (window.__efBooked) return; window.__efBooked = true;
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

/* Legacy aliases — keep existing onboarding.html / qualify.html calls working */
window.efficioTrackLead = window.efficioTrackQualifierComplete;
window.sendConversion   = window.efficioTrackQualifierComplete;

/* ---- Booking widget -> Schedule (auto-wired everywhere pixels.js loads) ----

   The on-site booking (book.html) is a GoHighLevel / LeadConnector calendar
   iframe (api.leadconnectorhq.com/widget/booking/..., loaded via
   link.msgsndr.com/js/form_embed.js).

   RELIABLE hook (recommended): set the GHL calendar's post-booking redirect
   to https://efficio.tech/thank-you.html — that page loads pixels.js and
   fires efficioTrackBooking() on load. This is the source of truth for
   Schedule. (efficioTrackBooking is deduped, so it can't double-fire.)

   BEST-EFFORT hook (below): GHL does not expose a stable, documented
   "appointment booked" postMessage, so this listener is intentionally
   conservative — it only acts on messages from the GHL widget origins and
   only when the payload clearly signals a completed booking. If GHL never
   posts such a message, nothing fires here and the redirect above carries it.

   The legacy Calendly listener is retained harmlessly for any old embed. */
window.addEventListener('message', function (e) {
  try {
    var d = e && e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) {} }
    if (d && d.event === 'calendly.event_scheduled')
      window.efficioTrackBooking({ source: 'calendly' });
  } catch (err) {}
});
window.addEventListener('message', function (e) {
  try {
    var o = (e && e.origin) || '';
    if (o.indexOf('leadconnectorhq.com') === -1 && o.indexOf('msgsndr.com') === -1) return;
    var d = e && e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (_) {} }
    var blob = (typeof d === 'string') ? d : JSON.stringify(d || {});
    blob = blob.toLowerCase();
    var booked = /(appoint|booking|schedul)/.test(blob) &&
                 /(booked|scheduled|confirm|success|complete|created)/.test(blob);
    if (booked) window.efficioTrackBooking({ source: 'ghl_widget' });
  } catch (err) {}
});
