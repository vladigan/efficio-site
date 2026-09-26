"""Pass 1 (access): can Google reach and index the page? Uses the Search Console URL Inspection API
(read-only; this does NOT request indexing) plus a raw fetch of the live URL.

    python3 scripts/inspect_url.py https://efficio.tech/for/agencies"""
import html, re, sys, urllib.request
from _common import load_env, env, http, google_token

url = sys.argv[1]
load_env()
r = http("POST", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
         headers={"Authorization": f"Bearer {google_token('Search Console')}"},
         body={"inspectionUrl": url, "siteUrl": env("GSC_SITE")})
idx = r.get("inspectionResult", {}).get("indexStatusResult", {})
print("== Search Console URL Inspection ==")
for k in ("verdict", "coverageState", "robotsTxtState", "indexingState", "pageFetchState", "googleCanonical", "userCanonical", "lastCrawlTime", "crawledAs"):
    print(f"{k:16} {idx.get(k, '(not reported)')}")

print("\n== Raw fetch (what the server ships before any JavaScript) ==")
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"})
with urllib.request.urlopen(req, timeout=30) as resp:
    body = resp.read().decode("utf-8", "replace")
    print("status          ", resp.status, "final URL", resp.geturl())
    print("x-robots-tag    ", resp.headers.get("x-robots-tag", "(none)"))
robots = re.findall(r'<meta[^>]+name=["\']robots["\'][^>]*>', body, re.I)
canon = re.findall(r'<link[^>]+rel=["\']canonical["\'][^>]*>', body, re.I)
text = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", body))))
print("meta robots     ", robots or "(none)")
print("canonical       ", canon or "(none)")
print("indexable words ", len(text.split()), "(compare with firecrawl.py output to spot JS-only content)")
