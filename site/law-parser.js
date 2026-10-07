/*!
 * Grammar:
 *   #  <keyword> <n>: <title>    Any heading whose text starts with one of the
 *                                configured keywords (default: Chapter, Section,
 *                                Art./Article). Add your own (Book, Part, Title,
 *                                Annex...) in the HEADINGS list below, or pass
 *                                them to LawParser.create({ headings: [...] }).
 *   #  <anything else>           Generic in-body sub-heading, NOT the document
 *                                title, unless it's literally the first line.
 *   <sup>N</sup> paragraph text  (numbered paragraph)
 *   a. item text                 (lettered item, "a\." also accepted)
 *     1. sub-item text           (numbered sub-item)
 *   ---                          (thematic break)
 *   [^N]                         (footnote REFERENCE, inline anywhere)
 *   [^N]: some text              (footnote DEFINITION, own line, anywhere)
 *
 * Hierarchy:
 *   The ORDER of the HEADINGS array is the hierarchy (first = outermost).
 *   Rank, outline level and CSS class all come from that order, so there is
 *   no limit at six levels: levels 2-6 render as real <h2>-<h6>, anything
 *   deeper renders as <div role="heading" aria-level="N">, which screen
 *   readers treat identically. Style with `.law-heading-text` or
 *   `[data-level="7"]`, not with bare h2..h6 selectors.
 *
 * Heading type options:
 *   type            unique name; becomes the CSS class `law-<type>`
 *   re              regex; capture 1 = number, capture 2 = title text
 *                   (use kw("book", "bk") to build the usual keyword regex)
 *   label           prefix shown before the number ("Book" -> "Book 3")
 *   bareLabel       label used when there is no number (optional)
 *   idPrefix        anchor id prefix ("book" -> id="book-3")
 *   nestId          true = prefix the id with the parent's id
 *                   (use when numbers restart in each parent, e.g. Sections)
 *   footnoteScope   true = footnotes referenced inside render directly below
 *                   this container instead of at the bottom of the document
 *
 * Indentation and "#" count in the source are decorative; only the keyword
 * decides the rank.
 *
 * Rendering:
 *   - Containers are <details>/<summary> (collapsible), heading element nested
 *     in <summary>, heading text is a real <a href="#id">.
 *   - Items/Numbers render as <dl>/<dt>/<dd>.
 *   - Footnotes: see footnoteScope above. Unreferenced definitions are never
 *     rendered. References outside any footnoteScope container land at the
 *     bottom of the document. Links honour baseUrl for hash-router SPAs.
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.LawParser = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var HR_RE = /^(-{3,}|_{3,}|\*{3,})$/;
    var HEADING_RE = /^#{1,6}\s+(.*)$/;
    var FOOTNOTE_DEF_RE = /^\[\^([\w-]+)\]:\s+(.*)$/;
    var FOOTNOTE_REF_RE = /\[\^([\w-]+)\]/g;
    var TABLE_ROW_RE = /^\|(.+)\|$/;

    // Builds "^(?:alt1|alt2)\b\.?\s*(number)\s*[:.]?\s*(title)$".
    // \b stops "Artistic" from being read as "Art" + number "istic".
    function kw() {
        var words = Array.prototype.slice.call(arguments).join("|");
        return new RegExp("^(?:" + words + ")\\b\\.?\\s*([\\w.]+)\\s*[:.]?\\s*(.*)$", "i");
    }

    var DEFAULT_HEADINGS = [
        { type: "book", label: "Book", idPrefix: "book", re: kw("book") },
        { type: "part", label: "Part", idPrefix: "part", re: kw("part") },
        { type: "tit",   label: "Title", idPrefix: "title", re: kw("title") },
        { type: "chapter", label: "Chapter", idPrefix: "chap", re: kw("chapter") },
        { type: "section", label: "Section", idPrefix: "sec", nestId: true, re: kw("section") },
        { type: "article", label: "Art.", bareLabel: "Article", idPrefix: "art",
            footnoteScope: true, re: kw("art", "article") }
    ];

    function assign(target) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i] || {};
            for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
        }
        return target;
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function slug(s) {
        return String(s || "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40) || "x";
    }

    function headingTags(level) {
        var attrs = ' class="law-heading-text" data-level="' + level + '"';
        if (level <= 6) return { open: "<h" + level + attrs + ">", close: "</h" + level + ">" };
        return { open: '<div' + attrs + ' role="heading" aria-level="' + level + '">', close: "</div>" };
    }

    // Child render context: same shared state, new prefix (and optionally a new footnote scope).
    function childCtx(ctx, prefix, footnoteCollector) {
        return {
            prefix: prefix,
            baseUrl: ctx.baseUrl,
            footnoteDefs: ctx.footnoteDefs,
            rootFootnotes: ctx.rootFootnotes,
            seenRefIds: ctx.seenRefIds,
            footnoteCollector: footnoteCollector || ctx.footnoteCollector
        };
    }

    // Footnotes and inlines

    function registerFootnoteUse(id, ctx) {
        if (!ctx) return;
        var collector = ctx.footnoteCollector || ctx.rootFootnotes;
        if (collector && collector.indexOf(id) === -1) collector.push(id);
    }

    function footnoteRefHtml(id, ctx) {
        ctx = ctx || {};
        var fnId = "fn-" + id;
        var href = ctx.baseUrl ? ctx.baseUrl + fnId : "#" + fnId;
        var idAttr = "";
        var seen = ctx.seenRefIds;
        if (!seen || !seen[id]) {
            idAttr = ' id="fnref-' + escapeHtml(id) + '"';
            if (seen) seen[id] = true;
        }
        return '<a class="law-anchor law-footnote-ref" href="' + href + '"' + idAttr +
            ' onclick="event.stopPropagation()">' + escapeHtml(id) + '</a>';
    }

    function renderFootnotes(ids, ctx) {
        if (!ids || !ids.length) return "";
        var defs = (ctx && ctx.footnoteDefs) || {};
        var baseUrl = (ctx && ctx.baseUrl) || "";
        var items = ids.map(function (id) {
            var text = Object.prototype.hasOwnProperty.call(defs, id) ? defs[id] : "";
            var backHref = baseUrl ? baseUrl + "fnref-" + id : "#fnref-" + id;
            return '<div class="law-footnote-item" id="fn-' + escapeHtml(id) + '">' +
                '<sup class="law-footnote-marker">' + escapeHtml(id) + '</sup> ' +
                '<span class="law-footnote-text">' + inline(text, ctx) + '</span>' +
                ' <a class="law-footnote-backref" href="' + backHref +
                '" onclick="event.stopPropagation()" title="Back to reference">\u21A9</a></div>';
        }).join("");
        return '<div class="law-footnotes"><hr class="law-footnote-rule">' + items + '<hr class="law-footnote-rule"></div>';
    }

    function inline(text, ctx) {
        if (!text) return "";
        var refs = [];
        var withPlaceholders = String(text).replace(FOOTNOTE_REF_RE, function (m, id) {
            var token = "\u0000FN" + refs.length + "\u0000";
            refs.push(id);
            return token;
        });

        var html;
        if (typeof marked !== "undefined" && marked.parseInline) {
            try { html = marked.parseInline(withPlaceholders); } catch (e) { html = miniInline(withPlaceholders); }
        } else {
            html = miniInline(withPlaceholders);
        }

        if (refs.length) {
            html = html.replace(/\u0000FN(\d+)\u0000/g, function (m, idx) {
                var id = refs[Number(idx)];
                registerFootnoteUse(id, ctx);
                return footnoteRefHtml(id, ctx);
            });
        }
        return html;
    }

    function miniInline(text) {
        var s = escapeHtml(text);
        s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        return s;
    }

    function renderTable(tableText, ctx) {
        var lines = tableText.split("\n");
        if (lines.length < 2) return "";
        var parseRow = function (row) {
            return row.replace(/^\||\|$/g, "").split("|").map(function (c) { return inline(c.trim(), ctx); });
        };
        var headers = parseRow(lines[0]);
        var startIdx = 1;
        if (lines[1] && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(lines[1])) startIdx = 2;

        var html = '<div class="law-table-wrap"><table class="law-table"><thead><tr>';
        headers.forEach(function (h) { html += "<th>" + h + "</th>"; });
        html += "</tr></thead><tbody>";
        for (var i = startIdx; i < lines.length; i++) {
            html += "<tr>";
            parseRow(lines[i]).forEach(function (c) { html += "<td>" + c + "</td>"; });
            html += "</tr>";
        }
        return html + "</tbody></table></div>";
    }

    // Parsing

    function create(userConfig) {
        var headings = ((userConfig && userConfig.headings) || DEFAULT_HEADINGS).map(function (h, i) {
            return assign({ nestId: false, footnoteScope: false }, h, {
                rank: i + 1,      // outline depth, derived from position
                level: i + 2      // h2, h3, ... (h1 is the document title)
            });
        });
        var H = headings.length;

        // Derived ranks: nothing below is a magic number any more.
        var GENERIC_RANK = H + 0.5;   // in-body "# whatever" sub-heading
        var HR_RANK = H + 0.9;
        var PARA_RANK = H + 1;
        var ITEM_RANK = H + 2;
        var NUMBER_RANK = H + 3;

        var GENERIC = {
            type: "heading", rank: GENERIC_RANK, level: H + 2,
            label: null, idPrefix: "h", nestId: true, footnoteScope: false
        };

        var containers = {};
        headings.forEach(function (h) { containers[h.type] = h; });
        containers.heading = GENERIC;

        var FLOW_LEVELS = [
            { type: "paragraph", rank: PARA_RANK, re: /^<sup>\s*(\d+[a-z]*)\s*<\/sup>\s*(.*)$/i },
            { type: "item",      rank: ITEM_RANK, re: /^([a-zA-Z]{1,6})\\?\.\s+(.*)$/ },
            { type: "number",    rank: NUMBER_RANK, re: /^(\d+)\\?\.\s+(.*)$/ }
        ];

        function popToContainer(stack) {
            while (stack.length > 1 && stack[stack.length - 1].rank > GENERIC_RANK) stack.pop();
        }

        function classifyHeading(content, isFirstEver) {
            for (var i = 0; i < headings.length; i++) {
                var m = content.match(headings[i].re);
                if (m) {
                    return {
                        type: headings[i].type, rank: headings[i].rank,
                        number: (m[1] || "").replace(/\.$/, "") || null,
                        text: (m[2] || "").trim()
                    };
                }
            }
            if (isFirstEver) return { type: "doctitle", rank: 0, number: null, text: content.trim() };
            return { type: "heading", rank: GENERIC_RANK, number: null, text: content.trim() };
        }

        function matchLevel(line, isFirstEver) {
            var h = line.match(HEADING_RE);
            if (h) {
                var d = classifyHeading(h[1].trim(), isFirstEver);
                return { type: d.type, rank: d.rank, number: d.number, text: d.text, isHeading: true };
            }
            for (var i = 0; i < FLOW_LEVELS.length; i++) {
                var m = line.match(FLOW_LEVELS[i].re);
                if (m) {
                    return { type: FLOW_LEVELS[i].type, rank: FLOW_LEVELS[i].rank,
                        number: m[1], text: m[2].trim(), isHeading: false };
                }
            }
            return null;
        }

        function parse(source) {
            var lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
            var rootNode = { type: "document", rank: -1, number: null, title: null, text: null, children: [], footnotes: {} };
            var stack = [rootNode];
            var sawAnyNode = false;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();

                if (!line) { popToContainer(stack); continue; }

                if (HR_RE.test(line)) {
                    popToContainer(stack);
                    stack[stack.length - 1].children.push({ type: "hr", rank: HR_RANK, number: null, title: null, text: null, children: [] });
                    continue;
                }

                var fnDef = line.match(FOOTNOTE_DEF_RE);
                if (fnDef) { rootNode.footnotes[fnDef[1]] = fnDef[2].trim(); continue; }

                if (TABLE_ROW_RE.test(line)) {
                    var tableLines = [];
                    while (i < lines.length && TABLE_ROW_RE.test(lines[i].trim())) {
                        tableLines.push(lines[i].trim());
                        i++;
                    }
                    i--;
                    popToContainer(stack);
                    stack[stack.length - 1].children.push(
                        { type: "table", rank: PARA_RANK, number: null, title: null, text: tableLines.join("\n"), children: [] });
                    sawAnyNode = true;
                    continue;
                }

                var hit = matchLevel(line, !sawAnyNode);
                if (hit) {
                    sawAnyNode = true;
                    var node = {
                        type: hit.type, rank: hit.rank, number: hit.number,
                        title: hit.isHeading ? hit.text : null,
                        text: hit.isHeading ? null : hit.text,
                        children: []
                    };
                    while (stack.length > 1 && stack[stack.length - 1].rank >= node.rank) stack.pop();
                    stack[stack.length - 1].children.push(node);
                    stack.push(node);
                } else {
                    sawAnyNode = true;
                    var top = stack[stack.length - 1];
                    if (top.type === "paragraph") {
                        top.text = top.text ? top.text + " " + line : line;
                    } else {
                        var para = { type: "paragraph", rank: PARA_RANK, number: null, title: null, text: line, children: [] };
                        top.children.push(para);
                        stack.push(para);
                    }
                }
            }
            return rootNode;
        }

        // Rendering

        function renderChildren(nodes, ctx) {
            var out = "";
            var i = 0;
            while (i < nodes.length) {
                var node = nodes[i];
                if (node.type === "item" || node.type === "number") {
                    var groupType = node.type, group = [];
                    while (i < nodes.length && nodes[i].type === groupType) { group.push(nodes[i]); i++; }
                    out += renderList(group, ctx);
                } else {
                    out += renderNode(node, ctx);
                    i++;
                }
            }
            return out;
        }

        function containerId(node, cfg, ctx) {
            var base = cfg.nestId && ctx.prefix ? ctx.prefix + "-" : "";
            return base + cfg.idPrefix + "-" + (node.number || slug(node.title));
        }

        function renderContainer(node, ctx) {
            var cfg = containers[node.type];
            var id = containerId(node, cfg, ctx);
            var collector = cfg.footnoteScope ? [] : ctx.footnoteCollector;
            var cctx = childCtx(ctx, id, collector);
            var href = ctx.baseUrl ? ctx.baseUrl + id : "#" + id;

            var label = "";
            if (cfg.label && node.number) label = cfg.label + " " + node.number;
            else if (cfg.bareLabel) label = cfg.bareLabel;

            // Render the title first so a [^N] in it counts toward this scope.
            var titleHtml = inline(node.title, cctx);
            var bodyHtml = renderChildren(node.children, cctx);
            var footnotesHtml = cfg.footnoteScope ? renderFootnotes(collector, cctx) : "";
            var tag = headingTags(cfg.level);

            return '<details class="law-node law-' + node.type + '" id="' + id + '" open>' +
                '<summary class="law-heading">' +
                tag.open +
                '<a class="law-anchor" href="' + href + '" onclick="event.stopPropagation()">' +
                (label ? '<span class="law-label">' + escapeHtml(label) + "</span> " : "") +
                titleHtml + "</a>" + tag.close +
                "</summary>" +
                '<div class="law-body">' + bodyHtml + "</div>" +
                footnotesHtml + "</details>";
        }

        function renderList(nodes, ctx) {
            var listType = nodes[0].type === "item" ? "a" : "1";
            var rows = nodes.map(function (n) {
                var id = (ctx.prefix ? ctx.prefix + "-" : "") + String(n.number).toLowerCase();
                var cctx = childCtx(ctx, id);
                return '<div class="law-list-row" role="listitem">' +
                    '<dt class="law-marker" id="' + id + '">' + escapeHtml(n.number) + ".</dt>" +
                    '<dd class="law-node law-' + n.type + '">' +
                    '<span class="law-text">' + inline(n.text, ctx) + "</span>" +
                    renderChildren(n.children, cctx) + "</dd></div>";
            }).join("");
            return '<dl class="law-list law-list-' + listType + '" role="list">' + rows + "</dl>";
        }

        function renderNode(node, ctx) {
            ctx = ctx || {};
            if (containers[node.type]) return renderContainer(node, ctx);

            switch (node.type) {
                case "doctitle": {
                    var href = ctx.baseUrl ? ctx.baseUrl + "title" : "#title";
                    return '<h1 class="law-node law-title" id="title">' +
                        '<a class="law-anchor" href="' + href + '" onclick="event.stopPropagation()">' +
                        inline(node.title, ctx) + "</a></h1>";
                }
                case "hr":
                    return '<hr class="law-rule">';
                case "table":
                    return renderTable(node.text, ctx);
                case "paragraph": {
                    var pbase = ctx.prefix || "p";
                    var pid = node.number ? pbase + "-" + node.number : pbase + "-p" + Math.random().toString(36).slice(2, 6);
                    var marker = node.number ? '<sup class="law-marknum">' + escapeHtml(node.number) + "</sup> " : "";
                    return '<div class="law-node law-paragraph" id="' + pid + '">' +
                        '<p class="law-ptext">' + marker + inline(node.text, ctx) + "</p>" +
                        renderChildren(node.children, childCtx(ctx, pid)) + "</div>";
                }
                default:
                    return "";
            }
        }

        function render(tree, baseUrl) {
            var rootFootnotes = [];
            var ctx = {
                baseUrl: baseUrl || "",
                footnoteDefs: tree.footnotes || {},
                rootFootnotes: rootFootnotes,
                footnoteCollector: rootFootnotes,
                seenRefIds: {}
            };
            var body = renderChildren(tree.children, ctx);
            return body + renderFootnotes(rootFootnotes, ctx);
        }

        return {
            parse: parse,
            render: render,
            toHTML: function (source, baseUrl) { return render(parse(source), baseUrl); },
            headings: headings,
            FLOW_LEVELS: FLOW_LEVELS
        };
    }

    // Default instance keeps the old API working: LawParser.toHTML(src, baseUrl)
    var def = create();
    return assign({}, def, {
        create: create,
        kw: kw,
        DEFAULT_HEADINGS: DEFAULT_HEADINGS,
        FOOTNOTE_DEF_RE: FOOTNOTE_DEF_RE,
        FOOTNOTE_REF_RE: FOOTNOTE_REF_RE
    });
});
