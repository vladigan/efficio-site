# Take the current bet apart: four passes

Page and query come from `state.json.current_bet`. Write everything into
`reports/checkup-<page-slug>-<date>.md`. Every finding cites a URL or a data file. Missing data is written as missing.

## Pass 1: can Google reach it, and is it fast enough
- `python3 scripts/inspect_url.py https://efficio.tech<page>`: verdict, coverage, robots, canonical
  (Google's vs ours), last crawl, indexable word count in the raw HTML.
- `python3 scripts/firecrawl.py https://efficio.tech<page>`: compare its word count with the raw count.
  A large gap means content only exists after JavaScript runs.
- `python3 scripts/pagespeed.py https://efficio.tech<page>` (mobile). Only report failures big enough to hurt
  a real visitor; prefer field data over lab data.
- Why it matters twice: a page must be crawlable, indexed and snippet-eligible before it can appear as a link
  inside Google's AI features.

## Pass 2: the competition
- `python3 scripts/dataforseo.py serp "<query>"` → take the organic top 10 URLs.
- `python3 scripts/firecrawl.py <each URL>` and read every one **in full**, side by side with ours.
  If a scrape fails, list it as "not read"; do not describe a page you haven't read.
- Output: (a) what the winners cover that we don't, (b) questions they answer that we skip,
  (c) what our page says better than all of them. Each item with the URL it came from.

## Pass 3: answer engines
- `python3 scripts/dataforseo.py aimode "<query>"`: who AI Mode cites; is efficio.tech among them?
- If the human exported Bing's AI Performance report to `data/bing/`, check whether this page is cited.
- Page structure: does the first line under each heading answer that heading? Are headings phrased the way
  people ask (use `top_queries` from state.json)? Does each section make sense read on its own?
- Off-site: `python3 scripts/parallel_search.py "Where is <topic> discussed by <buyer>?" --q "<query> reddit" --q "efficio.tech"`.
  Report places where Efficio's details are wrong or inconsistent (name, pricing, what we do), and threads
  where we're missing from a conversation we belong in. Recommend, never post.
- Schema: only if the page fits a rich result type. Don't recommend llms.txt or schema as AI-citation levers.

## Pass 4: the path from page to booking (this is the one that matters)
- Read the page as the buyer in BRIEF.md: is there one obvious next step? Does it show above the fold on mobile?
  Does the page answer the doubts right before booking (price, time to live, the refund, "do I have to set
  anything up")?
- Tracking: does the page load `/assets/pixels.js`? Do its CTAs go to `/find-your-tier.html` / `/book.html`
  (tracked) or straight to the GHL widget (tracked only via the GHL redirect)? See BRIEF.md "Known tracking gaps".
- Internal links: from `reports/candidates-*.md`, find our pages that already get organic traffic and name the
  exact paragraph where a link to this page belongs.

## Finish
Rank all fixes by expected effect on bookings (not on rankings). Recommend **ONE** change to make first,
with the evidence. Set `state.json.pages[<page>].checkup = "<report path>"`. Append to LOG.md. Stop.
