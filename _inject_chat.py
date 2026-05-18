"""Inject the floating AI chat widget script into all customer-facing pages.

Idempotent: skips pages that already have /assets/chat.js.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent

# Skip these — internal, archives, fragments, or pages that should not show chat
SKIP_PATTERNS = (
    "index-editorial-backup", "index_v5_archive",
    "v2-legacy", "v3-legacy", "v2.html",
    "_v2_preview", "demo-builder-test",
)

INJECT = '<script src="/assets/chat.js" defer></script>\n'


def should_skip(name: str) -> bool:
    return any(p in name for p in SKIP_PATTERNS)


def patch(path: Path) -> str:
    src = path.read_text(encoding="utf-8", errors="ignore")
    if "/assets/chat.js" in src:
        return "skip (already injected)"
    if "</body>" not in src:
        return "skip (no </body>)"
    patched = src.replace("</body>", INJECT + "</body>", 1)
    path.write_text(patched, encoding="utf-8")
    return "patched"


def main():
    htmls = sorted(ROOT.glob("*.html"))
    patched = 0
    for p in htmls:
        if should_skip(p.name):
            print(f"  -  {p.name}: skipped (excluded)")
            continue
        result = patch(p)
        if result == "patched":
            patched += 1
            print(f"  +  {p.name}")
        else:
            print(f"  ·  {p.name}: {result}")
    print(f"\nDone. {patched} pages patched.")


if __name__ == "__main__":
    main()
