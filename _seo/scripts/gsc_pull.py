"""Pull Search Console performance ONE DAY AT A TIME into data/gsc/<day>.json.

    python3 scripts/gsc_pull.py              # backfill the last 28 complete days (skips days already on disk)
    python3 scripts/gsc_pull.py --days 90    # longer history for the first baseline

Why one day per call: it stays under the per-request row caps and quota walls, and gives
a clean daily history the weekly loop can re-slice into any before/after window.

Two pulls per day, on purpose:
  by_page        dimensions=[page]        -> the trustworthy page totals
  by_page_query  dimensions=[page, query] -> query detail. Google DROPS anonymised /
                 low-volume rows when page and query are combined, so these rows will not
                 sum to by_page. Never use them for page totals.
Days newer than today-3 are skipped: GSC data lands 2-3 days late."""
import argparse, os, urllib.parse
from datetime import timedelta
from _common import DATA_DIR, load_env, env, http, google_token, gsc_last_complete_day, daterange, write_json

ap = argparse.ArgumentParser()
ap.add_argument("--days", type=int, default=28)
ap.add_argument("--force", action="store_true", help="re-pull days already on disk")
a = ap.parse_args()

load_env()
site = env("GSC_SITE")
tok = google_token("Search Console")
endpoint = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
hdr = {"Authorization": f"Bearer {tok}"}

def query(day, dims):
    rows, start = [], 0
    while True:
        r = http("POST", endpoint, headers=hdr, body={
            "startDate": day, "endDate": day, "dimensions": dims, "type": "web",
            "dataState": "final", "rowLimit": 25000, "startRow": start})
        batch = r.get("rows", [])
        rows += [{**{d: k for d, k in zip(dims, x["keys"])}, "clicks": x["clicks"], "impressions": x["impressions"],
                  "ctr": x["ctr"], "position": x["position"]} for x in batch]
        if len(batch) < 25000:
            return rows
        start += 25000

end = gsc_last_complete_day()
pulled = skipped = 0
for d in daterange(end - timedelta(days=a.days - 1), end):
    day = d.isoformat()
    path = os.path.join(DATA_DIR, "gsc", day + ".json")
    if os.path.exists(path) and not a.force:
        skipped += 1
        continue
    write_json(path, {"day": day, "site": site, "by_page": query(day, ["page"]), "by_page_query": query(day, ["page", "query"])})
    pulled += 1
print(f"GSC: pulled {pulled} day(s), {skipped} already on disk, latest complete day {end}")
