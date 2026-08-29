(function () {
  const app = document.getElementById("app");
  let DATA = null;

  const STATUS_LABEL = {
    in_force: "In force",
    repealed: "Repealed",
    superseded: "Superseded",
    pending: "Pending",
  };

  function fmtDate(d) {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function stamp(status) {
    const key = status || "pending";
    const label = STATUS_LABEL[key] || key;
    return `<span class="stamp ${key}">${label}</span>`;
  }

  function lawUrl(id, anchor) {
    return `#/law/${encodeURIComponent(id)}${anchor ? "/" + encodeURIComponent(anchor) : ""}`;
  }

  function findLaw(id) {
    return DATA.laws.find((l) => l.id === id);
  }

  // ---------- lettered-list rendering ----------
  // marked (and GitHub) only understand digit-based ordered lists ("1.", "2.").
  // Legal drafting needs "a.", "b.", "c." (optionally "a\." to stop GitHub from
  // mangling it) with nested numeric sub-items. This preprocesses those blocks
  // into real nested <ol> HTML before handing the rest of the document to
  // marked, so inline formatting (*italics*, escapes, etc.) still works via
  // marked.parseInline on each item's text.
  const LIST_ITEM_RE = /^(\s*)([a-zA-Z]|\d+)\\?\.\s+(.*)$/;

  function isAlphaMarker(marker) {
    return /^[a-zA-Z]$/.test(marker);
  }

  function buildListTree(blockLines) {
    const root = { marker: null, text: null, children: [] };
    const stack = [{ indent: -1, node: root }];
    for (const line of blockLines) {
      if (line.trim() === "") continue;
      const m = line.match(LIST_ITEM_RE);
      if (!m) continue;
      const indent = m[1].length;
      const item = { marker: m[2], text: m[3], children: [] };
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
      stack[stack.length - 1].node.children.push(item);
      stack.push({ indent, node: item });
    }
    return root;
  }

  function renderListNode(node) {
    if (!node.children.length) return "";
    const type = isAlphaMarker(node.children[0].marker) ? "a" : "1";
    const items = node.children
        .map((child) => {
          const inline = window.marked ? marked.parseInline(child.text) : child.text;
          return `<li>${inline}${renderListNode(child)}</li>`;
        })
        .join("");
    return `<ol class="law-list" type="${type}">${items}</ol>`;
  }

  // A trailing "\" at the very end of a line is a GitHub-only device to force
  // a line break there; it should never be visible in our own renderer. Strip
  // it before anything else so it can't leak through as a literal backslash
  // (which is what CommonMark does when that backslash sits at the very end
  // of a block, since the hard-break rule explicitly excludes that position).
  function stripGithubLineBreaks(markdown) {
    return markdown.replace(/\\(\r?\n)/g, "$1");
  }

  // Both "a." and "1." top-level markers are routed through the same custom
  // nested-list builder so they share one styling surface (`.law-list`) and
  // one indentation knob in CSS — previously only alphabetic markers were
  // intercepted, so numeric lists (like "1. Lance Administrator;") kept the
  // browser's default <ol> styling and ignored .law-list entirely.
  function renderLawMarkdown(rawMarkdown) {
    const markdown = stripGithubLineBreaks(rawMarkdown || "");
    const lines = markdown.split("\n");
    const output = [];
    let i = 0;
    while (i < lines.length) {
      const m = lines[i].match(LIST_ITEM_RE);
      if (m) {
        const block = [];
        let j = i;
        while (j < lines.length) {
          const line = lines[j];
          if (line.trim() === "") {
            const next = lines[j + 1];
            if (next && LIST_ITEM_RE.test(next)) {
              block.push(line);
              j++;
              continue;
            }
            break;
          }
          if (!LIST_ITEM_RE.test(line)) break;
          block.push(line);
          j++;
        }
        output.push("", renderListNode(buildListTree(block)), "");
        i = j;
      } else {
        output.push(lines[i]);
        i++;
      }
    }
    return window.marked ? marked.parse(output.join("\n")) : output.join("\n");
  }

  // ---------- heading anchors / copy-link ----------

  function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
  }

  let toastTimer = null;
  function showToast(msg) {
    let toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function attachHeadingAnchors(container, lawId) {
    const used = {};
    container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      const base = slugify(h.textContent) || "section";
      let slug = base;
      let n = 2;
      while (used[slug]) slug = `${base}-${n++}`;
      used[slug] = true;
      h.id = slug;

      const link = document.createElement("a");
      link.className = "anchor-link";
      link.href = lawUrl(lawId, slug);
      link.setAttribute("aria-label", "Copy link to this section");
      link.textContent = "#";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const url = `${location.origin}${location.pathname}${lawUrl(lawId, slug)}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => showToast("Link copied"));
        }
        location.hash = lawUrl(lawId, slug).slice(1);
      });
      h.prepend(link);
    });
  }

  function scrollToAnchor(slug) {
    if (!slug) return;
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    el.classList.add("anchor-highlight");
    setTimeout(() => el.classList.remove("anchor-highlight"), 1600);
  }

  // ---------- views ----------

  function renderRegistry(filterText = "") {
    const q = filterText.trim().toLowerCase();
    const srLaws = DATA.laws.filter((l) => l.kind === "sr");
    const byCategory = {};
    for (const law of srLaws) {
      if (q && !(law.title.toLowerCase().includes(q) || law.id.toLowerCase().includes(q) || (law.abbreviation || "").toLowerCase().includes(q))) {
        continue;
      }
      (byCategory[law.category] = byCategory[law.category] || []).push(law);
    }

    const blocks = DATA.categories
        .filter((c) => byCategory[c] && byCategory[c].length)
        .map((cat) => {
          const rows = byCategory[cat]
              .sort((a, b) => (a.id > b.id ? 1 : -1))
              .map(
                  (law) => `
          <div class="registry-row">
            <span class="reg-id">${law.id}</span>
            <span class="reg-title"><a href="${lawUrl(law.id)}">${law.title}</a>${law.abbreviation ? `<span class="abbr">(${law.abbreviation})</span>` : ""}</span>
            <span class="reg-version">v${law.version || "—"}</span>
            <span class="reg-date">${fmtDate(law.last_amended)}</span>
          </div>`
              )
              .join("");
          return `
        <section class="category-block">
          <h2 class="category-heading">${cat}</h2>
          <hr class="category-rule" />
          ${rows}
        </section>`;
        })
        .join("");

    app.innerHTML = `
      <input class="registry-search" type="search" placeholder="Search laws by title, SR number, or abbreviation…" value="${filterText}" />
      ${blocks || `<p class="empty-state">No laws match “${filterText}”.</p>`}
    `;

    app.querySelector(".registry-search").addEventListener("input", (e) => {
      renderRegistry(e.target.value);
    });
    app.querySelector(".registry-search").focus();
    app.querySelector(".registry-search").setSelectionRange(filterText.length, filterText.length);
  }

  function renderLaw(id, anchor) {
    const law = findLaw(id);
    if (!law) {
      app.innerHTML = `<p class="empty-state">No law found with identifier “${id}”.</p>`;
      return;
    }

    const historyItems = (law.history || [])
        .map(
            (h) => `
        <li class="history-item">
          <div class="h-top"><span>${h.date}</span><span class="h-commit">#${h.commit}</span></div>
          <div class="h-msg">${h.message}${h.version ? ` <span class="h-version">v${h.version}</span>` : ""}</div>
        </li>`
        )
        .join("");

    const supersededBanner =
        law.kind === "archive"
            ? `<div class="superseded-banner">This text has been superseded${law.superseded_by ? ` by <a href="${lawUrl(law.superseded_by)}">${law.superseded_by}</a>` : ""} and is retained for historical reference only.</div>`
            : "";

    const bodyHtml = renderLawMarkdown(law.content || "");

    app.innerHTML = `
      <a class="back-link" href="#/">← Back to registry</a>
      <div class="law-layout">
        <aside>
          <div class="sidebar-panel">
            <h3>General information</h3>
            <div style="margin-bottom:12px;">${stamp(law.status)}</div>
            <dl>
              <div class="info-row"><dt>Abbreviation</dt><dd>${law.abbreviation || "—"}</dd></div>
              <div class="info-row mono"><dt>Enacted</dt><dd>${fmtDate(law.enacted_date)}</dd></div>
              <div class="info-row mono"><dt>Last amended</dt><dd>${fmtDate(law.last_amended)}</dd></div>
              <div class="info-row"><dt>Authority</dt><dd>${law.authority || "—"}</dd></div>
              <div class="info-row mono"><dt>Current version</dt><dd>${law.version || "—"}</dd></div>
              ${law.repeals ? `<div class="info-row"><dt>Repeals</dt><dd><a href="${lawUrl(law.repeals)}">${law.repeals}</a></dd></div>` : ""}
              ${law.superseded_by ? `<div class="info-row"><dt>Superseded by</dt><dd><a href="${lawUrl(law.superseded_by)}">${law.superseded_by}</a></dd></div>` : ""}
            </dl>
          </div>
          <div class="sidebar-panel">
            <h3>Version history</h3>
            <ul class="history-list">${historyItems || '<li class="history-item">No recorded history.</li>'}</ul>
          </div>
        </aside>
        <div class="law-content">
          ${supersededBanner}
          <div class="law-header">
            <div class="law-eyebrow">${law.id} · ${law.category || ""}</div>
            <h1 class="law-title">${law.title}</h1>
            <div class="law-linkrow">${stamp(law.status)}<span class="reg-version">v${law.version || "—"}</span></div>
          </div>
          <div class="law-body">${bodyHtml}</div>
        </div>
      </div>
    `;

    attachHeadingAnchors(app.querySelector(".law-body"), law.id);
    if (anchor) scrollToAnchor(anchor);
  }

  function renderArchive() {
    const items = DATA.laws.filter((l) => l.kind === "archive");
    const rows = items
        .map(
            (law) => `
      <div class="registry-row">
        <span class="reg-id">${law.id}</span>
        <span class="reg-title"><a href="${lawUrl(law.id)}">${law.title}</a></span>
        <span class="reg-version">v${law.version || "—"}</span>
        <span class="reg-date">${fmtDate(law.enacted_date)}</span>
      </div>`
        )
        .join("");
    app.innerHTML = `
      <h2 class="category-heading">Archive — superseded texts</h2>
      <hr class="category-rule" />
      ${rows || '<p class="empty-state">Archive is empty.</p>'}
    `;
  }

  function renderReferendums() {
    const rows = DATA.referendums
        .map(
            (r) => `
      <div class="ref-row">
        <div class="ref-title">${r.title}</div>
        <div class="ref-meta">${r.id} · ${fmtDate(r.date)} · ${r.result || "Pending"}${r.amends ? ` · amends <a href="${lawUrl(r.amends)}">${r.amends}</a>` : ""}</div>
        <div>${window.marked ? marked.parse(r.content || "") : r.content}</div>
      </div>`
        )
        .join("");
    app.innerHTML = `
      <h2 class="category-heading">Referendums</h2>
      <hr class="category-rule" />
      ${rows || '<p class="empty-state">No referendums recorded.</p>'}
    `;
  }

  // ---------- router ----------

  function route() {
    const hash = location.hash || "#/";
    const lawMatch = hash.match(/^#\/law\/([^/]+)(?:\/(.+))?$/);
    if (lawMatch) {
      return renderLaw(
          decodeURIComponent(lawMatch[1]),
          lawMatch[2] ? decodeURIComponent(lawMatch[2]) : null
      );
    }
    if (hash === "#/archive") return renderArchive();
    if (hash === "#/referendums") return renderReferendums();
    return renderRegistry();
  }

  window.addEventListener("hashchange", route);

  fetch("data/laws.json")
      .then((r) => r.json())
      .then((data) => {
        DATA = data;
        route();
      })
      .catch((err) => {
        app.innerHTML = `<p class="empty-state">Could not load data/laws.json — run the build script first.<br>${err}</p>`;
      });
})();
