#!/usr/bin/env python3
"""
format_law.py - renumber a Markdown statute (the law text only, never the YAML).

What it does
  1. Skips the YAML frontmatter (--- ... ---) untouched.
  2. Renumbers articles sequentially across the whole document, whatever
     heading level they use. Placeholders ("Art. XX", "Art. XX-XX") get real
     numbers. Footnote markers like "Art. 5[^10]" are kept.
  3. Renumbers Part / Title / Chapter / Section headings by rank. A heading
     restarts the counters of every lower rank (Part > Title > Chapter >
     Section). Heading level (#) is never read or changed. Typos such as
     "Tile" are corrected to "Title".
  4. Renumbers paragraph markers (<sup>1</sup>) at the start of a line,
     restarting at each article.
  5. Rewrites in-text cross references ("Article 28", "Arts. 28 and 39") to
     the new numbers. Ambiguous or unknown references (e.g. a duplicated old
     number) are left alone and reported. References followed by "of <other
     document>" (e.g. "Article 32 of the Server Charter") are never touched.

Usage
  python format_law.py draft.md              # print result to stdout
  python format_law.py draft.md -i           # rewrite the file in place
  python format_law.py draft.md -o out.md    # write to another file
  python format_law.py draft.md --diff       # show a unified diff only
  python format_law.py draft.md --check      # exit 1 if anything would change

Options
  --no-refs         do not rewrite cross references
  --no-paragraphs   do not renumber <sup>n</sup> paragraph markers
"""
import argparse
import difflib
import re
import sys

RANKS = {"part": 1, "title": 2, "chapter": 3, "section": 4}
ALIASES = {"tile": "title", "titel": "title", "chaper": "chapter", "secton": "section"}

HEADING = re.compile(r"^(?P<hashes>#{1,6})(?P<sp>\s+)(?P<text>.*?)\s*$")
ARTICLE = re.compile(r"^Art\.\s*(?P<num>[^\s\[]+)(?P<fn>(?:\[\^[^\]]+\])*)(?P<rest>.*)$")
STRUCT = re.compile(
    r"^(?P<kind>[A-Za-z]+)\s+(?P<num>\d+[A-Za-z]?|X{2,})(?P<rest>(?:\s.*|[:.\-].*)?)$"
)
PARA = re.compile(r"^<sup>\d+</sup>")
FOOTNOTE_DEF = re.compile(r"^\[\^[^\]]+\]:")
FENCE = re.compile(r"^\s*(```|~~~)")
REF = re.compile(
    r"\b(?P<lead>Arts?\.|Articles?)\s+"
    r"(?P<nums>\d+[a-z]?(?:\s*(?:,|and|or|to|-|\u2013)\s*\d+[a-z]?)*)"
    r"(?P<tail>(?:,?\s*paragraphs?\s+\d+)?\s+of\s+(?!this\b)[^.;,\n]*)?"
)


def split_frontmatter(lines):
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                return lines[: i + 1], lines[i + 1 :]
    return [], lines


def classify(line):
    """Return (kind, match) for a heading line: 'article', 'struct' or None."""
    h = HEADING.match(line)
    if not h:
        return None, None
    text = h.group("text")
    a = ARTICLE.match(text)
    if a:
        return "article", (h, a)
    s = STRUCT.match(text)
    if s:
        kind = s.group("kind").lower()
        kind = ALIASES.get(kind, kind)
        if kind in RANKS:
            return "struct", (h, s, kind)
    return None, None


def format_law(text, do_refs=True, do_paras=True):
    lines = text.split("\n")
    front, body = split_frontmatter(lines)
    log, warnings = [], []

    # ---------- pass 1: headings ----------
    out = []
    counters = [0] * 5  # index 1..4
    art_n = 0
    old_to_new = {}  # old article number -> [new numbers]
    in_fence = False
    offset = len(front)

    for idx, line in enumerate(body):
        lineno = idx + 1 + offset
        if FENCE.match(line):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence:
            out.append(line)
            continue

        kind, m = classify(line)
        if kind == "article":
            h, a = m
            art_n += 1
            old = a.group("num")
            old_to_new.setdefault(old.lower(), []).append(art_n)
            new_text = f"Art. {art_n}{a.group('fn')}{a.group('rest')}"
            new_line = f"{h.group('hashes')}{h.group('sp')}{new_text}"
            if old != str(art_n):
                log.append(f"line {lineno}: Art. {old} -> Art. {art_n}")
            out.append(new_line)
        elif kind == "struct":
            h, s, k = m
            rank = RANKS[k]
            counters[rank] += 1
            for r in range(rank + 1, 5):
                counters[r] = 0
            old = s.group("num")
            label = k.capitalize()
            new_text = f"{label} {counters[rank]}{s.group('rest')}"
            new_line = f"{h.group('hashes')}{h.group('sp')}{new_text}"
            if f"{s.group('kind')} {old}" != f"{label} {counters[rank]}":
                log.append(f"line {lineno}: {s.group('kind')} {old} -> {label} {counters[rank]}")
            out.append(new_line)
        else:
            out.append(line)

    for old, news in old_to_new.items():
        if len(news) > 1:
            warnings.append(
                f"old Art. {old} appears {len(news)} times (now {', '.join(map(str, news))}); "
                "references to it are left untouched"
            )

    # ---------- pass 2: paragraphs and cross references ----------
    final = []
    in_fence = False
    para_n = 0
    for idx, line in enumerate(out):
        lineno = idx + 1 + offset
        if FENCE.match(line):
            in_fence = not in_fence
            final.append(line)
            continue
        if in_fence:
            final.append(line)
            continue

        kind, _ = classify(line)
        if kind in ("article", "struct"):
            para_n = 0
            final.append(line)
            continue
        if HEADING.match(line) or FOOTNOTE_DEF.match(line):
            final.append(line)
            continue

        if do_paras and PARA.match(line):
            para_n += 1
            line = PARA.sub(f"<sup>{para_n}</sup>", line, count=1)

        if do_refs:
            def fix_nums(m):
                if m.group("tail"):  # points to another document
                    return m.group(0)

                def one(n):
                    news = old_to_new.get(n.group(0).lower())
                    if not news:
                        warnings.append(f"line {lineno}: reference to Art. {n.group(0)} (not found)")
                        return n.group(0)
                    if len(news) > 1:
                        warnings.append(f"line {lineno}: reference to Art. {n.group(0)} is ambiguous")
                        return n.group(0)
                    return str(news[0])

                nums = re.sub(r"\d+[a-z]?", one, m.group("nums"))
                if nums != m.group("nums"):
                    log.append(f"line {lineno}: ref {m.group('lead')} {m.group('nums')} -> {nums}")
                return f"{m.group('lead')} {nums}"

            line = REF.sub(fix_nums, line)
        final.append(line)

    return "\n".join(front + final), log, warnings


def main():
    ap = argparse.ArgumentParser(description="Renumber a Markdown statute.")
    ap.add_argument("file")
    ap.add_argument("-i", "--in-place", action="store_true")
    ap.add_argument("-o", "--output")
    ap.add_argument("--diff", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--no-refs", action="store_true")
    ap.add_argument("--no-paragraphs", action="store_true")
    args = ap.parse_args()

    with open(args.file, encoding="utf-8") as f:
        original = f.read()

    result, log, warnings = format_law(
        original, do_refs=not args.no_refs, do_paras=not args.no_paragraphs
    )
    changed = result != original

    for entry in log:
        print(entry, file=sys.stderr)
    for w in warnings:
        print(f"WARNING: {w}", file=sys.stderr)

    if args.check:
        print("changes needed" if changed else "ok", file=sys.stderr)
        sys.exit(1 if changed else 0)
    if args.diff:
        sys.stdout.writelines(
            difflib.unified_diff(
                original.splitlines(True), result.splitlines(True), "before", "after"
            )
        )
    elif args.in_place:
        with open(args.file, "w", encoding="utf-8") as f:
            f.write(result)
    elif args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
    else:
        sys.stdout.write(result)


if __name__ == "__main__":
    main()