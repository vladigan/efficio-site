# Brief — what this site sells and what counts as a win

The agent reads this first on every run. It can only judge a page as well as it understands
what the page is supposed to sell. **Edit this file whenever the offer, pricing or funnel changes.**

## The business

_Rewritten 2026-10-22 to match the Efficio Brain, section 1. Where anything here disagrees with the Brain, the Brain wins._

Efficio (efficio.tech) is a **fractional AI CTO for any business**; the target market is small and mid-size,
owner-led businesses. It connects every app a business runs on to one live CEO dashboard, puts AI agents and
custom automations to work across them, and builds whatever else the business needs. Brady, the founder, is the
CTO who designs, builds and runs it, inside the client's own Efficio account at app.efficio.tech.
The customer does no technical setup. Public copy says "built with real engineering".

The pitch in one line: **every app, every agent, one CEO dashboard.** The owner stops logging into a dozen apps
and checking five inboxes.

How we talk about it: lead with the whole offer (the dashboard, the AI agents doing named jobs, and the CTO who
builds and runs it). The AI receptionist is one agent among many: mention it, if at all, inside a list, never in a
title, meta description, h1, opening paragraph or hook. Don't build pages around missed calls.

## The offer (keep in sync with pricing.html)

Every plan starts with the front office agents (AI receptionist for forwarded calls, website chat, booking and
reminders, no-show rebook email, review requests; missed-call text-back once texting registration is approved).
On top: custom AI agents (quoting, intake, triage, billing follow-up), workflows and automations, integrations
(Stripe, QuickBooks, Google, Microsoft 365, Slack, the client's CRM and other apps with an API), a file drop folder
in the client's Google Drive or SharePoint that AI sorts, a custom dashboard with read-only "Ask Efficio", and
ongoing engineering.

| Plan | Price | What it adds |
|---|---|---|
| AI Operator | $1,500/mo + $500 setup | Front office agents, live dashboard, 2 h tuning + 1 new automation a month, monthly review call. |
| Founding CTO | $2,500/mo + $500 setup | Everything in AI Operator + a custom AI agent (quote, intake or triage), custom dashboard over live data with "Ask Efficio", a call every two weeks. |
| Full Custom CTO | $3,500/mo + $500 setup | Everything in Founding CTO + ongoing custom engineering (agents, automations, integrations), weekly call, 24-hour response. |

Month-to-month, 30 days' notice. The only promise: live within 7 business days of kickoff or the $500 setup is
refunded (kickoff within 2 business days of payment; forwarding + calendar access by day 5; texting excluded).
No results-based refund. First three clients: monthly price locked 12 months in exchange for a 20-minute results
review at day 30. No clients, case studies, reviews or results exist; never invent them.

## Who buys

Owner-led US businesses with about 5-50 staff, 50+ calls or leads a month and jobs worth $500+, in any industry.
Best fit for content: home services and trades, law, accounting, property management and real estate, then the rest.
Not for: jobs under $500, anyone who wants outbound robocalls or cold texting, or practices whose calls involve
patient health information. US only.

They search when the office work is the bottleneck: too many apps and inboxes, quotes and leads that go cold,
invoices nobody chases, scheduling chaos, no clear weekly numbers, "AI for <my industry>". Those **"ready to act"
queries** are the target. Curiosity queries ("what is an AI agent") are supporting content, not money pages.

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
- Prices, the $500 setup and the 7-business-day setup promise must match pricing.html exactly. Every booking CTA links to `/book.html`, never straight to the booking widget.
- Business details (name "Efficio", domain efficio.tech, pricing) must be identical everywhere, on-site and off.

## Current bet

_None yet. Week 2 of the plan fills this in: one page, one main query, and the written reason it's the bet._
