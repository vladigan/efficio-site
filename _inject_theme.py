"""Inject /assets/theme.css link + body bg override into pages missing the unified purple background.

Usage:  python _inject_theme.py
Idempotent: skips pages that already include theme.css.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent

# Customer-facing dark pages that should show the purple orb/grid background.
# Excludes: audit.html, one-pager.html (intentionally light), all *backup*/*archive*/*legacy* files.
TARGETS = [
    "apply.html",
    "cancel.html",
    "demo.html",
    "demo-builder.html",
    "demo-builder-test.html",
    "kickoff-form.html",
    "onboarding.html",
    "onboarding-start.html",
    "privacy.html",
    "qualifyme.html",
    "quiz.html",
    "screenshots.html",
    "success.html",
    "terms.html",
    "unsubscribe.html",
    "video.html",
    "watch.html",
]

INJECT = (
    '<link rel="stylesheet" href="/assets/theme.css" />\n'
    '<style>html,body{background:#0a0612 !important}'
    'body{position:relative;isolation:isolate}</style>\n'
)


def patch(path: Path) -> str:
    src = path.read_text(encoding="utf-8")
    if "/assets/theme.css" in src:
        return "skip (already has theme.css)"
    if "</head>" not in src:
        return "skip (no </head>)"
    patched = src.replace("</head>", INJECT + "</head>", 1)
    path.write_text(patched, encoding="utf-8")
    return "patched"


def main():
    for name in TARGETS:
        p = ROOT / name
        if not p.exists():
            print(f"  -  {name}: not found")
            continue
        result = patch(p)
        print(f"  {'+' if result == 'patched' else '·'}  {name}: {result}")


if __name__ == "__main__":
    main()
