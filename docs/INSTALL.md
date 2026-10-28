# Waitlist

Forma-style waitlist signup for Squarespace 7.1, built on a native Newsletter Block.
Repo: <https://github.com/swtldesignco/sqsp-waitlist> · Version **1.0.0** · Status: **beta: tested on swtldesignco staging + mock 7.1 page**

---

# Part 1 — Basic install

## Overview

- On load, a 12px square sits between two lines of text. The square grows into a glass
  card while both lines push out to the section edges.
- The card holds a prompt line and a **Join the waitlist** button with a moving border.
- The button opens a full-section glass panel with an email field.
- On submit, the field collapses into a white circle with a check mark. A success line
  and a **Send to a friend** link come up under it.
- Close (X or Esc) condenses everything back to the square.
- Emails go through a **native Newsletter Block** hidden in the same section, so they
  land wherever that block's **Storage** is set (Email Campaigns, Mailchimp, Google Sheets).
- Visitors with "reduce motion" turned on get the resting state with no animation.

Requires the **Core plan or higher** and **Fluid Engine**.

## Pick a placement

| | Option A — Hero | Option B — Inline |
|---|---|---|
| Where | **First section** on the page | **Any other section** |
| Site header + menu | **Hide** while the panel is open | **Stay**; the X drops below a pinned header |
| On open | Panel fills the screen | Page scrolls the section to the top, then the panel fills it |
| Page scroll | Locked while open | Locked while open |
| Snippet | `snippets/page-header-injection.html` | `snippets/footer-injection.html` |

`placement: 'auto'` (Option B's default) picks **hero** when the section is first on the
page and **inline** everywhere else, so one sitewide install covers both.

## Step 1 — Build the section (both options)

1. Add a **Fluid Engine section**. Set the section **background** to your image or video
   and the **height** to Large. (Hero: the plugin also sets it to full screen.)
2. Add a native **Newsletter Block** anywhere in that section.
   - Storage: connect where emails should go.
   - **Turn off reCAPTCHA** on this block: a hidden block cannot show a challenge.
   - Its own text and button do not matter. The plugin hides the block on the live site.
3. Add a **Code Block** in the same section and paste
   [`snippets/code-block.html`](../snippets/code-block.html). Edit only the text:

| In the markup | What it is |
|---|---|
| `.wl__prefix` | Left line lead-in ("Welcome to"), fades during the push-out. Delete the span to skip it |
| text after the prefix | Left line, hugs the square |
| `.wl__pill` | Small pill beside the left line ("beta"). Delete to skip |
| `.wl__right` text | Right line |
| `data-wl-rotate="a, b, c"` | Words that rotate at the end of the right line. One word = no rotation |
| `data-wl-words` paragraph | Prompt line inside the square |
| `data-wl-open` button | CTA label |
| `.wl__heading` | Panel heading ("Get early access") |
| `.wl__success-title` / `-body` | Success message. `<span data-wl-email>` shows the email entered |
| `.wl__share` span | Share link label |

## Step 2A — Option A: first section (hero)

That page → ⚙ Page Settings → Advanced → **Page Header Code Injection**. Paste
[`snippets/page-header-injection.html`](../snippets/page-header-injection.html):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/swtldesignco/sqsp-waitlist@1/src/waitlist.css">
<script>
  window.WaitlistConfig = {
    placement: 'hero',
    hideHeader: true,
    lockScroll: true,
    intro: true,
    introTrigger: 'view',
    rotateInterval: 3,
    share: 'auto',
    toastText: 'Link copied to clipboard'
  };
</script>
<script defer src="https://cdn.jsdelivr.net/gh/swtldesignco/sqsp-waitlist@1/src/waitlist.js"></script>
```

Why page injection: hiding the header is a page-level choice. Keep it on the page that
has the waitlist as its first section.

## Step 2B — Option B: any section (inline)

**Settings → Developer Tools → Code Injection → Footer** (sitewide), or a page's Page
Header Code Injection for one page. Paste
[`snippets/footer-injection.html`](../snippets/footer-injection.html):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/swtldesignco/sqsp-waitlist@1/src/waitlist.css">
<script>
  window.WaitlistConfig = {
    placement: 'auto',
    hideHeader: 'auto',
    scrollIntoView: true,
    lockScroll: true,
    intro: true,
    introTrigger: 'view',
    rotateInterval: 3,
    share: 'auto'
  };
</script>
<script defer src="https://cdn.jsdelivr.net/gh/swtldesignco/sqsp-waitlist@1/src/waitlist.js"></script>
```

With `introTrigger: 'view'`, an inline section plays its intro when it scrolls into view.

## No CDN (self-hosted)

Paste [`snippets/self-hosted-injection.html`](../snippets/self-hosted-injection.html)
(the CSS and JS in one `<style>` + `<script>` block) instead of the CDN lines. Add a
`window.WaitlistConfig` script above it if you need settings. Use this for a quick test,
or when a site must not load from jsDelivr. Rebuild it after any change with
`python3 tools/build-snippet.py`.

## Customizations (toggles)

Priority, lowest to highest: plugin defaults → `window.WaitlistConfig` → `data-wl-*`
attributes on the Code Block's first `<div class="wl" data-wl>`.

| Setting (config) | Attribute | Default | Options | Description |
|---|---|---|---|---|
| `placement` | `data-wl-placement` | `auto` | `auto` `hero` `inline` | Hero = first section, header hides. Inline = any section, header stays. Auto = hero when first on the page |
| `hideHeader` | `data-wl-hide-header` | `auto` | `auto` `true` `false` | Hide the site header + menu while open. Auto = hero only |
| `scrollIntoView` | `data-wl-scroll-into-view` | `true` | `true` `false` | Inline: scroll the section to the top (under a pinned header) before opening |
| `lockScroll` | `data-wl-lock-scroll` | `true` | `true` `false` | Stop page scroll while the panel is open |
| `closeOnEsc` | `data-wl-close-on-esc` | `true` | `true` `false` | Esc key closes the panel |
| `intro` | `data-wl-intro` | `true` | `true` `false` | Play the square → edges load sequence. False = resting state at once |
| `introTrigger` | `data-wl-intro-trigger` | `view` | `view` `load` | Start the intro when the section is on screen, or at page load |
| `rotateInterval` | `data-wl-rotate-interval` | `3` | seconds, `0` = off | Time between rotating words |
| `share` | `data-wl-share` | `auto` | `auto` `copy` `native` `off` | Auto = phone share sheet on touch devices, copy link on desktop. Off hides the link |
| `shareUrl` | `data-wl-share-url` | this page | URL | Link that "Send to a friend" shares |
| `toastText` | `data-wl-toast-text` | `Link copied to clipboard` | text | Toast after a copy |
| `errorInvalid` | `data-wl-error-invalid` | `Please enter a valid email address` | text | Bad email format |
| `errorFailed` | `data-wl-error-failed` | `Something went wrong. Please try again.` | text | Newsletter block did not answer |
| `successStatus` | `data-wl-success-status` | `You're on the list…{email}…` | text | Screen-reader success line. `{email}` = the address |
| `submitTimeout` | `data-wl-submit-timeout` | `12` | seconds | Wait for the newsletter block before showing an error |
| `resetOnClose` | `data-wl-reset-on-close` | `true` | `true` `false` | Clear the field and success state after closing |
| `mode` | `data-wl-mode` | `squarespace` | `squarespace` `demo` | Demo = fake success, no Newsletter Block needed |

Example, one inline section that keeps the header and skips the intro:

```html
<div class="wl" data-wl data-wl-placement="inline" data-wl-intro="false">
```

## Per-site checklist

- [ ] Core plan or higher; Fluid Engine section.
- [ ] Newsletter Block in the **same section**, Storage connected, **reCAPTCHA off**.
- [ ] Code Block markup text edited (lines, prompt, CTA, heading, success).
- [ ] Option A snippet in that page's Page Header injection, **or** Option B in the Footer.
- [ ] Tested on the live site (`?noredirect`), not in the editor.
- [ ] Real test signup lands in the block's Storage.
- [ ] Hero: header and menu hide on open and return after close.
- [ ] Inline: section scrolls to the top on open; X is clear of the header.
- [ ] Phone width: lines stack above the square, no sideways page scroll.
- [ ] Handoff note: tell the client the hidden Newsletter Block is the real form; do not delete it.

---

# Part 2 — Styling

Add to **Design → Custom CSS** as its own numbered section
([`snippets/custom-css-examples.css`](../snippets/custom-css-examples.css)).
Fonts and weights come from Site Styles; the plugin does not set a font family.

| Variable | Set on | Default | Description |
|---|---|---|---|
| `--wl-text` | `.wl` | `#ffffff` | Lockup, prompt, CTA and panel text |
| `--wl-muted` | `.wl` | `rgba(255,255,255,.62)` | Prompt line, success body, share link |
| `--wl-line` | `.wl` | `rgba(255,255,255,.25)` | CTA border, pill border |
| `--wl-tint` | `.wl` | `rgba(18,18,22,.28)` | Tint over the blurred background |
| `--wl-blur` | `.wl` | `25px` | Glass blur |
| `--wl-field` | `.wl` | `#f2f2f7` | Email pill |
| `--wl-ink` | `.wl` | `#000000` | Input text, submit circle, check mark |
| `--wl-error` | `.wl` | `#ff8a80` | Error line |
| `--wl-size` | `.wl` | `min(360px, 100vw - 48px)` | The square |
| `--wl-margin` | `.wl` | `24px` (16px on phones) | Lockup and X distance from the edge |
| `--wl-height` | `.wl-host` | `100svh` | Hero section height |
| `--wl-inline-height` | `.wl-host--inline` | `100svh` (min 560px) | Inline section height |

Targeting: `.wl`, `.wl--hero`, `.wl--inline`, `.wl__left`, `.wl__right`, `.wl__prefix`,
`.wl__pill`, `.wl__rot`, `.wl__square`, `.wl__copy`, `.wl-cta`, `.wl__panel`,
`.wl__heading`, `.wl__field`, `.wl__input`, `.wl__submit`, `.wl__check`, `.wl__success`,
`.wl__share`, `.wl__close`, `.wl__back`, `.wl__toast`.

The share arrow uses the standard hover: 5px move plus a colour change.

---

# Part 3 — For developers

```
section.page-section.wl-host.wl-host--hero|inline
  div.wl.wl--hero|inline[data-wl]          ← lifted out of the grid, covers the section
    div.wl__lockup                         ← left + right lines (z 3)
    div.wl__card                           ← 360px → 100% on open (z 4 when open)
      div.wl__square                       ← 12px reveal → glass card
        p.wl__copy > span.wl__word         ← staggered prompt words
        div.wl__cta-wrap > button.wl-cta   ← laser border ::before
      div.wl__panel[role=dialog]
        div.wl__content
          div.wl__message                  ← heading / success share one grid cell
          div.wl__stage
            form.wl__field                 ← pill → 52px circle on submit
            button.wl__share
        button.wl__back · button.wl__close · div.wl__toast
  div.sqs-block-newsletter.wl-source       ← hidden, receives the email
```

State classes on `.wl`: `is-ready` (intro running), `is-open`, `has-value`, `is-busy`,
`is-submitted`, `wl--static` (intro off). On `body`: `wl-hide-header`,
`wl-header-return`. On `html`: `wl-lock`.

| Name | Description |
|---|---|
| `wl:ready` (event, bubbles) | Intro started. `detail: { placement, options }` |
| `wl:open` / `wl:close` | Panel opened / closed. `detail: { placement }` |
| `wl:submitted` / `wl:error` | Signup accepted / failed (no email in the detail) |
| `Waitlist.open(target)` / `close(target)` | Target = index, selector or element. Empty = first |
| `Waitlist.settings()` | Placement, header mode and settings each instance is using |
| `Waitlist.init()` | Build any new `[data-wl]` (also runs on Squarespace AJAX loads) |
| `Waitlist.version` | `1.0.0` |

Example, open from another button on the page:

```html
<a href="#" onclick="Waitlist.open(); return false;">Join</a>
```

Local demo: `npx serve .` → `/demo/` (mock 7.1 page: fixed header, hero instance in the
first section, inline instance further down, fake Newsletter Block).

---

# Part 4 — Support

## Troubleshooting

- **Error on every submit:** the Newsletter Block has reCAPTCHA on, or is not in the same
  section. Run `Waitlist.settings()` in the console: `newsletterBlock` must be `true`.
- **X can't be clicked:** a header overlaps the section and `hideHeader` is `false`.
  The X should drop below it; if a custom header is not `#header`, set `hideHeader: true`.
- **Intro already finished when the page appears:** set `introTrigger: 'view'` (default).
  With `load`, Squarespace's page fade can hide the start.
- **Nothing happens in the editor:** expected. The plugin leaves the section alone in the
  editor so the Newsletter Block and Code Block stay editable. Test with `?noredirect`.
- **Double gap at the top of a hero:** a transparent header adds top padding to the first
  section. The plugin covers the whole section, so the gap only shows in the editor.

## Deployed on

- swtldesignco.squarespace.com/newsletter-sub-test (pre-release build, Oct 2026): signup,
  intro, close, header hide all confirmed.
- Mock 7.1 page (`demo/index.html`): hero + inline, second signup after Back.
- Released v1.0.0 (Oct 23, 2026); `@1` CDN links confirmed live.

## Open items

- Confirm a **second** signup in one visit (after Back) on a live Newsletter Block. The
  plugin resets the block to its form state first; verified on the mock only.
- Check header hide with the "scroll back" fixed header style and with a custom header.
