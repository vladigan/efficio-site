# Efficio HQ — internal agent command center

`hq.html` is an **internal** ops dashboard showing Efficio's own AI agent fleet
and what each agent is working on. It dogfoods the exact command-center product
we sell to clients (same look as the v6 `demo-embed.html`).

It is **not** a public page: it carries `noindex,nofollow`, is **not** linked
from the nav or homepage, and should be gated before daily use (see Auth below).

---

## Files

| File | Purpose |
|------|---------|
| `hq.html` | The dashboard. Fetches `hq-status.json`, renders the grid, stats strip, and activity feed, then re-polls. |
| `hq-status.json` | The data feed. Currently a **static seed** reflecting our latest manual audit. Replace with a live endpoint to go live. |
| `HQ_MAKE_IT_LIVE.md` | This file. |

---

## What's real vs. awaiting a feed (as of 2026-06-19)

The dashboard is honest by design. Each agent card shows a **verification badge**:

- 🟢 **verified-live** — confirmed by a real signal.
- 🟡 **awaiting-feed** — no live signal yet; the value is from our latest manual audit.

| Agent | Status | Verification | Reality |
|-------|--------|--------------|---------|
| Inbox Monitor | Active | verified-live | Hourly Gmail summaries, 0 bounces, healthy. |
| Lead-Capture Chat (Cloudflare) | Active | verified-live | Worker deployed and responding. |
| Marketing / Social Coordinator | Active | verified-live | FB + LinkedIn connected in GHL; posts scheduled through mid-July. |
| Sales Navigator / Outreach Emailer | Needs attention | awaiting-feed | Exists but unproven. Last real send 6/16 bounced (2/2). No verified campaign sending. |
| Site & Dashboard Builder | Working | verified-live | Shipped the v6 site + this HQ dashboard. |
| Deliverability & Ads Prep | Idle | awaiting-feed | Ad pack + deliverability remediation plan prepared; awaiting go-live. |

> The agents run on a remote **Hetzner VPS** under the **Hermes** framework.
> True real-time status needs a heartbeat feed we don't have wired yet — that's
> what the rest of this doc sets up. Until then, "awaiting-feed" is the truthful
> label and the banner reads **config**, not **live**.

---

## How it works today

1. On load, `hq.html` does `fetch("hq-status.json")`.
2. It renders the stats strip, agent grid, and activity feed from that JSON.
3. It re-polls every `poll_interval_seconds` (default 30s).
4. If the fetch fails (e.g. you opened the file via `file://`), it falls back to
   an inline copy of the data and shows a notice.
5. The source banner reads **config** while `source` is `"static-config"`, and
   automatically flips to **live** the moment the feed reports any other source.

---

## Make it live (point it at the VPS)

The contract is simple: **each Hermes agent writes its own status; something
aggregates those into one JSON; the dashboard polls that JSON.** No dashboard
code changes are required beyond setting one URL.

### Step 1 — each agent emits a heartbeat

On every run (or on a timer), each Hermes agent writes a small status object.
Two common shapes:

- **File per agent** (simplest): each agent writes `/var/efficio/hq/<agent-id>.json`.
- **Single shared file**: agents update rows in one `/var/efficio/hq/status.json`
  (use a lock or a tiny DB/Redis key to avoid write races).

Per-agent payload (one entry in the `agents` array):

```json
{
  "id": "inbox-monitor",
  "name": "Inbox Monitor",
  "role": "ops/inbox",
  "status": "active",
  "verification": "verified-live",
  "current_task": "Hourly Gmail summary delivered — 0 bounces",
  "last_run": "2026-06-19T14:00:00Z",
  "metrics": { "summaries_today": 14, "bounces": 0 },
  "log": [
    { "t": "2026-06-19T14:00:00Z", "text": "Hourly inbox summary sent — 0 bounces" }
  ]
}
```

### Step 2 — aggregate into the feed shape

An aggregator (a 20-line cron script, a tiny FastAPI/Express route, or a Netlify
/ Cloudflare function) collects the per-agent files and emits the full feed
(`generated_at`, `source`, `stats`, `agents[]`). **Set `source` to something
other than `"static-config"`** (e.g. `"vps-heartbeat"`) so the banner flips to
**live**.

A staleness rule keeps the dashboard honest: if an agent's `last_run` is older
than its expected cadence (e.g. Inbox Monitor should run hourly), the aggregator
should downgrade it to `status: "needs-attention"` / `verification: "awaiting-feed"`
rather than leaving a stale green.

### Step 3 — expose it and point the dashboard at it

Host the aggregated JSON somewhere the dashboard can reach over HTTPS (with CORS
allowed for the efficio.tech origin). Then edit the top of the `<script>` in
`hq.html`:

```js
var STATUS_URL = "https://hq.efficio.tech/status.json"; // was "hq-status.json"
```

That's the only change. Polling, the live/config banner, stats, and the feed all
update automatically.

> **Easiest path on our stack:** add a Netlify function (or Cloudflare Worker —
> we already run one for chat) that SSHes/queries the VPS or reads a file the VPS
> rsyncs up, and returns the aggregated JSON. Point `STATUS_URL` at that function.

---

## JSON schema

```jsonc
{
  "$schema_version": "1.0",
  "generated_at": "ISO-8601",          // when this snapshot was produced
  "source": "static-config | vps-heartbeat | ...", // anything != "static-config" => banner shows "live"
  "poll_interval_seconds": 30,          // how often the dashboard re-polls
  "fleet": {
    "host": "Hetzner VPS (Hermes framework)",
    "heartbeat_endpoint": null,         // informational
    "note": "string"
  },
  "stats": {                            // optional; dashboard derives these if omitted
    "agents_tracked": 6,
    "verified_live": 3,
    "needs_attention": 1,
    "tasks_logged_24h": 24,
    "last_updated": "ISO-8601"
  },
  "agents": [
    {
      "id": "string",                   // stable slug
      "name": "string",                 // display name
      "role": "string",                 // e.g. "ops/inbox"
      "status": "active | working | idle | needs-attention | paused | awaiting-feed",
      "verification": "verified-live | awaiting-feed",
      "current_task": "string",         // the "currently working on / last did" line
      "last_run": "ISO-8601",
      "metrics": { "any_key": "any_value" }, // rendered as "<value> <key>" chips
      "log": [ { "t": "ISO-8601", "text": "string" } ] // newest first or any order; sorted by time
    }
  ]
}
```

**Status semantics**

| status | meaning |
|--------|---------|
| `active` | running on schedule, healthy |
| `working` | actively executing a task right now |
| `idle` | online but nothing queued |
| `needs-attention` | failing / unproven / requires a human |
| `paused` | intentionally stopped |
| `awaiting-feed` | we have no live signal for this agent yet |

---

## Auth — keep it internal

This dashboard exposes business internals (deliverability state, what's working,
what isn't). Before relying on it day-to-day, gate it. Pick one:

1. **Netlify password protection** (simplest): Site settings → Access control →
   Visitor access → Password protection. One site-wide or role-based password.
2. **Netlify Identity / role-gated redirect**: protect `/hq` behind an Identity
   role via a `_redirects` / role rule. Better if more than one person needs it.
3. **Non-guessable path** (weak, but better than nothing): rename to something
   like `hq-7f3a9.html`. Obscurity only — combine with one of the above.

Also keep the status endpoint private: the live JSON should require the same
auth (or sit behind the same function) so the data isn't scrapeable even if the
page is.

> The page already sets `noindex,nofollow` and is not linked from the public
> site, so search engines won't surface it — but that is **not** access control.
