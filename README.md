# efficio-site

Static site for efficio.tech (GitHub Pages behind Cloudflare). Edit the HTML files directly.

## No page generators

The build helper scripts were deleted on 2026-09-24: `_build_blog.py`, `_inject_chat.py`,
`_inject_theme.py`, `_nav_sweep.py`, `agents/_build.py` and `DEPLOY_V5_FIX.bat`. They
regenerated or re-published pages (the blog, the `agents/*` pages, the nav and the theme)
from templates that still carry copy removed for accuracy and compliance. Running them
would bring that copy back.

Don't restore them from git history. If a page needs changing, edit that page by hand. Keep
the consent setup intact:

- `assets/pixels.js` loads nothing until the visitor clicks Accept in `assets/consent.js`.
- The GoHighLevel chat loader is an inert `<script type="text/plain" data-consent-chat ...>` tag.
  `consent.js` loads it only after Accept.
- The booking calendar is an `<iframe data-consent-src ...>`. It also loads only after Accept.
- Every page carries a `Cookie settings` link (`data-cookie-settings`).

If you add a tag, widget or embed, gate it the same way. Then update `privacy.html` §6 and the
banner text in `consent.js` so they still name everything that loads.

## Contact consent capture (texts and calls, including an AI voice)

Every site form that asks for a phone number shows two **separate** checkboxes directly under
it: `find-your-tier.html` (the optional follow-up form after the plan quiz), `sms-opt-in.html`,
`intake.html` (pre-call questionnaire) and `onboarding.html` (client onboarding). `go.html` is a
redirect stub. The GoHighLevel booking calendar is an iframe, so its consent is set in GHL
(calendar consent label, plus a GHL form attached to the calendar), not here.

Source of truth (Efficio ops folder, not in this repo): `ops/CONSENT_CAPTURE_PLAN.md` §2.0-§2.3,
the paste-ready block `ops/consent_capture/site_consent_block.html`, and the dated texts in
`ops/consent_texts/` (`sms_v2_2026-09.txt`, `aivoice_v1_2026-09.txt`).

Rules:

- **Box A (texts, `sms_v2_2026-09`)** and **box B (calls, including an artificial or
  AI-generated voice, `aivoice_v1_2026-09`)** are separate, never pre-checked, and never
  required. Neither is a condition of purchase. The seller is named as "Efficio (BNG
  Contracting Enterprise LLC)". `sms-opt-in.html` needs at least one of the two ticked (that
  page does nothing else); the other forms submit fine with neither.
- The markup is the block from `site_consent_block.html`, pasted **verbatim** (ids
  `efConsentSms`, `efConsentVoice`, `efConsentSmsText`, `efConsentVoiceText`, `efConsentErr`;
  one block per page). Page CSS may restyle it but never changes its text.
- `window.efficioConsent(form)` in `assets/contact-consent.js` returns `null` (no box ticked:
  send no consent), `false` (a box is ticked but the form's `input[type="tel"]` is empty or
  not a 10-digit US number: the message under the boxes is shown and nothing is sent), or the
  consent object for `payload.consent`. If that script fails to load, a page with a ticked
  box refuses to submit.
- The span text **is** the disclosure: it is sent exactly as shown (whitespace collapsed),
  with the version from the span's `data-version`.
- To change a single word: add a new version file in `ops/consent_texts/`, give the text a new
  `data-version`, update it on **all four** pages, and add it to the table below. Never edit
  the text of a version that has been published.
- `sms-opt-in.html` says "You're subscribed." only when box A was ticked **and** the POST
  returned ok (HTTP 2xx, `ok: true`, and not `accepted: false`, which the Worker sends for a
  held or spam-filed submission). A box's line says "recorded" only when the Worker confirms
  it: texts when `accepted !== false`; calls when `ai_voice_accepted === true`, or, if the
  Worker doesn't send that field, when `accepted === true`. Anything else gets a neutral
  receipt, and a failed request gets an error.

### Payload sent to the Worker (`POST https://efficio-chat.bgay3500.workers.dev/quiz`)

`kind` is unchanged per page: `quiz_lead` (find-your-tier), `sms_opt_in`, `pre_call_intake` or
`client_onboarding`. The number the consent covers is the payload's top-level `phone` (on
find-your-tier it is sent only when a box is ticked). `payload.consent` is present only when a
box is ticked, in exactly the shape the Worker's `clipConsent()` reads:

| Field | Value |
|---|---|
| `sms_opt_in` | `true` / `false`: box A ticked |
| `ai_voice` | `true` / `false`: box B ticked |
| `text_version` / `disclosure_text` | version and exact text of box A when ticked, else `null` |
| `ai_voice_text_version` / `ai_voice_disclosure_text` | version and exact text of box B when ticked, else `null` |
| `method` | `web_form_checkbox` |
| `timestamp`, `source_url`, `user_agent` | ISO time (client clock), page URL, UA |

The Worker adds the server-side evidence (server receipt time, full IP when a box is ticked,
SHA-256 of each text) itself and never trusts the client clock. It writes GHL consent fields
and the `consent_sms` / `consent_ai_voice` tags only for `quiz_lead` and `sms_opt_in` (the
repaired Worker, `repair-2026-09-23`); `pre_call_intake` and `client_onboarding` are
record-only, so their consent is kept as evidence in the Worker's form log.

Every `/quiz` body also carries the top-level boolean `marketing_consent`, from
`window.efficioMarketingConsent()` in `assets/contact-consent.js`: `true` only when the visitor
clicked Accept in the cookie banner (`EfficioConsent.get() === 'granted'`, localStorage
`efficio_consent`), `false` for Decline, no choice yet, or if the helper didn't load. It is not
the text/call consent. The repaired Worker sends its server-side Meta Conversions API `Lead`
(hashed email/name) for a `quiz_lead` only when it is `true`, matching privacy.html (conversion
events go to Meta only after Accept); other kinds never reach Meta. Any new form that posts to
`/quiz` must send it too.

### Consent text versions

| Version | Where | Text |
|---|---|---|
| `sms_v2_2026-09` | box A, all four forms | **Yes, text me.** I agree that Efficio (BNG Contracting Enterprise LLC) may send me recurring marketing and account text messages at the mobile number I entered, including texts sent using automated technology. Consent is not a condition of any purchase. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. SMS Terms · Privacy |
| `aivoice_v1_2026-09` | box B, all four forms | **Yes, call me.** I agree that Efficio (BNG Contracting Enterprise LLC) may call me at the number I entered, including marketing calls and voicemails, using automated technology (including an automated system to select and dial numbers), prerecorded messages, and an artificial or AI-generated voice. Calls may be recorded. Consent is not a condition of any purchase. Call frequency varies. Msg & data rates may apply. To opt out, say "stop calling" on any call, reply STOP to any text from us, or email brady@efficio.tech. Reply HELP for help. |
| (unversioned, retired 2026-09) | the single box on `sms-opt-in.html` before this change | By checking this box, I agree to receive recurring automated text messages from Efficio (BNG Contracting Enterprise LLC) at the phone number provided. These messages include appointment reminders, booking confirmations, account updates, and customer-care replies. Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time, or HELP for help. |

An earlier draft wording ("Text me." / "Call me with Efficio's AI assistant.") carried these two
version ids on the unmerged truth-pass branch. It was never published and was replaced with the
registered texts above before merge.
