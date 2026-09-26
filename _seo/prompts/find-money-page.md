# Find the one page worth this week

Goal: ONE page where a ranking bump turns straight into bookings, one main query, and a short written
reason with links. Not a sitewide audit.

1. Refresh data (skip days already on disk):
   `python3 scripts/gsc_pull.py --days 90` and `python3 scripts/ga4_conversions.py --days 90`
2. `python3 scripts/candidates.py --days 56`. Read `reports/candidates-<today>.md`.
   If it reports missing days, say so at the top of your answer.
3. Take the top 2–3 **CANDIDATE** rows (fall back to WATCH if there are none; say that you did).
   List **TRAP** pages separately as traps: high impressions, zero organic conversions. Do not recommend
   ranking work on them; note whether the problem looks like intent mismatch or a missing next step.
   Only look at pages in BRIEF.md's "money pages" list or supporting pages that already convert.
4. For each candidate, pick the main query (highest-impression query from `top_queries` that matches what
   the page sells), then:
   - `python3 scripts/dataforseo.py volume "<main query>" "<2-4 close variants>"`
   - `python3 scripts/dataforseo.py serp "<main query>"`
   (In sandbox mode the numbers are fake: use the run to check the format, and mark the call "not decided".)
5. Look at the live results for the main query (the SERP output). If the top spots are a different kind of
   page than ours (how-to guides vs. our service page, directories vs. our vendor page), the query wants
   something we don't sell there. No amount of tuning fixes that. Say so.
6. If Ahrefs is connected, check whether the leaders win on backlinks (referring domains to the ranking URL).
   If they do, that's an off-page job, not a rewrite; note it.
7. Give every candidate one call: **KEEP**, **KEEP IF <one condition>**, or **DROP**, each with the URLs and
   data files you looked at.
8. Write `reports/money-page-<date>.md`, and record in `state.json`:
   `current_bet = {"page": ..., "query": ..., "why": ..., "decided": "<date>"}` plus
   `python3 scripts/candidates.py --days 28 --write-baseline` so the baseline is frozen *before* any change.
9. Append the LOG.md entry. Update BRIEF.md → "Current bet" only after the human agrees.
