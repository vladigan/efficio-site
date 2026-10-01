# App logos: homepage app strip and demo dashboard

Real brand logos for the rolling "apps we connect" strip (`section.e7-apps` in
`index.html`) and the app tiles and "uses" chips in the homepage demo dashboard
(the `lg` field on each connector in `CN0`, plus the 7th value of each
industry's `app:[...]` entry).

Each logo sits on a small white tile (`.e7-ic.lg`, `.e6-tile .ic.lg`), so
full-colour and dark marks both stay visible on the dark site.

## Sources (2026-10-01)
- **Wikimedia Commons** official logo files: Google, Gmail, Google Ads, Google
  Calendar, Microsoft 365, Outlook, Teams, Meta, Facebook, Instagram, WhatsApp,
  Salesforce, Amazon, LinkedIn, PayPal, Slack, Square, Dropbox, Claude, Zoom (app icon).
- **The company's own website icon**: Google Business Profile (gstatic.com), DocuSign,
  Mailchimp, Klaviyo, Twilio, Xero, Notion, monday.com, Canva, Jobber, Procore,
  Follow Up Boss, Buildium, Karbon, AgencyZoom, Shopmonkey, HighLevel.
- **Site icon via Google's favicon service** (the site blocked direct requests or
  only listed a small icon): ZoomInfo, Clio, NetSuite, RingCentral, Airtable, Gusto,
  ServiceTitan, Toast.
- **simple-icons 16.33.0** (CC0 traces of official marks, filled with the brand
  colour): HubSpot, Shopify, Stripe, QuickBooks, Zendesk, Asana, Zapier, Calendly, ADP.

## Trademarks
Every name and logo here belongs to its owner. They are shown only to say which
apps Efficio connects to; the note under the strip says so ("app names and logos
belong to their owners · listed to show what we connect to, not an endorsement
or partnership"). If an owner asks for removal, delete the file and its
references in `index.html`; the code falls back to the generic icon when a
connector has no `lg`.
