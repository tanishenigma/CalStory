#!/usr/bin/env python3
"""
check_firebase_rules.py — read-only linter for Firestore/Storage security rules.

Usage:
    python3 check_firebase_rules.py <path-to-firestore.rules-or-storage.rules>

Only reads the given file. Flags common overly-permissive patterns so a
human can decide whether each one is actually a problem in context.
"""
import re
import sys


CHECKS = [
    (
        "Wide-open rule (allow ... if true)",
        re.compile(r"allow\s+[\w,\s]+:\s*if\s+true\s*;"),
        "This grants access unconditionally. Confirm this isn't meant to be scoped to authenticated/owning users.",
    ),
    (
        "Match-all path with broad allow",
        re.compile(r"match\s+/\{document=\*\*\}"),
        "A catch-all match can accidentally widen rules for collections added later. Make sure nothing below it overrides too permissively.",
    ),
    (
        "Allow without any auth check nearby",
        re.compile(r"allow\s+(read|write|read,\s*write)\s*:\s*if\s+(?!.*request\.auth)"),
        "This allow clause doesn't reference request.auth at all — double check it's intentionally public.",
    ),
]


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 check_firebase_rules.py <path-to-rules-file>")
        sys.exit(1)

    path = sys.argv[1]
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except OSError as e:
        print(f"Could not read {path}: {e}")
        sys.exit(1)

    lines = content.splitlines()
    total = 0
    for label, pattern, note in CHECKS:
        for lineno, line in enumerate(lines, start=1):
            if pattern.search(line):
                total += 1
                print(f"[{label}] line {lineno}: {line.strip()}")
                print(f"    -> {note}")

    if total == 0:
        print("No obviously permissive patterns found (heuristic check — read the full rules file yourself too).")
    else:
        print(f"\n{total} pattern(s) flagged for review.")


if __name__ == "__main__":
    main()
