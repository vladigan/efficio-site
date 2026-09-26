# Brief — what this site sells and what counts as a win

The agent reads this first on every run. It can only judge a page as well as it understands
what the page is supposed to sell. **Edit this file whenever the offer, pricing or funnel changes.**

## The business

Efficio (efficio.tech) is a **fractional CTO for small and mid-sized service businesses**. We plug into
the apps the business already uses (CRM, phone, inbox, booking) and build and run a coordinated
team of AI agents: front office (answering, lead routing, missed-call text-back, booking), growth
(follow-up cadences, reactivation), back office (onboarding, invoicing reminders, status updates).
We build it, we run it. The customer does no technical setup.

## The offer (keep in sync with pricing.html)

| Tier | Price | Who it's for |
|---|---|---|
| AI Operator | $1,500/mo | Entry tier, most common start. First AI team live in 7 days. Free website build included. |
| Founding CTO | $2,500/mo | Several workflows, embedded fractional CTO. |
| Full Custom CTO | $3,500/mo | Full custom build across the ops stack. |

Month-to-month, no contract. **30-day measurable-savings refund**: one agreed metric, refunded if it hasn't moved by day 30.
"First team live within 7 days of kickoff."

## Who buys

Owner-operators of US service businesses, usually 3–50 staff, where the owner is still the
bottleneck on phones, inbound and follow-up. Verticals with dedicated pages: home & field
services (HVAC, plumbing, electrical, roofing, landscaping, cleaning, pest), health practices
(dental, medical, wellness), professional services (law, accounting, insurance, real estate), agencies.

They search when something is actively costing them money: missed calls, slow lead follow-up,
no-shows, after-hours leads, drowning in admin. Those **"ready to act" queries** are the target.
Curiosity queries ("what is an AI agent") are supporting content, not money pages.

## What counts as a conversion

Conversions are GA4 events fired by `assets/pixels.js` (GA4 property `G-62FVTS6S1Z`):

| Event | Fired when | Weight |
|---|---|---|
| `book_call` | Booking confirmed: `thank-you.html` loads (GHL calendar redirect) or the GHL widget posts a booked message | **Primary**: this is the sale-qualified step |
| `generate_lead` | Fit quiz (`find-your-tier.html`) shows a tier result after email capture | Secondary: a lead, not a booking |

`book_page_view` and `conversion_thank_you` also exist but are funnel diagnostics, not conversions.

Only **organic** sessions count for this work (GA4 channel group "Organic Search"), attributed to
the session's **landing page**. A page that ranks but never starts a session that books or leads is not a win.

### Known tracking gaps (check these before trusting a zero)

- Pages that don't load `assets/pixels.js` record no sessions or conversions at all. As of 2026-09-23
  every money and supporting page loads it (the four `/for/*` hubs were fixed that day). Still untagged:
  `privacy`, `terms`, `refund`, `audit.html`, `demo-live`, `demo-embed`. None of them is a money page, but an organic
  session that lands there and books later is attributed to "(not set)".
  Re-check with `grep -L pixels.js` on any new page.
- Several CTAs link **straight to the GoHighLevel booking widget** (`api.leadconnectorhq.com/widget/booking/...`)
  instead of `/book.html`. Those bookings only count if the GHL calendar's post-booking redirect points to
  `https://efficio.tech/thank-you.html`. If `book_call` is ~0 sitewide while GHL shows bookings, that redirect is the cause.
- Search Console property: set in `.env` as `GSC_SITE`. Canonicals are extensionless (`/for/agencies`),
  the sitemap uses `.html`; scripts normalise both to one key.

## Pages and their jobs

- **Money pages** (have a direct next step: quiz or booking): `/`, `/pricing`, `/find-your-tier`, `/book`,
  `/for/home-services`, `/for/health-practices`, `/for/professional-services`, `/for/agencies`, `/services`, `/how-it-works`.
- **Supporting pages** (answer a question on the way to buying, must link to a money page):
  `/resources/*`, `/blog/*`, `/agents/*`.
- **Never touch**: `/landings/*` (noindex paid-traffic pages), `/c/*`, `/onboarding*`, `/kickoff-form`, `/thank-you`,
  `/success`, `/cancel`, redirect stubs (meta-refresh pages).

## Voice and things we never say

- Plain, direct, owner-to-owner. "We build it and run it." No hype words ("revolutionary", "cutting-edge").
- Never invent customer results, testimonials, logos or numbers. Illustrative scenarios are labelled "hypothetical".
- Never promise rankings, revenue, or a specific number of leads.
- Prices, the 7-day claim and the 30-day refund must match pricing.html exactly.
- Business details (name "Efficio", domain efficio.tech, pricing) must be identical everywhere, on-site and off.

## Current bet

_None yet. Week 2 of the plan fills this in: one page, one main query, and the written reason it's the bet._
