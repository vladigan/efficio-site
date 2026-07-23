# Brand logos — "works with" strip

These SVGs are used as **CSS masks**, not images: `#works-with .ww-logo` sets
`mask: var(--src)` and paints with `background-color`, so one monochrome file
covers both the muted default and the brand-colour hover. That is why every
file here must be a **single-colour, square (24×24 viewBox)** mark — a
multi-colour or gradient SVG will flatten to a silhouette.

## Present

| File | Brand | Source | Hover colour |
|---|---|---|---|
| `claude.svg` | Claude (Anthropic) | simple-icons 16.27.0 | `#D97757` |
| `google.svg` | Google (for Google Workspace) | simple-icons 16.27.0 | `#4285F4` |
| `mcp.svg` | Model Context Protocol | simple-icons 16.27.0 | `#FFFFFF` |

[simple-icons](https://github.com/simple-icons/simple-icons) publishes the icon
files under **CC0-1.0**. The underlying trademarks remain the property of their
owners — hence the non-endorsement notice rendered under the strip.

## Deliberately absent

**GoHighLevel, Salesforce, Twilio** render as typographic monograms (`HL`, `SF`,
`TW`) instead of logos:

- **Salesforce and Twilio** were **removed from simple-icons in v16** (they are
  present up to v15). simple-icons honours brand-owner removal requests, so
  pinning an older version to retrieve them would route around that. Get them
  from the official brand pages instead if you want them:
  <https://brand.salesforce.com> · <https://www.twilio.com/en-us/brand>
- **GoHighLevel** has no simple-icons entry. The only mark on
  `gohighlevel.com/brand` is a 17 KB multi-path gradient artwork — wrong shape
  for a mask and too heavy for this strip.

Using a brand's name/logo to state accurate interoperability is normally fine,
but accepting a brand kit's terms is a call for the site owner, not automation.

## Adding one later

1. Drop a single-colour, 24×24-viewBox SVG in this folder.
2. On that brand's `<li class="ww-item">` in `index.html`, swap the
   `<span class="ww-mark">XX</span>` for `<span class="ww-logo" aria-hidden="true"></span>`
   and add the style attribute:

```html
<li class="ww-item" style="--src:url('/assets/logos/twilio.svg');--brand:#F22F46">
```

No CSS changes are needed — the mask rules already apply to any `.ww-logo`.
