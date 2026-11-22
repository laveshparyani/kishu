# Krishna Kevlani · The Cosmic Code: astrologer portfolio (prototype)

A static, single-page site in plain HTML, CSS and JS with no build step. It can be deployed as-is on Vercel, Netlify or GitHub Pages.

- **3D background** (`cosmos.js`): three.js starfield, nebula glow and a golden armillary sphere that follows the hero photo.
- **Animations** (`script.js`): GSAP + ScrollTrigger hero entrance, scroll reveals, counters, parallax, a pinned 3D rashi ring and a timeline that draws itself.
- Libraries are vendored in `vendor/` (three 0.160.0, gsap 3.12.5), so there are no runtime CDN dependencies.
- All motion is turned off when the visitor has "reduce motion" enabled.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Placeholders to replace before launch

- `script.js` → `WHATSAPP_NUMBER`
- `index.html` → phone, email, floating WhatsApp link (`wa.me/...`)
- Hero stats (years, charts read, rating)
- Consultation prices
- Testimonials (currently sample text)
