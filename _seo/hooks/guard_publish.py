#!/usr/bin/env python3
"""PreToolUse hook for the SEO agent: anything that publishes, edits a live page, or submits a
URL must stop and ask a human first. Everything else (reading, pulling data, writing inside
_seo/) passes through untouched.

The live site is the repo root: GitHub Pages deploys whatever lands on main. So "publish" means
pushing or merging, and "editing a live page" means writing any file outside _seo/.
Wired up in _seo/.claude/settings.json. Test with: python3 hooks/test_guard_publish.py"""
import json, os, re, sys

SEO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PUBLISH_CMDS = [
    (r"\bgit\s+push\b",                                    "pushes to GitHub (main deploys the live site)"),
    (r"\bgit\s+(merge|rebase|cherry-pick)\b.*\bmain\b",    "changes main, which is the live site"),
    (r"\bgh\s+pr\s+merge\b|/pulls/\d+/merge",              "merges a PR into the live site"),
    (r"indexing\.googleapis\.com|urlNotifications",        "submits a URL to Google's Indexing API"),
    (r"indexnow|bing\.com/(indexnow|webmaster/api)",       "submits a URL to IndexNow/Bing"),
    (r"webmasters/v3/sites/[^ ]+/sitemaps",                "submits a sitemap to Search Console"),
    (r"api\.webflow\.com.*-X\s*(POST|PUT|PATCH|DELETE)|-X\s*(POST|PUT|PATCH|DELETE).*api\.webflow\.com", "writes to Webflow"),
    (r"/wp-json/.*-X\s*(POST|PUT|PATCH|DELETE)|-X\s*(POST|PUT|PATCH|DELETE).*/wp-json/", "writes to WordPress"),
    (r"\b(wrangler\s+(deploy|publish|pages\s+deploy)|netlify\s+deploy|vercel\b.*--prod)", "deploys a site"),
]
PUBLISH_MCP = re.compile(r"(merge_pull_request|push_files|create_or_update_file|delete_file|update_pull_request_branch"
                         r"|publish|submit|indexnow|request_index|(webflow|wordpress|wp).*(create|update|delete|patch))", re.I)
EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}


def ask(reason):
    json.dump({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "ask",
                                      "permissionDecisionReason": "SEO agent approval step: this " + reason +
                                      ". A human must approve it; log the decision in LOG.md."}}, sys.stdout)
    sys.exit(0)


def main():
    try:
        ev = json.load(sys.stdin)
    except Exception:
        ask("tool call could not be inspected")
    tool, inp = ev.get("tool_name", ""), ev.get("tool_input") or {}
    cwd = ev.get("cwd") or os.getcwd()

    if tool == "Bash":
        cmd = inp.get("command", "")
        for pat, why in PUBLISH_CMDS:
            if re.search(pat, cmd, re.I):
                ask(why)
        # Shell writes into the site (sed -i, redirection, cp/mv) outside _seo/ count as live-page edits.
        if re.search(r"(\bsed\s+-i|\btee\b|>>?\s*[^&|\s]|\b(cp|mv|rm)\b)", cmd):
            targets = re.findall(r"[\w./-]+\.(?:html|xml|txt|js|css|json|toml)|_redirects|CNAME", cmd)
            for t in targets:
                p = os.path.realpath(os.path.join(cwd, t))
                if not p.startswith(SEO_DIR + os.sep):
                    ask(f"shell command modifies {os.path.relpath(p, os.path.dirname(SEO_DIR))}, a live-site file")
    elif tool in EDIT_TOOLS:
        path = inp.get("file_path") or inp.get("notebook_path") or ""
        p = os.path.realpath(os.path.join(cwd, path))
        if not p.startswith(SEO_DIR + os.sep):
            ask(f"edits {os.path.relpath(p, os.path.dirname(SEO_DIR))}, a live-site file")
    elif tool.startswith("mcp__") and PUBLISH_MCP.search(tool):
        ask(f"calls {tool}, which can publish or change live content")
    sys.exit(0)  # no opinion -> normal permission rules apply


if __name__ == "__main__":
    main()
