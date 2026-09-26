"""DataForSEO: live SERP, keyword volumes, and Google AI Mode results. Sandbox by default.

    python3 scripts/dataforseo.py serp    "ai receptionist for dental offices"
    python3 scripts/dataforseo.py volume  "ai receptionist" "ai answering service" ...
    python3 scripts/dataforseo.py aimode  "ai receptionist for dental offices"

DATAFORSEO_MODE=sandbox (default) hits sandbox.dataforseo.com: fake data in the real response
shape, zero cost. Only DATAFORSEO_MODE=live spends money, and DATAFORSEO_MAX_CALLS caps calls
per invocation. Results are saved to data/dataforseo/ so the agent can cite them."""
import json, os, re, sys
from datetime import date
from _common import DATA_DIR, load_env, env, http, basic_auth, write_json

LOCATION, LANGUAGE = 2840, "en"   # United States / English — Efficio sells to US service businesses

load_env()
mode = env("DATAFORSEO_MODE", required=False, default="sandbox")
base = "https://api.dataforseo.com" if mode == "live" else "https://sandbox.dataforseo.com"
cap = int(env("DATAFORSEO_MAX_CALLS", required=False, default="10"))
auth = {"Authorization": basic_auth(env("DATAFORSEO_LOGIN"), env("DATAFORSEO_PASSWORD"))}
calls = 0

def post(path, task):
    global calls
    calls += 1
    if mode == "live" and calls > cap:
        sys.exit(f"Spend cap hit: DATAFORSEO_MAX_CALLS={cap}. Raise it in _seo/.env only if the extra calls are worth it.")
    r = http("POST", base + path, headers=auth, body=[task], timeout=180)
    t = (r.get("tasks") or [{}])[0]
    if t.get("status_code") != 20000:
        sys.exit(f"DataForSEO error {t.get('status_code')}: {t.get('status_message')}")
    return t

cmd, args = sys.argv[1], sys.argv[2:]
common = {"location_code": LOCATION, "language_code": LANGUAGE}
if cmd == "serp":
    t = post("/v3/serp/google/organic/live/advanced", {"keyword": args[0], "depth": 10, **common})
    items = (t["result"] or [{}])[0].get("items") or []
    out = [{"rank": i.get("rank_group"), "type": i.get("type"), "url": i.get("url"), "title": i.get("title")} for i in items]
    for o in out:
        print(f"{o['rank'] or '-':>3} {o['type']:22} {o['url'] or ''}  {o['title'] or ''}")
elif cmd == "volume":
    t = post("/v3/keywords_data/google_ads/search_volume/live", {"keywords": args, **common})
    out = [{"keyword": k.get("keyword"), "volume": k.get("search_volume"), "cpc": k.get("cpc"), "competition": k.get("competition")} for k in t["result"] or []]
    for o in out:
        print(f"{o['volume'] or 0:>7}  cpc {o['cpc'] or '-':>6}  {o['keyword']}")
elif cmd == "aimode":
    t = post("/v3/serp/google/ai_mode/live/advanced", {"keyword": args[0], **common})
    res = (t["result"] or [{}])[0]
    out = res
    refs = [r for i in res.get("items") or [] for r in (i.get("references") or [])]
    print(f"AI Mode answer for {args[0]!r}: {len(refs)} cited sources")
    for r in refs:
        mark = "  <-- EFFICIO" if "efficio.tech" in (r.get("url") or "") else ""
        print(f"  {r.get('domain') or '':30} {r.get('url') or ''}{mark}")
else:
    sys.exit("usage: dataforseo.py serp|volume|aimode <keyword...>")

slug = re.sub(r"[^a-z0-9]+", "-", " ".join(args).lower())[:60].strip("-")
path = os.path.join(DATA_DIR, "dataforseo", f"{date.today()}-{cmd}-{slug}.json")
write_json(path, {"mode": mode, "cmd": cmd, "args": args, "result": out})
print(f"\n[{mode}] saved {os.path.relpath(path)}" + ("  (SANDBOX: fake data, do not draw conclusions)" if mode != "live" else ""))
