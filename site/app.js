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

  function lawUrl(id) {
    return `#/law/${encodeURIComponent(id)}`;
  }

  function findLaw(id) {
    return DATA.laws.find((l) => l.id === id);
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

  function renderLaw(id) {
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

    const bodyHtml = window.marked ? marked.parse(law.content || "") : `<pre>${law.content}</pre>`;

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
    const lawMatch = hash.match(/^#\/law\/(.+)$/);
    if (lawMatch) return renderLaw(decodeURIComponent(lawMatch[1]));
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
