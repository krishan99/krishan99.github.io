#!/usr/bin/env node
/*
 * Site build.
 *
 * Walks posts/, produces a homepage listing, and renders any markdown posts.
 * Two tiers of post, decided by what's in the folder:
 *
 *   posts/<slug>/post.md     Tier 1 — common text post. Front-matter (incl. a
 *                            `theme:` block) + markdown body, rendered through
 *                            templates/post.html. Writes posts/<slug>/index.html.
 *
 *   posts/<slug>/index.html  Tier 2 — fully bespoke. Left untouched. Must carry a
 *                            <script type="application/json" id="post-meta">{...}</script>
 *                            block so it can appear in the homepage listing.
 *
 * Run: npm run build   (then commit the generated index.html + post pages)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(ROOT, 'posts');

// theme front-matter key -> CSS variable
const THEME_VARS = {
  bg: '--bg',
  fg: '--fg',
  mut: '--mut',
  dim: '--dim',
  faint: '--faint',
  accent: '--ac',
  accentSoft: '--ac-soft',
  accentGrad: '--ac-grad',
  background: '--bg-image',
  font: '--font',
  fontMono: '--font-mono',
};

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// YAML auto-parses unquoted `2026-05-28` into a Date. Normalize back to YYYY-MM-DD.
function normalizeDate(d) {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return d == null ? '' : String(d);
}

function themeToCss(theme = {}) {
  const lines = [];
  for (const [key, cssVar] of Object.entries(THEME_VARS)) {
    if (theme[key] == null) continue;
    lines.push(`      ${cssVar}: ${theme[key]};`);
  }
  // Derive a soft accent if an accent was given but no explicit soft variant.
  if (theme.accent && theme.accentSoft == null) {
    lines.push(`      --ac-soft: ${theme.accent}1c;`);
  }
  // Derive the gradient block from a flat accent if none was given.
  if (theme.accent && theme.accentGrad == null) {
    lines.push(`      --ac-grad: linear-gradient(135deg, ${theme.accent}, ${theme.accent});`);
  }
  return lines.join('\n');
}

function fontLinks(theme = {}) {
  if (!theme.fontUrl) return '';
  const urls = Array.isArray(theme.fontUrl) ? theme.fontUrl : [theme.fontUrl];
  return urls.map((u) => `  <link href="${esc(u)}" rel="stylesheet">`).join('\n');
}

function fill(template, map) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in map ? map[k] : ''));
}

// Pull the #post-meta JSON out of a Tier 2 bespoke index.html.
function readBespokeMeta(html, slug) {
  const m = html.match(
    /<script[^>]*id=["']post-meta["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m) {
    console.warn(`  ! posts/${slug}/index.html has no #post-meta block — skipping from index`);
    return null;
  }
  try {
    return { ...JSON.parse(m[1].trim()), slug };
  } catch (e) {
    console.warn(`  ! posts/${slug}/index.html has invalid #post-meta JSON — ${e.message}`);
    return null;
  }
}

function buildPostPage(postTemplate, slug, raw) {
  const { data, content } = matter(raw);
  const body = marked.parse(content);
  const date = normalizeDate(data.date);
  const html = fill(postTemplate, {
    TITLE: esc(data.title || slug),
    DESCRIPTION: esc(data.description || data.title || ''),
    DATE: esc(date),
    TAG: esc(data.tag || ''),
    BODY: body,
    THEME_VARS: themeToCss(data.theme),
    FONT_LINKS: fontLinks(data.theme),
  });
  writeFileSync(join(POSTS_DIR, slug, 'index.html'), html);
  return { slug, title: data.title || slug, date, tag: data.tag || '' };
}

function postRow(p) {
  return `      <a class="post" href="posts/${esc(p.slug)}/">
        <span class="post-date">${esc(p.date)}</span>
        <span class="post-title">${esc(p.title)}</span>
        <span class="post-tag">${esc(p.tag)}</span>
      </a>`;
}

function main() {
  const postTemplate = readFileSync(join(ROOT, 'templates', 'post.html'), 'utf8');
  const indexTemplate = readFileSync(join(ROOT, 'templates', 'index.html'), 'utf8');

  const slugs = existsSync(POSTS_DIR)
    ? readdirSync(POSTS_DIR).filter(
        (name) => !name.startsWith('_') && statSync(join(POSTS_DIR, name)).isDirectory()
      )
    : [];

  const metas = [];
  for (const slug of slugs) {
    const dir = join(POSTS_DIR, slug);
    const mdPath = join(dir, 'post.md');
    const htmlPath = join(dir, 'index.html');

    if (existsSync(mdPath)) {
      const meta = buildPostPage(postTemplate, slug, readFileSync(mdPath, 'utf8'));
      metas.push(meta);
      console.log(`  rendered  posts/${slug}/  (markdown)`);
    } else if (existsSync(htmlPath)) {
      const meta = readBespokeMeta(readFileSync(htmlPath, 'utf8'), slug);
      if (meta) {
        metas.push(meta);
        console.log(`  passthru  posts/${slug}/  (bespoke html)`);
      }
    } else {
      console.warn(`  ! posts/${slug}/ has neither post.md nor index.html — skipping`);
    }
  }

  // newest first
  metas.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const list = metas.length
    ? metas.map(postRow).join('\n')
    : '      <p class="tagline" style="margin-top:0;">Nothing published yet — soon.</p>';
  const indexHtml = indexTemplate.replace('<!-- POSTS -->', list);
  writeFileSync(join(ROOT, 'index.html'), indexHtml);

  console.log(`\n  ${metas.length} post(s) -> index.html`);
}

main();
