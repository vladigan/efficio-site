# Weekly loop (the scheduled task runs this every Monday)

Keep it short. You are checking, not redesigning.

1. **Pull.** `python3 scripts/gsc_pull.py --days 28` and `python3 scripts/ga4_conversions.py --days 28`.
2. **Compare.** For the page in `state.json.current_bet` (and any page with an `active_change`):
   `python3 scripts/candidates.py --days 28` and compare with `pages[<page>].baseline`:
   impressions, clicks, position, organic sessions, `book_call`, `generate_lead`, conversion rate.
   Read `active_change.live_on` from state.json and say how many days the change has been live.
   - Under ~14 days live: report the numbers, make **no** call. Rankings wiggle and often come back on their own.
   - Past its window (default 28 days; set per change): call it **WIN** or **MISS** on the business side first:
     more organic bookings/leads = win; rankings up with no extra conversions = miss; flat rankings with better
     conversion = win. Record it and clear `active_change`.
   - AI citation moves (DataForSEO AI Mode, Bing AI Performance) are context, not proof: model updates move
     them without any change on our side.
3. **Check for breakage.** `python3 scripts/inspect_url.py <page URL>`: still indexable, canonical unchanged,
   still loads pixels.js, status 200. Anything broken outranks everything else this week.
4. **Recommend one change**, only if the page has no active change in its window: the next item from the latest
   `reports/checkup-*.md`, or a fresh finding, with evidence and links. If nothing clears the bar, recommend
   nothing and say why; that is a valid week.
5. **Wait.** Do not draft or publish. End with the question: "Approve this change? (yes / no / change it)".
6. **Log.** Append to LOG.md: window, numbers vs baseline, days since last change, verdict or "too early",
   the recommendation, and sources.

## When the human says yes (same session or next)
- Draft the change in the page file under `..` (the hook will ask for approval on the edit: that's expected).
- Show the diff. The human does the final read for voice (BRIEF.md "Voice and things we never say") and
  publishes it themselves (push/merge → GitHub Pages).
- After it's live, set `state.json.active_change = {"page", "change", "file", "live_on", "window_days": 28}`,
  and log the date and the exact change.
