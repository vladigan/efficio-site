"""Generate 4 AI-hire deep pages from a single template + per-role data."""
import os
from pathlib import Path

OUT = Path(__file__).parent

HIRES = [
    {
        "slug": "receptionist",
        "name": "AI Receptionist",
        "boundary": "OUTSIDE",
        "tagline": "Answers every inbound, books every appointment, never sends a lead to voicemail.",
        "human_role": "Front desk",
        "human_salary": "$30–50K/yr",
        "color_hex": "#7c3aed",
        "icon_svg": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        "owns": [
            ("Phones", "Picks up every inbound call. Books the appointment in your existing scheduling system. Captures the lead even if all your humans are busy."),
            ("Texts", "Reads inbound texts to your business line. Responds in your voice. Books or routes to a human."),
            ("Web forms", "Watches your contact-us form, every Zillow / Realtor / DIBBS / industry-specific intake form. Triggers instant response."),
            ("Booking", "Connects to Google Calendar / Calendly / your booking software. Books per your scheduling rules — provider, service type, recovery time, deposit."),
            ("Triage", "Flags emergencies and pushes to your on-call line. Screens against your fit / capacity / qualification rules."),
            ("First contact", "Sends the prep info (no caffeine before botox, comfortable clothes for the workout, etc.) in your voice."),
        ],
        "headline_stat": "100%",
        "headline_label": "Of inbound calls answered (vs 30–40% to voicemail at peak)",
        "headline_source": "ServiceTitan SMB Report 2023",
        "verticals": [
            ("HVAC contractor", "Answers a homeowner with a dead AC at 11pm in July. Books the morning slot, captures the address and equipment model, flags it as a same-day if heat-index is high. The next contractor doesn't get that call."),
            ("Dental practice", "Front desk drowning while you're cleaning a patient. Phone rings 3 times during a check-in. AI Receptionist picks up every call simultaneously — books new patients per insurance type, handles 'are you accepting?' questions."),
            ("Law firm", "New inquiry calls in. AI Receptionist screens against your matter-fit criteria, conflicts check, books a 15-min partner intro if qualified, politely declines if not."),
            ("Real estate team", "Zillow lead at 9:23pm Sunday. AI Receptionist responds instantly, captures contact + property + timeline + budget, books the Tuesday showing with the right agent."),
        ],
        "tools": ["Twilio / your phone system", "Google Calendar / Outlook / Calendly", "Your CRM (HubSpot / Pipedrive / GHL / ServiceTitan / Housecall Pro / Jobber / kvCORE / etc.)", "Your booking software", "Slack / Teams (for emergency escalations)"],
        "wks_to_setup": "5",
    },
    {
        "slug": "office-manager",
        "name": "AI Office Manager",
        "boundary": "INSIDE",
        "tagline": "Runs everything happening inside your business — inbox, docs, scheduling, KPIs, daily brief, escalations.",
        "human_role": "Office manager",
        "human_salary": "$45–90K/yr",
        "color_hex": "#9b6cf6",
        "icon_svg": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
        "owns": [
            ("Inbox triage", "Classifies every inbound email by intent (lead / customer / vendor / billing / junk). Drafts replies in your voice for one-click send. Surfaces what actually needs you."),
            ("Document filing", "Files PDFs, intake forms, contracts into the right matter / job / customer folder. Reads them so you don't have to."),
            ("Scheduling logistics", "Handles reschedules, cancellations, waitlist offers. Refills empty slots without you touching the calendar."),
            ("Internal handoffs", "Watches for stalled handoffs between staff — pings the right human when a customer file has sat idle past your normal SLA."),
            ("KPI tracking", "Pulls the numbers that matter (jobs/wk, win rate, AR aging, NPS, capacity used). Surfaces drift before it costs money."),
            ("Daily brief", "Compiles your 6-line morning brief by 7am: what shipped overnight, what needs you today, what's at risk."),
            ("Review + retention", "Asks happy customers for reviews at the right moment. Surfaces unhappy ones privately. Re-engages dormant customers on a polite cadence."),
        ],
        "headline_stat": "94%",
        "headline_label": "Drop in owner inbox time after Office Manager deploys",
        "headline_source": "Across customer deployments",
        "verticals": [
            ("Law firm", "Partner inbox going from 200 emails/day to a 6-line briefing. Discovery documents auto-filed to the right matter. Intake-screening emails drafted in the partner's voice."),
            ("HVAC owner", "Dispatch handoffs routed automatically. Tomorrow's job list compiled at 6am. Tech-late texts drafted. Recurring 'still waiting' customer follow-ups handled."),
            ("Dental practice", "Insurance follow-ups drafted with the right reason codes. Patient documents filed. Hygienist schedule monitored — empty slots backfilled from the waitlist."),
            ("Real estate team", "Transaction documents chased politely until they come back. TC inbox cleared. Stalled deals flagged before they go cold. Listing-comms cadence run."),
        ],
        "tools": ["Gmail / Outlook (via OAuth)", "Google Drive / Dropbox / OneDrive", "Your scheduling system", "Your CRM", "Slack / Teams (for the morning brief)"],
        "wks_to_setup": "6",
    },
    {
        "slug": "sales-navigator",
        "name": "AI Sales Navigator",
        "boundary": "MONEY-IN",
        "tagline": "Captures leads. Drafts quotes. Runs follow-up. Tracks pipeline. The work most shops drop.",
        "human_role": "Sales rep / business development",
        "human_salary": "$50–100K/yr",
        "color_hex": "#b794f6",
        "icon_svg": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        "owns": [
            ("Lead intake", "Reads every new lead from every channel — phone, web, email, ad form, partner referral. Captures the right context. Routes to the right next step."),
            ("Lead qualification", "Screens new inquiries against your fit / size / budget / timing rules. Books a real conversation only with the ones that match. Politely declines the rest."),
            ("Quote generation", "Inbound inquiry → itemized estimate against your pricing book. Tuned to your products, your terms, your add-ons. You approve, it sends."),
            ("Follow-up sequences", "Day-2 check-in. Day-5 nudge. Day-10 last-touch. In your voice. Referencing the specific job. No quote dies in someone's voicemail."),
            ("Pipeline tracking", "Every quote / proposal / open deal logged in your CRM with the right stage and next action. Win rate tracked. Drop-off points surfaced."),
            ("Lead nurture", "Cold leads from months ago get re-engaged on a polite cadence with the right value-first content. The leads you already paid to acquire stop rotting."),
        ],
        "headline_stat": "96%",
        "headline_label": "Faster inquiry-to-quote (4 hours → ~11 minutes)",
        "headline_source": "Across customer deployments",
        "verticals": [
            ("Plumbing contractor", "11pm leak emergency comes in via web form. Sales Navigator drafts the dispatch confirmation + estimated trip-charge + 'we'll be there by 7am' note in 90 seconds. Customer doesn't shop the next 4 plumbers."),
            ("Law firm", "New PI inquiry. Navigator runs the matter-fit screen, schedules a 30-min intro consult with the right partner, sends the pre-call intake form. Junior associate's afternoon back."),
            ("Roofing operator", "Insurance assessment lands. Estimate goes out. Customer goes silent. Navigator runs the day-2 / day-5 / day-10 cadence in your voice. Close rate on estimates goes up 30%."),
            ("Marketing agency", "Inbound from a referral. Navigator qualifies by industry + budget + timing, sends a customized loom + scope link, books a discovery call. You walk in informed, not asking what they do."),
        ],
        "tools": ["Your CRM (any major: HubSpot, Pipedrive, GHL, Salesforce, etc.)", "Your pricing book / proposal templates", "Stripe / your billing system", "Email + SMS via your existing infrastructure"],
        "wks_to_setup": "6",
    },
    {
        "slug": "bookkeeper",
        "name": "AI Bookkeeper",
        "boundary": "MONEY-OUT",
        "tagline": "AR chase. Expense categorization. Daily reconciliation. Monthly close. The work that closes the books by the 3rd instead of the 15th.",
        "human_role": "Bookkeeper",
        "human_salary": "$40–80K/yr",
        "color_hex": "#7c3aed",
        "icon_svg": '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
        "owns": [
            ("AR chase", "Reads QuickBooks / Stripe daily. Identifies invoices past 7 days. Drafts the right tone of follow-up — polite at 7 days, firm at 21, escalation at 45. In your voice. With the specific service referenced."),
            ("Expense categorization", "Every transaction auto-mapped to the right GL account. The 800 line items your bookkeeper used to category-by-category at month-end? Done daily, automatically."),
            ("Daily reconciliation", "Three-way match between bank, Stripe, and QuickBooks every night. Drift flagged within 24 hours, not at month-end."),
            ("Invoice generation", "Job complete / matter billed / engagement delivered? Invoice drafted from the line items, your terms attached, ready to send after approval."),
            ("Monthly close prep", "By the 3rd of each month: 'your books are 92% ready to close, here are the 14 items needing your eyes.' Clean handoff to your CPA."),
            ("AP basic", "Vendor invoices read + categorized. Recurring expenses flagged if pricing drifts. Approval queue surfaced for owner review."),
        ],
        "headline_stat": "12×",
        "headline_label": "Faster monthly close (books done by the 3rd, not the 15th)",
        "headline_source": "Across customer deployments",
        "verticals": [
            ("HVAC operator", "14 invoices past 7 days. AI Bookkeeper drafts polite follow-ups referencing each customer's specific repair. 9 paid within 48 hours. Owner didn't have to chase a single one."),
            ("Restaurant", "Daily reconciliation between Toast POS, Stripe, and bank. End-of-month drift caught on day 3, not day 30. Vendor invoices from 14 different suppliers categorized cleanly."),
            ("Law firm partners", "Time entries reconciled against billed work. Trust account compliance check daily. Realization rate tracked. Partners stop touching QuickBooks."),
            ("Property management", "Rent collection cycle managed. Tenant AR follow-ups drafted in compliance-safe language. Vendor 1099 tracking. Owner gets clean books at year-end."),
        ],
        "tools": ["QuickBooks Online (or Xero / FreshBooks)", "Stripe / Square / your payment processor", "Plaid for bank feed", "Your invoicing system"],
        "wks_to_setup": "5",
    },
]


# Build the page from a single template

NAV = '''<nav class="nav" id="nav"><div class="nav-inner">
  <a href="/" class="logo"><span class="logo-mark">E</span><span class="logo-text">Efficio</span></a>
  <div class="nav-links">
    <a href="/services.html">Services</a>
    <a href="/how-it-works.html">How it works</a>
    <a href="/agents.html">AI hires</a>
    <a href="/pricing.html">Pricing</a>
    <a href="/blog/">Blog</a>
    <a href="/qualify.html" class="btn-nav">Qualify in 60 sec</a>
  </div>
</div></nav>'''

FOOTER = '''<footer style="margin-top:80px;padding:40px 28px;border-top:1px solid var(--bd);text-align:center;font-size:13px;color:var(--muted)">
  © 2026 Efficio · BNG Contracting Enterprise LLC · Miami, FL ·
  <a href="/privacy.html" style="color:var(--purple3)">Privacy</a> ·
  <a href="/terms.html" style="color:var(--purple3)">Terms</a> ·
  <a href="/agents.html" style="color:var(--purple3)">All 4 AI hires</a>
</footer>'''


def page_html(h):
    owns_html = "".join([
        f'<div class="own-row"><div class="own-label">{lbl}</div><div class="own-text">{txt}</div></div>'
        for (lbl, txt) in h["owns"]
    ])
    vertical_html = "".join([
        f'<div class="vert-card"><h3>{vert}</h3><p>{txt}</p></div>'
        for (vert, txt) in h["verticals"]
    ])
    tools_html = "".join([f'<li>{t}</li>' for t in h["tools"]])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="/assets/pixels.js"></script>
<title>{h['name']} — your AI hire for {h['boundary'].lower()} work | Efficio</title>
<meta name="description" content="{h['name']}: {h['tagline']} Replaces a {h['human_salary']} {h['human_role']}. Live in your stack inside 7 days.">
<link rel="canonical" href="https://efficio.tech/agents/{h['slug']}.html">
<meta property="og:title" content="{h['name']} | Efficio">
<meta property="og:description" content="{h['tagline']}">
<meta property="og:image" content="https://efficio.tech/og-image.svg">
<meta property="og:type" content="article">
<script type="application/ld+json">
{{"@context":"https://schema.org","@graph":[
 {{"@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"Home","item":"https://efficio.tech/"}},
  {{"@type":"ListItem","position":2,"name":"AI hires","item":"https://efficio.tech/agents.html"}},
  {{"@type":"ListItem","position":3,"name":"{h['name']}","item":"https://efficio.tech/agents/{h['slug']}.html"}}]}},
 {{"@type":"Service","name":"{h['name']}","description":"{h['tagline']}",
  "provider":{{"@type":"Organization","name":"Efficio","url":"https://efficio.tech"}},
  "areaServed":{{"@type":"Country","name":"United States"}}}}]}}
</script>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c3aed'/><rect x='28' y='25' width='44' height='13' rx='4' fill='%23fff'/><rect x='28' y='43.5' width='30' height='13' rx='4' fill='%23fff'/><rect x='28' y='62' width='44' height='13' rx='4' fill='%23fff'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/theme.css">
<style>
.hr-shell{{max-width:960px;margin:0 auto;padding:130px 28px 80px}}
.hr-crumb{{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:22px}}
.hr-crumb a{{color:var(--purple3)}}
.hr-pill{{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;
  border:1px solid var(--bd2);background:rgba(124,58,237,.08);
  font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--purple3);margin-bottom:16px}}
.hr-pill .dot{{width:7px;height:7px;border-radius:50%;background:var(--purple2);box-shadow:0 0 8px var(--purple)}}
.hr-h1{{font-size:clamp(2.4rem,4.6vw,3.6rem);font-weight:900;color:var(--white);letter-spacing:-.04em;line-height:1.05;margin-bottom:18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}}
.hr-h1 .ic{{width:56px;height:56px;border-radius:14px;background:{h['color_hex']};color:#fff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}}
.hr-tagline{{font-size:1.2rem;color:var(--text);line-height:1.5;max-width:720px;margin-bottom:30px}}

.hr-stat{{display:flex;align-items:center;gap:24px;padding:24px 28px;
  background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(124,58,237,.02));
  border:1px solid rgba(124,58,237,.30);border-radius:12px;margin-bottom:48px;flex-wrap:wrap}}
.hr-stat-num{{font-size:clamp(2.6rem,5vw,3.6rem);font-weight:900;color:var(--purple2);letter-spacing:-.03em;line-height:1}}
.hr-stat-text{{flex:1;min-width:240px}}
.hr-stat-label{{font-size:1.05rem;font-weight:700;color:var(--white);line-height:1.45;margin-bottom:4px}}
.hr-stat-source{{font-size:12px;color:var(--muted);font-style:italic}}

.hr-section h2{{font-size:1.8rem;font-weight:800;color:var(--white);letter-spacing:-.025em;margin:54px 0 14px}}
.hr-section h2 em{{color:var(--purple3);font-style:italic}}
.hr-section p{{font-size:15px;color:var(--w2);line-height:1.7;margin-bottom:14px;max-width:780px}}

.owns{{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}}
@media(max-width:780px){{.owns{{grid-template-columns:1fr}}}}
.own-row{{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:16px 18px}}
.own-label{{font-size:12px;font-weight:800;color:var(--purple3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}}
.own-text{{font-size:13.5px;color:var(--w2);line-height:1.6}}

.verts{{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}}
@media(max-width:780px){{.verts{{grid-template-columns:1fr}}}}
.vert-card{{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:18px 20px;border-left:3px solid {h['color_hex']}}}
.vert-card h3{{font-size:13.5px;font-weight:800;color:var(--white);letter-spacing:-.01em;margin-bottom:8px}}
.vert-card p{{font-size:13.5px;color:var(--text);line-height:1.65;margin:0;max-width:none}}

.tools{{list-style:none;margin:14px 0 28px}}
.tools li{{padding:9px 0 9px 22px;position:relative;font-size:14px;color:var(--w2);border-bottom:1px dashed var(--bd3)}}
.tools li::before{{content:"●";position:absolute;left:0;color:var(--purple2);font-size:9px;top:13px}}

.math{{background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.02));
  border:1px solid rgba(124,58,237,.25);border-radius:12px;padding:24px 28px;margin:28px 0 0}}
.math .lbl{{font-size:11.5px;font-weight:800;color:var(--purple3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}}
.math .row{{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed var(--bd3);font-size:14.5px;color:var(--w2)}}
.math .row:last-child{{border-bottom:0;padding-top:12px;border-top:1px solid var(--bd);margin-top:6px;font-size:1.05rem;font-weight:700;color:var(--white)}}
.math .row b{{color:var(--white);font-weight:700}}
.math .row .v{{font-weight:800;color:var(--purple3);font-size:1.1rem}}

.cta-bar{{margin-top:50px;padding:32px;background:linear-gradient(135deg,var(--purple),var(--purple2));
  border-radius:14px;text-align:center;color:#fff}}
.cta-bar h3{{font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:-.02em;margin-bottom:8px}}
.cta-bar p{{font-size:14.5px;color:rgba(255,255,255,.85);margin-bottom:22px;max-width:520px;margin-left:auto;margin-right:auto}}
.cta-bar a{{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:#fff;color:#0a0612 !important;
  border-radius:8px;font-weight:800;font-size:14px;text-decoration:none;transition:transform .15s}}
.cta-bar a:hover{{transform:translateY(-2px)}}

.nav{{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px 0;
  background:rgba(8,8,10,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--bd)}}
.nav-inner{{max-width:1280px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between}}
.logo{{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--white);font-size:17px;letter-spacing:-.02em;text-decoration:none}}
.logo .logo-mark{{width:30px;height:30px;border-radius:7px;background:var(--purple);
  display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px}}
.nav-links{{display:flex;align-items:center;gap:4px;list-style:none}}
.nav-links a{{padding:8px 14px;font-size:14px;color:var(--text);font-weight:500;border-radius:var(--r);text-decoration:none}}
.nav-links a:hover{{color:var(--white)}}
.btn-nav{{padding:10px 20px;background:var(--purple);color:#fff !important;border-radius:var(--r);
  font-size:13.5px;font-weight:700}}
.btn-nav:hover{{background:var(--purple2)}}
@media(max-width:780px){{.nav-links a:not(.btn-nav){{display:none}}}}
</style>
</head>
<body>

{NAV}

<main class="hr-shell">
  <div class="hr-crumb"><a href="/">Home</a> &middot; <a href="/agents.html">AI hires</a> &middot; {h['name']}</div>
  <span class="hr-pill"><span class="dot"></span>The {h['boundary']} hire · live in {h['wks_to_setup']} days</span>
  <h1 class="hr-h1"><span class="ic">{h['icon_svg']}</span><span>{h['name']}</span></h1>
  <p class="hr-tagline">{h['tagline']}</p>

  <div class="hr-stat">
    <div class="hr-stat-num">{h['headline_stat']}</div>
    <div class="hr-stat-text">
      <div class="hr-stat-label">{h['headline_label']}</div>
      <div class="hr-stat-source">{h['headline_source']}</div>
    </div>
  </div>

  <div class="hr-section">
    <h2>What this <em>AI hire</em> owns</h2>
    <p>Each responsibility below maps to something a human in this role would do. We deploy the AI to handle it the same way you'd want a person to — except it doesn't sleep, quit, or take 6 weeks to ramp.</p>
    <div class="owns">{owns_html}</div>
  </div>

  <div class="hr-section">
    <h2>What it looks like <em>in your business</em></h2>
    <p>Same AI hire, different vertical, different sample interaction. We configure the {h['name']} to your business — your voice, your tools, your scheduling rules, your customers — on the audit call.</p>
    <div class="verts">{vertical_html}</div>
  </div>

  <div class="hr-section">
    <h2>Tools we plug into</h2>
    <p>Read-only OAuth. Never see passwords. Revocable any time from inside each tool. We connect to:</p>
    <ul class="tools">{tools_html}</ul>
  </div>

  <div class="hr-section">
    <h2>The math <em>vs. hiring this role in-house</em></h2>
    <div class="math">
      <div class="lbl">Annual cost comparison</div>
      <div class="row"><span>Human {h['human_role']} salary</span><span class="v">{h['human_salary']}</span></div>
      <div class="row"><span>+ benefits, taxes, training (rough +30%)</span><span class="v">+$15K–$30K</span></div>
      <div class="row"><span>+ turnover risk (avg 18-mo tenure)</span><span class="v">+recruiting cost</span></div>
      <div class="row"><span>True annual cost (all-in)</span><span class="v">$60–130K/yr</span></div>
      <div class="row"><span><b>AI {h['name'].replace('AI ','')} via Efficio</b></span><span class="v">$497–$3,500/mo · scales w/ tier</span></div>
    </div>
  </div>

  <div class="cta-bar">
    <h3>See if {h['name']} is your first hire.</h3>
    <p>8-question qualifier routes you to the right tier and books your free audit call. We name the workflow we'd ship in week one + the metric we'll move by day 30.</p>
    <a href="/qualify.html">Take the 60-sec qualifier &rarr;</a>
  </div>
</main>

{FOOTER}

<script src="/assets/transitions.js" defer></script>
<script src="/assets/chat.js" defer></script>
</body>
</html>
"""


for h in HIRES:
    fn = OUT / f"{h['slug']}.html"
    fn.write_text(page_html(h), encoding="utf-8")
    print(f"OK  {fn.relative_to(OUT.parent)}")

print(f"\nWrote {len(HIRES)} agent sub-pages.")
