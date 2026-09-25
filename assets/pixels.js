/* ============================================================
   Efficio — consent-gated analytics + advertising tags
   Drop-in:  <script src="/assets/pixels.js"></script>  (in <head>)
             <script src="/assets/consent.js" defer></script>  (banner)

   NOTHING LOADS WITHOUT CONSENT.
   No Google tag (GA4 / Google Ads), no Meta Pixel and no LinkedIn
   Insight Tag is requested until the visitor clicks "Accept" in the
   cookie banner (assets/consent.js). "Decline" or no choice at all =
   no tag script is fetched, no tracking cookie is set, no conversion
   event is sent.

   The choice is stored in localStorage under "efficio_consent"
   ("granted" | "denied"). consent.js writes it; this file reads it on
   load and listens for the "efficio:consent" event so tags start the
   moment someone accepts, without a reload.

   Conversion helpers (efficioTrackQuizLead, efficioTrackBooking, ...)
   and gtag() calls made before a choice is made are held in memory
   for this page view only. They are sent if the visitor accepts on
   this page, and thrown away if they decline or leave.

   If you enable another tag here, update privacy.html sections 5-6
   and the banner text in consent.js so they still name exactly what
   loads.
   ============================================================ */

// Meta Pixel ID (Meta Events Manager). "" = the Meta Pixel never loads.
var META_PIXEL_ID = "2869849396696487";

/* Any ID left "" or holding a *_PLACEHOLDER value stays dormant even
   after consent. */
window.EFFICIO_PIXELS = {
  ga4:             "G-62FVTS6S1Z",
  googleAds:       "GADS_CONVERSION_ID_PLACEHOLDER",      /* "AW-1234567890"  */
  googleAdsLabel:  "GADS_CONVERSION_LABEL_PLACEHOLDER",   /* per-action label */
  metaPixel:       META_PIXEL_ID,
  linkedinPartner: "9123490",
  linkedinConv:    "29838514",                            /* qualifier complete */
  linkedinBookConv:"LI_BOOKING_CONVERSION_ID_PLACEHOLDER" /* booking            */
};

(function () {
  var P = window.EFFICIO_PIXELS;
  var CONSENT_KEY = "efficio_consent";
  var loaded = false;
  var pending = [];          /* calls made before a consent choice */
  var MAX_PENDING = 50;

  function ok(v) {
    if (!v || typeof v !== "string") return false;
    if (v.indexOf("_PLACEHOLDER") !== -1) return false;
    if (v.indexOf("REPLACE_ME") !== -1) return false;
    if (v.indexOf("XXXX") !== -1) return false;
    return true;
  }
  window._pxOk = ok;

  function consentState() {
    try {
      if (window.EfficioConsent && window.EfficioConsent.get) return window.EfficioConsent.get();
    } catch (e) {}
    try {
      var v = window.localStorage.getItem(CONSENT_KEY);
      return (v === "granted" || v === "denied") ? v : null;
    } catch (e) { return null; }
  }

  /* ---- UTM / click-id capture (first-party, stays in this tab) ---- */
  function captureUtms() {
    var out = {}, q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return out; }
    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","eff_variant","gclid","fbclid","li_fat_id"].forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = v;
    });
    return out;
  }
  (function persistUtms() {
    var snap = captureUtms();
    if (Object.keys(snap).length === 0) return;
    try { sessionStorage.setItem("efficio_utms", JSON.stringify(snap)); } catch (e) {}
  })();
  window._pxUtms = function () {
    var fromUrl = captureUtms();
    if (Object.keys(fromUrl).length) return fromUrl;
    try { return JSON.parse(sessionStorage.getItem("efficio_utms") || "{}"); } catch (e) { return {}; }
  };

  /* ---- the gate ----
     run(fn): consented + loaded -> run now; undecided -> hold for this page
     view; declined -> drop. */
  function run(fn) {
    if (loaded) { try { fn(); } catch (e) {} return; }
    if (consentState() === "denied") return;
    if (pending.length < MAX_PENDING) pending.push(fn);
  }
  window._pxRun = run;

  /* gtag() is safe to call from page code at any time; it is routed
     through the gate and only reaches Google after consent. */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    var args = arguments;
    run(function () { window.dataLayer.push(args); });
  };

  function loadTags() {
    if (loaded) return;
    if (consentState() !== "granted") return;
    loaded = true;
    window.__efficioTagsLoaded = true;

    /* Google tag: GA4 (+ Google Ads when its ID is filled in) */
    var gId = ok(P.ga4) ? P.ga4 : (ok(P.googleAds) ? P.googleAds : null);
    if (gId) {
      var g = document.createElement("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + gId;
      document.head.appendChild(g);
      var gt = function () { window.dataLayer.push(arguments); };
      gt("js", new Date());
      if (ok(P.ga4))       gt("config", P.ga4);
      if (ok(P.googleAds)) gt("config", P.googleAds);
    }

    /* Meta Pixel */
    if (ok(P.metaPixel)) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
        n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", P.metaPixel); fbq("track", "PageView");
    }

    /* LinkedIn Insight Tag */
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

    /* replay anything page code asked for before the visitor accepted */
    var q = pending; pending = [];
    for (var i = 0; i < q.length; i++) { try { q[i](); } catch (e) {} }
  }

  window.addEventListener("efficio:consent", function (e) {
    var v = e && e.detail;
    if (v === "granted") loadTags();
    else if (v === "denied") pending = [];
  });

  loadTags();   /* returning visitor who already accepted */
})();

/* ============================================================
   CONVERSION HELPERS — every one goes through the consent gate.
   No PII in params: only UTMs and non-identifying keys.
   ============================================================ */

/* Fit-check / quiz result on screen -> Meta "Lead" + GA4 generate_lead */
window.efficioTrackQuizLead = function (meta) {
  if (window.__efQuizLead) return; window.__efQuizLead = true;
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  window._pxRun(function () {
    var P = window.EFFICIO_PIXELS, ok = window._pxOk;
    try { if (window.fbq) fbq("track", "Lead", meta); } catch (e) {}
    try { gtag("event", "generate_lead", meta); } catch (e) {}
    try { gtag("event", "qualifier_completed", meta); } catch (e) {}
    try {
      if (ok(P.googleAds) && ok(P.googleAdsLabel))
        gtag("event", "conversion", { send_to: P.googleAds + "/" + P.googleAdsLabel });
    } catch (e) {}
    try { if (window.lintrk && ok(P.linkedinConv)) lintrk("track", { conversion_id: P.linkedinConv }); } catch (e) {}
  });
};

/* Fit check started (GA4 only) */
window.efficioTrackQualifierStart = function (meta) {
  if (window.__efQualifierStarted) return; window.__efQualifierStarted = true;
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  window._pxRun(function () {
    try { gtag("event", "qualifier_started", meta); } catch (e) {}
  });
};

/* Client onboarding form submitted -> Meta "CompleteRegistration" */
window.efficioTrackQualifierComplete = function (meta) {
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  window._pxRun(function () {
    var P = window.EFFICIO_PIXELS, ok = window._pxOk;
    try { gtag("event", "qualifier_completed", meta); } catch (e) {}
    try { gtag("event", "generate_lead", meta); } catch (e) {}
    try {
      if (ok(P.googleAds) && ok(P.googleAdsLabel))
        gtag("event", "conversion", { send_to: P.googleAds + "/" + P.googleAdsLabel });
    } catch (e) {}
    try { if (window.fbq) fbq("track", "CompleteRegistration", meta); } catch (e) {}
    try { if (window.lintrk && ok(P.linkedinConv)) lintrk("track", { conversion_id: P.linkedinConv }); } catch (e) {}
  });
};

/* Booking confirmed -> Meta "Schedule" + GA4 book_call */
window.efficioTrackBooking = function (meta) {
  if (window.__efBooked) return; window.__efBooked = true;
  meta = Object.assign({}, window._pxUtms ? window._pxUtms() : {}, meta || {});
  window._pxRun(function () {
    var P = window.EFFICIO_PIXELS, ok = window._pxOk;
    try { gtag("event", "calendly_booking_completed", meta); } catch (e) {}  /* legacy GA4 event name, kept for continuity */
    try { gtag("event", "book_call", meta); } catch (e) {}
    try {
      if (ok(P.googleAds) && ok(P.googleAdsLabel))
        gtag("event", "conversion", { send_to: P.googleAds + "/" + P.googleAdsLabel });
    } catch (e) {}
    try { if (window.fbq) fbq("track", "Schedule", meta); } catch (e) {}
    try { if (window.lintrk && ok(P.linkedinBookConv)) lintrk("track", { conversion_id: P.linkedinBookConv }); } catch (e) {}
  });
};

/* Legacy aliases (onboarding.html) */
window.efficioTrackLead = window.efficioTrackQualifierComplete;
window.sendConversion   = window.efficioTrackQualifierComplete;

/* ---- GHL booking widget -> Schedule (best effort) ----
   The reliable hook is the GHL calendar's post-booking redirect to
   /thank-you.html, which calls efficioTrackBooking() on load. This
   listener only acts on messages from the GHL widget origins that
   clearly signal a completed booking. Still consent-gated. */
window.addEventListener("message", function (e) {
  try {
    var o = (e && e.origin) || "";
    if (o.indexOf("leadconnectorhq.com") === -1 && o.indexOf("msgsndr.com") === -1) return;
    var d = e && e.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (_) {} }
    var blob = ((typeof d === "string") ? d : JSON.stringify(d || {})).toLowerCase();
    var booked = /(appoint|booking|schedul)/.test(blob) &&
                 /(booked|scheduled|confirm|success|complete|created)/.test(blob);
    if (booked) window.efficioTrackBooking({ source: "ghl_widget" });
  } catch (err) {}
});
