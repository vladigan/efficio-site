/**
 * Efficio: contact consent capture. Box A = texts (sms_v2_2026-09), box B = calls,
 * including an artificial or AI-generated voice (aivoice_v1_2026-09).
 * Drop-in:  <script src="/assets/contact-consent.js" defer></script>
 *
 * Not the cookie banner. That is assets/consent.js (window.EfficioConsent).
 *
 * Source: Efficio ops/consent_capture/site_consent_block.html (CONSENT_CAPTURE_PLAN.md
 * section 2.3). The texts are ops/consent_texts/sms_v2_2026-09.txt and
 * aivoice_v1_2026-09.txt, word for word. Never edit a published text: add a new
 * version file, give it a new data-version, and change it on EVERY page that shows it
 * (find-your-tier, sms-opt-in, intake, onboarding) plus README.md.
 *
 * Markup contract, inside the <form> (one consent block per page, so the ids are fixed):
 *   <input type="tel" ...>                 the number the consent covers (one per form)
 *   <div class="ef-consent" role="group" aria-label="Optional: texts and calls from Efficio">
 *     <label for="efConsentSms"><input id="efConsentSms" name="consent_sms" type="checkbox"/>
 *       <span id="efConsentSmsText" data-version="sms_v2_2026-09">text A</span></label>
 *     <label for="efConsentVoice"><input id="efConsentVoice" name="consent_ai_voice" type="checkbox"/>
 *       <span id="efConsentVoiceText" data-version="aivoice_v1_2026-09">text B</span></label>
 *     <p class="ef-consent-err" id="efConsentErr" hidden>...</p>
 *   </div>
 * Both boxes are unchecked by default and never required.
 *
 * window.efficioConsent(form) returns
 *   null   no box ticked: send no consent object
 *   false  a box is ticked but the phone is empty or not a 10-digit US number
 *          (the message is shown; do not submit)
 *   {...}  put it on payload.consent
 * The object's field names are the ones the efficio-chat Worker's clipConsent() reads:
 *   sms_opt_in, ai_voice, method, timestamp, text_version, disclosure_text,
 *   ai_voice_text_version, ai_voice_disclosure_text, source_url, user_agent.
 * The Worker adds the server receipt time, the full IP (only when a box is ticked) and a
 * SHA-256 of each text. It writes consent_sms only when text A mentions marketing, and
 * consent_ai_voice only when text B names an artificial / AI-generated voice. The number
 * the consent covers is the payload's top-level `phone`, so every form sends it.
 *
 * If this file fails to load, pages must refuse to submit a form with a ticked box
 * (they check for #efConsentSms:checked / #efConsentVoice:checked themselves).
 *
 * window.efficioMarketingConsent() returns the cookie-banner choice for ad measurement,
 * sent as the top-level boolean payload.marketing_consent on every POST to the Worker's
 * /quiz: true ONLY when the visitor clicked Accept (assets/consent.js,
 * EfficioConsent.get() === 'granted', stored in localStorage "efficio_consent"); false
 * for Decline, no choice yet, or unreadable storage. The Worker sends its server-side
 * Meta Conversions API Lead only when it is true (privacy.html: conversion events go to
 * Meta only after Accept). It is not the text/call consent above. If this file fails to
 * load, pages send false.
 */
(function () {
  'use strict';
  if (typeof window.efficioMarketingConsent !== 'function') {
    window.efficioMarketingConsent = function () {
      try {
        if (window.EfficioConsent && typeof window.EfficioConsent.get === 'function') {
          return window.EfficioConsent.get() === 'granted';
        }
      } catch (e) {}
      try { return window.localStorage.getItem('efficio_consent') === 'granted'; } catch (e) { return false; }
    };
  }
  if (typeof window.efficioConsent === 'function') return;

  /* A number the Worker can turn into E.164 (+1 and 10 digits). Anything else would be
     stored but never reach the CRM as consent, so the visitor is asked to fix it. */
  function usPhoneOk(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    return d.length === 10;
  }

  window.efficioConsent = function (form) {
    var sms = form.querySelector('#efConsentSms'), voice = form.querySelector('#efConsentVoice');
    var smsOn = !!(sms && sms.checked), voiceOn = !!(voice && voice.checked);
    var err = form.querySelector('#efConsentErr');
    if (err) {
      if (!err.hasAttribute('data-default')) err.setAttribute('data-default', err.textContent);
      err.textContent = err.getAttribute('data-default');
      err.hidden = true;
    }
    if (!smsOn && !voiceOn) return null;
    var phoneEl = form.querySelector('input[type="tel"]');
    var raw = phoneEl ? (phoneEl.value || '') : '';
    var hasDigits = !!raw.replace(/\D/g, '');
    if (!hasDigits || !usPhoneOk(raw)) {
      if (err) {
        if (hasDigits) {
          err.textContent = 'Enter a 10-digit US mobile number above so we know where you want texts or calls, or untick the box.';
        }
        err.hidden = false;
      }
      try { if (phoneEl && phoneEl.focus) phoneEl.focus(); } catch (e) {}
      return false;
    }
    var txt = function (id) { var el = form.querySelector(id); return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
    var ver = function (id) { var el = form.querySelector(id); return el ? (el.getAttribute('data-version') || '') : ''; };
    return {
      sms_opt_in: smsOn,
      ai_voice: voiceOn,
      method: 'web_form_checkbox',
      timestamp: new Date().toISOString(),
      text_version: smsOn ? ver('#efConsentSmsText') : null,
      disclosure_text: smsOn ? txt('#efConsentSmsText') : null,
      ai_voice_text_version: voiceOn ? ver('#efConsentVoiceText') : null,
      ai_voice_disclosure_text: voiceOn ? txt('#efConsentVoiceText') : null,
      source_url: (window.location && window.location.href) || '',
      user_agent: (window.navigator && navigator.userAgent) || ''
    };
  };
})();
