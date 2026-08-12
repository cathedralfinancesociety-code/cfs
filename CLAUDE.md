# Cathedral Finance Society — website

Static single-page site for the Cathedral Finance Society (Cathedral & John Connon
School, Mumbai).

- **Live:** https://thecathedralfinancesociety.vercel.app/
- **Repo:** https://github.com/cathedralfinancesociety-code/cfs
- **Deploy:** Vercel, static, auto-deploys on push to `main`. No build step.

## Run it locally

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

You must serve it over HTTP. Opening `index.html` with `file://` will not work.

## Layout

```
index.html      The entire site — markup, CSS, page data, and app logic.
support.js      Vendored "dc-runtime" that renders index.html. Do not edit.
images/         Web-ready images used by the site (WebP).
uploads/        Logos (CFS mark, Portfolio mark).
website pics/   Original source photos, logos and PDFs. NOT deployed.
screenshots/    Dev screenshots. NOT deployed.
vercel.json     Cache headers for images/ and uploads/.
.vercelignore   Keeps the two source folders out of the deployment.
```

## How index.html works

It is **not** plain HTML. It was exported from Claude Design and is rendered at
runtime by `support.js`, which reads a small template dialect out of the file:

| Syntax | Meaning |
| --- | --- |
| `{{ expr }}` | Interpolates a value returned by `renderVals()`. Works in text and in attribute values. |
| `<sc-if value="{{ flag }}">` | Renders children only when `flag` is truthy. |
| `<sc-for list="{{ items }}" as="item">` | Repeats children; `{{ item.x }}` and `{{ $index }}` are in scope. |
| `onClick="{{ handler }}"` | Binds a function from `renderVals()`. |
| `style-hover="..."` | Hover styles (there are no CSS classes for most elements — styling is inline). |
| `<helmet>` | Contents get hoisted into `<head>`. |

The file has three parts, in order:

1. **`<head>`** — title, meta/OG tags, favicon, and the `support.js` include.
2. **`<x-dc>`** — the markup for all nine pages, each wrapped in an `<sc-if>`
   (`isHome`, `isTeam`, `isPortfolio`, …). The nav swaps which one is visible;
   there is no routing and no URL change.
3. **`<script type="text/x-dc" data-dc-script>`** — `class Component extends DCLogic`,
   holding `state`, event handlers, and **all page content as JS arrays**
   (team members, events, podcast episodes, COTM submissions, leaderboard).
   `renderVals()` returns the object that every `{{ }}` binding reads from.

### Gotchas

- **The component script must stay inline.** `support.js` reads it via
  `document.querySelector("script[data-dc-script]").textContent`. Moving it to an
  external file silently breaks the whole page.
- **Do not put HTML comments containing `{{ }}` in `<head>`.** The runtime
  re-parses head content; such a comment leaks into the body as visible text and
  stops the app from rendering. (This happened once during the image migration.)
- **Editing content usually means editing the JS arrays**, not the markup.
- After any change, load all nine pages and check the console — a template error
  tends to blank a whole page rather than fail loudly.

## Images

Every image is a real file referenced by a plain `<img src="images/...">`.

Historically they were `<image-slot>` custom elements that fetched base64 blobs
from a `.image-slots.state.json` sidecar at runtime. **Vercel does not serve
dotfiles**, so that request 404'd and every image on the live site was blank
while looking fine locally. The images were extracted to `images/` and the slot
component removed. Don't reintroduce it.

Naming maps to where the image appears:

| Files | Page | Bound from |
| --- | --- | --- |
| `pf26-photo-1..15.webp` | Portfolio 2026 gallery | `galleryPhotos` |
| `sanchay-1..5.webp` | Project Sanchay sessions | inline markup |
| `podcast-ep-1..5.webp` | Profit Perspectives (`ep-1` = newest) | inline markup |
| `newsletter-0..6.webp` | Money Talks (`0` = newest) | inline markup |
| `cotm-logo-0..8.webp` | COTM archive, one per `cotmSubmissions` row, by index | `article.logo` |
| `cotm-winner-logo-0.webp` | COTM winner card | `realWinner.logo` |
| `cotm-mention-logo-0..1.webp` | COTM honourable mentions | `h.logo` |
| `jai-vakeel-logo.webp` | Project Sanchay partner | inline markup |

**Adding a COTM article:** add a row to `cotmSubmissions` *and* drop a matching
`images/cotm-logo-<idx>.webp`. Indices are positional — inserting at the top
shifts every logo. Entries without a logo set `hasLogo: false` so no `<img>` is
emitted (an empty `src` renders a broken-image icon).

**Adding images generally:** convert to WebP, keep the long edge ≤1200px, put it
in `images/`, and give every `<img>` an `alt`, `loading="lazy"` and
`decoding="async"`.

## Contact form

Posts to a Google Form endpoint with `mode: 'no-cors'`. The response is opaque,
so a resolved promise means "the request left the browser" — not "Google accepted
it". Only a network-level failure is detectable, and that shows an error panel
with a mailto fallback. Don't upgrade this to a success claim it can't verify.

Field IDs (`entry.*`) in `handleSubmit()` are tied to that specific Google Form.

## Known placeholder content

- **Team bios** — six members still show the generated `bioPlaceholder()` text:
  Vaibhav Sanghai, Saakrit Agarwal, Arnav Singh, Sukti Goyal, Zaynah Lucien and
  Aashi Bubna. To add one, put a `'Name': 'bio text'` entry in the `bios` object;
  `bioOf()` picks it up for both the leadership and OC lists. Keys must match the
  `name` exactly.
- **COTM archive dates** — all hardcoded to "July 2026".
- **CSX leaderboard** — intentionally a static "Coming Soon" panel. There is no
  leaderboard data in the component; don't add fake rows to fill it.

### Dead data to be aware of

`podcastEpisodes` holds accurate data for all five episodes but is **not returned
by `renderVals()`**, so nothing renders it — the Profit Perspectives cards are
hardcoded in the markup. If you wire the array up to an `sc-for`, delete the
hardcoded cards at the same time or the page will show every episode twice.

## Conventions

- Styling is inline `style="..."` everywhere; the only stylesheet is the `<style>`
  block inside `<helmet>` (resets, keyframes, media queries).
- Palette: background `#07030f`, surface `#110828`, purple accent `#a855f7`,
  gold `#d4a853`, red `#f87171`, text `#f0e8ff`.
- Fonts: Cormorant Garamond (headings), DM Sans (body), loaded from Google Fonts.
