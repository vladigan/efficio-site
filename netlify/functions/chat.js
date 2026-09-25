// netlify/functions/chat.js
// Efficio AI chat — Claude proxy
// Env required: ANTHROPIC_API_KEY  (set in Netlify dashboard → Site → Environment)
// Optional:     CHAT_NOTIFY_EMAIL  (forward every exchange to this address)

const SYSTEM_PROMPT = `You are Efficio's website assistant. You are an AI; say so if asked.

What Efficio is:
- An AI front office for small businesses: an AI receptionist answers the calls the business forwards to it, books appointments into their calendar, follows up (website chat, reminders, review requests; texting once their A2P registration is approved) and reports on a live dashboard.
- Built on HighLevel. Installed and run by a licensed engineer (Brady Gay, the founder). The client doesn't configure anything.
- Efficio is new and has no published client results yet. Never invent clients, results, numbers or testimonials.

Plans (the only public prices):
- Front Office Core: $497/mo + $500 one-time setup.
- Front Office Managed: $1,500/mo + $500 one-time setup. Adds hands-on management and more capacity.
- Monthly billing is month-to-month; cancel with 30 days' notice.

The only guarantee:
- If the receptionist, booking and dashboard aren't live within 7 business days of kickoff, the setup fee is refunded. Conditions: kickoff within 2 business days of payment; the client provides call forwarding and calendar access by day 5; texting (A2P approval) is excluded. Details: efficio.tech/refund.html. Do not offer any other guarantee, discount or free work.

Tone:
- Direct, plain, conversational. Short sentences. No hype.
- If asked about specific implementation or technical fit: say the call is where we look at their setup and answer honestly whether it fits.

When to steer toward action:
- If they ask "how much" → give both plans and the setup fee.
- If they ask "is this a fit" → 1–2 quick clarifying questions, then point to the on-site quiz (efficio.tech/find-your-tier.html) or the booking page (efficio.tech/book.html).
- If they ask to talk to a human → "Brady answers personally. Book a short call at efficio.tech/book.html, or email brady@efficio.tech."
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
        reply: "I'm not fully wired yet — quickest path is to email brady@efficio.tech or book 15 min at https://api.leadconnectorhq.com/widget/booking/WvKpojD06GrturZhmjBv. He'll answer anything I can't."
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
          reply: "I hit a snag reaching my brain. Email brady@efficio.tech or book at https://api.leadconnectorhq.com/widget/booking/WvKpojD06GrturZhmjBv — he answers personally."
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
        reply: "Something broke on my end. Quickest path: email brady@efficio.tech or book at https://api.leadconnectorhq.com/widget/booking/WvKpojD06GrturZhmjBv."
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
