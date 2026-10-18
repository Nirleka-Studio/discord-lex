#!/usr/bin/env node
/**
 * Prerender static, crawlable pages from data/laws.json.
 *
 * Input : data/laws.json, config.json   (the single source of truth)
 * Output: law/<slug>/index.html   one real HTML page per law (full text, meta, JSON-LD)
 *         law/<slug>.md           raw Markdown per law (best format for AI fetchers)
 *         sitemap.xml, llms.txt   discovery files listing every law
 *
 * Nothing is hand-maintained and none of the output is committed: CI runs this after
 * build.js and deploys the result. Locally: node build.js && node scripts/prerender.js
 */
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const ROOT = path.join(REPO, "site"); // everything generated lands inside site/ (the Pages artifact)
const SITE_URL = (process.env.SITE_URL || "https://nirleka-studio.github.io/discord-lex").replace(/\/$/, "");
const LawParser = require(path.join(ROOT, "law-parser.js"));
let marked = null;
try { marked = require(path.join(REPO, "node_modules", "marked")).marked; }
catch (_) { console.warn("WARN: `marked` not installed (npm i marked@12.0.2); archive pages will render as <pre>."); }

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/laws.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugOf = (id) => id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (md) => md.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|\[\]]/g, "").replace(/\(https?:[^)]*\)/g, "").replace(/\s+/g, " ").trim();

// wipe previous output so deleted/renamed laws don't leave stale pages behind
fs.rmSync(path.join(ROOT, "law"), { recursive: true, force: true });
fs.mkdirSync(path.join(ROOT, "law"), { recursive: true });

function bodyHtml(law) {
  if (law.kind === "archive") return marked ? marked.parse(law.content || "") : `<pre>${esc(law.content)}</pre>`;
  return LawParser.toHTML(law.content || "", "#"); // anchors become plain #fragment links
}

function page(law) {
  const slug = slugOf(law.id);
  const url = `${SITE_URL}/law/${slug}/`;
  const title = `${law.id} — ${law.title}`;
  const desc = plain(law.content).slice(0, 200);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: title,
    legislationIdentifier: law.id,
    alternateName: law.abbreviation || undefined,
    legislationType: law.kind === "archive" ? "Archived rule" : "Server rule",
    legislationDate: law.enacted_date || undefined,
    dateModified: law.last_amended || undefined,
    legislationLegalForce: law.status === "in force" || law.status === "active" ? "InForce" : "NotInForce",
    author: law.authority ? { "@type": "Person", name: law.authority } : undefined,
    url,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: config.siteName, url: SITE_URL + "/" },
  };
  const meta = [
    ["Status", law.status], ["Category", law.category], ["Version", law.version],
    ["Enacted", law.enacted_date], ["Last amended", law.last_amended], ["Authority", law.authority],
    ["Superseded by", law.superseded_by], ["Repeals", law.repeals],
  ].filter(([, v]) => v && v !== "N/A");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(config.siteName)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="text/markdown" href="${SITE_URL}/law/${slug}.md">
<link rel="icon" type="image/svg+xml" href="../../assets/icons/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta name="google-site-verification" content="dwstA50sTftyoYCg5gmbP8GDUt8BpEicviZJR1eHITA">
<link rel="stylesheet" href="../../styles.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>
<body>
<header class="masthead"><div class="masthead-inner">
  <a class="masthead-title" href="../../" aria-label="${esc(config.siteName)}"><img class="masthead-logo" src="../../assets/icons/nsat_col.svg" alt="Logo"></a>
  <nav class="masthead-nav"><a href="../../#/">Registry</a><a href="../../#/referendums">Referendums</a><a href="../../#/archive">Archive</a></nav>
</div></header>
<main class="app">
  <article>
    <h1>${esc(law.id)} — ${esc(law.title)}</h1>
    <dl>${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    <p><a href="../../#/law/${encodeURIComponent(law.id)}">Open interactive view with version history</a> · <a href="../${slug}.md">Raw Markdown</a></p>
    ${bodyHtml(law)}
  </article>
</main>
<footer class="site-footer"><span>${esc(config.footer).replace(/\n\n/g, "<br><br>")}</span></footer>
</body>
</html>
`;
}

const urls = [`${SITE_URL}/`];
for (const law of data.laws) {
  const slug = slugOf(law.id);
  fs.mkdirSync(path.join(ROOT, "law", slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "law", slug, "index.html"), page(law));
  fs.writeFileSync(path.join(ROOT, "law", `${slug}.md`), `# ${law.id} — ${law.title}\n\n${law.content}\n`);
  urls.push(`${SITE_URL}/law/${slug}/`);
}

// crawler-visible law index inside <main id="app"> (app.js replaces it on load)
const idxPath = path.join(ROOT, "index.html");
const list = "<!-- LAWS-START --><nav aria-label=\"All laws\"><ul>" +
  data.laws.map((l) => `<li><a href="law/${slugOf(l.id)}/">${esc(l.id)} — ${esc(l.title)}</a></li>`).join("") +
  "</ul></nav><!-- LAWS-END -->";
fs.writeFileSync(idxPath, fs.readFileSync(idxPath, "utf8").replace(/<!-- LAWS-START -->[\s\S]*?<!-- LAWS-END -->/, list));

const lastmod = (data.generated_at || new Date().toISOString()).slice(0, 10);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n") + `\n</urlset>\n`);

fs.writeFileSync(path.join(ROOT, "llms.txt"),
  `# ${config.siteName}\n\n> ${config.footer.split("\n")[0]}\n\n## Laws (raw Markdown)\n\n` +
  data.laws.map((l) => `- [${l.id} — ${l.title}](${SITE_URL}/law/${slugOf(l.id)}.md): ${l.status}`).join("\n") + "\n");

console.log(`Prerendered ${data.laws.length} laws → law/, sitemap.xml, llms.txt`);
