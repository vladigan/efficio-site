"""Pass 1 (speed): PageSpeed Insights, mobile first. Prints real-user field data (CrUX) when Google
has it, then only the lab audits that are failing badly enough to hurt a real visitor.

    python3 scripts/pagespeed.py https://efficio.tech/for/agencies [--desktop]"""
import sys, urllib.parse
from _common import load_env, env, http

url = sys.argv[1]
strategy = "desktop" if "--desktop" in sys.argv else "mobile"
load_env()
q = {"url": url, "strategy": strategy, "category": "performance"}
if env("PAGESPEED_API_KEY", required=False):
    q["key"] = env("PAGESPEED_API_KEY")
r = http("GET", "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + urllib.parse.urlencode(q), timeout=180)

print(f"== {strategy} field data (real Chrome users, 28 days) ==")
fd = r.get("loadingExperience", {})
if fd.get("metrics"):
    print("overall", fd.get("overall_category"))
    for k, v in fd["metrics"].items():
        print(f"  {k:45} p75={v.get('percentile')}  {v.get('category')}")
else:
    print("  no field data — not enough real traffic; lab numbers below are a simulation, weigh them lightly")

lh = r["lighthouseResult"]
print(f"\n== lab: performance score {round(lh['categories']['performance']['score'] * 100)} ==")
for k in ("largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time", "first-contentful-paint", "speed-index"):
    a = lh["audits"].get(k, {})
    print(f"  {a.get('title', k):28} {a.get('displayValue', '')}")
print("\n== failing audits that matter (score < 0.5 with real savings) ==")
shown = 0
for a in lh["audits"].values():
    if a.get("score") is None or a["score"] >= 0.5 or a.get("scoreDisplayMode") not in ("numeric", "binary", "metricSavings"):
        continue
    savings = (a.get("details") or {}).get("overallSavingsMs")
    if savings is not None and savings < 300:   # a 100ms win nobody will feel
        continue
    print(f"  - {a['title']}: {a.get('displayValue', '')}")
    shown += 1
if not shown:
    print("  none — speed is not this page's problem")
