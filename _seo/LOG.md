# Log

Append-only. Every run adds one entry at the bottom; nothing above is ever edited or deleted.
Each entry: date, run type, what the numbers said (with the window), what was decided and why,
what changed on the site (file + exact change + date live), and sources (URLs / data files).

---

## 2026-09-23: setup (human + Claude Code)

**Run type:** setup, no data pulled yet.

**Tracking fixes shipped with the setup, before any baseline exists:**
- `for/agencies.html`, `for/health-practices.html`, `for/home-services.html`, `for/professional-services.html`:
  added `<script src="/assets/pixels.js"></script>`. These four sitemap pages had **no analytics at all**, so any
  organic session landing there was invisible to GA4 and could never be credited with a booking or lead.
  Expect their GA4 organic sessions to jump from 0 once live. That's measurement starting, not an SEO win.
- `sitemap.xml`: removed `agents/marketing-coordinator.html` and `agents/onboarding-specialist.html`. Both are
  noindex meta-refresh redirect stubs; listing them sends Google mixed signals.
- `pricing.html`, `audit.html`: repaired double-encoded UTF-8 introduced by the W323 metadata commits
  (every `—` rendered as `â` plus two invisible control characters, including inside `<title>`, `og:title`, `twitter:title` and JSON-LD on pricing).
  The pricing title is what shows in Google's results.

**Not changed, flagged for the brief:** several CTAs link directly to the GHL booking widget; bookings from them only
count if the GHL post-booking redirect goes to `/thank-you.html`. Confirm that in GHL before trusting `book_call`.

**Next:** week 1: connect GSC, GA4, DataForSEO (sandbox), Firecrawl and Parallel; pull 90 days of GSC history.

---

## 2026-10-22: weekly rewrite (SEO & AI Search agent, first run)

**Run type:** weekly rewrite. No Search Console / GA4 data pulled (paid-API scripts not run by design).

**Setup (first run):** built `seo_agent.rewrite_queue` in `state.json` from the sitemap pages whose title, meta
description or h1 led with the receptionist, missed calls, voicemail, answering service, after-hours calls or
"never miss" (17 pages; trades first, then law, real estate, dental, then general resources; `resources/index.html`
skipped as a listing page; the sitemap lists no `for/` pages). Rewrote "The business", "The offer" and "Who buys"
in `BRIEF.md` to match Efficio Brain section 1 (fractional AI CTO, one CEO dashboard, AI agents; receptionist is one
agent among many) and swapped two leftover words on line 71 ("guarantee" -> "promise", "HighLevel widget" ->
"booking widget"). Added `/llms.txt` (summary, plans and prices as on pricing.html, key pages, 28 sitemap articles).

**Pages changed (URLs, file names and canonicals unchanged; head scripts/styles, nav and footer untouched):**
- `blog/ai-for-hvac-businesses.html`: was "AI for HVAC businesses: the 3 places you're leaking revenue" (missed calls
  first). Now "AI for HVAC Companies: AI Agents + One Dashboard", targets "AI for HVAC companies": agents by job
  (estimate follow-up, invoice chasing, scheduling, intake, weekly numbers, paperwork, front office in a list),
  dashboard, fractional AI CTO, plans, limits, 5 owner questions, CTA "Book a free 30-minute AI audit" -> /book.html.
- `blog/ai-team-for-plumbing-businesses.html`: was "AI for Plumbers: Stop Sending Emergency Calls to Voicemail".
  Now "AI for Plumbing Companies: Agents + One Dashboard", targets "AI for plumbing companies" / "AI for plumbers":
  intake and triage, quote follow-up, invoices, scheduling, weekly numbers, paperwork; removed BLS statistics and the
  missed-calls calculator CTA.
- Both: og/twitter tags updated, Article JSON-LD headline/description/dateModified 2026-10-22, new FAQPage JSON-LD
  matching the on-page questions word for word. `sitemap.xml` lastmod 2026-10-22 for both. `blog/index.html` cards
  for both updated; the real estate card's headline shortened to "AI for Real Estate Agents" (it is queued).

**Checks run:** html.parser on every changed HTML file; json.loads on every JSON-LD block; FAQPage questions =
on-page h3 questions; every internal href resolves to a file in the repo; titles 58/59 chars, descriptions 142/145;
no receptionist / missed calls / voicemail / after-hours in title, description, h1 or first paragraph; grep for
"$0 upfront", "pay only if", "guarantee", "HighLevel", "GoHighLevel", "leadconnectorhq", "msgsndr", "never miss a
lead", "10x" and competitor names on all changed files: clean. sitemap.xml parses as XML.

**Next:** `blog/how-hvac-owners-use-ai-to-never-miss-a-call.html` and `resources/ai-for-home-services.html`
(differentiate the second HVAC page from "AI for HVAC companies", e.g. HVAC dispatch and office automation).
