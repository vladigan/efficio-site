# Worker → GHL hop (Part B) — ready to apply, blocked on ONE credential

This documents the second half of the quiz-lead-capture work: making the
Cloudflare Worker (`efficio-chat`) push each captured lead into GoHighLevel so it
creates/updates a contact **and** an opportunity in the **Modrn Sales** pipeline —
which fires **WF1 ("Opportunity Created")** and the speed-to-lead email.

It is delivered as a **patch + activation steps** rather than a live edit because:

1. The Worker lives in the sibling project `Efficio/cloudflare-chat` (outside this
   repo, **not** under git), and its `wrangler.toml` says *"DO NOT `wrangler deploy`
   without explicit approval — this is LIVE infra."*
2. **The required GHL credential is not present anywhere in the repo, `.env`, or the
   Worker secrets.** Per the build rules, secrets are never hardcoded and Brady is
   never asked to paste keys into code — so Part B stops here, fully specified, and
   the website half (Part A) shipped independently.

The website already POSTs everything the Worker needs (see "What the site sends"
below), so **once the secret is set and the Worker is deployed, leads flow
automatically with no further website change.**

---

## ⛔ Blocked on exactly this

| Need | Value | Where it goes |
| --- | --- | --- |
| **GHL inbound-webhook URL** (or a Zapier catch-hook URL) that creates a contact + opportunity in **Modrn Sales** | _not present_ — must be created in GHL | Worker secret **`GHL_WEBHOOK_URL`** via `wrangler secret put` (never committed) |

Nothing else is required. No GHL API key is needed if you use the inbound-webhook
path (recommended, option **a** below). There is **no** GHL webhook/API credential
in `cloudflare-chat/.env` (only `EFFICIO_EXPORT_TOKEN`) or in `wrangler.toml`
(`[vars]` is empty; the only secrets are `ANTHROPIC_API_KEY` and `EXPORT_TOKEN`).

### How to produce the URL (one-time, ~10 min, GHL-side)

**Option (a) — GHL Inbound Webhook (recommended, no API key):**
1. In the Modrn GHL sub-account: **Automation → Workflows → Create Workflow**.
2. Trigger: **Inbound Webhook**. Save to reveal the **webhook URL** — copy it.
3. Add actions: **Create/Update Contact** (map `email`, `phone`, `firstName`,
   `lastName`, `name`, `company`) → **Create Opportunity** in the **Modrn Sales**
   pipeline. The opportunity-created event is what fires WF1 + the speed-to-lead email.
4. (Optional) Add a tag/source from the `kind` field (`quiz_lead` vs `sms_opt_in`).

**Option (b) — Zapier catch-hook:** create a "Catch Hook" trigger, copy its URL,
and have the Zap do Contact + Opportunity create in GHL. Same `GHL_WEBHOOK_URL`.

### Activate
```bash
cd Efficio/cloudflare-chat
npx wrangler secret put GHL_WEBHOOK_URL      # paste the URL from above
npx wrangler deploy                          # LIVE infra — deploy only with Brady's OK
```
Until `GHL_WEBHOOK_URL` is set, the new code is **completely dormant** (no-op,
exactly like the gated pixels in `assets/pixels.js`) — KV persistence is unchanged.

---

## The patch — `Efficio/cloudflare-chat/src/worker.js`

Additive and fail-graceful: KV is written **first** and the GHL push can never break
the `/quiz` 200 response or lose the KV record (every GHL error is swallowed).

### 1. Extend the record mapping in `handleQuiz` (capture `name` / `tier_name` / `source_url` / `consent`) and push qualifying leads

Replace the body of `handleQuiz` from `const record = {…}` through the `return`:

```js
  const record = {
    kind: payload.kind || 'quiz_submission',
    score: payload.score ?? null,
    qualified: !!payload.qualified,
    tier: payload.tier || '',
    tier_name: payload.tier_name || '',          // NEW — readable tier, e.g. "AI Team"
    vertical: payload.vertical || '',
    email: (payload.email || '').trim().toLowerCase(),
    answers: payload.answers || {},
    eff_variant: payload.eff_variant || null,
    firstName: payload.firstName || null,
    name: payload.name || null,                  // NEW — full name (sms_opt_in sends this)
    company: payload.company || null,
    phone: payload.phone || null,
    source_url: payload.source_url || null,      // NEW — page the lead came from
    consent: payload.consent || null,            // NEW — SMS consent record, when present
    ts: payload.ts || new Date().toISOString(),
  };
  const { key } = await putRecord(env, 'quiz', record);   // KV first — never lost

  // Additive GHL hop for the two real lead kinds. Dormant until GHL_WEBHOOK_URL
  // is configured; fail-graceful so a GHL error can't affect this response.
  if (record.kind === 'quiz_lead' || record.kind === 'sms_opt_in') {
    await pushToGHL(env, record);
  }

  return json({ ok: true, stored: true, key });
```

### 2. Add the `pushToGHL` helper (e.g. just after `putRecord` in the persistence-helpers section)

```js
/* ---- GHL push (additive, fail-graceful) ----------------------------------
   Dormant until env.GHL_WEBHOOK_URL is set (wrangler secret put GHL_WEBHOOK_URL).
   POSTs the lead to a GHL Inbound Webhook trigger (or Zapier catch-hook) that
   creates/updates a contact + an opportunity in the "Modrn Sales" pipeline,
   firing WF1 ("Opportunity Created") and the speed-to-lead email.
   Every error is swallowed: a GHL failure must NOT break the /quiz 200 response
   or lose the KV record (which is already written before this is called). */
async function pushToGHL(env, record) {
  const url = env && env.GHL_WEBHOOK_URL;
  if (!url) return; // not configured -> no-op (same gate philosophy as the dormant pixels)
  try {
    const fullName = record.name || '';
    const firstName = record.firstName || (fullName ? fullName.split(' ')[0] : null);
    const lastName = fullName.indexOf(' ') !== -1
      ? fullName.slice(fullName.indexOf(' ') + 1).trim()
      : null;
    const body = {
      source: 'efficio-worker',
      kind: record.kind,                 // 'quiz_lead' | 'sms_opt_in'
      email: record.email || null,
      phone: record.phone || null,
      firstName: firstName || null,
      lastName,
      name: record.name || null,
      company: record.company || null,
      tier: record.tier || null,         // non-PII tier key, e.g. "team"
      tier_name: record.tier_name || null,
      pipeline: 'Modrn Sales',           // informational; the GHL workflow does the mapping
      source_url: record.source_url || null,
      consent: record.consent || null,   // carries the SMS consent record for sms_opt_in
      answers: record.answers || {},
      ts: record.ts,
    };
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    /* intentionally swallowed — see header comment */
  }
}
```

> Latency note: `pushToGHL` is `await`ed so delivery is guaranteed before the Worker
> returns. If you'd rather not add one outbound fetch to the response path, change the
> handler signature to `async fetch(request, env, ctx)` and call
> `ctx.waitUntil(pushToGHL(env, record))` instead of `await`. Either is fine; the
> client uses `keepalive` + a fallback timer and never blocks on this response.

No other route changes. `/booking`, `/export/*`, `/health`, and the chat proxy are untouched.

---

## What the site already sends (no further website change needed)

Both POST to `https://efficio-chat.bgay3500.workers.dev/quiz`:

- **`find-your-tier.html`** (this PR) — `{ kind:"quiz_lead", ts, tier, tier_name, email,
  phone, source_url, answers:{<question>:<answer>×6} }`
- **`sms-opt-in.html`** (already live) — `{ kind:"sms_opt_in", ts, sms_opt_in:true,
  firstName, name, email, phone, consent:{…}, answers:{…} }`

The patch reads exactly these fields, so activation is purely: create the GHL webhook
→ `wrangler secret put GHL_WEBHOOK_URL` → `wrangler deploy`.

## Verify after deploy
```bash
curl -s -X POST https://efficio-chat.bgay3500.workers.dev/quiz \
  -H 'content-type: application/json' \
  -d '{"kind":"quiz_lead","email":"test+ghl@efficio.tech","tier":"team","tier_name":"AI Team","source_url":"https://efficio.tech/find-your-tier.html","answers":{"q":"a"}}'
# Expect: {"ok":true,"stored":true,"key":"quiz:..."}  AND a new contact + opportunity
# in the Modrn Sales pipeline, with WF1 + the speed-to-lead email firing.
```
