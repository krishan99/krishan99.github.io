# krishan99.github.io

Krishan Amin's personal site. A static, hand-built blog served directly by GitHub
Pages — no framework, no runtime JS, no tracker. The homepage is a listing of
posts; each post is its own page.

## The one rule

**Generated files are not edited by hand.** The build writes them; editing them
is wasted work that the next `npm run build` overwrites.

Generated (do **not** edit):
- `index.html` — the homepage. Regenerated from `templates/index.html` + post metadata.
- `posts/<slug>/index.html` **when a `post.md` sits next to it** — rendered from that markdown.

Source (edit these):
- `templates/` — page shells.
- `posts/<slug>/post.md` — Tier 1 post content + theme.
- `posts/<slug>/index.html` **when there is no `post.md`** — Tier 2 bespoke post (authored by hand; the build leaves it alone).
- `assets/theme.css` — site-wide default tokens.
- `build.mjs` — the build itself.

After any source change: **`npm run build`**, then commit both the source and the
regenerated output. The build is local; GitHub Pages serves the committed files
as-is and does not run it.

## The two tiers of post

A post is a folder under `posts/`. The build decides how to treat it by what's inside:

### Tier 1 — common text post (`post.md`)
The default. Use for normal, mostly-text posts. Write markdown; theme via
front-matter. Rendered through `templates/post.html` into `posts/<slug>/index.html`.

```markdown
---
title: On the quiet joy of plain text
date: 2026-05-28          # YYYY-MM-DD
tag: essays               # single short tag, lowercase
description: One-line meta description.
theme:                    # entirely optional — omit to inherit Dark + Ember
  bg: "#11140f"
  fg: "#e7ece0"
  accent: "#9bcf5f"
  background: "radial-gradient(...)"   # optional gradient/image backdrop
  font: "'IBM Plex Serif', Georgia, serif"
  fontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif&display=swap"
---

Markdown body. Headings, **bold**, *italic*, `code`, [links], lists, blockquotes,
code fences, and images are all styled by templates/post.html.
```

Start one by copying the template:
```
cp -r posts/_template posts/my-new-post
```

### Tier 2 — bespoke post (`index.html`, no `post.md`)
Use only when a post needs its own structure/layout/interaction, not just its own
colors. Write a complete, self-contained HTML document — own `<style>`, own
everything. The build never rewrites it.

**Required:** it must carry a metadata block, the only thing the build reads from
it, so it can appear on the homepage:
```html
<script type="application/json" id="post-meta">
{ "title": "The terminal is a design surface", "date": "2026-01-19", "tag": "tools" }
</script>
```
Relative paths from a post page: site root is `../../`. Link back to the index with
`href="../../"`.

**Reach for Tier 1 first.** A post that differs only in color/background/font is a
Tier 1 post with a `theme:` block, not a Tier 2 page.

## Theme tokens

Both templates are driven by CSS variables defined in `assets/theme.css` (the
default Dark + Ember palette). A Tier 1 `theme:` block overrides them per-post via
these keys:

| front-matter | CSS var      | meaning                                   |
|--------------|--------------|-------------------------------------------|
| `bg`         | `--bg`       | page background color                     |
| `fg`         | `--fg`       | body text                                 |
| `mut`        | `--mut`      | muted text (dates, tagline)               |
| `dim`        | `--dim`      | dimmer text (tags, footer)                |
| `faint`      | `--faint`    | hairlines, code backgrounds               |
| `accent`     | `--ac`       | accent; `--ac-soft`/`--ac-grad` derived from it if not set |
| `accentSoft` | `--ac-soft`  | accent hover wash (defaults to `accent`+`1c`) |
| `accentGrad` | `--ac-grad`  | the small gradient marks/rule             |
| `background` | `--bg-image` | gradient/image backdrop, overrides flat `bg` |
| `font`       | `--font`     | body font stack                           |
| `fontMono`   | `--font-mono`| mono font stack                           |
| `fontUrl`    | —            | font stylesheet(s) injected into `<head>` (string or list) |

Change the **site-wide default** by editing `assets/theme.css`. Never edit it to
restyle a single post — that's what the `theme:` block is for.

## Conventions

- **Slug = folder name = URL.** `posts/my-post/` serves at `/posts/my-post/`. Use
  lowercase, hyphenated, stable slugs (renaming breaks links).
- **Dates are `YYYY-MM-DD`.** Quote them in front-matter to be safe; the build
  normalizes either way. Homepage sorts newest-first by date.
- **One tag per post**, lowercase.
- Keep posts self-contained inside their folder (images, etc. live alongside).

## Layout

```
index.html              generated homepage
build.mjs               the build
package.json            `npm run build`
assets/theme.css        default tokens (site-wide)
templates/
  index.html            homepage shell, has a `<!-- POSTS -->` slot
  post.html             Tier 1 post layout, token-driven
posts/
  _template/post.md     starter to copy for a new Tier 1 post
  <slug>/post.md        Tier 1 source         -> generates <slug>/index.html
  <slug>/index.html     Tier 2 bespoke page   (no post.md beside it)
```

## Commands

```
npm install     # once, after clone (installs marked + gray-matter)
npm run build   # render markdown posts + regenerate index.html
```
