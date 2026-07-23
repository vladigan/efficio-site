# Brand logos — "works with" marquee

Full-colour brand marks used as `<img>` in the homepage `#works-with` marquee
(`index.html`). Unlike `../*.svg` (single-colour CSS masks), these are real
multi-colour logos, so they are loaded as images and must **not** be recoloured.

## Provenance & licensing

These files are **original, simplified re-creations** built in-house from each
brand's basic geometry and official colours — they are not copied from a brand
kit or icon pack, so no third-party asset licence applies to the files here.
(`claude.svg` reuses the shape of the repo's existing CC0 `../claude.svg`,
recoloured to Claude clay `#D97757`.)

The underlying **names and logos are trademarks of their respective owners**.
They are shown to state accurate interoperability ("Efficio connects with these
tools via API/MCP") — nominative use — and the marquee renders a standing
non-endorsement notice beneath it. No partnership, affiliation, or endorsement
is implied. If a brand owner requests removal, delete the file and its two
`<img>` entries (one per marquee group) from `#works-with` in `index.html`.

## Files (34)

google, gmail, gcal, meet, microsoft, outlook, teams, meta, facebook,
instagram, whatsapp, salesforce, hubspot, gohighlevel, stripe, quickbooks,
square, paypal, twilio, slack, zoom, calendly, shopify, zapier, notion,
airtable, mailchimp, docusign, zendesk, intercom, ringcentral, xero, claude,
openai.

## Adding one

1. Drop a full-colour SVG here (square ~48×48 viewBox for icons; wider for
   wordmarks). Keep it legible at 30px tall on a near-black background.
2. Add one `<img src="/assets/logos/brands/NAME.svg" ...>` inside **each** of the
   two `.ww-group` blocks in `#works-with` (both copies keep the loop seamless).
