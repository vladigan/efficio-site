"""Web search via Parallel: where a topic or the brand gets discussed off-site (Reddit, YouTube,
forums, directories, industry pubs), and what competitors claim. Every result keeps its URL.

    python3 scripts/parallel_search.py "Where do dental office owners discuss AI receptionists?" \
        --q "ai receptionist dental reddit" --q "efficio.tech"

Endpoint/shape per Parallel's Search API docs; if they change it, adjust ENDPOINT/body here."""
import argparse, os, re
from datetime import date
from _common import DATA_DIR, load_env, env, http, write_json

ENDPOINT = "https://api.parallel.ai/v1beta/search"

ap = argparse.ArgumentParser()
ap.add_argument("objective")
ap.add_argument("--q", action="append", default=[], help="keyword query (repeatable)")
ap.add_argument("--max", type=int, default=10)
a = ap.parse_args()

load_env()
r = http("POST", ENDPOINT, headers={"x-api-key": env("PARALLEL_API_KEY")},
         body={"objective": a.objective, "search_queries": a.q or None, "max_results": a.max})
results = r.get("results", [])
for x in results:
    print(f"- {x.get('title', '')}\n  {x.get('url')}")
    for ex in (x.get("excerpts") or [])[:1]:
        print("  > " + ex.strip().replace("\n", " ")[:240])
slug = re.sub(r"[^a-z0-9]+", "-", a.objective.lower())[:60].strip("-")
path = os.path.join(DATA_DIR, "search", f"{date.today()}-{slug}.json")
write_json(path, {"objective": a.objective, "queries": a.q, "results": results})
print(f"\nsaved {os.path.relpath(path)}")
