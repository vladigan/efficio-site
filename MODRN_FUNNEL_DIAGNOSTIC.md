# Efficio Lead Funnel — Modrn Diagnostic (read-only)

**Prepared:** 2026-06-15 · Read-only investigation, nothing was changed, sent, or deployed.
**Scope:** What's broken in the Efficio inbound funnel, what's Modrn's fault vs. ours, and what we need to unblock.

> **Headline:** The funnel that actually runs on efficio.tech today is *our* native one (quiz → Calendly → our Cloudflare Worker). The Modrn Perspective/GHL funnel is **not wired into the live site at all**. So most of what failed for Mike sits on **our** side of the line, not Modrn's. Modrn still owes us real things (tracking IDs, and the booking/funnel they were hired to ship), but they are not the reason a lead just slipped.

---

## 1. What's actually broken, end to end

**Capture → Quiz → Booking → Onboarding**, with the failing piece and the evidence.

**Capture (LEAKING — our side).** Every quiz completion and email POSTs to our own Cloudflare Worker, `https://efficio-chat.bgay3500.workers.dev/quiz` (`audit-quiz.html:1212`, `:1332`, `:1382`; `qualify.html:264`). Per your status pull, `quiz_submissions.jsonl` is empty and `audit_leads.jsonl` has only a test row — i.e. the Worker is receiving posts but not persisting them, or the storage the daemon reads was never written. *Could not verify the .jsonl files directly: they are not in the website repo or anywhere under `C:\Code\LLC` — they live in the Worker/connector backend, which isn't on this disk. The front-end half of the pipe is confirmed; the persistence half is inferred from your report.*

**Quiz (WORKS).** The quiz logic, scoring, and tier routing are intact and live (`audit-quiz.html:1093-1130`, scorer mirrors `src/efficio_connector/scoring.py`). Mike completing all questions and getting a qualified tier is consistent with the code working. The quiz is not the problem.

**Booking (FAILED for Mike — our side).** The live booking is a **Calendly** inline embed, not anything from Modrn yet:
- `book.html:137` → `calendly.com/brady-bngcent/efficio-ai-audit-15-min`
- `audit-quiz.html:986` → same Calendly URL, embedded as button + iframe (`:1243`, `:1260`)
- Both Calendly links **resolve and render fine right now** (fetched 2026-06-15, page-rendered-at 13:25Z for both `efficio-ai-audit-15-min` and `efficio-strategy-call`). So the "calendar DNS broke" was **not** a permanent Calendly outage — the link is bookable today. The likely failure was transient (DNS/network hiccup) or the inline `widget.js` embed failing to load, leaving only the "Open in a new tab" fallback. **I could not reproduce a persistent break.**

**Booking record (STRUCTURALLY MISSING — our side).** There is **no server-side booking capture anywhere in the funnel.** A completed Calendly booking only fires a *client-side pixel* (`pixels.js:198-206`, listening for `calendly.event_scheduled` → `efficioTrackBooking`). Nothing writes a booking to `bookings.jsonl`. That fully explains why `bookings.jsonl` doesn't exist and why the post-booking daemon has run 100+ cycles capturing **0 bookings ever** — there is literally no producer feeding it. This is an architecture gap on our side, independent of Modrn.

**Onboarding (downstream, untestable from here).** Onboarding (`onboarding.html`, intake, Dropbox/OAuth) only triggers *after* a booked call, so with 0 captured bookings it has had nothing to act on. No defect found in the pages themselves.

---

## 2. Modrn's responsibility vs. ours

**Modrn owes us (genuinely theirs):**
- **The booking system they were hired to ship.** The swap points in `book.html:133` and `audit-quiz.html:983` (also `-b`, `-c`) are explicitly waiting on *"Modrn's GHL booking link."* Calendly was meant to be retired in favor of GHL. That hasn't shipped — the placeholders are still Calendly.
- **Conversion tracking IDs.** `assets/pixels.js` has **6 conversion IDs still dormant** (the code gates anything containing `_PLACEHOLDER`, so they fire nothing): Meta Pixel (`:43`), Google Ads conversion ID (`:41`) + label (`:42`), LinkedIn partner ID (`:44`), LinkedIn qualifier-conversion ID (`:45`), LinkedIn booking-conversion ID (`:46`). Per `marketing-brief.html:194-201`, Modrn owns paid acquisition. Only **GA4 is actually live** (`G-62FVTS6S1Z`).
- **(Per your notes) the Perspective funnel entry URL + the 403 fix.** ⚠ **I could not verify this:** there is **no Perspective URL anywhere in the codebase** — not in any HTML, JS, or config. The repo frames the handoff entirely around **GHL booking**, never "Perspective." So either the Perspective plan lives outside this repo, or the codebase and the Modrn plan have drifted apart. The reported 403 can't be checked without the actual URL.

**Our side is misconfigured (don't blame Modrn for these):**
- **The lead-capture Worker isn't persisting** (`efficio-chat.bgay3500.workers.dev` is *our* worker — `bgay3500` is Brady's account). Empty `quiz_submissions.jsonl` = our bug.
- **No booking webhook → no `bookings.jsonl`.** We never built server-side booking capture; the daemon reads a file nobody writes.
- **The booking embed Mike hit was our Calendly**, not Modrn's funnel.
- **Stale source-of-truth.** `marketing-brief.html:184-191` (dated 2026-05-19) claims the LinkedIn Insight Tag is *live* (`9123490`) and only two IDs are placeholders. The actual `pixels.js` shows LinkedIn still on placeholders and six IDs dark. The brief is optimistic/out of date — our doc, our fix.
- **Internal contradiction on who provides the pixel IDs.** Same brief says both *"Brady to provide"* the Meta/Google IDs (`:188-189`) and *"Modrn: drop the two missing IDs"* (`:192`). Worth settling before we accuse Modrn of withholding them.

---

## 3. Concrete impact

- **A $500K+/mo qualified lead (Mike, Waymaker Group) was likely lost with zero record.** He finished the quiz, scored qualified, then hit a broken/empty booking step. The qualified path *does* have an email safety-net (`audit-quiz.html:685-695`, "Email me my audit + booking link"), but it POSTs to the **same Worker that isn't persisting** (`:1382`) — so even the fallback may have silently swallowed him. Net: a high-value inbound with no booking and possibly no captured email.
- **Paid traffic can't be optimized or attributed.** With 5 of 6 conversion signals dark, Meta / Google Ads / LinkedIn receive no qualifier or booking events — only GA4 sees anything. Any spend Modrn runs to these pages is flying blind on conversions.
- **We have no idea how many "Mikes" already came through.** Because capture isn't persisting and bookings are never recorded, the true leak size is unknown — could be one, could be many.

---

## 4. What's needed to unblock

**From Modrn (ask for these specifically):**
1. The **GHL booking URL/embed** to drop into the two flagged swap points — or explicit confirmation we keep Calendly for now.
2. The **6 conversion tracking IDs**, exact values for: Meta Pixel ID; Google Ads conversion ID (`AW-…`) + conversion label; LinkedIn partner ID; LinkedIn qualifier-completed conversion ID; LinkedIn booking conversion ID.
3. The **Perspective funnel entry URL** and a **fix for the reported 403** — *if* that funnel is still the plan (flag the GHL-vs-Perspective drift to them).
4. Clarify **who owns the Meta/Google Ads IDs** (our brief contradicts itself).

**Efficio fixes (on us, can start now without Modrn):**
1. **Debug the Cloudflare Worker** — find why `/quiz` posts aren't landing in `quiz_submissions.jsonl`. This is the single highest-value fix; it stops the bleeding.
2. **Add server-side booking capture** — a Calendly webhook (now) / GHL webhook (later) that writes `bookings.jsonl`, so the post-booking daemon actually has input.
3. **Verify/repair the live Calendly embed** — confirm `widget.js` loads and the iframe renders; consider making the visible booking button the primary path so a flaky embed can't silently block a booking.
4. **Update `marketing-brief.html`** to match `pixels.js` reality (LinkedIn not live; 6 IDs outstanding).

---

## 5. Draft message to Modrn — DRAFT ONLY, not sent

> **Subject: Funnel handoff — what we need from you to go live**
>
> Hey [Modrn] — quick status and a clear ask. We just had a strong inbound ($500K+/mo home-services) complete the quiz and then fail to book, so I'm tightening up the funnel and need the outstanding pieces from your side.
>
> Three things we're still waiting on:
> 1. **Booking** — the GHL booking link/embed to replace our interim Calendly. The site has the swap points ready; the moment you send it we drop it in. If GHL isn't ready, tell me and we'll keep Calendly live in the meantime.
> 2. **Tracking IDs** — we need the 6 conversion IDs so paid traffic actually tracks: Meta Pixel ID, Google Ads conversion ID + label, and the three LinkedIn IDs (partner ID, qualifier-completed conversion ID, booking conversion ID). Right now only GA4 is firing, which means any ad spend is running blind on conversions.
> 3. **The funnel page itself** — I've got it noted that the Perspective funnel entry URL is still outstanding and the page is returning a 403. Can you send the working URL (and confirm whether we're going Perspective or GHL for the funnel — our build notes have drifted). 
>
> For transparency, I'm also fixing things on our end (our lead-capture and booking-record backend), so this isn't all on you — but the four items above are blocking and only you can unblock them. Can you get me the tracking IDs and a status on the booking link by [date]?
>
> Thanks — Brady

*Tone note: firm but fair. It separates "you owe us X" from "we're fixing our own Y," which keeps the pressure credible. Fill in the bracketed date before sending.*

---

## What I could not verify (be aware)
- The `.jsonl` capture files and the post-booking daemon are **not on this disk** (not in `website/` or anywhere under `C:\Code\LLC`); they live in the Worker/connector backend. "Empty / 0 bookings" is taken from your status pull, corroborated structurally by the code, but not read directly.
- **No Perspective funnel URL exists in the codebase**, so the reported 403 is unconfirmed and the Perspective-vs-GHL plan appears to have drifted.
- A **persistent** booking/DNS break could not be reproduced — both Calendly links are live and bookable as of 2026-06-15.
- I did not POST to the Worker (that would create a lead record), so its persistence bug is diagnosed from the empty-file report + code, not a live write test.
