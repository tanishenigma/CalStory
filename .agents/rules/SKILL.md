---
name: security-skill-catalog
description: Reference taxonomy and workflow for security-related work. Use this skill whenever the user is (1) organizing, finding, or adding a cybersecurity skill to a README or skill marketplace and needs to know which category it belongs in — Penetration Testing, Code Auditing, or Threat Hunting — and where that maps to in a README's sections, or (2) asking for a general security review of their own codebase, e.g. "audit my app for security issues," "check my Firebase rules," "is my Next.js app secure," "give this a baseline security pass," even if they don't name a specific vulnerability class. This skill is defensive and organizational only — it never performs exploitation, scanning of third-party systems, or attacks. Trigger even on casual phrasing like "where should this pentesting skill go in the readme" or "can you sanity check my app's security before I ship it."
---

# Security Skill Catalog

This skill has two jobs that share one taxonomy:

1. **Cataloging** — classify a security-related skill (someone else's, or one being written) into the right category, and say where it belongs in a README or skill marketplace.
2. **Baseline audit** — use that same taxonomy as a checklist to run a general "cover everything" security pass over the user's own code, then propose (and optionally apply) fixes.

Read the "Scope and safety" section below first — it applies to both jobs.

## Scope and safety

This skill only ever looks at code and configuration the user already has in front of them (uploaded, in their repo, in the current workspace). It never:

- Scans, probes, or sends traffic to any system that isn't explicitly the user's own and locally present
- Writes or explains exploit code, payloads, or attack automation — the taxonomy below names *categories* of tools (e.g. "Burp Suite," "Kerberoasting") so skills can be classified and understood, not so they can be operated
- Runs destructive operations. Every check here is read-only by default. Fixes are proposed as diffs/explanations first; only apply them if the user confirms.

If a request drifts from "review my own app" toward "help me get into/attack someone else's system," that's outside this skill — decline and explain why, the same as you would without this skill loaded.

---

## Job 1: Cataloging a security skill

When the user wants to classify a skill, add one to a README, or asks "what category is X," walk through:

### The taxonomy

| Category | Subcategory | Typical tools / techniques |
|---|---|---|
| **Penetration Testing** | Web Application | Burp Suite, FFUF fuzzing, SQL injection testing, XSS testing |
| | Network | Nmap, Wireshark, SMTP/SSH testing |
| | Cloud | AWS/Azure/GCP penetration testing |
| | Active Directory | Kerberoasting, DCSync, pass-the-hash |
| **Code Auditing** | Static Analysis | CodeQL, Semgrep, Slither |
| | Smart Contracts | Solidity security, Move auditing |
| | Variant Analysis | Finding similar vulnerabilities across a codebase |
| **Threat Hunting** | Detection Rules | Sigma rules, YARA |
| | Forensics | File metadata, memory analysis |
| | Incident Response | Triage, investigation |

A skill can span more than one row — say so rather than forcing a single bucket (e.g. a Solidity fuzzer is both Code Auditing/Smart Contracts and, loosely, Penetration Testing).

### Where to place it in a README

- Penetration testing tools → **"Cybersecurity & Penetration Testing"**
- Code analysis tools → **"Security & Systems"**, or **"Development & Code Tools"** if it's framed for developers rather than auditors
- Threat hunting → **"Security & Systems"**
- Smart contract security → **"Development & Code Tools"** if dev-focused, otherwise Code Auditing's normal home

If the README doesn't have these sections yet, propose adding them rather than burying a security skill under an unrelated header — security tooling gets lost if it's not grouped.

### Known catalogs worth pointing to

When the user is looking for existing skills rather than classifying their own, mention (don't fabricate URLs beyond these, and note repos can move — verify with a quick search if it matters):

- **trailofbits/skills** — static analysis, code auditing, smart contracts
- **sickn33/antigravity-awesome-skills** — broad collection (50+) of cybersecurity skills
- **mhattingpete/claude-skills-marketplace** — computer forensics skills

### Best practices to check for (when reviewing someone's draft security skill)

1. **Clear scope** — does it state what it does and doesn't do?
2. **Legal/responsible-use language** — a line noting the skill is for authorized testing of systems the user owns or has permission to test
3. **Tool requirements listed** — what has to be installed/available for the skill to work
4. **Safe defaults** — non-destructive, read-only operations unless the user explicitly asks for more
5. **Logging / audit trail** — actions taken should be traceable after the fact

Flag a draft skill that's missing #2 or #4 — those are the two most common gaps and the ones most likely to cause real problems.

### Example skill layout (for reference when reviewing structure)

```
threat-hunting/
├── SKILL.md           # Main instructions
├── scripts/
│   ├── sigma-search.py
│   └── log-parser.sh
├── references/
│   └── sigma-rules.md
└── templates/
    └── report.md
```

---

## Job 2: Baseline security audit of the user's own app

Use this when asked for a general security pass rather than a classification task. The taxonomy above becomes a coverage checklist: for a typical full-stack web app (this shows up a lot for Next.js + Firebase/Firestore stacks, but the same shape applies to any framework), the relevant rows are usually **Web Application** and **Cloud** from Pentesting, and **Static Analysis** from Code Auditing. Network and Active Directory categories rarely apply to an app codebase — say so explicitly rather than silently skipping them, so the user knows the audit's boundaries.

### Workflow

1. **Scope it.** Confirm (or infer from what's open/uploaded) what stack you're looking at and where the code lives. Don't ask more than one clarifying question if you can reasonably infer the stack from context.
2. **Read `references/webapp-firebase-checklist.md`** for the detailed, category-by-category checklist. It's the level of detail that would bloat this file, so it lives separately.
3. **Run the non-destructive helper scripts** where they apply:
   - `scripts/scan_secrets.py <path>` — greps for hardcoded credentials, API keys, and private key material committed to the repo. Read-only.
   - `scripts/check_firebase_rules.py <path-to-rules-file>` — flags overly permissive Firestore/Storage security rules (e.g. `allow read, write: if true;`, missing auth checks). Read-only.
   Both scripts only read files; they never modify anything or contact a network.
4. **Write the findings up using `templates/audit-report.md`** — group by severity, cite the specific file/line, and explain *why* it's a problem in plain terms (not just "insecure").
5. **Propose fixes as a diff or code block per finding**, ordered highest severity first. Wait for the user before applying changes to their files — audit and fix are two separate steps even when done back-to-back, since the user should see what's wrong before code gets changed under them.
6. **Note what you didn't check.** A baseline pass is not a full pentest — say plainly which categories from the taxonomy you covered and which you didn't (e.g. "I didn't do dependency-vulnerability scanning against a live CVE database — want me to run `npm audit` too?").

### Calibrating severity

- **Critical** — auth bypass, publicly writable/readable data that shouldn't be, secrets committed to source control
- **High** — missing input validation on a path that reaches a database or shell, XSS in a context that isn't sanitized
- **Medium** — verbose error messages leaking stack traces, missing rate limiting on sensitive endpoints
- **Low** — outdated but non-exploitable dependencies, missing security headers

Don't inflate severity to make the report look more thorough — an accurate "this is fine" is more useful than manufactured findings.
