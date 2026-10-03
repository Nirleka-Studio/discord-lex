#!/usr/bin/env node
/**
 * Builds site/data/laws.json from a law repo laid out like:
 *   sr/<category-folder>/<code>-<slug>.md   (in-force / current law text)
 *   archive/<slug>.md                       (superseded / historical text)
 *   referendums/<slug>.md                   (referendum records)
 *
 * Each sr/ and archive/ file needs YAML frontmatter, e.g.:
 *   sr_id: "SR 100"
 *   title: "Charter of the Nirleka Studios Discord Server"
 *   abbreviation: "Server Charter"
 *   version: "2.0.2"
 *   category: "Constitutional Law"
 *   status: "in_force"          # in_force | repealed | superseded | pending
 *   enacted_date: "2025-01-04"
 *   last_amended: "2026-08-29"
 *   authority: "The Director"
 *   superseded_by: "SR 100"     # optional, archive/ only
 *   repeals: "ARCH 100"         # optional, sr/ only
 *
 * Version history is derived from real git history: for every commit that
 * touched a file, we read the frontmatter `version` as it was AT that
 * commit, so the history reflects genuine version bumps rather than a
 * separately-maintained changelog.
 *
 * Draft commits are ignored. Any commit whose message starts with
 * `draft:`, `draft(scope):` or `draft(scope)!:` is skipped entirely: it is
 * not listed in history, and its content/frontmatter is never used. The
 * current version of a law is the latest NON-draft commit, regardless of
 * what is in the working tree. A law with only draft commits is omitted.
 *
 * Usage (run from the repo root, next to sr/, archive/, referendums/):
 *   node build.js                    # writes site/data/laws.json
 *   node build.js . site/data/laws.json   # equivalent, explicit
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const matter = require("gray-matter");

const CONTENT_ROOT = path.resolve(process.argv[2] || ".");
const OUT_FILE = path.resolve(process.argv[3] || "site/data/laws.json");

// Matches "draft: ...", "draft(scope): ...", and "draft(scope)!: ..."
const DRAFT_RE = /^draft(\([^)]*\))?!?:/i;
const isDraftCommit = (message) => DRAFT_RE.test(message.trim());

function isGitRepo(dir) {
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: dir, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

function relGit(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function stripFirstH1(markdownText) {
  if (!markdownText) return markdownText;
  // Matches the first line that starts with '# ' and removes it along with its trailing newline
  return markdownText.replace(/^\s*#\s+.*(?:\r?\n)?/, "");
}

// Pulls one history entry per NON-DRAFT commit that touched the file,
// including the full frontmatter + body text as they existed at that
// commit, so the front-end can render any historical version, not just
// list its metadata. Each entry also carries the raw frontmatter as `data`
// (internal only; stripped before output in loadLaw).
function versionHistory(root, file) {
  if (!isGitRepo(root)) return [];
  const relPath = relGit(root, file);
  let log;
  try {
    log = execSync(
        `git log --follow --format="%H|%ad|%s" --date=short -- "${relPath}"`,
        { cwd: root, encoding: "utf8" }
    ).trim();
  } catch {
    return [];
  }
  if (!log) return [];

  return log
      .split("\n")
      .map((line) => {
        const [hash, date, ...msgParts] = line.split("|");
        return { hash, date, message: msgParts.join("|") };
      })
      .filter(({ message }) => !isDraftCommit(message)) // ignore drafts
      .map(({ hash, date, message }) => {
        let data = null;
        let content = null;
        try {
          const blob = execSync(`git show ${hash}:"${relPath}"`, {
            cwd: root,
            encoding: "utf8",
          });
          const fm = matter(blob);
          data = fm.data;
          content = stripFirstH1(fm.content);
        } catch {
          // file may not have existed at that path for this commit; skip
        }
        return {
          commit: hash.slice(0, 7),
          date,
          message,
          version: data?.version || null,
          status: data?.status || null,
          content,
          data,
        };
      });
  // git log already returns entries newest-first, matching what the
  // front-end expects at index 0 — do not reverse this.
}

function loadLaw(root, file, kind) {
  const relPath = relGit(root, file);
  const categoryFolder = kind === "sr" ? path.basename(path.dirname(file)) : null;
  const history = versionHistory(root, file);

  let data, content;
  if (isGitRepo(root)) {
    // Current version = newest non-draft commit, NOT the working tree.
    const latest = history.find((h) => h.data);
    if (!latest) return null; // never published (only drafts / untracked), skip
    data = latest.data;
    content = latest.content;
  } else {
    // No git available: fall back to the working tree.
    const parsed = matter(fs.readFileSync(file, "utf8"));
    data = parsed.data;
    content = stripFirstH1(parsed.content);
  }

  return {
    kind, // "sr" | "archive"
    id: data.sr_id || data.ref_id || path.basename(file, ".md"),
    title: data.title || path.basename(file, ".md"),
    abbreviation: data.abbreviation || null,
    version: data.version || null,
    category: data.category || null,
    categoryFolder,
    status: data.status || (kind === "archive" ? "superseded" : "in_force"),
    enacted_date: data.enacted_date || null,
    last_amended: data.last_amended || null,
    authority: data.authority || null,
    superseded_by: data.superseded_by || null,
    repeals: data.repeals || null,
    path: relPath,
    content, // raw Markdown body, rendered client-side
    history: history.map(({ data, ...rest }) => rest), // drop internal `data`
  };
}

function loadReferendum(root, file) {
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const results = (data.metrics && data.metrics.results) || {};
  const options = Object.entries(results).map(([option, votes]) => ({ option, votes: Number(votes) || 0 }));

  return {
    kind: "referendum",
    id: `REF ${String(data.ref_no ?? "").padStart(4, "0")}`,
    ref_no: data.ref_no,
    title: data.title || path.basename(file, ".md"),
    initiated_by: data.initiated_by || null,
    created_at: data.created_at || null,
    duration: data.duration || null,
    ended_at: data.ended_at || null,
    total_voters: (data.metrics && data.metrics.total_voters) || 0,
    options,
    path: relGit(root, file),
    content,
  };
}

function main() {
  const srFiles = walk(path.join(CONTENT_ROOT, "sr"));
  const archiveFiles = walk(path.join(CONTENT_ROOT, "archive"));
  const refFiles = walk(path.join(CONTENT_ROOT, "referendums"));

  const laws = [
    ...srFiles.map((f) => loadLaw(CONTENT_ROOT, f, "sr")),
    ...archiveFiles.map((f) => loadLaw(CONTENT_ROOT, f, "archive")),
  ]
      .filter(Boolean) // drop laws with no non-draft commits
      .sort((a, b) => (a.id > b.id ? 1 : -1));

  const referendums = refFiles
      .map((f) => loadReferendum(CONTENT_ROOT, f))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const categories = [...new Set(laws.filter((l) => l.kind === "sr").map((l) => l.category))];

  const manifest = {
    generated_at: new Date().toISOString(),
    categories,
    laws,
    referendums,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${laws.length} laws and ${referendums.length} referendums to ${OUT_FILE}`);
}

main();
