# Chat widget + unified backgrounds — deploy guide

*Shipped: 2026-05-18. Two changes to push live before LinkedIn traffic hits.*

---

## What changed

**1. Unified background — 17 pages**
Every dark customer-facing page now loads `/assets/theme.css` + the canvas is forced to `#08080a`. Result: the purple orb/grid background from the homepage now shows on:
apply · cancel · demo · demo-builder · kickoff-form · onboarding · onboarding-start · privacy · qualifyme · quiz · screenshots · success · terms · unsubscribe · video · watch · demo-builder-test

Pages left intentionally light (different aesthetic, separate decision): audit.html, one-pager.html.

**2. Floating AI chat widget — 33 pages**
Bottom-right purple bubble. Click → chat panel slides up. Backed by Claude via Netlify Function.

Files added:
- `assets/chat.css` — widget styles
- `assets/chat.js` — UI + fetch logic
- `netlify/functions/chat.js` — Claude proxy
- `netlify.toml` — `[functions]` directory registered

System prompt grounds the bot as Efficio's AI assistant: knows pricing (AI Specialist $997 / AI Team $2,500 / AI Department $3,500), day-7 promise, day-30 refund, steers toward audit-quiz or Calendly. Tone rules baked in (no "synergy/leverage/transform", never call Efficio a tool/software/SaaS).

---

## Deploy (5 minutes)

### Step 1 — set the API key in Netlify (1 min)
Netlify Dashboard → **efficio.tech site** → Site configuration → Environment variables → **Add a variable**:
- Key: `ANTHROPIC_API_KEY`
- Value: *paste your existing key from `.env` (the `ANTHROPIC_API_KEY` already used by other scripts)*
- Scope: all (functions + builds)

Without this key the widget still works — it shows a "I'm not fully wired yet, email brady@efficio.tech" fallback and stays useful.

### Step 2 — commit + push
```
cd Efficio/website
git add assets/chat.css assets/chat.js netlify/functions/chat.js netlify.toml \
        _inject_theme.py _inject_chat.py CHAT_AND_BG_DEPLOY.md \
        *.html
git commit -m "ship: unified purple background + floating AI chat widget"
git push
```

Netlify auto-deploys in ~60 sec.

### Step 3 — smoke test live
1. Open efficio.tech (cmd+shift+R hard refresh)
2. Visit any of the previously-blank pages (`/privacy`, `/terms`, `/quiz`, `/onboarding`) — confirm purple orbs visible
3. Click the bubble (bottom-right) → it opens → bot greets → type "how much" → real reply within 2-3 sec
4. If reply is the fallback "I'm not fully wired yet" → ANTHROPIC_API_KEY didn't take. Re-check Netlify env var and trigger a redeploy

---

## Re-run if you add new pages

Both injectors are idempotent (skip pages already patched):
```
cd Efficio/website
python _inject_theme.py    # adds theme.css to new dark pages
python _inject_chat.py     # adds chat widget to all pages
```

Both have `SKIP_PATTERNS` / `TARGETS` lists at the top — edit them if you add a page that shouldn't get the widget (e.g., a paid-client portal).

---

## Cost

Claude API at sonnet-4-6, ~600 max tokens per reply, ~1-3K tokens per turn including system prompt. Rough estimate at 100 chats/day:
- ~250K tokens/day → ~$1.50/day at current sonnet pricing
- Negligible until you're getting hundreds of conversations

If you want to cap: add `CHAT_DAILY_BUDGET_USD` logic in `chat.js` (function) later.

---

## What the bot will NOT do

- Won't quote prices it doesn't know (system prompt locks to AI Specialist/Team/Department only)
- Won't pretend to be Brady — says "I'm Efficio's AI assistant"
- Won't give legal/medical/financial advice — redirects politely
- Won't make promises about specific integrations — says "the discovery call is where we map exactly what we'd build"
- Won't auto-book a call — just shares the Calendly link

If you want it to do more (e.g., capture lead email mid-conversation, push to your CRM), add a `tools` array to the Anthropic call and define them.
