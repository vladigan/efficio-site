"""Pull ORGANIC conversions per landing page from GA4, one day per file in data/ga4/<day>.json.

    python3 scripts/ga4_conversions.py            # last 28 days
    python3 scripts/ga4_conversions.py --days 90

The conversion events are named in BRIEF.md (generate_lead, book_call). GA4 attributes each
event to the session's landing page, which is what we line up against Search Console.
Only sessions whose default channel group is "Organic Search" are counted, so paid and
email traffic can't make an SEO page look like a winner."""
import argparse, os
from datetime import date, timedelta
from _common import DATA_DIR, load_env, env, http, google_token, daterange, write_json

EVENTS = ["generate_lead", "book_call"]   # keep in sync with BRIEF.md -> "What counts as a conversion"

ap = argparse.ArgumentParser()
ap.add_argument("--days", type=int, default=28)
ap.add_argument("--force", action="store_true")
a = ap.parse_args()

load_env()
prop = env("GA4_PROPERTY_ID")
hdr = {"Authorization": f"Bearer {google_token('GA4')}"}
url = f"https://analyticsdata.googleapis.com/v1beta/properties/{prop}:runReport"
organic = {"filter": {"fieldName": "sessionDefaultChannelGroup", "stringFilter": {"value": "Organic Search"}}}

def run(day, dims, metrics, extra_filter=None):
    f = {"andGroup": {"expressions": [organic, extra_filter]}} if extra_filter else organic
    r = http("POST", url, headers=hdr, body={
        "dateRanges": [{"startDate": day, "endDate": day}], "dimensions": [{"name": d} for d in dims],
        "metrics": [{"name": m} for m in metrics], "dimensionFilter": f, "limit": 100000})
    return [{**{d: v["value"] for d, v in zip(dims, row["dimensionValues"])},
             **{m: float(v["value"]) for m, v in zip(metrics, row["metricValues"])}} for row in r.get("rows", [])]

end = date.today() - timedelta(days=1)   # GA4 finalises within ~24-48h; yesterday is close enough for trend work
pulled = 0
for d in daterange(end - timedelta(days=a.days - 1), end):
    day = d.isoformat()
    path = os.path.join(DATA_DIR, "ga4", day + ".json")
    if os.path.exists(path) and not a.force and d < end:
        continue
    events_filter = {"filter": {"fieldName": "eventName", "inListFilter": {"values": EVENTS}}}
    write_json(path, {
        "day": day, "events": EVENTS,
        "sessions":    run(day, ["landingPage"], ["sessions", "engagedSessions"]),
        "conversions": run(day, ["landingPage", "eventName"], ["eventCount"], events_filter),
    })
    pulled += 1
print(f"GA4: pulled {pulled} day(s) of organic sessions + {', '.join(EVENTS)} per landing page (through {end})")
