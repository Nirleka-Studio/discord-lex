(function () {
  const app = document.getElementById("app");
  let DATA = null;

  const GITHUB_REPO_URL = "https://github.com/Nirleka-Studio/discord-lex";

  const STATUS_LABEL = {
    in_force: "In force",
    repealed: "Repealed",
    superseded: "Superseded",
    pending: "Pending",
    historical: "Historical version",
    ongoing: "Ongoing",
    closed: "Closed",
  };

  function fmtDate(d) {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  }

  function fmtDateTime(d) {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function referendumStatus(ref) {
    if (!ref.ended_at) return "ongoing";
    const ended = new Date(ref.ended_at);
    if (isNaN(ended)) return "ongoing";
    return ended.getTime() <= Date.now() ? "closed" : "ongoing";
  }

  function referendumChart(ref) {
    const options = ref.options || [];
    if (!options.length) return '<p class="empty-state" style="padding:16px 0;">No results recorded.</p>';
    const totalCast = options.reduce((s, o) => s + o.votes, 0);
    const maxVotes = Math.max(1, ...options.map((o) => o.votes));
    const sorted = [...options].sort((a, b) => b.votes - a.votes);
    const winner = totalCast > 0 ? sorted[0].option : null;

    const rows = sorted
        .map((o) => {
          const pct = totalCast ? Math.round((o.votes / totalCast) * 100) : 0;
          const widthPct = Math.round((o.votes / maxVotes) * 100);
          const isWinner = o.option === winner && o.votes > 0;
          return `
        <div class="ref-bar-row ${isWinner ? "winner" : ""}">
          <div class="ref-bar-label">${o.option}${isWinner ? '<span class="ref-winner-tag">Leading</span>' : ""}</div>
          <div class="ref-bar-track"><div class="ref-bar-fill" style="width:${widthPct}%"></div></div>
          <div class="ref-bar-value">${o.votes}<span class="ref-bar-pct">(${pct}%)</span></div>
        </div>`;
        })
        .join("");

    return `<div class="ref-chart">${rows}</div><div class="ref-total">${totalCast} vote${totalCast === 1 ? "" : "s"} cast · ${ref.total_voters} member${ref.total_voters === 1 ? "" : "s"} eligible</div>`;
  }

  function stamp(status) {
    const key = status || "pending";
    const label = STATUS_LABEL[key] || key;
    return `<span class="stamp ${key}">${label}</span>`;
  }

  // Resolves what should be shown for a given entry in the version history.
  // history[] is sorted newest-first, so index 0 is always the current text.
  // Older entries are labelled "historical" regardless of what `status` was
  // recorded at that commit, since what matters to a reader is simply
  // "is this the current text or not" — the current status lives on `law`.
  function versionAt(law, idx) {
    const hist = law.history || [];
    if (!hist.length) {
      return {
        isCurrent: true,
        version: law.version,
        status: law.status,
        date: law.last_amended,
        content: law.content,
        commit: null,
      };
    }
    const h = hist[idx] || hist[0];
    const isCurrent = idx === 0;
    return {
      isCurrent,
      version: h.version || law.version,
      status: isCurrent ? law.status : "historical",
      date: h.date,
      content: h.content != null ? h.content : law.content,
      commit: h.commit,
    };
  }

  function lawUrl(id, anchor) {
    return `#/law/${encodeURIComponent(id)}${anchor ? "/" + encodeURIComponent(anchor) : ""}`;
  }

  function findLaw(id) {
    return DATA.laws.find((l) => l.id === id);
  }

  function stripMarkdown(md) {
    if (!md) return "";
    return md
        .replace(/#+\s+/g, "")       // Headings
        .replace(/[*_~`]/g, "")      // Bold/Italics/Code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
        .replace(/<[^>]*>/g, "");    // HTML tags
  }
  
  function highlightMatches(text, query) {
    if (!text || !query) return text || "";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, "<mark class=\"search-highlight\">$1</mark>");
  }
  
  function renderLawMarkdown(rawMarkdown, lawId) {
    const baseUrl = `#/law/${encodeURIComponent(lawId)}/`;

    let html = LawParser.toHTML(rawMarkdown || "", baseUrl);
    console.log(html);
    return html;
  }

  // ---------- heading anchors / copy-link ----------

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

    const scoredLaws = [];

    for (const law of srLaws) {
      if (!q) {
        scoredLaws.push({ law, score: 1, snippet: null });
        continue;
      }

      const id = law.id.toLowerCase();
      const title = law.title.toLowerCase();
      const abbr = (law.abbreviation || "").toLowerCase();
      const category = (law.category || "").toLowerCase();
      const authority = (law.authority || "").toLowerCase();
      const plainContent = stripMarkdown(law.content).toLowerCase();

      let score = 0;
      let snippet = null;

      // Relevance Scoring Model
      if (id === q) score += 100;
      if (abbr === q) score += 90;
      if (title.includes(q)) score += 50;
      if (id.includes(q)) score += 40;
      if (abbr.includes(q)) score += 30;
      if (category.includes(q) || authority.includes(q)) score += 20;

      // Content Search & Snippet Extraction
      const contentIdx = plainContent.indexOf(q);
      if (contentIdx !== -1) {
        score += 10;
        const start = Math.max(0, contentIdx - 40);
        const end = Math.min(plainContent.length, contentIdx + q.length + 60);
        const rawSnippet = (start > 0 ? "…" : "") + plainContent.slice(start, end) + (end < plainContent.length ? "…" : "");
        snippet = highlightMatches(rawSnippet, q);
      }

      if (score > 0) {
        scoredLaws.push({ law, score, snippet });
      }
    }

    // Sort by Relevance Score descending, then SR ID
    scoredLaws.sort((a, b) => b.score - a.score || (a.law.id > b.law.id ? 1 : -1));

    // Group matching laws by Category
    const byCategory = {};
    for (const item of scoredLaws) {
      (byCategory[item.law.category] = byCategory[item.law.category] || []).push(item);
    }

    const blocks = DATA.categories
        .filter((c) => byCategory[c] && byCategory[c].length)
        .map((cat) => {
          const rows = byCategory[cat]
              .map(({ law, snippet }) => {
                const highlightedTitle = q ? highlightMatches(law.title, q) : law.title;
                const highlightedId = q ? highlightMatches(law.id, q) : law.id;
                const highlightedAbbr = law.abbreviation ? (q ? highlightMatches(law.abbreviation, q) : law.abbreviation) : null;

                return `
            <div class="registry-row">
              <span class="reg-id">${highlightedId}</span>
              <span class="reg-title">
                <a href="${lawUrl(law.id)}">${highlightedTitle}</a>
                ${highlightedAbbr ? `<span class="abbr">(${highlightedAbbr})</span>` : ""}
                ${snippet ? `<div class="search-snippet">${snippet}</div>` : ""}
              </span>
              <span class="reg-version">v${law.version || "—"}</span>
              <span class="reg-date">${fmtDate(law.last_amended)}</span>
            </div>`;
              })
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
      <div class="search-bar-container">
        <input class="registry-search" type="search" placeholder="Search laws by title, ID, abbreviation, or body text…" value="${filterText}" />
        ${q ? `<span class="search-count">${scoredLaws.length} result${scoredLaws.length === 1 ? "" : "s"} found</span>` : ""}
      </div>
      ${blocks || `<p class="empty-state">No laws match “${filterText}”.</p>`}
    `;

    const searchInput = app.querySelector(".registry-search");

    // Debounced listener to keep search smooth when checking body text
    let timeout = null;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        renderRegistry(e.target.value);
      }, 150);
    });

    searchInput.focus();
    searchInput.setSelectionRange(filterText.length, filterText.length);
  }

  function renderLaw(id, anchor, versionIndex) {
    const law = findLaw(id);
    if (!law) {
      app.innerHTML = `<p class="empty-state">No law found with identifier “${id}”.</p>`;
      return;
    }

    const idx = versionIndex || 0;
    const selected = versionAt(law, idx);
    const hist = law.history || [];

    const historyItems = hist.length
        ? hist
            .map(
                (h, i) => `
        <li class="history-item ${i === idx ? "active" : ""}" data-idx="${i}" tabindex="0" role="button">
          <div class="h-top">
            <span><span class="history-dot ${i === 0 ? "current" : ""}"></span>${h.date}</span>
            <span class="h-commit">#${h.commit}</span>
          </div>
          <div class="h-msg">${h.message}${h.version ? ` <span class="h-version">v${h.version}</span>` : ""}</div>
        </li>`
            )
            .join("")
        : '<li class="history-item">No recorded history.</li>';

    const supersededBanner =
        law.kind === "archive"
            ? `<div class="superseded-banner">This text has been superseded${law.superseded_by ? ` by <a href="${lawUrl(law.superseded_by)}">${law.superseded_by}</a>` : ""} and is retained for historical reference only.</div>`
            : "";

    const historicalBanner = !selected.isCurrent
        ? `<div class="version-banner">Viewing the version dated ${fmtDate(selected.date)}${selected.commit ? ` (commit #${selected.commit})` : ""} — not the current text.
          <button type="button" class="view-current-btn">View current version</button>
        </div>`
        : "";

    const bodyHtml = renderLawMarkdown(selected.content || "", law.id);
    
    app.innerHTML = `
      <a class="back-link" href="#/">← Back to registry</a>
      <div class="law-layout">
        <aside>
          <div class="sidebar-panel">
            <h3>General information</h3>
            <div style="margin-bottom:12px;">${stamp(selected.status)}</div>
            <dl>
              <div class="info-row"><dt>Abbreviation</dt><dd>${law.abbreviation || "—"}</dd></div>
              <div class="info-row mono"><dt>Enacted</dt><dd>${fmtDate(law.enacted_date)}</dd></div>
              <div class="info-row mono"><dt>Last amended</dt><dd>${fmtDate(law.last_amended)}</dd></div>
              <div class="info-row"><dt>Authority</dt><dd>${law.authority || "—"}</dd></div>
              <div class="info-row mono"><dt>Viewing version</dt><dd>${selected.version || "—"}</dd></div>
              <div class="info-row mono">
                <dt>Current source</dt>
                <dd>
                  <a href="${GITHUB_REPO_URL}/blob/${selected.commit || "main"}/${law.path || `laws/${law.id}.md`}" target="_blank" rel="noopener noreferrer">
                    ${selected.commit ? selected.commit.slice(0, 7) : "View file"} ↗
                  </a>
                </dd>
              </div>
${law.repeals ? `<div class="info-row"><dt>Repeals</dt><dd><a href="${lawUrl(law.repeals)}">${law.repeals}</a></dd></div>` : ""}
              ${law.superseded_by ? `<div class="info-row"><dt>Superseded by</dt><dd><a href="${lawUrl(law.superseded_by)}">${law.superseded_by}</a></dd></div>` : ""}
            </dl>
          </div>
          <div class="sidebar-panel">
            <h3>Version history</h3>
            <ul class="history-list">${historyItems}</ul>
          </div>
        </aside>
        <div class="law-content">
          ${supersededBanner}
          ${historicalBanner}
          <div class="law-header">
            <div class="law-eyebrow">${law.id} · ${law.category || ""}</div>
            <h1 class="law-title">${law.title}</h1>
            <div class="law-linkrow">${stamp(selected.status)}<span class="reg-version">v${selected.version || "—"}</span></div>
          </div>
          <div class="law-body">${bodyHtml}</div>
        </div>
      </div>
    `;
    
    if (anchor) scrollToAnchor(anchor);

    app.querySelectorAll(".history-item[data-idx]").forEach((el) => {
      const go = () => renderLaw(law.id, null, Number(el.dataset.idx));
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });

    const viewCurrentBtn = app.querySelector(".view-current-btn");
    if (viewCurrentBtn) viewCurrentBtn.addEventListener("click", () => renderLaw(law.id, null, 0));
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
    if (!DATA.referendums.length) {
      app.innerHTML = `<h2 class="category-heading">Referendums</h2><hr class="category-rule" /><p class="empty-state">No referendums recorded.</p>`;
      return;
    }
    const cards = DATA.referendums
        .map((r) => {
          const status = referendumStatus(r);
          const summaryHtml = window.marked ? marked.parse(r.content || "") : r.content;
          return `
      <div class="ref-card">
        <div class="ref-card-header">
          <div>
            <div class="ref-eyebrow">${r.id}</div>
            <div class="ref-title">${r.title}</div>
          </div>
          ${stamp(status)}
        </div>
        <div class="ref-meta">
          Initiated by ${r.initiated_by || "—"} · opened ${fmtDateTime(r.created_at)}
          ${r.duration ? ` · ran ${r.duration}` : ""}
          ${r.ended_at ? ` · ${status === "closed" ? "closed" : "closes"} ${fmtDateTime(r.ended_at)}` : ""}
        </div>
        ${referendumChart(r)}
        <div class="ref-summary">${summaryHtml}</div>
      </div>`;
        })
        .join("");
    app.innerHTML = `
      <h2 class="category-heading">Referendums</h2>
      <hr class="category-rule" />
      ${cards}
    `;
  }

  // ---------- router ----------

  function route() {
    const hash = location.hash || "#/";
    const lawMatch = hash.match(/^#\/law\/([^/]+)(?:\/(.+))?$/);

    if (lawMatch) {
      const lawId = decodeURIComponent(lawMatch[1]);
      const anchor = lawMatch[2] ? decodeURIComponent(lawMatch[2]) : null;

      renderLaw(lawId, anchor);

      // Only force scroll to top if we aren't jumping to a specific section anchor
      if (!anchor) {
        window.scrollTo(0, 0);
      }
      return;
    }

    // Scroll to top for all standard views
    window.scrollTo(0, 0);

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
