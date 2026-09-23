"""Line up Search Console and GA4 organic conversions page by page, and flag money-page candidates.

    python3 scripts/candidates.py                  # last 28 complete days
    python3 scripts/candidates.py --days 56 --write-baseline

Reads data/gsc/*.json and data/ga4/*.json (run gsc_pull.py and ga4_conversions.py first).
Prints a ranked table and writes reports/candidates-<date>.md. With --write-baseline it
also stores each page's numbers in state.json -> pages[path].baseline, which is what the
weekly loop compares against. Only do that before a change goes live, never after.

Flags (the agent still makes the final call by looking at the live results page):
  CANDIDATE  converts organic visitors AND ranks ~5-20 with real impressions:
             a ranking bump flows straight into leads.
  TRAP       lots of impressions, zero organic conversions. Do not recommend it for
             ranking work; the problem is the page or the query intent, not the position.
  WATCH      converts but too few impressions to judge yet.
  WINNING    already top 4 and converting. Leave it alone unless there's a strong reason."""
import argparse, glob, os
from collections import defaultdict
from datetime import date, timedelta
from _common import DATA_DIR, SEO_DIR, norm_page, page_file, load_state, save_state, read_json, gsc_last_complete_day

ap = argparse.ArgumentParser()
ap.add_argument("--days", type=int, default=28)
ap.add_argument("--min-impr", type=int, default=100, help="impressions needed before a page can be judged")
ap.add_argument("--write-baseline", action="store_true")
a = ap.parse_args()

end = gsc_last_complete_day()
start = end - timedelta(days=a.days - 1)
in_window = lambda f: start.isoformat() <= os.path.basename(f)[:10] <= end.isoformat()

gsc_files = sorted(f for f in glob.glob(os.path.join(DATA_DIR, "gsc", "*.json")) if in_window(f))
ga4_files = sorted(f for f in glob.glob(os.path.join(DATA_DIR, "ga4", "*.json")) if in_window(f))
missing = []
if len(gsc_files) < a.days: missing.append(f"GSC has {len(gsc_files)}/{a.days} days")
if len(ga4_files) < a.days: missing.append(f"GA4 has {len(ga4_files)}/{a.days} days")

P = defaultdict(lambda: {"clicks": 0, "impressions": 0, "pos_x_impr": 0.0, "sessions": 0, "conversions": defaultdict(int),
                         "queries": defaultdict(lambda: {"clicks": 0, "impressions": 0, "pos_x_impr": 0.0})})
for f in gsc_files:
    day = read_json(f)
    for r in day["by_page"]:
        p = P[norm_page(r["page"])]
        p["clicks"] += r["clicks"]; p["impressions"] += r["impressions"]; p["pos_x_impr"] += r["position"] * r["impressions"]
    for r in day["by_page_query"]:
        q = P[norm_page(r["page"])]["queries"][r["query"]]
        q["clicks"] += r["clicks"]; q["impressions"] += r["impressions"]; q["pos_x_impr"] += r["position"] * r["impressions"]
for f in ga4_files:
    day = read_json(f)
    for r in day["sessions"]:
        P[norm_page(r["landingPage"])]["sessions"] += int(r["sessions"])
    for r in day["conversions"]:
        P[norm_page(r["landingPage"])]["conversions"][r["eventName"]] += int(r["eventCount"])

rows = []
for path, p in P.items():
    if path in ("(not set)", "") or path is None:
        continue
    pos = p["pos_x_impr"] / p["impressions"] if p["impressions"] else None
    conv = sum(p["conversions"].values())
    cr = conv / p["sessions"] if p["sessions"] else 0.0
    if p["impressions"] >= a.min_impr and conv == 0:
        flag = "TRAP"
    elif conv and pos is not None and pos <= 4:
        flag = "WINNING"
    elif conv and pos is not None and 4 < pos <= 20 and p["impressions"] >= a.min_impr:
        flag = "CANDIDATE"
    elif conv:
        flag = "WATCH"
    else:
        flag = ""
    top_q = sorted(p["queries"].items(), key=lambda kv: -kv[1]["impressions"])[:5]
    rows.append({
        "path": path, "file": page_file(path), "flag": flag,
        "clicks": p["clicks"], "impressions": p["impressions"], "position": round(pos, 1) if pos else None,
        "ctr": round(p["clicks"] / p["impressions"], 4) if p["impressions"] else None,
        "organic_sessions": p["sessions"], "conversions": dict(p["conversions"]), "conv_rate": round(cr, 4),
        "top_queries": [{"query": q, "impressions": v["impressions"], "clicks": v["clicks"],
                         "position": round(v["pos_x_impr"] / v["impressions"], 1) if v["impressions"] else None} for q, v in top_q],
    })

# Candidates first, ranked by the upside of moving up: impressions x conversion rate.
order = {"CANDIDATE": 0, "WATCH": 1, "WINNING": 2, "TRAP": 3, "": 4}
rows.sort(key=lambda r: (order[r["flag"]], -(r["impressions"] * (r["conv_rate"] or 0)), -r["impressions"]))

lines = [f"# Money-page candidates — {start} to {end}", "",
         f"Source: Search Console (by_page totals) + GA4 organic sessions/conversions ({', '.join(sorted({e for r in rows for e in r['conversions']}) or ['no conversions recorded'])}).",
         "Average position is impression-weighted and can read better than reality when AI Overview appearances are counted.", ""]
if missing:
    lines += ["**Data missing:** " + "; ".join(missing) + ". Numbers below cover only the days on disk.", ""]
lines += ["| flag | page | impr | clicks | pos | organic sessions | conversions | conv rate | top query |",
          "|---|---|---:|---:|---:|---:|---|---:|---|"]
for r in rows:
    if not (r["flag"] or r["impressions"] >= a.min_impr):
        continue
    conv = ", ".join(f"{k} {v}" for k, v in r["conversions"].items()) or "0"
    tq = r["top_queries"][0]["query"] if r["top_queries"] else ""
    lines.append(f"| {r['flag']} | {r['path']} | {r['impressions']} | {r['clicks']} | {r['position'] or ''} | "
                 f"{r['organic_sessions']} | {conv} | {r['conv_rate']:.1%} | {tq} |")
report = "\n".join(lines) + "\n"
out = os.path.join(SEO_DIR, "reports", f"candidates-{date.today().isoformat()}.md")
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, "w", encoding="utf-8").write(report)
print(report)
print("wrote", os.path.relpath(out, SEO_DIR))

if a.write_baseline:
    state = load_state()
    bet = (state.get("current_bet") or {}).get("page")
    for r in rows:
        if r["flag"] in ("CANDIDATE", "WATCH", "WINNING") or r["path"] in state.get("pages", {}) or r["path"] == bet:
            state.setdefault("pages", {}).setdefault(r["path"], {})["baseline"] = {
                "window": [start.isoformat(), end.isoformat()], **{k: r[k] for k in
                ("impressions", "clicks", "position", "ctr", "organic_sessions", "conversions", "conv_rate", "top_queries")}}
    save_state(state)
    print("baseline written to state.json")
