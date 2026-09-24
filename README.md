# efficio-site

Static site for efficio.tech (GitHub Pages behind Cloudflare). Edit the HTML files directly.

## No page generators

The build helper scripts were deleted on 2026-09-24: `_build_blog.py`, `_inject_chat.py`,
`_inject_theme.py`, `_nav_sweep.py`, `agents/_build.py` and `DEPLOY_V5_FIX.bat`. They
regenerated or re-published pages that have since been retired and replaced with redirect
stubs, such as the old blog, the `agents/*` deep-dives and the legacy nav and theme. Running
them would bring back copy that was removed for accuracy and compliance.

Don't restore them from git history. If a page needs changing, edit that page by hand. Keep
the consent setup intact:

- `assets/pixels.js` loads nothing until the visitor clicks Accept in `assets/consent.js`.
- The GoHighLevel chat loader is an inert `<script type="text/plain" data-consent-chat ...>` tag.
  `consent.js` loads it only after Accept.
- The booking calendar is an `<iframe data-consent-src ...>`. It also loads only after Accept.
- Every page carries a `Cookie settings` link (`data-cookie-settings`).

If you add a tag, widget or embed, gate it the same way. Then update `privacy.html` §6 and the
banner text in `consent.js` so they still name everything that loads.

## Contact consent capture (texts and AI-voice calls)

Every site form that asks for a phone number shows two **separate** checkboxes next to it:
`sms-opt-in.html`, `intake.html` (pre-call questionnaire) and `onboarding.html` (client
onboarding). The GoHighLevel booking calendar is an iframe, so its consent is set in GHL
(calendar consent label, plus a GHL form attached to the calendar), not here.

Rules:

- **Box A (texts)** and **box B (calls from Efficio's AI assistant, the prior express written
  consent for artificial/AI-voice calls)** are separate, never pre-checked, and never
  required. Neither is a condition of purchase. `sms-opt-in.html` needs at least one of the
  two ticked (that page does nothing else); the other forms submit fine with neither.
- A ticked box needs a 10-digit US mobile number, or the form isn't sent.
- The label text **is** the disclosure. `assets/contact-consent.js` sends it exactly as shown
  (whitespace collapsed), with the version from the label's `data-consent-version`.
- To change a single word: give the text a new version, update it on **all three** pages,
  and add it to the table below. Never edit the text of a version that has been published.
- `sms-opt-in.html` shows "recorded" for a box only when the Worker confirms it: texts when
  `accepted !== false`; AI-voice calls when `ai_voice_accepted === true`, or, if the Worker
  doesn't send that field, when `accepted === true` (the consent-aware Worker's answer for
  an opt-in it stored). Anything else gets a neutral receipt, and a failed request gets an
  error.

### Payload sent to the Worker (`POST https://efficio-chat.bgay3500.workers.dev/quiz`)

`kind` is unchanged per page: `sms_opt_in`, `pre_call_intake` or `client_onboarding`. The
consent is in `payload.consent`. Its first four fields are also mirrored at the top level of
the payload.

| Field | Value |
|---|---|
| `contract` | `efficio_consent_v1` |
| `sms_consent` | `true` / `false`: box A ticked |
| `ai_voice_consent` | `true` / `false`: box B ticked |
| `consent_text_version` | versions of the **ticked** boxes, comma-joined like the GHL field the Worker writes: `sms_v2_2026-09`, `aivoice_v1_2026-09`, `sms_v2_2026-09,aivoice_v1_2026-09`, or `""` |
| `source` | `efficio_sms_optin_page` · `efficio_precall_intake` · `efficio_client_onboarding` |
| `sms_opt_in` (+ legacy alias `granted`), `ai_voice` | the Worker's names for box A and box B (same values as above) |
| `text_version` / `ai_voice_text_version` | version of each box **shown**, ticked or not (`sms_text_version` = alias) |
| `disclosure_text` / `ai_voice_disclosure_text` | exact text of each box shown (`sms_disclosure_text` = alias) |
| `consent_phone` | the phone typed on the form when a box is ticked, else `""` |
| `timestamp`, `source_url`, `user_agent`, `method` | ISO time (client clock), page URL, UA, `web_form_checkbox` |

The Worker adds the server-side evidence (full IP, server receipt time) itself and never
trusts the client clock. On `sms-opt-in.html`, `answers` also carries `sms_consent_text` /
`ai_voice_consent_text` (the text of each ticked box) so a Worker that predates
`efficio_consent_v1` still keeps the evidence in its form log.

### Consent text versions

| Version | Where | Text |
|---|---|---|
| `sms_v2_2026-09` | box A, all three forms | **Text me.** I agree to receive recurring marketing and account text messages from Efficio (BNG Contracting Enterprise LLC) at the mobile number above, including messages sent using automated technology. Consent is not a condition of any purchase. Msg frequency varies (up to 4/week). Msg & data rates may apply. Reply STOP to opt out, HELP for help. SMS Terms · Privacy Policy |
| `aivoice_v1_2026-09` | box B, all three forms | **Call me with Efficio's AI assistant.** I agree that BNG Contracting Enterprise LLC, doing business as Efficio, may call me at the number above, including marketing calls, using an automated system and an artificial or AI-generated voice. Calls may be recorded. Consent is not a condition of any purchase. I can revoke this consent at any time in any reasonable way, for example by saying "stop calling" on a call, replying STOP to a text, or emailing brady@efficio.tech. |
| (unversioned, retired 2026-09) | the single box on `sms-opt-in.html` before this change | By checking this box, I agree to receive recurring automated text messages from Efficio (BNG Contracting Enterprise LLC) at the phone number provided. These messages include appointment reminders, booking confirmations, account updates, and customer-care replies. Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time, or HELP for help. |
