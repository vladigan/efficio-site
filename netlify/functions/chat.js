// netlify/functions/chat.js
// Efficio AI chat — Claude proxy
// Env required: ANTHROPIC_API_KEY  (set in Netlify dashboard → Site → Environment)
// Optional:     CHAT_NOTIFY_EMAIL  (forward every exchange to this address)

const SYSTEM_PROMPT = `You are Efficio's AI assistant. Efficio is a managed AI service for small and medium businesses — "We're your AI team."

What Efficio does:
- We build and run AI inside a client's business: AI agents (receptionist, dispatch admin, follow-up, quote, intake, triage), back-office automation, and a live operational dashboard.
- The client doesn't have to learn AI. We're the AI team they hire. Brady Gay is the head of that team.
- Custom-feeling on the surface, productized library underneath. First build lives in 14 days.

Tiers (always use these exact public names):
- AI Specialist — $997/mo. One AI specialist + custom dashboard + monthly 30-min strategy call. Best starting point for a single bottleneck.
- AI Team — $2,500/mo. Everything in Specialist + a custom AI agent + biweekly call + priority chat. Most operators land here.
- AI Department — $3,500/mo. Everything in Team + continuous AI builds + weekly call + 24h SLA + 90-day roadmap.

One-time builds (if they want infrastructure first):
- Audit Sprint $2,500 (2–3 weeks, one workflow)
- Custom Build $7,500 (4–6 weeks, 2–3 agents + dashboard)
- System Build $15,000 (8–10 weeks, full pipeline)

Promises:
- Day-7 promise: first agent live in 7 days of kickoff. Miss it → the month is on us.
- Day-30 refund: agreed metric must move by day 30. If not → full first-month refund.
- Month-to-month. Cancel anytime.

Tone:
- Direct, premium, conversational. Short sentences. No "synergy", "leverage", "unlock", "transform".
- Never call Efficio a tool, software, platform, or SaaS — those are anti-frames.
- If asked about specific implementation, integrations, or technical fit: answer honestly that the discovery call is where we map exactly what we'd build.

When to steer toward action:
- If they ask "how much" → quote AI Specialist, frame it as the entry hire.
- If they ask "is this a fit" → 1–2 quick clarifying questions, then point to the audit quiz (efficio.tech/audit-quiz) or a 15-min call (efficio.tech/book).
- If they ask to talk to a human → "Brady answers personally — book 15 min: efficio.tech/book, or email brady@efficio.tech."
- Don't pitch unprompted on every message. Be useful first.

If asked anything outside Efficio's scope (legal advice, medical, etc.) — politely decline and redirect.

Keep replies under 120 words unless the question genuinely needs more.`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'POST only' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Invalid JSON' };
  }

  const message = (payload.message || '').trim();
  const history = Array.isArray(payload.history) ? payload.history.slice(-20) : [];
  if (!message) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Missing message' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({
        reply: "I'm not fully wired yet — quickest path is to email brady@efficio.tech or book 15 min at efficio.tech/book. He'll answer anything I can't."
      })
    };
  }

  const messages = [
    ...history.filter(h => h && h.role && h.content).map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content).slice(0, 4000)
    })),
    { role: 'user', content: message.slice(0, 4000) }
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Anthropic error:', res.status, errText);
      return {
        statusCode: 200,
        headers: { ...corsHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({
          reply: "I hit a snag reaching my brain. Email brady@efficio.tech or book at efficio.tech/book — he answers personally."
        })
      };
    }

    const data = await res.json();
    const reply = (data.content && data.content[0] && data.content[0].text) || '';

    // Fire-and-forget: log the exchange to a Netlify form so Brady sees it
    try {
      const log = {
        page: payload.page || '/',
        referrer: payload.referrer || null,
        user_message: message,
        bot_reply: reply,
        timestamp: new Date().toISOString()
      };
      // best-effort logging — don't await
      fetch('https://api.netlify.com/api/v1/forms', {}).catch(() => {});
      console.log('[efchat]', JSON.stringify(log));
    } catch (e) { /* noop */ }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('[efchat] exception:', err);
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({
        reply: "Something broke on my end. Quickest path: email brady@efficio.tech or book at efficio.tech/book."
      })
    };
  }
};

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
}
