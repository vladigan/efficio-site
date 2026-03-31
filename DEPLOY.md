# Deploying efficio.tech — Step by Step

Your website is a static HTML file. No server needed. Deploy in minutes.

---

## Option A: Netlify (Recommended — Free + Best)

Netlify hosts static sites for free and handles the contact form automatically.

1. Go to **netlify.com** → sign up free
2. Drag the entire `website/` folder onto the Netlify dashboard
3. It deploys instantly — you get a URL like `random-name.netlify.app`

**Connect your domain:**
1. In Netlify → Site Settings → Domain Management
2. Click "Add custom domain" → type `efficio.tech`
3. Netlify gives you nameservers (e.g. `dns1.p01.nsone.net`)
4. Go to wherever you bought the domain → DNS settings
5. Replace existing nameservers with Netlify's nameservers
6. Wait 10–30 minutes for DNS propagation
7. Netlify auto-provisions a free SSL certificate

**Contact form:**
The form already has `data-netlify="true"` built in.
Netlify captures submissions automatically — view them in your dashboard under "Forms".
You can set up email notifications in: Site → Forms → Notifications → Email.

---

## Option B: Vercel (Also Free)

1. Go to **vercel.com** → sign up free
2. Install Vercel CLI: `npm install -g vercel`
3. From the `website/` folder: `vercel`
4. Follow prompts → instant deploy
5. Connect domain in Vercel Dashboard → Domains → Add

**Note:** Vercel doesn't handle forms natively. Use Netlify Forms or Formspree for the contact form.

---

## Option C: GitHub Pages (Free, Slightly More Technical)

1. Create a GitHub repo named `efficio-website`
2. Upload all files from `website/` folder
3. Settings → Pages → Source: Deploy from branch → main → / (root)
4. Connect domain: Settings → Pages → Custom domain → `efficio.tech`
5. Add a CNAME record at your DNS provider:
   - Type: `CNAME`
   - Name: `www`
   - Value: `yourusername.github.io`

---

## Option D: GoDaddy / Your Current Host (If You Already Have Hosting)

1. Log into your hosting control panel → File Manager
2. Navigate to `public_html/`
3. Upload all files from the `website/` folder
4. Your site is live at your domain immediately

---

## After Deploying — Checklist

- [ ] Visit your live site and test all section links
- [ ] Submit the contact form and verify you get an email notification
- [ ] Test on mobile (iPhone + Android)
- [ ] Set up Google Workspace and verify contact@efficio.tech is live (see .env.example)
- [ ] Update the Calendly link in `index.html` (search for "calendly.com/efficio") with your real team Calendly

---

## Setting Up contact@efficio.tech Email

**Recommended: Google Workspace** ($6/mo) — `workspace.google.com`
- Gives you professional Gmail at `contact@efficio.tech`, `support@efficio.tech`, `team@efficio.tech`
- Easiest for email outreach (works with the SMTP sender in the system)
- See `.env.example` for full Google Workspace setup checklist

**Option B: Zoho Mail** (Free) — `zoho.com/mail`
- Free for 1 user with a custom domain
- Good enough to start

**Option C: Namecheap Private Email** (~$1/mo)
- If your domain is at Namecheap, add professional email for ~$1/mo

**For the SMTP sender** (outreach system), you'll need:
- Gmail App Password: `myaccount.google.com/apppasswords`
- Then add to `.env`: `SMTP_USERNAME=contact@efficio.tech`

---

## What Happens With Contact Form Submissions

When someone fills out the form on your site:
1. Netlify captures the submission
2. You receive an email notification
3. Manually add them as a lead in the CRM: `python -m crm.tracker`
   Or import their info directly into the pipeline

Eventually we can wire the form directly to the CRM via a webhook — but manually is fine to start.
