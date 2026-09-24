# efficio-site

Static site for efficio.tech (GitHub Pages behind Cloudflare). Edit the HTML files directly.

## No page generators

The build helper scripts were deleted on 2026-09-24: `_build_blog.py`, `_inject_chat.py`,
`_inject_theme.py`, `_nav_sweep.py`, `agents/_build.py` and `DEPLOY_V5_FIX.bat`. They
regenerated or re-published pages that have since been retired and replaced with redirect
stubs, such as the old blog, the `agents/*` deep-dives and the legacy nav and theme. Running
them would bring back copy that was removed for accuracy and compliance.

Don't restore them from git history. If a page needs changing, edit that page by hand. Keep
the consent setup intact:

- `assets/pixels.js` loads nothing until the visitor clicks Accept in `assets/consent.js`.
- The GoHighLevel chat loader is an inert `<script type="text/plain" data-consent-chat ...>` tag.
  `consent.js` loads it only after Accept.
- The booking calendar is an `<iframe data-consent-src ...>`. It also loads only after Accept.
- Every page carries a `Cookie settings` link (`data-cookie-settings`).

If you add a tag, widget or embed, gate it the same way. Then update `privacy.html` §6 and the
banner text in `consent.js` so they still name everything that loads.
