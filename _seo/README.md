# SEO & AEO agent for efficio.tech

A Claude Code agent that finds the one page where better rankings turn into more bookings, takes it apart
for Google and AI answers, and runs a weekly one-change-at-a-time loop. It recommends; a human approves and publishes.

**The rule that decides whether any of this is worth doing:** rankings only count if the page converts.
Every judgment here is made on organic `book_call` / `generate_lead` (GA4), not on impressions.

## What's in the folder

The leading underscore matters: GitHub Pages builds this repo with Jekyll, which skips `_`-prefixed
paths, so the brief, log and conversion numbers are never served on efficio.tech. Don't rename it.

| File | What it is |
|---|---|
| `CLAUDE.md` | Standing rules the agent loads automatically when started in this folder |
| `BRIEF.md` | The business, the offer, who buys, what counts as a conversion, known tracking gaps. **Edit this the most.** |
| `state.json` | Baselines per page, the current bet, the change being measured |
| `LOG.md` | Append-only history: what the numbers said, what changed, when it went live |
| `prompts/` | `find-money-page.md`, `page-checkup.md` (four passes), `weekly-loop.md` |
| `scripts/` | Stdlib-only Python: Search Console, GA4, PageSpeed, URL Inspection, DataForSEO, Firecrawl, Parallel |
| `hooks/guard_publish.py` | Approval gate: pushes, merges, URL/sitemap submissions, CMS writes and any edit outside `_seo/` stop and ask |
| `.claude/settings.json` | Wires the hook, pre-approves the read-only scripts, blocks reading `.env` |
| `reports/` | Candidate tables, money-page picks, checkups (committed) |
| `data/` | Raw daily pulls (gitignored) |

Start Claude Code **from inside `_seo/`** so `CLAUDE.md`, the settings and the hook apply. They don't affect
normal site work started from the repo root.

## Connections (one sitting, once)

Copy `.env.example` to `.env` and fill it in as you go.

1. **Google Search Console + GA4** (required). In the Google Cloud console: create a project, enable
   *Google Search Console API* and *Google Analytics Data API*, create an OAuth client of type **Desktop app**.
   Put the ID/secret in `.env`, then run `python3 scripts/google_auth.py` once and paste the refresh token it
   prints. Your Google account needs access to the GSC property and the GA4 property.
   `GA4_PROPERTY_ID` is the numeric property ID (Admin → Property details), not `G-62FVTS6S1Z`.
2. **DataForSEO** (required). Leave `DATAFORSEO_MODE=sandbox` for the first runs: sandbox returns fake data in
   the real shape and costs nothing, so the agent learns the format before it touches the budget. Switch to
   `live` yourself; `DATAFORSEO_MAX_CALLS` caps spend per call.
3. **Firecrawl** (required): reads competitor pages in full so the agent quotes them instead of guessing.
4. **Parallel** (recommended): web search for where the topic and the brand get discussed off-site.
5. **PageSpeed Insights**: works without a key at low volume; add one if you hit limits.
6. **Ahrefs** (optional): only if you already pay for it. Connect its MCP server; used for backlink checks.
7. **Bing Webmaster Tools** (optional): its AI Performance report lists which pages get cited in AI answers.
   No API script here; export it into `data/bing/` when you want it considered.

Check: `python3 scripts/gsc_pull.py --days 3 && python3 scripts/ga4_conversions.py --days 3 && python3 scripts/candidates.py --days 3`

Before the first real run, confirm in GoHighLevel that the booking calendar redirects to
`https://efficio.tech/thank-you.html` after a booking. Several CTAs link straight to the GHL widget, and that
redirect is the only way those bookings reach GA4 (see BRIEF.md).

## Scheduling the weekly run

**Desktop scheduled task (recommended; it can stop for approval):** Claude Code desktop → *Scheduled* → new task.
- Folder: this `_seo/` folder
- Model: the strongest available (Opus). The loop is judgment calls about which page deserves the week.
- Schedule: weekly, Monday morning
- Permission mode: **Default / ask**, the mode that stops and waits when it hits something it isn't allowed to do.
  That pause is the approval step. Don't use a bypass mode.
- Instructions: `Follow prompts/weekly-loop.md.`

Each run opens as a fresh session you can review.

**Cloud routines** run unattended and don't stop for approval. If you use one, give it read-only work only
(pull data, write a report) and never credentials that can push, merge or publish.

## First four weeks

| Week | What happens |
|---|---|
| 1: connect & baseline | Connect everything above, with spend caps and the hook in place before the first real run. Review BRIEF.md. Confirm `book_call` and `generate_lead` fire (GA4 → Realtime while you take the quiz / book a test call). Pull history: `gsc_pull.py --days 90`, `ga4_conversions.py --days 90`. |
| 2: pick & inspect | Run `prompts/find-money-page.md`, then `prompts/page-checkup.md` on the pick. Read the report and push back on anything without a source. Agree on the one change to make first. |
| 3: ship | The agent drafts the change (the hook asks before it edits the page). You review the diff for voice, then publish it yourself. LOG.md records the date and exactly what moved; `state.json.active_change` starts the clock. |
| 4: loop | Schedule the weekly task. Give the change 4+ weeks before calling it a win or a miss, on bookings first. |

After that: the next change on the same page, or the next money page. One decision a week.

## Sanity checks
- `python3 hooks/test_guard_publish.py`: the approval gate asks exactly when it should.
- Wins and misses are judged on conversions. Rankings up with no extra bookings = miss.
