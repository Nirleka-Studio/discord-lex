/*!
 * Grammar:
 *   #  Chapter <n>: <title>      (any number of leading "#" - depth is
 *   #  Section <n>: <title>       purely decorative; only the keyword decides
 *   #  Art. <n> <title>           the rank. A heading with no recognised
 *   #  <anything else>            keyword is a generic in-body sub-heading,
 *                                 NOT the document title, unless it's
 *                                 literally the very first line of the file.)
 *   <sup>N</sup> paragraph text   (numbered paragraph)
 *   a. item text                  (lettered item, "a\." also accepted)
 *     1. sub-item text            (numbered sub-item)
 *   ---                           (horizontal rule / thematic break)
 *
 * Indentation in the source is decorative everywhere - nesting comes purely
 * from marker type (keyword / <sup> / letters / digits), never from
 * whitespace or "#" count.
 *
 * Rendering:
 *   - Chapter / Section / Article / generic Heading are rendered as native
 *     <details>/<summary> so they're collapsible out of the box, with the
 *     document-outline heading tag (h2-h5) nested inside <summary> so
 *     screen-reader "jump by heading" navigation still works.
 *   - The whole heading text is a real <a href="#id">, not a separate "#"
 *     prefix glyph, so clicking/right-clicking anywhere on the heading
 *     navigates or lets you copy the link. It stops click propagation so
 *     clicking the link text doesn't ALSO collapse the section; clicking
 *     anywhere else on the summary row (e.g. the native disclosure
 *     triangle) still toggles collapse as normal.
 *   - Items/Numbers render as <dl>/<dt>/<dd> (matches how Fedlex marks up
 *     lettered/numbered provisions) so markers are literal text (handles
 *     "5bis", "44a", skipped letters, etc.) and spacing is a plain CSS grid,
 *     not fought over with ::marker.
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

    // ---------------------------------------------------------------------
    // 1. Grammar
    // ---------------------------------------------------------------------
    var HEADING_RE = /^#{1,6}\s+(.*)$/;
    var HR_RE = /^(-{3,}|_{3,}|\*{3,})$/;

    var HEADING_KEYWORDS = [
        { type: "chapter", rank: 1, re: /^chapter\s+([\w.]+)\s*[:.]?\s*(.*)$/i },
        { type: "section", rank: 2, re: /^section\s+([\w.]+)\s*[:.]?\s*(.*)$/i },
        { type: "article", rank: 3, re: /^art(?:icle)?\.?\s*([\w.]+)\.?\s*(.*)$/i }
    ];

    var FLOW_LEVELS = [
        {
            type: "paragraph", rank: 4,
            re: /^<sup>\s*(\d+[a-z]*)\s*<\/sup>\s*(.*)$/i,
            parse: function (m) { return { number: m[1], text: m[2].trim() }; }
        },
        {
            type: "item", rank: 5,
            re: /^([a-zA-Z]{1,6})\\?\.\s+(.*)$/,
            parse: function (m) { return { number: m[1], text: m[2].trim() }; }
        },
        {
            type: "number", rank: 6,
            re: /^(\d+)\\?\.\s+(.*)$/,
            parse: function (m) { return { number: m[1], text: m[2].trim() }; }
        }
    ];

    // Classify heading text by keyword. `isFirstEver` is only true for the
    // very first node the whole document produces - that's the only case
    // where an un-keyworded heading means "this is the document Title"
    // rather than "this is just a subheading sitting wherever we are".
    function classifyHeading(content, isFirstEver) {
        for (var i = 0; i < HEADING_KEYWORDS.length; i++) {
            var kw = HEADING_KEYWORDS[i];
            var m = content.match(kw.re);
            if (m) return { type: kw.type, rank: kw.rank, number: m[1] || null, text: m[2].trim() };
        }
        if (isFirstEver) {
            return { type: "title", rank: 0, number: null, text: content.trim() };
        }
        // Generic in-body heading: ranks between Article (3) and Paragraph (4)
        // so it always nests inside whatever Chapter/Section/Article is
        // currently open, and closes any currently-open Paragraph/Item/Number
        // first, WITHOUT ever popping past the enclosing Article. This is the
        // fix for plain "# Note" / "## Example" style subheadings blowing away
        // the surrounding structure.
        return { type: "heading", rank: 3.5, number: null, text: content.trim() };
    }

    function matchLevel(line, isFirstEver) {
        var h = line.match(HEADING_RE);
        if (h) {
            var data = classifyHeading(h[1].trim(), isFirstEver);
            return { type: data.type, rank: data.rank, number: data.number, text: data.text, isHeading: true };
        }
        for (var i = 0; i < FLOW_LEVELS.length; i++) {
            var m = line.match(FLOW_LEVELS[i].re);
            if (m) {
                var parsed = FLOW_LEVELS[i].parse(m);
                return { type: FLOW_LEVELS[i].type, rank: FLOW_LEVELS[i].rank, number: parsed.number, text: parsed.text, isHeading: false };
            }
        }
        return null;
    }
    
    function parse(source) {
        var lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
        var root = { type: "document", rank: -1, number: null, title: null, text: null, children: [] };
        var stack = [root];
        var sawAnyNode = false;

        lines.forEach(function (raw) {
            var line = raw.trim();

            if (!line) {
                while (stack.length > 1 && stack[stack.length - 1].rank > 3.5) stack.pop();
                return;
            }

            if (HR_RE.test(line)) {
                while (stack.length > 1 && stack[stack.length - 1].rank > 3.5) stack.pop();
                stack[stack.length - 1].children.push({ type: "hr", rank: 3.9, number: null, title: null, text: null, children: [] });
                return;
            }

            var hit = matchLevel(line, !sawAnyNode);
            if (hit) {
                sawAnyNode = true;
                var node = {
                    type: hit.type,
                    rank: hit.rank,
                    number: hit.number,
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
                if (top.rank >= 4) {
                    top.text = top.text ? top.text + " " + line : line;
                } else {
                    var para = { type: "paragraph", rank: 4, number: null, title: null, text: line, children: [] };
                    top.children.push(para);
                    stack.push(para);
                }
            }
        });

        return root;
    }

    function render(tree) {
        return renderChildren(tree.children, {});
    }

    function renderChildren(nodes, ctx) {
        var out = "";
        var i = 0;
        while (i < nodes.length) {
            var node = nodes[i];
            if (node.type === "item" || node.type === "number") {
                var groupType = node.type;
                var group = [];
                while (i < nodes.length && nodes[i].type === groupType) {
                    group.push(nodes[i]);
                    i++;
                }
                out += renderList(group, ctx);
            } else {
                out += renderNode(node, ctx);
                i++;
            }
        }
        return out;
    }

    function renderList(nodes, ctx) {
        var isItem = nodes[0].type === "item";
        var listType = isItem ? "a" : "1";
        var rows = nodes.map(function (n) {
            var id = (ctx.prefix ? ctx.prefix + "-" : "") + String(n.number).toLowerCase();
            var childCtx = { prefix: id };
            return (
                '<div class="law-list-row" role="listitem">' +
                '<dt class="law-marker" id="' + id + '">' + escapeHtml(n.number) + '.</dt>' +
                '<dd class="law-node law-' + n.type + '">' +
                '<span class="law-text">' + inline(n.text) + '</span>' +
                renderChildren(n.children, childCtx) +
                '</dd>' +
                '</div>'
            );
        }).join("");
        return '<dl class="law-list law-list-' + listType + '" role="list">' + rows + '</dl>';
    }
    
    var CONTAINER_CONFIG = {
        chapter: { tag: "h2", label: "Chapter" },
        section: { tag: "h3", label: "Section" },
        article: { tag: "h4", label: "Art." },
        heading: { tag: "h5", label: null }
    };

    function containerId(node, ctx) {
        var base = ctx.prefix ? ctx.prefix + "-" : "";
        switch (node.type) {
            case "chapter": return "chap-" + (node.number || slug(node.title));
            case "section": return base + "sec-" + (node.number || slug(node.title));
            case "article": return "art-" + (node.number || slug(node.title));
            case "heading": return base + "h-" + slug(node.title);
            default: return base + slug(node.title);
        }
    }

    function renderContainer(node, ctx) {
        var cfg = CONTAINER_CONFIG[node.type];
        var id = containerId(node, ctx);
        var childCtx = { prefix: id };
        var label = cfg.label && node.number ? cfg.label + " " + node.number : (node.type === "article" ? "Article" : "");
        return (
            '<details class="law-node law-' + node.type + '" id="' + id + '" open>' +
            '<summary class="law-heading">' +
            '<' + cfg.tag + ' class="law-heading-text">' +
            // Whole heading (label + title) is ONE link - click anywhere on
            // it to jump (smooth-scrolls if the CSS sets
            // `scroll-behavior: smooth`), right-click to copy the URL, no
            // separate "#" glyph. stopPropagation keeps that click from
            // ALSO toggling the <details> collapse - clicking elsewhere on
            // the row (e.g. the native disclosure triangle) still does that.
            '<a class="law-anchor" href="#' + id + '" onclick="event.stopPropagation()">' +
            (label ? '<span class="law-label">' + escapeHtml(label) + '</span> ' : '') +
            inline(node.title) +
            '</a>' +
            '</' + cfg.tag + '>' +
            '</summary>' +
            '<div class="law-body">' + renderChildren(node.children, childCtx) + '</div>' +
            '</details>'
        );
    }

    function renderNode(node, ctx) {
        ctx = ctx || {};
        switch (node.type) {
            case "title":
                return (
                    '<h1 class="law-node law-title" id="title">' +
                    '<a class="law-anchor" href="#title" onclick="event.stopPropagation()">' + inline(node.title) + '</a>' +
                    '</h1>'
                );

            case "chapter":
            case "section":
            case "article":
            case "heading":
                return renderContainer(node, ctx);

            case "hr":
                return '<hr class="law-rule">';

            case "paragraph": {
                var pbase = ctx.prefix || "p";
                var pid = node.number ? pbase + "-" + node.number : pbase + "-p" + Math.random().toString(36).slice(2, 6);
                var marker = node.number ? '<sup class="law-marknum">' + escapeHtml(node.number) + '</sup> ' : "";
                return (
                    '<div class="law-node law-paragraph" id="' + pid + '">' +
                    '<p class="law-ptext">' + marker + inline(node.text) + '</p>' +
                    renderChildren(node.children, { prefix: pid }) +
                    '</div>'
                );
            }

            default:
                return "";
        }
    }

    function toHTML(source) {
        return render(parse(source));
    }

    function escapeHtml(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function slug(s) {
        return (
            String(s || "")
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 40) || "x"
        );
    }

    function inline(text) {
        if (!text) return "";
        if (typeof marked !== "undefined" && marked.parseInline) {
            try { return marked.parseInline(text); } catch (e) { /* fall through */ }
        }
        return miniInline(text);
    }

    function miniInline(text) {
        var s = escapeHtml(text);
        s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
        s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        return s;
    }

    return {
        parse: parse,
        render: render,
        toHTML: toHTML,
        HEADING_KEYWORDS: HEADING_KEYWORDS,
        FLOW_LEVELS: FLOW_LEVELS
    };
});