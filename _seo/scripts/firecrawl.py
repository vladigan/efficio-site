"""Read a page the way the model should: rendered, cleaned to markdown. Used for our own page
and for each competitor in the top 10, so the agent quotes what they actually wrote.

    python3 scripts/firecrawl.py https://competitor.com/page [more URLs...]

Saves data/pages/<host>-<path>.md with the source URL on the first line."""
import os, re, sys
from _common import DATA_DIR, load_env, env, http

load_env()
hdr = {"Authorization": f"Bearer {env('FIRECRAWL_API_KEY')}"}
for url in sys.argv[1:]:
    r = http("POST", "https://api.firecrawl.dev/v1/scrape", headers=hdr, timeout=180,
             body={"url": url, "formats": ["markdown"], "onlyMainContent": False})
    if not r.get("success"):
        print(f"FAILED {url}: {r.get('error')} — record this page as 'not read', do not summarise it from memory")
        continue
    md = r["data"].get("markdown", "")
    slug = re.sub(r"[^a-z0-9]+", "-", re.sub(r"^https?://", "", url).lower()).strip("-")[:120]
    path = os.path.join(DATA_DIR, "pages", slug + ".md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"<!-- source: {url} -->\n{md}")
    print(f"{len(md.split()):>6} words  {os.path.relpath(path)}  <- {url}")
