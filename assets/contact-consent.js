/**
 * Efficio: contact consent capture (SMS box A, AI-voice call box B).
 * Drop-in:  <script src="/assets/contact-consent.js" defer></script>
 *
 * Not the cookie banner. That is assets/consent.js (window.EfficioConsent).
 * This file only reads the two contact-consent checkboxes on a form and builds
 * the consent object the efficio-chat Worker (/quiz) records.
 *
 * Markup contract, per form:
 *   <input type="checkbox" name="sms_consent" id="..." value="yes">
 *   <label for="..." data-consent-version="sms_v2_2026-09">Text A</label>
 *   <input type="checkbox" name="ai_voice_consent" id="..." value="yes">
 *   <label for="..." data-consent-version="aivoice_v1_2026-09">Text B</label>
 * Both boxes are optional and never pre-checked. The label text is the exact
 * disclosure: it is sent as shown (whitespace collapsed). If you change a word
 * of it, bump the version in data-consent-version on EVERY page that shows it
 * (sms-opt-in, intake, onboarding) and keep the old text in README.md.
 *
 * Payload shape (README.md, "Contact consent capture"):
 *   payload.consent = {
 *     contract: 'efficio_consent_v1',
 *     sms_consent: bool, ai_voice_consent: bool,
 *     consent_text_version: 'sms_v2_2026-09' | 'aivoice_v1_2026-09'
 *                           | 'sms_v2_2026-09,aivoice_v1_2026-09' | '',   // TICKED boxes
 *     source: 'efficio_sms_optin_page' | 'efficio_precall_intake' | 'efficio_client_onboarding',
 *     // the names the efficio-chat Worker reads (clipConsent):
 *     sms_opt_in: bool, granted: bool, ai_voice: bool,
 *     text_version, ai_voice_text_version,              // version of each box SHOWN
 *     disclosure_text, ai_voice_disclosure_text,        // exact text of each box SHOWN
 *     sms_text_version, sms_disclosure_text,            // aliases of text_version / disclosure_text
 *     consent_phone, timestamp, source_url, user_agent, method
 *   }
 * The first four fields are mirrored at the top level of the payload.
 *
 * Public API: window.EfficioContactConsent.collect(form, {source, phone})
 *             window.EfficioContactConsent.problem(form, {phone, requireOne})
 *             window.EfficioContactConsent.outcome(consent, workerJson)
 *             window.EfficioContactConsent.mirror(payload, consent)
 */
(function () {
  'use strict';
  if (window.EfficioContactConsent) return;

  var CONTRACT = 'efficio_consent_v1';

  function norm(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  function box(form, name) {
    var el = form && form.querySelector('input[type="checkbox"][name="' + name + '"]');
    if (!el) return null;
    var label = null;
    if (el.id) {
      var all = document.querySelectorAll('label[for]');
      for (var i = 0; i < all.length; i++) { if (all[i].getAttribute('for') === el.id) { label = all[i]; break; } }
    }
    return {
      checked: !!el.checked,
      version: (label && label.getAttribute('data-consent-version')) || '',
      text: norm(label && label.textContent),
      el: el
    };
  }

  function digits(p) { return String(p || '').replace(/\D/g, ''); }

  /* Returns null when the form may be submitted, else a message for the visitor. */
  function problem(form, opts) {
    opts = opts || {};
    var sms = box(form, 'sms_consent'), voice = box(form, 'ai_voice_consent');
    var any = !!((sms && sms.checked) || (voice && voice.checked));
    if (opts.requireOne && !any) {
      return 'Tick at least one box to opt in. Nothing was sent.';
    }
    if (any) {
      var d = digits(opts.phone);
      if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
      if (d.length !== 10) {
        return 'Add a 10-digit US mobile number to go with the box you ticked, or untick it. Nothing was sent.';
      }
    }
    return null;
  }

  function collect(form, opts) {
    opts = opts || {};
    var sms = box(form, 'sms_consent'), voice = box(form, 'ai_voice_consent');
    var smsOn = !!(sms && sms.checked), voiceOn = !!(voice && voice.checked);
    var versions = [];
    if (smsOn) versions.push(sms.version);
    if (voiceOn) versions.push(voice.version);
    var now = new Date().toISOString();
    var url = '';
    try { url = window.location.href; } catch (e) {}
    return {
      contract: CONTRACT,
      sms_consent: smsOn,
      ai_voice_consent: voiceOn,
      /* same format the Worker writes to GHL consent_text_version */
      consent_text_version: versions.join(','),
      source: opts.source || 'efficio_web_form',
      /* the Worker's field names (clipConsent / consentChannels): sms_opt_in is
         box A (granted is its legacy alias), ai_voice is box B */
      sms_opt_in: smsOn,
      granted: smsOn,
      ai_voice: voiceOn,
      text_version: sms ? sms.version : null,
      ai_voice_text_version: voice ? voice.version : null,
      disclosure_text: sms ? sms.text : null,
      ai_voice_disclosure_text: voice ? voice.text : null,
      sms_text_version: sms ? sms.version : null,
      sms_disclosure_text: sms ? sms.text : null,
      consent_phone: (smsOn || voiceOn) ? norm(opts.phone) : '',
      timestamp: now,
      source_url: url,
      user_agent: (window.navigator && navigator.userAgent) || '',
      method: 'web_form_checkbox'
    };
  }

  function mirror(payload, consent) {
    payload.sms_consent = consent.sms_consent;
    payload.ai_voice_consent = consent.ai_voice_consent;
    payload.consent_text_version = consent.consent_text_version;
    payload.source = consent.source;
    return payload;
  }

  /* Per channel: 'confirmed' | 'pending' | 'none'. A channel is 'confirmed' only
     when the Worker says it stored the submission.
       texts:    accepted !== false (older Workers omit `accepted` on success).
       AI voice: ai_voice_accepted when the Worker sends it; otherwise an explicit
                 accepted === true (the consent-aware Worker's answer for an opt-in
                 it stored). A missing `accepted` never confirms AI-voice consent. */
  function outcome(consent, j) {
    j = j || {};
    var voiceOk = typeof j.ai_voice_accepted === 'boolean' ? j.ai_voice_accepted : j.accepted === true;
    return {
      sms: !consent.sms_consent ? 'none' : (j.accepted !== false ? 'confirmed' : 'pending'),
      voice: !consent.ai_voice_consent ? 'none' : (voiceOk ? 'confirmed' : 'pending')
    };
  }

  window.EfficioContactConsent = { contract: CONTRACT, collect: collect, problem: problem, outcome: outcome, mirror: mirror };
})();
