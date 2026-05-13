# v2.html — preview homepage rebuild

**Status:** preview only. Live homepage is still `index.html`. Nothing about your routing or live deploy has been touched.

## How to preview

```
# Option 1 — quick local open
open Efficio/website/v2.html             # macOS
start Efficio\website\v2.html             # Windows

# Option 2 — full local server (so the HVAC demo iframe loads correctly)
cd Efficio/website
python -m http.server 8080
# → http://localhost:8080/v2.html
```

The iframe in section 5 points at `demos/hvac/index.html`, which is a relative path. Opening `v2.html` via `file://` may block the iframe with a CORS error — use the local server for the full picture.

## What it is

One file. ~1,200 lines. All assets via CDN (Three.js r128, GSAP 3.12, Google Fonts). No build step.

**Sections in order:**

1. **Hero** — full-viewport navy. Three.js point-cloud "CRM brain" rotating behind the headline. Kinetic word-by-word fade-up on the H1. Big orange "Take the 60-sec quiz" + ghost "Watch 90-sec walkthrough". Right column: glass card with live-data styled operator snapshot.
2. **Pain wall** — asymmetric 4-col bento. 6 cards. Each card counts up its number on scroll-into-view. Cards tilt toward the mouse cursor on hover with an orange glow that tracks the pointer.
3. **How it works** — 300vh sticky-scroll section. As you scroll, the right side cycles through 3 Three.js scenes (particles → CRM grid → rising dashboard bars) while the left side cross-fades through 3 frames of copy.
4. **Agents grid** — 6 glass cards. SVG icons wobble on hover. Magnetic tilt.
5. **Live demo** — embedded `demos/hvac/index.html` in a Mac-chrome iframe with a "Click to interact" overlay that fades on click.
6. **Pricing** — 3 tiers ($997 Pilot / $2,500 Growth / $3,500 Operator). Middle tier has the conic-gradient border. Scale + orange glow on hover.
7. **Final CTA** — full-bleed restate with the same 2 CTAs.

## What's still placeholder

- **5 tracking pixel IDs** — `REPLACE_ME_GA4_MEASUREMENT_ID`, `REPLACE_ME_META_PIXEL_ID`, `REPLACE_ME_LINKEDIN_PARTNER_ID`, `REPLACE_ME_TIKTOK_PIXEL_ID`, `REPLACE_ME_SNAP_PIXEL_ID`. Same placeholders as `audit-quiz.html`. No analytics fires until they're swapped.
- **Loom URL** — `https://www.loom.com/share/PLACEHOLDER_LOOM_ID` — both CTAs (hero + final). Swap for the real walkthrough URL.
- **Live operator snapshot card** — Acme HVAC numbers are illustrative. Swap with real numbers once a pilot is logging data.

## Performance / safety

- Mobile (≤768px): WebGL canvases disabled, replaced with a static gradient backdrop. The how-it-works 3D scenes are hidden entirely on mobile and the copy frames render as a vertical list.
- `prefers-reduced-motion: reduce` — all animations, counters, and 3D scenes are suppressed. Page degrades to static.
- WebGL contexts pause when offscreen via IntersectionObserver — should hold 60fps on a 2020 MacBook.
- Three.js r128 is intentionally pinned (charter constraint — `THREE.CapsuleGeometry` doesn't exist in r128, and v2.html does not use it).

## A/B decision

Open `v2.html` and `index.html` in two tabs. Decide:

- Does v2 feel more "Apple product page / Linear / Stripe Sessions"?
- Does the headline still read as Brady (operator voice) vs. AI-slop?
- Does the live demo embed answer "is this real?" the way you wanted?
- Does the pricing strip read the same way it did on the audit landing?

If yes → rename. Suggested swap:
```
git mv Efficio/website/index.html Efficio/website/index.v1.html
git mv Efficio/website/v2.html Efficio/website/index.html
```

If no → leave it. Tell me what to change.

## What was NOT touched

- `Efficio/website/index.html` — untouched
- All `landings/*.html` — untouched
- `audit-quiz.html` — untouched (pixel block was read, not modified)
- `demos/hvac/index.html` — read by iframe at runtime only
- No commits pushed to remote
- No funnel routes changed
