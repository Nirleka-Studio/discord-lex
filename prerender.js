#!/usr/bin/env node
/**
 * Runs AFTER build.js. Turns site/data/laws.json into real, crawlable pages:
 *   site/law/<slug>/index.html            one page per law   (e.g. SR 310)
 *   site/law/<slug>/art-<n>/index.html    one page per article (e.g. SR 310 Art. 5)
 *   site/sitemap.xml                      lists every page above
 * Each page has its own <title>, meta description, canonical URL, JSON-LD
 * and the full text in the HTML (no JavaScript needed to read it).
 */
const fs = require("fs");
const path = require("path");
const LawParser = require("./site/law-parser.js");
const { marked } = require("marked");

const SITE = path.resolve("site");
const ORIGIN = process.env.SITE_ORIGIN || "https://nirleka-studio.github.io";
const BASE = process.env.SITE_BASE || "/discord-lex";            // repo name for project pages
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, "config.json"), "utf8"));
const data = JSON.parse(fs.readFileSync(path.join(SITE, "data/laws.json"), "utf8"));

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (md) => md.replace(/\[\^[\w-]+\]/g, "").replace(/<[^>]*>/g, "").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
const clip = (s, n = 155) => { s = s.replace(/^[\s:.,;-]+/, ""); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

function write(rel, html) {
  const f = path.join(SITE, rel, "index.html");
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

function page({ title, desc, urlPath, depth, body, jsonld }) {
  const up = "../".repeat(depth);
  const canonical = `${ORIGIN}${BASE}${urlPath}`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(cfg.siteName)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}"><meta property="og:type" content="article">
<link rel="icon" type="image/svg+xml" href="${up}assets/icons/favicon.svg">
<link rel="stylesheet" href="${up}styles.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head><body>
<header class="masthead"><div class="masthead-inner">
<a href="${BASE}/" class="masthead-title"><img src="${up}assets/icons/nsat_col.svg" alt="${esc(cfg.siteName)}" class="masthead-logo"></a>
</div></header>
<main class="app">${body}</main>
<footer class="site-footer"><span>${esc(cfg.footer || "").replace(/\n/g, "<br>")}</span></footer>
</body></html>`;
}

// Split a law's markdown into articles ("#### Art. 5 Title").
function splitArticles(md) {
  const defs = {};
  const lines = md.split("\n").filter((l) => {
    const m = l.match(/^\[\^([\w-]+)\]:\s+(.*)$/);
    if (m) { defs[m[1]] = l; return false; }
    return true;
  });
  const arts = [];
  let cur = null;
  for (const l of lines) {
    const h = l.match(/^#{1,6}\s+Art(?:icle|\.)?\s*(\d+[a-z]?)\b\s*(.*)$/i);
    if (h) { cur = { num: h[1].toLowerCase(), heading: l, title: h[2].replace(/\[\^[\w-]+\]/g, "").trim(), body: [] }; arts.push(cur); continue; }
    if (/^#{1,6}\s+(Chapter|Section|Part|Title|Book)\b/i.test(l)) { cur = null; continue; }
    if (cur) cur.body.push(l);
  }
  return arts.map((a) => {
    const text = [a.heading, ...a.body].join("\n").trim();
    const refs = [...text.matchAll(/\[\^([\w-]+)\]/g)].map((m) => m[1]);
    const footnotes = refs.filter((r) => defs[r]).map((r) => defs[r]).join("\n");
    return { ...a, md: text + (footnotes ? "\n\n" + footnotes : "") };
  });
}

const urls = [{ loc: "/", lastmod: data.generated_at.slice(0, 10), priority: "1.0" }];
const sr = data.laws.filter((l) => l.kind === "sr" || l.kind === "archive");

for (const law of sr) {
  const ls = slug(law.id);
  const lawPath = `/law/${ls}/`;
  const lastmod = (law.last_amended || law.enacted_date || data.generated_at).slice(0, 10);
  const label = law.abbreviation || law.title;
  const arts = law.kind === "sr" ? splitArticles(law.content || "") : [];

  const lawHtml = law.kind === "archive"
    ? marked.parse(law.content || "")
    : LawParser.toHTML(law.content || "", `${BASE}${lawPath}#`);

  const meta = `<p class="law-meta">${esc(law.id)} · Version ${esc(law.version)} · ${esc(law.status)} · Last amended ${esc(law.last_amended || "—")}</p>`;
  const toc = arts.length ? `<nav aria-label="Articles"><h2>Articles</h2><ul>${arts.map((a) =>
    `<li><a href="${BASE}${lawPath}art-${a.num}/">Art. ${esc(a.num.toUpperCase())}${a.title ? " " + esc(a.title) : ""}</a></li>`).join("")}</ul></nav>` : "";

  write(`law/${ls}`, page({
    title: `${law.id} — ${law.title}`,
    desc: clip(`${law.id} ${law.title}. ${plain(law.content || "")}`),
    urlPath: lawPath, depth: 2,
    body: `<a class="back-link" href="${BASE}/">← Registry</a><article><h1>${esc(law.id)} — ${esc(law.title)}</h1>${meta}${lawHtml}${toc}</article>`,
    jsonld: { "@context": "https://schema.org", "@type": "Legislation", name: `${law.id} — ${law.title}`,
      legislationIdentifier: law.id, legislationDate: law.enacted_date, dateModified: law.last_amended,
      version: law.version, url: `${ORIGIN}${BASE}${lawPath}` },
  }));
  urls.push({ loc: lawPath, lastmod, priority: "0.8" });

  for (const a of arts) {
    const aPath = `${lawPath}art-${a.num}/`;
    const aLabel = `${law.id} Art. ${a.num.toUpperCase()}`;
    write(`law/${ls}/art-${a.num}`, page({
      title: `${aLabel}${a.title ? " " + a.title : ""} — ${label}`,
      desc: clip(plain(a.md.split("\n").slice(1).join(" ")) || `${aLabel} of the ${law.title}`),
      urlPath: aPath, depth: 3,
      body: `<a class="back-link" href="${BASE}${lawPath}">← ${esc(law.id)} ${esc(label)}</a><article><h1>${esc(aLabel)}${a.title ? " — " + esc(a.title) : ""}</h1>${LawParser.toHTML(a.md, `${BASE}${aPath}#`)}<p><a href="${BASE}${lawPath}">Read the full ${esc(label)}</a></p></article>`,
      jsonld: { "@context": "https://schema.org", "@type": "Legislation", name: aLabel, legislationIdentifier: aLabel,
        isPartOf: { "@type": "Legislation", name: law.title, url: `${ORIGIN}${BASE}${lawPath}` },
        dateModified: law.last_amended, url: `${ORIGIN}${BASE}${aPath}` },
    }));
    urls.push({ loc: aPath, lastmod, priority: "0.6" });
  }
}

fs.writeFileSync(path.join(SITE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${ORIGIN}${BASE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n") +
  `\n</urlset>\n`);
console.log(`Prerendered ${urls.length - 1} pages + sitemap.xml`);
