// netlify/functions/quiz-submit.js
// Audit-quiz lead capture endpoint.
// Receives: POST { email, name?, answers, source?, utm? }
// Returns:  { ok:true, redirect:'/thank-you.html' }
//
// Side effects:
//   1. Stores submission as JSON in Netlify Blob (or warns if blob store unavailable)
//   2. Sends confirmation email to the lead via Brevo
//   3. Sends notification email to brady@efficio.tech
//
// Env vars:
//   BREVO_API_KEY            — required for emails
//   BREVO_FROM_EMAIL         — sender (default brady@efficio.tech)
//   BREVO_FROM_NAME          — sender name (default "Brady at Efficio")
//   QUIZ_NOTIFY_EMAIL        — where to send notifications (default brady@efficio.tech)
//
// Note: Netlify Blobs require @netlify/blobs to be installed. If not present we
// fall back to console-logging the submission so nothing is lost. Brady can
// also view submissions in Netlify Forms by also POSTing to /api/quiz-submit
// from a Netlify-form-enabled page if he wants the dashboard view.

const FROM_EMAIL  = process.env.BREVO_FROM_EMAIL  || 'brady@efficio.tech';
const FROM_NAME   = process.env.BREVO_FROM_NAME   || 'Brady at Efficio';
const NOTIFY_TO   = process.env.QUIZ_NOTIFY_EMAIL || 'brady@efficio.tech';

async function sendBrevo({ to, subject, html, fromEmail, fromName, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('BREVO_API_KEY missing — would have sent to', to, subject);
    return { skipped: true };
  }
  const body = {
    to: [{ email: to }],
    sender: { email: fromEmail || FROM_EMAIL, name: fromName || FROM_NAME },
    subject,
    htmlContent: html,
  };
  if (replyTo) body.replyTo = { email: replyTo };
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error('Brevo error', resp.status, data);
  }
  return { ok: resp.ok, status: resp.status };
}

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' };

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: cors, body: 'Invalid JSON' }; }

  const email   = (payload.email || '').trim().toLowerCase();
  const name    = (payload.name  || '').trim();
  const answers = payload.answers || {};
  const source  = payload.source  || 'audit-quiz';
  const utm     = payload.utm     || {};

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'email required' }) };
  }

  const submission = {
    ts: new Date().toISOString(),
    email, name, answers, source, utm,
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '',
    ua: event.headers['user-agent'] || '',
  };

  // Best-effort persist via Netlify Blobs — if package isn't available we just log.
  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore({ name: 'quiz-leads' });
    const key = `${submission.ts.replace(/[:.]/g,'-')}_${email}`;
    await store.set(key, JSON.stringify(submission));
  } catch (e) {
    console.log('quiz-submission (blob unavailable)', JSON.stringify(submission));
  }

  // Confirmation email to the lead
  const confirmHtml = `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#0B1736;background:#F7F2EA;padding:40px;max-width:600px;margin:0 auto;">
  <p style="font-style:italic;font-size:24px;margin:0 0 24px 0;">Hey ${escapeHtml(name) || 'there'},</p>
  <p style="font-size:16px;line-height:1.6;">Thanks for the audit request. I read every one personally.</p>
  <p style="font-size:16px;line-height:1.6;">I'll get back to you within 4 business hours with a 15-minute time slot. We'll do a read-only look at your accounts and tell you exactly what's leaking.</p>
  <p style="font-size:16px;line-height:1.6;">In the meantime, you can <a href="https://efficio.tech/creator-demo.html" style="color:#C9302C;">see what your dashboard would look like &rarr;</a></p>
  <p style="font-style:italic;font-size:18px;margin-top:32px;">— Brady</p>
  <p style="color:#7A8AB6;font-size:12px;margin-top:40px;border-top:1px solid #1a2342;padding-top:20px;">Efficio · Personal admin team for creators · <a href="https://efficio.tech" style="color:#C9302C;">efficio.tech</a></p>
</body></html>`;
  await sendBrevo({ to: email, subject: 'Your Efficio audit — Brady will be in touch shortly', html: confirmHtml, replyTo: NOTIFY_TO });

  // Notification email to Brady
  const answersHtml = Object.entries(answers).map(([k,v]) => `<li><strong>${escapeHtml(k)}</strong>: ${escapeHtml(String(v))}</li>`).join('');
  const notifyHtml = `
<!DOCTYPE html><html><body style="font-family:monospace;background:#0B1736;color:#F7F2EA;padding:32px;">
  <h2 style="color:#D4A574;">New audit request</h2>
  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
  <p><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p><strong>Source:</strong> ${escapeHtml(source)}</p>
  <p><strong>UTM:</strong> ${escapeHtml(JSON.stringify(utm))}</p>
  <p><strong>Answers:</strong></p>
  <ul>${answersHtml}</ul>
  <p style="margin-top:24px;color:#7A8AB6;font-size:11px;">${submission.ts}</p>
</body></html>`;
  await sendBrevo({ to: NOTIFY_TO, subject: `[Efficio audit] ${email}`, html: notifyHtml });

  return {
    statusCode: 200,
    headers: { ...cors, 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true, redirect: '/thank-you.html' }),
  };
};
