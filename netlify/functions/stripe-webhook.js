// netlify/functions/stripe-webhook.js
// Stripe webhook handler — when a payment_intent.succeeded or
// checkout.session.completed event fires, send a Brevo onboarding email
// and write a record to /state for Brady's records.
//
// Required env vars (set in Netlify Site settings → Environment):
//   STRIPE_WEBHOOK_SECRET   — whsec_... from Stripe dashboard webhook config
//   BREVO_API_KEY           — xkeysib-... from Brevo (Sendinblue)
//   BREVO_ONBOARDING_TEMPLATE_ID  — the Brevo template ID for onboarding email
//   BREVO_FROM_EMAIL        — sender email (e.g. brady@efficio.tech)
//   BREVO_FROM_NAME         — sender name (e.g. "Brady at Efficio")
//
// Stripe webhook endpoint to register in Stripe dashboard:
//   https://efficio.tech/.netlify/functions/stripe-webhook
//   (Or proxy via webhook.efficio.tech if cloudflared tunnel is preferred.)
//
// Events to subscribe in Stripe:
//   checkout.session.completed
//   payment_intent.succeeded
//   customer.subscription.created
//   customer.subscription.updated
//   invoice.payment_succeeded

const crypto = require('crypto');

// Tier mapping by Stripe Payment Link URL fragment / amount
// Brady: keep in sync with /pricing.html
const TIERS = {
  'price_solo':   { name: 'Solo Creator',     monthly: 997,  setup: 2500,  template: 'solo' },
  'price_team':   { name: 'Creator + Team',   monthly: 2500, setup: 7500,  template: 'team' },
  'price_prod':   { name: 'Production House', monthly: 3500, setup: 15000, template: 'prod' },
};

// Map by amount (cents) — fallback if metadata missing
function tierFromAmount(amountCents) {
  if (amountCents === 99700)  return TIERS.price_solo;
  if (amountCents === 250000) return TIERS.price_team;
  if (amountCents === 350000) return TIERS.price_prod;
  return null;
}

// Verify Stripe signature without the stripe SDK (lightweight)
function verifyStripeSig(payload, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(',').reduce((acc, kv) => {
    const [k, v] = kv.split('='); acc[k] = v; return acc;
  }, {});
  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'));
  } catch (e) { return false; }
}

// Send onboarding email via Brevo transactional API
async function sendBrevoOnboarding({ to, name, tier }) {
  const apiKey = process.env.BREVO_API_KEY;
  const templateId = process.env.BREVO_ONBOARDING_TEMPLATE_ID;
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'brady@efficio.tech';
  const fromName = process.env.BREVO_FROM_NAME || 'Brady at Efficio';

  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — skipping email send');
    return { skipped: true };
  }

  const body = templateId
    ? { to:[{email:to, name:name||to}], templateId:Number(templateId), params:{ tier_name:tier.name, monthly:tier.monthly, setup:tier.setup, name:name||'there' } }
    : {
        to:[{email:to, name:name||to}],
        sender:{email:fromEmail, name:fromName},
        subject:`Welcome to Efficio — ${tier.name} kickoff`,
        htmlContent:`
<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#0B1736;background:#F7F2EA;padding:40px;max-width:600px;margin:0 auto;">
  <p style="font-style:italic;font-size:24px;margin:0 0 24px 0;">Hey ${name||'there'},</p>
  <p style="font-size:16px;line-height:1.6;">You're in. ${tier.name} tier — $${tier.monthly}/mo + $${tier.setup} setup.</p>
  <p style="font-size:16px;line-height:1.6;">Here's what happens next:</p>
  <ol style="font-size:16px;line-height:1.7;">
    <li>I'll personally email you within 4 business hours with a kickoff calendar link.</li>
    <li>We'll do a 30-min onboarding call — you give us read-only access to your platforms.</li>
    <li>Within 7 days you'll have a live dashboard with all your revenue streams aggregated.</li>
  </ol>
  <p style="font-size:16px;line-height:1.6;">Questions? Just reply to this email. I read everything.</p>
  <p style="font-style:italic;font-size:18px;margin-top:32px;">— Brady</p>
  <p style="color:#7A8AB6;font-size:12px;margin-top:40px;border-top:1px solid #1a2342;padding-top:20px;">Efficio · Personal admin team for creators · <a href="https://efficio.tech" style="color:#C9302C;">efficio.tech</a></p>
</body></html>`,
      };

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method:'POST',
    headers:{'api-key':apiKey,'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) console.error('Brevo error', resp.status, data);
  return { ok: resp.ok, status: resp.status, data };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = event.body;

  if (secret && !verifyStripeSig(payload, sig, secret)) {
    return { statusCode: 400, body: 'Invalid signature' };
  }

  let stripeEvent;
  try { stripeEvent = JSON.parse(payload); }
  catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const type = stripeEvent.type;
  const obj = stripeEvent.data && stripeEvent.data.object;
  if (!obj) return { statusCode: 200, body: 'no object' };

  // Handle the events that mean "a creator just paid us"
  if (type === 'checkout.session.completed' || type === 'invoice.payment_succeeded') {
    const email = obj.customer_email || obj.customer_details?.email || obj.customer_address?.email;
    const name  = obj.customer_details?.name || '';
    const amount = obj.amount_total || obj.amount_paid || 0;

    const tier = tierFromAmount(amount) || TIERS.price_solo;

    try {
      const res = await sendBrevoOnboarding({ to: email, name, tier });
      console.log('onboarding email', { email, tier: tier.name, brevo: res });
    } catch (err) {
      console.error('email send failed', err);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true, type, email, tier: tier.name }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true, type }) };
};
