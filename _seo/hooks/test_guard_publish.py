"""Quick check that the approval hook asks exactly when it should: python3 hooks/test_guard_publish.py"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SEO = os.path.dirname(HERE)
CASES = [
    ("Bash", {"command": "git push -u origin main"}, True),
    ("Bash", {"command": "gh pr merge 12 --squash"}, True),
    ("Bash", {"command": "curl -X POST https://indexing.googleapis.com/v3/urlNotifications:publish"}, True),
    ("Bash", {"command": "sed -i 's/a/b/' ../for/agencies.html"}, True),
    ("Bash", {"command": "echo hi > ../sitemap.xml"}, True),
    ("Bash", {"command": "python3 scripts/gsc_pull.py --days 28"}, False),
    ("Bash", {"command": "git status && git diff"}, False),
    ("Bash", {"command": "cat ../for/agencies.html | grep title"}, False),
    ("Bash", {"command": "python3 scripts/candidates.py > reports/tmp.md"}, False),
    ("Edit", {"file_path": os.path.join(SEO, "..", "for", "agencies.html")}, True),
    ("Write", {"file_path": os.path.join(SEO, "LOG.md")}, False),
    ("Write", {"file_path": "reports/checkup.md"}, False),
    ("mcp__github__merge_pull_request", {}, True),
    ("mcp__github__get_file_contents", {}, False),
    ("mcp__webflow__update_page_settings", {}, True),
]
bad = 0
for tool, inp, want in CASES:
    out = subprocess.run([sys.executable, os.path.join(HERE, "guard_publish.py")], cwd=SEO, capture_output=True, text=True,
                         input=json.dumps({"tool_name": tool, "tool_input": inp, "cwd": SEO})).stdout
    got = bool(out) and json.loads(out)["hookSpecificOutput"]["permissionDecision"] == "ask"
    ok = got == want
    bad += not ok
    print(("ok  " if ok else "FAIL"), "ask" if got else "---", tool, json.dumps(inp)[:70])
sys.exit(1 if bad else 0)
