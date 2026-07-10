#!/usr/bin/env python3
"""
scan_secrets.py — read-only scan for likely hardcoded credentials.

Usage:
    python3 scan_secrets.py <path-to-scan>

This script only reads files under the given path. It never modifies,
deletes, or transmits anything. It prints findings to stdout so they can
be included in an audit report.

It is a heuristic pattern scan, not a guarantee — always sanity-check a
hit before reporting it as a real finding, and don't assume a clean run
means there are no secrets (e.g. secrets pulled from a vault at runtime
won't show up here, which is the point).
"""
import os
import re
import sys

# (label, compiled regex) — kept broad but readable; false positives are
# expected and should be filtered by a human before going in a report.
PATTERNS = [
    ("AWS Access Key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("Generic API key assignment", re.compile(
        r"(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]"
    )),
    ("Private key block", re.compile(r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("Firebase service account JSON", re.compile(r'"type"\s*:\s*"service_account"')),
    ("Slack token", re.compile(r"xox[baprs]-[0-9A-Za-z-]{10,}")),
    ("Generic bearer/JWT-looking token", re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("Hardcoded password assignment", re.compile(
        r"(?i)password\s*[:=]\s*['\"][^'\"]{6,}['\"]"
    )),
]

# Directories that are noisy or never relevant to scan.
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", ".venv", "__pycache__"}

# Extensions worth reading as text.
TEXT_EXT = {
    ".js", ".jsx", ".ts", ".tsx", ".json", ".env", ".yml", ".yaml",
    ".py", ".md", ".txt", ".rules", ".config", ".toml",
}


def should_scan(filename: str) -> bool:
    if filename.startswith(".env"):
        return True
    _, ext = os.path.splitext(filename)
    return ext in TEXT_EXT


def scan_file(path: str):
    findings = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for lineno, line in enumerate(f, start=1):
                for label, pattern in PATTERNS:
                    if pattern.search(line):
                        findings.append((label, lineno, line.strip()[:120]))
    except (OSError, UnicodeDecodeError):
        pass
    return findings


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 scan_secrets.py <path-to-scan>")
        sys.exit(1)

    root = sys.argv[1]
    if not os.path.isdir(root):
        print(f"Not a directory: {root}")
        sys.exit(1)

    total_findings = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            if not should_scan(filename):
                continue
            full_path = os.path.join(dirpath, filename)
            for label, lineno, snippet in scan_file(full_path):
                total_findings += 1
                print(f"[{label}] {full_path}:{lineno}  {snippet}")

    if total_findings == 0:
        print("No obvious hardcoded secrets found (heuristic scan — not a guarantee).")
    else:
        print(f"\n{total_findings} potential finding(s). Review each before reporting as confirmed.")


if __name__ == "__main__":
    main()
