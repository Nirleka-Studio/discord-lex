#!/usr/bin/env python3
"""
sync_amended_dates.py

Walks all SR law files in sr/, inspects each file's git commit history,
and updates the `last_amended` YAML frontmatter field to match the most
recent commit whose message uses an amend/repeal/insert prefix, per the
Commit Standards. `fix` and `feat` commits are intentionally ignored:
- `fix`  = typo/formatting only, never counts as an amendment.
- `feat` = sets enacted_date at creation, not an amendment to existing law.

Infos:
In accordance to the commit standard found in manuals/markdown/commit-standard.md

This should be run BEFORE committing changes.

Usage:
    python sync_amended_dates.py            # apply changes
    python sync_amended_dates.py --dry-run  # preview only, no writes

No third-party dependencies, frontmatter is edited via a targeted regex
substitution rather than a full YAML parse/re-dump (see update_frontmatter
for why that distinction matters here).
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

SR_DIR = Path("sr")
AMENDING_PREFIXES = {"amend", "repeal", "insert"}
COMMIT_MSG_RE = re.compile(r"^(feat|amend|repeal|insert|fix)\(([^)]*)\):")
# Matches a `last_amended:` line inside the frontmatter, capturing whatever
# quote style (", ', or none) is already in use so we can preserve it.
LAST_AMENDED_RE = re.compile(
    r'^(last_amended:\s*)(["\']?)([\d-]+)\2\s*$', re.MULTILINE
)


def get_file_commits(filepath: Path):
    """Return (date, subject) for every commit touching filepath, newest first.
    --follow keeps history intact across file renames (e.g. slug changes)."""
    result = subprocess.run(
        [
            "git", "log", "--follow",
            "--date=short",
            "--pretty=format:%ad|||%s",
            "--", str(filepath),
        ],
        capture_output=True, text=True, check=True,
    )
    commits = []
    for line in result.stdout.splitlines():
        if "|||" not in line:
            continue
        date, subject = line.split("|||", 1)
        commits.append((date, subject.strip()))
    return commits


def latest_amending_date(filepath: Path):
    """Most recent commit date where the conventional-commit prefix is
    amend/repeal/insert. Commits come back newest-first, so the first
    match is the one we want."""
    for date, subject in get_file_commits(filepath):
        match = COMMIT_MSG_RE.match(subject)
        if not match:
            continue  # commit didn't follow the convention — skip rather than guess
        if match.group(1) in AMENDING_PREFIXES:
            return date
    return None


def update_frontmatter(filepath: Path, new_date: str, dry_run: bool) -> bool:
    """Update only the `last_amended:` line in a file's frontmatter, via a
    targeted regex substitution rather than a full YAML parse/re-dump.

    A parse-and-redump round trip (yaml.safe_load then yaml.dump) is tempting
    but wrong here: PyYAML doesn't preserve the original quote style or key
    order, so it silently rewrites every line in the frontmatter (dropping
    quotes it decides are "unnecessary", switching " to ', etc.) even though
    only one field's value actually changed. That defeats the Style Guide's
    "clean Git line-diffs" goal and makes real amendments hard to spot in
    review. Touching only the matched line keeps every other byte identical.

    Returns True if the file changed (or would change, in dry-run mode).
    """
    text = filepath.read_text(encoding="utf-8")
    if not text.startswith("---"):
        print(f"  ! no frontmatter found in {filepath}, skipping")
        return False

    frontmatter_end = text.find("\n---", 3)
    if frontmatter_end == -1:
        print(f"  ! malformed frontmatter in {filepath}, skipping")
        return False

    frontmatter = text[:frontmatter_end]
    match = LAST_AMENDED_RE.search(frontmatter)
    if not match:
        print(f"  ! no last_amended field found in {filepath}, skipping")
        return False

    old_date = match.group(3)
    if old_date == new_date:
        return False  # already correct, nothing to do

    print(f"  {'would update' if dry_run else '✓ updated'} {filepath.name}: {old_date} -> {new_date}")
    if dry_run:
        return True

    prefix, quote = match.group(1), match.group(2)
    replacement = f"{prefix}{quote}{new_date}{quote}"
    new_frontmatter = LAST_AMENDED_RE.sub(replacement, frontmatter, count=1)
    filepath.write_text(new_frontmatter + text[frontmatter_end:], encoding="utf-8")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="preview changes without writing files")
    args = parser.parse_args()

    if not SR_DIR.exists():
        sys.exit(f"error: {SR_DIR}/ not found — run this from the repo root")

    md_files = sorted(SR_DIR.rglob("*.md"))
    changed = 0

    for filepath in md_files:
        latest = latest_amending_date(filepath)
        if latest is None:
            continue  # file has no amend/repeal/insert commits yet (e.g. brand new law)
        if update_frontmatter(filepath, latest, args.dry_run):
            changed += 1

    verb = "would be" if args.dry_run else "were"
    print(f"\nDone. {changed} file(s) {verb} updated.")


if __name__ == "__main__":
    main()