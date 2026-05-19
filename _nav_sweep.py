"""Standardize primary nav across all customer-facing pages.

Pattern: Services · How it works · AI hires · Pricing · Blog · [Qualify in 60 sec]
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent

# Standard nav-links inner HTML (the 5 links + CTA)
STANDARD_NAV = '''<a href="/services.html">Services</a>
    <a href="/how-it-works.html">How it works</a>
    <a href="/agents.html">AI hires</a>
    <a href="/pricing.html">Pricing</a>
    <a href="/blog/">Blog</a>
    <a href="/qualify.html" class="btn-nav">Qualify in 60 sec</a>'''

# Match the entire body of any <div class="nav-links">...</div>
NAV_RE = re.compile(r'(<div class="nav-links">)(.*?)(</div>)', re.S)

TARGETS = [
    "index.html", "services.html", "how-it-works.html", "pricing.html",
    "agents.html", "why-us.html", "catalog.html", "book.html",
    "demo-builder.html", "demo.html", "screenshots.html", "process.html",
    "vsl.html", "thank-you.html", "intake.html", "qualify.html",
    "audit-intake.html", "audit-quiz.html",
]


def patch(path: Path) -> str:
    src = path.read_text(encoding="utf-8", errors="ignore")
    matches = NAV_RE.findall(src)
    if not matches:
        return "no nav-links found"
    new_src = NAV_RE.sub(lambda m: m.group(1) + "\n    " + STANDARD_NAV + "\n  " + m.group(3), src, count=1)
    if new_src == src:
        return "already standard"
    path.write_text(new_src, encoding="utf-8")
    return f"patched ({len(matches)} occurrence)"


def main():
    patched = 0
    for name in TARGETS:
        p = ROOT / name
        if not p.exists():
            print(f"  -  {name}: not found")
            continue
        result = patch(p)
        if "patched" in result:
            patched += 1
            print(f"  +  {name}: {result}")
        else:
            print(f"  ·  {name}: {result}")
    print(f"\nStandardized {patched} pages.")


if __name__ == "__main__":
    main()
