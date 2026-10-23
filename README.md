# sqsp-waitlist

A Forma-style waitlist signup for **Squarespace 7.1**, built on a native Newsletter
Block. Emails land wherever that block's Storage is set.

- Load intro: a 12px square sits between two lines of text, then grows into a glass card
  while the lines push out to the section edges
- CTA with a moving border opens a full-section glass panel
- Submit collapses the email field into a check circle, with a **Send to a friend** link
- Close condenses everything back to the square
- **Two placements:** hero (first section, site header hides while open) or inline (any
  section, header stays, page scrolls the section into view). `auto` picks for you
- Rotating last word, optional intro, scroll lock, Esc to close, share sheet or copy link
- Respects reduced motion; leaves the section editable in the editor

See **[docs/INSTALL.md](docs/INSTALL.md)**. Local demo: `npx serve .` → `/demo/`.

## CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/zsawtelle-lgtm/sqsp-waitlist@1/src/waitlist.css">
<script defer src="https://cdn.jsdelivr.net/gh/zsawtelle-lgtm/sqsp-waitlist@1/src/waitlist.js"></script>
```
`@1` needs a `v1.x.x` tag on the repo. Never use `@latest`.

No CDN: paste `snippets/self-hosted-injection.html` (rebuild with `python3 tools/build-snippet.py`).
