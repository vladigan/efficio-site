# Booking link swap — Calendly → GHL

**Branch:** `fix/ghl-booking-swap` (off `main`). **Not deployed.** Edits are in the working tree.
**New booking link:** `https://api.leadconnectorhq.com/widget/booking/HS90f7YhCSn6J6nB6j9T` (verified live, returns the booking widget).

## What changed (before → after)

| Old (Calendly) | New (GHL) |
|---|---|
| `https://calendly.com/brady-bngcent/efficio-ai-audit-15-min` | `https://api.leadconnectorhq.com/widget/booking/HS90f7YhCSn6J6nB6j9T` |
| `https://calendly.com/brady-bngcent/efficio-strategy-call` | `efficio.tech/book` (chat copy) / GHL link (sticky CTA) |
| Calendly inline-widget embed + `assets.calendly.com/.../widget.js` | GHL `<iframe>` + `api.leadconnectorhq.com/js/form_embed.js` |

## Files changed (36)

**Central booking page — embed swapped**
- `book.html` — replaced Calendly `calendly-inline-widget` (`data-url`) with a GHL booking `<iframe>`; swapped `assets.calendly.com/.../widget.js` → `api.leadconnectorhq.com/js/form_embed.js`; renamed CSS `.calendly-inline-widget` → `.booking-widget`; repointed "open in new tab" fallback. Swap-point comment updated.

**Audit quiz (JS-driven scheduler) — booking URL repointed**
- `audit-quiz.html`, `audit-quiz-b.html`, `audit-quiz-c.html` — `CALENDLY_URL` var now holds the GHL link (drives both the qualified-path button and the inline iframe). Var name kept to avoid touching downstream refs; comment updated.

**Plain "Book a call" CTA hrefs repointed (Calendly → GHL)**
- Landing pages (16): `landings/{accounting,auto,cleaning,construction,dental,electrical,generic,hvac,insurance,landscaping,legal,medical,pest,plumbing,realestate,roofing}.html` — 4 CTAs each.
- Vertical hubs (4): `for/{agencies,health-practices,home-services,professional-services}.html`.
- Demos (4): `demos/index.html`, `demos/hvac/index.html`, `demos/legal/index.html`, `demos/real-estate/index.html`.
- `case-studies/index.html`, `demo/index.html`.
- Blog (3): `blog/ai-receptionist-for-dental-practices.html`, `blog/best-ai-tools-for-small-law-firms.html`, `blog/how-hvac-owners-use-ai-to-never-miss-a-call.html` — href repointed **and** the visible bare-URL link text changed to "book a 15-minute call".

**JS logic + chat copy**
- `assets/transitions.js` — sticky mobile CTA now uses the GHL link; replaced the `indexOf('calendly')` branch checks with an `isBookingStage` flag so the label/new-tab logic still works.
- `assets/chat.js` — fallback chat reply now points to `efficio.tech/book`.
- `netlify/functions/chat.js` — assistant system prompt + 3 fallback replies now point to `efficio.tech/book` instead of the Calendly strategy-call URL.

## Verification
- `grep "calendly.com/brady-bngcent"` across all `.html`/`.js` → **0 results**. No booking Calendly links remain.
- New GHL URL present in all swapped CTA/embed locations.
- `book.html` booking block render-checked: single GHL iframe + form_embed.js + matching fallback link.
- GHL URL fetched → live, serves the booking widget.

## Intentionally NOT changed (non-CTA — not funnel-breaking)
These mention "Calendly" but are not booking actions; left as-is to stay in scope:
- **Internal identifiers / CSS** — `revealCalendly()`, `CALENDLY_URL` var, `#calendlyFrame`, `.calendly-frame`/`.calendly-fallback`/`.contact-calendly` classes, code comments. Cosmetic; functional.
- **Copy / integration mentions** — `agents/*.html` ("Calendly / GHL" tool lists), `onboarding.html` (client-tool checkbox), `pricing.html` (integration-examples FAQ), `process.html` ("15-min Zoom on Calendly"), `thank-you.html` (post-booking copy), `marketing-brief.html`, `demo.html`.
- **Legal** — `privacy.html` and `terms.html` list Calendly as a subprocessor.
- **Archives** — `index_v5_archive.html`, `v3-legacy.html`.

## Recommended follow-ups (separate from this fix)
1. **Conversion tracking** — `assets/pixels.js` listens for Calendly's `calendly.event_scheduled` postMessage to fire the booking conversion pixel. GHL does not emit that event, so **booking conversions will stop being tracked** until pixels.js is rewired to GHL's booking message/webhook. (Funnel works; analytics attribution is the gap.)
2. **Stale copy** — `thank-you.html` ("Calendly sent you a confirmation", "My Calendly Prep agent") and `process.html` ("15-min Zoom on Calendly") now reference a retired tool.
3. **Legal** — update the Calendly subprocessor entry in `privacy.html`/`terms.html` once Calendly is fully retired (GHL/HighLevel is already listed).

---

## PENDING — publish step (needs your login; not run)

The site is GitHub-connected (`origin` = `github.com/vladigan/efficio-site`) with Netlify auto-deploy. **Review the diff first** — the working tree also contains pre-existing, unrelated changes that predate this task, so stage selectively.

```bash
cd C:\Code\LLC\Efficio\website

# 1. Review what will ship
git diff

# 2. Stage ONLY the booking-swap files (review each — some also carry prior edits)
git add book.html audit-quiz.html audit-quiz-b.html audit-quiz-c.html \
        landings/ for/ demos/ case-studies/index.html demo/index.html blog/ \
        assets/transitions.js assets/chat.js netlify/functions/chat.js

git commit -m "Swap booking CTAs/embeds from Calendly to GHL booking calendar"

# 3. Push the branch and open a PR → merge into main → Netlify auto-deploys
git push -u origin fix/ghl-booking-swap
```

Alternative (Netlify CLI, also needs login): `netlify deploy --prod` from the site root.

After deploy: load `efficio.tech/book.html` and confirm the GHL calendar renders and a test booking goes through.
