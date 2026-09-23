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
