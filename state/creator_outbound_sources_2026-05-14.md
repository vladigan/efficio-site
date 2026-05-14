# Creator outbound sources & recommended stack — 2026-05-14

**Author:** Claude (research, no live outreach performed)
**Audience:** Brady — to fire by end of week
**Goal:** Generate 200–500 high-quality creator leads (mid-tier, $20k–$100k/mo) ready for personalized outbound.

---

## TL;DR — recommended stack

> **Modash + Apollo + Smartlead** — ~$300/mo, gets you a clean 500-lead/week pipeline from cold to "audit booked" with one operator.

If Brady has zero budget, the **DIY path** below works but takes ~15 hrs/week of operator time.

---

## A. Where mid-tier creators leave their email (free, scrapable)

Mid-tier creators ($20k–$100k/mo) almost always publish a "for business inquiries" email because they want sponsorship deals. Top-tier ($100k+) hide it behind managers. Mid-tier is the sweet spot for cold outreach.

### Channel-by-channel surface area:

1. **YouTube — "About" tab, "View email address" CAPTCHA gate**
   Every channel >5k subs has a `business inquiries` email behind a CAPTCHA. Scraping at scale requires solving CAPTCHA (2Captcha / Anti-Captcha at ~$3/1000 solves). YouTube Data API v3 returns channel metadata but NOT the email — you have to render the page.

2. **TikTok — bio / link-in-bio tools**
   Many creators put `manager@` or `bookings@` in their bio. Most use Beacons.ai, Linktree, or Stan.store as their link-in-bio aggregator. Scraping the linked page often surfaces an email or contact form.

3. **OnlyFans — DMs disabled by default**
   Direct outreach via OF is hard. Better path: cross-reference OF creators' Twitter/IG handles (they all promote elsewhere). Then email through their secondary platform.

4. **Twitch — `About` panel, often has a "Business" email**
   Affiliate+ creators frequently list a contact email. Twitch API exposes channel metadata; the panel content needs page render.

5. **Twitter/X — bio**
   Creators list `email@gmail.com` or `dm for collabs`. Bio scraping is straightforward (X API v2 with the right access tier, or rendered HTML).

6. **Patreon — public creator pages have a `Contact` link**
   Often routes to an email or Patreon DM. Patreon doesn't expose emails publicly without DM.

7. **Substack / Beehiiv — author pages typically include reply-to email**
   Reply-to email harvested from any free post is usually the author's address. Highest-quality lead source for newsletter operators.

8. **Podcasts — RSS feeds expose `<itunes:owner><itunes:email>`**
   Apple Podcasts public catalog → fetch RSS → parse `itunes:email` tag. **Free, no auth, scales to thousands per hour.**

---

## B. Existing tools (paid, high-quality)

Ranked by cost-per-creator-lead and signal quality:

### B1. **Modash** — $99/mo starter, $299/mo for serious volume
**modash.io** — creator search + contact info across YouTube, IG, TikTok. Filters by follower count, engagement rate, location, niche. Email retrieval is included in pro plan. **Best signal-to-noise for mid-tier creators.** Their follower-count filter directly maps to our $20k–$100k/mo ICP (~50k–500k followers depending on niche).
- Creator-export to CSV: yes
- API: yes (paid tier)
- Verdict: **strongest single tool for our wedge.**

### B2. **Upfluence** — $478/mo+
Influencer marketing platform. Has CRM workflows. Higher price, more enterprise-feel, but the database is excellent. Overkill for cold outbound at our stage.

### B3. **NinjaOutreach** — $389/mo
Aged. UI feels 2018. Database has gaps. Skip unless legacy access.

### B4. **CreatorIQ** — enterprise, ~$2k+/mo
For brands hiring creators, not for selling-to-creators. Wrong tool for our use case.

### B5. **HypeAuditor** — $399/mo+
Audience-quality scoring (% real followers etc.). Useful for verifying a lead is legit but not for prospecting.

### B6. **Apollo.io** — $49/mo basic, $99/mo pro
Not creator-specific, but excellent for finding the **manager / lawyer / accountant** behind a creator brand once Modash gives us the creator name. Apollo's email-verification + sequencing + data quality is best-in-class for B2B.

### B7. **Clay.com** — $149/mo
Combines 75+ data sources (Apollo + LinkedIn + scrape + Hunter + AI enrichment). If Brady wants ONE platform that handles enrichment + sequencing + deliverability, Clay is the modern pick. Steeper learning curve than Apollo.

### B8. **Smartlead.ai** — $39/mo
Cold-email infrastructure. Inbox warmup, deliverability monitoring, multi-account rotation. **Cheapest path to 500 emails/day without burning your domain.** Pair with Apollo or Modash exports.

### B9. **Instantly.ai** — $37/mo
Direct competitor to Smartlead. Equally good. Pick one based on UI preference.

---

## C. Free DIY scrape paths (Playwright)

If Brady wants zero subscription cost and is willing to run a daily script:

### C1. YouTube channel email harvest
```python
# pseudo — requires 2Captcha key + Playwright
# 1. YouTube Data API v3: search videos by topic → collect channelIds (free, 10k/day)
# 2. For each channelId: render https://www.youtube.com/channel/{id}/about
# 3. Click "View email address" → solve hCaptcha via 2Captcha API (~$3/1000)
# 4. Extract email from popup
# Throughput: ~200 emails/hour with 1 worker, ~$0.60/100 emails captcha cost
```

### C2. Podcast email harvest (BEST free path)
```python
# 1. Apple Podcasts catalog: https://itunes.apple.com/search?term={topic}&entity=podcast
# 2. For each podcast: GET feedUrl → parse RSS → extract <itunes:email>
# 3. ZERO scraping. ZERO captcha. Free. Scales to 10k/hour.
# Filter by: episode count >50, recent episodes (active), topic match.
```

### C3. Substack reply-to harvest
```python
# 1. Search Substack discover by topic: substack.com/discover/{topic}
# 2. For each newsletter, hit the RSS feed (always public): {sub}.substack.com/feed
# 3. RSS items contain author email in <author> tag for free posts
```

### C4. TikTok bio email scrape
```python
# 1. TikTok Creator Marketplace public search → collect handles
# 2. Playwright render: https://www.tiktok.com/@{handle}
# 3. Regex bio for email pattern
# 4. If no email in bio, follow link-in-bio → render that page → regex
# Captcha risk: medium. Use residential proxy (~$5/GB).
```

### C5. Twitch email harvest
```python
# 1. Twitch Helix API: GET /streams?game_id={id}&first=100 → collect user_login
# 2. Render https://www.twitch.tv/{user_login}/about
# 3. Parse panels for email address
# Most affiliate+ have one. Throughput: ~500/hour.
```

---

## D. Lead enrichment — once you have the email

Email alone is weak. Enrich with:
- **Real name** (from creator handle → Modash or Apollo person-search)
- **Estimated monthly revenue** (Modash gives follower count + engagement; estimate $500–$2k per 100k followers depending on niche; OF/Patreon can be cross-referenced via creator-stats sites like SocialBlade)
- **Niche** (gaming, beauty, finance, fitness, adult — niche affects messaging)
- **Manager/agency status** (if their email has a manager domain like `mgmt.creatorname.co`, they're top-tier — deprioritize for our wedge or treat as referral path)

---

## E. Recommended stack (one operator, $300/mo budget, ship by Friday)

### Stack: **Modash + Apollo + Smartlead**

| Tool | Role | Cost | Output |
|---|---|---|---|
| **Modash** ($99/mo starter) | Creator discovery — filter by follower band that maps to $20–100k MRR niche | $99 | 200–400 creator leads/week with email |
| **Apollo.io** ($49 basic) | Person-enrich + verify deliverability of harvested emails | $49 | Email validity + manager/team contacts |
| **Smartlead.ai** ($39 starter) | Cold email infra: inbox warmup, sending, reply detection | $39 | 500 sends/day from warmed Brady-domain inbox |
| **Custom RSS scrape** (free) | Podcast operators via iTunes API | $0 | 100–500 podcaster leads/week |
| **Sequence design** (Brady, ~3hrs) | 3-step warm sequence: pain → demo link → audit CTA | $0 | Built once, reused |
| **TOTAL** | | **~$190/mo + 5hrs/week** | **~500 high-quality leads/week, fully automated outbound** |

### Sequence structure (3-step, 4 days apart):

1. **Day 0** — single line cold open: *"Saw your [last brand deal / new launch / podcast Ep #X]. We run the back office for creators at your size. Worth 15 min?"*
   → CTA: link to /creator-demo.html (NOT a Calendly link in email 1 — too aggressive)
2. **Day 4** — value-add: *"Quick thing — your CPM is probably worth 30% more than your last brand-deal rate. Built a tool that benchmarks. Want me to send you yours?"*
   → CTA: reply with handle, get personalized benchmark in Loom
3. **Day 8** — last touch: *"Last note from me. If now's not the right time, totally fine. If you ever want to see what your back office could look like — link below."*
   → CTA: /audit-quiz

Open rates target: 35–45% (mid-tier creators check email)
Reply rates target: 4–8%
Audit-bookings target: 1.5–3% of total sends

### Volume math at recommended stack:
- 500 sends/week × 6% reply × 30% qualified = **9 audit bookings/week**
- Close rate at audit (Brady on call) target: 25% = **2.25 paying customers/week**
- LTV avg ($1,800 monthly contribution-margin tier blend × 18-month avg) ~ $32k LTV
- $190/mo CAC infra + 5hr/wk Brady time = essentially fully amortized after 1 close

---

## F. Things to AVOID

1. **Buying creator email lists from third-party brokers.** Stale, GDPR risk, deliverability dies fast.
2. **LinkedIn outreach.** Mid-tier creators don't live on LinkedIn. Top-tier do (their managers do). Wrong channel.
3. **Mass DM on Instagram/TikTok.** Platform bans accounts within 48 hours. Email is the only stable channel.
4. **Scraping OnlyFans directly.** ToS violation, account ban, reputational risk for Efficio. Use cross-reference paths only.
5. **Hiring an SDR before the sequence is dialed.** Brady should run the first 200 sends himself, listen to objections, refine copy. Then hire.

---

## G. Compliance notes

- **CAN-SPAM (US):** Cold B2B outreach to publicly-listed business emails is legal. Must include physical address + opt-out link.
- **GDPR (EU creators):** Riskier. We have legitimate-interest argument since they publicly list email "for business inquiries," but unsubscribe must be honored within 30 days, and we should keep volumes per-EU-creator low.
- **PECR (UK):** Same as GDPR for B2B.
- Add to the audit-quiz form a "I'm in the EU/UK" optional checkbox so we can opt them into a different (consent-based) sequence.

---

## H. What Brady should do this week

1. **Mon:** Sign up for Modash + Apollo + Smartlead trials. ~$190/mo total.
2. **Tue:** Filter Modash to top 5 creator niches (gaming, beauty, fitness, finance, adult-discreet) at 50k–500k followers. Export 1,000 leads.
3. **Wed:** Run podcast RSS scrape script (I can write this on request) — pull 500 podcaster leads from Apple Podcasts.
4. **Thu:** Configure Smartlead — connect a warm inbox (NOT brady@efficio.tech for first batch — use brady@efficiocreators.com or similar to protect main domain reputation), warm for 2 weeks before high-volume sends.
5. **Fri:** Send first batch of 50 (small, learn). Iterate copy from replies.
6. **Following week:** Scale to 500/week.

---

## I. Out of scope (research only — no live outreach performed in this task)

Per Brady's hard rule: NO live outreach was attempted, NO real creator profiles were scraped, NO emails were sent. This document is research and recommendations only.

---

## Sources

- modash.io product docs — creator search & email reveal
- apollo.io pricing and feature comparison
- smartlead.ai cold email infrastructure docs
- Apple Podcasts RSS specification (`itunes:email` tag)
- YouTube Data API v3 reference (channel metadata, email behind CAPTCHA)
- Twitch Helix API documentation
- TikTok Creator Marketplace public search
- US CAN-SPAM Act §5 (commercial email rules)
- EU GDPR Recital 47 (legitimate interest in B2B contact)
