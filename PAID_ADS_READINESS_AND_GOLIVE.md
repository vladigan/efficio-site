# Efficio — Paid-Ads Readiness Audit & Go-Live Plan

**Prepared:** 2026-06-16 · Read-only audit. Nothing was spent, launched, modified, or deployed.
**Scope:** Can Efficio run measurable paid ads today? What's set up vs. assumed, what's blocking, and the exact sequence to go live. Plus a draft (not launched) starter campaign brief.

> **Bottom line:** Efficio is **NOT ready to spend a dollar on paid ads.** Any spend today would be unmeasurable and partly un-captured. Two independent gaps stack on top of each other: (1) **5 of 6 paid-conversion signals are dormant placeholders** — only GA4 fires, so Meta/Google/LinkedIn would optimize and report on nothing; and (2) the **lead- and booking-capture backend fix is written but not deployed**, so even tracked clicks that convert can be lost with no record. No real ad accounts or assets are configured anywhere in the codebase. None of the four hard blockers can be cleared without the user's logins/credentials.

---

## 1. Ad accounts & assets — what actually exists vs. assumed

**Configured in the codebase: effectively nothing.** A full sweep for real identifiers (`AW-…`, `act_…` business-manager IDs, 15–16-digit pixel IDs, LinkedIn partner IDs) found **zero real values**. The only `AW-` string in the repo is the example comment `AW-1234567890` in `pixels.js:41`. There is no `.env` file on disk, no `wrangler`-stored ad credentials, and no Meta Business Manager / Google Ads / LinkedIn account number referenced anywhere.

**What's *referenced* (assumed, owned by others):**

- **Modrn owns paid acquisition.** `marketing-brief.html:197-201` assigns "Paid acquisition (Google Ads + Meta) and creative testing," "Ad copy + creative production," and "Calendar booking + meeting follow-ups (via GHL)" to Modrn. So the actual ad accounts are expected to live in **Modrn's** Business Manager / Google Ads, not Efficio's — this needs to be confirmed and access granted.
- **A "Meta Ads Optimizer" agent** — referenced in your prior work, but **not present in this repo.** The marketing-coordinator agent page (`agents/marketing-coordinator.html`) does not mention it. It exists outside this codebase (if at all) and is not wired to anything live.
- **GA4 is the one genuinely live asset:** `G-62FVTS6S1Z` (`pixels.js:40`), confirmed live.
- **GHL ("Modrn paid-ads handoff")** is referenced as the future booking system but **has not shipped** — the swap points (`book.html:133`, `audit-quiz.html:983`) still point at interim Calendly.

**Conclusion:** Treat ad-account existence as *unconfirmed*. Before any spend you must establish **whose** Meta/Google/LinkedIn accounts will run the ads (yours or Modrn's), and get admin access + the pixel/conversion IDs from that account.

---

## 2. The full conversion-tracking gap (exact placeholders & where they live)

All tracking is centralized in **`website/assets/pixels.js`**, loaded in the `<head>` of **53 pages** (every funnel page: `index.html`, `audit-quiz.html`, `book.html`, `qualify.html`, all `/landings/*`, blog, etc.). The script is **gated**: any value containing `_PLACEHOLDER`, `REPLACE_ME`, or `XXXX` stays fully dormant — no script loads, no events fire, no console errors. So today these platforms receive **nothing**.

The placeholder object (`pixels.js:39-49`):

| # | Key (`pixels.js` line) | Placeholder value | Real value needed | Source |
|---|---|---|---|---|
| 1 | `metaPixel` (`:43`) | `META_PIXEL_ID_PLACEHOLDER` | 15–16-digit Pixel ID | Meta Events Manager |
| 2 | `googleAds` (`:41`) | `GADS_CONVERSION_ID_PLACEHOLDER` | `AW-##########` | Google Ads → Goals → Conversions |
| 3 | `googleAdsLabel` (`:42`) | `GADS_CONVERSION_LABEL_PLACEHOLDER` | per-action label string | Google Ads (same screen) |
| 4 | `linkedinPartner` (`:44`) | `LI_PARTNER_ID_PLACEHOLDER` | partner ID | LinkedIn Campaign Mgr → Insight Tag |
| 5 | `linkedinConv` (`:45`) | `LI_QUALIFIER_CONVERSION_ID_PLACEHOLDER` | conversion ID (qualifier-complete) | LinkedIn → Conversions |
| 6 | `linkedinBookConv` (`:46`) | `LI_BOOKING_CONVERSION_ID_PLACEHOLDER` | conversion ID (calendly-booked) | LinkedIn → Conversions |

**Those are the 6 dormant IDs.** Two extra channels are also stubbed and dark but out of current scope: `tiktokPixel` (`:47`, `REPLACE_ME_TIKTOK_PIXEL_ID`) and `snapPixel` (`:48`, `REPLACE_ME_SNAP_PIXEL_ID`).

**The event wiring itself is built and correct** — once IDs go in, conversions fire automatically. Three stages exist (`pixels.js:151-192`):
- `efficioTrackQualifierStart` → Meta `Lead`, GA4 `qualifier_started`
- `efficioTrackQualifierComplete` → Meta `CompleteRegistration`, Google Ads `conversion`, LinkedIn qualifier conv, GA4 `generate_lead` (called as `sendConversion` in `audit-quiz.html:1229,1352,1402` and `qualify.html:392`)
- `efficioTrackBooking` → Meta `Schedule`, Google Ads `conversion`, LinkedIn booking conv — auto-fired on Calendly's `calendly.event_scheduled` postMessage (`pixels.js:227-236`)

So the **plumbing is ready; only the IDs are missing.** Swapping the 6 strings to real values "lights up" the entire 53-page funnel at once.

**⚠ Stale source-of-truth to fix:** `marketing-brief.html:184-191` claims the **LinkedIn Insight Tag is live (`9123490`)** and that only two IDs are placeholders. That is **wrong** — `pixels.js` shows LinkedIn still on placeholders and 5 of 6 IDs dark. The brief also contradicts itself on ownership: it says both *"Brady to provide"* the Meta/Google IDs (`:188-189`) and *"Modrn: drop the two missing IDs"* (`:192`). **Settle who owns the IDs before accusing Modrn of withholding them.**

---

## 3. What blocks measurable paid spend, end-to-end

Two layers must both be working before spend is justified. Today neither is fully there.

**Layer A — Tracking (5 of 6 signals dark).** Covered above. With only GA4 live, Meta/Google/LinkedIn get no qualifier or booking events. Their algorithms can't optimize toward conversions and you can't attribute or measure cost-per-booked-call. **Spend here is flying blind.**

**Layer B — Capture / funnel / booking (fix written, NOT deployed).**

- **Lead capture (was leaking).** Every quiz/email POSTs to your own Cloudflare Worker `efficio-chat.bgay3500.workers.dev/quiz` (`audit-quiz.html:1212,1332,1382`; `qualify.html:264`). The earlier diagnostic found `quiz_submissions.jsonl` empty — the Worker received posts but never durably persisted them.
- **Booking record (was structurally missing).** A completed Calendly booking only fired a *client-side pixel* — nothing wrote a booking record, so the post-booking daemon ran 100+ cycles capturing **0 bookings.**
- **The fix exists but is staged-not-deployed.** The rewritten Worker (`cloudflare-chat/src/worker.js`) now adds durable KV persistence and routes `POST /quiz`, `POST /booking` (accepts both a Calendly webhook and a client beacon), and token-guarded `/export/*`. The matching client beacon `efficioRecordBooking` → `POST /booking` is added in `pixels.js:206-236`. **However:**
  - The `pixels.js` change is **uncommitted** in the `website` working tree (not in the deployed HEAD).
  - `cloudflare-chat/` is **not even a git repo** and has **never been deployed** — `wrangler.toml` still has `id = "REPLACE_WITH_LEADS_KV_ID"`, i.e. the **KV namespace doesn't exist yet**, and the README says *"DO NOT `wrangler deploy` without explicit approval — this is LIVE infra."*
  - So until you (a) create the KV namespace, (b) set secrets, (c) deploy the Worker, and (d) commit/deploy the `pixels.js` beacon, **captured leads and bookings still don't persist.**
- **Booking still on interim Calendly.** `book.html` and `audit-quiz.html` swap points await Modrn's GHL embed. Calendly currently resolves and is bookable, but a flaky inline embed can silently block a booking (the suspected cause of the lost Mike/Waymaker lead). Consider making the visible "Open in new tab" button the primary path.

**Net blocker chain for measurable spend:** real IDs in `pixels.js` → deploy site → KV namespace + Worker deployed → `pixels.js` booking beacon committed/deployed → booking webhook (Calendly now / GHL later) → verified test conversion appears in each ad platform **and** a row lands in KV. Only then is a dollar of spend measurable end-to-end.

---

## 4. Concrete, sequenced go-live plan

Legend: **🔑 = requires YOUR login/credentials** · **🛠 = can be prepped/done now without external creds.**

### Phase 0 — Decide ownership & get access (blocks everything)
1. 🔑 **Confirm whose ad accounts run the ads** (Efficio's vs. Modrn's Meta Business Manager + Google Ads + LinkedIn). Get admin/standard access either way.
2. 🔑 **Resolve the IDs-ownership contradiction** in `marketing-brief.html` — decide if you or Modrn create the pixels/conversions. (Recommend: **you own the pixels** on your own Business/Ads accounts so you keep the data and aren't locked to an agency.)

### Phase 1 — Stand up tracking (the 6 IDs)
3. 🔑 In **Meta Events Manager**, create/locate the Pixel → copy the 15–16-digit ID.
4. 🔑 In **Google Ads**, create a "Book a call" + "Qualified lead" conversion action → copy the `AW-…` ID and the per-action label.
5. 🔑 In **LinkedIn Campaign Manager**, get the Insight Tag partner ID and create two conversions (qualifier-complete, booking) → copy all three IDs.
6. 🛠 **Drop the 6 values into `pixels.js:41-46`** (single find/replace; the gate auto-activates each one). I can stage this edit for you the moment you paste the values — no spend, just wiring.

### Phase 2 — Deploy the capture backend (stop the leak)
7. 🔑 **Create the KV namespace** (`wrangler kv namespace create LEADS` + preview) and paste IDs into `cloudflare-chat/wrangler.toml`.
8. 🔑 **Set secrets** (`wrangler secret put ANTHROPIC_API_KEY`, `EXPORT_TOKEN`).
9. 🔑 **Deploy the Worker** (`wrangler deploy`) — explicitly gated by the README; your approval required.
10. 🛠 **Commit + deploy the `pixels.js` booking-beacon change** to the live site (currently uncommitted).
11. 🔑 **Wire the booking webhook** — add a Calendly webhook (now) to `POST /booking`, to be swapped for GHL later.

### Phase 3 — Verify measurability (do this BEFORE any spend)
12. 🛠 **End-to-end test:** run a real quiz completion + test booking; confirm (a) Meta/Google/LinkedIn each register the test conversion (Events Manager / Google Ads diagnostics / LinkedIn), and (b) a row appears in KV via `/export/quiz` and `/export/bookings`.
13. 🛠 **Fix the stale `marketing-brief.html`** to match reality (LinkedIn not live; correct ID ownership).
14. 🛠 **Optional hardening:** make the visible Calendly button the primary booking path so a flaky embed can't silently block a booking; wire `efficioTrackQualifierStart` on first quiz interaction (currently only complete/booking fire).

### Phase 4 — Launch (separate, explicit approval)
15. 🔑 Fund the ad account, build the campaign from the brief below, and launch. **Out of scope for this audit — not to be done without your explicit go.**

**What's ready now:** the entire event-firing layer (53 pages), the quiz logic/scoring/tier routing, the rewritten Worker code, vertical landing pages, GA4. **What's missing:** the 6 real IDs (🔑), KV namespace + Worker deploy (🔑), the committed booking beacon (🛠), the booking webhook (🔑), and a verified test conversion (🛠).

---

## 5. Prioritized blocker list

1. **[CRITICAL · 🔑] No real ad accounts confirmed/accessible.** Resolve Efficio-vs-Modrn ownership; get admin access. Nothing else matters until this is settled.
2. **[CRITICAL · 🔑] 5 of 6 conversion IDs dormant** (Meta, Google ID+label, 3× LinkedIn). Until real values replace the placeholders in `pixels.js:41-46`, paid spend is unmeasurable.
3. **[CRITICAL · 🔑] Capture/booking backend not deployed.** KV namespace doesn't exist; Worker never deployed; `pixels.js` beacon uncommitted. Converted clicks can be lost with no record.
4. **[HIGH · 🔑] No server-side booking webhook.** Even after deploy, bookings need a Calendly (now) / GHL (later) webhook into `POST /booking`.
5. **[MEDIUM · depends on Modrn] GHL booking embed not shipped.** Swap points still on interim Calendly; verify embed reliability or promote the new-tab fallback.
6. **[LOW · 🛠] Stale `marketing-brief.html`** falsely says LinkedIn is live and contradicts itself on ID ownership — fix to prevent bad decisions.

---

## 6. Starter campaign brief — DRAFT ONLY (do **not** launch)

> Drafted for planning. No account is funded, no campaign created. Launch is Phase 4 and requires your explicit approval **after** Phase 3 verification.

**Objective:** Booked 15-min AI-audit calls (the funnel's `efficioTrackBooking` event) from home-services SMB owners. Optimize to **booking**, with qualifier-complete as the secondary/learning signal.

**Recommended platform(s):**
- **Primary: Meta (Facebook + Instagram) Advantage+ / lead-to-site.** Home-services SMB owners (HVAC, plumbing, roofing, electrical, cleaning, landscaping, pest) are reachable and cheap on Meta, and the offer is emotionally legible in-feed. Best CPA for this audience.
- **Secondary: Google Search** on high-intent terms ("AI receptionist for HVAC," "answering service for plumbers," "AI for [trade] business"). Lower volume, higher intent, captures demand Meta creates.
- **Hold LinkedIn** for a later B2B test — IDs are wired but the home-services owner audience indexes lower there; don't split a small starter budget three ways.

**Audience / targeting (home-services SMBs):**
- **Meta:** US, age 30–60, broad + interest/behavior layer on small-business-owner, HVAC/plumbing/contractor/home-services audiences, "admins of a business page." Lean on Advantage+ broad targeting and let the (now-live) pixel optimize. Exclude existing leads/customers.
- **Google:** exact/phrase keywords per trade; negative-keyword "jobs/salary/courses/free." Geo: US (or your serviceable footprint).
- Use the existing **vertical landing pages** as ad destinations — `/landings/hvac.html`, `/plumbing.html`, `/roofing.html`, `/electrical.html`, `/cleaning.html`, `/landscaping.html`, `/pest.html`, plus the `/for/home-services.html` hub. Match ad → landing → quiz per trade for relevance and Quality Score.

**Budget range (starter test):**
- **$50–100/day total** (~$1,500–3,000/mo), ~70% Meta / 30% Google, for a **2–3 week learning test**.
- Rationale: at a target ~$50–150 per booked call, that buys enough conversions to exit the learning phase without overspending blind. **Do not scale until Phase 3 shows conversions landing in both the ad platform and KV.**

**Ad angles (tied to the offer — Day-7, no upfront, don't-pay-if-it-fails):**
1. **"Stop missing calls. Your AI team answers in 7 days."** — Lead with the Day-7 promise. Pain = missed calls/leads while on a job; promise = first agent live in a week. CTA: free 15-min audit.
2. **"Don't pay if it doesn't work."** — Lead with the risk-reversal (no upfront, Day-30 refund if the metric doesn't move). Disarms the "another AI tool" objection. CTA: see what we'd build, free audit.
3. **"You hire the AI team — you don't learn the software."** — Positioning against DIY tools: ~25 min of setup, zero ongoing data entry, we run it. Speaks to time-poor owners. CTA: book the audit.

Creative: short founder-to-camera or simple text-on-brand; one angle per ad set so the (newly live) pixel can attribute cleanly.

---

*Guardrails honored: no money spent, no campaign launched/modified, no ad settings changed, no credentials entered. Audit, plan, and draft only.*
