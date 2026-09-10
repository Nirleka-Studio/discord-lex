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
 *   [^N]                          (footnote REFERENCE - inline, anywhere in
 *                                  any title/paragraph/item/number text)
 *   [^N] some text                (footnote DEFINITION - a line of its own,
 *                                  anywhere in the source; position in the
 *                                  source file doesn't matter)
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
 *   - Footnotes: a reference "[^N]" anywhere in a title/paragraph/item/
 *     number becomes a clickable superscript link. The matching definition
 *     "[^N] text" (found anywhere in the source, regardless of where it
 *     physically sits) is rendered once, sandwiched between two <hr>s,
 *     directly below the Article that contains the reference - even if
 *     that reference was in the Article's own title. A reference that
 *     isn't inside any Article (e.g. sitting in a bare Chapter/Section
 *     heading, or in the document title) gets its definition appended at
 *     the very bottom of the whole document instead. Definitions that are
 *     never referenced are simply never rendered. Footnote links reuse the
 *     same baseUrl scheme as every other anchor in this file so they route
 *     correctly through a hash-based SPA router instead of navigating with
 *     a bare "#fn-N" fragment.
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

    // Footnote definition: a whole line, e.g. `[^11] Amended by Annex No...`
    // Can appear anywhere in the source - its position doesn't matter, only
    // where the matching [^11] *reference* is used determines where it renders.
    var FOOTNOTE_DEF_RE = /^\[\^([\w-]+)\]:\s+(.*)$/;
    // Footnote reference: inline, can appear inside any title/paragraph/
    // item/number text, e.g. `Art. 24 Federal jurisdiction[^11]`.
    var FOOTNOTE_REF_RE = /\[\^([\w-]+)\]/g;

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
        var root = { type: "document", rank: -1, number: null, title: null, text: null, children: [], footnotes: {} };
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

            // Footnote definitions are collected globally and never become
            // visible nodes in the tree - they're re-attached at render time
            // based on where the matching [^N] reference was actually used.
            var fnDef = line.match(FOOTNOTE_DEF_RE);
            if (fnDef) {
                root.footnotes[fnDef[1]] = fnDef[2].trim();
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

    function toHTML(source, baseUrl) {
        return render(parse(source), baseUrl);
    }

    function render(tree, baseUrl) {
        var rootFootnotes = [];
        var ctx = {
            baseUrl: baseUrl || "",
            footnoteDefs: tree.footnotes || {},
            rootFootnotes: rootFootnotes,
            footnoteCollector: rootFootnotes, // default scope: "not inside any article"
            seenRefIds: {}
        };
        var body = renderChildren(tree.children, ctx);
        // Anything referenced outside of an Article (bare chapter/section
        // heading text, or the document title) lands at the very bottom.
        var trailing = renderFootnotes(rootFootnotes, ctx);
        return body + trailing;
    }

    function renderList(nodes, ctx) {
        var isItem = nodes[0].type === "item";
        var listType = isItem ? "a" : "1";
        var rows = nodes.map(function (n) {
            var id = (ctx.prefix ? ctx.prefix + "-" : "") + String(n.number).toLowerCase();
            var childCtx = {
                prefix: id,
                baseUrl: ctx.baseUrl,
                footnoteDefs: ctx.footnoteDefs,
                rootFootnotes: ctx.rootFootnotes,
                seenRefIds: ctx.seenRefIds,
                footnoteCollector: ctx.footnoteCollector
            };
            return (
                '<div class="law-list-row" role="listitem">' +
                '<dt class="law-marker" id="' + id + '">' + escapeHtml(n.number) + '.</dt>' +
                '<dd class="law-node law-' + n.type + '">' +
                '<span class="law-text">' + inline(n.text, ctx) + '</span>' +
                renderChildren(n.children, childCtx) +
                '</dd>' +
                '</div>'
            );
        }).join("");
        return '<dl class="law-list law-list-' + listType + '" role="list">' + rows + '</dl>';
    }

    function renderContainer(node, ctx) {
        var cfg = CONTAINER_CONFIG[node.type];
        var id = containerId(node, ctx);
        // Only an Article opens a fresh footnote scope. Chapter/Section/
        // generic-heading containers just pass their parent's scope through,
        // so a reference sitting in a Section heading (with no enclosing
        // Article) still bubbles up to the document-level list at the bottom.
        var isArticle = node.type === "article";
        var footnoteCollector = isArticle ? [] : ctx.footnoteCollector;
        var childCtx = {
            prefix: id,
            baseUrl: ctx.baseUrl,
            footnoteDefs: ctx.footnoteDefs,
            rootFootnotes: ctx.rootFootnotes,
            seenRefIds: ctx.seenRefIds,
            footnoteCollector: footnoteCollector
        };
        var label = cfg.label && node.number ? cfg.label + " " + node.number : (node.type === "article" ? "Article" : "");
        var href = ctx.baseUrl ? ctx.baseUrl + id : '#' + id;

        // A [^N] sitting in the Article's own title counts as "used in this
        // article" too, so render the title before locking in the footnote list.
        var titleHtml = inline(node.title, childCtx);
        var bodyHtml = renderChildren(node.children, childCtx);
        var footnotesHtml = isArticle ? renderFootnotes(footnoteCollector, childCtx) : "";

        return (
            '<details class="law-node law-' + node.type + '" id="' + id + '" open>' +
            '<summary class="law-heading">' +
            '<' + cfg.tag + ' class="law-heading-text">' +
            '<a class="law-anchor" href="' + href + '" onclick="event.stopPropagation()">' +
            (label ? '<span class="law-label">' + escapeHtml(label) + '</span> ' : '') +
            titleHtml +
            '</a>' +
            '</' + cfg.tag + '>' +
            '</summary>' +
            '<div class="law-body">' + bodyHtml + '</div>' +
            footnotesHtml +
            '</details>'
        );
    }

    function renderNode(node, ctx) {
        ctx = ctx || {};
        switch (node.type) {
            case "title": {
                var href = ctx.baseUrl ? ctx.baseUrl + "title" : "#title";
                return (
                    '<h1 class="law-node law-title" id="title">' +
                    '<a class="law-anchor" href="' + href + '" onclick="event.stopPropagation()">' + inline(node.title, ctx) + '</a>' +
                    '</h1>'
                );
            }

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
                var childCtx = {
                    prefix: pid,
                    baseUrl: ctx.baseUrl,
                    footnoteDefs: ctx.footnoteDefs,
                    rootFootnotes: ctx.rootFootnotes,
                    seenRefIds: ctx.seenRefIds,
                    footnoteCollector: ctx.footnoteCollector
                };
                return (
                    '<div class="law-node law-paragraph" id="' + pid + '">' +
                    '<p class="law-ptext">' + marker + inline(node.text, ctx) + '</p>' +
                    renderChildren(node.children, childCtx) +
                    '</div>'
                );
            }

            default:
                return "";
        }
    }

    // ---------------------------------------------------------------------
    // Footnotes
    // ---------------------------------------------------------------------

    // Marks id as used in whichever scope is currently open (an Article's
    // own local list, or the document-level rootFootnotes list).
    function registerFootnoteUse(id, ctx) {
        if (!ctx) return;
        var collector = ctx.footnoteCollector || ctx.rootFootnotes;
        if (collector && collector.indexOf(id) === -1) collector.push(id);
    }

    function footnoteRefHtml(id, ctx) {
        ctx = ctx || {};
        var fnId = "fn-" + id;
        var href = ctx.baseUrl ? ctx.baseUrl + fnId : "#" + fnId;
        // Only the first occurrence of a given footnote number gets the
        // fnref-N id (ids must be unique), so the definition's "back to
        // reference" arrow has exactly one place to land.
        var idAttr = "";
        var seen = ctx.seenRefIds;
        if (!seen || !seen[id]) {
            idAttr = ' id="fnref-' + escapeHtml(id) + '"';
            if (seen) seen[id] = true;
        }
        return (
            '<a class="law-anchor law-footnote-ref" href="' + href + '"' + idAttr + ' onclick="event.stopPropagation()">' +
            escapeHtml(id) +
            '</a>'
        );
    }

    // Renders the definitions for `ids` (in first-seen order), sandwiched
    // between two rules, with a back-link from each definition to its
    // first in-text reference. Plain stacked blocks (not a bulleted list),
    // each starting with a superscript number - matches Fedlex-style notes.
    function renderFootnotes(ids, ctx) {
        if (!ids || !ids.length) return "";
        var defs = (ctx && ctx.footnoteDefs) || {};
        var baseUrl = (ctx && ctx.baseUrl) || "";
        var items = ids.map(function (id) {
            var text = Object.prototype.hasOwnProperty.call(defs, id) ? defs[id] : "";
            var backHref = baseUrl ? baseUrl + "fnref-" + id : "#fnref-" + id;
            return (
                '<div class="law-footnote-item" id="fn-' + escapeHtml(id) + '">' +
                '<sup class="law-footnote-marker">' + escapeHtml(id) + '</sup> ' +
                '<span class="law-footnote-text">' + inline(text, ctx) + '</span>' +
                ' <a class="law-footnote-backref" href="' + backHref + '" onclick="event.stopPropagation()" title="Back to reference">\u21A9</a>' +
                '</div>'
            );
        }).join("");
        return (
            '<div class="law-footnotes">' +
            '<hr class="law-footnote-rule">' +
            items +
            '<hr class="law-footnote-rule">' +
            '</div>'
        );
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

    // Renders inline markdown-ish text. Footnote refs ([^N]) are pulled out
    // into placeholder tokens first so neither escapeHtml nor `marked` can
    // mangle them, then swapped back in as real links afterwards - which is
    // also the point where usage gets registered against the current ctx scope.
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

    return {
        parse: parse,
        render: render,
        toHTML: toHTML,
        HEADING_KEYWORDS: HEADING_KEYWORDS,
        FLOW_LEVELS: FLOW_LEVELS,
        FOOTNOTE_DEF_RE: FOOTNOTE_DEF_RE,
        FOOTNOTE_REF_RE: FOOTNOTE_REF_RE
    };
});