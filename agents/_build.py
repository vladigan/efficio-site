# -*- coding: utf-8 -*-
"""Generate the elaborate, visual AI-team deep-dive pages from per-team data.

One template + per-team data -> 10 rich explainer pages under /agents/<slug>.html.
Each page carries: an inline-SVG WORKFLOW DIAGRAM (the real step-by-step flow),
a "what it owns" grid + "what it handles" chips, a before/after day-in-the-life,
a sample dashboard mockup, the tools it connects to, and the headcount math.

Workflows are sourced from the backend repo so they reflect what's really built /
built-to-order: docs/teams_catalog.md, src/products/*/catalog.py, docs/playbooks/*.

Discipline: "AI teams, not tools" voice; broad SMB; NO fabricated outcome stats or
testimonials (industry figures only, cited); real bars logo; mobile-clean; in-frame.
"""
import os
from pathlib import Path

OUT = Path(__file__).parent

# ----------------------------------------------------------------------------
# Inline SVG icon set (Feather-style, sized by CSS per context).
# ----------------------------------------------------------------------------
def _svg(body):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            + body + '</svg>')

ICONS = {
    "phone": _svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    "msg": _svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
    "mail": _svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    "clipboard": _svg('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>'),
    "calendar": _svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    "calcheck": _svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>'),
    "bell": _svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
    "filter": _svg('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
    "alert": _svg('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    "pencil": _svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>'),
    "check": _svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
    "star": _svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
    "chart": _svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/>'),
    "upload": _svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
    "refresh": _svg('<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
    "tag": _svg('<path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
    "mic": _svg('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>'),
    "search": _svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    "doc": _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    "dollar": _svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    "clock": _svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    "users": _svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    "megaphone": _svg('<path d="m3 11 14-4v12L3 15z"/><path d="M17 9a3 3 0 0 1 0 6"/><path d="M7 16v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2"/>'),
    "wallet": _svg('<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'),
    "layers": _svg('<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'),
    "userplus": _svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>'),
}

ARROW = ('<svg class="ar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
         'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'
         '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>')


# ----------------------------------------------------------------------------
# Per-team data. status: "available" (productized / live now) | "built" (7-day).
# ----------------------------------------------------------------------------
TEAMS = [
    {
        "slug": "receptionist", "name": "Front Office Team", "status": "available",
        "hero_icon": "phone",
        "pill": "Available now · first team live in 7 days",
        "tagline": "Answers every inbound, books every appointment, never sends a lead to voicemail.",
        "human_role": "front desk", "human_salary": "$30–50K/yr",
        "efficio_price": "$497/mo standalone · or bundled in a tier",
        "leak_big": "30–40%", "leak_label": "of inbound calls go to voicemail at peak — every one of them is a lead the next shop catches. The Front Office Team answers all of them.",
        "leak_source": "ServiceTitan SMB Report",
        "what": "The Front Office Team is the teammate that owns first contact. It picks up every call, text, and web form the moment it lands — day, night, weekend — answers in your voice, captures the lead, books the job on your calendar, and flags real emergencies to your on-call. The customer never hits voicemail and never shops the next number.",
        "workflow": [
            ("phone", "Inbound arrives", "A call, text, or web form hits your business — 24/7."),
            ("msg", "Replies in seconds", "Texts the missed caller back and answers in your voice before they dial the next shop."),
            ("clipboard", "Captures the details", "Name, job, reason, urgency — logged straight to your CRM."),
            ("calcheck", "Books the job", "Drops it on your calendar per your scheduling rules — service type, provider, recovery time."),
            ("bell", "Confirms + reminds", "Sends confirmation and reminders, and pushes true emergencies to your on-call line."),
        ],
        "handles": ["Missed-call text-back", "Inbound calls", "Web-form auto-reply", "Appointment booking", "Confirmations + reminders", "Emergency triage", "Lead capture to CRM"],
        "before": ["Phone rings while you're on a job — it goes to voicemail.", "After-hours leads call the next contractor and book them instead.", "Web-form inquiries sit unread until tomorrow morning."],
        "after": ["Every call, text, and form answered in seconds, around the clock.", "The 11pm emergency is captured, booked, and confirmed before you wake up.", "Your calendar fills itself; you just show up to the work."],
        "tools": ["Twilio / your phone system", "Google Calendar / Outlook / Calendly", "Your CRM (HubSpot / Pipedrive / GHL / ServiceTitan / Housecall Pro / Jobber / kvCORE)", "Your booking software", "Slack / Teams (for emergency escalations)"],
        "dash_kpis": [("Leads caught · wk", "18"), ("Missed calls recovered", "6"), ("Bookings", "12"), ("Avg response", "18s")],
        "dash_bars": [4, 6, 5, 8, 7, 9, 11],
        "dash_agents": [("Speed-to-lead responder", "Answers every call, text, and form in seconds"), ("Booker", "Drops the job on your calendar per your rules"), ("Emergency triage", "Pushes true emergencies to your on-call line")],
    },
    {
        "slug": "inbox-manager", "name": "Inbox Manager", "status": "available", "live": True,
        "hero_icon": "mail",
        "pill": "Available now · live today",
        "tagline": "Every email triaged by intent, a reply drafted in your voice, the hot ones surfaced — before you open your inbox.",
        "human_role": "inbox & admin assistant", "human_salary": "$40–60K/yr",
        "efficio_price": "$497/mo · live now",
        "leak_big": None, "leak_label": "Your inbox is where leads go to wait. The Inbox Manager reads every message the moment it arrives, sorts it by intent, and has the reply written before you've finished your coffee — you just review and send.",
        "leak_source": None,
        "what": "The Inbox Manager connects to your inbox read-only, reads every incoming message, and classifies it by intent — hot lead, booking, pricing question, decline, junk. It drafts a one-click reply in your voice for everything worth answering and pushes the messages that need you today to the top of the queue. You stop digging through email; you review and hit send. It never sends anything for you.",
        "workflow": [
            ("mail", "Email arrives", "We read every inbound message — read-only, never your password."),
            ("filter", "Sorted by intent", "Classified in seconds: hot lead, booking, pricing, question, decline, junk."),
            ("alert", "Hot ones surfaced", "Whatever needs you today jumps to the top of the queue."),
            ("pencil", "Reply drafted", "A ready-to-send reply, written in your voice, for every message worth one."),
            ("check", "You approve & send", "One click. We never send anything for you."),
        ],
        "handles": ["Intent classification", "Hot-lead surfacing", "One-click reply drafts", "Booking requests", "Pricing questions", "Junk suppression", "Draft-only — never auto-sends"],
        "before": ["200 unread emails, the one that matters buried on page three.", "Hot leads cool off while you're heads-down on the work.", "Every reply written from scratch, one at a time, late at night."],
        "after": ["The three messages that need you today, sitting at the top.", "A drafted reply waiting under each one, in your voice.", "Inbox handled before you open it — you review and send."],
        "tools": ["Gmail / Outlook / any IMAP inbox (read-only)", "Your CRM (for lead context)", "Your branded /c/ dashboard (reply queue)", "Slack / Teams (hot-lead pings)"],
        "dash_kpis": [("Triaged today", "47"), ("Hot — need you now", "3"), ("Drafts ready", "12"), ("Triaged all-time", "1,284")],
        "dash_bars": [22, 30, 26, 41, 38, 47, 44],
        "dash_agents": [("Inbox triage", "Reads every message and sorts it by intent in seconds"), ("Reply drafter", "Writes a ready-to-send reply for every lead, question, and booking"), ("Hot-lead surfacer", "Pushes the messages that need you today to the top")],
    },
    {
        "slug": "review-engine", "name": "Review Engine", "status": "available",
        "hero_icon": "star",
        "pill": "Available now",
        "tagline": "Every happy customer turned into a 5-star review — the ask drafted automatically, the reputation tracked.",
        "human_role": "reputation / marketing assistant", "human_salary": "$40–55K/yr",
        "efficio_price": "$497/mo",
        "leak_big": None, "leak_label": "Most happy customers never leave a review — not because they won't, but because nobody asked at the right moment. The Review Engine asks every time, with your links ready to click.",
        "leak_source": None,
        "what": "The Review Engine watches for completed jobs and bookings, then drafts a friendly review request to that customer with your Google and Facebook links ready to tap. You approve and send; the reviews roll in. It tracks who's been asked, who responded, and your average rating on one panel — so your reputation compounds without you chasing anyone.",
        "workflow": [
            ("calcheck", "Job completed", "A booking or finished job is detected — the right moment to ask."),
            ("star", "Request drafted", "A friendly review ask with your Google + Facebook links, in your voice."),
            ("check", "You approve & send", "One click; the customer gets it while the good feeling is fresh."),
            ("msg", "Review lands", "Happy customers leave the 5-star review they'd otherwise have skipped."),
            ("chart", "Reputation tracked", "Who's been asked, who responded, average rating — one dashboard."),
        ],
        "handles": ["Post-job review asks", "Google + Facebook links", "Perfect-timing triggers", "No double-asks", "Response tracking", "Average-rating panel", "Draft-only — never auto-sends"],
        "before": ["You know the work was great — but the review never gets requested.", "Competitors with more 5-stars win the click before you do.", "Asking feels awkward, so it slips every single time."],
        "after": ["A review request drafted the moment a job closes.", "Your star count climbing without you thinking about it.", "One panel showing exactly where your reputation stands."],
        "tools": ["Inbox Manager / Front Office signals (booking + job-done triggers)", "Your Google Business + Facebook review links", "Your branded /c/ dashboard (reputation panel)", "Manual contact import (fallback)"],
        "dash_kpis": [("Requests sent", "36"), ("Responses", "21"), ("Drafts awaiting send", "4"), ("Avg rating", "4.8★")],
        "dash_bars": [3, 5, 4, 6, 7, 6, 8],
        "dash_agents": [("Review asker", "Drafts a review request after every booking or completed job"), ("Reputation tracker", "Tracks who's been asked and who responded — no double-asks, no chasing")],
    },
    {
        "slug": "retention-coordinator", "name": "Win-Back", "status": "available",
        "hero_icon": "refresh",
        "pill": "Available now",
        "tagline": "Turn your dead leads into booked jobs — a few friendly nudges, drafted for every one.",
        "human_role": "retention coordinator", "human_salary": "$45–60K/yr",
        "efficio_price": "$497/mo",
        "leak_big": None, "leak_label": "The leads you already paid to acquire don't have to rot. Hand us the quotes that went quiet and the customers you've lost touch with — the Win-Back team drafts a short, friendly nudge for each one.",
        "leak_source": None,
        "what": "Win-Back takes the list you already have — old quotes that went silent, past customers, a CSV — and drafts a short, sequenced re-engagement for each one: a soft check-in, a value nudge, a last call. You approve and send; it tracks who's at which touch so nobody gets nudged twice. Found money from a list you already own.",
        "workflow": [
            ("upload", "You hand us the list", "Old quotes that went quiet, past customers, a simple CSV."),
            ("pencil", "Sequence drafted", "A short, friendly win-back per lead: soft check-in → value nudge → last call."),
            ("check", "You approve & send", "Your voice, your call — nothing goes out without you."),
            ("refresh", "Paced automatically", "We track who's at which touch so nobody gets nudged twice."),
            ("chart", "Revived leads tracked", "Dead list → booked jobs, on one win-back dashboard."),
        ],
        "handles": ["Stale-lead re-engagement", "3-touch sequence", "Past-customer win-back", "Per-lead pacing", "No double-nudges", "Booked-from-dead tracking", "Draft-only — never auto-sends"],
        "before": ["Hundreds of old quotes sitting cold in a spreadsheet.", "Past customers you'd happily serve again, never contacted.", "Re-engagement is always next week's job — forever."],
        "after": ["Every dormant lead gets a friendly, well-timed nudge.", "Booked jobs coming back from a list you already paid for.", "A clean view of who re-engaged and who's still in sequence."],
        "tools": ["A CSV of your old leads / past customers (no new login)", "Brevo (send transport, your account)", "Your branded /c/ dashboard (win-back panel)", "Your CRM (optional, for status sync)"],
        "dash_kpis": [("Leads in win-back", "220"), ("Drafts this run", "14"), ("Still in sequence", "96"), ("Sequence complete", "58")],
        "dash_bars": [5, 9, 7, 12, 10, 14, 13],
        "dash_agents": [("Lead reviver", "Drafts a friendly win-back sequence for every stale lead you give us"), ("Sequence pacer", "Tracks who's at which touch so nobody gets nudged twice")],
    },
    {
        "slug": "weekly-recap", "name": "Weekly Recap", "status": "available", "addon": True,
        "hero_icon": "chart",
        "pill": "Available now · $197/mo add-on",
        "tagline": "Your week with Efficio, in one email — what your AI team actually did for you, every Monday.",
        "human_role": "ops / reporting analyst time", "human_salary": "$25–40/hr",
        "efficio_price": "$197/mo add-on",
        "leak_big": None, "leak_label": "Proof of what your AI team did — leads caught, calls recovered, bookings, emails triaged — totalled and trended, in your inbox every Monday. No logging in, no digging.",
        "leak_source": None,
        "what": "Weekly Recap reads the data your other Efficio modules already produce — Front Office KPIs, the Inbox Manager queue, your bookings — and turns it into a clean, plain-English recap email with the week-over-week trend. It's the status report you'd never sit down to write, drafted for you and delivered every Monday. It rides on top of any paid module; it adds no new fulfillment work.",
        "workflow": [
            ("refresh", "Your AI team works", "Every module runs across your business all week long."),
            ("clipboard", "Everything logged", "Leads caught, missed calls recovered, bookings, emails triaged, hot leads."),
            ("chart", "Totalled + trended", "Summed for the week with the week-over-week movement."),
            ("mail", "Recap drafted", "A clean, plain-English email — the proof you'd never write yourself."),
            ("bell", "In your inbox Monday", "No logging in, no digging. Just momentum, every week."),
        ],
        "handles": ["Weekly totals", "Week-over-week trend", "Leads + bookings recap", "Inbox + hot-lead recap", "Plain-English summary", "Monday delivery", "Generate-only — never auto-sends"],
        "before": ["You're paying for AI but can't see what it actually did.", "\"Is this working?\" with no number to point at.", "Nobody has time to compile a weekly report."],
        "after": ["A clear recap of the week's wins, automatically.", "Week-over-week trend so you see momentum at a glance.", "Proof in your inbox every Monday — zero effort."],
        "tools": ["Your other Efficio module dashboards (data source)", "Optional: Calendly / pipeline feeds", "Your branded /c/ dashboard (reporting panel)", "Email delivery (your account)"],
        "dash_kpis": [("Leads caught · wk", "31"), ("Bookings · wk", "12"), ("Emails triaged", "188"), ("Hot leads surfaced", "9")],
        "dash_bars": [18, 24, 21, 27, 25, 31, 29],
        "dash_agents": [("Weekly recap", "Totals everything your AI team did and emails you the proof every week"), ("Trend tracker", "Week-over-week movement so you see momentum at a glance")],
    },
    {
        "slug": "sales-navigator", "name": "Sales Team", "status": "built",
        "hero_icon": "dollar",
        "pill": "Built for you in 7 days",
        "tagline": "Captures every lead, drafts the quote against your pricing, and runs follow-up until they decide.",
        "human_role": "sales coordinator + SDR", "human_salary": "$50–80K/yr",
        "efficio_price": "Built-to-order · from $997/mo",
        "leak_big": "~7×", "leak_label": "more likely to qualify a lead when you respond within an hour instead of later. Most inquiries wait hours; the Sales Team answers in seconds and never lets a quote die in follow-up.",
        "leak_source": "Harvard Business Review, “The Short Life of Online Sales Leads”",
        "what": "The Sales Team is built for you from parts we've already shipped — instant lead response (Front Office) and intent triage (Inbox Manager) — plus a quoting helper tuned to your pricing model and a pipeline mapped to your stages. New lead in, answered in seconds, quoted against your real numbers, followed up day-2 / day-5 / day-10, and tracked from Quoted to Won or Lost. You approve every quote; nothing sends without you.",
        "workflow": [
            ("phone", "Lead arrives", "Any channel — phone, web, ad form, partner referral."),
            ("msg", "Instant response", "Answered in seconds and triaged by intent (reuses Front Office + Inbox)."),
            ("tag", "Quote drafted", "Itemized against your pricing model — built for your vertical."),
            ("refresh", "Follow-up runs", "Day-2, day-5, day-10 nudges in your voice until they decide."),
            ("chart", "Pipeline updated", "Quoted → Won / Lost tracked; drop-off points surfaced."),
        ],
        "build": [("D1", "Scope: CRM, pricing model, stages"), ("D2", "Lead response live"), ("D3", "Inbox triage live"), ("D4", "Quoting helper built"), ("D5", "Pipeline mapped"), ("D6", "Dashboard + dry run"), ("D7", "Go live")],
        "handles": ["Instant lead response", "Lead qualification", "Itemized quote drafts", "Day-2/5/10 follow-up", "Pipeline tracking", "Win-rate + drop-off", "Draft-only quotes"],
        "before": ["A web lead at 11pm waits till morning — by then they've called four others.", "Quotes go out late, in inconsistent formats, when someone gets to it.", "Follow-up is whoever-remembers; most quotes die in silence."],
        "after": ["Every lead answered in seconds, any hour, any channel.", "An itemized quote drafted against your real pricing, fast.", "A follow-up cadence that runs itself — and a pipeline you can actually see."],
        "tools": ["Your CRM (HubSpot, Pipedrive, GHL, Salesforce, etc.)", "Your pricing book / proposal templates", "Email + SMS via your existing infrastructure", "Stripe / your billing system (optional)"],
        "dash_kpis": [("New leads · wk", "24"), ("Quotes drafted", "18"), ("In follow-up", "11"), ("Win rate", "34%")],
        "dash_bars": [9, 14, 12, 17, 15, 19, 18],
        "dash_agents": [("Lead responder", "Answers and qualifies every new lead in seconds"), ("Quote drafter", "Builds an itemized quote against your pricing model"), ("Follow-up runner", "Runs the day-2/5/10 cadence and tracks the pipeline")],
    },
    {
        "slug": "marketing-coordinator", "name": "Marketing Team", "status": "built",
        "hero_icon": "megaphone",
        "pill": "Built for you in 7 days",
        "tagline": "Content, social, reviews, and local SEO — drafted in your voice and kept consistent. Organic only.",
        "human_role": "marketing coordinator", "human_salary": "$50–75K/yr",
        "efficio_price": "Built-to-order · from $997/mo",
        "leak_big": None, "leak_label": "Reviews and content compound — but only if someone's actually doing them. The Marketing Team drafts both in your voice and runs the review flywheel; you approve and post. No ad-buying, no auto-posting.",
        "leak_source": None,
        "what": "The Marketing Team pairs the productized Review Engine with a content and social draft generator tuned to your audience and channels, plus an SEO starter audit of your site. It captures your brand voice at kickoff, runs the review flywheel, drafts your posts and a two-week calendar, and hands you on-page fixes. Everything is draft-only — you approve and post. We never buy ads and never auto-post.",
        "workflow": [
            ("mic", "Your voice captured", "Brand assets and tone locked in at kickoff."),
            ("star", "Reviews flywheel", "The Review Engine runs — reputation compounds (productized)."),
            ("pencil", "Content drafted", "Posts and content for your channels and cadence, in your voice."),
            ("calendar", "2-week calendar", "A draft social calendar generated from your topics."),
            ("search", "SEO starter", "On-page + keyword audit with fixes. You approve and post — no auto-posting."),
        ],
        "build": [("D1", "Validate + brand voice"), ("D2", "Reviews live"), ("D3", "Content engine built"), ("D4", "2-week calendar drafted"), ("D5", "SEO starter audit"), ("D6", "Marketing dashboard"), ("D7", "Handoff")],
        "handles": ["Review generation", "Content drafts", "Social post drafts", "2-week calendar", "On-page SEO audit", "Brand-voice consistency", "Organic only — no ad-buying"],
        "before": ["Posting is sporadic — three this week, nothing for a month.", "Reviews never get requested; the page looks stale.", "SEO is a mystery nobody has time to touch."],
        "after": ["A steady drafted content calendar in your voice.", "Reviews compounding from every finished job.", "A clear list of on-page SEO fixes, prioritized."],
        "tools": ["Your website (for the SEO audit)", "Your social channels (you post; we draft)", "Google Business + Facebook (reviews)", "Your branded /c/ dashboard (content + reviews queue)"],
        "dash_kpis": [("Reviews requested", "28"), ("Posts drafted · wk", "16"), ("Calendar slots", "14"), ("SEO fixes", "11")],
        "dash_bars": [6, 10, 9, 12, 11, 14, 13],
        "dash_agents": [("Content drafter", "Drafts posts and content for your channels in your voice"), ("Review engine", "Runs the review flywheel after every completed job"), ("SEO auditor", "Finds and prioritizes the on-page fixes that move rankings")],
    },
    {
        "slug": "bookkeeper", "name": "Finance Team", "status": "built",
        "hero_icon": "wallet",
        "pill": "Built for you in 7 days",
        "tagline": "Invoices drafted the day work ships, overdue accounts chased for you, at-risk payments surfaced. No money moved automatically.",
        "human_role": "bookkeeper + AR clerk", "human_salary": "$50–70K/yr",
        "efficio_price": "Built-to-order · from $997/mo",
        "leak_big": None, "leak_label": "Invoices that go out late get paid late. The Finance Team drafts them the day the work's done and chases the overdue ones for you — in your voice, draft-only. It never moves money on its own.",
        "leak_source": None,
        "what": "The Finance Team is built on our Stripe spine and lifecycle signals, plus invoice templates from your typical line items and an AR follow-up sequence at the firmness you choose. Work ships, the invoice is drafted from your line items, you issue it (a Stripe link, or exported to QuickBooks / Xero). Overdue accounts get a drafted follow-up — gentle, standard, firm — and failed or late payments surface as at-risk on your dashboard. Drafts and specs only: no money is ever moved automatically, and bookkeeping/tax stay with your accountant.",
        "workflow": [
            ("doc", "Work is billed", "A job's done or an engagement is delivered."),
            ("dollar", "Invoice drafted", "From your line items and terms — you issue it (Stripe link or export to QuickBooks / Xero)."),
            ("clock", "Overdue detected", "We watch what's past due against your terms."),
            ("pencil", "AR follow-up drafted", "Gentle → standard → firm, in your voice. Draft-only."),
            ("alert", "At-risk surfaced", "Failed and overdue payments flagged on the dashboard. No money is moved automatically."),
        ],
        "build": [("D1", "Validate accounting tool + terms"), ("D2", "Invoice templates built"), ("D3", "Stripe / export wiring"), ("D4", "AR follow-up sequence"), ("D5", "At-risk signals wired"), ("D6", "Finance dashboard"), ("D7", "Handoff")],
        "handles": ["Invoice drafting", "Stripe links / QuickBooks export", "Overdue detection", "AR follow-up (3 firmness levels)", "At-risk flags", "Draft-only — no auto-charge", "Bookkeeping stays with your CPA"],
        "before": ["Invoices go out whenever someone gets to them — days late.", "Overdue accounts pile up; chasing them feels rude, so you don't.", "You find out a payment failed long after it did."],
        "after": ["An invoice drafted the day the work ships.", "Overdue accounts chased politely, in your voice, on schedule.", "Failed and late payments flagged the moment they happen."],
        "tools": ["Stripe (invoicing + links)", "QuickBooks Online / Xero (export for manual issue)", "Your payment processor", "Your branded /c/ dashboard (finance panel)"],
        "dash_kpis": [("Invoices drafted · wk", "22"), ("Awaiting issue", "4"), ("Overdue flagged", "5"), ("Follow-ups drafted", "5")],
        "dash_bars": [10, 16, 13, 19, 17, 22, 20],
        "dash_agents": [("Invoice drafter", "Drafts each invoice from your line items the day work ships"), ("AR follow-up", "Drafts gentle-to-firm chasers for every overdue account"), ("At-risk monitor", "Surfaces failed and overdue payments on your dashboard")],
    },
    {
        "slug": "office-manager", "name": "Back Office Team", "status": "built",
        "hero_icon": "layers",
        "pill": "Built for you in 7 days",
        "tagline": "Absorbs the recurring admin — scheduling, reminders, inbox triage, reporting — so it runs in the background.",
        "human_role": "office manager", "human_salary": "$45–90K/yr",
        "efficio_price": "Built-to-order · from $2,500/mo (AI Team)",
        "leak_big": None, "leak_label": "The admin that eats your day — scheduling, the inbox, follow-ups, the weekly report — handled in the background. The Back Office Team is assembled from the modules you already trust, tuned to your recurring tasks.",
        "leak_source": None,
        "what": "The Back Office Team is an assembly of productized modules plus light glue tuned to your specific recurring tasks. It runs scheduling and reminders (Front Office parts), triages your admin inbox and drafts replies (Inbox Manager), automates your highest-value recurring task as draft-safe glue, and compiles a weekly report (Weekly Recap). One back-office view; the busywork runs while you do the work that matters.",
        "workflow": [
            ("calendar", "Scheduling + reminders", "Booking and reminder automations run (Front Office parts)."),
            ("filter", "Admin inbox triaged", "Sorted by intent and replies drafted (Inbox Manager)."),
            ("refresh", "Recurring task automated", "Your highest-value repeating task, built as draft-safe glue."),
            ("chart", "Weekly reporting", "Weekly Recap compiles what got handled."),
            ("check", "You see it all", "One back-office view; the busywork runs in the background."),
        ],
        "build": [("D1", "Map the top recurring time-sinks"), ("D2", "Scheduling + reminders"), ("D3", "Inbox / admin triage"), ("D4", "Highest-value task glue"), ("D5", "Reporting (Weekly Recap)"), ("D6", "Back-office dashboard"), ("D7", "Handoff")],
        "handles": ["Scheduling + reschedules", "Reminders", "Admin inbox triage", "Drafted replies", "One recurring task automated", "Weekly reporting", "Owner overview"],
        "before": ["Reschedules, reminders, and filing eat hours every week.", "The admin inbox is a second full-time job nobody has.", "No one ever has time to write up what actually got done."],
        "after": ["Scheduling and reminders run themselves.", "The admin inbox triaged and drafted before you look.", "A weekly report that writes itself — you just read it."],
        "tools": ["Gmail / Outlook (admin inbox)", "Your scheduling system", "Your CRM", "The tools behind your top recurring task (scoped per client)", "Slack / Teams"],
        "dash_kpis": [("Bookings handled · wk", "19"), ("Inbox triaged", "142"), ("Tasks automated", "3"), ("Owner brief", "✓")],
        "dash_bars": [12, 18, 15, 21, 19, 24, 22],
        "dash_agents": [("Scheduler", "Runs booking, reschedules, and reminders"), ("Inbox triage", "Sorts the admin inbox and drafts replies"), ("Reporter", "Compiles the weekly recap of what got handled")],
    },
    {
        "slug": "onboarding-specialist", "name": "Client Onboarding Team", "status": "built",
        "hero_icon": "userplus",
        "pill": "Built for you in 7 days",
        "tagline": "Runs your new-client onboarding — intake, documents, kickoff, status — so no client ghosts during setup.",
        "human_role": "onboarding specialist", "human_salary": "$45–65K/yr",
        "efficio_price": "Built-to-order · from $997/mo",
        "leak_big": None, "leak_label": "First impressions set the relationship. The Client Onboarding Team gives every new client the same flawless welcome — intake, docs, kickoff, status tracking — modelled on your exact process.",
        "leak_source": None,
        "what": "The Client Onboarding Team re-points our own intake and onboarding spine at your process: a branded intake form that collects the docs you need, a welcome and step sequence drafted in your voice, kickoff scheduling wired to your calendar tool, and a dashboard tracking each new client's onboarding stage. We productized our own onboarding — this builds yours. Drafts and links only; your tools execute signing and payment.",
        "workflow": [
            ("users", "New client signs", "The handoff that usually gets messy."),
            ("clipboard", "Branded intake", "A form collects their docs and info — built to your process."),
            ("pencil", "Welcome drafted", "Welcome + step emails in your voice, draft-only."),
            ("calcheck", "Kickoff scheduled", "Their kickoff wired into Calendly / GHL."),
            ("chart", "Stage tracked", "Each client's onboarding stage on one dashboard — nothing slips."),
        ],
        "build": [("D1", "Map their flow + docs"), ("D2", "Branded intake form"), ("D3", "Welcome sequence drafted"), ("D4", "Kickoff scheduling wired"), ("D5", "Status tracking dashboard"), ("D6", "Dry run a test client"), ("D7", "Go live")],
        "handles": ["Branded client intake", "Document collection", "Welcome + step emails", "Kickoff scheduling", "Per-client stage tracking", "Draft-only sends", "Modelled to your process"],
        "before": ["New clients get a different, improvised welcome every time.", "Documents trickle in late; setup stalls and clients go quiet.", "No one can say which client is stuck at which step."],
        "after": ["Every client gets the same polished welcome, automatically.", "Intake and documents collected through one branded form.", "A board showing exactly where each new client stands."],
        "tools": ["Your intake / onboarding tools", "Calendly / GHL (kickoff scheduling)", "Your e-sign + payment tools (you execute; we draft + link)", "Your branded /c/ dashboard (onboarding board)"],
        "dash_kpis": [("Clients onboarding", "7"), ("Intakes complete", "5"), ("Kickoffs booked", "4"), ("Stuck", "1")],
        "dash_bars": [2, 3, 3, 5, 4, 6, 7],
        "dash_agents": [("Intake builder", "Runs a branded intake form that collects every doc you need"), ("Welcome drafter", "Drafts the welcome and step emails in your voice"), ("Stage tracker", "Shows where each new client stands in onboarding")],
    },
]

# No self-serve checkout: every tier starts with the free build, so the CTA
# routes to the fit quiz rather than a payment link.
INBOX_CTA = "/find-your-tier.html"

# ----------------------------------------------------------------------------
# Shared markup
# ----------------------------------------------------------------------------
NAV = '''<nav class="nav" id="nav"><div class="nav-inner">
  <a href="/" class="logo"><span class="logo-mark">E</span><span class="logo-text">Efficio</span></a>
  <div class="nav-links">
    <a href="/services.html">Services</a>
    <a href="/how-it-works.html">How it works</a>
    <a href="/agents.html">AI teams</a>
    <a href="/pricing.html">Pricing</a>
    <a href="/blog/">Blog</a>
    <a href="/qualify.html" class="btn-nav">Qualify in 60 sec</a>
  </div>
</div></nav>'''

FOOTER = '''<footer style="margin-top:80px;padding:40px 28px;border-top:1px solid var(--bd);text-align:center;font-size:13px;color:var(--muted)">
  &copy; 2026 Efficio &middot; BNG Contracting Enterprise LLC &middot; Miami, FL &middot;
  <a href="/privacy.html" style="color:var(--purple3)">Privacy</a> &middot;
  <a href="/terms.html" style="color:var(--purple3)">Terms</a> &middot;
  <a href="/agents.html" style="color:var(--purple3)">All AI teams</a>
</footer>'''

SCRIPTS = '''<script src="/assets/transitions.js" defer></script>
<script src="/assets/chat.js" defer></script>'''

STYLE = '''
.hr-shell{max-width:980px;margin:0 auto;padding:130px 28px 80px}
.hr-crumb{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-bottom:22px}
.hr-crumb a{color:var(--purple3)}
.hr-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;
  border:1px solid var(--bd2);background:rgba(124,58,237,.08);
  font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--purple3);margin-bottom:16px}
.hr-pill .dot{width:7px;height:7px;border-radius:50%;background:var(--purple2);box-shadow:0 0 8px var(--purple)}
.hr-h1{font-size:clamp(2.3rem,4.6vw,3.5rem);font-weight:900;color:var(--white);letter-spacing:-.04em;line-height:1.05;margin-bottom:18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.hr-h1 .ic{width:56px;height:56px;border-radius:14px;background:#7c3aed;color:#fff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hr-h1 .ic svg{width:32px;height:32px}
.hr-tagline{font-size:1.2rem;color:var(--text);line-height:1.5;max-width:760px;margin-bottom:30px}

.hr-stat{display:flex;align-items:center;gap:24px;padding:22px 26px;
  background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(124,58,237,.02));
  border:1px solid rgba(124,58,237,.30);border-radius:12px;margin-bottom:10px;flex-wrap:wrap}
.hr-stat-num{font-size:clamp(2.4rem,5vw,3.4rem);font-weight:900;color:var(--purple2);letter-spacing:-.03em;line-height:1}
.hr-stat-text{flex:1;min-width:240px}
.hr-stat-label{font-size:1.02rem;font-weight:600;color:var(--w2);line-height:1.5;margin-bottom:4px}
.hr-stat-source{font-size:12px;color:var(--muted);font-style:italic}

.hr-section h2{font-size:1.7rem;font-weight:800;color:var(--white);letter-spacing:-.025em;margin:56px 0 14px}
.hr-section h2 em{color:var(--purple3);font-style:italic}
.hr-section .lead{font-size:15.5px;color:var(--w2);line-height:1.75;margin-bottom:14px;max-width:820px}
.hr-section p{font-size:15px;color:var(--text);line-height:1.7;margin-bottom:14px;max-width:820px}

/* workflow diagram */
.flow{display:flex;flex-wrap:wrap;align-items:flex-start;gap:2px;margin-top:20px;
  background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.01));
  border:1px solid var(--bd);border-radius:16px;padding:28px 20px}
.flow-step{flex:1 1 150px;min-width:140px;display:flex;flex-direction:column;align-items:center;text-align:center;padding:4px 8px}
.flow-node{width:56px;height:56px;border-radius:15px;display:flex;align-items:center;justify-content:center;
  background:rgba(124,58,237,.16);border:1px solid rgba(124,58,237,.45);color:var(--purple3);margin-bottom:13px;position:relative}
.flow-node svg{width:25px;height:25px}
.flow-num{position:absolute;top:-9px;right:-9px;width:22px;height:22px;border-radius:50%;
  background:var(--purple);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2)}
.flow-t{font-size:13px;font-weight:800;color:var(--white);letter-spacing:-.01em;margin-bottom:5px;line-height:1.25}
.flow-d{font-size:11.5px;color:var(--text);line-height:1.45}
.flow-arrow{display:flex;align-items:center;justify-content:center;color:var(--purple2);flex:0 0 24px;margin-top:28px}
.flow-arrow .ar-svg{width:22px;height:22px}
@media(max-width:760px){
  .flow{flex-direction:column;align-items:stretch;padding:22px 18px}
  .flow-step{flex-direction:row;text-align:left;align-items:flex-start;gap:15px;min-width:0;width:100%}
  .flow-node{margin-bottom:0;flex-shrink:0}
  .flow-tx{padding-top:3px}
  .flow-arrow{flex-basis:auto;margin:3px 0 3px 16px;justify-content:flex-start}
  .flow-arrow .ar-svg{transform:rotate(90deg)}
}

/* build timeline (built-to-order) */
.btl{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.btl-row{flex:1 1 120px;min-width:118px;background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:13px 14px;position:relative;overflow:hidden}
.btl-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--purple)}
.btl-d{font-size:12px;font-weight:900;color:var(--purple3);letter-spacing:.04em;margin-bottom:5px}
.btl-t{font-size:12.5px;color:var(--w2);line-height:1.4}

/* what-it-handles chips */
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
.chip{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:100px;
  background:var(--surf);border:1px solid var(--bd);font-size:13px;font-weight:600;color:var(--w2)}
.chip .dot{width:6px;height:6px;border-radius:50%;background:var(--purple2);flex-shrink:0}

/* owns grid */
.owns{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}
@media(max-width:760px){.owns{grid-template-columns:1fr}}

/* before / after */
.ba{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
@media(max-width:680px){.ba{grid-template-columns:1fr}}
.ba-col{border-radius:14px;padding:22px 22px;border:1px solid var(--bd)}
.ba-before{background:rgba(248,113,113,.05);border-color:rgba(248,113,113,.25)}
.ba-after{background:rgba(74,222,128,.05);border-color:rgba(74,222,128,.28)}
.ba-h{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}
.ba-before .ba-h{color:var(--no)}
.ba-after .ba-h{color:var(--good)}
.ba-row{display:flex;gap:11px;align-items:flex-start;padding:9px 0;font-size:13.5px;color:var(--w2);line-height:1.5}
.ba-row svg{width:17px;height:17px;flex-shrink:0;margin-top:2px}
.ba-before .ba-row svg{color:var(--no)}
.ba-after .ba-row svg{color:var(--good)}

/* sample dashboard mockup */
.mock{margin-top:20px;background:var(--bg2);border:1px solid var(--bd);border-radius:16px;overflow:hidden}
.mock-top{display:flex;align-items:center;gap:9px;padding:13px 18px;border-bottom:1px solid var(--bd);background:var(--surf)}
.mock-dot{width:10px;height:10px;border-radius:50%;background:var(--dim)}
.mock-title{margin-left:8px;font-size:12.5px;font-weight:700;color:var(--text)}
.mock-sample{margin-left:auto;font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--purple3);
  background:rgba(124,58,237,.14);border:1px solid rgba(124,58,237,.4);padding:3px 9px;border-radius:100px}
.mock-body{padding:20px 18px}
.mock-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:680px){.mock-kpis{grid-template-columns:repeat(2,1fr)}}
.mock-kpi{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:14px 14px}
.mock-kpi .v{font-size:1.55rem;font-weight:900;color:var(--white);letter-spacing:-.02em;line-height:1}
.mock-kpi .l{font-size:11px;color:var(--muted);margin-top:6px;font-weight:600;line-height:1.3}
.mock-mid{display:grid;grid-template-columns:1.1fr 1.4fr;gap:14px;margin-top:14px}
@media(max-width:680px){.mock-mid{grid-template-columns:1fr}}
.mock-chart{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:14px 16px}
.mock-chart .ct{font-size:11px;color:var(--muted);font-weight:700;margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em}
.mock-chart svg{width:100%;height:64px;display:block}
.mock-agents{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:8px 14px}
.mock-agent{display:flex;align-items:flex-start;gap:11px;padding:11px 0;border-bottom:1px dashed var(--bd3)}
.mock-agent:last-child{border-bottom:0}
.mock-agent .ai{width:30px;height:30px;border-radius:8px;background:rgba(124,58,237,.14);border:1px solid rgba(124,58,237,.35);
  color:var(--purple3);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mock-agent .ai svg{width:15px;height:15px}
.mock-agent .an{font-size:12.5px;font-weight:800;color:var(--white)}
.mock-agent .ad{font-size:11.5px;color:var(--text);line-height:1.4;margin-top:1px}
.mock-agent .live{margin-left:auto;flex-shrink:0;font-size:9.5px;font-weight:800;color:var(--good);letter-spacing:.08em;display:flex;align-items:center;gap:5px}
.mock-agent .live .pulse{width:6px;height:6px;border-radius:50%;background:var(--good);box-shadow:0 0 7px var(--good)}
.mock-cap{font-size:11.5px;color:var(--muted);font-style:italic;margin-top:11px;text-align:center}

.own-row{background:var(--surf);border:1px solid var(--bd);border-radius:10px;padding:16px 18px}
.own-label{font-size:12px;font-weight:800;color:var(--purple3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
.own-text{font-size:13.5px;color:var(--w2);line-height:1.6}

.tools{list-style:none;margin:14px 0 4px;padding:0}
.tools li{padding:9px 0 9px 22px;position:relative;font-size:14px;color:var(--w2);border-bottom:1px dashed var(--bd3)}
.tools li::before{content:"";position:absolute;left:2px;top:15px;width:7px;height:7px;border-radius:50%;background:var(--purple2)}
.tools-note{font-size:12.5px;color:var(--muted);margin-top:12px;font-style:italic}

.math{background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.02));
  border:1px solid rgba(124,58,237,.25);border-radius:12px;padding:24px 28px;margin:18px 0 0}
.math .mlbl{font-size:11.5px;font-weight:800;color:var(--purple3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}
.math .row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:9px 0;border-bottom:1px dashed var(--bd3);font-size:14.5px;color:var(--w2)}
.math .row:last-child{border-bottom:0;padding-top:12px;border-top:1px solid var(--bd);margin-top:6px;font-size:1.05rem;font-weight:700;color:var(--white)}
.math .row b{color:var(--white);font-weight:700}
.math .row .v{font-weight:800;color:var(--purple3);font-size:1.05rem;text-align:right}

.cta-bar{margin-top:54px;padding:34px 32px;background:linear-gradient(135deg,var(--purple),var(--purple2));
  border-radius:16px;text-align:center;color:#fff}
.cta-bar h3{font-size:1.5rem;font-weight:900;color:#fff;letter-spacing:-.02em;margin-bottom:8px}
.cta-bar p{font-size:14.5px;color:rgba(255,255,255,.88);margin-bottom:22px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.55}
.cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.cta-bar a{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;background:#fff;color:#0a0612 !important;
  border-radius:8px;font-weight:800;font-size:14px;text-decoration:none;transition:transform .15s}
.cta-bar a:hover{transform:translateY(-2px)}
.cta-bar a.ghost{background:transparent;color:#fff !important;border:1px solid rgba(255,255,255,.5)}

.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:18px 0;
  background:rgba(8,8,10,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--bd)}
.nav-inner{max-width:1280px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--white);font-size:17px;letter-spacing:-.02em;text-decoration:none}
.logo .logo-mark{width:30px;height:30px;flex-shrink:0;font-size:0;color:transparent;
  background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='20' y='22' width='60' height='15' rx='7.5' fill='%237c3aed'/><rect x='20' y='42.5' width='37' height='15' rx='7.5' fill='%23b794f6'/><rect x='20' y='63' width='60' height='15' rx='7.5' fill='%237c3aed'/></svg>") center/contain no-repeat}
.nav-links{display:flex;align-items:center;gap:4px;list-style:none}
.nav-links a{padding:8px 14px;font-size:14px;color:var(--text);font-weight:500;border-radius:var(--r);text-decoration:none}
.nav-links a:hover{color:var(--white)}
.btn-nav{padding:10px 20px;background:var(--purple);color:#fff !important;border-radius:var(--r);
  font-size:13.5px;font-weight:700}
.btn-nav:hover{background:var(--purple2)}
@media(max-width:780px){.nav-links a:not(.btn-nav){display:none}}
'''


# ----------------------------------------------------------------------------
# Component builders
# ----------------------------------------------------------------------------
def workflow_html(t):
    parts = []
    steps = t["workflow"]
    for i, (icon, title, desc) in enumerate(steps):
        parts.append(
            '<div class="flow-step"><div class="flow-node">' + ICONS[icon]
            + '<span class="flow-num">' + str(i + 1) + '</span></div>'
            + '<div class="flow-tx"><div class="flow-t">' + title + '</div>'
            + '<div class="flow-d">' + desc + '</div></div></div>'
        )
        if i < len(steps) - 1:
            parts.append('<div class="flow-arrow">' + ARROW + '</div>')
    return '<div class="flow">' + "".join(parts) + '</div>'


def build_or_live_html(t):
    if t["status"] == "built":
        rows = "".join(
            '<div class="btl-row"><div class="btl-d">' + d + '</div><div class="btl-t">' + txt + '</div></div>'
            for (d, txt) in t["build"]
        )
        return (
            '<div class="hr-section"><h2>How we <em>build it</em> — 7 days</h2>'
            '<p class="lead">Built-to-order, honestly: we assemble it from the modules we’ve already shipped plus the light, per-client glue your business needs. From kickoff to live in a week.</p>'
            '<div class="btl">' + rows + '</div></div>'
        )
    # available now
    return (
        '<div class="hr-section"><h2>Already <em>live</em></h2>'
        '<p class="lead">This is a productized module — it’s built and running today. We connect it to your stack and tune it to your voice, tools, and rules on the audit call, and it’s live in your business inside 7 days.</p></div>'
    )


def chips_html(t):
    chips = "".join(
        '<span class="chip"><span class="dot"></span>' + c + '</span>' for c in t["handles"]
    )
    return '<div class="chips">' + chips + '</div>'


def beforeafter_html(t):
    x = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
         'stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/>'
         '<line x1="6" y1="6" x2="18" y2="18"/></svg>')
    chk = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
           'stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>')
    before = "".join('<div class="ba-row">' + x + '<span>' + b + '</span></div>' for b in t["before"])
    after = "".join('<div class="ba-row">' + chk + '<span>' + a + '</span></div>' for a in t["after"])
    return (
        '<div class="ba"><div class="ba-col ba-before"><div class="ba-h">Before — the leak</div>'
        + before + '</div><div class="ba-col ba-after"><div class="ba-h">After — with the team</div>'
        + after + '</div></div>'
    )


def mock_chart_svg(bars, accent):
    n = len(bars)
    mx = max(bars) or 1
    bw = 100.0 / (n * 1.6)
    gap = bw * 0.6
    total = n * bw + (n - 1) * gap
    x0 = (100 - total) / 2.0
    rects = []
    for i, b in enumerate(bars):
        h = 8 + (b / mx) * 50.0
        x = x0 + i * (bw + gap)
        y = 62 - h
        op = "1" if i == n - 1 else "0.55"
        rects.append(
            '<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" rx="1.2" fill="%s" opacity="%s"/>'
            % (x, y, bw, h, accent, op)
        )
    return ('<svg viewBox="0 0 100 64" preserveAspectRatio="none">' + "".join(rects) + '</svg>')


def mock_html(t):
    kpis = "".join(
        '<div class="mock-kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'
        for (l, v) in t["dash_kpis"]
    )
    agents = "".join(
        '<div class="mock-agent"><div class="ai">' + ICONS["check"] + '</div>'
        '<div><div class="an">' + an + '</div><div class="ad">' + ad + '</div></div>'
        '<span class="live"><span class="pulse"></span>LIVE</span></div>'
        for (an, ad) in t["dash_agents"]
    )
    chart = mock_chart_svg(t["dash_bars"], "#9b6cf6")
    return (
        '<div class="mock"><div class="mock-top">'
        '<span class="mock-dot"></span><span class="mock-dot"></span><span class="mock-dot"></span>'
        '<span class="mock-title">' + t["name"] + ' · your command center</span>'
        '<span class="mock-sample">SAMPLE</span></div>'
        '<div class="mock-body"><div class="mock-kpis">' + kpis + '</div>'
        '<div class="mock-mid"><div class="mock-chart"><div class="ct">This week</div>' + chart + '</div>'
        '<div class="mock-agents">' + agents + '</div></div>'
        '<div class="mock-cap">Illustration of the live dashboard — your real numbers flow in once connected.</div>'
        '</div></div>'
    )


def owns_html(t):
    # Build "what it owns" rows from the workflow titles + descriptions for a
    # tight, accurate responsibilities grid.
    rows = "".join(
        '<div class="own-row"><div class="own-label">' + title + '</div>'
        '<div class="own-text">' + desc + '</div></div>'
        for (_icon, title, desc) in t["workflow"]
    )
    return '<div class="owns">' + rows + '</div>'


def tools_html(t):
    lis = "".join('<li>' + tool + '</li>' for tool in t["tools"])
    return ('<ul class="tools">' + lis + '</ul>'
            '<div class="tools-note">Read-only OAuth where it applies. We never see your passwords, and access is revocable any time from inside each tool.</div>')


def math_html(t):
    return (
        '<div class="math"><div class="mlbl">Annual cost comparison</div>'
        '<div class="row"><span>Human ' + t["human_role"] + '</span><span class="v">' + t["human_salary"] + '</span></div>'
        '<div class="row"><span>+ benefits, taxes, training (rough +30%)</span><span class="v">+ overhead</span></div>'
        '<div class="row"><span>+ turnover + ramp risk</span><span class="v">+ recruiting cost</span></div>'
        '<div class="row"><span><b>' + t["name"] + ' via Efficio</b></span><span class="v">' + t["efficio_price"] + '</span></div>'
        '</div>'
    )


def cta_html(t):
    if t.get("live"):
        return (
            '<div class="cta-bar"><h3>' + t["name"] + ' is live — start today.</h3>'
            '<p>It reads your inbox, triages by intent, and drafts every reply to a queue you approve. We never send for you. $0 upfront — we build it free, and you only pay once it works.</p>'
            '<div class="cta-row"><a href="' + INBOX_CTA + '">Start your free build with ' + t["name"] + ' &rarr;</a>'
            '<a class="ghost" href="/qualify.html">Not sure yet? Take the 60-sec qualifier &rarr;</a></div></div>'
        )
    if t["status"] == "built":
        return (
            '<div class="cta-bar"><h3>Have us build your ' + t["name"] + '.</h3>'
            '<p>The 60-second qualifier routes you to the right tier and books your free audit. We name what we’d build, the workflow we’d ship, and the metric we’ll move — then it’s live in 7 days.</p>'
            '<div class="cta-row"><a href="/qualify.html">Take the 60-sec qualifier &rarr;</a></div></div>'
        )
    return (
        '<div class="cta-bar"><h3>See if the ' + t["name"] + ' is your next teammate.</h3>'
        '<p>The 60-second qualifier routes you to the right tier and books your free audit. We name the workflow we’d ship in week one and the metric we’ll move by day 30.</p>'
        '<div class="cta-row"><a href="/qualify.html">Take the 60-sec qualifier &rarr;</a></div></div>'
    )


def stat_html(t):
    if t.get("leak_big"):
        src = ('<div class="hr-stat-source">' + t["leak_source"] + '</div>') if t.get("leak_source") else ''
        return (
            '<div class="hr-stat"><div class="hr-stat-num">' + t["leak_big"] + '</div>'
            '<div class="hr-stat-text"><div class="hr-stat-label">' + t["leak_label"] + '</div>' + src + '</div></div>'
        )
    # qualitative leak (no fabricated number)
    return (
        '<div class="hr-stat"><div class="hr-stat-num" style="font-size:1.5rem;line-height:1.2;min-width:0">'
        + ICONS["alert"].replace('<svg', '<svg style="width:34px;height:34px"') + '</div>'
        '<div class="hr-stat-text"><div class="hr-stat-label">' + t["leak_label"] + '</div></div></div>'
    )


def head_html(t):
    name = t["name"]
    url = "https://efficio.tech/agents/" + t["slug"] + ".html"
    tag = t["tagline"]
    desc = name + ": " + tag + " Replaces a " + t["human_salary"] + " " + t["human_role"] + "."
    if t["status"] == "built":
        desc = name + ": " + tag + " Built for you in 7 days."
    ld = (
        '<script type="application/ld+json">'
        '{"@context":"https://schema.org","@graph":['
        '{"@type":"BreadcrumbList","itemListElement":['
        '{"@type":"ListItem","position":1,"name":"Home","item":"https://efficio.tech/"},'
        '{"@type":"ListItem","position":2,"name":"AI teams","item":"https://efficio.tech/agents.html"},'
        '{"@type":"ListItem","position":3,"name":"' + name + '","item":"' + url + '"}]},'
        '{"@type":"Service","name":"' + name + '","description":"' + tag + '",'
        '"provider":{"@type":"Organization","name":"Efficio","url":"https://efficio.tech"},'
        '"areaServed":{"@type":"Country","name":"United States"}}]}'
        '</script>'
    )
    return (
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<script src="/assets/pixels.js"></script>\n'
        '<title>' + name + ' — ' + tag[:60].rstrip() + ' | Efficio</title>\n'
        '<meta name="description" content="' + desc + '">\n'
        '<link rel="canonical" href="' + url + '">\n'
        '<meta property="og:title" content="' + name + ' | Efficio">\n'
        '<meta property="og:description" content="' + tag + '">\n'
        '<meta property="og:image" content="https://efficio.tech/assets/brand/efficio-og.png">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:image" content="https://efficio.tech/assets/brand/efficio-og.png">\n'
        '<meta property="og:type" content="article">\n'
        + ld + '\n'
        '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n'
        '<link rel="icon" href="/favicon.ico" sizes="any">\n'
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">\n'
        '<link rel="stylesheet" href="/assets/theme.css">\n'
        '<style>' + STYLE + '</style>\n'
    )


def main_html(t):
    return (
        '<main class="hr-shell">\n'
        '  <div class="hr-crumb"><a href="/">Home</a> &middot; <a href="/agents.html">AI teams</a> &middot; ' + t["name"] + '</div>\n'
        '  <span class="hr-pill"><span class="dot"></span>' + t["pill"] + '</span>\n'
        '  <h1 class="hr-h1"><span class="ic">' + ICONS[t["hero_icon"]] + '</span><span>' + t["name"] + '</span></h1>\n'
        '  <p class="hr-tagline">' + t["tagline"] + '</p>\n'
        + stat_html(t) + '\n'
        '  <div class="hr-section"><h2>What the <em>' + t["name"] + '</em> does</h2>'
        '<p class="lead">' + t["what"] + '</p></div>\n'
        '  <div class="hr-section"><h2>How it <em>works</em></h2>'
        '<p>The actual step-by-step flow — each stage runs automatically; you stay in control of anything that sends.</p>'
        + workflow_html(t) + '</div>\n'
        + build_or_live_html(t) + '\n'
        '  <div class="hr-section"><h2>What it <em>handles</em></h2>'
        '<p>The responsibilities this team owns, in plain terms:</p>'
        + chips_html(t) + owns_html(t) + '</div>\n'
        '  <div class="hr-section"><h2>A day in the life — <em>before vs. after</em></h2>'
        + beforeafter_html(t) + '</div>\n'
        '  <div class="hr-section"><h2>Your <em>command center</em></h2>'
        '<p>Everything this team does shows up on your branded dashboard — live numbers, the agents at work, and the trend over time.</p>'
        + mock_html(t) + '</div>\n'
        '  <div class="hr-section"><h2>Tools we <em>plug into</em></h2>'
        '<p>We connect to the stack you already run:</p>'
        + tools_html(t) + '</div>\n'
        '  <div class="hr-section"><h2>The math <em>vs. hiring this role</em></h2>'
        + math_html(t) + '</div>\n'
        + cta_html(t) + '\n'
        '</main>\n'
    )


def page_html(t):
    return (
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
        + head_html(t)
        + '</head>\n<body>\n\n'
        + NAV + '\n\n'
        + main_html(t) + '\n'
        + FOOTER + '\n\n'
        + SCRIPTS + '\n'
        '</body>\n</html>\n'
    )


if __name__ == "__main__":
    for t in TEAMS:
        fn = OUT / (t["slug"] + ".html")
        fn.write_text(page_html(t), encoding="utf-8")
        print("OK  agents/" + t["slug"] + ".html")
    print("Wrote " + str(len(TEAMS)) + " AI-team deep-dive pages.")
