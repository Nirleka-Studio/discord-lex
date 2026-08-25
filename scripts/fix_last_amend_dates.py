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
    pip install pyyaml
    python sync_amended_dates.py            # apply changes
    python sync_amended_dates.py --dry-run  # preview only, no writes
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

import yaml  # pip install pyyaml

SR_DIR = Path("sr")
AMENDING_PREFIXES = {"amend", "repeal", "insert"}
COMMIT_MSG_RE = re.compile(r"^(feat|amend|repeal|insert|fix)\(([^)]*)\):")


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
    """Rewrite last_amended in a file's YAML frontmatter. Returns True if it changed
    (or would change, in dry-run mode)."""
    text = filepath.read_text(encoding="utf-8")
    if not text.startswith("---"):
        print(f"  ! no frontmatter found in {filepath}, skipping")
        return False

    end = text.find("\n---", 3)
    if end == -1:
        print(f"  ! malformed frontmatter in {filepath}, skipping")
        return False

    frontmatter_raw = text[3:end]
    body = text[end:]

    data = yaml.safe_load(frontmatter_raw)
    old_date = data.get("last_amended")
    if old_date == new_date:
        return False  # already correct, nothing to do

    print(f"  {'would update' if dry_run else '✓ updated'} {filepath.name}: {old_date} -> {new_date}")

    if dry_run:
        return True

    data["last_amended"] = new_date
    new_frontmatter = yaml.dump(data, sort_keys=False, allow_unicode=True).strip()
    filepath.write_text(f"---\n{new_frontmatter}\n{body.lstrip(chr(10))}", encoding="utf-8")
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